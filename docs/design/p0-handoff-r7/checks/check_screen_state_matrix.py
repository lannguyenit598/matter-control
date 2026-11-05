#!/usr/bin/env python3
"""Check traceability matrix integrity: 20 FRs, 13 screens, 9 states each, 63 ACs, 14 NFRs, 3 GWs."""
import json
import os
import sys

matrix_path = "/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/design/p0-handoff-r7/screen-state-matrix.json"

if not os.path.exists(matrix_path):
    print(f"FAIL: Matrix file not found at {matrix_path}", file=sys.stderr)
    sys.exit(1)

with open(matrix_path, "r", encoding="utf-8") as f:
    d = json.load(f)

# 1. Check requirements (20 FRs)
reqs = d.get("requirements", [])
print(f"Total requirements: {len(reqs)}")
assert len(reqs) == 20, f"Expected 20 requirements, got {len(reqs)}"
fr_ids = {r["id"] for r in reqs}
expected_fr_ids = {f"FR-{i:03d}" for i in range(1, 21)}
assert fr_ids == expected_fr_ids, f"Mismatch in FR IDs: {expected_fr_ids - fr_ids}"
print("1. All 20 FRs present (FR-001..FR-020).")

# 2. Check screens (13 screens with all 9 states)
screens = d.get("screens", [])
print(f"Total screens: {len(screens)}")
assert len(screens) == 13, f"Expected 13 screens, got {len(screens)}"
scr_ids = {s["id"] for s in screens}
expected_scr_ids = {f"SCR-{i:02d}" for i in range(1, 14)}
assert scr_ids == expected_scr_ids, f"Mismatch in SCR IDs: {expected_scr_ids - scr_ids}"

required_states = {"loading", "empty", "no_match", "unavailable", "forbidden", "stale", "conflict", "partial", "recovery"}
for s in screens:
    states = s.get("states", {})
    state_names = set(states.keys())
    assert required_states.issubset(state_names), f"Screen {s['id']} missing states: {required_states - state_names}"
print("2. All 13 screens declared with all 9 required system states.")

# 3. Check Golden Workflows (3 GWs)
gws = d.get("golden_workflows", [])
print(f"Total Golden Workflows: {len(gws)}")
assert len(gws) == 3, f"Expected 3 Golden Workflows, got {len(gws)}"
gw_ids = {g["id"] for g in gws}
assert gw_ids == {"GW-01", "GW-02", "GW-03"}, f"Mismatch in GW IDs: {gw_ids}"
print("3. All 3 Golden Workflows present (GW-01, GW-02, GW-03).")

# 4. Check AC IDs (63) and NFR IDs (14)
ac_ids = d.get("all_acceptance_ids", [])
nfr_ids = d.get("nfr_ids", [])
print(f"Total AC IDs: {len(ac_ids)}; Total NFR IDs: {len(nfr_ids)}")
assert len(ac_ids) == 63, f"Expected 63 AC IDs, got {len(ac_ids)}"
assert len(nfr_ids) == 14, f"Expected 14 NFR IDs, got {len(nfr_ids)}"
print("4. All 63 AC IDs and 14 NFR IDs verified.")

# 5. Check R7 refinements documented
r7 = d.get("r7_refinements", {})
assert "R6-E01" in r7 and "R6-E02" in r7 and "R6-E03" in r7, "All R6 intake findings must be addressed in r7_refinements"
print("5. R7 refinements (R6-E01, R6-E02, R6-E03) verified in matrix metadata.")

print("PASS: Screen state matrix traceability and schema verification completed successfully.")
