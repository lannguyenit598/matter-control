# MC-002-FE-AUDIT: Step 02.1 Frontend Technical Owner Source-Only Audit

**Author / Identity:** Antigravity (Frontend Technical Owner)  
**Execution Context:** Source-Only Inspection; Pairing Environment (Google DeepMind Antigravity CLI)  
**Governance Snapshot:** `governance@2000d9435a7a3d405cb89e92ea72610f09b1f1cf`  
**Frontend Snapshot:** `frontend@3e5a642479acb789eb210e73fba956f3e85082e3`  
**Execution Gate Status:** `SOURCE_AUDIT_COMPLETED` | `RUNTIME_PO_C_NOT_RUN` | `STEP_02_NOT_PASSED`

---

## 1. Task Acknowledgement & Inspected Scope

As frontend technical owner, I acknowledge the Step 02.1 audit mandate for MatterControl (MC-002). This evaluation is strictly a **source-only architectural and static dependency audit** of the supplied snapshots.

- **Inspected Files:**
  - Governance / ADR: `docs/ai-sdlc/step-02-local-approval.md`, `docs/architecture/adr/ADR-003-frontend-runtime.md`, `docs/architecture/repository-audit.md`.
  - Frontend Core & Config: `frontend/AGENTS.md`, `frontend/package.json`, `frontend/next.config.ts`, `frontend/.env.example`.
  - Auth & Networking: `frontend/src/lib/auth-provider.ts`, `frontend/src/lib/auth.ts`, `frontend/src/lib/api/backend.ts`, `frontend/docs/api-integration.md`.
  - Domain & Repository: `frontend/src/features/tasks/services/task-repository.ts`, `frontend/src/features/tasks/services/rest-task-repository.ts`.
  - Tooling & E2E: `frontend/playwright.config.ts`.
- **Operating Boundary:** Zero executions, zero tool calls, zero background commands, zero file system mutations, and zero credential acquisitions were performed. All builds, tests, installations, and runtime validations remain **`NOT_RUN`**.

---

## 2. Framework, Runtime, Routing, and Cache Architecture

Based on static analysis of `frontend/package.json`, `frontend/next.config.ts`, and `frontend/AGENTS.md`:

- **Framework & Core Libraries:**
  - Next.js: `16.4.2` (App Router)
  - React / React DOM: `19.3.1`
  - TypeScript: `~5.9.3`
  - Tailwind CSS: `^4.3.3` (with `@tailwindcss/turbopack` and `@tailwindcss/vite`)
  - Package Manager: `pnpm@12.11.2`
  - Node Engine Constraint: `^22.23.4 || ^24.22.1 || >=26.12.1`
- **Routing & Rendering Architecture:**
  - Server-First App Router: Server Components by default; `'use client'` strictly restricted to interactive leaves (`AGENTS.md` R-NX-2/3).
  - Dynamic request boundaries utilize `connection()` and `<Suspense>` wrappers before session or data resolution (e.g., `src/app/(app)/dashboard/page.tsx:31`).
  - Mutations execute via React Server Actions starting with `requireSession()` and Zod input parsing (`AGENTS.md` R-SEC-1).
- **Caching & Pre-rendering Configuration (`next.config.ts`):**
  - `cacheComponents: true`: Next.js 16 explicit component caching model using `"use cache"`.
  - `partialPrefetching: true`: Partial Prerendering (PPR) combining static shells with streaming dynamic holes.
  - Turbopack CSS loaders configured for Tailwind v4.
  - Security Headers: CSP configured without nonces (due to PPR incompatibility; nonces force dynamic renders on static segments). Script execution allows `'self'` and `'unsafe-inline'` for theme hydration; frame ancestors set to `'none'`.

---

## 3. Atomic Design & Feature Module Discipline

`frontend/AGENTS.md` specifies a strict four-tier unidirectional import hierarchy:
1. `src/app/`: Page composition and route handlers.
2. `src/features/<feature>/`: Isolated business domains (schemas, actions, services, view components).
3. `src/components/`: Domain-free Atomic Design UI system (`atoms/`, `molecules/`, `organisms/`, `templates/`). Strictly forbidden from importing business entities or features.
4. `src/lib/`: Low-level technical utilities (HTTP client, environment schemas, session abstractions).

Cross-feature coupling is prohibited. State management is non-authoritative on the client; authoritative state remains upstream.

---

## 4. Auth, Session, and Environment Boundaries

The template runtime implements a strict **fail-closed** authorization design in REST mode:

