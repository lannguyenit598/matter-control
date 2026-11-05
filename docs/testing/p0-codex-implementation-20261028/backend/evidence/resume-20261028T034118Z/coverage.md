# Frozen-byte evidence audit — backend resume

Task: MC-P0-CODEX-BE-PATCH-20261028. Actual Local Codex `/root`; author-side continuation, not independent review. Requirements: BQ-01 (P1), BQ-04 (P2), FR-016/018, RULE-014/017, AC-132/133. No product changes are needed. Scope reaches the existing service helper/caller, shared contract tests, HTTP error mapping/tests and two API documents: exactly the seven delivered paths. No fixture, config, export, schema or generated-SQL change is needed.

The frozen `green-frozen-command.json` records `-race -count=1`, three packages and exit 0, UTC 03:29:57–03:30:01 on 2026-10-28. The log contains 98 PASS nodes (including parent nodes), no FAIL/race warning, and three successful package results. This resume inspected that evidence and current bytes; it did not rerun product tests. All six prior command metadata files use a task-specific GOCACHE, offline dependency flags, unset three DSNs and contain no HOME/home/CODEX_HOME assignment. No corrected-environment product run is justified.

| Required behavior | Frozen source and passing log evidence |
|---|---|
| Cross-Matter, source, row, content and operation mismatch; revocation; replay without duplicate work events | `contract_w6.go:131`, `receipt_intent_binds_bulk_rows_and_import_scope_source_and_row/{bulk,import}`; real persisted item count and event checks |
| No saved item/revision/content-hash leak after revocation, no destination mutation | `data_server_test.go:243`, `TestDataCommit_SavedReceiptScopeIsHiddenOverHTTP/{bulk,import}`; response fields and export readback |
| Nil/empty/sentinel and delimiter distinction | `contract_w6.go:281`, `bulk_intent_distinguishes_absent_fields_and_delimiter_collisions`; persisted title and event checks |
| Import delimiter collision and legacy receipt/registry rejection without duplicate mutation/audit | `contract_w6.go:229`, `import_content_distinguishes_delimiter_boundaries_and_legacy_hashes_fail_closed`; unchanged World.Counts includes receipts/events/audits |
| Storage lookup error retains classification and no writes | `contract_w6.go:318`, `import_parser_storage_errors_propagate_without_becoming_empty_success_or_validation` |
| Invalid CSV/XLSX/format/empty/headers/5,001 rows/>8 MiB | `contract_w6.go:336`, `whole_sheet_failures_refuse_preview_and_commit_without_writes`; preview and commit error plus unchanged counts |
| Safe HTTP400 and problem media type, no upload content leak or destination writes | `data_server_test.go:214`, `TestImport_WholeSheetFailureIsBadRequest`; both preview and commit |
| UNKNOWN recovery, rollback and concurrent dedupe | Existing complete `TestSuiteW6_MemoryStore` entries in the same frozen log; these remain memory evidence only |

Line references above identify the delivered isolated backend tree, not Claude's changing source. Exact file hashes and all 819 baseline pins are verified by `integrity.json`; all 230 backend files match baseline plus exactly seven frozen changes, with no extra files. The integrity verifier's first attempt had a wrong expected metadata-file count (7 instead of 6). Its script and failure are retained; the corrected audit exited 0. It did not run or change product code.

Next reviewer action: use [the independent-review prompt](../../../prompts/03-CODEX-INDEPENDENT-REVIEW.md) relative to this file's directory, verify `delivery/manifest.json` and the seven before/after pins, inspect the exact backend patch and these retained red/green logs, and return a nonauthor findings/disposition report. No review return currently exists under the packet's `review/`. This continuation neither dispatches another session nor approves itself. Integration must then reconcile current Claude bytes once; do not replace the live backend directory.

Compatibility: old fingerprints remain unchanged and fail closed (`key-reuse` / `content-conflict`). Recover through authorized original-key receipt/readback/reconciliation; never blindly retry an uncertain mutation using a fresh key.

Skipped: product test reruns, PostgreSQL, full make check, integrated/live HTTP and deployment. Risk: legacy recovery and concurrent integration remain unresolved until their separate gates pass.
