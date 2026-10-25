# EV-UI-001 — Control Room screenshot intake

Actual human-supplied image preserved as [EV-UI-001](captures/EV-UI-001-control-room.png). Source filename Screenshot 2026-10-25 at10.22.41.png; PNG1220×1586image pixels,193804bytes, SHA2569a730720106035e2639091dae022500b08595881255927093f93134cb9ee95b1. No image editing or generated imagery. Capture date/timezone is not established from its filename.

The user answered “không biết” when asked revision/browser/zoom; these fields remain UNKNOWN, not inferred. The ambient tab points to local-r1#wireframes, which is only a provenance hint. Exact source comparison found the application shell/Control Room markup and complete stylesheet byte-identical between r1 and r2. This permits limited reuse for their common appearance, conditional on unknown runtime conditions; it does not authenticate the capture's revision or establish all-r2 acceptance. No recapture of this same image is requested.

## Supported observations

| Area | What is actually visible | Assessment / limit |
|---|---|---|
| Product shell | Atlas Workspace/Project Atlas, simulated EDITOR role, T0/timezone and Control Room/Grid/Evidence/Status Brief navigation | Context and current selected view visible; navigation behavior and actual roles untested |
| Matter context | Matter name, transaction description, six workstreams/12Requirements/12Actions/3milestones/5documents10versions and exception counts | Domain context visible; counts are displayed fixture facts, not proof of backend scope enforcement |
| Critical blockers | Labeled critical-chain panel and ordered cards RQ-04→AC-05→AC-07→AC-08→AC-09 | Chain membership is visually findable in this image; full causal explanation after cards is cut off |
| State separation | RQ-04 WAITING·UNVERIFIED with ER-04 missing/due14Jun; AC-05 WAITING·BLOCKED with Elm Signatory Demo; later actions BLOCKED | Text distinguishes waiting/proof/dependency without requiring color alone; no proof that users correctly interpret it or that state was derived correctly at runtime |
| Readability | Main titles, IDs, state text and short reasons can be read at the supplied image resolution | Qualitative screenshot observation only; no known1:1 app scale, computed font size, zoom or contrast measurement |
| Hierarchy/coverage | Header/navigation and tall vertically stacked chain occupy almost all supplied region; card surfaces contain considerable free space | Potential scan-density/vertical-space concern. Viewport, crop and zoom unknown, so do not label a responsive failure or infer whole-screen layout |
| Accountable next step | Next Action, internal responsible owners, Waiting On list, milestone readiness/evidence detail and recent-change panels are not shown in supplied region | Not visually assessed; absence from image is not proof of absence from application |

## Findings and disposition

**OBS-UI-001 — MEDIUM hypothesis / NEEDS_CLARIFICATION:** the displayed vertical chain may make a quick legal-operator overview expensive in scrolling and push accountable next steps away from the blocker. Observed fact: tall cards dominate the provided region. Unverified: actual viewport/zoom, whether this is the initial viewport, scroll amount and user task time. Do not redesign from this image alone. Compare the relevant surrounding panels or an ordinary viewing condition when available; retain causes/owners/state distinctions if density is later adjusted.

No confirmed new source/runtime/WCAG defect follows from this screenshot. No contrast ratio, pointer target, keyboard/focus order, click/navigation success, waiting-party follow-up, evidence acceptance or production behavior was tested. RQ-04 and AC-05 text supports partial semantic visual inspection; it does not establish every state axis or all Control Room functions.

## Acceptance impact

- Overall supplied visual evidence: PARTIAL. Full local-r2 rendered gate remains incomplete.
- R03: visible IDs/chain provide partial visual support for the unchanged Control Room only; no A/B/C board evidence, so RV-S01's visual acceptance stays pending.
- R04: visible COMPLETED≠VERIFIED is not demonstrated directly because the completed RQ-02 example is not in this crop. RQ-04/AC-05 demonstrate distinct labels only; no proof-gate runtime acceptance.
- R05/UI-T01/UI-T02/UI-T03: region readability/navigation appearance gives limited support; mobile reachability, actual app scale, geometry/zoom/contrast remain NOT_TESTED.
- RV-S02/UI-T04: no claim about native execution is accepted from a still image; browser behavior remains NOT_TESTED.
- Independent QA PENDING_INDEPENDENT_QA; all PO D-UX01..04 still PENDING; MC-003A REWORK_REQUIRED; STEP03B NOT_AUTHORIZED.

Next useful evidence is different coverage: Grid, bulk preview/stable partial results, Requirement/Evidence/Dependency, lower Control Room Waiting On/milestones/evidence/changes, mobile last-row/search/navigation and direction boards. Reuse this capture for the shared shell/chain; do not require a duplicate merely because metadata is unknown. Record metadata only if known and interactions as actual observations, using the existing local-r2 checklist/template.
