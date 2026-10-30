# ADR-006 readiness intake — 2026-10-29

Actual Local Codex. Scope: ADR/configuration/source/CI inspection and task preparation, not full product/cloud/security acceptance. HEAD20feedbf06c859a9806055d609f5b132fe8bb086 plus dirty working tree. No cloud/account inspection or mutation, dependency installation, source remediation, tests/builds or provider calls executed by this intake.

## Conclusion

DEPLOYMENT_READINESS_NOT_ESTABLISHED. ADR-006 selects topology, not deployment/release/cost/residency approval. A Next Node build and local login do not establish Worker compatibility or distributed state correctness. Use the new ZCode handoff to finish local preparation before a separately authorized bounded cloud validation.

| Priority | Gate | Current source evidence | Required next proof/work |
|---|---|---|---|
| P0 | Workers adapter | Frontend package lacks Worker adapter/build scripts; no Wrangler/OpenNext/vinext config found; next.config keeps standalone/cacheComponents/partialPrefetching | Exact current vinext/OpenNext comparative PoC, selected version/configuration, local workerd preview and product contract checks |
| P0 | Durable auth/recovery | oidc/session-store.ts global Map, session.ts process refresh Map; data-transfer/pending-attempts.ts WeakMap keyed by session object | Durable encrypted server state, distributed refresh/revocation safety and pending-command recovery with restart/multi-client tests |
| P0 | Public auth/origin | Existing local ZITADEL flow and localhost callback; public origin/redirect/security profile not verified | One exact Worker origin, cookie/state/PKCE/CSRF/Server Action origin and no token disclosure proof |
| P0 | Cloud Run profile | Default MC_HTTP_ADDR127.0.0.1:8081; nonroot Go Dockerfile. Existing timeout/readiness/draining/shutdown and K_SERVICE→no-fs guards present | Explicit0.0.0.0/port/resources/concurrency/instance/timeout profile, container checks and Worker invocation/auth decision |
| P0 | Supabase roles/connection | Optional migration DSN, fixed pool MaxConns10; no complete least-privilege SQL/deploy profile located | Runtime/migrator grants+default privileges, TLS, pool budget, session-compatible pgx/migrations and Data API deny/disable negative tests |
| P0 | R2/file path | R2 adapter and cloud fs guard present; provider interaction not run in this intake | Private bucket-scoped credentials configuration; local transfer checks then authorized real-provider SHA/auth/near25MiB/UNKNOWN proof |
| P0 | Tenant/security pilot admission | Separate audit/correction handoffs exist; their preparation is not acceptance | Latest critical isolation/auth/recovery findings rechecked against final candidate; do not infer organization isolation from same-issuer dev directory |
| P1 | CI/deploy artifact | Root CI contains backend/FE checks/builds and demo E2E; no selected Worker/deploy profile found | Exact Worker build/local runtime test, protected manually gated deployment, secret/identity mapping, serialized migration and immutable artifacts |
| P1 | Recovery | Prior local synthetic restore evidence exists, not an ADR-006 managed-provider recovery rehearsal | Current candidate DB+objects restored/read back with hashes, retention/key/recovery runbook and provider proof boundary |
| Decision | Cost/limits | Strict zero-cost target unresolved; ADR admits billable-overage/hard-limit/pause qualifications | Current docs, account entitlements, bounded workload and cost controls; alerts alone are not a hard cap |
| Decision | Residency/IdP | Cloud Run/Supabase Singapore selected; Workers global/R2apac not Singapore proof; existing IdP metadata Australia | Explicit processing/state/log/backup/identity residency map and PO disposition; synthetic-only until resolved |

## Additional source correction lead

next.config.ts explicitly redirects root to /dashboard while the product route points to /workspaces. Reconcile that obsolete configuration in the readiness task; the difference is not by itself evidence of an old running server. Current local/runtime ownership must be established before any restart.

## Documentation consulted

Context7 resolved current official Cloudflare Workers and Supabase sources. Cloudflare describes vinext and manual OpenNext configuration with Worker-local preview; generic support tables do not certify installed Next16.4.2 features. Supabase distinguishes session/direct connections from shared transaction pooling, including prepared/session-state/advisory-lock limitations. Test pgx specifically; do not apply Prisma-only settings.

- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/opennext/
- https://supabase.com/docs/guides/database/connecting-to-postgres

No exact provider quota/cost/residency entitlement verified. Historical deploy docs contain superseded Cloud Run frontend/source-layout assumptions; active runbooks need ADR-006 alignment without rewriting historical evidence.

## Handoff and sequence

`docs/implementation/handoffs/MC-ZCODE-ADR006-CLOUD-READINESS-IMPLEMENT-PROMPT.md` is the single entry point. It sequences compatibility/state, container/roles/storage, CI/recovery, then a precise cloud-validation approval packet. Current feature/Solid Glass writers require actual file handoffs, not concurrent uncontrolled edits.

Local candidate readiness is separate from readiness to request cloud validation, separately authorized provider execution, and pilot/production release. Do not make remote runtime evidence an impossible prerequisite to requesting the authorization needed to gather it; keep those stages explicit.

Skipped: live permissions/account/resource inspection, local/runtime/PG/Worker tests, real R2/Supabase/IdP validation and deployment. Risk: this is a source-backed preparation inventory; changing candidate bytes and current provider entitlements need fresh verification.
