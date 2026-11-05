# Codex isolated implementation alongside Claude — 2026-10-28

User authorized Codex to implement useful assigned work while Claude continues the long takeover session. Actual Local Codex internal workers implement **isolated copies**, not live product files. Claude remains the sole live product writer; no external Claude/OpenCode/ZCode invocation is claimed.

Baseline manifest: `baseline-manifest.json`, 819 selected public files/8,755,137 bytes captured with zero post-copy drift. Immutable baseline `/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/baseline`; copies `backend/` and `frontend/` beside it. No private env/key/runtime data copied. Existing frontend dependencies are reused read-only via a symlink; no install/hooks/provider changes assigned.

| Task | Owner | Scope / requirements | Product edit boundary | Output boundary |
|---|---|---|---|---|
| MC-P0-CODEX-BE-PATCH-20261028 | actual Local Codex `/root/p0_backend_patch_20261028` | BQ-01 saved receipt scope/intent + BQ-04 whole-import error propagation; RULE-014/017, AC-132 and scoped access negatives | Only isolated backend copy; dataops service + meaningful shared/API regressions | This directory `backend/return.md`, `backend/evidence/` |
| MC-P0-CODEX-FE-PATCH-20261028 | actual Local Codex `/root/p0_frontend_patch_20261028` | FE F02 exact preview/frozen intent/UNKNOWN retry; FR-012/013 and safe command UX | Only isolated frontend `features/data-transfer/**` plus its focused tests | `frontend/return.md`, `frontend/evidence/` |
| Integration/review | root Local Codex, later nonauthor review | Validate edit scope, baseline/diff hashes and focused evidence; export reviewable patches for current Claude reconciliation | No live product source mutation | `review/`, final packet/patch manifests |

Initial status: isolated implementation dispatched. Acceptance requires meaningful red→green regressions, exact touched-file/patch evidence, no source-boundary violations, nonauthor code review and a clear remaining-gates statement. Tests on isolated memory/HTTP/UI fixtures do not imply PostgreSQL/live Cloud/browser/full-product acceptance.

## Current closeout

The assigned isolated implementation is complete. Backend7-file patch and FE5-file R2 patch have genuine regression evidence; final FE43tests/scoped typecheck/lint/format pass. Independent nonauthor static verdict is `PASS_SOURCE_REVIEW_WITH_LIMITATIONS`, with full-product/F02/runtime gates still open. Read [HANDOFF.md](HANDOFF.md) for exact current delivery and remaining limits. **Use `delivery-r2/`, not historical `delivery/`.** Nothing has been applied to Claude-owned live source.

Not assigned to Codex patches: Brief temporal policy, Filing/package domain changes, IdP/runtime provisioning, full restore, shared global design restyling or canonical workboard/contract edits. Those remain with Claude's current assignment. This split avoids concurrent edits on the shared checkout; it does not waive these items.

No patch is auto-applied to live source. Claude must compare exact base bytes to current files, preserve its newer changes, integrate once, run affected/final gates, and report actual disposition. Never reset current files to our snapshot, apply a whole directory, auto-merge or commit. Preparing/exporting a patch is not product integration or acceptance.

Skipped at dispatch: live source edits, migrations/DB/Docker/provider/credentials/Git operations. Risk: live Claude edits may supersede or conflict with a patch; integration requires current-code reconciliation.
