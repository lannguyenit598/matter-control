# MC-OPENCODE-VERIFY-WAVE-20261031 — leg 2 return (actual OpenCode, independent QA)

- Identity: actual OpenCode, independent QA. Read-only product source; no fix applied; no DONE issued.
- Anchors: leg-1 cases R1/R7/R9/R14/R15 on `4b6a65f`; main wave (V2-x, PORT/TTL, R2–R6, R8, R10–R12) on `bb54d6e`; F1 re-anchored on `72266cb` (fix commit `dac4262`) after the fix-wave committed while this leg was running.
- Diff scope check `bb54d6e..HEAD`: only migration `0011`, backend core/service/repotest, frontend features and docs changed; `ops/**`, `.github/**`, `apps/frontend/scripts/**` untouched — so R8/R9/R11/R12/PORT verdicts keep their `bb54d6e` anchor.
- Evidence: `commands/verify-*` in this namespace; findings docs at the namespace root; `case-results.json` has the machine-readable list.

## Verdicts

| Case | Verdict | Anchor | Evidence / note |
|---|---|---|---|
| R1 config tests | **PASS** | 4b6a65f | `verify-R1-config-tests` exit 0 |
| R2 sync-guard mutation | **PASS (by design)** | bb54d6e | mutated ops SQL fails only the sync subtest, exact drift messages |
| R3 B1 suite green | **PASS** (62 leaf, 0 fail, own PG) | bb54d6e; re-run **PASS** on 72266cb | `verify-R3-b1-suite-green`, `verify-R3-b1-head-72266cb` (260 JSON events, exit 0) |
| R4 extra denials | **PASS** (6 new denials + INSERT capability) | bb54d6e | `verify-R4R5-extra-denials` |
| R5 maintenance escalation | **PASS** (7 denials incl. TRUNCATE / FOR UPDATE / SET ROLE / GRANT); needs documented `ALTER ROLE mc_maintenance LOGIN` | bb54d6e | same run |
| R6 migration up/down | **PASS** (2nd Up no-op; Down drops 4 indexes; re-Up restores) | bb54d6e | folded into R3 |
| R7 renderer tests | **PASS** (6/6) | 4b6a65f | `verify-R7-renderer-tests` |
| R8 preflight plant | **FAIL** | bb54d6e | **OV-R8-01**; `r8-release-preflight-plant.md` |
| R9 action pins | **PASS 6/6 exact** (tag targets, GPG verified) | 4b6a65f | `summary-final.json` |
| R10 durable suites | **PASS 14/14** | bb54d6e | `verify-R10-durable-suites` |
| R11 restore rehearsal | **PASS** (7/7 verdicts identical to author; numbers differ) | bb54d6e | `verify-R11-restore-rehearsal` |
| R12 scheduled dump | **PASS procedure**, retention defect exposed | bb54d6e | **OV-R12-01**; `r12-scheduled-dump-retention.md` |
| R13 / V2-1 YAML | **PASS 6/6** → OV-R13-01 CLOSED_VERIFIED | bb54d6e | `verify-V2-1-yaml-structure` |
| R14 secret sweep | **CLEAN** | 4b6a65f | leg 1 |
| R15 no-overclaim | **CLEAN** | 4b6a65f | leg 1 |
| V2-2 walkthrough env | **PASS** → CO-17 CLOSED_VERIFIED | bb54d6e | up / 4 milestones / down / orphan-check |
| V2-3 usability prep | **AMEND** (A-1…A-5) | uncommitted prep bytes (window 17:15–17:52Z 2026-10-31) | `v2-3-usability-prep-review.md` |
| PI-01 TTL 30s | **CLOSED** (all 7 renders = 30s) | bb54d6e | `verify-PORT-TTL-rerun` |
| PI-02 service accounts | **render-verified**; equal-identity guard fail-closed | bb54d6e | same |
| PI-03 preflight/CI | **FAIL** (see R8) | bb54d6e | OV-R8-01 |
| F1 D-9 (Z-F-01/02) | **REWORK_REQUIRED** — backend PASS, UI path blocked | 72266cb / dac4262 | `f1-structural-prereview-opencode.md` |

Leg-1 already recorded: OV-R13-01 CLOSED_VERIFIED, CO-17 CLOSED_VERIFIED, US-PREP AMEND.

## New findings (all OPEN; details in the cited docs)

