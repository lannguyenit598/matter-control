# Repository Audit Inputs — Step 02

Collector: Codex. Date: 2026-10-24 Asia/Ho_Chi_Minh. Status: STATIC_SOURCE_INVENTORY; backend ZCode owner audit ATTEMPT_FAILED, frontend Antigravity owner audit WAITING. This is factual input to Claude, not a completed audit by those agents. No build, test, install, migration or source change has run.

## Exact snapshots

| Source | Pinned HEAD | Local disposable read-only snapshot | Inventory |
|---|---|---|---|
| [Go template](https://github.com/lannguyenit598/go-hexa-template) | d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b | /tmp/mattercontrol-step02-backend | 106 tracked files; 19 _test.go files |
| [Next.js template](https://github.com/lannguyenit598/nextjs-atomic-starter) | 3e5a642479acb789eb210e73fba956f3e85082e3 | /tmp/mattercontrol-step02-frontend | 323 tracked files; 20 .test./.spec. files |

Commands: rtk proxy git ls-remote URL HEAD, then rtk proxy git clone --depth 1 URL /tmp/mattercontrol-step02-{backend,frontend}, git rev-parse HEAD and git ls-files via rtk. Both pinned SHAs match. GitHub connector returned Unknown tool; sandbox Git DNS failed; authorized host Git read succeeded. No remote configured on the governance repo.

## Backend observations for ZCode and Claude

- go.mod: Go 1.26.0; Echo v5.4.0, Huma v2.39.1, pgx v5.11.0, Goose v3.28.0, Fx v1.24.0, OpenTelemetry and optional franz-go dependencies.
- cmd/userapi/main.go dispatches native API, migrate and relay commands; signal/OS lifecycle. internal/app/app.go opens a TCP listener, serves net/http, manages pgx pool, readiness/drain and background lifecycle. It is not a Worker fetch entrypoint.
- internal/core/domain, port and service separate user use cases; inbound httpapi and outbound memory/postgres/system adapters. Template domain is User, not MatterControl. Memory mode is selectable but does not satisfy approved durable PostgreSQL requirement.
- PostgreSQL uses plain/generated sqlc queries and Goose migrations; user version/CAS and optional transactional outbox are reuse candidates, not evidence that legal graph/audit/verification invariants exist. EVENTS_SINK defaults none; Kafka/relay is optional, not a mandatory MatterControl dependency.
- internal/adapter/inbound/httpapi/server.go explicitly says no authentication and exposes APIMiddleware integration; Huma/OpenAPI 3.1 exists. No tenant/Matter membership enforcement is established by this template.
- Dockerfile builds a native Go binary then runs distroless nonroot. It does not prove Workers support; no Wasm/Cloudflare adapter is shown by the examined paths.
- Tests/CI exist but were not executed. PostgreSQL test helper may mutate schema; disposable target and owner direction are mandatory before execution.

## Frontend observations for Antigravity and Claude

- package.json: Next 16.4.2, React/React DOM 19.3.1, TypeScript ~5.9.3, Tailwind ^4.3.3, pnpm 12.11.2; supported Node engine expression includes installed 24.22.1. Exact lock/install remains unverified.
- src/components has atoms/molecules/organisms/templates; src/features/tasks has actions, schemas, services and view components. src/features/tasks/services/task-repository.ts switches demo/rest implementations; it does not implement MatterControl domain semantics.
- src/features/tasks/actions.ts uses Server Actions and revalidatePath; src/lib/api/backend.ts is server-only and forwards user token with shared API_TOKEN fallback. The fallback cannot establish per-user Matter authorization.
- src/lib/auth-provider.ts is an explicit fail-closed integration stub returning null. Demo mode grants a wildcard demo session and uses disposable in-memory data; neither is production authentication.
- next.config.ts enables cacheComponents/partialPrefetching, dynamic headers/redirects and Turbopack styling. Dashboard uses connection(). No output:export or Cloudflare adapter is configured in the inspected package/config.
- Vitest/Playwright/Storybook and CI scripts are declared; test/build success and Cloudflare compatibility are NOT_RUN/UNVERIFIED. Static export cannot be assumed equivalent to the current server behavior.

## Remaining owner evidence

ZCode and Antigravity must return their actual audits and version/build/runtime results through [handoffs](../implementation/agent-handoffs.md). Codex observations do not promote those assignments to EXECUTED. Raw source snapshots remain temporary; immutable GitHub blob links at these SHAs are the recovery references. PoCs follow architecture direction, no business features.

## Pinned source evidence locations — Codex inventory

| Observation | Immutable source |
|---|---|
| Go/toolchain and dependencies | [go.mod:3](https://github.com/lannguyenit598/go-hexa-template/blob/d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b/go.mod#L3) |
| Native TCP listen | [internal/app/app.go:264](https://github.com/lannguyenit598/go-hexa-template/blob/d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b/internal/app/app.go#L264) |
| Native HTTP serving | [internal/app/app.go:269](https://github.com/lannguyenit598/go-hexa-template/blob/d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b/internal/app/app.go#L269) |
| Auth integration absent | [internal/adapter/inbound/httpapi/server.go:34](https://github.com/lannguyenit598/go-hexa-template/blob/d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b/internal/adapter/inbound/httpapi/server.go#L34) |
| PostgreSQL query adapter | [internal/adapter/outbound/postgres/queries/users.sql:1](https://github.com/lannguyenit598/go-hexa-template/blob/d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b/internal/adapter/outbound/postgres/queries/users.sql#L1) |
| Optional event sink | [internal/config/config.go:26](https://github.com/lannguyenit598/go-hexa-template/blob/d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b/internal/config/config.go#L26) |
| PostgreSQL codegen dialect | [sqlc.yaml:5](https://github.com/lannguyenit598/go-hexa-template/blob/d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b/sqlc.yaml#L5) |
| Pinned framework declaration | [package.json:28](https://github.com/lannguyenit598/nextjs-atomic-starter/blob/3e5a642479acb789eb210e73fba956f3e85082e3/package.json#L28) |
| Cache/runtime feature | [next.config.ts:40](https://github.com/lannguyenit598/nextjs-atomic-starter/blob/3e5a642479acb789eb210e73fba956f3e85082e3/next.config.ts#L40) |
| Partial prefetch feature | [next.config.ts:41](https://github.com/lannguyenit598/nextjs-atomic-starter/blob/3e5a642479acb789eb210e73fba956f3e85082e3/next.config.ts#L41) |
| Server Actions | [src/features/tasks/actions.ts:1](https://github.com/lannguyenit598/nextjs-atomic-starter/blob/3e5a642479acb789eb210e73fba956f3e85082e3/src/features/tasks/actions.ts#L1) |
| Unimplemented session resolver | [src/lib/auth-provider.ts:35](https://github.com/lannguyenit598/nextjs-atomic-starter/blob/3e5a642479acb789eb210e73fba956f3e85082e3/src/lib/auth-provider.ts#L35) |
| Shared token fallback | [src/lib/api/backend.ts:25](https://github.com/lannguyenit598/nextjs-atomic-starter/blob/3e5a642479acb789eb210e73fba956f3e85082e3/src/lib/api/backend.ts#L25) |
| Demo/REST switch | [src/features/tasks/services/task-repository.ts:9](https://github.com/lannguyenit598/nextjs-atomic-starter/blob/3e5a642479acb789eb210e73fba956f3e85082e3/src/features/tasks/services/task-repository.ts#L9) |
| Dynamic request boundary | [src/app/(app)/dashboard/page.tsx:31](https://github.com/lannguyenit598/nextjs-atomic-starter/blob/3e5a642479acb789eb210e73fba956f3e85082e3/src/app/(app)/dashboard/page.tsx#L31) |

## Owner execution safety gate

Before GUI fallback on2026-10-24, exact deep/strict codesign verification of /Applications/ZCode.app and /Applications/Antigravity.app each exited1 with invalid arm64 signature (code or signature modified). Neither app was launched, repaired or bypassed. Earlier CLI presence/provider failure is historical, not current integrity clearance. Both owner audits and their PoCs are BLOCKED_TOOL_INTEGRITY pending official reinstall and successful signature verification; prepared handoffs remain available. Codex source inspection and Claude document review do not replace those owner audits.

## Step02.1 superseding owner-status record

The earlier installation-integrity/reinstall conclusion above is historical and superseded by host verification in ../tooling/step-02-1-recovery.md: both apps valid, app Gatekeeper accepted. Source snapshots remain clean/pinned. Actual Antigravity supplied-source audit returned; full checkout/build/runtime not run. ZCode CLI still lacks packaged provider config, so manual backend assignment prepared. Current owner records: backend-audit.md and frontend-audit.md; full prompts in ../implementation/handoffs/. No Codex inventory is promoted to owner engineering completion.
