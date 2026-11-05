# MATTERCONTROL — ZCODE COMPLETE BACKEND + FRONTEND P0

## Assignment

I assign actual **ZCode** to task **MC-P0-ZCODE-EXECUTION**: implement and stabilize the **entire local P0 backend and product frontend**, then return one complete candidate for independent review. This is the Product Owner's latest requested execution model. W0 is already returned; **do not perform another planning-only pass or stop after W1**.

Read `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/p0-zcode-end-to-end-execution-plan.md` in full. It is the single execution plan. Verify the initial sources in `docs/testing/p0-zcode-w0-intake-20261027/inputs.json` and use `docs/implementation/p0-zcode-execution/workboard.json` as the one mutable progress/coverage board. The source-import manifest identifies working source; governance HEAD alone does not contain it. These are initial baseline pins: on resume verify your recorded checkpoint/diff and frozen contracts, rather than rejecting your own authorized source/package changes for differing from the initial import. Unexplained third-party drift still requires reconciliation.

Prepared root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`. Confirm actual state and preserve everyone else's files. Read root/component AGENTS and applicable rules/skills. Follow RTK, Semble-first and Context7 rules; use your currently configured model/provider and permitted subscription. No login/provider switch or paid fallback is assigned.

## What changed from W0

- You now own **implementation, both stacks, local integration, author testing, repairs and handover**. W0's read/hash-only prohibition is historical and does not limit this new assignment.
- W1–W7 are internal paired implementation checkpoints. Advance after applicable author checks pass; **do not wait for independent review between waves**. Consolidated independent review occurs after the full author candidate. Keep each checkpoint IMPLEMENTED_SELF_TESTED, never self-awarded DONE/ACCEPTED.
- Normal permitted local edits can use a frozen content-manifest base while accepted commits remain blocked. **This does not resolve or bypass Mimosa.** Do not stage/commit, rerun equivalent scans/commits, rewrite provisioning evidence, modify hooks/ledgers/rules to silence a finding, change tool/context/host to evade a refusal or claim an accepted Git base. If a security mechanism denies an actual edit/run, stop that action and report it; continue only unaffected permitted work. W0 D1(c) is not a valid resolution route.
- INT-A harness closure and production/Cloudflare/$0 feasibility are separate. Do not repair/replay the harness, touch existing runtime fixtures or use those unresolved tracks as blanket blockers for unrelated product work.
- Routine technical implementation choices within approved rules are yours to consolidate and test for final review. This does not grant independent architecture approval or authority to change product policy, privacy/identity trust, retention/deletion, production provider/cost or acceptance criteria.

## Local OIDC — ZITADEL selected by PO

PO first requested a self-hosted local OIDC proposal, then answered the local-provisioning approval question with **“dùng https://github.com/zitadel/zitadel”**. Use **ZITADEL self-hosted local**, within the same new-resource/synthetic-only boundary. Read `docs/implementation/p0-zcode-execution/local-identity-approval.json`; do not ask the provider-choice question again or switch provider. Production identity/hosting remains unselected, and provider execution/feasibility are not yet proven.

Prepare and run the isolated profile through normal permitted tools: review official Compose/OIDC docs, pin compatible ZITADEL API/Login/proxy/database versions/digests, create new synthetic organization/project/web/API applications and test users, bind every published port to loopback, verify resource fit and exact canonical issuer/callback/audience. Keep IdP storage separate from product/native test databases. Generate private master/bootstrap/session/DB/API credentials at execution into task-owned 0600 files, never copy sample credentials or export secrets. Do not change system hosts/DNS/proxy configuration or configure a remote ZITADEL Cloud account.

Use real Authorization Code + PKCE S256, state and nonce. Tokens stay server-side. ZITADEL supports opaque/JWT access tokens: the local profile uses documented authenticated introspection with a separate API credential, exact active/issuer/audience/expiry/subject checks and fail-closed outages. Freeze actual token format and MatterControl project/API audience in the shared contract. Never parse opaque tokens as JWTs, use ID tokens as API bearer tokens or request administrative audience as end-user authorization. Map exact issuer+subject; product roles/memberships/verifier designation remain in MatterControl, not IdP admin/org/project roles. No shared API token, anonymous REST, client actor, password-grant shortcut or mock-only login can close the requirement. No production selection or security PASS follows from local provisioning.

## Source and design contract

Use the returned W0 source-gap-map as inventory, not completion. Preserve all 20 canonical FR identities and original 3 Golden Workflows; cover AC-101..163/NFR-001..014. Backend Go/PostgreSQL/hexagonal/sqlc and frontend Next.js/Atomic/features remain unchanged.

Before client/server diverge, write `docs/implementation/p0-zcode-execution/local-contract.md` resolving the BG-01..08 implementation details, identity/session, strict DTO/fingerprint/error/replay/reconciliation, ETag/representation/CAS, exact F-08/F-10 classifier/cycle/read/fence/paging mapping and local object boundary. Bind both stacks and tests to the same revision. Record unapproved material choices as pending with concrete options; do not silently adopt a policy or label a proposal independently approved. Do not use weak ETags/no-store as a fake concurrency fix or synthesize missing provenance.

Design authority order: approved requirements/rules/permissions/states/GWs → D-UX01..04 and selected local-r3 → source review UIUX-01..11 → visual-polish reference → corrected R2 return when available. R2 is absent at preparation. Do not wait idly for it: implement within the already selected system, and integrate the verified return coherently when it arrives. Never import R1's remapped FR IDs, omitted bulk title, overwrite conflict action, flattened Filing stages or invented Atlas counts. If a material unresolved design question affects correctness, isolate that feature and surface one concrete question, continuing unaffected work.

Use Enterprise Precision, Comfortable/Compact, all five state dimensions with textual reasons, long English/Vietnamese labels, explicit empty/stale/unavailable/recovery, real keyboard/mobile design and selected Lucide family. Apply tasteskill app-screen, Hallmark app-scope and Impeccable Operate guidance where installed. Retain canonical Atlas and labelled separate scenarios; zero eligible Action is a valid state, undefined milestone set stays UNASSESSED. Do not replace product data/semantics with a generic Task/demo application. Source prototype behavior is a simulation, not code to copy into product as enforcement.

## Execute the whole backlog

Complete in this order, **backend + REST + frontend + tests together**:

1. **W1:** real identity/session, Workspace/Matter admin/access/revocation/last-owner, Requirement create/read, history and own-operation receipts; real FE login/navigation/create/detail/history and all error states.
2. **W2:** typed Requirements/Actions/workstreams/owners/due/parties, allowed transitions/waits, dependencies/cycles/reblocking, explicit milestones, five axes, Next/My Actions/Waiting On and actual editable/filterable/paged Grid.
3. **W3:** real local document bytes/versions/promotion/signature observations; version-specific criteria/proof/verification/expiry/dispute/reversal; designated independent verifier and complete FE evidence/document flows.
4. **W4:** complete Filing package/signature/submission/receipt/authority review/supplement/response/outcome/reopen, repeated cycles and exact versions; actual FE package/timeline/cycle navigation.
5. **W5:** consistent authorized Control Room snapshot, causal drill-down, evidence gaps, milestones, Important Decisions, basic Decision/Finding/Risk/entity context, history/changes and mobile triage.
6. **W6:** metadata bulk with title/description/internal owner/due and per-row atomic outcomes; typed CSV/XLSX preview/connected-group import/idempotency; authorized meaningful XLSX export; deterministic draft delta `(t1,t2]` versus outstanding t2 with provenance/reconciliation.
7. **W7:** full GW-01 transaction→post-closing, GW-02 Due Diligence→resolution, GW-03 filing with two supplement cycles and alternatives; security/concurrency/a11y/performance/recovery regressions; repair all implementation failures; package the final candidate.

For every FR, populate workboard source symbols, API operation, UI route/interaction, test cases, actual evidence and remaining gaps. Do not close a feature with only backend code, mock FE, screenshot, test name or placeholder toast. No fake backend aggregates, no server enforcement delegated to UI and no feature silently deferred from P0.

## Allowed paths and local execution

- Own the P0 increment under `apps/backend/`, `apps/frontend/`, new task-specific `ops/p0-local/` and `docs/implementation/p0-zcode-execution/`. Update affected component API/events/operations/docs/tests/config and lockfiles only as required; code/docs follow component English rules. Reuse existing architecture/primitives and justify genuine new dependencies. Do not disable lint/security rules to make checks green.
- Existing author returns, pinned design/contract evidence, W0 files, outside-root BE01 worktree/staged patch, MC-003A worktree, `tools/inta-harness`, security state and formal 51-row ledger remain untouched. Do not edit global settings/memory, AGENTS or historical manifests. No conflicting writer or automatic subagent dispatch.
- Create only fresh, uniquely named, loopback-bound synthetic resources after verifying ownership/ports. Use separate native test DB (`TEST_DATABASE_URL`) and product DB (`MC_TEST_DATABASE_URL`); native tests truncate/drop schemas. Never reuse existing DBs/volumes or run legacy migrations against product schema.
- Use a new private 0600 credential location, do not inspect old INT-A/private configs and do not print DSNs/tokens/passwords/env dumps. No real legal data. No broad prune/remove/down-with-volumes or signals to unowned processes. Preserve evidence, stop only task-owned resources and retain data/volumes with recorded disposition.
- No production deploy, cloud/paid-service activation, merge/push/commit/scan retry is assigned. Respect actual tool refusals without alternative-tool routing.

## Continuous author verification and repair

Read the component test rules. Observe new backend behavioral tests fail for the intended reason, implement, then run `make check` with both verified DB fixtures. Generate sqlc through existing tooling, never hand-edit generated packages. Retain race/JSON events and explicit actual skips/no-test-package census.

Run frontend `pnpm check`, `pnpm build`, behavior/component/security tests, affected stories/build-storybook and existing E2E fixtures as required. For dependency changes, retain compatibility/lockfile/audit/peer and measured bundle checks. Full product runs in REST mode; a demo/mocked repository never establishes persistence/auth.

Run actual integrated auth/isolation/revocation/version/proof/concurrency/unknown-write/readback and restart/recovery tests with independent actors and real synthetic storage. For uploads/imports/exports cover scoped access, formulas/macros/embedded links, duplicates, partial outcomes and idempotent recovery. Test all original workflow alternatives and history/delta consistency.

Current browser use in Work is disabled. Do not bypass it through Playwright CLI/another browser/server/OS capture merely to obtain a PASS. Implement browser-dependent features/tests and complete permitted nonbrowser work; run rendered/E2E/a11y only on an actually permitted target. Mark affected rows VERIFICATION_BLOCKED if none is available. AC-137 requires five actual representative managers under the approved protocol; no fabricated study. Missing production budgets/retention/hosting remain explicit acceptance items, not invented numeric commitments.

On a failure: fix the root cause, rerun affected checks and keep going. Maintain one workboard/checkpoint; resume after interruption without another W0 or duplicated fixture. External independent review is at the end, not an excuse to stop after a partial feature. Only a real security refusal, missing material authority, unavailable required input/environment or irreconcilable shared-source conflict blocks dependent actions; state exactly which ones and continue unrelated allowed work.

## Final return — one consolidated candidate

Return `docs/implementation/p0-zcode-execution/final-return.md` plus the updated workboard and bounded redacted evidence. Include actual identity/tool/model, base/working-source/diff hashes, all changed paths, 20-FR API/UI/test inventory, 63-AC results, all 3 GW checkpoint ledgers, 14-NFR evidence/limitations, commands/cwd/UTC/exits/skips, actual design revision/screenshots if captured, local run/stop/restore instructions and owned resource disposition.

Use **FULL_P0_BE_FE_IMPLEMENTED_SELF_TESTED_PENDING_REVIEW** only when both stacks are complete and applicable author tests actually pass. Use **IMPLEMENTED_WITH_VERIFICATION_BLOCKERS** if code is complete but mandatory execution is blocked; list exact affected rows. Missing code is **PARTIAL_IMPLEMENTATION/IN_PROGRESS**. Keep production/security/cost/recovery/design/architecture acceptance and independent review fields separate. No self-awarded DONE, no historical gate/ledger promotion, no claim of a normal accepted commit while Mimosa remains unresolved.

After your complete author return, Codex coordinates nonauthor review of the final delta and assigns any findings back for repair. Do not perform your own independent approval. End with skipped work, exact remaining blockers and risks.
