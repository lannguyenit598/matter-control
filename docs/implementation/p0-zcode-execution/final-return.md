# MC-P0 execution return — living document

## CURRENT (2026-10-28, actual Claude Code, continuation MC-P0-CLAUDE-FINISH-AFTER-ZCODE-20261028)

**Label: `IMPLEMENTED_WITH_VERIFICATION_BLOCKERS` — pending nonauthor review.** Not DONE, not ACCEPTED, not production-ready; MC-002, Step 03B, Mimosa and deployment are untouched. Nothing was staged, committed, pushed or deployed. Everything below this section is history (ZCode and earlier Claude segments) and is kept as written.

### 1. Identity, base, source
Actual Claude Code (claude-sonnet-5-5). Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`, source uncommitted. Source checkpoint `CKPT-CLAUDE-02-FINAL-CANDIDATE`: 701 files of `apps/backend` + `apps/frontend`, aggregate SHA-256 `c5c4f0cfb031f4a1ec456346d838437fe9388081d38b20da2095e5ab5cd1bf32` (method in the workboard). Contract revision 11, SHA-256 `55fd37ecaf9d2e7669f77775dbd0f44253c874bbd3408ce65f05cd6731b40979`. Handover: the writer was stopped by the PO's acknowledgement (ZCode and Mimosa processes staying alive were not treated as proof of a writer); authorship of W1–W5, ZCode's W6/W7 first pass and Codex material is preserved.

### 2. What was done, per item (details in the workboard `claude_finish_20261028`)
| Item | Result |
|---|---|
| Import graph + atomicity | Fixed. Row keys resolve to persisted ids; one transaction per connected group; cycle/self/reference validation; rights rechecked inside the transaction; registry + receipt replay; UNKNOWN recovered by the same keys. Memory **and** PostgreSQL (`SuiteW6`), HTTP, FE. |
| Status Brief | Fixed. Full-history replay with snapshot/patch semantics, `proofExpired`, late-recorded attribution, `brief-unreconstructable` instead of silent skips, legacy assessment payloads tolerated. |
| F01 dispute precedence | Already fixed by ZCode; regression tests added (withdrawn/revoked, resolution recomputes). |
| F02 stale assessment | Fixed end to end (`expectedAssessmentId`: absent 428, stale 412 with no mutation, fresh reversal allowed); form draft is tied to the assessment it was written against. |
| F03 filing guards | Fixed. ZCode's guard was inverted; now package criteria are required for **every** filing (criteria may exist on a no-proof filing), the OWNER `signature-applicability` decision waives only the signature, and a no-proof filing needs an observed signature or that decision. UI + API + both stores. |
| F04 Control Room | Fixed. The room carries its own records and labels; the page labels only from the room; the edit form states its own boundary. Contract, HTTP and a real page-orchestration test with skewed data. |
| F05 causal explanation | Fixed. Each blocker shows gate, upstream state and reason (completed-but-upstream-blocked, proof vs completion gate). |
| W7 Golden Workflows | `SuiteGW` ledgers for GW-01/02/03 with five-axis assertions and side-effect-free refusals, memory + PostgreSQL. ZCode's `gw_ledger_test.go` (GW03 on a generic Action, always-true `stageEvents >= 0`) was removed. Service-level evidence, not a browser journey. |
| Restore | Local rehearsal on a fresh DB + object root: census/hash identical, objects identical, readback through the real services identical, identical after a fresh process, post-boundary marker absent, corrupt/truncated archive refused (exit 1, 0 tables left), altered/missing object detected. Backup 0.16 s, restore 0.18 s, archive 209,562 bytes. Local figures, not RPO/RTO commitments. |
| ZITADEL Cloud | Configured, **not login-verified** (below). |
| Defects found only by executing W6 | Echo route collision (`bulk:preview` ran the commit handler), PascalCase wire vs camelCase FE, FE minted UUIDv4 keys and re-minted them on retry, non-hex receipt hash rejected by PostgreSQL, Action import inserted the node twice, memory registry fault seam, `useTransition` flake in the new tests. |

### 3. Coverage — no percentages
* **20 FR**: all 20 have backend + API + FE code. Author-tested = service/PG/HTTP/FE component. Browser/E2E: none. Independent review: none.
* **63 AC**: 17 rows newly mapped to concrete tests/evidence (workboard `evidence`), 21 earlier rows `AUTHOR_TESTED_SERVICE_LEVEL__NOT_UI_E2E`, the rest still `NOT_RUN` (not mapped, not claimed). AC-137 needs five real managers. AC-150/151/152 need a browser.
* **14 NFR**: see workboard; measured locally: NFR-006 (p50 4.9–5.8 ms, p95 5.1–6.2 ms; 50/200 items; 30 reps; 0 errors; service level only), NFR-014 (rehearsal). NFR-007/010/011 partial or unverified.
* **3 GW**: author-tested at service level on memory and PostgreSQL; no UI/E2E.

### 4. Cloud
Overlay `ops/p0-local/cloud/`: API key file verified privately (regular, 0600, owner, not a symlink, `clientId` = API client `396983864414715432`; only booleans printed), `MC_OIDC_API_CLIENT_ID` makes the API refuse any other key, Cloud subjects A/B mapped to new product users (users only, no memberships, no e-mail linking) in the run DB (migrated to 0007). Observed without a human: API starts, no bearer 401, bogus bearer 401; BFF login redirect carries client id, redirect URI, S256, state, nonce, project-audience scope and an HttpOnly SameSite=Lax cookie; Cloud's authorize endpoint accepted it. **Blocked (VERIFICATION_BLOCKED):** human sign-in, token audience (project id vs other), real `sub` of A/B, A/B isolation, refresh, logout, expiry. Reason: no human credential; Screen Recording is not granted to the computer-use driver (Accessibility is); no machine-token shortcut was used. Exact steps: `ops/p0-local/cloud/README.md`.

### 5. Checks (current bytes)
* Backend `make check` exit 0 (sqlc-check, gofmt, tidy, golangci-lint 0 issues, `go test -race`) with the native fixture `mc_native_claude` and the product fixture separate; `go test -json -race`: 695 pass, **4 skip, 0 fail**; skips: env-gated rehearsal tool, env-gated perf tool, the DSN helper's skip-without-env test, and the PostgreSQL step-fault seam (memory only).
* Frontend `pnpm check` exit 0 (39 files, 413 tests, 0 skipped), `pnpm build` exit 0.
* Raw redacted logs, test-event summary, GW ledgers, perf, restore evidence and a hash manifest: `docs/testing/p0-claude-finish-20261028/`. Flakes/failed attempts kept: `logs/fe-check-1.log` (a W6 test timed out; cause fixed), `logs/be-check-1.log` (lint findings), two incomplete restore runs.

### 6. Run, test, stop, restore
`ops/p0-local/cloud/README.md` (start/login/rollback), `ops/p0-local/restore-rehearsal/run.sh` (isolated rehearsal; refuses an existing target), backend `make check` with `TEST_DATABASE_URL` (native) and `MC_TEST_DATABASE_URL` (product) pointing at different databases. Stop only processes you started; `docker stop mc-p0-claude-pg` keeps data.

### 7. Decisions and risks for the owners (not adopted silently)
1. Outstanding at `t2` follows the approved contract: only CANCELLED work drops out, completed work stays visible with its verification. Whether completed-and-verified work should leave the list is a PO call.
2. `proofExpired` flags an expired acceptance at `t2`; it does not recompute the verification label for `t2`.
3. Signature rule differs by axis (proof-required: mandatory criteria; no-proof: observed signature or OWNER decision). Needs a nonauthor/PO read against RULE-012.
4. Contract rev 10 was edited in place before rev 11; its original hash is lost.
5. A fixture password fragment was printed once in the session transcript; role password rotated (redaction failure recorded in the workboard).
6. Not done: R9 re-audit of W1–W5 screens, visual/geometry evidence, localization, AC-137, production/Cloudflare/cost/retention, independent review.

---

**Status: `STOPPED — ZCode implementation halted mid-postrun-remediation; source handed over AS-IS to Claude Code (direct PO instruction, 2026-10-28).** Prior state before this segment: `IMPLEMENTED_WITH_VERIFICATION_BLOCKERS` (W1..W6 code-complete + author-tested both stacks; W7 author work done: GW ledgers, api.md/api.http, template cleanup, isolated restore verified). The postrun QA/Cloud round (task MC-P0-ZCODE-POSTRUN-REMEDIATION-INTEGRATION) was then **partially applied and is mid-flight — the backend currently DOES NOT BUILD in one test package**; see the handover section at the top of the ZCode continuation below and workboard `postrun_stop_checkpoint` for the exact file list, compile errors and remaining work. No DONE/ACCEPTED/production-ready claim; Mimosa commit gate unresolved; production/Cloudflare/$0 gates untouched.

