# MC-OPENCODE-WAVE2-CODEX-CANDIDATE-REVIEW-20261101-r2 — Independent Review Return (second OpenCode session)

Date: 2026-11-01 (session end 2026-11-02 ~03:00 UTC). Reviewer: actual OpenCode / non-author (independent QA; provider `opencode`, model `glm-5.3-flash-free`, OpenCode harness). Workspace `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`. Governing handoff: [MC-OPENCODE-WAVE2-CODEX-CANDIDATE-REVIEW-20261101.md](../../../implementation/handoffs/MC-OPENCODE-WAVE2-CODEX-CANDIDATE-REVIEW-20261101.md).

Output namespace: `docs/testing/opencode-wave2-codex-review-20261101-r2/` — suffix `r2` because `...r1/` already exists (created 2026-11-01 15:57 local) and was produced by a **different earlier session** (r1 open-code review harness). This session did not read-resume, edit, or adopt r1; r1 files remain untouched.

Status: **IN_REVIEW_COMPLETE_WITH_BLOCKERS** — five units independently closed, two units blocked at their product-behavior gates. No automatic CLOSED_VERIFIED verdict for the wave as a whole, no MC-002 DONE, no release/deploy. Returned to Local Codex for intake.

Summary verdict per unit — G2/G3/G4/G5/G6 independently verified; G1/G7 independently verified at source level while their real browser/screen-reader journeys are **NOT_RUN** (BLOCKED). No mutation claims beyond my own disposable scratch.

## 1. Compliance boundaries honored

- Read-only review; no product-source or repo-state mutation; author-session outputs untouched (used strictly as cited references). No takeover-side commits were adopted into this session.
- No login/provider/model or harness changes, no new tool registrations, no model list changes, no payload dispatches.
- Primary repo: no `git add/commit/push`; no font/global AGENTS edits; no worktree metadata edits; no handoff edits; `bookkeep-run` style mutation none.
- Runtime: `:3000/:8081` untouched; IdP `:8080` untouched; no local or retained DBs touched (no reads of `codex/manual/p0/*` PG containers, no read of their credential files); no rtk/AGENTS state changes. The only PG instance I contributed is my own disposable fixture (below).
- Proof hierarchy observed: object-level trusts only; every "reported run" from the author session that mattered to a verdict was re-executed by me where feasible; everything not re-executed is labeled `receipt-only` or `NOT_RUN` in `checks.json`/`findings.json`.

## 2. Environment and review tooling

- rtk wrapper (`rtk 1.1.0`, `~/.codex/RTK.md` consulted, `rtk proxy` for unwrapped commands); `git`, `clone --no-hardlinks`, isolated `cp`-based worktree copies under `/private/var/folders/9b/zd6k4tc179587w4ntkqvvlqr0000gn/T/opencode/wave2-review-*` and `/private/var/folders/9b/zd6k4tc179587w4ntkqvvlqr0000gn/T/opencode/g2/`.
- PG: `postgres:18.6-alpine`, own container `mc-opencode-w2r2-fixture-g4q7p` (127.0.0.1:55459; DSN with generated one-off password, redacted in these outputs). Container created by me for G4 and shared with the backend race suite; `docker stop` used at teardown (auto-remove), no other Docker state touched.
- All command transcripts live in session scratch (ephemeral); only failure-proof digests, exit codes, and determinations are embedded into these five output files.

## 3. Candidate identity and drift re-pin

The handoff pinned base `64b9e0315e210953d7a7eaeacc0643b269a14ad9` + a 38,271-byte staged patch (`candidate-source.patch`, sha256 `60f018eb3dcf7cc25bf2e6921ef319f9d69fec7c85e9a5ee6ed62433f8a6fd01`, 16 declared paths in `staged-candidate.json`).

Drift fact: the takeover branch has one commit beyond that base — `978d8fc694a47e9beee528076bcf1af9473997e3` ("Complete Wave 2 preflight, filing proof mapping and action announcements", author/committer `Lan Nguyen`, commit date 2026-11-01T15:35:13+07:00 = 2026-11-01T08:35:13Z, parent `64b9e03`), made **after** the author-session commit-gate rejection receipt (`REJECTED_UNACCEPTABLE_RISK`, 08:29:14Z = 15:29 local, `gitHeadUnchanged 64b9e03`) and **before** the pre-existing r1 review outputs (created 15:57 local). The commit's governance is outside my review boundary; the takeover intake (`codex-wave2-review-intake-20261101-r1`) already documents it as an executed-commit-actor erratum with candidate identity independently correct.

