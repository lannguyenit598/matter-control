# ops/p0-local — task-owned local ZITADEL profile (MC-P0-ZCODE-EXECUTION)

PO-selected local identity provider: **ZITADEL v4.16.0 self-hosted** (official `deploy/compose`
stack pairing: traefik v3.7.7 + `ghcr.io/zitadel/zitadel:v4.16.0` + `ghcr.io/zitadel/zitadel-login:v4.16.0`
+ `postgres:17.10-alpine`). Task-owned instance; synthetic data only; **every published port is
bound to 127.0.0.1** (verified via `lsof -nP -iTCP:8080 -sTCP:LISTEN`). No system hosts/DNS/proxy
change; no remote/cloud account; production identity remains unselected.

## Layout

| Path | Purpose |
|---|---|
| `prepare.sh` | One-time: generates all runtime secrets into `secrets/` (0600) and writes `.env` (0600) + `config/zitadel-config.yaml` (public key material only). Refuses to overwrite. |
| `docker-compose.yml` | The stack. New task-owned resources: compose project `mc-p0-idp`, volumes `mc-p0-idp-pgdata`, `mc-p0-idp-bootstrap`, network `mc-p0-idp-zitadel`. |
| `provision.sh` | First-time provisioning: waits for discovery, creates the admin human session via the bootstrap `login-client` PAT + Session API v2 password check, then Management API v1 REST. (The first run created one stray org; both strays were deleted via `DELETE /admin/v1/orgs/{id}` before the clean receipt below.) |
| `provision-continue.sh` | Completed the interrupted first run (API app with `authMethodType=API_AUTH_METHOD_TYPE_PRIVATE_KEY_JWT`, JSON key, test users) against the already-created org. Kept as execution evidence; do not rerun. |
| `secrets/` (0700, files 0600) | `system-user.pem` (RSA keypair for SystemAPIUsers config), `masterkey.txt`, `db-password.txt`, `admin-password.txt`, `login-cookie-secret.txt`, `provisioner-pat.txt` (login-client bootstrap PAT — task-owned instance only), `test-users.json` (synthetic alice/bob passwords). **Never printed, never committed, never reused from docs.** |
| `runtime/` (0700) | `provisioning.json` (pinned issuer/ids/audience), `mc-api-app-key.json` (0600 secret — API app key for introspection), `discovery.json`, `system-instances.json`. |
| `config/zitadel-config.yaml` | Mounted read-only into the API container: `SystemAPIUsers` with the bootstrap **public** key (instance-level operational reads only). |

## Pinned identity contract values (frozen in local-contract.md §8)

- Issuer: `http://localhost:8080`
- OIDC web app `mattercontrol-web`: Authorization Code + PKCE S256, redirects
  `http://localhost:3000/api/auth/callback` (+ `/dev`), post-logout `http://localhost:3000/`.
- API app `mattercontrol-api`: private_key_jwt auth; its `clientId` is the pinned MatterControl
  API audience for access-token checks; JSON key at `runtime/mc-api-app-key.json`.
- Test users: `mc-alice`, `mc-bob` (synthetic; passwords in `secrets/test-users.json`).

## Run / stop

- Start: `prepare.sh` (once) → `docker compose --env-file .env up -d --wait`
- Stop (retain data): `docker compose --env-file .env down`
- Teardown (task-owned only): `docker compose --env-file .env down -v` — removes only the
  `mc-p0-idp` project resources. Performed twice during bootstrap debugging before any product
  data existed; disposition recorded in the workboard. No other project's containers, volumes or
  networks are ever touched.

## Development-mode exceptions (isolated)

- Plain-HTTP OIDC on loopback (`ZITADEL_EXTERNALSECURE=false`): allowed **locally only**; the
  production cookie/HTTPS posture in `local-contract.md` §1 is unaffected and stays fail-closed.
- Login UI cookie secret and all DB/API credentials are runtime-generated (0600), never the
  documentation's sample values.

## Known bootstrap findings (for the record)

1. `POST /v2/sessions` requires an Authorization bearer (the Login app uses the bootstrap
   `login-client` PAT).
2. `FirstInstance.Org.Machine` cannot be provisioned through `ZITADEL_FIRSTINSTANCE_*` env vars
   nor through a `--config` file (the FirstInstance step config is loaded from a separate steps
   viper fed only by `--steps`, which `start-from-init` does not expose). Provisioning automation
   therefore uses the documented PAT + Session API route.
3. `AddAPIAppRequest` uses `authMethodType` (not `authMethod`); `AddOrg` returns `id`.
4. The ZITADEL API container is scratch-based (`docker exec … cat` unavailable) — use `docker cp`.

## Product run profile (added by the Claude continuation)

- Product run database `mc_p0_run` lives in the task-owned container `mc-p0-claude-pg` (`127.0.0.1:55440`, secret `secrets/claude-pg.env`, 0600). Seed product users with `./seed-users.sh` after `mcapi migrate` (idempotent; users only, never memberships; never the `*_test` databases).
- API: `mcapi` reads the `MC_*` variables in `apps/backend/.env.example`. Frontend: copy `apps/frontend/.env.local.example` to `.env.local`. Plain-HTTP local development uses unprefixed session cookies (`SESSION_COOKIE_SECURE=false`); production keeps `Secure` and the `__Host-` prefix.

### Open dependency: web application redirect URIs (needs admin-side correction)

Probe on 2026-10-27 (unauthenticated GETs to `/oauth/v2/authorize`, no credentials): client `396855005899980803` is known to ZITADEL, but **both** `http://localhost:3000/api/auth/callback` and `.../callback/dev` are answered with `invalid_request: The requested redirect_uri is missing in the client configuration`, although `runtime/provisioning.json` lists them (and `provision.sh` sets `devMode: true`). The effective application configuration therefore differs from the receipt. Fixing it needs the bootstrap/admin credentials, which are outside the takeover's permitted secrets, so it is reported rather than worked around. Until it is corrected, no human login can complete, with or without a browser.

### Open verification: token audience

The BFF requests the project-audience scope (`urn:zitadel:iam:org:project:id:<project>:aud`). ZITADEL adds the project id and the requesting client id to `aud`; the API application's client id (the value currently pinned in `MC_OIDC_AUDIENCE`) is **not guaranteed** to be there. The first permitted real login must record the actual `aud` of a user access token; the pin follows that observation (most likely the project id `396855005832806403`). The verifier stays strict meanwhile.

## Cloud profile and restore rehearsal (Claude continuation, 2026-10-28)

- `cloud/` — ZITADEL Cloud Free overlay, A/B product-user mapping script and the exact human-login steps (`cloud/README.md`). The local IdP profile above is untouched and remains the rollback.
- `restore-rehearsal/run.sh` — isolated whole-product restore rehearsal on a fresh database and object root (refuses an existing target; synthetic data only). Evidence: `docs/testing/p0-claude-finish-20261028/restore/`.

