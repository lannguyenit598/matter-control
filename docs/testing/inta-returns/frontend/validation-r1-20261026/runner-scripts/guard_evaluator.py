"""
guard_evaluator.py — Core Evaluation Logic for INT-ENV-05 Startup Negatives
Part of MC-002-INTA-FE-VALIDATION-R1
Author: Actual Antigravity (Gemini 3.8 Flash High)

This module defines the strict, fail-closed evaluation rules for startup guard variants.
Used identically by both:
1. runner/guard-validator-r1.sh (live validation script)
2. runner/selfcheck-r1.py (in-process deterministic unit tests)
"""

import json
import os
from typing import Any, Dict, Optional, Tuple


def evaluate_variant(
    key: str,
    variant_label: str,
    child_exit: Optional[int],
    timed_out: bool,
    stderr_text: str,
    stdout_text: str,
    observer_log_path: Optional[str],
    listener_during: Optional[bool],
    listener_after: Optional[bool],
    probe_error: bool = False,
    probe_error_detail: str = "",
) -> Dict[str, Any]:
    """
    Evaluates a single startup guard variant with fail-closed rules.
    Returns a dictionary containing:
      - canonicalId: "INT-ENV-05"
      - key: tested environment variable name
      - variant: "nonempty" or "empty"
      - verdict: "PASS" | "FAIL" | "BLOCKED"
      - verdictCode: specific machine-readable code
      - exitCode: child exit code or None
      - observerHTTPRequests: count if measured, or None
      - observerCleanShutdown: bool
      - listenerObservedDuring: bool or None
      - listenerObservedAfter: bool or None
      - notes: human-readable explanation
    """
    result: Dict[str, Any] = {
        "canonicalId": "INT-ENV-05",
        "key": key,
        "variant": variant_label,
        "verdict": "FAIL",
        "verdictCode": "UNKNOWN_ERROR",
        "exitCode": child_exit,
        "observerHTTPRequests": None,
        "observerCleanShutdown": False,
        "listenerObservedDuring": listener_during,
        "listenerObservedAfter": listener_after,
        "notes": "",
    }

    # Rule 1: Port probe errors must never be treated as "no listener"
    if probe_error:
        result["verdict"] = "FAIL"
        result["verdictCode"] = "PROBE_ERROR"
        result["notes"] = f"Port listener probe failed ({probe_error_detail}); cannot establish listener absence"
        return result

    # Rule 2: Listener acquired during execution violates the never-listen criterion
    if listener_during is True:
        result["verdict"] = "FAIL"
        result["verdictCode"] = "FAIL_AGAINST_NEVER_LISTEN"
        result["notes"] = "Port 18085 listener was acquired during execution (violates never-listen criterion)"
        return result

    # Rule 3: Listener still active after child exit
    if listener_after is True:
        result["verdict"] = "FAIL"
        result["verdictCode"] = "LISTENER_PERSISTED_AFTER_EXIT"
        result["notes"] = "Port 18085 remained bound after child process exited"
        return result

    # Rule 4: Timeout or hang
    if timed_out or child_exit == 124:
        result["verdict"] = "FAIL"
        result["verdictCode"] = "TIMEOUT"
        result["notes"] = "Child timed out or hung (timeout kill is not PASS)"
        return result

    # Rule 5: Zero exit code (child should have failed startup)
    if child_exit == 0:
        result["verdict"] = "FAIL"
        result["verdictCode"] = "UNEXPECTED_ZERO_EXIT"
        result["notes"] = "Child exited with code 0 (expected finite nonzero exit 1)"
        return result

    # Rule 6: Child exit must be numeric non-zero (specifically exit 1 from guard throw)
    if child_exit != 1:
        result["verdict"] = "FAIL"
        result["verdictCode"] = "UNEXPECTED_NONZERO_EXIT"
        result["notes"] = f"Child exited with code {child_exit} (expected normal guard refusal exit 1)"
        return result

    # Rule 7: Refusal phrase must match exact expected contract, not bare key presence
    expected_refusal = f"product auth/secret env vars present ({key})"
    refusal_in_stderr = expected_refusal in stderr_text
    refusal_in_stdout = expected_refusal in stdout_text
    if not (refusal_in_stderr or refusal_in_stdout):
        result["verdict"] = "FAIL"
        result["verdictCode"] = "WRONG_REFUSAL"
        result["notes"] = f"Expected refusal phrase '{expected_refusal}' missing in stderr/stdout"
        return result

    # Rule 8: Observer log verification (fail-closed: missing, malformed, or unconfirmed shutdown)
    if not observer_log_path or not os.path.exists(observer_log_path):
        result["verdict"] = "FAIL"
        result["verdictCode"] = "MISSING_COUNTER"
        result["notes"] = "Observer counter file missing; zero-upstream calls not established"
        return result

    try:
        with open(observer_log_path, "r", encoding="utf-8") as f:
            obs_data = json.load(f)
    except Exception as e:
        result["verdict"] = "FAIL"
        result["verdictCode"] = "MALFORMED_COUNTER"
        result["notes"] = f"Observer counter file malformed JSON: {e}"
        return result

    if not isinstance(obs_data, dict):
        result["verdict"] = "FAIL"
        result["verdictCode"] = "MALFORMED_COUNTER"
        result["notes"] = "Observer counter payload is not a JSON object"
        return result

    if "error" in obs_data and obs_data["error"]:
        result["verdict"] = "FAIL"
        result["verdictCode"] = "OBSERVER_ERROR"
        result["notes"] = f"Observer encountered runtime error: {obs_data['error']}"
        return result

    if "requestCount" not in obs_data or not isinstance(obs_data["requestCount"], int):
        result["verdict"] = "FAIL"
        result["verdictCode"] = "MALFORMED_COUNTER"
        result["notes"] = "Observer output missing valid integer requestCount"
        return result

    request_count = obs_data["requestCount"]
    result["observerHTTPRequests"] = request_count
    result["observerCleanShutdown"] = bool(obs_data.get("cleanShutdown", False))

    if request_count != 0:
        result["verdict"] = "FAIL"
        result["verdictCode"] = "POSITIVE_COUNTER"
        result["notes"] = f"Observer recorded {request_count} upstream HTTP requests (expected 0)"
        return result

    if not result["observerCleanShutdown"]:
        result["verdict"] = "FAIL"
        result["verdictCode"] = "OBSERVER_UNCLEAN_SHUTDOWN"
        result["notes"] = "Observer did not complete clean validated shutdown before read"
        return result

    # All criteria met: finite exit 1, exact refusal phrase, 0 requests measured with clean shutdown, port never bound
    result["verdict"] = "PASS"
    result["verdictCode"] = "VALID_COMPLETE_INPUT"
    result["notes"] = (
        f"Finite exit=1, exact refusal phrase present, port 18085 never acquired, "
        f"observer confirmed 0 HTTP requests via durable clean shutdown"
    )
    return result
