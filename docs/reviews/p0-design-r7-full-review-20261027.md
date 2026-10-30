# MatterControl — consolidated Design R7 review

Task: **MC-P0-DESIGN-R7-FULL-REVIEW**. Owner/reviewer: **actual Codex / Local Codex**. Priority: P0 coordination; review of FR-001..020, AC-101..163 as enumerated in the coverage baseline, NFR-001..014, GW-01..03, and SCR-01..13. Date: 2026-10-27, Asia/Ho_Chi_Minh.

Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. Branch: `codex/unified-project-flow`. Base/head: `a62d838791ba188838c4ff00b7b6e265ac775056`.

**Verdict: CHANGES_REQUIRED for the consolidated source/spec handoff. Visual and interactive acceptance: VERIFICATION_BLOCKED.** This is a review of the whole R7 source/spec package, not a completed visual audit of the running interface. No product or release gate is closed.

## Scope and evidence

Input: `docs/design/p0-handoff-r7/`, export `MC-P0-DESIGN-R7-local-20261027-01`; `return.md` SHA-256 `508af367374d4a48966967a4f8b38126f59ba089d5b90c5d53b24076f34586d9`. Cross-checked against the approved SRS, business rules, five-axis semantics, permission matrix, acceptance criteria, Golden Workflows, Atlas, coverage baseline and current ZCode contract revision 4. Dependency: the received R7 package; no backend runtime dependency.

Outputs: this report and `docs/testing/p0-design-r7-full-review-20261027/` (`receipt.json`, `reference-pins.json`, `verify.py`, `reviewer-probes.cjs`). No changes to R1–R7, product apps, ZCode workboard/contract, canonical test results or project gates. Existing dirty/untracked work was retained.

Acceptance for this review: identify actual current export, verify declared pins, review cross-document behavior and all named screen scopes, reproduce bounded source/mock checks, record findings and explicit unverified areas. These review activities are complete; independent acceptance of the resulting design is not awarded by this report.

### Verified results

- **22/22 declared payload hashes and byte counts match**; 23 package files including return remain unchanged after checks.
- **38/38 baseline input pins match**. All **48 historical finding records** remain equal to R6.
- Exact identifier sets match coverage: **20 FR / 63 AC / 14 NFR**, 13 screen IDs, all nine named states per screen, three GW IDs. Requirement↔screen mappings are reciprocal. These are coverage/traceability checks, not 63 behavioral passes.
- All six owner source/mock suites were reproduced successfully: manifest, syntax, mock bootstrap, Atlas facts/proof, CSS identity, matrix structure. Syntax was checked through stdin rather than overwriting the owner's `/tmp` file. Master runner was not invoked because it overwrites pinned owner logs.
- Reviewer negative/mock probes independently reproduce DR7-02 and DR7-07 below. Nine commands including version checks completed with exit 0. Actual reviewer tools: **Node v24.22.1, Python 3.14.4**. Owner-reported older/different tool versions remain historical claims, not independently established by this run.
- Browser discovery actually returned **“Local browser use is disabled in Work settings”**; native inventory additionally reported the Mac locked. No alternative renderer, CLI browser/export, native capture or permission change was used.

## What is ready to retain

Keep Enterprise Precision A, selective causal hierarchy B, Comfortable default/Compact opt-in, 14px body text, multiline legal content, semantic tokens and the existing icon direction. There is no basis here for another visual direction vote or a wholesale redesign.

The source correctly retains Requirement≠Action; five separate axes; WAITING+BLOCKED overlap; 0 eligible Actions at Atlas T0; the 4/3/5/0 Action census; explicit milestone prerequisites/UNASSESSED; independent designated verification; upload≠approval; repeated Filing cycles; per-row bulk atomicity; CSV/XLSX and scoped export; recorded-time draft briefs; and server-side tokens with an opaque browser session handle. Backend enforcement and rendered quality remain separately unverified.

The R6 fixes are substantially present:

| Previous finding | R7 disposition from this review |
|---|---|
| R6-E01, RQ-03/RQ-05/demo Action | Corrected for these named examples in source/mock. RQ-03 preserves historical VERIFIED, RQ-05 separates historical and current policy, and the separate demo Action can open proof context without entering Atlas totals. Other proof records still have DR7-02. |
| R6-E02, AC-137 | Approved protocol restored in prose: five people, unseen 50-row matters, two counterbalanced scenarios, three answers, ≥4/5 within 10s, per-participant scoring. Study materials remain incomplete as a handed-off executable dataset: DR7-06. Trial NOT_RUN. |
| R6-E03, reproducibility | Scripts and logs now exist and hashes match; bounded reruns pass. The suite's claimed behavioral strength still exceeds its assertions: DR7-07. |

## Findings and minimum corrections

### DR7-01 · P1 — Remove unapproved domain enum values from the implementation handoff

`docs/design/p0-handoff-r7/current-ux-spec.md:37–38` lists verification **EXPIRED** and dependency **CIRCULAR_CONFLICT** as members of the five-axis model. Approved `docs/requirements/state-semantics.md` defines proof expiry as an input which recomputes aggregate verification, and dependency as READY/BLOCKED; graph cycles are rejected. It does not adopt either added value as a subject-axis state.

