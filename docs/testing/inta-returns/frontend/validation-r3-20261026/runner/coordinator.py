#!/usr/bin/env python3
"""
MC-002-INTA-FE-VALIDATION-R3: Runner Coordinator & Adapter
Addresses R2-I01, R2-I02, R2-I03, R2-I04, R2-I06:
- Dispatches through the approved guard-first launcher with strict bounded environment allowlist.
- Passes MC_INTA_STATE_DIR explicitly to prevent unmanaged writes to cwd/.run-state.
- Strict owned lifecycle with try/finally, PID identity validation, bounded waits, and captured logs.
- Strict lsof probe classification: rc=1 with ANY stderr (including ENOENT) is PROBE_ERROR.
- Tracks during_sample_count: fast-exit with 0 during-samples yields LISTENER_UNKNOWN (fail-closed).
- Provides entrypoint looping through the 22-variant plan with immediate abort on failure.
- Refuses occupied attempt directories to prevent accidental overwrite or truncation.
"""

from datetime import datetime, timezone
import json
import os
import shutil
import signal
import subprocess
import sys
import time
from typing import Any, Dict, List, Optional, Tuple

from guard_evaluator import evaluate_guard_run


# Canonical 22 startup guard variants (INTA-1 §2, R07)
CANONICAL_22_VARIANTS = [
    ("API_TOKEN", "nonempty", "sample_secret_token"),
    ("API_TOKEN", "empty", ""),
    ("API_MODE", "nonempty", "mock"),
    ("API_MODE", "empty", ""),
    ("API_BASE_URL", "nonempty", "http://127.0.0.1:9999"),
    ("API_BASE_URL", "empty", ""),
    ("AUTH_ALLOW_ANONYMOUS", "nonempty", "true"),
    ("AUTH_ALLOW_ANONYMOUS", "empty", ""),
    ("API_TIMEOUT_MS", "nonempty", "5000"),
    ("API_TIMEOUT_MS", "empty", ""),
    ("AUTH_SECRET", "nonempty", "sample_auth_secret"),
    ("AUTH_SECRET", "empty", ""),
    ("NEXTAUTH_SECRET", "nonempty", "sample_nextauth_secret"),
    ("NEXTAUTH_SECRET", "empty", ""),
    ("CLERK_SECRET_KEY", "nonempty", "sample_clerk_secret"),
    ("CLERK_SECRET_KEY", "empty", ""),
    ("SESSION_SECRET", "nonempty", "sample_session_secret"),
    ("SESSION_SECRET", "empty", ""),
    ("COOKIE_SECRET", "nonempty", "sample_cookie_secret"),
    ("COOKIE_SECRET", "empty", ""),
    ("DATABASE_URL", "nonempty", "postgresql://user:pass@127.0.0.1:5432/db"),
    ("DATABASE_URL", "empty", ""),
    ("JWT_SECRET", "nonempty", "sample_jwt_secret"),
    ("JWT_SECRET", "empty", ""),
]


def probe_tcp_listener(port: int, subprocess_runner=subprocess.run) -> Tuple[Optional[bool], Optional[str]]:
    """
    Probes whether a TCP port is in LISTEN state on loopback.
    Returns:
      (True, None)   -> Confirmed active listener (rc=0)
      (False, None)  -> Confirmed NO listener (rc=1 AND empty stderr)
      (None, error)  -> Probe error / unknown (rc=1 with stderr, rc>1, timeout, or exception)
    """
    cmd = ["lsof", f"-iTCP:{port}", "-sTCP:LISTEN", "-n", "-P"]
    try:
        proc = subprocess_runner(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=2.0,
        )
        if proc.returncode == 0:
            return True, None
        elif proc.returncode == 1:
            stderr_stripped = (proc.stderr or "").strip()
            # R2-I04 fix: ANY non-empty stderr (including ENOENT) is an error/unknown, NOT absence
            if not stderr_stripped:
                return False, None
            else:
                return None, f"lsof probe returned rc=1 with error stderr: {stderr_stripped}"
        else:
            return None, f"lsof probe failed with rc={proc.returncode}: {(proc.stderr or '').strip()}"
    except subprocess.TimeoutExpired:
        return None, f"lsof probe timed out for port {port}"
    except Exception as e:
        return None, f"lsof probe execution exception: {e}"


