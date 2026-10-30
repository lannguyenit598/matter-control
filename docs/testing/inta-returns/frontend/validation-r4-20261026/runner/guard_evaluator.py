#!/usr/bin/env python3
"""
MC-002-INTA-FE-VALIDATION-R4: Guard Evaluator
Strict, fail-closed validation evaluator addressing R1-C02, R2-I04, R3-N04, and NF-6.
- Strict evidence schema with type checking (no bool for int, no default bypass).
- Mandatory during_sample_count > 0 (fast-exit zero-sample is fail-closed LISTENER_UNKNOWN).
- Mandatory isFinal is True, cleanShutdown is True, observer_exit_code == 0.
- Mandatory rejection of ANY present 'error' field (even empty/falsey/null).
- Correct pre-bound port outcome wording (NF-6).
- Scoped sampling wording: no unproven absolute never-listen claims.
"""

from typing import Any, Dict, Optional


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
        # NF-6: distinguish pre-flight listener from execution listener
        if exit_code is None:
            res["notes"] = "listener observed at pre-flight (port already occupied)"
        else:
            res["notes"] = "Port 18085 listener was acquired during execution (violates never-listen criterion)"
        return res

    # Strict check on during_sample_count (R3-N04): cannot be None or non-int
    if during_sample_count is None or not isinstance(during_sample_count, int) or isinstance(during_sample_count, bool):
        res["verdictCode"] = "INCOMPLETE_EVIDENCE"
        res["notes"] = f"Missing or invalid during_sample_count (value={during_sample_count!r})"
        return res

    # Fast-exit observation gap (R2-I04 / NF-4): if zero during-run samples were taken,
    # listener absence cannot be claimed as False. Must fail closed.
    if during_sample_count <= 0:
        res["verdictCode"] = "LISTENER_UNKNOWN"
        res["notes"] = (
            f"Child exited before any during-execution listener sample was taken (duringSampleCount={during_sample_count}); "
            "cannot establish listener absence during execution"
        )
        return res

    # Strict check (R1-C02): listener state MUST be explicitly boolean False.
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

    # 5. Exit code check: guard startup refusal must exit with status 1
    if exit_code != 1:
        res["verdictCode"] = "WRONG_EXIT_CODE"
        res["notes"] = f"Child exit code was {exit_code} (expected 1)"
        return res

    # 5. Refusal phrase check: must match exact required refusal phrase
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

    # 6. Observer evidence validation (FEVAL-F02, R1-C02, R2-I04, R3-N04)
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

    # R3-N04 / C02 fix: reject ANY present error field (even empty string, null, false, or 0)
    if "error" in observer_data:
        err_val = observer_data["error"]
        res["verdictCode"] = "OBSERVER_ERROR"
        res["notes"] = f"Observer recorded error field (value={err_val!r})"
        return res

    # Strict isFinal check (R2-I04): final record must have isFinal is True
    is_final = observer_data.get("isFinal")
    if is_final is not True:
        res["verdictCode"] = "INCOMPLETE_OBSERVER_RECORD"
        res["notes"] = f"Observer state is incomplete (isFinal is {is_final!r}, expected True)"
        return res
    res["observerIsFinal"] = True

    # Check cleanShutdown: must be STRICTLY boolean True (no bool("false") coercion)
    clean_shutdown = observer_data.get("cleanShutdown")
    if clean_shutdown is not True:
        res["verdictCode"] = "UNCLEAN_SHUTDOWN"
        res["notes"] = (
            f"Observer did not cleanly shut down (cleanShutdown is {clean_shutdown!r}, expected True)"
        )
        return res
    res["observerCleanShutdown"] = True

    # Check observer exit code (R2-I04, R3-N04): observer process must have exited cleanly with code 0
    if observer_exit_code is None or observer_exit_code != 0:
        res["verdictCode"] = "OBSERVER_EXIT_ERROR"
        res["notes"] = f"Observer process failed or unverified exit (observerExitCode={observer_exit_code!r}, expected 0)"
        return res

    # Check requestCount: must be strict int (not bool, since bool is subclass of int in Python)
    req_count = observer_data.get("requestCount")
    if req_count is None:
        res["verdictCode"] = "MISSING_COUNTER"
        res["notes"] = "Observer data missing requestCount field"
        return res

    if not isinstance(req_count, int) or isinstance(req_count, bool):
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

    # Check observer identity if specified
    if expected_variant and observer_data.get("variant") != expected_variant:
        res["verdictCode"] = "OBSERVER_IDENTITY_MISMATCH"
        res["notes"] = f"Observer variant mismatch: observed {observer_data.get('variant')!r}, expected {expected_variant!r}"
        return res

    if expected_pid and observer_data.get("pid") != expected_pid:
        res["verdictCode"] = "OBSERVER_IDENTITY_MISMATCH"
        res["notes"] = f"Observer PID mismatch: observed {observer_data.get('pid')!r}, expected {expected_pid!r}"
        return res

    # 7. All checks passed: valid complete input
    # Scoped wording (R2-I04): explicitly state sampled windows instead of blanket never-acquired claim
    res["verdict"] = "PASS"
    res["verdictCode"] = "VALID_COMPLETE_INPUT"
    res["notes"] = (
        f"Finite exit=1, exact refusal phrase present, no listener observed in {during_sample_count} "
        "sampled during-execution windows and 1 post-probe, observer confirmed 0 HTTP requests via clean shutdown"
    )
    return res
