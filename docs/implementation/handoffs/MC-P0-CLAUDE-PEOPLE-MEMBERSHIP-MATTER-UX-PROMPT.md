# MC-P0-CLAUDE-PEOPLE-MEMBERSHIP-MATTER-UX

## Assignment and completion boundary

You are actual Claude Code. Implement and verify a cohesive local UX improvement in MatterControl: searchable person selection, workspace/Matter membership flows, consistent Workspace/Matter/member lists, and Create Matter. Complete implementation and applicable checks in one continuous assignment; do not stop after a plan, design intake, or each component. Return a consolidated candidate or a concrete blocker.

Keep the existing Next.js/Go/PostgreSQL architecture. Medusa is a UI/interaction reference, not a platform migration. Preserve approved product semantics, prior authorship and all dirty work. This is implementation authority for this task, not independent acceptance, commit/push/merge, production deployment or a new IdP policy.

Claude owns source changes for this scoped handoff after the human submits it. Codex has completed its preceding Search fix and is not assigning another writer to these paths. If actual concurrent source writes appear, identify the specific files and coordinate; a surviving app/MCP process alone is not evidence of a competing writer.

## 1. Intake current bytes, not historical prose

Root: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control
Expected branch: codex/unified-project-flow
Prepared HEAD: 20feedbf06c859a9806055d609f5b132fe8bb086
The worktree is intentionally dirty. HEAD alone is not the implementation baseline. Record actual HEAD, scoped source hashes and dirty paths at start. If HEAD advanced, inspect/reconcile legitimate changes rather than resetting or demanding the old HEAD.

Read root/component AGENTS, /Users/nguyenvanlan/.codex/RTK.md, current-workflow/project-status, current P0 task and workboard, current local-contract, Design R9 and its implementation addendum as applicable. Use Semble before exploring code; use Context7 plus installed Next documentation for framework APIs. Prefix shell commands with rtk. Never install/relink through pnpm exec or modify node_modules.

Current evidence to consume:
- docs/testing/p0-final-parallel-20261028/search-navigation-20261029-r3/return.md, source-manifest.json, source-delta.json, runtime.json and closing-check.json.
- That candidate has 678 selected source entries; manifest SHA256 689486c7f1d96add438256f41a3aa1863a3f956dd71424574962220ae5ba2257. Recheck actual bytes; later authorized changes require a fresh manifest, not suppression.
- Source check: 56 files / 511 tests; Webpack build/CSS check passed. Browser verification was NOT_RUN because the official browser connection was unavailable. Do not inherit a rendered PASS.
- Prior Select styling: docs/testing/p0-final-parallel-20261028/select-polish-20261029-r2/return.md.
- Earlier creation-flow/PM/BA intent: docs/design/creation-flow-ux-r1/ and docs/testing/p0-final-parallel-20261028/local-creation-flow-20261029/.

Already implemented; preserve and extend:
- Workspace people search uses next/form action="" scroll=false. WorkFilters uses next/form action=basePath scroll=false. Do not restore raw GET navigation/full document reload. URL state and Back/Forward remain supported.
- Shared Select uses native values and progressive appearance:base-select styling. Short role/status lists may keep it; it is not a searchable person picker.
- workspaceRepository.candidates(id,q) already calls GET /workspaces/{id}/member-candidates with the caller session.
- Approved directory scope is local/dev only: already-provisioned product users in the same issuer, OWNER-only, bounded name query (100 characters, up to 20 results). No live ZITADEL management-directory enumeration or production Organization policy has been approved.
- Workspace/Matter membership forms use IntentForm receipted=false, fresh If-Match and explicit roles. Unknown outcome requires reread, not blind retry.
- CreateMatterForm uses IntentForm receipted=true, workspace-scoped draft, stable idempotency key and title-only creation, then navigates to the created Matter.

## 2. References and intended interaction

Read these official references; inspect live examples where available:
- https://demo.medusajs.com/app/inventory
- https://docs.medusajs.com/learn/fundamentals/admin
- https://docs.medusajs.com/user-guide/inventory/inventory
- https://docs.medusajs.com/ui/components/select
- https://docs.medusajs.com/ui/components/data-table

The demo previously redirected to login. Do not claim an Inventory walkthrough if still blocked; do not guess credentials. Use official documentation/component examples and label observed versus inferred behavior.

Apply compact enterprise spacing, neutral surfaces, restrained borders/shadows, clear typography, visible focus, consistent header/action placement, and contextual editing. Use the project's existing tokens/Lucide/Atomic Design. Inspect relevant available impeccable/design-taste/frontend/accessibility skills and follow compatible guidance. Do not replace the design system wholesale, install @medusajs/ui or introduce another router/state/UI framework merely to match the reference.