Risk: an implementer can add incompatible API/schema states or present a cycle as an accepted graph. Correction: use approved axis values; present expiry and cycle rejection as reasons/validation feedback. Do not change the approved business vocabulary to match the design. Add an exact enum comparison to the source checks.

### DR7-02 · P2 — Proof fallback still gives false causal facts outside the three corrected examples

At `prototype.html:359`, the generic Requirement proof fallback says **“No downstream proof gates declared for this requirement.”** Opening **RQ-11** uses this fallback even though the embedded graph and Atlas contain **DEP-07: RQ-11 → AC-12, proof**. At `prototype.html:356`, RQ-07's proof note says its execution is NOT_STARTED and it is BLOCKED by upstream dependencies, while that record's dependency is **READY** and its incoming gate list is empty. The blocked payment Action AC-07 is a different subject.

Both were reproduced with the owner mock in `reviewer-probes.cjs`; this is a source/mock reproduction, not a browser observation. Correction: derive causal statements from the subject's exact typed edges, or show unavailable when supporting fixture data is absent. Keep Requirement and Action states separate. Check every canonical proof panel against its record and edges, rather than just RQ-03/RQ-05/demo.

### DR7-03 · P2 — Reconcile stale-revision and unknown-outcome UX with the live contract

`current-ux-spec.md:286`, `prototype.html:334` and the state specimens describe concurrent revision errors as **409**. Current ZCode `local-contract.md:66` and `:85` bind stale CAS to **412** and absent preconditions to **428**. Its §2.1 also distinguishes receipted creation from non-receipted membership commands; a later state or 412 does not establish an earlier unknown command outcome.

Correction: provide a short UX mapping for 428, 412, actual contract-defined domain conflicts and OUTCOME_UNKNOWN. Follow the current per-operation reconciliation table, including the case where revocation removes readback rights. A permitted current read alone must not automatically become proof of a particular earlier command or unlock blind retry. Do not change Go's contract to accommodate the specimen's hard-coded status.

### DR7-04 · P2 — Separate personas, read access and mutation authority consistently

The matrix correctly allows all scoped roles to read Control Room, graph, documents and domain history, and OWNER/EDITOR to bulk/import. However `current-ux-spec.md:157,178,193,205,211,223` and `prototype.html:505–518` describe these screens with mixes such as OWNER/Lead Operator, OWNER/Legal Ops Admin and OWNER/Compliance Auditor; the document/version specimen does not explicitly reserve promotion for OWNER.

These are ambiguous screen descriptions, **not proof of an implemented authorization bug**. Correction: each screen lists (a) personas, (b) scoped read roles, and (c) operation-specific controls. Preserve VIEWER read/export/history; preserve EDITOR bulk/import/ordinary edge edits; reserve promotion, cancellation/reopen/applicability and membership/designation as specified. Never derive grants from persona names.

### DR7-05 · P2 — Whole-product UI design is not complete while six essential surfaces remain only prose

The package itself marks **SCR-01, SCR-08, SCR-09, SCR-10, SCR-11 and SCR-13 SPECIFIED_ONLY**. These cover session/workspace administration, document/version/signature operations, Filing/package/cycles, bulk preview/results, import mapping/recovery and event history. SCR-09 has a read-only Filing summary, but no complete operation layout. The generic screen-state viewer mostly substitutes a screen ID into the same content; it does not establish each surface's actual form, field hierarchy, table, footer/action placement or contextual recovery.

Example: `prototype.html:540` sends **every** screen's no-match reset to Grid, clearing only the query, even if the target is Filing, history or import. This contradicts matrix instructions to reset the local tab/filter. The mobile spec also requires sticky drawer navigation, while `.dialog-nav` has no sticky positioning.

Correction: deliver representative, reachable screen-specific layouts and critical interaction paths for these six surfaces, reusing the selected system. Include happy path and the distinct high-risk states (permission loss, stale/conflict, partial/unknown), rather than drawing 117 independent pages or adding a backend. Include login/expired session, Matter/member administration, OWNER version promotion, Filing cycle binding, bulk exact selection and import grouped errors. Preserve product enforcement as ZCode's responsibility. In states not implemented in the concept, label controls non-operational and do not navigate to an unrelated screen.

### DR7-06 · P2 — AC-137 protocol is restored; the claimed locked study assets are not handed off

`validation-plan.md:163–196` describes two scenarios and claims fixture specifications/answer keys are locked, but the 23-file package supplies **no actual pair of 50-row causal datasets, graph/owner/milestone inputs, participant-safe scenario surface, or separately identified facilitator key artifact with a pin**. The existing density generator explicitly has no legal relationships or evaluator input. A scenario paragraph and blank scoring table are not a runnable study setup.

Correction: hand off the two synthetic scenarios and facilitator-only answer keys as separately identified/pinned artifacts, with a check deriving the expected blocker/state/next owner from their data. Keep the key out of the participant-visible UI and disclose any remaining preparation. No participant contact or fabricated usability PASS is assigned by this review. Actual trial remains NOT_RUN.

