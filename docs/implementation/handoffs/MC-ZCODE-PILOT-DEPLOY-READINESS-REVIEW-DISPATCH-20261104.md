# MC-ZCODE-PILOT-DEPLOY-READINESS-20261103 — RETURN + REVIEW DISPATCH (for Codex intake)

Date: 2026-11-04. Author: actual ZCode (GLM-5.3-Flash harness session). Status of the candidate:
**LOCAL_CANDIDATE / IN_REVIEW_WITH_VERIFICATION_BLOCKERS** — uncommitted by design; this document
requests Codex to (1) intake this return, (2) route an actual NON-AUTHOR independent reviewer,
(3) keep the no-commit/no-push/no-deploy boundary until review verdicts and PO decisions land.

> Update 2026-11-04 (post-intake): Codex ACCEPTED intake (this report cross-checked against the
> worktree: HEAD, diff SHA-256 and all 21 file pins matched; full manifest saved at
> `/private/tmp/mc-pilot-deploy-readiness-20261103/codex-review-inputs.json`). Reviewer selected:
> actual OpenCode. Automated dispatch FAILED (OpenCode sandbox blocked a local log path at
> startup) — the reviewer-facing prompt for MANUAL delivery is
> `MC-OPENCODE-PILOT-DEPLOY-READINESS-REVIEW-20261104-PROMPT.md` in this directory (inline
> manifest; pin re-verification + independence confirmation required before review). Candidate
> and the coordination checkout's Filing Pre-flight delta untouched.

## 1. Task identity and routing facts

| Field | Value |
|---|---|
| Task | MC-ZCODE-PILOT-DEPLOY-READINESS-20261103 (dispatch prompt `docs/implementation/handoffs/MC-ZCODE-PILOT-DEPLOY-READINESS-ONE-PASS-20261103-PROMPT.md`) |
| Owner (implementation) | actual ZCode — this return's author; author verification is NOT independent review |
| Reviewer requested | one actual non-author reviewer, routed by Codex; supporting code changes for that reviewer still need separate Codex assignment |
| Base | `origin/main @ 048776b3862ab384ab4e42356c46c0a320a93488` (verified before worktree creation and re-verified at close; HEAD unchanged) |
| Implementation branch | `codex/pilot-deploy-readiness-20261103` — the ONLY branch touched |
| Worktree | `/private/tmp/mc-zcode-pilot-deploy-readiness-20261103` (candidate bytes live there, uncommitted) |
| Future PR destination | `main` (target only; no write authorized) |
| Not touched | `sunstar`/`docs-codebase-review-main` (six inputs preserved untracked, hashes match pins at intake AND close), `codex/unified-project-flow` in-flight Pre-flight delta, `codex/main-release-preparation`, `main` |
| Evidence home (task-private, outside product tree) | `/private/tmp/mc-pilot-deploy-readiness-20261103/` — `task.md`, `return.md`, `disposition.md`, `qualification-handoff.md`, `receipts/*` (RED, TLS go+node, backup rehearsal, gate receipts) |
| Input pins (all six matched at intake and at close) | deploy-plan `9fd14e6b…`, zoom_out `a162ac74…`, comprehension `ad4f64d8…`, critic `1ff879ca…`, intermediate `d7d84a3d…`, readiness `86fdd29f…` |

## 2. Candidate inventory and integrity pins (verify before review)

Worktree state: base 048776b + the edits below, nothing else. `git diff` (tracked changes) full
SHA-256: `fbb487eb58f18401410d11cb660beea90be97acb470460b02b959f14462df17e`.

Modified (15) — candidate-byte SHA-256 prefixes:

| File | SHA-256 prefix |
|---|---|
| apps/backend/.env.example | 4f62411439 |
| apps/backend/docs/operations.md | 9fe8a1073b |
| apps/backend/internal/adapter/outbound/identity/zitadel/verifier.go | c43c1b9179 |
| apps/backend/internal/adapter/outbound/identity/zitadel/verifier_test.go | d720ea2dd0 |
| apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go | 2ad9a01f21 |
| docs/deployment/README.md | 9d9ac3e67d |
| docs/deployment/pilot-deploy-runbook.md | 22442b2bbcf (full: 22442b2bbcf03271…) |
| docs/deployment/portability-cloud-validation-packet.md | 3cec4ddf98 |
| ops/adr006/db/README.md | 88c3b64ff2 |
| ops/adr006/db/b1-roles.sql | 6c14e2325f |
| ops/backup/scheduled-dump.sh | 8bb017c46a |
| ops/deploy/cloud-run/migrate-job.yaml | 29da27fbca |
| ops/deploy/cloud-run/service.yaml | cbf87b64e7 |
| ops/deploy/profiles.mjs | c2d4736caf |
| ops/deploy/profiles.test.mjs | b04a4c2fa6 |

