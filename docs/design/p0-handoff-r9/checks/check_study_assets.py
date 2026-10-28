#!/usr/bin/env python3
"""DR7-06: the AC-137 study assets must be a runnable setup, not prose.

Re-derives the facilitator key's expected answers from the published datasets,
using the same predicates the approved state semantics describe, and compares
them with the stored key. It also enforces the separation rule: no answer-key
material may appear in any participant-visible file.
"""
import json
import os
import re
import sys

PKG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_study_datasets as B          # noqa: E402  (shared predicates)

failures = []


def check(label, ok, detail=""):
    print(("PASS  " if ok else "FAIL  ") + label + ("" if ok else " — " + detail))
    if not ok:
        failures.append(label)


key = json.load(open(os.path.join(PKG, "study-facilitator", "facilitator-key.json"), encoding="utf-8"))
datasets = {}
for letter in ("a", "b"):
    datasets[letter] = json.load(open(os.path.join(PKG, "study", "scenario-%s.json" % letter), encoding="utf-8"))

for letter, ds in datasets.items():
    name = ds["id"]
    reqs = [r for r in ds["records"] if r["type"] == "req"]
    acts = [r for r in ds["records"] if r["type"] == "action"]
    check("%s has exactly 50 typed records" % name, len(ds["records"]) == 50, str(len(ds["records"])))
    check("%s splits into requirements and actions" % name, len(reqs) + len(acts) == 50
          and len(reqs) > 0 and len(acts) > 0, "%d/%d" % (len(reqs), len(acts)))
    ids = [r["id"] for r in ds["records"]]
    check("%s record ids are unique" % name, len(set(ids)) == 50)
    check("%s every record has a scoped owner" % name, all(r.get("owner") for r in ds["records"]))
    check("%s every edge references records that exist" % name,
          all(e["from"] in ids and e["to"] in ids for e in ds["edges"]))
    check("%s every edge carries a declared gate kind" % name,
          all(e["gate"] in ("proof", "completion") for e in ds["edges"]))
    check("%s dependency graph is acyclic" % name, B.acyclic(ds))
    check("%s declares an evidence requirement for every requirement" % name,
          {e["subject"] for e in ds["evidenceRequirements"]} == {r["id"] for r in reqs})
    check("%s declares a required prerequisite set on every milestone" % name,
          all(m.get("required") for m in ds["milestones"]))
    check("%s milestone prerequisites all exist" % name,
          all(p in ids for m in ds["milestones"] for p in m["required"]))

    B._dep_cache.clear()
    derived = B.derive_answers(ds)
    stored = key["expectedAnswers"][name]
    check("%s major state in the key is re-derivable from the data" % name,
          derived["majorState"] == stored["majorState"],
          json.dumps(derived["majorState"])[:160])
    check("%s top blocker in the key is re-derivable from the data" % name,
          derived["topBlocker"] == stored["topBlocker"], str(derived["topBlocker"].get("record")))
    check("%s next owner/action in the key is re-derivable from the data" % name,
          derived["nextOwnerAction"] == stored["nextOwnerAction"], str(derived["nextOwnerAction"]))
    # A single defensible answer requires a clear margin, not a tie broken by
    # the sort order. Recompute every root's reach and compare the top two.
    B._dep_cache.clear()
    blocked = [r["id"] for r in ds["records"] if B.dependency(ds, r["id"])[0] == "BLOCKED"]
    reach = {}
    for rid in blocked:
        for rc in B.root_causes(ds, rid):
            reach.setdefault(rc, set()).add(rid)
    ranked = sorted(((len(v), k) for k, v in reach.items()), reverse=True)
    top = ranked[0] if ranked else (0, None)
    runner = ranked[1] if len(ranked) > 1 else (0, None)
    check("%s top blocker is unambiguous by reach, not by a tiebreak" % name,
          top[1] == derived["topBlocker"]["record"] and top[0] >= 5 and top[0] > runner[0],
          "top %s reaches %d, runner-up %s reaches %d" % (top[1], top[0], runner[1], runner[0]))
    if derived["nextOwnerAction"]["kind"] == "eligible-action":
        elig = [r for r in ds["records"] if B.eligible(ds, r)]
        check("%s has exactly one eligible Action, so question three has one answer" % name,
              len(elig) == 1, str([r["id"] for r in elig]))

# the protocol itself must be unchanged
p = key["protocol"]
check("protocol keeps exactly five real managers", "five real legal operations managers" in p["participants"])
check("protocol keeps the two unseen 50-row matters", "50-row" in p["materials"])
check("protocol keeps counterbalanced order", "A then B" in p["counterbalancing"] and "B then A" in p["counterbalancing"])
check("protocol keeps the three questions", p["questions"] == ["Major state", "Top blocker", "Next owner and permitted action"])
check("protocol keeps the four-of-five, ten-second, per-scenario threshold",
      "four of five" in p["threshold"] and "ten seconds" in p["threshold"] and "each scenario" in p["threshold"])
check("protocol keeps the no-averaging rule", "mean below ten seconds does not rescue" in p["noAveraging"])
check("scoring ledger has ten rows, five participants by two scenarios",
      len(key["scoringLedger"]["rows"]) == 10)
check("trial status is honestly NOT_RUN", key["status"].startswith("TRIAL_NOT_RUN"))
check("no timing or accuracy value is pre-filled",
      all(all(cell == "" for cell in row[2:]) for row in key["scoringLedger"]["rows"]))

# separation: nothing facilitator-only may leak into participant-visible files
participant_files = [os.path.join(PKG, "study", f) for f in sorted(os.listdir(os.path.join(PKG, "study")))]
leak_markers = ["expectedAnswers", "facilitator", "answer key", "answerKey", "Top blocker:", "scoringLedger",
                "TRIAL_NOT_RUN", "threshold"]
for path in participant_files:
    text = open(path, encoding="utf-8").read()
    hits = [m for m in leak_markers if m.lower() in text.lower()]
    check("participant file %s carries no facilitator material" % os.path.basename(path), not hits, str(hits))

check("the facilitator key lives outside the participant directory",
      os.path.isfile(os.path.join(PKG, "study-facilitator", "facilitator-key.json"))
      and not os.path.exists(os.path.join(PKG, "study", "facilitator-key.json")))
inventory = sorted(os.path.basename(f) for f in participant_files)
check("the participant bundle inventory is exactly the three expected files",
      inventory == ["participant-surface.html", "scenario-a.json", "scenario-b.json"], str(inventory))

surface = open(os.path.join(PKG, "study", "participant-surface.html"), encoding="utf-8").read()
check("the participant surface embeds both datasets and nothing else",
      "SCENARIO-A" in surface and "SCENARIO-B" in surface and "facilitator" not in surface.lower())
check("the participant surface is self-contained", "http://" not in surface and "https://" not in surface)

print("\nParticipant bundle inventory: " + ", ".join(inventory))
print("Facilitator-only material: study-facilitator/facilitator-key.json (never served, never embedded)")
if failures:
    print("\nFAILED: %d study-asset check(s)" % len(failures))
    sys.exit(1)
print("\nSOURCE_CHECKED: both study datasets are structurally valid and every expected answer is re-derived from the data.")
print("TRIAL: NOT_RUN / AWAITING_HUMAN_TRIAL. No participant was contacted and no timing or accuracy was collected.")
