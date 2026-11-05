#!/usr/bin/env python3
"""Check canonical Atlas dataset, 24 records, action census 4/3/5/0, 7 edges, and proof relations."""
import json
import re
import sys

html_path = "/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/design/p0-handoff-r7/prototype.html"

with open(html_path, "r", encoding="utf-8") as f:
    text = f.read()

m = re.search(r'<script id="atlas-data"[^>]*>(.*?)</script>', text, re.DOTALL)
if not m:
    print("FAIL: atlas-data script tag not found", file=sys.stderr)
    sys.exit(1)

data = json.loads(m.group(1))
records = data.get("records", [])
edges = data.get("edges", [])

print(f"Total canonical records in atlas-data: {len(records)}")
assert len(records) == 24, f"Expected 24 canonical records, got {len(records)}"

reqs = [r for r in records if r["type"] == "req"]
actions = [r for r in records if r["type"] == "action"]

assert len(reqs) == 12, f"Expected 12 requirements, got {len(reqs)}"
assert len(actions) == 12, f"Expected 12 actions, got {len(actions)}"
print("1. Canonical 24 records: exactly 12 requirements and 12 actions verified.")

# Check action census: 4 COMPLETED, 3 WAITING, 5 NOT_STARTED, 0 IN_PROGRESS
exec_counts = {}
for a in actions:
    exec_counts[a["exec"]] = exec_counts.get(a["exec"], 0) + 1

print(f"Action execution census: {exec_counts}")
assert exec_counts.get("COMPLETED", 0) == 4, f"Expected 4 COMPLETED actions, got {exec_counts.get('COMPLETED')}"
assert exec_counts.get("WAITING", 0) == 3, f"Expected 3 WAITING actions, got {exec_counts.get('WAITING')}"
assert exec_counts.get("NOT_STARTED", 0) == 5, f"Expected 5 NOT_STARTED actions, got {exec_counts.get('NOT_STARTED')}"
assert exec_counts.get("IN_PROGRESS", 0) == 0, f"Expected 0 IN_PROGRESS actions in canonical Atlas T0, got {exec_counts.get('IN_PROGRESS')}"
print("2. Action execution census 4/3/5/0 verified strictly matching canonical Atlas T0.")

# Check edges count: exactly 7 edges
print(f"Total dependency edges: {len(edges)}")
assert len(edges) == 7, f"Expected 7 dependency edges, got {len(edges)}"
print("3. Exactly 7 dependency edges verified.")

# Check AC-06 canonical facts: COMPLETED, READY, owner U-03
by_id = {r["id"]: r for r in records}
ac06 = by_id.get("AC-06")
assert ac06, "AC-06 must exist in canonical dataset"
assert ac06["exec"] == "COMPLETED", f"AC-06 exec must be COMPLETED, got {ac06['exec']}"
assert ac06["dep"] == "READY", f"AC-06 dep must be READY, got {ac06['dep']}"
assert ac06["owner"] == "U-03", f"AC-06 owner must be U-03, got {ac06['owner']}"
assert ac06["explicitNotRequired"] is True, "AC-06 explicitNotRequired must be true"
print("4. AC-06 canonical facts (COMPLETED, READY, owner U-03) verified.")

# Check AC-05 proof applicability: explicitNotRequired is True, does not borrow RQ-05 proof
ac05 = by_id.get("AC-05")
assert ac05, "AC-05 must exist in canonical dataset"
assert ac05["explicitNotRequired"] is True, "AC-05 explicitNotRequired must be true"
assert ac05["ver"] == "NOT_REQUIRED", f"AC-05 ver must be NOT_REQUIRED, got {ac05['ver']}"
print("5. AC-05 explicit NOT_REQUIRED applicability verified.")

# Check RQ-03 and RQ-05 historical baseline VERIFIED and caveat
rq03 = by_id.get("RQ-03")
rq05 = by_id.get("RQ-05")
assert rq03["ver"] == "VERIFIED", f"RQ-03 baseline ver must be VERIFIED, got {rq03['ver']}"
assert rq05["ver"] == "VERIFIED", f"RQ-05 baseline ver must be VERIFIED, got {rq05['ver']}"
assert rq03["validProof"] is False, "RQ-03 validProof must be false under current policy caveat"
assert rq05["validProof"] is False, "RQ-05 validProof must be false under current policy caveat"
print("6. RQ-03 and RQ-05 historical baseline VERIFIED with current policy validProof=false verified.")

# Check AC-DEMO-PROOF is kept separate from canonical 24 records
assert "AC-DEMO-PROOF" not in by_id, "AC-DEMO-PROOF must NOT be included in canonical 24 records"
print("7. AC-DEMO-PROOF fixture verified strictly separated from canonical 24 records.")

print("PASS: All canonical dataset facts, census, edges, and proof relations verified.")
