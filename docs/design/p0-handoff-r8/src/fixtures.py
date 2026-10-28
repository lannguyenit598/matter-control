import json

F = {}

F["provenance"] = {
    "transcribed": ("Transcribed verbatim from an approved source: the 24 records, 7 dependency edges and their T0 gate status, "
                    "the 12 evidence requirements, the 5 supplied evidence records, the 5 documents and their 10 versions with "
                    "CURRENT/SUPERSEDED status, the 2 filings with their stage, execution and verification, the 6 domain events "
                    "with their actor, time and domain change, the 9 filing stages, and all 24 permission-matrix rows. "
                    "Sources: docs/product/project-atlas-dataset.md, docs/requirements/state-semantics.md, "
                    "docs/requirements/permission-matrix.md."),
    "designSupplied": ("Supplied by this design package because the approved sources do not state it, and marked as such wherever "
                       "it is shown: English renderings of the Vietnamese titles; the date and author of document versions other "
                       "than DOC-03 v3 and DOC-05 v2; signature party identities; filing package-checklist states; submission "
                       "reference strings; event reason, effective time, correlation and causal links; the second Matter, the "
                       "fourth member, every Matter role assignment and the verifier designation; the restricted security-log "
                       "rows; and every labelled scenario (two supplement cycles, no-supplement, rejection, import groups)."),
    "note": ("Atlas states that U-01, U-02 and U-03 are persona aliases, not product roles. Any Matter role shown against them "
             "here is a design-supplied illustration of the approved matrix, never a claim about Atlas. Nothing in this file is "
             "a product result: nothing was saved, verified, submitted, exported or enforced.")
}

# Atlas section 5 publishes each edge's gate status at T0. That reported status
# is a historical fact and is preserved; the current-policy evaluation is a
# separate column and the two are never merged.
F["edgeReportedT0"] = {
    "DEP-01": "Unsatisfied", "DEP-02": "Unsatisfied", "DEP-03": "Unsatisfied", "DEP-04": "Unsatisfied",
    "DEP-05": "Satisfied", "DEP-06": "Unsatisfied", "DEP-07": "Unsatisfied"
}
F["edgeReportedNote"] = ("Reported at Atlas T0 under the baseline review recorded then. Current-policy evaluation applies "
                         "RULE-007 independent verification to the same evidence and can differ; where it does, both are shown.")

# ── Evidence requirements and supplied evidence (Atlas §7) ──────────────────
F["evidenceRequirements"] = [
    {"id": "ER-01", "subject": "RQ-01", "criterion": "Approval record of the correct revision, with review", "evidence": "EV-01", "verification": "VERIFIED"},
    {"id": "ER-02", "subject": "RQ-02", "criterion": "Acknowledgement of the notified change", "evidence": None, "verification": "UNVERIFIED", "absence": "Missing at T0; no substitute evidence is created"},
    {"id": "ER-03", "subject": "RQ-03", "criterion": "DD review record covering the current pack", "evidence": "EV-03", "verification": "VERIFIED"},
    {"id": "ER-04", "subject": "RQ-04", "criterion": "Supplementary documentation that resolves the gap", "evidence": None, "verification": "UNVERIFIED", "absence": "Missing at T0; awaiting EP-01"},
    {"id": "ER-05", "subject": "RQ-05", "criterion": "Content review of the current agreement version", "evidence": "EV-05", "verification": "VERIFIED"},
    {"id": "ER-06", "subject": "RQ-06", "criterion": "Confirmation of both signatures on the correct version", "evidence": "EV-06", "verification": "PARTIALLY_VERIFIED"},
    {"id": "ER-07", "subject": "RQ-07", "criterion": "Payment confirmation", "evidence": None, "verification": "UNVERIFIED", "absence": "Missing at T0"},
    {"id": "ER-08", "subject": "RQ-08", "criterion": "Transfer / closing evidence of the appropriate kind", "evidence": None, "verification": "UNVERIFIED", "absence": "Missing at T0; DOC-04 draft is not sufficient"},
    {"id": "ER-09", "subject": "RQ-09", "criterion": "Approval outcome for FIL-01", "evidence": None, "verification": "UNVERIFIED", "absence": "Missing at T0"},
    {"id": "ER-10", "subject": "RQ-10", "criterion": "Receipt and outcome for FIL-02", "evidence": "EV-10", "verification": "PARTIALLY_VERIFIED", "absence": "Outcome component missing at T0"},
    {"id": "ER-11", "subject": "RQ-11", "criterion": "Supplement / resolution record, if one becomes required", "evidence": None, "verification": "UNVERIFIED", "absence": "Missing at T0; applicability stays open pending the filing response"},
    {"id": "ER-12", "subject": "RQ-12", "criterion": "Handover acknowledgement", "evidence": None, "verification": "UNVERIFIED", "absence": "Missing at T0"},
    {"id": "ER-DEMO-01", "subject": "AC-DEMO-PROOF", "criterion": "Notarised power of attorney for the legal representative", "evidence": "EV-DEMO-01", "verification": "UNVERIFIED",
     "labelled_fixture": "Not part of the canonical Atlas 24; demonstrates explicit proof applicability on an Action under state-semantics.md"}
]

F["evidence"] = [
    {"id": "EV-01", "er": "ER-01", "source": "DOC-01 v2", "recordedBy": "U-01", "reviewedBy": "U-02",
     "recordedAt": "2026-06-13T10:00:00+07:00", "reviewedAt": "2026-06-13T11:00:00+07:00"},
    {"id": "EV-03", "er": "ER-03", "source": "DOC-02 v2 + review note", "recordedBy": "U-02", "reviewedBy": "U-02",
     "recordedAt": "2026-06-14T14:00:00+07:00", "reviewedAt": "2026-06-14T14:00:00+07:00"},
    {"id": "EV-05", "er": "ER-05", "source": "DOC-03 v3 + content review note", "recordedBy": "U-02", "reviewedBy": "U-02",
     "recordedAt": "2026-06-14T11:00:00+07:00", "reviewedAt": "2026-06-14T11:00:00+07:00"},
    {"id": "EV-06", "er": "ER-06", "source": "DOC-03 v3, one signature receipt", "recordedBy": "U-03", "reviewedBy": "U-02",
     "recordedAt": "2026-06-15T08:00:00+07:00", "reviewedAt": "2026-06-15T08:00:00+07:00"},
    {"id": "EV-10", "er": "ER-10", "source": "Receipt reference + DOC-05 v2", "recordedBy": "U-03", "reviewedBy": "U-02",
     "recordedAt": "2026-06-14T16:00:00+07:00", "reviewedAt": "2026-06-14T16:00:00+07:00"},
    {"id": "EV-DEMO-01", "er": "ER-DEMO-01", "source": "POA-DOC-01 v1, signed and notarised", "recordedBy": "U-03", "reviewedBy": None,
     "recordedAt": "2026-06-24T09:00:00+07:00", "reviewedAt": None,
     "labelled_fixture": "Designated independent verifier U-02 has not yet evaluated this proof"}
]

