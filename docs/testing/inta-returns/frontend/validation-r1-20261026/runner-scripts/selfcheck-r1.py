#!/usr/bin/env python3
"""
selfcheck-r1.py — In-process Deterministic Self-Check Suite
Part of MC-002-INTA-FE-VALIDATION-R1
Author: Actual Antigravity (Gemini 3.8 Flash High)

Tests the ACTUAL evaluation logic in guard_evaluator.py using tempfiles/mocks
without any live network or process lifecycle.

Covers at least the 9 required cases:
1. missingcounter
2. malformedcounter
3. positivecounter
4. observererror
5. transientlistener
6. probeerror
7. timeout
8. wrongrefusal
9. validcompleteinput
"""

import json
import os
import shutil
import sys
import tempfile
from datetime import datetime, timezone

# Import the actual evaluator module used by the runner
import guard_evaluator


def run_selfcheck():
    test_dir = tempfile.mkdtemp(prefix="mc002-inta-selfcheck-r1-")
    start_utc = datetime.now(timezone.utc).isoformat()
    print("=" * 64)
    print("MC-002-INTA-FE-VALIDATION-R1: Deterministic Runner Self-Check")
    print(f"Start UTC: {start_utc}")
    print(f"Scratch Directory: {test_dir}")
    print("=" * 64)

    test_cases = [
        {
            "name": "1. missingcounter",
            "desc": "Observer file does not exist (e.g. runner defaulted to 0 in old run)",
            "key": "API_TOKEN",
            "variant": "nonempty",
            "child_exit": 1,
            "timed_out": False,
            "stderr": "⨯ Failed to load next.config.ts\nError: Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            "stdout": "",
            "observer_payload": None,  # file not created
            "listener_during": False,
            "listener_after": False,
            "probe_error": False,
            "expected_verdict": "FAIL",
            "expected_code": "MISSING_COUNTER",
        },
        {
            "name": "2. malformedcounter",
            "desc": "Observer file contains invalid JSON or non-integer requestCount",
            "key": "API_TOKEN",
            "variant": "nonempty",
            "child_exit": 1,
            "timed_out": False,
            "stderr": "Error: Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            "stdout": "",
            "observer_payload": "{not valid json",
            "listener_during": False,
            "listener_after": False,
            "probe_error": False,
            "expected_verdict": "FAIL",
            "expected_code": "MALFORMED_COUNTER",
        },
        {
            "name": "3. positivecounter",
            "desc": "Observer recorded >0 HTTP requests (upstream was called)",
            "key": "API_TOKEN",
            "variant": "nonempty",
            "child_exit": 1,
            "timed_out": False,
            "stderr": "Error: Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            "stdout": "",
            "observer_payload": {"requestCount": 1, "cleanShutdown": True},
            "listener_during": False,
            "listener_after": False,
            "probe_error": False,
            "expected_verdict": "FAIL",
            "expected_code": "POSITIVE_COUNTER",
        },
        {
            "name": "4. observererror",
            "desc": "Observer failed to bind or encountered internal exception",
            "key": "API_TOKEN",
            "variant": "nonempty",
            "child_exit": 1,
            "timed_out": False,
            "stderr": "Error: Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            "stdout": "",
            "observer_payload": {"error": "Address already in use on 18086", "cleanShutdown": False},
            "listener_during": False,
            "listener_after": False,
            "probe_error": False,
            "expected_verdict": "FAIL",
            "expected_code": "OBSERVER_ERROR",
        },
        {
            "name": "5. transientlistener",
            "desc": "Port 18085 listener was acquired during child execution (FEVAL-F01)",
            "key": "API_TOKEN",
            "variant": "nonempty",
            "child_exit": 1,
            "timed_out": False,
            "stderr": "Error: Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            "stdout": "✓ Ready in 196ms",
            "observer_payload": {"requestCount": 0, "cleanShutdown": True},
            "listener_during": True,
            "listener_after": False,
            "probe_error": False,
            "expected_verdict": "FAIL",
            "expected_code": "FAIL_AGAINST_NEVER_LISTEN",
        },
        {
            "name": "6. probeerror",
            "desc": "Port probe command failed or permission denied (cannot establish absence)",
            "key": "API_TOKEN",
            "variant": "nonempty",
            "child_exit": 1,
            "timed_out": False,
            "stderr": "Error: Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            "stdout": "",
            "observer_payload": {"requestCount": 0, "cleanShutdown": True},
            "listener_during": False,
            "listener_after": False,
            "probe_error": True,
            "probe_error_detail": "lsof exit code 1",
            "expected_verdict": "FAIL",
            "expected_code": "PROBE_ERROR",
        },
        {
            "name": "7. timeout",
            "desc": "Child process hung or did not exit within timeout limit",
            "key": "API_TOKEN",
            "variant": "nonempty",
            "child_exit": 124,
            "timed_out": True,
            "stderr": "",
            "stdout": "",
            "observer_payload": {"requestCount": 0, "cleanShutdown": True},
            "listener_during": False,
            "listener_after": False,
            "probe_error": False,
            "expected_verdict": "FAIL",
            "expected_code": "TIMEOUT",
        },
        {
            "name": "8. wrongrefusal",
            "desc": "Child exited with error but without exact key refusal phrase (e.g. syntax error or generic error)",
            "key": "API_TOKEN",
            "variant": "nonempty",
            "child_exit": 1,
            "timed_out": False,
            "stderr": "TypeError: Cannot read properties of undefined (reading 'API_TOKEN')",
            "stdout": "",
            "observer_payload": {"requestCount": 0, "cleanShutdown": True},
            "listener_during": False,
            "listener_after": False,
            "probe_error": False,
            "expected_verdict": "FAIL",
            "expected_code": "WRONG_REFUSAL",
        },
        {
            "name": "9. validcompleteinput",
            "desc": "Exit 1, exact refusal phrase, 0 requests measured with clean observer shutdown, port never bound",
            "key": "API_TOKEN",
            "variant": "nonempty",
            "child_exit": 1,
            "timed_out": False,
            "stderr": "⨯ Failed to load next.config.ts\nError: Harness startup refused: product auth/secret env vars present (API_TOKEN)",
            "stdout": "",
            "observer_payload": {"requestCount": 0, "cleanShutdown": True},
            "listener_during": False,
            "listener_after": False,
            "probe_error": False,
            "expected_verdict": "PASS",
            "expected_code": "VALID_COMPLETE_INPUT",
        },
    ]

    passed_tests = 0
    failed_tests = 0
    results_record = []

    try:
        for tc in test_cases:
            tc_dir = os.path.join(test_dir, tc["name"].split()[1])
            os.makedirs(tc_dir, exist_ok=True)

            obs_path = None
            if tc["observer_payload"] is not None:
                obs_path = os.path.join(tc_dir, "observer.json")
                with open(obs_path, "w", encoding="utf-8") as f:
                    if isinstance(tc["observer_payload"], str):
                        f.write(tc["observer_payload"])
                    else:
                        json.dump(tc["observer_payload"], f)

            eval_res = guard_evaluator.evaluate_variant(
                key=tc["key"],
                variant_label=tc["variant"],
                child_exit=tc["child_exit"],
                timed_out=tc["timed_out"],
                stderr_text=tc["stderr"],
                stdout_text=tc["stdout"],
                observer_log_path=obs_path,
                listener_during=tc["listener_during"],
                listener_after=tc["listener_after"],
                probe_error=tc.get("probe_error", False),
                probe_error_detail=tc.get("probe_error_detail", ""),
            )

            is_pass = (
                eval_res["verdict"] == tc["expected_verdict"]
                and eval_res["verdictCode"] == tc["expected_code"]
            )

            status_str = "PASS" if is_pass else "FAIL"
            if is_pass:
                passed_tests += 1
            else:
                failed_tests += 1

            print(f"[{status_str}] {tc['name']}")
            print(f"       Description:     {tc['desc']}")
            print(f"       Expected:        verdict={tc['expected_verdict']}, code={tc['expected_code']}")
            print(f"       Actual:          verdict={eval_res['verdict']}, code={eval_res['verdictCode']}")
            print(f"       Notes:           {eval_res['notes']}")
            print()

            results_record.append({
                "testCase": tc["name"],
                "description": tc["desc"],
                "expectedVerdict": tc["expected_verdict"],
                "expectedCode": tc["expected_code"],
                "actualVerdict": eval_res["verdict"],
                "actualCode": eval_res["verdictCode"],
                "pass": is_pass,
                "evalDetails": eval_res,
            })

    finally:
        shutil.rmtree(test_dir, ignore_errors=True)

    end_utc = datetime.now(timezone.utc).isoformat()
    print("=" * 64)
    print(f"SUMMARY: {passed_tests} PASS / {failed_tests} FAIL out of {len(test_cases)} cases")
    print(f"End UTC: {end_utc}")
    print("=" * 64)

    return {
        "suite": "runner-selfcheck-r1",
        "startUTC": start_utc,
        "endUTC": end_utc,
        "totalCases": len(test_cases),
        "passed": passed_tests,
        "failed": failed_tests,
        "allPassed": (failed_tests == 0),
        "cases": results_record,
    }


if __name__ == "__main__":
    res = run_selfcheck()
    output_json = sys.argv[1] if len(sys.argv) > 1 else None
    if output_json:
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(res, f, indent=2)
    sys.exit(0 if res["allPassed"] else 1)