## 3. Implement searchable person selection

First inventory installed dependencies and reusable Input, Select, SearchInput, Dialog, ConfirmationDialog, FormField and DataTable. Prefer an existing accessible primitive. If none meets the need, implement the smallest domain-free accessible searchable selection component under components; keep people fetching/permissions and feature wording under features. Do not build a generic framework or hand-roll incomplete ARIA to save lines.

Required behavior:
- One coherent find-and-select interaction, replacing the current detached search form plus unrelated person dropdown. A bounded searchable dialog/list is acceptable when easier to make accessible than a custom combobox; match the chosen ARIA pattern completely.
- Search by display name, including keyboard operation; show recognizable names, selected state and a clear way to change/clear. No raw UUID/sub field or arbitrary typed userId fallback.
- Typed text is a query, not a selected user. The command submits the eligible selected userId only, exactly once as the expected form field. Verify FormData, clear, reset and controlled state with IntentForm; no label-as-ID conversion.
- Distinguish idle/loading/results/no match/directory unavailable/permission lost/error. Show a real retry for reads; never turn a failed search into an empty successful result or enable arbitrary submission.
- Workspace queries must reach the existing bounded server search: filtering only the first 20 loaded results is insufficient. Reuse URL/server navigation or a minimal authenticated feature-owned read boundary. No direct client Go/IdP fetch, token exposure or component fetch bypassing repository rules.
- For asynchronous requests, cancel or ignore stale responses; do not show results from the previous query/workspace/session. Keep current selection and role through harmless rerenders/search as long as still eligible. Invalidate on actual access loss/scope change, successful reset or explicit clear.
- Matter candidates come from eligible active workspace members, excluding current Matter members. Do not infer Matter access from workspace ownership.
- Results use only fields actually returned/authorized. Do not fabricate emails, avatars, organization, presence or job titles. For ambiguous equal names use real authorized context if available; surface a genuine identification limitation rather than revealing raw IDs as the primary UX.
- Preserve the normal role defaults/allowed enums and API validation. Role explanations should help users understand scope without inventing new policy.

## 4. Complete the add-member flow

Workspace flow: Members section -> Add member -> find person -> choose role -> explicit submit -> show saved member/role in the refreshed list.
Matter flow: Members -> Add to matter -> choose eligible workspace member -> choose Matter role -> explicit submit -> updated list.

Use one clear primary action, a contextual dialog/panel and Cancel with predictable focus return. Reuse the existing Dialog when suitable; inspect its unmount behavior before relying on it for draft/UNKNOWN state. Search and role changes must never submit mutations. No nested forms.

- Distinguish workspace and Matter access with concise EN/VI copy. Adding membership is not sending an email invitation; do not claim email delivery or create an IdP account.
- Preserve actual server enforcement: unauthorized/hidden access, 401/403/404, stale 412/required 428, last-owner rules and duplicate eligibility checks.
- Stale state offers reread and correction. An ambiguous membership result keeps UNKNOWN and requires reread, never silent resend or a minted idempotency key for CAS-only commands.
- Closing/reopening a panel must not accidentally unlock an unresolved mutation and resend it. Preserve/reconcile existing safety semantics; do not modify IntentForm broadly without necessity and targeted regression coverage.
- Show pending state and prevent duplicate submits. Refresh only necessary app data; do not use location.reload, window.location for internal filtering, or raw GET forms.
- Access loss purges protected selections/drafts and closes inappropriate panels. Regrant does not restore old protected state. Do not broaden identity-directory access.

## 5. Harmonize lists and Create Matter

Scope: WorkspaceList, MatterList, WorkspaceMembers, MatterMembers and their composing Workspace/Matter pages. Do not redesign Work Grid, Filing, Proof or Data workflows.

Lists:
- Reuse existing semantic table/list primitives. Choose a responsive arrangement based on the actual fields; do not invent metadata to fill columns.
- Consistent heading/count/primary-action/row density/role badge/empty/loading/error patterns across the scoped lists.
- Names/titles primary; permission/role secondary; IDs remain internal route keys. Do not migrate URLs to slugs or change backend identity.
- Real accessible links/buttons and row-action menus; avoid nested interactive targets and inaccessible clickable-only rows.
- Add search/filter only where backed by real current data/contracts. A client search over a limited page must say it covers that page; never report it as global search. Do not fake pagination, totals, sorting or bulk actions not supported by the endpoint.
- Long names, duplicate names, 0/1/many rows and narrow screens remain usable without masking legal text.

