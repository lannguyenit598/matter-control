# Return — audit-fix batch A1–A5 (2026-10-30)

Actual ZCode session (model account:zai-start-plan/GLM-5.3-Flash). Branch `codex/unified-project-flow`, HEAD `20feedbf…` unchanged, nothing committed. Scope: the five findings from the user's review table; Mimosa constraints honored (all SQL parameterized via sqlc, no string concatenation; no credentials in source).

## Dispositions

| # | Disposition | Fix | Verification |
|---|---|---|---|
| A1 P1 | **FIXED (plumbing)** — columns populated, not dropped: the audit trail keeps both tracing fields | `SecurityAuditEntry` gains `ClientIP`/`RequestID`; new `port.RequestMeta` context carrier (`internal/core/port/requestmeta.go`); `requestMeta` middleware on the `/api/v1` group injects the boundary IP (first declared X-Forwarded-For hop, else remote address — netip-validated, unparseable → NULL) and the correlation id (inbound well-formed `X-Request-Id` ≤128 printable, else 16-byte hex); all **11 audit construction sites** across the four services copy the meta; `InsertSecurityAuditEvent` now writes `client_ip`/`request_id` (narg → `*netip.Addr`/`pgtype.Text`); `pgWorld.Audits()` reads them back | `TestSecurityAuditRequestMetaRoundTrip` (PG): hidden-grant deny with meta → INET column round-trips `203.0.113.7`, request_id round-trips; without meta → NULL columns. HTTP: `TestSecurityAuditCarriesRequestMeta` / `...HonorsInboundRequestID` (deny path via hidden workspace grant, middleware meta asserted) |
| A2 P2 | **FIXED (correct invariant discovered en route)** — first attempt CAS'd the row against the HEADER revision and failed the review contract (`REVOKE_MATTER_MEMBER … version conflict`): the membership row's revision drifts from the header as other commands run. Correct fix: the row carries its **own** change counter; the SQL predicate binds `AND revision = expected_row_revision` (loaded by the caller in the same tx), SET `revision = expected + 1`; port signatures renamed `expectedRowRevision`; callers pass `existing.Revision` (in scope at all 4 sites); memory double mirrors the row CAS | `matter.sql` (2 queries), `workspace_store.go`, `port/workspace.go`, `memory_w1.go`; B1 suite under the restricted runtime role re-run: **58 PASS / 0 FAIL** (incl. the review access/revoke subtest that caught the wrong invariant) |
| A3 P2 | **ALREADY FIXED** in the SQL-fixes session (2026-10-30, receipts in `docs/testing/zcode-sql-review-fixes-20261030-r1/`): `SaveFiling` zero-rows → `ErrVersionConflict` in both adapters + the SuiteW4 contract subtest; re-verified in place today (`filing_store.go:193`) | prior full gate 642/0/20 |
| A4 P3 | **ALREADY FIXED** same session: `InsertAssessment` SubjectEpoch via `int32Checked`, nolint removed (`evidence_store.go:262`); the 3 remaining raw casts keep written bounds justifications | prior gate + today's build |
| A5 P2 | **FIXED (deliberate default + validation + docs)**: `MC_OIDC_CACHE_TTL` default **15s** (was implicit 0 = uncached); negative values refused at config load; `.env.example` documents the ≤TTL revocation window and the 0-disables escape; verifier comment states the cached-result caveat | `TestLoadProduct_Defaults` (15s) + new `TestLoadProduct_NegativeCacheTTLRefused` |

## Gates

- `make sqlc-generate` + `make sqlc-check` clean (3 queries changed: 2 membership CAS, 1 audit columns).
- Full `go test -race ./...` with the fresh labelled fixture `mc-zcode-auditfix-pg-20261030-r1` (label `MC-AUDIT-FIXES`, 127.0.0.1:51995) — **708 passed / 0 failed / 20 packages** (`full-race-suite.log`); affected-package pre-runs: config 39 (2 pkgs), productapi+service+repotest 316 (3 pkgs), PG B1+audit 58/0.
- gofmt/vet clean on touched files.

## Notes for reviewers

- A1 stores the boundary-declared IP: behind a mis-declaring proxy the audit IP is the proxy's claim — tracing data, never a security control (B3's stricter rule applies to rate admission).
- A2's row CAS changes observable behavior only in the race window the FOR UPDATE lock already serializes; no contract test asserted the old unconditional UPDATE.
- The membership row revision semantics are now "row change counter" (it drifts from the header revision by design) — reviewers should confirm they agree before the next migration slot.

## Skipped and risks

Skipped: applying any migration (none needed — the columns existed; 0009 index draft remains a separate proposal); retained-DB use; real IdP. Risks: the audit INET column stores only parseable single IPs (opaque chains → NULL, by design); the 15s cache default changes live revocation latency vs the previous uncached behavior — operators who need instant revocation set 0.
