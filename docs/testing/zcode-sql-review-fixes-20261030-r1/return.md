# Return — SQL review fixes (F-02/F-06/F-07/F-08/F-09/F-10) — 2026-10-30

Actual ZCode session (combined assignment; model account:zai-start-plan/GLM-5.3-Flash). Branch `codex/unified-project-flow`, HEAD `20feedbf…` unchanged; nothing committed. Scope: the directly user-assigned fix plan for the SQL review findings; **A-01 untouched** (assigned to the backend implementation owner per direct instruction). All SQL used in tests/verification is parameterized; no string-concatenated SQL was introduced anywhere.

## Disposition per finding

| Finding | Disposition | Proof |
|---|---|---|
| F-07 CAS zero-rows inconsistency | **FIXED (code)**: `SaveFiling` zero-rows now `port.ErrVersionConflict` (was `ErrNotFound`) in both adapters — uniform with the other 13 CAS saves; observable delta is 404→412 on a path no test asserted (the service loads the filing in the same tx, so zero rows is a concurrent change). New contract regression `SuiteW4 "a zero-row filing save is a version conflict like every other CAS save"` runs on memory AND PostgreSQL | `contract_w4.go` subtest; backend full suite below |
| F-08 int32 cast discipline | **FIXED (code)**: `InsertAssessment` SubjectEpoch → `int32Checked` (nolint removed). The 3 remaining raw casts (`VersionNo`, review `Position`, `clampLimit`) keep written justifications and bounds — accepted, not silent | `evidence_store.go`; build + lint |
| F-02 missing user/workspace indexes | **VERIFIED + PROPOSED (not applied)**: new inert-by-default harness `explain_access_paths_test.go` (`MC_EXPLAIN_VERIFY=1`) captures `EXPLAIN (ANALYZE, BUFFERS)` for the 5 queries before/after the proposed indexes inside the disposable schema. Measured ×12 scale (4.8k memberships): `ListMattersOfActor` **25.4→6.3 ms (4×)**; others parity; at ×1 scale one small regression (tiny-table seq scan wins) — confirming the review's "not a current-gate problem" | `explain-verification.log` (summary), `explain-scale{1,12}-events.json` (raw events), `proposal-migration-0009.md` |
| F-09 SearchLocalWorkspacePeople | **NO CODE CHANGE (P0)** — per the review's own assessment; pg_trgm option fully specified (extension + GIN on `lower(display_name)` + strpos→ILIKE with `%`/`_` escaped in Go before binding + `make sqlc-generate`) as the default-OFF part of the 0009 proposal | `proposal-migration-0009.md` |
| F-06 dead audit columns | **DECISION NOTE (no code change)**: keep + document recommended until the audit-scope decision; populate (~12 call sites + HTTP capture) and drop-column options written out with costs | `proposal-migration-0009.md` §F-06 |
| F-10 | **NO ACTION** — accepted governance residual (as the review stated) | — |

## Gates (fresh receipts, final bytes)

- Backend full suite on the new labelled fixture `mc-zcode-sqlfix-pg-20261030-r1` (label `MC-ZCODE-SQL-REVIEW-FIXES`, 127.0.0.1:51985, postgres 18.6 cached image, 1 CPU/512MiB/128 PIDs, private 0700/0600 secrets; DSN ownership verified before use; container+volume+secrets removed after): `go test -race -count=1 ./...` → **642 passed / 0 failed / 20 packages** (`backend-full-test.log`). Count grew from 640 by the new W4 subtest (memory+PG runners). No skips observed in the summary; PG contracts ran.
- `go build ./...` and `go vet` clean; gofmt clean on touched files (no formatting changes needed — edits match house style).

## Migration 0009

**Prepared, NOT applied.** `proposal-migration-0009.md` carries the full Up/Down SQL for the review owner (Codex) + PO: recommended-minimum = `matter_memberships_user` (measured 4×); `matters_workspace` cheap/forward-looking; `workspace_memberships_user` marginal (optional). No query text changes → no sqlc regeneration needed for the indexes. The pg_trgm option stays default-OFF.

## What was skipped and risks

Skipped: applying any migration; retained-DB/runtime use; real R2/IdP; production sizing claims (the EXPLAIN fixture is 1-CPU constrained — absolute times are directional, plan-shape evidence is the deliverable). Risks: F-07's 404→412 delta is unobserved by current callers but external API consumers theoretically relying on 404 for a vanished filing row would see 412 (no such consumer exists in the product); index benefits beyond 5k memberships are extrapolated, not measured; the two parity indexes' future value is a judgment call recorded for the decision owner.
