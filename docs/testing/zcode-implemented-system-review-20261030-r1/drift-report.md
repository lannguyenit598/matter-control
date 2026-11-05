# Drift report — MC-ZCODE-IMPLEMENTED-SYSTEM-REVIEW-20261030 (r1)

Reviewer: actual ZCode (review-only) · Date: 2026-10-30 · Base: branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` + dirty tree (uncommitted candidate).

## Scope of hashes

`sourcemanifest` = `source-manifest.csv` (1,096 entries, sha256+bytes) captured at review start from (a) workspace governance/design/docs (323 entries) and (b) the read-only review snapshot `/private/tmp/mc-implrev-20261030-r1/{backend,frontend}` (214 backend + 559 frontend entries).

## Workspace drift during review window: **0**

Re-hash of all 323 workspace-manifest entries at review close: 0 drift, 0 missing. The review did not modify the workspace; evidence files under `docs/testing/zcode-implemented-system-review-20261030-r1/` are new files only (not hashed entries).

## Snapshot drift vs manifest

- Backend: **214/214 manifest entries byte-identical (0 drift, 0 missing)**.
- Frontend: **559/559 manifest entries byte-identical (0 drift, 0 missing)**.
- Snapshot-only additions (deliberate review probe, not part of the candidate, never written to the workspace): 4 files, precisely
  1. `internal/adapter/outbound/postgres/mca01_probe_pg_test.go`
  2. `internal/adapter/inbound/productapi/mca01_fingerprint_probe_test.go`
  3. `internal/adapter/outbound/repotest/mattercontrol/mca01_probe.go`
  4. `internal/adapter/outbound/repotest/mattercontrol/mca01_probe_memory_test.go`

## Meaning for the findings

- The reviewed gate bytes are exactly the candidate bytes. Consequently the candidate hygiene FAILs are confirmed **on the reviewed bytes themselves**:
  - `apps/backend/internal/adapter/outbound/postgres/matter_test.go` remains gofmt-unformatted (line 5, `"net/netip"` import order) — both `gofmt -l` (workspace + snapshot) and `make check` failure log agree; hash still equals the manifest entry.
  - `internal/adapter/outbound/postgres/explain_access_paths_test.go:223` errorlint `%v` (not `%w`) stands as linted.
- Earlier review-session notes describing a "gofmt-fixed snapshot `matter_test.go`" are **superseded by this report**: no such fix was ever applied anywhere; the file was never modified. Drift report is the authoritative close-of-review state.
- Implication for legacy claims: any earlier return that could *not* have run indifferently over these exact bytes (e.g., a claim that `make check` passed) must be treated as stale relative to the reviewed bytes; see `findings.md` (hygiene drift).

## Cleanup state at close

PG fixture container `mc-implrev-pg-20261030-r1` and its secrets file were destroyed after final evidence anchoring (see `environment.txt`; container/volume/secrets removed post-race+EXPLAIN runs).
