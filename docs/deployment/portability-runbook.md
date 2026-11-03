# Portability runbook — selecting FE and BE targets (ADR-007)

Status: **reviewed templates, locally verified; nothing deployed.** Every command below that touches a provider requires separate PO authorization (see `portability-cloud-validation-packet.md`). Default target stays Workers + Cloud Run (ADR-006).

## 1. What is selected, and how

| Choice | Build | Artifact identity | Selection mechanism |
|---|---|---|---|
| FE = Cloudflare Worker | `cd apps/frontend && pnpm build:worker` | Worker version id from `wrangler versions upload` | `wrangler.jsonc` vars + `wrangler secret` bindings |
| FE = Firebase App Hosting | App Hosting rollout from the git-connected repo, root dir `apps/frontend` (adapter runs `npm run build`) | App Hosting build/rollout id + git commit | `apphosting.yaml` + `apphosting.<environment>.yaml` |
| BE = Cloud Run | `docker build apps/backend`, push once, use the **digest** | `…/mcapi@sha256:…` | `node ops/deploy/profiles.mjs cloud-run values.json out/` |
| BE = Compute Engine | same image digest | same digest | `node ops/deploy/profiles.mjs compute-engine values.json out/` |

FE and BE choices are independent: the FE only needs the BE's public `API_BASE_URL`. There is no `HOST_PROVIDER` variable; the builder and the rendered files are the selection. The renderer writes into a **new** directory, prints the follow-up commands, and executes nothing. Do not build both FE targets in one working tree for release: both builders write `.next/` (`docs/testing/claude-deployment-portability-20261030-r1/receipts/aba-markers.json`); use a clean CI checkout per target.

## 2. Environment and secret contract

Never put a secret in a `NEXT_PUBLIC_*` variable, a Worker build `.env*` file, the App Hosting console (always BUILD+RUNTIME), a values JSON, a template or a cookie.

### FE/BFF (both hosts)

| Variable | Class | Worker | App Hosting |
|---|---|---|---|
| `API_MODE=rest`, `AUTH_ALLOW_ANONYMOUS=false`, `SESSION_COOKIE_SECURE=true`, `BFF_STATE_BACKEND=postgres` | non-secret, fixed | `wrangler.jsonc` vars | `apphosting.yaml` (RUNTIME) |
| `API_BASE_URL` | non-secret per env | var | `apphosting.<env>.yaml` RUNTIME (base file holds the unroutable build placeholder) |
| `APP_ORIGIN`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_PROJECT_ID`, `BFF_STATE_KEY_ID` | non-secret per env | var | `apphosting.<env>.yaml` RUNTIME |
| `BFF_DATABASE_URL` (DML-only BFF role, `sslmode=verify-full`) | secret | `wrangler secret put` | Secret Manager ref, `availability: [RUNTIME]` |
| `BFF_STATE_KEYS` (JSON key ring) | secret | `wrangler secret put` | Secret Manager ref, RUNTIME |
| `BFF_DATABASE_CA` (if the provider CA is not in the trust store) | treated as secret by the build guard | secret | Secret Manager ref, RUNTIME |

App Hosting: grant the backend's service account access to each secret (`firebase apphosting:secrets:grantaccess`) — provider step, not run.

### BE (both hosts, same image)

| Variable | Cloud Run | VM |
|---|---|---|
| `MC_HTTP_ADDR` | `0.0.0.0:8080` (container port 8080) | `0.0.0.0:8081`, published on `127.0.0.1:8081` only, Caddy on 443 |
| `MC_OBJECT_BACKEND=r2`, `MC_R2_ENDPOINT`, `MC_R2_BUCKET` | env | `/etc/mattercontrol/mcapi.env` |
| `MC_OIDC_ISSUER/INTROSPECTION_URL/AUDIENCE/API_CLIENT_ID`, `MC_OIDC_CACHE_TTL=30s` | env | env file |
| `MC_DATABASE_URL`, `MC_R2_ACCESS_KEY_ID`, `MC_R2_SECRET_ACCESS_KEY` | `secretKeyRef` | fetched at boot into `/run/mattercontrol/mcapi-secrets.env` (tmpfs, 0600 root) |
| `MC_OIDC_API_KEY_FILE` | secret volume `/secrets/oidc/api-key.json` | `/run/mattercontrol/oidc/api-key.json` 0400 uid 65532, mounted read-only |
| `MC_MIGRATE_DATABASE_URL` | migrate job only | migrate unit only |
| `MC_SHUTDOWN_TIMEOUT` / stop budget | 8 s / platform 10 s | 65 s / `docker stop -t 75` |
| `MC_MAX_IN_FLIGHT` / concurrency | 10 / 10 | 10 |

Database budget: mcapi pool = 10 connections per instance (fixed in code) × instances; BFF = one short connection per state transaction × FE concurrency × FE instances. Fit both into the Supabase pooler/direct limits measured during provider qualification.

## 3. Operator procedure (after authorization)

1. Build and push the backend image once; record the digest.
2. Fill a values JSON (non-secret; secrets are Secret Manager names). Render: `node ops/deploy/profiles.mjs <cloud-run|compute-engine> values.json out-<target>/`. Review the output.
3. Apply `ops/adr006/bff-state.sql` and run product migrations with migration identities (Cloud Run job or `sudo systemctl start mcapi-migrate`).
4. Start the BE (Cloud Run `services replace` / VM with `user-data=cloud-init.yaml` on `cos-stable`, firewall tcp:80,443, DNS for the API hostname). Probe `https://<api>/api/v1/...` with a test identity; `/healthz`, `/readyz` are not public.
5. Point the FE at the BE: set `API_BASE_URL`, deploy the FE (Worker version / App Hosting rollout).
6. Verify with the local probe set adapted to the public origin (sign-in, SSR, Server Action origin, upload/download SHA, forbidden, revoked within 30 s TTL, logout).

