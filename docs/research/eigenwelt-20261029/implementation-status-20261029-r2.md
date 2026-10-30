# Eigenwelt recommendations — current implementation inventory R2

Date:2026-10-29 (Asia/Ho_Chi_Minh). Actual Local Codex. Read-only source/evidence inventory plus targeted frontend regression run. This supersedes the earlier inventory as a current-status statement only; the original report/evidence remains untouched. No product source changed by this audit.

## Conclusion

Not all recommendations are implemented. Four groups have implementations within bounded scope; four have partial/foundation support; seven integrations are not implemented; one group is intentionally deferred. These are feature-inventory categories, not a completion percentage or acceptance verdict. The original assessment includes later/P1/P2 proposals; they are not all mandatory P0 scope.

| Recommendation | Current status | Evidence and limits | Source |
|---|---|---|---|
| Focused workbench | IMPLEMENTED_CORE / UX_ACCEPTANCE_PENDING | My Work queues, current item, next step, scoped navigation and incremental compact UI exist. Rendered legal-team acceptance is incomplete. | `apps/frontend/src/features/work/components/my-actions-view.tsx` |
| Task context / instructions / attachments | PARTIAL | Outcome, criteria, documents and exact-version basis exist; no consolidated task-context/attachment workspace. | `apps/frontend/src/app/(app)/matters/[matterId]/work/[itemId]/page.tsx` |
| Source/evidence drawer | IMPLEMENTED_CRITERION_SCOPE | Criterion, exact version, provenance and verifier facts use authorized reads. Page/quote anchors are not a validated evidence contract. | `apps/frontend/src/features/proof/components/evidence-basis.tsx` |
| Explainable manual review matrix | IMPLEMENTED / REWORK_FINAL_VERIFICATION_PENDING | BE service, PG tables, API, FE matrix/history exist. F01..04 corrections match author checkpoints; independent final closure and browser recovery/revoked paths remain unverified here. Automated extraction is not implemented. | `apps/backend/internal/core/service/review_service.go` |
| Versioned firm playbooks/templates | NOT_IMPLEMENTED | No persisted playbook/version/preview-instantiation feature located; roadmap slice3 only. | `docs/superpowers/plans/2026-10-29-eigenwelt-features-roadmap.md` |
| Human-triaged intake | NOT_IMPLEMENTED | No legal intake entity, triage UI or lifecycle located; roadmap slice4 is a proposal/default, not implementation. | `docs/superpowers/plans/2026-10-29-eigenwelt-features-roadmap.md` |
| Document redlines/review editing | PARTIAL_FOUNDATION | Stored versions, manual review and promotion exist; no tracked-change/redline editor or document comparison integration. | `apps/frontend/src/features/proof/components/document-forms.tsx` |
| Calendar/deadline view | IMPLEMENTED_MATTER_READ_ONLY | Dedicated per-Matter agenda with source links and device zone. Only bounded pages; no cross-Matter My Agenda or external sync/reminder delivery. | `apps/frontend/src/app/(app)/matters/[matterId]/agenda/page.tsx` |
| Reusable saved dashboards/views/snapshots | PARTIAL_FOUNDATION | URL filters and Brief/export exist. No named persisted saved view or immutable dashboard snapshot feature located. | `apps/frontend/src/features/work/components/work-filters.tsx` |
| Firm wiki/knowledge retrieval | NOT_IMPLEMENTED | Context kinds remain DECISION/FINDING/RISK/ENTITY; no GUIDANCE/draft-publish/firm library or authorized retrieval feature located. | `apps/backend/internal/core/domain/matter/context.go` |
| External storage connections | NOT_IMPLEMENTED_CONNECTOR | Filesystem/R2 store MatterControl objects; no selected external Drive/DMS import connector or external ACL mapping. | `apps/backend/internal/adapter/outbound/objectstore/store.go` |
| Office add-in | NOT_IMPLEMENTED | No product Office channel located in authoritative frontend/backend module and route inventories. | `docs/superpowers/plans/2026-10-29-eigenwelt-features-roadmap.md` |
| Private evaluations | PARTIAL | Deterministic contract suites and feature tests exist. No completed new connected Golden Workflow browser suite or model-evaluation product service. | `apps/backend/internal/adapter/outbound/repotest/mattercontrol/contract_gw.go` |
| Scheduled reminders | NOT_IMPLEMENTED | Due dates and agenda are read models, not scheduler/notification delivery. No recipient/channel/retry feature located. | `apps/frontend/src/app/(app)/matters/[matterId]/agenda/page.tsx` |
| Read-only assistant/MCP/LegalMemory | NOT_IMPLEMENTED / DEPENDENCY_GATED | No user-facing bridge/knowledge-provider integration. Developer MCP tools are not this feature; AI extraction/assistant/contradiction remain P2. | `docs/research/eigenwelt-20261029/mattercontrol-integration-assessment.md` |
| Voice/remote workers/model fusion | INTENTIONALLY_DEFERRED | Explicitly deferred by the assessment; not missing P0 implementation. | `docs/research/eigenwelt-20261029/mattercontrol-integration-assessment.md` |

## Review-matrix correction status

The independent verifier return recorded RMV-F01..04 (missing expectation, UNKNOWN CAS intent, truncated history, known-denial detail retention). ZCode checkpoints step01..03 document corrections. Recomputed the latest checkpoint pin for each affected path, respecting later-stage supersession:24/24 match current bytes. This confirms the checkpoint is reflected in source, not that all findings are independently closed. Source reads confirm explicit expectation presence, original CAS fields, access-loss provider and bounded reachable history. The final-make-check.log was empty when inspected and no consolidated final rework return was found. Step04 repeat log cites eight159-test passes; those owner results were not rerun as backend acceptance by this inventory.

## Verification actually run

Focused installed Vitest over agenda logic/view, evidence basis and the review feature:9files/64tests pass, exit0; all pinned inputs unchanged during that run. Exact command/timestamps/results in `docs/testing/codex-eigenwelt-status-20261029-r2/`. No full build, PostgreSQL, browser/IdP, restore or new independent security acceptance was performed.

## Git and next work

HEAD remains20feedbf06c859a9806055d609f5b132fe8bb086. Sampled feature source (review module/service/migration0008, evidence-basis and agenda additions) is untracked in the working tree, so existing on disk is not committed/pushed delivery. Preserve ongoing writers and checkpoint evidence.

Recommended order: finish review-matrix correction return and nonauthor affected checks; complete connected Golden Workflow journeys and cross-Matter agenda; then implement the accepted next playbook slice. Intake, knowledge and saved-filter slices need their actual scope decisions/assignments, rather than treating roadmap defaults as PO approval. Connector/AI/MCP/Office/redline/reminder scope and provider decisions remain separate.

Skipped: source changes, external integration execution and full E2E/PG re-verification. Risk: a live dirty tree may move after this snapshot; located source and author evidence do not establish product acceptance.
