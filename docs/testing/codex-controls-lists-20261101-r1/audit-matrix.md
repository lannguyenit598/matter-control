# Source audit matrix — buttons and lists

Scope: application TSX under apps/frontend/src, excluding tests/stories for the inventory. Exact source locations and attributes are in source-inventory-final.json. Counts describe JSX call sites, not distinct rendered controls, backend endpoints, or full interaction coverage.

| Family | Source review result | Action / verification |
| --- | --- | --- |
| Shared Button: primary, secondary, outline, ghost, destructive; sm/md/icon | Pill geometry, shrink-proof SVGs, long-label wrapping, native type/disabled, loading spinner/busy and shared focus retained | Existing Button tests pass; Pane story context corrected; real rendered state matrix blocked this turn |
| Button-shaped navigation links | Actual links retained; no new click handlers or fake disabled anchors | Existing navigation/list tests included; no domain actions clicked |
| Remaining four intrinsic button sites | Button primitive, TaskChoice's pressed control, IntentForm's inline Reload recovery, and standalone global-error recovery | Intentional native semantics; no blanket replacement just to eliminate raw tags |
| SearchInput clear | Narrow raw icon target; EN-only name; did not respect disabled/readOnly; native search cancel could duplicate the custom control | Shared ghost/icon Button, EN/VI hidden label, text inset for touch target, disable with the field; native duplicate canceled only when custom clear exists. Red/green behavior tests |
| Review matrix Search | Locally styled raw button/input diverged from shared controls | Reuse Input/Button and Search icon; preserve GET method, grid/state/q and selection links. Contract tests |
| Workspace/Matter/discovery/review-grid/member record lists | Reuse LIST_CLASS; preceding rim fix rounds first/last li and direct anchor, including one-row list, without overflow clipping | Retained; source inspection + related list tests. Earlier task browser evidence remains scoped to its source/time |
| Evidence-basis criterion list | Selected/hover anchor had no matching parent corner repair | Reuse LIST_CLASS; inherits the same edge geometry and nested-panel rule; no criterion IDs/status/links changed |
| SearchPicker results | Deliberately bounded scrollable radio list with inset keyboard outline and checked state | Retained; existing picker tests included. Scroll containment intentionally differs from page content clipping |
| Navigation/palette/chip/matrix-cell controls | Individual links/cells have their own rounded interactive shape and explicit active/selected semantics | Retained; no indiscriminate list-wide rounded clipping |
| Three table markup sites / shared DataTable | Table content has horizontal scroll containment; rows/cells remain a table, not rounded independent cards | Retained; do not hide data columns to remove overflow; actual browser inspection blocked |
| Remaining lists | Agenda/history/proof/review/planning/dependency/preview/change logs include semantic informational lists and local disclosure | Reviewed source locations; no blanket glass skin/hover affordance applied to noninteractive rows. Empty/permission/data-rich visual variants not all rendered |

The inventory records 45 Button call sites, 4 ConfirmActionButton, 3 member/delete button wrapper sites, 18 buttonVariants Link sites, 4 native button sites, 50 ul, 11 ol and 3 table sites. Dynamic map output, props-supplied controls and rendered element count differ from these source numbers. Source inventory is not a certificate that every possible screen/data/role has been exercised.
