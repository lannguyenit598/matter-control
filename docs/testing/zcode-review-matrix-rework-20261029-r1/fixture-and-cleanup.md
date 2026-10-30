# Fixture and cleanup evidence — MC-REVIEW-MATRIX-ZCODE-REWORK-20261029

All times 2026-10-29 local execution; commands via `rtk` prefix per workstation rules.

## PostgreSQL fixture (created, used, removed)

- Container: `mc-zcode-rework-pg-20261029-r1`, image `postgres:18.6-alpine` (cached, ID 898c60cb390d — same cached image the verifier used; no pull).
- Started with: `docker run -d --name mc-zcode-rework-pg-20261029-r1 --label mc.owner=MC-REVIEW-MATRIX-ZCODE-REWORK-ZCODE -e POSTGRES_PASSWORD=<random> -e POSTGRES_DB=mc_test -p 127.0.0.1:51977:5432 --cpus=1 --memory=512m --pids-limit=128 postgres:18.6-alpine` (loopback publish only; bounded CPU/memory/PIDs; default anonymous volume = private storage, not a 384MiB tmpfs).
- Credentials: `openssl rand -hex 24` written to `/private/tmp/mc-zcode-rework-pg-20261029-r1/pg-password` (0700 dir, 0600 file). Values never printed to logs, prompts or evidence.
- Ownership proof BEFORE `MC_TEST_DATABASE_URL` was set: label read back as `MC-REVIEW-MATRIX-ZCODE-REWORK-ZCODE`, port mapping read back as `5432/tcp -> 127.0.0.1:51977`, readiness probe `docker exec … pg_isready` → "accepting connections" (exit 0). The verifier's removed container, its old port 51866 and its DSN were not reused. No real-R2/AWS credential variables were present in any test environment.
- Usage: `MC_TEST_DATABASE_URL="postgres://postgres:<password>@127.0.0.1:51977/mc_test?sslmode=disable" make check` (exit 0) and one repeat `rtk go test -race -count=1 ./...` for exact counts (640 passed / 0 failed / 20 packages). Each contract test creates its own schema; retained `mc_p0_run` and login DBs were never addressed.
- Removal: label re-checked (`mc.owner=MC-REVIEW-MATRIX-ZCODE-REWORK-ZCODE`, exact match) then `docker rm -f -v` → removed; `docker ps -a` shows no `zcode-rework` containers afterwards.

## Scratch and secrets cleanup

- Private build tree `/private/tmp/mc-zcode-rework-build-20261029-r1` (source copy + APFS-cloned node_modules, ~685M) removed after both builds.
- Secrets directory `/private/tmp/mc-zcode-rework-pg-20261029-r1` removed after the container was destroyed (the credential had a single short-lived use).
- Privacy scan over `docs/testing/zcode-review-matrix-rework-20261029-r1/`: 0 occurrences of the fixture password; 0 occurrences of the DSN port 51977 (the port appears nowhere in evidence).

## Workspace cleanliness

- HEAD unchanged: `20feedbf06c859a9806055d609f5b132fe8bb086` on `codex/unified-project-flow`; no commit/push/merge/stash; `.next` untouched (a live dev server still holds `apps/frontend/.next/dev` — verified with lsof and worked around via the private build tree).
