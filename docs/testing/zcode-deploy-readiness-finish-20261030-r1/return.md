# Return — MC-ZCODE-DEPLOY-READINESS-FINISH-20261030

- **Agent/tool**: actual ZCode (backend execution owner), session model GLM-5.3-Flash; shell via
  `rtk` proxy; PostgreSQL 18.6 (`postgres:18.6-alpine`) in task-owned containers; Node 24/pnpm 12;
  Go toolchain per `make` (golangci-lint v2 config in-repo).
- **Base/head**: base commit `0de3e5d` (branch `codex/unified-project-flow`) + the preserved dirty
  tree (157 pre-existing modified files — untouched); the task's own delta is pinned in
  `source-manifest.json` (37 files). No commit, no push, no stash, no reset — tree stays dirty.
- **Proposed status**: `LOCAL_CANDIDATE / IN_REVIEW_WITH_VERIFICATION_BLOCKERS` — the AC of
  WP-1..WP-9 is met locally (evidence below); everything provider-side, browser-side and
  IdP-side stays explicitly NOT_RUN. **Not DONE / DEPLOYED / DEPLOY_READY / $0 / production-ready.**

## What changed (WP results; full dispositions in `findings-disposition.md`)

| WP | Result | Key files |
|---|---|---|
| 1 TTL 30s (PI-01) | DONE | config/product.go, .env.example, both deploy templates, runbook, operations.md, tests |
| 2 B1 SQL package | DONE (structural decision recorded) | ops/adr006/db/*, b1_least_privilege_test.go |
| 3 Migration 0010 | DONE | migrations_mattercontrol/0010_*.sql + test |
| 4 Identity split (PI-02) | DONE (templates+tests; IAM NOT_RUN) | profiles.mjs/.test.mjs, migrate-job.yaml, cloud-init.yaml |
| 5 CI/preflight (PI-03) | DONE (CI itself NOT_RUN) | release-preflight.mjs(+test), frontend.yml, deploy.yml.disabled |
| 6 Retention + backup | DONE locally; scheduling NOT_RUN | bff_retention.go(+test), app/bffcleanup.go, cmd/mcbffcleanup, ops/backup/scheduled-dump.sh, restore rehearsal |
| 7 Pending-import ceiling | DONE (number = PO D7) | durable-state.ts, pending-attempts.ts, tests, .dev.vars.example |
| 8 Small debt | DONE | Dockerfile comment, PI-04 erratum, MC_DB_MAX_CONNS disposition (not added, math recorded) |
| 9 Pilot runbook | DONE | docs/deployment/pilot-deploy-runbook.md + checklist addendum |
| 10 B3 decision brief | PREPARED only | cloud-activation-packet.md §4 |

## Acceptance results per the mandatory final-byte list (all on the delivered bytes)

| Gate | Command | Result |
|---|---|---|
| Backend full | `rtk make check` with `MC_TEST_DATABASE_URL` → task PG 18.6 container | **exit 0**; sqlc check clean; gofmt clean; golangci-lint 0 issues; `go test -race ./...` 14 packages ok (unit, HTTP, memory, FULL PostgreSQL contract suites incl. B1 64/64 target-test events, retention 4, migration 0010) |
| Backend targeted | B1 + retention + 0010 `-json` | 64 pass / 0 fail events (`logs/b1-retention-0010-events.json`) |
| Frontend full | `rtk pnpm check` | **exit 0** (typecheck, eslint, prettier, agents:check, vitest: 97 files passed + 1 skipped, **822 pass / 12 skip**) |
| Frontend builds | `pnpm build` (CSS guard), `pnpm build:worker`, `pnpm build-storybook` | **all exit 0** |
| Preflight on real artifact | `pnpm preflight .open-next --require-artifacts` | clean (tracked files + `.open-next`) |
| Durable BFF on PG | `vitest run durable-state.test.ts durable-attempts.test.ts` with `MC_BFF_TEST_DATABASE_URL` → guarded `mc_fixture` | **14/14 pass** (incl. 1 MiB under the default ceiling + 25 MiB under an explicit 35 MiB knob) |
| Ops renderer | `node --test ops/deploy/profiles.test.mjs` | **6/6 pass** |
| Preflight unit tests | `node --test scripts/release-preflight.test.mjs` | **5/5 pass** |
| Restore rehearsal | `ops/p0-local/restore-rehearsal/run.sh` on task containers (schema 0001→0010) | **acceptance gate PASSED**: seed 14.5 s; backup 0.277 s / 256,971 B; restore 0.383 s; census/objects/readback IDENTICAL (incl. post-restart); post-boundary marker absent; corrupt/truncated refused; altered/missing object detected (`restore/runs/manual-run-20261031T154218Z/`) |
| Scheduled dump smoke | 3 runs, RETAIN=2, container-routed pg_dump | 80 TABLE DATA entries/archive; prune verified; sha256 sidecars |
| E2E local | browser rows | **NOT_RUN — no browser tooling granted.** Covered at lower layers: cross-matter/role denial + object upload/download SHA in the Go contract suites (make check, green); idle/absolute expiry, refresh concurrency, logout purge, restart recovery in the durable PG suites (green). Real-IdP sign-in/logout flows were NOT run (reading credential files is forbidden by the task; no new credentials created). Recorded as the remaining independent-verification blocker, not as pass-by-inference |
| CI (GitHub) | workflows | **NOT_RUN** (no push allowed); YAML syntax validated with PyYAML; actionlint unavailable — recorded |

## Test count honesty

- Pass/fail/skip numbers above are the tool outputs; no assertion was loosened to get green. Two
  pre-existing-suite realities: one `proof-ui` vitest timeout appeared ONLY under concurrent
  backend-race load and passed standalone (load flake, recorded); `pnpm test` skip count (12) is
  the pre-existing set (PG-durable tests skip without the env var — the CI `durable-bff` job now
  runs them with it).

## Delivery artifacts

`return.md` (this file), `findings-disposition.md`, `independent-review-packet.md`,
`cloud-activation-packet.md`, `source-manifest.json`, `outputs-manifest.json`, `logs/`,
`restore/runs/manual-run-20261031T154218Z/`. Task record updated:
`docs/implementation/tasks/MC-ZCODE-DEPLOY-READINESS-FINISH-20261030.md`; status paragraph added
to `docs/ai-sdlc/project-status.md`.

## What was skipped, and remaining risk

- **Skipped (by rule or by missing tooling)**: provider activation of any kind; browser/UI e2e;
  real-IdP flows; CI execution; actionlint; App Hosting buildpack artifact sentinel check on a
  real buildpack run (the preflight runs locally and in CI, but the observed adapter copy-behavior
  case still needs the OpenCode R8 check on a real buildpack output).
- **Remaining risk (ranked)**: (1) the B1 test executes Go-mirrored SQL with a sync guard instead
  of the operator files verbatim — an independent reviewer must confirm the guard makes drift
  impossible to miss; (2) the session-pooler client limit was not verifiable this session — the
  connection-budget conclusion depends on it (named follow-up, runbook §1); (3) the pending-import
  ceiling default (5 MiB) is a proposal, not a PO decision (D7); (4) Worker Free resource fit for
  large pending imports remains unproven by design until a scoped cloud run measures it; (5) the
  two structural test changes to pre-existing files (durable-attempts 25 MiB knob; retention probe
  cleanup) deserve non-author eyes.
- **Operator handoff (stop point)**: fill the inputs in `cloud-activation-packet.md` §2.1, then
  execute §2.2 in order with its negative tests; nothing further is queued behind planning.
