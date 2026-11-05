# MC-QUICK-SEARCH-BRD-20261101 — Product-data Quick Search requirements

- Task ID: MC-QUICK-SEARCH-BRD-20261101
- Status: IN_REVIEW
- Requirement references: proposed MC-QS-BRD-001 / QS-BR-001..007; dependencies FR-001/003/004/010/011/015/018, AC-135, NFR-001/002/007/008/010/012/013
- Agent owner: actual Codex business-analyst subagent
- Priority: P1 usability proposal
- Scope: source-grounded, implementation-ready BRD for extending Quick Search beyond static pages
- Allowed paths: `docs/requirements/quick-search-brd.md` and this task record only
- Out of scope / prohibited: source implementation, executable/browser verification by the BA owner, provider calls, new roles, full-text/OCR/AI search, approval claims, commit/push/deploy. A parent-session browser-control attempt was unavailable and supplies no product evidence.
- Dependencies: current CommandPalette; Matter discovery BF-08; approved Permission Matrix and canonical requirements baseline
- Repository / base: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, `codex/unified-project-flow` at `978d8fc694a47e9beee528076bcf1af9473997e3`
- Inputs: CommandPalette source; Matter discovery service/port/handler/repository; Work Item/Document domain/read contracts; PRD/SRS/acceptance criteria/Permission Matrix; workflow/status/protocol
- Outputs: `docs/requirements/quick-search-brd.md`; this task record
- Acceptance: current gap evidenced; scope/non-goals explicit; entity/authorization/state/API proposal specified; testable AC/QA matrix; engineer dependencies and residual decisions recorded
- Tests: documentation/source trace only; product tests NOT_RUN because product source did not change
- Reviewer: Local Codex parent for requirements intake; Human PO for scope acceptance; API-contract review during normal implementation/candidate intake; OpenCode for independent candidate QA
- Required approval: PO accepts or revises MC-QS-BRD-001 before it becomes canonical implementation scope
- Blocker / next action: parent reviews trace/scope; PO accepts five result groups, Vietnamese folding, and no persistent query telemetry; engineering then builds one candidate
- Created / updated: 2026-11-01, Asia/Ho_Chi_Minh
- Status history: 2026-11-01 BACKLOG → IN_REVIEW, author-complete proposal pending intake and approval

## Acceptance evidence

| Criterion | Result | Evidence |
|---|---|---|
| Current behavior and server gap evidenced | PASS | BRD §§1, 6 |
| Scope and non-goals bounded | PASS | BRD §3 |
| Authorization/no-leakage behavior testable | PASS | BRD §§5, 7 |
| UX/error/localization states specified | PASS | BRD §4 |
| Engineering/QA handoff complete | PASS | BRD §§6–8 |
| Implementation and independent QA | NOT_RUN | No product change in this task |

## Completion report

Actual agent: Codex business-analyst subagent. Only the two authorized documentation outputs were created on the recorded dirty shared checkout. Matter discovery is reusable but cannot alone satisfy Workspace, Work Item, and Document search. The proposed feature remains IN_REVIEW pending Local Codex intake and Product Owner scope acceptance.

Skipped: implementation, runtime/browser/performance/security testing, independent review, commit/push/deploy. Risk: search is an indirect retrieval surface; implementation without authorization-negative, filter-before-limit, cursor-binding, stale-response, and query-log tests can disclose confidential Matter metadata or silently miss records.

## Local Codex requirements intake

Parent reviewed the BRD against the current palette and authorization-first Matter discovery source. Clarified current-Matter ranking within each match tier and separated the sole-match completeness fixture from the multi-page fixture. Documentation assertions confirm seven unique QS-BR requirements and eighteen consecutive QS-AC cases. This is requirements intake only; all implementation/runtime cases remain NOT_RUN and the proposal remains IN_REVIEW.