Create Matter:
- A single visible Create matter action opens a focused form instead of making users discover a long stack of always-open admin forms.
- Retain the existing title-only command and approved validation. Clearly identify the current workspace by name; explain that people/documents/work can be added afterwards.
- Keep draft recovery, stable intent/key and exact-request retry semantics. A modal unmount/remount must not lose UNKNOWN/receipt context or create duplicate Matters.
- Cancel/reopen behavior must be deliberate and tested; do not treat closing as cancellation of an already-sent command.
- On confirmed success navigate to the actual Matter and provide useful next steps through existing routes. Never auto-grant unrelated members, create fake work, or alter the explicit membership policy.
- Preserve sign-in/internal-path sanitization, including the RV-001 normalized // rejection. No redirect helper rewrite for UI convenience.

## 6. Allowed paths and scope discipline

Primary allowed source: apps/frontend/src/features/workspaces/**, features/matters/**, necessary shared primitives/styles, scoped Workspace/Matter route composition, tests/stories/e2e. Keep shared components domain-free, server reads inside required Suspense boundaries and auth/session handling server-side.

Small supporting read-boundary/API changes are permitted only if necessary to consume the existing directory behavior; inspect and document the exact contract. Preserve local-only feature flag, OWNER checks, issuer boundary, query limit and privacy. No new directory policy, schema migration or authorization redesign. If a material semantic/contract change is genuinely necessary, complete unaffected work and report the specific decision; do not fabricate permission.

Preserve ALL existing dirty hunks, especially shared Go/config/API files and prior frontend fixes. No git reset/clean/stash/checkout-overwrites, dependency install/relink, credentials/config/provider changes, existing DB/volume deletion or broad process termination. No commit/push/merge.

## 7. Verify and finish

Run pnpm check and the required production build/CSS guard. Run component tests/stories and build-storybook for changed shared UI. Use meaningful regressions for:
- search/query encoding and no full document navigation;
- late responses, empty/error/retry/permission states and invalid typed-only selection;
- keyboard navigation/selection/Escape/focus return;
- valid selected ID in FormData, clear/reset, role preservation and EN/VI label changes;
- 412/UNKNOWN/double-click safety, closing/reopening while pending or unresolved;
- Create Matter draft/intent persistence and confirmed-success routing;
- no browser credential/token leakage or unauthorized candidate display.

Use the official browser tool for rendered checks when available. Test scoped flows with synthetic data only; preserve resource ownership. Browser operation unavailable means NOT_RUN/BLOCKED for browser evidence; do not bypass via another headless/capture mechanism or claim jsdom proves focus/rendering.

Rendered checks: desktop and narrow viewport, light/dark, long labels, focus/keyboard, selected/person loading/errors, create/cancel/reopen, retained page context and no full reload. Report separate author-unit, rendered, integration/IdP and independent-review results. Provide before/after screenshots if actually captured. Human/AC-137 acceptance remains separate.

Local runtime: latest Codex frontend is recorded in search-navigation-20261029-r3/runtime.json, port3000, isolated cwd /private/tmp/mc-local-login-cij0dm22/frontend-search-navigation-r1. Any frontend refresh must verify actual ownership/PID/argv/start/cwd against the current receipt first, snapshot/build new source in a separate task-owned directory, and preserve the API/PG/IdP. Never terminate a listener based on port alone. Do not expose private env/logs; stop only task-owned temporary resources. If ownership drifted, retain the running app and return an exact run/handoff instruction.

Write new evidence in an absence-checked unique namespace under docs/testing/p0-final-parallel-20261028/claude-people-membership-matter-ux-r1/; resume only your own checkpoint, preserve other outputs and failed attempts. Include task status/checkpoint, return.md, changed-source manifest/delta, commands/UTC/cwd/exit receipts, tests, screenshots where available, limitations and exact run instructions. Pin current bytes at completion; do not reuse a historical manifest as current.

Return one consolidated candidate with:
1. Implemented behavior and exact changed paths.
2. Reference patterns actually used and any justified deviation.
3. Tests/build/browser results with real counts; NOT_RUN and blockers explicit.
4. Source/runtime identity and local URL, safety/privacy observations.
5. Remaining findings and focused independent-review packet.

Proposed status IN_REVIEW or IN_REVIEW_WITH_VERIFICATION_BLOCKERS, never self-awarded DONE/ACCEPTED/MC-002 closure. Finish all authorized source work before returning. End with skipped checks and remaining risk.
