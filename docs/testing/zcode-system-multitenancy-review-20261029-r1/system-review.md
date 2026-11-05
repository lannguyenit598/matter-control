# System review — MatterControl candidate @20feedbf (uncommitted)

Author identity: actual ZCode session (model account:zai-start-plan/GLM-5.3-Flash). Authorship overlap: Review Matrix correction + its shared frontend deltas are AUTHOR_REVIEW (this session's own work); all other subsystems reviewed as nonauthor work. This document describes the pinned candidate only (inputs-manifest.json; 763 files verified into an isolated copy) and stays immutable after the visual phase.

## 1. Trust-boundary diagram (tied to actual files)

```
Browser (Next.js 16 App Router, apps/frontend)
  │  server components read via repositories (features/*/repository.ts, 'server-only'),
  │  each call carries the USER's session token (lib/auth, lib/mc/client.ts)
  │  client mutations go through Server Actions ('use server', features/*/actions.ts)
  │    - requireSession() first, zod re-validation, then repository call
  ▼
Next BFF proxy (lib/mc/client.ts → http://127.0.0.1:8080/api/v1)
  │  no tenant context accepted from browser; IDs are path params re-checked server-side
  ▼
Go product API (apps/backend cmd/mcapi → internal/app/product.go composition root)
  │  echo middleware: in-flight limit (server.go:110), s.authenticate (zitadel verifier:
  │  pinned issuer http://localhost:8080, audience, https enforcement, JWT signature)
  │  productapi handlers: strict decode (decodeStrict), CAS headers, Idempotency-Key,
  │  request fingerprint = f(method, path, URL path, body, If-Match) (server.go:345)
  ▼
Core services (internal/core/service): WorkService.execute / readSnapshot = THE central gate
  │  every command/read resolves (workspace_membership AND matter_membership) inside the
  │  matter transaction/snapshot, then policy.Decide*(access); hidden resources → ErrNotFound
  │  receipts replay only after the gate; fingerprint binds URL path (A-01 mitigation)
  ▼
PostgreSQL (single schema; migrations 0001-0008) — per-matter transaction + unconditional
  │  matter lock serialization; composite FKs; append-only/no-delete triggers
  ├─ Object storage (adapter/outbound/objectstore): content-addressed SHA-256 keys,
  │  matter-scoped Put/Open, size caps; local FS in P0 (R2 adapter exists behind config)
  └─ ZITADEL (external IdP, http://localhost:8080 in P0) — identity = (issuer, sub)
```

Key property verified in code and by tests: **the browser never selects the tenant**. Every request carries only the caller's token; the matter/grid/document IDs in URLs are untrusted inputs resolved against the caller's membership inside the same transaction that serves the data.

## 2. Tenancy model (headline answer)

| Layer | Entity | Notes |
|---|---|---|
| Identity | `users(id, idp_issuer, idp_subject UNIQUE)` | one person per issuer identity; no email identity |
| Customer/company | **NONE** | no organization table exists (finding A-03) |
| Tenant key in code/DB/API | **Workspace** (`workspaces`, `workspace_memberships` OWNER/MEMBER) | the de-facto customer boundary |
| Confidentiality sub-scope | **Matter** (`matter_memberships` OWNER/EDITOR/VIEWER, ACTIVE/REVOKED) | explicit membership required even for workspace OWNER |
| Resource scope | every business table carries `matter_id` (or inherits it via a composite parent FK) | see database-review.md |

- One person may belong to many workspaces; one workspace holds many matters. Both are supported and tested.
- The permission baseline (active workspace membership AND explicit matter membership AND operation role) is enforced centrally (execute/readSnapshot + policy.Access) and adversarially re-tested here (T-03..T-06, T-10).
- **What this model is**: workspace-level logical multi-tenancy with matter confidentiality — suitable for the current P0 single-issuer deployment where each customer firm = one workspace, if people are provisioned per firm.
- **What it is not**: organization-level SaaS tenancy. There is no org entity, no org-scoped directory (A-02: the local people directory is issuer-wide), no per-org lifecycle/backup/residency isolation. Do not market or deploy multiple independent customer firms on one issuer without the A-02/A-03 decisions.

## 3. Backend/API enforcement

- ~95 API routes under `/api/v1` (census in tenant-isolation-matrix.json + server.go:110-195): workspaces, matters, memberships (+member-candidates), events, work graph (requirements/actions/dependencies/workstreams/parties/milestones/waiting-on), operations receipt + reconciliation, `me/actions`, documents/versions/content/promotion/signatures, proof (criteria/evidence/claims/assessments/disputes/verifier designation), filings (9-stage machine + signature applicability + observations/correction), control room, context records, bulk/import/export/brief, and the review matrix (7 routes).
- All handlers share `s.authenticate`; all matter-scoped handlers pass `c.Param("id")` into services that re-resolve membership. No handler trusts a client-supplied tenant/workspace/actor field (request DTOs decoded strictly; DisallowUnknownFields; duplicate-key rejection).
- Reads are checked as seriously as writes: every read path funnels through `readSnapshot` with the same access decision; hidden resources return uniform not-found (verified by contracts + probes).
- Receipts: stored per (actor, key) with scope kind, represented-matter rows, and a fingerprint that includes the URL path; W6 receipt replay re-authorizes the receipt's saved scope before exposing anything. Gap: service-layer matter binding (A-01).
- Object storage: content-addressed (SHA-256) keys under matter scope, size caps, no URL guessing surface in P0 (local FS adapter; version content served through the authorized document/version path).

## 4. Frontend/session

- Session model: server components render with the user's token via repositories; client writes go through Server Actions that `requireSession()` and re-validate with zod before proxying. No token/cookie touches client JS storage (cookies are httpOnly via the BFF; drafts store VALUES only, never tokens — lib/mc/drafts.ts).
- Drafts: `sessionStorage` under a per-session namespace hash + explicit scope strings; feature scopes (e.g. `review:{grid}:{version}:{question}`, `matter:{id}:new-review-grid`, `document:{id}:upload`) prevent cross-scope resurrection; denied screens purge (`PurgeDrafts`), and the step01 correction purges grid-scoped review drafts/attempts on definitive denial (AUTHOR_REVIEW).
- Access-loss handling: `ReadFailure` at page level; in-surface clearing via the ReviewAccessProvider/CellDetail corrections; unknown outcomes keep recovery affordances (412 keeps text; UNKNOWN offers same-key retry only for receipted commands).
- URL selection (grid/cell/state/q) carries opaque IDs only; leakage risk sits in API authorization (covered), not in the URL itself.
- Browser-level verification remains NOT_RUN (A-06): no authenticated journey was executed in this audit; component-level tests (88×3) pass on the pinned bytes.

## 5. Deployment/configuration posture (source-level)

- Single Go binary, single Postgres schema, local object dir; `.env.example` documents MC_OIDC_*, MC_DATABASE_URL, MC_OBJECT_*; `MC_LOCAL_PEOPLE_DIRECTORY` defaults false; identity URLs require https in current config validation (commit 20feedb).
- No Docker compose changes reviewed at runtime; no production TLS/roles/grants exist to certify — production readiness is out of scope for source review and remains a recorded blocker for release claims.
- CI moved to repository root (f8c0928); not executed here.

## 6. Verdicts

| Dimension | Verdict |
|---|---|
| System architecture | SUPPORTED_WITH_LIMITS — clean hexagonal layering, single central gate, honest boundaries; service-layer receipt scoping (A-01) and missing org entity (A-03) are the material limits |
| Multi-company suitability (as-implemented model) | Workspace-level: yes, tested. Organization-level SaaS: NOT_SATISFIED (by design today) — see §2 |

Headline in plain language: **the product implements Workspace+Matter logical multi-tenancy and that boundary holds end to end in the audited source and tests (SUPPORTED_WITH_LIMITS); it does not implement an organization/customer tenant layer, so it is not certified for multiple independent customer firms sharing one identity issuer.**
