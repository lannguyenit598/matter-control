#!/usr/bin/env python3
"""OV-R13-01 validation: parse deployment YAML files in their RENDERED form.

ops/deploy templates carry {{VAR}} placeholders (rendered by ops/deploy/profiles.mjs
with operator values at deploy time). Raw `{{VAR}}` is flow-mapping syntax to a YAML
parser, so — matching the OpenCode verify-wave R13 method — each file is parsed after
substituting placeholders with YAML-safe strings. A structural assertion for
migrate-job.yaml additionally checks the keys OV-R13-01 was about.

Usage: python3 validate-yaml.py FILE [FILE ...]
Exit 0 iff every file parses (and migrate-job.yaml, when present, passes structure).
"""
import re
import sys

import yaml

PLACEHOLDER = re.compile(r"\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}")


def rendered(text):
    return PLACEHOLDER.sub(lambda m: "PLACEHOLDER_" + m.group(1).upper().replace(".", "_").replace("-", "_"), text)


def check_migrate_job(doc):
    """OV-R13-01 structure assertion: job pod spec keys are siblings, not nested."""
    spec = doc["spec"]["template"]["spec"]
    assert spec["maxRetries"] == 0, "maxRetries must be a pod-spec sibling (was nested)"
    assert spec["timeoutSeconds"] == 600, "timeoutSeconds must be a pod-spec sibling (was nested)"
    containers = spec["containers"]
    assert isinstance(containers, list) and len(containers) == 1, "one container expected"
    env = containers[0]["env"]
    names = [e["name"] for e in env]
    expected = [
        "MC_OBJECT_BACKEND", "MC_R2_ENDPOINT", "MC_R2_BUCKET",
        "MC_OIDC_ISSUER", "MC_OIDC_INTROSPECTION_URL", "MC_OIDC_AUDIENCE",
        "MC_OIDC_API_KEY_FILE", "MC_DATABASE_URL", "MC_MIGRATE_DATABASE_URL",
        "MC_R2_ACCESS_KEY_ID", "MC_R2_SECRET_ACCESS_KEY",
    ]
    assert names == expected, f"env entries drifted: {names}"
    return "structure OK (maxRetries/timeoutSeconds/containers under spec.template.spec; 11 env entries)"


def main(argv):
    if len(argv) < 2:
        print("usage: validate-yaml.py FILE [FILE ...]", file=sys.stderr)
        return 2
    rc = 0
    passed = 0
    for path in argv[1:]:
        try:
            doc = yaml.safe_load(rendered(open(path, encoding="utf-8").read()))
            note = ""
            if path.endswith("migrate-job.yaml"):
                note = " | " + check_migrate_job(doc)
            print(f"OK   {path}{note}")
            passed += 1
        except Exception as exc:  # noqa: BLE001 — receipt must show every failure verbatim
            print(f"FAIL {path}: {type(exc).__name__}: {exc}")
            rc = 1
    print(f"SUMMARY {passed}/{len(argv) - 1} parsed+validated")
    return rc


if __name__ == "__main__":
    sys.exit(main(sys.argv))
