# System review — MC-ZCODE-SYSTEM-MULTITENANCY-REVIEW-20261029-R2 (Phase A)

Owner: actual ZCode (this session). Authorship overlap: ZCode authored the W1 transaction-spine work and FE baseline in earlier sessions (AUTHOR_REVIEW portions); the reviewed frontend workbench/density/fidelity surfaces and the review-matrix corrections were authored by Claude and the ZCode rework session respectively — those are reviewed here as NONAUTHOR reads of their bytes. Identity/tool: model GLM-5.3-Flash via ZCode CLI, macOS arm64, Go 1.27.3, Node 24.22.1, Docker 29.9.2.

## 1. Actual trust-boundary and data-flow diagram (tied to files)

```
Browser (session cookie, opaque BFF session)
  │
  ▼
Next.js 16 BFF / RSC  ── apps/frontend/src
  │  auth: /api/auth/login|callback|session|logout (oidc flow.ts: PKCE + state cookie)
  │  drafts: sessionStorage keyed mc:<draft|attempt>:<sessionNamespace>:<scope>  (lib/mc/drafts.ts)
  │  server actions: requireSession → backendRequest (fail-closed, AUTH_ALLOW_ANONYMOUS=false)
  ▼
Go product API (mcapi, echo) ── internal/adapter/inbound/productapi/server.go
  │  authenticate: Bearer → TokenVerifier.Verify (introspection, audience, private_key_jwt)
  │               → IdentityResolver.Resolve(issuer, subject) → actor UUID   (server.go:239-256)
  │  unauthenticated→401 · unprovisioned→403 · verifier outage→503
  ▼
Central service policy/transaction ── internal/core/service/work_service.go
  │  execute(): store.Execute locks the matter; ws+matter memberships re-read INSIDE the tx;
  │  policy default-deny (Hidden→404 uniform, role→403); deny commits restricted audit row
  │  readSnapshot(): one snapshot = authz + graph eval; receipts replay re-authorizes every
  │  represented matter with CURRENT access (matter_service.go:292-320)
  ▼
PostgreSQL (shared schema, per-matter rows; goose migrations 0001-0008)
  + object storage (fs local | R2 private bucket, matter-scoped keys)
```

Tenant selection is never accepted from the client: every service call takes an explicit matter/workspace ID that the server resolves through its own membership lookups. The BFF holds no per-tenant trust: it is session-scoped and re-reads authorization on every server request.

## 2. Tenant model (Phase A headline)

| Layer | Boundary |
|---|---|
| Identity | provisioned `users(idp_issuer, idp_subject)` UNIQUE; lookup-only resolver; no JIT provisioning (identity_resolver.go) |
| Organization / customer firm | **does not exist** (no table, no claim mapping, no lifecycle) — SYR-F01 |
| Workspace | membership + OWNER/MEMBER role; the operational container (lists, matter creation by OWNER) |
| Matter | the confidentiality boundary: explicit membership OWNER/EDITOR/VIEWER, ACTIVE status, workspace activity required too (AND semantics) |
| Derived artifacts | documents/versions/evidence/claims/assessments/filings/context/review grids/answers/events/receipts — all carry `matter_id` with composite FKs to matter-scoped parents |

**What the product actually implements is workspace-level logical multi-tenancy with matter-level confidentiality, on a shared schema, one deployment.** One person can be a member of many workspaces (and many matters). One issuer can back many workspaces — nothing in the schema separates two independent firms sharing a deployment/issuer except their workspace/matter rows. ZITADEL organization/project membership is not consulted by the API (audience + introspection only) — it is a separate IdP-side control.

## 3. Backend/API verdict