Re-pin performed rather than silently extending verdicts: I reconstructed Candidate B in an isolated clone (`git clone --no-hardlinks`, checkout `64b9e03`, `git apply candidate-source.patch`) — clean apply on the 16 declared paths — and compared all 16 reconstructed files against the commit's tree: **all 16 blob hashes byte-match**. So the commit content is exactly base+patch, no silent extension; verdicts below therefore apply identically to Candidate B and to actual HEAD `978d8fc`.

Candidate A (the primary working tree) adds unrelated dirty work: a focus/search feature (backend search handlers, migration 0012, frontend focus/search), dependency moves (`apps/frontend/package.json` adds `@next/playwright`; `apps/backend/go.mod` promotes `golang.org/x/text` to a direct dep), plus dialog/glass styling changes — none of it part of Wave2 and none of it inside the 16 declared paths. One consequence: only 15/16 Wave2 files in A byte-match B; the delta is `apps/frontend/src/app/(app)/layout.tsx` (5,447 vs 3,603 bytes) because that same file also carries unrelated dirty edits. I verified A's layout still contains the Wave2 `ActionAnnouncer` mount (`import { ActionAnnouncer }` at line 15; wrapper open/close at lines 39/119), consistent with B's mount at lines 83-87. A is the source set only for the A-tree frontend suite (below); all backend/Wave2-scoped verification ran against B/HEAD.

## 4. Verification matrix (executed)

### G3 — SIGNATURE purpose kept through replay (OV-F1-02) — INDEPENDENTLY_VERIFIED
- Red: overlay the **new** `brief_replay_test.go` onto the **pre-fix** `brief_proof.go` (base tree) → `go test ./internal/core/service -run "TestReplayBrief_"` FAIL: `TestReplayBrief_PurposeOfKeepsSignature` — `purposeOf("SIGNATURE") = PACKAGE, want SIGNATURE` (exit 1).
- Green: Candidate B `brief_proof.go` + same tests → exit 0 (`ok leonx.me/matter-control/internal/core/service 0.427s`), 12 `func TestReplayBrief*` cases in the fixed tree.

### G4 — migration 0011 Down is data-safe (OV-F1-03) — INDEPENDENTLY_VERIFIED
- Own disposable fixture `mc-opencode-w2r2-fixture-g4q7p` (podman-free docker run, port 55459, fresh volume).
- Red: `TestCriterionPurposeMigration0011DownIsDataSafe` against the **pre-fix** Down → FAIL with SQLSTATE **23514** (`check constraint "criteria_purpose_check" of relation "criteria" is violated by some row`).
- Green on Candidate B: `TestCriterionPurposeMigrationKeepsLegacyRowsAsPackage` PASS and `TestCriterionPurposeMigration0011DownIsDataSafe` PASS (`ok ... 1.299s`). The fixed Down remaps SIGNATURE→PACKAGE before re-adding the two-value CHECK; this is a documented lossy downgrade for rollback only. I did not run any Down against production or a retained DB (out of scope by rule).

### G6 — one refusal names package and signature gaps together (OV-F1-04) — INDEPENDENTLY_VERIFIED
- Red: new `filing_outcome_test.go` overlay (`1db0d96`) onto pre-fix `filing.go` (`066e974` tree) → `TestSubmissionRefusalNamesPackageAndMissingSignatureTogether` FAIL with the old one-gap message (`package criteria are not satisfied: PKG (MISSING)`, signature gap omitted).
- Green on Candidate B: full `internal/core/domain/matter` suite passes (exit 0; 52 `--- PASS/FAIL` verdict lines, all PASS).
- Source check: `case StageSubmission, StageResponse:` shares the D-9 gate block; the new combined-refusal branch is in the submission/response stage path; a standalone undeclared-signature refusal keeps its own `signature-criteria-required` code; no guard weakening introduced. (Author `g6-red.json` also covers the frontend guard copy; I verified the backend red instead — the frontend red is receipt-only.)

