# MC-EIGENWELT-FEATURES-CONTINUATION — feature-by-feature return (author verification)

Agent: actual Claude Code (`claude-sonnet-5-5`). HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` (dirty tree); nothing committed or deployed; no external call. Proposed status: **IN_REVIEW_WITH_VERIFICATION_BLOCKERS**. Local URL `http://localhost:3000` (my `next dev`), API `http://127.0.0.1:8081` (my rebuilt binary, see `../claude-backend-handoff-integration-20261029-r1/runtime-handoff.md`).

**Concurrency:** the user told me Codex is editing the new UI; I did not edit shell, `globals.css`, `my-actions-view.tsx` or other Codex-touched files, and I wrote no backend file. Codex adapted two of my new tests to its device-time-zone change while I worked; I only removed one duplicate line I had introduced.

## Result per assessment row

| # | Row | Status | Detail |
|---|---|---|---|
| 1 | Focused workbench + visual fidelity | **Owned by Codex now** (visual pass in progress); my earlier My Work/Matter overview is the base | Measured differences vs `localhost:4176` handed over in `../claude-backend-handoff-integration-20261029-r1/visual-delta.md`. Not complete: no 1100/800/390/320 comparison of the new shell by me. |
| 2 | Task context / attachments | Reuse, partial, **not extended** | Outcome, proof criteria, evidence and versions already on the work item page; the new Evidence basis (row 3) adds the exact-version view. No consolidated attachment workbench. |
| 3 | Evidence / version drawer (A.2, A.3) | **Implemented + tested + browser-observed (criterion level)** | New `features/proof/evidence-basis.ts`, `components/evidence-basis.tsx`, wired in the work item page; deep link `?criterion=<id>` keeps `from`, so Back returns to the My Work selection. Shows criterion + version rule, each offered evidence with exact document/version/SHA-256 prefix/current-or-superseded, submitter, verifier decision (verdict, reviewer, rationale, assessed version), and derived staleness flags (withdrawn, superseded, accepted before reopening, past validity, revoked, challenged), as-of. Required proofs, offered evidence and verification stay separate. No page/quotation anchor is shown (the contract has none) and the panel says so. Data comes from the proof reads the page already makes: no new fan-out. 7 tests (view model flags, links, unknown id, empty, no anchors). Real runtime: a Requirement + criterion created through the product; list, deep link, empty-evidence state, stale id and Back origin observed. **Not observed:** a real exact-version claim and verifier decision (needs a document upload and a second user B); those parts are fixture-tested only. |
| 4 | Agenda / calendar view (A.4) | **Implemented + tested + browser-observed** | Route `/matters/[matterId]/agenda`, tab "Agenda" (VI "Lịch"). Read-only, per Matter, from the existing work list (server due-date order, one page of ≤200) and the milestones page. Merged by instant, grouped by day in the device zone, source link per row with `from`, filters (source, timing) in the URL, honest banners: first page only/"more exist", timing filter hides milestones (no derived timing), no deadline calculation, no reminders. Items without a due date are not invented. 11 tests (parse, merge/order, filters, day boundary across zones, links, empty). Real runtime: due date of a real Action shown; 1280/390/320 no overflow; console clean. **Limits:** per Matter only (no cross-Matter agenda); milestones read is one page (the API read has no cursor parameter in the repository). |
| 5 | Golden Workflow regression (A.5) | **Not started** | Existing memory/PG W1–W7 contracts and my author journeys (complete → readback → return; blocked → cause → return) are the only coverage; no new connected journey suite was added. |
| 6 | Manual document review matrix (B) | **BLOCKED: backend ownership receipt** | New tables/service/API needed; contract proposal in `backend-handoff-requests.md` §B. |
| 7 | Versioned playbooks (C) | **BLOCKED: backend ownership receipt + decision D5** | `backend-handoff-requests.md` §C. |
| 8 | Intake (D) | **BLOCKED: decision D2 + ownership** | `decisions-needed.md` D2. |
| 9 | Scoped knowledge (D) | **BLOCKED: decision D3** | Matter-scoped first is recommended. |
| 10 | Saved views / snapshots (D) | **BLOCKED: persistence (backend) + decision D4** | Saved filters first; snapshots gated on retention policy. |
| 11 | Redlines / Office add-in | **Deferred** (dependency: editor/Office, license, fidelity) | Versions and promotion are the foundation only. |
| 12 | Storage connector | **BLOCKED_DEPENDENCY** (provider, credentials, ACL mapping, external-call scope) | fs/R2 adapters are not a connector. |
| 13 | LegalMemory / grounded search / MCP | **BLOCKED_DEPENDENCY** (license/deployment review, provider) | No mock success. |
| 14 | AI extraction/assistant/contradiction (P2-04/05/06) | **BLOCKED_DEPENDENCY** (provider/model, data destination, retention, cost, eval set) | Unchanged P2. |
| 15 | Reminders | **Decision-required** (channel, recipients, schedule, retry, opt-in) | The agenda is not delivery. |
| 16 | Voice, remote workers, fusion | **Intentionally deferred** | As the assessment recommends. |

## Checks (receipts in `receipts/`)

`pnpm check` (typecheck, lint, format, **72 files / 656 tests**, agent config) and `pnpm build` with the compiled-CSS guard passed on the combined tree, which includes Codex's concurrent UI edits. `pnpm build:webpack`, Storybook and product e2e were **not run** in this pass. No backend test was needed or run for these frontend-only features.

## Permissions and persistence

Both shipped features are read-only views over existing authorized reads (`GET work-items`, `milestones`, proof checklist, documents); they add no write path, no table and no cache, so there is no new ACL surface and nothing to purge on access loss beyond what the existing pages already do.

## Not claimed

No independent review, QA, legal/security/compliance acceptance, P0 or MC-002 closure, or release. Additions here are product-scope additions, not release acceptance.

## Next exact action

Provide the backend ownership receipt (Codex or human) and answer D1/D2/D5; then implement §B first (review matrix) from `backend-handoff-requests.md`. Meanwhile I can add the A.5 journey suite and a cross-Matter agenda (needs an existing read model decision).