- Endpoint census: ~70 routes under `/api/v1`, all behind `authenticate` (server.go:110-199). Probes `/healthz`, `/readyz` public.
- Enforcement is centralized: every write goes through `execute` (locked matter tx, in-tx membership reads → revocation races are closed by construction); every read through `readSnapshot` (one snapshot). Exceptions to the central gate were searched: people-directory (flag-gated, SQL-bounded), receipts replay (`authorizeReceiptScope` re-checks CURRENT access for every represented matter — no stale replay), export/version content (transfer timeout class, still behind the same service reads).
- Hidden vs role denial is implemented exactly as the approved matrix: hidden = missing/revoked membership → uniform 404; role denial → 403. Unprovisioned identity → 403 (server.go:238 comment + observed in my verifier test).
- CAS: `If-Match` mapped by `expectedRevision`; an unreadable resource maps to revision 1 so the service refuses with the uniform denial before any CAS (no existence oracle via If-Match, server.go:302-321).
- Idempotency: receipts PK `(actor_id, idempotency_key)`, request-hash fingerprint (method+path+If-Match+body), cross-fingerprint reuse refused (`ErrIdempotencyKeyReuse`), refused commands store no receipt (F01 fix), replay re-authorized per represented matter. My cross-matter key test confirmed refusal.
- Read-surface spot checks (source): lists/counts/aggregates derive from the same matter-scoped snapshot; export and brief read through the same gate; no handler composes its own SQL.

## 4. Frontend/session verdict

- Drafts/attempts live in sessionStorage under a per-session opaque namespace + explicit scope (`mc:draft:<ns>:<scope>`, `mc:attempt:...`); cleared on success/discard/logout and, since the F04 correction, on definitive access loss via `clearScopeDrafts(namespace, 'review:<gridId>:')` — one surface's purge never touches another namespace/scope (drafts.ts:152-170).
- Namespace is resolved server-side per session (draft-scope-server.tsx) — another sign-in cannot see the previous session's drafts.
- Access-loss semantics: `IntentForm.onAccessLoss` fires only for definitive unauthenticated/forbidden/not-found; 412/UNKNOWN keep content for safe recovery (verified by the isolated 42-test run).
- The retained dev runtime at :3000 was NOT used as audit evidence for this Phase A (its module graph predates the corrected backend; the author states the retained API is not the corrected binary). All FE conclusions are from source + isolated unit runs.

## 5. Verdict table

| Dimension | Verdict |
|---|---|
| Tenant model | Workspace+Matter logical tenancy, shared schema; **no organization/customer entity** (SYR-F01). One-person-many-workspaces: yes. One firm→many workspaces: only by convention. |
| DB integrity | Strong: composite matter-scoped FKs on every business table, append-only triggers (events, receipts, versions, signature observations), typed totality constraint, receipts actor-scoped + scope CHECK. Defense-in-depth gaps confined to review matrix (SYR-F02). No RLS; production role grants deferred (deployment decision). |
| API logical isolation | SUPPORTED for implemented surfaces — central gate verified in source + fresh-PG race contracts + 3 new reviewer negative tests. Coverage gap: only executed suites count; browser-level cross-tenant journeys NOT_RUN. |
| FE/session/artifact isolation | Source-confirmed + unit-verified (42/42 corrected review/upload tests). Rendered second-user/revocation/UNKNOWN journeys NOT_RUN. Object URL expiry/revocation unverified (no real provider calls allowed). |
| Production SaaS suitability | NOT_SATISFIED as independent-firm SaaS: no org boundary/lifecycle (SYR-F01), no per-firm backup/export/residency story, no noisy-neighbor isolation beyond MaxInFlight, people directory must stay off for shared issuers (SYR-F04), retention policy open (TB-06, SYR-F03). This is a scope statement, not a defect list: approved P0 never promised org-SaaS. |

**Headline answer (plain language):** the product correctly enforces *workspace-and-matter* isolation end to end at the sources and tests audited here (SUPPORTED_WITH_LIMITS for the implemented model), and it does **not** implement organization-level multi-tenancy — independent customer firms on one deployment are separated only by operational convention (NOT_SATISFIED for that stronger claim). RMV-F01..04 corrections are independently reverified at the levels executed; final closure still needs the rendered/second-user journeys that remain NOT_RUN.

## 6. Limits of this audit
- Pinned bytes: 512-file dirty working tree (zero drift during the window; rehash recorded in drift-at-close.txt). Later implementation changes need a delta review.
- Executed: fresh-PG race contracts (postgres packages 64.4s), service+HTTP race suites, focused RMV HTTP tests, people-directory PG test, 3 reviewer negative tests, isolated frontend 42 tests. Not executed: full `make check` on the copy (author's 640-test receipt cited, not rerun in full — my executed subset covers the isolation-critical packages), lint/gofmt gates, full frontend `pnpm check`, E2E.
- No real R2/provider/IdP/retained-runtime contact. No credential reads. Fixture secrets randomized in 0700/0600 files, removed after label-checked cleanup (no secrets in this namespace).
