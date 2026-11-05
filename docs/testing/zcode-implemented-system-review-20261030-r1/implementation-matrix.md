# Implementation matrix — reviewed candidate (r1, 2026-10-30)

Candidate: branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`, dirty worktree (uncommitted, ~602 files delta vs HEAD). Reviewed bytes are the dirty-tree bytes hash-bound in `source-manifest.csv` (1,096 entries: 323 governance/docs + 214 backend + 559 frontend) — drift 0 at close (`drift-report.md`).

States: `IMPLEMENTED_SOURCE` (in code, untested claim) · `LOCAL_VERIFIED` (locally exercised this review) · `RENDERED_VERIFIED` (visually rendered) · `DESIGN_ONLY` · `PREPARED_NOT_EXECUTED` · `NOT_RUN` · `BLOCKED` · `REWORK_REQUIRED`.

Reviewer identity note: most reviewed chains were authored by sessions in this same ZCode lineage; per the authorship declaration, all LOCAL_VERIFIED marks **this review** on those bytes; independent acceptance still belongs to a non-author (OpenCode or a fresh independent ZCode/QA session).

## A. Product workflows and API contracts

| Workstream | Key files | Author claim (return chain) | Verified state this review |
|---|---|---|---|
| HTTP API surface | `internal/adapter/inbound/productapi/server.go` (92 routes under `/api/v1`) | complete contract set | `IMPLEMENTED_SOURCE` — route inventory only; per-contract exhaustiveness **not claimed** |
| Auth admission | Bearer + IdentityResolver middleware; context timeouts 10s/60s; in-flight cap 503+Retry-After; 1 MiB body limit; 25 MB upload cap | source-verified | `IMPLEMENTED_SOURCE` + contract-level behavior exercised via race suite |
| WebSocket sharing (W6) | `internal/adapter/inbound/productapi` ws paths | implemented | `LOCAL_VERIFIED` — unit/race covered incl. W6 group-rollback scenario (postgres package) |
| Command receipts / legal history | `internal/core/service/{work_service.go,matter_service.go,evidence_service.go}`; append-only tables + triggers | receipts append-only, idempotent | `LOCAL_VERIFIED` partially — idempotency holds in-matter; **cross-matter replay gap confirmed at service layer (R-02)**; HTTP admission fingerprint mitigates |
| Products (matters/workspaces/requirements/actions/evidence/reviews) | `internal/core/service/*`, `internal/adapter/outbound/postgres/*` | full phase-C contracts | `LOCAL_VERIFIED` — full `go test -race` suite 708 PASS / 0 FAIL / 4 SKIP over PG 18.6 fixture; route inventory covers 92 paths; **not an exhaustive per-handler line review** (see unsampled list) |

## B. Tenant isolation, authentication, security

| Workstream | Key files | Author claim | Verified state |
|---|---|---|---|
| OIDC (front) | `src/lib/oidc/flow.ts` + `session.ts` (~835 LoC incl. tests), 6 `/api/auth/*` routes | PKCE+state+nonce, RS256 ID-token verify, httpOnly opaque session cookie | `IMPLEMENTED_SOURCE` — source-read; 10 feature action files use `requireSession` (listed in prior returns); browser/IdP journey `NOT_RUN` |
| OIDC/JWKS cache (back) | `internal/config/product.go:104` (`MC_OIDC_CACHE_TTL`=15s) | TTL per ADR-004 D4 (30s) | `REWORK_REQUIRED`/decision — mismatch confirmed (R-03) |
| Multipart transfer (25 MiB) | `internal/adapter/inbound/productapi` upload handlers + `objectstore` | streaming + SHA integrity + UNKNOWN semantics | `LOCAL_VERIFIED` contract-level; real-R2 leg `NOT_RUN` (skip: no bucket) |
| Rate/burst admission (B3) | in-flight cap only | decision-required design | `DESIGN_ONLY` (no per-actor limiter in source — consistent with docs) |
| Least-privilege DB roles (B1) | `b1_least_privilege_test.go` + profile migrations | 55/55 PASS | `LOCAL_VERIFIED_PASS_SCOPED` — event log 56 pass/0 fail incl. package line; local fixture only; managed-Supabase grants `NOT_RUN` |
| MFA / assurance claims (B6) | none in code | checklist prepared | `NOT_RUN` (app checks no assurance claims — recorded) |

## C. PostgreSQL, migrations, reliability

| Workstream | Key files | Author claim | Verified state |
|---|---|---|---|
| Schema migrations | `sqlc.yaml` (pinned sqlc 1.31.1 — `make sqlc-check` PASS) + migrations 0001–0008 | complete | `LOCAL_VERIFIED` — `mcapi migrate` applied 0001–0008 cleanly on fixture (cloud-run-profile), all suites pass |
| Proposed indexes `0009` | SQL-fixes packet (draft) | additive, not applied | `PREPARED_NOT_EXECUTED` — never applied here (R-09 note on scale-1 EXPLAIN) |
| Durable-session semantics | `durable_session_reference_test.go` (reference harness) | rotation atomic, fail-closed | `LOCAL_VERIFIED` — TestDurableSessionRotationSemantics 4/4 PASS on race run; production store `DESIGN_ONLY` (Workers-side not written; `durable-session-events.json` receipt mislabel → R-05) |
| Retry/rollback patterns (W6 group) | postgres adapter | txn group rollback | `LOCAL_VERIFIED` (race run, incl. memory-seam skip variant) |
| Restore/rehearsal | restore test | skip-gated | `NOT_RUN` (skip: perf/restore rehearsal opt-in — options not enabled this run) |

## D. Frontend, UI/UX, accessibility

| Workstream | Key files | Author claim | Verified state |
|---|---|---|---|
| Product routes | `src/app/(app)/*` (18 product pages) + `/login` + `/` | complete surface | `IMPLEMENTED_SOURCE` — 27/27 static routes build (turbopack & webpack); `/` entry broken (R-01) |
| Design system — Solid Glass | atoms/molecules/templates incl. `molecules/dialog.tsx:96` (GlassSurface) | shipped | `IMPLEMENTED_SOURCE` + `LOCAL_VERIFIED` via 720/720 vitest on jsdom; liquid tier no jsdom coverage |
| Liquid Glass tier | `glass/` kernel + probe (prior chain) | FINISHED per chain return | `IMPLEMENTED_SOURCE`; product-tier rendering `NOT_RUN` (jsdom cannot; Storybook runtime FAIL R-08) — commit note stays "kernel verified by probe", not product-verified |
| Review filters (unread) | `features/reviews/components/review-filters.tsx:63` | consistency pass | `REWORK_REQUIRED` (raw button, R-07) |
| A11y / keyboard / dark-contrast | — | claims in ui-ux returns | `NOT_RUN` (no browser/a11y tooling this session) |
| Entry journey | `next.config.ts:49-52`, `page.tsx`, `flow.ts:84` | — | `REWORK_REQUIRED` (R-01 404 on `/`) |

## E. Deployment, storage, recovery, cost

| Workstream | Key files | Author claim | Verified state |
|---|---|---|---|
| Backend container | root `Dockerfile` (distroless nonroot, static binary) | reproducible image | `LOCAL_VERIFIED_PASS_SCOPED` (ADR-006: build, migrate-separate, healthz/readyz 200, SIGTERM 0.17s) — reused as author evidence; not rebuilt here (no drift) |
| Cloud Run profile | `cloud-run-profile.md` | reviewed-profile proposal | `DESIGN_ONLY` + decision-required (invocation model) |
| Workers adapter | no adapter in source | PoC prepared | `PREPARED_NOT_EXECUTED` (`adapter-poc.sh` pinned; OpenNext 1.20.14 vs vinext 1.40 research) |
| Durable Workers store | `durable-state-design.md` | SQL semantics proven | `DESIGN_ONLY` (implementer handoff + security review pending) |
| R2 object storage | `internal/adapter/outbound/objectstore` | contract tests | `LOCAL_VERIFIED` local contract; provider legs `NOT_RUN` (no bucket; skip) |
| CI/CD | `backend.yml`, `frontend.yml` (repo), `ci-cd-and-runbook.md` sketches | templates | `IMPLEMENTED_SOURCE` for checks; cloud-cred jobs `DESIGN_ONLY` |
| Cost/residency | approval packet §cost | allowances researched (fresh 2026-10-29/30 fetches: R2 free tiers, Supabase 500MB/pause, ZITADEL 100 DAU, Cloud Run request-based free tier) | `DESIGN_ONLY`; **strict $0 NOT GUARANTEED**; stage-2 authorization pending PO (6 decisions listed in packet) |

## Explicitly unsampled / not line-reviewed

Neither route inventory nor suite-pass implies exhaustive code review of these:

- `internal/adapter/outbound/{sheet,system,identity/zitadel}` beyond their tests; `httpapi` (no tests) beyond route/auth-inbound inventory.
- Deep per-handler semantic review of all 92 productapi routes (contract tests cover many, not all).
- `internal/config/*` beyond the flags this review read; `observability` beyond package-pass.
- Frontend: per-component visual fidelity, i18n content beyond spot checks, `instrumentation*`.
- Governance/design docs consumed contextually, not as line-of-record byte review apart from hash checks.

## Missing-proof ledger (claims still without executable proof)

1. Workers adapter runtime behavior (`PREPARED_NOT_EXECUTED`).
2. Managed-provider legs: Supabase grants/pooler/Data-API, R2 SigV4 real bucket, Cloud Run deploy/IAM/domain, ZITADEL policy readback, backup/restore rehearsal — all `NOT_RUN` (authorized stage only).
3. Product liquid-glass rendering + browser E2E journeys + a11y.
4. 0009 migration application + production-scale EXPLAIN.
5. Non-author acceptance of any reviewed chain (independent QA not yet run).