### G1 — filing proof-required with SIGNATURE purpose end-to-end (OV-F1-01) — SOURCE_PASS, browser BLOCKED/NOT_RUN
- Backend HTTP D-9 contract on Candidate B: `TestZFRepro_R2FilingF_OnD9Semantics_HTTP` and `TestFilings_HTTPFlow` PASS (exit 0): refusal with both `package-criteria-required` and `signature-criteria-required` codes on insufficient submissions, then full PACKAGE+SIGNATURE acceptance through an independent verifier with OUTCOME still PENDING (no shortcut). W4 memory contract `TestSuiteW4_MemoryStore` PASS.
- Frontend red: reproduce at pre-G1 commit `2dd84c9` with the G1 UI test overlaid (`d9-signature-ui.test.tsx` from `c76947a`): 3 FAIL (schema/checklist parse of a SIGNATURE criterion; signature-axis group on the proof panel; purpose selector offers SIGNATURE) while `proof-ui.test.tsx` stays 15/15 — matches the pre-fix behavior being tested for.
- Frontend green: on Candidate B the same test file passes; targeted 8-file suite (`action-announcer`, `filing-guard-copy`, work `[itemId]` page, `form-dialog`, `intent-attempt`, `recovery`, `d9-signature-ui`, `proof-ui`) — 8 files / **57 tests / 57 PASS** (exit 0).
- Real Filing browser journey: **NOT_RUN** — official browser/tool disabled in this session and no bypass used. The author's later partial browser smoke (`docs/testing/codex-wave2-browser-smoke-20261101-r1`) is a receipt-only reference (see §6): its direct observation of the live D-9 UI is not my evidence and its newly reproduced W2-BROWSER-01 remains OPEN in the workboard, outside this review's seven-unit set.

### G2 — release preflight content-blind scan fix (OV-R8-01) — INDEPENDENTLY_VERIFIED
- Old blob proof: extracted the pre-fix `release-preflight.mjs` from `4b6a65f` blob history and sha-verified `f3d590bd…` against the original r1 R8 finding's recorded old-script hash (identity confirmed).
- Red R1 (false clean): pre-fix CLI in an isolated copy with plants of PEM block + `MC-RELEASE-SENTINEL` marker in an artifact directory only → `release preflight: clean (tracked files + artifacts1)` **exit 0**: the exact content-blind false-clean. No planted value echoed.
- Red R2 (wrong crash shape): pre-fix CLI with a planted `.env.local` carrying a runtime-secret-shaped key (`API_KEY=` synthetic value) → `TypeError: text.split is not a function or its return value is not iterable` (exit 1) — the second (reader-shape) defect. No planted value echoed.
- Green on Candidate B (`node main()` driven through isolated copies of `release-preflight.mjs`/`worker-build-env.mjs`):
  - artifact plants (`.env.local` API_KEY, PEM file, sentinel file) → **exit 1**, 3 findings naming file paths and key **names only** (`env file; runtime secret key API_KEY present (value withheld)`, `PEM private key block`, `release sentinel marker`) — values withheld, zero payload echo.
  - tracked-source plants (`.env.staging` with `BFF_TOKEN=...`, `tracked-pem.dat` PEM, `tracked-sentinel.txt` sentinel) → **exit 1**, 3 findings as above, values withheld.
  - clean scans on B and on primary A → exit 0.
- Fixed-CLI unit + integration suites: `node scripts/release-preflight.test.mjs` 5/5 PASS, `node scripts/release-preflight-integration.test.mjs` 4/4 PASS (exit 0 both).

### G5 — scheduled-dump retention prune (OV-R12-01) — INDEPENDENTLY_VERIFIED
- Ran the author's probe from inside the Candidate B clone so `REPO` resolves to B's `ops/backup/scheduled-dump.sh`: output `case1 dumps=2 sidecars=2 pruned=3`, `case2 dumps=1 pruned=0`, `G5 PROBE: ALL PASS`, exit 0.
- Probe inspected before running: fake `pg_dump`/`pg_restore` in a temp dir; only temp/MC_BACKUP_DIR dirs written; no real DB, driver, scheduler, cloud, or object store touched. Scope is exactly the retention logic (keep-newest-N plus sha256 sidecars); no real backup/provider/scheduler claim is made.

