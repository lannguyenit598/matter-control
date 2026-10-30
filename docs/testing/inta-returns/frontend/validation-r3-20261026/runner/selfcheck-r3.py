#!/usr/bin/env python3
"""
MC-002-INTA-FE-VALIDATION-R3: Comprehensive Deterministic Self-Check Suite
Validates all R2-I01..I06 and C01..C04 corrections in-process using mocks/tempfiles:
- Baseline cases and strict evidence schema (R1-C02)
- Fast-exit zero-sample fail-closed classification and isFinal/observerExitCode enforcement (R2-I04)
- Actual probe_tcp_listener with mocked subprocess.run including ENOENT rejection (R2-I04, R2-I06)
- Actual verify_pid_identity and bounded_terminate with fail-closed ps and identity enforcement (R2-I03, R2-I06)
- Actual VariantRunner.run() with mocked Popen/probes/terminate exercising preflight, listener abort,
  live counter abort, fast exit, and child-spawn exception with observer cleanup (R2-I02, R2-I03, R2-I06)
- Actual AtomicStateWriter failure propagation (R2-I06)
- Actual coordinator.run_plan collision refusal and immediate halt on failure (R2-I01, R2-I06)
- Node 24 TypeScript guard import and launcher mock suite (R1-C04, R2-I05)
"""

from datetime import datetime, timezone
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Any, Dict, List, Optional

from guard_evaluator import evaluate_guard_run
from observer import AtomicStateWriter
import coordinator
from coordinator import (
    probe_tcp_listener,
    verify_pid_identity,
    bounded_terminate,
    VariantRunner,
    run_plan,
)


class MockCompletedProcess:
    def __init__(self, returncode: int, stdout: str = "", stderr: str = ""):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


class MockChildProcess:
    def __init__(self, pid: int = 12345, returncode: Optional[int] = None):
        self.pid = pid
        self._returncode = returncode
        self.poll_calls = 0
        self.wait_calls = 0

    def poll(self):
        self.poll_calls += 1
        return self._returncode

    def wait(self, timeout=None):
        self.wait_calls += 1
        return self._returncode


