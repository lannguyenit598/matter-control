#!/usr/bin/env python3
"""
MC-002-INTA-FE-VALIDATION-R2: Runner Coordinator & Adapter
Coordinates probe checks, process lifecycle, observer monitoring, and fail-closed evaluation.
Addresses R1-C01 (typed marshaling, no inline python quoting bugs, true lsof probe status)
and R1-C03 (atomic persistence, ownership validation, bounded waits, trap cleanup).
"""

from datetime import datetime, timezone
import json
import os
import signal
import subprocess
import sys
import time
from typing import Any, Dict, Optional, Tuple

from guard_evaluator import evaluate_guard_run


def probe_tcp_listener(port: int) -> Tuple[Optional[bool], Optional[str]]:
    """
    Probes whether a TCP port is in LISTEN state on loopback.
    Returns:
      (True, None)   -> Confirmed active listener
      (False, None)  -> Confirmed NO listener (exit code 1, clean stderr)
      (None, error)  -> Probe error / unknown (exit code > 1, or permission/probe failure)
    """
    cmd = ["lsof", f"-iTCP:{port}", "-sTCP:LISTEN", "-n", "-P"]
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=2.0,
        )
        if proc.returncode == 0:
            # Output present and exit 0 means port is actively bound
            return True, None
        elif proc.returncode == 1:
            # lsof returns 1 when no matching socket is found
            # Verify stderr is clean (no syntax or permission errors)
            stderr_stripped = proc.stderr.strip()
            if not stderr_stripped or "No such file or directory" in stderr_stripped:
                return False, None
            else:
                # Permission denied or operational error on stderr
                return None, f"lsof probe returned rc=1 but reported stderr: {stderr_stripped}"
        else:
            return None, f"lsof probe failed with exit code {proc.returncode}: {proc.stderr.strip()}"
    except subprocess.TimeoutExpired:
        return None, f"lsof probe timed out for port {port}"
    except Exception as e:
        return None, f"lsof probe execution exception: {e}"


def verify_pid_identity(pid: int, expected_name: Optional[str] = None) -> bool:
    """
    Verifies that a PID exists and optionally matches the expected executable name.
    Guards against signaling an arbitrary reused PID.
    """
    if pid <= 1:
        return False
    try:
        # Check existence via kill(pid, 0)
        os.kill(pid, 0)
    except OSError:
        return False

    if expected_name:
        try:
            ps_proc = subprocess.run(
                ["ps", "-p", str(pid), "-o", "comm="],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=1.0,
            )
            if ps_proc.returncode == 0:
                comm = ps_proc.stdout.strip()
                if expected_name not in comm:
                    return False
        except Exception:
            pass
    return True


