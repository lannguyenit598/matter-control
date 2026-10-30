# Review matrix — independent verification

Task: MC-EIGENWELT-REVIEW-MATRIX-VERIFY-20261029. Actual Local Codex; nonauthor of Claude's review matrix. Primary checkout `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, intake/final HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`. No external agent/chat invoked or messaged. No shared application source changed; all adversarial tests, mutations and builds ran in `/private/tmp/mc-review-verifier-20261029-r1/`. The author's packet and dirty work were preserved.

**Proposed status: REWORK_REQUIRED.** The normal suites pass on backend, but independent regressions find protocol/recovery/history/access-loss defects.

| Area | Verdict | Scope |
|---|---|---|
| A — Backend | VERIFIED_WITH_FINDINGS | Pinned source, fresh actual PG contracts, races, scale, Unicode, isolation and mutation checks; F01/F03 need correction |
| B — Frontend | VERIFIED_WITH_FINDINGS | Source, unit/adversarial checks and both private production builds; F02/F04 and recorded timing failures remain |
| C — Runtime | NOT_VERIFIED | Read-only retained API health/ready both 200; no human-assisted authenticated browser journey, runtime/binary identity or rendered acceptance verified here |

## 1. Pins, provenance and compatibility edits

- `source-manifest.json`: **43/43 SHA-256 and byte lengths match**, no intake drift. Final recheck is recorded separately; this verdict applies to those pinned bytes. Scratch dependency/output arrangements are not candidate source changes.
- `artifacts.sha256` actually contains **11 entries**, not the prompt's stated five: all 11 match. `intake.json` records each checked path, expected/observed SHA-256 and byte length.
- The pinned `SuiteReview` has eight named subcases, rather than the author's reported nine. The reported full backend event count was independently reproduced; this smaller narrative count discrepancy does not invalidate the actual executed results.
- Migration inventory: only `0008_review_matrix.sql` is new; **0001–0007 match** the earlier backend manifest. Five new tables and Down order reviewed; no retained migration or rollback run. `make check` includes successful `make sqlc-check`, verifying generated outputs match source SQL/config. This proves generated-byte consistency, not the historical invocation of `make sqlc-generate`.
- `SearchLocalWorkspacePeople` in `queries_mattercontrol/matter.sql` predates this feature: its current hash equals the earlier hardening S6 pin `de0ed225e8206fe2346e8b09f9d5d1c1f94f3666fcba99c267754ab03a5df6e8`. It is absent from committed HEAD, so this is prior dirty-source work, not prior committed work. Regeneration now incorporates it in `mcsqlc/matter.sql.go`; do not attribute the underlying query addition to review-matrix behavior.
- `product_readiness_test.go`: removing exactly the new `nil, ` argument reconstructs the prior file hash `da74985bde228951cbf03386bb9ba89c42c5aec10de85b677e1b5871cab4b2d1`. Compatible with the added ReviewService dependency; no other edit to that test is inferred. This narrow compatibility review does not independently approve Codex's earlier readiness implementation.
- Matter tabs/source test include Reviews after Documents and ten tabs; the current targeted tests pass. They are included in the 43 checked pins. No unrelated visual changes were made by this verifier.
- Versions: Go 1.27.3 darwin/arm64, golangci-lint 2.14.0 (Go 1.27.1), Node 24.22.1, pnpm 12.11.2, Docker client/server 29.9.2, cached PostgreSQL 18.6 image `898c60cb390d`. Full image identity/limits in `fixture.json`, tool output in `versions.json`.

## 2. Confirmed findings

### RMV-F01 — P2 — missing answer expectation is silently treated as explicit “none”

Location: `apps/backend/internal/adapter/inbound/productapi/review_handlers.go:30,188`; service comparison at `internal/core/service/review_service.go:273`.

Trigger: POST an answer to an empty cell with valid `questionRevision`, omitting `expectedAnswerId`. The decoder's string zero value is indistinguishable from the caller explicitly choosing `""`.

Observed: **201 and a new answer**, where the assigned protocol requires missing expectation 428. This does not overwrite an existing answer (the later service comparison still protects it), but lets a malformed/new client write without stating the precondition the person saw. Null has the same decoder representation; the proposed regression specifically reproduces omission.

Minimum correction: distinguish absent/null expectation from an explicitly provided empty string at the HTTP boundary, preserve existing hidden-resource ordering, and keep `""` valid for an intentionally observed empty cell. Add missing/null/explicit-none/current/stale cases. `adversarial.log` and `proposed-regressions.patch` retain the failing 428 assertion.

