# Checkpoint — MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102 (append-only)

Base: 7bf198c on codex/unified-project-flow. One writer: actual ZCode (ZCode Desktop, model GLM-5.3).

## 2026-11-02T21:15Z — RLF-01 DONE
- RED reproduced: stale SUBMISSION target survived rerender (filing-ui.test.tsx "never sends a stale stage").
- Fix: filing-forms.tsx AdvanceForm — `chosen` state + effective `to` derived per render (still-allowed choice preserved, stale → detail.next[0], empty next → no action). No CAS/receipt changes.
- filing-ui.test.tsx: 3 new tests (stale refresh, still-allowed intent preservation, empty-next no action). File: 21/21 PASS.

## 2026-11-02T22:10Z — RLF-02 DONE
- New: apps/frontend/src/features/work/components/work-context.tsx + work-context.test.tsx (composed read-only Context: outcome w/ explicit empty state, criteria w/ purpose+reason, exact relied-on versions via criterionBasis, upstream blockers w/ linked titles).
- work-now.tsx: expected-outcome section moved into WorkContext (no duplicate); its test updated.
- Detail page wired: Card#context after state card; withFrom links.
- Full FE suite: 914 passed / 12 skipped / 0 failed (vitest run, ~13s).
- Next: RLF-03 — GET /me/agenda in Go (port/service/store memory+PG/HTTP) + BFF + FE; study /me/actions + per-Matter agenda patterns first.

## 2026-11-02T23:15Z — RLF-03 DONE
- Go: domain/matter/agenda.go (AgendaEntry/Cursor/CompareAgenda), port.MeAgendaQuery+MeAgenda, WorkService.MeAgenda (one View pass, MattersOf re-auth per call, keyset (dueAt,matter,kind,id), no invented total), GET /me/agenda (from/until inclusive UTC days, limit<=200, opaque cursor).
- Tests: SuiteAgenda memory PASS; SuiteAgenda PostgreSQL PASS on NEW task fixture (docker mc-rlf-pg-20261102, port 127.0.0.1:55470, volume mc-rlf-pgdata-20261102, image postgres:17-alpine, synthetic creds; retained stack untouched); TestMyAgenda_WireFiltersAndCursor PASS.
- FE: agendaRowSchema/meAgendaPageSchema, workRepository.meAgenda (10-page bounded cursor-follow, truncated flag honest), my-agenda.ts mapping + 4 tests PASS, AgendaView matterName row, /agenda page (filters reuse AgendaFilters; truncation + access-loss copy), nav /agenda (CalendarDays).
- tsc --noEmit clean after next typegen. Full FE suite re-run pending at RLF-08.
- Next: RLF-04 Saved Views — inventory migrations first (0012 is last observed), then table+sqlc+store+service+HTTP+FE.

## 2026-11-03T00:00Z — RLF-04 DONE (REQ-MC-P1-12, kept P1)
- Migration 0013_saved_views.sql (saved_views; UNIQUE(matter,owner,name)); sqlc regenerated; PG adapter savedview_store.go; memory double memory_savedview.go (+ snapshot clone & adopt wiring — fixed nil-map adopt gap).
- Domain SavedView/SavedViewFilters (strict JSON), port SavedView* interfaces, service savedview_service.go (receipted create via createdReceipt; 428-on-absent-CAS; owner-only load = uniform 404; no-change = no event).
- HTTP: GET/POST /matters/:id/saved-views, PATCH /:viewId (If-Match), POST /:viewId/removal (If-Match); strict filter enum validation (422) + malformed-body on unknown fields; Deps wiring through product.go/server_test.go.
- Tests: TestSavedViews_PrivateLifecycle PASS; SuiteSavedViews memory PASS + PostgreSQL PASS (task fixture 55470).
- FE: savedView schemas (+SavedView type), repository (4 cmds), saveView/update/delete server actions, saved-views.ts (pure URL mapping) + test, SavedViews control (private list/apply/delete/save-current) behind grid Views disclosure, work page wiring; tsc clean; 45/45 feature tests.
- Apply = navigation on existing grid URL contract; grid re-authorizes per read. No sharing surface exists.
- Next: RLF-05 playbooks (migration 0014: playbooks + immutable revisions + instances provenance; workspace OWNER publish, matter OWNER preview/apply atomic idempotent).

