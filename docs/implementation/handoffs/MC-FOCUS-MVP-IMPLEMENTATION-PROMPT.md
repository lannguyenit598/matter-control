# MC-FOCUS-MVP — implementation handoff

Preparation status: **READY_FOR_SCOPE_ADOPTION / NOT_DISPATCHED / NOT_IMPLEMENTED**. Author: actual Local Codex. This file is a complete handoff, not proof an external agent ran. The current user requested research and a BRD; implementation starts when the PO assigns this candidate scope to an actual writer. Do not reopen already approved MatterControl positioning or legal semantics.

## Assignment

Build the proposed Focus MVP as one connected feature, continuing the current source. Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; expected coordination branch `codex/unified-project-flow`. Research base `64b9e0315e210953d7a7eaeacc0643b269a14ad9` had dirty work. Inspect actual HEAD/current writer/changes first; preserve all existing Pane, bottom-nav, business, auth and UNKNOWN fixes. Do not restart earlier W0–W7 work or create a competing writer.

Read fully:

1. AGENTS.md and apps/frontend/AGENTS.md plus relevant frontend rule files.
2. docs/requirements/focus-mode-brd.md (all FR-FOCUS-01..14 and AC-FOCUS-01..18).
3. docs/research/pane-focus-20261101/assessment.md (observed versus unverified).
4. docs/requirements/business-rules.md RULE-001/002/017/018/019/021, permission-matrix.md, current My Work implementation and source ownership/task records.

Record FOCUS-D01..05 as the adopted/rejected/modified choices supplied with the assignment; preparation alone does not mark them PO-approved. If the assignment explicitly adopts the BRD's recommended MVP, do not ask again after each stage. Raise only a concrete unresolved material policy/API/privacy trade-off. Keep independent review and release gates open.

## Intended result

From a ready Action in My Work the user starts a 15/25/50-minute private session. A compact control persists while they navigate existing screens. Pause/Resume/+5/End/reload work correctly, with one synchronized session per principal/browser profile and current access/eligibility checks. Expiry or End changes no domain state. No unlinked timer, daily totals/history, team monitoring, billing, notification mute or fake progress.

Known reuse points (verify current bytes):

- `apps/frontend/src/app/(app)/my-actions/page.tsx`
- `apps/frontend/src/features/work/components/my-actions-view.tsx`
- `apps/frontend/src/features/work/my-work-selection.ts`
- `apps/frontend/src/features/work/repository.ts`, `schemas.ts`
- `apps/frontend/src/app/(app)/layout.tsx`
- `apps/frontend/src/components/templates/dashboard-template.tsx`
- `apps/frontend/src/components/organisms/bottom-nav.tsx`
- `apps/frontend/src/app/pane-workbench.css`

Keep business state in the work feature (for example a small focus submodule); shared UI stays domain-free. Compose domain-aware behavior through the app shell rather than importing feature/business semantics into atoms or shared navigation. Reuse existing searchable selection, buttons, popovers/dialogs, locale, glass tokens and safe links. Do not introduce a new dependency for a timer.

## Execute to a complete candidate

1. Produce a short already-present/change/missing map from actual source. Confirm how an authorized current read reaches the feature through the repository/BFF and how browser tabs arbitrate updates. No invented API route or local storage as authorization.
2. Test timer/state transitions using controlled time, including pause24:37/+5→29:37, reload/hidden/sleep, expiry, clock discontinuity, corrupt storage, concurrent starts and stale control writes. Never use tick count as elapsed time. Test current-session deletion and non-resurrection after End/revocation.
3. Implement Focus entry in My Work and persistent responsive controls. Keep Action title/Matter/reason readable, icon controls named, current selection independent of the active target. Keep all real work commands/guards unchanged. Do not remount active forms when starting, minimizing or ending Focus.
4. Integrate authentication, authorization, eligibility, unavailable and storage/coordination failure states. Validate Start/Resume/restoration, refocus and bounded freshness; only read existing business data. No Focus endpoint that mutates Action, evidence, domain history or billing. Measure request cadence rather than polling every second.
5. Complete tests and real browser journeys for EN/VI, light/dark, mobile/tablet/desktop, bottom dock, dialogs, keyboard, screen-reader event announcements, expiry and negative access/UNKNOWN paths. If a tool/real multiuser journey is unavailable, finish all independent work, prepare exact manual steps and label that evidence NOT_RUN/BLOCKED. Do not bypass browser/IdP permissions.
6. Run required checks for changed code; pin candidate and submit a single consolidated return with per-FR/AC results. A nonauthor reviews the implementation/evidence separately. Do not stop after planning, a timer mock, intake, each stage, or launching an agent.

## Evidence and boundaries

Use synthetic records, public/local logs without credentials and a new unique evidence directory under docs/testing/. Record tool/agent identity, actual branch/base/head, source pins, UTC/argv/exit, tests, before/after domain snapshots, browser artifacts, private-state cleanup and resource disposition. Do not export titles/legal text/tokens into timer storage or logs. Use the current safe local runtime handoff protocol before any restart; do not touch another agent's resource or user's unfinished form.

Scope is local feature implementation/verification only once assigned. No commit/push/merge/cloud resources/paid services/IdP policy modification/deployment/release or MC-002 DONE follows automatically. Report skipped tests and real risks; author evidence is not independent acceptance.