### DR7-07 · P2 — Self-checks pass while missing DOM IDs and untested behavior remain undetected

`checks/check_mock_dom_bootstrap.js:58–62` creates an element whenever a requested ID is absent. The reviewer renamed the static `query` ID **in memory only** and reran the unmodified owner checker against those altered bytes: it still passed. Thus `validation-plan.md:221`'s claim that the suite validates all 35 DOM resolutions is unsupported. The mock also discards event listeners and supplies no-op focus, so direct function calls cannot prove click delegation, Escape cleanup, keyboard navigation or focus restoration. The seven-edge check counts edges; it does not evaluate all seven gates.

Correction: fail on missing required static IDs; explicitly model only intended dynamic elements; retain event handlers for narrow source/unit tests where appropriate. Add negative tests for the missing-ID mutation and DR7-02, plus pure-function gate/milestone boundary assertions. Keep source, mock and actual rendered checks separate. Reword `CONFIRMED_IN_PROTOTYPE_EXPLORATORY` rows so they do not claim measured height, no clipping, visible causal hierarchy or complete interaction based only on source/mock.

### DR7-08 · P3 — Revision and workflow summaries still contain stale or shortened authority labels

`current-ux-spec.md:1,3,5,292` labels the current package R6/R5; `prototype.html:176` still announces R5 and says a static export is CONFIRMED without prominently binding that statement to historical R4. The return identifies R7. Section 8 of the UX spec shortens the full approved GW-02 Request→Document→Review→Gap→Finding→Follow-Up→Resolution journey to a gap/signature example, while the matrix retains the correct full sequence.

Correction: normalize current export/status labels to R7's successor; label the R4 image as historical evidence only; retain full canonical GW sequences and mark Atlas excerpts as examples. Do not rewrite historical packages or imply new rendered evidence.

## Whole-design disposition

| Area | Current review result | What remains |
|---|---|---|
| Package integrity and historical preservation | PASS_SCOPED | Keep pins and previous returns immutable. |
| Requirement IDs and screen/state traceability | PASS_STRUCTURAL | Names/links do not establish screen completeness or business execution. |
| Core semantics and proof | CHANGES_REQUIRED | DR7-01/02/03; keep approved semantics and current contract. |
| Roles and sensitive-state handling | CLARIFICATION_REQUIRED | DR7-04; exact denied-read versus prohibited-mutation presentation. |
| Control Room, Grid, My Actions, Waiting On | Source concept exists | Rendered scannability, responsive behavior and keyboard flow remain unverified; correct proof/reset details. |
| Six remaining surfaces | INCOMPLETE_DESIGN_DETAIL | DR7-05; concrete layouts and connected critical paths. |
| Document/Filing/bulk/import/export/history semantics | Useful specified baseline | Representative UI and real product behavior remain separate work. |
| Golden Workflows | Correct full matrix IDs/sequences | Complete screen-by-screen journeys; do not treat narrative excerpts as full workflow validation. |
| Typography, density, color and visual polish | Selected direction retained; source tokens exist | No current R7 screenshots. Do not score or certify visual quality without rendering. |
| Responsive, 200% zoom, 50/200-row reachability | NOT_RUN | Actual permitted browser measurements; CSS `min-height` on table cells alone is not measured row geometry. |
| Keyboard/IME, touch, dialog focus and screen reader | NOT_RUN | Actual interaction/accessibility inspection; source focus styles and native dialog are only inputs. |
| AC-137 | PROTOCOL_RESTORED / TRIAL_NOT_RUN | DR7-06 study assets, then real participants under the approved protocol. |
| Source/unit evidence | PASS for the reproduced assertions | DR7-07 narrows overclaims and improves negative coverage. |

## Consolidated next action

One design correction/finalization pass should address DR7-01..08 together, preserving the approved visual direction and already-corrected source. Follow it with one rendered walkthrough of the full primary journeys when browser access is permitted, at desktop/tablet/390px and 200% zoom. Do not send eight separate prompts, restart W0, or introduce a per-wave review gate.

ZCode can continue the authorized long BE+FE W1–W7 assignment against approved requirements and its current contract. These findings are targeted constraints on affected design consumption, not a stop on unrelated implementation. Do not copy the extra enums, hard-coded 409 mapping or persona-based permission assumptions into the product. This review did not message or dispatch ZCode or any external agent.

Proposed status: **R7 source/spec review completed; design package REWORK_REQUIRED; rendered/accessibility/usability acceptance OPEN**. No independent design approval, 36-case INT-A acceptance, MC-002 DONE, production security, Cloudflare/cost/recovery acceptance or release approval follows.

Skipped: all browser/native rendering, real keyboard/touch/screen-reader tests, human study, product build/runtime, credentials/DB/lifecycle, provider dispatch and Git mutations. Remaining risk: source/spec integrity is established, but R7's visual quality and six incomplete interaction surfaces cannot yet be accepted as finished whole-product UI.