# ── Documents (Atlas §6) ───────────────────────────────────────────────────
F["documents"] = [
    {"id": "DOC-01", "name": "Internal approval record", "nameVi": "Hồ sơ phê duyệt nội bộ",
     "versions": [
         {"v": "v1", "status": "SUPERSEDED", "addedAt": None, "addedBy": None, "supersededBy": "v2", "src": "atlas-lineage"},
         {"v": "v2", "status": "CURRENT", "addedAt": None, "addedBy": None, "src": "atlas-lineage"}],
     "signatureCriteria": None,
     "referencedBy": [{"kind": "evidence", "id": "EV-01", "version": "v2", "binding": "fixed"}]},
    {"id": "DOC-02", "name": "DD information pack", "nameVi": "Bộ hồ sơ thẩm định (due diligence)",
     "versions": [
         {"v": "v1", "status": "SUPERSEDED", "addedAt": None, "addedBy": None, "supersededBy": "v2", "src": "atlas-lineage"},
         {"v": "v2", "status": "CURRENT", "addedAt": None, "addedBy": None, "src": "atlas-lineage"}],
     "signatureCriteria": None,
     "referencedBy": [{"kind": "evidence", "id": "EV-03", "version": "v2", "binding": "fixed"},
                      {"kind": "finding", "id": "FD-01", "version": "v2", "binding": "fixed"}]},
    {"id": "DOC-03", "name": "Transaction agreement", "nameVi": "Hợp đồng giao dịch chuyển nhượng và tái cấu trúc",
     "versions": [
         {"v": "v1", "status": "SUPERSEDED", "addedAt": None, "addedBy": None, "supersededBy": "v2", "src": "atlas-lineage"},
         {"v": "v2", "status": "SUPERSEDED", "addedAt": None, "addedBy": None, "supersededBy": "v3", "src": "atlas-lineage"},
         {"v": "v3", "status": "CURRENT", "addedAt": "2026-06-14T10:00:00+07:00", "addedBy": "U-03", "event": "EVT-01", "src": "atlas-event"}],
     "signatureCriteria": {"version": "v3", "required": 2, "executed": 1,
                           "parties": [{"party": "First signatory — identity not supplied in the fixture", "state": "EXECUTED",
                                        "observedAt": "2026-06-15T08:00:00+07:00", "evidence": "EV-06", "src": "atlas-event"},
                                       {"party": "EP-02 · Elm Signatory Demo", "state": "OUTSTANDING",
                                        "observedAt": None, "evidence": None, "src": "atlas"}]},
     "referencedBy": [{"kind": "evidence", "id": "EV-05", "version": "v3", "binding": "fixed"},
                      {"kind": "evidence", "id": "EV-06", "version": "v3", "binding": "fixed"},
                      {"kind": "requirement", "id": "RQ-06", "version": "current", "binding": "current"}]},
    {"id": "DOC-04", "name": "Closing checklist", "nameVi": "Danh mục kiểm tra hoàn tất giao dịch",
     "versions": [{"v": "v1", "status": "CURRENT", "addedAt": None, "addedBy": None, "src": "atlas-lineage"}],
     "signatureCriteria": None,
     "referencedBy": [{"kind": "filing", "id": "FIL-01", "version": "v1", "binding": "input-only",
                       "note": "Draft input; not closing proof and not a submitted package"}]},
    {"id": "DOC-05", "name": "Filing notice package", "nameVi": "Bộ hồ sơ thông báo đăng ký",
     "versions": [
         {"v": "v1", "status": "SUPERSEDED", "addedAt": None, "addedBy": None, "supersededBy": "v2", "src": "atlas-lineage"},
         {"v": "v2", "status": "CURRENT", "addedAt": "2026-06-14T15:00:00+07:00", "addedBy": "U-03", "event": "EVT-04", "src": "atlas-event"}],
     "signatureCriteria": None,
     "referencedBy": [{"kind": "filing", "id": "FIL-02", "version": "v2", "binding": "fixed",
                       "note": "Exact version submitted; history still shows v1"},
                      {"kind": "evidence", "id": "EV-10", "version": "v2", "binding": "fixed"}]}
]

# ── Filings (Atlas §8 + state-semantics RULE-012 stage table) ──────────────
STAGES = ["Requirement", "Package Preparation", "Signature", "Submission", "Receipt",
          "Authority Review", "Supplement", "Response", "Approval"]
F["filingStages"] = STAGES
F["filings"] = [
    {"id": "FIL-01", "subject": "RQ-09", "authority": "EP-03 · Harbor Registry Demo", "stage": "Requirement",
     "exec": "NOT_STARTED", "ver": "UNVERIFIED", "owner": "U-03", "followUp": "AC-09",
     "checklistSrc": "design-supplied: Atlas does not publish a package checklist. The criteria are the stage guards from the approved RULE-012 stage table; each state is read from what Atlas does and does not record for this filing.",
     "checklist": [
         {"item": "Filing scope and responsible owner declared", "state": "SATISFIED", "evidence": "RQ-09 subject record"},
         {"item": "Applicable package criteria declared", "state": "NOT_DECLARED", "evidence": None},
         {"item": "Required document versions identified", "state": "NOT_DECLARED", "evidence": None},
         {"item": "Signature applicability decided", "state": "NOT_DECLARED", "evidence": None}],
     "submittedVersions": [], "receipt": None, "outcome": None, "cycles": [],
     "documents": [{"id": "DOC-04", "version": "v1", "role": "input-only"}]},
    {"id": "FIL-02", "subject": "RQ-10", "authority": "EP-03 · Harbor Registry Demo", "stage": "Authority Review",
     "exec": "WAITING", "ver": "PARTIALLY_VERIFIED", "owner": "U-03", "followUp": "AC-10",
     "checklistSrc": "design-supplied: Atlas does not publish a package checklist. The criteria are the stage guards from the approved RULE-012 stage table; each state is read from what Atlas does and does not record for this filing.",
     "checklist": [
         {"item": "Filing scope and responsible owner declared", "state": "SATISFIED", "evidence": "RQ-10 subject record"},
         {"item": "Applicable package criteria declared", "state": "SATISFIED", "evidence": "DOC-05 notice package"},
         {"item": "Required document versions identified", "state": "SATISFIED", "evidence": "DOC-05 v2"},
         {"item": "Signature applicability decided", "state": "NOT_APPLICABLE", "evidence": "Not supplied in fixture; applicability reason unrecorded"}],
     "submittedVersions": [{"document": "DOC-05", "version": "v2", "submittedAt": "2026-06-14T15:00:00+07:00",
                            "reference": None, "event": "EVT-04"}],
     "receipt": {"evidence": "EV-10", "recordedAt": "2026-06-14T16:00:00+07:00", "recordedBy": "U-03", "event": "EVT-05",
                 "note": "Acknowledgement of submission only. Receipt is not approval (RULE-012)."},
     "outcome": None,
     "waiting": {"party": "EP-03 · Harbor Registry Demo", "since": "2026-06-14T16:00:00+07:00",
                 "accountableInternalOwner": "U-03", "followUp": "AC-10",
                 "note": "Authority response due date is not supplied in the fixture; the wait is still accountable internally."},
     "cycles": [], "documents": [{"id": "DOC-05", "version": "v2", "role": "submitted-package"}]}
]