### G7 — action announcer wiring (FR-2A-08/09 family) — SOURCE_PASS, SR BLOCKED/NOT_RUN
- Candidate B source review, verified directly: `src/components/organisms/action-announcer.tsx` mounts a persistent sr-only `role="status"`/`aria-live=polite` region (mount is `src/app/(app)/layout.tsx` shell-level, A's layout also has it — see §3), one fixed en/vi failure/copy map, no raw record/server text, no optimistic/unverified "Saved" path; caller wiring: `intent-form.tsx` (task+auth merge, intended only for the same announcer region), `confirm-action-button.tsx`/`inline-edit.tsx` flowing through `announceActionResult`, `alert.tsx` sets `live={!announcements}` when the shell announcer is the source so the alert stays silent, `form-dialog.tsx` gates its own ledger row by `doneAnnounced` so the same outcome is announced once via the single path. No keepMounted mutation; candidate B carries no additional shell remount vs HEAD.
- Screen-reader real smoke: **NOT_RUN** (browser/SR runtime BLOCKED this session; no headless/alternate AT bypass).
- Suite evidence treating the announcer exclusively at unit level: `action-announcer` tests run in the r2 targeted B suite (§ G1 FE green) and inside the A-tree full suite; no behavior-only claim is made.

### Aggregated suites
- Candidate B targeted frontend suite: 8 files / 57 tests / 57 PASS (exit 0) — see G1 green.
- Candidate A **full** `vitest run` (primary working tree copy, isolated scratch dir): **896 passed / 12 skipped** across 117 files (exit 0). The 12 skips are the durable-PostgreSQL/BFF paths and match the r1 structural list. Author's own A-tree sweep reported 858 passed / 12 skipped; the +38 delta is explained by unrelated dirty-tree tests added since (focus/search/darker polishing) and does not affect any Wave2 verdict.
- Candidate B backend full gate (`make check`-equivalent, all on B): `sqlc-check` exit 0; `gofmt -l .` 0 lines; `go mod tidy -diff` clean; `golangci-lint run ./...` 0 issues; `go test -race ./...` against my fixture `MC_TEST_DATABASE_URL` **exit 0** (direct, non-pipeline capture), 14 packages ok (notably `internal/adapter/outbound/postgres` 106.261s — includes the shared contract battery run over the PostgreSQL adapter; `repotest/mattercontrol` 1.522s memory; `objectstore` 7.951s), 0 FAIL, plus 7 `[no test files]` entries. A genuine full run (no `cached` markers; this is the second race invocation after the pipeline-captured one, which captured no FAIL lines either). One prior background invocation's raw `go test` exit had been captured through a pipeline (so that record is the pipeline exit, not `go test`'s); the second invocation's direct exit code is the one quoted here.
- Fixture teardown: `docker stop` ok; `docker ps -a` recheck confirms no `w2r2` container remains; nothing else touched.

## 5. Cross-source sanity checks (all independent)

- 16/16 Wave2 files' sha256 in the isolated reconstruction match the author-side staged-candidate manifest; all 16 also blob-match commit `978d8fc`'s tree; the takeover patch itself applies cleanly with no extra hunks beyond the declared set.
- 8 receipt-basis G-items (G2 red/green receipts, G3 red/green, G4 red/green, G5 probe, G6 red receipt, G7 receipt copies) — I re-ran each individual red/green source truth my session could drive; G6's frontend guard-copy red is the only red I did not run myself (receipt-only).
- Tool versions equal the author's takeover receipt (`tool-versions.json`): go 1.27.3, node v24.22.1, pnpm 12.11.2.

## 6. Author-only receipt references (read; NOT re-executed; NOT adopted as my verdicts)

- `commit-gate.json` (REJECTED_UNACCEPTABLE_RISK at 08:29:14Z, gitHeadUnchanged `64b9e03`), `fixture.json`/`fixture-stop.json` (takeover own fixture `mc-wave2-codex-20261101-z9l4vtqi`, port 56545, stopped, retained-for-QA, volumes not deleted), `browser-gates.json` (official-browser BLOCKED receipts; no bypass recorded) — cross-checked against my session timeline for drift (§3).
- Build/preflight receipts: `index-webpack.json`, `index-frontend-check.json`, `frontend-check.json` (first attempt exit 1), `frontend-check-final.json` / `frontend-closeout.json` (exit 0), `preflight-tests.json`/`-final`, `durable-bff.json`, `artifact-preflight.json`, `backend-byte-continuity.json` — receipt-only; none re-run by me, hence the NOT_RUN cells below.
- `docs/testing/codex-wave2-browser-smoke-20261101-r1/` (later author-side partial browser smoke head `978d8fc`): B01-B05 PASS_OBSERVED, B06 REPRODUCED_DEFECT **W2-BROWSER-01** (stage-state retention in `AdvanceForm`, retained invalid target; workboard-registered OPEN, P2), B07 BLOCKED_AUTHORIZATION (verifier designation), B08 NOT_RUN (positive two-actor submission), B09 NOT_RUN_STALE_RUNTIME (G7 announcer absent from that older runtime build; a later refresh per `docs/ai-sdlc/project-status.md` reports the G7 mount present in the newer `:3000` runtime, still receipt-only). All of this remains author evidence; the independent G1 two-actor positive submission and real SR smoke remain open.

