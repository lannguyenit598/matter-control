# MatterControl — separate system, database, backend, frontend and multi-tenancy review

## Assignment

You are actual ZCode in a separate review session. Review the current MatterControl candidate from system architecture through database design, backend/API and frontend. Answer explicitly: **what tenant boundary the product actually implements, whether that isolation holds end to end, and whether the current design is suitable for multiple independent customer organizations.**

This is a review assignment, not the implementation assignment running in the other ZCode session. Deliver an evidence-backed verdict, concrete reproduced findings and a prioritized remediation plan. Do not fix shared source, add features, migrate retained databases, stage, commit, push or deploy.

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Expected branch: `codex/unified-project-flow`. Last observed HEAD: `20feedbf06c859a9806055d609f5b132fe8bb086`; verify rather than assuming. Significant source is dirty/untracked. HEAD alone does not identify the candidate.

This prompt is dispatched when the human gives it to this review session. Identify actual tool/model and declare authorship before reviewing. A separate session does not establish independence: list paths/subsystems you previously implemented or materially designed. Label those portions AUTHOR_REVIEW, while identifying nonauthor portions separately. Still perform the full technical audit; leave final independent acceptance pending wherever author overlap exists. Do not pretend to be OpenCode, Claude or an independent external reviewer.

## 1. Capture a reviewable candidate while implementation continues

Read root/component AGENTS and RTK. Use Semble first; consult current Context7/installed docs for framework-specific behavior. Read these inputs:

- `docs/research/eigenwelt-20261029/implementation-status-20261029-r2.md` and the original integration assessment: source inventory and proposed future scope, not evidence that all features are complete.
- `docs/implementation/handoffs/MC-P0-ZCODE-EIGENWELT-END-TO-END-PROMPT.md`: the other session's implementation scope; you do not execute its mutations.
- Current workflow/project status, PRD, permission matrix, state semantics, API contract, local execution contract and workboard. Follow current task pointers; note stale/conflicting prose without treating it as implementation proof.
- Backend `docs/mattercontrol-backend.md`, `docs/api.md`, operations/configuration, migrations/queries and composition root; frontend component/feature rules and current route/repository/session model.
- Latest Review Matrix author/rework/verifier returns, their pins and RMV-F01..04 dispositions. Read actual latest outputs; checkpoint notes may precede final logs.

### Review Matrix corrected-candidate intake — incorporated 2026-10-29

Consume these exact packets before reviewing the Review Matrix subsystem:

- Original independent findings: `docs/testing/codex-review-matrix-verification-20261029-r1/return.md` and its retained adversarial regressions.
- ZCode correction: `docs/testing/zcode-review-matrix-rework-20261029-r1/return.md`, `final-source-manifest.csv`, `contract-delta.md`, `runtime-handoff.md`, final gate logs and step01..04 evidence.
- Subsequent Codex intake: `docs/testing/codex-review-matrix-rework-intake-20261029-r1/return.md`, `inputs.json`, `results.json` and command receipts.

The final rework return is now present. It supersedes the older inventory's observation that final logs/return were missing or incomplete. Codex intake verified26/26 corrected source/test/docs pins against the shared tree, copied snapshot and closing bytes. It independently ran313 backend pass events across3 service/HTTP/memory packages and7frontend files/42tests, with no failed or skipped tests in that executed scope. These are historical bounded results to re-pin, not automatic acceptance of your later candidate; the intake did not run PostgreSQL or browser checks.

Use the corrected26-file manifest as the Review Matrix baseline, then capture and review any newer delta from the implementation session. Preserve the original pre-fix packet for reproducing why each correction is necessary; do not accidentally audit the pre-fix candidate as current or request the author to repeat already delivered corrections.

Required focused rereview within this same comprehensive audit:

