# Independent backend intake

Task: MC-P0-CODEX-BACKEND-LOCAL-20261029. Actual Local Codex, 2026-10-29. Intake HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`, branch `codex/unified-project-flow`. This is a scoped independent intake of Claude-authored unchanged hardening, followed by Codex author verification of its own corrections. No independent approval of the corrections is claimed.

## Integrity and lineage

- S0 has 186 entries, S6 has 190; both declared counts and aggregates verify. Algorithm: SHA-256 of UTF-8 `json.dumps(files, sort_keys=True)` with Python's default separators, no appended newline. See `intake-comparison.json`.
- All 190 S6 hashes matched current source at intake: zero missing or unexplained divergence. SHA-256 and observed byte lengths are in `intake-source-manifest.json`. Historical manifests declare hashes, not byte lengths; do not infer historical lengths from current observations.
- Reverse-substitution of `leonx.me/matter-control` into `github.com/example/userapi` reproduces S0 hashes for exactly 101 changed files, corroborating the rename-only claim without writing old names into source. The declared 8 behavioral edits and 4 additions match hash-set differences; no removals. Original S0 bytes for those 8 behavioral edits are unavailable in this packet, so their exact historical textual diff is NOT_PROVEN. No old bytes were invented or dirty source reset.
- Six additional intake entries are `.DS_Store` metadata, outside Claude's 190-entry manifest. They are not additional code changes. Final source delta separates the nine Codex paths from preserved prior dirty work.
- The R2 packet has a patch and logs, but no independent pre/post source manifest. Its historical author test counts are not adopted as new results. Its current adapter/config/dependencies were read and exercised in the fresh baseline and final gates. `input-artifacts-manifest.json` pins the ten input artifacts. No real bucket was contacted.

## Scoped hardening review

- `.golangci.yml:60` denies adapter imports of `core/service` and `core/policy`, except tests and the deliberate shared `repotest` kit. Rules use the current module prefix; required lint passes. The historical deliberate-violation probes were not repeated.
- `core/port/evidence.go:22` preserves `errors.Is(..., ErrObjectUnavailable)` for both missing/corrupt classes. `productapi/content_problem_test.go` verifies unchanged content-unavailable 503 mapping. Actual full baseline/final runs execute this test.
- `objectstore/r2.go:92` bounds upload bytes, hashes content, uses matter-scoped keys, supplies SHA-256 and static explicitly supplied credentials. HEAD reuse checks length, not a second digest; same-size corruption is detected on subsequent full read, not repaired by HEAD. The filesystem likewise reuses an existing digest path. This is an existing limitation, not a new claim of repair.
- `objectstore/store.go:128` and R2's shared verifying reader detect digest mismatch at EOF. A partial read/early close does not verify the whole object. Content handler defers close and aborts a corrupted in-progress transfer; it cannot replace an already-started 200 with a fresh 503. Installed Echo v5.4.0 Recover rethrows `http.ErrAbortHandler`, verified from its local source.
- `core/service/evidence_service.go:1372,1402` authorizes before opening bytes, emits a single integrity log per failing stream with matter/hash/problem, and omits filename, actor, credentials and content. Ordinary unavailability is not an integrity incident. Shared W3 tests run against both memory and real PG in this task; fake-S3/filesystem/memory object contracts pass.
- No new blocking defect was found in the unchanged Claude object hardening within this scope. This is not an exhaustive security audit or real-provider acceptance. Size limits, digest checks, scoped addressing and error classes have local contract evidence; real-R2 signing, checksum and permission behavior remain unverified.

## Findings on the intake baseline and dispositions

| ID | Severity | Location / trigger | Impact / minimum disposition |
|---|---|---|---|
| BELOCAL-01 | P2 | `internal/app/product.go:210`, DB unavailable after startup | Readiness stayed 200 because no DB check was wired. Fixed by passing the pool's Ping through the existing 500ms readiness helper. Closed-pool regression was red before the fix. |
| BELOCAL-02 | P2 | `internal/adapter/inbound/productapi/server.go`, any failing Ready callback | Existing Echo 503 was mapped to product 500. The first correction run reproduced this second failure. Return the existing `port.ErrUnavailable`; no raw DB error reaches the probe response. |
| BELOCAL-03 | P2 | `productapi/server.go` and `app/product.go`, large/slow transfers or import/bulk | Every route had 10s context and 15s write limit. A 25 MiB transfer at 1 MiB/s cannot fit. Route-budget regression reproduced 10s on all six transfer routes. Add positive `MC_TRANSFER_TIMEOUT=60s`, apply it to upload/content/import/export/bulk commit; align finite read/write socket bounds. This is deadline selection evidence, not a completed 25 MiB load measurement. |
| BELOCAL-04 | P1 | `internal/config/product.go`, nonempty K_SERVICE with default/explicit fs | Cloud filesystem mode could silently accept ephemeral document storage. Narrow fail-closed validation added; local fs and cloud r2 remain accepted. Table regression red before fix. |

BELOCAL-01/03 were already present in the composition being reviewed; do not attribute them to Claude's rename alone. All four corrections are Codex-authored and require a separate nonauthor review. Existing shutdown drain/cancel behavior was correct: tested without changing its semantics.

## Research boundary

Context7 resolved Echo to `/labstack/echo` and queried current ContextTimeout/Recover behavior; installed v5.4.0 source confirmed Skipper, request-context cancellation and abort propagation. No framework upgrade or dependency addition. Source reference: https://github.com/labstack/echo/blob/master/middleware/context_timeout.go .

Skipped: real R2, deliberate depguard negative probes, original behavioral-byte reconstruction and exhaustive security audit. Risk: partial streamed content is verified only at EOF; deployed transfer capacity remains unmeasured.
