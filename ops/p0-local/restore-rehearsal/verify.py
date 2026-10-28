"""Pure acceptance checks for a synthetic restore; no database or resource access."""

import json
import re
from urllib.parse import urlsplit, urlunsplit, parse_qsl, unquote
import sys
from pathlib import Path


def isolated_dsn(base, database):
    if not re.fullmatch(r"[a-z][a-z0-9_]{0,62}", database) or any(c.isspace() for c in base):
        raise ValueError("invalid database URI")
    uri = urlsplit(base)
    if uri.scheme not in ("postgres", "postgresql") or uri.hostname not in ("127.0.0.1", "localhost", "::1") or uri.fragment:
        raise ValueError("a local PostgreSQL URI is required")
    if any(k.lower() in {"dbname", "database", "host", "hostaddr", "port", "service", "servicefile"} for k, _ in parse_qsl(uri.query)):
        raise ValueError("connection target overrides are not allowed")
    return urlunsplit(uri._replace(path="/" + database))


def compare_readback(expected, restored):
    if not isinstance(expected, dict) or not isinstance(restored, dict):
        raise ValueError("readback must be an object")
    counters = {"matterCount", "objectsChecked", "objectFailures"}
    for report in (expected, restored):
        for key in counters:
            if type(report.get(key)) is not int or report[key] < 0:
                raise ValueError("invalid readback counters")
        if report["matterCount"] != len(report.keys() - counters):
            raise ValueError("matter count does not match readback identities")
    expected_ids = expected.keys() - counters
    restored_ids = restored.keys() - counters
    differences = {
        "missing_matters": sorted(expected_ids - restored_ids),
        "unexpected_matters": sorted(restored_ids - expected_ids),
        "differing_matters": sorted(
            key for key in expected_ids & restored_ids if expected[key] != restored[key]
        ),
        "counters_match": all(expected[key] == restored[key] for key in counters),
        "object_failures": restored["objectFailures"],
    }
    ok = (
        not differences["missing_matters"]
        and not differences["unexpected_matters"]
        and not differences["differing_matters"]
        and differences["counters_match"]
        and differences["object_failures"] == 0
    )
    return ok, differences


def summary_errors(summary):
    if not isinstance(summary, dict):
        return ["summary must be an object"]
    required = {
        "census": "IDENTICAL",
        "objects": "IDENTICAL",
        "marker_in_source": "1",
        "marker_in_restore": "0",
        "readback_restored_vs_source": "IDENTICAL",
        "readback_after_restart": "IDENTICAL",
        "missing_object": "DETECTED",
    }
    errors = [key for key, expected in required.items() if summary.get(key) != expected]
    altered = summary.get("altered_object_readback_exit")
    if type(altered) is not int or altered <= 0:
        errors.append("altered_object_readback_exit")
    refusals = summary.get("archive_refusals")
    for kind in ("corrupt", "truncated"):
        refusal = refusals.get(kind) if isinstance(refusals, dict) else None
        if (
            not isinstance(refusal, dict)
            or type(refusal.get("exit")) is not int
            or refusal["exit"] <= 0
            or type(refusal.get("tables_left")) is not int
            or refusal["tables_left"] != 0
        ):
            errors.append(kind + "_archive_refusal")
    return errors


def main(argv):
    if argv == ["dsn-user"]:
        base = sys.stdin.read()
        isolated_dsn(base, "mc_rr_validation")
        user = unquote(urlsplit(base).username or "")
        if not user: raise ValueError("database user is required")
        print(user)
        return 0
    if len(argv) == 2 and argv[0] == "dsn":
        print(isolated_dsn(sys.stdin.read(), argv[1]))
        return 0
    if len(argv) == 4 and argv[0] == "readback":
        expected = json.loads(Path(argv[1]).read_text())
        restored = json.loads(Path(argv[2]).read_text())
        ok, differences = compare_readback(expected, restored)
        Path(argv[3]).write_text(json.dumps(differences, indent=2) + "\n")
        print("IDENTICAL" if ok else "DIFFERENT")
        return 0 if ok else 1
    if len(argv) == 2 and argv[0] == "summary":
        errors = summary_errors(json.loads(Path(argv[1]).read_text()))
        if errors:
            print("Restore acceptance failed: " + ", ".join(errors), file=sys.stderr)
            return 1
        print("Restore acceptance checks passed")
        return 0
    print("usage: verify.py readback EXPECTED RESTORED DIFF | summary SUMMARY", file=sys.stderr)
    return 2


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except (OSError, ValueError, TypeError, KeyError):
        print("Restore evidence is missing or malformed", file=sys.stderr)
        raise SystemExit(1)
