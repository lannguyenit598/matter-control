# MatterControl: backend, ops and process review, and the plan

**Author:** Claude Code (`claude-sonnet-5-5`), who wrote part of this source, so this is not independent. **Scope:** backend, ops, architecture and process. The UI was excluded on the user's instruction while Codex edits the flow. **Base:** HEAD `2d41081`; the working tree is moving, so findings are scoped to what I read on 2026-10-28 (about 16:30Z to 17:00Z). Source was not edited.
Structured data: `findings.json`.

## The short version
The backend is in better shape than the delivery around it. Authorization, SQL, token checking and the legal record are sound where I looked. The real problems are that **nothing builds, ships or tests the product automatically**, and that the only image the repo can build is the **unauthenticated template API**.

## Findings

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| BR-01 | **P1** | No CI runs at all | workflows live in `apps/*/.github/workflows`; the repo root has no `.github`, and GitHub reads only the root; the branch is already pushed | hoist to `<root>/.github/workflows` |
| BR-02 | **P1** | Image, compose, Makefile and CI all build `cmd/userapi`, the unauthenticated template API; the product (`mcapi`) has no image, compose service, migrate job or CI job | `Dockerfile:13,21`, `Makefile:18,21,24,63`, `ci.yml:69,89`; `httpapi` has no authentication | retarget to `mcapi`, then delete the stack |
| BR-03 | P2 | Product PostgreSQL suites run nowhere in CI | 144 tests skip without a DB; `MC_TEST_DATABASE_URL` is in no CI file | Postgres service container; fail on any skip |
| BR-04 | P2 | `http://` issuer / introspection URL accepted on any host | `config/product.go:94-95` | require https unless loopback |
| BR-05 | P2 | One DB role owns the schema and runs the app | one `MC_DATABASE_URL`; append-only triggers protect against bugs, not the owner | split migrator and runtime roles |
| BR-06 | P2 | No rate or concurrency limits; every request loads the whole Matter graph | no limiter middleware; `LoadGraph` per request; workload numbers deferred by the PO | set numbers, add limits, run `TestPerf` |
| BR-07 | P3 | Latent wedge: `ErrBoundaryDue` is 503 `retryable:true` with no processor | `next_boundary_at` is never written, so nothing is stuck today | test that fails if anything writes it; make it non-retryable |
| BR-08 | P3 | Template residue: ~7.9k lines, 5 dependencies, unauthenticated user CRUD | earlier ponytail audit | delete after BR-02 |

**Verified as sound (BR-09):** the 78 public methods of the product services either reach a central gate (membership + `policy.Decide*`, hidden resources return not-found, denials are audited) or are scoped to the caller's own rows (`MyActions`, `ListMyWorkspaces`); the 5 methods of the template `UserService` have no gate at all and are not part of the product (BR-02, BR-08). I read the gate code and 9 representative or exceptional methods, not all 78 bodies; no dynamic SQL; matter and workspace rows are locked `FOR UPDATE` for writes and reads use a repeatable-read snapshot; the token verifier checks `active`, pinned issuer, audience, non-empty `sub` and `exp`, fails closed and never echoes the token; formulas are refused on import and neutralised on export; the object store is digest-addressed under `os.Root` with 0700/0600; no auth material in logs, no CORS, body limits and server timeouts are set. Merged coverage with the DB suites skipped is domain 100%, `domain/matter` 92.3%, policy 100%, service 79.7% (the 26-53% package-local figures are misleading, since the contract suites live in another package).

**Open from before:** CR-002 (PO decision); Cloudflare Free feasibility and production topology (the frontend BFF keeps sessions and retry slots in process memory, so it is neither multi-instance nor serverless safe); backend files Codex changed at 16:05Z after the last restore run; three source-drift incidents against pinned manifests; browser/IdP E2E, AC-137 and independent review of the latest manifest.

## Plan

Order matters: delivery first, because every later change should land behind a gate.

| Phase | Work | Depends on | Exit criteria | Natural owner |
|---|---|---|---|---|
| **0. Freeze and reset** (0.5 d) | one freeze protocol with a named writer and a pin-then-edit rule; re-pin the manifest; review Codex's 16:05Z backend change; PO decides CR-002 | none | one current manifest; a recorded CR-002 decision | Codex (orchestration), PO |
| **1. Delivery foundation** (1-2 d) | move CI to the repo root with path filters; Dockerfile/compose/Makefile for `mcapi` (nonroot, healthcheck, migrate job, product DB); CI runs `make check`, the product PG suites, govulncheck and `pnpm audit` | 0 | green CI on a PR; image starts `mcapi`, `/readyz` passes; zero skipped DB tests in CI | Codex (DevOps) |
| **2. Remove the template** (1 d) | delete the `userapi` stack, kafka/outbox/relay, related docs and workflows; update `sqlc.yaml`, `depguard`, `.golangci.yml`, agent rules; `go mod tidy` | 1 | `make check` and CI green; no unauthenticated route in any binary; -5 dependencies | ZCode (backend) |
| **3. Security hardening** (1-2 d) | BR-04 https rule with tests; BR-05 migrator/runtime roles; BR-06 limits; BR-07 guard test | 1 | each with a failing-then-passing test; roles documented in operations docs | ZCode, reviewed by OpenCode |
| **4. Performance** (1-2 d) | PO sets workload numbers; run `TestPerf` and profile the graph load; record budgets | 1, PO | budgets recorded; regression threshold in CI or a nightly job | ZCode, QA |
| **5. Deployment ADR** (1-2 d + PO time) | Cloudflare Free feasibility, durable session/retry store, object store, production IdP, RPO/RTO and retention; record trade-offs for the PO | PO | approved ADR, or a rejected path with the reason | Claude (architecture), PO |
| **6. Close-out** | independent review of the new manifest; browser + IdP E2E once unblocked; restore rerun if backend storage behaviour changed; AC-137; CR-002 outcome | 0-4 | independent PASS with limitations on exact bytes | OpenCode, human |

Rough total: 6-10 working days of agent time plus PO decisions; Phases 1 and 2 give the biggest risk reduction per hour.

## Decisions I need from the PO
1. Retarget the image to `mcapi` and delete `userapi` (my recommendation), or keep `userapi` for reference outside the module?
2. Which CI home: repo root with path filters (recommended), or separate repos?
3. CR-002: browser storage, a server-side slot (with a contract revision), or an explicit local limitation.
4. Is a Cloudflare Free deployment still a goal? It drives Phase 5 and the session design.

## Not examined
All UI/frontend code (excluded); line-by-line correctness of domain rules beyond the suites; behaviour under concurrent load; the PostgreSQL suites in this pass; `govulncheck` and `pnpm audit` (not run); contract/docs completeness and the 16:05Z backend edits; dependency freshness and licences.

## Update 2026-10-28 (evening)
The PO decided: delete `userapi`, CI at the repository root with path filters, CR-002 to be explained further, infrastructure undecided. Phases 1 and 2 were carried out in the working tree; see `decisions-and-change-record.md` (and `userapi-removal-delta.json`) for exactly what changed, the verification and the new findings. Findings BR-01, BR-02, BR-03 and BR-08 are addressed there (BR-03 only structurally: the PostgreSQL suites could not be run in this pass).
