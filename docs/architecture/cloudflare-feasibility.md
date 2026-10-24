# Cloudflare Free Tier Feasibility — Step 02

Owner: Codex — Cloud Engineer/DevOps. Date: 2026-10-24. Status: **NO_VERIFIED_END_TO_END_$0_SOLUTION; TECHNICAL_BLOCKERS_OPEN**. Requirements/constraints remain approved; architecture choices belong to Claude Code and major exceptions to PO. This assessment is source/document evidence, not a deployment or runtime PoC.

## Conclusion supported now

The audited template starts a native Go TCP HTTP process and optionally native pgx PostgreSQL. Workers provides event-driven JavaScript-compatible APIs and Wasm execution; its language support does not establish a drop-in net/http/Echo/pgx host. The actual Next.js template has dynamic Server Actions and server-only session/backend behavior. No Worker entrypoint, selected adapter, verified PostgreSQL host or account-qualified cost envelope exists. Therefore a Workers-only unchanged-template deployment and a complete $0 bill are **not demonstrated**. This is a concrete compatibility gap, not proof every future Go/Wasm design is impossible. See [source inventory](repository-audit.md), [budget](../deployment/free-tier-budget.md) and [official-source evidence](../tooling/step-02-sources.md).

## Runtime / persistence findings

| Area | Evidence-backed assessment | Consequence / owner |
|---|---|---|
| Native Go/Echo | backend cmd/userapi/main.go and internal/app/app.go use signals, net.Listener, http.Server, Fx lifecycle and pgx pool | No unchanged Workers fetch adapter; Claude proposes options; ZCode must validate candidate |
| Go/Wasm | [Wasm docs](https://developers.cloudflare.com/workers/runtime-apis/webassembly/) allow compiled modules hosted through Worker APIs | Requires actual adapter/toolchain/library/socket validation; compiling Wasm alone is insufficient; no such PoC executed |
| PostgreSQL | pgx/Goose/sqlc queries and migrations in pinned source; durable DB mandatory for product | Select an actual PostgreSQL host, network/TLS, pooling, migration and backup model before feasibility acceptance |
| Hyperdrive | [Database support](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/) and [pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/) describe connections/pooling to an existing database | Does not supply PostgreSQL storage or a Go runtime; provider cost and driver compatibility separate; cache unsuitable for authoritative mutation checks |
| D1 | [D1 overview](https://developers.cloudflare.com/d1/) describes SQLite-based service and per-database/query limits | Not PostgreSQL; adopting it is a major prohibited-until-approved substitution, not a feasibility fix |
| KV | [Consistency model](https://developers.cloudflare.com/kv/concepts/how-kv-works/) permits stale reads across locations and lacks transactional read/write guarantees | Must not be authority for membership revocation, dependency READY or verification; optional noncritical caches only under approved architecture |
| R2 | [Subscription setup](https://developers.cloudflare.com/r2/get-started/) requires checkout; allowance is not a hard spend cap | No activation; document content would require authenticated mediated retrieval, metadata consistency, storage/operation/backup budget and lifecycle policy |
| Next.js | package16.4.2, React19.3.1, Server Actions, cacheComponents/partialPrefetching, server-only auth; no adapter configured | Antigravity must verify actual feature/version matrix and production build in candidate runtime; static Pages is not equivalent behavior |

## Frontend deployment candidates — no selection

The [current Next.js Workers guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) recommends vinext beta, a Vite-based Next API implementation. The separate [OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) remains a documented alternate and requires nodejs_compat/appropriate compatibility date. Neither source proves the template's exact Next16.4.2/React19.3.1/cache features work. Do not let automatic Wrangler configuration silently choose a runtime migration.

[Static Pages guidance](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/) applies to an exportable site; the current app's server actions/session/data path would need deliberate changes. Such changes cannot silently drop approved workflow/auth behavior. Claude owns the candidate decision; Antigravity owns feature/build/runtime PoCs.

## Limits that must be measured

Current [Workers limits](https://developers.cloudflare.com/workers/platform/limits/): Free100,000 requests/day; 10ms CPU/request; 128MB per isolate (including Wasm); 64MiB uncompressed Worker bundle and 1s startup. Wait time is distinct from CPU. These are current documentation values, not observed account quotas or performance. SSR, auth, import parsing, export generation and graph recomputation need representative measurements; a local dev server does not enforce every production limit. Old 3MB/compressed-limit assumptions are not used. Budget table holds storage/query/build allowances separately.

## Security and operations implications

A Cloudflare edge does not replace backend identity/membership checks. Source backend lacks auth; frontend integration stub and shared-service-token fallback do not meet per-user Matter enforcement. No sensitive response/public object caching, fail-open edge bypass or durable capability URL may defeat revocation. Logs/metrics are operational diagnostics, not the product's durable Event History.

[Secrets documentation](https://developers.cloudflare.com/workers/configuration/secrets/) requires secret bindings rather than plaintext configuration. Some secret-put/delete commands create and deploy a Worker version immediately; they are not read-only validation commands. No such commands run here. CI/cloud credentials, tokens and least-privilege scopes are not provisioned.

## Architecture decision gate

Keep Go/PostgreSQL and the Cloudflare/$0 constraints intact while Claude compares: (a) native Go/PostgreSQL origin with Cloudflare frontend/edge, requiring verified free host or an explicit hosting/cost exception; (b) Go/Wasm adapter preserving domain with unproven ports/runtime constraints; (c) any runtime/database replacement only as rejected-by-default major exception for PO review. These are infrastructure trade-off inputs to Claude, not Codex-selected solution architecture.

Before gate completion: receive actual Claude architecture, ZCode/Antigravity owner audits; choose a candidate through PO where consequential; define workload/retention/recovery objectives; run isolated candidate-specific smoke, concurrency/auth, build and quota tests; independent OpenCode verification; recorded ADR disposition. No account resources, paid subscriptions, production deploy or Step03 activity has occurred.

## Step02.1 evidence update

No new Cloudflare resource, runtime adapter or provider has been selected or deployed. Same-day official-source limits/prices above remain source evidence; no quota remeasurement is claimed. Actual frontend supplied-source audit corroborates Task/User and session seams, but its unsupported SSR CPU estimate and categorical export/ID claims are rejected in frontend-audit.md. The tiny local PostgreSQL tooling restore proves neither pgx/Workers connectivity nor remote DB/blob recovery. LOCAL_TOOLING_RESTORE_PASSED is distinct from LOCAL_PRODUCT_POC_PASSED (NOT_RUN), PRODUCTION_FEASIBILITY_CONFIRMED (UNVERIFIED) and COST_VERIFIED (UNVERIFIED). Next choices still require actual owner build/runtime evidence, Claude interpretation of impactful findings, candidate topology/provider/security/retention and full-cost acceptance by PO. No earlier approved H5/W1/Q3/Q5 decisions are reopened.


## Returned backend H5 characterization

Actual ZCode Go/PostgreSQL native template build/runtime evidence returned and independently reviewed with limitations; R01/R02 still require owner evidence. This is concrete local compatibility input, not evidence of Workers fetch/pgx/Hyperdrive execution, a deployable provider or a zero-cost full service. Actual Claude confirms the template500-vs-product503 mapping as an implementation obligation without changing the approved architecture. No new cloud/paid/account action or runtime/database substitution.
