# Deployment and Cloudflare Feasibility

Owner: Codex; architecture partner: Claude Code. Target: Cloudflare Free Tier, $0/month within verified MVP workload. Status: **UNVERIFIED**. No account access, resources, billing changes, CI/CD integrations or deployments were performed.

Before architecture/release approval:

1. Pin both source SHAs; inventory runtime versions, server APIs, persistence, sockets/background work and build/deploy assumptions.
2. Check Go runtime/HTTP/persistence compatibility with the chosen Cloudflare execution model. A documented WebAssembly language path does not prove that an existing Go server runs unchanged.
3. Check the actual Next.js version/features against a supported deployment path. Do not select an adapter without checking the template.
4. Specify workload: users/tenants, peak and daily requests, CPU duration, data volume/retention, storage/egress, database reads/writes, scheduled/background jobs and build activity.
5. Enumerate every required service, region/plan eligibility, free quotas, overflow behavior, limits and ancillary costs; validate against dated official sources and actual account state when authorized.
6. Record evidence and uncertainties; any paid service or changed constraint requires a Human decision. A future load test needs its own scoped authorization and environment.
7. Before production: CI checks, secret handling, migration/backup/recovery, rollout/rollback, monitoring, cost guardrails and Human go/no-go.

Current sources consulted: [Workers languages](https://developers.cloudflare.com/workers/languages/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Next.js deployment](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/). Documentation was consulted on 2026-10-24; it does not establish template compatibility or live account quotas.
