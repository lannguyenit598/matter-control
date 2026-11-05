# MatterControl — implement missing Eigenwelt-inspired features

Latest UI ownership amendment,2026-10-29: actual Local Codex now owns the current visual-fidelity correction. Do not execute its UI stage or edit overlapping frontend files concurrently. Consume the completed correction and obtain an actual file/task handoff before continuing this feature assignment; preparation of this prompt does not prove dispatch. Nonconflicting analysis/contracts may continue.

You are actual Claude Code, continuing the same MatterControl session. The PO asks whether the features in `docs/research/eigenwelt-20261029/mattercontrol-integration-assessment.md` exist, and requests implementation of the missing recommendations. Deliver real, persisted, permission-checked features in a coherent sequence; do not merely repeat the research or produce placeholder screens.

## 1. Resume and boundaries

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. Expected branch: `codex/unified-project-flow`; verify actual HEAD and dirty work. Preserve all existing authorship/changes. Backend module is `leonx.me/matter-control`; no stale imports or source rollback.

**Finish the currently assigned visual-fidelity correction first.** The approved visual target remains `http://localhost:4176/`, with source under `design-prototypes/focused-workbench/` and the existing selected-design/revision-2/visual-fidelity handoffs. Do not replace that design or clutter its first screen with links/cards/forms for every new feature. Use contextual navigation, explicit buttons and progressive disclosure.

Codex has a separately prepared backend-intake/local-readiness assignment. Check actual dispatch and ownership before touching backend. This feature handoff does not authorize a second writer on its files. Frontend-only existing-contract work can proceed immediately. For new Go/API/SQL changes, record exact ownership/file dependencies in a task-local handoff and obtain a real ownership receipt via the human/Codex coordination. While waiting, continue independent UI/tests/contracts; do not write competing `server.go`, config, services or generated sqlc. Do not infer backend handoff from elapsed time. Once backend ownership is actually handed over for named feature paths, complete the full feature instead of stopping at a wireframe.

Use AGENTS, RTK, Semble and current Context7/local framework docs as required. Read current contracts/state/permission rules and applicable component instructions. Use installed UI design skills; avoid speculative dependencies. No branch reset/stash/clean, commit/push, deployment, billing, real legal data or external-provider calls under this assignment.

## 2. Read and reconcile

- `docs/research/eigenwelt-20261029/implementation-status-20261029.md` (source inventory; recheck for concurrent changes).
- Integration assessment, ecosystem report and LegalWork feature inventory referenced by `docs/research/eigenwelt-20261029/README.md`.
- Current product PRD, capability priorities, permission matrix, state semantics, Golden Workflows, API contract and workboard.
- Existing feature implementations: My Work, work grid, proof/checklist, documents/versions, milestones/parties, context, Brief/import/export.

Separate four facts: source exists, meaningful tests pass, authenticated runtime works, independent acceptance. Implemented foundation is not completed recommendation. Existing userapi templates or a research document are not product features.

Create/resume a task-local `docs/implementation/tasks/MC-EIGENWELT-FEATURES-CONTINUATION.md` and evidence namespace. Track all assessment rows as reuse/extend/new/deferred/decision-required with exact source and acceptance. P1/P2 identifiers stay unchanged; new implementation work does not certify a P0 release or promote AI to P0.

## 3. Delivery sequence — complete one usable feature at a time

### A. Existing P0 experience, evidence and agenda

1. Complete selected workbench fidelity and actual connected navigation. Reuse URL queue/selection and current permitted commands; no simulated state mutations.
2. Build a contextual **evidence/version drawer** from the actual proof/checklist/document APIs. Show applicable criterion, exact version, author/submission, verifier disposition, currentness and as-of as available. Keep a stable deep link and preserve work selection. Fetch only on authorized server paths; no unbounded per-row fanout.
3. Keep required-proofs, offered evidence and verification distinct. Current-document promotion, withdrawal, access loss and dispute must invalidate or update displayed derived results; preserve historical versions and decisions. Do not invent quote/page anchors when the stored contract lacks them.
4. Add a **read-only agenda** over permitted actual due dates/milestones, with timezone, source link and filters. Reuse work/planning read models; expose scope/pagination/as-of honestly. No legal deadline calculation, reminder delivery, ICS subscription or automatic schedule as part of this view.
5. Extend deterministic synthetic Golden Workflow regression coverage for daily work, due diligence and filing. Reuse existing memory/PG contracts; add the connected user-visible journeys, negative permissions/currentness and UNKNOWN recovery. Do not build a model-judge product just to run QA.

