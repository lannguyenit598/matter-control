# ADR-005 — Design-to-Infrastructure Fit Review

- Author: Claude Code (actual), claude-sonnet-5-5, Solution Architect review at the user's request ("check whether the design fits the infrastructure, in detail").
- Date: 2026-10-29. Repository HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` plus the uncommitted working tree.
- Status: **PROPOSED — findings only; no code or infrastructure was changed by this review.**
- Inputs: `system-architecture.md`, ADR-001/002/003/004, `document-lineage.md`, `security-architecture.md`, `api-auth-decision-analysis.md`, `technical-blockers.md`, `deployment/free-tier-budget.md`, `ai-sdlc/step-02-local-approval.md` (W1 envelope), `requirements/srs.md` (NFR-006/008), and the backend/frontend source.
- Infrastructure under review (approved in ADR-004): Cloud Run frontend (1 instance) and backend (≤2), Supabase Free Postgres via session pooler, Cloudflare R2 (private bucket), ZITADEL Cloud Free, `*.run.app` origins, no Cloudflare proxy, synthetic data only, `MC_OIDC_CACHE_TTL=30s`.

Evidence classes: **[repo]** read in this working tree; **[docs]** project documents; **[recall]** general knowledge, unverified.

## Context

The architecture documents are deliberately hosting-neutral (`system-architecture.md` §1). That neutrality is only real if each design assumption survives contact with the chosen hosting. This review lists the assumptions that carry operational weight, checks each against the code and against the approved infrastructure, and classifies it:

- **FIT** — holds as is.
- **FIT WITH CONDITION** — holds if a stated condition is met.
- **GAP** — design or policy says one thing, implementation or infrastructure does another.

## Verdict

The **core design fits**: the Matter-scoped transactional model, the consistency rules, the object-store port and the authorization model all work on Postgres-behind-a-session-pooler, R2 and Cloud Run. The gaps are in the **shell around the core**: a stateful frontend, a demo-mode default that contradicts a settled policy, long operations that meet short request timeouts, a scheduler that the design needs but free hosting does not provide, and performance that nobody has measured on this topology. None is a reason to change the design; each has a bounded action.

## Fit matrix

| # | Design assumption (source) | Infrastructure / implementation reality | Verdict | Action |
|---|---|---|---|---|
| 1 | Every command is one READ COMMITTED transaction that first locks the matter row `FOR UPDATE`; memberships `FOR SHARE` (ADR-002 §1) | Plain row locks work on Supabase Postgres. ADR-002 explicitly avoided advisory locks, and the runtime uses none [repo: only goose migrations take one]. Session-mode pooler keeps one server connection per client connection | FIT | Keep the session pooler (never transaction mode); keep Cloud Run instances × `MaxConns 10` under the plan's connection limit (Free limit not published) |
| 2 | Reads use `REPEATABLE READ READ ONLY` snapshots with `asOf` and `sourceRevision` (ADR-002 §1.6) | `matter_store.go:97` begins exactly that [repo]; valid on session pooler | FIT | None |
| 3 | Command instant is `greatest(database clock, last_recorded_at)`; time-derived state is evaluated purely at `asOf` (system-architecture §8) | Uses the database clock, so Cloud Run's clock and instance count do not matter | FIT | None |
| 4 | Idempotency receipt retention must exceed max command duration plus skew; numbers to be approved (`free-tier-budget.md`, TB-06/13) | Max command duration is now bounded by the 10 s context timeout (and will change with B4 timeouts); no numeric retention approved | FIT WITH CONDITION | Approve numeric retention once B4 sets final per-route timeouts |
| 5 | A boundary worker materializes due/expiry history for idle matters (system-architecture §4, TB-08) | Not implemented: `next_boundary_at` is never set, and any command on a matter with a due boundary fails closed (`ErrBoundaryDue`) [repo]. Reads do not need it. An in-process ticker cannot run on scale-to-zero Cloud Run | FIT today, **GAP when the feature lands** | Design the trigger as an authenticated cron endpoint called by Cloud Scheduler (small free allowance **[recall]**), never an in-process ticker. Record in TB-08 |
| 6 | Derived state is recomputed synchronously inside the command transaction (ADR-002 §1.4) | Latency is (round trips) × (RTT to Postgres). Different regions would multiply it; the 10 s request context caps the whole command | FIT WITH CONDITION | Put Cloud Run and Supabase in the same region; measure p50/p95 on the deployed topology (NFR-006, AC-154: 30 repetitions, environment recorded). No latency claim until then |
| 7 | Bulk and import commit per row/group so long batches do not hold the matter lock (ADR-002 §3) | `dataops_service.go` makes many statements per row inside one HTTP request, but the request is cut at 10 s (`ContextTimeout`; the Skipper exempts only the body limit) [repo] | **GAP** | Extend ADR-004 B4: longer timeouts for import/bulk-commit routes, or cap rows per request. Measure rows/s at the deployed RTT |
| 8 | Object store: staging → commit → reconcile, with Head/Delete and an optional signed PUT (`document-lineage.md` §3) | Implementation is simpler: content-addressed `Put`/`Open`, bytes streamed through the API, no staging, no delete [repo]. The design allows API-streamed upload; content addressing makes orphans harmless | FIT (design documents drifted) | Update `document-lineage.md` to describe the content-addressed implementation and its R2 key layout; keep "no delete" until retention (TB-06) is decided |
| 9 | Files are served only after Matter-scoped authorization (RULE-017) | Bucket is private, no signed URLs; downloads stream through the authenticated API handler [repo] | FIT | Verify in the R2 smoke test that the bucket has no public access |
| 10 | Go validates identity: JWT via cached JWKS **or** introspection for opaque tokens, per the selected IdP (`security-architecture` ID-A; `api-auth-decision-analysis`) | Implementation uses ZITADEL introspection, so the IdP is in the request path of every API call (cache TTL 30 s approved). ZITADEL Free publishes no introspection rate limit [docs: pricing page] | FIT WITH CONDITION | Measure ZITADEL latency and errors in the PoC. If it hurts, switch the ZITADEL application to JWT access tokens and validate locally (design already allows it) |
| 11 | Settled policy: **no demo or anonymous mode**; production builds must fail if `API_MODE=demo` (`api-auth-decision-analysis` §2, TB-12) | `env.ts` defaults `API_MODE` to `demo`, and `auth.ts` returns a demo session in that mode [repo]. The new image started in demo mode with no variables and served the demo dashboard (ADR-004 B2 smoke test) | **GAP** | Frontend guard: in production runtime, refuse to start unless `API_MODE=rest` (build phase excepted; an explicit opt-in variable for Playwright/CI). Small change; needed before any deploy |
| 12 | The BFF holds the session; tokens never in cookies (`security-architecture`; session contract) | Sessions and unresolved Data attempts are process memory [repo] | GAP, **accepted** (ADR-004 B1, single instance) | Enforce `max-instances=1` in the deploy config and state it in the pilot notice |
| 13 | Backend is stateless and horizontally scalable (hosting-neutral claim) | In the code read: per-instance verifier cache and per-instance in-flight limiter only; the memory object store and repo are test-only [repo]. Not an exhaustive audit of every package | FIT | Keep it that way; re-check when the boundary worker lands |
| 14 | Event history is the durable audit record, written in the same transaction (RULE-019) | Supabase Free has no automatic backups and can pause [docs: pricing page]. Durability then rests on our own dump | FIT WITH CONDITION | Nightly dump to a second location plus one restore rehearsal (meets the local RPO 24 h / RTO 8 h targets only if both exist) |
| 15 | Private origin reachable only through an authenticated path (ADR-001 criterion 5) | Backend ingress is public and authenticates every request; no WAF or edge rate limit (no proxy, by decision). Invalid-token floods cost Cloud Run CPU and ZITADEL calls (only positive results are cached) [repo] | FIT WITH CONDITION | Denial-of-wallet controls: `max-instances` caps, `MC_MAX_IN_FLIGHT`, budget alerts, and a check of request counts during the pilot |
| 16 | No response is cached across users; per-request dynamic rendering (`api-auth-decision-analysis`) | No `'use cache'` is used in the app [repo]; `revalidatePath` is per instance | FIT | If caching is added later, a shared cache handler and a cross-user review are required |
| 17 | Import/export handle workbooks up to 25 MiB (W1) | xlsx parsing and generation are in memory in the backend; frontend also buffers an import's bytes in a pending attempt [repo] | FIT WITH CONDITION | Size Cloud Run memory at 1 GiB for both services; load-test one 25 MiB workbook; unmeasured |
| 18 | Single hosting constraint "Cloudflare Free Tier, $0" (ADR-001) | Replaced by the approved H1 exception (ADR-004 decision 1); $0 not guaranteed; card attached (decision 2) | FIT (by decision) | Keep the budget alerts and usage checks in the checklist |

## W1 envelope against the approved free allowances

W1 (`step-02-local-approval.md`): 1 workspace, ≤10 active matters, 15 named users, 5 concurrent editors, ≤300 records per matter, 2 GB documents, 25 MiB per file. These are measurement inputs, not capacity claims.

| Dimension | Allowance | Assessment |
|---|---|---|
| Requests (15 users, 5 concurrent) | Cloud Run about 2M requests/month **[recall]** | Fits by orders of magnitude; one frontend instance and ≤2 backend instances cover 5 editors |
| Database size | Supabase Free 500 MB [docs] | Likely fits for 3000 records plus history and receipts, but unmeasured; alert at 400 MB |
| Database connections | Not published for Free [docs] | 2 backend instances × 10 = 20 at most; check on the dashboard |
| Documents | R2 10 GB-month, 1M/10M operations [docs] | 2 GB fits, counting every version and orphan; each upload costs one Head and one Put |
| Single file | Cloud Run HTTP/1 request limit about 32 MiB **[recall]** | 25 MiB fits narrowly; two Cloud Run hops; needs the 25 MiB smoke test |
| Recovery | Local targets RPO 24 h / RTO 8 h | Reachable only with the nightly dump and a rehearsed restore |
| Users | ZITADEL Free: 100 daily active users [docs] | 15 users fit |

## Options considered for the gaps

| Gap | Option 1 (recommended now) | Option 2 (later) |
|---|---|---|
| Demo-mode default (#11) | Runtime guard in the frontend | Remove demo mode from production builds entirely |
| Long operations vs timeouts (#7) | Per-route timeouts, then measure | Chunk bulk/import into bounded requests with client-side progress |
| Boundary trigger (#5) | Cloud Scheduler → authenticated endpoint | Always-on instance with an in-process ticker (leaves the free tier) |
| IdP in the request path (#10) | Keep introspection with the 30 s cache | JWT access tokens plus local JWKS validation |
| Stateful frontend (#12) | Single instance, accepted | Durable session and attempt store |

## Consequences

- The domain, concurrency and storage design need **no change** for this infrastructure.
- Two items must be closed before any deploy because they are policy or availability issues rather than tuning: #11 (demo-mode guard) and #7 (bulk/import timeouts, with B4).
- Performance and cost remain **unmeasured**; the first deployed run must produce the NFR-006 measurements and a usage reading against each free allowance.
- Document drift (#8) should be corrected so the architecture documents describe what runs.

## Action items

1. [ ] Frontend: production runtime guard against `API_MODE=demo` (TB-12) with an explicit CI opt-in; add a test; rebuild and re-smoke the image. Owner: Claude (frontend scope) on request.
2. [ ] Backend: extend B4 to import and bulk-commit routes; add a rows-per-request cap or chunking; measure at the deployed RTT. Owner: Codex.
3. [ ] DevOps: Cloud Run and Supabase in the same region; `max-instances` (frontend 1, backend 2); memory 1 GiB; budget alerts; request-count watch for floods.
4. [ ] Architecture docs: update `document-lineage.md` (content-addressed storage, R2 layout) and TB-08 (external cron trigger, Cloud Scheduler). Owner: Claude.
5. [ ] PO/engineering: numeric idempotency-receipt retention once final timeouts exist (TB-06/13).
6. [ ] Verification: first-deployment measurement plan (30 repetitions at 50/200 rows, upload/download of 25 MiB, one 25 MiB workbook, ZITADEL latency at TTL 30 s, DB size, R2 operation counts); nightly dump plus restore rehearsal with SHA-256 check of a downloaded document.
7. [ ] After the first deployment: re-run this matrix with measured values and mark each "FIT WITH CONDITION" as met or not.