New (6): `b1_operator_sequence_test.go` b99dfa691d · `tls_verify_full_test.go` 4ac6e0078e ·
`product_migrate_test.go` 3d0ac4e392 · `ops/adr006/db/b1-runtime-grants.sql` c675aa7d8c ·
`ops/backup/scheduled-dump.test.sh` 0d679e0b7f · `ops/deploy/worker/wrangler.vars.json` 5c4ed2f983.

Allowed-paths check: all 21 paths within `apps/backend`, `docs/deployment`, `ops/adr006`,
`ops/backup`, `ops/deploy`. Zero coordination/testing/implementation/prompt/review-dossier files
entered the candidate. If any hash or the diff hash drifts before review, the verdict must bind to
the re-pinned bytes (re-run the fast gates in §4 after re-pin; do not review stale bytes).

## 3. What was delivered (WP1–WP7, one consolidated candidate)

| WP | Deliverable | Key local proof |
|---|---|---|
| WP1 | Operator SQL genuinely executable: `b1-roles.sql` is bootstrap-only (+ `createrole_self_grant` DO block for PG16+ non-superuser admin, + role-level `search_path = mcapp` for migrator/runtime); NEW `b1-runtime-grants.sql` (per-table grants, sequence USAGE, function hardening, Search EXECUTE); db README documents the exact order | RED reproduction of the old failure kept as evidence (EXIT=3 at `:69` on unchanged 048776b bytes) |
| WP2 | `b1_operator_sequence_test.go` executes the ACTUAL checked-in files in runbook order — first application, idempotent re-runs, migrations as `mc_migrator` with NO DSN search_path, constrained CREATEROLE-only admin, password step before migrate, BFF ownership, SHOW probes, CRUD/BFF/refusals, admin seeding | green on PG17 and PG18 fixtures |
| WP3 | Search preserved: `GRANT EXECUTE ON FUNCTION mcapp.mc_search_key_v1(text) TO mc_runtime` in the post-migration file + Go mirror + `SuiteSearch` runs as mc_runtime (EN/VI folding "Đặng Văn" ← "dang van", non-member hidden); optional `MC_SEARCH_CURSOR_KEY` secret-reference wiring (absent ⇒ honestly unavailable) | B1 suites + renderer tests |
| WP4 | `run.googleapis.com/invoker-iam-disabled: 'true'` (official doc re-checked 2026-11-04; allUsers alternative + org-constraint names documented); audience = resource PROJECT id fixed in `verifier.go` comment / `operations.md` / `.env.example` (strict checks unchanged; 2 new synthetic cases); duplicate `MC_OIDC_CACHE_TTL` removed; worker profile renders exact `wrangler deploy --var` flags (no tracked-source hand-editing); `migrate` never reads OIDC key/contacts IdP — proven; pgx verify-full proven against a task-owned CA fixture (trusted OK, wrong host/CA refused) | verifier tests, app migrate test, `TestTLSVerifyFullPaths`, dry-run receipt |
| WP5 | `scheduled-dump.sh` honors a REQUIRED validated `MC_BACKUP_SCHEMA` (argv-safe `-n`, refuses empty/invalid/duplicate/uppercase, archive confinement check, no credential leakage, JSON summary); dump authority named (project admin member of mc_owner; mc_runtime cannot read mc_bff); mc_bff-inclusion consequences stated; no new image/infra | `ops/backup/scheduled-dump.test.sh` — 24 checks, twice, incl. restore to NEW target and auth/storage exclusion |
| WP6 | `docs/deployment/pilot-deploy-runbook.md` rewritten as the ONE canonical runbook: three-tier findings register (owner/type/source/test/closure/status), decision register (packet D1–D7 accurate — D3=VM region, D4=VM TLS — plus pilot PD-1..PD-8, no invented approvals), living §0 env file, §3 exact SQL order, §4/§5 deployments, §8 availability truth (no `/readyz` keep-alive claim), §9 rollback/rotation limits (`latest` binding truth, key-ring custody, no `rm -P` erasure claims), Appendix A corrected connection budget (no fictitious "BFF 20×2"), Appendix B TLS matrix; packet erratum note; deployment README updated | register cross-checked against `disposition.md` |
| WP7 | Smoke expectations corrected to source: login → `/my-actions`; logout → `/login?signedOut=1` (no `/logged-out` route); uniform hidden response 404; membership immediate vs 30 s introspection-TTL; error taxonomy; 1 MiB/25 MiB exact sizes; stale Server Action ≠ 409 (`urn:mc:ui-session-changed` is the API-route case); COMPLETED keeps verification UNVERIFIED (source-cited `contract_gw2.go`); duplicate-upload behavior to be derived at execution; qualification handoff W1–W8 prepared | runbook §6 + `qualification-handoff.md` |