### B. Manual source-linked document review matrix

Build the smallest useful **manual** review feature: chosen immutable document versions as rows, versioned review questions as columns, saved human answers with source references, and explicit pending/reviewed/absent/error/stale distinctions appropriate to actual operation. A manual absence answer is a person's recorded conclusion, not algorithmically established nonexistence.

Before persistence, specify and test the new contract: input set, question revision, answer author, exact document/version, optional user-entered page/quote reference, review history, ACL and stale rules. Never invent OCR/model errors for a manual feature. Referenced pages/quotes are user-provided until validated, clearly labelled; escape content and treat PDFs/URLs as untrusted.

Changes to source/question create a new revision and stale the affected results. Past rows/results remain attributable. Support bounded filtering and accessible cell detail; use existing export conventions if adding export. Completing a review cell **must not** verify a Requirement, complete an Action or change a Filing. Existing independent proof assessment remains the sole approved authority for verification.

### C. Versioned reusable playbooks

Implement local, reviewed checklist/playbook reuse with explicit input/preview/instantiate flow after the contract and allowed roles are resolved. Reuse Requirement/Action/dependency validation and command gates; no generic autonomous workflow engine.

Keep reusable instructions/templates separate from actual Matter facts. Define immutable published revision, author/approval history, bounded entries, stable template references and preview impact. Map responsible people explicitly to eligible current Matter members; never copy source Matter memberships, evidence, verification, completion claims or secrets. Reject cycles/invalid references before writes.

Instantiation requires a deliberate permitted command with idempotency and readback/reconciliation. Define transactional behavior explicitly without silently changing existing bulk partial-success semantics. Template edits must not rewrite previously instantiated Matters. No automatic instantiation or claim that the template's presence proves readiness.

### D. Human-reviewed intake and scoped knowledge

These are new data-sharing surfaces. Write a short concrete contract and use existing roles **only where the permission matrix actually grants the operation**. If workspace-wide intake access or firm-wide sharing is undefined, present that single material policy decision with recommendation and continue other features; do not invent rights from a UI label.

- **Manual intake first:** original request, explicit attachments, requester context, received-at, proposed destination and triage. No email/API connector needed for the first useful local slice. Human conversion links to an authorized existing Matter or performs a separate approved create command; request state is not a draft Matter state. Confirmation must be idempotent and not create duplicates after UNKNOWN. Attachments must not inherit broader sharing silently.
- **Scoped knowledge first:** reusable guidance in a clearly defined authorized scope, explicit draft/publish and source links. Do not place confidential Matter content in a workspace/firm library without an approved sharing policy and deliberate confirmation. No AI retrieval or global full-drive indexing needed for a useful first slice.
- **Saved views/snapshots:** named validated filters distinct from copied data; validate ACL at each load. Immutable report snapshots need real authorized source/as-of, creator and revocation/retention behavior. If retaining confidential historical data after access loss is undefined, implement validated saved filters first and gate only persistent copied snapshots on that policy.

No new global navigation wall: integrate these through their appropriate context and one clear action. Keep EN/VI, keyboard, narrow layouts and access-loss purge consistent with the selected workbench.

## 4. External and P2 candidates — honest dependencies

Retain a row for every remaining assessment recommendation, but do not fake its implementation:

