# MC-P0-ZCODE-DELIVERY — W1 activation contract (draft; BLOCKED_ON_GATES)

Status: **DRAFT_READY_FOR_ACTIVATION_RECORD — not activated.** This contract becomes executable only when the activation record (Codex) names the accepted source base (D1 receipt), adopted BE02/auth wire (D2 receipts), scoped W1 design acceptance (D4 receipt), and the named independent reviewer (D7). Absent those, this document is the exact prepared task, not permission to write code.

## 1. Goal and requirement subset

Authenticated product foundation: verified per-user identity → session → scoped Matter navigation and administration → one Requirement create/read path end-to-end (UI → REST → Go → PostgreSQL), with explicit denied/stale/unavailable states and append-only history.

- **FR-001 (partial):** one Requirement create/read path through real product HTTP (BE02 slice), typed Requirement≠Action preserved.
- **FR-008 (partial):** append-only event history read for the W1 record types (created + membership/admin events), scoped and paginated (read grain per adopted contract; F-10 binding if adopted by then, else explicitly bounded interim grain documented).
- **FR-018:** roles/ownership enforcement end-to-end — verified identity, workspace/matter administration (create matter, grant/revoke membership, verifier designation reserved), last-owner protection, revocation recheck, uniform sensitive denial.
- **NFR:** security (no anonymous/shared-token path, no client-trusted actor), reliability (receipt/replay, unknown-outcome handling per adopted INT-D09).
- AC targets: AC-108, AC-118, AC-134, AC-135, AC-136, AC-149, AC-153 (+ AC-101 partial groundwork). Full FR-001 completion remains W2.

## 2. Backend change reach (all paths under `apps/backend/`; hexagonal rules per component AGENTS + `.claude/rules/*` read before each edit)

| Layer | Exact files/changes |
|---|---|
| Core domain | `internal/core/domain/matter/`: add workspace/matter administration value types + history-read types; keep five-axis state untouched |
| Core ports | `internal/core/port/matter.go`: extend `MatterService` (or add `WorkspaceService`) with administration + history-read + own-key receipt lookup (`GetOwnReceipt`); add verified-principal resolution port (`PrincipalResolver` — issuer+subject → product user id; no client actor fallback). New port file for identity. Errors: extend `internal/core/port/errors.go` only with approved product outcomes |
| Core services | `internal/core/service/`: new `workspace_service.go` (create matter, grant/revoke membership, last-owner guard) and `history read` in matter service; reuse the BE01 transaction/receipt patterns (matter_service.go:178-221) unchanged in behavior |
| Inbound HTTP | NEW dedicated product registration per BG-03: `internal/adapter/inbound/productapi/` (server wiring, DTOs with strict decode per BG-04, problem mapping per adopted BG-02 table, ETag representation per adopted BG-08 decision, fingerprint builder per BG-04 canonicalization). Endpoints (per BE02 candidate rows, subject to adoption): `POST /api/v1/matters`, membership admin routes, `POST /api/v1/matters/{matterId}/requirements`, `GET /api/v1/requirements/{id}`, `GET /api/v1/operations/{idempotencyKey}`, history read route. No native User route/semantics change |
| Composition | `internal/app/`: product Fx graph with explicit identity/policy dependencies that fail startup when missing (BG-03/BG-07: validated policy, no zero key-age production default); `cmd/` entry point name per technical confirmation |
| PostgreSQL | `internal/adapter/outbound/postgres/queries_mattercontrol/matter.sql`: add membership admin, history read, own-key receipt queries; additive migration only if a new table/column is adopted (users issuer+subject lookup exists at migrations 0001:9-14); `make sqlc-generate` (never edit `sqlcgen/`) |
| Tests | New: identity negative matrix (invalid/missing principal → 401, no fabricate), membership/revocation/foreign-scope negatives (two users, two matters), uniform-404 bytes test, replay/own-key receipt tests, unknown-outcome (CommitUnknown seam) propagation tests, ETag/If-Match preconditions per adopted BG-08. Reuse `repotest/mattercontrol` fault seams |

## 3. Frontend change reach (all paths under `apps/frontend/src/`; Atomic + feature rules per component AGENTS)

| Area | Exact files/changes |
|---|---|
| Auth feature | NEW `src/features/auth/`: login/session against the INT-D02-selected IdP seam via server-side session resolution; `resolveSession()` stays fail-closed; no client-trusted identity |
| Matters feature | NEW `src/features/matters/`: repository (data access only through feature repository, `backendRequest` with session), server actions with `requireSession('matters:write')` + Zod, `ActionResult` errors; components for matter list/navigation/create/detail/history |
| Routes | `src/app/(app)/matters/**` pages (list, `[matterId]` detail with history tab); navigation entry in `src/config/navigation.tsx` |
| States | Explicit denied (uniform), stale (revision conflict + refresh), unavailable (503 problem) states using `src/lib/api/backend.ts` problem handling; no silent zero/ready |
| Tests | `pnpm check` minimum; component tests for states; E2E happy-path + denied/revoked navigation per testing rules |

## 4. Adopted dependencies still missing (each is a gate, not a formality)

1. D1 accepted source base receipt (Mimosa resolution + normal accepted corrected/import commit).
2. D2 adopted BE02 wire contract (BG-01..08 dispositions), INT-D02 IdP/token model, INT-D09 retry convention.
3. D4 scoped W1 design acceptance (login/session/matter nav/create/detail/history states, per selected system).
4. D7 named independent reviewer for the changed set (see §6).

## 5. Fixture and test plan (no wildcard resources)

- Synthetic PostgreSQL fixtures via the existing `pgtest` pattern, separately provisioned and verified per activation record (exact DSN/container identity pinned; credentials via 0600 private files, never printed). `make check` (sqlc-check, gofmt, mod tidy, golangci-lint v2.14.0, `go test -race -count=1 ./...`) with both fixture DSNs; explicit skipped-test/no-test-package inventory in the return.
- FE: `pnpm check`, plus `pnpm build` and E2E scope per testing rules at activation.
- Command/cwd/UTC/exits recorded per return protocol; unknown outcomes logged honestly, never retried with a new key.

## 6. Independent reviewer (named proposal)

- **Source review:** Codex (nonauthor of the ZCode source changes; Codex authored BE02 *documents*, not this source). If Codex is unavailable/conflicted → any other qualified nonauthor; if none → **REVIEW_BLOCKED** and no DONE.
- **Independent QA:** OpenCode when quota actually returns (no retry/switch meanwhile).
- Architecture conformance: Claude for the adopted contract.

## 7. Acceptance (wave DONE requires all)

Independent source review findings resolved once with exact repairs; make check + race green on verified fixtures with honest skip inventory; FE checks green; negative auth/revocation/replay/unavailable tests pass; AC subset assertions executed and recorded; docs updated in the same change (api.md/architecture/operations per component DoD); traceability updated; no unresolved critical/high defect; normal gate conditions met for any commit. Self-report alone never activates W2.
