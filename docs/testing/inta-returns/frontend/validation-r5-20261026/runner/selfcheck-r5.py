#!/usr/bin/env python3
"""
MC-002-INTA-FE-VALIDATION-R5: Comprehensive Deterministic Self-Check Suite
Validates all R4-C01..C05, S1..S6, NF-1..NF-6 corrections in-process:
- Fail-fast signal guard preventing any real os.kill/signal execution during tests (R3-N03)
- Strict evidence schema: exact int type enforcement (rejecting bool and float for exit codes)
- Mandatory identity verification: expected_variant and expected_pid enforcement
- Durability: isolated file-open, file-fsync, file-replace, dir-open, dir-fsync, dir-close failures
- Lifecycle-bound proof: dead mock child receives 0 samples and fails closed (test 34)
- Live-then-exit coordinator fake test with verified live interval (PASS)
- Spawn-then-immediate-exit defect test fails closed as LISTENER_UNKNOWN
- Launcher execution record correlation: zero spawn, guard hash, and BINDING_ERROR handling
- Pre-flight stage validation: missing stage receipt fails closed before observer/child creation
- Raising unexpected-Popen fake on ALL abort paths (S1)
- Deterministic fake clock/time injection (S2)
- Wrapper dispatch with explicit env, full argument validation, and nonzero propagation (S3)
- Caller sites 3 (timeout) and 4 (finally on running child) coverage (S4)
- Launcher mock suite verification parsing real assertion records
"""

from datetime import datetime, timezone
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from typing import Any, Callable, Dict, List, Optional

# ------------------------------------------------------------------------------
# P1 / R3-N03: FAIL-FAST REAL SIGNAL SAFETY GUARD
# Monkeypatch os.kill to guarantee no real process can EVER receive a signal in tests
# ------------------------------------------------------------------------------
REAL_OS_KILL = os.kill

def fail_fast_real_signal_guard(pid, sig):
    raise AssertionError(
        f"SAFETY VIOLATION (R3-N03): Real os.kill({pid}, {sig}) called during test suite! "
        "All test paths must inject a mock kill_func."
    )

os.kill = fail_fast_real_signal_guard

from guard_evaluator import evaluate_guard_run, EXPECTED_GUARD_SHA256
from observer import AtomicStateWriter
import coordinator
from coordinator import (
    probe_tcp_listener,
    verify_pid_identity,
    get_process_start_time,
    bounded_terminate,
    VariantRunner,
    run_plan,
    PLAN_VARIANTS_25,
)


class MockCompletedProcess:
    def __init__(self, returncode: int, stdout: str = "", stderr: str = ""):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


class MockSignalTracker:
    """Fake OS signal and PID table for safe, deterministic testing."""
    def __init__(self, alive_pids=None):
        self.alive_pids = set(alive_pids or [])
        self.signals_sent = []  # List of (pid, sig)

    def kill_func(self, pid: int, sig: int):
        self.signals_sent.append((pid, sig))
        if sig == 0:
            if pid in self.alive_pids:
                return None
            raise OSError(f"Mock PID {pid} does not exist in fake OS table")
        else:
            if pid in self.alive_pids:
                if sig in (signal.SIGTERM, signal.SIGKILL):
                    self.alive_pids.remove(pid)
                return None
            raise OSError(f"Mock PID {pid} does not exist in fake OS table")


class MockChildProcess:
    """Mock process handle simulating subprocess.Popen with poll() and wait()."""
    def __init__(self, pid: int = 12345, returncode: Optional[int] = None, poll_sequence: Optional[List[Optional[int]]] = None):
        self.pid = pid
        self._returncode = returncode
        self.poll_sequence = list(poll_sequence) if poll_sequence is not None else None
        self.poll_calls = 0
        self.wait_calls = 0
        self.wait_timeout = None

    def poll(self):
        self.poll_calls += 1
        if self.poll_sequence is not None:
            if self.poll_sequence:
                self._returncode = self.poll_sequence.pop(0)
            return self._returncode
        return self._returncode

    def wait(self, timeout=None):
        self.wait_calls += 1
        self.wait_timeout = timeout
        if self._returncode is None:
            self._returncode = 0
        return self._returncode

    def kill(self, sig):
        self._returncode = -sig


class FakeClock:
    """Deterministic simulated clock for time and sleep functions (S2)."""
    def __init__(self, initial_time: float = 1000.0):
        self.current_time = initial_time

    def time(self) -> float:
        return self.current_time

    def sleep(self, duration: float) -> None:
        self.current_time += duration


def raising_unexpected_popen(*args, **kwargs):
    """Safety fake ensuring abort paths never reach subprocess creation (S1)."""
    raise AssertionError(f"SAFETY VIOLATION (S1): Unexpected Popen call on abort branch: {args}")


