# CR-002 option A and Phase 3 hardening: change record

**Author:** Claude Code (`claude-sonnet-5-5`), not independent. **State:** working tree only, nothing staged or committed. The userapi removal and root CI were committed earlier as `f8c0928`. Authorized by the PO on 2026-10-28 ("1. A  2 có  3 bắt đầu").

## CR-002, option A (frontend)
A receipted create whose answer was lost, and a document-version upload, now survive a reload with the same Idempotency-Key.
- `src/lib/mc/drafts.ts`: pending attempt (`mc:attempt:<namespace>:<scope>` = key + exact sent values) in per-tab sessionStorage; purged by `clearAllDrafts` (sign-out, denied screens); `use-attempt.ts` reads it through `useSyncExternalStore`, so it cannot go stale.
- `intent-form.tsx`: stores the attempt on an unknown outcome, restores the "not confirmed / retry the same request" state after a reload, retries with the stored key and the stored values (not the edited fields); clears it on success, definitive refusal, denial, discard.
- `document-forms.tsx` (`UploadVersionForm`): stores key + file name, size and SHA-256; after a reload the key is reused only if the same bytes are chosen again, any other file gets a new key.
- Tests: `intent-attempt.test.tsx` (8), `upload-attempt.test.tsx` (4); they failed before the change. `pnpm check` 504 tests pass, `pnpm build` OK.
- Not covered: a real browser run (no browser/IdP in this pass); a CAS-only command is deliberately never stored (it is never resent).
- Residual: the backend key-age window (`KeyAgePolicy`) still decides how old a stored key may be; the product wires a zero policy today, so no expiry applies.

## Phase 3 (backend)
| ID | Result | Evidence |
|---|---|---|
| BR-04 | Done. `MC_OIDC_ISSUER` / `MC_OIDC_INTROSPECTION_URL` must be https unless the host is `localhost` or a loopback IP | `TestLoadProduct_IdentityURLsNeedTLSExceptLoopback` failed first (10 cases); run of `mcapi migrate` with `http://idp.example.com` stops with `must use https unless the host is loopback` |
| BR-05 | Partly. Optional `MC_MIGRATE_DATABASE_URL`, used by `mcapi migrate` and `MC_MIGRATE_ON_START`; unset = unchanged behaviour | `TestLoadProduct_MigrationURLDefaultsToRuntimeURL`. **NOT_RUN:** a real split-role database (no DB authorization), so the grants a runtime role needs are not verified and no role SQL is published |
| BR-06 | Partly. Optional `MC_MAX_IN_FLIGHT` (default 0 = off): over the cap `/api/v1` answers 503 `urn:mc:unavailable`, `retryable`, `Retry-After: 1` before the request is read; probes exempt | `TestMaxInFlight_*` (race), config test with bounds. **Not done:** per-user rate limit (needs numbers and a key, PO-owned) and `TestPerf` |
| BR-07 | Done as a guard. A test fails if any query or non-test Go file in the postgres package INSERTs/UPDATEs `next_boundary_at` | detector table test; injecting an `UPDATE matters SET next_boundary_at` into `matter.sql` made it fail, then reverted. **DECISION_REQUIRED, not changed:** `boundary-due` is still `retryable: true` (wire change) |

Side note on BR-06: the frontend BFF maps any 5xx on a command to `outcome-unknown` (`lib/mc/client.ts`), so a refusal at capacity shows as "not confirmed" and offers the safe same-key retry. Correct but imprecise; acceptable.

## Files I edited that Codex also has uncommitted changes in
`internal/config/product.go`, `internal/app/product.go`, `internal/adapter/inbound/productapi/server.go` (surgical: imports, 3 struct fields, 1 `Group` argument, 3 wiring lines; Codex's last write to them was 16:10Z, quiet for over an hour). Also `docs/operations.md`, `.env.example` (mine from the earlier commit, edited again) and new files `internal/adapter/inbound/productapi/inflight.go`, `inflight_test.go`, `internal/adapter/outbound/postgres/boundary_guard_test.go`, the two frontend tests and `src/lib/mc/use-attempt.ts`.

## Verification (backend, full tree)
`make sqlc-check`, `go mod tidy -diff`, `go vet`: 0. `golangci-lint`: 2 issues, both Codex's untracked test files (goimports), same as baseline. `go test -race -count=1 ./...`: 14 packages ok, PostgreSQL suites skipped (no DB). Frontend: see above.