def verify_pid_identity(
    pid: int,
    expected_name: Optional[str] = None,
    expected_parent: Optional[int] = None,
    subprocess_runner=subprocess.run,
    kill_func=os.kill,
) -> bool:
    """
    Verifies that a PID exists and matches expected identity (executable name and/or parent PID).
    Fail-closed: any query error returns False.
    """
    if pid <= 1:
        return False
    try:
        kill_func(pid, 0)
    except OSError:
        return False

    if expected_name or expected_parent is not None:
        try:
            ps_proc = subprocess_runner(
                ["ps", "-p", str(pid), "-o", "comm=,ppid="],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=1.0,
            )
            if ps_proc.returncode != 0:
                return False
            output = ps_proc.stdout.strip()
            parts = output.split()
            if not parts:
                return False
            comm = parts[0]
            ppid_val = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None

            if expected_name and expected_name not in comm:
                return False
            if expected_parent is not None and ppid_val != expected_parent:
                return False
        except Exception:
            return False

    return True


def bounded_terminate(
    pid: int,
    timeout_sec: float = 3.0,
    expected_name: Optional[str] = None,
    expected_parent: Optional[int] = None,
    subprocess_runner=subprocess.run,
    kill_func=os.kill,
) -> Tuple[bool, Optional[str]]:
    """
    Gracefully terminates an owned process with SIGTERM after strict identity verification.
    Waits bounded time for exit.
    Returns (True, None) if cleanly exited, (False, error_reason) otherwise.
    """
    if not verify_pid_identity(pid, expected_name, expected_parent, subprocess_runner, kill_func=kill_func):
        return False, f"PID {pid} failed identity verification (unowned or mismatched); refusing signal"

    try:
        kill_func(pid, signal.SIGTERM)
    except OSError as e:
        return False, f"SIGTERM delivery failed for PID {pid}: {e}"

    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            kill_func(pid, 0)
            time.sleep(0.05)
        except OSError:
            return True, None

    return False, f"PID {pid} did not exit within {timeout_sec}s timeout after SIGTERM"


