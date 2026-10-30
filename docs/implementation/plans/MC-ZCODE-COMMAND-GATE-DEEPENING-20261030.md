# MC-ZCODE-COMMAND-GATE-DEEPENING-20261030

Status: **PLAN_READY_FOR_HANDOFF** (proposal; no source edited). Owner of this plan: actual ZCode (architecture-review session). Implementing owner: to be assigned via writer handoff — the core service files are not owned by the review-matrix rework writer, but the implementation session is active; handoff required before editing. Companion artifacts: `GLOSSARY.md` (new, defines **Command gate**), architecture review report (OS temp, 2026-10-30), Phase A audit `docs/testing/zcode-system-multitenancy-review-20261029-r2/`.

## 1. Goal and non-goals

**Goal:** one deep **Command gate** module in `apps/backend/internal/core/service` owning: membership resolution inside the command transaction, default-deny policy application, Hidden/role denial mapping, the single deny-audit rule, receipt replay (one seam, byte-stable), receipt-scope re-authorization (one rule), CAS check, and the event-seq fence. Every Matter-scoped service composes it; no gate logic remains in use-case files.

**Non-goals:** no schema/migration change; no port interface change; no stored receipt/audit byte-format change; no frontend work; no policy/product decisions (organization entity etc. remain with their recorded owners); `features/review/**` service behavior unchanged (review service is composition evidence, not a migration target).

## 2. Settled decisions (owner-confirmed 2026-10-30)

1. Shape: unexported `commandGate` in-package (`gate.go`); services compose it; downstream services reach it via `WorkService` as today.
2. Deny-audit durability: audit-write failure = storage failure (500), aborts the tx — never swallowed.
3. Deny-audit coverage: refusals audited uniformly (subject to Open decision D1 for bulk-row codes).
4. Receipts: 4 stored payload kinds + schema byte-for-byte; ONE replay seam; replay byte-stable; scope re-authorization per represented matter (BE01-F01) is that seam's first step.
5. Migration scope: `MatterService.CreateRequirement`, all 8 DataOps inline authorization blocks, `WorkService.CreateAction`'s private replay, the 3 receipt-scope copies. `WorkspaceService` keeps its transaction flows but adopts the shared deny + receipt-scope rules.
6. Tests: existing memory + PG contract suites are the surface; 3 red-green reproducers added first (§5).
7. Red-green discipline: the three shipped divergences are reproduced as failing tests BEFORE unification.

## 3. Variant comparison (design-it-twice, two parallel designs)

| Criterion | A — held struct (`commandGate`, env carries in-tx rules) | B — higher-order functions (`bindGate` closures + generic `receiptCore[R]`) |
|---|---|---|
| Constructor churn | none for Evidence/Filing/Control/Review (`s.w.gate`); `app/product.go` unchanged | none beyond DataOps `keyAge` arg |
| Replay seam | `env.replay` per payload kind | generic `receiptCore[R]` absorbs all 7 replay blocks incl. workspace |
| Replay-vs-boundary ordering | inside `execute` (guard-first; changes Matter's pinned replay-ignores-boundary behavior) | explicit rule: **replay is boundary-exempt; guard runs before build only** (preserves pinned test; changes CreateAction) |
| Bulk path | per-row env calls in each row's tx; no batch entry (deletion test fails for a batch wrapper) | same resolution (`gateInTx` + `receiptCore` per row) |
| DataOps hand event/fence | absorbed (`env.emit`, `env.close()`) | absorbed (byte-identical event; fence structural) |
| Abstraction cost | struct + env methods (matches existing `workEnv` idiom) | closures + generics per receipted call (matches existing `createdReceipt` call shape) |
| Blast radius | M (~6 service files + test kit) | M (~10 files, net −100..−250 LOC + gate.go) |

**Recommendation: A's shape as the base, with B's two best ideas adopted** — (a) implement the gate's replay as one generic `receiptCore[R]`-style method so all matter-scoped replay blocks collapse through one seam; (b) adopt B's explicit ordering rule (D2 below). Both designs independently chose **per-row gate calls inside each row's transaction — no batch entry method** (a batch wrapper would have to absorb W6's result vocabulary and fail the deletion test).

## 4. Interface sketch (A-base, Go-ish)

```go
// internal/core/service/gate.go — unexported
type commandGate struct { store port.MatterStore; ids port.RecordIDGenerator; logger *slog.Logger; keyAge matter.KeyAgePolicy }

func (g *commandGate) execute(ctx, actorID, matterID, operation string,
    decide func(policy.Access) policy.Decision, body func(env *workEnv) error) error
func (g *commandGate) view(ctx, actorID, matterID string,
    decide func(policy.Access) policy.Decision, fn func(snap port.MatterSnapshot, header matter.MatterHeader) error) error

// In-tx seam (bulk rows, import groups): workEnv carries the rules.
func (env *workEnv) authorize(op string, decide func(policy.Access) policy.Decision) error
func (env *workEnv) deny(op, result string, err error) error            // THE one audit rule
func (env *workEnv) replay[R any](actor, key, hash, decode func(matter.Receipt) (R, error)) (R, bool, error)
func (env *workEnv) receiptVisible(actor, rcpt, readWs, readMatter) bool // BE01-F01, moved verbatim
func (env *workEnv) storeReceipt(rc matter.Receipt) error
func (env *workEnv) cas(item matter.WorkItem, expected int64) error
func (env *workEnv) close() error                                        // fence: CompleteMatter iff seq advanced
```

