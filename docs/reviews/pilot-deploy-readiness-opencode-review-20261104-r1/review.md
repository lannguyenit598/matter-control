# Independent review — MC-ZCODE-PILOT-DEPLOY-READINESS-20261103 (r1)

- Reviewer: **actual OpenCode** (OpenCode harness/GLM-5.3-Flash runtime), non-author independent reviewer, per `docs/implementation/handoffs/MC-OPENCODE-PILOT-DEPLOY-READINESS-REVIEW-20261104-PROMPT.md`.
- Candidate under review: actual ZCode's task `MC-ZCODE-PILOT-DEPLOY-READINESS-20261103`, worktree `/private/tmp/mc-zcode-pilot-deploy-readiness-20261103`.
- Review date: 2026-11-04 (Asia/Ho_Chi_Minh). Scope: local-source readiness review ONLY. Provider execution (W1–W8), deployment, cost commitments and release remain outside this review.
- Overall verdict: **CHANGES_REQUIRED** (one blocking documentation-semantics finding: the D7 decision-register approval status, §3 FA4). Everything else reviewed clean or minor.

---

## §0 Identity, independence and pin re-verification

- I am **actual OpenCode**. I am not the candidate author (actual ZCode) and I did not contribute any byte of the candidate patch. No hand-in of pin data was trusted: every pin below was recomputed by me from bytes in the candidate worktree.
- Identity of others recorded from documents; my own identity is direct knowledge. No sandbox refusals were encountered during this review; nothing was bypassed.
- **Pin re-verification result: EXACT MATCH.** I re-derived all pins myself from the candidate worktree at review time:
  - HEAD = `048776b3862ab384ab4e42356c46c0a320a93488`, branch = `codex/pilot-deploy-readiness-20261103` (matches base pin).
  - `git diff | shasum -a 256` = `164db6e8af39f7c23f8d7ad165b5fe95061fca2691647e13b09ad7161af912d1` — equal to the recovered pin given to me in the dispatch.
  - All 21 candidate file SHA-256 hashes (inline manifest, as listed in `task.md`) were recomputed from worktree bytes and match byte-for-byte.
  - Post-gates re-pin (after every §4 test run, including backup rehearsal and Go tests): HEAD/branch/diff-sha/21 paths unchanged → **I changed no candidate source, and my gates did not either**.

## §1 Pins bound by this review

| Pin | Value | Verified by |
|---|---|---|
| Base HEAD | `048776b3862ab384ab4e42356c46c0a320a93488` | `git rev-parse HEAD` |
| Branch | `codex/pilot-deploy-readiness-20261103` | `git rev-parse --abbrev-ref HEAD` |
| Diff SHA-256 | `164db6e8af39f7c23f8d7ad165b5fe95061fca2691647e13b09ad7161af912d1` | `git diff \| shasum -a 256` (plain `git diff`: tracked modifications; untracked files are pinned by their own file hashes) |
| 21 file hashes | inline manifest in `task.md` (sunstar workspace) | per-file `shasum -a 256`, all 21 match |
| Post-gate drift | none | full re-pin after §4 (§0) |

All verdicts in §3 are bound to the pinned candidate above. A re-review after the required change (§3 FA4) must re-pin.

## §2 Inputs consulted

Read in order: reviewer dispatch prompt; author dispatch/handoff `MC-ZCODE-PILOT-DEPLOY-READINESS-REVIEW-DISPATCH-20261104.md`; author evidence (`return.md`, `disposition.md`, `qualification-handoff.md`, `task.md` at `/private/tmp/mc-pilot-deploy-readiness-20261103/`); candidate files (§3 cites); primary repo records (`docs/ai-sdlc/step-01-approval.md`, `docs/requirements/open-business-decisions.md`, `docs/architecture/adr/ADR-007-*.md`); the six sunstar review inputs at `/Users/nguyenvanlan/orca/workspaces/matter-control/sunstar/`.

Classification of receipts: the author's receipts were treated as **CLAIMS**. I re-ran every locally-reproducible gate myself (§4). Author receipts concerning real-provider execution (Supabase, Cloud Run, Workers, ZITADEL, R2, budget) are classified NOT_RUN (I did not and may not execute providers). Author hashes/pins were superseded by my own recomputation; the sunstar workspace pins for the six input files were not re-derived by me (out of my duty set; only the candidate pin is mine).

## §3 Five focus areas — verdicts and evidence