| ID | Sev | Summary |
|---|---|---|
| **OV-R8-01** | **P1** | `release-preflight.mjs`: `probeFactory(read)` gets a probe-shaped object instead of the content string, so (a) content sentinels (PEM block, `MC-RELEASE-SENTINEL`) **never match** — planted in normal-named files they exit 0 clean; (b) any `.env*`/`.dev.vars`/`*.pem` artifact file throws an uncaught `TypeError` (exit 1, but no finding list and every other finding is lost). Unit tests call `scanFiles` directly and miss the wiring. Release gate is content-blind. |
| **OV-R12-01** | **P2** | `scheduled-dump.sh` L51: quoted `$(ls -1t …)` prune. With ≥2 stale archives nothing is deleted while JSON reports `pruned`; with 0 stale it reports `pruned:1`. Reproduced (4 old + 1 new, RETAIN=2 → 5 dumps remain). Retention can grow the second-location disk unbounded after a failed run or a RETAIN decrease. |
| **OV-F1-01** | **P1** | D-9 is not operable through the UI: `schemas.ts` L98/L231 zod enums omit `SIGNATURE`; `checklistSchema` has no `signature` part; `proof-panel` L297/321/624 only creates/filters PACKAGE/OUTCOME. A proof-required filing is now refused with `signature-criteria-required` and the UI cannot declare the criterion; any SIGNATURE criterion returned by the API fails checklist parsing. |
| **OV-F1-02** | **P2** | `brief_proof.go` L217 `purposeOf` maps SIGNATURE → PACKAGE on event replay; brief proof misclassifies the signature axis and inflates package counts. No replay test. |
| **OV-F1-03** | **P2** | Migration 0011 Down re-adds the two-value CHECK; with any SIGNATURE row it fails (reproduced `23514`). Rollback needs data mapping or a documented precondition. |
| **OV-F1-04** | **P3** | Refusal text does not name package+signature together when both are missing; the new gate also applies to `StageResponse` (confirm intent); no 0011 Up/Down migration test (existing test stops at 0009). |

## Not run in this leg (honest scope)

- **PORT-02** (four local profiles): needs four pinned artifacts (Worker bundle, Cloud Run-shaped container, AppHosting adapter, Node VM) plus the same Go image; none are built/pinned here and provider inference is forbidden.
- **PORT-03** (state switch): needs a running BFF with pinned build + stub IdP and origin/issuer/client swaps; no pinned runtime in this leg.
- **PORT-04** (stale old-build Server Action): needs an old/new build pair and a browser form submission; neither exists.
- **PORT-10** (SIGTERM/abort through both BE profiles): needs loaded services and a load generator; only author receipts exist.
- **PORT-11** (connection/memory measurement): needs running Go+BFF under 25 MiB load; D7 numbers remain proposed and are not approved by QA.
- **F2–F7** (Z-F-03, UX-L-01/02/04/05/06): committed `dac4262` but not independently verified in this leg; the locale 22-route probe on the prod build is also deferred to that unit.
- **Z-F-01/02 final close**: blocked by OV-F1-01 (UI unit) and OV-F1-02/03 decisions.

## Risks

- The D-9 fix is enforced server-side but the UI cannot create the required SIGNATURE criterion; trial sessions that submit proof-required filings through the UI will be blocked until the frontend unit lands.
- R8 means the release preflight can pass a bundle that embeds PEM/key material in normally-named files; the env-name class still fails closed (crash), so severity is about content-leak coverage and operability, not about silently deploying a `.env` file.
- R12 retention can fill the backup location after failed runs; monitoring reads a `pruned` count that is wrong in both directions.
- R11 remains a local synthetic rehearsal (no production RPO/RTO, IdP recovery separate).
- Verdicts on `bb54d6e` are not invalidated by the later commit (diff scope checked), but anything that depends on the new migration was re-run on `72266cb` only for B1 and the F1 package set.

## Proposed status

- OV-R8-01: fix-wave (frontend script) → then OpenCode re-run of R8 probes.
- OV-R12-01: fix-wave (ops script) → then re-run the multi-stale probe.
- OV-F1-01/02/03/04: fix-wave frontend D-9 unit + replay mapping + down migration decision → new commit → OpenCode re-run (backend red-green + proof parse probe + locale probe as its own unit).
- No case is marked DONE by this return; Z-F-01/02 stay REWORK_REQUIRED until the UI path is fixed and re-verified.
