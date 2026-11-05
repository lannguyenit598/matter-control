# Manual document review matrix — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **Repo rule: do not commit or push unless the user asks**; every task ends with "record evidence", not a commit.

**Goal:** A Matter member can build a grid of exact document versions (rows) and versioned review questions (columns), and OWNER/EDITOR can record cited human answers; every answer stays attributable, edits to a question make older answers visibly stale, and nothing here verifies a Requirement, completes an Action or changes a Filing.

**Architecture:** One Matter-scoped feature copied from the context-records pattern: pure domain types, a `ReviewService` built on `WorkService.execute`/`readSnapshot`, a memory store and a PostgreSQL store both proven by one shared contract, an Echo handler group, then a Next.js feature module (`features/review`) with a route and a Matter tab. Answers are append-only; staleness is derived.

**Tech Stack:** Go 1.26, Echo v5, pgx + sqlc + goose, Uber Fx composition; Next.js 16 (Server Components + Server Actions), Zod, Vitest.

**Spec:** `docs/testing/claude-eigenwelt-features-r1/backend-handoff-requests.md` §B, `docs/superpowers/plans/2026-10-29-eigenwelt-features-roadmap.md` (defaults D1, D6), `docs/research/eigenwelt-20261029/mattercontrol-integration-assessment.md` (manual review rows).

## Global Constraints

- Module path `leonx.me/matter-control`; depguard layering unchanged (`core` imports only stdlib and core; adapters never import `core/service` or `core/policy`).
- Writes use `policy.DecideCreateRequirement` (OWNER/EDITOR with active workspace membership); reads use `policy.DecideReadRequirement`. **No new policy function.**
- Bounds: grid name ≤ 200 chars; ≤ 50 versions and ≤ 25 questions per grid; question text ≤ 1000; answer text ≤ 4000; `pageRef` ≤ 40; `quoteRef` ≤ 1000; answer-history page ≤ 100.
- Answer states stored: `REVIEWED`, `ABSENT`, `UNABLE` (a person says it could not be reviewed). `PENDING` and `STALE` are **derived**, never stored. No OCR/model error state exists.
- `pageRef`/`quoteRef` are user-entered, always labelled "not validated"; no page/quote is ever fabricated or fetched; PDFs/URLs are never followed.
- Existing receipts/CAS rules: creates take `Idempotency-Key` and no `If-Match`; structure changes take the grid ETag in `If-Match`; an answer takes the expected current answer id.
- No change to verification, Requirement/Action state, dependencies, Filings, Brief output or existing endpoints. Migration number: re-inventory right before writing (`0008` if still free). Never edit `mcsqlc/` by hand (`make sqlc-generate`).
- All repository text in English; UI strings EN + VI.

## Review Focus

1. A `versionId` from another Matter, or a non-existent one, is rejected with the **same** validation outcome (`unknown-version`) — test in Task 2 and Task 3.
2. A revoked member cannot read a grid, list grids or fetch cell history — test in Task 3.
3. Editing a question marks only that question's answers stale, never other columns, and older answers stay readable with their original question text — test in Task 1 and Task 3.
4. Recording an answer against a stale expectation (`expectedAnswerId` no longer current) returns precondition-failed and writes nothing; replay with the same key returns the original answer — Task 2/3.
5. A Brief generated after review events still reconstructs, and the Requirement/Action/Filing states are byte-identical before and after answers — Task 5.

---

### Task 1: Domain model and derived cells

**Files:**
- Create: `apps/backend/internal/core/domain/matter/review.go`
- Test: `apps/backend/internal/core/domain/matter/review_test.go`