Focus numbering follows the dispatch. Verdicts: FA1 PASS, FA2 PASS, FA3 PASS (one limitation), FA4 **CHANGES_REQUIRED** (blocking) + two MINOR, FA5 PASS (two MINOR wording/hygiene notes).

### FA1 — SQL operator split vs Go mirrors — PASS

- `ops/adr006/db/b1-roles.sql` is bootstrap-only: role/schema/default-privilege floor, no per-table grants; `createrole_self_grant` DO block (line 46), operator delegation with role-level search_path (`ALTER ROLE mc_migrator SET role = 'mc_owner'` line 73, `search_path = mcapp` line 75; runtime line 77), runtime usage grant (line 79), `mc_bff` schema usage to the owner only (line 99).
- `ops/adr006/db/b1-runtime-grants.sql` carries per-table grant classes (append-only / deletable including `saved_views` per RLF-04 / standard select-insert-update), `GRANT USAGE ON ALL SEQUENCES IN SCHEMA mcapp TO mc_runtime` (line 113), `REVOKE ALL ON ALL FUNCTIONS IN SCHEMA mcapp FROM PUBLIC` (119) with exactly one `GRANT EXECUTE ON FUNCTION mcapp.mc_search_key_v1(text) TO mc_runtime` (121), and `REVOKE CREATE ON SCHEMA mcapp FROM mc_runtime` (123). No per-object-bootstrapped privilege leaks between the two files during review.
- Go mirrors are identical: `b1TestSyncGuard` compares the SQL files against Go-embedded text as a line-normalized set across all four mirror files (bff-state, b1-roles, b1-runtime-grants, b1-bff-grants); the grant-class expectation table ("every table has its grant class") and "public has nothing" subtests are present; SQL is executed one-command-per-block preserving file ordering.
- Locally reproduced on PostgreSQL 17 (§4 G3): bootstrap → passwords → migrate-as-migrator (no DSN search_path) → grants apply/re-apply → BFF state — all pass; least-privilege contract suite passes, including refusal probes (SET ROLE to owner, self-grant escalation, CREATE, BFF-keyed operations as wrong role) and EN/VI folding + membership secrecy.

### FA2 — File-order operator test — PASS

- `b1_operator_sequence_test.go` executes the 5 constrained-admin steps in the runbook's exact order (bootstrap → passwords → migrate with query parameters stripped except sslmode → re-run bootstrap + runtime-grants apply and idempotent re-apply → BFF state/ownership/grants), then probes (`search_path`/`current_schema`/`current_user`/`session_user`, `statement_timeout`, explicit refusals incl. CREATE TABLE), then application-level contracts via `store.SearchPage` with workspace+matter membership (non-member sees nothing), EN/VI folding through `mc_search_key_v1('Đặng Văn')` → `dang van` proven against the real database.
- Operator files are read from the repo via `b1RepoRoot` and executed verbatim (no Go-side re-formulation); single-connection execution preserves session GUC semantics; test credentials are runtime-generated; profile objects and the bootstrap operator are dropped in cleanup (no leakage into the fixture DB observed).

### FA3 — Profile renderer and templates — PASS with one limitation

- `ops/deploy/profiles.mjs` fails closed: `{{#KEY}}`/`{{/KEY}}` block semantics (absent → block removed; present → markers stripped and values substituted), optional keys validated like required ones (no placeholders/unsafe chars, secret-value refusal), unknown-key rejection; worker pins (`API_MODE=rest`, `AUTH_ALLOW_ANONYMOUS=false`, `SESSION_COOKIE_SECURE=true`, `BFF_STATE_BACKEND=postgres`, `API_BASE_URL` `/api/v1` path); PI-02 enforced (serving identity ≠ migrator identity); deterministic A→B→A renders.
- Templates: `cloud-run/service.yaml` conditional `dbca`/`oidc-key` volume mounts, standby `/readyz` probe, liveness `/healthz`, `annotations: invoker-iam-disabled: 'true'` only on service (absent on migrate-job.yaml, which instead carries `MC_MIGRATE_DATABASE_URL` and the `dbca` volume when present); `worker/wrangler.vars.json` template is pure key/value placeholders; `ops/deploy/worker/` contains only `wrangler.vars.json`.
- Local reproduction: 12/12 renderer tests pass (§4 G1).
- Limitation (WELCOME improvement, non-blocking): renderer tests assert YAML structurally only (string patterns); no YAML-parser pass. Proposed as a separate small Codex assignment (proposal P2 in §6).

