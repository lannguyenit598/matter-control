# ADR-006 local readiness candidate

Owner: actual Local Codex. This is a source and local-test candidate, not deployment approval. Historical ADR-006 and ZCode evidence remain unchanged. Current results are in `docs/testing/codex-adr006-remediation-20261030-r1/`.

## Selected local Worker profile

OpenNext Cloudflare 1.20.14 with Wrangler 4.156.0 builds the existing Next.js 16.4.2 application. `pnpm build:worker` selects `MC_WORKER_BUILD=1`: dynamic SSR with `cacheComponents=false` and `partialPrefetching=false`. The normal Node profile retains both settings. The full Cache Components profile builds but hangs during authenticated Workspace rendering in local workerd; it is not certified compatible. No application `use cache` surface was introduced to hide that failure.

The isolated vinext 1.4.0 comparison completed compatibility analysis and a Vite build after its generated configuration dependencies were pinned. That is build evidence only; no vinext runtime acceptance is claimed. OpenNext is the implemented candidate because its actual local Worker path passed authentication, restart, API and file probes.

The shared-checkout Turbopack process encountered a compiler port-binding permission error. The exact source was copied without `.env` files, secrets or shared dependency links into `/private/tmp/mc-codex-adapter-poc/opennext`; the final `pnpm build:worker` completed there. Shared-checkout Webpack build results are recorded separately. This is not a cloud deployment.

## Private durable BFF state

The Node/local default remains `BFF_STATE_BACKEND=memory`. For the Worker candidate set `BFF_STATE_BACKEND=postgres`; an invalid or unavailable durable profile returns unavailable rather than falling back to memory. Cookies contain opaque handles only. PKCE, tokens and pending command payloads remain server-side, sealed using AES-256-GCM with the row key as authenticated data.

Apply `bff-state.sql` once with a separate migration identity to an approved database. Give a dedicated BFF login role only schema `USAGE` and table `SELECT, INSERT, UPDATE, DELETE` on `mc_bff.state`; do not grant ownership, schema `CREATE`, product-table access or Data API access. No account or provider grants are created by this script. The local tests use an explicitly guarded disposable database named `mc_fixture`, never an existing application database.

Runtime bindings:

| Name | Meaning |
| --- | --- |
| `BFF_DATABASE_URL` | Dedicated BFF role, session-compatible PostgreSQL connection. Remote URLs require `sslmode=verify-full`; transaction pooling has not been qualified. |
| `BFF_DATABASE_CA` | Optional trusted CA PEM; certificate and hostname verification remain enabled. |
| `BFF_STATE_KEY_ID` | Active key version, 1–32 ASCII letters/digits/underscore/hyphen. |
| `BFF_STATE_KEYS` | JSON map of key versions to independent base64-encoded 32-byte encryption keys. Never a public environment variable. |
| `APP_ORIGIN` | Exact frontend origin matching the IdP callback and Server Action origin boundary. |
| `SESSION_COOKIE_SECURE` | `true` for HTTPS. `false` is only for plain-HTTP loopback preview. |

Use secret bindings for deployed secrets. For local preview only, copy `.dev.vars.example` to gitignored `.dev.vars`, set mode0600 and supply synthetic values. Never put tokens, passwords, database URLs or encryption keys in build-time `.env` files: OpenNext can embed their defaults. The build wrapper rejects active secret assignments by key name, does not print values, and filters runtime-secret environment keys from its child. Keep JSON values single-quoted in `.dev.vars`.

The store opens one PostgreSQL connection per transaction using pg's native `node:net` Socket under `nodejs_compat`, not a socket shared between Worker requests. The default pg-cloudflare socket produced unhandled close errors in the experiment. Advisory transaction locks, statement/query/connection timeouts and verified TLS apply to the native path. Real Supabase network/TLS/connection-budget qualification is still required.

Absolute and idle expiry are enforced on reads. Logout removes the session and child attempts under the same lock. Rotating refresh tokens are claimed durably before contacting the IdP; concurrent clients cannot send them twice. A transport-unknown result or crashed claim cannot silently reuse the refresh token. An already expired access token without a refresh token requires sign-in again. A late refresh cannot resurrect a logged-out session.

Pending transfers retain the same command keys and frozen content across store instances. A 90-second dispatch lease can be reopened only by an explicit retry; a previous dispatcher cannot settle a newer execution. Complete results remain until matching acknowledgement. Access loss purges protected content and leaves a refusal marker. This is correctness coordination, not an automatic retry scheduler.

## Bounds, cleanup and rotation

There are at most two attempt slots per session. Each sealed JSON value is capped at 36 MiB, accommodating the local near-25 MiB binary regression after base64 encoding. This candidate stores encrypted pending import bytes in PostgreSQL rather than implementing the earlier proposed R2-reference design. Worker Free CPU, memory, database size and latency for large **pending imports** remain unproven; the separate streamed document upload test does not close that gap. Do not activate a large-import cloud workload on the strength of the local byte-equality test.

Expired rows are inaccessible but physically retained. A bounded operator cleanup/retention job remains required before deployment; no retention policy or receipt-purge exception was invented here. Rotate by adding a new key version, switching `BFF_STATE_KEY_ID`, and keeping prior versions available until all affected rows expire or are deliberately invalidated. Removing an old key early invalidates those sessions/attempts; do not silently do so while commands have unknown outcomes.

## Dependencies and limits

`pg` 8.23.1 supplies PostgreSQL protocol/TLS/parameterization; Node has no built-in PostgreSQL client, and a handwritten protocol would be a larger security surface. `@types/pg` 8.23.1 is compile-only. OpenNext and Wrangler are build/local-runtime tools; no second UI or HTTP library was added. Exact peer, production audit and frozen-lockfile checks are recorded with the delivery. Build sizes are measured in `bundle-measurements.json`, not treated as a Worker Free quota PASS.

pnpm's supported approval enabled only `workerd` in the repository allowlist. Installation also recorded exact minimum-release-age exceptions for `wrangler@4.156.0` and `miniflare@5.20261023.3-beta`; these are disclosed dependency-policy changes, not a global bypass. Other existing build-script policies remain unchanged.

Still open: independent security review; rendered/browser/accessibility acceptance; real ZITADEL login/refresh/logout; Supabase least-privilege/TLS/Data API negatives; private R2 and cross-provider recovery; public-origin Server Actions; quotas/cost/residency and provider configuration. B1 production grants and B2 secondary-index migration remain explicit deployment/approval work. No cloud mutation, production credential access, release approval, commit or push is included.
