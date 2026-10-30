# Backend hexagonal hardening — S0–S4, S6 (r1)

Actual Claude Code (Sonnet 5.5). HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`, working tree with Codex's uncommitted work preserved. No commit, push, deploy, IdP or cloud action. Design: `docs/superpowers/specs/2026-10-29-backend-hexagonal-hardening-design.md`. **S5 (API reference, Postman, ZITADEL tester app) deferred by the user.**

## What changed (apps/backend)
| Step | Result |
|---|---|
| S1 module | `github.com/example/userapi` -> **`leonx.me/matter-control`** (domain given by the user). `go.mod`, `.golangci.yml` (16 depguard paths + goimports local-prefix), `.claude/rules/tooling-and-deps.md`, 106 `.go` files. **101 files changed by the path substitution only** (proved by reverse-substituting and matching the S0 hashes; the rest of the 109 also carry the S2–S4 edits below). `docs/testing/**` evidence and migrations untouched |
| S2 lint | New depguard rule `adapters-not-application`: nothing under `internal/adapter/**` except `repotest` may import `core/service` or `core/policy`. Proved with two deliberate violations (inbound -> policy, outbound -> service): both rejected; files removed; lint 0 issues |
| S3 contract | New `repotest/objectcontract` suite (round trip, repeated put, empty and 1 MiB content, exact size limit, failing source, malformed/unknown digest, matter isolation, 8 concurrent puts, damaged bytes, missing vs lost). Run for filesystem, memory and R2 (in-process fake S3). R2 against a **real bucket is opt-in** (`MC_TEST_R2_ENDPOINT/BUCKET/ACCESS_KEY_ID/SECRET_ACCESS_KEY`), skipped by default. The suite first failed `MemoryObjects` (no digest check on read, raw read errors); fixed |
| S4 errors | `port.ErrObjectMissing` and `port.ErrObjectCorrupt`, both wrapping `ErrObjectUnavailable`. Returned by fs, memory and R2. `EvidenceService.OpenVersion` logs at ERROR `document content integrity incident` with `matter`, `sha256`, `problem` (`missing`/`corrupt`) only, once per stream; a store that is merely down logs nothing. HTTP unchanged (test `content_problem_test.go`: same 503, `urn:mc:content-unavailable`, retryable). Written red-first at each layer |

## Evidence
- `s0-pre-manifest.json`, `s6-post-manifest.json` (190 entries, aggregate `fb4f98b4…03d7`), `s6-delta.json`: 4 added, 8 edited beyond the path (`.golangci.yml`, `r2.go`, `store.go`, `contract_w2.go`, `contract_w3.go`, `memory_objects.go`, `core/port/evidence.go`, `evidence_service.go`), 101 path-only, 0 removed.
- Final gates on the final bytes: `gofmt -l` empty; `go vet ./...` clean; `golangci-lint run ./...` 0 issues; `go test -race -count=1 ./...` all packages ok; `go mod tidy -diff` clean; `make sqlc-check` exit 0. `object-contract-results.txt`: filesystem PASS, R2 fake S3 PASS, R2 real bucket SKIP.

## Not done / not verified
- **R2 has never run against a real bucket**; that run needs a test bucket and token (card already approved for the free phase) and is still ADR-004 B3.
- **PostgreSQL contract tests were not run** (they skip without `MC_TEST_DATABASE_URL`); the store-independent S4 contract also runs on the memory store only here.
- S5 deferred: `docs/api.md` still contains the removed template `users` section and the design documents still say Huma/OpenAPI; no Postman collection.
- Other places that still say the old path: `docs/testing/**` evidence (intentional, immutable). Anything outside `apps/backend` that imports the old module path: none found.
- Codex was not notified (no channel from this session): files changed under their dirty tree were touched only by path-string edits plus the listed edits. Tell Codex before they next write to `apps/backend`; to undo the rename, reverse-substitute `leonx.me/matter-control` -> `github.com/example/userapi` in the S1 file set.

## Next
1. Tell Codex; decide commit timing (nothing was committed).
2. S5 when the manual testers are ready: fix `docs/api.md`, add Postman, answer the ZITADEL tester-app question.
3. Real-bucket contract run with `MC_TEST_R2_*` after ADR-004 B3 prerequisites.