### FA4 — Runbook + decision register vs approval records — CHANGES_REQUIRED (blocking), 2 MINOR

Blocking finding (MUST FIX before this task can be accepted):

- **D7 approval status invents a ratification the cited record does not contain.**
  `docs/deployment/pilot-deploy-runbook.md` line 150:
  `| packet D7 | Numeric workload bounds (in-flight 10, concurrency 10, maxScale 3, pending 5 MiB) | accept as pilot defaults | accept | P4 | ACK — ratified with OBD-02..11 (2026-10-24) |`
  The runbook itself promises "Approval status is real" (lines 137–140: register is an input for PO review, not decisions). But the consulted records state the opposite:
  1. `docs/ai-sdlc/step-01-approval.md` lines 13–15: Question 2 was the explicit deferral of numeric workload to Step 02 ("Hoãn chốt các con số sang Step 02"); line 33: "the human explicitly permits deferring numeric workload and OBD-11 retention/RPO/RTO to Step 02."
  2. `docs/requirements/open-business-decisions.md` line 95 (OBD-09 = "Workload and infrastructure feasibility"): "Status: DEFERRED_STEP_02_TECHNICAL_VALIDATION; numeric workload deferral APPROVED_BY_PO on 2026-10-24. Workload values and feasibility remain OPEN."
  3. ADR-007 Decision item 5: numeric workload values are "proposed defaults, PO-owned … the Product Owner owns these numbers (decision D7)."
  4. The packet's own erratum (`portability-cloud-validation-packet.md` lines 5–9) re-states that "Decision status here is unchanged": D7 remains a decision request with recommendation "Accept as pilot defaults … not from a workload study."
  What was ratified on 2026-10-24 was the OBD-02..08/10/11 recommendation set — the numeric workload decision (OBD-09) was explicitly deferred and its numbers remain open. "ratified with OBD-02..11 (2026-10-24)" therefore marks an OPEN, PO-owned numeric acceptance as decided, misleading the PO on exactly the row that requires their input.
  **Exact required change:** replace the D7 approval-status cell with a truthful status and real citations — e.g.
  `OPEN — PO (packet D7: accept as pilot defaults or set from measured workload; numeric workload deferred to Step 02 by step-01-approval 2026-10-24; OBD-09 values remain OPEN; values PO-owned per ADR-007 Decision item 5)` — or, if an actual PO acceptance of "accept as pilot defaults" exists in an authorization record I was not shown, cite that record instead. `disposition.md` line 82 (Z6 "D7 ACK") must be aligned in the same change.

- MINOR fix (same register): `packet D5` row line 148 cites "ADR-007 §6"; ADR-007 has no §6 section heading — the intended target is Decision item 6 (transport boundary, asymmetry explicitly reserved as a PO security/cost decision). Fix the pointer wording; the D5 row's substance (application-boundary posture, "no new approval sought here") is consistent with ADR-007 Decision item 6 and the templates (`invoker-iam-disabled` on service only).

- MINOR fix (FA5-related wording): `ops/backup/scheduled-dump.sh` line 17 says credentials reach the tools "never on the command line via argv (psql DSN only)", but a password embedded in `MC_BACKUP_DSN` necessarily appears inside pg_dump's argv for the invocation window (and the rehearsal proves the embedded-password URL path works). Correct the wording and/or prefer a PGPASSWORD-env tagline with an argv-stripped DSN. No credential leak was found in any diagnostic: `/tmp/wp5-bad.out` contains only "MC_BACKUP_SCHEMA: duplicate schema 'mcapp'" (0 credential matches).

Positive verifications in FA4 that stand: runbook §1 Tier-3 rows keep owner/type honest; PD-1..PD-8 are correctly OPEN (they are pilot-only PO items); the packet D-IDs are reused accurately (D3 = VM region, D4 = VM TLS per erratum; Appendix A at line 395 is free of the fictitious "BFF 20×2" and line 123 marks row 22 DOC-FIXED); `contract_gw2.go` exists at `apps/backend/internal/adapter/outbound/repotest/mattercontrol/contract_gw2.go` and is correctly cited at line 310; Appendix B TLS matrix (line 405) keeps local/provider scopes distinct; NOT_RUN labels on provider steps are truthful; §3 SQL order matches the tested order; §11 backup row matches the script's actual validation behavior (line 116).

### FA5 — Backup argv safety — PASS (with the MINOR wording note above)

