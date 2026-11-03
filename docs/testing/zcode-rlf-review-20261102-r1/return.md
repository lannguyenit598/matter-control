# MC-ZCODE-RLF-REVIEW-20261102 — return

Reviewer: actual ZCode (ZCode Desktop, model `account:zai-start-plan/GLM-5.3`), dispatch `docs/implementation/handoffs/MC-ZCODE-RLF-REVIEW-20261102-PROMPT.md`. Review-only; nothing implemented or fixed by this review.
**Role disclosure (read first):** this session shares conversation context with the implementing session — the prompt's "fresh non-author session" condition is not met in the strict sense. The review was conducted against pinned bytes with contract-derived criteria, but the PO should treat this as an author-adjacent review and may still route a fully independent second reviewer; this return neither preempts nor substitutes one.

## 0. Baseline, pinning, drift

- Branch `codex/unified-project-flow`, HEAD `7bf198c103476f490ebbdf58b1bd563d0bba8a61`, dirty tree 89 paths at start and end.
- 66 implementation files sha256-pinned at review start (`drift-manifest.txt`); re-verified at end: **DRIFT_NONE** — every finding below cites bytes that did not move.
- Author receipts (return/checkpoints/exits) treated as claims; independently re-verified where §6 allows. Author's files untouched; no commits/push; no retained stack started (ports 3000/3109/8081/18084/18094/8080/55440/55441/55462/55470/55471 all LISTEN-free; author fixture already stopped).

## 1. Findings

