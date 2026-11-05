# MC-ZCODE-RLF-REVIEW-20261102 — rework addendum (2026-11-03)

PO instruction "fix các finding vừa tìm được" routed the rework back to the implementing session. This addendum records what changed per finding; the review verdict `REVIEW_RETURNED_CHANGES_REQUIRED` stands as the historical review result, and the rework deltas below have had author-level verification only (gates re-run) — a delta re-review is still the next independent step.

## Fixes per finding

- **RLF-REV-04-02 (P1)** — `saved_views` moved into the B1 deletable class: both Go class maps in `b1_least_privilege_test.go` (b1RuntimeGrants + "every table has its grant class") now carry `"saved_views": true` with the RLF-04 rationale comment; `ops/adr006/db/b1-roles.sql` line upgraded to `GRANT SELECT, INSERT, UPDATE, DELETE ON mcapp.saved_views TO mc_runtime;`. Added a **positive empirical probe** to the runtime-denial section: as `mc_runtime`, insert a probe user + probe view and `DELETE FROM mcapp.saved_views WHERE name='probe view'` must SUCCEED (previously only denial probes existed, which is why the gap passed CI).
- **RLF-REV-04-01 (P2)** — `refuseDuplicateViewName` typed pre-check inside the matter-locked tx for both Create and Update (update excludes its own id) → 409 `urn:mc:rejected` ("duplicate-saved-view"); wire tests added: duplicate create 409, rename-into-existing-name 409.
- **RLF-REV-05-01 (P2)** — `CreatePlaybook` pre-checks the workspace-locked playbooks list → 409 "duplicate-playbook-name"; `WorkspacePlaybookTx` gained `ListPlaybooks` (pg + memory workspace txs implemented); contract test added (memory suite; runs on PG via SuitePlaybooks).
- **RLF-REV-06-01 (P2)** — `GetIntake` no longer swallows store errors: `mustList` removed; snapshot read errors propagate (503 class), genuine absence returns the uniform 404.
- **RLF-REV-07-01 (P2)** — parity restored by adding `UNIQUE (matter_id, title)` to `guidance_documents` (migration 0016 amended in place — uncommitted, never applied to any retained DB, only throwaway fixtures) AND a typed pre-check `refuseDuplicateGuidanceTitle` → 409 "duplicate-guidance-title" on both stores; contract test added.
- **RLF-REV-A11Y-01 (P2)** — `IntentForm` gained an optional additive `submitAriaLabel` prop; SavedViews delete button now `submitLabel={<LocalizedText en="Delete" vi="Xóa" />}` + per-row `submitAriaLabel` ("Delete view <name>" / "Xóa chế độ xem <name>"); the save button label localized ("Lưu bộ lọc hiện tại"); GuidancePanel publish label localized (`Công bố vN`).
- **RLF-REV-02-01 (P3)** — `WorkContext.criteria` is now `ContextCriterion[] | null`: null (proof read failed) renders "The proof criteria could not be read right now…" instead of asserting absence; page passes null on `!proof.ok`; new test asserts the unavailable line and the absence of the false claim.

## Gates after rework (author-level, on the reviewer fixture)

- `make check` (MC_TEST_DATABASE_URL → mc-rlf-review-pg-20261103 @55471) → **EXIT=0**, 14 packages ok (`-race`), including the new B1 positive probe and both new contract refusals on memory + PostgreSQL. Log `/tmp/mc_rework_make_check.log`.
- `pnpm check` → **EXIT=0** (typegen, tsc, eslint, prettier, vitest **920 passed / 12 skipped** — +1 for the null-criteria test). Log `/tmp/mc_rework_pnpm_check2.log`.
- Fixture **stopped** after the run; retained stack untouched; no commits made.

## Not covered by this rework

- The review's NOT_RUN set is unchanged (browser GW-01/02/03, real IdP login, screen-reader, human ACs, 320/390px) — still requires the paused retained stack / human participants.
- The review's remaining-risk items (author-adjacent reviewer; suite-level concurrency coverage) are unaffected by code fixes.
