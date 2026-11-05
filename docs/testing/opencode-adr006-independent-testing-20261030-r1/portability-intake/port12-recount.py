#!/usr/bin/env python3
"""OpenCode independent QA — PORT-12 evidence recount (portability-author receipts).

Reads the author's receipts AS DATA and recounts them with this reviewer's own
parser. Never reruns the author's harness here (runtime reruns are separate
PORT cases). Output: JSON recount block printed to stdout (captured by qa-run).
"""
import json, pathlib, sys

base = pathlib.Path("/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/claude-deployment-portability-20261030-r1/receipts")

out = {"smokes": [], "durable": None, "failed_attempts": [], "substitutions": None}

# 1) Four declared smoke receipts: recount assertions by identity.
for name, declared in [
    ("smoke-worker-cloudrun-r5.json", 23),
    ("smoke-worker-vm-r2.json", 21),
    ("smoke-apphosting-cloudrun-r2.json", 22),
    ("smoke-apphosting-vm-r2.json", 22),
]:
    d = json.loads((base / name).read_text())
    checks = d.get("checks", [])
    passes = [c["name"] for c in checks if c.get("pass") is True]
    fails = [c["name"] for c in checks if c.get("pass") is not True]
    sig = [c["name"] for c in checks]
    out["smokes"].append({
        "file": name,
        "declared_passed": d.get("passed"), "declared_failed": d.get("failed"),
        "recount_checks": len(checks), "recount_pass": len(passes), "recount_fail": len(fails),
        "matches_declared": len(passes) == d.get("passed") == declared and not fails,
        "identity": d.get("identity"), "label": d.get("label"), "fe": d.get("fe"),
        "synthetic_fixture_only": d.get("fixture"),
        "check_names": sig,
        "first_party_pass_not_unauth_page": bool(d.get("fixture")),
    })

# 2) Durable suite: 174 counted by mixed suite, not per-case identities.
dur = json.loads((base / "durable-bff-pg-r1.json").read_text())
log = (base / "durable-bff-pg-r1.log").read_text()
files_line = [l for l in log.splitlines() if "Test Files" in l]
tests_line = [l for l in log.splitlines() if "Tests" in l]
out["durable"] = {
    "argv": dur.get("argv"), "extra_env": dur.get("extra_env"),
    "exit": dur.get("exit"),
    "log_files_line": files_line, "log_tests_line": tests_line,
    "classification": "mixed suite: src/lib/oidc (whole OIDC dir) + durable-attempts.test.ts + src/test; not 174 SQL-integration cases",
    "reviewer_composition_ref": "Commands/portability-durable-composition (own json-reporter rerun)",
}

# 3) Failed/overwritten receipts inventory.
for p in sorted((base / "failed").glob("*")):
    if p.name == "smoke-node-hostgo-r1.note.json":
        txt = p.read_text()
        out["failed_attempts"].append({"file": p.name, "json": json.loads(txt)})
        continue
    try:
        d = json.loads(p.read_text())
        out["failed_attempts"].append({"file": p.name, "keys": sorted(d.keys()), "summary_head": d.get("summary") or d.get("error") or d.get("label")})
    except Exception as e:  # non-JSON receipts
        out["failed_attempts"].append({"file": p.name, "parse_error": str(e)})

# 4) Substitution mapping incl. the disclosed be-cloudrun-start rewrite.
sub = json.loads((base / "profile-substitutions.json").read_text())
sub1 = json.loads((base / "profile-substitutions-run1.json").read_text())
out["substitutions"] = {
    "final": sub, "run1_retained": bool(sub1),
    "run1_file": "profile-substitutions-run1.json",
    "be-cloudrun-start-rewrite-disclosed-in": ["return.md receipts notes", "profile-substitutions-run1.json"],
}

ok = all(s["matches_declared"] for s in out["smokes"]) and len(out["smokes"]) == 4
out["recount_ok"] = ok
print(json.dumps(out, indent=1))
