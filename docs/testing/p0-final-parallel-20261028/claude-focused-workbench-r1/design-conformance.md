# Design conformance — selected option 3 (focused workbench)

Source: `docs/design/legal-team-experience-20261029/concepts/concept-3.png`; prototype `design-prototypes/focused-workbench/` (composition reference only, no runtime copied). Rendered product screenshots: `screenshots/`.

| Selected element | Production | Notes / real contract limit |
|---|---|---|
| Two destinations: My Work, Matters | `config/navigation.tsx`, `NavMenu.alsoActiveFor` | `/my-actions` and `/workspaces` routes kept; Matters stays current inside a matter |
| Queue rail Ready / Waiting / Blocked / History + counts | `my-actions-view.tsx` nav (links) | Counts are list lengths of `/me/actions`; an item can be in several lists; no total shown |
| Previous / "Ready task 1 of 3" / Next | `Step`, `CurrentItem` | Boundary buttons are disabled, not dead links; server order untouched |
| Matter name above title | `CurrentItem` | Name comes from bounded server reads of the Matters on screen (≤ 4), omitted on failure, never an id. Clean fix = backend request |
| Title, "Assigned to you · Due …" | `CurrentItem` | Due in the viewer's zone (`LocalizedInstant`); amber only when not on track |
| "Why this is next" | `CurrentItem` | Server reason sentence, worded in VI for the five known sentences; heading follows the class (next / waiting / blocked / listed) |
| One primary action + "View matter" | `CurrentItem` | Primary only for Ready; others are outline. Both links carry the exact queue and item as `from` |
| "What you need — Expected outcome" | `CurrentItem` | `item.outcome`; no invented criterion, version or quoted text (not in the API) |
| "Prerequisites and state details" | `Disclosure` | Five axes as separate badges, upstream list with satisfied state; read failure stated |
| "History" | `Disclosure` | Per-item history does not exist in the API: links to the Matter history |
| Up next | `UpNext` | Next ≤ 3 items of the same queue, server order, with Matter name when known |
| Narrow layout | grid collapses | Queue rail wraps, Up next below the panel; no page overflow at 390/320 |
| (added) Cause of a blocked item | `Causes` | Unsatisfied prerequisites as links with worded gate reasons (`GATE_REASON`) |
| (added) Moved / vanished selection | `selectMyWork.notice` | Truthful notice; protected content is never kept from a stale selection |
| Matter overview: cause first | `matter-attention.tsx` | Blocked Actions + own next step; no readiness percentage or aggregate status |

Retained functionality: Requirement vs Action, five independent axes, permissions decided by the API, ETag/CAS, idempotency, safe return paths (`safeInternalPath` keeps the query), access-loss purge, outcome-unknown handling, existing action-entry dialogs.

Differences from the mock, intentional: no invented "critical chain" sentence (the reason is the server's), no fake due date, footer "synthetic data" text omitted, Vietnamese default per locale.