1. **RMV-F01:** absent/null expected answer→428 only after the correct authorization/precondition gates; explicit empty is valid for an observed empty cell; wrong type→400, stale→412, refusal has no receipt effect. Independently confirm current inaccessible/nonexistent response semantics rather than copying inconsistent403/404 descriptions from prose.
2. **RMV-F02:** original key and complete payload/CAS facts remain unchanged after UNKNOWN, props refresh and remount. Scope changes cannot reinterpret a pending command or expose it in another grid/Matter/tenant. Explicit discard creates a new intent only where permitted.
3. **RMV-F03:** real PostgreSQL and memory history pagination expose every retained answer with a100-row cap, truthful `total:null`, continuation, stable `(answered_at,id)` ordering and reauthorization on each page. Test more than100 answers, insertion between pages, copied/forged foreign-scope cursors, oldest-answer reachability and no duplicate/missing older rows. Review consumer compatibility of the contract delta.
4. **RMV-F04:** definitive unauthenticated/forbidden/not-found clears the full protected grid/detail/history/citation surface and its scoped drafts/attempts. Other authorized scopes remain usable;412 and UNKNOWN retain safe recovery content. Check second-user revocation when authorized browser/runtime prerequisites are available.
5. **Timing regressions:** inspect the author's wait-until-enabled changes in review-list and upload-attempt tests, retain core assertions/timeouts and repeat the affected set under ordinary concurrent test load. Eight clean author repeats support the diagnosis but are not proof of universal reliability.

Do these checks before issuing Review Matrix isolation/finding-closure verdicts, then continue the rest of the system/database/BE/FE audit; this addendum does not reduce the audit to four regressions. Record each finding as corrected-source-confirmed, independently reverified, still open, or blocked, with exact proof/limits and authorship overlap.

Preserve qualifications: the author's literal `pnpm check` failed on two tool-owned Mimosa state files even though later source-format/test/agent checks passed separately; do not report the original command as green or edit tool state. The author's640-test full backend and707-test frontend/build results remain cited author evidence until your own corresponding checks execute. The fixture narrative's zero-port-occurrences claim contradicts its own port examples; treat that as a benign provenance erratum, not a credential leak or functional finding without evidence.

The author explicitly states the retained API was not updated to this corrected backend. Any browser/operator run needs actual runtime-owner handoff plus source/binary/migration identity. Do not restart retained processes or assume current endpoints implement the snapshot. Fresh disposable PG/source tests may proceed independently; unavailable browser/runtime work remains NOT_RUN with the exact unblock action.

Create a unique review output namespace such as `docs/testing/zcode-system-multitenancy-review-<actual-UTC-attempt>/`, checking absence first. All shared writes stay inside that new output directory. Do not alter the other writer's workboard, task files, source manifests or reports.

Pin a bounded public candidate: tracked and untracked product source, migrations/SQL, contracts, manifests/configuration needed for the review, excluding real `.env*`, keys, credentials, generated runtime output, private logs and user data. Record branch/HEAD plus each included path's byte count/SHA256. Do not read credential files to create the snapshot. A pinned `.env.example` is configuration documentation, not permission to use live secrets.

Copy the selected public source into a private isolated review directory, verify copied bytes against the manifest, and rehash shared inputs to detect drift during capture. Retry only affected unstable reads within a bounded attempt. If the candidate cannot be captured consistently, request a narrow writer checkpoint; continue review on coherent nonoverlapping snapshots and label the limits. Do not wait for the entire roadmap to finish, and do not mix bytes from different revisions into a single PASS.

Run tests/builds/adversarial probes only on the isolated candidate. Preserve reviewed source bytes. Add reviewer tests in a separately identified patch/copy; record every added verifier file. Inspect test targets and lifecycle hooks before executing them. Recheck shared candidate drift at close; findings remain tied to pinned bytes. Later implementation changes need a delta review rather than silently invalidating or promoting the original verdict.

## 2. Establish the actual tenancy model before judging it

Separate and map:

1. Authenticated identity `(issuer, sub)` and any ZITADEL Organization/Project claims.
2. Customer/company/organization, if such a persisted boundary exists.
3. Workspace membership and administrative role.
4. Explicit confidential Matter membership and Matter role.
5. Resource ownership/scope and derived artifacts.

Determine which of these is the tenant key in code, database and API. Do not assume an issuer, Workspace, ZITADEL organization, UI selector or UUID is the customer tenant. State whether one person may belong to multiple tenants and whether a customer can contain multiple workspaces. If the product only implements workspaces and Matters, say so and describe the missing organization boundary if one is needed for independent customer firms.

