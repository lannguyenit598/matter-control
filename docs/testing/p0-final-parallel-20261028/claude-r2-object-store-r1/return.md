# Cloudflare R2 object store adapter (backend) — r1

Actual Claude Code (Sonnet 5.5), HEAD 20feedbf06c859a9806055d609f5b132fe8bb086 (unchanged). Authorized by the user ("1" = approve the R2 adapter and the S3 SDK dependency). No commit, push, deploy, or contact with Cloudflare/Supabase/GCP. Not verified against a real R2 bucket.

## Delta
- New: `internal/adapter/outbound/objectstore/r2.go`, `r2_test.go`.
- Modified (on top of existing bytes, minimal insertions; `delta-on-existing-files.patch` is exactly my change): `store.go` (reader now wraps `io.ReadCloser`), `internal/config/product.go` and `product_test.go`, `internal/app/product.go` (backend switch in `newObjectStore`), `docs/operations.md`, `.env.example`, `go.mod`/`go.sum`.
- `internal/config/product.go` and `internal/app/product.go` already carried uncommitted work by Codex; it is preserved. `docs/api.md(.orig)` untouched by me.
- Dependency: aws-sdk-go-v2 (aws, credentials, service/s3, smithy-go) plus 8 indirect AWS modules; no other third party. `go mod tidy -diff` clean, `go mod verify` ok.

## Behaviour
- `MC_OBJECT_BACKEND=fs` (default, unchanged) | `r2`. `r2` needs `MC_R2_ENDPOINT` (https unless loopback), `MC_R2_BUCKET`, `MC_R2_ACCESS_KEY_ID`, `MC_R2_SECRET_ACCESS_KEY`; `MC_OBJECT_DIR` then not required. Unknown backend fails startup (no fallback to disk).
- Contract kept: content addressed by SHA-256 within a matter; same bytes = no second upload (HEAD then PUT); size cap before any request; checksum verified on read; provider failures map to `ErrObjectUnavailable` (retryable 503); malformed digest never reaches the bucket.
- Keys are `<matter>/<sha[:2]>/<sha>`, identical to the local directory, so an existing object directory can be copied into the bucket as it is.
- Upload carries `x-amz-checksum-sha256` and is signed (SigV4); the SDK's default CRC32 trailer is disabled (R2 compatibility). Wrong-size object under a key is replaced.

## Checks (logs here)
- `go test -race` on objectstore, config, app: pass (20 tests). `go test ./...`: pass. `golangci-lint run ./...` (incl. depguard): 0 issues. gofmt clean.
- R2 tests use an in-process fake S3 (HTTP, path-style): layout, digest header and signature present, no repeat upload, repair of damaged object, too-large, tamper detection, matter isolation, 403/503 mapped to unavailable, config required.

## Not verified / risks
- No run against real R2: SigV4 acceptance, the omitted CRC32 trailer, endpoint/jurisdiction form, HEAD-404 handling and token scoping are assumed from documentation, not observed. First real use must be a synthetic-data smoke test.
- Put buffers the whole upload (<= `MC_MAX_UPLOAD_BYTES`, default 25 MiB) in memory: set Cloud Run memory and `MC_MAX_IN_FLIGHT` accordingly.
- Default backend is still `fs`: a Cloud Run deploy that forgets `MC_OBJECT_BACKEND=r2` would silently use ephemeral disk. Consider failing startup when running on Cloud Run (`K_SERVICE` set) with `fs`.
- No R2 backup/replication, retention lock, restore rehearsal, or key-rotation drill yet (RPO/RTO deferred to Step 02). No migration tool: copy the local tree with rclone/`aws s3 sync`, then verify digests.
- Frontend UNKNOWN-attempt store (in-memory) and Supabase decisions remain open.