### RMV-F02 — P2 — an UNKNOWN retry can reuse its key with a different CAS payload

Location: `apps/frontend/src/features/review/components/answer-form.tsx:38-48`, interacting with shared `IntentForm`'s frozen form values.

Trigger: an answer produces OUTCOME_UNKNOWN; while its form remains mounted, a refreshed view changes `expectedAnswerId` or `questionRevision`. The input fields are frozen, but the run callback closes over the **new props**.

Observed: same idempotency key and answer text, but the retry changes `expectedAnswerId: "" → <new answer>` and `expectedQuestionRevision: 1 → 2`. The actual backend would fingerprint a different command under the same key, breaking the safe recovery path (typically key-reuse refusal rather than a faithful replay). No duplicate write is claimed.

Minimum correction: freeze the complete command intent, including scope and CAS facts, for a pending/UNKNOWN request; reconcile the original receipt/key even after refreshed props or navigation. Do not solve this by minting a new key or silently adopting the newer wording. `adversarial-ui-r2.log` and `adversarial-ui-r3.log` show exact payload differences; the failing regression is in `proposed-regressions.patch`.

### RMV-F03 — P2 — history silently presents a truncated audit trail as complete

Location: `apps/backend/internal/core/service/review_service.go:391-394`, `internal/adapter/inbound/productapi/review_handlers.go:219`, frontend `features/review/repository.ts:35-42` and `components/cell-detail.tsx:162-210`.

Trigger: record 101 legitimate successive answers to one cell, then GET history.

Observed: 100 items, `page.total=100`, `nextCursor=null`; the oldest answer is unreachable through this API and the UI shows “History” with no partial marker/continuation. The 100-row page cap is approved; **false completeness and no way to retrieve older rows** are the defect. Legal reviewers can miss the original conclusion/citation while believing they see the full trail.

Minimum correction: keep the bounded page, expose truthful pagination/continuation (or a clearly scoped partial result under an agreed contract), and let the UI reach the retained history rather than hiding truncation. Do not just increase an unbounded limit. `history-truncation.log` records the exact envelope; failing regression included in `proposed-regressions.patch`.

### RMV-F04 — P1 — confirmed access loss leaves the protected review detail displayed

Location: `apps/frontend/src/features/review/components/cell-detail.tsx:65-224` plus `components/answer-form.tsx:40` and `src/components/organisms/intent-form.tsx:176-183`.

Trigger: a user has an existing cell detail open; recording another answer returns `not-found` after membership loss. The shared form clears its entered draft, but the review surface keeps rendering its already-loaded document name, existing answer and quotation; it neither clears the protected parent nor refreshes its authorization result on refusal.

Observed: after the refusal message appears, `PRIVATE EXISTING ANSWER` remains in the DOM. This is retained previously authorized content after a **known denial**, not a new backend ACL bypass or a claim that historical screenshots can be revoked.

Minimum correction: invalidate/clear the protected review surface on definitive unauthenticated/forbidden/not-found outcomes, re-read with current rights as appropriate, and preserve unrelated safe navigation. A successful reload must not resurrect drafts after access loss. Do not merely hide the error or clear only editable input. Failing DOM regression is in `adversarial-ui-r3.log` and `proposed-regressions.patch`; no browser proof is claimed.

All findings were reproduced on scratch copies of the actual implementation. Production source fixes were **not** applied. The proposed patch adds regression tests only; another writer must implement the corrections.

## 3. Required Review Focus 1–5

| Focus | Confirmation and limit |
|---|---|
| 1. Foreign/missing/malformed version; foreign grid | Shared memory/PG and HTTP tests confirm foreign/missing equality; verifier malformed-version HTTP check returns the same unknown-version rejection class. Another Matter's grid is 404. No cross-Matter version is exposed by refs lookup |
| 2. Revoked/nonmember reads | Shared PG contract denies revoked grid/list/history. Independent HTTP cases verify grid, list, history and POST answers return uniform not-found for a provisioned user with **no membership row**, and for a revoked member. No live second-user browser acceptance inferred. F04 is the client reaction after such denial |
| 3. Question revisions | Existing contracts preserve original wording and stale only the changed column. Verifier answer-vs-reword race produced reword success, old answer 412, no answer stored; either serialized ordering is explicitly asserted as safe. Mutation removing the guard fails the shared contract |
| 4. Stale answer expectation/replay | Existing HTTP test verifies byte-stable same-key replay and 412 stale expectation. PG concurrent same-predecessor calls yield one winner and one precondition conflict, two history rows total. Concurrent structure changes similarly have one winner. F01 concerns absent expectation; F02 concerns client fidelity to the original UNKNOWN command |
| 5. Brief and state isolation | Existing Brief reconstruction and no-answer-text event tests pass in full gate. Independent PG test seeds Requirement/Action/Filing/evidence graph, serializes the **full graph** before/after three answers and verifies byte equality, covering proof epoch and filing fields beyond the author's narrower three-axis test |

