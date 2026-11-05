# User Journeys

Owner: Codex. Status: APPROVED_BY_PO (2026-10-24; subject 572835a; DEC-016). Journeys describe user goals; they are not screen layouts or implementation tasks. Persona permissions follow permission-matrix.md; external parties do not automatically have accounts.

| Journey | Trigger / persona | Steps and decisions | Success / exception | Trace |
|---|---|---|---|---|
| Morning comprehension | Transaction Owner opens a matter after overnight changes | Read Control Room as-of; identify top blocker/milestone; inspect causal chain and proof gaps; choose next owner/action; record decision context | Correct state/blocker/next owner understood near 10-second target; unavailable data remains visibly unknown | BR-001/002/003; FR-002/003/009/020; AC-102/103/109/137 |
| Execute assigned work | Contributor opens My Actions | Filter actionable vs waiting/blocked; open context/required evidence/version; edit inline or select explicit rows; preview bulk; reconcile row errors; attach proof or record external waiting | Work updated with owner/time/history; no false verification or completion through blockers; stale update rejected with draft retained | BR-003/004; FR-004/010/011/012; AC-104/110/111/112/133/139 |
| Review and prove | Reviewer receives submitted proof | Check criterion and exact version; inspect expiry/signature observations; verify independent from submitter; accept/reject/challenge with reason; observe downstream impact | Proof-based satisfaction and causal readiness; self-review/expired proof denied; reversal preserves history | BR-005/006; FR-006/007/015; AC-107/126/127/128/140/157 |
| Communicate progress | Manager prepares status update | Select scope, baseline/as-of; inspect changes separately from outstanding; inspect source references; generate draft and export permitted tables | Deterministic facts/provenance, no-change explicit; unknown history/access loss blocks unsafe output | BR-007; FR-014/019; AC-114/119/138/147 |
| Bring existing tracker | Contributor with import rights | Map types/dates/source row IDs; preview references/duplicates and proof claims; confirm valid groups; reconcile errors; retry same source safely | No orphan/cycle/duplicate grant; errors actionable; imported proof claims await review | BR-003/005; FR-001/013/018; AC-113/131/132/148 |

## Workflow context

GW-01: owner coordinates approval, current agreement/signature observations, payment/transfer proof, closing readiness and filing/post-closing. Contributor follows accountable actions; reviewer proves each condition. A readiness view must expose unresolved RQ-04-style gaps before closing.

GW-02: contributor records request/documents; reviewer checks criteria/version, records gap/finding and follow-up; owner allocates response; reviewer confirms resolution proof. Sending a request or receiving a file is not resolution.

GW-03: contributor prepares declared package/signatures, records submission and receipt, waits on authority, handles repeated supplement/response, then records outcome. Reviewer verifies outcome; manager sees outstanding authority wait. Receipt never equals Approval.

Exact sequences, alternative/exception paths and test evidence requirements: [Golden Workflow acceptance](../requirements/golden-workflow-acceptance.md). Contextual navigation must return to the prior filtered/selected work where authorized; unsaved changes need explicit save/discard recovery. Desktop-first Grid supports dense execution; responsive secondary journeys prioritize reading, reviewing and simple updates. Design details belong to Step 03.