F["filingScenarios"] = {
    "two_cycles": {
        "label": "Labelled scenario, not Atlas",
        "intro": "Two complete supplement/response cycles on FIL-02. Each cycle keeps its own request reference, owner, due date and exact responding versions. The second request never overwrites the first.",
        "cycles": [
            {"cycle": 1, "request": {"reference": "AUTH-REQ-FIL02-01", "receivedAt": "2026-06-23T10:00:00+07:00",
                                     "requestedItems": ["Certified extract of the buyer corporate register", "Signed representation on beneficial ownership"],
                                     "owner": "U-03", "due": "2026-06-27T17:00:00+07:00", "execution": "IN_PROGRESS"},
             "response": {"reference": "RESP-FIL02-01", "submittedAt": "2026-06-26T14:00:00+07:00",
                          "versions": [{"document": "DOC-05", "version": "v3"}], "execution": "WAITING",
                          "note": "Response returns the filing to Authority Review; the outcome is still open."}},
            {"cycle": 2, "request": {"reference": "AUTH-REQ-FIL02-02", "receivedAt": "2026-07-02T09:00:00+07:00",
                                     "requestedItems": ["Clarification of the carve-out perimeter in clause 4.2"],
                                     "owner": "U-02", "due": "2026-07-06T17:00:00+07:00", "execution": "IN_PROGRESS"},
             "response": {"reference": "RESP-FIL02-02", "submittedAt": "2026-07-04T11:00:00+07:00",
                          "versions": [{"document": "DOC-05", "version": "v4"}], "execution": "WAITING",
                          "note": "Distinct binding: cycle 2 responds with v4; cycle 1's v3 reference is retained unchanged."}}],
        "outcome": {"stage": "Approval", "observation": "Authority approval outcome recorded as an observation",
                    "execution": "COMPLETED", "verification": "UNVERIFIED",
                    "note": "COMPLETED may remain UNVERIFIED until a designated independent verifier accepts the outcome proof."}},
    "no_supplement": {
        "label": "Labelled scenario, not Atlas",
        "intro": "Not every filing is asked to supplement. FIL-01 proceeds from Authority Review straight to an approval observation on actual proof.",
        "cycles": [],
        "outcome": {"stage": "Approval", "observation": "Authority outcome recorded without any supplement cycle",
                    "execution": "COMPLETED", "verification": "UNVERIFIED",
                    "note": "The absence of a supplement is recorded explicitly, not inferred from silence."}},
    "rejection": {
        "label": "Labelled scenario, not Atlas",
        "intro": "Negative and corrective outcomes. Rejection is never Approval, and the linked Requirement stays unmet.",
        "cycles": [],
        "paths": [
            {"path": "Rejection", "actor": "Matter OWNER", "effect": "Execution CANCELLED with explicit reason and retained rejection proof; linked Requirement RQ-09 remains unmet.", "authority": "OWNER only (cancellation / reopen / applicability)"},
            {"path": "Withdrawal", "actor": "Matter OWNER", "effect": "Explicit withdrawal outcome and reason; prior submission and receipt observations are preserved.", "authority": "OWNER only"},
            {"path": "Correction of an erroneous stage", "actor": "Matter OWNER", "effect": "An attributed correction is appended. Missing events are never fabricated and earlier rows are never edited.", "authority": "OWNER only"},
            {"path": "Reopen after final approval", "actor": "Matter OWNER", "effect": "Reopen preserves the earlier submission and outcome and does not by itself require the authority to reissue a decision.", "authority": "OWNER only"}],
        "outcome": None}
}

# ── Domain events (Atlas §10) + restricted security log, kept separate ─────
F["eventsSrc"] = ("Event id, recorded time, actor, entity and the domain change itself are transcribed from Atlas. "
                  "Effective time, reason text, correlation id and the causal link between events are design-supplied: "
                  "Atlas records none of them, and they are shown here to exercise the history surface.")
F["events"] = [
    {"id": "EVT-01", "recordedAt": "2026-06-14T10:00:00+07:00", "effectiveAt": "2026-06-14T10:00:00+07:00", "actor": "U-03",
     "entity": "DOC-03", "operation": "Document version added",
     "before": "v2 CURRENT", "after": "v3 CURRENT, v2 SUPERSEDED",
     "reason": "New agreement version received from counsel", "correlation": "CORR-DOC03-V3", "causedBy": None},
    {"id": "EVT-02", "recordedAt": "2026-06-14T11:00:00+07:00", "effectiveAt": "2026-06-14T11:00:00+07:00", "actor": "U-02",
     "entity": "RQ-05", "operation": "Evidence review recorded",
     "before": "Verification UNVERIFIED", "after": "Verification VERIFIED",
     "reason": "Content review of DOC-03 v3 recorded against ER-05", "correlation": "CORR-DOC03-V3", "causedBy": "EVT-01"},
    {"id": "EVT-03", "recordedAt": "2026-06-14T14:00:00+07:00", "effectiveAt": "2026-06-14T14:00:00+07:00", "actor": "U-02",
     "entity": "AC-03 / RQ-03", "operation": "Action completed and evidence review recorded",
     "before": "AC-03 IN_PROGRESS; RQ-03 UNVERIFIED", "after": "AC-03 COMPLETED; RQ-03 VERIFIED",
     "reason": "DD review of DOC-02 v2 recorded against ER-03", "correlation": "CORR-DD-REVIEW", "causedBy": None},
    {"id": "EVT-04", "recordedAt": "2026-06-14T15:00:00+07:00", "effectiveAt": "2026-06-14T15:00:00+07:00", "actor": "U-03",
     "entity": "DOC-05 / FIL-02", "operation": "Document version added and filing package submitted",
     "before": "DOC-05 v1 CURRENT; FIL-02 Package Preparation", "after": "DOC-05 v2 CURRENT; FIL-02 Submission",
     "reason": "Notice package submitted to EP-03", "correlation": "CORR-FIL02", "causedBy": None},
    {"id": "EVT-05", "recordedAt": "2026-06-14T16:00:00+07:00", "effectiveAt": "2026-06-14T16:00:00+07:00", "actor": "U-03",
     "entity": "FIL-02 / RQ-10", "operation": "Receipt recorded; filing enters Authority Review",
     "before": "FIL-02 Submission; RQ-10 UNVERIFIED / IN_PROGRESS", "after": "FIL-02 Authority Review; RQ-10 PARTIALLY_VERIFIED / WAITING",
     "reason": "Acknowledgement received from EP-03. Receipt is not approval.", "correlation": "CORR-FIL02", "causedBy": "EVT-04"},
    {"id": "EVT-06", "recordedAt": "2026-06-15T08:00:00+07:00", "effectiveAt": "2026-06-15T08:00:00+07:00", "actor": "U-03",
     "entity": "AC-06 / RQ-06 / DOC-03", "operation": "First signature receipt recorded",
     "before": "AC-06 IN_PROGRESS; RQ-06 UNVERIFIED", "after": "AC-06 COMPLETED; RQ-06 PARTIALLY_VERIFIED (1 of 2 signatures)",
     "reason": "Signature receipt observed on DOC-03 v3", "correlation": "CORR-DOC03-SIG", "causedBy": "EVT-01"}
]
F["securityLog"] = {
    "src": "design-supplied: Atlas publishes no security log. These two rows exist only to show that restricted entries live on a separate surface, with their operational detail withheld.",
    "access": "Restricted security audit. Visible only to the authorities named in the approved permission matrix; never merged into ordinary domain history and never exported with a domain brief.",
    "entries": [
        {"id": "SEC-01", "recordedAt": "2026-06-15T08:41:00+07:00", "class": "denied-read",
         "summary": "A denied read of a record in this workspace was recorded.",
         "detailVisibility": "Operational detail is withheld from this concept; an authorised security reviewer sees actor, target class and decision."},
        {"id": "SEC-02", "recordedAt": "2026-06-15T08:52:00+07:00", "class": "membership-change",
         "summary": "A membership administration command was recorded.",
         "detailVisibility": "Operational detail is withheld from this concept."}
    ]
}

