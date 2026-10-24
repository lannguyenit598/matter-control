# ADR-003 — Frontend Runtime and Cloudflare Adapter

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; frontend `3e5a642479acb789eb210e73fba956f3e85082e3` (Next 16.4.2, React 19.3.1, `cacheComponents`, `partialPrefetching`, Server Actions, `connection()`); Cloudflare Next.js (Aug 25 2026), OpenNext (Oct 12 2026), static Pages (Aug 25 2026), Workers limits (Oct 12 2026) snapshots.
- Status: **PROPOSED — UNRESOLVED / WAITING_PO_APPROVAL**. Compatibility of Next 16.4.2 `cacheComponents`/`partialPrefetching` with any Cloudflare adapter is **untested**. No migration to vinext or OpenNext is made.

## 1. Context

The frontend template is server-centric: Server Components fetch per request, Server Actions perform mutations through a server-only `backendRequest`, the session is resolved server-side. Cloudflare documentation recommends vinext (beta; reimplements Next.js API on Vite; asks users to run `vinext check`) and separately documents OpenNext (PPR and `"use cache"` listed as experimental features it supports; Node middleware unsupported). Workers Free gives 10 ms CPU per request; the limits page notes SSR/auth workloads typically use 10–20 ms, so SSR of a 200-row Control Room/Grid on Free risks Error 1102. Static assets are free and unlimited.

## 2. Options

| ID | Description | Preserves Server Actions / Atomic + features | Free-tier risk | Unknowns |
|---|---|---|---|---|
| F1 vinext on Workers | `vinext init`, deploy to Workers | Yes (claimed supported) | CPU per SSR request; beta maturity | `cacheComponents`, `partialPrefetching`, `connection()` parity |
| F2 OpenNext on Workers | `@opennextjs/cloudflare` build | Yes | Same CPU risk; experimental PPR | Next 16.4.2 support level |
| F3 Static export SPA | `output: 'export'` on Workers Static Assets or Pages; browser calls Go API with OIDC (PKCE) bearer tokens; Server Actions replaced by client feature services | Atomic Design and feature services kept; Server Actions, server session and PPR dropped | Lowest (static requests free) | Token handling in browser (XSS exposure), CORS on API, loss of server-only secret boundary |
| F4 Node server co-hosted with Go origin | `next start` beside Go (ADR-001 H1/H2) with Workers only as CDN/proxy | Fully | Not a Workers CPU concern | Same exception as H1 |

All options keep: Atomic Design layers, feature modules with Zod schemas and repository services, frontend non-authoritative for state, text-based state labels.

## 3. Decision criteria

Functional parity for Control Room/Grid (50–200 rows, keyboard), correct auth/session handling without shared tokens, CPU within Free limits under measured workload, build reproducibility, security headers/CSP, maturity risk.

## 4. Architect's assessment (not a decision)

F3 most plausibly fits $0/Free CPU but changes the template's server-side session and Server Action model and moves tokens into the browser; it needs a security review. Its minimum entry conditions are in security-architecture §6.1; they gate the PoC and are not a selection. F1/F2 preserve the template but have unmeasured CPU and compatibility risk. F4 couples to the ADR-001 H1 exception. Recommend deciding ADR-003 together with ADR-001 after PoCs.

## 5. Required PoCs

| PoC | Owner | Environment | Evidence |
|---|---|---|---|
| P-FE-1 Template build/test baseline | Antigravity | Local disposable checkout at pinned SHA | `pnpm install --frozen-lockfile`, typecheck, test, build, e2e logs |
| P-FE-2 vinext check + local Workers preview | Antigravity | Local `wrangler dev`, no deploy | Compatibility report; per-route CPU from local profiling |
| P-FE-3 OpenNext build + preview | Antigravity | Local | Same evidence |
| P-FE-4 Static export of a Control Room spike with client-side auth | Antigravity, OpenCode security review | Local | Feature parity notes; security-architecture §6.1 checklist (CSP without `'unsafe-inline'`, in-memory tokens, CORS allowlist); XSS review |

Remote CPU measurements on Cloudflare require a PO-approved deployment to a non-production Workers account; not authorized now.
