# MC-P0-CLAUDE-BACKEND-HANDOFF-INTEGRATION-20261029

You are actual Claude Code, continuing your existing MatterControl focused-workbench session. Receive the completed Codex backend handoff, inspect the candidate, fix confirmed integration/reliability defects within the scope below, and bring your owned local runtime onto the corrected source. Continue your focused-workbench implementation and visual-fidelity correction. Execute through a reviewable candidate with evidence or a specific blocker; do not return only a plan or ask to continue after each step.

This is a manual prompt, not proof of dispatch. The human pasting it assigns this continuation. Do not send messages to other chats or invoke external agents without separate authorization.

## 1. Ownership and preservation

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Expected branch: `codex/unified-project-flow`. HEAD observed when this prompt was prepared: `20feedbf06c859a9806055d609f5b132fe8bb086`; historical provenance, never a reset target. Verify current HEAD, dirty paths and manifests before editing. Preserve every existing change and actual Claude/ZCode/Antigravity/Codex authorship. Keep the module **`leonx.me/matter-control`**; never restore old imports to match historical evidence.

You retain ownership of `apps/frontend/**` and your local frontend/API lifecycle. This assignment additionally authorizes **narrow backend corrections directly arising from intake of the Codex candidate or a reproduced integration failure**. This is a task-scoped exception to the older frontend prompt's blanket prohibition on Go edits. Codex's backend execution has ended with the handoff; verify there is no newly assigned competing writer before conflicting writes. A resident process alone does not prove competing source edits.

Review the nine Codex paths and their affected callers/tests/config/docs. Fix a root cause in the owning shared code only when confirmed. Broader read-model/API additions, domain policy, schema redesign, provider changes and unrelated backend refactors are outside this exception; document an exact dependency request if needed and continue unaffected frontend work. Do not take over Codex's wider PostgreSQL/DevOps backlog.

No commit, push, merge, deploy, paid service, real R2 call, cloud provisioning, IdP-policy change, account provisioning, dependency upgrade, global-tool configuration or destructive action against retained data. Preserve Requirement versus Action, independent state axes, filing lifecycle, ACL/hidden-resource precedence, ETags/CAS and original receipt/idempotency identity. A timeout after a possible write is OUTCOME_UNKNOWN: no blind retry or replacement key.

## 2. Read the current inputs

Read root and relevant component AGENTS/rules, `/Users/nguyenvanlan/.codex/RTK.md`, current workflow/status, and:

1. `docs/testing/codex-backend-local-readiness-20261029-r1/return.md`
2. The same directory's `intake.md`, `runtime-handoff.md`, `final-source-manifest.json`, `source-delta.json`, `check-command.json`, `test-summary.json`, `runtime-results.json`, `cleanup.json` and `proposed-status-delta.md`.
3. `docs/implementation/tasks/MC-P0-CODEX-BACKEND-LOCAL-20261029.md`.
4. `docs/implementation/handoffs/MC-P0-CLAUDE-FOCUSED-WORKBENCH-IMPLEMENTATION-PROMPT.md` revision 2 and `MC-P0-CLAUDE-WORKBENCH-VISUAL-FIDELITY-ADDENDUM.md` in that directory. Both remain active except for the narrow backend correction allowance above and superseded statements that these PG/readiness fixes have not run.
5. Current `apps/backend/go.mod`, relevant composition/config/server/tests, `.env.example`, backend API/operations docs and the current frontend API consumer/auth/runtime rules.

Use Semble first for code exploration, Context7 for current library/framework/SDK documentation, and `rtk`/`rtk proxy` for shell commands. Do not install a missing tool or bypass a denied permission to make a check pass.

Create/resume `docs/implementation/tasks/MC-P0-CLAUDE-BACKEND-HANDOFF-INTEGRATION-20261029.md`: owner actual Claude Code, priority usable local P0, requirements BR-001..007 and affected REQ-MC-P0-01..20, bounded scope, inputs, dependencies, outputs, acceptance, tests and separate final reviewer. If the focused-workbench task named by the earlier prompt is absent, create it with factual status; absence of a task record is not proof its implementation never occurred. Avoid racing shared workboard edits: provide a proposed delta in your own evidence instead.

## 3. What Codex actually delivered

Treat these as reported results to reconcile with the pinned evidence and current bytes:

- 190/190 Claude hardening S6 hashes and both aggregate algorithms verified at intake; 101 rename-only files reproduce S0 hashes. Exact original textual lineage of eight behavioral edits remains unproven without old bytes. Do not recreate or rewrite history.
- Codex changed seven existing backend files and added two tests: `internal/app/product.go`, `internal/app/product_readiness_test.go`, `internal/adapter/inbound/productapi/server.go`, `internal/adapter/inbound/productapi/timeout_test.go`, `internal/config/product.go`, `internal/config/product_test.go`, `.env.example`, `docs/operations.md`, `docs/api.md` (paths relative to `apps/backend`).
- `/readyz` now pings the product pool through a 500ms bound and returns generic product 503 on DB failure/draining. `/healthz` stays process liveness. A discovered Echo-error-to-product-500 mapping was corrected.
- Positive `MC_TRANSFER_TIMEOUT`, default 60s, applies to upload, content download, import preview/commit, export and bulk commit. Ordinary routes retain 10s. Read/write socket bounds are finite and aligned. These are local engineering defaults, not production SLAs or measured capacity.
- Nonempty `K_SERVICE` with default/explicit filesystem backend is rejected; local filesystem mode remains supported. Shutdown drain/cancel was tested without changing its implementation.
- Original PG baseline: 574 pass / 5 skip / 0 fail. Final `make check` with a new isolated synthetic PostgreSQL fixture: **593 pass / 5 skip / 0 fail**; six packages without test files are separate. The five skips include real R2, opt-in perf/restore, a memory-only injection seam and an intentionally unset-env self-test. No entire PG contract suite was silently skipped.
- Owned API smoke passed healthy/DB-down/recovery/missing-token cases; product migration version 7. Two run-owned PG containers and their anonymous volumes were cleaned. The tested fixture API URL `http://127.0.0.1:57945` is **no longer live** and must never replace the retained frontend's API target.
- Existing API on 8081, PG `mc-p0-claude-pg` on 55440, local IdP on 8080 and frontend on 3000 were preserved. Those ports/PIDs are historical observations; re-inventory rather than killing by stale PID. Existing API binary inclusion of the fixes was not established.

At prompt preparation all 192 entries of the final backend source manifest still matched. Recheck now; classify later drift rather than reporting pinned PASS for changed bytes. Earlier tmpfs exhaustion and Docker dynamic-port recovery failures are retained in the packet; do not repeat their broken orchestration.

## 4. Intake, fix and test

1. Acknowledge the exact source baseline and record a short matrix: already correct / confirmed defect / verification only / blocked. Inspect implementation and affected callers, not only the return narrative. Do not redo the module rename, object adapter or already-correct fixes.
2. Review readiness error mapping, deadline selection and caller cancellation, config validation, socket deadlines, shutdown ordering and frontend API compatibility. Check object-store/error semantics only where integration touches them; no real bucket. If a defect is confirmed, record file/line, trigger and impact, add a meaningful regression that fails before the fix, then apply the minimum complete correction.
3. Separate your review of Codex-authored corrections from your own historical backend hardening. You cannot independently approve your own earlier changes. If you alter a Codex correction, your new bytes receive author verification and still require a different final reviewer. Do not call the combined result independently accepted.
4. If backend bytes change, run relevant tests and final backend `make check` once after corrections. PG contracts must use a **new labelled task-owned synthetic fixture**, fresh private random credentials, loopback binding, bounded CPU/memory/PIDs and adequate private storage. Prefer cached images. Tests create/drop schemas: prove DSN ownership before setting `MC_TEST_DATABASE_URL`. Never run them against the retained application/login DB. Do not use 384 MiB tmpfs or assume Docker dynamic published ports survive restart. Remove real-R2/AWS test credentials from the test environment without printing values.
5. If backend bytes remain unchanged, verify the final manifest and retain Codex's gate as historical evidence for those bytes; rerun focused integration checks needed for your runtime. Do not claim you executed Codex's PG run or repeat unrelated suites without a reason.

## 5. Update only your owned local runtime

Inventory exact listeners/process executables, run directories and resource ownership. Reuse your existing approved DB/object/OIDC configuration through its private configuration mechanism. Do not dump env, DSNs, keys, bearer tokens, session cookies or synthetic account passwords into logs/prompts/screenshots/Git. Do not read another owner's private credentials. If approved configuration cannot be recovered within your scope, record that precise blocker and finish all independent source/fixture work.

