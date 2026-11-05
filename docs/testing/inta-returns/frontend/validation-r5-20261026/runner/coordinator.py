#!/usr/bin/env python3
"""
MC-002-INTA-FE-VALIDATION-R5: Coordinated Variant Runner
Addresses R4-C01, R4-C02, R4-C03, R4-C05, S1..S6, NF-1, NF-2, NF-4:
- Dispatches approved guard-first launcher (harness-dev.mjs) using Node 24 native type stripping
- Canonical 25-variant plan (24 forbidden variables + 1 NODE_ENV=production subcheck)
- Strict bounded environments with private HOME and TMPDIR (no ambient leakage)
- Verified during-sample interval binding (probes only when child poll() is None; dead child sample rejected)
- Persists and validates attempt-bound launcher-execution.json provenance
- Strict owned lifecycle: immutable identity verification (executable name + parent PID + start time),
  handle reap via wait(), and fail-closed cleanup escalation without SIGKILL
- Deterministic time and sleep injection support
"""

import json
import os
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional, Tuple

from guard_evaluator import evaluate_guard_run, EXPECTED_GUARD_SHA256


# Canonical 25-variant validation plan for supported launcher path:
PLAN_VARIANTS_25 = [
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
    ("NODE_ENV", "production", "production"),
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


def get_process_start_time(pid: int, subprocess_runner=subprocess.run) -> Optional[str]:
    """
    Retrieves the OS start time for a PID (lstart).
    Used as an immutable process start identity handle.
    """
    if pid <= 1:
        return None
    try:
        proc = subprocess_runner(
            ["ps", "-p", str(pid), "-o", "lstart="],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=1.0,
        )
        if proc.returncode == 0:
            return proc.stdout.strip()
    except Exception:
        pass
    return None


def verify_pid_identity(
    pid: int,
    expected_name: Optional[str] = None,
    expected_parent: Optional[int] = None,
    expected_start_time: Optional[str] = None,
    subprocess_runner=subprocess.run,
    kill_func=os.kill,
) -> bool:
    """
    Verifies that a PID exists and matches expected identity:
    executable name, parent PID, and OS start time handle.
    Fail-closed: any query error returns False.
    """
    if pid <= 1:
        return False
    try:
        kill_func(pid, 0)
    except OSError:
        return False

    if expected_name or expected_parent is not None or expected_start_time is not None:
        try:
            ps_proc = subprocess_runner(
                ["ps", "-p", str(pid), "-o", "comm=,ppid=,lstart="],
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
            lstart_val = " ".join(parts[2:]) if len(parts) > 2 else None

            if expected_name and expected_name not in comm:
                return False
            if expected_parent is not None and ppid_val != expected_parent:
                return False
            if expected_start_time is not None and lstart_val != expected_start_time:
                return False
        except Exception:
            return False

    return True


def bounded_terminate(
    pid: int,
    timeout_sec: float = 3.0,
    expected_name: Optional[str] = None,
    expected_parent: Optional[int] = None,
    expected_start_time: Optional[str] = None,
    process_handle: Optional[Any] = None,
    subprocess_runner=subprocess.run,
    kill_func=os.kill,
    time_func: Callable[[], float] = time.time,
    sleep_func: Callable[[float], None] = time.sleep,
) -> Tuple[bool, Optional[str]]:
    """
    Gracefully terminates an owned process with SIGTERM after strict identity verification.
    Waits bounded time for exit using process_handle reap if available.
    DO NOT SIGKILL: if process remains alive, returns explicit still-alive / cleanup-failed
    propagated to evaluator with retained resources and no retry (R5 Item 3).
    Returns (True, None) if cleanly exited, (False, error_reason) otherwise.
    """
    if process_handle:
        if getattr(process_handle, "pid", None) != pid:
            return False, f"Process handle PID {getattr(process_handle, 'pid', None)} does not match target PID {pid}"
        if hasattr(process_handle, "poll") and process_handle.poll() is not None:
            return True, None

    if not verify_pid_identity(
        pid,
        expected_name,
        expected_parent,
        expected_start_time,
        subprocess_runner,
        kill_func=kill_func,
    ):
        return False, f"PID {pid} failed identity verification (unowned, mismatched, or recycled); refusing signal"

    try:
        kill_func(pid, signal.SIGTERM)
    except OSError as e:
        return False, f"SIGTERM delivery failed for PID {pid}: {e}"

    if process_handle and hasattr(process_handle, "wait"):
        try:
            process_handle.wait(timeout=timeout_sec)
            return True, None
        except Exception as e:
            return (
                False,
                f"PID {pid} remained alive after {timeout_sec}s following SIGTERM (cleanup failed: {e}; retained without retry)",
            )

    deadline = time_func() + timeout_sec
    while time_func() < deadline:
        try:
            kill_func(pid, 0)
            sleep_func(0.05)
        except OSError:
            return True, None

    return (
        False,
        f"PID {pid} remained alive after {timeout_sec}s following SIGTERM (cleanup failed; retained without retry)",
    )


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
        stage_dir: Optional[str] = None,
        stage_receipt_required: bool = False,
        popen_factory=subprocess.Popen,
        subprocess_runner=subprocess.run,
        kill_func=os.kill,
        time_func: Callable[[], float] = time.time,
        sleep_func: Callable[[float], None] = time.sleep,
    ):
        self.key = key
        self.variant = variant
        self.env_value = env_value
        self.attempt_dir = attempt_dir
        self.harness_dir = os.path.abspath(harness_dir)
        self.port = port
        self.observer_port = observer_port
        self.stage_dir = stage_dir
        self.stage_receipt_required = stage_receipt_required

        # Pinned absolute node executable (R4-C02)
        default_node = "/Users/nguyenvanlan/.nvm/versions/node/v24.22.1/bin/node"
        resolved_node = node_bin or default_node
        self.node_bin = os.path.abspath(resolved_node)

        self.popen_factory = popen_factory
        self.subprocess_runner = subprocess_runner
        self.kill_func = kill_func
        self.time_func = time_func
        self.sleep_func = sleep_func

        script_dir = os.path.dirname(os.path.abspath(__file__))
        if launcher_path:
            self.launcher_path = os.path.abspath(launcher_path)
        else:
            self.launcher_path = os.path.abspath(
                os.path.join(os.path.dirname(script_dir), "launcher", "harness-dev.mjs")
            )

        self.variant_name = f"{key}_{variant}"
        self.output_dir = os.path.join(attempt_dir, self.variant_name)
        os.makedirs(self.output_dir, exist_ok=True)

        # Private temporary directories for child and observer (NF-1, R4-C02)
        self.private_home = os.path.join(self.output_dir, "home")
        self.private_tmp = os.path.join(self.output_dir, "tmp")
        os.makedirs(self.private_home, exist_ok=True)
        os.makedirs(self.private_tmp, exist_ok=True)

        self.observer_file = os.path.join(self.output_dir, "observer.json")
        self.obs_stdout_file = os.path.join(self.output_dir, "obs_stdout.log")
        self.obs_stderr_file = os.path.join(self.output_dir, "obs_stderr.log")
        self.stdout_file = os.path.join(self.output_dir, "stdout.log")
        self.stderr_file = os.path.join(self.output_dir, "stderr.log")
        self.meta_file = os.path.join(self.output_dir, "meta.json")
        self.state_dir = os.path.join(self.output_dir, "run-state")
        os.makedirs(self.state_dir, exist_ok=True)
        self.launcher_execution_file = os.path.join(self.state_dir, "launcher-execution.json")

    def validate_preflight_stage(self) -> Optional[str]:
        """
        Validates stage requirements before observer or child creation (R4-C02, R5 Item 2).
        Fails closed on missing/invalid stage receipt, missing binaries, or escaping symlinks.
        """
        if self.stage_receipt_required:
            stage_root = self.stage_dir or "/tmp/mc002-inta-runtime-stage-r5-20261026"
            receipt_path = os.path.join(stage_root, "stage-receipt.json")
            if not os.path.exists(receipt_path):
                return f"[BINDING_ERROR/NOT_READY] Required Codex stage receipt missing at {receipt_path}"
            try:
                with open(receipt_path, "r", encoding="utf-8") as rf:
                    receipt = json.load(rf)
                if receipt.get("stageStatus") != "VERIFIED":
                    return f"[BINDING_ERROR/NOT_READY] Stage receipt status is not VERIFIED: {receipt.get('stageStatus')}"
            except Exception as e:
                return f"[BINDING_ERROR/NOT_READY] Failed to read stage receipt: {e}"

        # Validate launcher script existence
        if not os.path.exists(self.launcher_path):
            return f"[BINDING_ERROR/NOT_READY] Launcher script missing at {self.launcher_path}"

        # Validate Node binary existence
        if not os.path.exists(self.node_bin):
            return f"[BINDING_ERROR/NOT_READY] Node binary missing at {self.node_bin}"

        return None

    def run(self, timeout_sec: float = 4.0) -> Dict[str, Any]:
        """
        Executes pre-probe, observer start, child run, sample probe, post-probe,
        and fail-closed evaluation within a strict single try/finally block.
        """
        # 0. Pre-flight stage and binding validation (R4-C02)
        binding_err = self.validate_preflight_stage()
        if binding_err:
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
                probe_error=binding_err,
            )

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
            # NF-4 fix: remove fabricated during_sample_count=1; no child was executed at pre-flight
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
                during_sample_count=0,
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

        child_comm = "node"
        obs_comm = "python"
        child_start_time = None
        obs_start_time = None

        try:
            # 2. Start observer process with private HOME/TMPDIR (R3-N02, NF-1, R4-C02)
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
            obs_env = {
                "PATH": "/usr/bin:/bin",
                "PYTHONPATH": os.path.dirname(os.path.abspath(__file__)),
                "HOME": self.private_home,
                "TMPDIR": self.private_tmp,
                "LANG": "en_US.UTF-8",
                "LC_ALL": "en_US.UTF-8",
                "TERM": "xterm",
            }

            obs_out_fp = open(self.obs_stdout_file, "w", encoding="utf-8")
            obs_err_fp = open(self.obs_stderr_file, "w", encoding="utf-8")
            try:
                obs_proc = self.popen_factory(
                    obs_cmd,
                    env=obs_env,
                    stdout=obs_out_fp,
                    stderr=obs_err_fp,
                )
            finally:
                obs_out_fp.close()
                obs_err_fp.close()

            obs_start_time = get_process_start_time(obs_proc.pid, self.subprocess_runner)

            # Wait for observer to bind and write initial state
            obs_bound = False
            obs_deadline = self.time_func() + 1.5
            while self.time_func() < obs_deadline:
                listen_state, _ = probe_tcp_listener(self.observer_port, self.subprocess_runner)
                if listen_state is True and os.path.exists(self.observer_file):
                    obs_bound = True
                    break
                self.sleep_func(0.05)

            if not obs_bound:
                sample_probe_err = f"Observer failed to bind on loopback port {self.observer_port}"
            else:
                # 3. Construct strict bounded child environment with private HOME/TMPDIR (NF-1, R4-C02)
                is_prod_subcheck = (self.key == "NODE_ENV" and self.variant == "production")
                child_env = {
                    "PATH": "/usr/bin:/bin",
                    "NODE_ENV": "production" if is_prod_subcheck else "development",
                    "MC_INTA_ENABLE": "1",
                    "MC_INTA_GO_BASE_URL": f"http://127.0.0.1:{self.observer_port}",
                    "MC_INTA_STATE_DIR": self.state_dir,
                    "PORT": str(self.port),
                    "HOSTNAME": "127.0.0.1",
                    "HOME": self.private_home,
                    "TMPDIR": self.private_tmp,
                    "TERM": "xterm",
                    "SHELL": "/bin/sh",
                }
                if not is_prod_subcheck:
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

                child_start_time = get_process_start_time(child_proc.pid, self.subprocess_runner)

                # Record verified creation metadata
                meta_data = {
                    "variant": self.variant_name,
                    "key": self.key,
                    "childPid": child_proc.pid,
                    "childParentPid": os.getpid(),
                    "childStartTime": child_start_time,
                    "childStartUTC": child_start_utc,
                    "childCmd": child_cmd,
                    "observerPid": obs_proc.pid if obs_proc else None,
                    "observerStartTime": obs_start_time,
                    "port": self.port,
                    "observerPort": self.observer_port,
                    "stateDir": self.state_dir,
                }
                with open(self.meta_file, "w", encoding="utf-8") as mf:
                    json.dump(meta_data, mf, indent=2)

                # 5. Monitor loop (P1.1 Lifecycle-bound proof)
                deadline = self.time_func() + timeout_sec
                while self.time_func() < deadline:
                    # Poll child FIRST: do not probe if child has already exited (R4-C01 fix)
                    poll_before = child_proc.poll()
                    if poll_before is not None:
                        child_exit = poll_before
                        break

                    # Child is confirmed alive: sample during active window
                    listening, err = probe_tcp_listener(self.port, self.subprocess_runner)
                    during_sample_count += 1
                    if err:
                        sample_probe_err = err
                    elif listening is True:
                        listener_during = True
                        # Site 1: Immediate abort on listener acquisition (R3-N01)
                        term_ok, term_err = bounded_terminate(
                            child_proc.pid,
                            2.0,
                            expected_name=child_comm,
                            expected_parent=os.getpid(),
                            expected_start_time=child_start_time,
                            process_handle=child_proc,
                            subprocess_runner=self.subprocess_runner,
                            kill_func=self.kill_func,
                            time_func=self.time_func,
                            sleep_func=self.sleep_func,
                        )
                        if not term_ok and term_err:
                            cleanup_errors.append(term_err)
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
                                # Site 2: Immediate abort on positive counter (R3-N01)
                                term_ok, term_err = bounded_terminate(
                                    child_proc.pid,
                                    2.0,
                                    expected_name=child_comm,
                                    expected_parent=os.getpid(),
                                    expected_start_time=child_start_time,
                                    process_handle=child_proc,
                                    subprocess_runner=self.subprocess_runner,
                                    kill_func=self.kill_func,
                                    time_func=self.time_func,
                                    sleep_func=self.sleep_func,
                                )
                                if not term_ok and term_err:
                                    cleanup_errors.append(term_err)
                                break
                        except Exception:
                            pass

                    # Poll child after probe check
                    poll_after = child_proc.poll()
                    if poll_after is not None:
                        child_exit = poll_after
                        break

                    self.sleep_func(0.05)

                if child_proc.poll() is None:
                    timed_out = True
                    # Site 3: Timeout termination (R3-N01, S4)
                    term_ok, term_err = bounded_terminate(
                        child_proc.pid,
                        2.0,
                        expected_name=child_comm,
                        expected_parent=os.getpid(),
                        expected_start_time=child_start_time,
                        process_handle=child_proc,
                        subprocess_runner=self.subprocess_runner,
                        kill_func=self.kill_func,
                        time_func=self.time_func,
                        sleep_func=self.sleep_func,
                    )
                    if not term_ok and term_err:
                        cleanup_errors.append(term_err)

                child_exit = child_proc.poll()

        except Exception as e:
            cleanup_errors.append(f"Child process failure: {e}")

        finally:
            # Site 4: Owned child cleanup in finally (R3-N01, R2-I03, S4)
            if child_proc and child_proc.poll() is None:
                term_ok, term_err = bounded_terminate(
                    child_proc.pid,
                    2.0,
                    expected_name=child_comm,
                    expected_parent=os.getpid(),
                    expected_start_time=child_start_time,
                    process_handle=child_proc,
                    subprocess_runner=self.subprocess_runner,
                    kill_func=self.kill_func,
                    time_func=self.time_func,
                    sleep_func=self.sleep_func,
                )
                if not term_ok and term_err:
                    cleanup_errors.append(term_err)

            # Site 5: Owned observer cleanup in finally (R3-N01, R2-I03)
            if obs_proc and obs_proc.poll() is None:
                term_ok, term_err = bounded_terminate(
                    obs_proc.pid,
                    3.0,
                    expected_name=obs_comm,
                    expected_parent=os.getpid(),
                    expected_start_time=obs_start_time,
                    process_handle=obs_proc,
                    subprocess_runner=self.subprocess_runner,
                    kill_func=self.kill_func,
                    time_func=self.time_func,
                    sleep_func=self.sleep_func,
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

        # 8. Read observer final record
        observer_exists = os.path.exists(self.observer_file)
        observer_data = None
        observer_parse_err = None
        if observer_exists:
            try:
                with open(self.observer_file, "r", encoding="utf-8") as f:
                    observer_data = json.load(f)
            except Exception as e:
                observer_parse_err = str(e)

        # 9. Read attempt-bound launcher-execution.json record (NF-4, R5 Item 1)
        launcher_execution_data = None
        launcher_execution_error = None
        if os.path.exists(self.launcher_execution_file):
            try:
                with open(self.launcher_execution_file, "r", encoding="utf-8") as lf:
                    launcher_execution_data = json.load(lf)
            except Exception as e:
                launcher_execution_error = f"Failed to parse launcher-execution.json: {e}"
        else:
            if child_proc is not None:
                launcher_execution_error = "launcher-execution.json was not created by launcher"

        probe_err_final = sample_probe_err or post_probe_err
        if cleanup_errors:
            prefix = (probe_err_final + "; ") if probe_err_final else ""
            probe_err_final = prefix + "Cleanup errors: " + ", ".join(cleanup_errors)

        # 10. Single unified evaluation capturing all evidence and errors
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
            launcher_execution_data=launcher_execution_data,
            launcher_execution_error=launcher_execution_error,
        )


