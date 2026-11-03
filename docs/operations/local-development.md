# Local development

Use synthetic data and isolated databases/object roots. This guide describes configuration
inputs; it does not assume a previous operator's containers, accounts or private `/tmp` paths.

## Backend

Read [backend setup](../../apps/backend/README.md) and its [.env.example](../../apps/backend/.env.example).
Configure a dedicated PostgreSQL database, private object directory, canonical OIDC issuer,
introspection endpoint, expected API audience and API-app key file. Keep secrets in ignored
local files, restrict the key to mode 0600, and provision issuer/subject users explicitly.

From `apps/backend`, run `make check` for local gates, then `make run` after exporting the
configuration. `make run` migrates first. Production uses a separate migration job and runtime
identity. The default local listener is `127.0.0.1:8081`; health and ready probes do not require
a bearer token. PostgreSQL tests need `MC_TEST_DATABASE_URL` pointing to a disposable fixture.

## Frontend and login

Read [frontend setup](../../apps/frontend/README.md) and its [.env.example](../../apps/frontend/.env.example).
Use the pinned package manager/Node version, install from the lockfile in your own checkout,
and configure ignored `.env.local` for `API_MODE=rest`, the API base URL and the same issuer.
Register the exact OIDC redirect `http://localhost:3000/api/auth/callback` for local port 3000.
Use the configured web client and audience scopes; do not substitute an ID token as the API bearer.
The plain-HTTP insecure-cookie exception is loopback-only.

From `apps/frontend`, run `pnpm check`, `pnpm build:webpack` and `pnpm start`. Sign in through
`http://localhost:3000/login`; the operator enters passwords/codes only on the IdP page.
The product user must be explicitly mapped by issuer/subject and have the required memberships.
An unverified mailbox or absent mapping is an auth prerequisite, not permission to bypass checks.

Memory sessions expire on restart. For durable profiles use the documented PostgreSQL BFF
bindings and encryption keys. Stop only processes/containers you created or were handed over;
keep data volumes unless deletion was explicitly requested.

The [synthetic API walkthrough](../../ops/local/walkthrough/README.md) uses a loopback stub IdP.
It verifies backend operations without cloud accounts; it does not implement browser OIDC login.
