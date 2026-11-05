# ADR-004 B2 — frontend container image (r1)

Actual Claude Code (Sonnet 5.5). HEAD 20feedbf06c859a9806055d609f5b132fe8bb086. No commit, push, deploy, registry push, or cloud action.

## Change (3 files, all new or minimal)
- `apps/frontend/Dockerfile` (new): three stages on `node:24.22.1-slim` (engines allow ^24.22.1), `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm build` (includes the Tailwind CSS guard), runtime copies `.next/standalone`, `.next/static`, `public`; runs `node server.js` as user `node`, `PORT=8080`, `HOSTNAME=0.0.0.0`. No secret or env value baked in.
- `apps/frontend/.dockerignore` (new): excludes node_modules, .next, storybook-static, env files, git.
- `apps/frontend/next.config.ts`: `output: 'standalone'` (one line plus comment).

## Evidence (this directory)
- `docker-build.log`: build exit 0 (about 96 s cold). `image-inspect.txt`: 411 MB, user `node`, port 8080.
- `smoke.log`: demo mode: `/` -> 307 `/dashboard`, `/login` 200, CSP/X-Frame-Options/nosniff present, built CSS 200, uid 1000. REST mode without OIDC: logs "OIDC sign-in is not configured… all REST access is denied"; `/api/auth/session` -> `{"authenticated":false}`; upload without Origin -> 403; `/matters/m` shows the sign-in prompt and no matter content.
- `pnpm-check-run1.log`: exit 0, 64 files / 605 tests. `build-webpack.log`: exit 0, CSS guard pass.

## Not verified
- Not run on Cloud Run (port/PORT, cold start time, memory sizing, request timeout), not pushed to a registry, not run against a real ZITADEL, backend or R2. The image is arm64 from this machine's Docker; Cloud Run needs linux/amd64 (build with `--platform linux/amd64` in CI; not done here).
- Image is 411 MB: Artifact Registry free storage (about 0.5 GB **[recall]**) fits only a couple of tags; add the cleanup policy from the checklist.
- Still one instance only: sessions and unresolved Data attempts are in process memory (ADR-004 B1, accepted).
- Local test image removed after the run.
