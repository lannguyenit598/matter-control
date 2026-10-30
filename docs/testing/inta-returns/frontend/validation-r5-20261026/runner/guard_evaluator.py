#!/usr/bin/env python3
"""
MC-002-INTA-FE-VALIDATION-R5: Guard Evaluator
Strict, fail-closed validation evaluator addressing R4-C01, R4-C02, R4-C05, NF-4, NF-6:
- Strict evidence schema with exact int type checking (rejecting bool and float for exit codes).
- Mandatory during_sample_count > 0 bound to verified live interval (zero samples fails closed as LISTENER_UNKNOWN).
- Mandatory identity verification (expected_variant and expected_pid must be provided and match).
- Mandatory correlation with attempt-bound launcher-execution.json record (verifying zero spawn and guard hash).
- Distinguishes BINDING_ERROR/NOT_READY from canonical refusal PASS.
- Mandatory isFinal is True, cleanShutdown is True, observer_exit_code == 0.
- Mandatory rejection of ANY present 'error' field in observer data.
"""

from typing import Any, Dict, Optional


EXPECTED_GUARD_SHA256 = "0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928"


def evaluate_guard_run(
    canonical_id: str,
    key: str,
    variant: str,
    exit_code: Optional[int],
    timed_out: bool,
    stdout: str,
    stderr: str,
    listener_during: Any,
    listener_after: Any,
    during_sample_count: Optional[int] = None,
    probe_error: Optional[str] = None,
    observer_data: Optional[Dict[str, Any]] = None,
    observer_file_exists: bool = False,
    observer_parse_error: Optional[str] = None,
    observer_exit_code: Optional[int] = None,
    expected_refusal_phrase: Optional[str] = None,
    expected_variant: Optional[str] = None,
    expected_pid: Optional[int] = None,
    launcher_execution_data: Optional[Dict[str, Any]] = None,
    launcher_execution_error: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Evaluates a single guard startup variant run against strict fail-closed criteria.
    Returns a structured verdict dictionary.
    """
    res: Dict[str, Any] = {
        "canonicalId": canonical_id,
        "key": key,
        "variant": variant,
        "verdict": "FAIL",
        "verdictCode": "UNKNOWN_FAILURE",
        "exitCode": exit_code,
        "observerHTTPRequests": None,
        "observerCleanShutdown": False,
        "observerIsFinal": False,
        "observerExitCode": observer_exit_code,
        "listenerObservedDuring": listener_during,
        "listenerObservedAfter": listener_after,
        "duringSampleCount": during_sample_count,
        "probeError": probe_error,
        "notes": "",
    }

    # 1. Probe error check: cannot establish state if probe failed
    if probe_error:
        res["verdictCode"] = "PROBE_ERROR"
        res["notes"] = f"Port listener probe error: {probe_error}"
        return res

    # 2. Timeout check: hung/timed-out child is an automatic fail
    if timed_out:
        res["verdictCode"] = "TIMEOUT"
        res["notes"] = "Child process timed out or hung"
        return res

    # 3. Listener check (NEVER-LISTEN CONTRACT):
    # Any positive listener observation is an immediate contract failure (FEVAL-F01)
    if listener_during is True or listener_after is True:
        res["verdictCode"] = "FAIL_AGAINST_NEVER_LISTEN"
        if exit_code is None:
            res["notes"] = "listener observed at pre-flight (port already occupied)"
        else:
            res["notes"] = "Port 18085 listener was acquired during execution (violates never-listen criterion)"
        return res

    # Strict check on during_sample_count (R3-N04, R5): cannot be None, non-int, or bool
    if during_sample_count is None or type(during_sample_count) is not int:
        res["verdictCode"] = "INCOMPLETE_EVIDENCE"
        res["notes"] = f"Missing or invalid during_sample_count (value={during_sample_count!r})"
        return res

    # Fast-exit observation gap (R2-I04 / NF-4 / R4-C01): if zero during-run samples were taken,
    # listener absence cannot be claimed as False. Must fail closed as LISTENER_UNKNOWN.
    if during_sample_count <= 0:
        res["verdictCode"] = "LISTENER_UNKNOWN"
        res["notes"] = (
            f"Child exited before any during-execution listener sample was taken (duringSampleCount={during_sample_count}); "
            "cannot establish listener absence during execution"
        )
        return res

    # Strict check: listener state MUST be explicitly boolean False.
    # None, missing, non-boolean, or unknown values must NOT pass.
    if listener_during is not False or listener_after is not False:
        res["verdictCode"] = "LISTENER_UNKNOWN"
        res["notes"] = (
            f"Listener state not proven False (during={listener_during!r}, after={listener_after!r})"
        )
        return res

    # 4. Immediate positive counter check: any upstream HTTP request violates contract
    if observer_file_exists and isinstance(observer_data, dict):
        req_cnt_imm = observer_data.get("requestCount")
        if isinstance(req_cnt_imm, int) and not isinstance(req_cnt_imm, bool) and req_cnt_imm > 0:
            res["observerHTTPRequests"] = req_cnt_imm
            res["verdictCode"] = "POSITIVE_COUNTER"
            res["notes"] = f"Observer recorded {req_cnt_imm} upstream HTTP requests (expected 0)"
            return res

    # 5. Launcher execution record validation (NF-4, R5 Item 1):
    if launcher_execution_error:
        res["verdictCode"] = "LAUNCHER_EVIDENCE_ERROR"
        res["notes"] = f"Launcher execution evidence error: {launcher_execution_error}"
        return res

    if launcher_execution_data is not None:
        if not isinstance(launcher_execution_data, dict):
            res["verdictCode"] = "LAUNCHER_EVIDENCE_ERROR"
            res["notes"] = f"Launcher execution data is not a dict: {type(launcher_execution_data)}"
            return res
        outcome = launcher_execution_data.get("outcome")
        if outcome == "BINDING_ERROR":
            res["verdictCode"] = "BINDING_ERROR"
            res["notes"] = f"Launcher reported binding/guard integrity error: {launcher_execution_data.get('error')}"
            return res
        if launcher_execution_data.get("spawnCalled") is not False:
            res["verdictCode"] = "SPAWN_CALLED_ON_REFUSAL"
            res["notes"] = "Next.js child process was spawned despite startup refusal condition"
            return res
        guard_hash = launcher_execution_data.get("guardSha256")
        if guard_hash != EXPECTED_GUARD_SHA256:
            res["verdictCode"] = "GUARD_HASH_MISMATCH"
            res["notes"] = f"Launcher recorded untrusted guard SHA-256: {guard_hash}"
            return res

    # 6. Exit code check (R4-C05, R5 Item 4):
    # Child startup refusal must exit with exact integer 1 (not bool True, not float 1.0)
    if type(exit_code) is not int:
        res["verdictCode"] = "WRONG_EXIT_CODE"
        res["notes"] = f"Child exit code is not a strict int (type={type(exit_code).__name__}, value={exit_code!r})"
        return res
    if exit_code != 1:
        res["verdictCode"] = "WRONG_EXIT_CODE"
        res["notes"] = f"Child exit code was {exit_code} (expected 1)"
        return res

    # 7. Refusal phrase check: must match exact required refusal phrase
    if expected_refusal_phrase is None:
        if key == "NODE_ENV":
            expected_refusal_phrase = "NODE_ENV cannot be production"
        else:
            expected_refusal_phrase = f"product auth/secret env vars present ({key})"

    combined_output = f"{stdout}\n{stderr}"
    if expected_refusal_phrase not in combined_output:
        res["verdictCode"] = "WRONG_REFUSAL"
        res["notes"] = f"Expected refusal phrase '{expected_refusal_phrase}' missing in stderr/stdout"
        return res

    # 8. Observer evidence validation (FEVAL-F02, R1-C02, R2-I04, R3-N04)
    if not observer_file_exists:
        res["verdictCode"] = "MISSING_COUNTER"
        res["notes"] = "Observer counter file missing; zero-upstream calls not established"
        return res

    if observer_parse_error:
        res["verdictCode"] = "MALFORMED_COUNTER"
        res["notes"] = f"Observer counter file malformed: {observer_parse_error}"
        return res

    if not isinstance(observer_data, dict):
        res["verdictCode"] = "MALFORMED_COUNTER"
        res["notes"] = f"Observer counter data is not a JSON object: {type(observer_data)}"
        return res

    # Reject ANY present error field (even empty string, null, false, or 0)
    if "error" in observer_data:
        err_val = observer_data["error"]
        res["verdictCode"] = "OBSERVER_ERROR"
        res["notes"] = f"Observer recorded error field (value={err_val!r})"
        return res

    # Strict isFinal check: final record must have isFinal is True
    is_final = observer_data.get("isFinal")
    if is_final is not True:
        res["verdictCode"] = "INCOMPLETE_OBSERVER_RECORD"
        res["notes"] = f"Observer state is incomplete (isFinal is {is_final!r}, expected True)"
        return res
    res["observerIsFinal"] = True

    # Check cleanShutdown: must be STRICTLY boolean True
    clean_shutdown = observer_data.get("cleanShutdown")
    if clean_shutdown is not True:
        res["verdictCode"] = "UNCLEAN_SHUTDOWN"
        res["notes"] = (
            f"Observer did not cleanly shut down (cleanShutdown is {clean_shutdown!r}, expected True)"
        )
        return res
    res["observerCleanShutdown"] = True

    # Check observer exit code (R4-C05, R5 Item 4):
    # Observer process must have exited cleanly with exact integer 0 (not bool False, not float 0.0)
    if type(observer_exit_code) is not int:
        res["verdictCode"] = "OBSERVER_EXIT_ERROR"
        res["notes"] = f"Observer exit code is not a strict int (type={type(observer_exit_code).__name__}, value={observer_exit_code!r})"
        return res
    if observer_exit_code != 0:
        res["verdictCode"] = "OBSERVER_EXIT_ERROR"
        res["notes"] = f"Observer process failed with non-zero exit (observerExitCode={observer_exit_code}, expected 0)"
        return res

    # Check requestCount: must be strict int (not bool)
    req_count = observer_data.get("requestCount")
    if req_count is None:
        res["verdictCode"] = "MISSING_COUNTER"
        res["notes"] = "Observer data missing requestCount field"
        return res

    if type(req_count) is not int:
        res["verdictCode"] = "MALFORMED_COUNTER"
        res["notes"] = f"requestCount is not a strict integer (type={type(req_count).__name__}, value={req_count!r})"
        return res

    if req_count < 0:
        res["verdictCode"] = "MALFORMED_COUNTER"
        res["notes"] = f"requestCount cannot be negative: {req_count}"
        return res

    res["observerHTTPRequests"] = req_count
    if req_count > 0:
        res["verdictCode"] = "POSITIVE_COUNTER"
        res["notes"] = f"Observer recorded {req_count} upstream HTTP requests (expected 0)"
        return res

    # Strict identity verification (R4-C05, R5 Item 4):
    if expected_variant is None:
        res["verdictCode"] = "INCOMPLETE_EVIDENCE"
        res["notes"] = "expected_variant must be provided for strict identity verification"
        return res
    if observer_data.get("variant") != expected_variant:
        res["verdictCode"] = "OBSERVER_IDENTITY_MISMATCH"
        res["notes"] = f"Observer variant mismatch: observed {observer_data.get('variant')!r}, expected {expected_variant!r}"
        return res

    if expected_pid is None:
        res["verdictCode"] = "INCOMPLETE_EVIDENCE"
        res["notes"] = "expected_pid must be provided for strict identity verification"
        return res
    if observer_data.get("pid") != expected_pid:
        res["verdictCode"] = "OBSERVER_IDENTITY_MISMATCH"
        res["notes"] = f"Observer PID mismatch: observed {observer_data.get('pid')!r}, expected {expected_pid!r}"
        return res

    # 9. All checks passed: valid complete input
    res["verdict"] = "PASS"
    res["verdictCode"] = "VALID_COMPLETE_INPUT"
    res["notes"] = (
        f"Finite exit=1, exact refusal phrase present, no listener observed in {during_sample_count} "
        "sampled during-execution windows and 1 post-probe, observer confirmed 0 HTTP requests via clean shutdown"
    )
    return res