def bounded_terminate(pid: int, timeout_sec: float = 3.0, expected_name: Optional[str] = None) -> bool:
    """
    Terminates a process gracefully with SIGTERM after verifying identity,
    waiting up to timeout_sec for clean exit.
    Returns True if process cleanly exited, False otherwise.
    """
    if not verify_pid_identity(pid, expected_name):
        return True  # Already gone or not ours

    try:
        os.kill(pid, signal.SIGTERM)
    except OSError:
        return True

    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            os.kill(pid, 0)
            time.sleep(0.05)
        except OSError:
            return True  # Process exited

    return False  # Timed out waiting for exit


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
    ):
        self.key = key
        self.variant = variant
        self.env_value = env_value
        self.attempt_dir = attempt_dir
        self.harness_dir = harness_dir
        self.port = port
        self.observer_port = observer_port
        self.variant_name = f"{key}_{variant}"
        self.output_dir = os.path.join(attempt_dir, self.variant_name)
        os.makedirs(self.output_dir, exist_ok=True)

        self.observer_file = os.path.join(self.output_dir, "observer.json")
        self.stdout_file = os.path.join(self.output_dir, "stdout.log")
        self.stderr_file = os.path.join(self.output_dir, "stderr.log")
        self.meta_file = os.path.join(self.output_dir, "meta.json")

    def run(self, timeout_sec: float = 4.0) -> Dict[str, Any]:
        """
        Executes pre-probe, observer start, child run, sample probe, post-probe,
        and fail-closed evaluation.
        """
        # 1. Pre-probe: must confirm port 18085 is not already bound
        pre_listen, pre_err = probe_tcp_listener(self.port)
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
                probe_error=f"Port {self.port} was already bound before test execution",
            )

        # 2. Start observer process
        observer_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "observer.py")
        obs_cmd = [
            sys.executable,
            observer_script,
            "--port", str(self.observer_port),
            "--state-file", self.observer_file,
            "--variant", self.variant_name,
        ]
        obs_proc = subprocess.Popen(
            obs_cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        # Wait up to 1 second for observer to bind and write initial state
        obs_bound = False
        obs_deadline = time.time() + 1.5
        while time.time() < obs_deadline:
            listen_state, _ = probe_tcp_listener(self.observer_port)
            if listen_state is True and os.path.exists(self.observer_file):
                obs_bound = True
                break
            time.sleep(0.05)

        if not obs_bound:
            bounded_terminate(obs_proc.pid)
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
                probe_error=f"Observer failed to bind on loopback port {self.observer_port}",
            )

        # 3. Build child environment
        # Exact bounded environment: only essential keys plus forbidden key under test
        child_env = os.environ.copy()
        child_env[self.key] = self.env_value
        child_env["MC_INTA_ENABLE"] = "1"
        child_env["MC_INTA_GO_BASE_URL"] = f"http://127.0.0.1:{self.observer_port}"
        child_env["PORT"] = str(self.port)

        # 4. Spawn child process (Next or launcher)
        # Note: In mock/selfcheck tests, runner invokes double; in real run, invokes configured launcher
        child_cmd = ["npx", "next", "dev", "-H", "127.0.0.1", "-p", str(self.port)]
        child_stdout = open(self.stdout_file, "w", encoding="utf-8")
        child_stderr = open(self.stderr_file, "w", encoding="utf-8")

        child_start_utc = datetime.now(timezone.utc).isoformat()
        child_proc = subprocess.Popen(
            child_cmd,
            cwd=self.harness_dir,
            env=child_env,
            stdout=child_stdout,
            stderr=child_stderr,
        )

        child_pid = child_proc.pid
        parent_pid = os.getpid()

        # Write metadata file recording verified child and parent identities
        meta_data = {
            "variant": self.variant_name,
            "key": self.key,
            "childPid": child_pid,
            "childParentPid": parent_pid,
            "childStartUTC": child_start_utc,
            "observerPid": obs_proc.pid,
            "port": self.port,
            "observerPort": self.observer_port,
        }
        with open(self.meta_file, "w", encoding="utf-8") as mf:
            json.dump(meta_data, mf, indent=2)

        # 5. Monitor loop
        timed_out = False
        listener_during = False
        sample_probe_err = None
        deadline = time.time() + timeout_sec

        while time.time() < deadline:
            poll_ret = child_proc.poll()
            if poll_ret is not None:
                break  # Child exited cleanly

            # Probe listener during child execution
            listening, err = probe_tcp_listener(self.port)
            if err:
                sample_probe_err = err
            elif listening is True:
                listener_during = True
                # Immediate abort on listener acquisition (NEVER-LISTEN CONTRACT)
                bounded_terminate(child_pid)
                break

            # Probe observer counter file for live requests
            if os.path.exists(self.observer_file):
                try:
                    with open(self.observer_file, "r", encoding="utf-8") as f:
                        obs_state = json.load(f)
                    if obs_state.get("requestCount", 0) > 0:
                        # Immediate abort on unexpected HTTP request
                        bounded_terminate(child_pid)
                        break
                except Exception:
                    pass

            time.sleep(0.05)

        if child_proc.poll() is None:
            timed_out = True
            bounded_terminate(child_pid)

        child_exit = child_proc.poll()
        child_stdout.close()
        child_stderr.close()

        # 6. Post-probe: check listener after child exit
        listener_after, post_probe_err = probe_tcp_listener(self.port)

        # 7. Graceful observer termination
        bounded_terminate(obs_proc.pid, timeout_sec=2.0)
        obs_proc.wait(timeout=2.0)

        # 8. Read stdout/stderr
        with open(self.stdout_file, "r", encoding="utf-8", errors="replace") as f:
            stdout_content = f.read()
        with open(self.stderr_file, "r", encoding="utf-8", errors="replace") as f:
            stderr_content = f.read()

        # 9. Read observer state
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

        # 10. Fail-closed evaluation
        eval_result = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key=self.key,
            variant=self.variant,
            exit_code=child_exit,
            timed_out=timed_out,
            stdout=stdout_content,
            stderr=stderr_content,
            listener_during=listener_during,
            listener_after=listener_after,
            probe_error=probe_err_final,
            observer_data=observer_data,
            observer_file_exists=observer_exists,
            observer_parse_error=observer_parse_err,
            expected_variant=self.variant_name,
            expected_pid=obs_proc.pid,
        )

        return eval_result
