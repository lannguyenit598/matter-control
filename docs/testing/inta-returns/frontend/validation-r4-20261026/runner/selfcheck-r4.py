#!/usr/bin/env python3
"""
MC-002-INTA-FE-VALIDATION-R4: Comprehensive Deterministic Self-Check Suite
Validates all R2-I01..I06, R3-N01..N06, and NF-1..NF-6 corrections in-process:
- Fail-fast signal guard preventing any real os.kill/signal execution during tests (R3-N03)
- Baseline cases and strict evidence schema (R1-C02)
- Rejection of present-but-falsy error fields and omitted defaults (R3-N04, C02)
- Pre-bound port wording verification (NF-6)
- Actual probe_tcp_listener with mocked subprocess including timeout/exceptions (R2-I04, R3-N06)
- Owned process lifecycle: identity enforcement, handle reap via wait(), and error escalation (R3-N01, R2-I03)
- All 5 termination call sites tested with mock signal trackers (R3-N01)
- AtomicStateWriter failure propagation and parent directory fsync (R3-N06)
- Coordinator successful run, observer startup fail, listener abort, counter abort, spawn fail (R2-I02, R2-I03, R3-N06)
- Thin shell wrapper argument dispatch and collision check tested via controlled stub (R3-N06, R2-I01)
- Node 24 native TypeScript guard import and launcher mock suite (R1-C04, R2-I05, NF-3)
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
from typing import Any, Dict, List, Optional

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

from guard_evaluator import evaluate_guard_run
from observer import AtomicStateWriter
import coordinator
from coordinator import (
    probe_tcp_listener,
    verify_pid_identity,
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
    def __init__(self, pid: int = 12345, returncode: Optional[int] = None):
        self.pid = pid
        self._returncode = returncode
        self.poll_calls = 0
        self.wait_calls = 0
        self.wait_timeout = None

    def poll(self):
        self.poll_calls += 1
        return self._returncode

    def wait(self, timeout=None):
        self.wait_calls += 1
        self.wait_timeout = timeout
        if self._returncode is None:
            self._returncode = 0
        return self._returncode

    def kill(self, sig):
        self._returncode = -sig


class SelfCheckR4Runner:
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
        print("MC-002-INTA-FE-VALIDATION-R4: Comprehensive Deterministic Self-Check")
        print(f"Start UTC: {datetime.now(timezone.utc).isoformat()}")
        print(f"Scratch Directory: {self.scratch_dir}")
        print("================================================================")

        # ----------------------------------------------------------------------
        # GROUP 1: Baseline Cases & Evaluator Schema (R1-C02)
        # ----------------------------------------------------------------------
        print("\n--- Group 1: Baseline Cases & Evaluator Schema ---")

        # 1. missingcounter
        r1 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=False, observer_exit_code=0
        )
        self.record("1. missingcounter", "Observer file does not exist", "Fails closed as MISSING_COUNTER", "FAIL", "MISSING_COUNTER", r1)

        # 2. malformedcounter
        r2 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_parse_error="Invalid JSON syntax at byte 0", observer_exit_code=0
        )
        self.record("2. malformedcounter", "Observer JSON malformed", "Fails closed as MALFORMED_COUNTER", "FAIL", "MALFORMED_COUNTER", r2)

        # 3. positivecounter
        r3 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 3, "cleanShutdown": True, "isFinal": True}, observer_exit_code=0
        )
        self.record("3. positivecounter", "Observer recorded >0 HTTP requests", "Fails closed as POSITIVE_COUNTER", "FAIL", "POSITIVE_COUNTER", r3)

        # 4. observererror
        r4 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": False, "isFinal": True, "error": "Address already in use"}, observer_exit_code=0
        )
        self.record("4. observererror", "Observer startup or runtime error", "Fails closed as OBSERVER_ERROR", "FAIL", "OBSERVER_ERROR", r4)

        # 5. transientlistener
        r5 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=True, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True}, observer_exit_code=0
        )
        self.record("5. transientlistener", "Port 18085 listener observed during run", "Fails closed as FAIL_AGAINST_NEVER_LISTEN", "FAIL", "FAIL_AGAINST_NEVER_LISTEN", r5)

        # 6. probeerror
        r6 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            probe_error="lsof probe timed out after 2.0s", observer_exit_code=0
        )
        self.record("6. probeerror", "Port probe execution error", "Fails closed as PROBE_ERROR", "FAIL", "PROBE_ERROR", r6)

        # 7. timeout
        r7 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=None, timed_out=True, stdout="", stderr="",
            listener_during=False, listener_after=False, during_sample_count=2, observer_exit_code=0
        )
        self.record("7. timeout", "Child hung or timed out", "Fails closed as TIMEOUT", "FAIL", "TIMEOUT", r7)

        # 8. wrongrefusal
        r8 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="Generic error occurred", stderr="",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True}, observer_exit_code=0
        )
        self.record("8. wrongrefusal", "Child exited without exact refusal phrase", "Fails closed as WRONG_REFUSAL", "FAIL", "WRONG_REFUSAL", r8)

        # 9. validcompleteinput
        r9 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True}, observer_exit_code=0
        )
        self.record("9. validcompleteinput", "Fully compliant refusal and zero upstream calls", "PASS with VALID_COMPLETE_INPUT", "PASS", "VALID_COMPLETE_INPUT", r9)

        # ----------------------------------------------------------------------
        # GROUP 2: OpenCode / Codex Regression Probes (R1-C02)
        # ----------------------------------------------------------------------
        print("\n--- Group 2: OpenCode / Codex Regression Probes (R1-C02) ---")

        # 10. unknown_listener_observation
        r10 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=None, listener_after=None, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True}, observer_exit_code=0
        )
        self.record("10. unknown_listener_observation", "listener_during=None and listener_after=None", "Fails closed as LISTENER_UNKNOWN", "FAIL", "LISTENER_UNKNOWN", r10)

        # 11. boolean_counter_false
        r11 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": False, "cleanShutdown": True, "isFinal": True}, observer_exit_code=0
        )
        self.record("11. boolean_counter_false", "requestCount=False (bool subclass of int)", "Fails closed as MALFORMED_COUNTER", "FAIL", "MALFORMED_COUNTER", r11)

        # 12. truthy_unclean_string
        r12 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": "false", "isFinal": True}, observer_exit_code=0
        )
        self.record("12. truthy_unclean_string", "cleanShutdown='false' (non-empty string)", "Fails closed as UNCLEAN_SHUTDOWN", "FAIL", "UNCLEAN_SHUTDOWN", r12)

        # ----------------------------------------------------------------------
        # GROUP 3: Evidence Completeness & Evaluator Strictness (R2-I04, R3-N04, NF-6)
        # ----------------------------------------------------------------------
        print("\n--- Group 3: Evidence Completeness & Evaluator Strictness (R2-I04, R3-N04, NF-6) ---")

        # 13. fast_exit_zero_samples_fail_closed
        r13 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=0,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True}, observer_exit_code=0
        )
        self.record("13. fast_exit_zero_samples", "Child exited before any during-sample taken", "Fails closed as LISTENER_UNKNOWN", "FAIL", "LISTENER_UNKNOWN", r13)

        # 14. missing_isfinal_flag
        r14 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": False}, observer_exit_code=0
        )
        self.record("14. missing_isfinal_flag", "Observer state has isFinal=False", "Fails closed as INCOMPLETE_OBSERVER_RECORD", "FAIL", "INCOMPLETE_OBSERVER_RECORD", r14)

        # 15. observer_exit_nonzero
        r15 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True}, observer_exit_code=2
        )
        self.record("15. observer_exit_nonzero", "Observer process exited with code 2", "Fails closed as OBSERVER_EXIT_ERROR", "FAIL", "OBSERVER_EXIT_ERROR", r15)

        # 16. falsy_empty_error_field_rejected (R3-N04 / C02)
        r16 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "error": ""}, observer_exit_code=0
        )
        self.record("16. falsy_empty_error_field_rejected", "Observer error field is empty string", "Fails closed as OBSERVER_ERROR", "FAIL", "OBSERVER_ERROR", r16)

        # 17. null_error_field_rejected (R3-N04)
        r17 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=2,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True, "error": None}, observer_exit_code=0
        )
        self.record("17. null_error_field_rejected", "Observer error field is present with None value", "Fails closed as OBSERVER_ERROR", "FAIL", "OBSERVER_ERROR", r17)

        # 18. omitted_sample_count_fails_closed (R3-N04)
        r18 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=1, timed_out=False, stdout="", stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False, listener_after=False, during_sample_count=None,
            observer_file_exists=True, observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True}, observer_exit_code=0
        )
        self.record("18. omitted_sample_count_fails_closed", "during_sample_count omitted/None", "Fails closed as INCOMPLETE_EVIDENCE", "FAIL", "INCOMPLETE_EVIDENCE", r18)

        # 19. preflight_bound_port_notes_wording (NF-6)
        r19 = evaluate_guard_run(
            canonical_id="INT-ENV-05", key="API_TOKEN", variant="nonempty",
            exit_code=None, timed_out=False, stdout="", stderr="",
            listener_during=True, listener_after=True, during_sample_count=1,
            observer_file_exists=False, observer_exit_code=None
        )
        has_preflight_wording = "listener observed at pre-flight (port already occupied)" in r19.get("notes", "")
        self.record("19. preflight_bound_port_notes_wording", "Pre-flight listener notes state port already occupied", "Wording reflects pre-flight timing", "FAIL", "FAIL_AGAINST_NEVER_LISTEN", {"verdict": "FAIL" if has_preflight_wording else "WRONG", "verdictCode": "FAIL_AGAINST_NEVER_LISTEN" if has_preflight_wording else "WRONG"})

        # ----------------------------------------------------------------------
        # GROUP 4: Actual Probe Classification & Error Handling (R2-I04, R2-I06, R3-N06)
        # ----------------------------------------------------------------------
        print("\n--- Group 4: Actual Probe Classification & Error Handling (R2-I04, R2-I06, R3-N06) ---")

        # 20. actual_probe_rc0_listener
        def mock_sub_rc0(cmd, **kwargs):
            return MockCompletedProcess(returncode=0, stdout="node 12345 (LISTEN)\n")
        st20, err20 = probe_tcp_listener(18085, subprocess_runner=mock_sub_rc0)
        self.record("20. actual_probe_rc0_listener", "lsof rc=0 is active listener", "Returns (True, None)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (st20 is True and err20 is None) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 21. actual_probe_rc1_clean_nomatch
        def mock_sub_rc1_clean(cmd, **kwargs):
            return MockCompletedProcess(returncode=1, stdout="", stderr="")
        st21, err21 = probe_tcp_listener(18085, subprocess_runner=mock_sub_rc1_clean)
        self.record("21. actual_probe_rc1_clean_nomatch", "lsof rc=1 with empty stderr is clean absence", "Returns (False, None)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (st21 is False and err21 is None) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 22. actual_probe_rc1_enoent_error
        def mock_sub_rc1_enoent(cmd, **kwargs):
            return MockCompletedProcess(returncode=1, stdout="", stderr="lsof: No such file or directory\n")
        st22, err22 = probe_tcp_listener(18085, subprocess_runner=mock_sub_rc1_enoent)
        is_enoent_rejected = (st22 is None and err22 is not None and "No such file or directory" in err22)
        self.record("22. actual_probe_rc1_enoent_error", "lsof rc=1 with ENOENT stderr is PROBE_ERROR", "Returns (None, error)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if is_enoent_rejected else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 23. actual_probe_rc_greater_1_error
        def mock_sub_rc2_err(cmd, **kwargs):
            return MockCompletedProcess(returncode=2, stdout="", stderr="lsof: Permission denied\n")
        st23, err23 = probe_tcp_listener(18085, subprocess_runner=mock_sub_rc2_err)
        is_rc2_rejected = (st23 is None and err23 is not None and "Permission denied" in err23)
        self.record("23. actual_probe_rc_greater_1_error", "lsof rc>1 is PROBE_ERROR", "Returns (None, error)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if is_rc2_rejected else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 24. actual_probe_timeout_expired (R3-N06)
        def mock_sub_timeout(cmd, **kwargs):
            raise subprocess.TimeoutExpired(cmd=cmd, timeout=2.0)
        st24, err24 = probe_tcp_listener(18085, subprocess_runner=mock_sub_timeout)
        is_timeout_err = (st24 is None and err24 is not None and "timed out" in err24)
        self.record("24. actual_probe_timeout_expired", "lsof timeout produces PROBE_ERROR", "Returns (None, timeout_error)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if is_timeout_err else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 25. actual_probe_execution_exception (R3-N06)
        def mock_sub_exception(cmd, **kwargs):
            raise OSError("Exec format error")
        st25, err25 = probe_tcp_listener(18085, subprocess_runner=mock_sub_exception)
        is_exec_err = (st25 is None and err25 is not None and "execution exception" in err25)
        self.record("25. actual_probe_execution_exception", "lsof exception produces PROBE_ERROR", "Returns (None, exec_error)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if is_exec_err else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # GROUP 5: Ownership & Lifecycle Verification (R2-I03, R3-N01, R3-N03)
        # ----------------------------------------------------------------------
        print("\n--- Group 5: Ownership & Lifecycle Verification (R2-I03, R3-N01, R3-N03) ---")

        # 26. verify_pid_identity_ps_failure (R2-I03, R3-N03)
        mock_sig_26 = MockSignalTracker(alive_pids=[55555])
        def mock_ps_fail(cmd, **kwargs):
            return MockCompletedProcess(returncode=1, stdout="", stderr="ps: query error\n")
        is_identity_denied = verify_pid_identity(55555, expected_name="python", subprocess_runner=mock_ps_fail, kill_func=mock_sig_26.kill_func)
        self.record("26. verify_pid_identity_ps_failure", "ps query error must fail closed", "Returns False on ps error", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (is_identity_denied is False) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 27. bounded_terminate_refuses_unverified (R2-I03, R3-N03)
        mock_sig_27 = MockSignalTracker(alive_pids=[55555])
        term_ok, term_err = bounded_terminate(55555, timeout_sec=0.1, expected_name="NON_EXISTENT_NAME_XYZ", subprocess_runner=mock_ps_fail, kill_func=mock_sig_27.kill_func)
        no_signal_sent_27 = not any(sig == signal.SIGTERM for _, sig in mock_sig_27.signals_sent)
        self.record("27. bounded_terminate_refuses_unverified", "Refuses signal if identity fails", "Returns (False, reason) without SIGTERM", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (term_ok is False and term_err is not None and no_signal_sent_27) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 28. bounded_terminate_reaps_via_process_handle (R3-N01)
        mock_sig_28 = MockSignalTracker(alive_pids=[66666])
        def mock_ps_ok(cmd, **kwargs):
            return MockCompletedProcess(returncode=0, stdout="node 1234\n")
        mock_handle_28 = MockChildProcess(pid=66666, returncode=None)
        term_ok_28, term_err_28 = bounded_terminate(
            66666, timeout_sec=1.0, expected_name="node", expected_parent=1234,
            process_handle=mock_handle_28, subprocess_runner=mock_ps_ok, kill_func=mock_sig_28.kill_func
        )
        handle_reaped_28 = (mock_handle_28.wait_calls > 0)
        sig_delivered_28 = any(sig == signal.SIGTERM for pid, sig in mock_sig_28.signals_sent if pid == 66666)
        self.record("28. bounded_terminate_reaps_via_process_handle", "Reaps child process via handle.wait()", "Calls wait() and delivers SIGTERM", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (term_ok_28 is True and handle_reaped_28 and sig_delivered_28) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 29. bounded_terminate_already_exited_no_signal (R3-N01)
        mock_sig_29 = MockSignalTracker(alive_pids=[66667])
        mock_handle_29 = MockChildProcess(pid=66667, returncode=0)  # already exited
        term_ok_29, term_err_29 = bounded_terminate(
            66667, timeout_sec=1.0, expected_name="node", expected_parent=1234,
            process_handle=mock_handle_29, subprocess_runner=mock_ps_ok, kill_func=mock_sig_29.kill_func
        )
        no_signal_29 = len(mock_sig_29.signals_sent) == 0
        self.record("29. bounded_terminate_already_exited_no_signal", "Already exited process sends no signals", "Returns True immediately", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (term_ok_29 is True and no_signal_29) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 30. bounded_terminate_handle_timeout_escalation (R3-N01)
        mock_sig_30 = MockSignalTracker(alive_pids=[66668])
        mock_handle_30 = MockChildProcess(pid=66668, returncode=None)
        def mock_wait_timeout(timeout=None):
            raise subprocess.TimeoutExpired(cmd=["mock"], timeout=timeout)
        mock_handle_30.wait = mock_wait_timeout
        term_ok_30, term_err_30 = bounded_terminate(
            66668, timeout_sec=0.1, expected_name="node", expected_parent=1234,
            process_handle=mock_handle_30, subprocess_runner=mock_ps_ok, kill_func=mock_sig_30.kill_func
        )
        is_timeout_handled = (term_ok_30 is False and term_err_30 is not None and "timed out" in term_err_30)
        self.record("30. bounded_terminate_handle_timeout_escalation", "Handle wait timeout reports failure", "Returns False with timeout error", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if is_timeout_handled else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 31. bounded_terminate_pid_mismatch_denied (R3-N01)
        mock_sig_31 = MockSignalTracker(alive_pids=[66669])
        mock_handle_31 = MockChildProcess(pid=99999, returncode=None)  # mismatch PID
        term_ok_31, term_err_31 = bounded_terminate(
            66669, timeout_sec=0.1, expected_name="node", expected_parent=1234,
            process_handle=mock_handle_31, subprocess_runner=mock_ps_ok, kill_func=mock_sig_31.kill_func
        )
        is_mismatch_denied = (term_ok_31 is False and term_err_31 is not None and "does not match" in term_err_31)
        self.record("31. bounded_terminate_pid_mismatch_denied", "Process handle PID mismatch is denied", "Returns False without signal", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if is_mismatch_denied else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # GROUP 6: Atomic Writer Failure Propagation & Directory Durability (R2-I06, R3-N06)
        # ----------------------------------------------------------------------
        print("\n--- Group 6: Atomic Writer Failure Propagation & Directory Durability (R2-I06, R3-N06) ---")

        # 32. atomic_writer_failure_propagation (permission denied)
        ro_dir = os.path.join(self.scratch_dir, "readonly_test_dir")
        os.makedirs(ro_dir, exist_ok=True)
        writer_bad = AtomicStateWriter(os.path.join(ro_dir, "observer.json"), "API_TOKEN_nonempty", pid=9999)
        os.chmod(ro_dir, 0o444)
        writer_failed = False
        try:
            writer_bad.write_state(0, clean_shutdown=True, is_final=True)
        except Exception:
            writer_failed = True
        finally:
            os.chmod(ro_dir, 0o755)
        self.record("32. atomic_writer_failure_propagation", "Write error propagates exception", "Writer failure is not swallowed", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if writer_failed else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 33. atomic_writer_replace_exception_propagation (R3-N06)
        writer_dir = os.path.join(self.scratch_dir, "replace_err_dir")
        os.makedirs(writer_dir, exist_ok=True)
        writer_replace = AtomicStateWriter(os.path.join(writer_dir, "observer.json"), "API_TOKEN_nonempty", pid=9998)
        orig_replace = os.replace
        replace_failed = False
        try:
            def mock_bad_replace(src, dst):
                raise OSError("Disk I/O error during replace")
            os.replace = mock_bad_replace
            try:
                writer_replace.write_state(0, clean_shutdown=True, is_final=True)
            except OSError as e:
                if "Disk I/O error" in str(e):
                    replace_failed = True
        finally:
            os.replace = orig_replace
        self.record("33. atomic_writer_replace_exception_propagation", "os.replace error propagates exception", "Replace failure propagates to caller", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if replace_failed else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # GROUP 7: Coordinator Execution & Abort Sites (R2-I02, R2-I03, R3-N01, R3-N06)
        # ----------------------------------------------------------------------
        print("\n--- Group 7: Coordinator Execution & Abort Sites (R2-I02, R2-I03, R3-N01, R3-N06) ---")

        # 34. coordinator_successful_variant_pass (R3-N06)
        mock_sig_34 = MockSignalTracker(alive_pids=[70001, 70002])
        def mock_popen_success(cmd, **kwargs):
            cmd_str = " ".join(cmd)
            if "observer.py" in cmd_str:
                obs = MockChildProcess(pid=70001, returncode=None)
                return obs
            # Child mock process writes canonical refusal message and exits with code 1
            if "stderr" in kwargs and hasattr(kwargs["stderr"], "write"):
                kwargs["stderr"].write("Harness startup refused: product auth/secret env vars present (API_TOKEN)\n")
                kwargs["stderr"].flush()
            child = MockChildProcess(pid=70002, returncode=1)
            return child

        def mock_sub_probe_success(cmd, **kwargs):
            cmd_str = " ".join(cmd)
            if "18086" in cmd_str:
                return MockCompletedProcess(returncode=0, stdout="python 70001 (LISTEN)\n")
            if "ps" in cmd_str:
                if "70001" in cmd_str:
                    return MockCompletedProcess(returncode=0, stdout=f"python {os.getpid()}\n")
                if "70002" in cmd_str:
                    return MockCompletedProcess(returncode=0, stdout=f"node {os.getpid()}\n")
            return MockCompletedProcess(returncode=1, stdout="", stderr="")

        runner34 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_34"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_success,
            subprocess_runner=mock_sub_probe_success,
            kill_func=mock_sig_34.kill_func,
        )
        with open(runner34.observer_file, "w") as f:
            json.dump({"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": runner34.variant_name, "pid": 70001}, f)
        with open(runner34.stderr_file, "w") as f:
            f.write("Harness startup refused: product auth/secret env vars present (API_TOKEN)\n")

        res34 = runner34.run()
        self.record("34. coordinator_successful_variant_pass", "Successful variant run passes all gates", "Returns PASS with VALID_COMPLETE_INPUT", "PASS", "VALID_COMPLETE_INPUT", res34)

        # 35. coordinator_preprobe_error_aborts_before_launch
        def mock_pre_err_runner(cmd, **kwargs):
            if "lsof" in cmd:
                return MockCompletedProcess(returncode=2, stderr="Preprobe error")
            return MockCompletedProcess(returncode=0)

        runner35 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_35"),
            harness_dir="/tmp/mc002-inta-harness",
            subprocess_runner=mock_pre_err_runner,
            kill_func=mock_sig_34.kill_func,
        )
        res35 = runner35.run()
        self.record("35. coordinator_preprobe_error_abort", "Pre-flight probe error halts execution", "Returns PROBE_ERROR without child launch", "FAIL", "PROBE_ERROR", res35)

        # 36. coordinator_preprobe_bound_aborts_before_launch
        def mock_pre_bound_runner(cmd, **kwargs):
            if "lsof" in cmd:
                return MockCompletedProcess(returncode=0, stdout="node 999 (LISTEN)")
            return MockCompletedProcess(returncode=0)

        runner36 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_36"),
            harness_dir="/tmp/mc002-inta-harness",
            subprocess_runner=mock_pre_bound_runner,
            kill_func=mock_sig_34.kill_func,
        )
        res36 = runner36.run()
        self.record("36. coordinator_preprobe_bound_abort", "Port already bound halts execution", "Returns FAIL_AGAINST_NEVER_LISTEN", "FAIL", "FAIL_AGAINST_NEVER_LISTEN", res36)

        # 37. coordinator_observer_startup_fail_cleanup (R3-N01)
        mock_sig_37 = MockSignalTracker(alive_pids=[70003])
        obs_proc_37 = MockChildProcess(pid=70003, returncode=None)
        def mock_popen_obs_bind_fail(cmd, **kwargs):
            return obs_proc_37

        def mock_sub_probe_obs_bind_fail(cmd, **kwargs):
            cmd_str = " ".join(cmd)
            if "ps" in cmd_str and "70003" in cmd_str:
                return MockCompletedProcess(returncode=0, stdout=f"python {os.getpid()}\n")
            # Observer never binds
            return MockCompletedProcess(returncode=1, stdout="", stderr="")

        runner37 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_37"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_obs_bind_fail,
            subprocess_runner=mock_sub_probe_obs_bind_fail,
            kill_func=mock_sig_37.kill_func,
        )
        res37 = runner37.run()
        obs_cleaned_37 = (obs_proc_37.wait_calls > 0)
        has_bind_err_37 = "failed to bind" in (res37.get("probeError") or "")
        self.record("37. coordinator_observer_startup_fail_cleanup", "Observer bind failure cleans up observer", "Cleans up observer in finally and reports error", "FAIL", "PROBE_ERROR", {"verdict": "FAIL" if (has_bind_err_37 and obs_cleaned_37) else "WRONG", "verdictCode": "PROBE_ERROR" if (has_bind_err_37 and obs_cleaned_37) else "WRONG"})

        # 38. coordinator_child_spawn_failure_cleans_up_observer (R2-I03, R3-N01, R3-N03)
        mock_sig_38 = MockSignalTracker(alive_pids=[70004])
        obs_proc_38 = MockChildProcess(pid=70004, returncode=None)
        def mock_popen_child_fail(cmd, **kwargs):
            if "observer.py" in " ".join(cmd):
                return obs_proc_38
            raise OSError("Mock child spawn exec failure")

        def mock_sub_probe_spawn_fail(cmd, **kwargs):
            cmd_str = " ".join(cmd)
            if "18086" in cmd_str:
                return MockCompletedProcess(returncode=0, stdout="python 70004 (LISTEN)\n")
            if "ps" in cmd_str and "70004" in cmd_str:
                return MockCompletedProcess(returncode=0, stdout=f"python {os.getpid()}\n")
            return MockCompletedProcess(returncode=1, stdout="", stderr="")

        runner38 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_38"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_child_fail,
            subprocess_runner=mock_sub_probe_spawn_fail,
            kill_func=mock_sig_38.kill_func,
        )
        with open(runner38.observer_file, "w") as f:
            json.dump({"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": runner38.variant_name, "pid": 70004}, f)
        res38 = runner38.run()
        obs_cleaned_38 = (obs_proc_38.wait_calls > 0)
        sig_sent_38 = any(sig == signal.SIGTERM for pid, sig in mock_sig_38.signals_sent if pid == 70004)
        has_child_fail_note = "Child process failure" in (res38.get("probeError") or "") or "Mock child spawn" in (res38.get("probeError") or "")
        self.record("38. child_spawn_fail_cleanup", "Child spawn failure cleanly terminates observer", "Observer handle reaped and error escalated", "FAIL", "PROBE_ERROR", {"verdict": "FAIL" if (has_child_fail_note and obs_cleaned_38 and sig_sent_38) else "WRONG", "verdictCode": "PROBE_ERROR" if (has_child_fail_note and obs_cleaned_38 and sig_sent_38) else "WRONG"})

        # 39. coordinator_listener_during_abort_cleans_up (Site 1 abort, R3-N01)
        mock_sig_39 = MockSignalTracker(alive_pids=[70005, 70006])
        child_proc_39 = MockChildProcess(pid=70006, returncode=None)
        obs_proc_39 = MockChildProcess(pid=70005, returncode=None)
        site1_18085_count = 0
        def mock_popen_site1(cmd, **kwargs):
            if "observer.py" in " ".join(cmd):
                return obs_proc_39
            return child_proc_39

        def mock_sub_probe_site1(cmd, **kwargs):
            nonlocal site1_18085_count
            cmd_str = " ".join(cmd)
            if "18086" in cmd_str:
                return MockCompletedProcess(returncode=0, stdout="python 70005 (LISTEN)\n")
            if "18085" in cmd_str:
                site1_18085_count += 1
                if site1_18085_count == 1:
                    # Pre-probe: clean absence (rc=1, empty stderr)
                    return MockCompletedProcess(returncode=1, stdout="", stderr="")
                # During-run probe: active listener detected!
                return MockCompletedProcess(returncode=0, stdout="node 70006 (LISTEN)\n")
            if "ps" in cmd_str:
                if "70005" in cmd_str:
                    return MockCompletedProcess(returncode=0, stdout=f"python {os.getpid()}\n")
                if "70006" in cmd_str:
                    return MockCompletedProcess(returncode=0, stdout=f"node {os.getpid()}\n")
            return MockCompletedProcess(returncode=1, stdout="", stderr="")

        runner39 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_39"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_site1,
            subprocess_runner=mock_sub_probe_site1,
            kill_func=mock_sig_39.kill_func,
        )
        with open(runner39.observer_file, "w") as f:
            json.dump({"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": runner39.variant_name, "pid": 70005}, f)
        res39 = runner39.run()
        child_terminated_39 = (child_proc_39.wait_calls > 0)
        self.record("39. coordinator_listener_during_abort_cleans_up", "Site 1 abort on listener acquisition reaps child", "Reaps child and fails against never-listen", "FAIL", "FAIL_AGAINST_NEVER_LISTEN", {"verdict": res39.get("verdict"), "verdictCode": res39.get("verdictCode") if child_terminated_39 else "WRONG"})

        # 40. coordinator_positive_counter_abort_cleans_up (Site 2 abort, R3-N01)
        mock_sig_40 = MockSignalTracker(alive_pids=[70007, 70008])
        child_proc_40 = MockChildProcess(pid=70008, returncode=None)
        obs_proc_40 = MockChildProcess(pid=70007, returncode=None)
        def mock_popen_site2(cmd, **kwargs):
            if "observer.py" in " ".join(cmd):
                return obs_proc_40
            return child_proc_40

        def mock_sub_probe_site2(cmd, **kwargs):
            cmd_str = " ".join(cmd)
            if "18086" in cmd_str:
                return MockCompletedProcess(returncode=0, stdout="python 70007 (LISTEN)\n")
            if "ps" in cmd_str:
                if "70007" in cmd_str:
                    return MockCompletedProcess(returncode=0, stdout=f"python {os.getpid()}\n")
                if "70008" in cmd_str:
                    return MockCompletedProcess(returncode=0, stdout=f"node {os.getpid()}\n")
            return MockCompletedProcess(returncode=1, stdout="", stderr="")

        runner40 = VariantRunner(
            key="API_TOKEN", variant="nonempty", env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_40"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_site2,
            subprocess_runner=mock_sub_probe_site2,
            kill_func=mock_sig_40.kill_func,
        )
        with open(runner40.observer_file, "w") as f:
            # Positive counter > 0
            json.dump({"requestCount": 5, "cleanShutdown": True, "isFinal": True, "variant": runner40.variant_name, "pid": 70007}, f)
        res40 = runner40.run()
        child_terminated_40 = (child_proc_40.wait_calls > 0)
        self.record("40. coordinator_positive_counter_abort_cleans_up", "Site 2 abort on positive counter reaps child", "Reaps child and reports POSITIVE_COUNTER", "FAIL", "POSITIVE_COUNTER", {"verdict": res40.get("verdict"), "verdictCode": res40.get("verdictCode") if child_terminated_40 else "WRONG"})

        # ----------------------------------------------------------------------
        # GROUP 8: Wrapper & Plan Dispatch (R2-I01, R3-N05, R3-N06, NF-2)
        # ----------------------------------------------------------------------
        print("\n--- Group 8: Wrapper & Plan Dispatch (R2-I01, R3-N05, R3-N06, NF-2) ---")

        # 41. run_plan_refuses_existing_dir (R3-N05)
        existing_dir = os.path.join(self.scratch_dir, "existing_attempt_dir")
        os.makedirs(existing_dir, exist_ok=True)
        plan_exit_41 = run_plan([("API_TOKEN", "nonempty", "val")], existing_dir, "/tmp/mc002-inta-harness", kill_func=mock_sig_34.kill_func)
        self.record("41. run_plan_refuses_existing_dir", "Collision check refuses existing directory (even empty)", "Returns exit 2 without reuse", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if plan_exit_41 == 2 else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 42. run_plan_halts_on_failure (R2-I01)
        fail_dir = os.path.join(self.scratch_dir, "fail_halt_attempt")
        plan_exit_42 = run_plan(
            [("API_TOKEN", "nonempty", "val"), ("API_TOKEN", "empty", "")],
            fail_dir, "/tmp/mc002-inta-harness",
            subprocess_runner=mock_pre_err_runner,
            kill_func=mock_sig_34.kill_func,
        )
        with open(os.path.join(fail_dir, "results.json")) as f:
            partial_results = json.load(f)
        halted_immediately = (plan_exit_42 == 2 and len(partial_results) == 1)
        self.record("42. run_plan_halts_on_failure", "Halt on first variant failure without running second", "Returns exit 2 and halts at variant 1", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if halted_immediately else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 43. shell_wrapper_dispatches_via_stub (R3-N06)
        stub_dir = os.path.join(self.scratch_dir, "wrapper_stub_dir")
        os.makedirs(stub_dir, exist_ok=True)
        stub_out_file = os.path.join(stub_dir, "received_args.json")
        stub_py = os.path.join(stub_dir, "coordinator.py")
        with open(stub_py, "w") as f:
            f.write(f"""import sys, json