`disposition.md` maps EVERY item from all six inputs (A1–A11, F1–F12, C1–C26, Z1–Z6, R1–R32,
comprehension #1–#22) to a fix, a register parent row, a corrected report assertion (kept
separate — e.g. Stage 8's autocommit correction confirmed by the RED receipt; R5's '+ breaks
URLs' narrowed to the '/' structural hazard with a shipped synthetic proof), or an explicitly
pending provider/PO item. No report was silently dropped.

## 4. Verification receipts (full command/exit detail: `receipts/gate-receipts.md`)

1. Backend `make check` WITH disposable PG17 + race: **EXIT=0** (sqlc-check, gofmt, go mod tidy
   -diff, golangci-lint, `go test -race -count=1 ./...`; postgres package 67.6s incl. both B1
   tests + SuiteSearch as mc_runtime + retention). PG18 fixture re-run of the B1/retention/
   migrate tests: green.
2. Constrained non-superuser bootstrap (PG16+ semantics): green on PG17+PG18 (both majors).
3. TLS: `TestTLSVerifyFullPaths` PASS on the task-owned CA/hostname fixture (trusted CA +
   localhost connects; trusted CA + 127.0.0.1 refused; wrong CA refused); Node/pg 8.23.1 receipt
   PASS with the same posture (BFF's existing `BFF_DATABASE_CA` mechanism, rejectUnauthorized
   never disabled).
4. Renderer: `node --test ops/deploy/profiles.test.mjs` 12/12 (optional keys absent/present,
   malformed secret refs fail closed, invoker annotation, worker pins, PI-02, determinism,
   example values still rejected).
5. Backup rehearsal: 24/24 checks, run twice; final-byte re-run green.
6. Worker: `pnpm install --frozen-lockfile` EXIT=0 → `pnpm build:worker` EXIT=0 → `pnpm
   preflight .open-next --require-artifacts` clean; `wrangler deploy --help` documents `--var`;
   offline `wrangler deploy --dry-run` with all 10 rendered values (https URLs included)
   EXIT=0, Total Upload 9169.63 KiB / gzip 1892.99 KiB (PD-2 budget INPUT only — NOT CPU
   qualification).
7. Image: `docker build --platform linux/amd64` EXIT=0 (amd64/linux, entrypoint /mcapi, nonroot,
   not pushed). Final-image TLS against real Supabase: NOT_RUN (prepared only).
8. Final-byte re-certification after the last doc edits: gofmt clean, vet EXIT=0, node tests
   12/12, targeted Go tests green on a fresh PG17; no trailing whitespace; 9/9 referenced paths
   exist; allowed-paths check clean; HEAD still 048776b; six input hashes unchanged; sunstar git
   state preserved.

Fixture disposition: all `mc-pilot*` containers removed (0 remain); credentials synthetic,
generated at runtime, never committed.

## 5. NOT_RUN (provider/PO gates, intentionally open)

Provider auth/probes, IAM changes, public ingress activation, cloud resource creation, paid
services, deploy/rollback execution, Supavisor parameter-forwarding observation, deployed
Worker→Supabase TLS, real Worker CPU/memory qualification, ZITADEL end-to-end, R2 SigV4 from
Cloud Run, browser journeys, budget-alert commands. Each is prepared in
`qualification-handoff.md` (W1–W8 with inputs/prerequisites/expected results/artifact labels) and
gated on separately authorized execution. The runbook labels every such step NOT_RUN.

## 6. Operator/PO queue (what Codex/PO still owe)

1. Codex intake of this return → route ONE non-author reviewer (see §7).
2. PO decisions: PD-1 (Supabase plan), PD-2 (Workers plan — decide AFTER W5 CPU observation),
   PD-3 (people directory off/on), PD-4 (Search on/off), PD-5 (ZITADEL instance/MFA), PD-6
   (residency acknowledgement), PD-7 (first-release recovery rule), PD-8 (CA mount — after W2
   probe); packet D2 budget; packet D1/D3/D4/D6 skipped unless the CE profile is wanted; D5/D7
   already ACK status per ADR-007 §6 / OBD-02..11.
3. Provider qualification W1–W8 per the handoff (first: W1 = run runbook §3 steps 1–7 on the
   pilot Supabase project as the project admin with ON_ERROR_STOP=1).

Separate "source candidate complete" (this return + green local gates) from "actual cloud
qualification complete" (W1–W8 artifacts recorded by an authorized operator).

## 7. Reviewer dispatch notes (for Codex to include when routing)

- Pin first: verify HEAD == 048776b in the worktree and the §2 hashes; verdicts bind to those
  bytes. Report drift instead of reviewing stale state.
- Re-runnable local gates (no provider access needed): §4 items 1–5 and 8 commands; a disposable
  `postgres:17`/`:18` container is the only fixture requirement (`MC_TEST_DATABASE_URL`);
  `TestTLSVerifyFullPaths` additionally takes `MC_TLS_TEST_DATABASE_URL`/`MC_TLS_TEST_CA_FILE`
  and SKIPS cleanly when unset (its PASS receipt is fixture-scoped).
- Review focus suggestions: (a) the operator SQL split against the sync guard mirrors; (b) the
  constrained-admin path's PostgreSQL semantics (createrole_self_grant reliance — W1 remains the
  provider gate); (c) renderer conditional-block stripping (absent/present both YAML-valid —
  structural asserts only; an actual YAML-parser pass after `pnpm install` is a welcome add);
  (d) runbook register accuracy against `disposition.md` (nothing dropped, no invented
  approvals); (e) backup script validation/argv safety.
