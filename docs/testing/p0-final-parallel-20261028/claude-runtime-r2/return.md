# MC-P0-CLAUDE-BROWSER-IDP-RESTORE-R2: execution return

**Identity:** actual Claude Code (Anthropic), model `claude-sonnet-5-5`, local CLI session; Go 1.27.3, Node 24.22.1, pnpm 11, Postgres 17.10 in the containers (Docker client version not re-recorded in this run). I did not change provider or model.
**Status:** `AUTHOR_RUNTIME_VERIFICATION`. I wrote part of this source (draft/access-loss, import preview mapping, RV-001), so none of this is independent source acceptance.
**Branch / HEAD:** `codex/unified-project-flow` at `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`; no stage, commit, push, deploy, install or source edit by me.
**Proposed status:** `IN_REVIEW_WITH_VERIFICATION_BLOCKERS`. No independent PASS, no MC-002 DONE, no production, release, cost or Cloudflare approval.

## Verdict per part

| Part | Result |
|---|---|
| B. Restore on the new candidate | **PASS_LOCAL_SYNTHETIC** (author-run; exit 0; all acceptance checks) |
| A2. Owned REST runtime, build and negative probes | **PASS** for 21 cases; build of the pinned snapshot OK with Turbopack |
| A3/A4. ZITADEL Cloud human login, A/B isolation, real token | **BLOCKED_EMAIL_VERIFICATION** (not re-attempted) and port 3000 held by an unowned runtime |
| A5. Refresh / expiry / logout / outage | **BLOCKED** (needs a real session) |
| A6. Browser: RV-001 Back link, R9 desktop/mobile/keyboard, Golden Workflows | **BLOCKED_BROWSER_TOOL_UNAVAILABLE** |
| A7. CR-002 observation | **BLOCKED** (needs a session); remains `DECISION_REQUIRED` |
| AC-137 | **AWAITING_HUMAN_TRIAL** (protocol already prepared under `ui/`; no participant contacted) |
| New finding: Webpack build leaves Tailwind uncompiled | **FAIL, P2, `CHANGES_REQUIRED`** |
| Source freeze | **VIOLATED by an unidentified writer** during this run (not me) |

## Source pins

| | Opening (2026-10-28T15:34:41Z) | Closing (15:42:45Z) |
|---|---|---|
| Candidate manifest `de8424ea…4489`, 719 entries | 719/719 match | **717/719**: `apps/frontend/package.json` and `apps/frontend/pnpm-lock.yaml` changed |
| Delta `38e9eb4f…3b54`, contract `814c4192…4e30`, R9 manifest `2b68bc92…7563` | match | match |
| Restore scripts `run.sh 8e4af211…`, `verify.py 93e21772…`, `test_verify.py 80d8c5ed…` | match | match |

**Drift (resources/source-drift.json):** `package.json` (15:37:15Z) gains a `build` that runs `scripts/check-built-css.mjs`, a `build:webpack` script and `@tailwindcss/postcss 4.3.3`; `pnpm-lock.yaml` (15:36:42Z) follows; new untracked `postcss.config.mjs` and `scripts/check-built-css.mjs` (15:39:20Z); `next.config.ts` touched (15:35:37Z) with unchanged content. The HEAD blobs of the two changed files equal their pinned hashes, so I built everything from the pinned bytes and excluded the new files. I did not touch, revert or re-pin any of it. Whoever is editing needs to tell Codex/OpenCode that the manifest under review no longer matches the tree.

## B. Restore (fresh run `20261028T153536Z`, restore/)

- Pure checker 9/9 OK, `bash -n run.sh` OK.
- **Applicability:** against the old 714-entry manifest, backend changed in two files (`brief_replay.go`, `brief_replay_test.go`) plus a new `.env.example`; the three ops scripts are unchanged. The earlier PASS therefore does not carry over automatically; this run is a fresh test of the current backend (`TestRestoreRehearsal` compiles from `apps/backend`). Frontend was not restored and nothing here covers it.
- Containers verified before the run: product-test `4d09d047440d…` (127.0.0.1:55442) and restore-target `3c207de99a03…` (127.0.0.1:55443), distinct IDs and distinct clusters (the script refuses otherwise). **Restore-target was Exited because I stopped it earlier at your pause request; you explicitly approved `docker start` (15:35:05Z).**
- `rtk proxy bash ops/p0-local/restore-rehearsal/run.sh`: **exit 0**, 15:35:36Z-15:36:07Z (31 s).
- Measured, not hard-coded: **54 Matters** (census), 34 tables (census identical, 0-byte diff), 3 objects (identical), boundary `last event 2026-10-28 15:35:48Z, seq-sum 12408`.
- Marker source **1**, restored **0**. Readback restored vs source-at-B: no missing, unexpected or differing Matters, counters match, 0 object failures; readback after a fresh process identical.
- Corrupt archive: `pg_restore` exit 1, 0 tables left; truncated: exit 1, 0 tables left. Altered object: readback exit 1 (detected). Missing object: exit 0 but output differs (detected through comparison, not by a service exit).
- Archive 241,230 bytes, SHA-256 `ef18448f…f404`; dump 0.238 s, restore 0.179 s. Local timings, no RPO/RTO claim.
- New DBs `mc_rr_src_/dst_20261028t153536z` and work root `/private/tmp/mc-p0-r2-restore-20261028T153536Z` are retained for QA; old runs untouched. `mc_p0_run`, native 55441, the IdP and the Cloud runtime DB were not used.

## A. Runtime, IdP and browser