# ── Session / matters / memberships (SCR-01) ───────────────────────────────
F["session"] = {
    "src": ("design-supplied: Atlas names the workspace, the matter and the three persona aliases, and states explicitly that "
            "U-01..U-03 are personas rather than product roles. The Matter roles, the verifier designation, the fourth member "
            "U-04 and the second Matter ATLAS-002 are supplied by this design package to exercise the approved permission "
            "matrix, and are marked as such wherever they appear."),
    "workspace": {"id": "ATLAS-WS", "name": "Synthetic Legal Operations"},
    "actor": {"id": "U-01", "display": "U-01 (persona alias)", "workspaceRole": "OWNER"},
    "expiry": "Server-side TTL only; this concept holds no token and shows no countdown that it cannot source.",
    "matters": [
        {"id": "ATLAS-001", "title": "Project Atlas — Acquisition & Corporate Restructuring",
         "titleVi": "Dự án Atlas — Mua bán và tái cấu trúc doanh nghiệp", "myRole": "OWNER",
         "readAsOf": "2026-06-15T09:00:00+07:00", "members": [
             {"user": "U-01", "role": "OWNER", "state": "ACTIVE", "verifierDesignated": False},
             {"user": "U-02", "role": "EDITOR", "state": "ACTIVE", "verifierDesignated": True},
             {"user": "U-03", "role": "EDITOR", "state": "ACTIVE", "verifierDesignated": False},
             {"user": "U-04", "role": "VIEWER", "state": "ACTIVE", "verifierDesignated": False}]},
        {"id": "ATLAS-002", "title": "Cedar Holdings — Supplier Framework Renewal",
         "titleVi": "Cedar Holdings — Gia hạn hợp đồng khung nhà cung cấp", "myRole": "VIEWER",
         "readAsOf": "2026-06-15T09:00:00+07:00", "members": [
             {"user": "U-02", "role": "OWNER", "state": "ACTIVE", "verifierDesignated": False},
             {"user": "U-01", "role": "VIEWER", "state": "ACTIVE", "verifierDesignated": False}]}
    ],
    "inaccessibleNote": "Matters without an active membership for this actor are not listed, counted, named or hinted at. There is no \"2 more matters you cannot see\" affordance anywhere in this design."
}

# ── Import fixture (SCR-11) ────────────────────────────────────────────────
F["importFixture"] = {
    "file": {"declaredName": "atlas-intake-2026-06-15.xlsx", "declaredFormat": "XLSX", "declaredRows": 9, "declaredSheets": 1,
             "note": "File intent only. This concept does not read, parse, upload or execute the file; formulas, macros and embedded links are never run."},
    "sourceColumns": ["ext_id", "kind", "title", "owner_code", "due", "depends_on", "verification_claim"],
    "targetFields": [
        {"field": "External key", "source": "ext_id", "type": "string", "required": True},
        {"field": "Record type", "source": "kind", "type": "enum Requirement|Action", "required": True},
        {"field": "Title", "source": "title", "type": "string", "required": True},
        {"field": "Internal owner", "source": "owner_code", "type": "scoped member reference", "required": False},
        {"field": "Due", "source": "due", "type": "date, declared timezone UTC+07", "required": False},
        {"field": "Dependency reference", "source": "depends_on", "type": "scoped record reference", "required": False},
        {"field": "Verification claim", "source": "verification_claim", "type": "claim text", "required": False,
         "note": "An imported verification claim is a claim. It never becomes VERIFIED on import."}],
    "groups": [
        {"group": "G1", "label": "Carve-out approval chain", "rows": ["IMP-001", "IMP-002", "IMP-003"], "connected": True,
         "verdict": "REJECTED", "reason": "IMP-002 names a dependency reference outside this Matter's scope. The group is connected, so the whole group is rejected; no partial row from G1 is applied.",
         "rowDetail": [
             {"row": "IMP-001", "issue": None},
             {"row": "IMP-002", "issue": "depends_on references a record outside this Matter scope"},
             {"row": "IMP-003", "issue": None}]},
        {"group": "G2", "label": "Signature follow-up", "rows": ["IMP-004", "IMP-005"], "connected": True,
         "verdict": "ACCEPTED_PREVIEW", "reason": "Independent of G1 and internally valid; accepted in preview and still subject to a per-row rights and revision recheck at execution.",
         "rowDetail": [{"row": "IMP-004", "issue": None}, {"row": "IMP-005", "issue": None}]},
        {"group": "G3", "label": "Standalone post-closing handover", "rows": ["IMP-006"], "connected": False,
         "verdict": "ACCEPTED_PREVIEW", "reason": "Independent single row with no unresolved reference.",
         "rowDetail": [{"row": "IMP-006", "issue": None}]},
        {"group": "G4", "label": "Repeat intake", "rows": ["IMP-007", "IMP-008", "IMP-009"], "connected": False,
         "verdict": "MIXED", "reason": "Duplicate and changed-content handling differ and are reported separately.",
         "rowDetail": [
             {"row": "IMP-007", "issue": "Same source, key and content as an earlier accepted import: de-duplicated, no second record"},
             {"row": "IMP-008", "issue": "Same source and key, changed content: reported as a conflict for an explicit decision, never silently overwritten"},
             {"row": "IMP-009", "issue": "Invalid date value in due: row rejected with the exact cell named"}]}],
    "resultNote": "Nothing is applied by this concept. The counts shown are the preview's own arithmetic over the fixture above."
}

