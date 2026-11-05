# Readable identity UX — local implementation return

Actual Local Codex, author implementation and runtime verification. Proposed status IN_REVIEW_WITH_VERIFICATION_BLOCKERS; no independent acceptance or release claim. Branch `codex/unified-project-flow`, HEAD `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`.

Delivery: `source-manifest.json` SHA-256 `e939581e27e90121f2f78a6b4f2d214f00b8eee612339f014557155669463f70`, 724 selected files; `source-delta.json` identifies 34 changed/added entries relative to the previous local-admin presentation candidate. Manifest includes preserved historical `.orig` files; symlink aliases are not new independent source. No stage/commit/push.

## Result

- Workspace name replaces UUID in the Matter breadcrumb. Member lists display names; membership forms select people by name, retaining internal user IDs only as option values.
- New Matter-owner candidate read returns active workspace members. Existing Matter members are excluded from the invitation picker. Empty/failed reads have explicit states; no fallback ID textbox.
- PO-approved local directory: `MC_LOCAL_PEOPLE_DIRECTORY=true` only in the retained local API process. Default false. OWNER-only, same provisioned issuer, at most 20 names, case-insensitive literal search; no ZITADEL admin call, raw subject/email disclosure or implicit provisioning. The query rechecks ownership and excludes current workspace members. Production organization boundary is not established.
- Bulk edit selects work items by title and sets the read revision automatically. Owner field uses member names. Data page follows work-item pagination to populate choices. Existing CAS and preview/recovery semantics remain intact.
- Missing IdP display claims now yield “My account”, preserving subject solely for identity mapping.

## Verification

Command/UTC/cwd/exit receipts accompany each log in this directory.

- `postgres-directory.log`: real PostgreSQL race test PASS, including same-issuer restriction, OWNER restriction, name search and 20-result limit; no integration skip. Isolated new database recorded in `test-resource.json`, retained. No existing database was used as the test target.
- `backend-tests.log`: product API, core service, config and app race suites PASS. API tests cover unauthenticated, hidden outsider, non-owner, owner, revoked workspace membership and default-disabled directory behavior.
- `frontend-check.log`: typecheck, lint, formatting, 48 test files / 483 tests and agent configuration check PASS. Membership recovery tests exercise named selections while retaining exactly one mutation after UNKNOWN. Existing bulk action/repository recovery tests now use named item choices.
- `frontend-build.log`: Webpack production build and compiled-CSS artifact guard PASS. `backend-build.log`: PASS.
- `http-preflight.json`: updated health/readiness, login and signed-out session endpoints 200; emitted CSS 41,414 bytes, no raw `@apply` or `@theme`. HTTP preflight is not browser rendering or authenticated acceptance.

Initial PostgreSQL test correctly failed on UUID/text comparison; corrected query regenerated with pinned sqlc v1.31.1, then tested green. Failed attempt/pins are retained in sibling `local-readable-ux-r1/`. Initial backend race execution there hit sandbox cache permissions; rerun used approved access. During implementation an early frontend run saw caller fixtures before their updates; a later run had an unrelated upload-test timeout. Final complete check passed unchanged assertions; no timeout/assertion weakening.

## Local runtime

`http://localhost:3000/login` → sign in again, then choose a workspace. Local API remains `127.0.0.1:8081`. Exact process records in `runtime.json`; listener PIDs after start were API 84253 / frontend 84254. Prior owned listener identity/start/cwd were checked before SIGTERM. Same database and object root retained; no schema migration, seed reset or existing volume/database deletion. Frontend restart clears in-memory sessions, so reauthentication is expected.

The two test databases from initial/final attempts are retained and recorded in their respective `test-resource.json` files. No pruning/deletion or unrelated process control occurred. Runtime helper is retained at `/private/tmp/mc-readable-ux-20261028.py`; only approved private DSN/key paths are read in memory, never dumped or hashed.

## Remaining

Independent source review and authenticated/rendered/keyboard/screen-reader acceptance NOT_RUN for this delta; browser control was unavailable in this task. Existing browser/IdP/golden-workflow/CR-002/release gates are unchanged. Stable URL IDs remain internal routing keys; no slug migration was introduced. Historical event provenance may still expose technical identifiers in audit detail, outside ordinary navigation/member selection. Product directory shows provisioned local users only; creating an IdP account does not automatically provision a product user. Duplicate display names may require an additional approved disambiguation field for production.

Next: human sign-in and verify the member picker with synthetic A/B; independent review of the 34-entry delta. Skipped production directory/IdP administration, full backend regression/restore/Storybook reruns and release closure. Main remaining risk is unobserved authenticated browser behavior; source and HTTP success do not close it.
