# MC-P0-CODEX-PRIMARY-REMEDIATION — independent source review

## Verdict

`PASS_SOURCE_REVIEW_WITH_LIMITATIONS`

No open blocker introduced by the reviewed baseline-to-current remediation remains in the backend brief/import path, frontend transfer-recovery path, or local restore checker. This is an independent source-review verdict, not MC gate self-approval, release approval, production proof, or architecture approval.

Reviewer: Local Codex independent review subagent (non-author). Repository `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, Git HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`; the product source is an uncommitted imported tree, so the exact content identity is the pinned manifest and selected hashes in `inputs.json`, not Git HEAD alone. Baseline: immutable `/private/tmp/mc-p0-codex-takeover-20261028-qkwwennh`.

## Scope reviewed

- Backend: import `verification` retention and fingerprinting without authoritative promotion; SQL/read-model propagation; atomic import creation/dependency events; filing work snapshots; deterministic Brief reconstruction and proof/dependency evaluation at `t2`.
- Frontend: session-owned pending attempts, exact import-byte identity, authorization before recovery, cached terminal receipts until matching browser ACK, explicit same-key resend only for unresolved attempts, access-loss purge, and bulk/import callers.
- Restore: fresh-database targeting, exact pre-boundary readback comparison, object/database census, corrupted/truncated archive refusal, and fail-closed summary acceptance.
- Evidence receipts were read, not treated as independent production/runtime proof. Styling/history work outside these correctness/security paths was not reviewed in depth.

## Findings and corrections verified

1. **Closed — terminal receipts were initially discarded.** The first reviewed frontend version retained only the request and a `settled` flag, so recovery had to POST again after a completed response was lost before browser ACK. The corrected `Slot` retains normalized terminal rows; authorized recovery returns them without mutation; explicit recovery skips POST for cached rows; `beginAttempt` refuses settled/unacknowledged slots; only the matching matter/kind/key ACK releases the payload. The lost-browser-ACK and direct-begin regressions now cover this boundary.

2. **Closed — filing owner was absent from the initial replay snapshot.** `CreateFiling` persisted `OwnerID` but its hand-built `filing.created` event omitted owner. The corrected producer emits `itemSnapshot(item)` plus filing-specific fields. The shared W6 service test creates a filing with an owner and immediately reads Brief, covering producer and replay together.

3. **Closed — restore DSN replacement was unsafe for a valid URI without a query string.** This behavior existed in the baseline rather than being introduced by the remediation, but it contradicted the touched script's isolation claim. The corrected helper structurally parses a local PostgreSQL URI, replaces its path for both query/no-query forms, rejects target-overriding query parameters (including encoded names), and receives the base DSN over stdin rather than command argv/logs. The corrected fresh rehearsal passed.

## Correctness/security assessment

- Imported verification text is retained as `ImportedVerificationClaim`, participates in the content hash, and is never fed into authoritative verification. Proof state is rebuilt from criteria, evidence, claims, assessments, disputes, document versions, epochs, and dependencies at `t2`.
- Import dependency events are emitted in the same transaction after the corresponding creation event, so newly imported blocked state has replayable edges. Missing legacy decision inputs/edges fail with `brief-unreconstructable` instead of fabricating READY or VERIFIED.
- Recovery state is keyed by the live server-side session record. Reload inspection performs an authorized matter read and does not dispatch a mutation. UNKNOWN remains locked to the retained identity and explicit same-key resend. Definitive read-access loss purges payload/results and leaves a non-revivable refusal marker.
- Restore acceptance now requires exact source-boundary identities and facts, zero object hash failures, identical census/objects/restart readback, exclusion of the post-boundary marker, and nonzero refusal with zero tables left for corrupt/truncated archives.

## Validation

Reviewer-run, pure/local checks:

- `go test ./internal/core/service -run '^TestReplayBrief' -count=1` with a task-local Go cache: pass.
- shared-memory W6 subtest `brief: filing owner survives creation before later transitions`: pass.
- Vitest recovery set (`pending-attempts`, `data-transfer-attempt`, `recovery-gate`): 3 files, 22 tests passed.
- restore checker unit suite: 9 tests passed; `bash -n run.sh`: pass.

Author/owner receipts inspected read-only:

- Backend R3: sqlc, formatting, tidy, lint, and full `go test -race -count=1 -json ./...` all exit 0 after the owner/replay correction.
- Frontend R2: full check exit 0 with 43 files / 440 tests; Webpack production build exit 0. The retained Turbopack failures are environment/tooling port-binding failures, not a passing build claim.
- Corrected restore run `20261028T072524Z`: acceptance exit 0; 54 Matter identities and 3 objects read back, zero object failures, zero census/object diffs, post-boundary marker absent, and corrupt/truncated archives refused with zero public tables left.
- Final public-source manifest: 711 entries; recorded post-test drift list is empty.

## Limitations and residual risk

- **Historical filing owner compatibility:** old `filing.created` events that omitted owner cannot be safely backfilled or inferred. A Brief before the first later full `filing.work_changed` may therefore render the filing unassigned even if live state had an owner. Inventory affected histories and either disclose the compatibility limit or make that interval unreconstructable; do not invent an owner.
- Other legacy histories missing proof inputs or dependency edges intentionally fail closed with `brief-unreconstructable`. This avoids false legal-work state but is an availability/data-compatibility risk that needs pre-release inventory and an explicit reconciliation policy.
- Transfer recovery is intentionally local, process-only memory. Session expiry, sign-out, BFF restart, or multi-process routing is not durable recovery and does not prove rollback. The retained import slot is bounded per request but is not a production capacity/retention design.
- Restore evidence is synthetic and local. It does not establish production RPO/RTO, provider backup behavior, IdP recovery, deployment rollback, or a zero-cost claim.
- Not run by this reviewer: browser/E2E/visual/accessibility, provider/cloud/private-resource workflows, Docker restore execution, credential/key reads, production data, or Git mutation.

Proposed next status: source review may proceed, with the historical filing-owner and legacy-history compatibility limits carried as explicit release risks rather than silently inferred state.
