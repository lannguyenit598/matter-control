# MC-BE-01 — Requirement service transaction spine

Status: WAITING_APPROVAL for local source implementation; design/handoff prepared. Owner: actual ZCode. Priority: P0 enabling slice. Design coordinator: Codex. Reviewer: a human-designated reviewer distinct from the implementation author (OpenCode if an authorized path is available). No external implementation dispatch yet.

## Authority and dependencies

Current user request is to accelerate backend design for ZCode implementation. This task makes that next action concrete; it does not certify overall architecture, product auth, full STEP03B or production release. A direct human assignment explicitly approving this BE-01 local slice activates only this task, without repeating the same permission question. Current artifacts remain WAITING_APPROVAL until actual activation/return is recorded.

Inputs:
- docs/architecture/backend-fast-track.md (proposed bounded design).
- Accepted backend 52b60a4617081c41b949f2242e1784238c170f75 at /private/tmp/mattercontrol-step022-backend-c01, clean at preparation; inspect AGENTS and applicable rules/skills before edits.
- Existing approved SRS FR-001/008/018/020, business rules/state semantics/permission matrix.
- Candidate ADR-002/data-model/API conventions and current scoped read-set docs/design/step-03a/handoff/step-03a-8a/zcode-return-r1/candidate-read-set.json.
- docs/testing/backend-fast-track/preparation.json for preparation/source hashes.

This contributes to AC-101/108/118/121/134/135/136/139/147/149/153/156/159/160; it does not claim complete execution of those broad product criteria. F-08/F-10, IdP/provider, product wire/retry/receipt numeric policy and release gates remain outside BE-01.

## Exact local scope

Implement core/domain/access policy, unconditional Matter transaction/snapshot ports, typed Requirement create/get service, PostgreSQL product schema/queries/migration bundle, typed history and immutable receipt outcomes, unit/shared/PostgreSQL contract tests. No HTTP endpoint, auth-provider implementation, product binary, cloud or real legal data in this slice.

New isolated branch codex/mc-be-01 from accepted52b60a4; proposed fresh path /private/tmp/mattercontrol-backend-be01. Recheck absence/branch inventory; never overwrite/reset/reuse unknown work. Preserve native C01/INT-A/source main and governance worktrees. Future PR base remains main per source instructions; do not merge/cherry-pick/push automatically.

Owned backend paths:
- internal/core/domain/matter/**
- internal/core/policy/**
- internal/core/port/matter.go and necessary additive outcomes in errors.go
- internal/core/service/matter_service*.go
- internal/adapter/outbound/postgres/matter_*.go
- internal/adapter/outbound/postgres/{migrations_mattercontrol,queries_mattercontrol,mcsqlc}/**
- internal/adapter/outbound/repotest/mattercontrol/**
- Minimal explicit-DSN pgtest helper extension/tests, preserving native helper behavior.
- Minimal record-ID adapter addition under internal/adapter/outbound/system, without UserID aliases.
- sqlc.yaml second job; generated files only through existing pinned sqlc tool.
- Scoped .claude/rules/persistence.md exception/path coverage for unconditional Matter UoW; the legacy r.write/outbox rule remains intact. This resolves the known rule/pattern conflict, not weakens dependencies.
- Corresponding English backend architecture/testing docs; new docs/mattercontrol-backend.md if useful.

No go.mod/go.sum upgrades, module rename, native User/C01 behavior change, global lint relaxation, schema rewrite, generic repository framework, event bus or unrelated refactor. If a truly required file lies outside these bounds, report the exact minimal addition and reason; routine choices within scope need no extra approval.

## Tests and evidence

BE01-T01 typed Requirement separate from Action/User; valid initial states.
BE01-T02 current workspace+Matter membership and role matrix/default deny.
BE01-T03 atomic node+Requirement+event+receipt and rollback on each injected failure.
BE01-T04 duplicate key/hash sequential/concurrent/restart replay, one immutable outcome.
BE01-T05 mismatched fingerprint/cross-Matter same actor+key, no duplicate effect or unauthorized replay.
BE01-T06 revocation versus create/replay under documented lock order.
BE01-T07 read snapshot isolation and uniform inaccessible/nonexistent/kind-mismatch outcome.
BE01-T08 unavailable/unexpected failures stay distinct, no fake ready/empty result.
BE01-T09 per-test schema/native-product test isolation and migration/codegen parity.
BE01-T10 existing native make check/race behavior preserved; no false skip/PASS.

Observe meaningful new tests fail before implementation, then pass. Required final checks: rtk proxy make check and rtk proxy go test -race -count=1 -json ./... on the new source, with privately supplied, separately verified disposable native/product PostgreSQL targets. Native TEST_DATABASE_URL and product MC_TEST_DATABASE_URL must not target any existing fixture/production resource. Enumerate named tests/skips and no-test packages separately. Missing required PostgreSQL evidence blocks acceptance.

A new official-image fixture must be digest-pinned, uniquely labeled, loopback-only on a verified unused port, capped (512 MiB/1 CPU/128 pids initially), with fresh private credentials and verified empty database/user before assigning DSNs. No shell trace, DSN/env dump or credentials in evidence. Stop only owned processes; retain evidence/fixtures unless separately authorized to remove them. No pruning/volume deletion.

Outputs: source commit/diff, failing-before/passing-after evidence, raw stdout/stderr, command UTC/exits, fixture IDs/resource disposition, named skip inventory, hashes and boundary limitations. Proposed implementation status IN_REVIEW; another reviewer accepts. No self-awarded DONE, MC-002/MC-003A closure, CT/INT-A result promotion or release.

## Copyable activation meaning

When the human explicitly sends the complete MC-BE-01-ZCODE-PROMPT.md assignment, it approves BE-01 local implementation/tests within this exact scope as a bounded exception; it does not approve full STEP03B, infrastructure, production auth or deployment. No source implementation was performed by preparing these files.
