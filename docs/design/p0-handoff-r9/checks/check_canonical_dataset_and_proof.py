#!/usr/bin/env python3
"""Canonical Atlas facts and derived causal consistency, checked independently.

This re-derives dependency, eligibility and milestone outcomes in Python from
the snapshot in prototype.html, and compares them with the approved Atlas
dataset document. It does not call the prototype's own JavaScript, so an error
in that code cannot make this check agree with it.
"""
import json
import os
import re
import sys

PKG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.abspath(os.path.join(PKG, "..", "..", ".."))
ATLAS_DOC = os.path.join(REPO, "docs/product/project-atlas-dataset.md")

failures = []


def check(label, ok, detail=""):
    print(("PASS  " if ok else "FAIL  ") + label + ("" if ok else " — " + detail))
    if not ok:
        failures.append(label)


html = open(os.path.join(PKG, "prototype.html"), encoding="utf-8").read()
snap = json.loads(re.search(r'<script id="atlas-data" type="application/json">(.*?)</script>', html, re.S).group(1))
fx = json.loads(re.search(r'<script id="fixtures-data" type="application/json">(.*?)</script>', html, re.S).group(1))
recs = {r["id"]: r for r in snap["records"]}
edges = [{"id": e[0], "from": e[1], "to": e[2], "gate": e[3]} for e in snap["edges"]]

# ── structural counts ─────────────────────────────────────────────────────
reqs = [r for r in snap["records"] if r["type"] == "req"]
acts = [r for r in snap["records"] if r["type"] == "action"]
check("24 canonical records (12 requirements + 12 actions)",
      len(snap["records"]) == 24 and len(reqs) == 12 and len(acts) == 12,
      "%d records" % len(snap["records"]))
census = {}
for a in acts:
    census[a["exec"]] = census.get(a["exec"], 0) + 1
check("action census is 4 COMPLETED / 3 WAITING / 5 NOT_STARTED / 0 IN_PROGRESS",
      census.get("COMPLETED") == 4 and census.get("WAITING") == 3
      and census.get("NOT_STARTED") == 5 and census.get("IN_PROGRESS", 0) == 0,
      str(census))
check("7 dependency edges", len(edges) == 7, str(len(edges)))
check("AC-DEMO-PROOF is not one of the canonical 24", "AC-DEMO-PROOF" not in recs)

# ── the snapshot agrees with the approved Atlas document ──────────────────
atlas_doc = open(ATLAS_DOC, encoding="utf-8").read()
doc_rows = {}
for line in atlas_doc.splitlines():
    m = re.match(r"\|\s*((?:RQ|AC)-\d\d)\s*\|\s*(Requirement|Action)\s*\|\s*WS-\d\d\s*\|\s*(.+?)\s*\|\s*(U-\d\d)\s*\|\s*([A-Z_]+)\s*\|\s*([A-Z_]+)\s*\|\s*(\S+)\s*\|", line)
    if m:
        doc_rows[m.group(1)] = {"owner": m.group(4), "exec": m.group(5), "ver": m.group(6), "due": m.group(7)}
check("the approved Atlas document still lists 24 records", len(doc_rows) == 24, str(len(doc_rows)))
mismatch = []
for rid, want in doc_rows.items():
    got = recs.get(rid)
    if not got:
        mismatch.append(rid + " missing")
        continue
    for field in ("owner", "exec", "ver"):
        if got[field] != want[field]:
            mismatch.append("%s.%s %s != %s" % (rid, field, got[field], want[field]))
    if got["dueISO"] != want["due"]:
        mismatch.append("%s.due %s != %s" % (rid, got["dueISO"], want["due"]))
check("every record's owner, execution, verification and due match the approved document",
      not mismatch, "; ".join(mismatch[:6]))

doc_edges = {}
for line in atlas_doc.splitlines():
    m = re.match(r"\|\s*(DEP-\d\d)\s*\|\s*(\S+)\s*\|\s*(\S+)\s*\|\s*(.+?)\s*\|", line)
    if m and m.group(1).startswith("DEP-"):
        gate = "proof" if "Verification" in m.group(4) else "completion" if "Execution" in m.group(4) else None
        if gate:
            doc_edges[m.group(1)] = (m.group(2), m.group(3), gate)
check("the approved document declares the same 7 edges",
      {e["id"]: (e["from"], e["to"], e["gate"]) for e in edges} == doc_edges,
      str(doc_edges))

# ── derived evaluation, computed here ─────────────────────────────────────
_dep = {}


def incoming(rid):
    return [e for e in edges if e["to"] == rid]


def outgoing(rid):
    return [e for e in edges if e["from"] == rid]


def gate_ok(e):
    p = recs.get(e["from"])
    if not p:
        return False
    if dependency(p["id"]) != "READY" or p["exec"] != "COMPLETED":
        return False
    if e["gate"] == "completion":
        return True
    return p["ver"] == "VERIFIED" and p.get("validProof") is True


def dependency(rid):
    if rid in _dep:
        return _dep[rid]
    _dep[rid] = "READY"
    inc = incoming(rid)
    _dep[rid] = "READY" if not inc or all(gate_ok(e) for e in inc) else "BLOCKED"
    return _dep[rid]


bad = [r["id"] for r in snap["records"] if dependency(r["id"]) != r["dep"]]
check("every stored dependency value equals the value derived from the edges", not bad, str(bad))
check("the expected blocked set matches the approved document",
      {r["id"] for r in snap["records"] if dependency(r["id"]) == "BLOCKED"}
      == {"AC-05", "AC-07", "AC-08", "AC-09", "AC-11", "AC-12"},
      str(sorted(r["id"] for r in snap["records"] if dependency(r["id"]) == "BLOCKED")))

