# MC-P0 — Continue current primary candidate after Codex remediation

## Assignment

You are actual Claude Code continuing the MatterControl P0 W1–W7 implementation on the shared checkout:

`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`

Continue the current uncommitted source; do not restart W0/W1–W7, recreate past patches, reset, stash, clean, switch branches, stage, commit, merge, push, deploy, change Cloud/provider policy, or touch credentials. This is a source continuation, not an approval or release task.

Read before editing:

1. Root `AGENTS.md`, `/Users/nguyenvanlan/.codex/RTK.md`, and component instructions.
2. `docs/implementation/tasks/MC-P0-CODEX-PRIMARY-REMEDIATION-20261028.md`.
3. `docs/implementation/p0-zcode-execution/workboard.json`.
4. `docs/implementation/p0-zcode-execution/local-contract.md` revision 12.
5. `docs/design/p0-handoff-r9/return.md` and its manifest.
6. `docs/testing/p0-final-parallel-20261028/integration/source-manifest.json` and `source-delta.json`.

Current branch/committed base: `codex/unified-project-flow`, `a62d838791ba188838c4ff00b7b6e265ac775056`. HEAD does not identify candidate bytes because product source is uncommitted. Re-hash the current source manifest before consuming it; if it changes while you work, record exact drift and reconcile it rather than reverting another writer.

## Work already completed in this continuation

### Backend

- Brief replay now refuses an outstanding legacy Filing whose historical snapshot does not contain a numeric, positive integral `revision`. It no longer displays an invented `Revision: 0` after a later Filing transition.
- Added `TestReplayBrief_LegacyFilingRevisionUnavailable`; the intended failure was observed before the guard and the focused replay suite passed after it.
- The broader W1–W7 candidate already includes the inherited ZCode/Claude work: workspace/matter membership services, PostgreSQL schema/sqlc output, filing guard work including migration `0007_filing_signature_applicability.sql`, import/claim/recovery semantics, authenticated scope, W6 data operations and W7/restore preparation. Treat source and workboard as authoritative over this summary.

### Frontend

- Matter overview same-Matter links encode the route identifier.
- Fixed the recovery test so it waits for React transition completion before asserting reload/discard behavior; the product behavior and draft-removal assertion remain unchanged.
- Added explicit EN/VI interface translations for core app chrome, navigation, work axes, data-transfer results, forms and common error actions. This is **NFR-010 readiness**, not a claim that all legal/product content is bilingual.
- Added a display-only UTC / `Asia/Ho_Chi_Minh` preference. `LocalizedInstant` preserves the original RFC3339 `dateTime` and wire value; no legal timestamp, idempotency key, route ID, stable state ID, draft or user-provided content is transformed.
- Native select labels now accept localized React nodes while retaining explicit stable option `value`s.
- Added focused tests for locale/time-zone draft preservation, select stable values, OutcomeList recovery wording and GlobalError title rendering.
- Fixed `global-error.tsx`: native `<title>` receives a locale-derived primitive string rather than a React component child.

### Preserved boundaries

- No API wire or approved business-rule change was made by localization/time-zone display work. Contract remains revision 12.
- The ZITADEL runtime is a pre-fix compiled API plus isolated frontend snapshot. Do not call it proof for current source.
- Synthetic users A/B still have unverified invalid email addresses. Human/IdP admin must mark their existing email verified or create replacement verified accounts; do not read keys, tokens or cookies, change Cloud policy, or bypass the hosted login.
- Browser, keyboard, touch, screen-reader and AC-137 manager study remain unexecuted. AC-137 requires five representative managers, an unseen 50-row synthetic Matter, counterbalanced scenarios, preregistered answers, no hints, and at least four people correct on major state, top blocker and next owner/action within ten seconds.

## Current evidence

The following were run on the then-current candidate and are retained under `docs/testing/p0-final-parallel-20261028/integration/gates/`:

- `backend-sqlc`, `backend-gofmt`, `backend-tidy`, `backend-lint`: exit 0.
- `backend-fixtures`: `go test -race -count=1 -json ./...` exit 0, 765 pass / 0 fail / 4 intentional skips, using only the separately verified local synthetic native fixture at loopback `55441` and product fixture at loopback `55442`. Credentials are not present in public evidence.
- `frontend-check-r2`: exit 0, 46 files / 448 tests.
- `frontend-webpack`: exit 0.
- `frontend-storybook`: exit 0.
- `restore-checker`: exit 0.

After the final GlobalError correction, `frontend-check-r3`, `frontend-webpack-r2` and `frontend-storybook-r2` all exited 0. The pending internal nonauthor review surfaced the GlobalError `<title>` defect, then lost network permission before it could issue a final verdict. The defect is fixed and covered by a focused test, but that is not a substitute for a fresh independent final-byte review.

The first sandboxed backend race run failed only because it could not bind local test listeners. It is retained as an environment failure; the later fixture run is the relevant backend result. The last actual restore rehearsal predates the final Brief guard; do not claim final-byte restore acceptance.

## Continue in this order

1. Intake and re-pin current source. Read all existing dirty changes before modifying them. Do not regenerate sqlc unless an actual migration/query change needs it.
2. Consume Design R9 in the real FE composition. Check route-by-route against its state, access-loss, form-intent, target-version and history requirements. Keep server components server-side and use client leaves only where interaction/persistence requires it.
3. Complete remaining W6/W7 propagation only where source or tests show a genuine gap: import graph atomicity, Status Brief fields, HTTP/PG/readback seams, Golden Workflow ledgers and recovery behavior. Preserve rule/permission/state semantics and add a meaningful regression before every non-trivial fix.
4. Finish localization only for static interface chrome that is required for the active flow. Do not mass-translate legal content, user data, server-provided explanatory text or invent a broad translation subsystem. Keep labels, values, aria labels and errors coherent with the selected locale.
5. Run only checks justified by edits. `pnpm check` is the frontend minimum; routes/shared UI require Webpack build and Storybook. Backend changes require `make sqlc-check`, gofmt, tidy, lint and race tests against isolated fixtures. Report browser/IdP/real-user items as `NOT_RUN` or `BLOCKED` when evidence is absent.
6. At a stable candidate, write fresh hashes/delta/commands under `docs/testing/p0-final-parallel-20261028/integration/` without rewriting historical return packages. Request an actual independent reviewer through the authorized route; do not call yourself OpenCode or extend a review to later bytes.

## Known open blockers and non-source work

- Current-source browser REST E2E awaits verified synthetic IdP accounts and approved browser capability.
- ZITADEL Cloud token/audience/role/revocation/refresh/logout/outage cases are `NOT_RUN`.
- Final-source restore needs a new owned, authorized rehearsal after candidate bytes stabilize.
- AC-137 and accessibility rendering remain human/browser gates.
- MC-002, C01-PRODUCT, Cloudflare feasibility, production, cost, retention/recovery and release remain open.

## Handoff result required

Return actual identity/tool/model, source manifest/hash, changed paths, requirement IDs, commands/time/exit and test counts, DB/resource disposition, reviewer status, skipped work and remaining risk. Never report a gate as PASS or DONE from source/unit evidence alone.
