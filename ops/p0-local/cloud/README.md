# ZITADEL Cloud Free profile (synthetic development only)

Public identifiers only; the API key stays in `keys/396983916088540712.json` (0600, git-ignored by exact
path, never printed, hashed, copied or logged). Nothing here changes the local IdP profile, which stays
available for rollback. No production, billing, plan or Cloud-resource change is implied.

## Files

| File | Purpose |
|---|---|
| `backend.cloud.env` | API overlay (`MC_OIDC_*`). `MC_OIDC_API_CLIENT_ID` makes the API refuse a key that belongs to another application. |
| `frontend.cloud.env.local.example` | Copy to `apps/frontend/.env.local`. |
| `seed-cloud-users.sh` | Explicit, idempotent mapping of Cloud subjects A and B to new product users (users only: no memberships, no e-mail matching). |

## Start (from the repository root)

1. `docker start mc-p0-claude-pg` (task-owned run database `mc_p0_run`, `127.0.0.1:55440`).
2. Build the API once: `cd apps/backend && go build -o /tmp/mcapi ./cmd/mcapi`.
3. Export the overlay: `set -a; . ops/p0-local/secrets/claude-pg.env; . ops/p0-local/cloud/backend.cloud.env; set +a`, then
   `export MC_DATABASE_URL="postgres://mcp0:${POSTGRES_PASSWORD}@127.0.0.1:55440/mc_p0_run?sslmode=disable" MC_OBJECT_DIR=<private dir> MC_HTTP_ADDR=127.0.0.1:8081`.
4. `/tmp/mcapi migrate`, then `ops/p0-local/cloud/seed-cloud-users.sh`, then `/tmp/mcapi`.
5. `cp ops/p0-local/cloud/frontend.cloud.env.local.example apps/frontend/.env.local`; `cd apps/frontend && pnpm build && pnpm exec next start -p 3000`.

Stop: stop only the two processes you started (`lsof -nP -iTCP:8081 -sTCP:LISTEN`, `…:3000`); `docker stop mc-p0-claude-pg` keeps the data volume.
Rollback to the local IdP: remove `apps/frontend/.env.local`, use `apps/backend/.env.example` values and `ops/p0-local/seed-users.sh`.

## What was verified without a human login (2026-10-28)

* Key file: regular file, mode 0600, owner = operator, not a symlink; `clientId` equals the API client `396983864414715432` (checked privately; only the boolean was printed).
* API with this overlay starts; `/healthz` 200; no bearer → 401; a bogus bearer → 401 (Cloud introspection answered; the client assertion was accepted, otherwise the API reports unavailable).
* BFF `GET /api/auth/login` → 307 to `…/oauth/v2/authorize` with `client_id=396983754624613928`, `redirect_uri=http://localhost:3000/api/auth/callback`, `response_type=code`, `code_challenge_method=S256`, `state`, `nonce`, scope `openid profile email offline_access urn:zitadel:iam:org:project:id:396983669648046470:aud`, and an `HttpOnly; SameSite=Lax` 10-minute login cookie.
* The Cloud authorize endpoint accepted that request (302 to its hosted login UI): client id, redirect URI, PKCE and scope are registered. This does **not** prove a session, a token audience or a subject.

## What only a person can do (exact steps; the rows stay VERIFICATION_BLOCKED until then)

1. Open `http://localhost:3000/login` in a normal browser and sign in as synthetic user **A**. Expect to land on `/workspaces`. (If the Cloud hosted login asks for a password, only the operator enters it.)
2. The first call must succeed past authentication: `GET /api/auth/session` shows a signed-in session. If the API answers 401/403 with a valid session, the token audience differs from `MC_OIDC_AUDIENCE`: read `aud` of the access token **locally in the operator's browser devtools or a token inspector, never paste it anywhere**, and tell the architect which value to pin.
3. Subject check: in the run DB `select display_name from users where idp_subject = '<A subject>'` must be `cloud-synthetic-a`. If the real `sub` differs from the reported one, add a new mapping row; never relink by e-mail.
4. As A create a workspace and a matter, then grant B a matter role through the product (`/matters/<id>/members`). Sign out, sign in as B: B sees only that matter; B cannot see a matter A did not grant. Revoke B and reload: access is gone at once.
5. Refresh: leave the session until the access token expires (or shorten it in the Cloud console) and reload; the BFF must refresh without a new login. Logout: `POST /api/auth/logout`, then the session cookie no longer opens the API.
6. Unavailable: stop the API and reload; the page must say the service is unavailable, never an empty list.

Record only outcomes (pass/fail, status codes), never tokens, cookies, assertions or passwords.
