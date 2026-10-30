# Cloud-validation approval packet — MC-ZCODE-ADR006 (LOCAL_CANDIDATE stage)

For PO review. **No resource exists, nothing deployed, no account touched.** Requested decision: authorize STAGE 2 (READY_FOR_SCOPED_CLOUD_VALIDATION execution) per the promotion gates, or keep LOCAL_CANDIDATE open while the remaining local work (adapter PoC, §4 implementation) completes.

## 1. Exact candidate

- Backend: Dockerfile (distroless nonroot) image sha256:879a262f…, migrations 0001–0008 applied by a separate `mcapi migrate` step, healthz/readyz 200, SIGTERM graceful (0.17 s idle).
- Database: least-privilege profile (B1) + migration 0009 draft (B2) — SQL attached in the SQL-fixes packet, not applied.
- Frontend: unchanged shared source (adapter PoC pending; durable-state design + SQL semantics proven, implementation handoff-gated).

## 2. Proposed provider actions/resources (if authorized — none executed)

| Provider | Action | Purpose | Bounded workload |
|---|---|---|---|
| Cloudflare | Create private R2 bucket (location hint `apac`), bucket-scoped token | §7 transfer validation | 1 MiB + 1×25 MiB synthetic objects, ≤100 Class-A/B ops, cleanup of task-owned keys only |
| Cloudflare | One Worker (dev) from the PoC winner, routes disabled | §3 preview on workerd | Local wrangler dev; no production route |
| Google | Cloud Run service `mcapi` asia-southeast1, min 0 max 3, 1vCPU/512MiB, no allUsers unless decided | §5 runtime validation | healthz/readyz, ≤50 synthetic requests, one deploy |
| Google | Artifact Registry repo | immutable image identity | 1 image |
| Supabase | Project ap-southeast-1; schema profile + B1 roles applied; Data API disabled for app schema | §6 | Migrations via migrator role; ≤30 connections budget |
| ZITADEL | Public origins for the pilot + (decision) MFA policy readback | auth proof | Redirect map from the packet §IdP |

Identity: GitHub→GCP via **workload identity federation** (no long-lived keys); Cloudflare deploy token scoped to Workers only; Supabase secrets via the operator path (names in templates, values never in Git).

## 3. Bounded synthetic validation plan (stage 3, after authorization)

Read-only account checks first (available supported tools), then: adapter PoC on workerd; OIDC login/logout/pkce on one public origin with synthetic accounts; Worker→Cloud Run bearer forwarding + fail-closed; 1 MiB/25 MiB transfer with SHA equality + UNKNOWN recovery; Supabase pooler + Data-API negative test; measured consumption (requests, CPU-ms, DB size/connections, R2 ops) recorded per §6 of ADR-006. Real R2 calls require the named synthetic bucket; no legal data ever.

## 4. Cost model (every component; dated public allowances, not account entitlements)

| Component | Allowance source (public, 2026-10-29 fetch) | Beyond-allowance risk |
|---|---|---|
| Workers | Free: 100k req/day, 10ms CPU/req (draft: verify at validation) | CPU over-run on 25 MiB streaming — MEASURE in PoC |
| R2 | 10 GB storage, Class-A/B free tiers | ops amplification from retries |
| Cloud Run | Free tier CPU/memory/requests (region-dependent) | always-on min-instances would bill — profile keeps min 0 |
| Artifact Registry | 0.5 GB free | image accumulation |
| Supabase | Free: 500 MB DB, pauses after 1 week inactivity | **pause = outage** — recovery gate, not a cost item alone; pooler/connections |
| Backups/logs/secrets/CI | GitHub free minutes; log sinks possibly paid | retention choices |
| Domain/DNS | registrar cost | unavoidable if custom origin required |
| ZITADEL | existing deployment | region/plan unresolved |

**Strict $0 verdict: NOT GUARANTEED.** The honest statement: the pilot *can likely* run within allowances at synthetic scale, but pause behavior, overage risk and the domain are structural; budget alerts are not hard caps. Decision requested: accept "fail-closed + measured consumption" as the $0 interpretation, or relax the objective.

## 5. Residency map (what Singapore does and does not cover)

Singapore by selection: Cloud Run (asia-southeast1), Supabase (ap-southeast-1). NOT Singapore-guaranteed: Workers execute on the global edge (request processing location varies); R2 `apac` hint is best-effort; ZITADEL instance region (existing Australian deployment) covers all authentication traffic; backups/logs/CI follow provider regions (to be read back). PO decision required: accept a documented residency scope, or require migration of ZITADEL/edge constraints before ANY real data. Synthetic-only remains mandatory until accepted.

## 6. IdP checklist (ZITADEL — decisions/readback, no changes made)

Public app/API origins; redirect/logout URI map; audience/introspection app; MFA policy for ordinary vs privileged users; enrollment/recovery/break-glass; session lifetimes; step-up for sensitive actions (does the app need to enforce an assurance claim?); audit export. Values entered only via the approved secret/operator path.

## 7. Rollback/cleanup

Frontend: keep the prior Worker version (rollback first for frontend/auth regressions). Backend: prior Cloud Run revision. DB: expand/contract + forward-fix only — goose down is NOT a safe production rollback (destroys data). This packet's cleanup: every proposed resource carries its delete command in the validation script; task-owned synthetic keys only.

## 8. Operator/contacts + decisions requested

Operator: (to be named by PO). Decisions: (1) authorize stage-2 resources above, or defer; (2) invocation model (public+app-auth vs private ingress + Worker identity); (3) strict-$0 interpretation; (4) residency scope; (5) B3/B7 numeric policies (can defer with gates); (6) adapter adoption after PoC. Non-secret identifiers/status only; secret values enter via the approved store.
