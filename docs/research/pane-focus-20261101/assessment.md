# Pane Focus → MatterControl assessment

Date: 2026-11-01. Researcher/coordinator: actual Local Codex. Product recommendation: Codex `product-manager` subagent; requirements/gap analysis: Codex `business-analyst` subagent. These are internal roles, not external Claude/ZCode/OpenCode execution or acceptance.

Source: [Pane Home live demo](https://demo.codeandchill.store/pane/#/home). Browser: approved in-app browser, UI interaction with public sample tasks only. MatterControl source: `codex/unified-project-flow` at `64b9e0315e210953d7a7eaeacc0643b269a14ad9` plus preserved dirty work. This research changed no application source, runtime, database or account policy.

## Observed reference behavior

| Observation | Evidence / qualification | MatterControl recommendation |
| --- | --- | --- |
| Home has a Focus card, 15/25/50-minute presets, default 25 | Preset 15 changed display to 15:00; restored 25 afterward | Reuse the three durations; no new settings screen |
| Task picker includes “No task — just focus” and named sample tasks | Selected Review Tide release checklist | Offer existing authorized Ready Actions; defer unlinked sessions |
| Start shows selected task, countdown, Pause and End | Ready 25:00 → Focusing 25:00, then elapsed countdown | A personal session, distinct from an Action execution command |
| Pause/Resume and +5 min | Paused 24:37 → +5 → paused 29:37; main-card Resume later showed Focusing 29:33 | Explicit deterministic controls |
| Floating timer opens a top-center control island | Task, remaining time, +5, Pause/Resume and End session; screenshot pane-focus-running.png | Persistent compact controls across internal navigation |
| Selected task and paused duration survived Projects navigation and reload | Paused 29:37 restored after hydration; initial empty render was not treated as loss | Require restoration and revalidation; running reload/sleep behavior was not tested in Pane |
| End returns card to Ready 25:00 and emits “Focus session ended” | The selected task checkbox remained unchecked | Never complete work as a timer side effect |
| “Focused today”, 1.1h / 2 sessions and two-hour goal shown | Short test did not change displayed aggregate; accumulation/count rules unproven | Defer aggregates/goals/history rather than invent their semantics |
| Start toast says notifications are held | Only the toast was observed | Do not claim delivery suppression or OS Do Not Disturb |

`evidence/pane-focus-idle.png`, `pane-focus-running.png` and `pane-focus-ended.png` are browser screenshots of the public demo. Ended is a full-page capture; it is not a render of a persistent session history. One short sample session was started, paused, extended, resumed and ended. No task was marked complete. The preset was restored to 25 and the research session left stopped.

Not observed: expiry after a full interval, automatic breaks, notifications actually delivered/held, background sleep accounting, cross-tab concurrency, cross-device persistence, billing, server storage or privacy guarantees. Do not infer implementation from the demo's appearance.

## Existing MatterControl capability versus gap

- Already implemented: My Work shows one current item, reason, due context and permitted next step; Ready/Waiting/Blocked/History; selection in URL; moved/gone notices; safe return context. See `apps/frontend/src/features/work/components/my-actions-view.tsx` and `my-work-selection.ts`.
- Approved authority: FR-003/FR-010 and RULE-021. Next Action eligibility/ranking belongs to the backend. `work_service.go` MyActions and `domain/matter/workview.go` distinguish recommendations from assignments.
- No Focus-session/timer implementation was found by targeted literal search in frontend source, backend internal source, requirements and research. This is the inspected scope, not a proof about every artifact in the repository. The existing term “focused workbench” describes presentation, not a countdown.
- Reuse current identity, access-loss handling, work repository and navigation. No new WorkItem type/state, backend session table or duplicate task system is needed for the proposed local MVP.

## PM/BA synthesis

The PM recommended a narrow linked-Action MVP with no statistics; the BA initially considered unlinked sessions and a local daily total. The consolidated recommendation adopts the narrower scope: it helps a legal contributor protect attention on an actionable obligation, and avoids inventing timekeeping, retention and session-counting policy. The BA agreed to this boundary. Pane's broader controls remain research input, not approved product requirements.

Deliverables: [business requirements](../../requirements/focus-mode-brd.md) and [implementation handoff](../../implementation/handoffs/MC-FOCUS-MVP-IMPLEMENTATION-PROMPT.md). Status: **RESEARCH_COMPLETE / REQUIREMENTS_PROPOSED_IN_REVIEW**. No Focus implementation or acceptance claimed.