### RLF-REV-04-02 — P1 (security/least-privilege; ships broken command)
`DeleteSavedView` compiles to `DELETE FROM saved_views …` (`apps/backend/internal/adapter/outbound/postgres/mcsqlc/saved_views.sql.go:14`), but the B1 least-privilege profile grants DELETE on exactly four tables (`b1-roles.sql:78-84`; Go class map `b1_least_privilege_test.go:293-296` — `saved_views` is default class SELECT,INSERT,UPDATE). The B1 "empirical" runtime-denial probe is a **fixed list** (`b1_least_privilege_test.go:421-448`: create/drop/alter/truncate/history-update/receipt-delete/trigger/role-escalation) and does not execute product queries, so `make check` stays green while the shipped FE delete button (work grid → Views) fails under the production `mc_runtime` role. Violates contract §11 ("Check runtime/migrator permissions for new tables without broad grants") and §5 RLF-04 (CRUD via existing command patterns). **Remedy (implementer's choice):** grant DELETE on `saved_views` in both the Go profile and `ops/adr006/db/b1-roles.sql` (and extend the empirical probes to the new query classes), or replace hard delete with a CAS status write.

### RLF-REV-04-01 — P2 (error mapping; 500 on a client mistake)
A duplicate saved-view name for the same (matter, owner) hits `UNIQUE(matter_id,owner_id,name)` (0013). `mapMatterError` maps only `command_receipts_pkey` (`matter_store.go:320-324`); everything else flows through `mapError` (`pool.go:113-126`), which has no 23505 mapping → the command surfaces as **500 `urn:mc:internal`**. No test covers duplicate names (memory double returns a generic error too). Violates contract §3 error precedence (client mistakes are 4xx). **Remedy:** typed pre-check or constraint mapping → 409 `duplicate-saved-view`.

### RLF-REV-05-01 — P2 (same class, playbooks)
`CreatePlaybook` with a duplicate (workspace, name) hits `UNIQUE(workspace_id,name)` (0014) → same unmapped 23505 → 500. No test covers it. **Remedy:** as above (`duplicate-playbook-name` 409).

### RLF-REV-06-01 — P2 (error precedence; fail-misleading)
`GetIntake` reads through `mustList` (`intake_guidance_service.go:92-98`) which **swallows store errors** and returns nil → a 503-class store failure is answered as the uniform **404**, contradicting the contract's error precedence (unavailable ≠ nonexistent; §3). **Remedy:** propagate the error; fail closed as `unavailable`.

### RLF-REV-07-01 — P2 (store parity)
Guidance duplicate titles: the memory double rejects them (`memory_intake_guidance.go:123` "memory: guidance title already used") while PostgreSQL (0016) has no `UNIQUE(matter_id, title)` on `guidance_documents` — the same command succeeds on one store and fails on the other. Contract §5 RLF-05/§11 explicitly demand memory+PostgreSQL parity. **Remedy:** add the constraint (preferred) or drop the memory rule and document duplicates as legal — one decision, both stores.

### RLF-REV-02-01 — P3 (honest-disclosure edge)
`work/[itemId]/page.tsx:163` passes `criteria=[]` when the proof read failed (`!proof.ok`), so the read-only Context section renders "No proof criteria are declared. Nothing is counted as verified until one is." — asserting absence when the proof read is merely unavailable (the Proof card separately shows ReadFailure). **Remedy:** pass `null` on failure and render an explicit "criteria unavailable" line.

### RLF-REV-A11Y-01 — P2 (vi-parity P0 + accessible names)
Unlocalized submit labels violate the product's EN-canonical/vi-parity P0: `saved-views.tsx:65` `submitLabel="Delete"` and `guidance-panel.tsx:151` ``submitLabel={`Publish v${r.no}`}``. The Delete case additionally renders identical accessible names on every row (WCAG 2.4.6/2.4.9 concern for list rows). **Remedy:** LocalizedText labels + per-row aria-label naming the view.

No other finding survived verification. Explicitly checked and NOT found: FE per-Matter fan-out for My Agenda (single aggregate read, repository cursor-follow bounded 10×200); cursor content leakage (ids only, `agenda.go:14-22`); cross-workspace playbook application (enforced twice: preview problem + apply `pb.WorkspaceID != env.header.WorkspaceID` → uniform 404); apply atomicity (single matter tx, matter-row lock serializes concurrent applies; duplicate-revision check before inserts; receipt replay on same key); intake conversion double-fire (status re-check inside the locked tx); published guidance mutation (publish `WHERE status='DRAFT'` guard, once-only); brief-replay reinterpretation of new event kinds (`brief_replay.go:121-136` switch — unknown kinds fall through with no item mutation); edits to applied migrations or hand-edited generated SQL (manifest shows only new files 0013–0016; mcsqlc regenerated); D-BF1 regression (`filing_service.go`/`filing.go` absent from the diff — the APPROVAL-without-OUTCOME guard was not touched).

## 2. Per-slice verdicts (§5 matrix)

| Slice | Verdict | Basis |
|---|---|---|
| RLF-01 Filing stale transition | **SOURCE_PASS** | Decisive rerender test present (`filing-ui.test.tsx` new tests; staged-A → select → rerender B asserts fallback target, new ETag, no stale submission); fix at `filing-forms.tsx:302-310` derives the effective target per render; empty-next renders no action; still-allowed intent preserved. D-BF1 unchanged (guard files not in diff). |
| RLF-02 Core composition | **SOURCE_PASS_WITH_LIMITATIONS** | No W1–W7 rewrites (work feature only adds new files); composition read-only, computed at page layer from already-authorized reads; no attachment duplication; axes untouched; limitation = RLF-REV-02-01 (P3) + browser render NOT_RUN. |
| RLF-03 My Agenda | **SOURCE_PASS** | Server-side aggregate with per-snapshot authorization (`work_service.go` MeAgenda over `MattersOf`); keyset cursor ids-only; inclusive UTC date bounds; per-page re-auth (revocation test in both stores); FE bounded follow + honest truncation/alerts; no deadline/reminder language. |
| RLF-04 Saved Views | **SOURCE_CHANGES_REQUIRED** | Privacy/shape/CAS/receipt verified; but RLF-REV-04-02 (P1) + RLF-REV-04-01 (P2) must be fixed before this surface can be called runtime-correct on the least-privilege profile. |
| RLF-05 Playbooks | **SOURCE_PASS_WITH_LIMITATIONS** | Immutable revisions (append-only, publish-once guard), strict entry validation incl. cycle DFS, atomic receipted apply with owner re-validation and duplicate-revision refusal — verified in both stores' suites; limitation = RLF-REV-05-01 (P2) + concurrent/replayed-apply proven only through suite coverage, no live run. |
| RLF-06 Intake | **SOURCE_PASS_WITH_LIMITATIONS** | Minimal states; requester is free text ≠ membership; conversion receipted/atomic with status re-check inside the lock; decline CAS + accountable triager; limitation = RLF-REV-06-01 (P2). |
| RLF-07 Guidance | **SOURCE_PASS_WITH_LIMITATIONS** | Draft-append/publish-once, matter-scoped, no legal-state coupling; limitations = RLF-REV-07-01 (P2 parity) + RLF-REV-A11Y-01 (P2 label). |
| RLF-08 Integration | **SOURCE_PASS_WITH_LIMITATIONS** | Migration-number discipline clean (0013–0016 only; no edits to applied files/generated SQL); grants updated for 6/7 tables (gap = the P1); brief replay safe; DTO/CAS/receipt conventions reused; gates re-run independently (below). |

## 3. Independent re-verification (§6) — my own results, not the author's

- **Reviewer-owned fixture** `mc-rlf-review-pg-20261103` (postgres:17-alpine, 127.0.0.1:55471, own volume, synthetic creds) — created, used, **stopped**; retained stack and author fixture untouched.
- `make check` with that DSN → **EXIT=0** (14 packages `ok`, `-race`, memory+PG suites). This proves the author's claimed gates reproduce — and, per the findings, that the suites do NOT cover the P1/P2 gaps above (CI-green/production-red class).
- `pnpm check` → **EXIT=0** (typegen, tsc, eslint, prettier, vitest **919 passed / 12 skipped**).
- Targeted vitest over the four changed-area test files → PASS (686 ms).
- Author receipts audited: internally consistent (checkpoint UTC log, exit claims match my re-runs); one observation (P3, no remedy demanded): full command transcripts live in `/tmp` and were not retained in the author namespace — future returns should keep `commands.log` in-namespace.

## 4. Skills (§4) — what was loaded and what it contributed

- `accessibility` — contributed the WCAG 2.2 criteria behind RLF-REV-A11Y-01 (accessible names, labels) and the keyboard-native `<details>` check (no violations beyond the labels finding).
- `vercel-react-best-practices` — contributed the React/Next pass: no waterfalls introduced (Promise.all preserved in the work page), server actions authenticate via `requireSession` (server-auth-actions ✓), no module-level request state; no re-architecture findings.
- `postgresql` — contributed the grants/index/constraint methodology behind RLF-REV-04-02/01 and the parity check RLF-REV-07-01.
- Not loaded, with reasons: `supabase-postgres-best-practices` (conditional per §4; no Supabase/pooler-specific code in the diff) and the eleven named skills unavailable in this environment (`review`, `plan-eng-review`, `go-skills-router`, `go-code-review`, `go-database`, `api-designer`, `api-security-auth-pattern`, `cso`, `vitest-skill`, `test-coverage`, `root-cause-tracing`) — their surfaces were covered manually against the contract text; nothing was invented or renamed.

## 5. Verdict

**Overall: REVIEW_RETURNED_CHANGES_REQUIRED.**

Required before any DONE language anywhere: RLF-REV-04-02 (P1), RLF-REV-04-01, RLF-REV-05-01, RLF-REV-06-01, RLF-REV-07-01, RLF-REV-A11Y-01 (all P2). RLF-REV-02-01 (P3) may ride along or be deferred by the PO.

**Explicitly left NOT_RUN (with reasons):** connected GW-01/02/03 browser path, real ZITADEL end-user login/audience verification, screen-reader announcements, human AC-137/AC-FOCUS-18, 320/390px visual passes — the retained stack is paused by PO decision (§9) and no browser/human participants were authorized; nothing was faked with a browser skill, and the author's receipts for these were checked only for existence/internal consistency, not re-executed. **D-BF1 remains unchanged** (verified in the diff: filing guard files untouched).

**Remaining risks:** (1) author-adjacent reviewer (role disclosure above) — a fully independent second reviewer is still possible and not preempted; (2) my P1 rests on static analysis of the B1 class map and probe list, not on a live `SET ROLE mc_runtime` execution of `DeleteSavedView` (that would require a fixture run the review scope allowed but I did not need — the static evidence is decisive); (3) the suites' coverage of concurrent playbook applies is suite-level, not a race-test under load.

**Exact next action:** return the six findings to the implementing session (`MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102`) as a rework list (fix code + tests, no scope change), then re-review the delta; after that, the PO routes final acceptance (and may add a second independent reviewer per §1).