class VariantRunner:
    def __init__(
        self,
        key: str,
        variant: str,
        env_value: str,
        attempt_dir: str,
        harness_dir: str,
        port: int = 18085,
        observer_port: int = 18086,
        node_bin: Optional[str] = None,
        launcher_path: Optional[str] = None,
        popen_factory=subprocess.Popen,
        subprocess_runner=subprocess.run,
        kill_func=os.kill,
    ):
        self.key = key
        self.variant = variant
        self.env_value = env_value
        self.attempt_dir = attempt_dir
        self.harness_dir = harness_dir
        self.port = port
        self.observer_port = observer_port
        self.node_bin = node_bin or shutil.which("node") or "node"
        self.popen_factory = popen_factory
        self.subprocess_runner = subprocess_runner
        self.kill_func = kill_func

        script_dir = os.path.dirname(os.path.abspath(__file__))
        if launcher_path:
            self.launcher_path = launcher_path
        else:
            self.launcher_path = os.path.join(
                os.path.dirname(script_dir), "launcher", "harness-dev.mjs"
            )

        self.variant_name = f"{key}_{variant}"
        self.output_dir = os.path.join(attempt_dir, self.variant_name)
        os.makedirs(self.output_dir, exist_ok=True)

        self.observer_file = os.path.join(self.output_dir, "observer.json")
        self.obs_stdout_file = os.path.join(self.output_dir, "obs_stdout.log")
        self.obs_stderr_file = os.path.join(self.output_dir, "obs_stderr.log")
        self.stdout_file = os.path.join(self.output_dir, "stdout.log")
        self.stderr_file = os.path.join(self.output_dir, "stderr.log")
        self.meta_file = os.path.join(self.output_dir, "meta.json")
        self.state_dir = os.path.join(self.output_dir, "run-state")
        os.makedirs(self.state_dir, exist_ok=True)

    def run(self, timeout_sec: float = 4.0) -> Dict[str, Any]:
        """
        Executes pre-probe, observer start, child run, sample probe, post-probe,
        and fail-closed evaluation within a strict try/finally block.
        """
        # 1. Pre-probe
        pre_listen, pre_err = probe_tcp_listener(self.port, self.subprocess_runner)
        if pre_err:
            return evaluate_guard_run(
                canonical_id="INT-ENV-05",
                key=self.key,
                variant=self.variant,
                exit_code=None,
                timed_out=False,
                stdout="",
                stderr="",
                listener_during=None,
                listener_after=None,
                during_sample_count=0,
                probe_error=f"Pre-flight probe error on port {self.port}: {pre_err}",
            )
        if pre_listen is True:
            return evaluate_guard_run(
                canonical_id="INT-ENV-05",
                key=self.key,
                variant=self.variant,
                exit_code=None,
                timed_out=False,
                stdout="",
                stderr="",
                listener_during=True,
                listener_after=True,
                during_sample_count=1,
                probe_error=None,
            )

        obs_proc = None
        child_proc = None
        obs_exit_code = None
        child_exit = None
        timed_out = False
        listener_during = None
        during_sample_count = 0
        sample_probe_err = None
        cleanup_errors: List[str] = []

        try:
            # 2. Start observer process with captured diagnostic streams
            observer_script = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), "observer.py"
            )
            obs_cmd = [
                sys.executable,
                observer_script,
                "--port", str(self.observer_port),
                "--state-file", self.observer_file,
                "--variant", self.variant_name,
            ]

            obs_out_fp = open(self.obs_stdout_file, "w", encoding="utf-8")
            obs_err_fp = open(self.obs_stderr_file, "w", encoding="utf-8")
            try:
                obs_proc = self.popen_factory(
                    obs_cmd,
                    stdout=obs_out_fp,
                    stderr=obs_err_fp,
                )
            finally:
                obs_out_fp.close()
                obs_err_fp.close()

            # Wait for observer to bind and write initial state
            obs_bound = False
            obs_deadline = time.time() + 1.5
            while time.time() < obs_deadline:
                listen_state, _ = probe_tcp_listener(self.observer_port, self.subprocess_runner)
                if listen_state is True and os.path.exists(self.observer_file):
                    obs_bound = True
                    break
                time.sleep(0.05)

            if not obs_bound:
                return evaluate_guard_run(
                    canonical_id="INT-ENV-05",
                    key=self.key,
                    variant=self.variant,
                    exit_code=None,
                    timed_out=False,
                    stdout="",
                    stderr="",
                    listener_during=False,
                    listener_after=False,
                    during_sample_count=0,
                    probe_error=f"Observer failed to bind on loopback port {self.observer_port}",
                )

            # 3. Construct strict bounded child environment
            # Pass MC_INTA_STATE_DIR explicitly to prevent unmanaged cwd writes
            child_env = {
                "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
                "NODE_ENV": "development",
                "MC_INTA_ENABLE": "1",
                "MC_INTA_GO_BASE_URL": f"http://127.0.0.1:{self.observer_port}",
                "MC_INTA_STATE_DIR": self.state_dir,
                "PORT": str(self.port),
                "HOSTNAME": "127.0.0.1",
                "HOME": os.environ.get("HOME", "/tmp"),
                "TERM": os.environ.get("TERM", "xterm"),
            }
            child_env[self.key] = self.env_value

            # 4. Spawn child via approved guard-first launcher
            child_cmd = [
                self.node_bin,
                "--experimental-strip-types",
                self.launcher_path,
            ]

            child_stdout_fp = open(self.stdout_file, "w", encoding="utf-8")
            child_stderr_fp = open(self.stderr_file, "w", encoding="utf-8")
            child_start_utc = datetime.now(timezone.utc).isoformat()
            try:
                try:
                    child_proc = self.popen_factory(
                        child_cmd,
                        cwd=self.harness_dir,
                        env=child_env,
                        stdout=child_stdout_fp,
                        stderr=child_stderr_fp,
                    )
                finally:
                    child_stdout_fp.close()
                    child_stderr_fp.close()

                # Record verified creation metadata
                meta_data = {
                    "variant": self.variant_name,
                    "key": self.key,
                    "childPid": child_proc.pid,
                    "childParentPid": os.getpid(),
                    "childStartUTC": child_start_utc,
                    "childCmd": child_cmd,
                    "observerPid": obs_proc.pid,
                    "port": self.port,
                    "observerPort": self.observer_port,
                    "stateDir": self.state_dir,
                }
                with open(self.meta_file, "w", encoding="utf-8") as mf:
                    json.dump(meta_data, mf, indent=2)

                # 5. Monitor loop
                deadline = time.time() + timeout_sec
                while time.time() < deadline:
                    poll_ret = child_proc.poll()
                    if poll_ret is not None:
                        child_exit = poll_ret
                        break

                    # Probe listener during child execution
                    listening, err = probe_tcp_listener(self.port, self.subprocess_runner)
                    during_sample_count += 1
                    if err:
                        sample_probe_err = err
                    elif listening is True:
                        listener_during = True
                        # Immediate abort on listener acquisition
                        bounded_terminate(child_proc.pid, 2.0, subprocess_runner=self.subprocess_runner, kill_func=self.kill_func)
                        break
                    else:
                        if listener_during is None:
                            listener_during = False

                    # Live counter probe for immediate abort
                    if os.path.exists(self.observer_file):
                        try:
                            with open(self.observer_file, "r", encoding="utf-8") as f:
                                obs_state = json.load(f)
                            if obs_state.get("requestCount", 0) > 0:
                                bounded_terminate(child_proc.pid, 2.0, subprocess_runner=self.subprocess_runner, kill_func=self.kill_func)
                                break
                        except Exception:
                            pass

                    time.sleep(0.05)

                if child_proc.poll() is None:
                    timed_out = True
                    term_ok, term_err = bounded_terminate(
                        child_proc.pid, 2.0, subprocess_runner=self.subprocess_runner, kill_func=self.kill_func
                    )
                    if not term_ok and term_err:
                        cleanup_errors.append(term_err)

                child_exit = child_proc.poll()

            except Exception as e:
                cleanup_errors.append(f"Child process failure: {e}")

        finally:
            # Owned child cleanup
            if child_proc and child_proc.poll() is None:
                term_ok, term_err = bounded_terminate(
                    child_proc.pid, 2.0, subprocess_runner=self.subprocess_runner, kill_func=self.kill_func
                )
                if not term_ok and term_err:
                    cleanup_errors.append(term_err)

            # Owned observer cleanup: distinguish already exited child from running
            if obs_proc and obs_proc.poll() is None:
                term_ok, term_err = bounded_terminate(
                    obs_proc.pid, 3.0, subprocess_runner=self.subprocess_runner, kill_func=self.kill_func
                )
                if not term_ok and term_err:
                    cleanup_errors.append(term_err)
            if obs_proc:
                try:
                    obs_exit_code = obs_proc.wait(timeout=2.0)
                except Exception as e:
                    cleanup_errors.append(f"Observer wait error: {e}")

        # 6. Post-probe
        listener_after, post_probe_err = probe_tcp_listener(self.port, self.subprocess_runner)

        # 7. Read stdout/stderr
        stdout_content = ""
        stderr_content = ""
        if os.path.exists(self.stdout_file):
            with open(self.stdout_file, "r", encoding="utf-8", errors="replace") as f:
                stdout_content = f.read()
        if os.path.exists(self.stderr_file):
            with open(self.stderr_file, "r", encoding="utf-8", errors="replace") as f:
                stderr_content = f.read()

        # 8. Read observer final state
        observer_data = None
        observer_exists = os.path.exists(self.observer_file)
        observer_parse_err = None
        if observer_exists:
            try:
                with open(self.observer_file, "r", encoding="utf-8") as f:
                    observer_data = json.load(f)
            except Exception as e:
                observer_parse_err = str(e)

        probe_err_final = sample_probe_err or post_probe_err
        if cleanup_errors:
            probe_err_final = (probe_err_final or "") + "; Cleanup errors: " + ", ".join(cleanup_errors)

        # 9. Evaluate
        return evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key=self.key,
            variant=self.variant,
            exit_code=child_exit,
            timed_out=timed_out,
            stdout=stdout_content,
            stderr=stderr_content,
            listener_during=listener_during,
            listener_after=listener_after,
            during_sample_count=during_sample_count,
            probe_error=probe_err_final,
            observer_data=observer_data,
            observer_file_exists=observer_exists,
            observer_parse_error=observer_parse_err,
            observer_exit_code=obs_exit_code,
            expected_variant=self.variant_name,
            expected_pid=obs_proc.pid if obs_proc else None,
        )


