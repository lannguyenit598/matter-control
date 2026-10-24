# Security Architecture

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`; frontend `3e5a642479acb789eb210e73fba956f3e85082e3`; Cloudflare secrets/logs snapshots.
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**. Identity provider WAITING_PO_APPROVAL. OpenCode round-1 document review (session `ses_e929198d8ffeFwkVV16SNbAFYR`) returned CHANGES_REQUIRED; this rework is not yet re-reviewed. A document review is not a security certification. No compliance certification is claimed.

## 1. Source findings that drive the design

| Finding (pinned source) | Consequence |
|---|---|
| `internal/adapter/inbound/httpapi/server.go`: "This template has NO authentication: attach auth middleware here" (`APIMiddleware`) | Backend auth middleware must be added; docs/OpenAPI routes stay disabled by default (`APIDocsEnabled=false`) |
| `src/lib/auth-provider.ts`: `resolveSession()` returns `null` (fail-closed stub) | Must be implemented against the chosen IdP; fail-closed default retained |
| `src/lib/api/backend.ts`: `session.accessToken ?? serverEnv.API_TOKEN` | Shared token fallback would make every user the same principal; **forbidden for MatterControl data** — requests without a user token fail |
| `src/lib/auth.ts`: demo mode returns wildcard session; `AUTH_ALLOW_ANONYMOUS` | Production build/start must reject `API_MODE=demo` and `AUTH_ALLOW_ANONYMOUS=true` |
| `next.config.ts`: CSP without nonces, `'unsafe-inline'` scripts | Not acceptable for any option that puts bearer tokens in the browser (F3, §6.1); reassess for F1/F2/F4 with PoC evidence |
| Template logs path only, no query strings; otelpgx traces SQL without parameters | Retain; extend to forbid document content and titles in logs |

## 2. Identity (options, WAITING_PO_APPROVAL)

| Option | Description | Notes |
|---|---|---|
| ID-A | External OIDC provider; Next.js holds the session (httpOnly cookie), forwards the user's access token; Go validates JWT (issuer, audience, expiry, signature via cached JWKS) | Provider cost/free-tier unverified |
| ID-B | Cloudflare Access in front of both apps, Go validates the Access JWT | Free-tier terms not in supplied evidence: UNVERIFIED; couples identity to hosting |
| ID-C | Self-hosted OIDC on the origin host | Operational burden |

In all options the identity provider only authenticates. `users` maps `(issuer, subject)` to a MatterControl user; memberships, roles and verifier designations live only in MatterControl. Tokens are never logged and never placed in URLs.

## 3. Authorization

- `core/policy` encodes the approved permission matrix as a table: `Can(actor, operation, scope) → Allow | Deny(reason)`. Unknown operations are denied by default. Each inbound use case declares its operation constant; a unit test asserts every registered operation has a matrix row (no unguarded endpoint).
- Evaluated **inside the command transaction** after the matter lock with memberships read `FOR SHARE` (data-model §7), in the global lock order ([ADR-002 §1a](adr/ADR-002-transaction-and-concurrency.md)), so revocation and writes are causally ordered. Matter ownership means *effective* ownership (data-model §2). Reads authorize inside their snapshot. Replays and `GET /operations/{key}` re-run current read authorization on the receipt scope before returning any stored body.
- Workspace OWNER grants no matter access (AC-118). Assignment and owner fields never grant access. Import/bulk cannot touch memberships or verifier designations.
- Verification independence: policy + DB CHECK (evidence-model §3).
- **Uniform not-found**: if the caller lacks workspace or matter membership, every resource returns the same `404 /problems/not-found` body (no title, count or existence signal); `403` is used only when the caller is a member of that matter and lacks the role. Search, counts, My Actions and exports are computed only over matters with active membership.
- Denials write `security_audit_events` (operation, outcome, hashed requested ID, request ID) — never domain events, never content.

## 4. Indirect access paths

| Path | Control |
|---|---|
| Document content | Authorized streaming proxy, no presigned GET, `private, no-store` (document-lineage §4) |
| Exports | Artifact metadata bound to matter + requester; `GET /exports/{id}/content` re-checks current membership; artifact keys random |
| Status brief | Matter-scoped; recomputed per request; access scope stated in provenance |
| History | Same-matter membership; security audit separate and restricted to operators |
| Next.js caching | Matter data rendered dynamically per request (`connection()` / no `'use cache'` on user-scoped data); `revalidatePath` only invalidates; no shared cache entries keyed without user |
| Staged uploads | Single-key, short-lived write grant or API streaming; commit re-authorizes |
| Idempotent replay / operations lookup | Receipt bound to actor and scope; replay only after current authorization, else uniform 404; hash includes path scope, so no cross-matter echo |
| Bulk/import previews | Bound to actor, matter, expiry, digest; commit re-authorizes per row/group; no detail for inaccessible IDs |

## 5. Threat model (STRIDE summary)

| Threat | Example | Mitigation | Test |
|---|---|---|---|
| Spoofing | Forged JWT; shared API token reuse | JWKS validation, audience check, no token fallback | Token tests; AC-134 |
| Tampering | Client sends derived state; edits history | Read-only derived fields; no history mutation routes; DB triggers | AC-149, AC-160 |
| Repudiation | Verifier denies acceptance | Events with actor, reason, version, recorded time | AC-107 |
| Information disclosure | Guessed IDs, counts, file URLs, error messages | Uniform 404, scoped counts, proxy streaming, safe problem details | AC-135, AC-147 |
| Denial of service | Oversized import (zip bomb), huge uploads | Size limits (values with workload decision), streaming parsers, row caps, template `BodyLimit` for JSON | Import fuzz tests |
| Elevation of privilege | Self-grant via import; self-verification via evidence sharing; last-owner removal | Import cannot write memberships; claim-scoped independence; last-owner trigger | AC-140, AC-158 |
| Spreadsheet injection | `=HYPERLINK(...)` in exported cell | Write all user text as string cells; CSV cells starting `= + - @ \t \r` prefixed with `'`; never evaluate formulas/macros on import; `.xlsm` macros ignored, external links not fetched | AC-148 |
| Malicious content | HTML/SVG uploaded as evidence | Download as attachment, `nosniff`, `sandbox` CSP; no server-side rendering or conversion in P0 | DL tests |

