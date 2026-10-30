# MC-CLAUDE-DEPLOYMENT-PORTABILITY-20261030

- Owner: actual Claude Code (Solution Architect), direct PO assignment via `docs/implementation/handoffs/MC-CLAUDE-DEPLOYMENT-PORTABILITY-REVIEW-AND-IMPLEMENT-20261030-PROMPT.md`.
- Priority: P0 (deployment readiness). Status: **LOCAL_CANDIDATE / IN_REVIEW_WITH_VERIFICATION_BLOCKERS** (author verification only; provider legs NOT_RUN). Return: `docs/testing/claude-deployment-portability-20261030-r1/return.md`.
- Base: `codex/unified-project-flow` @ `20feedbf06c859a9806055d609f5b132fe8bb086` + pinned dirty tree (`docs/testing/claude-deployment-portability-20261030-r1/source-pin-before.json`).
- Dependencies: ADR-006; Codex ADR-006 remediation candidate (durable BFF state, OpenNext Worker profile); ZCode ADR-006 cloud-readiness container evidence.
- Reviewer: independent non-author (OpenCode or PO-assigned). Author verification is AUTHOR_VERIFICATION only.

## Scope

Alternative selectable targets: FE/BFF on Cloudflare Workers **or** Firebase App Hosting; Go API on Cloud Run **or** Compute Engine. Workers + Cloud Run remains the default. No cloud resources, deploy, commit, real R2/IdP/Supabase.

## Requirements and contract traceability

| ID | Requirement / contract | Design element | Verification |
|---|---|---|---|
| P-1 | Same product source, host-specific build only | OpenNext `build:worker`; App Hosting adapter `npm run build` + `apphosting.yaml` | Both builds from one pinned copy; A→B→A markers |
| P-2 | Secrets runtime-only, never bundled | Worker build guard (existing); `apphosting.yaml` secrets `availability: [RUNTIME]` | Invariant test; sentinel leak scan of build outputs |
| P-3 | Fail-closed config (unknown/missing profile) | `BFF_STATE_BACKEND` strict (existing); `ops/deploy/profiles.mjs` validation | Unit tests (`node --test`, vitest) |
| P-4 | Durable state portable: expiry, rotation, logout, replay, pending recovery (ADR-006 §2, Codex remediation) | Unchanged `durable-state.ts`/`session-persistence.ts` | Two Node instances + Worker on shared PG; restart; concurrent refresh; logout |
| P-5 | Per-user authorization unchanged (ZITADEL bearer, hidden-not-found, revocation) | Unchanged BFF→API path | Forbidden + revoked probes on all four combinations |
| P-6 | Same backend image on Cloud Run and VM; migrations separate | `ops/deploy/cloud-run/*`, `ops/deploy/compute-engine/*` | Same local image digest run under both profiles; migrate step |
| P-7 | Bounded drain/timeouts per host | Cloud Run 8 s shutdown < 10 s grace, timeout ≥ 65 s; VM 65 s / stop 75 s | SIGTERM with in-flight request |
| P-8 | Private R2 on remote profiles | Renderer requires `r2`; Cloud Run `K_SERVICE` guard (existing) | Renderer tests; fake S3 integration |
| P-9 | Origin/session switching semantics | Same origin + same key ring keeps sessions; different origin → relogin | Same-origin Worker→Node swap probe; origin-change probe |
| P-10 | Cost/residency honesty | ADR-007, approval packet | Document review |

## Outputs

ADR-007; plan `docs/implementation/plans/MC-CLAUDE-DEPLOYMENT-PORTABILITY-20261030.md`; evidence `docs/testing/claude-deployment-portability-20261030-r1/`; `apps/frontend/apphosting.yaml`; `ops/deploy/**`; runbook; approval packet.

## Acceptance

Criteria 1–7 in the plan, with all four combinations' local results recorded and provider-only legs NOT_RUN. No DONE/DEPLOY_READY without independent review and provider evidence.