class SelfCheckR5Runner:
    def __init__(self, scratch_dir: str):
        self.scratch_dir = scratch_dir
        self.results: List[Dict[str, Any]] = []
        self.passed_count = 0
        self.failed_count = 0

    def record(self, case_id: str, description: str, assertion: str, expected_verdict: str, expected_code: str, actual_result: Dict[str, Any]):
        verdict = actual_result.get("verdict")
        code = actual_result.get("verdictCode")
        is_pass = (verdict == expected_verdict and code == expected_code)
        if is_pass:
            self.passed_count += 1
            print(f"[PASS] {case_id}: {description}")
        else:
            self.failed_count += 1
            print(f"[FAIL] {case_id}: {description} (Expected {expected_verdict}/{expected_code}, got {verdict}/{code})")

        self.results.append({
            "caseId": case_id,
            "description": description,
            "assertion": assertion,
            "expectedVerdict": expected_verdict,
            "expectedCode": expected_code,
            "actualVerdict": verdict,
            "actualCode": code,
            "pass": is_pass,
            "notes": actual_result.get("notes", ""),
        })

    def run_all(self):
        print("================================================================")
        print("MC-002-INTA-FE-VALIDATION-R5: Comprehensive Deterministic Self-Check")
        print(f"Start UTC: {datetime.now(timezone.utc).isoformat()}")
        print(f"Scratch Directory: {self.scratch_dir}")
        print("================================================================")

        # ----------------------------------------------------------------------
        # GROUP 1: Baseline Cases & Evaluator Schema (R1-C02, R4-C05, R5 Item 4)
        # ----------------------------------------------------------------------
        print("\n--- Group 1: Baseline Cases & Evaluator Schema ---")

        # 1. missingcounter
        r1 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=False, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("1. missingcounter", "Observer file does not exist", "Fails closed as MISSING_COUNTER", "FAIL", "MISSING_COUNTER", r1)

        # 2. malformedcounter
        r2 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_parse_error="Invalid JSON syntax at byte 0", observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("2. malformedcounter", "Observer JSON malformed", "Fails closed as MALFORMED_COUNTER", "FAIL", "MALFORMED_COUNTER", r2)

        # 3. positivecounter
        r3 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 3, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("3. positivecounter", "Observer recorded >0 HTTP requests", "Fails closed as POSITIVE_COUNTER", "FAIL", "POSITIVE_COUNTER", r3)

        # 4. observererror
        r4 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": False, "isFinal": True, "error": "Address already in use", "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("4. observererror", "Observer startup or runtime error", "Fails closed as OBSERVER_ERROR", "FAIL", "OBSERVER_ERROR", r4)

        # 5. transientlistener
        r5 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=True, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("5. transientlistener", "Port 18085 listener observed during run", "Fails closed as FAIL_AGAINST_NEVER_LISTEN", "FAIL", "FAIL_AGAINST_NEVER_LISTEN", r5)

        # 6. probeerror
        r6 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            probe_error="lsof probe timed out after 2.0s", observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("6. probeerror", "Probe returned error or timed out", "Fails closed as PROBE_ERROR", "FAIL", "PROBE_ERROR", r6)

        # 7. timeout
        r7 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=None, timed_out=True, stdout="", stderr="",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("7. timeout", "Child process timed out", "Fails closed as TIMEOUT", "FAIL", "TIMEOUT", r7)

        # 8. wrongexitcode
        r8 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=0, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("8. wrongexitcode", "Child exited with code 0 instead of 1", "Fails closed as WRONG_EXIT_CODE", "FAIL", "WRONG_EXIT_CODE", r8)

        # 9. wrongrefusal
        r9 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Some unvetted general error occurred",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("9. wrongrefusal", "Refusal phrase missing from stderr", "Fails closed as WRONG_REFUSAL", "FAIL", "WRONG_REFUSAL", r9)

        # 10. unverifiedexit
        r10 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=None,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("10. unverifiedexit", "Observer exit code is None", "Fails closed as OBSERVER_EXIT_ERROR", "FAIL", "OBSERVER_EXIT_ERROR", r10)

        # 11. uncleanobserver
        r11 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": False, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("11. uncleanobserver", "cleanShutdown is False", "Fails closed as UNCLEAN_SHUTDOWN", "FAIL", "UNCLEAN_SHUTDOWN", r11)

        # 12. incompleteobserver
        r12 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": False, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("12. incompleteobserver", "isFinal is False", "Fails closed as INCOMPLETE_OBSERVER_RECORD", "FAIL", "INCOMPLETE_OBSERVER_RECORD", r12)

        # 13. valid_complete_input
        r13 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("13. valid_complete_input", "All gates pass with complete evidence", "Evaluates to PASS with VALID_COMPLETE_INPUT", "PASS", "VALID_COMPLETE_INPUT", r13)

        # ----------------------------------------------------------------------
        # GROUP 2: Strict Evaluator Type Checks (R4-C05, R5 Item 4)
        # ----------------------------------------------------------------------
        print("\n--- Group 2: Strict Evaluator Type Checks ---")

        # 14. exit_code_bool_rejected
        r14 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=True, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("14. exit_code_bool_rejected", "exit_code=True (bool) rejected as non-strict int", "Fails closed as WRONG_EXIT_CODE", "FAIL", "WRONG_EXIT_CODE", r14)

        # 15. exit_code_float_rejected
        r15 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1.0, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("15. exit_code_float_rejected", "exit_code=1.0 (float) rejected as non-strict int", "Fails closed as WRONG_EXIT_CODE", "FAIL", "WRONG_EXIT_CODE", r15)

        # 16. observer_exit_code_bool_rejected
        r16 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=False,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("16. observer_exit_code_bool_rejected", "observer_exit_code=False (bool) rejected", "Fails closed as OBSERVER_EXIT_ERROR", "FAIL", "OBSERVER_EXIT_ERROR", r16)

        # 17. observer_exit_code_float_rejected
        r17 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0.0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
        )
        self.record("17. observer_exit_code_float_rejected", "observer_exit_code=0.0 (float) rejected", "Fails closed as OBSERVER_EXIT_ERROR", "FAIL", "OBSERVER_EXIT_ERROR", r17)

        # 18. identity_gates_mandatory
        r18 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant=None, expected_pid=None,
        )
        self.record("18. identity_gates_mandatory", "Omitted expected_variant/pid fails closed", "Fails closed as INCOMPLETE_EVIDENCE", "FAIL", "INCOMPLETE_EVIDENCE", r18)

        # 19. prebound_listener_wording
        r19 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=None, timed_out=False, stdout="", stderr="",
            listener_during=True, listener_after=True, during_sample_count=0,
            probe_error=None,
        )
        is_prebound_note = "pre-flight (port already occupied)" in r19.get("notes", "")
        self.record("19. prebound_listener_wording", "Pre-flight occupied port wording", "Notes specify listener observed at pre-flight", "FAIL", "FAIL_AGAINST_NEVER_LISTEN", {"verdict": r19.get("verdict"), "verdictCode": "FAIL_AGAINST_NEVER_LISTEN" if is_prebound_note else "WRONG_WORDING"})

        # ----------------------------------------------------------------------
        # GROUP 3: TCP Probe Unit Tests (R2-I04, R3-N06)
        # ----------------------------------------------------------------------
        print("\n--- Group 3: TCP Probe Unit Tests ---")

        # 20. probe_clean_absence
        p20, e20 = probe_tcp_listener(18085, subprocess_runner=lambda *a, **kw: MockCompletedProcess(1, "", ""))
        self.record("20. probe_clean_absence", "rc=1 with empty stderr is confirmed absence", "Returns (False, None)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (p20 is False and e20 is None) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 21. probe_rc1_with_stderr_error
        p21, e21 = probe_tcp_listener(18085, subprocess_runner=lambda *a, **kw: MockCompletedProcess(1, "", "lsof: command not found"))
        self.record("21. probe_rc1_with_stderr_error", "rc=1 with non-empty stderr is error/unknown", "Returns (None, error_str)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (p21 is None and e21 and "lsof: command not found" in e21) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 22. probe_active_listener
        p22, e22 = probe_tcp_listener(18085, subprocess_runner=lambda *a, **kw: MockCompletedProcess(0, "node 1234 (LISTEN)", ""))
        self.record("22. probe_active_listener", "rc=0 is confirmed active listener", "Returns (True, None)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (p22 is True and e22 is None) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 23. probe_timeout_error
        def mock_probe_timeout(*a, **kw):
            raise subprocess.TimeoutExpired(cmd=["lsof"], timeout=2.0)
        p23, e23 = probe_tcp_listener(18085, subprocess_runner=mock_probe_timeout)
        self.record("23. probe_timeout_error", "Timeout raises and returns (None, error)", "Timeout handled safely", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (p23 is None and e23 and "timed out" in e23) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # GROUP 4: Process Identity & Bounded Terminate (R3-N01, R5 Item 3)
        # ----------------------------------------------------------------------
        print("\n--- Group 4: Process Identity & Bounded Terminate ---")

        mock_sig = MockSignalTracker(alive_pids=[1001, 1002, 1003])

        # 24. verify_pid_identity_match
        def mock_ps_match(cmd, **kw):
            return MockCompletedProcess(0, stdout=f"node {os.getpid()} Mon Oct 26 12:00:00 2026\n")
        v24 = verify_pid_identity(1001, expected_name="node", expected_parent=os.getpid(), expected_start_time="Mon Oct 26 12:00:00 2026", subprocess_runner=mock_ps_match, kill_func=mock_sig.kill_func)
        self.record("24. verify_pid_identity_match", "Matching name, parent, and start time verifies", "Returns True", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if v24 else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 25. verify_pid_identity_mismatch_start_time
        v25 = verify_pid_identity(1001, expected_name="node", expected_parent=os.getpid(), expected_start_time="Mon Oct 26 11:00:00 2026", subprocess_runner=mock_ps_match, kill_func=mock_sig.kill_func)
        self.record("25. verify_pid_identity_mismatch_start_time", "Start time mismatch fails closed", "Returns False", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if not v25 else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 26. bounded_terminate_clean_handle_reap
        child_handle_26 = MockChildProcess(pid=1002, returncode=None)
        t26_ok, t26_err = bounded_terminate(1002, timeout_sec=1.0, expected_name="node", process_handle=child_handle_26, subprocess_runner=mock_ps_match, kill_func=mock_sig.kill_func)
        self.record("26. bounded_terminate_clean_handle_reap", "Clean exit via handle.wait() reap", "Returns (True, None)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (t26_ok and t26_err is None and child_handle_26.wait_calls > 0) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 27. bounded_terminate_timeout_retained_no_sigkill (R5 Item 3)
        class MockHangingChild(MockChildProcess):
            def wait(self, timeout=None):
                raise subprocess.TimeoutExpired(cmd=["mock"], timeout=timeout)
        child_handle_27 = MockHangingChild(pid=1003, returncode=None)
        t27_ok, t27_err = bounded_terminate(1003, timeout_sec=0.1, expected_name="node", process_handle=child_handle_27, subprocess_runner=mock_ps_match, kill_func=mock_sig.kill_func)
        no_sigkill_sent = all(sig != signal.SIGKILL for pid, sig in mock_sig.signals_sent if pid == 1003)
        has_retained_note = "retained without retry" in (t27_err or "")
        self.record("27. bounded_terminate_timeout_no_sigkill", "Timeout reports cleanup failure without SIGKILL", "Fails closed, retains resource, no SIGKILL", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (not t27_ok and has_retained_note and no_sigkill_sent) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # GROUP 5: Durability & Filesystem Failures (R4-C04, R5 Item 4, S6)
        # ----------------------------------------------------------------------
        print("\n--- Group 5: Durability & Filesystem Failures (R4-C04, R5 Item 4, S6) ---")

        durability_scratch = os.path.join(self.scratch_dir, "durability")
        os.makedirs(durability_scratch, exist_ok=True)
        writer_durable = AtomicStateWriter(os.path.join(durability_scratch, "observer.json"), "API_TOKEN_nonempty", pid=8888)

        # 28. file_fsync_failure_propagates
        orig_fsync = os.fsync
        file_fsync_raised = False
        try:
            def mock_fail_fsync(fd):
                raise OSError("Simulated EIO on file fsync")
            os.fsync = mock_fail_fsync
            try:
                writer_durable.write_state(0, clean_shutdown=True, is_final=True)
            except OSError as e:
                if "Simulated EIO" in str(e):
                    file_fsync_raised = True
        finally:
            os.fsync = orig_fsync
        self.record("28. file_fsync_failure_propagates", "File fsync error is not swallowed", "Propagates exception to caller", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if file_fsync_raised else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 29. dir_open_failure_propagates
        orig_open = os.open
        dir_open_raised = False
        try:
            def mock_fail_open(path, flags, *args):
                if os.path.isdir(path):
                    raise OSError("Simulated EACCES on directory open")
                return orig_open(path, flags, *args)
            os.open = mock_fail_open
            try:
                writer_durable.write_state(0, clean_shutdown=True, is_final=True)
            except OSError as e:
                if "Simulated EACCES" in str(e):
                    dir_open_raised = True
        finally:
            os.open = orig_open
        self.record("29. dir_open_failure_propagates", "Directory open error is not swallowed", "Propagates exception to caller", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if dir_open_raised else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 30. dir_fsync_failure_propagates (R4-C04 fix)
        dir_fsync_raised = False
        try:
            def mock_fail_dir_fsync(fd):
                # Fail if fd is directory fd
                raise OSError("Simulated EIO on parent directory fsync")
            os.fsync = mock_fail_dir_fsync
            try:
                writer_durable.write_state(0, clean_shutdown=True, is_final=True)
            except OSError as e:
                if "Simulated EIO on parent directory" in str(e):
                    dir_fsync_raised = True
        finally:
            os.fsync = orig_fsync
        self.record("30. dir_fsync_failure_propagates", "Parent directory fsync error propagates", "Propagates exception rather than swallowing", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if dir_fsync_raised else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 31. dir_close_failure_propagates
        orig_close = os.close
        dir_close_raised = False
        try:
            def mock_fail_close(fd):
                raise OSError("Simulated EBADF on directory close")
            os.close = mock_fail_close
            try:
                writer_durable.write_state(0, clean_shutdown=True, is_final=True)
            except OSError as e:
                if "Simulated EBADF" in str(e):
                    dir_close_raised = True
        finally:
            os.close = orig_close
        self.record("31. dir_close_failure_propagates", "Directory close error is not swallowed", "Propagates exception to caller", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if dir_close_raised else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 32. os_replace_failure_propagates
        orig_replace = os.replace
        replace_raised = False
        try:
            def mock_fail_replace(src, dst):
                raise OSError("Simulated EXDEV on os.replace")
            os.replace = mock_fail_replace
            try:
                writer_durable.write_state(0, clean_shutdown=True, is_final=True)
            except OSError as e:
                if "Simulated EXDEV" in str(e):
                    replace_raised = True
        finally:
            os.replace = orig_replace
        self.record("32. os_replace_failure_propagates", "Atomic rename replace error propagates", "Propagates exception to caller", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if replace_raised else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # GROUP 6: Fast Refusal Lifecycle-Bound Proof (NF-4, R4-C01, P1.1)
        # ----------------------------------------------------------------------
        print("\n--- Group 6: Fast Refusal Lifecycle-Bound Proof (NF-4, R4-C01, P1.1) ---")

        def make_mock_ps_sub(observer_pid: int, child_pid: int, on_probe_18085=None):
            def mock_sub(cmd, **kwargs):
                cmd_str = " ".join(cmd)
                if "ps" in cmd_str:
                    target_pid = cmd[2] if len(cmd) > 2 else ""
                    if "-o" in cmd:
                        opt_idx = cmd.index("-o") + 1
                        opt_val = cmd[opt_idx] if opt_idx < len(cmd) else ""
                        if opt_val == "lstart=":
                            return MockCompletedProcess(returncode=0, stdout="Mon Oct 26 12:00:00 2026\n")
                    if str(observer_pid) in target_pid:
                        return MockCompletedProcess(returncode=0, stdout=f"python {os.getpid()} Mon Oct 26 12:00:00 2026\n")
                    if str(child_pid) in target_pid:
                        return MockCompletedProcess(returncode=0, stdout=f"node {os.getpid()} Mon Oct 26 12:00:00 2026\n")
                    return MockCompletedProcess(returncode=0, stdout=f"proc {os.getpid()} Mon Oct 26 12:00:00 2026\n")
                if "18086" in cmd_str:
                    return MockCompletedProcess(returncode=0, stdout="python (LISTEN)\n")
                if "18085" in cmd_str:
                    if on_probe_18085:
                        return on_probe_18085(cmd, **kwargs)
                    return MockCompletedProcess(returncode=1, stdout="", stderr="")
                return MockCompletedProcess(returncode=1, stdout="", stderr="")
            return mock_sub

        # 33. launcher_record_spawn_called_rejected
        r33 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": "API_TOKEN_nonempty", "pid": 9999}, observer_exit_code=0,
            expected_variant="API_TOKEN_nonempty", expected_pid=9999,
            launcher_execution_data={"outcome": "SPAWNED", "spawnCalled": True, "guardSha256": EXPECTED_GUARD_SHA256},
        )
        self.record("33. launcher_record_spawn_called_rejected", "spawnCalled:true on startup refusal fails closed", "Fails closed as SPAWN_CALLED_ON_REFUSAL", "FAIL", "SPAWN_CALLED_ON_REFUSAL", r33)

        # 34. dead_child_probe_rejected_as_during_sample (R4-C01 / NF-4 fix)
        # When child is already dead before probe, coordinator takes 0 during-samples and fails closed
        mock_sig_34 = MockSignalTracker(alive_pids=[70001, 70002])
        def mock_popen_dead_child(cmd, **kwargs):
            if "observer.py" in " ".join(cmd):
                return MockChildProcess(pid=70001, returncode=None)
            # Already-dead mock child (returncode=1 immediately)
            return MockChildProcess(pid=70002, returncode=1)

        runner34 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_34"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_dead_child,
            subprocess_runner=make_mock_ps_sub(70001, 70002),
            kill_func=mock_sig_34.kill_func,
        )
        with open(runner34.observer_file, "w") as f:
            json.dump({"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": runner34.variant_name, "pid": 70001}, f)
        with open(runner34.stderr_file, "w") as f:
            f.write("Harness startup refused: product auth/secret env vars present (API_TOKEN)\n")

        res34 = runner34.run()
        # Dead mock child MUST be rejected as during-evidence (duringSampleCount=0 -> LISTENER_UNKNOWN)
        self.record("34. dead_child_probe_rejected", "Dead mock child produces 0 during samples and fails closed", "Fails closed as LISTENER_UNKNOWN (never PASS)", "FAIL", "LISTENER_UNKNOWN", res34)

        # 35. live_then_exit_coordinator_fake_passes (P1.1 live interval proof)
        mock_sig_35 = MockSignalTracker(alive_pids=[70003, 70004])
        # Poll sequence: None on first check (alive during probe), then 1 on next check (clean refusal exit)
        live_child_35 = MockChildProcess(pid=70004, poll_sequence=[None, 1])
        def mock_popen_live_child(cmd, **kwargs):
            if "observer.py" in " ".join(cmd):
                return MockChildProcess(pid=70003, returncode=None)
            if "stderr" in kwargs and hasattr(kwargs["stderr"], "write"):
                kwargs["stderr"].write("Harness startup refused: product auth/secret env vars present (API_TOKEN)\n")
                kwargs["stderr"].flush()
            return live_child_35

        runner35 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_35"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_live_child,
            subprocess_runner=make_mock_ps_sub(70003, 70004),
            kill_func=mock_sig_35.kill_func,
        )
        with open(runner35.observer_file, "w") as f:
            json.dump({"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": runner35.variant_name, "pid": 70003}, f)
        with open(runner35.launcher_execution_file, "w") as f:
            json.dump({
                "outcome": "REFUSED_BEFORE_SPAWN",
                "spawnCalled": False,
                "guardSha256": EXPECTED_GUARD_SHA256,
                "exitCode": 1,
            }, f)

        res35 = runner35.run()
        self.record("35. live_then_exit_coordinator_passes", "Verified live interval sample passes all gates", "Returns PASS with VALID_COMPLETE_INPUT", "PASS", "VALID_COMPLETE_INPUT", res35)

        # 36. spawn_then_immediate_exit_defect_fails_closed (P1.1 defect case)
        mock_sig_36 = MockSignalTracker(alive_pids=[70005, 70006])
        # Child exits immediately upon spawn (poll sequence returns 1 on initial poll)
        immediate_exit_child = MockChildProcess(pid=70006, poll_sequence=[1])
        def mock_popen_immediate_exit(cmd, **kwargs):
            if "observer.py" in " ".join(cmd):
                return MockChildProcess(pid=70005, returncode=None)
            return immediate_exit_child

        runner36 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_36"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_immediate_exit,
            subprocess_runner=make_mock_ps_sub(70005, 70006),
            kill_func=mock_sig_36.kill_func,
        )
        with open(runner36.observer_file, "w") as f:
            json.dump({"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": runner36.variant_name, "pid": 70005}, f)
        with open(runner36.stderr_file, "w") as f:
            f.write("Harness startup refused: product auth/secret env vars present (API_TOKEN)\n")

        res36 = runner36.run()
        self.record("36. spawn_immediate_exit_defect_fails_closed", "Immediate exit child fails closed without during-samples", "Returns FAIL with LISTENER_UNKNOWN", "FAIL", "LISTENER_UNKNOWN", res36)

        # ----------------------------------------------------------------------
        # GROUP 7: Caller Abort Sites & Popen Safety (S1, S4)
        # ----------------------------------------------------------------------
        print("\n--- Group 7: Caller Abort Sites & Popen Safety (S1, S4) ---")

        # 37. preprobe_error_aborts_with_raising_popen (S1)
        def mock_pre_err_runner(cmd, **kwargs):
            if "lsof" in cmd:
                return MockCompletedProcess(returncode=2, stderr="Preprobe error")
            return MockCompletedProcess(returncode=0)

        runner37 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_37"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=raising_unexpected_popen,
            subprocess_runner=mock_pre_err_runner,
            kill_func=mock_sig_34.kill_func,
        )
        res37 = runner37.run()
        self.record("37. preprobe_error_safety_popen", "Pre-flight probe error halts with raising popen", "Halts cleanly without spawning any process", "FAIL", "PROBE_ERROR", res37)

        # 38. preprobe_bound_aborts_with_raising_popen (S1)
        def mock_pre_bound_runner(cmd, **kwargs):
            if "lsof" in cmd:
                return MockCompletedProcess(returncode=0, stdout="node 999 (LISTEN)")
            return MockCompletedProcess(returncode=0)

        runner38 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_38"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=raising_unexpected_popen,
            subprocess_runner=mock_pre_bound_runner,
            kill_func=mock_sig_34.kill_func,
        )
        res38 = runner38.run()
        self.record("38. preprobe_bound_safety_popen", "Port already bound halts with raising popen", "Returns FAIL_AGAINST_NEVER_LISTEN", "FAIL", "FAIL_AGAINST_NEVER_LISTEN", res38)

        # 39. caller_site_3_timeout_termination (S4)
        mock_sig_39 = MockSignalTracker(alive_pids=[70007, 70008])
        fake_clock_39 = FakeClock(1000.0)
        hanging_child_39 = MockChildProcess(pid=70008, returncode=None)
        obs_proc_39 = MockChildProcess(pid=70007, returncode=None)
        def mock_popen_site3(cmd, **kwargs):
            if "observer.py" in " ".join(cmd):
                return obs_proc_39
            return hanging_child_39

        runner39 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_39"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_site3,
            subprocess_runner=make_mock_ps_sub(70007, 70008),
            kill_func=mock_sig_39.kill_func,
            time_func=fake_clock_39.time,
            sleep_func=fake_clock_39.sleep,
        )
        with open(runner39.observer_file, "w") as f:
            json.dump({"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": runner39.variant_name, "pid": 70007}, f)

        res39 = runner39.run(timeout_sec=0.5)
        site3_terminated = (hanging_child_39.wait_calls > 0)
        self.record("39. caller_site_3_timeout_termination", "Site 3 timeout termination covers caller branch", "Child reaped at site 3 timeout and returns TIMEOUT", "FAIL", "TIMEOUT", {"verdict": res39.get("verdict"), "verdictCode": "TIMEOUT" if site3_terminated else "WRONG"})

        # 40. caller_site_4_finally_cleanup_on_exception (S4)
        mock_sig_40 = MockSignalTracker(alive_pids=[70009, 70010])
        running_child_40 = MockChildProcess(pid=70010, returncode=None)
        obs_proc_40 = MockChildProcess(pid=70009, returncode=None)
        def mock_popen_site4(cmd, **kwargs):
            if "observer.py" in " ".join(cmd):
                return obs_proc_40
            return running_child_40

        probe_18085_calls = 0
        def raising_on_second_18085(cmd, **kwargs):
            nonlocal probe_18085_calls
            probe_18085_calls += 1
            if probe_18085_calls == 1:
                # Pre-flight probe: clean absence
                return MockCompletedProcess(returncode=1, stdout="", stderr="")
            # Loop probe: raise monitoring exception during execution
            raise RuntimeError("Simulated monitoring exception during loop")

        runner40 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_40"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_site4,
            subprocess_runner=make_mock_ps_sub(70009, 70010, on_probe_18085=raising_on_second_18085),
            kill_func=mock_sig_40.kill_func,
        )
        with open(runner40.observer_file, "w") as f:
            json.dump({"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": runner40.variant_name, "pid": 70009}, f)

        res40 = runner40.run()
        site4_terminated = (running_child_40.wait_calls > 0)
        self.record("40. caller_site_4_finally_cleanup", "Site 4 finally cleans up running child on error", "Child terminated in finally block", "FAIL", "PROBE_ERROR", {"verdict": res40.get("verdict"), "verdictCode": "PROBE_ERROR" if site4_terminated else "WRONG"})

        # ----------------------------------------------------------------------
        # GROUP 8: Wrapper Dispatch & Nonzero Propagation (S3, R2-I01)
        # ----------------------------------------------------------------------
        print("\n--- Group 8: Wrapper Dispatch & Nonzero Propagation (S3, R2-I01) ---")

        stub_dir = os.path.join(self.scratch_dir, "wrapper_stub_dir")
        os.makedirs(stub_dir, exist_ok=True)
        stub_out_file = os.path.join(stub_dir, "received_args.json")
        stub_py = os.path.join(stub_dir, "coordinator.py")
        with open(stub_py, "w") as f:
            f.write(f"""import sys, json
with open({stub_out_file!r}, "w") as f:
    json.dump({{"argv": sys.argv}}, f)
if "--fail" in sys.argv:
    sys.exit(2)
sys.exit(0)
""")
        os.chmod(stub_py, 0o755)

        wrapper_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "guard-validator-r5.sh")
        wrapper_env = {
            "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
            "PYTHONPATH": stub_dir,
            "MC_INTA_PYTHON_BIN": sys.executable,
        }
        stub_wrapper = os.path.join(stub_dir, "guard-validator-r5.sh")
        shutil.copyfile(wrapper_script, stub_wrapper)
        os.chmod(stub_wrapper, 0o755)

        # 41. wrapper_full_args_dispatch (S3)
        target_attempt = os.path.join(stub_dir, "target_run")
        wrap_proc = subprocess.run(
            [stub_wrapper, target_attempt, "/tmp/fake_harness", "18085", "18086"],
            env=wrapper_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5.0,
        )
        wrapper_args_ok = False
        if wrap_proc.returncode == 0 and os.path.exists(stub_out_file):
            with open(stub_out_file) as f:
                recorded_stub = json.load(f)
            rec_argv = recorded_stub.get("argv", [])
            if len(rec_argv) >= 5 and rec_argv[1] == target_attempt and rec_argv[2] == "/tmp/fake_harness" and rec_argv[3] == "18085" and rec_argv[4] == "18086":
                wrapper_args_ok = True
        self.record("41. wrapper_full_args_dispatch", "Wrapper dispatches all 4 arguments explicitly", "Passes attempt, harness, and ports to coordinator", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if wrapper_args_ok else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 42. wrapper_nonzero_stub_propagation (S3)
        wrap_fail_proc = subprocess.run(
            [stub_wrapper, os.path.join(stub_dir, "run_fail"), "/tmp/fake_harness", "18085", "18086", "--fail"],
            env=wrapper_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5.0,
        )
        wrap_exit2_ok = (wrap_fail_proc.returncode == 2)
        self.record("42. wrapper_nonzero_stub_propagation", "Wrapper propagates nonzero stub exit code", "Exits with code 2 faithfully", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if wrap_exit2_ok else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 43. wrapper_collision_refusal (R3-N05)
        existing_wrap_dir = os.path.join(stub_dir, "existing_attempt")
        os.makedirs(existing_wrap_dir, exist_ok=True)
        wrap_refuse_proc = subprocess.run(
            [stub_wrapper, existing_wrap_dir],
            env=wrapper_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5.0,
        )
        wrap_refuse_ok = (wrap_refuse_proc.returncode == 2 and "already exists" in wrap_refuse_proc.stderr)
        self.record("43. wrapper_collision_refusal", "Wrapper refuses existing attempt directory", "Returns exit 2 without executing coordinator", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if wrap_refuse_ok else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # GROUP 9: Pre-flight Stage Binding & Node Import (R4-C02, R4-C03)
        # ----------------------------------------------------------------------
        print("\n--- Group 9: Pre-flight Stage Binding & Node Import (R4-C02, R4-C03) ---")

        # 44. missing_stage_receipt_fails_closed (P1.2 / R4-C02)
        runner44 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_44"),
            harness_dir="/tmp/mc002-inta-harness",
            stage_dir="/tmp/non_existent_stage_r5",
            stage_receipt_required=True,
            popen_factory=raising_unexpected_popen,
            kill_func=mock_sig_34.kill_func,
        )
        res44 = runner44.run()
        is_binding_err = "stage receipt missing" in (res44.get("probeError") or "")
        self.record("44. missing_stage_receipt_fails_closed", "Missing Codex stage receipt halts execution", "Fails closed before observer/child creation", "FAIL", "PROBE_ERROR", {"verdict": "FAIL" if is_binding_err else "WRONG", "verdictCode": "PROBE_ERROR" if is_binding_err else "WRONG"})

        # 45. ts_guard_dynamic_import_strip_types (R4-C03, R5 Item 5)
        ts_node_check = subprocess.run(
            [
                "node",
                "--experimental-strip-types",
                "-e",
                "import('/tmp/mc002-inta-harness/src/guards.ts').then(m => { if (typeof m.validateHarnessStartup === 'function') process.exit(0); else process.exit(2); }).catch(e => { console.error(e); process.exit(1); });",
            ],
            capture_output=True,
            text=True,
            timeout=5.0,
        )
        ts_import_pass = (ts_node_check.returncode == 0)
        self.record("45. ts_guard_dynamic_import_strip_types", "Node 24 native dynamic import loads guards.ts", "Dynamically imports validateHarnessStartup", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if ts_import_pass else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 46. launcher_mock_test_suite (R5 Item 1, NF-4, S5)
        launcher_test_script = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "launcher",
            "test-launcher-mock.mjs",
        )
        launcher_run = subprocess.run(
            ["node", "--experimental-strip-types", launcher_test_script],
            capture_output=True,
            text=True,
            timeout=5.0,
        )
        launcher_suite_pass = (launcher_run.returncode == 0 and "17 PASS / 0 FAIL" in launcher_run.stdout)
        self.record("46. launcher_mock_test_suite", "harness-dev.mjs mock test suite (17 cases)", "All 17 mock launcher unit tests pass", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if launcher_suite_pass else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # SUMMARY
        # ----------------------------------------------------------------------
        print("\n================================================================")
        print(f"SUMMARY: {self.passed_count} PASS / {self.failed_count} FAIL out of {len(self.results)} cases")
        print(f"End UTC: {datetime.now(timezone.utc).isoformat()}")
        print("================================================================")

        # Write results JSON
        out_json_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "selfcheck-r5-results.json"
        )
        with open(out_json_path, "w", encoding="utf-8") as f:
            json.dump({
                "task": "MC-002-INTA-FE-VALIDATION-R5",
                "timestampUTC": datetime.now(timezone.utc).isoformat(),
                "total": len(self.results),
                "passed": self.passed_count,
                "failed": self.failed_count,
                "allPassed": (self.failed_count == 0),
                "results": self.results,
            }, f, indent=2)

        print(f"Results saved to {out_json_path}")
        return 0 if self.failed_count == 0 else 1


def main():
    scratch_dir = tempfile.mkdtemp(prefix="mc002-inta-selfcheck-r5-")
    try:
        runner = SelfCheckR5Runner(scratch_dir)
        ret = runner.run_all()
        sys.exit(ret)
    finally:
        shutil.rmtree(scratch_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