- **Storage connector:** filesystem/R2 object storage is not a connector. One read-only selected-import connector may be implemented only after the source/provider, credentials access, ACL mapping and external-call scope are supplied/approved. No arbitrary-URL fetch, whole-drive indexing or implicit save-back. Use synthetic tests for path escape, SSRF, tombstones, versions and scope. An unconfigured adapter alone is not a working connector.
- **LegalMemory / grounded search / MCP:** API design must intersect external identity/document permission with Matter permission and explicit source-to-Matter context. License/deployment review remains required; do not copy AGPL code or deploy an appliance. No provider = BLOCKED_DEPENDENCY, not mock success. Start read-only when authorized; no agent command mutation.
- **AI extraction/assistant/contradiction (P2-04/05/06):** require named approved provider/model, data destination/retention/cost and synthetic evaluation set. No credentials/provider selection inferred from developer-agent logins. Outputs remain candidate artifacts pending humans; extraction completion never implies legal verification.
- **Redlines/Office add-in:** document versions are a foundation, not a tracked-change editor/add-in. Define exact Office/editor dependency, file fidelity, security and license first. Keep existing versioned upload/download path; no fake accept/reject changes or browser HTML pretending to be DOCX tracked changes.
- **Reminders/scheduled work:** agenda is not delivery. Notification channel, recipient access, schedule/timezone, retry/dedupe, opt-in and reliability need a contract. No email/message sending or cloud scheduler without explicit authorization. No automatic legal state transitions.
- **Voice, remote workers, fusion:** remain deliberately deferred as the assessment recommends; do not implement unrelated product expansion.

Make missing decisions concrete and bounded in a single `decisions-needed.md` with alternatives/recommendation/affected feature. Do not stop all safe implementation to request every future decision at once. Do not claim every assessment row complete if external or material-policy dependencies remain.

## 5. Engineering and evidence

- Existing Next.js BFF/feature repositories → Go ports/services/policy → PostgreSQL/object storage remain the architecture. Domain-free shared components stay under components; legal business compositions under features. No wholesale LegalWork source/runtime import.
- For each authorized new feature implement schema/migrations, policy, service, repository/API, Zod FE schema, actual UI, failure/empty/loading/stale/permission behavior and tests. No isolated frontend localStorage as authoritative multiuser persistence.
- New tables/records must be scoped explicitly; indexes/cursors/query bounds and revoked-access tests are required. Use new compatible migrations; never rewrite applied historical migrations. Do not edit generated sqlc directly.
- Keep receipts/CAS, hidden-resource precedence and UNKNOWN reconciliation. Reuse current centralized authorization/command patterns; never authorize by having an ID or a citation.
- Work only with synthetic fixtures/new owned DBs. Never run destructive tests on current login databases, print secrets, bypass IdP or stop unowned runtime. Backend tasks must respect the actual concurrent owner's file/lifecycle boundaries.
- For behavioral changes add meaningful red→green tests. Run affected suites and required `pnpm check`, product build/CSS guard, relevant Storybook/product e2e. Backend author runs `make check` with real synthetic PG; report skips, including real bucket/provider absence.
- Browser evidence must compare against4176 at the same viewport/theme/locale, inspect actual connected actions and keyboard at desktop/390/320px, and distinguish fixture from authenticated product. If tools/login unavailable, state the exact blocker without bypassing permissions. Test/build PASS is not rendered acceptance.
- Add exact commands, UTC, exit/version, source manifest/delta and safe screenshots to a new task-owned evidence directory. Do not rewrite earlier packets or mark author work independently accepted.

## 6. Final return and continuation

Continue the coherent local sequence rather than ending after planning/design intake or seeking permission between routine UI steps. At a material policy/provider/ownership boundary, stop only that dependent feature and finish the independent authorized work.

Return a **feature-by-feature result**: existing/reused, implemented+tested, source-only, browser-observed, blocked with exact decision/dependency, or intentionally deferred. Include routes/API/migrations, tests, permissions, actual local URL and runtime ownership, design conformance and remaining independent QA. Separate additions to product scope from release acceptance.

No stage/commit/push/merge/deploy/paid resources or external messages. Do not self-close P0/MC-002 or infer legal/security/compliance acceptance. End with skipped work, risks and the next exact action.