- Author-disclosure items to re-check (from `return.md` §7): one authoring incident (garbage
  file briefly written to /private/tmp with a mistyped name, deleted immediately, no product-tree
  impact); two Mimosa pre-write refusals resolved by removing credential-shaped literals
  (runtime-generated credentials via indirectly named env vars — no bypass); a Node import-path
  mistake in an early receipt script fixed before any receipt was recorded.

## 8. Skipped checks and remaining risks

Skipped: `pnpm check`/FE unit suites (NO frontend source changed; artifact path covered by
build+preflight); actual YAML-parser parse of rendered templates (structural asserts only —
noted for the reviewer); deployed-path provider checks (§5). Remaining risks: actual Supabase
admin rights may differ from tested PG16+ semantics (W1 decides; failures fail loud under
ON_ERROR_STOP, never partial-silent); pooler may drop client runtime params (mitigated — schema
resolution no longer depends on the DSN, W2 verifies); Worker Free CPU unknown (PD-2); org
constraint may forbid the invoker annotation (W3 names the alternative); `latest` secret binding
means revisions and secrets do not roll back together (documented §9; version pinning remains a
Tier-3 PO choice).

## 9. Proposed statuses for Codex to ratify

- Candidate: `LOCAL_CANDIDATE / IN_REVIEW_WITH_VERIFICATION_BLOCKERS` → moves to
  `IN_REVIEW` once a non-author reviewer is routed.
- After review: verdicts bind to the §2 pins; any CHANGES_REQUIRED loops back to ZCode with the
  same branch/worktree; PASS does NOT authorize commit/merge/push/deploy — those remain separate
  Codex/PO actions on the exact pinned bytes.
- No DONE / DEPLOYED / production-ready / $0 claim is made or requested.
