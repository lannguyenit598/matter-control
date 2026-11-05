# MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102 — return

Task: `MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102`. Status: **AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW** (source/test scope complete; browser/IdP/human checks NOT_RUN — see §7).
Author: actual ZCode (ZCode Desktop session; model `account:zai-start-plan/GLM-5.3`). One writer: no other session wrote the touched paths; untracked intake files of the Codex audit were preserved untouched.

## 1. Identity and base

- Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`.
- Base `7bf198c103476f490ebbdf58b1bd563d0bba8a61` (verified at intake; = prepared source HEAD).
- Head: uncommitted working tree on the same branch (no commit/push authorized). Changed-path manifest: `docs/testing/zcode-remaining-local-features-20261102-r1/manifest.txt` (generated `git status --porcelain` + diff stat, UTC).
- D-BF1 unchanged: APPROVAL still does not require an OUTCOME criterion; NOT_DECLARED/PENDING/ACCEPTED stays independent.

## 2. RLF matrix

| RLF | Delivered | Tests actually run |
|---|---|---|
| 01 Filing stale transition | `filing-forms.tsx` AdvanceForm: effective target derived per render (still-allowed choice preserved with draft; stale → permitted fallback; empty → no action); 3 regression tests incl. the decisive rerender | `filing-ui.test.tsx` 21/21 PASS (RED first: stale target survived rerender) |
| 02 Core + context composition | New read-only `WorkContext` (outcome w/ explicit empty state, criteria w/ purpose+server reason, exact relied-on versions, linked upstream blockers); outcome section moved out of WorkNow (no duplicate); page computes proof data at the app layer (R-FEAT-2 respected) | `work-context.test.tsx` 4 PASS; `work-now.test.tsx` updated; FE suite 919/0 |
| 03 My Agenda | Go: `domain/matter/agenda.go`, port+service `MeAgenda` (one snapshot pass, per-call authorization, keyset (dueAt,matter,kind,id), no invented total), `GET /me/agenda` (inclusive UTC from/until, limit ≤200, opaque cursor). FE: repository cursor-follow (10×200 bound, honest `truncated`), `my-agenda.ts` mapping, `/agenda` page reusing AgendaView (+matter name), nav entry | `TestMyAgenda_WireFiltersAndCursor` PASS; `SuiteAgenda` memory + PostgreSQL PASS; `my-agenda.test.ts` 4 PASS |
| 04 Saved Views (REQ-MC-P1-12, kept P1) | Migration `0013_saved_views.sql`; strict filter shape (enum-validated, no free content); receipted create, CAS update/delete, owner-only (uniform 404); FE: private Views control behind the grid filters, apply = navigation on the existing grid URL (re-authorizes per read) | `TestSavedViews_PrivateLifecycle` PASS; `SuiteSavedViews` memory + PostgreSQL PASS; `saved-views.test.ts` PASS |
| 05 Playbooks | Migration `0014`; immutable revisions (`ParsePlaybookEntries` strict + cycle DFS); workspace-OWNER publish (receipted, workspace CAS, audit); matter-OWNER preview (read-only, foreign-workspace problem) + apply (receipted SAME-key replay; same revision new key → 409 `playbook-already-applied`; explicit owner map revalidated against ACTIVE membership; requirements via W1 event path, actions via W2, template deps → COMPLETION edges; atomic in one matter tx; receipt snapshot ID = revision UUID; provenance rows `playbook_instances`) | `TestPlaybooks_PublishPreviewApply` PASS; `SuitePlaybooks` memory + PostgreSQL PASS |
| 06 Intake | Migration `0015`; PENDING/CONVERTED/DECLINED; record (receipted, attachments = validated matter version references only), decline (CAS + accountable triager), convert (receipted, atomic with the record flip, replay-stable, owner revalidated; refusal paths leave nothing); provenance text kept | `TestIntakeAndGuidance_Lifecycle` PASS; `SuiteIntakeGuidance` memory + PostgreSQL PASS; FE IntakePanel |
| 07 Guidance | Migration `0016`; drafts append (OWNER/EDITOR), publish one exact revision immutable (matter OWNER, receipted, once); source refs = validated exact-version or free reference, no anchors invented; publishing changes no legal state; drafts hidden by read precedence at FE | Same suites PASS; FE GuidancePanel |
| 08 Integration | `make check` **EXIT=0** with task PG fixture (gofmt, vet, golangci-lint, sqlc-check, `go mod tidy -diff`, `test -race`, 14 packages ok; B1 least-privilege file updated with all 7 new tables); `pnpm check` **EXIT=0** (typegen, tsc, eslint, prettier, 919 unit tests, agents:check); `next build` + compiled-CSS guard **EXIT=0**; `build-storybook` **EXIT=0**; brief-replay verified to ignore the new event kinds (no re-interpretation as legal item state) | receipts below |

## 3. Eigenwelt 16-row disposition (honest)

1–10 P0 core rows (work graph, proof, filings, control room, data ops, brief, reviews, discovery, focus/search, manual matrix): implemented before this task, regression-protected here (suite 919/0; make check incl. race+PG). Acceptance still lacks browser/IdP/human passes — NOT_RUN, not claimed.
11 Cross-Matter My Agenda: **delimited implementation delivered** (RLF-03) — bounded read, honest truncation; no calendar sync/deadline computation.
12 Consolidated work context: **delivered** (RLF-02), read-only.
13 Versioned playbooks: **delimited implementation delivered** (RLF-05) under the approved policy; no scripting/execution surface.
14 Human-triaged intake: **delimited implementation delivered** (RLF-06); no inbox/external channel/email.
15 Matter guidance: **delimited implementation delivered** (RLF-07); no firm library/cross-Matter sharing.
16 Private Saved Views: **delimited implementation delivered** (RLF-04); REQ-MC-P1-12 stays P1 — not retroactively a P0 release criterion.

Still missing / dependency-gated (unchanged, and NOT delivered by this task): other P1 legal-domain depth (authorities/propositions/questions, entity master/temporal relations, advanced filings/signatures/POA), management export, immutable report snapshots, external connectors, Office add-ins, DOCX tracked changes, reminder/email delivery, LegalMemory/MCP, AI extraction/assistant, voice/remote/model fusion, cloud deployment, production IdP/identity hardening, human AC-137/AC-FOCUS-18 trials. No placeholder adapters were created for any of these.

## 4. Contracts documented while implementing (deviations from nothing — new, minimal, review-ready)

- `/me/agenda`: actor-only read; from/until inclusive UTC days on recorded dueAt (until exclusive at instant level); rows = dated work items (execution+derived timing) and milestones (readiness, never timing); undated rows never appear; no total; cursor carries ids only.
- Saved views: per (matter, owner) private; validated filter shape equals the grid query minus paging; create receipted; update/delete CAS with 428-on-absent.
- Playbooks: entries validated strictly (unique keys 1..100, kind/title/outcome bounds, ownerKey/dependsOn resolve, acyclic); publish appends; apply is receipted+atomic with an explicit owner map; same revision twice → 409.
- Intake: receivedAt required and not in the future (command instant as the reference; the BFF/handler supplies the observation instant when absent); decline needs a reason; conversion one record → one item, once.
- Guidance: draft append + OWNER publish; source refs ≤20, each a matter version id or a free reference.

## 5. Commands/UTC/exits (retained receipts)

- `make check` (MC_TEST_DATABASE_URL=postgres://…@127.0.0.1:55470/mc_rlf_test) → **EXIT=0**; log `/tmp/mc_make_check.log`; 14 packages `ok`, race enabled, PG suites green (B1 drift fixed by adding the 7 new tables to `ops/adr006/db/b1-roles.sql`).
- `pnpm check` → **EXIT=0** (919 passed / 12 skipped; one 5s-timeout flake in `proof-ui.test.tsx` seen once under parallel load, passes in isolation in 0.65s — retained here honestly, not weakened).
- `pnpm build` (next build + `scripts/check-built-css.mjs`) → **EXIT=0** ("Compiled CSS verified: 1 assets…"). `pnpm build-storybook` → **EXIT=0**.
- Fixture: docker `mc-rlf-pg-20261102` (postgres:17-alpine, 127.0.0.1:55470, volume `mc-rlf-pgdata-20261102`, synthetic creds, fresh schema per test) — **stopped** at close; volume retained for the reviewer. Docker Desktop was started for this fixture; the retained MatterControl stack was never started: ports 3000/3109/8081/18084/18094/8080/55440/55441/55462 all closed at close (verified).
- `pnpm exec next typegen` run for TypedRoutes after new routes; `.prettierignore` extended with `.mimosa/` (git-ignored hook artifact, corroborated FP class).

## 6. Resources

- Stopped: `mc-rlf-pg-20261102` (my fixture). Retained: volume `mc-rlf-pgdata-20261102` (synthetic data only), no existing volume mutated, retained stack untouched.
- No commits, push, merge, deploy, cloud/provider/paid actions, IdP administration, or secrets in evidence. Synthetic data only.

## 7. NOT_RUN / remaining risks

- **NOT_RUN**: connected browser flows (GW-01/02/03 through the product UI), real ZITADEL end-user login/audience verification, screen-reader announcements, human AC-137/AC-FOCUS-18, 320/390px visual passes, Focus/Search author verification against live races (stack intentionally paused per §12). These remain exact open items; none is inferred from source checks.
- **Risks**: (1) my authorship is unverified by an independent reviewer; (2) the two new FE panels and three new pages render but were not browser-verified; (3) the proof-ui timeout flake (once, load-related) may recur; (4) playbook apply creates requirements via the W1 event path inside the work transaction — covered by both suites, but a reviewer should confirm the brief-replay event-catalogue reasoning in §2.08; (5) intake/guidance/playbook/pg DDL shipped as new migrations 0013–0016 — applied only to the synthetic fixture, never to a retained DB.
- **EXPLAIN closed after the return** (post-return addendum): EXPLAIN (ANALYZE, BUFFERS) on a populated synthetic fixture (4,000 saved views over 2 owners, 300 intake rows, 60 guidance docs + revisions) confirms every new-feature read path uses an index — `saved_views_owner_idx` / the UNIQUE (matter, owner, name) key for both the list and the name-conflict probe (0.11–0.51 ms), `intake_records_matter_idx` for the intake list, and `guidance_documents_matter_idx` / the (document_id, no) index for guidance reads; **no Seq Scan on any new-feature access path**. Receipt: `docs/testing/zcode-remaining-local-features-20261102-r1/explain-receipt.txt`; the throwaway EXPLAIN test was deleted after the run (tree re-verified).
- Next independent QA action: re-pin to the resulting tree, run PORT/TTL-class reruns plus a connected browser pass over Filing → My Agenda → Saved Views → Playbooks → Intake → Guidance with two synthetic actors.