## 4. Switching and compatibility

| Switch | Keeps sessions? | Requirement |
|---|---|---|
| Worker ↔ App Hosting, **same public origin** | Yes (verified locally) | Same `BFF_DATABASE_URL` database, same `BFF_STATE_KEYS` ring, same `OIDC_ISSUER`/`OIDC_CLIENT_ID`/`APP_ORIGIN` |
| Any FE change with a **different origin**, issuer or client id | No — controlled re-login (verified) | Register the new redirect URI in ZITADEL first |
| Cloud Run ↔ VM | Yes: BE is stateless; FE only changes `API_BASE_URL` | Same database, R2 bucket, issuer/audience |
| Open pages during an FE switch | Server Actions from the old build fail without a write (verified 409); the user reloads | — |
| Key rotation | Add a new key id, switch `BFF_STATE_KEY_ID`, keep old ids until their rows expire | Removing an old key logs those users out |

Never run two FE builds behind one origin outside the provider's own rollout. In-flight transfers interrupted by a switch end in UNKNOWN and are recovered by the existing idempotent retry (same command key).

## 5. Rollback

- FE: Worker → `wrangler rollback <previous version>`; App Hosting → roll back to the previous rollout; or repoint DNS to the previous FE host (same origin keeps sessions).
- BE: Cloud Run → route traffic to the previous revision; VM → rewrite `IMAGE` to the previous digest and `systemctl restart mcapi`; or set the FE `API_BASE_URL` back to the previous BE.
- Schema: expand/contract only; never roll a migration back in place.
- Retain the previous Worker version, App Hosting rollout, Cloud Run revision and VM image digest until the new target passes step 6.

## 6. Known constraints

- App Hosting: git-connected deploys only (the adapter bundles every app-root file, including local secret files); Next.js 16.4.2 is in App Hosting **preview** support; pnpm 12 on the buildpack unverified; Blaze plan required.
- Worker: Cache Components/partial prefetching off; Worker Free CPU/body limits for 25 MiB transfers unmeasured on the real platform.
- VM: Singapore VM is not free tier; operator owns patch reboots, TLS issuance, firewall, journald retention and Secret Manager IAM.
- `apps/frontend/Dockerfile` (plain Node container) is not one of the four targets; its "one instance only" comment predates durable state.