**Interfaces:**
- Produces (used by Tasks 2–6):
  - `type ReviewAnswerState string` with consts `ReviewReviewed`, `ReviewAbsent`, `ReviewUnable`; `func (s ReviewAnswerState) Valid() bool`.
  - `type ReviewQuestion struct{ ID string; Position int; Revision int; Text string; RevisedBy ActorID; RevisedAt time.Time }`
  - `type ReviewGrid struct{ ID string; MatterID MatterID; Name string; CreatedBy ActorID; CreatedAt time.Time; Revision int64; VersionIDs []string; Questions []ReviewQuestion }`
  - `type ReviewAnswer struct{ ID, GridID, VersionID, QuestionID string; QuestionRevision int; State ReviewAnswerState; Text, PageRef, QuoteRef string; Author ActorID; AnsweredAt time.Time; SupersedesID string }`
  - `type ReviewVersionRef struct{ VersionID, DocumentID, DocumentName, Filename string; No int; Current bool }` (`Current` is a neutral fact, never "superseded").
  - `type ReviewCell struct{ VersionID, QuestionID string; Answer *ReviewAnswer; Pending, Stale bool }`
  - `type ReviewGridView struct{ Grid ReviewGrid; Versions []ReviewVersionRef; Cells []ReviewCell; AsOf time.Time; Revision int64 }`
  - `func NewReviewGrid(id string, m MatterID, name string, by ActorID, at time.Time) (ReviewGrid, error)`
  - `func NewReviewQuestion(id string, position int, text string, by ActorID, at time.Time) (ReviewQuestion, error)`
  - `func NewReviewAnswer(id, gridID, versionID string, q ReviewQuestion, state ReviewAnswerState, text, pageRef, quoteRef string, by ActorID, at time.Time, supersedesID string) (ReviewAnswer, error)` (stamps `QuestionRevision = q.Revision`)
  - `func BuildReviewCells(g ReviewGrid, answers []ReviewAnswer) []ReviewCell` — one cell per (version, question), current answer = the one no other answer supersedes.

- [ ] **Step 1: Write failing tests** in `review_test.go`:
  `TestNewReviewGridValidates` (blank/over-200 name rejected with `ValidationError`), `TestNewReviewQuestionBounds`, `TestNewReviewAnswerRules` (state must be valid; `REVIEWED` and `UNABLE` need non-empty text, `ABSENT` may be empty; `pageRef > 40` and `quoteRef > 1000` rejected; refs are trimmed), `TestBuildReviewCellsPendingWhenNoAnswer`, `TestBuildReviewCellsPicksCurrentAnswer` (a chain a1←a2 yields a2), `TestBuildReviewCellsStaleOnlyForRevisedQuestion` (answer at question revision 1, question now revision 2 → `Stale` true for that column, false for another column), `TestBuildReviewCellsIgnoresAnswersOfRemovedVersion`.