# ── Permission table, transcribed verbatim from docs/requirements/permission-matrix.md ──
def row(op, owner, editor, viewer, cond):
    return {"operation": op, "OWNER": owner, "EDITOR": editor, "VIEWER": viewer, "condition": cond}

F["permissionMatrix"] = {
    "source": "docs/requirements/permission-matrix.md (APPROVED_BY_PO, OBD-08 + OBD-02)",
    "scopeRule": "Active Workspace membership AND explicit Matter membership AND role permission. Workspace-level membership administration uses Workspace OWNER; Matter-level operations use the role on that Matter. A Workspace OWNER does not automatically read a confidential Matter.",
    "personaRule": "Personas do not grant roles. Lead Operator, Counsel, Legal Ops Admin, Compliance Auditor and Filing Counsel are labels for who typically sits at a screen; authority is read from the role column only.",
    "rows": [
        row("Matter access / read state and related records", "Yes", "Yes", "Yes", "Active explicit membership; no cross-workspace references"),
        row("Create Matter / grant initial owner", "Conditional", "No", "No", "Workspace OWNER; creation and membership grant audited"),
        row("Matter settings / critical milestone designation / milestone required prerequisites", "Yes", "No", "No", "Explicit reason for changes affecting readiness"),
        row("Ordinary dependency edges between Requirements/Actions", "Yes", "Yes", "No", "Same matter, graph/gate validation, reason for add/change/removal and audit; distinct from milestone required prerequisites"),
        row("Requirements create/edit", "Yes", "Yes", "No", "No applicability/waiver bypass; cancellation/reopen OWNER only"),
        row("Actions create/edit / assign", "Yes", "Yes", "No", "Assignee active matter member; assignment never grants access"),
        row("Execution start/wait/complete", "Yes", "Yes", "No", "State guards; blocked completion denied"),
        row("Cancellation/reopen / proof applicability", "Yes", "No", "No", "RULE-004/005; reason mandatory; cancellation is not legal waiver"),
        row("Evidence submission / replace with new record", "Yes", "Yes", "No", "Same matter; typed criterion/version reference; never overwrite accepted proof"),
        row("Evidence review / verify / reject / resolve dispute", "Conditional", "Conditional", "No", "Explicit designated verifier AND not submitter; scope and valid version"),
        row("Challenge proof", "Yes", "Yes", "No", "Reason; no arbitrary resolution by challenger"),
        row("Document content and metadata read", "Yes", "Yes", "Yes", "Matter access at every retrieval; do not expose versions through unprotected links"),
        row("Add document version", "Yes", "Yes", "No", "Valid content/reference; new version does not auto-promote"),
        row("Promote authoritative version", "Yes", "No", "No", "Expected prior version, reason, impact summary"),
        row("Filing update / submission observation", "Yes", "Yes", "No", "Stage and package guards; no actual external filing implied"),
        row("Filing rejection/withdrawal correction", "Yes", "No", "No", "Proof/reason; no hidden approval"),
        row("Bulk editing", "Yes", "Yes", "No", "Per-row permission/revision; allowed metadata fields only"),
        row("Import", "Yes", "Yes", "No", "Preview/confirm scoped groups; no imported grants/VERIFIED state"),
        row("Excel export / delta draft export", "Yes", "Yes", "Yes", "Recheck permission at retrieval; no hidden fields/records/counts"),
        row("Event History read", "Yes", "Yes", "Yes", "Same matter; protect security-log details"),
        row("Edit/delete prior Event History", "No", "No", "No", "Corrections append; approved retention handled separately"),
        row("Matter membership / verifier designation", "Yes", "No", "No", "Active workspace members only; verifier must be matter EDITOR/OWNER and cannot verify own submitted proof; do not remove/demote last active OWNER"),
        row("Workspace membership", "Conditional", "No", "No", "Workspace OWNER only; revocation immediately removes derived matter access"),
        row("Hard delete matter/evidence/history", "No", "No", "No", "Retention/erasure policy OBD-11; not generic CRUD deletion")
    ]
}