- `scheduled-dump.sh` requires MC_BACKUP_DSN/MC_BACKUP_DIR; `MC_BACKUP_SCHEMA` is validated char-by-char (`[!a-z0-9_$]` refusal), duplicate-detected, and compiled into `SCHEMA_ARGS` used as per-schema `-n` argv elements with `set -euo pipefail` and no shell interpolation; archive confinement is checked by re-listing the archive (`pg_restore -l` + TABLE DATA filter + UNEXPECTED_SCHEMAS refusal); retention uses `ls -1t` + `rm -f --` with a `PRUNED` counter (the OV-R12-01 no-op bug is genuinely fixed); the JSON summary contains no DSN/password.
- Local reproduction: the rehearsal script ran all 24 checks green, including schema-selection rejections (empty/`;;`/trailing-comma/uppercase/SQL-injection-shaped/duplicate all exit 2 with nothing written), unknown-schema exits 1, unreachable DSN exits 1, restore into a NEW database with matching row census and auth/storage exclusion, retention keeping exactly N archives with checksum sidecars, and the hex-password URL round-trip (container owned by the test and destroyed on exit; §4 G2).

## §4 Local gate receipts (my own runs)

Environment: macOS (arm64); go1.27.3; node v24.22.1; docker server 29.9.2; PostgreSQL 17 image (tag `postgres:17`) digest `sha256:3b0cda93be7c8dba2ed484d19393d93845dc3dafb88973e248ba8e6d99d784e1`; container-side OpenSSL 3.5.7 (host side 4.1.0, unused). No local psql/pg client binaries present — all database tooling ran inside containers.

| # | Gate | Result | Classification |
|---|---|---|---|
| G1 | `node --test ops/deploy/profiles.test.mjs` | tests 12 / pass 12 / fail 0, exit 0 | REPRODUCED |
| G2 | `bash ops/backup/scheduled-dump.test.sh` | "RESULT: all scheduled-dump rehearsal checks passed", exit 0; task-owned pg17 container destroyed on exit | REPRODUCED |
| G3 | `go test -run 'TestB1OperatorFileSequence|TestB1LeastPrivilegeProfile' ./internal/adapter/outbound/postgres/` with `MC_TEST_DATABASE_URL` → disposable pg17 at 127.0.0.1:55493 | ok 12.734s; both top-level tests PASS (all subtests PASS), exit 0 | REPRODUCED (PG17) |
| G4 | `go test -run 'TestVerify' ./internal/adapter/outbound/identity/zitadel/` | 9 tests PASS (incl. new `TestVerify_ProjectAudienceAmongAudIsAccepted`, `TestVerify_ClientIdOnlyAudienceIsRefused`), exit 0 | REPRODUCED |
| G5 | `go test -run 'TestMigrate' ./internal/app/` with `MC_TEST_DATABASE_URL` | `TestMigrateProductNeverReadsOIDCKeyOrContactsIdP`, `TestMigrateConfigurationRejectsEmptyOIDCValues` PASS, exit 0 | REPRODUCED |
| G6 | `go test -run TestTLSVerifyFullPaths` with a real local TLS fixture | PASS, exit 0 | REPRODUCED (locally-built TLS fixture) |

G6 fixture details (transparency; no source bytes were touched):
- Synthetic runtime-generated hex credential, passed to the container environment only; a dedicated pg17 container with a native (non-entrypoint) postgres child started with `-c ssl=on -c ssl_cert_file=… -c ssl_key_file=…`; server certificate SAN = `DNS:localhost` ONLY (this is required by the test: subtest must refuse `127.0.0.1`); CA exported from the container to the host; sslrootcert pointed at exported CA.
- One in-container adjustment was needed because docker-proxy scans reach the server from the bridge gateway: added `host all all 172.17.0.0/16 scram-sha-256` to the fixture's `pg_hba.conf` and reloaded. Container-local only; no source/config file of the candidate changed.
- The three TLS paths were thereby exercised for real: trusted-CA + correct hostname connects; trusted CA + `127.0.0.1` refused (hostname verification, no downgrade); wrong CA refused (unknown authority).