- [ ] **Step 2: Run** `cd apps/backend && rtk go test ./internal/core/domain/matter -run Review -count=1` → FAIL (undefined).
- [ ] **Step 3: Implement** the types and the four functions above in `review.go` (validation errors use the package's existing `ValidationError`; `BuildReviewCells` iterates `g.VersionIDs` × `g.Questions` in that order).
- [ ] **Step 4: Run** the same command → PASS; then `rtk go vet ./internal/core/...`.
- [ ] **Step 5: Record** the red/green output in the slice's evidence directory (no commit).

---

### Task 2: Ports and `ReviewService` (memory-store tests)

**Files:**
- Create: `apps/backend/internal/core/port/review.go`
- Create: `apps/backend/internal/core/service/review_service.go`
- Test: `apps/backend/internal/core/service/review_service_test.go`

**Interfaces:**
- Consumes: Task 1 types; `WorkService.execute`, `readSnapshot`, `createdReceipt`, `parseReceiptInputs`, `rejected`, `env.emit` (see `control_service.go` for the exact usage).
- Produces:
  - Commands (all carry `ActorID, MatterID string`): `CreateReviewGridCmd{IdempotencyKey, RequestHash, Name string}`; `ReviewVersionCmd{GridID, VersionID string; ExpectedRevision int64}`; `AddReviewQuestionCmd{GridID, Text string; ExpectedRevision int64}`; `ReviseReviewQuestionCmd{GridID, QuestionID, Text string; ExpectedRevision int64}`; `RecordReviewAnswerCmd{IdempotencyKey, RequestHash, GridID, VersionID, QuestionID, ExpectedAnswerID, State, Text, PageRef, QuoteRef string}`; queries `GetReviewGridQuery{ActorID, MatterID, GridID string}`, `ReviewHistoryQuery{ActorID, MatterID, GridID, VersionID, QuestionID string; Limit int}`.
  - `type ReviewService interface { CreateGrid(ctx, CreateReviewGridCmd) (matter.CreatedResult, error); AddGridVersion(ctx, ReviewVersionCmd) (matter.ReviewGrid, error); RemoveGridVersion(ctx, ReviewVersionCmd) (matter.ReviewGrid, error); AddQuestion(ctx, AddReviewQuestionCmd) (matter.ReviewGrid, error); ReviseQuestion(ctx, ReviseReviewQuestionCmd) (matter.ReviewGrid, error); RecordAnswer(ctx, RecordReviewAnswerCmd) (matter.CreatedResult, error); ListGrids(ctx, MatterListQuery) ([]matter.ReviewGrid, error); GetGrid(ctx, GetReviewGridQuery) (matter.ReviewGridView, error); AnswerHistory(ctx, ReviewHistoryQuery) ([]matter.ReviewAnswer, error) }`
  - `type ReviewReader interface { LoadReviewGrid(ctx, matter.MatterID, gridID string) (matter.ReviewGrid, error) /* port.ErrNotFound when absent */; ListReviewGrids(ctx, matter.MatterID) ([]matter.ReviewGrid, error); LoadReviewAnswers(ctx, matter.MatterID, gridID string) ([]matter.ReviewAnswer, error); ReviewVersionRefs(ctx, matter.MatterID, versionIDs []string) ([]matter.ReviewVersionRef, error) /* only versions of THIS matter */ }`
  - `type ReviewTx interface { ReviewReader; InsertReviewGrid(ctx, matter.ReviewGrid) error; SaveReviewGrid(ctx, g matter.ReviewGrid, expectedRevision int64) error /* zero rows = ErrVersionConflict */; InsertReviewAnswer(ctx, matter.ReviewAnswer) error }` and `type ReviewSnapshot interface { ReviewReader }` implemented by the storage adapters' `MatterSnapshot`.
  - `func NewReviewService(w *WorkService) *ReviewService`.
- Service rules (behavior the tests pin): events `review.grid_created`, `review.version_added`, `review.version_removed`, `review.question_added`, `review.question_revised`, `review.answer_recorded` with `TargetKind` `REVIEW_GRID`, reason empty, snapshots limited to ids/names/states (no answer text); structure commands require `ExpectedRevision != 0` (`ErrPreconditionRequired`) and equality (`ErrPreconditionFailed`) and bump `Revision` by 1; `AddGridVersion` calls `ReviewVersionRefs` and rejects with `rejected("unknown-version", …)` when the id is not returned (identical for missing and cross-Matter); a version already present is `rejected("duplicate-version", …)`; bounds from Global Constraints enforced; `ReviseQuestion` increments the question's `Revision` and the grid's; `RecordAnswer` loads the grid, requires the version to be in the grid and the question to exist (`rejected("not-in-grid", …)`), compares `ExpectedAnswerID` with the current answer id of that cell (`""` when none; mismatch → `ErrPreconditionFailed`), and chains `SupersedesID` to it.

- [ ] **Step 1: Write failing tests** in `review_service_test.go` using the existing in-memory `WorkService` fixture (copy the setup of `matter_service_test.go`): `TestCreateGridOwnerAndEditorOnly` (VIEWER → role denial, non-member → hidden), `TestAddVersionRejectsUnknownAndCrossMatterIdentically`, `TestStructureCommandsNeedCurrentRevision`, `TestReviseQuestionStalesOnlyItsColumn`, `TestRecordAnswerCASOnExpectedAnswerID`, `TestRecordAnswerReplayReturnsOriginal` (same key + hash → `Replayed`), `TestRecordAnswerRequiresVersionInGrid`, `TestAnswerHistoryIsBoundedAndOrdered`, `TestReviewDoesNotChangeVerification` (take the subject's verification/execution before and after answers: equal).
- [ ] **Step 2: Run** `rtk go test ./internal/core/service -run 'Review' -count=1 -race` → FAIL (undefined service).
- [ ] **Step 3: Implement** `port/review.go` and `review_service.go` as specified; the Tx assertion mirrors `ctxTx` in `control_service.go` (`env.g.(port.ReviewTx)`), reads use `snap.(port.ReviewSnapshot)`.
- [ ] **Step 4: Run** the command again → the tests that need a store still FAIL only on the missing memory implementation; keep them red until Task 3 and note it.
- [ ] **Step 5: Record** the failing list in evidence.

---

### Task 3: Memory store, shared contract, migration and PostgreSQL store

**Files:**
- Create: `apps/backend/internal/adapter/outbound/repotest/mattercontrol/memory_review.go`
- Create: `apps/backend/internal/adapter/outbound/repotest/mattercontrol/contract_review.go` and register it in the contract runner (follow how `contract_w4.go` is registered in `contract.go`)
- Create: `apps/backend/internal/adapter/outbound/postgres/migrations_mattercontrol/0008_review_matrix.sql`
- Create: `apps/backend/internal/adapter/outbound/postgres/queries_mattercontrol/review.sql` (then `make sqlc-generate`)
- Create: `apps/backend/internal/adapter/outbound/postgres/review_store.go`
- Modify: the memory `Store` struct (add `reviewGrids`, `reviewAnswers` maps) and PG `pgMatterTx`/snapshot wiring so both satisfy `port.ReviewTx` / `port.ReviewSnapshot`.

**Interfaces:**
- Consumes: Task 2 ports; `mapMatterError`; the `context_store.go` and `memory_context.go` shapes.
- Produces: stores satisfying `port.ReviewTx`/`port.ReviewSnapshot`; schema:
  - `review_grids(id UUID PK, matter_id UUID NOT NULL REFERENCES matters, name TEXT CHECK (length(btrim(name)) BETWEEN 1 AND 200), created_by UUID REFERENCES users, created_at TIMESTAMPTZ, revision BIGINT NOT NULL DEFAULT 1, UNIQUE (matter_id, id))`
  - `review_grid_versions(grid_id, matter_id, version_id, position INT, PRIMARY KEY (grid_id, version_id), FOREIGN KEY (matter_id, grid_id) REFERENCES review_grids (matter_id, id), FOREIGN KEY (matter_id, version_id) REFERENCES document_versions (matter_id, id))` — the composite FK makes a cross-Matter version structurally impossible.
  - `review_questions(id UUID PK, matter_id, grid_id, position INT, revision INT NOT NULL, text TEXT, revised_by UUID, revised_at TIMESTAMPTZ, FK (matter_id, grid_id), UNIQUE (matter_id, id))` and `review_question_revisions(question_id UUID, revision INT, text TEXT, revised_by UUID, revised_at TIMESTAMPTZ, PRIMARY KEY (question_id, revision))`.
  - `review_answers(id UUID PK, matter_id, grid_id, version_id, question_id, question_revision INT, state TEXT CHECK (state IN ('REVIEWED','ABSENT','UNABLE')), text TEXT, page_ref TEXT, quote_ref TEXT, author UUID, answered_at TIMESTAMPTZ, supersedes_id UUID REFERENCES review_answers, UNIQUE (supersedes_id), FK (matter_id, grid_id) and (matter_id, version_id) and (matter_id, question_id))` plus index `(grid_id, version_id, question_id, id)`; `UNIQUE (supersedes_id)` stops two answers branching from one.

- [ ] **Step 1: Write the shared contract** `RunReviewContract(t, factory)` in `contract_review.go` covering: grid round trip; versions add/remove keep Questions/answers; **cross-Matter version id rejected by `ReviewVersionRefs` returning nothing**; revision CAS conflict leaves nothing written; answer chain and `UNIQUE(supersedes_id)` (second answer with the same `SupersedesID` → `ErrVersionConflict`); `LoadReviewAnswers` ordered by id; revoked-member read denied at the service level with the PG store; question revision history retrievable. Wire it for the memory store (`contract_memory_test.go` style).
- [ ] **Step 2: Run** `rtk go test ./internal/adapter/outbound/repotest/... -run Review -count=1` → FAIL (no memory store).
- [ ] **Step 3: Implement** `memory_review.go` (same constraints as the schema: composite membership checks, uniqueness of `SupersedesID`) → rerun → PASS; rerun Task 2's service tests → PASS.
- [ ] **Step 4: Write** `0008_review_matrix.sql` (Up/Down), `review.sql` queries (insert grid, update grid with revision CAS `WHERE id=$1 AND matter_id=$2 AND revision=expected`, replace version set, insert/update question + revision row, insert answer, list answers, list grids, version refs `WHERE matter_id=$1 AND id = ANY($2::uuid[])` joined to `documents` for name and current pointer), run `rtk make sqlc-generate`.
- [ ] **Step 5: Implement** `review_store.go` (`loadReviewGrid` hydrating versions and question revisions inside the same snapshot as other reads) and wire it into the Tx and Snapshot types.
- [ ] **Step 6: Run the PG contract** against a **new labelled task-owned PostgreSQL fixture** (see roadmap rules; `MC_TEST_DATABASE_URL` set only after proving the DSN belongs to it) with `rtk go test ./internal/adapter/outbound/postgres/... ./internal/adapter/outbound/repotest/... -run Review -count=1 -race` → PASS; also `make sqlc-check`.
- [ ] **Step 7: Record** fixture identity, DSN-ownership proof (no secrets), counts, skips.

---

### Task 4: HTTP API, composition and API documentation

**Files:**
- Create: `apps/backend/internal/adapter/inbound/productapi/review_dto.go`, `review_handlers.go`
- Test: `apps/backend/internal/adapter/inbound/productapi/review_server_test.go`
- Modify: `apps/backend/internal/adapter/inbound/productapi/server.go` (Deps field `Review port.ReviewService`, routes), `apps/backend/internal/app/product.go` (`productServices.Review`, `service.NewReviewService(work)`, pass into `Deps`), `apps/backend/docs/api.md`.

**Interfaces:**
- Consumes: `port.ReviewService`; helpers `readJSON`, `idempotencyKey`, `requireNoIfMatch`, `expectedRevision`, `respond`, `markReplay`, `provenance`, `page[T]` as used in `control_handlers.go` and `work_handlers.go`.
- Produces (all under `/api/v1`, auth via the existing group):
  - `GET /matters/:id/review-grids` → `page[reviewGridBody]` (no cells).
  - `POST /matters/:id/review-grids` body `{name}` (Idempotency-Key, no If-Match) → 201 `createdBody` + `Location`.
  - `GET /matters/:id/review-grids/:gridId` → `reviewGridViewBody` with `ETag` = grid revision tag and `MC-As-Of`/`MC-Source-Revision`; body has `versions[{versionId, documentId, documentName, filename, no, current}]`, `questions[{id, position, revision, text}]`, `cells[{versionId, questionId, state: "PENDING"|"REVIEWED"|"ABSENT"|"UNABLE", stale: bool, answer?: {id, text, pageRef, quoteRef, author, answeredAt, questionRevision}}]`.
  - `POST …/review-grids/:gridId/versions` `{versionId}` and `POST …/versions/:versionId/removal`, `POST …/questions` `{text}`, `POST …/questions/:questionId/revision` `{text}` — all `If-Match` = grid ETag (via `expectedRevision`), return the new grid view.
  - `POST …/review-grids/:gridId/answers` `{versionId, questionId, expectedAnswerId, state, text, pageRef, quoteRef}` (Idempotency-Key, no If-Match) → 201 `createdBody`.
  - `GET …/review-grids/:gridId/cells/:versionId/:questionId/history?limit=` → `page[reviewAnswerBody]` newest first, `limit` 1–100 else 400.

- [ ] **Step 1: Write failing tests** in `review_server_test.go` with the existing `server_test.go` fake-service style: 401 without bearer; 403/404 mapping for VIEWER write / non-member read (uniform not-found); `If-Match` missing → 428, stale → 412; `Idempotency-Key` missing → 400; unknown JSON field → 400; `answers` replay sets `Idempotent-Replayed: true`; cross-Matter version → 422 problem identical to a missing id; `limit=101` → 400; response never includes another Matter's ids.
- [ ] **Step 2: Run** `rtk go test ./internal/adapter/inbound/productapi -run Review -count=1 -race` → FAIL.
- [ ] **Step 3: Implement** DTOs (explicit `json` tags, `omitempty` only where optional), handlers, and register the routes in `server.go`; add the `Review` dependency in `product.go`.
- [ ] **Step 4: Run** the command → PASS; then full `rtk make check` against the Task 3 fixture → report counts and skips.
- [ ] **Step 5: Update** `docs/api.md` with the table above and verify every claimed status code by executing it against a local API (curl with a synthetic token is not available: use the server tests' evidence and state that live calls happen in Task 9).
- [ ] **Step 6: Record** evidence.

---

### Task 5: Brief and state-isolation guarantees

**Files:**
- Test: `apps/backend/internal/core/service/review_isolation_test.go`

**Interfaces:** consumes `ReviewService`, `WorkService` fixtures and the Brief builder used by `brief_replay_test.go`.

- [ ] **Step 1: Write failing/guard tests:** `TestBriefStillReconstructsAfterReviewEvents` (create grid, answer, then generate a Brief at the later instant: no `ErrBriefUnreconstructable`), `TestAnswersLeaveWorkStateUntouched` (items' execution, dependency, verification, proof epoch and filing stage byte-equal before/after a burst of answers), `TestReviewEventsCarryNoAnswerText` (event snapshots contain ids/states only).
- [ ] **Step 2: Run** `rtk go test ./internal/core/service -run 'BriefStillReconstructs|AnswersLeave|ReviewEventsCarry' -count=1`; if a test passes immediately, record that it guards existing behavior (they must still be present).
- [ ] **Step 3:** if Brief replay rejects the new target kind, fix it in `brief_replay.go` by ignoring non-node targets exactly as context records are ignored; otherwise no source change.
- [ ] **Step 4:** run Task 4's full `make check` once more → PASS; record.

---

### Task 6: Frontend contract: schemas, repository, actions

**Files:**
- Create: `apps/frontend/src/features/review/schemas.ts`, `repository.ts`, `actions.ts`
- Test: `apps/frontend/src/features/review/review-contract.test.ts`

**Interfaces:**
- Produces:
  - Zod: `reviewGridSchema`, `reviewGridViewSchema` (shape from Task 4), `reviewAnswerSchema`, enum `REVIEW_CELL_STATES = ['PENDING','REVIEWED','ABSENT','UNABLE']`; types `ReviewGridView`, `ReviewCell`.
  - `reviewRepository`: `list(matterId)`, `get(matterId, gridId)` → `{ view, etag, asOf }`, `history(matterId, gridId, versionId, questionId)`, commands `createGrid`, `addVersion`, `removeVersion`, `addQuestion`, `reviseQuestion`, `recordAnswer` (all via `mcRequest`, `pathId`, idempotency/If-Match exactly like `workRepository`).
  - Server Actions (each starts with `requireSession('review:write')`, validates with Zod, returns `ActionResult`, revalidates `/matters/${id}/reviews`): `createReviewGridAction`, `addReviewVersionAction`, `removeReviewVersionAction`, `addReviewQuestionAction`, `reviseReviewQuestionAction`, `recordReviewAnswerAction`.

- [ ] **Step 1: Write failing tests:** schema accepts a full grid view and rejects an unknown cell state; `recordAnswer` sends `Idempotency-Key` and no `If-Match`; structure commands send `If-Match`; a 412 maps to the existing stale-conflict `ActionResult`; an input with `pageRef` of 41 chars is rejected before any request; the repository never sends an id that fails `idSchema`.
- [ ] **Step 2: Run** `rtk pnpm vitest run src/features/review` → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `rtk pnpm typecheck`.
- [ ] **Step 5: Record** evidence.

---

### Task 7: Grids list, create dialog, route and Matter tab

**Files:**
- Create: `apps/frontend/src/app/(app)/matters/[matterId]/reviews/page.tsx`, `apps/frontend/src/features/review/components/review-grid-list.tsx`, `create-grid-dialog.tsx`
- Modify: `apps/frontend/src/features/matters/components/matter-tabs.tsx` (tab `reviews`, VI "Rà soát", placed after Documents)
- Test: `apps/frontend/src/features/review/components/review-list.test.tsx`

**Interfaces:** consumes Task 6; reuses `TaskDialog`/`IntentForm` and `AddWorkDialog` as the pattern for a button-opened dialog; `ReadFailure`, `Skeleton`, `ListSection`. Produces route `/matters/[matterId]/reviews` and `?grid=<id>` selection used by Task 8.

- [ ] **Step 1: Write failing tests:** list shows names with counts of versions/questions; empty state says no review grid yet; the create button appears only for OWNER/EDITOR; submitting sends the same idempotency key after a simulated lost answer (copy the assertions from the existing creation-reload tests); VI strings present.
- [ ] **Step 2: Run** `rtk pnpm vitest run src/features/review/components/review-list.test.tsx` → FAIL. **Step 3: Implement** page (Suspense, `getSession`, `attempt`, honest read failure) and components. **Step 4: Run** → PASS; `rtk pnpm typecheck` and `rtk pnpm lint`.
- [ ] **Step 5: Record** evidence.

---

### Task 8: Matrix view, cell detail, answer form, filters

**Files:**
- Create: `apps/frontend/src/features/review/components/review-matrix.tsx`, `cell-detail.tsx`, `answer-form.tsx`, `grid-structure-forms.tsx`, `apps/frontend/src/features/review/matrix.ts` (pure helpers)
- Modify: the `reviews/page.tsx` from Task 7 to render a selected grid (`?grid=`, `?cell=<versionId>:<questionId>`, filters `?state=` and `?q=`)
- Test: `matrix.test.ts`, `review-matrix.test.tsx`

**Interfaces:**
- Produces: `matrix.ts`: `filterCells(view: ReviewGridView, f: { state?: ReviewCellState | 'STALE'; q?: string }): ReviewCell[]`; `cellLabel(cell: ReviewCell): 'PENDING'|'REVIEWED'|'ABSENT'|'UNABLE'|'STALE'` (stale wins for display, underlying state still shown in detail).
- UI rules: rows = exact versions (document name, `v<no>`, filename, neutral "not the current version" when `current` is false — never "superseded"); columns = questions with revision; each cell is a link to `?cell=` (keyboard focusable, state in text not only colour); selected cell opens an `<aside>` detail (as in Evidence basis) showing the question text at the answer's revision, answer, author, time, page/quote labelled "typed by a person, not validated", stale reason, history link; the answer form (OWNER/EDITOR only) carries `expectedAnswerId` and the idempotency key via `IntentForm`, handles UNKNOWN by re-reading and never resending with a new key; refs are rendered as text only.

- [ ] **Step 1: Write failing tests:** `filterCells` by state/stale/text; `cellLabel` precedence; matrix renders N×M cells with row/column headers; a stale cell says "question changed since this answer"; refs appear with the "not validated" label and are escaped (a `<img onerror>` string renders as text); VIEWER sees no answer form; `expectedAnswerId` of the form equals the cell's current answer id; a 412 shows the conflict message and keeps the draft.
- [ ] **Step 2: Run** `rtk pnpm vitest run src/features/review` → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Run** `rtk pnpm check` (typecheck, lint, format, tests, agents); report the known flaky upload-family tests separately if they recur.
- [ ] **Step 6: Record** evidence.

---

### Task 9: Real-runtime verification, evidence and handoff

**Files:**
- Create: `docs/implementation/tasks/MC-EIGENWELT-REVIEW-MATRIX.md`, `docs/testing/claude-review-matrix-r1/{return.md,source-manifest.json,receipts/,screenshots/}`

- [ ] **Step 1: Rebuild** the owned API from the current tree into the private run directory, run any pending migration **only after reading** `PendingMatterControlMigrations` output and recording it (this is the one place a migration touches retained data; get the human's go-ahead first), restart only my API process; check `/healthz`, `/readyz`, missing-bearer 401.
- [ ] **Step 2: Browser** (signed-in synthetic user, owned runtime): create a grid, add two uploaded versions, add two questions, record answers (`REVIEWED`, `ABSENT`, `UNABLE` with a typed page/quote), revise a question and observe only that column become stale, reload and use Back, try 390 and 320 px and keyboard-only. Record what was **not** observed (a second user: VIEWER read-only and revoked-member behavior are covered by contract tests only).
- [ ] **Step 3: Run** the final gates once the other writer's files settle: `rtk pnpm check`, `rtk pnpm build`, `rtk pnpm build:webpack`, backend `rtk make check` on a fresh labelled fixture; hash artifacts without self-reference.
- [ ] **Step 4: Write** the return (feature result, routes/API/migration, tests with counts and skips, permissions, runtime ownership, what was not verified, proposed status `IN_REVIEW_WITH_VERIFICATION_BLOCKERS`) and the task record; no commit, no self-awarded independent PASS.

---

## Self-review

- **Spec coverage:** input set (Task 1/3 rows), versioned questions (columns, revisions table), answer author and exact version (answers carry both), optional user-entered page/quote (bounded, labelled), review history (append-only chain + history endpoint), ACL (Task 2/3 tests), stale rules (derived in `BuildReviewCells`), bounded filtering and accessible cell detail (Task 8), "never verifies" (Task 2/5 tests). **Gap on purpose:** no export in v1 (the spec says "if adding export"; omitted, YAGNI).
- **Type consistency:** `CreatedResult` for creates and the grid for structure commands in Task 2 match Task 4 handlers and Task 6 repository; `ExpectedAnswerID` ↔ `expectedAnswerId` ↔ `expectedAnswerId` field in the form.
- **Proportion:** signatures, schema and test names are specified; bodies are left to the implementer.
