# MC-003A accessibility/readability review — STEP03A.2

**NOT_TESTED in rendered context. No WCAG or usability verdict.** Source-supported correction remains distinct from empirical accessibility. No measured fonts, bounds, spacing, contrast ratios, zoom/reflow, screen-reader output or user-task observations were produced.

| Topic | What source supports | Current result / acceptance needed |
|---|---|---|
| UI-T01 typography | Grid14px/body,12pxmetadata draft overrides and scale notice; miniatures intentionally smaller | NOT_TESTED. Measure actual computed values/font fallback and Vietnamese diacritics at ordinary/200% viewing. Draft values are not universal WCAG requirements. |
| UI-T02 targets | Mobile override for nav/close/tabs/filter/select/record targets; other source34px rules exist earlier | NOT_TESTED. Cascade/geometry/spacing and actual device interaction needed. Height alone is not WCAG failure or PASS. |
| UI-T03 semantic tokens | Separate app/presentation namespaces, five role vocabulary, selected/error/disabled/focus definitions; some miniature hardcoded values remain | PARTIAL source coherence; actual contrast/axis recognition NOT_TESTED. Disabled state is not blanket permission for unreadable text. |
| UI-T04 evidence honesty | Main contract admits no visual validation and limited prototype | PARTIAL; RV-S02 contradicts that with a native-test claim. Resolve source copy; real result remainsNOT_TESTED. |
| Keyboard/focus | Row handler and dialog fallback exist; no actual native focus trial | NOT_TESTED; test nested controls, tablists, dismissal and rerender recovery MV-10. |
| Color dependence | State text retained, five dimensions specified | NOT_TESTED for actual recognition and accessible names. Sharing hue must not collapse proof and progress. |
| Zoom/reflow | Responsive CSS exists | NOT_TESTED at proposed conditions; verify modal/footer/table/critical text remain reachable MV-09/11. |
| Contrast | CSS includes OKLch and literals; color appearance/ratios unmeasured | NOT_TESTED. Record computed foreground/background, state/size and actual ratio with an identified permitted tool; no guessing from OKLch lightness. |

Execution vocabulary NOT_STARTED/IN_PROGRESS/WAITING/COMPLETED/CANCELLED; verification NOT_REQUIRED/UNVERIFIED/PARTIALLY_VERIFIED/VERIFIED/DISPUTED; dependencyREADY/BLOCKED; timingON_TRACK/DUE_SOON/OVERDUE; attentionNORMAL/ATTENTION/CRITICAL are contractual text distinctions. Not every enum combination is a live sample. Missing/non-applicable must remain explicit; do not invent fixture states merely to fill screenshots. FIL-02 receipt in BoardC's verification column is an identified semantic-copy defect, not a sixth verification enum.

Follow MV-01..12 in manual-visual-checklist.md. Current distinctions: CONFIRMED source contradictions RV-S01/02; SUSPECTED readability/discoverability/focus risks; UNABLE_TO_VALIDATE all rendered metrics. Miniature screenshots alone cannot accept production accessibility.
