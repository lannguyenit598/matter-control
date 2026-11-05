# Readiness matrix — ADR-006 (LOCAL_CANDIDATE, 2026-10-30)

States: IMPLEMENTED_NOT_VERIFIED / PASS_SCOPED (local, bounded) / FAIL / NOT_RUN / BLOCKED_DEPENDENCY / DECISION_REQUIRED. Author: actual ZCode session (combined assignment). HEAD `20feedbf…` + dirty tree preserved. Evidence: this namespace.

| # | ADR-006 gate | Current source proof | Executed evidence this session | Remaining action | Owner / boundary |
|---|---|---|---|---|---|
| 1 | Adapter selection (Workers) | No adapter in shared source; Next 16.4.2/React 19.3.1, `cacheComponents`, standalone output; **stale `/`→`/dashboard` redirect confirmed** (route absent) | `adapter-comparison.md` (pinned research 2026-10-29: OpenNext 1.20.14 supports Next ≥16.4.1; vinext 1.4.0 matches React 19.3.1); PoC script prepared | Run `adapter-poc.sh` both candidates on workerd; fix the stale redirect first (needs next.config writer handoff); select + adopt with narrow lockfile delta | ZCode (PoC) + frontend writer handoff (adoption) |
| 2 | Durable server state | `session-store.ts:27` global Map confirmed; transfer WeakMap confirmed | **SQL semantics PASS_SCOPED**: `durable-session-events.json` — atomic rotation (1 winner/10 concurrent), stale-generation, destroyed/expired fail-closed | Implement Workers-side store + sealed-at-rest key service + `auth_flows`/`pending_commands` tables; writer handoff; security review | Frontend writer handoff + independent security review |
| 3 | Auth/origin proof (OIDC on one public origin) | `flow.ts`/`session.ts` (835 LoC incl. tests) unchanged; PKCE/state in code | NOT_RUN (needs the adapter + public origin) | After adapter: login/callback/logout, cookie flags, CSRF/origin, token-leak sweep | Frontend writer + independent review |
| 4 | BFF/API proof (bearer forwarding, fail-closed, timeouts) | BFF pattern source-verified (repositories per call, user token) | NOT_RUN (needs Worker runtime) | Cross-cloud latency + error mapping through workerd | ZCode after #1 |
| 5 | File/transfer path 1MiB–25MiB | fs/r2 backends behind object interface; K_SERVICE guard verified | NOT_RUN (needs #1) | Worker→Go→R2 emulator flow, SHA equality, UNKNOWN recovery; provider script prepared | ZCode |
| 6 | Cloud Run backend | Dockerfile distroless nonroot; K_SERVICE/fs guard; timeouts/shutdown in source | **PASS_SCOPED**: image built (sha 879a262f…), migrate 0001–0008 as separate step, healthz/readyz 200 on 0.0.0.0:8080, SIGTERM graceful exit 0 in 0.17 s (`cloud-run-profile.md`) | In-flight drain test under real load; invocation-model decision; deploy | ZCode + PO decision |
| 7 | Supabase PostgreSQL | Migration DSN supported; pool fixed MaxConns 10 | **PASS_SCOPED (B1)**: least-privilege profile 55/55 (roles, private schema, exact grants, denials, full contracts under runtime role); pooler/pgx behavior NOT_RUN | Apply profile on Supabase; pooler mode + Data API negative test; connection budget | Codex (grants) + provider gate |
| 8 | Private R2 | Bucket-scoped credential contract in config | NOT_RUN (no bucket created) | Provider validation script prepared (SigV4/HEAD/PUT/GET/multipart, cleanup) | ZCode after authorization |
| 9 | CI/CD | backend.yml + frontend.yml only (checks/demo E2E) | Templates prepared (`ci-cd-templates.md`): PR jobs w/o cloud creds, protected manual deploy, WIF-over-keys, serialized deploy+migration | Adopt into workflows after adapter selection | Codex (CI writer handoff) |
| 10 | Secrets/observability/recovery | Audit events in source; no alert wiring | B5/B8/B9 dispositions written; restore rehearsal NOT_RUN | Approval-gated destinations, schedulers, backup test | Operator/PO |
| 11 | Quota/cost/residency | `free-tier-budget.md` historical | DECISION_REQUIRED: packet §cost lists every component; residency map shows Workers global edge + R2 `apac` + ZITADEL region unresolved vs Singapore target | PO: strict-$0 feasibility, residency scope, synthetic-only acceptance | PO |
| B1–B9 | Zero-trust rows | See `zero-trust-b1-b9.md` | B1 PASS_SCOPED 55/55; B2 measured (54×/4×); B3–B9 dispositions | Per-row owners in that file | Per-row |

## Known local defects / reconciliations found

1. Stale `/` → `/dashboard` redirect + comment references `/tasks` — routes that no longer exist (next.config.ts:49, :8). Fix with the next.config handoff; do not "fix" by assuming the old runtime.
2. `pnpm format:check` baseline artifact (Mimosa state files) — unchanged, still to be decided by the repo owner.
3. Review `0009` index migration + `0009` slot naming must be re-inventoried before any apply (B2).

## Prioritized blockers (separated)

- **Local implementation (this assignment continues)**: #1 PoC execution; #2 Workers-side implementation (handoff-gated); stale redirect fix (handoff-gated); in-flight drain test.
- **Unexecuted provider verification** (NOT_RUN, authorized stage only): Supabase grants/pooler/Data-API, R2 SigV4, Cloud Run deploy/IAM, domain/HTTPS, IdP policy readback, backup/restore rehearsal.
- **Material PO decisions**: invocation model (public+app-auth vs private ingress); strict-$0 feasibility vs measured costs; residency scope (ZITADEL Australia, edge, R2 apac); B3 numeric quotas; B7 retention values/TB-06; B6 posture in/out; adapter adoption.
- **Independent acceptance**: security review of §4 design + Worker BFF; non-author review of B1/B2 evidence; browser/E2E journeys.
