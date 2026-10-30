# Runtime handoff (Claude-owned local runtime)

- UTC of swap: 2026-10-29T08:33Z. Web `http://localhost:3000` (`next dev`, unchanged, owned by me). API `http://127.0.0.1:8081` (API base `/api/v1`). Chromium (Playwright, CDP 9333) signed in as synthetic user A.
- API binary: built from the verified source into my private scratchpad (`mcapi-new`, 43,696,690 bytes, sha256 `f33bf70099b46138c46b380cc8dae5443b376e2feb0e9accc511cad9eb3a0058`); the previous binary (sha256 `4c7a893c…49e`) predated Codex's corrections and was stopped with SIGTERM (graceful stop logged) — only the process I started.
- Configuration: same approved DB (`mc_p0_run` on the retained `mc-p0-claude-pg`, loopback 55440), same object directory (private scratchpad, `fs`), same ZITADEL Cloud overlay (issuer, audience, API key file) read from private files; added `MC_TRANSFER_TIMEOUT=60s`. No migration was run (none pending: the API started). No secret was printed.
- Observed: `/healthz` 200; `/readyz` `{"status":"ready"}` 200; `/api/v1/me/actions` without a bearer 401; authenticated pages kept working after the swap.
- Not exercised on the retained runtime (by design): DB-down/recovery, graceful drain under load.
- Dev web build identity: `next dev` serves the current source tree, which includes Codex's concurrent UI edits; production build `pnpm build` passed on the same tree (see `../claude-eigenwelt-features-r1/receipts/`).
- Stop (safe): kill only the API process listening on 127.0.0.1:8081 whose executable is the scratchpad `mcapi-new`, and `next dev -p 3000` started from `apps/frontend`; containers started earlier can be stopped with `docker stop` (volumes retained).