# ── Error / recovery UX mapping, derived from the current ZCode contract ───
F["errorMapping"] = {
    "contract": "docs/implementation/p0-zcode-execution/local-contract.md revision 4 (read-only input)",
    "disclaimer": "A UX consumer mapping. It never defines or changes the wire contract, and it never invents a status the contract does not define. Any status code the contract does not define is absent here, including the generic concurrent-edit code earlier drafts used.",
    "rows": [
        {"condition": "A CAS-scoped write is attempted with no precondition (If-Match omitted)",
         "status": "428 precondition-required",
         "message": "This change needs the version you are editing against. Reload the record and resubmit; nothing has been changed.",
         "intent": "Draft retained in full. Nothing was sent to the server as a command.",
         "recovery": "Reload the record to pick up its current revision, then resubmit the same draft.",
         "disabled": "The submit control stays enabled; there is nothing to reconcile."},
        {"condition": "A CAS-scoped write is attempted with a stale revision",
         "status": "412 precondition-failed",
         "message": "Someone else changed this record while you were editing. Your draft is kept. Review the current values you are allowed to read, then rebase and resubmit.",
         "intent": "Draft retained. The attempted command did not take effect.",
         "recovery": "Refresh and rebase onto the accepted revision, compare only the fields this role may read, then issue a new command.",
         "disabled": "Blind overwrite and 'force save' are not offered at all."},
        {"condition": "The same idempotency key is reused with a different request fingerprint",
         "status": "422 idempotency-key-reuse",
         "message": "This looks like a different change sent under an earlier attempt's identity. Start a new attempt instead of resending.",
         "intent": "Draft retained; the earlier committed outcome is untouched.",
         "recovery": "Begin a new command with a new key, or read the earlier receipt to see what actually committed.",
         "disabled": "Resend under the old key is disabled."},
        {"condition": "A precondition is sent on an operation that has no CAS scope (requirement create)",
         "status": "400 precondition-not-applicable",
         "message": "This operation does not take a version precondition. Resubmit without one.",
         "intent": "Draft retained.",
         "recovery": "Resubmit the same draft without a precondition.",
         "disabled": "None."},
        {"condition": "A receipted command loses its response (workspace create, matter create, requirement create)",
         "status": "503 outcome-unknown, with a receipt available",
         "message": "We did not get an answer for this submission. It may or may not have been recorded. We can check the receipt for this exact attempt before anything is retried.",
         "intent": "Draft retained and the attempt's key is retained with it.",
         "recovery": "Read the receipt for the attempt's own key, or retry the identical attempt under the same key: a stored outcome replays instead of creating a second record.",
         "disabled": "Retry under a new key is disabled; that is the path that creates duplicates."},
        {"condition": "A non-receipted membership command loses its response (workspace or matter membership grant / revocation)",
         "status": "503 outcome-unknown, with no receipt",
         "message": "We did not get an answer for this membership change, and this kind of command has no receipt to look up. The outcome stays unknown until an authorised reader confirms the current membership.",
         "intent": "Intent retained for the actor who is still permitted to see it. No success and no failure is displayed.",
         "recovery": "An authorised actor re-reads the workspace or matter membership. Only if that read shows the change absent may the command be issued again, as an explicit new command.",
         "disabled": "Automatic resend is disabled. A later state, or a subsequent 412, is never treated as proof of what the earlier command did."},
        {"condition": "The acting member is revoked and loses the right to read back",
         "status": "503 outcome-unknown, readback lost",
         "message": "Your access to this Matter ended. We cannot tell you what happened to your last submission, and we cannot show its contents again.",
         "intent": "Protected values and the local draft are purged immediately. No stale-grant rescue, export or copy is offered.",
         "recovery": "An authorised owner confirms the outcome from their own read. For the revoked actor the outcome remains unknown by design.",
         "disabled": "Resend, export, download and 'show me what I typed' are all disabled. Having performed a GET never unlocks a resend."},
        {"condition": "A read is denied because the record is out of scope or does not exist",
         "status": "404, uniform body",
         "message": "No record is available at this address for your access.",
         "intent": "Nothing is retained; there was nothing readable to retain.",
         "recovery": "Return to the accessible Matter list.",
         "disabled": "No title, counterparty, file name, count or legal detail is shown, and inaccessible and non-existent are indistinguishable."},
        {"condition": "A mutation is denied inside a record this role may read",
         "status": "403, uniform body",
         "message": "Your role on this Matter does not permit this change. The record stays visible and read-only.",
         "intent": "Draft retained locally only while the actor still holds read rights.",
         "recovery": "Ask an authorised role to perform the change, or continue reading and exporting within scope.",
         "disabled": "Only the specific mutation control is disabled; reading, history and scoped export stay available."},
        {"condition": "The evaluator, verifier or a dependent subsystem is unavailable",
         "status": "503 unavailable",
         "message": "We cannot evaluate this right now, so we are not showing a readiness answer we do not have.",
         "intent": "Draft retained.",
         "recovery": "Retry the read. Nothing is defaulted to READY, zero or OK in the meantime.",
         "disabled": "Controls that would depend on the missing evaluation are disabled with that reason stated."},
        {"condition": "A domain conflict on an operation the contract has not yet defined (requirement edit, bulk, import, filing stage, promotion — W2+)",
         "status": "DEPENDENCY_PENDING",
         "message": "This concept does not display a status code for operations the current contract has not defined. The screen shows the business condition and keeps the draft.",
         "intent": "Draft retained.",
         "recovery": "The exact status and problem type arrive with the contract revision that adds the operation; this design consumes it then.",
         "disabled": "No status is guessed and no membership rule is borrowed for these operations."}
    ]
}

