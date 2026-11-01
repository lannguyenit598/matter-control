# F1 patch pre-review — D-9 SIGNATURE purpose (Z-F-01/Z-F-02)

- Object: `docs/testing/mc-p1-fix-wave-20261031-r1/f1-zf01-zf02.patch` (482 lines), authored by the fix-wave session. **That patch is now committed**: `dac4262` ("Fix wave F1-F6…"), HEAD `72266cb`. The checks below were first run on the patch bytes (scratch tree) and then **re-run on the committed bytes**; the verdict section at the end is anchored to `72266cb`.
- Structural / red-green review, not a product-owner decision: no DONE is issued here.
- Scratch tree: `/private/tmp/mc-opencode-verify-wave-20261031/f1-tree` (copy of the `bb54d6e` snapshot, patch applied there only; product source untouched).
- Owned PG: `mc-opencode-verify-20261031` (`mcverify`); no author containers reused.

## What the patch does

Implements D-9 (ratified 2026-10-31): a criterion's purpose gains `SIGNATURE`, separate from `PACKAGE` and `OUTCOME`.

- Domain: `PurposeSignature`, `EffectivePurpose`, `VerificationResult.Signature` proof part; package gate counts PACKAGE-purpose criteria only; proof-required submission requires a declared SIGNATURE criterion and every mandatory one satisfied, with OWNER waivers preserved (`SignatureNotRequired`, retired criterion).
- Persistence: migration `0011_criterion_purpose_signature.sql` widens the CHECK; new `SIGNATURE` rows accepted.
- API: checklist DTO adds `signature`; `invalid-purpose` message widened.
- Tests: 6 new domain tests, W4/GW contract updates; docs (`api.md`, `state-semantics.md`).

## Checks performed (patch bytes)

| check | result |
|---|---|
| `patch -p1 --dry-run` on `bb54d6e` tree | applies cleanly, no fuzz |
| `go test ./internal/core/domain/matter` (patched) | **ok** 0.5s — new D-9 tests green |
| `go test ./internal/core/service` (patched) | **ok** 0.4s |
| contract suites W4/W6/W7QA/GW/BF against owned PG (patched) | **ok** 22.3s (`commands/verify-F1-contract-suites`) |
| migration 0011 Up on fresh schema | **ok**; baseline constraint auto-name is exactly `criteria_purpose_check`, so the DROP matches; `SIGNATURE` insert accepted (`commands/verify-F1-migration-down-probe`) |
| migration 0011 Down with one SIGNATURE row | **fails** `ERROR: check constraint "criteria_purpose_check" … violated by some row` — down is not data-safe |

## Pre-review conditions (now mapped to OV-F1-01…04 below)

1. **F1-PR-1 (P1, frontend coupling).** The patch is backend-only, but the frontend zod contract rejects the new value: `apps/frontend/src/features/proof/schemas.ts` L98 `purpose: z.enum(['PACKAGE','OUTCOME'])`; L231 input enum `['', 'PACKAGE','OUTCOME']`; `checklistSchema` L133-138 has only `package`/`outcome`. As soon as any criterion is `SIGNATURE`, the proof checklist response fails schema parsing (zod throws) → the proof view cannot load; and the UI cannot create a SIGNATURE criterion at all. The commit needs the frontend schema/UI unit (or F1 must be explicitly gated as backend-only with the UI follow-up tracked and the proof view proven not to parse SIGNATURE rows until then).
2. **F1-PR-2 (P2, replay read model).** `apps/backend/internal/core/service/brief_proof.go` L217 `purposeOf` maps only `OUTCOME`, everything else → `PACKAGE`. Replayed SIGNATURE criteria therefore read as PACKAGE in the brief proof, misclassifying the signature axis and inflating package counts. Needs the `SIGNATURE` branch plus a replay test.
3. **F1-PR-3 (P2, rollback).** The Down migration re-adds the two-value CHECK without handling existing SIGNATURE rows; a rollback after any SIGNATURE criterion exists fails (reproduced). Either map SIGNATURE→PACKAGE in Down, delete/refuse with a documented precondition, or state the operational constraint in the runbook.
4. **F1-PR-4 (P3, refusal text).** At `StageSubmission/StageResponse`, when the package is missing **and** no SIGNATURE criterion is declared, the code returns only the package refusal (`len(refused) > 0` suppresses `signature-criteria-required`), although the comment promises "package and signature alike (AC-145)". The second error appears only after the first is fixed.
5. **F1-PR-5 (P3, response stage).** The new signature requirement sits in `case StageSubmission, StageResponse:`. For in-flight filings whose response cycle has no SIGNATURE criterion, response submission becomes blocked until one is declared (or the OWNER waives). Confirm this is intended by D-9/PO, not just a submission-stage rule.
6. **F1-PR-6 (P3, coverage).** No migration test covers 0011 up/down; the contract suites exercise Up implicitly only. Down is currently untested and unsafe (PR-3).