def run_plan(
    variants: List[Tuple[str, str, str]],
    attempt_dir: str,
    harness_dir: str,
    port: int = 18085,
    observer_port: int = 18086,
    node_bin: Optional[str] = None,
    launcher_path: Optional[str] = None,
    stage_dir: Optional[str] = None,
    stage_receipt_required: bool = False,
    popen_factory=subprocess.Popen,
    subprocess_runner=subprocess.run,
    kill_func=os.kill,
    time_func: Callable[[], float] = time.time,
    sleep_func: Callable[[float], None] = time.sleep,
) -> int:
    """
    Executes the variant plan sequentially, stopping immediately upon any failure.
    Refuses existing attempt directories without reuse or truncation.
    Returns 0 on complete pass, 2 on failure/abort.
    """
    if os.path.exists(attempt_dir):
        sys.stderr.write(f"Refusing execution: attempt directory already exists: {attempt_dir}\n")
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
            stage_dir=stage_dir,
            stage_receipt_required=stage_receipt_required,
            popen_factory=popen_factory,
            subprocess_runner=subprocess_runner,
            kill_func=kill_func,
            time_func=time_func,
            sleep_func=sleep_func,
        )
        res = runner.run()
        all_results.append(res)

        # Write cumulative results atomically
        tmp_res = f"{results_path}.tmp"
        with open(tmp_res, "w", encoding="utf-8") as f:
            json.dump(all_results, f, indent=2)
        os.replace(tmp_res, results_path)

        verdict = res.get("verdict")
        code = res.get("verdictCode")
        notes = res.get("notes", "")
        print(f"  Result: {verdict} ({code}) - {notes}")

        if verdict != "PASS":
            print(f"HALTING: Variant {key}_{variant} failed with {code}. Stopping execution.")
            return 2

    print("All variants executed and passed successfully.")
    return 0


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: coordinator.py <attempt_dir> [harness_dir] [port] [observer_port]\n")
        sys.exit(2)

    attempt_dir = sys.argv[1]
    harness_dir = sys.argv[2] if len(sys.argv) > 2 else "/tmp/mc002-inta-harness"
    port = int(sys.argv[3]) if len(sys.argv) > 3 else 18085
    observer_port = int(sys.argv[4]) if len(sys.argv) > 4 else 18086

    ret = run_plan(PLAN_VARIANTS_25, attempt_dir, harness_dir, port, observer_port)
    sys.exit(ret)


if __name__ == "__main__":
    main()