Approved permission baseline: active Workspace membership **AND** explicit Matter membership **AND** operation-specific role. A Workspace OWNER does not automatically read confidential Matters. Documents/evidence/history inherit Matter access; P0 does not promise a separate document ACL engine. Workspace ownership is not platform administration. Review new feature role rules against their actual approved contracts; unapproved implementation defaults are unresolved policy, not retroactive authorization.

Important known exception: PO authorized a bounded local/dev people directory that lets Workspace OWNER find provisioned users in the same issuer by name. Audit the actual flag, query, default and deployment boundary. Classify its behavior as authorized local scope versus production organization-discovery risk; do not call the approved local behavior a defect merely for matching its scope, and do not certify it as organization-isolated SaaS behavior.

## 3. System and deployment architecture

Trace browser → Next BFF/Server Actions → Go auth middleware → central service policy/transaction → PostgreSQL/object storage → returned UI/artifact.

Review:

- Identity verification: issuer/audience/introspection, token/session expiry, callback/return paths, state/PKCE, refresh/logout and fail-closed behavior. Treat ZITADEL project membership and application authorization as separate controls.
- Trust boundaries and authority: tenant selection is validated server-side, not accepted from query/body/header/browser storage. Check nested IDs, mass assignment, imports and direct API calls.
- Tenant context propagation through requests, services, transactions, async work, logs, exports, saved artifacts and any newly implemented feature. Inventory actual routes/features rather than only historical P0 paths.
- Shared process/shared schema isolation versus database/schema per tenant: report the implemented approach and concrete strengths/limits. Separate logical confidentiality from performance/noisy-neighbor isolation, lifecycle/backup isolation and regulatory residency.
- Configuration/compose/CI/runtime DB roles, migrations, secrets boundaries, TLS and accidental exposure. A source configuration is not proof of deployed permissions or production readiness.
- Error/unavailable recovery, cancellation/timeouts, capacity limits and unauthorized diagnostics/metrics. Do not report hypothetical generic advice as a confirmed vulnerability.

Produce a concise system/trust-boundary diagram tied to actual files. Capture design debt only where it explains a concrete correctness, isolation, operability or scaling problem.

## 4. Database design and tenant integrity

Inventory every business table from all current migrations and the actual query set, including new features the other session may have completed before the snapshot. For each table record: primary key, direct/inherited tenant scope, parent relationship, important foreign/unique/check constraints, sensitive fields, indexes, CRUD paths, and authorization anchor.

Trace full inheritance where a table has only `matter_id`, `grid_id`, `document_id` or another parent. Missing a literal `tenant_id` column is not automatically a bug if the enforced parent path is correct. Conversely, having a column is not proof that joins and writes enforce it.

Inspect:

- Cross-workspace/cross-Matter references, composite foreign keys, association tables, document versions, proof claims/assessments, filing packages, dependency edges, review questions/answers/history, events, receipts and all newly added feature tables.
- Whether scoped uniqueness is correct, including `(issuer, sub)`, memberships, names where applicable, command/idempotency keys and import identities. Global collisions must not reveal or affect another tenant's records or replay receipts across actors/scopes.
- SQL joins, list/count/search/aggregate queries, upserts, updates/deletes and history pagination. A point read being authorized does not prove an aggregate/export/join is scoped.
- Transaction ordering, TOCTOU/revocation, CAS, locks, isolation level, duplicate creation and replay after membership changes. Reproduce races where practical instead of asserting that a transaction alone makes them safe.
- PostgreSQL roles, migrator/runtime privileges, schema/search_path, SECURITY DEFINER or raw SQL, RLS and connection-pool tenant-context handling if present. Establish whether RLS is used; its absence alone is not a critical finding if application isolation is demonstrably correct. If session-scoped tenant settings exist, test pool reuse and transaction cleanup.
- Migration compatibility, generated sqlc consistency, indexes/query bounds, high-history behavior, deletion/retention, backup/restore and ability to restore/export one tenant without exposing another. Distinguish existing source/evidence from unexecuted operational claims.

Provide an ERD with real ownership edges and a table-scope matrix. Identify precisely which invariants the DB enforces versus those enforced only by services or operational convention.

## 5. Backend/API enforcement

Build an endpoint census: method/path, caller identity, tenant/Matter resolution, policy call, read/write transaction, result/artifact exposure and negative-test coverage. Include BFF endpoints, membership/people lookup, aggregate views, uploads/downloads, export/import, Brief/replay, reviews and every new feature present.

