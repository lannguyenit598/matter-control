# MC-P0-UX-FOCUSED-WORKBENCH

Owner: actual Claude Code (frontend composition and local frontend verification), continuing the current session under the Product Owner's selection of design option 3 on 2026-10-29. Reviewer: a non-author assigned by Codex (not yet assigned). Priority: current usable local P0 experience. Status: **IN_REVIEW_WITH_VERIFICATION_BLOCKERS**. Repository: primary checkout, branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` (dirty tree; this task's files are listed in the source manifest). No commit, push or deploy.

Requirements: BR-001..007; REQ-MC-P0-01..20 intact. Focus P0-03/04/06/07/09/10/11/15/18/20 and connected navigation. This is UI execution authority for the selected composition, not approval of new features, providers or release.

Scope: My Work as focused workbench; Matter overview led by cause and own next step; My Work / Matters navigation; TB-12 frontend fail-closed guard; reuse of the existing action-entry dialogs; real rendered validation. Out of scope: Go edits, infrastructure/billing/IdP/DB changes, new AI, intake or template features (separate Codex/DevOps backlog in ADR-004/005 is untouched).

Dependencies: existing Next.js/Go REST, authenticated sessions, backend hardening (module `leonx.me/matter-control`, not certified here). Inputs: `docs/implementation/handoffs/MC-P0-CLAUDE-FOCUSED-WORKBENCH-IMPLEMENTATION-PROMPT.md` (revision 2), `docs/design/legal-team-experience-20261029/`, `design-prototypes/focused-workbench/`.

Acceptance and author evidence (not independent): 67 files / 631 frontend tests, typecheck, lint, format and agent checks pass on the final candidate; `pnpm build` and `pnpm build:webpack` with the compiled-CSS guard pass; production server refuses demo/unset `API_MODE`; real-session browser checks at 1280/390/320 px, dialog focus/Escape/bounds, create-Matter and ready→complete→readback→return journeys. Open: completed-work evidence journey, real multi-person picker rows, independent review/QA, a reproduced flaky `upload-attempt` test, one optional backend field (`backend-requests.md`).

Outputs and evidence: `docs/testing/p0-final-parallel-20261028/claude-focused-workbench-r1/` (`return.md`, `design-conformance.md`, `backend-requests.md`, `source-manifest.json`, `receipts/`, `screenshots/`, `artifacts.sha256`). No external agent invocation, independent PASS, MC-002 DONE or release approval is claimed.
