# MC-P0-LOCAL-LOGIN-20261028

Owner: actual Local Codex. Status: RUNNING_WAITING_HUMAN_LOGIN. PO urgently requested a working local login-to-app instance, then confirmed a verified synthetic A account and human password entry. Browser use is disabled in Work settings; no alternate browser automation attempted.

Source: branch `codex/unified-project-flow`, HEAD `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`; post-RV001 manifest SHA256 `de8424ead1e9cd911c7a6fe124b48e5d67b6dcc9e519bb10a8b87453b05d4489`, 719 member bytes/hashes verified before snapshot, after build and before startup. Primary source unchanged by this runtime setup.

## Running instance

- Login: `http://localhost:3000/login`; product landing: `http://localhost:3000/workspaces`.
- REST API: `http://127.0.0.1:8081`.
- Issuer: existing ZITADEL Cloud development instance. Human signs in as synthetic A, subject `396984919567415686`; B also mapped, no memberships granted by seed.
- Private runtime root: `/private/tmp/mc-local-login-cij0dm22`; public-source frontend snapshot uses existing dependency directory via symlink; no private env/key copied.
- New synthetic product database: `mc_local_login_20261028t15261793175979z`; new object root under private runtime.
- Existing container `mc-p0-zcode-pg-product-test`, ID `4d09d047440d4f5d872b91f9169da1b092a061f2a29208316b88e229617e11e0`, labels `mc.role=product-test`, `mc.task=MC-P0-ZCODE-EXECUTION`, bound `127.0.0.1:55442`. It was stopped at inventory, then explicitly started through approved tool execution for this local-run request. Existing databases/volumes untouched; all other containers left stopped.

## Commands and observations

Driver `/private/tmp/mc-local-login-20261028.py`; state `/private/tmp/mc-local-login-20261028-state.json`, private files. Driver uses cached dependencies, private in-memory credential parsing, no secret in command argv/output; logs remain 0600 under private root. Commands invoked with RTK.

- `python3 <driver> build`: exit 0; `go build -o <private-root>/mcapi ./cmd/mcapi` exit 0; `node <snapshot>/node_modules/next/dist/bin/next build --webpack` exit 0.
- `python3 <driver> start`: exit 0; database absence checked before CREATE; migrations and Cloud A/B user seed exit 0. Credential inputs restricted to the previously allowed DB DSN file and Cloud API key; metadata/client checks performed without exporting values.
- API parent PID49103, listener49105; frontend parent49104, listener49106. Started at 2026-10-28T15:26:50Z; fresh elevated lsof confirmed both loopback listeners.
- Health `/healthz`: HTTP200, `{"status":"ok"}`.
- Login page: HTTP200.
- `/api/auth/session` before human login: `{"authenticated":false}`.
- `/api/auth/login`: HTTP307. No redirect query/state/cookie exported.
- Sandboxed localhost curls could not connect; approved elevated HTTP checks succeeded. This was sandbox network isolation, not server failure.

## Handoff and limits

Retain this instance for the human. Claude runtime assignment must first consume this receipt and current ownership, rather than creating a competing port3000/8081 stack or stopping this instance. Source review can proceed independently without lifecycle changes. Reverify process start/cwd/executable/listener before any future signal; no teardown performed.

Human was given the local login URL and asked to confirm arrival in the app. Successful authenticated token acceptance and rendered product landing remain WAITING_HUMAN_CONFIRMATION; 307/health checks do not establish them. Fresh database initially has users only; the first user creates a workspace/Matter through the product. No demo-mode auth bypass or anonymous REST access enabled.

Skipped: browser/IdP end-to-end acceptance, restore repeat, full QA, source edits, commit/push/deploy. Risks: process-memory sessions reset on restart; runtime depends on existing ZITADEL Cloud availability. No production/release gate closed.
