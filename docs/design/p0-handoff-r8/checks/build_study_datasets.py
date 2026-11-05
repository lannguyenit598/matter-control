#!/usr/bin/env python3
"""Build the two AC-137 study datasets and the facilitator-only key.

Deterministic: no randomness, no clock. Re-running reproduces identical bytes.
The expected answers in the facilitator key are DERIVED from the dataset by the
same predicates the product semantics describe (see derive_answers), not typed
in by hand, so a reviewer can recompute them with check_study_assets.py.

Outputs (paths are relative to the package root):
  study/scenario-a.json            participant-visible dataset
  study/scenario-b.json            participant-visible dataset
  study-facilitator/facilitator-key.json   facilitator-only, never served to a participant
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ── shared predicates, mirroring docs/requirements/state-semantics.md ──────
def index(ds):
    return {r["id"]: r for r in ds["records"]}


def incoming(ds, rid):
    return [e for e in ds["edges"] if e["to"] == rid]


def outgoing(ds, rid):
    return [e for e in ds["edges"] if e["from"] == rid]


def gate_satisfied(ds, edge):
    p = index(ds).get(edge["from"])
    if p is None:
        return False, "prerequisite missing"
    if dependency(ds, p["id"])[0] != "READY":
        return False, "%s is itself BLOCKED" % p["id"]
    if p["exec"] != "COMPLETED":
        return False, "%s execution is %s" % (p["id"], p["exec"])
    if edge["gate"] == "completion":
        return True, "%s is COMPLETED" % p["id"]
    if p["ver"] != "VERIFIED" or p.get("validProof") is not True:
        return False, "%s has no valid accepted proof (verification %s)" % (p["id"], p["ver"])
    return True, "%s is COMPLETED with valid proof" % p["id"]


_dep_cache = {}


def dependency(ds, rid):
    key = (id(ds), rid)
    if key in _dep_cache:
        return _dep_cache[key]
    _dep_cache[key] = ("READY", [])          # provisional, breaks cycles safely
    inc = incoming(ds, rid)
    if not inc:
        out = ("READY", [])
    else:
        failing = []
        for e in inc:
            ok, why = gate_satisfied(ds, e)
            if not ok:
                failing.append({"edge": e["id"], "from": e["from"], "gate": e["gate"], "why": why})
        out = ("BLOCKED", failing) if failing else ("READY", [])
    _dep_cache[key] = out
    return out


def eligible(ds, r):
    return (r["type"] == "action" and bool(r.get("owner"))
            and r["exec"] in ("NOT_STARTED", "IN_PROGRESS")
            and dependency(ds, r["id"])[0] == "READY")


def downstream(ds, rid):
    seen, queue, out = {rid}, list(outgoing(ds, rid)), []
    while queue:
        e = queue.pop(0)
        if e["to"] in seen:
            continue
        seen.add(e["to"])
        out.append(e["to"])
        queue.extend(outgoing(ds, e["to"]))
    return out


def root_causes(ds, rid, seen=None):
    seen = seen or set()
    if rid in seen:
        return []
    seen.add(rid)
    state, failing = dependency(ds, rid)
    if state == "READY":
        return []
    found = []
    for f in failing:
        up = root_causes(ds, f["from"], seen)
        found.extend(up if up else [f["from"]])
    return found


def milestone_state(ds, ms):
    req = ms.get("required") or []
    if not req:
        return "UNASSESSED", "no required prerequisite set is declared"
    idx = index(ds)
    unmet = []
    for rid in req:
        r = idx.get(rid)
        if r is None or dependency(ds, rid)[0] != "READY" or r["exec"] != "COMPLETED":
            unmet.append(rid)
            continue
        if r["ver"] == "NOT_REQUIRED":
            if r.get("explicitNotRequired") is not True:
                unmet.append(rid)
        elif not (r["ver"] == "VERIFIED" and r.get("validProof") is True):
            unmet.append(rid)
    if unmet:
        return "BLOCKED", "unmet declared prerequisites: %s" % ", ".join(unmet)
    return "READY", "all %d declared prerequisites are met" % len(req)


def acyclic(ds):
    adj = {}
    for e in ds["edges"]:
        adj.setdefault(e["from"], []).append(e["to"])
    state = {}

    def visit(n):
        if state.get(n) == 1:
            return False
        if state.get(n) == 2:
            return True
        state[n] = 1
        for m in adj.get(n, []):
            if not visit(m):
                return False
        state[n] = 2
        return True

    return all(visit(r["id"]) for r in ds["records"])


def derive_answers(ds):
    """The three answers a participant must give, derived from the data."""
    idx = index(ds)
    blocked = [r["id"] for r in ds["records"] if dependency(ds, r["id"])[0] == "BLOCKED"]
    reach = {}
    for rid in blocked:
        for rc in root_causes(ds, rid):
            reach.setdefault(rc, set()).add(rid)
    ranked = sorted(reach.items(), key=lambda kv: (-len(kv[1]), kv[0]))
    top = ranked[0][0] if ranked else None
    ms = [{"id": m["id"], "name": m["name"], "state": milestone_state(ds, m)[0],
           "because": milestone_state(ds, m)[1]} for m in ds["milestones"]]
    elig = [r["id"] for r in ds["records"] if eligible(ds, r)]
    if elig:
        r = idx[elig[0]]
        next_owner = {"kind": "eligible-action", "record": r["id"], "owner": r["owner"],
                      "statement": "%s may be executed now by %s" % (r["id"], r["owner"])}
    else:
        blocker = idx.get(top) if top else None
        next_owner = {"kind": "no-eligible-action",
                      "record": top,
                      "owner": blocker["owner"] if blocker else None,
                      "statement": ("No Action is eligible. The accountable internal owner is %s on %s; "
                                    "the permitted step is to pursue the missing input there."
                                    % (blocker["owner"] if blocker else "unknown", top))}
    return {
        "majorState": {"milestones": ms,
                       "headline": "; ".join("%s %s" % (m["id"], m["state"]) for m in ms),
                       "blockedRecordCount": len(blocked),
                       "eligibleActionCount": len(elig)},
        "topBlocker": {"record": top,
                       "title": idx[top]["label"] if top in idx else None,
                       "reaches": sorted(reach.get(top, [])) if top else [],
                       "why": blocker_reason(ds, top) if top else None},
        "nextOwnerAction": next_owner
    }


def blocker_reason(ds, rid):
    r = index(ds)[rid]
    er = next((e for e in ds["evidenceRequirements"] if e["subject"] == rid), None)
    if er and not er.get("evidence"):
        return "%s has no supplied evidence (%s), so its proof gates cannot be satisfied" % (er["id"], er["criterion"])
    if er and er.get("absence"):
        return "%s is only partially satisfied: %s" % (er["id"], er["absence"])
    state, failing = dependency(ds, rid)
    if state == "BLOCKED":
        return "; ".join("%s: %s" % (f["edge"], f["why"]) for f in failing)
    return "execution %s, verification %s" % (r["exec"], r["ver"])


# ── dataset construction ──────────────────────────────────────────────────
def rec(rid, typ, label, ws, owner, ex, ver, due, valid=False, notreq=False, sub=""):
    return {"id": rid, "type": typ, "label": label, "ws": ws, "owner": owner,
            "exec": ex, "ver": ver, "dueISO": due, "validProof": valid,
            "explicitNotRequired": notreq, "sub": sub, "revision": 1}


def edge(eid, frm, to, gate):
    return {"id": eid, "from": frm, "to": to, "gate": gate}


def scenario_a():
    ws = ["Regulatory Clearance", "Perimeter & Carve-Out", "Employee Transfer",
          "Tax & Treasury", "Closing & Funds Flow"]
    owners = ["M-01 Regulatory Lead", "M-02 Corporate Counsel", "M-03 HR Counsel",
              "M-04 Tax Lead", "M-05 Closing Coordinator"]
    R, A, E, ERs = [], [], [], []
    D = "2026-09-%02dT17:00:00+07:00"

    # 25 requirements
    req_spec = [
        ("RA-01", "Ministry filing of the carve-out notification is accepted", 0, 0, "COMPLETED", "VERIFIED", True),
        ("RA-02", "Local counsel opinion on the carve-out perimeter is on file", 0, 1, "COMPLETED", "VERIFIED", True),
        ("RA-03", "Competition clearance for the transfer is granted", 0, 0, "COMPLETED", "VERIFIED", True),
        ("RA-04", "Sector regulator pre-notification is acknowledged", 0, 0, "COMPLETED", "VERIFIED", True),
        ("RA-05", "Foreign investment screening is concluded", 0, 1, "COMPLETED", "VERIFIED", True),
        ("RA-06", "Data protection transfer assessment is recorded", 0, 2, "COMPLETED", "VERIFIED", True),
        ("RA-07", "Regulatory carve-out clearance notification from the local ministry is received",
         0, 0, "WAITING", "UNVERIFIED", False),
        ("RA-08", "Carve-out perimeter schedule is agreed with the counterparty", 1, 1, "COMPLETED", "VERIFIED", True),
        ("RA-09", "Excluded assets register is reconciled", 1, 1, "COMPLETED", "VERIFIED", True),
        ("RA-10", "Intercompany agreements inside the perimeter are listed", 1, 1, "IN_PROGRESS", "UNVERIFIED", False),
        ("RA-11", "Shared services continuity terms are documented", 1, 1, "NOT_STARTED", "UNVERIFIED", False),
        ("RA-12", "Transferring employee population is confirmed", 2, 2, "COMPLETED", "VERIFIED", True),
        ("RA-13", "Works council consultation is concluded", 2, 2, "COMPLETED", "VERIFIED", True),
        ("RA-14", "Pension transfer mechanics are agreed", 2, 2, "NOT_STARTED", "UNVERIFIED", False),
        ("RA-15", "Employment transfer notices are issued", 2, 2, "NOT_STARTED", "UNVERIFIED", False),
        ("RA-16", "Tax clearance certificate for the transferring entity is obtained", 3, 3, "COMPLETED", "VERIFIED", True),
        ("RA-17", "Stamp duty assessment is settled", 3, 3, "NOT_STARTED", "UNVERIFIED", False),
        ("RA-18", "Transfer pricing documentation is updated", 3, 3, "NOT_STARTED", "UNVERIFIED", False),
        ("RA-19", "Treasury accounts for the carve-out entity are opened", 3, 3, "COMPLETED", "VERIFIED", True),
        ("RA-20", "Funds flow statement is agreed with both sides", 4, 4, "NOT_STARTED", "UNVERIFIED", False),
        ("RA-21", "Closing conditions schedule is satisfied", 4, 4, "NOT_STARTED", "UNVERIFIED", False),
        ("RA-22", "Escrow arrangements are executed", 4, 4, "NOT_STARTED", "UNVERIFIED", False),
        ("RA-23", "Closing fund release is authorised", 4, 4, "NOT_STARTED", "UNVERIFIED", False),
        ("RA-24", "Post-closing regulatory confirmations are filed", 0, 0, "NOT_STARTED", "UNVERIFIED", False),
        ("RA-25", "Transitional services commencement is acknowledged", 1, 1, "NOT_STARTED", "UNVERIFIED", False),
    ]
    for i, (rid, label, w, o, ex, ver, valid) in enumerate(req_spec):
        R.append(rec(rid, "req", label, ws[w], owners[o], ex, ver, D % (7 + i % 20), valid=valid,
                     sub="Synthetic study record; no relation to any real transaction"))

    act_spec = [
        ("AA-01", "Record the ministry acceptance reference for RA-01", 0, 0, "COMPLETED"),
        ("AA-02", "File the local counsel opinion against RA-02", 0, 1, "COMPLETED"),
        ("AA-03", "Record the competition clearance decision for RA-03", 0, 0, "COMPLETED"),
        ("AA-04", "Record the sector regulator acknowledgement for RA-04", 0, 0, "COMPLETED"),
        ("AA-05", "Record the screening conclusion for RA-05", 0, 1, "COMPLETED"),
        ("AA-06", "Record the data protection assessment for RA-06", 0, 2, "COMPLETED"),
        ("AA-07", "Chase the ministry for the outstanding carve-out clearance", 0, 0, "WAITING"),
        ("AA-08", "Circulate the agreed perimeter schedule for RA-08", 1, 1, "COMPLETED"),
        ("AA-09", "Reconcile the excluded assets register for RA-09", 1, 1, "COMPLETED"),
        ("AA-10", "Complete the intercompany agreement inventory for RA-10", 1, 1, "NOT_STARTED"),
        ("AA-11", "Draft the shared services continuity terms for RA-11", 1, 1, "NOT_STARTED"),
        ("AA-12", "Confirm the transferring employee population for RA-12", 2, 2, "COMPLETED"),
        ("AA-13", "Minute the works council conclusion for RA-13", 2, 2, "COMPLETED"),
        ("AA-14", "Agree the pension transfer mechanics for RA-14", 2, 2, "NOT_STARTED"),
        ("AA-15", "Issue the employment transfer notices for RA-15", 2, 2, "NOT_STARTED"),
        ("AA-16", "File the tax clearance certificate for RA-16", 3, 3, "COMPLETED"),
        ("AA-17", "Settle the stamp duty assessment for RA-17", 3, 3, "NOT_STARTED"),
        ("AA-18", "Update the transfer pricing file for RA-18", 3, 3, "NOT_STARTED"),
        ("AA-19", "Record the treasury account opening for RA-19", 3, 3, "COMPLETED"),
        ("AA-20", "Agree the funds flow statement for RA-20", 4, 4, "NOT_STARTED"),
        ("AA-21", "Walk the closing conditions schedule for RA-21", 4, 4, "NOT_STARTED"),
        ("AA-22", "Execute the escrow arrangements for RA-22", 4, 4, "NOT_STARTED"),
        ("AA-23", "Authorise the closing fund release for RA-23", 4, 4, "NOT_STARTED"),
        ("AA-24", "File the post-closing regulatory confirmations for RA-24", 0, 0, "NOT_STARTED"),
        ("AA-25", "Acknowledge transitional services commencement for RA-25", 1, 1, "NOT_STARTED"),
    ]
    for i, (aid, label, w, o, ex) in enumerate(act_spec):
        A.append(rec(aid, "action", label, ws[w], owners[o], ex, "NOT_REQUIRED", D % (7 + i % 20),
                     notreq=True, sub="Synthetic study record; explicit no-proof applicability"))

    # Dependency graph. RA-07 is the only unsatisfied root; everything that is
    # NOT_STARTED and not completed hangs off it, directly or transitively.
    E += [edge("DA-01", "RA-07", "AA-10", "proof"),
          edge("DA-02", "RA-07", "AA-11", "proof"),
          edge("DA-03", "RA-07", "AA-14", "proof"),
          edge("DA-04", "RA-07", "AA-17", "proof"),
          edge("DA-05", "AA-10", "RA-10", "completion"),
          edge("DA-06", "AA-11", "RA-11", "completion"),
          edge("DA-07", "AA-14", "RA-14", "completion"),
          edge("DA-08", "AA-14", "AA-15", "completion"),
          edge("DA-09", "AA-15", "RA-15", "completion"),
          edge("DA-10", "AA-17", "RA-17", "completion"),
          edge("DA-11", "AA-17", "AA-18", "completion"),
          edge("DA-12", "AA-18", "RA-18", "completion"),
          edge("DA-13", "RA-10", "AA-20", "proof"),
          edge("DA-14", "RA-15", "AA-20", "proof"),
          edge("DA-15", "AA-20", "RA-20", "completion"),
          edge("DA-16", "RA-20", "AA-21", "proof"),
          edge("DA-17", "AA-21", "RA-21", "completion"),
          edge("DA-18", "RA-21", "AA-22", "proof"),
          edge("DA-19", "AA-22", "RA-22", "completion"),
          edge("DA-20", "RA-22", "AA-23", "proof"),
          edge("DA-21", "AA-23", "RA-23", "completion"),
          edge("DA-22", "RA-23", "AA-24", "proof"),
          edge("DA-23", "AA-24", "RA-24", "completion"),
          edge("DA-24", "RA-11", "AA-25", "proof"),
          edge("DA-25", "AA-25", "RA-25", "completion")]

    for r in R:
        subj = r["id"]
        if r["ver"] == "VERIFIED":
            ERs.append({"id": "ERA-" + subj[-2:], "subject": subj,
                        "criterion": "Recorded proof for %s" % subj,
                        "evidence": "EVA-" + subj[-2:], "verification": "VERIFIED"})
        else:
            if subj == "RA-07":
                absence = "The ministry has not issued the clearance notification; nothing has been received to record."
                criterion = "Written carve-out clearance notification issued by the local ministry"
            else:
                absence = "No evidence has been supplied for this condition yet."
                criterion = "Recorded proof for %s" % subj
            ERs.append({"id": "ERA-" + subj[-2:], "subject": subj,
                        "criterion": criterion,
                        "evidence": None, "verification": "UNVERIFIED", "absence": absence})

    ms = [{"id": "MSA-01", "name": "Regulatory clearance complete", "due": "2026-09-18T17:00:00+07:00",
           "required": ["RA-01", "RA-03", "RA-04", "RA-05", "RA-07"]},
          {"id": "MSA-02", "name": "Carve-out perimeter locked", "due": "2026-09-24T17:00:00+07:00",
           "required": ["RA-08", "RA-09", "RA-10", "RA-11"]},
          {"id": "MSA-03", "name": "Closing fund release", "due": "2026-09-30T17:00:00+07:00",
           "required": ["RA-20", "RA-21", "RA-22", "RA-23"]}]

    return {"id": "SCENARIO-A", "name": "Cross-Border Subsidiary Carve-Out",
            "synthetic": "Fully synthetic study matter. Every organisation, person, authority and deadline is invented.",
            "asOf": "2026-09-15T09:00:00+07:00",
            "workstreams": ws, "owners": owners,
            "records": R + A, "edges": E, "evidenceRequirements": ERs, "milestones": ms,
            "externalParties": [{"id": "EPA-01", "alias": "Northgate Ministry Demo", "role": "Clearance authority"},
                                {"id": "EPA-02", "alias": "Sable Counterparty Demo", "role": "Transaction counterparty"}]}


def scenario_b():
    ws = ["Facility Documentation", "Security & Perfection", "Credit Approvals",
          "Syndication", "Closing Mechanics"]
    owners = ["N-01 Lead Counsel", "N-02 Security Counsel", "N-03 Credit Lead",
              "N-04 Agency Lead", "N-05 Closing Coordinator"]
    R, A, E, ERs = [], [], [], []
    D = "2026-10-%02dT17:00:00+07:00"

    req_spec = [
        ("RB-01", "Facility agreement execution version is agreed", 0, 0, "COMPLETED", "VERIFIED", True),
        ("RB-02", "Intercreditor agreement is agreed", 0, 0, "COMPLETED", "VERIFIED", True),
        ("RB-03", "Fee letters are executed", 0, 0, "COMPLETED", "VERIFIED", True),
        ("RB-04", "Conditions precedent checklist is agreed", 0, 0, "COMPLETED", "VERIFIED", True),
        ("RB-05", "Counterparty perfection certificate carries the formal legal opinion exhibit",
         1, 1, "WAITING", "PARTIALLY_VERIFIED", False),
        ("RB-06", "Share pledge is executed and registered", 1, 1, "NOT_STARTED", "UNVERIFIED", False),
        ("RB-07", "Receivables security is perfected", 1, 1, "NOT_STARTED", "UNVERIFIED", False),
        ("RB-08", "Account control agreements are executed", 1, 1, "NOT_STARTED", "UNVERIFIED", False),
        ("RB-09", "Credit committee approval is minuted", 2, 2, "COMPLETED", "VERIFIED", True),
        ("RB-10", "Know-your-customer clearance for every lender is complete", 2, 2, "COMPLETED", "VERIFIED", True),
        ("RB-11", "Sanctions screening for the obligor group is complete", 2, 2, "COMPLETED", "VERIFIED", True),
        ("RB-12", "Financial covenant model is agreed", 2, 2, "IN_PROGRESS", "UNVERIFIED", False),
        ("RB-13", "Allocation schedule is confirmed with the syndicate", 3, 3, "COMPLETED", "VERIFIED", True),
        ("RB-14", "Transfer certificates are prepared", 3, 3, "NOT_STARTED", "UNVERIFIED", False),
        ("RB-15", "Agency fee arrangements are documented", 3, 3, "COMPLETED", "VERIFIED", True),
        ("RB-16", "Lender signature pages are collected", 3, 3, "NOT_STARTED", "UNVERIFIED", False),
        ("RB-17", "Funds flow memorandum is agreed", 4, 4, "NOT_STARTED", "UNVERIFIED", False),
        ("RB-18", "Utilisation request is validated", 4, 4, "NOT_STARTED", "UNVERIFIED", False),
        ("RB-19", "Closing certificate is executed", 4, 4, "NOT_STARTED", "UNVERIFIED", False),
        ("RB-20", "Drawdown is authorised", 4, 4, "NOT_STARTED", "UNVERIFIED", False),
        ("RB-21", "Post-closing registrations are filed", 1, 1, "NOT_STARTED", "UNVERIFIED", False),
        ("RB-22", "Legal opinions are dated and released", 0, 0, "NOT_STARTED", "UNVERIFIED", False),
    ]
    for i, (rid, label, w, o, ex, ver, valid) in enumerate(req_spec):
        R.append(rec(rid, "req", label, ws[w], owners[o], ex, ver, D % (6 + i % 20), valid=valid,
                     sub="Synthetic study record; no relation to any real financing"))

    act_spec = [
        ("AB-01", "Circulate the execution version for RB-01", 0, 0, "COMPLETED"),
        ("AB-02", "Record intercreditor agreement execution for RB-02", 0, 0, "COMPLETED"),
        ("AB-03", "File the executed fee letters for RB-03", 0, 0, "COMPLETED"),
        ("AB-04", "Agree the conditions precedent checklist for RB-04", 0, 0, "COMPLETED"),
        ("AB-05", "Chase the counterparty for the missing legal opinion exhibit", 1, 1, "WAITING"),
        ("AB-06", "Prepare the share pledge for execution for RB-06", 1, 1, "NOT_STARTED"),
        ("AB-07", "Lodge the receivables security filings for RB-07", 1, 1, "NOT_STARTED"),
        ("AB-08", "Execute the account control agreements for RB-08", 1, 1, "NOT_STARTED"),
        ("AB-09", "Minute the credit committee approval for RB-09", 2, 2, "COMPLETED"),
        ("AB-10", "Complete lender KYC collection for RB-10", 2, 2, "COMPLETED"),
        ("AB-11", "Record sanctions screening results for RB-11", 2, 2, "COMPLETED"),
        ("AB-12", "Finalise the covenant model for RB-12", 2, 2, "IN_PROGRESS"),
        ("AB-13", "Confirm the allocation schedule for RB-13", 3, 3, "COMPLETED"),
        ("AB-14", "Prepare the transfer certificates for RB-14", 3, 3, "NOT_STARTED"),
        ("AB-15", "Document the agency fee arrangements for RB-15", 3, 3, "COMPLETED"),
        ("AB-16", "Collect lender signature pages for RB-16", 3, 3, "NOT_STARTED"),
        ("AB-17", "Agree the funds flow memorandum for RB-17", 4, 4, "NOT_STARTED"),
        ("AB-18", "Validate the utilisation request for RB-18", 4, 4, "NOT_STARTED"),
        ("AB-19", "Execute the closing certificate for RB-19", 4, 4, "NOT_STARTED"),
        ("AB-20", "Authorise the drawdown for RB-20", 4, 4, "NOT_STARTED"),
        ("AB-21", "File the post-closing registrations for RB-21", 1, 1, "NOT_STARTED"),
        ("AB-22", "Date and release the legal opinions for RB-22", 0, 0, "NOT_STARTED"),
        ("AB-23", "Reconcile the signature page log against the allocation schedule", 3, 3, "COMPLETED"),
        ("AB-24", "Record the agent appointment acceptance", 3, 3, "COMPLETED"),
        ("AB-25", "Confirm the borrower notice address details", 4, 4, "COMPLETED"),
        ("AB-26", "Record the insurance broker confirmation", 1, 1, "COMPLETED"),
        ("AB-27", "Archive the executed fee letters", 0, 0, "COMPLETED"),
        ("AB-28", "Escalate the outstanding legal opinion exhibit to the counterparty\u2019s counsel", 1, 1, "NOT_STARTED"),
    ]
    for i, (aid, label, w, o, ex) in enumerate(act_spec):
        A.append(rec(aid, "action", label, ws[w], owners[o], ex, "NOT_REQUIRED", D % (6 + i % 20),
                     notreq=True, sub="Synthetic study record; explicit no-proof applicability"))

    # AB-28 is deliberately the single eligible Action: no incoming edge, owner
    # assigned, execution NOT_STARTED. AB-12 is IN_PROGRESS but blocked.
    E += [edge("DB-01", "RB-05", "AB-06", "proof"),
          edge("DB-02", "RB-05", "AB-07", "proof"),
          edge("DB-03", "RB-05", "AB-08", "proof"),
          edge("DB-04", "RB-05", "AB-12", "proof"),
          edge("DB-05", "AB-06", "RB-06", "completion"),
          edge("DB-06", "AB-07", "RB-07", "completion"),
          edge("DB-07", "AB-08", "RB-08", "completion"),
          edge("DB-08", "AB-12", "RB-12", "completion"),
          edge("DB-09", "RB-06", "AB-14", "proof"),
          edge("DB-10", "RB-07", "AB-14", "proof"),
          edge("DB-11", "AB-14", "RB-14", "completion"),
          edge("DB-12", "RB-14", "AB-16", "proof"),
          edge("DB-13", "AB-16", "RB-16", "completion"),
          edge("DB-14", "RB-16", "AB-17", "proof"),
          edge("DB-15", "AB-17", "RB-17", "completion"),
          edge("DB-16", "RB-17", "AB-18", "proof"),
          edge("DB-17", "AB-18", "RB-18", "completion"),
          edge("DB-18", "RB-18", "AB-19", "proof"),
          edge("DB-19", "AB-19", "RB-19", "completion"),
          edge("DB-20", "RB-19", "AB-20", "proof"),
          edge("DB-21", "AB-20", "RB-20", "completion"),
          edge("DB-22", "RB-08", "AB-21", "proof"),
          edge("DB-23", "AB-21", "RB-21", "completion"),
          edge("DB-24", "RB-12", "AB-22", "proof"),
          edge("DB-25", "AB-22", "RB-22", "completion")]

    for r in R:
        subj = r["id"]
        if r["ver"] == "VERIFIED":
            ERs.append({"id": "ERB-" + subj[-2:], "subject": subj,
                        "criterion": "Recorded proof for %s" % subj,
                        "evidence": "EVB-" + subj[-2:], "verification": "VERIFIED"})
        elif subj == "RB-05":
            ERs.append({"id": "ERB-05", "subject": "RB-05",
                        "criterion": "Perfection certificate together with the formal legal opinion exhibit",
                        "evidence": "EVB-05", "verification": "PARTIALLY_VERIFIED",
                        "absence": "The certificate is on file; the formal legal opinion exhibit it must carry is missing."})
        else:
            ERs.append({"id": "ERB-" + subj[-2:], "subject": subj,
                        "criterion": "Recorded proof for %s" % subj,
                        "evidence": None, "verification": "UNVERIFIED",
                        "absence": "No evidence has been supplied for this condition yet."})

    ms = [{"id": "MSB-01", "name": "Documentation agreed", "due": "2026-10-14T17:00:00+07:00",
           "required": ["RB-01", "RB-02", "RB-03", "RB-04"]},
          {"id": "MSB-02", "name": "Security perfected", "due": "2026-10-20T17:00:00+07:00",
           "required": ["RB-05", "RB-06", "RB-07", "RB-08"]},
          {"id": "MSB-03", "name": "Closing", "due": "2026-10-28T17:00:00+07:00",
           "required": ["RB-16", "RB-17", "RB-18", "RB-19", "RB-20"]}]

    return {"id": "SCENARIO-B", "name": "Syndicated Debt Refinancing",
            "synthetic": "Fully synthetic study matter. Every organisation, person, lender and deadline is invented.",
            "asOf": "2026-10-12T09:00:00+07:00",
            "workstreams": ws, "owners": owners,
            "records": R + A, "edges": E, "evidenceRequirements": ERs, "milestones": ms,
            "externalParties": [{"id": "EPB-01", "alias": "Lakeside Obligor Demo", "role": "Counterparty"},
                                {"id": "EPB-02", "alias": "Pinebank Agent Demo", "role": "Facility agent"}]}


def main():
    out = {}
    for ds in (scenario_a(), scenario_b()):
        _dep_cache.clear()
        reqs = [r for r in ds["records"] if r["type"] == "req"]
        acts = [r for r in ds["records"] if r["type"] == "action"]
        assert len(ds["records"]) == 50, (ds["id"], len(ds["records"]))
        assert acyclic(ds), ds["id"]
        ans = derive_answers(ds)
        path = os.path.join(ROOT, "study", "scenario-%s.json" % ds["id"][-1].lower())
        with open(path, "w", encoding="utf-8") as f:
            json.dump(ds, f, ensure_ascii=False, indent=1, sort_keys=False)
            f.write("\n")
        out[ds["id"]] = {"file": "study/scenario-%s.json" % ds["id"][-1].lower(),
                         "requirements": len(reqs), "actions": len(acts),
                         "edges": len(ds["edges"]), "answers": ans}
        print("%s: %d requirements, %d actions, %d edges, %d eligible, top blocker %s"
              % (ds["id"], len(reqs), len(acts), len(ds["edges"]),
                 ans["majorState"]["eligibleActionCount"], ans["topBlocker"]["record"]))

    key = {
        "artifact": "AC-137 facilitator-only answer key and scoring protocol",
        "visibility": "FACILITATOR_ONLY. This file is never served to a participant, never embedded in the participant surface, and is not part of the participant bundle inventory.",
        "protocol": {
            "participants": "Exactly five real legal operations managers, corporate transactional partners or senior closing coordinators. Author self-testing, designer testing, internal AI personas and proxy engineers are disqualified.",
            "materials": "Two unseen 50-row synthetic matters, each with a full causal graph, declared milestone prerequisites and scoped owners.",
            "counterbalancing": "Three participants run A then B; two run B then A.",
            "questions": ["Major state", "Top blocker", "Next owner and permitted action"],
            "timing": "The timer starts when the Control Room has fully rendered. No hint, prompt or coaching is given.",
            "threshold": "At least four of five participants answer all three questions correctly within ten seconds, in each scenario separately.",
            "noAveraging": "Elapsed time and accuracy are recorded per participant and per scenario. A mean below ten seconds does not rescue an individual failure.",
            "consent": "Formal participant consent is required. No personally identifiable data and no client name is stored in the repository."
        },
        "derivation": "Every expected answer below was computed from the published dataset by checks/build_study_datasets.py and is re-derivable by checks/check_study_assets.py. None of it was typed in by hand.",
        "expectedAnswers": {k: v["answers"] for k, v in out.items()},
        "datasetSummary": {k: {kk: vv for kk, vv in v.items() if kk != "answers"} for k, v in out.items()},
        "scoringLedger": {
            "columns": ["Participant", "Scenario", "Major state", "Top blocker", "Next owner/action",
                        "All three correct", "Elapsed seconds", "Verdict"],
            "rows": [[p, s, "", "", "", "", "", ""]
                     for p, order in [("MGR-01", "AB"), ("MGR-02", "AB"), ("MGR-03", "AB"),
                                      ("MGR-04", "BA"), ("MGR-05", "BA")]
                     for s in (["A", "B"] if order == "AB" else ["B", "A"])]
        },
        "status": "TRIAL_NOT_RUN / AWAITING_HUMAN_TRIAL. No participant has been contacted, no timing has been collected and no usability result is claimed."
    }
    kpath = os.path.join(ROOT, "study-facilitator", "facilitator-key.json")
    with open(kpath, "w", encoding="utf-8") as f:
        json.dump(key, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("facilitator key written:", kpath)
    return 0


if __name__ == "__main__":
    sys.exit(main())