---

## POSTOP handover checkpoint (2026-10-28, ZCode → Claude Code) — READ FIRST

Applied since the last green checkpoint (full detail in `workboard.json.postrun_stop_checkpoint`):

1. **F01 (fixed, domain)**: `internal/core/domain/matter/evidence.go` `claimStatus` now computes the same-epoch open-dispute flag **before** the withdrawn/revoked early-returns, so an unresolved dispute keeps DISPUTED precedence after withdrawal or acceptance revocation; satisfaction still ends; old-epoch assessments never block.
2. **F02 (fixed, port+service)**: `AssessCmd.ExpectedAssessmentID` (empty = expected first review); `evidence_service.go` refuses a mismatch with `port.ErrPreconditionFailed` after the open-dispute check — a stale review can no longer supersede an intervening verdict.
3. **F03 (domain+SQL applied; service/stores/HTTP/FE INCOMPLETE)**: `filing.go` — `Filing` struct gained `SignatureNotRequired{Reason,By,At}`; StagePackage now demands declared criteria for every filing unless `ProofRequired` **or** the OWNER applicability decision; `unsatisfied()` no longer early-returns for no-proof filings; StageSubmission/Response requires a signature observation covering the submitted versions unless the decision exists. Migration `0007_filing_signature_applicability.sql` created; `filings.sql` gained `SetFilingSignatureApplicability` and an extended `ListFilingDetailsOfMatter`; **sqlc regenerated (exit 0)**. NOT written: `FilingService.SetSignatureApplicability` + `FilingTx` method + port cmd + HTTP route/DTO + FE; pg row-mapping and memory-store equivalents for the four new columns (loads will silently drop them until mapped).
4. **New test file `internal/adapter/outbound/repotest/mattercontrol/contract_w7_qa.go` does not compile** (authored fail-first): wrong helper/type usage — `ClaimStatus.Current` (not `Claim.Current`), the Factory symbol name (not `newBundle`), typed-string casts (`CriterionReason`, `ClaimID`), `RaiseDispute` returns the checklist (get the dispute id from `OpenDisputes`), `Claim` has no `SubjectEpoch` (epoch lives on the item/assessment). Exact errors are in the workboard checkpoint.
5. **F04/F05, Cloud profile integration, acceptance-matrix reconciliation: NOT started.** Gates NOT rerun after these edits; the last green receipts remain the pre-postrun `make check` (19 pkgs/0 skip) and `pnpm check/build` in the workboard.