## 6. Data protection

- TLS for browser↔frontend, frontend↔API, API↔database (`verify-full` where the provider supports it) and API↔object store.
- Encryption at rest depends on the chosen database/object-store providers: UNVERIFIED until ADR-001 is decided.
- Secrets (DB URL, object-store keys, IdP client secrets) via platform secret stores (Workers secrets for any Worker component; host secret manager for the Go origin). Never `NEXT_PUBLIC_*`, never `vars`.
- Logs/traces: request path, route, status, request ID only; Workers Logs retention (3 days on Free per docs) is operational logging, not the audit record. Domain history lives only in PostgreSQL.
- Backups inherit matter confidentiality; restore tests use synthetic data in isolated environments (AC-155).

### 6.1 Entry conditions if ADR-003 F3 (static SPA) were chosen — NOT selected

F3 puts access tokens in the browser, so script injection becomes token theft, and a stolen token passes current-membership checks until it expires. F3 is eligible for PO selection only if its PoC demonstrates all of:
1. Script CSP without `'unsafe-inline'`/`'unsafe-eval'` (hash allowlist + `'strict-dynamic'`, since static export cannot issue nonces), plus `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`, Trusted Types, and no third-party scripts.
2. OIDC Authorization Code + PKCE. The access token is held only in memory, never in storage or URLs, with a short lifetime (value set with the IdP decision). Refresh must not expose a long-lived token to script; a token endpoint would reintroduce a server component and be assessed as such.
3. API: exact-origin CORS allowlist; `Authorization` header only (no ambient cookies); issuer/audience/expiry/signature validation; unchanged per-request membership checks.
4. Sender-constrained tokens (DPoP) as optional hardening if the IdP supports it (UNVERIFIED).

Residual stolen-token window is accepted only by PO decision. Under F1/F2/F4 tokens stay server-side.

## 7. Security tests mapped to AC

| Suite | Coverage | AC |
|---|---|---|
| Matrix conformance | Every operation × {OWNER, EDITOR, VIEWER, non-member, other-workspace} via direct API calls, not UI | AC-134, AC-135, AC-118 |
| Revocation | Revoke between preview and commit, between export create and download, mid-session content fetch | AC-147 |
| Verifier independence | Self, claimant, raiser, non-designated, one-member matter | AC-140 |
| Membership safeguards | Last owner, cross-workspace grant, imported role | AC-158 |
| Leakage | Byte-identical 404 for nonexistent vs inaccessible; no counts in My Actions/export filenames | AC-118, AC-135 |
| Spreadsheet | Formula-leading text round trip; macro/link ignored | AC-148 |
| Replay and reconciliation | Replay after revocation → 404; different scope same key → 422; in-flight duplicates → one effect; expired key → 422/410; 404 never treated as final | AC-147, AC-153 |
| Lock order and effective owner | Grant vs workspace revoke vs commands under barriers; 40P01 → retryable 503; last effective OWNER guard leaks nothing | AC-147, AC-158 |
| Preview binding | Commit by other actor/matter, after expiry, altered digest | AC-133, AC-147 |
| Direct-SQL scope | Cross-matter proof/document/graph inserts; DM-08 lint | AC-135 |
| F3 entry conditions (only if F3 PoC runs) | §6.1 checklist incl. XSS injection attempts | AC-147, NFR-001 |