**Runtime identity.** The retained Codex Cloud runtime (pids 40126 and 40096) no longer exists: **I terminated it earlier in this session at your request** (and stopped all `mc-p0-*` containers), so the R1 ledger line "runtime retained" is now false. A different runtime from `/private/tmp/mc-local-login-cij0dm22` (mcapi pid 49105 on :8081, next-server on :3000, restarted at 22:40:44 local) appeared at 22:26:50 local and was never handed to me: I did not signal, reuse or call it. Because :3000 is the only origin the Cloud web app accepts, hosted login cannot complete from a runtime of mine.

**Owned non-callback runtime (resources/owned-runtime.json).** Pinned Go API built to a private path, fresh database `mc_r2_20261028t153728z` on product-test migrated to v7, API on 127.0.0.1:8084 (pid 62449). Frontend snapshot of the 478 pinned public files (no `.env*`), `node_modules` cloned with `cp -Rc`, Turbopack build, `next start` on 127.0.0.1:3104 (pid 65851), `API_MODE=rest`, Cloud issuer, `APP_ORIGIN` = the bound port. Both stopped afterwards; database kept.

**HTTP probes (idp/http-negative-probes.json), 21 PASS:** health and ready 200; no bearer 401 `urn:mc:unauthenticated`; a bogus bearer 401 (the API called Cloud introspection with its app assertion); signed-out BFF session `authenticated:false`; `/login` 200; 12 product routes show "Sign-in required"; callback with no parameters and with an unbound state redirect to denied/invalid; `/api/auth/login` redirects to the Cloud authorize endpoint with the right client, S256, `response_type=code`, state and nonce (redirect URI is the unregistered :3104, nothing followed). Five RV-001 cases are **NOT_OBSERVABLE**: my probe was wrong (the `matters/[matterId]` layout swaps in its own sign-in screen before the work-item page runs), so they say nothing about RV-001; I first logged them as FAIL and corrected that.

**Finding R2-CSS-02 (P2, `CHANGES_REQUIRED`).** The pinned candidate built with `next build --webpack` emits a 25,313-byte CSS containing raw `@theme` and none of `.flex`, `.sr-only`, `.bg-background`: Tailwind is not compiled. Built with Turbopack (what `pnpm build` does) it emits 41,045 bytes with all three utilities and no raw directives. Consequence: any Webpack-built runtime, including the earlier Cloud runtime, serves an unstyled UI, and my own earlier `frontend-webpack` gates proved compilation only, not styling. The unowned edit described above appears to be fixing exactly this.

**Browser.** Not run. The official tool (cmux-cua) reports Accessibility true, Screen Recording false and "Computer Use onboarding is still in progress"; the UI handoff forbids headless or other browsers as a workaround, so I used none. `browser/cases.json` carries the 25 earlier cases (24 marked blocked here, their earlier source-level PASS not carried forward, and the AC-137 case awaiting a human trial) plus R2-RV001-BACK, R2-CR002-OBS and R2-GW-01..03 with exact steps. RV-001 itself stands on the unit evidence in `claude-rv001-fix` (13 red to 90 green, real `paths.ts` executed).

## Deviations by me
1. **Unintended dependency install.** `pnpm exec next build` inside the snapshot made pnpm 11 run its pre-script install through the `node_modules` symlink (about 15:37:43Z-15:37:49Z). It failed ("workspace hoist directory is not a real directory") but re-linked parts of the real `apps/frontend/node_modules`. Checked afterwards: Next 16.4.2 resolves, `.bin/next` exists, 0 dangling top-level links, `@tailwindcss/postcss` present; no source file was written by it. I then stopped using pnpm and ran `next` directly.
2. A shell word-splitting slip in the first build left `API_MODE` invalid; both attempts are kept in `resources/fe-snapshot-build.log`.
3. Earlier in this session I created `apps/frontend/.env.local` (gitignored, public ids, local ZITADEL, `APP_ORIGIN` :3000). It is outside the manifest and was not copied into the snapshot.

## Privacy
Credentials used only through the allowlist: `dsns.env` was sourced inside the pinned `run.sh` and my in-memory launcher; the API key file was passed as a path to the owned `mcapi` only. Nothing was printed, hashed or exported. Scan of the 41 files in this namespace (resources/secret-scan.json): no actual DSN or password, no DSN-with-credentials, private-key block, JWT, session cookie or bearer token. Raw logs are private (0700/0600).

## Skipped / not claimed
Everything in the blocked rows above; hosted login follow-up; real-token audience/subject; A/B isolation; refresh/expiry/logout; API outage; keyboard/focus/reflow/screen-reader; Golden Workflows through REST; frontend restore; production RPO/RTO. Per-child process telemetry inside `run.sh` was not captured (top-level argv, UTC and exit are).

## Exact human / next actions
1. Finish cmux Computer Use onboarding and grant Screen Recording (browser/RUNBOOK-unblock.md).
2. Release or hand over :3000 and :8081 (owner of `mc-local-login-cij0dm22`); do not kill it for me.
3. IdP administrator: verified synthetic accounts A/B through the normal flow, no verification bypass.
4. Codex: take the Webpack/Tailwind defect (R2-CSS-02) and the unowned `package.json` / lockfile / `postcss.config.mjs` edits, re-pin the manifest, and tell OpenCode its review target moved.
5. After 1-4: rerun the Cloud E2E, RV-001 Back link, CR-002 observation and Golden Workflows with the prepared cases.
6. Containers left running: restore-target (I started it) and product-test (not mine). Say if you want restore-target stopped again.