## Positives

- Additive data model; legacy rows read as PACKAGE via `EffectivePurpose`, so historical behavior is unchanged until a criterion is created with the new purpose.
- OWNER-only waivers preserved (applicability flag, retire-with-reason), and the refusal names the unmet criterion.
- Domain tests are targeted at the two Z-F behaviors and the proof-axis split; the contract suites still pass on Postgres, so the D-9 change does not regress W4/W6/W7QA/GW/BF.
- API and state-semantics docs updated in the same unit.

## Committed-byte verdict (HEAD `72266cb`, fix commit `dac4262`)

Re-runs on the actual checkout (not the patch copy):

| check | result |
|---|---|
| `go test ./internal/core/domain/matter ./internal/core/service ./internal/adapter/outbound/postgres` (all package tests except the four env-specific suites) | **ok** 46.5s (`commands/verify-F1-committed-redgreen`, exit 0) |
| B1 least-privilege / retention / 0010 migration suites with `-race` on `72266cb` | **exit 0** (`commands/verify-R3-b1-head-72266cb`, 260 JSON events) |
| `git diff bb54d6e..HEAD -- ops .github apps/frontend/scripts` | empty — earlier R8/R9/R11/R12/PORT verdicts keep their `bb54d6e` anchor |

Backend D-9 behavior is real and tested on committed bytes. The unit is nevertheless **not shippable as-is** for UI users:

1. **OV-F1-01 (P1, OPEN).** The frontend contract still rejects the new purpose. `apps/frontend/src/features/proof/schemas.ts` L98 `purpose: z.enum(['PACKAGE','OUTCOME'])` and L231 input enum `['', 'PACKAGE','OUTCOME']`; `checklistSchema` L133-138 has only `package`/`outcome`; `proof-panel.tsx` L297/L321 filter only PACKAGE/OUTCOME and L624 sends `purpose: ... ?? 'PACKAGE'`. Consequences on `72266cb`: (a) the UI cannot declare a SIGNATURE criterion, so a proof-required filing can no longer be submitted through the UI — the server now refuses with `signature-criteria-required` and the UI offers no remedy (the old "package criterion proves signatures" path was the Z-F-02 defect; the fix removes it without giving the UI the replacement path); (b) if a SIGNATURE criterion exists (API, seed, import), the checklist response fails zod parsing (`purpose` enum) and the proof view cannot load; (c) even if parsed, SIGNATURE criteria are filtered out of both rendered sections.
2. **OV-F1-02 (P2, OPEN).** `apps/backend/internal/core/service/brief_proof.go` L217 `purposeOf` maps only `OUTCOME`, everything else → `PACKAGE`. A replayed SIGNATURE criterion reads as PACKAGE in the brief proof — wrong axis and inflated package counts. No test covers replay of the new purpose.
3. **OV-F1-03 (P2, OPEN).** Migration `0011` Down re-adds the two-value CHECK without handling existing SIGNATURE rows; reproduced `ERROR: check constraint "criteria_purpose_check" … violated by some row`. A rollback after any SIGNATURE criterion exists aborts (goose transaction rolls back, so no corruption, but the rollback path is unusable without manual data handling/documentation).
4. **OV-F1-04 (P3, OPEN).** (a) When package and signature are both missing and no SIGNATURE criterion is declared, only the package refusal is returned (the comment promises both); (b) `case StageSubmission, StageResponse` applies the new signature requirement to response submissions too — confirm this is intended for in-flight response cycles; (c) `criterion_purpose_migration_test.go` stops at 0009 and does not cover 0011 Up/Down.

## Status

**Z-F-01/Z-F-02: REWORK_REQUIRED (backend fix verified, UI path blocked by OV-F1-01).** The backend guard is correct and green on committed bytes, so the rework is the frontend D-9 unit (schema enum, signature proof part, purpose selector/filters, plus a parse test that feeds a SIGNATURE criterion) and the replay mapping; OV-F1-03/04 should be fixed or explicitly accepted. No DONE. A final close requires a new commit + OpenCode re-run on those bytes (backend red-green + frontend proof parse probe + locale probe remains separate).
