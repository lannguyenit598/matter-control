# Cloud-validation approval packet — portable profiles (ADR-007)

Prepared by actual Claude Code, 2026-10-30. **Request for decision; nothing here has been executed.** Local evidence: `docs/testing/claude-deployment-portability-20261030-r1/return.md`. Default target remains Workers + Cloud Run.

## Decisions needed from the PO (D1–D7)

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | Which alternative profiles to qualify on real providers | none / App Hosting / Compute Engine / both | Qualify only what you intend to keep as a fallback; each adds an operating model |
| D2 | Billing exposure | App Hosting requires Blaze (pay-as-you-go); Cloud Run and GCE require a billing account | Budget alert + max instances; accept that alerts are not a hard cap |
| D3 | VM region vs cost | `asia-southeast1` (Singapore, billed) vs `us-*` e2-micro (free tier, breaks the Singapore choice) | Singapore for parity with Supabase; accept the VM charge, or do not qualify the VM |
| D4 | VM TLS ingress | Caddy on the VM (template) / external HTTPS load balancer (standing charge) / Cloudflare Tunnel (adds Cloudflare on the API path) | Caddy for a pilot |
| D5 | Platform transport auth | none (application auth only, all templates) / Cloud Run IAM for App Hosting→Cloud Run only | None until required; IAM would be asymmetric (Workers and VM cannot match it) |
| D6 | App Hosting with Next.js 16.4.2 in *preview* support | accept preview / downgrade Next (material change, not proposed) | Accept for a pilot with synthetic data only |
| D7 | Numeric workload bounds in the templates: `MC_MAX_IN_FLIGHT` 10, Cloud Run concurrency 10 and `maxScale` 3, App Hosting `maxInstances` 2 and concurrency 20, VM 512 MiB / in-flight 10 | accept as pilot defaults / set from a measured workload | Accept as pilot defaults; they come from memory and DB-connection arithmetic, not from a workload study |

## Minimal provider operations per profile (when approved)

| Profile | Resources | Operations | Cost exposure (official docs 2026-10-30) |
|---|---|---|---|
| App Hosting FE | Firebase project on Blaze, App Hosting backend (`apps/frontend`, region TBD), 2 Secret Manager secrets (+CA optional), GitHub connection | create backend, `apphosting:secrets:set` ×2, `secrets:grantaccess`, one rollout, probe set | Cloud Run 180k vCPU-s/360k GiB-s/2M req free then billed; Cloud Build 2,500 min; Artifact Registry 0.5 GB; Secret Manager 6 active versions / 10k accesses; App Hosting egress 10 GiB then $0.15–0.20/GiB |
| Cloud Run BE | service + job in `asia-southeast1`, runtime service account, 5 secrets, Artifact Registry repo | push image, `jobs replace/execute`, `services replace`, probe set | Cloud Run free allowance then billed; registry storage; logging |
| Compute Engine BE | 1 VM (`cos-stable`), boot disk, static or ephemeral external IP, firewall rule tcp:80,443, DNS A record, VM service account with Secret Manager accessor | create VM with `user-data`, `systemctl start mcapi-migrate`, probe set, reboot/restart test | VM + disk + external IP billed in Singapore (free tier only us-west1/us-central1/us-east1 e2-micro, 30 GB PD, 1 GB NA egress) |

Unchanged and still required for every profile: Supabase project (Singapore), private R2 bucket with bucket-scoped token, ZITADEL application/redirect URIs for the exact public origin.

## Provider-only checks (cannot be closed locally)

1. App Hosting buildpack with pnpm 12 + adapter 14.0.x on Next 16.4.2; `x-fah-adapter` header present; runtime env/secret availability as configured.
2. Real origins: `__Host-` cookies over HTTPS, Server Action origin with App Hosting/Workers forwarding headers, ZITADEL redirect/logout.
3. Supabase: `verify-full` TLS for pg (BFF) and pgx (API), pooler mode, connection budget at max instances, least-privilege roles, Data API negatives.
4. R2: SigV4, checksum header acceptance, 25 MiB PUT/GET, private bucket.
5. Cloud Run: scale-in during a transfer (8 s drain), request timeout 75 s, probes on reserved `z` paths.
6. VM: Caddy certificate issuance, firewall, COS auto-update reboot recovery, journald retention, Secret Manager fetch via the gcloud image, key file ownership on Linux.
7. Worker: real CPU/memory/body limits for near-25 MiB uploads.
8. Cost: actual billing reports after a bounded synthetic workload; residency of App Hosting region and CDN.
