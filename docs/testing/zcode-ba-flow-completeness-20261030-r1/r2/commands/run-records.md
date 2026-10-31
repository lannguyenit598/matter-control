# Run records — attempt r2

All commands run from `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` unless noted; rtk prefix used where the harness wrapper applied; UTC timestamps from the call log.

| # | Phase | Command (argv summary) | UTC window | Exit | Note |
|---|---|---|---|---|---|
| 1 | Snapshot | `rtk git rev-parse HEAD && rtk git diff \| shasum -a 256` | 2026-10-30T16:2xZ | 0 | HEAD 0de3e5d; dirty 5b086afe… (106 files) |
| 2 | Fixture | `docker run -d --name mc-ba-flow-pg --label mc.owner=zcode-ba-flow-review -e POSTGRES_*… -p 127.0.0.1:15499:5432 postgres:18.6-alpine` | 2026-10-30T16:2xZ | 0 | fresh isolated container + DB |
| 3 | Stub IdP | `go build -o stub-idp . && ./stub-idp` (in /private/tmp/mc-ba-flow-evidence/stub-idp) | 2026-10-30T16:2xZ | 0 | introspection stub, loopback 18099 |
| 4 | Build | `cd apps/backend && go build -o /private/tmp/mc-ba-flow-evidence/mcapi ./cmd/mcapi` | 2026-10-30T16:2xZ | 0 | go1.27.3 darwin/arm64 |
| 5 | Migrate+provision | `mcapi migrate`; `psql INSERT INTO users …` (5 synthetic users) | 2026-10-30T16:2xZ | 0 | migrations v9 incl. 0009 |
| 6 | Serve | `mcapi` with MC_* env from mode-600 scratch file (127.0.0.1:18081) | 2026-10-30T16:2xZ → | 0 | `/readyz` 200 |
| 7 | Backend suite | `MC_TEST_DATABASE_URL=… go test -race -count=1 ./...` > be-test-full.log | 2026-10-30T16:3xZ | 0 | all 14 packages ok, 0 FAIL (this window; r1 later recorded 5 B1 failures from the concurrent deploy session's files) |
| 8 | GW-01 | `zsh /private/tmp/mc-ba-flow-evidence/gw01.sh` (final pass) | 2026-10-31T15:3xZ | 0 | narrative + calls.jsonl |
| 9 | GW-02 | `zsh …/gw02.sh` | 2026-10-31T15:4xZ | 0 | idem |
| 10 | GW-03 | `zsh …/gw03.sh` (+ probes for Z-F-01/02, AC-145 refusal, signature guard) | 2026-10-31T15:5x–16:1xZ | 0 | idem |
| 11 | Traps 2 | `zsh …/traps2.sh` (bulk, >200, export escape, timezone, F15) | 2026-10-31T16:1xZ | 0 | idem |
| 12 | Manifest | `shasum -a 256` over 19 read/verified source files; dirty re-hash | 2026-10-31T16:4xZ | 0 | drift recorded in source-manifest.json |

HTTP traffic: 570 calls logged in `../r2/walkthrough-evidence/calls.jsonl` (5 synthetic bearer principals; every call carries UTC/actor/method/path/status).

Cleanup at close: `mcapi` and `stub-idp` processes stopped (SIGTERM); `docker rm -f mc-ba-flow-pg` (this attempt's own container; scratch files remain in /private/tmp/mc-ba-flow-evidence for reviewer inspection).