# ── Golden Workflow walkthrough (sequences from golden-workflow-acceptance.md) ──
F["goldenWorkflows"] = [
 {"id": "GW-01", "acceptance": "AC-161", "name": "Transaction / restructuring",
  "sequence": ["Approval", "Document", "Signature", "Payment", "Transfer", "Closing", "Filing", "Post-Closing"],
  "stages": [
   {"stage": "Approval", "screen": "SCR-03 → SCR-04 → SCR-07", "nav": "Operational Grid → open RQ-01 → Inspect proof",
    "do": "Record the internal approval requirement and its proof; a designated non-submitter reviewer verifies it.",
    "atlas": "RQ-01 COMPLETED / VERIFIED, ER-01 → EV-01 → DOC-01 v2, recorded by U-01 and reviewed by U-02.",
    "guard": "Completion of AC-01 does not verify RQ-01; the two axes stay separate."},
   {"stage": "Document", "screen": "SCR-08", "nav": "Documents & versions → DOC-03",
    "do": "Add the agreement version; a Matter OWNER promotes the authoritative version with the expected prior version, a reason and an impact summary; record the content review.",
    "atlas": "DOC-03 v1 → v2 → v3 CURRENT; EV-05 reviews v3 against ER-05.",
    "guard": "Adding a version never promotes it. Promotion is OWNER only."},
   {"stage": "Signature", "screen": "SCR-08 → SCR-03a", "nav": "Documents & versions → DOC-03 signature panel → My Actions (AC-05)",
    "do": "Track partial, then complete, signature criteria against the exact version.",
    "atlas": "DOC-03 v3 has 1 of 2 signatures; EV-06 is the first receipt; AC-05 follows up EP-02.",
    "guard": "One of two signatures is never displayed as signed."},
   {"stage": "Payment", "screen": "SCR-03 → SCR-05", "nav": "Operational Grid → open AC-07",
    "do": "Record the actual payment confirmation against RQ-07.",
    "atlas": "AC-07 NOT_STARTED and BLOCKED by DEP-02 (completion gate on AC-05); RQ-07 has no incoming gate and is READY.",
    "guard": "The Action's blocked dependency is not copied onto the Requirement."},
   {"stage": "Transfer", "screen": "SCR-03 → SCR-05", "nav": "Operational Grid → open AC-08",
    "do": "Record the transfer and closing checklist confirmations.",
    "atlas": "AC-08 BLOCKED by DEP-03; DOC-04 v1 is a draft input, not closing proof.",
    "guard": "An execution-only edge does not assert legal sufficiency for payment or transfer."},
   {"stage": "Closing", "screen": "SCR-02", "nav": "Control Room → Milestones",
    "do": "Evaluate the explicit closing prerequisites and record the closing outcome and proof.",
    "atlas": "MS-02 Closing is UNASSESSED: required prerequisite sets are not defined in the fixture.",
    "guard": "Closing readiness follows the declared prerequisites, not total action completion. UNASSESSED is shown as UNASSESSED."},
   {"stage": "Filing", "screen": "SCR-09", "nav": "Filing tracker → FIL-01",
    "do": "Prepare and track the filing; this stage runs the whole of GW-03.",
    "atlas": "FIL-01 is still at Requirement stage with no package.",
    "guard": "Closing does not auto-complete the filing."},
   {"stage": "Post-Closing", "screen": "SCR-03 → SCR-07", "nav": "Operational Grid → RQ-12 → Inspect proof",
    "do": "Complete the post-closing handover requirement and obtain independent proof.",
    "atlas": "RQ-12 NOT_STARTED / UNVERIFIED; AC-12 is BLOCKED by DEP-07, the proof gate from RQ-11.",
    "guard": "Independent verification is still required after the handover is recorded."}]},
 {"id": "GW-02", "acceptance": "AC-162", "name": "Due diligence",
  "sequence": ["Request", "Document", "Review", "Gap", "Finding", "Follow-Up", "Resolution"],
  "stages": [
   {"stage": "Request", "screen": "SCR-03 → SCR-05", "nav": "Operational Grid → open AC-03",
    "do": "Record the request for the DD pack and the proof expected in return.",
    "atlas": "AC-03 is the review Action on DOC-02 v2 for RQ-03.",
    "guard": "A request that has been sent is not evidence that the gap is resolved."},
   {"stage": "Document", "screen": "SCR-08", "nav": "Documents & versions → DOC-02",
    "do": "Receive the pack as a new version and identify exactly which version will be reviewed.",
    "atlas": "DOC-02 v1 SUPERSEDED → v2 CURRENT.",
    "guard": "The review names the exact version; 'the latest' is not a reference."},
   {"stage": "Review", "screen": "SCR-07", "nav": "RQ-03 → Inspect proof",
    "do": "Review the identified version against the declared criterion.",
    "atlas": "ER-03 → EV-03 → DOC-02 v2 + review note, recorded and reviewed by U-02 on 2026-06-14.",
    "guard": "Recorder and reviewer are the same identity here, so the panel shows the self-review caveat explicitly rather than presenting it as independent acceptance."},
   {"stage": "Gap", "screen": "SCR-02 → SCR-04", "nav": "Control Room → Evidence gaps → RQ-04",
    "do": "Identify the missing component as its own requirement, not as a footnote on the reviewed one.",
    "atlas": "RQ-04 WAITING / UNVERIFIED; ER-04 is missing and awaits EP-01.",
    "guard": "The existence of DOC-02 v2 does not suppress the gap."},
   {"stage": "Finding", "screen": "SCR-04", "nav": "RQ-04 → linked context",
    "do": "Record a typed Finding linked to the subject, criterion, document version and follow-up.",
    "atlas": "FD-01 OPEN, linked to RQ-04, ER-04, DOC-02 v2 and AC-04.",
    "guard": "Findings resolve by reference; gap history is never deleted."},
   {"stage": "Follow-Up", "screen": "SCR-03b", "nav": "Waiting On → AC-04",
    "do": "Assign the follow-up Action and record the external wait with its accountable internal owner.",
    "atlas": "AC-04 WAITING on EP-01, dependency READY, internal owner U-01.",
    "guard": "WAITING is not BLOCKED. AC-04 has no incoming gate, so its dependency stays READY while it waits."},
   {"stage": "Resolution", "screen": "SCR-07 → SCR-13", "nav": "RQ-04 → Inspect proof, then Event history",
    "do": "Submit the resolution proof, have a designated independent verifier assess it, and complete the requirement explicitly.",
    "atlas": "Not reached at T0. The fixture stops at the open gap; no resolution is simulated.",
    "guard": "The verifier must not be the submitter, and the completion event is recorded with its proof links."}]},
 {"id": "GW-03", "acceptance": "AC-163", "name": "Regulatory filing",
  "sequence": ["Requirement", "Package Preparation", "Signature", "Submission", "Receipt", "Authority Review", "Supplement", "Response", "Approval"],
  "stages": [
   {"stage": "Requirement", "screen": "SCR-09", "nav": "Filing tracker → FIL-01",
    "do": "Declare the filing subject, responsible owner and the authority party.",
    "atlas": "FIL-01 for RQ-09 with EP-03; execution NOT_STARTED.",
    "guard": "A declared filing is not a submitted one."},
   {"stage": "Package Preparation", "screen": "SCR-09 → SCR-08", "nav": "Filing tracker → checklist → Documents",
    "do": "Identify the required document versions and complete non-signature preparation.",
    "atlas": "FIL-02 prepared DOC-05; DOC-04 v1 is only an input for FIL-01.",
    "guard": "Package criteria that are not declared are shown as not declared, not as satisfied."},
   {"stage": "Signature", "screen": "SCR-09 → SCR-08", "nav": "Filing tracker → signature row",
    "do": "Collect and record signature proof, or record an explicit applicability decision if signatures do not apply.",
    "atlas": "FIL-02 has no signature applicability reason supplied; the checklist says so rather than claiming not-applicable.",
    "guard": "If signatures are not applicable, an OWNER records the reason before Submission. Signatures are never invented."},
   {"stage": "Submission", "screen": "SCR-09", "nav": "Filing tracker → submission row",
    "do": "Record the submission reference, time and the exact submitted versions.",
    "atlas": "FIL-02 submitted DOC-05 v2 on 2026-06-14T15:00+07 under SUB-FIL02-001.",
    "guard": "Submission is not completion."},
   {"stage": "Receipt", "screen": "SCR-09", "nav": "Filing tracker → receipt row",
    "do": "Record the actual acknowledgement as a separate observation.",
    "atlas": "EV-10 receipt recorded on 2026-06-14T16:00+07.",
    "guard": "Receipt is not approval (RULE-012)."},
   {"stage": "Authority Review", "screen": "SCR-09 → SCR-03b", "nav": "Filing tracker → waiting panel → Waiting On",
    "do": "Record that the filing waits on the authority, with the internal accountable owner named.",
    "atlas": "FIL-02 WAITING on EP-03 since the receipt; internal owner U-03 via AC-10.",
    "guard": "Authority Review may be WAITING while dependency stays READY."},
   {"stage": "Supplement", "screen": "SCR-09", "nav": "Filing tracker → path selector → two supplement/response cycles",
    "do": "Record each authority request with its own reference, requested items, owner and due date, opening a new package cycle.",
    "atlas": "Not reached at T0. The two-cycle path is a labelled scenario: AUTH-REQ-FIL02-01 then AUTH-REQ-FIL02-02.",
    "guard": "A second request never overwrites the first. Not every filing is asked to supplement; the no-supplement path is a first-class alternative."},
   {"stage": "Response", "screen": "SCR-09", "nav": "Filing tracker → cycle detail",
    "do": "Record the response with its exact responding versions and return the filing to Authority Review.",
    "atlas": "Scenario: RESP-FIL02-01 binds DOC-05 v3; RESP-FIL02-02 binds v4. Distinct bindings per cycle.",
    "guard": "Responding does not decide the outcome."},
   {"stage": "Approval", "screen": "SCR-09 → SCR-07", "nav": "Filing tracker → outcome, then Inspect proof",
    "do": "Record the actual authority outcome proof, then verify it independently.",
    "atlas": "Scenario only. Rejection and withdrawal are explicit negative outcomes, cancelled by an OWNER, and leave the linked Requirement unmet.",
    "guard": "COMPLETED may remain UNVERIFIED until a designated verifier accepts the outcome proof."}]}
]