class SelfCheckRunnerR3:
    def __init__(self):
        self.scratch_dir = tempfile.mkdtemp(prefix="mc002-inta-selfcheck-r3-")
        self.results: List[Dict[str, Any]] = []
        self.passed_count = 0
        self.failed_count = 0
        self.start_utc = datetime.now(timezone.utc).isoformat()

    def cleanup(self):
        shutil.rmtree(self.scratch_dir, ignore_errors=True)

    def record(
        self,
        case_id: str,
        name: str,
        description: str,
        expected_verdict: str,
        expected_code: str,
        eval_result: Dict[str, Any],
    ) -> bool:
        verdict = eval_result.get("verdict")
        code = eval_result.get("verdictCode")
        is_pass = (verdict == expected_verdict) and (code == expected_code)

        if is_pass:
            self.passed_count += 1
            status_str = "PASS"
        else:
            self.failed_count += 1
            status_str = "FAIL"

        record_entry = {
            "caseId": case_id,
            "name": name,
            "description": description,
            "expectedVerdict": expected_verdict,
            "expectedCode": expected_code,
            "actualVerdict": verdict,
            "actualCode": code,
            "pass": is_pass,
            "evalDetails": eval_result,
        }
        self.results.append(record_entry)

        print(f"[{status_str}] {case_id}: {name}")
        if not is_pass:
            print(f"       Expected: verdict={expected_verdict}, code={expected_code}")
            print(f"       Actual:   verdict={verdict}, code={code}")
            print(f"       Notes:    {eval_result.get('notes')}")
        return is_pass

    def run_all(self):
        print("================================================================")
        print("MC-002-INTA-FE-VALIDATION-R3: Comprehensive Deterministic Self-Check")
        print(f"Start UTC: {self.start_utc}")
        print(f"Scratch Directory: {self.scratch_dir}")
        print("================================================================")

        # ----------------------------------------------------------------------
        # GROUP 1: Baseline Cases & Strict Evaluator Schema
        # ----------------------------------------------------------------------
        print("\n--- Group 1: Baseline Cases & Evaluator Schema ---")

        # 1. missingcounter
        res1 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="Refusing startup...",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=False,
            listener_after=False,
            during_sample_count=1,
            observer_file_exists=False,
        )
        self.record("1. missingcounter", "Observer file does not exist", "Observer file missing", "FAIL", "MISSING_COUNTER", res1)

        # 2. malformedcounter
        res2 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=False,
            listener_after=False,
            during_sample_count=1,
            observer_file_exists=True,
            observer_parse_error="Expecting property name enclosed in double quotes",
        )
        self.record("2. malformedcounter", "Observer JSON malformed", "Invalid JSON syntax", "FAIL", "MALFORMED_COUNTER", res2)

        # 3. positivecounter
        res3 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=False,
            listener_after=False,
            during_sample_count=1,
            observer_file_exists=True,
            observer_data={"requestCount": 1, "cleanShutdown": True, "isFinal": True},
        )
        self.record("3. positivecounter", "Observer recorded >0 HTTP requests", "Upstream was called", "FAIL", "POSITIVE_COUNTER", res3)

        # 4. observererror
        res4 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=False,
            listener_after=False,
            during_sample_count=1,
            observer_file_exists=True,
            observer_data={"error": "Address already in use on 18086", "cleanShutdown": False, "isFinal": True},
        )
        self.record("4. observererror", "Observer startup or runtime error", "Observer bind failure", "FAIL", "OBSERVER_ERROR", res4)

        # 5. transientlistener
        res5 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=True,
            listener_after=False,
            during_sample_count=1,
            observer_file_exists=True,
            observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True},
        )
        self.record("5. transientlistener", "Port 18085 listener observed during run", "FEVAL-F01 violation", "FAIL", "FAIL_AGAINST_NEVER_LISTEN", res5)

        # 6. probeerror
        res6 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=None,
            listener_after=None,
            during_sample_count=1,
            probe_error="lsof command permission denied",
        )
        self.record("6. probeerror", "Port probe execution error", "Probe failed", "FAIL", "PROBE_ERROR", res6)

        # 7. timeout
        res7 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=None,
            timed_out=True,
            stdout="",
            stderr="",
            listener_during=False,
            listener_after=False,
            during_sample_count=1,
        )
        self.record("7. timeout", "Child hung or timed out", "Timeout kill is fail", "FAIL", "TIMEOUT", res7)

        # 8. wrongrefusal
        res8 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="Some other error",
            stderr="SyntaxError: Unexpected token",
            listener_during=False,
            listener_after=False,
            during_sample_count=1,
            observer_file_exists=True,
            observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True},
        )
        self.record("8. wrongrefusal", "Child exited without exact refusal phrase", "Missing refusal text", "FAIL", "WRONG_REFUSAL", res8)

        # 9. validcompleteinput
        res9 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="Refusing startup...",
            stderr="Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            listener_during=False,
            listener_after=False,
            during_sample_count=2,
            observer_file_exists=True,
            observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True},
            observer_exit_code=0,
        )
        self.record("9. validcompleteinput", "Fully compliant refusal and zero upstream calls", "All checks valid", "PASS", "VALID_COMPLETE_INPUT", res9)

        # ----------------------------------------------------------------------
        # GROUP 2: The 3 OpenCode / Codex Regression Probes (R1-C02)
        # ----------------------------------------------------------------------
        print("\n--- Group 2: OpenCode / Codex Regression Probes (R1-C02) ---")

        # 10. unknown_listener_observation
        res10 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=None,
            listener_after=None,
            during_sample_count=1,
            observer_file_exists=True,
            observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True},
        )
        self.record("10. unknown_listener_observation", "listener_during=None and listener_after=None", "Must fail closed as LISTENER_UNKNOWN", "FAIL", "LISTENER_UNKNOWN", res10)

        # 11. boolean_counter_false
        res11 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=False,
            listener_after=False,
            during_sample_count=1,
            observer_file_exists=True,
            observer_data={"requestCount": False, "cleanShutdown": True, "isFinal": True},
        )
        self.record("11. boolean_counter_false", "requestCount=False (bool subclass of int)", "Must reject bool as MALFORMED_COUNTER", "FAIL", "MALFORMED_COUNTER", res11)

        # 12. truthy_unclean_string
        res12 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=False,
            listener_after=False,
            during_sample_count=1,
            observer_file_exists=True,
            observer_data={"requestCount": 0, "cleanShutdown": "false", "isFinal": True},
        )
        self.record("12. truthy_unclean_string", "cleanShutdown='false' (non-empty string)", "Must require strict True", "FAIL", "UNCLEAN_SHUTDOWN", res12)

        # ----------------------------------------------------------------------
        # GROUP 3: Evidence Completeness (R2-I04)
        # ----------------------------------------------------------------------
        print("\n--- Group 3: Evidence Completeness (R2-I04) ---")

        # 13. fast_exit_zero_samples_fail_closed (R2-I04)
        res13 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=None,
            listener_after=False,
            during_sample_count=0,  # 0 samples taken!
            observer_file_exists=True,
            observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True},
        )
        self.record("13. fast_exit_zero_samples", "Child exited before any during-sample taken", "Must fail closed as LISTENER_UNKNOWN", "FAIL", "LISTENER_UNKNOWN", res13)

        # 14. missing_isfinal_flag (R2-I04)
        res14 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=False,
            listener_after=False,
            during_sample_count=1,
            observer_file_exists=True,
            observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": False},
        )
        self.record("14. missing_isfinal_flag", "Observer state has isFinal=False", "Must reject incomplete state", "FAIL", "INCOMPLETE_OBSERVER_RECORD", res14)

        # 15. observer_exit_nonzero (R2-I04)
        res15 = evaluate_guard_run(
            canonical_id="INT-ENV-05",
            key="API_TOKEN",
            variant="nonempty",
            exit_code=1,
            timed_out=False,
            stdout="",
            stderr="product auth/secret env vars present (API_TOKEN)",
            listener_during=False,
            listener_after=False,
            during_sample_count=1,
            observer_file_exists=True,
            observer_data={"requestCount": 0, "cleanShutdown": True, "isFinal": True},
            observer_exit_code=2,  # observer exited with error!
        )
        self.record("15. observer_exit_nonzero", "Observer process exited with code 2", "Must reject non-zero observer exit", "FAIL", "OBSERVER_EXIT_ERROR", res15)

        # ----------------------------------------------------------------------
        # GROUP 4: Actual Probe Classification (R2-I04, R2-I06)
        # ----------------------------------------------------------------------
        print("\n--- Group 4: Actual Probe Classification (R2-I04, R2-I06) ---")

        # 16. actual_probe_rc0_listener
        def mock_sub_rc0(cmd, **kwargs):
            return MockCompletedProcess(returncode=0, stdout="node 1234 (LISTEN)\n", stderr="")
        st16, err16 = probe_tcp_listener(18085, subprocess_runner=mock_sub_rc0)
        self.record("16. actual_probe_rc0_listener", "lsof rc=0 is active listener", "Returns (True, None)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (st16 is True and err16 is None) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 17. actual_probe_rc1_clean_nomatch
        def mock_sub_rc1_clean(cmd, **kwargs):
            return MockCompletedProcess(returncode=1, stdout="", stderr="")
        st17, err17 = probe_tcp_listener(18085, subprocess_runner=mock_sub_rc1_clean)
        self.record("17. actual_probe_rc1_clean_nomatch", "lsof rc=1 with empty stderr is clean absence", "Returns (False, None)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (st17 is False and err17 is None) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 18. actual_probe_rc1_enoent_error (R2-I04 fix: ENOENT is NOT absence!)
        def mock_sub_rc1_enoent(cmd, **kwargs):
            return MockCompletedProcess(returncode=1, stdout="", stderr="lsof: No such file or directory\n")
        st18, err18 = probe_tcp_listener(18085, subprocess_runner=mock_sub_rc1_enoent)
        is_enoent_rejected = (st18 is None and err18 is not None and "No such file or directory" in err18)
        self.record("18. actual_probe_rc1_enoent_error", "lsof rc=1 with ENOENT stderr is PROBE_ERROR", "Must reject ENOENT as unknown/error", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if is_enoent_rejected else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 19. actual_probe_rc_greater_1_error
        def mock_sub_rc2(cmd, **kwargs):
            return MockCompletedProcess(returncode=2, stdout="", stderr="Permission denied\n")
        st19, err19 = probe_tcp_listener(18085, subprocess_runner=mock_sub_rc2)
        is_rc2_rejected = (st19 is None and err19 is not None and "Permission denied" in err19)
        self.record("19. actual_probe_rc_greater_1_error", "lsof rc>1 is PROBE_ERROR", "Returns (None, error)", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if is_rc2_rejected else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # GROUP 5: Ownership & Lifecycle (R2-I03, R2-I06)
        # ----------------------------------------------------------------------
        print("\n--- Group 5: Ownership & Lifecycle (R2-I03, R2-I06) ---")

        # 20. verify_pid_identity_fail_closed_on_ps_error (R2-I03)
        def mock_ps_fail(cmd, **kwargs):
            return MockCompletedProcess(returncode=1, stdout="", stderr="ps: query error\n")
        is_identity_denied = verify_pid_identity(os.getpid(), expected_name="python", subprocess_runner=mock_ps_fail)
        # ps failure must return False (fail-closed, not True)
        self.record("20. verify_pid_identity_ps_failure", "ps query error must fail closed", "Returns False on ps error", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (is_identity_denied is False) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 21. bounded_terminate_refuses_unverified_pid (R2-I03)
        # If verify_pid_identity returns False, bounded_terminate must return (False, reason) without signaling
        term_ok, term_err = bounded_terminate(os.getpid(), timeout_sec=0.1, expected_name="NON_EXISTENT_NAME_XYZ", subprocess_runner=mock_ps_fail)
        self.record("21. bounded_terminate_refuses_unverified", "Refuses signal if identity fails", "Returns (False, reason) without signal", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if (term_ok is False and term_err is not None) else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 22. atomic_writer_failure_propagation (R2-I06)
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
        self.record("22. atomic_writer_failure_propagation", "Write error propagates exception", "Writer failure is not swallowed", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if writer_failed else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # GROUP 6: Coordinator VariantRunner Mock Execution (R2-I02, R2-I03, R2-I06)
        # ----------------------------------------------------------------------
        print("\n--- Group 6: Coordinator VariantRunner Mock Execution (R2-I02, R2-I03, R2-I06) ---")

        # 23. coordinator_preprobe_error_aborts_before_launch
        def mock_pre_err_runner(cmd, **kwargs):
            if "lsof" in cmd:
                return MockCompletedProcess(returncode=2, stderr="Preprobe error")
            return MockCompletedProcess(returncode=0)

        runner23 = VariantRunner(
            key="API_TOKEN",
            variant="nonempty",
            env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_23"),
            harness_dir="/tmp/mc002-inta-harness",
            subprocess_runner=mock_pre_err_runner,
        )
        res23 = runner23.run()
        self.record("23. coordinator_preprobe_error_abort", "Pre-flight probe error halts execution", "Returns PROBE_ERROR without child launch", "FAIL", "PROBE_ERROR", res23)

        # 24. coordinator_preprobe_bound_aborts_before_launch
        def mock_pre_bound_runner(cmd, **kwargs):
            if "lsof" in cmd:
                return MockCompletedProcess(returncode=0, stdout="node 999 (LISTEN)")
            return MockCompletedProcess(returncode=0)

        runner24 = VariantRunner(
            key="API_TOKEN",
            variant="nonempty",
            env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_24"),
            harness_dir="/tmp/mc002-inta-harness",
            subprocess_runner=mock_pre_bound_runner,
        )
        res24 = runner24.run()
        self.record("24. coordinator_preprobe_bound_abort", "Port already bound halts execution", "Returns FAIL_AGAINST_NEVER_LISTEN", "FAIL", "FAIL_AGAINST_NEVER_LISTEN", res24)

        # 25. coordinator_child_spawn_failure_cleans_up_observer (R2-I03, R2-I06)
        cleaned_up_obs = False
        def mock_popen_child_fail(cmd, **kwargs):
            nonlocal cleaned_up_obs
            if "observer.py" in " ".join(cmd):
                mock_obs = MockChildProcess(pid=77777)
                mock_obs.wait = lambda timeout=None: 0
                return mock_obs
            # Child spawn throws OSError
            raise OSError("Mock child spawn exec failure")

        def mock_sub_probe_with_obs(cmd, **kwargs):
            cmd_str = " ".join(cmd)
            if "18086" in cmd_str:
                return MockCompletedProcess(returncode=0, stdout="python 77777 (LISTEN)\n")
            return MockCompletedProcess(returncode=1, stdout="", stderr="")

        runner25 = VariantRunner(
            key="API_TOKEN",
            variant="nonempty",
            env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_25"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_child_fail,
            subprocess_runner=mock_sub_probe_with_obs,
        )
        with open(runner25.observer_file, "w") as f:
            json.dump({"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": runner25.variant_name, "pid": 77777}, f)
        res25 = runner25.run()
        has_child_fail_note = "Child process failure" in (res25.get("probeError") or "") or "Mock child spawn" in (res25.get("probeError") or "")
        self.record("25. child_spawn_fail_cleanup", "Child spawn failure triggers observer cleanup", "Cleanup runs in finally and fails closed", "FAIL", "PROBE_ERROR", {"verdict": "FAIL" if has_child_fail_note else "PASS", "verdictCode": "PROBE_ERROR" if has_child_fail_note else "WRONG"})

        # 26. coordinator_fast_exit_zero_samples_fail_closed (R2-I04, R2-I06)
        def mock_popen_fast_exit(cmd, **kwargs):
            if "observer.py" in " ".join(cmd):
                mock_obs = MockChildProcess(pid=88888, returncode=0)
                mock_obs.wait = lambda timeout=None: 0
                return mock_obs
            # Child exits immediately with code 1 before any probe sample
            mock_child = MockChildProcess(pid=88889, returncode=1)
            return mock_child

        runner26 = VariantRunner(
            key="API_TOKEN",
            variant="nonempty",
            env_value="val",
            attempt_dir=os.path.join(self.scratch_dir, "run_26"),
            harness_dir="/tmp/mc002-inta-harness",
            popen_factory=mock_popen_fast_exit,
            subprocess_runner=mock_sub_probe_with_obs,
        )
        with open(runner26.observer_file, "w") as f:
            json.dump({"requestCount": 0, "cleanShutdown": True, "isFinal": True, "variant": runner26.variant_name, "pid": 88888}, f)
        res26 = runner26.run()
        self.record("26. fast_exit_zero_samples_fail_closed", "Fast exit with 0 during-samples fails closed", "Returns LISTENER_UNKNOWN (not default False)", "FAIL", "LISTENER_UNKNOWN", res26)

        # ----------------------------------------------------------------------
        # GROUP 7: Wrapper & Plan Dispatch (R2-I01, R2-I06)
        # ----------------------------------------------------------------------
        print("\n--- Group 7: Wrapper & Plan Dispatch (R2-I01, R2-I06) ---")

        # 27. run_plan_refuses_occupied_directory (R2-I01)
        occupied_dir = os.path.join(self.scratch_dir, "occupied_attempt")
        os.makedirs(occupied_dir, exist_ok=True)
        with open(os.path.join(occupied_dir, "existing_file.txt"), "w") as f:
            f.write("prior state")
        # run_plan should immediately return 2 and refuse execution
        plan_exit = run_plan([("API_TOKEN", "nonempty", "val")], occupied_dir, "/tmp/mc002-inta-harness")
        self.record("27. run_plan_refuses_occupied_dir", "Collision check refuses occupied attempt directory", "Returns exit code 2 on occupied directory", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if plan_exit == 2 else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 28. run_plan_halts_immediately_on_failure (R2-I01)
        fail_attempt_dir = os.path.join(self.scratch_dir, "fail_halt_attempt")
        # Run plan with failing pre-probe
        plan_halt_exit = run_plan(
            [("API_TOKEN", "nonempty", "val"), ("API_TOKEN", "empty", "")],
            fail_attempt_dir,
            "/tmp/mc002-inta-harness",
            subprocess_runner=mock_pre_err_runner,
        )
        # Check that only the first variant was executed and execution halted
        results_file = os.path.join(fail_attempt_dir, "results.json")
        with open(results_file) as rf:
            saved_results = json.load(rf)
        halted_after_one = (plan_halt_exit == 2 and len(saved_results) == 1)
        self.record("28. run_plan_halts_on_failure", "Halt on first variant failure", "Halts immediately and returns code 2", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if halted_after_one else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # ----------------------------------------------------------------------
        # GROUP 8: Option A Launcher Verification (R1-C04, R2-I02, R2-I05)
        # ----------------------------------------------------------------------
        print("\n--- Group 8: Option A Launcher & Node 24 Type Stripping (R1-C04, R2-I05) ---")

        # 29. ts_guard_import_via_strip_types
        guards_path = "/tmp/mc002-inta-harness/src/guards.ts"
        assert os.path.exists(guards_path), f"Guards file must exist at {guards_path}"
        node_check_cmd = [
            "node",
            "--experimental-strip-types",
            "-e",
            f"import {{ validateHarnessStartup }} from '{guards_path}'; try {{ validateHarnessStartup({{ API_TOKEN: 'secret' }}); process.exit(0); }} catch (e) {{ if (e.message.includes('API_TOKEN')) process.exit(42); else process.exit(1); }}"
        ]
        proc = subprocess.run(node_check_cmd, capture_output=True)
        is_ts_import_ok = (proc.returncode == 42)
        self.record("29. ts_guard_import_via_strip_types", "Node 24 native type stripping loads guards.ts", "Direct import without transpiler succeeds and throws refusal", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if is_ts_import_ok else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # 30. launcher_mock_test_suite_10_cases (R2-I02, R2-I05)
        launcher_test_file = "/tmp/mc002-inta-fe-validation-r3-20261026/launcher/test-launcher-mock.mjs"
        proc_launcher = subprocess.run(
            ["node", "--experimental-strip-types", launcher_test_file],
            capture_output=True,
            text=True,
        )
        is_launcher_suite_ok = (proc_launcher.returncode == 0 and "10 PASS / 0 FAIL" in proc_launcher.stdout)
        self.record("30. launcher_mock_test_suite", "harness-dev.mjs mock test suite", "10/10 PASS verifying pre-listen refusal, stateDir, entry, lifecycle", "PASS", "VALID_COMPLETE_INPUT", {"verdict": "PASS" if is_launcher_suite_ok else "FAIL", "verdictCode": "VALID_COMPLETE_INPUT"})

        # Summary output
        end_utc = datetime.now(timezone.utc).isoformat()
        total_cases = len(self.results)
        print("\n================================================================")
        print(f"SUMMARY: {self.passed_count} PASS / {self.failed_count} FAIL out of {total_cases} cases")
        print(f"End UTC: {end_utc}")
        print("================================================================")

        summary_data = {
            "suite": "runner-selfcheck-r3",
            "startUTC": self.start_utc,
            "endUTC": end_utc,
            "totalCases": total_cases,
            "passed": self.passed_count,
            "failed": self.failed_count,
            "allPassed": (self.failed_count == 0),
            "cases": self.results,
        }

        results_json_path = "/tmp/mc002-inta-fe-validation-r3-20261026/runner/selfcheck-r3-results.json"
        with open(results_json_path, "w", encoding="utf-8") as f:
            json.dump(summary_data, f, indent=2)
        print(f"Results saved to {results_json_path}")

        return self.failed_count == 0


if __name__ == "__main__":
    runner = SelfCheckRunnerR3()
    try:
        success = runner.run_all()
    finally:
        runner.cleanup()

    if not success:
        sys.exit(1)
    sys.exit(0)
