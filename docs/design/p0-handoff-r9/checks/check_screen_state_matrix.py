#!/usr/bin/env python3
"""SOURCE_CHECKED structural coverage check for screen-state-matrix.json.

R8's validation-plan.md referenced this exact filename as a check that did
not exist (R8-N04). This is the minimal version of it: it proves the matrix
carries the exact counts the package claims (20 FR, 63 AC, 14 NFR, 13
screens with the full nine-state axis set, 3 Golden Workflows) and that the
requirement<->screen mapping is reciprocal — every requirement names at
least one screen that in turn names it back, and vice versa.

This is STRUCTURAL coverage only: it proves the matrix's own bookkeeping is
internally consistent and matches the claimed counts. It does not and
cannot prove a behavioral acceptance criterion passes; that distinction is
stated in validation-plan.md and must not be blurred here.
"""
import json
import os
import sys

PKG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MATRIX = os.path.join(PKG, "screen-state-matrix.json")

EXPECTED_FR = 20
EXPECTED_AC = 63
EXPECTED_NFR = 14
EXPECTED_SCREENS = 13
EXPECTED_STATES_PER_SCREEN = 9
EXPECTED_GW = 3

results = []


def check(label, ok, detail=""):
    results.append((label, ok, detail))
    print(("PASS  " if ok else "FAIL  ") + label + (("  — " + detail) if detail and not ok else ""))
    if not ok:
        print("FAIL: " + label + ("  — " + detail if detail else ""), file=sys.stderr)


def main():
    with open(MATRIX, encoding="utf-8") as f:
        d = json.load(f)

    reqs = d.get("requirements", [])
    screens = d.get("screens", [])
    gws = d.get("golden_workflows", [])
    acs = d.get("all_acceptance_ids", [])
    nfrs = d.get("nfr_ids", [])

    check("exactly %d FR requirements" % EXPECTED_FR, len(reqs) == EXPECTED_FR, "found %d" % len(reqs))
    check("exactly %d AC acceptance ids" % EXPECTED_AC, len(acs) == EXPECTED_AC, "found %d" % len(acs))
    check("exactly %d NFR ids" % EXPECTED_NFR, len(nfrs) == EXPECTED_NFR, "found %d" % len(nfrs))
    check("exactly %d screens" % EXPECTED_SCREENS, len(screens) == EXPECTED_SCREENS, "found %d" % len(screens))
    check("exactly %d Golden Workflows" % EXPECTED_GW, len(gws) == EXPECTED_GW, "found %d" % len(gws))

    req_ids = {r["id"] for r in reqs}
    check("no duplicate requirement ids", len(req_ids) == len(reqs))
    screen_ids = {s["id"] for s in screens}
    check("no duplicate screen ids", len(screen_ids) == len(screens))

    bad_state_count = [s["id"] for s in screens if len(s.get("states", [])) != EXPECTED_STATES_PER_SCREEN]
    check("every screen carries the full nine-state axis set", not bad_state_count, str(bad_state_count))

    # Reciprocal requirement <-> screen mapping.
    missing_fwd = [r["id"] for r in reqs if not r.get("screens")]
    check("every requirement names at least one screen", not missing_fwd, str(missing_fwd))
    missing_back = [s["id"] for s in screens if not s.get("requirements")]
    check("every screen names at least one requirement", not missing_back, str(missing_back))

    broken_pairs = []
    for r in reqs:
        for sid in r.get("screens", []):
            s = next((x for x in screens if x["id"] == sid), None)
            if s is None:
                broken_pairs.append((r["id"], sid, "screen does not exist"))
            elif r["id"] not in s.get("requirements", []):
                broken_pairs.append((r["id"], sid, "screen does not name the requirement back"))
    check("requirement -> screen references are reciprocal", not broken_pairs, str(broken_pairs))

    broken_pairs2 = []
    for s in screens:
        for rid in s.get("requirements", []):
            r = next((x for x in reqs if x["id"] == rid), None)
            if r is None:
                broken_pairs2.append((s["id"], rid, "requirement does not exist"))
            elif s["id"] not in r.get("screens", []):
                broken_pairs2.append((s["id"], rid, "requirement does not name the screen back"))
    check("screen -> requirement references are reciprocal", not broken_pairs2, str(broken_pairs2))

    if all(ok for _, ok, _ in results):
        print("\nSOURCE_CHECKED: screen-state-matrix.json structural coverage (20 FR / 63 AC / 14 NFR / "
              "13 screens x 9 states / 3 GWs, reciprocal mapping) confirmed.")
        print("Limits: structural presence only. This is not a behavioral acceptance-criterion PASS.")
        return 0
    print("\nFAILURE: one or more structural coverage checks failed.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