Build the actual current backend into your own private run directory. Record source manifest and binary hash, sanitized command, UTC and exit. Gracefully replace **only the API process you demonstrably own**, keep the existing application DB/object data and API address, and set/retain the new timeout configuration as appropriate. Do not run a general compose start, reset DBs, replace a retained runtime with an empty fixture, or stop the IdP/PG to test readiness. This handoff introduces no migration; if later source has pending migrations, inspect and report them rather than automatically migrating retained data under this assignment.

Verify the resulting API's `/healthz` 200, `/readyz` 200 and missing-bearer 401. Exercise DB-down/recovery only on the separate disposable fixture if needed. Verify graceful shutdown there; do not disrupt the user's retained session to manufacture proof.

The frontend API base need not change for these corrections. Rebuild/restart only the frontend you own if your changed source/config requires it, using its repository scripts and lifecycle rules. Ensure the served frontend build and API binary correspond to the source under test; a source PASS does not identify a resident process.

## 6. Complete the connected frontend fixes

Continue the existing focused-workbench task and its visual-fidelity addendum. Keep the approved option 3 reference and actual prototype at `http://localhost:4176/` as visual inputs when available; do not change the reference to make the product comparison pass. Preserve working action-entry dialogs/pickers/drafts/UNKNOWN infrastructure. No new design vote, product feature, fabricated people/counts/dates or prototype simulation backend.

Use actual REST mode and an ordinary authorized session. Check My Work selection → permitted action → confirmed readback → same context; blocked work → causal prerequisite → return; and eligible exact-version evidence flow. Fix reproduced consumer errors and visual/interaction defects within the existing contract. Preserve TB-12 fail-closed behavior, safe redirects, access-loss purge and UNKNOWN reconciliation. Do not provision users, grant verifier rights, copy cookies or bypass verification to pass a journey. If human login is needed, request human entry and continue checks that do not depend on it.

Run affected regression checks and the final frontend gates required by its rules and the active assignment. Build in a safe owned output/lifecycle sequence; do not corrupt an actively served `.next` during testing. Compare reference/product at the same viewport/theme/locale, including desktop, 390px and 320px, using permitted browser tooling. Capture only synthetic nonsecret evidence. If browser/login access is blocked, state the exact limit and complete all source/build work; do not infer rendered PASS or bypass the denied surface.

Near-25 MiB and bulk/workbook measurements are optional only when an existing safe synthetic fixture and bounded test path make them feasible; absence of those measurements stays open, not a reason to seed/delete retained data or declare ADR-004 B4 closed. Real R2, deployed RTT, Supabase keep-alive/role timeouts, instance caps, backups/restore, S5 API-reference/Postman/tester-app work remain outside this continuation.

## 7. One consolidated return

Use a new absent namespace such as `docs/testing/claude-backend-handoff-integration-20261029-r1/`; resume only if demonstrably yours. Preserve the Codex evidence unchanged. Deliver:

- `return.md`: actual identity/tool, intake/final HEAD, manifests/drift, exact changed files, confirmed defects/fixes, test commands/results/skips, review independence and remaining blockers.
- Source before/after manifest and delta with SHA-256/bytes, no circular self-hash; distinguish Codex's candidate from your changes and concurrent frontend work.
- `runtime-handoff.md`: actual URL, owned process/binary/build identity, sanitized DB/object configuration facts, observed health/readiness/auth results, session/runtime disposition and safe cleanup instructions. Keep secrets solely in private files.
- `visual-delta.md` and permitted screenshots if frontend changed; clearly separate SOURCE_VERIFIED, BROWSER_OBSERVED, NOT_RUN and BLOCKED.
- Task-local proposed status/backlog delta. Status `IN_REVIEW` or `IN_REVIEW_WITH_VERIFICATION_BLOCKERS`; no self-awarded independent PASS, MC-002 DONE, provider/production/cost/RPO/RTO certification.

Stop only for a concrete blocker on the dependent slice or a real business/protocol decision; continue unaffected work. End with the exact local URL, current runtime disposition, next item for Codex/non-author review, skipped checks and remaining risk. No commit/push/deploy or external-agent dispatch.