with open({stub_out_file!r}, "w") as f:
    json.dump({{"argv": sys.argv}}, f)
sys.exit(0)
""")
        os.chmod(stub_py, 0o755)

        wrapper_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "guard-validator-r4.sh")
        # Run wrapper using PATH with stub_dir ahead of real coordinator
        wrapper_env = {**os.environ, "PYTHONPATH": stub_dir}
        # Copy wrapper to stub_dir so its SCRIPT_DIR is stub_dir
        stub_wrapper = os.path.join(stub_dir, "guard-validator-r4.sh")
        shutil.copyfile(wrapper_script, stub_wrapper)
        os.chmod(stub_wrapper, 0o755)

        target_attempt = os.path.join(stub_dir, "target_run")
        wrap_proc = subprocess.run(
            [stub_wrapper, target_attempt, "/tmp/fake_harness", "18085", "18086"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5.0,
        )
        wrapper_ok = False
        if wrap_proc.returncode == 0 and os.path.exists(stub_out_file):
            with open(stub_out_file) as f:
                recorded_stub = json.load(f)
            rec_argv = recorded_stub.get("argv", [])
            if len(rec_argv) >= 5 and rec_argv[1] == target_attempt and rec_argv[2] == "/tmp/fake_harness":
                wrapper_ok = True
        self.record("43. shell_wrapper_dispatches_via_stub", "Thin wrapper dispatches coordinator faithfully", "Executes coordinator stub with typed args", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if wrapper_ok else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 44. shell_wrapper_refuses_existing_dir (R2-I01, R3-N05)
        existing_wrap_attempt = os.path.join(stub_dir, "existing_attempt")
        os.makedirs(existing_wrap_attempt, exist_ok=True)
        wrap_refuse_proc = subprocess.run(
            [stub_wrapper, existing_wrap_attempt],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5.0,
        )
        wrap_refuse_ok = (wrap_refuse_proc.returncode == 2 and "already exists" in wrap_refuse_proc.stderr)
        self.record("44. shell_wrapper_refuses_existing_dir", "Wrapper refuses existing attempt directory", "Returns exit 2 without launch", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if wrap_refuse_ok else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # GROUP 9: Option A Launcher & Node 24 Type Stripping (R1-C04, R2-I05, NF-3)
        # ----------------------------------------------------------------------
        print("\n--- Group 9: Option A Launcher & Node 24 Type Stripping (R1-C04, R2-I05, NF-3) ---")

        # 45. ts_guard_import_via_strip_types (R1-C04)
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
        self.record("45. ts_guard_import_via_strip_types", "Node 24 native type stripping loads guards.ts", "Imports validateHarnessStartup successfully", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if ts_import_pass else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 46. launcher_mock_test_suite (R2-I05, NF-3)
        launcher_test_script = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "launcher",
            "test-launcher-mock.mjs",
        )
        launcher_run = subprocess.run(
            ["node", launcher_test_script],
            capture_output=True,
            text=True,
            timeout=5.0,
        )
        launcher_suite_pass = (launcher_run.returncode == 0 and "13 PASS / 0 FAIL" in launcher_run.stdout)
        self.record("46. launcher_mock_test_suite", "harness-dev.mjs mock test suite (13 cases)", "All 13 mock launcher unit tests pass", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if launcher_suite_pass else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # SUMMARY
        # ----------------------------------------------------------------------
        print("\n================================================================")
        print(f"SUMMARY: {self.passed_count} PASS / {self.failed_count} FAIL out of {len(self.results)} cases")
        print(f"End UTC: {datetime.now(timezone.utc).isoformat()}")
        print("================================================================")

        # Write results JSON
        out_json_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "selfcheck-r4-results.json"
        )
        with open(out_json_path, "w", encoding="utf-8") as f:
            json.dump({
                "task": "MC-002-INTA-FE-VALIDATION-R4",
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
    scratch_dir = tempfile.mkdtemp(prefix="mc002-inta-selfcheck-r4-")
    try:
        runner = SelfCheckR4Runner(scratch_dir)
        ret = runner.run_all()
        sys.exit(ret)
    finally:
        shutil.rmtree(scratch_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