Inside the gate: id parsing; membership reads + `accessFrom`; decide + Hidden→`ErrNotFound`/else `ErrForbidden`; deny-audit; receipt lookup, kind guard (explicit, byte-for-byte — today implicit at `matter_service.go:130`), hash match, key-age; scope re-auth; byte-stable replay; boundary guard before build only (D2); fence. OUTSIDE: domain event authoring (`env.emit` payloads), capability casts, row orchestration/import registry, workspace transaction flows.

## 5. Red-green reproducer set (write first, watch them fail, then unify)

| Reproducer | Red against | Assertion |
|---|---|---|
| `TestGate_DenyAuditFailureIsStorageFailure` | `matter_service.go:335-337` (log-and-swallow) | with memory double `FailAt: "security_audit"`, a role-denied `CreateRequirement` returns a storage-class error (500), not `ErrForbidden`; nothing committed |
| `TestGate_ReceiptRefusalsAreAudited` | `evidence_service.go:74-83`, `work_service.go:379-389` (no audit row on key-reuse/expiry) | wrong-hash + aged-key replays via `CreateAction` and `SubmitEvidence` produce `IDEMPOTENCY_KEY_REUSE`/`IDEMPOTENCY_KEY_EXPIRED` audit rows; denial commits |
| `TestGate_ReceiptScopeSingleRule` | three copies: `matter_service.go:299-320` (reference), `workspace_service.go:385-409` (weaker), `workspace_service.go:805-826` (inline) | table over the four former sites: lost represented-matter membership → uniform `ErrNotFound` + audited `DENIED_HIDDEN`; all-active control → byte-stable replay |

Test surface already crossing the seam: `matter_service_test.go` (DenialMatrix, KeyReuse, KeyAgePolicy, RevocationBeatsCreateAndReplay, ConcurrentSameKeyOneEffect…), `matter_service_rework_test.go`, `dataops_service_w6_test.go`, `workspace_service_w1_test.go`, `review_service_test.go` + `review_isolation_test.go`, `brief_replay_test.go`; memory + PG contract kits. Known kit updates required: audit-count assertions (`contract.go:94-95, 313-314`) gain deltas for newly-audited refusals; the W6 assertion at `contract_w6.go:310` per D1; memory double gains the `FailAt` audit-fault hook (test double only, production stores untouched).

## 6. Open decisions for the architect (blocking sign-off, not the plan)

- **D1 — Bulk-row refusal audit scope.** Recommend: audit **access-class** row refusals only (hidden, role, key-reuse/expiry, hidden-replay); "validation"/"stale"/"unknown-item" row outcomes stay unaudited (a 5000-stale-row bulk must not mint 5000 audit rows).
- **D2 — Replay vs boundary guard ordering.** Today inconsistent: Matter replay ignores a pending boundary (pinned by `TestCreateRequirement_ReplayIgnoresPendingBoundary`); CreateAction replay is guard-first. Recommend: uniform **replay is boundary-exempt; the guard runs before `build` only** — preserves the pinned test, changes CreateAction's replay behavior under a pending boundary (needs sign-off).
- **D3 — keyAge on W2/W3 replay.** Recommend: add (uniform, audited). With today's default `KeyAgePolicy{}` wiring, production behavior is unchanged; a configured policy would newly refuse aged-key replays there.
- **D4 — Residual body-internal role refusals** (e.g. `evidence_service.go:601-603`, `:899`, `workspace_service.go:665-679`). Recommend: accept as a recorded follow-up (keep diff M); optional explicit `env.deny` calls later.

## 7. Blast radius and rollback

| File | Change |
|---|---|
| `internal/core/service/gate.go` | NEW (~300 lines): gate struct, execute/view, deny, replay, receiptVisible, cas, fence |
| `work_service.go` | execute/readSnapshot become delegations; matterDeny deleted; CreateAction replay → gate; ≈ −90/+50 |
| `matter_service.go` | CreateRequirement body shrinks; deny/authorizeReceiptScope/accessFrom moved; ≈ −130/+60 |
| `evidence_service.go` | createdReceipt → 5-line wrapper; ≈ −30/+10 |
| `dataops_service.go` | 8 auth blocks → gate; replay blocks → gate; hand event/fence absorbed; `logger any` → `*slog.Logger` (5 call sites); ≈ −150/+100 |
| `workspace_service.go` | deny/matterDeny/authorizeReceiptMatter/OwnReceipt check → gate rules; tx flows untouched; ≈ −60/+40 |
| `repotest/mattercontrol/*` | contract_gate.go NEW (~150) + FailAt hook + audit-count deltas |

Size class **M**; no port/domain/adapter/migration/API changes; `app/product.go` constructor signatures unchanged. **Rollback:** single revert; gate.go purely additive; only persistent side effect is extra audit rows (same schema, harmless).

## 8. Verification

1. Red: the three reproducers fail on pinned bytes. 2. Green: they pass after unification; full `go test ./... -race` with owned PG fixture (existing `make check` discipline; sqlc untouched). 3. Kit deltas reviewed (audit-count assertions). 4. D1/D2/D3 behavior deltas called out in the return with the pinned before/after bytes. 5. Drift check vs this plan's base before merge into the candidate.

Base for the change: dirty working tree @ `20feedbf…` as pinned by `docs/testing/zcode-system-multitenancy-review-20261029-r2/candidate-manifest.csv` (512 files, zero drift at seal); re-pin at implementation start.
