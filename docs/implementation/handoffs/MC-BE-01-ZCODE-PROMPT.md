# MatterControl — ZCode BE-01 local implementation assignment

I approve and assign actual ZCode to implement ONLY MC-BE-01 locally according to the linked task and backend-fast-track design. This is a bounded local source/test authorization, not approval of full STEP03B, production architecture/auth, hosting/cost or deployment.

Governance checkout:
/Users/nguyenvanlan/.codex/worktrees/mattercontrol-step-03a-remediation/matter-control
Read docs/architecture/backend-fast-track.md, docs/implementation/tasks/MC-BE-01.md and docs/testing/backend-fast-track/preparation.json. The task defines exact scope/dependencies/acceptance/evidence; do not expand it to all P0.

Use the current configured ZCode model/provider; report actual identity/tool/version before work, no model/provider/account/login/settings change, paid retry/API job/credits/overage. Permission includes processing these synthetic governance inputs and the relevant accepted backend source/rules/tests needed for this task in the current session. Do not read credentials, unrelated repositories, legal matter data or any .env. Do not bypass official tool denial or invalid-signature checks.

Source base is /private/tmp/mattercontrol-step022-backend-c01 at 52b60a4617081c41b949f2242e1784238c170f75. This is a protected evidence checkout: READ ONLY. Record branch/base/head/cleanliness, read AGENTS and all applicable .claude/rules plus add-use-case/add-migration skills. Semble before source exploration, targeted fallback only on recorded unavailability. All shell commands rtk/rtk proxy. All backend content English.

After verifying the exact base, create a NEW isolated branch codex/mc-be-01 and NEW worktree /private/tmp/mattercontrol-backend-be01, only if both absent. Stop rather than reset/reuse unknown work. Preserve other agents' changes, native C01 and INT-A checkouts/fixtures and source main. Do not edit governance; return text and new evidence for Codex intake. No merge/push/deploy.

Implement the service-level vertical slice:
- Separate typed Requirement and MatterControl access facts; no User/Task alias.
- Approved membership/role policy inside the locked transaction.
- Primitive-field create/get commands and domain/port results.
- Unconditional Matter UoW, snapshot reads, separate product migration/query/sqlc job.
- One atomic Requirement+typed history+immutable idempotency result; no Kafka.
- Focused unit/shared/PostgreSQL tests and English docs.

Do not expose any product HTTP endpoint/binary or fake auth. Trusted ActorID and fingerprint in internal tests are not proof of authentication/wire idempotency. Do not adopt native retryAfter=1 as product protocol. Receipt/boundary policy values in fixtures are explicit test inputs only; no invented production defaults or purge job. Do not no-op a required unsupported temporal boundary.

Important known source conflict: legacy postgres/outbox.go:38-45 runs without a transaction when outbox is disabled, and persistence.md requires r.write for the legacy User repository. For MatterControl add the explicitly scoped unconditional-UoW rule/path coverage described in MC-BE-01; do not alter native User behavior, weaken depguard or globally disable that rule.

F-08 evidence-gap row unit and F-10 nested reads are later review items, NOT blockers for this slice. The blueprint recommends component rows and three later relation routes as PROPOSALS ONLY; do not add those routes, change the 32-operation catalogue, set business caps/UNIQUE rules, implement filings/Control Room, or accept size risk here.

Run meaningful failing tests before implementation, then required make check/race JSON on actual new source. Follow task BE01-T01..10; use fresh owned disposable PostgreSQL, separate private native/product DSNs and per-test schemas; verify empty targets before use, digest/labels/caps/loopback port. Never touch old DBs/volumes or leak secrets; no automatic pruning.

If a real blocker appears, return exact evidence and minimal decision needed. Do not stop for routine in-scope naming/constructor choices, stale READY/WAITING labels, missing future IdP/Cloudflare/F-08/F-10 decisions or repeated permission for this same approved local slice. Technical decisions outside scope remain proposals for PO; external review permissions do not become release approval.

Return actual identity, source/base/head/commit, changed paths, acceptance PASS/FAIL/NOT_RUN, failing-before/passing-after tests, exact commands/UTC/exits/artifact hashes, skip inventory, fixture disposition and risks; propose IN_REVIEW. Your own implementation is not independently approved. Do not close MC-002/MC-003A, claim product auth/security/$0/recovery, change original CT/51 INT-A rows or start any next slice without authorization.