- **Session Contract (`src/lib/auth.ts`, `src/lib/auth-provider.ts`):**
  - Session shape: `{ userId: string, permissions: readonly string[], accessToken?: string }`.
  - `resolveSession()` in `src/lib/auth-provider.ts` unconditionally logs a warning and returns `null`.
  - In `API_MODE=rest`, every Server Component reading protected data and every Server Action executing mutations invokes `requireSession()`, throwing `AuthError('unauthenticated')`.
  - `AUTH_ALLOW_ANONYMOUS`: Defaults to `false`. If enabled, it injects `ANONYMOUS_SESSION` (`permissions: ['*']`), which bypasses local checks. This is explicitly labeled a high-risk escape hatch.
- **Backend Dispatch Gate (`src/lib/api/backend.ts`):**
  - `backendRequest()` runs server-side only (`import 'server-only'`).
  - Enforces `API_MODE === 'rest'` and calls `requireSession()` prior to outbound dispatch.
  - Injects `Authorization: Bearer <token>`, prioritizing `session.accessToken` over the shared `serverEnv.API_TOKEN`.

---

## 5. Concrete Integration Mismatches against Native Go User API

Comparing the frontend snapshot against the backend inventory in `docs/architecture/repository-audit.md` reveals severe architectural mismatches:

| Dimension | Frontend Template Snapshot (`nextjs-atomic-starter`) | Native Go Backend (`go-hexa-template`) | Integration Mismatch Analysis |
|---|---|---|---|
| **Domain Resource** | `/tasks`, `/tasks/stats`, `/tasks/:id` (`rest-task-repository.ts:24-52`) | `/api/v1/users`, `queries/users.sql` (`cmd/userapi/main.go`) | **Total Domain Incoherence.** The template assumes a Task tracking resource. The Go backend only provides User management. `/tasks` is not `/api/v1/users`. |
| **Auth Middleware** | Frontend expects backend Bearer auth via forwarded user token or service token (`backend.ts:25`). | Inbound HTTP adapter explicitly has no authentication middleware (`httpapi/server.go:34`). | **Auth Gap.** Go template has zero JWT/OIDC validation, tenant extraction, or RBAC guards. |
| **Response Contract** | Expects `{ items: Task[], total, page, pageSize }` (`taskPageSchema`). | Emits raw Go user entities/arrays without task pagination envelopes. | **Schema Violation.** Direct requests will fail schema validation and trigger `ApiError(INVALID_RESPONSE)`. |
| **Identifier Typing** | URL paths restricted by `taskIdSchema` (`^[A-Za-z0-9_-]{1,100}$`). | Domain IDs depend on backend UUID/int representations. | **Validation Hazard.** Incompatible ID representations will abort at the frontend boundary. |

> [!CAUTION]
> **Do not equate `/tasks` with `/api/v1/users`.** Any attempt to alias user endpoints into task structures or enable `AUTH_ALLOW_ANONYMOUS=true` to fabricate end-to-end integration constitutes a critical architectural and security violation.

---

## 6. Browser / Demo vs. Real Backend Isolation Proof

Static proof from `frontend/docs/api-integration.md` and codebase wiring proves browser calls to the backend are structurally blocked:

```
[ Browser / Client Components ]
              │  (Server Actions / Next.js Route Handlers)
              ▼
[ Next.js Server Runtime (Node / Edge) ]
  ├── Server Components ──► Feature Repositories
  └── Server Actions     ──► backendRequest() [server-only]
                                   │  (HTTPS + Internal Auth Headers)
                                   ▼
                       [ Private Go Backend ]
```

1. **Network Boundary:** `src/lib/api/backend.ts` is guarded with `import 'server-only'`. It cannot be compiled into client bundles.
2. **Credential Secrecy:** `API_BASE_URL` and `API_TOKEN` are parsed in `serverEnv` (`src/lib/env.ts`) without the `NEXT_PUBLIC_` prefix. The client never receives backend URLs or service credentials.
3. **CSP Containment:** `next.config.ts` locks `default-src 'self'`. Browser `fetch()` calls to external backend ports or hosts are blocked by browser policy.
4. **Demo Store Separation:** `API_MODE=demo` resolves to `demoTaskRepository`, backed purely by an ephemeral in-memory structure in the Node runtime. It exercises zero network I/O and provides zero proof of backend compatibility.

---

## 7. Cloudflare Runtime Assumptions & Untested Areas (ADR-003)

ADR-003 evaluates deployment targets (F1 vinext, F2 OpenNext, F3 Static SPA, F4 Co-hosted Node) against Cloudflare Workers limits:

- **Experimental Primitives:** Next 16.4.2 features enabled in `next.config.ts` (`cacheComponents: true`, `partialPrefetching: true`) and dynamic headers/redirects have **untested compatibility** on Workers.
- **Workers Free CPU Exhaustion:** Workers Free provides 10 ms CPU per request. Standard SSR with session handling and complex React 19 component trees typically consumes 10–20 ms CPU, risking Cloudflare `Error 1102` (Worker CPU limit exceeded).
- **Static Export Fallback (F3):** Running `output: 'export'` breaks Next.js Server Actions, server-side session resolution, PPR, and `backendRequest()`. It would force moving authentication tokens and backend access into client-side code, violating the secure server-secret boundary.
- **Status:** Cloudflare adapter selection remains **`UNSELECTED`** and **`UNTESTED`**.