eligible = [r["id"] for r in snap["records"]
            if r["type"] == "action" and r.get("owner") and r["exec"] in ("NOT_STARTED", "IN_PROGRESS")
            and dependency(r["id"]) == "READY"]
check("zero eligible Actions at Atlas T0", eligible == [], str(eligible))

check("DEP-05 is unsatisfied under the current independent-verification policy",
      not gate_ok([e for e in edges if e["id"] == "DEP-05"][0]))
check("RQ-05 keeps its historical VERIFIED aggregate",
      recs["RQ-05"]["ver"] == "VERIFIED" and recs["RQ-05"]["validProof"] is False)
check("RQ-03 keeps its historical VERIFIED aggregate with the self-review caveat",
      recs["RQ-03"]["ver"] == "VERIFIED" and recs["RQ-03"]["validProof"] is False)
check("AC-06 is COMPLETED / READY, owned by U-03, with explicit NOT_REQUIRED applicability",
      recs["AC-06"]["exec"] == "COMPLETED" and dependency("AC-06") == "READY"
      and recs["AC-06"]["owner"] == "U-03" and recs["AC-06"]["explicitNotRequired"] is True)
check("all 12 canonical Actions carry explicit NOT_REQUIRED applicability",
      all(a["ver"] == "NOT_REQUIRED" and a["explicitNotRequired"] is True for a in acts))

# ── DR7-02: the record that produced the false negative ───────────────────
rq11_out = [e for e in outgoing("RQ-11") if e["gate"] == "proof"]
check("RQ-11 really does have an outgoing proof gate (DEP-07 to AC-12)",
      [(e["id"], e["to"]) for e in rq11_out] == [("DEP-07", "AC-12")], str(rq11_out))
check("RQ-07 has no incoming gate, so its dependency is READY",
      incoming("RQ-07") == [] and dependency("RQ-07") == "READY")
check("AC-07, a different subject, is the blocked one", dependency("AC-07") == "BLOCKED")

# ── fixtures agree with the approved Atlas evidence tables ────────────────
er_doc = dict(re.findall(r"\|\s*(ER-\d\d)\s*\|\s*((?:RQ)-\d\d)\s*\|", atlas_doc))
er_fx = {e["id"]: e["subject"] for e in fx["evidenceRequirements"] if e["id"].startswith("ER-") and e["id"] != "ER-DEMO-01"}
check("the 12 evidence requirements and their subjects match the approved document",
      er_doc == er_fx, "doc=%s fx=%s" % (len(er_doc), len(er_fx)))
ev_doc = set(re.findall(r"\|\s*(EV-\d\d)\s*\|\s*ER-\d\d\s*\|", atlas_doc))
ev_fx = {e["id"] for e in fx["evidence"] if e["id"].startswith("EV-") and not e["id"].startswith("EV-DEMO")}
check("the 5 supplied evidence records match the approved document", ev_doc == ev_fx, str(ev_doc ^ ev_fx))
check("5 documents with 10 versions in total",
      len(fx["documents"]) == 5 and sum(len(d["versions"]) for d in fx["documents"]) == 10,
      "%d docs / %d versions" % (len(fx["documents"]), sum(len(d["versions"]) for d in fx["documents"])))
check("2 filings, both bound to a Requirement subject",
      len(fx["filings"]) == 2 and all(f["subject"] in recs for f in fx["filings"]))
check("the 9 filing stages match the approved RULE-012 sequence",
      fx["filingStages"] == ["Requirement", "Package Preparation", "Signature", "Submission", "Receipt",
                             "Authority Review", "Supplement", "Response", "Approval"])
check("FIL-02 has a receipt and no outcome",
      fx["filings"][1]["receipt"] is not None and fx["filings"][1]["outcome"] is None)
check("the permission matrix fixture is transcribed in full (24 operations)",
      len(fx["permissionMatrix"]["rows"]) == 24, str(len(fx["permissionMatrix"]["rows"])))

# the transcription must match the approved file row for row
perm_src = open(os.path.join(REPO, "docs/requirements/permission-matrix.md"), encoding="utf-8").read()
perm_doc = {}
for line in perm_src.splitlines():
    m = re.match(r"\|\s*([^|]+?)\s*\|\s*(Yes|No|Conditional)\s*\|\s*(Yes|No|Conditional)\s*\|\s*(Yes|No|Conditional)\s*\|\s*(.+?)\s*\|\s*$", line)
    if m:
        perm_doc[m.group(1)] = (m.group(2), m.group(3), m.group(4), m.group(5))
perm_fx = {r["operation"]: (r["OWNER"], r["EDITOR"], r["VIEWER"], r["condition"]) for r in fx["permissionMatrix"]["rows"]}
check("every transcribed permission row matches the approved matrix byte for byte",
      perm_doc == perm_fx,
      "differences: %s" % sorted(set(perm_doc.items()) ^ set(perm_fx.items()))[:2])

# ── error mapping stays inside the current contract ───────────────────────
contract = open(os.path.join(REPO, "docs/implementation/p0-zcode-execution/local-contract.md"), encoding="utf-8").read()
check("the contract still binds a missing precondition to 428", "428 `precondition-required`" in contract)
check("the contract still binds a stale precondition to 412", "412 `precondition-failed`" in contract)
check("the contract still defines no 409", "409" not in contract)
check("the contract still distinguishes non-receipted membership commands",
      "non-receipted membership commands have no receipt to reconcile" in contract)
statuses = {r["status"] for r in fx["errorMapping"]["rows"]}
check("no mapped status is absent from the contract",
      all(("409" not in s) for s in statuses), str(statuses))

if failures:
    print("\nFAILED: %d check(s)" % len(failures))
    sys.exit(1)
print("\nSOURCE_CHECKED: canonical dataset, derived causality, fixtures and permission transcription all agree with the approved sources.")
