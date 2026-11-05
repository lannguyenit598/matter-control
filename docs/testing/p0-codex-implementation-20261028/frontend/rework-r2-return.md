# FE patch R2 — mixed receipt response correction

Author of this narrow revision: actual root Local Codex. The original five-file FE patch remains attributed to `/root/p0_frontend_patch_20261028`. Independent nonauthor reviewer reported a blocker in the R1 helper: valid receipts for every submitted row plus an unexpected extra receipt could settle the attempt while the extra was silently discarded.

Root traced both component callers of `reconcileOutcomes`, read the applicable component/TypeScript/testing rules, and reproduced the issue with two component→actual action→repository seam regressions. A request mock represents the external API boundary; these are not live integration/browser tests.

## Minimal correction

Only `intent.ts` and `components/data-transfer-attempt.test.tsx` changed relative to R1. An unexpected receipt now makes every submitted row UNKNOWN and keeps the exact attempt unresolved. Duplicate submitted identities also cannot settle. Existing missing/duplicate expected-receipt handling and valid same-key recovery remain intact. No extra payload/state framework, source-contract change or persistence mechanism was introduced.

The full FE delivery is still five files relative to the immutable original baseline. `../delivery-r2/manifest.json` pins both lanes; backend is byte-identical to R1. R1 `delivery/` and historical author evidence were retained unchanged. R2 supersedes R1 only after its actual nonauthor review.

## Actual verification

| Evidence | Result |
|---|---|
| `evidence/r2-mixed-receipts-red.json` / `.log` | exit1; both new bulk/import mixed-response regressions fail, seven previous cases pass, before helper change |
| `evidence/r2-mixed-receipts-green.json` / `.log` | Retained intermediate exit1: product behavior corrected; new import assertion looked for a disabled Commit button while the actual UNKNOWN UI removes it. Fixed assertion to require absence; no product workaround |
| `evidence/r2-final-tests.json` / `.log` | exit0, **43 tests /4 files** |
| `evidence/r2-final-typecheck.json` / `.log` | Scoped strict TypeScript exit0 |
| `evidence/r2-final-lint.json` / `.log` | Scoped ESLint exit0 |
| `evidence/r2-final-format.json` / `.log` | Changed-file formatting exit0 |

All commands ran in the isolated FE tree using existing dependencies and explicit external temp/cache configuration. Child environments were allowlisted PATH/TMPDIR/NO_COLOR only, no HOME override or copied `.env`. Exact command/cwd/UTC/exit metadata is retained. No live product source/resource/private/Git changes occurred.

Final whole-frontend/full-build/PG/browser acceptance was not run. Reload/tab-close durability of UNKNOWN attempts is still a pre-existing open requirement, not fixed or waived by R2. Final nonauthor review and current Claude source reconciliation are required before integration. No self-DONE/acceptance is awarded.