Brief disposition: generic `review.*` change-list entries are consistent with existing `context.*` history behavior and do not mutate/reclassify work. No answer/page/quote text enters events or Brief; grid names are present in structure snapshots as the detailed plan allows. I do not find this alone a runtime defect. The plan's blanket “no change to Brief output” is too broad relative to its generic audit/change-list pattern and should be clarified editorially; no new product-filter policy is silently approved here.

## 4. Schema/layering and deferred-minor rulings

- Pure domain imports standard library/core only; writes use `WorkService.execute` with existing `DecideCreateRequirement`; reads use `readSnapshot` (existing read policy). Composition injects ReviewService. No new policy function or adapter dependency on service/policy is introduced; depguard/lint passes.
- Review answer events carry IDs/revision/state, no answer/page/quotation; structure snapshots include the planned grid name/IDs. Domains/stores do not mutate work/evidence/filing state on review commands.
- Composite FKs protect Matter-scoped grid/version refs and grid-scoped question refs. UNIQUE(supersedes_id) prevents a second successor. The missing root partial unique constraint, cell-scoped predecessor FK and question-revision FK are **defense-in-depth gaps, not a reproduced API bypass**: the unconditional Matter lock serializes API commands, server selects the predecessor and current question revision, and PG race tests pass. Keep these as documented storage-hardening items; do not pretend the schema alone enforces all service invariants. Domain nonempty REVIEWED/UNABLE text validation is also stronger than the SQL CHECKs.
- Existing index supports grid/version/question history lookup, but `LoadReviewAnswers` fetches all history of the grid and service then truncates; the tested 50×25 case is one bounded local read, not an unlimited-history performance guarantee.
- UUIDv7 history order can disagree with the supersession chain under clock skew; current-cell selection itself uses chain links. This is a P3 chronological-display risk, not observed in the single-instance test. Prefer explicit chain/recording order when implementing F03 pagination. Raw unparsed IDs in remove/reword/history yield less consistent validation/canonicalization; no data leak/500 was reproduced through normal guarded paths. Do not inflate them into a security bypass.
- Down migration drops the five review tables in dependency order; **it destroys their recorded review data**. The author's “goose down” rollback note is not executed or adopted as a safe retained-data rollback instruction. No downgrade/restore was authorized here.

## 5. Frontend checks and limits

- URL selection/filter parsers whitelist IDs/state, bound text and encode links; plain React text rendering covers answer/page/quote markup. Existing tests verify an `<img onerror>` string remains text, viewer write controls are absent, stale conflict retains text, original question wording is shown and Reviews tab is present (ten tabs).
- Matrix states are words as well as styling, links are keyboard-focusable, typed refs are labelled “not validated”. English-only `aria-label` values and many links with only state/text lack ideal localized row/question context: P3 accessibility/localization follow-up, no full screen-reader pass. Opacity is not the sole state signal, so it is not by itself a colour-only-state defect.
- No claim of instantaneous revocation before a client learns of it; F04 is specifically after an authoritative denial. A removed-version row's old answers remain API-readable but UI-inaccessible; recorded product limitation. This compounds F03's trail-completeness issue and should be explicit to users.
- Vietnamese precomposed `ế` at name=200, question=1000, answer=4000, page=40, quote=1000 passes through independent PG service/domain/SQL checks, separate HTTP boundary test and client schemas; client over-limit values are rejected. This is code-point/UTF-16-compatible BMP Vietnamese evidence, not a grapheme-count or astral-character equivalence claim.
- Full `pnpm check` **FAILED**: 75 files pass/1 fails; 691 tests pass/1 upload-family test times out at 5s. Exact failure is retained in `frontend-check.log`; agent check was then run separately (pass). Typegen/typecheck, lint and formatting had passed before the test failure.
- Initial targeted review/matters run **FAILED**: 42 pass/1 failure at create-grid UNKNOWN retry (second call did not occur before waitFor timeout). The file passed alone 4/4; subsequent targeted run passed 43/43. Every run remains recorded; a green rerun does not show the timing issue is resolved. No test timeouts/assertions were weakened.
- Two verifier UI semantic regressions fail deterministically in the final local run: UNKNOWN command changes and access-loss detail retention (2 fail/1 Unicode pass). These are independent of the timing flakes.

