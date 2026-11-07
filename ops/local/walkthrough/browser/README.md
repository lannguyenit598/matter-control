# Browser walkthrough environment (E-2/E-4) — real-IdP login + fault injection

MC-ENABLE-E2-E4-20261107. This directory extends the CO-17 walkthrough env
(`ops/local/walkthrough/`, stub-IdP API-only, untouched) with the **real-browser
path**: ZITADEL Login UI → authorize → callback → session cookie → populated
product UI, plus loopback fault injection on the product API path.

## Components (all loopback-only)

| Piece | Where | Port |
|---|---|---|
| ZITADEL IdP stack | `ops/p0-local` compose project `mc-p0-idp` (retained data) | 8080 |
| Product run DB | container `mc-p0-claude-pg`, volume `mc-p0-claude-pgdata` (retained) | 55440 |
| `mcapi` backend | built from the tree; introspects tokens against ZITADEL | 8083 (direct) |
| `faultproxy` (E-4) | this dir `faultproxy/main.go`; mode-file controlled | 8082 (what the frontend calls) |
| Frontend | `next dev` (apps/frontend, `.env.local` → `API_BASE_URL=http://127.0.0.1:8082/api/v1`) | 3000 |

The frontend `.env.local` already targets :8082, so the proxy is transparently in
the product API path; `down.sh`/`up.sh` never touch product files. State (pidfiles,
logs, fault-mode file, constructed `mcapi.env`, object store) lives in a 0700 dir
outside git (`$TMPDIR/mc-browser-walkthrough`, override `MC_BW_STATE_DIR`) and is
destroyed at teardown.

## Commands

```sh
./up.sh                 # full env up + readiness checks (idempotent per component)
./browser-check.sh      # E-2 verification: Playwright (channel:'chrome') login BOTH
                        # seeded users → session cookie → populated /workspaces
                        # screenshots + timings into the task evidence dir
./seed-browser.mjs      # seed walkthrough data THROUGH THE UI as mc-alice (workspace,
                        # 3 matters, mc-bob as workspace Member) — idempotent
./fault-5xx.sh [code]   # E-4: inject 5xx on the API path (default 503).  Inverse: ./fault-restore.sh
./fault-latency.sh [ms] # E-4: inject added latency (default 2000).       Inverse: ./fault-restore.sh
./fault-demo.mjs        # E-4: demonstrate every fault once (UI screenshots + API probes)
./api-stop.sh           # E-4: stop the backend cleanly.                 Inverse: ./api-start.sh
./down.sh               # teardown: pidfile-owned kills only, containers stopped
                        # (volumes retained), state destroyed, orphan check
```

Playwright comes from the machine's global npm root (no dependency is added to the
repo); `channel:'chrome'` uses the installed Google Chrome. Credentials are read at
runtime from `ops/p0-local/secrets/test-users.json` (0600, never printed/committed).

## Login facts (r1-verified)

- Login name: the **plain username** (`mc-alice`, `mc-bob`). The `@localhost` form is
  REJECTED by this profile ("User not found in the system"); the email form likewise.
- Callback: `http://localhost:3000/api/auth/callback` — registered in the web app
  (see the erratum in `ops/p0-local/README.md`: the 2026-10-27 "redirect_uri missing"
  finding is stale; authorize redirects to the Login UI as of 2026-11-07).
- Backend token check: introspection (RFC 7662, `private_key_jwt` client assertion)
  with `MC_OIDC_AUDIENCE` = the ZITADEL **project id** `396855005832806403`; populated
  pages render only when the strict verifier accepts the token, which is the runtime
  confirmation of the audience contract (project id in `aud` via the
  `urn:zitadel:iam:org:project:id:{id}:aud` scope).
- People search (member picker) needs the dev-only `MC_LOCAL_PEOPLE_DIRECTORY=true`
  (set in the constructed env; production keeps it off).

## Seeded walkthrough data (synthetic)

Workspace `Walkthrough WS (synthetic)` — mc-alice Owner, mc-bob Member; matters
M1/M2/M3 (one duplicated M1 row exists from a rerun; synthetic, harmless). Matter
level access is granted separately from workspace membership (product rule shown in
the UI); matter-level grants for mc-bob are NOT seeded here.

## What this env proves / does NOT prove

Proves: real-browser OIDC login for both seeded users, server-side session cookie,
strict backend token verification, populated product surfaces, fault visibility
(5xx/latency/API-down) with clean inverses, clean teardown.

Does NOT prove: IdP hardening, production behavior, $0 bill, TLS/multi-tenant
posture, matter-level two-actor flows (G1 verifier path still needs its own grants),
and the D-1(b) measures (V-01..V-14, D-23 on-dialog) are only RUNNABLE here — done
by their own sessions.