Verify the central readSnapshot/execute patterns and inspect any exception. Check reads as seriously as writes: metadata/title/filename/counts, evidence basis, history, downloaded bytes and transient URLs can leak without a mutation.

Check:

- Direct resource IDs and nested relation substitutions; the response must follow approved inaccessible/missing semantics without content or existence leakage.
- Workspace-role versus Matter-role confusion, VIEWER mutations, assigning/granting users from another workspace, last-owner rules and self-grant through body/import/template fields.
- Same actor in multiple workspaces, same subject at different issuers and same issuer spanning independent customer workspaces.
- Token/session validity versus current application membership; revocation must be rechecked at reads/commands/artifact retrieval, not only when the session was issued.
- Object storage keys, paths, guessed version/download URLs, symlink/path escape, uploaded content/size, public object access and URL expiry/revocation where applicable. Do not fetch external URLs or contact real buckets under this assignment.
- Receipts, cache keys, replay cursors and background jobs: no cross-scope reuse or retained unauthorized payload. UNKNOWN recovery keeps original command identity rather than creating a fresh write to discover the outcome.
- New review/playbook/intake/knowledge/saved-view/reminder surfaces if present: shared references cannot implicitly broaden sharing or alter legal verification/state.

## 6. Frontend and UX/design review

Review current Next route layouts, feature repositories, client/server boundaries, BFF proxying and actions. Hidden controls are affordances, never the authorization mechanism.

Inspect server rendering/cache and client drafts/session storage/query state across tenant/Matter switch, sign-out, expiry, revocation, browser Back/Forward and refreshed props. Check actual imported modules and framework behavior; do not declare a leak solely because a cache API exists.

Review selector labels, recognizable names, active scope/context, breadcrumbs, create/member flows, cross-Matter navigation, search/advanced filters and saved views, long Vietnamese content and document/review dialogs. Preserve the approved focused workbench direction; this audit should identify concrete user-task failures rather than propose another visual redesign.

Specifically test:

- A draft/selection/pending UNKNOWN attempt from Workspace A or Matter A must not silently appear or execute under B.
- Definitive access denial clears protected content and scoped drafts, with safe recovery navigation; assess current Review Matrix F02/F04 corrections on pinned bytes.
- Validation/CAS/UNKNOWN/unavailable messages explain the next safe action without encouraging duplicate creation or implying legal verification.
- Search/dropdowns show human labels and do not reveal unauthorized names/results/counts. The URL can retain opaque IDs internally; that is not itself a tenant defect.
- Keyboard/focus, accessible names/state, responsive layout and EN/VI copy for actual screens; icons remain understandable. Separate source assertions, automated accessibility checks, observed rendering and human comprehension.

Authenticated/browser checks require the permitted browser tool and an actual runtime/source/database ownership handoff. The implementation session may be changing the retained runtime; do not assume it matches the snapshot. Without that handoff, finish source/tests and mark browser findings NOT_RUN. Do not read cookies/tokens or borrow credentials, automate IdP administration, bypass tool permissions or stop the user's runtime.

## 7. Adversarial local test matrix

Use an isolated candidate and fresh, task-owned synthetic fixtures only. Keep retained DBs/volumes/runtimes untouched. Creating a bounded loopback PostgreSQL fixture for this review is in scope if your execution environment permits it: verify unique name/label/container ID, random credential with private files, CPU/memory/PID limits, empty DB and exact DSN target before testing. Preserve exact creation/check/cleanup evidence without secrets. If Docker is unavailable, run permitted memory/API tests and mark real-PG guarantees unverified; a skipped PG suite is not PASS.

At minimum construct:

- Workspace A and Workspace B; two confidential Matters within A, one within B.
- A-only OWNER/EDITOR/VIEWER, B-only equivalents; a person belonging to both with different roles; a Workspace OWNER without membership in one confidential Matter; revoked Workspace and revoked Matter members.
- Same issuer with users split across A/B; same sub under a different issuer where the identity model supports it; existing and nonexistent foreign IDs.
- Distinct recognizable content in documents/versions/evidence/reviews/events/receipts for each scope, so leakage can be asserted explicitly.

Exercise positive controls and these negative cases:

1. Guess/substitute foreign resource IDs through GET and command paths; include nested IDs and download bytes.
2. List/search/count/aggregate/export/import/Brief/agenda/history cannot return foreign metadata or derived results.
3. Workspace OWNER cannot read a confidential Matter without explicit membership; Matter VIEWER cannot mutate it.
4. Role and membership changes affect already-issued sessions and subsequent retrieval/replay/download requests; include revoke-versus-write/read races with clear timing expectations.
5. Same idempotency key across actor/workspace/Matter contexts cannot replay another scope's result or disclose its payload.
6. Forged/foreign pagination and history cursors do not bypass authorization or leak counts; history remains truthfully paginated.
7. Template/intake/review/knowledge references and assignee/people selections cannot import/grant foreign scope implicitly.
8. File keys/paths/URLs and proof/version relationships stay within the authorized parent.
9. Frontend tenant switch/access-loss/UNKNOWN attempts do not resurrect A's data or submit it under B.
10. Pool reuse and transaction rollback clear any tenant context if such DB context is actually used.

Reuse current contract fixtures and add focused verifier tests in the isolated review copy. Keep a replayable proposed-regressions patch separate from shared source. Do not install dependencies or run blanket scripts that may mutate retained resources. Run applicable Go race/contracts and frontend targeted checks/builds only after inspecting their environment assumptions. Report exact failures, skips and no-test packages, and distinguish your executed results from cited author receipts.

A failed security assertion should remain a failed regression with a minimal reproducer, not be rewritten to match the defective implementation. You may correct your own test harness and record both attempts.

## 8. Findings and final verdict

For each finding include severity/confidence, violated requirement, exact pinned path/line, affected tenant boundary, caller prerequisites, source→sink/dataflow, expected/observed behavior, minimal synthetic reproducer, real impact, existing mitigations, smallest fix and required regression. Separate confirmed exploit/reproduction, source-confirmed design gap, decision-required policy and unverified hypothesis. No secrets or realistic legal data in evidence.

Provide separate verdicts:

| Dimension | Required conclusion |
|---|---|
| Tenant model | What actually represents an independent customer and how it maps to Workspace/Matter/IdP |
| DB integrity | Enforced cross-scope constraints and remaining service-only/operational invariants |
| API logical isolation | Supported boundaries, tested endpoints, actual bypasses and coverage gaps |
| FE/session/artifact isolation | SSR/cache/draft/download behavior and observed versus unverified cases |
| Production SaaS suitability | Data isolation, organization lifecycle, operations and performance limits; source/local proof does not certify production |

Answer the headline in plain language using **SUPPORTED_WITH_LIMITS**, **NOT_SATISFIED**, or **INSUFFICIENT_EVIDENCE**, scoped to the actual tenancy model. Do not give a blanket YES based on workspace_id columns or generic RLS recommendations. If workspace-level logical multi-tenancy works but organization-level SaaS isolation/lifecycle is unspecified, state both facts separately. Feature completeness and security/production suitability are different verdicts.

Write these artifacts only in your unique output namespace:

- `return.md`: concise verdicts, top blockers, authorship/independence and next exact action.
- `system-review.md`: architecture, trust boundaries, BE/FE/design findings and diagrams.
- `database-review.md`: ERD, table-scope/constraints/index/transaction/role analysis.
- `tenant-isolation-matrix.json`: endpoints/resources/personas/test cases, expected/actual, evidence and NOT_RUN reasons.
- `findings.json`: actionable ranked findings and minimal fixes.
- `inputs-manifest.json`, command receipts/logs, proposed regression patch if added, and `outputs-manifest.json` excluding itself.
- `remediation-plan.md`: P0 blockers first, then P1/P2, exact file ownership/conflict dependencies and verification needed. Prepare handoffs; do not send another agent messages or apply fixes yourself.

Refresh pins at close, list drift outside your snapshot and give the delta rereview needed after the implementation session finishes. Retain failed attempts; independently verify output hashes. Clean up only your proven task-owned synthetic resources and temporary test servers; state anything retained.

Complete this audit across all layers before returning. A finding in one layer is not a reason to skip the others. No self-approval of authored fixes, security-hook bypass, production/paid/provider-policy change, data cleanup or release/MC-002/P0 closure. Finish with skipped checks and remaining risks.
