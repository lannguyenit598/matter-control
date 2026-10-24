# Step 01 Product Requirements Approval and Closure

Date: 2026-10-24 Asia/Ho_Chi_Minh. Approver: Human Product Owner. Recorder: Codex — BA/PM. Task: MC-001. Status: **APPROVED / DONE — documentation scope**. Approved requirements subject: `572835a21bda764901a11aaea3c06b88750b2883` on main. This approval closes Product Requirements Approval Gate; it does not start Step 02, authorize implementation or approve a release.

## Direct approval evidence

Source: explicit human answers in this chat to question items `call_65aa70020a8344bf96615bc0dc19a6ef/0` and `/1`.

Question 1 asked whether to approve all recommendation B choices (OBD-08 B/B) in the packet at 572835a for OBD-02..08/10/11, explicitly including independent verification, basic P0 legal context, AND/recursive dependencies, receipt versus approval, 48-hour due-soon, provenance-bearing draft reports, Matter-level document access and VIEWER export, controlled partial batches, ≥4/5 managers correct within 10 seconds, OWNER current-version selection and retained correction history. Its scope explicitly closed Step 01 only.

Exact human answer: **“Phê duyệt toàn bộ khuyến nghị nêu trên”**.

Question 2 asked whether to defer numeric workload, retention period and RPO/RTO to Step 02 feasibility, retaining their approval requirement before performance/cost commitments or release.

Exact human answer: **“Hoãn chốt các con số sang Step 02”**.

## Approved decisions

The complete recommendation text and stated limitations at 572835a remain the approved subject; this table is an index, not a replacement specification.

| Decision | Approved option | Consequence |
|---|---|---|
| OBD-02 | B | Designated independent verifier; explicit criteria/applicability, attributable reversal/expiry/dispute |
| OBD-03 | B | Basic typed legal context in P0; advanced domain engines retain P1/P2 scope |
| OBD-04 | B | Explicit edge gates, AND and recursive readiness; reopen re-blocks; no automatic waiver |
| OBD-05 | B | Filing stage observations and proof; receipt distinct from approval; repeated supplements/negative outcomes retained |
| OBD-06 | B | 48-hour due-soon and reasoned critical designation/escalation |
| OBD-07 | B | Deterministic authorized draft/export with provenance; issued/snapshot lifecycle stays P1 |
| OBD-08 | B/B | Active Workspace plus Matter membership; documents inherit Matter scope; VIEWER export; per-row bulk/per-connected-group import |
| OBD-10 | B | Full P0/three-workflow acceptance; formative UX protocol ≥4/5 managers correct within 10 seconds; measurements NOT_RUN |
| OBD-11 | B | Explicit OWNER current-version promotion; version-pinned proof and append-only corrections; numeric lifecycle/recovery inputs deferred |

OBD-01 remains resolved by its prior approval. OBD-09 technical feasibility remains UNVERIFIED; the human explicitly permits deferring numeric workload and OBD-11 retention/RPO/RTO to Step 02. This deferral is not a value, cost acceptance, recovery result, retention/legal-hold/erasure policy or waiver of release gates. Unspecified lifecycle authorities still require concrete decisions during downstream architecture/lifecycle work. Any future finer document ACL or change to the approved Matter boundary is a change request.

## Evidence and review applicability

Independent [REV-01](../reviews/step-01-review.md) round 2 PASS covers the authored behavior before approval; [returned reports](../reviews/step-01-opencode-result.md) retain exact reviewed manifests. [Validation](../testing/step-01-validation.md) records author checks. This closure changes approval/status/provenance text only; no approved behavior, FR/US/RULE/AC definition or trace mapping is changed. No new external review run is claimed. The historical review did not itself grant policy approval. Material future semantic changes require updated approval and appropriate independent re-review.

## Closure and next boundary

MC-001: WAITING_APPROVAL → DONE after explicit PO approval, prior independent PASS and documentation checks. Step 01: COMPLETED / PRODUCT_REQUIREMENTS_APPROVED. [Decision packet](../requirements/open-business-decisions.md), [dashboard](project-status.md), traceability, rule authority and [Claude handoff](../architecture/solution-architecture-handoff.md) reflect this decision.

Step 02: **READY_FOR_ASSIGNMENT / NOT_AUTHORIZED_TO_START / NOT_DISPATCHED**. Claude Code remains Solution Architect. Pin 572835a plus the local approval-record commit before any separately authorized Step 02 work. Workload/retention/recovery and feasibility require evidence there; no backend/database substitution, infrastructure cost, UI, product code or deployment is approved here. MC-000 governance review remains IN_REVIEW; this decision does not close unrelated tasks.
