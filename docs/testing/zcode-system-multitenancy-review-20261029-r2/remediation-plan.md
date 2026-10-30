# Remediation plan — MC-ZCODE-SYSTEM-MULTITENANCY-REVIEW-20261029-R2 (proposal only; no source edited)

Order: decision-required policy first, then shared-root hardening, then ops. No P0/P1 blockers to the current approved P0 scope were found; all items are P3.

| # | Item | Files / owner | Smallest correction | Verification needed |
|---|---|---|---|---|
| 1 | SYR-F01 organization boundary decision | PO + solution architect (no code yet) | Decide: "one deployment/issuer per customer firm" (documented tenancy stance) vs add `organizations` entity with workspace.org_id + lifecycle. Record as an ADR; do not retrofit silently. | Tenant-model tests when the decision lands; multi-firm isolation review of the chosen design |
| 2 | SYR-F04 people-directory deployment guardrail | `apps/backend/internal/config/product.go` (config owner) | Refuse `MC_LOCAL_PEOPLE_DIRECTORY=true` when the process is not local (mirror the `K_SERVICE` guard used for `MC_OBJECT_BACKEND=fs`), or bind it to an explicit dev-only profile | config unit test; deployment checklist line |
| 3 | SYR-F02 review storage defense-in-depth | NEW migration (migration owner; never edit 0008) | `review_question_revisions` FK → (matter/grid-scoped question) composite; `review_answers.supersedes_id` cell-scoped partial unique + FK tightening; CHECK that `question_revision` exists for the question. Purely additive. | PG contract test asserting each constraint; re-run review PG suite |
| 4 | SYR-F03 retention executor | PO decision (TB-06) → backend ops owner | Approve a retention value for receipts/audit; bounded purge job + index on `purge_after` | purge job test; growth-bound test |
| 5 | Rendered verification journeys (RMV closure) | runtime owner + human-assisted login | Run the corrected binary with a fresh disposable DB; second-user revocation, lost-response replay, >100-row traversal | Browser evidence with source/build/DB identity; then nonauthor review can close RMV-F02/F04/F03-rendered |
| 6 | Unused/dead frontend items (from the UI audit, cross-ref) | frontend writer (after handoff) | See `zcode-ui-ux-consistency-audit-20261029-r1/normalization-plan.md` + the intake qualifications in the combined prompt (per-finding dispositions, not blanket normalization) | per-plan |

## Ownership / conflict notes
- `apps/frontend/src/features/review/**` and `upload-attempt.test.tsx` are owned by the active rework/implementation session — do not edit alongside it (recent mtimes 23:0x on 2026-10-29).
- Solid Glass Phase C must not touch backend/SQL/auth; items 2–4 above belong to backend/config owners, item 5 to the runtime owner.
- This plan is input for handoffs; no fix was applied by this audit and no external agent was messaged.
