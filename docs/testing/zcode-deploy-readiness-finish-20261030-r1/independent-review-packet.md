# Independent review packet — MC-ZCODE-DEPLOY-READINESS-FINISH-20261030

For the independent non-author reviewer (OpenCode per the task record; author evidence is
AUTHOR_VERIFICATION only and no PASS is claimed). Base: `0de3e5d` + preserved dirty tree; the
reviewer should pin the actual base and dirty bytes at review time. File hashes at delivery:
`source-manifest.json` (37 files). Raw command logs (argv/cwd/UTC/exit captured in rtk tee logs):
`logs/`.

## Suggested review order

1. `findings-disposition.md` — the claims, including the two structural decisions that need
   independent judgement: (a) the B1 test executes Go-mirrored SQL with a byte-sync guard instead
   of executing the operator files verbatim (Mimosa hook blocks variable-SQL execution — three
   blocked writes recorded in the session); (b) the retention test's admin-owned probe table and
   the schema-first preamble (2BP01 fix).
2. `ops/adr006/db/b1-roles.sql` + `b1-bff-grants.sql` vs the Go mirrors in
   `apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go` — verify the sync
   guard would actually catch drift (it ran green: 64/64 events across B1, retention, 0010).
3. `migrations_mattercontrol/0010_access_path_indexes.sql` — reversibility, idempotency, no query
   text change (sqlc diff empty).
4. `ops/deploy/profiles.mjs` + templates — the PI-02 fail-closed rule and the VM secret-fetch
   split; confirm `migrate-job.yaml` cannot render with a shared SA.
5. `apps/frontend/scripts/release-preflight.mjs` + `frontend.yml` — do the pinned SHAs match the
   official repos? Is the preflight's forbidden set right? Does the durable-bff CI job count only
   integration cases?
6. `apps/frontend/src/lib/oidc/durable-state.ts` + `pending-attempts.ts` — the ceiling semantics
   (fail-closed, before any storage, message quality, bulk not ceilinged, streamed document path
   untouched) and the deliberate test change in `durable-attempts.test.ts` (25 MiB case now sets
   the knob explicitly).
7. `bff_retention.go` + `internal/app/bffcleanup.go` + `cmd/mcbffcleanup` — bounded batches, no
   FOR UPDATE (maintenance role lacks UPDATE by design), no content in logs, hexagonal wiring.
8. `ops/backup/scheduled-dump.sh` + the restore rehearsal summary (`restore/runs/…/summary.json`)
   — measurements, refusal cases, acceptance gate.
9. `docs/deployment/pilot-deploy-runbook.md` — operator order, negative tests, budget math
   (§1), rotation, rollback; and the checklist supersession addendum.
10. `cloud-activation-packet.md` — the three-section separation and the D1–D8 briefs; confirm
    section 3 (VERIFIED_ON_PROVIDER) is honestly empty.

## Focused case list (from the reviewer's 82-case plan; nothing renumbered)

| # | Case | Author evidence | Independent check expected |
|---|---|---|---|
| R1 | TTL 30s everywhere; no 15s outside evidence/intentional-0s files | `grep` + config test | re-grep, re-run config tests |
| R2 | B1 SQL ↔ Go sync guard actually fails on drift | green run | mutate one side in a scratch checkout, expect FAIL |
| R3 | B1 denials still hold incl. append-only UPDATE | events file | re-run suite on a fresh PG 18 |
| R4 | BFF role scope (state-only, no CREATE, no product reads) | B1 subtest | re-run; attempt an untested shape (e.g. `CREATE INDEX`) |
| R5 | Maintenance role cannot escalate via FOR UPDATE / INSERT | retention test | re-run; review the grant set for missing denials |
| R6 | 0010 Down drops exactly 4 indexes; second Up no-op | events file | re-run migration test |
| R7 | Renderer refuses equal SAs; migrate secret only in the job | profiles tests | run `node --test ops/deploy/profiles.test.mjs` |
| R8 | Preflight catches planted `.env.local`/`.dev.vars`/sentinel in a real artifact | local preflight clean + tests | plant a sentinel in a COPY of `.open-next`, run preflight, expect FAIL + no value printed |
| R9 | Pinned action SHAs match official tags | return note | fetch the 3 refs from GitHub |
| R10 | Durable ceiling: at-ceiling passes, over-ceiling 413 before any write | durable-pg.log | re-run both durable files on a guarded fixture |
| R11 | Restore rehearsal numbers reproducible | summary.json | re-seed on fresh containers; numbers will differ, IDENTICAL verdicts must not |
| R12 | Scheduled-dump retention keeps exactly N | smoke output | run the script 3× with RETAIN=2 |
| R13 | YAML workflows parse; deploy template inert | PyYAML check | actionlint if available; confirm `.disabled` is not loaded |
| R14 | No secrets in evidence/git | privacy-check below | re-run the sweep |
| R15 | Browser/IdP/provider rows stay NOT_RUN (no inference) | return.md | confirm no claim of the contrary |

## Privacy / secret sweep (author-run; re-run before sign-off)

- Synthetic passwords for the task's throwaway PostgreSQL containers live ONLY in
  `/private/tmp/mc-zcode-deploy-ready-evidence/` (0600, outside the repository).
- No `.env*`/`.dev.vars`/key file was read; no DSN/password appears in this evidence tree; the
  restore rehearsal's run.sh redacts DSNs by design.
- The tracked-files preflight scan is clean (only `*.example` env files exist in git).
