# MC-002 — Step02.2 Official Cloudflare Refresh

Codex Cloud/DevOps, 2026-10-24. Method: Context7 resolve for Cloudflare Workers → queries using `/llmstxt/developers_cloudflare_workers_llms_txt`; returned broad runtime/local-emulation context, so exact product/price facts checked on official pages through web and read-only curl. [Ten snapshots, argv/exit/HTTP status/UTC/byte hashes](../testing/step-02-2/cloud-source-manifest.json). Gzip files retain full responses, not hand-edited extracts. No account, plan entitlement or remote runtime measurement.

| Official page | Rechecked fact / consequence |
|---|---|
| [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) | Free100,000 requests/day,10ms CPU/HTTP request,128MB/isolate incl.Wasm;64MiB uncompressed Worker,1s startup. Wait time is not CPU. No template CPU measurement exists. |
| [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) | Free allowance separate from Paid minimum$5 and overages. Total demand from other account workloads remains unknown. |
| [Next.js](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) | Current default recommendation vinext beta, compatibility check before adoption; not evidence pinned Next16.4.2/cache behavior works. |
| [OpenNext](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) | Documents SSR/Server Actions/PPR/use-cache support, with experimental qualifiers; Node middleware unsupported. Manual alternate configuration; nodejs_compat plus compatibility date≥2024-09-23. No installed candidate/build/preview in this repo. |
| [Wasm](https://developers.cloudflare.com/workers/runtime-apis/webassembly/) | Precompiled modules, single thread, experimental partial WASI. Does not prove native listener/pgx/fx operation. |
| [Hyperdrive support](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/) | PostgreSQL9..18.x listed; TLS modes/driver/host route still require verification. Advisory locks and arbitrary per-session changes unsupported. Native Goose advisory-lock migration must not be assumed compatible through Hyperdrive; evaluate direct DB migration path and actual session settings after candidate selection. |
| [Hyperdrive pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/) | Free100,000 statements/day includes writes/DDL; overflow errors. External PostgreSQL storage/billing is separate. |
| [R2 pricing](https://developers.cloudflare.com/r2/pricing/) | Standard10GB-month,1M ClassA,10M ClassB monthly free allowances; excluded Infrequent Access, rounded overage billing. GB-month calculation uses daily peak storage averaged over billing period, not only retained-hour averages. |
| [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/) | Encrypted bindings support secret values; putting secrets is a mutation, not a read-only preflight. No secrets read or written. |
| [Containers pricing](https://developers.cloudflare.com/containers/platform/pricing/) | FreeN/A; Workers Paid minimum$5 plus container/Worker/DO/network inventory. Not a zero-cost replacement for native origin. |

Failure provenance: first Python3.14 urllib attempt failed local CA issuer verification; no TLS bypass or trust configuration change. System curl with default certificate verification retrieved all ten responses HTTP200/exit0. Web renderer could not consume `text/markdown` links; archived curl responses preserve the official content. This is documentation retrieval, not deployment or compatibility execution.

Skipped: account entitlement, real remote resource/quota/load checks. Risk: generic feature-support tables and pricing pages do not certify exact source/adapter/workload or full bill.