---

## 8. Test, Build, and Tooling Baseline

Review of `package.json` scripts (`check`, `build`, `test`, `test:e2e`, `storybook`, `agents:check`):

- `pnpm typecheck` (`next typegen && tsc --noEmit`): `NOT_RUN`
- `pnpm lint` (`eslint .`): `NOT_RUN`
- `pnpm format:check` (`prettier --check .`): `NOT_RUN`
- `pnpm test` (`vitest run`): `NOT_RUN`
- `pnpm test:e2e` (`playwright test` against `API_MODE=demo`): `NOT_RUN`
- `pnpm build` (`next build`): `NOT_RUN`
- `pnpm build-storybook` (`storybook build`): `NOT_RUN`
- `pnpm agents:check`: `NOT_RUN`

---

## 9. Runnable Owner PoC Execution Plan (P-FE-1 Baseline)

When sandboxed execution permissions are formally established, the frontend owner must execute PoC `P-FE-1` in an isolated disposable workspace to baseline the unmodified template.

### A. Isolated Working Path
```bash
POC_ISOLATED_DIR="/tmp/mattercontrol-step021-fe-poc"
rm -rf "${POC_ISOLATED_DIR}"
git clone --depth 1 https://github.com/lannguyenit598/nextjs-atomic-starter.git "${POC_ISOLATED_DIR}"
cd "${POC_ISOLATED_DIR}"
git checkout 3e5a642479acb789eb210e73fba956f3e85082e3
```

### B. Execution Sequence & Log Capture
```bash
mkdir -p logs

# 1. Dependency Installation
pnpm install --frozen-lockfile 2>&1 | tee logs/01-pnpm-install.log

# 2. Agent Rule Integrity
pnpm agents:check 2>&1 | tee logs/02-agents-check.log

# 3. Static Type Verification
pnpm typecheck 2>&1 | tee logs/03-typecheck.log

# 4. Lint and Formatting Standards
pnpm lint 2>&1 | tee logs/04-lint.log
pnpm format:check 2>&1 | tee logs/05-format.log

# 5. Unit / Component Testing
pnpm test 2>&1 | tee logs/06-vitest.log

# 6. Production Next.js Build
pnpm build 2>&1 | tee logs/07-build.log

# 7. Storybook Component Build
pnpm build-storybook 2>&1 | tee logs/08-storybook.log

# 8. End-to-End Demo Validation
pnpm test:e2e 2>&1 | tee logs/09-playwright.log
```

### C. Exit & Log Criteria
- All commands must exit with return code `0`.
- Standard output and error must be preserved in dated log artifacts.
- Zero local dependencies or lockfile updates may be written.

---

## 10. Minimum Health/API Seam for Future Codex Integration

Codex integration between frontend and backend is blocked until both technical owners achieve isolated passing PoCs. The minimum architectural seam requires:

1. **Backend Health Seam:** A dedicated unauthenticated endpoint on the Go backend (`GET /healthz` or `GET /readyz`) confirming PostgreSQL connectivity, schema migration version, and runtime readiness.
2. **Domain Boundary Definition:** Formal decision on the target business resource. If MatterControl domain models are not yet implemented, integration cannot proceed against `/tasks` or `/users`.
3. **Fail-Closed Session Bridge:** An implementation of `resolveSession()` in `src/lib/auth-provider.ts` backed by a verified mock or provider (OIDC/JWT) returning valid principal claims and `accessToken`.

---

## 11. Governance, Safety, and Manual Action Requirements

- **PO Scope Adherence:** Local disposable execution under **H5** and workload targets under **W1** (15 named users, 5 concurrent editors, RPO 24h / RTO 8h synthetic targets) are acknowledged. Cloud targets, production SLA, storage engines, and frontend runtime adapters remain unselected.
- **Strict Permission & Tooling Posture:**
  - Code signing verification on local tools failed in prior logs (`BLOCKED_TOOL_INTEGRITY`).
  - If execution permissions require relaxing sandbox constraints or mutating global security configurations, the agent must **not** attempt workarounds or bypasses.
  - **Required Manual Steps for Operator:**
    1. Inspect app signature integrity of owner CLI/runtimes on macOS host (`codesign -vvv --deep /Applications/Antigravity.app`).
    2. Provision an isolated disposable local container or shell with Node v24, pnpm v12, and Go 1.26.
    3. Execute the owner PoC script outlined in Section 9 manually, collecting raw terminal logs.
- **Architectural Non-Approval:** In strict compliance with governance rules, **Step 02 is NOT PASSED** and no architecture decisions are self-approved by this audit.