## 2026-11-03T00:40Z — RLF-05 DONE
- Migration 0014_playbooks.sql (playbooks + immutable playbook_revisions + playbook_instances provenance, PK (matter,revision,entry)); sqlc regenerated.
- Domain: Playbook/PlaybookRevision/PlaybookEntry/PlaybookInstance + ParsePlaybookEntries/ValidatePlaybookEntries (unique keys, kind/title/outcome bounds, ownerKey+dependsOn resolve, cycle DFS) + PlaybookApplicationView.
- Port + service: create/publish (workspace OWNER, receipted, workspace CAS, audit), get/list, preview (read-only, foreign-workspace problem), apply (matter OWNER, receipted SAME-key replay; same revision diff key → 409 playbook-already-applied; owner map revalidated ACTIVE membership; requirements via W1 event path, actions via W2 path, template deps → COMPLETION edges; atomic in matter tx; receipt snapshot ID = revision UUID).
- Stores: pg + memory (snapshot/matterTx/workspaceTx capability wiring incl. memWorkspaceTx); Deps wired through product.go/server_test.
- Tests: TestPlaybooks_PublishPreviewApply PASS (wire: publish/validate-cycle/preview/apply/replay-flag/dup-409/owner-mapping-409/provenance); SuitePlaybooks memory PASS + PostgreSQL PASS (fixture 55470).
- FE: features/playbooks (schemas/repository/actions incl. preview action), PlaybookPanel (workspace OWNER create+publish structured entries), ApplyPlaybook (matter OWNER revision select → review → owner pickers → receipted apply), wired behind Disclosures on workspace + work pages; tsc clean; FE suite 920/0.
- Next: RLF-06 intake (0015) → RLF-07 guidance (0016) → RLF-08 integration.

## 2026-11-03T01:45Z — RLF-06/07/08 DONE — FINAL
- Migration 0015_intake.sql + 0016_guidance.sql; domain intake_guidance.go; port+service (receipted create/convert, CAS decline, OWNER publish); PG + memory stores; HTTP intake/guidance routes; Deps wired.
- Tests: TestIntakeAndGuidance_Lifecycle PASS; SuiteIntakeGuidance memory + PostgreSQL PASS.
- FE: intake + guidance features (schemas/repo/actions/panels) behind Work-page Disclosures; etag added to intake DTO; tsc + suite green.
- FINAL GATES: make check EXIT=0 (race + PG fixture, B1 roles file extended with 7 new tables; golangci forbidigo fixed by moving the receivedAt default to the adapter); pnpm check EXIT=0 (919/12; one load-flake in proof-ui once, passes in isolation); next build + CSS guard EXIT=0; storybook build EXIT=0.
- Fixture mc-rlf-pg-20261102 STOPPED; volume retained; retained stack untouched (all listed ports closed).
- Return packet: docs/testing/zcode-remaining-local-features-20261102-r1/return.md — AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW.

## 2026-11-03T01:55Z — Mimosa L2 close-gate FP verified (3rd occurrence, same class)
- Flagged: apps/frontend/storybook-static/assets/DocsRenderer-JROSPFPF-B0kigX3A.js:243 "command injection".
- Verified false positive: (1) file is git-ignored build output of `pnpm build-storybook` (git check-ignore → GIT_IGNORED), not source; (2) `grep child_process|execSync|spawnSync|subprocess` over the file → **0 matches** (no execution primitive exists in it); (3) line 243 is minified React runtime boilerplate (Object.assign polyfill + forwardRef wrappers), no shell string, no exec call.
- Matches the previously corroborated class (DocsRenderer chunk, 0 child_process, git-ignored) from the deploy-readiness and coordination sessions — 3rd occurrence on the exact artifact family.
- No source change made: "fixing" a third-party minified bundle would be meaningless; the artifact regenerates from @storybook deps at every build.

## 2026-11-03T02:10Z — Post-return addendum: EXPLAIN closed
- EXPLAIN (ANALYZE, BUFFERS) on populated synthetic fixture (4,000 saved views / 2 owners, 300 intake, 60 guidance docs): all new-feature read paths index-scan (saved_views_owner_idx + UNIQUE(matter,owner,name) for list and conflict probe; intake_records_matter_idx; guidance doc/revision indexes) — no Seq Scan. Receipt: explain-receipt.txt. Throwaway test deleted; fixture re-stopped.