Commands actually run in this segment: reads only, plus `make sqlc-generate` (exit 0) and one failing `go build ./internal/...` (errors confined to the new test file). No migrations applied to any database, no tests, no pnpm, no commits/stages, no background tasks (none were ever spawned by ZCode — nothing to stop).

Resources retained for the next owner: fixtures `mc-p0-zcode-pg-native-test` :55441 (restore-demo dataset, migrations 0001–0006 applied; **0007 not applied**), `mc-p0-zcode-pg-product-test` :55442, `mc-p0-zcode-pg-restore-target` :55443 (`mc_data_restored` proof) — loopback-only, creds at `/tmp/mc-p0-zcode-testenv/dsns.env` (0600); ZITADEL local stack `mc-p0-idp-*` still up; Cloud key untouched (`keys/396983916088540712.json`, 0600, git-ignored, never opened by ZCode).

---

## ZCode takeover continuation (2026-10-27/28) — W6 complete, W7 remaining

- Author of this continuation: **actual ZCode** (ZCode Desktop app 3.16.3, darwin arm64, model self-reported `account:zai-start-plan/GLM-5.3-Flash` via Z.AI), under task **MC-P0-ZCODE-RESUME-AFTER-CLAUDE-STOP** (PO resume prompt supersedes the older owner/resume point). Claude's W1–W5 authorship below is preserved verbatim; nothing relabeled.
- Takeover snapshot verified: contract revision 9→10 (this continuation added §2.7), Claude stop inventory 665 entries aggregate `c6821c3cf3d58fe9dbc8ba510711445f00d10bce5c1b064e373051f0af14e6d7`, R9 return `d4dc769f…` / manifest `2b68bc92…` verified, stop intake `docs/reviews/p0-claude-stop-zcode-handoff-20261027.md` read in full.
- Baseline gates re-run as my own receipts: `make check` exit 0 (19 packages, 0 skips) and `pnpm check` 34 files/361 tests + `pnpm build` exit 0, both BEFORE any W6 edit.
- **W6 implemented both stacks** (contract §2.7, revision 10): backend `internal/core/{port,domain,policy}/dataops` + `service/dataops_service.go` + PG `matter_store_w6.go` + migration 0006 `import_sources` + sqlc regenerated + productapi `data_handlers.go`/routes; frontend `features/data-transfer` (schemas/repository/actions/panel) + `(app)/matters/[matterId]/data` page + BFF export stream route. Bulk = per-row receipts + row CAS + per-row SUCCESS/REPLAYED/FAILURE/UNKNOWN; import = RULE-014 `import_sources` registry (same source+row+content replays, changed content conflicts) + connected-group whole rejection + imported VERIFIED stored as claim with UNVERIFIED state; export = scoped current snapshot with formula-neutral encoding and provenance headers; brief = `(t1,t2]` changes separate from outstanding-at-t2 reconstructed by deterministic event replay of command-owned `after` snapshots (the current-t2-only restriction from Claude's stop return was NOT adopted; t2 is validated against the read boundary instead).
- **W6 behavioral tests (memory, TDD fail-first → pass)**: bulk partial success with distinct `unknown-item`/`stale` failures (AC-133), retry replays proven successes without re-apply, UNKNOWN-then-same-key-recovery, RULE-014 identical replay without new records + changed-content conflict (AC-132), connected-group whole rejection with independent row committing, imported VERIFIED stays UNVERIFIED, brief (t1,t2] endpoint exclusion/inclusion, t1=t2 empty changes with outstanding rendered, reversed window refused (AC-138).
- **Gates after W6 (my receipts, fixtures: fresh disposable task-owned `mc-p0-zcode-pg-native-test` :55441 + `mc-p0-zcode-pg-product-test` :55442, loopback-only, creds runtime-generated via process env only)**: `make check` exit 0 (19 packages ok, 0 skips, `-race`), `pnpm check` exit 0 (34 files/361 tests), `pnpm build` exit 0. One `proof-ui` test timed out once under full-suite load (5s limit) and passed on rerun + isolation — recorded as an observed load flake, not masked.
- R9 consumed as implementation input (return/manifest pins verified; 409-vs-checker conflict kept as documented design-check gap, product 409 `urn:mc:rejected` retained). R2-review notes (causal back/breadcrumb context; My Actions eligible/waiting/blocked/historical separation; actor from session, never hardcoded) recorded in the workboard for W2/W5 FE acceptance.
- Inherited blockers unchanged: ZITADEL effective redirect URI admin correction + user-token audience confirmation (human login rows still VERIFICATION_BLOCKED), no permitted browser (rendered/keyboard/touch/screen-reader/E2E NOT_RUN), AC-137 five real managers, Mimosa commit gate (no disposition), production/Cloudflare/$0/cost/retention unverified.
- **W7 done (my receipts)**: GW-01/02/03 checkpoint ledger tests pass (`internal/core/service/gw_ledger_test.go`, memory store — GW01 completion≠verification + PROOF-gate edge + `work.execution_changed` after-payload history; GW02 WAITING-with-party-and-owner, WAITING≠BLOCKED, no self-verification; GW03 filing completed≠VERIFIED, receipt≠approval; domain rules discovered and respected: `completion-time-required`, `waiting-details-required` + responsible owner, dependency edge Source=prerequisite/Target=blocked with CAS on the blocked revision). `docs/api.md` gained the MatterControl product-API section (normative pointer to contract §2–§2.7); `api.http` gained a product block (workspace/matter/requirement/receipt/brief/export). Template `/dashboard` + `/tasks` pages removed (no product callers remained); `not-found.tsx` now returns to `/workspaces`. **Isolated restore executed and verified**: migrations 0001–0006 + a one-transaction synthetic seed (2 users / 1 workspace / 1 matter / 1 requirement / 1 event / 1 receipt) → `pg_dump -Fc` → `pg_restore` into a fresh isolated target → census and readback byte-identical (requirement title/outcome/execution_state/revision and the event after-payload); synthetic object probe copied with identical SHA-256. This is the restore runbook executed locally — not a claim about production backup tooling.
- **Verification-blocked rows (exact)**: human login/session E2E (ZITADEL effective redirect URI admin correction + user-token audience confirmation); rendered/keyboard/touch/zoom/screen-reader rows for all FE waves (no permitted browser); AC-137 five real managers; INT-A harness closure; production/Cloudflare/$0/cost/retention. These are environment/authority blockers, not code gaps; each is listed per-row in the workboard.

---

## Prior continuation (Claude Code) — W1..W5 detail preserved

**Status at Claude stop: `PARTIAL_IMPLEMENTATION` (W1 fixed; W1–W5 code-complete and author-tested; W6 codec-only, W7 outstanding).** This is not a final candidate. It is updated at every checkpoint so an interruption never leaves the assignment without a return. No DONE/ACCEPTED/production-ready claim is made; independent review has not happened.

## Identity and snapshot

- Author of this continuation: **actual Claude Code 2.1.311, model `claude-sonnet-5-5`** (Sonnet 5.5), under task MC-P0-CLAUDE-TAKEOVER, continuing MC-P0-ZCODE-EXECUTION. Earlier source, logs and evidence remain attributed to **actual ZCode**.
- Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`. Source is uncommitted; HEAD alone does not identify it.
- Starting snapshot: 472 files under `apps/backend` + `apps/frontend`, identical to the Codex intake inventory (`docs/testing/p0-claude-takeover-20261027/source-inventory.json`); aggregate sha256 `1342a53ab547334be56a2adac441bec2f547520cf100ca4f98461af9e1c16401` (method in the workboard checkpoint).
- Contract: `local-contract.md` revision 9, sha256 `06b4c929cc9d7762f3acfc61950ccb691cf84488a9debdba20e1b98005cb3aaa` (also in `workboard.json`). Design inputs: R2/R3 and R7 review (`docs/reviews/p0-design-r7-full-review-20261027.md`); R8 not consumed (no completed return seen).

## Implemented and verified by the author

**Backend W1** (author evidence; cwd `apps/backend`; fixtures: task-owned `mc-p0-claude-pg` on `127.0.0.1:55440`, `mc_p0_native_test` = `TEST_DATABASE_URL`, `mc_p0_product_test` = `MC_TEST_DATABASE_URL`; PostgreSQL tests ran, none skipped):

| Area | State |
|---|---|
| Inherited defects | `gofmt` clean; two lint failures fixed |
| W1 store | PostgreSQL adapter: workspace/creation transactions, matter membership admin, history paging, own receipt, accessible matters, **my workspaces**, member lists, `GetMatter`; sqlc regenerated with the pinned tool |
| Shared contract suite | `contract_w1.go`: one suite, run against the memory double and PostgreSQL (`-race`) |
| Identity | ZITADEL introspection verifier (private-key-JWT, stdlib, fail-closed); lookup-only `(iss, sub)` resolver; `ops/p0-local/seed-users.sh` (explicit users-only seed) |
| Product API | `internal/adapter/inbound/productapi` (plain Echo, 17 routes), `internal/app/product.go`, `cmd/mcapi`, `config.LoadProduct` (+tests, `.env.example`, `docs/operations.md`) |
| Defects found and fixed | CreateMatter dropped its title and name/title were unvalidated; membership event seq; same-key CreateWorkspace race; memory `Total`; memory history omitted `requirement.created`; receipt `Kind` unset; error precedence made auth-first |

**Frontend W1** (cwd `apps/frontend`; dependencies installed from the lockfile with `--ignore-scripts`, git hooks untouched):

| Area | State |
|---|---|
| BFF/auth | Server-side session store (`globalThis` singleton) with an opaque cookie handle; Authorization Code + PKCE S256 with state/nonce; ID token verified against JWKS (iss, aud, exp, nonce); refresh (single flight); logout (same-origin POST, best-effort revocation); `/api/auth/session` (display name + end time only); `resolveSession()` asserts "authenticated" only (`permissions: ['*']`, user token forwarded, no IdP role mapping) |
| Product client | `src/lib/mc`: ETag/If-Match/Idempotency-Key, problem mapping, a lost command answer is `outcome-unknown` (never a plain failure), UUIDv7 key per user intent |
| Features/routes | `workspaces`, `matters`, `requirements`; pages `/login`, `/workspaces`, `/workspaces/[id]`, `/matters/[id]`, `/requirements/[id]`; distinct sign-in / forbidden / not-found / unavailable / outcome-unknown / stale / last-owner states; OWNER-only admin affordances mirror (never replace) API refusals |
| Fixed by build/probe | `force-dynamic` incompatible with Cache Components; `usePathname` needs Suspense on dynamic routes; `/api/auth/session` and `/workspaces` were prerendered at build time (now `connection()`) |

Checks actually run at the last full gate (all exit 0):

- `make check` (sqlc-check, gofmt, `go mod tidy -diff`, golangci-lint, `go test -race -count=1 ./...`): **0 lint issues; 17 packages ok**.
- `pnpm check` (typecheck, lint, format, vitest, agents:check): **24 files, 180 tests pass** (including 48 auth tests and 33 product-client/error tests with negative cases: forged/expired/replayed state, wrong nonce/issuer/audience/signature, alg downgrade, token-exposure scan of `Set-Cookie`, cross-origin logout, single-flight refresh); `pnpm build` exit 0. Two checks were mutation-tested (nonce and signature verification disabled: the tests fail).
- Non-browser smoke against the running production server (stopped afterwards): signed-out routes render "Sign-in required" (fail closed); real discovery against local ZITADEL works; the login redirect carries PKCE/state/nonce and the project-audience scope; cross-origin logout is 403; `mcapi` accepted by the real ZITADEL as an introspecting client (garbage bearer → 401, not 503).

## W1 findings and W2 (this continuation)

- **CW1-F01..03 fixed** (`workboard.json` → `review_findings`): unknown-outcome recovery is derived from whether the command carried an Idempotency-Key (receipted creations: same key + frozen payload; CAS-only membership commands: UNKNOWN, no resend, re-read first); lost response bodies/unusable 2xx payloads of commands are UNKNOWN (reads: unavailable); `returnTo` rejects control characters/backslashes/other origins and is re-validated at use. Mutation-checked.
- **W2 backend/API:** typed Actions (receipted), metadata edit, the full execution transition table with guards, AND-gate dependency evaluation (completion vs proof gate), cycle/self/duplicate/cross-matter refusal under the matter lock, derived timing/attention, critical chain, milestones with readiness, external parties, workstreams, Waiting On, My Actions with RULE-021 ordering; PostgreSQL migration `0002`; 19 routes; `urn:mc:rejected` problems; contract revision 6.
- **W2 frontend:** Work grid (filters as URL state, sort, paging, density, row-attributed inline title edit), record detail (state axes, metadata, execution with guards and rejection explanations, prerequisites/dependents with causal Back, escalation), Planning (milestones/parties/workstreams/waiting-on), My Actions (four sections, honest empty states), kept form drafts.
- **Checks (all exit 0):** `make check` (17 packages, 0 lint issues, PG fixtures attached, `-race`), `pnpm check` (30 files, 325 tests), `pnpm build`.

## W3 — documents and proof (this continuation)

- **Backend/API:** documents with immutable versions (a version never becomes current by being added; OWNER promotion with expected-current guard, reason and an impact acknowledgement token bound to the exact target), observed signatures, criteria (revisioned; claims and assessments pin the revision), evidence and claims, independent per-claim assessment (designated verifier, EDITOR/OWNER, not the evidence submitter nor the claimant; pinned to the subject proof epoch and the exact version), revoke/dispute/resolve, OWNER applicability decision, verifier designation, raw-body upload (authorized before the body is read, size-limited, digest folded into the idempotency fingerprint) and streamed download (opaque attachment, `nosniff`, checksum-verified). Verification is **derived** and recomputed from inputs at the read/command instant (expiry takes effect without a command); migration `0003`; memory + PostgreSQL parity under `SuiteW3`; contract revision 7 (§2.4).
- **Frontend:** `features/proof` (Proof card on the record page, Documents list/detail, upload with same-key retry, promotion with impact acknowledgement), same-origin streamed upload/download route handlers, W3 refusal wording.
- **Checks (all exit 0):** `make check` (0 lint issues, PG fixtures attached, `-race`); `pnpm check` (32 files, 347 tests); `pnpm build`. The self-evidence guard was mutation-checked (suite fails when disabled).
- **Found and fixed on the way:** the W2 fixtures pinned VERIFIED without proof; they now go through the real W3 path. The identity provider's subject is not the product actor id, so the proof view carries `callerId` from the API.
- **Not done for W3:** no browser/E2E/keyboard/touch evidence; the local object directory has no malware scanning, retention or encryption at rest; the promotion impact lists criterion ids rather than titles.

## W4 — regulatory filings (this continuation)

- **Model:** a filing is an ACTION work item (execution, dependencies, timing, waiting, proof epochs and evidence criteria are the shared machinery) plus a filing record: linked Requirement, authority party, stage, cycles, immutable submissions and append-only observations. Migration `0004`; memory + PostgreSQL parity under `SuiteW4`; contract revision 8 (§2.5).
- **Behaviour:** the approved nine-stage machine (every other pair refused); package/signature guards that list what is missing; exact versions per cycle; repeated supplement cycles (cycles and proof epochs independent); submitted ≠ completed (waits for acknowledgement); receipt/review ≠ approval; negative outcomes raise attention and block approval until an owner closes or reopens; owner reopen advances the proof epoch and approval needs outcome evidence recorded after it; corrections append and never edit; the generic status endpoint refuses a filing.
- **Frontend:** filings list/detail with stage tracker, cycles/submissions, observation timeline, per-stage advance form, negative/close/reopen/correction.
- **Checks (all exit 0):** `make check` (0 lint issues, PG attached, `-race`); `pnpm check` ×3 (33 files, 354 tests); `pnpm build`. Three guards were mutation-checked.
- **Not done for W4:** no browser/E2E evidence; the SIGNATURE stage has no waiting-on-signatory coupling; the filing list is not a filtered view of the work grid.

## W5 — Control Room and context records (this continuation)

- **Control Room:** one read of a matter from ONE repeatable-read snapshot with its boundary (`MC-As-Of`, source revision): state counts, blocked records with the prerequisites that hold them, next actions (ready work that releases a blocker or sits on a critical chain) with owner and adjacent open decisions, waiting-on with party and condition, milestone readiness with reasons, gaps (completed-unverified, no criteria, disputed proof, no owner, rejected filing) and the newest changes. Nothing is stored; an unavailable input is an error, never an empty section.
- **Context records:** Decision / Finding / Risk / Entity linked to work items (receipted creation, ETag-guarded update, closing keeps the record). They never change execution, verification or dependency, and an Entity grants no access. Migration `0005`; memory + PostgreSQL parity under `SuiteW5`; contract revision 9 (§2.6).
- **Frontend:** Control Room page in triage order with links to each record, context forms.
- **Checks (all exit 0):** `make check`; `pnpm check` (34 files, 361 tests); `pnpm build`.
- **Not done for W5:** AC-137 (five real managers) is NOT RUN and is not simulated; no mobile/keyboard/visual evidence; no as-of selector.

## Not implemented (honest ledger)

- **W1 human path is not verified end to end** (see blockers): no real user token has ever reached `mcapi`; UI→API→PG with a real session has not run; no Playwright/Storybook for the W1 screens.
- **W6–W7: not started** (bulk/import/export/brief, stabilization, Golden Workflows).
- W2 has no Playwright/keyboard/touch/visual/screen-reader evidence and no real-user UI→API→PG run.
- Template demo routes `/dashboard` and `/tasks` are still in the tree (unlinked); removal is scheduled for W7.
- `docs/api.md` / `api.http` do not describe the product routes (contract §2/§2.2 is the current catalogue).

## Verification blockers and boundaries

- **Human login is blocked by the identity provider's configuration, independent of any browser.** ZITADEL knows web client `396855005899980803` (a bogus id is `App.NotFound`) but answers **both** registered redirect URIs with `invalid_request: The requested redirect_uri is missing in the client configuration`, although `runtime/provisioning.json` lists them and `provision.sh` sets `devMode: true`. Correcting the application needs bootstrap/admin credentials that this task is not permitted to read; **dependency for Codex/PO: re-apply or fix the web application's redirect URIs** (details in `ops/p0-local/README.md`).
- **Browser-dependent verification: VERIFICATION_BLOCKED** (no permitted browser capability confirmed). Keyboard/touch/zoom/screen-reader/visual checks are not run. The login will not be driven by curl/Session API to manufacture a token.
- **Token audience unverified:** the pinned audience (`396855361123975171`, the API application's client id) is not guaranteed to be in a user token's `aud`; ZITADEL adds the project id and the requesting client id. The first permitted real login must record the actual `aud`; the pin follows (likely the project id). The verifier stays strict.
- AC-137 needs five real managers; not simulated. Local results prove nothing about production SLA, `$0` cost or Cloudflare.
- Mimosa commit gate: unchanged; nothing staged, committed, pushed or retried.
- Deliberate choices recorded for review: `productapi` uses plain Echo rather than Huma operations; HTTP tests run over the memory store (PostgreSQL covered at the store layer and by the live `mcapi` smoke).

## Resource disposition

- Container `mc-p0-claude-pg` (image `postgres:18-alpine`, `127.0.0.1:55440`, volume `mc-p0-claude-pgdata`, label `mc.task=MC-P0-CLAUDE-TAKEOVER`): running, task-owned, data retained. Secret `ops/p0-local/secrets/claude-pg.env` (0600, not in Git).
- Databases: `mc_p0_native_test`, `mc_p0_product_test` (test fixtures), `mc_p0_run` (product run DB; `mcapi migrate` applied, two users seeded by `ops/p0-local/seed-users.sh`).
- Processes started by this session (`mcapi`, `next start`) were stopped; nothing is left listening on 3000/8081.
- The ZITADEL stack (`mc-p0-idp-*`) and the BE01 containers were not modified.

## Local run

```
# database + users (once)
ops/p0-local/seed-users.sh                       # after `mcapi migrate` on mc_p0_run
# API: variables in apps/backend/.env.example (MC_*); key file ops/p0-local/runtime/mc-api-app-key.json
cd apps/backend && go run ./cmd/mcapi migrate && go run ./cmd/mcapi
# frontend: copy apps/frontend/.env.local.example to .env.local, then
cd apps/frontend && pnpm install --frozen-lockfile --ignore-scripts && pnpm build && pnpm start
```

Sign-in will not complete until the web application's redirect URIs are corrected (see blockers).

## Proposed status

`PARTIAL_IMPLEMENTATION`: W1 is code-complete on both stacks and author-tested; its end-to-end human path is blocked by identity-provider configuration. W6–W7 are outstanding. No full-candidate status may be claimed until all 20 FR / 63 AC / 14 NFR / 3 GW rows have source and execution evidence or an exact blocker.
