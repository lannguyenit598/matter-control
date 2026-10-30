# MC-EIGENWELT-REVIEW-MATRIX — return (author verification)

Agent: actual Claude Code (`claude-sonnet-5-5`), executing `docs/superpowers/plans/2026-10-29-review-matrix.md` inline. HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` (dirty tree). **Nothing committed, pushed or deployed; no real R2 call.** Proposed status: **IN_REVIEW_WITH_VERIFICATION_BLOCKERS**. Ledger with all rulings: `.superpowers/sdd/2026-10-29-review-matrix/progress.md` (git-ignored scratch; the rulings are repeated below).

## What exists now

A Matter-scoped **manual review matrix**: a grid of exact document versions (rows) and versioned questions (columns); OWNER/EDITOR record cited human answers (REVIEWED / ABSENT / UNABLE); every member reads. Answers are append-only; PENDING and STALE are derived; rewording a question marks only its column stale and keeps the old wording; nothing here verifies a Requirement, completes an Action or changes a Filing.

- **API** (`docs/api.md`, "Review matrix"): `/matters/{id}/review-grids` list/create/get; versions add/remove; questions add/reword; answers; cell history. Receipted creates, grid-ETag CAS for structure, `expectedAnswerId` and `questionRevision` CAS for answers.
- **Migration `0008_review_matrix.sql`**: 5 tables (`review_grids`, `review_grid_versions`, `review_questions`, `review_question_revisions`, `review_answers`), composite foreign keys so a version or question of another Matter/grid is structurally impossible.
- **Frontend**: route `/matters/[matterId]/reviews` and a "Reviews" tab (VI "Rà soát"); list + create dialog, matrix, cell detail, answer form, structure dialogs (add/remove version, add/reword question), state and text filters in the URL.

## Verification

| Check | Result |
|---|---|
| Backend `make check` on a new labelled task-owned PostgreSQL fixture (DSN ownership proven, real-R2/AWS variables unset) | exit 0, **634 pass / 5 skip / 0 fail**, golangci-lint 0 issues, sqlc-check ok. The 5 skips are the same as Codex's gate: real R2, pgtest self-test, memory-only W6 seam, perf, restore |
| Shared contract (`SuiteReview`) | 9 cases, run on the memory store and on PostgreSQL; a mutation check proved it fails when the single-successor rule is removed |
| Frontend | typecheck, lint, format, agents pass; vitest **76 files / 692 tests** (one run); other full runs show one timing-sensitive flake each (see receipts) |
| Builds | `pnpm build` and `build:webpack` both passed with the compiled-CSS guard after the fix pass |
| Real runtime (human approved the migration): applied 0008 to the retained DB `mc_p0_run` after a private `pg_dump`; swapped my own API (binary sha256 prefix `9b0a27fa6ad396af`) | health 200, ready 200, missing bearer 401. In the signed-in browser: created a grid, added two uploaded document versions and two questions, recorded REVIEWED/ABSENT/UNABLE answers with typed page/quote, reworded one question (only that column became stale, old wording shown), saw the answer history with text and references, filtered, used the keyboard, Reviews tab current, no page overflow at 1280/390/320 (the matrix scrolls inside its own container), add-question dialog at 320 bounded with reachable submit, Escape closes and returns focus, console clean |
| Independent review | fresh opus reviewer over the whole feature: 3 Important + 9 Minor. All Important fixed with red→green tests (below) |

### Fix pass (Critical/Important only)

- **F1** an answer to a question reworded after the writer opened the cell was stamped with the new wording and shown current. Fixed: the command now carries the wording revision the writer saw (`questionRevision`; missing = 428, reworded since = 412). Tests: service, contract (memory + PostgreSQL), HTTP, frontend schema/form.
- **F2** the Reviews tab was missing: `matter-tabs.tsx` had been rewritten by another writer after my edit. Re-added; a test now pins the link and the tab count (edited that writer's test file minimally).
- **F3** superseded answers were readable only through the API. The cell detail history now shows every answer's conclusion, text, typed references (labelled not validated), author, time and the wording it answered.
- **F4** limits counted bytes in Go but characters in PostgreSQL and the client, so Vietnamese text was refused early with a false message. Domain limits now count characters.

## Rulings I made (and what each costs if wrong)

- Worked in the primary checkout, no worktree, no commits (repo rule; the tree holds other owners' dirty work).
- Added `LoadReviewQuestionHistory` and `ReviewGridView.QuestionHistory`: the plan stored question revisions but gave no way to read the wording an answer addressed. Cost: one extra read.
- Added one `nil` argument to Codex's `internal/app/product_readiness_test.go:102` because `newProductHTTPServer` gained a `ReviewService` parameter. Cost: a one-token edit in a Codex file.
- Gave my own async dialog test a 15 s per-test budget (it hit the 5 s default under machine load). Cost: a real hang shows 10 s later.
- Review events appear in the Brief's change list like `context.*` events do; no answer text leaks. Whether the Brief should hide non-work events is a PO/Codex decision (cost: raw event-type lines in a Brief).

## Deferred minors

Raw (unparsed) ids in remove-version/reword/history; history ordered by UUIDv7 id rather than the supersession chain (differs only with skewed clocks across several API instances); schema defence-in-depth (no partial unique index for one root answer per cell, `supersedes_id` FK not cell-scoped, no FK on `question_revision`); matrix cell links named only by state and dimmed cells rely on opacity; English-only aria-labels and `ReadFailure` subject; list page never shows "Read at"; grid page fetches every document per render for writers; answers of a removed version are not reachable in the UI (API history only).

## Not verified

A second user (VIEWER read-only, revoked member) and the UNKNOWN-outcome path were not exercised in the browser (contract and unit tests only). PostgreSQL contracts ran on a task-owned fixture, not on the retained DB. No screen-reader pass. The 15 s budget and the pre-existing upload flake mean a green `pnpm check` as one command is not claimed.

## Runtime and cleanup

Web `http://localhost:3000` (my `next dev`), API `127.0.0.1:8081` (new binary, migration 8 applied; rollback: `goose down` 0008 drops only the 5 review tables, or restore the private dump). The PostgreSQL fixture container was task-owned and is removed at the end of this task.

## Next review action

A non-author reviews `source-manifest.json` (43 files) and re-runs `make check` on a fresh labelled fixture; then a rendered check with a second synthetic user.