# ── Screens list used by the specimen viewer and the authority strip ───────
F["screens"] = [
 {"id": "SCR-01", "name": "App shell & session navigation", "view": "session",
  "personas": "Any member arriving at the product; typically a coordinator or a manager picking up a Matter.",
  "readRoles": "Scoped OWNER / EDITOR / VIEWER see the Matters where they hold an active membership. A Workspace OWNER sees no Matter they are not a member of.",
  "operations": "Create Matter and grant the initial owner: Workspace OWNER. Matter membership and verifier designation: Matter OWNER, with the last-active-OWNER guard.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-02", "name": "Executive Control Room", "view": "control",
  "personas": "Lead counsel, lead operator, transaction owner.",
  "readRoles": "All scoped roles read the Control Room.",
  "operations": "No mutation lives here. Every change is made in the record's own surface under that surface's authority.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-03", "name": "Operational Grid", "view": "grid",
  "personas": "Anyone working the matter day to day.",
  "readRoles": "All scoped roles read and may export within scope.",
  "operations": "Requirement and Action create/edit and assignment: EDITOR or OWNER. Cancellation, reopen and proof applicability: OWNER only.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-04", "name": "Requirement detail & lifecycle drawer", "view": "modal",
  "personas": "Requirement owner and reviewer.",
  "readRoles": "All scoped roles read the record, its axes and its gates.",
  "operations": "Edit: EDITOR or OWNER. Cancellation, reopen and proof applicability: OWNER only.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-05", "name": "Action detail & assignment drawer", "view": "modal",
  "personas": "Action owner, coordinator, contributor.",
  "readRoles": "All scoped roles read the record.",
  "operations": "Edit and assign to an active member in scope: EDITOR or OWNER. Assignment never grants access.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-06", "name": "Dependency graph & impact inspector", "view": "control",
  "personas": "Whoever is diagnosing a blockage.",
  "readRoles": "All scoped roles inspect edges and gates.",
  "operations": "Ordinary dependency edges: EDITOR or OWNER. Milestone required prerequisites: OWNER only. Graph cycles are rejected at validation; a cycle is never displayed as an accepted graph state.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-07", "name": "Evidence submission & verification drawer", "view": "modal",
  "personas": "Submitter and designated independent verifier.",
  "readRoles": "All scoped roles read the criterion, the evidence reference and the validity.",
  "operations": "Submit evidence: EDITOR or OWNER. Review, verify, reject or resolve a dispute: a designated verifier who is an EDITOR or OWNER and is not the submitter. An OWNER is not automatically the verifier.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-08", "name": "Document version & signature history", "view": "documents",
  "personas": "Document owner, reviewer, counsel.",
  "readRoles": "All scoped roles read content, metadata and lineage; retrieval rechecks matter access every time.",
  "operations": "Add a version: EDITOR or OWNER, and a new version never auto-promotes. Promote the authoritative version: OWNER only, with the expected prior version, a reason and an impact acknowledgment.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-09", "name": "Regulatory filing tracker & package manager", "view": "filing",
  "personas": "Filing coordinator, paralegal, regulatory specialist.",
  "readRoles": "All scoped roles read filings, packages, submitted versions and cycles.",
  "operations": "Stage observations under package guards: EDITOR or OWNER. Rejection, withdrawal, correction and reopen: OWNER only.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-10", "name": "Bulk metadata editor & preview", "view": "bulk",
  "personas": "Whoever is reconciling a batch of records.",
  "readRoles": "All scoped roles read the selection. VIEWER sees the selection and the preview as read-only.",
  "operations": "Bulk editing: EDITOR or OWNER, per-row permission and revision recheck, and only the four allow-listed fields.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-11", "name": "Structured import wizard", "view": "import",
  "personas": "Whoever is bringing an external worksheet into the matter.",
  "readRoles": "All scoped roles read the preview. VIEWER cannot start an import.",
  "operations": "Import: EDITOR or OWNER. No imported role grant and no imported VERIFIED state, ever.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-12", "name": "Delta status brief", "view": "brief",
  "personas": "Anyone reporting upward.",
  "readRoles": "Scoped OWNER / EDITOR / VIEWER read and export, with rights rechecked at retrieval.",
  "operations": "P0 produces a draft only. There is no managed issued-report snapshot.",
  "status": "IMPLEMENTED_IN_CONCEPT"},
 {"id": "SCR-13", "name": "Scoped event history", "view": "history",
  "personas": "Counsel, auditor, owner.",
  "readRoles": "All scoped roles read the Matter's domain history. Restricted security-log detail is not part of this surface.",
  "operations": "History is append-only. No role edits or deletes prior history; corrections append.",
  "status": "IMPLEMENTED_IN_CONCEPT"}
]


F["titlesEn"] = {
    "RQ-01": "Internal approval evidence is complete",
    "AC-01": "Record the approval received for RQ-01",
    "RQ-02": "The condition for accepting the change is evidenced",
    "AC-02": "Send the change notification related to RQ-02",
    "RQ-03": "The review of the existing DD pack is recorded",
    "AC-03": "Review DOC-02 v2 for RQ-03",
    "RQ-04": "The supplementary documentation gap is resolved",
    "AC-04": "Follow up with EP-01 on the RQ-04 documentation",
    "RQ-05": "The content of DOC-03 v3 has been reviewed",
    "AC-05": "Track the outstanding signature for RQ-06",
    "RQ-06": "The current agreement version carries every required signature",
    "AC-06": "Record the first signature receipt for RQ-06",
    "RQ-07": "The payment condition is evidenced",
    "AC-07": "Record the payment confirmation for RQ-07",
    "RQ-08": "Transfer and closing evidence is complete",
    "AC-08": "Record the transfer and closing checklist for RQ-08",
    "RQ-09": "The post-closing filing is approved",
    "AC-09": "Prepare FIL-01 to satisfy RQ-09",
    "RQ-10": "The filing notice has the outcome that must be tracked",
    "AC-10": "Await the FIL-02 response from EP-03 for RQ-10",
    "RQ-11": "Supplement requests are handled when they arise",
    "AC-11": "Prepare the follow-up for the FIL-02 response for RQ-11",
    "RQ-12": "The post-closing handover has an acknowledgement",
    "AC-12": "Send the post-supplement handover for RQ-12",
    "AC-DEMO-PROOF": "File the notarised power of attorney for the legal representative"
}
F["titlesEnNote"] = ("English renderings of the Vietnamese Atlas titles, supplied by this design package so that "
                     "both languages read in full. The Vietnamese label remains the canonical fixture value.")

print(json.dumps(F, ensure_ascii=False, separators=(",", ":")))