Classified NOT_RUN / NOT_REPRODUCIBLE_SANDBOX (hard boundary §5):
- W1 real Supabase constrained-admin bootstrap (provider PG, real project admin) — locally we only proved the sequence on a disposable PG17; provider-specific PG version/admin behavior NOT_REPRODUCIBLE_SANDBOX.
- W2 laptop CA probe for Supabase, W3 Cloud Run real deploy, W4 Worker real deploy/preview, W5 provider-side scheduled run, W6 real ZITADEL, W7 real R2, W8 budget/billing — NOT_RUN (evaluated-in-provider; runbook labels them NOT_RUN, matching the boundary).
- `pnpm install && pnpm build:worker && pnpm preflight` artifact path — NOT_RUN (kept out of the cheap-gate set; the renderer's 12 structural tests were run instead).
- Full `go test ./...` across all packages — NOT_RUN (scope restricted to the candidate's WP targets: G3–G6; unrelated packages may additionally require `TEST_DATABASE_URL` fixtures that would have enlarged the exercise beyond review purpose).

## §5 Boundaries honored during this review

- Candidate worktree: strictly read-only (no writes; diff/SHA pins byte-identical pre- and post-gates; gate-run leftovers searched for and none found inside the repo).
- Coordination checkout: only two new files created by me (this review file and the pointer file in `docs/implementation/tasks/`); the in-flight dirty files (Filing Pre-flight delta) were not touched; no recordings under the author evidence dir were modified.
- No commits, merges, or pushes; no provider calls; W1–W8 remain NOT_RUN by me (verbatim with the candidate's labels).
- Credentials: all synthetic, generated at runtime, present only inside disposable containers and one temp env file under the approved OpenCode temp dir, never in git, logs, or screenshots; all containers destroyed after the gates (`pg` fixtures removed; temp cred file deleted along with its directory after usage as intended).
- No sandbox refusal was encountered, so none was bypassed. Note: on this workstation I ran review-development commands directly in the shell (static reads and this report) and left rtk to simple add-on invocations; the workstation AGENTS.md asks to prefix shell commands with rtk where it acts as a proxy — execution of test commands above was direct. This is a workstation-only note, not a portable dependency; it does not change any result (the commands were read-only or self-cleaning).

## §6 Verdicts, required change proposals, skipped checks, remaining risks

**Overall verdict: CHANGES_REQUIRED.** The candidate is technically coherent and its tested surface reproduces green locally (FA1/2/3/5 PASS; FA4 register issue is documentation semantics, not code). It is nevertheless a blocking matter (the deployment pipeline below these decisions and my stated purpose: the runbook marks an open PO numeric decision as already ratified, in a register whose own contract says "Approval status is real").

**Even after the required change, an approval here closes only the local-source review** of this candidate. It does not:
- authorize commits, merges, image builds, deployable artifacts, provider-side execution (W1–W8 remain NOT_RUN until the separately authorized qualification),
- approve costs, billing enablement, Cloudflare/GCP/Supabase storage, or any real deployment of MC_ZDB-templates, or the pilot PD-1..PD-8 PO items,
- constitute release approval (Step 02/03 boundaries and release gates unchanged).

Required change (to be applied by the author, never by the reviewer): fix the D7 register cell + align disposition Z6, per §3 FA4; while fixing, adopt the two MINOR wording corrections (D5 cite pointer; the backup argv wording) and optionally the rehearsal `/tmp` literal-path hygiene.

Proposals for separate Codex assignments (non-reviewer work; optional): P1) renderer tests: add a YAML-parse pass to structural asserts; P2) `scheduled-dump.sh`: prefer PGPASSWORD env with argv-stripped DSN then document the argv exposure; P3) rehearsal error-path temp file via mktemp. Deployed runtime behaviors still require the qualification task and provider evidence.

Skipped checks and remaining risks (what I did not attempt): everything listed as NOT_RUN/NOT_REPRODUCIBLE_SANDBOX in §4; sunstar-workspace input pins were not re-hashed by me (author/relay claim); no full `go test ./…` sweep; no pnpm worker-artifact build; no re-highlight beyond the five focus areas plus the explicitly noted smaller fixes (verifier audience semantics, `.env.example` dedup, `operations.md` audience row, migrate-identity contract tests — all verified as claimed and locally reproduced where runnable).

Remaining risks: (1) real-provider differences (PG version, router/pathing, IAM/edge) can invalidate local says-so; (2) the numeric defaults, even if accepted as pilot defaults, are memory/DB-connection arithmetic, not a measured implementation — the packet says so and that fact must not be lost in the corrected register; (3) hidden defects of the renderer templates may exist that structural asserts only (not parsing) cannot catch; (4) the D7 fix's replacement pointer must be checked against whatever record the author actually finds — if no acceptance record exists, the cell stays OPEN and my CHANGES_REQUIRED intent is fully satisfied; if an acceptance record IS cited, it must be one I was able to consult in the candidate-targeted record set.
