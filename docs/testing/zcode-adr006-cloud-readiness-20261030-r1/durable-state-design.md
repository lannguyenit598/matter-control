# §4 Durable auth + pending-command state — design (LOCAL_CANDIDATE, security review pending)

Reference semantics VERIFIED on a real PostgreSQL 18.6 fixture: `durable-session-events.json` (this directory) — rotation atomic under 10-way concurrency (exactly 1 winner), stale-generation replay matches nothing, destroyed/expired sessions fail closed. Reference harness: `apps/backend/internal/adapter/outbound/postgres/durable_session_reference_test.go` (design-verification only; the production table ships with the Workers adapter under its own writer handoff + security review — NOT product code yet).

## Decision: Supabase PostgreSQL as the durable session/pending store

Chosen over Cloudflare KV/Durable Objects for the pilot: (a) the audit's own rule — an eventually consistent KV cache must not be the authoritative revocation/refresh boundary; (b) strong consistency + row-level atomicity is exactly the refresh-rotation requirement; (c) the database is already in the topology (no new managed service = no new cloud decision/cost); (d) residency stays on the chosen Supabase region. KV/DO remain the documented alternative if latency from the edge becomes a measured problem; that is a cloud decision requiring PO sign-off (cost + new binding + consistency model).

## Design (workers frontend ↔ Supabase)

- **Cookie**: opaque random 256-bit handle, HttpOnly+Secure+SameSite=Lax, `__Host-` prefix on the production origin. No identifier, no token, no signature to forge.
- **Row** (`durable_sessions`, DDL in the reference harness): access+refresh tokens stored **sealed at rest** (XChaCha20-Poly1305 or AES-256-GCM with a Workers secrets-stored key; key id + version column for rotation; key never in the DB). Generation counter monotonic.
- **Rotation** (the exact SQL proven): single conditional `UPDATE … WHERE handle=$1 AND generation=$5 AND destroyed_at IS NULL AND absolute_at > now() RETURNING generation`. N concurrent refreshers → exactly one winner; losers re-read the new generation and return the winner's session. ZITADEL refresh-token rotation maps 1:1 to generation increments; reuse of a rotated refresh token (old generation) matches nothing → treat as theft signal → destroy the session.
- **Revocation/lifetime**: `destroyed_at` terminal (logout, admin revoke, theft signal); `idle_until` sliding (30 min proposed), `absolute_at` hard (24 h proposed — numbers are profile inputs for PO, not decided); cleanup deletes rows where `destroyed_at < now()-7d` or expired — a maintenance role, not the runtime (B7 discipline).
- **Outage fail-closed**: DB unavailable → every session check fails closed (401-class), never allow; the Worker reads the session row per request (cheap PK lookup; edge cache of the row is NOT authoritative).
- **Login transient state (PKCE/state/callback)**: short-lived rows (`auth_flows`: state, verifier sealed, created_at, consumed_at) — survives multi-instance/cold-start; consumption is a single conditional UPDATE. Cookie-carried state stays as the CSRF second factor.
- **Pending import/bulk commands**: replace the transfer WeakMap with `pending_commands` keyed by (session handle, user, matter, stable client intent id) storing the sealed payload, original idempotency key, authorization context and reconciliation state; leases (`leased_until`) with crash recovery: a lease expiring re-opens the command for retry WITHOUT minting a new key (UNKNOWN is not failure); receipts reconcile via the existing backend receipt contract.
- **Bounds**: per-session row ≤ 256 KiB payload (blobs stay in R2 — the DB stores only object refs); per-user session count cap with oldest-destroyed eviction; purge job bounded.
- **Migration of retained local Map sessions**: NONE — local dev login keeps its declared profile; the durable store activates with the Workers adapter. No retained-data migration under this task.

## What remains before this is implementable in shared source

Writer handoff for the frontend auth/session paths (`src/lib/oidc/*`, auth provider); the sealed-at-rest key service (Workers secrets); integration tests through the real Worker BFF; independent security review of the cookie/rotation/outage behavior. The SQL semantics are proven; the Workers-side code is not written.
