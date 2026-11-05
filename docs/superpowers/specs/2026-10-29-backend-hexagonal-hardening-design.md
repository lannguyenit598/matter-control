# Backend hexagonal hardening, API reference for testers, and module rename — design and plan

- Author: Claude Code (actual), 2026-10-29. **Execution: S0–S4 and S6 DONE and verified 2026-10-29 (see docs/testing/p0-final-parallel-20261028/claude-backend-hardening-r1/return.md); S5 deferred.** Original status: **S0–S4 and S6 in scope (the user told me to start and to skip the manual-tester part for now); S5 (API reference for testers, Postman, ZITADEL tester application) is DEFERRED by the user.**
- Origin: the "hexagonal conformance" review of `apps/backend` (adapters follow the dependency rule; five items are incomplete). The user asked for a plan to fix them.
- Related: ADR-004, ADR-005, `apps/backend/docs/api.md`, `apps/backend/.golangci.yml`.

## Intent

Make the backend's architecture rules **enforced by tooling, not by habit**, make the object-store behaviour **provable for every implementation**, make a **missing document visible as the data-integrity incident it is**, and give **manual testers an accurate, runnable API reference in Postman**. Finish by giving the module its real name before anyone else imports or publishes it.

## Who it is for

- The team keeping the backend honest as more adapters appear (R2 today, others later).
- **Manual testers** (the user's answer): they need to know exactly what each endpoint accepts and returns, and to call it without writing code.
- The operator who will run the pilot with the database and the document bucket in two different places.

## Goals

1. Lint fails if an inbound or outbound adapter imports `core/service` or `core/policy` (the shared test kit `repotest` is the one exception).
2. One `ObjectStore` contract suite runs against the filesystem, memory and R2 implementations; R2 can additionally be run against a real bucket on demand.
3. "Object missing" and "object corrupt" are distinct errors, still answered with the same retryable 503, and each is logged at error level with matter and content hash.
4. *(Deferred.)* Testers get an API reference that matches the running code and a Postman collection plus environments; a test fails when the code, the reference and the collection drift apart.
5. The Go module is `matter-control`, in one atomic change, with build, vet, lint and tests green.

## Non-goals

- No Huma, no generated OpenAPI. The design documents are corrected to say the API is hand-written Echo.
- No change to HTTP behaviour, status codes, request/response bodies, migrations, or the database schema.
- No change to evidence under `docs/testing/**` (immutable); old module-path strings there stay.
- No deployment, no commit, no push, no IdP change without the user's separate OK (see "Needs the user").

## Anti-goals (would be a failure even if it compiles)

- Renaming the module but leaving lint rules pointing at the old path, so the new rules silently match nothing.
- A contract suite that only passes because R2 is tested against a fake that is more lenient than the real service, with no way to run the real one.
- Splitting the errors but changing what clients see, or logging document names or tokens.
- A Postman collection that has drifted from the code the week after it is written.

## Constraints

- Backend source is currently owned by Codex (`AGENTS.md`, 2026-10-28 amendment) and the working tree has uncommitted work in many files. The user has instructed that the rename happen now. Edits are textual import-path substitutions on top of current bytes; Codex must be told, and nothing is reset or committed.
- `.golangci.yml` and `go.mod` must change together (`.claude/rules/tooling-and-deps.md` already says so).
- Postman needs a bearer token from ZITADEL; tokens are never stored in files.

## Decisions made by the user

- Module path: name **`matter-control`**, domain **`leonx.me`**, so the Go module is **`leonx.me/matter-control`**; renamed **now**, not after Codex commits.
- API reference for testers: manual testing; **use Postman**.
- Items 1–3 as written in the review (two lint rules; shared ObjectStore contract suite; `ErrObjectMissing` with HTTP mapping unchanged and an error-level log with matter and hash).

## My calls (check these while reading)

1. ~~Module path `matter-control` without a domain~~ — superseded by the user: the path is `leonx.me/matter-control` (a dotted first element, so the dotless-path concerns do not apply).
2. **Two new errors, `ErrObjectMissing` and `ErrObjectCorrupt`**, both wrapping `ErrObjectUnavailable`, so every existing `errors.Is(err, ErrObjectUnavailable)` and the 503 mapping keep working. Adapters return them; the log is written in `EvidenceService.OpenVersion` (it has the matter id and the hash; adapters have no logger).
3. **Real-bucket run is opt-in**: the R2 contract run against a real bucket needs `MC_TEST_R2_*` variables and is skipped otherwise. I will not create or touch a bucket.
4. **One drift test** checks that every route registered by the product API appears in `docs/api.md` and in the Postman collection, and the reverse. The stale template section of `api.md` (the `/api/v1/users` endpoints, which no longer exist) is removed so testers are not misled.
5. **Postman collection format v2.1** (imports everywhere), one collection with folders per area, a pre-request script that creates a **UUIDv7** `Idempotency-Key` (the backend checks key age from the v7 timestamp), and two environments (local, cloud) with `baseUrl`, ids and an empty `accessToken`.
6. **Order of work** puts the rename first (it touches everything and is the riskiest to leave pending), then lint rules, then the object-store work, then the API reference.

## Needs the user (only they can answer)

- **ZITADEL for Postman.** Testers need a token. The clean way is Postman's OAuth 2.0 helper (authorization code with PKCE) against ZITADEL, which needs a redirect URI for Postman (`https://oauth.pstmn.io/v1/callback`) on a ZITADEL application, ideally a **separate PKCE application** for testers, plus a provisioned test user. May I plan for that, with you (or whoever owns ZITADEL) doing the console step? Until then the collection works with a token pasted into `accessToken`.

## Work breakdown (each step ends with a check; stop on the first red)

**S0 — Snapshot.** Record the file hashes of `apps/backend` (excluding generated and logs) before any edit, so the delta is provable and reversible. Check: manifest written.

**S1 — Rename the module.** Replace `github.com/example/userapi` with `matter-control` in `go.mod`, the 106 `.go` files (225 occurrences), `.golangci.yml` (depguard paths and the local-prefix setting), and the backend's own docs and agent notes that quote the path (`AGENTS.md`, `.agents/skills/*`, `.claude/rules/*`). Do **not** change: migrations, `docs/testing/**`, database role/database names such as `userapi` in hooks (a different thing), `-X main.version`. Check: `go build ./...`, `go vet ./...`, `gofmt -l`, `go mod tidy -diff`, `golangci-lint run ./...` (confirm `grep -c matter-control .golangci.yml` equals the old count), `go test ./...`. Rollback: the reverse substitution.

**S2 — Enforce the layering.** Add depguard rules: inbound adapters, and outbound adapters except `repotest`, may not import `matter-control/internal/core/service` or `.../core/policy`. Check: lint passes; then a temporary import of `core/policy` in `productapi` makes lint fail (record the failure, remove the import, lint passes again).

**S3 — Object-store contract suite.** Add an `ObjectStore` contract in `repotest` (round trip, idempotent put, size limit leaves nothing, malformed digest, unknown digest, matter isolation, tamper detection through a per-implementation "damage" hook, error classes). Run it for filesystem, memory and R2 (fake S3 by default; real bucket when `MC_TEST_R2_*` is set). Keep the existing adapter-specific tests that the suite does not cover (key layout, signature headers). Check: suite green for all three; deliberately break one implementation and see the suite fail.

**S4 — Split the object errors.** Add `ErrObjectMissing` and `ErrObjectCorrupt` to `core/port` (wrapping `ErrObjectUnavailable`); return them from all three implementations (missing key; checksum mismatch); log in `EvidenceService.OpenVersion` at error level with matter id and sha256 only; add tests for the classes, for the unchanged HTTP problem (`content-unavailable`, 503, retryable) and for the log fields (and absence of anything else). Check: tests green; contract suite still green.

**S5 — API reference and Postman. DEFERRED by the user (2026-10-29); not started; the ZITADEL question stays open.** Correct `system-architecture.md` / `api-contracts.md` wording (hand-written Echo, no Huma/OpenAPI); remove the stale template section from `docs/api.md`; add `apps/backend/docs/postman/` with the collection, the two environments and a short tester guide (how to get a token, order of calls, what each error means); add the drift test (routes ↔ `api.md` ↔ collection). Check: test green; deleting one entry from either document makes it fail; the collection imports and one request runs against a local API.

**S6 — Wrap-up.** Full run: `make check` equivalents (gofmt, tidy, lint, `-race` tests), source manifest and delta, one return document under `docs/testing/`, list of what was not done. No commit.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Codex is editing the same files while the rename runs | One substitution pass, announce it first, verify with the S0 manifest that every changed line differs only in the path string |
| Dotless module path confuses a tool | Full check in S1 (build, vet, lint, tidy); fallback is a full path, same mechanical change |
| New lint rules match nothing after the rename | Check the pattern count and the deliberate-violation test in S2 |
| The fake S3 hides a real-R2 difference | Real-bucket mode exists; the first real run is a stated pilot gate (ADR-004 B3) |
| Postman collection becomes stale | The drift test in S5 |
| Testers cannot get a token | The ZITADEL decision above; paste-token fallback documented |

## What stays for later

Real-R2 run (needs a bucket, a card on Cloudflare — approved — and a token), the ZITADEL tester application, durable sessions, the other open items in ADR-004/005.

## Builder check (read as the person who will implement it)

- *Where do the Postman environment values for ids come from?* From a documented first sequence (create workspace → matter → …) with test scripts that store ids; the guide lists it.
- *What proves S1 changed only the path?* The S0 manifest plus a reverse substitution that restores the original hashes.
- *Does S4 change the frontend?* No; the HTTP problem is unchanged.
- *Is there any way to run S3 against a real bucket without a secret in the repo?* Yes, only through environment variables, skipped by default.
