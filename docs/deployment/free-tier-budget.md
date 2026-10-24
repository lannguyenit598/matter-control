# Free Tier Budget and Workload Gate — Step 02

Owner: Codex. Date: 2026-10-24. Status: **DEPLOYMENT_UNVERIFIED / W1_LOCAL_TARGETS_APPROVED / NO_FULL_SERVICE_BILL**. $0/month is a goal conditional on complete service inventory, quotas, measured demand and account eligibility. DEC-017 allowed deferral, not approval of unspecified values. No subscription/account/budget was changed.

## Dated public allowances

These are documentation facts retrieved on the project date, not an account-specific entitlement. Sources and hashes: [evidence](../tooling/step-02-sources.md).

| Service | Documented free allowance | Overflow / material qualification | Source |
|---|---|---|---|
| Workers runtime | 100,000 requests/day; 10ms CPU/invocation; static assets free/unlimited per pricing rules | Hard request/CPU failure modes; paid plan starts minimum $5/month; no upgrade authorized | [Pricing](https://developers.cloudflare.com/workers/platform/pricing/) / [limits](https://developers.cloudflare.com/workers/platform/limits/) |
| D1, comparison only | 5M rows read/day; 100k written/day; 5GB total; Free DB max500MB | Daily exhaustion errors; storage ceiling blocks growth; indexes contribute work; **SQLite substitution not approved** | [Pricing](https://developers.cloudflare.com/d1/platform/pricing/) / [limits](https://developers.cloudflare.com/d1/platform/limits/) |
| KV, optional comparison | 100k reads/day; 1k writes/deletes/lists each/day; 1GB stored | Exceeded operation type fails; eventual consistency cannot satisfy authoritative legal/access state | [Pricing](https://developers.cloudflare.com/kv/platform/pricing/) |
| R2 Standard | 10GB-month/month; 1M ClassA/month; 10M ClassB/month; Internet egress uncharged | Not a hard spending cap; excess is billed and rounded by billing unit; Infrequent Access excluded from free allowance; checkout required, not performed | [Pricing](https://developers.cloudflare.com/r2/pricing/) / [setup](https://developers.cloudflare.com/r2/get-started/) |
| Pages builds/static | 500 builds/month; one simultaneous build; 20min timeout; 20k files, max25MiB/file | Pages Functions use Workers quotas; dynamic Next feature compatibility not proven | [Limits](https://developers.cloudflare.com/pages/platform/limits/) |
| Hyperdrive | 100k DB statements/day on Free | Excess fails; query count includes writes/DDL; actual PostgreSQL provider/storage cost is additional and unverified | [Pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/) |
| Workers logs | 200k events/day and 3-day retention on Free | Diagnostic retention not durable product audit/history/backup; no full monitoring/SLA claim | [Workers logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) |
| GitHub Actions | Standard hosted jobs free for public repos; GitHub Free private-plan example 2,000 minutes/month and 500MB artifact allowance | Actual plan/private repo budget unknown; larger runners billed; artifacts/cache have separate rules and accrued charges | [Billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) |
| Native Go host / PostgreSQL / backups | **NO_VERIFIED_PROVIDER_OR_ALLOWANCE** | A connected database is not hosted by Hyperdrive; all compute/storage/backup/network/availability costs must be included | Architecture/PO decision pending |

When Workers Caching is enabled, current Workers pricing can charge cache-served requests, including static assets, at Worker request rates. Static delivery is not a blanket exemption under every configuration; verify the chosen configuration and account plan.

## Workload inputs to resolve in this step

DEC-024 explicitly approves the W1 local measurement envelope and RPO24h/RTO8h local restore targets; exact scope is in ../ai-sdlc/step-02-local-approval.md. Values are test inputs, not measured capacity or production targets. Remaining quantities below still need definition/measurement before any $0 or performance claim.

| Dimension | Required quantities / evidence | Current state |
|---|---|---|
| Tenancy / activity | Workspaces, active matters/users, simultaneous users, peak/day requests including SSR/API/actions/polling, shared-account background usage | W1 local envelope approved; daily/peak request rates undefined |
| Legal graph | Rows per Matter and total, edge density/depth, worst-case fan-out/reopen/expiry work, concurrent writers | W1 local ≤300 records/Matter approved; graph density/depth/fan-out still undefined |
| Persistence | Statement/row counts, transactions, indexes, idempotency and history growth, DB host limits/sleep/connectivity | UNMEASURED; provider absent |
| Documents | Version count, mean/max bytes, churn, staging/orphan data, approved retention/hold, backup copies | RETENTION_VALUES_DEFERRED; no deletion to force budget |
| Imports / exports | Frequency, rows/file and compressed/uncompressed byte ceilings, CPU/memory and retry amplification | UNMEASURED |
| Recovery / availability | Approved RPO/RTO, backup destination/keys/copies, restore duration/data-loss measurements, support expectations | Local RPO24h/RTO8h approved; production objectives/retention open, no recovery PASS |
| Delivery / ancillary | Builds/minutes/artifact retention, domains, email/identity/monitoring/scanning, transfer and third-party spend | NO_COMPLETE_INVENTORY |

## Reproducible evaluation model

For each candidate, record per-account daily dynamic request sum = browser dynamic pages + Server Actions/API + retries + background work + other Workers sharing allowance. Do not divide by monthly average to hide daily peaks. CPU p95/p99/max by operation and cold startup/bundle size are separate gates, not requests multiplied by average latency.

R2 documented GB-month uses daily peak stored GB averaged over the billing period (current pricing example:30days); use the selected account billing period and documented rounding. Do not use a retained-hour average that can understate daily-peak billing. Include all document versions, pending uploads, orphan retention, backups and restore copies; ClassA/ClassB counts include multipart/list/retry traffic. File upload size targets are not a retention allowance. Database load is measured statements/rows/transactions with indexes/retry/history amplification, not the number of users or visible grid rows.

A candidate passes cost evaluation only if each selected mandatory service has an eligible zero-cost plan or explicit accepted cost, peak demand fits hard limits with approved headroom, excess behavior preserves authorization/data correctness, full lifecycle and restore are funded and actual account settings are checked. Until then the total is **UNKNOWN**, not $0. AI subscriptions, domains and operator time are disclosed separately; required ancillary services cannot be hidden to manufacture $0.

## Cost controls — proposal, not installed

Numeric admission for the idempotency receipt policy (final review Low R3-2, TB-06/TB-13): approved values must satisfy **`receiptRetention > maxCommandDuration + allowedSkew`**, leaving a positive key-age window. Record units, the chosen margin and the DB-deadline/clock/late-arrival PoC results before accepting configuration. No values are selected here. This is receipt retention, distinct from legal history/document retention. TB-06/TB-13 cannot close on numeric approval alone while this condition or the required PoC is missing.

Pin plan/runtime/dependency versions in the candidate manifest; never activate paid plans automatically. Propose alerts/headroom and file/import/rate/resource bounds after workload approval. Rate rejection should be explicit, retry-safe and fail-closed; do not bypass access control or delete retained legal history on quota pressure. Budget alerts may lag and are not hard caps. No cloud resource or billing adjustment is authorized or performed by this document.

## Step02.1 recovery and cost qualification

A tiny synthetic local PostgreSQL tooling restore passed; source/target containers had no volumes/network/ports and were stopped. Retained local image/archive/stopped container metadata is not a cloud bill or backup service. One manual dump does not establish daily cadence, backup-destination allowance, encryption/key recovery, legal retention or production RPO/RTO. W1 workload was not exercised. Native Go host, PostgreSQL provider, persistent object storage, identity and backup/monitoring costs remain unverified; total UNKNOWN, no $0 claim. Same-day official-source allowance evidence is unchanged; no account entitlement or paid activation was checked/performed.

## Step02.2 cost refresh and unresolved inventory

[Ten current official sources](../tooling/step-02-2-cloud-sources.md) reconfirm Workers/Hyperdrive/R2 and Containers constraints. R2 model above is corrected to the documented daily-peak calculation; no measured bill exists. Cloudflare Containers Free is N/A, Workers Paid minimum$5 plus compute/disk/network/Worker/DO charges; external PostgreSQL/storage/backups remain separate. No account eligibility, plan shared-usage, provider offer, recurring backup, IdP or full retained-data inventory was verified. Total remains UNKNOWN, not$0. [Decision request](../ai-sdlc/step-02-runtime-decision-request.md) and [gate matrix](../ai-sdlc/step-02-remaining-gates.md) preserve local H5/W1 approval without manufacturing production/cost acceptance. Other older allowance rows retain original snapshot dates, not a blanket fresh validation.
