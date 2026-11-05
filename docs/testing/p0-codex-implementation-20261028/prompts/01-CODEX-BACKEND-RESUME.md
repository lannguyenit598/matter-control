# Session 1 — Codex backend: finalize existing isolated patch

I assign actual Codex continuation MC-P0-CODEX-BE-PATCH-20261028. Resume existing code/evidence, do not implement from scratch. Claude remains the only live product writer. You are not alone: another session owns isolated FE, an independent session owns review. Do not overwrite their work.

Project root: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control
Packet: docs/testing/p0-codex-implementation-20261028/
Reference branch/head: codex/unified-project-flow / a62d838791ba188838c4ff00b7b6e265ac775056. Uncommitted exact bytes are pinned by baseline-manifest.json and delivery/manifest.json; HEAD alone is not source identity.
Read applicable AGENTS/component rules, /Users/nguyenvanlan/.codex/RTK.md. Prefix shell commands with rtk. Semble-first for exploration; Context7 resolve/query for library/API/CLI documentation when needed. Preserve existing changes; no install/provider/login/account/model change, secret access, production/paid service, Git stage/commit/reset/stash/clean/merge/push, database/resource actions or permission bypass. Never repurpose HOME/home/CODEX_HOME; use task-specific cache/temp variables. No environment dumps.
Record actual agent/tool identity, exact cwd/source hashes, commands/UTC/exits, output paths and tests run/not run. Never claim DONE/acceptance/production readiness from an isolated patch. Preserve author vs independent-review evidence.

## Exact ownership

Writable product copy ONLY:
/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/backend/apps/backend
Immutable baseline:
/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/baseline
Durable before/after snapshots: delivery/backend/{before,after}/apps/backend/ under the packet. Verify these if /tmp was removed; reconstruct a new isolated copy from baseline manifest/preserved sources only, never modify the live checkout or pretend partial delivered files form a complete build tree.
Owned outputs: backend/return.md and new backend/evidence/* attempts in the packet. Do not overwrite old logs. Do not edit live apps/backend, workboard, contract, frontend, schema, generated SQL or runtime.

## Current checkpoint

Read backend/return.md, evidence/changed-files.json and all final command metadata. Implementation is already frozen on seven paths: api.http, docs/api.md, productapi/{data_server_test.go,problems.go}, repotest/mattercontrol/contract_w6.go, service/{dataops_service.go,matter_service.go}.

Completed scope: BQ-01 saved-scope authorization/full row intent for bulk/import; BQ-04 propagate malformed whole-import errors to safe HTTP400; canonical fingerprints for supported fields, null/empty/delimiter distinctions, legacy fail-closed behavior. Existing saved-scope helper extracted mechanically. Do not expand into Brief/Filing/schema/BQ05 verification-claim work.

Owner evidence: genuine RED baseline tests plus final targeted race GREEN on three packages (98 reported PASS nodes, not98 acceptance cases). PostgreSQL/full make-check remain NOT_RUN. Source cannot be considered independently reviewed yet; reviewer was interrupted by quota.

## Finish now

1. Verify all7 before/after pins against manifest and isolated copy. Check final command metadata for forbidden HOME override; current report says task-specific GOCACHE and unset DSNs. If needed, preserve old evidence and add corrected-environment attempt without HOME overrides; do not rerun otherwise merely to inflate evidence.
2. Ensure final frozen-byte relevant tests/logs include cross-Matter revocation/source/row/op mismatch, no saved outcome leak, no duplicate mutation/audit, malformed CSV/XLSX/headers/limits/storage error, nil/empty/delimiter and legacy receipt/registry handling. Run only missing/failing checks justified by current bytes, with cached dependencies/no network and private GOCACHE; no DB or provider.
3. Preserve legacy records/receipts/registry hashes. New fingerprint conflicts are intentional; safe recovery is authorized receipt/readback/reconciliation, never blindly issue fresh-key mutations. Document this compatibility limit prominently.
4. Finish metadata/integrity/return if interrupted. Do not change code just because reviewer output is missing. If reviewer has an actionable finding, fix only your isolated ownership, add meaningful red→green regression and export a NEW revision/manifest; never silently modify the already-exported delivery patch.
5. Report frozen code hashes, actual tests and exact next reviewer action. If code unchanged, explicitly say delivery/backend/changes.patch remains valid.

Stop after the concrete bounded return. Do not apply patch to live source or self-approve. Remaining PG/integrated/full-product gates must stay explicit.
