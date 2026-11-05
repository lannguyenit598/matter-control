# Findings — attempt r2 (BA review, author-adjacent, NOT independent QA)

Counts: **0×P0, 0×P1, 3×P2, 4×P3** — classes: 3 DEFECT, 2 GAP, 1 UX_FRICTION, 1 NOT_VERIFIED. BF-01..BF-10 recheck: **7 CLOSED_VERIFIED (live), 3 CLOSED_SOURCE_ONLY, 0 OPEN, 0 REGRESSED** (r1 counted 5 live / 5 source-only; r2's deeper GW-03 pass moved BF-02 to live). Machine-readable copy: `findings.json`. r1's seven P3 findings at `../findings.md` stand unchanged; overlap is cross-referenced below.

## P2

### Z-F-01 — DEFECT: proof-required filing can be submitted with an empty declared package (purpose-blind guard)

- Flow F09 / RULE-012. Live proof: filing F (proofRequired=true) with a single mandatory **OUTCOME** criterion and zero PACKAGE criteria passed PACKAGE_PREPARATION and **SUBMISSION** with `package.declared=false, total=0, mandatory=0` (walkthrough-evidence/gw03-narrative.md "Filing F"; calls.jsonl filing 01a192b8-4110-…).
- Root: `filing.go:355-364` counts any non-retired criterion on the filing without a purpose filter; the SUBMISSION gate then evaluates mandatory PACKAGE criteria — vacuously true when none exist.
- Why not P1/P0: no data loss or exposure; the record still shows `verification UNVERIFIED` and `ov PENDING`, and the state is visible via `package.declared:false` on the proof read — but the stage machine asserts "submitted", which a manager can read as package-complete. Per the assignment's severity ladder this is a business-truth distortion risk in a golden workflow → P2 DEFECT (not pure UX).
- Suggested correction (business level): PACKAGE_PREPARATION (proofRequired=true) requires ≥1 non-retired **PACKAGE**-purpose criterion; SUBMISSION refuses while `package.declared=false`. State-semantics filing table gains the explicit row. No retroactive reinterpretation of in-flight filings without an owner decision.

### Z-F-02 — GAP: signature gate for proof-required filings accepts any satisfied criterion (no signature-specific criterion kind)

- RULE-011 says signature completeness is a separate observation/criterion. Live: filing A reached SUBMISSION with **zero signature observations** because its generic "package complete" criterion was accepted (filing.go:379-394 — signatures "proven through its mandatory criteria"). No-proof filings ARE guarded (observation or OWNER no-signature decision required — verified by filing C's `409 signature-required`).
- P2 GAP: the approved semantics distinguish signature completeness; the implementation cannot recognize a signature criterion, so the protection depends entirely on the OWNER declaring the right criteria. Mitigations that exist: signature observations are recorded per exact version (verified in GW-01), and the OWNER signature-applicability decision is honored for no-proof filings (verified: EDITOR 403, OWNER recorded).

### Z-F-03 — GAP: NOT_DECLARED outcome is disclosed on filing surfaces, not in Grid/Control Room

- Live: filing detail/list/work-item carry `outcomeVerification:NOT_DECLARED` (verified); Grid rows and Control Room still show the package-driven aggregate only (remediation §9 documents the same limitation). Open PO decision D-BF1 unchanged. P2 because a manager reading the Grid can still read "VERIFIED" without the outcome qualifier — the exact confusion BF-01 was raised for, half-closed.

## P3

### Z-OBS-03 — UX_FRICTION: 400 (key/malformed) precedes 403 on receipted commands
VIEWER evidence submission without a key and VIEWER bulk commit with an empty body both returned `400 urn:mc:bad-request` instead of the uniform 403 (calls.jsonl). No data leak; contract §3 documents forbidden-before-key. Two live instances.

### Z-OBS-04 — DEFECT (contract-level): stale If-Match on matter-members grant returned 403, not 412
Observed once live (gw02 narrative; grant for `ba-dung` with a stale-but-readable ETag → 403 forbidden). Safe denial, no mutation; contradicts local-contract §2.2's "any other tag → stale revision (412)" for this command. Needs one targeted re-test by an owner of that code path before a fix is drafted.

### Z-OBS-05 — UX_FRICTION: WAITING needs the internal owner via a separate PATCH first
`409 waiting-owner-required` until `ownerId` is set (live; matches r1 F-06). Guard is per FR-004; the two-step journey is the friction.

### Z-NV-01 — NOT_VERIFIED: live OUTCOME_UNKNOWN drill
No fault injection attempted in r2. Verified instead: same-key replay (`Idempotent-Replayed:true`, no duplicate — live) and unknown-key `GET /operations/{key}` + reconciliation → uniform 404 (live). The OUTCOME_UNKNOWN path remains covered by the green W6 contract suites (author-run), not by a live drill.

## BF-01..BF-10 recheck (current tree, HEAD 0de3e5d + dirty)

| ID | r2 verdict | Evidence |
|---|---|---|
| BF-01 | CLOSED_VERIFIED (live) | GW-03 filing A: PACKAGE-only submission gate, APPROVAL → `PARTIALLY_VERIFIED`+`PENDING`, verifier accept → `VERIFIED`+`ACCEPTED`; NOT_DECLARED disclosure; migration 0009 present; open PO decision D-BF1 recorded |
| BF-02 | CLOSED_VERIFIED (live) | Filing D: checklist reachable at proofRequired=false; signature-applicability OWNER-only (EDITOR 403); stage machine runs; source: workview.go:85-87, work page isFiling |
| BF-03 | CLOSED_SOURCE_ONLY | `lib/mc/local-time.ts` + LocalDateTimeField wired (execution-panel.tsx:11,169); author module tests; API stores one instant (live); rendering NOT_RUN |
| BF-04 | CLOSED_SOURCE_ONLY | SearchPicker/searchWorkItemsAction (dependency-panel.tsx:119-129, filing-forms.tsx:13); author tests; API side >200 honest pagination verified live |
| BF-05 | CLOSED_VERIFIED (live) | /me/reviews live: verifier 1 pending, submitter/viewer/non-member 0, drains; discovery.go:43-114; server.go:130 |
| BF-06 | CLOSED_SOURCE_ONLY | page.tsx:4, flow.ts:86, next.config.ts:57 → `/my-actions`; author route tests |
| BF-07 | CLOSED_SOURCE_ONLY | matter root page.tsx:127 ControlRoomView (+ brief variant per remediation §13); author page tests |
| BF-08 | CLOSED_VERIFIED (live) | discovery 2/1/0 by membership, exact totals; workspace_service.go:997-1004; server.go:131 |
| BF-09 | CLOSED_SOURCE_ONLY | work-now.tsx:62 + primaryTransition (execution-panel.tsx:21,84); author tests; rendering NOT_RUN |
| BF-10 | CLOSED_SOURCE_ONLY | brief-section.tsx:14,40-85,193 (device zone, targetLabel); live brief shows targetLabel; rendered readability NOT_RUN |

Cross-reference to r1's seven P3 findings: F-06 ≙ Z-OBS-05 (corroborated); Z-NV-01 ≙ r1's OUTCOME_UNKNOWN NOT_VERIFIED (same boundary); r1's contract-doc drift findings (bulk preview row shape, answers `questionRevision`) and role-vocabulary/`targetLabel`/minimal-evidence-response findings are not contradicted — r2 exercised bulk with the implemented shape (`rowKey/idempotencyKey/attemptKey`) and confirms the docs lag the implementation.
