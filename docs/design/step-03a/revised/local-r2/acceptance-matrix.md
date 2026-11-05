# MC-003A local-r2 regression / acceptance matrix

Author source checks only. Prior critic reports and original findings remain unchanged. SOURCE PASS is not formal independent QA, native interaction PASS, usability acceptance or closure.

| Root | Requirement / preserved behavior | r2 verification method / result | Remaining acceptance |
|---|---|---|---|
| RV-S01 / R03 | Atlas §§4–9; exact types/IDs/states; receipt is evidence; no dataset rewrite | Canonical board C values, shared A/B/C truth, full chain including compressed tail, 24 fixture states and namespaces: SOURCE PASS | Rendered reading/compare boards NOT_TESTED; independent review pending |
| RV-S02 / UI-T04 | Truthful distinction between implementation, source/VM evidence and native execution | Five classifications synchronized; unsupported headless/focus claims and stale fixture/inline copy removed: SOURCE PASS | Native keyboard/focus/responsive NOT_TESTED; formal claim review pending |
| R01 | RULE-013 allowlist title/description/internal owner/due, blank unchanged, explicit mixed row outcomes; RULE-017/018/019 | Runtime script identical to r1 except two coverage-label literals; bulk functions/defaults unchanged, no Workstream control or prefilled due: SOURCE NO REGRESSION | Prior VM evidence remains historical; r2 native behavior/auth enforcement NOT_TESTED; overall PARTIAL |
| R02 | Approved role/designation/applicability/import/export/brief policy; DEC-016/017 | Approved contract text retained; pending items are mechanisms. No normative input changed: SOURCE NO REGRESSION | Independent acceptance and real enforcement absent; overall PARTIAL |
| R03 | DEC-AT case / UX-DEC design / governance namespace; canonical supplied evidence | Source correction above; evidence mappings/runtime data unchanged: SOURCE PASS for corrected representations | Missing milestone/decision/risk fields remain unavailable; historical fixture caveat retained; overall PARTIAL pending QA/render |
| R04 | RULE-003 proof edge differs from RULE-008 milestone; READY+COMPLETED and valid proof; no NOT_REQUIRED proof-edge waiver | edgeSatisfied/milestoneReadiness and proof copy unchanged; no predicate regression by exact script comparison | Prior predicate tests not rerun; user comprehension and authoritative evaluator NOT_TESTED; overall PARTIAL |
| R05 | Three connected slices, nine partial/four spec-only, all matching mobile rows; Requirement≠Action; Evidence Requirement≠Evidence | Slice/coverage contracts retained; mobile renderer/handlers unchanged, labels made explicit: SOURCE NO REGRESSION | Mobile NEEDS_CLARIFICATION, full filing/real upload NOT_TESTABLE_IN_CONCEPT; overall PARTIAL |
| UI-T01 / UI-T02 | Draft type/target guidelines, miniature vs real view | CSS unchanged; no style-score or pixel-based correction introduced | Readability/geometry/zoom/contrast NOT_TESTED |
| UI-T03 | Separate five axes, scoped draft token roles | State/timing/attention code and CSS unchanged; semantic text retained | Visual recognition/contrast NOT_TESTED; authoritative derivation not implemented |

No findings are marked CLOSED solely because wording changed. MC-003A remains REWORK_REQUIRED until required rendered evidence, important-finding acceptance, actual independent QA and PO gate are complete.