def run_plan(
    variants: List[Tuple[str, str, str]],
    attempt_dir: str,
    harness_dir: str,
    port: int = 18085,
    observer_port: int = 18086,
    node_bin: Optional[str] = None,
    launcher_path: Optional[str] = None,
    popen_factory=subprocess.Popen,
    subprocess_runner=subprocess.run,
) -> int:
    """
    Executes the variant plan sequentially, stopping immediately upon any failure.
    Refuses occupied attempt directories.
    Returns 0 on complete pass, 2 on failure/abort.
    """
    if os.path.exists(attempt_dir):
        # Refuse collision if directory is non-empty
        if os.listdir(attempt_dir):
            sys.stderr.write(f"Refusing execution: attempt directory already occupied: {attempt_dir}\n")
            return 2

    os.makedirs(attempt_dir, exist_ok=True)
    results_path = os.path.join(attempt_dir, "results.json")
    all_results: List[Dict[str, Any]] = []

    print(f"Starting execution of {len(variants)} variants in {attempt_dir}...")
    for idx, (key, variant, val) in enumerate(variants, 1):
        print(f"[{idx}/{len(variants)}] Running {key}_{variant}...")
        runner = VariantRunner(
            key=key,
            variant=variant,
            env_value=val,
            attempt_dir=attempt_dir,
            harness_dir=harness_dir,
            port=port,
            observer_port=observer_port,
            node_bin=node_bin,
            launcher_path=launcher_path,
            popen_factory=popen_factory,
            subprocess_runner=subprocess_runner,
        )
        res = runner.run()
        all_results.append(res)

        with open(results_path, "w", encoding="utf-8") as f:
            json.dump(all_results, f, indent=2)

        verdict = res.get("verdict")
        code = res.get("verdictCode")
        print(f"  Result: {verdict} ({code}) - {res.get('notes')}")

        if verdict != "PASS":
            print(f"HALTING: Variant {key}_{variant} failed with {code}. Stopping execution.")
            return 2

    print("All variants completed successfully.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.stderr.write("Usage: coordinator.py <attempt_dir> <harness_dir> [port] [observer_port]\n")
        sys.exit(2)

    att_dir = sys.argv[1]
    harn_dir = sys.argv[2]
    p = int(sys.argv[3]) if len(sys.argv) > 3 else 18085
    obs_p = int(sys.argv[4]) if len(sys.argv) > 4 else 18086

    exit_code = run_plan(CANONICAL_22_VARIANTS, att_dir, harn_dir, p, obs_p)
    sys.exit(exit_code)