## 6. Commands, fixture and builds

See `check-command.json`, per-run `*-command.json`, `test-counts.json`, `command-ledger.json` and raw logs. Counts include named parents/subtests; no-test packages are separate.

| Executed check | Result |
|---|---|
| `make check`, scratch backend, new labelled PG, GOFLAGS=-v | **634 pass / 5 skip / 0 fail**, exit 0; sqlc/gofmt/tidy/lint/race all pass |
| Requested original `go test ... -run Review -count=1 -race -v` | **32 pass / 0 fail / 0 skip**, exit 0. Deliberately failing verifier tests run separately |
| Verifier PG races + max grid + Unicode | Pass. 50 versions ×25 questions =1,250 cells; observed get read about 8ms on the constrained local fixture, no SLA claim |
| Verifier full WorkGraph/Filing isolation | Pass after correcting a test-harness interface name; initial compile failure retained separately |
| Missing expectedAnswerId HTTP regression | Fails desired 428 assertion: actual 201 |
| 101-answer history regression | Fails truthful-completeness assertion: actual total100/no continuation |
| Explicit nonmember/revoked HTTP + Vietnamese HTTP | Pass; initial ACL harness type-name error preserved |
| Scratch mutations: successor rule / wording revision | Both shared memory contracts fail as expected; originals restored after each |
| `pnpm check` + initial targeted | Failures above; no blanket frontend gate PASS |
| `pnpm build` initial scratch symlink layout | Blocked by Turbopack external workspace dependency resolution; retained error |
| Direct installed `next build` + CSS guard, materialized scratch deps | Pass, exit 0, CSS 1 asset |
| Direct installed `next build --webpack` + CSS guard | Pass, exit 0, CSS 2 assets |

The final direct build commands exactly execute the package scripts after avoiding pnpm's automatic dependency verification. They are not falsely labelled successful literal pnpm invocations. The private copy first used a node_modules symlink; pnpm warned that it was not a real hoist directory but continued. After materializing a private hardlink tree, a subsequent pnpm run attempted automatic package verification/downloads; it was interrupted (130), no completed dependency install/upgrade is claimed. Scratch dependencies were restored from installed local bytes, and direct executables were used thereafter. No live `.next`, source config, shared dependency install, provider credential or retained process was used to bypass a permission denial. All failed/interrupted attempt logs remain available. No external R2/AWS call occurred.

Fixture: `mc-review-verify-pg-20261029-r1`, label `mc.owner=MC-EIGENWELT-REVIEW-MATRIX-VERIFY`, 127.0.0.1:51866, PostgreSQL18.6 cached image, 1 CPU/512MiB/128PIDs, private anonymous volume; fresh secrets in 0700 directory and 0600 files under `/private/tmp/mc-review-pg-20261029-r1`. The owner label was checked before setting `MC_TEST_DATABASE_URL`; real-R2/AWS credential variables were removed from test environments. Never tested retained `mc_p0_run` or login DBs. Container and its anonymous volume were removed after exact owner checks (`cleanup.json`); private secret files remain outside Git, values not published.

Retained API probes `/healthz` and `/readyz` were 200. No retained API/frontend/PG/IdP lifecycle, migration, browser session access, token/cookie/key copy or screenshot action occurred. Browser checks NOT_RUN because this verifier did not obtain a human-assisted authorized browser session; build/test artifacts cannot substitute.

## 7. Next exact action

Author/separately assigned writer: apply the proposed failing regressions from `proposed-regressions.patch` in the relevant source context and fix RMV-F01..04 without changing policy, original request identity or data. Return new pinned bytes and evidence. The patch has **not** been applied to the shared checkout. The declared history/pagination correction may require a narrow contract update; maintain the bounded page and do not invent an approval for wider scope. Preserve all original logs and packet hashes.

Nonauthor verifier: rerun affected regressions and final gates on corrected pins, then human-assisted VIEWER/revoked/UNKNOWN and history UI journeys. No external dispatch made. No D2–D9 approval, next feature, MC-002 DONE, release/security/legal or production acceptance follows from this verification.

Skipped: authenticated rendered/responsive/screen-reader verification, deployed performance, real R2/providers, retained-data outage/migration/rollback, new feature/policy decisions, source fixes and commit/push/merge/deploy. Remaining risk: known denial leaves protected detail visible, UNKNOWN retries can change payload, and history hides older answers; passing ordinary contracts/builds do not clear those defects.