## 7. Dispositions

| Unit | Finding | r2 disposition | Basis |
|---|---|---|---|
| G1 | OV-F1-01 | **FIXED_PENDING_VERIFY** (source pass; browser journey BLOCKED/NOT_RUN) | backend HTTP D-9 pass; FE red→green; targeted 8-file suite pass; A-tree full suite pass; real two-actor browser submission unverified |
| G2 | OV-R8-01 | **CLOSED_INDEPENDENTLY_VERIFIED** | reader-shape and detection-chain red/green reproduced with my own plants; values never echoed; clean scans clean |
| G3 | OV-F1-02 | **CLOSED_INDEPENDENTLY_VERIFIED** | purposeOf red→green; no behavior gap observed in replay semantics tests |
| G4 | OV-F1-03 | **CLOSED_INDEPENDENTLY_VERIFIED** | SQLSTATE 23514 pre-fix red on my own fixture; fixed Down green; legacy rows must stay PACKAGE; no Down run on any production/manual DB |
| G5 | OV-R12-01 | **CLOSED_INDEPENDENTLY_VERIFIED** | probe pass (fake tools only); no scheduler/provider claim |
| G6 | OV-F1-04 | **CLOSED_INDEPENDENTLY_VERIFIED** | combined refusal red (old code one-gap) → green; StageSubmission/StageResponse share the D-9 gates; standalone refusal code retained |
| G7 | F8/P-09 | **FIXED_PENDING_VERIFY** (source pass; AT smoke BLOCKED/NOT_RUN) | source wiring verified; real screen-reader journey unverified |

Overall wave status stays **in-review with open execution gates** (G1 browser two-actor journey; G7 real SR; plus the receipt-only build/webpack/durable-BFF closure set above). Nothing in this return closes MC-002, Wave2 as a whole, or any release/deploy.

## 8. Outputs published and boundaries

- Only these five files, in this directory: `return.md`, `inputs.json`, `checks.json`, `findings.json`, `outputs-manifest.json` (the manifest covers the other four; no self-reference).
- Scratch transcript files are ephemeral under `/private/var/folders/9b/.../T/opencode/wave2-review-*` and `/private/var/folders/9b/.../T/opencode/g2/` — not durable proof, only working harnesses.
- No credentials in these outputs: the G4 PG DSN password is redacted here; the exact DSN remains only inside scratch.
- `docs/testing/opencode-wave2-codex-review-20261101-r1/` untouched; its content is not adopted, only cited.
- The workboard already references the r1 review intake; I did not edit the workboard, handoff, intake, or any other product file.

## 9. What was skipped and remaining risk

- NOT_RUN (re-execution merits a specific follow-up task): G1 real Filing browser journey (two-actor positive path) and G7 actual assistive-technology smoke — browser/SR runtime blocked for this session, no bypass permitted or attempted; rebuilt Webpack/Turbopack/Worker/Storybook builds and the built-artifact byte-scan; durable BFF/PostgreSQL re-run; full `make check` on A (out of Wave2 scope — A carries unrelated dirty backend work); G6 filing-guard-copy red re-run (backend red was driven instead; frontend receipt cited).
- Explicitly out of scope: the staged-candidate governance bon (who/when may commit; PO/cost gates); the W2-BROWSER-01 open defect itself (workboard-registered, subject to its own fix); real backups/scheduler provider behavior (G5 fake-tools scope); A-tree dirty non-Wave2 work; any deployment/production behavior.
- Source/target drift risk considered and handled: drift re-pinned explicitly rather than assumed (`§3`); all Wave2 blob-identity and byte-count evidence points to the commit hash `978d8fc` and to the declared 16-path patch; no other commit-level claim is made.
