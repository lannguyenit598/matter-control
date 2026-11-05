# MatterControl R9 — validation plan and actual results

MC-P0-DESIGN-R9-TARGETED-CORRECTION · export revision **MC-P0-DESIGN-R9-local-20261027-01**. Targeted correction of four findings reproduced against R8 (R8-N01..04); everything else in this plan that was already correct in R8 is carried forward unchanged and re-run here against the R9 paths, not re-derived from scratch.
Repository `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.

---

## 1. Evidence tiers

Every assertion in this package carries exactly one tier. A tier is never upgraded by inference.

| Tier | What it means | What it can never establish |
|---|---|---|
| `SOURCE_CHECKED` | A script parsed the artefact or an approved source and compared values | Anything about running code or a rendered page |
| `MOCK_EXECUTED` | The prototype's own code ran against a strict mock DOM, with its real event listeners dispatched | Layout, geometry, painting, real focus movement, touch, or assistive-technology output |
| `BROWSER_EXECUTED` | Observed in a real browser at a stated viewport and zoom | — |
| `NOT_RUN` | Not attempted | — |
| `VERIFICATION_BLOCKED` | Attemptable only with a capability this session does not have | — |

R7 was criticised for rows that claimed measured height, absence of clipping, visible causal hierarchy or complete interaction on the strength of source and mock evidence alone. No row in this document does that. There is no `BROWSER_EXECUTED` row anywhere in this package.

---

## 2. Why the rendered tier is empty

No browser, renderer, screenshot or capture tool is present in this session's tool environment. The available tools are file, shell, search and documentation tools; a tool search for a browser, screenshot, navigation, page-render or viewport capability returned none.

Not attempted, deliberately: a CLI browser or headless renderer, an alternate browser, native screen capture, any export or render command, a local server, proxy or tunnel, and any settings change. The user's instruction forbids each of these as a bypass, and that instruction governs.

Consequently the whole visual, responsive, keyboard, touch, focus and screen-reader programme in §6 is `VERIFICATION_BLOCKED`. Rendered quality is **not** inferred from the CSS, from the R4 screenshots — which remain historical R4 evidence of a different candidate — or from mock DOM execution.

---

## 3. Checks that actually ran

All commands below are run individually from the package directory `docs/design/p0-handoff-r9/` and actually exist at the stated path. **R8's `checks/run_all_checks.sh`, `checks/check_manifest_pins.py` and `checks/check_screen_state_matrix.py` were dangling references** (R8-N04): the first two never existed anywhere in the repository and the third was referenced but not checked in. This revision removes the wrapper script and the standalone pin-checker rather than inventing a runner framework nobody asked for, and adds the real `checks/check_screen_state_matrix.py` (the one script worth keeping, since the matrix JSON already carries the exact structure it checks). Pin verification is one real `shasum -a 256` invocation per input, logged in `evidence/`, not a script.

| # | Check | Command | Tier | Result |
|---|---|---|---|---|
| 1 | Input pins | `shasum -a 256 <four pinned R8 inputs>` | SOURCE_CHECKED | All four hashes in `docs/implementation/handoffs/MC-P0-DESIGN-R9-TARGETED-CORRECTION-PROMPT.md` §1 reproduced exactly; see `evidence/run-20261027T081038Z/pin_verification.*` |
| 2 | Axis vocabulary | `python3 checks/check_vocabulary.py` | SOURCE_CHECKED | Declared axis members in spec, matrix and prototype equal the approved sets exactly; every consumer document swept for a reintroduced status code and for stale revision labels |
| 3 | Canonical dataset and derived causality | `python3 checks/check_canonical_dataset_and_proof.py` | SOURCE_CHECKED | 31/32 assertions pass (exit 1). 24 records, 7 edges and the full action census compared with the approved Atlas document field by field; dependency re-derived independently; all 24 permission rows compared with the approved matrix. **One known, isolated, out-of-scope failure**: "the contract still defines no 409" — `local-contract.md` revision 6 (read-only; advanced by the separate implementation session after R8) added a `409 urn:mc:rejected` status for work-graph dependency rejections, unrelated to this package's edit/version CAS conflict surface. Not remediated here (R8-N01..04 scope only; no new route/status/UI invented in response). See `findings-disposition.json` DR7-03 and `return.md` "Known conflicts". |
| 4 | Prototype behaviour | `node checks/check_mock_dom_bootstrap.js` | MOCK_EXECUTED | 29 checks, including two negative mutation tests, the DR7-02 regressions, all 24 proof panels, predicate boundaries, delegation, native dismissal, IME, per-screen reset, role matrix, SCR-01 non-disclosure and workspace scope — re-run against the R9 prototype and still 29/29 |
| 5 | Matrix structural coverage | `python3 checks/check_screen_state_matrix.py` | SOURCE_CHECKED | 20 FR, 63 AC, 14 NFR, 13 screens each with all nine states, 3 Golden Workflows, reciprocal requirement-to-screen mapping in both directions |
| 6 | Stylesheet identity and self-containment | `python3 checks/check_css_byte_identity.py` | SOURCE_CHECKED | The embedded stylesheet is byte-identical to `polish.css` in both HTML artefacts, and neither artefact references the network |
| 7 | Syntax | `bash checks/check_syntax.sh` | SOURCE_CHECKED | `node --check` on every inline script and check module, including the new R9 check scripts |
| 8 | Study assets | `python3 checks/check_study_assets.py` | SOURCE_CHECKED | Both datasets structurally valid and acyclic; every expected answer re-derived from the data; participant and facilitator material proven separate |
| 9 | Strict mock adapter self-checks (new in R9) | `node checks/check_strict_dom_adapter.js` | SOURCE_CHECKED | 9 isolated checks proving the strict mock's textarea/option value hydration, select default-option selection and input.type/checked semantics match a real DOM, independent of prototype.html — see §3.2 |
| 10 | R8-N01/N02/N03 regression suite (new in R9) | `node checks/check_r8_n01_n04_regressions.js` | MOCK_EXECUTED | 13/13 checks: purge-on-revocation, no-resurrection-on-regrant, downgrade-keeps-read, Create Matter/promotion intent survives navigation and locale switch without bleeding across documents, explicit discard clears drafts, independent target/expected-current controls, missing/invalid/same-as-current target and stale-guard validation, EDITOR/VIEWER promotion boundaries |
| 11 | R8 baseline vs R9 candidate red→green proof (new in R9) | `node checks/check_r8_baseline_redgreen.js` | MOCK_EXECUTED | Same (adapter-fixed) mock run against the read-only R8 baseline (red: purge text only, draft resurrects, Create Matter/promotion drafts lost) and the R9 candidate (green: none of the three) |

Exact tool versions, timestamps, working directory, exit codes and raw stdout/stderr for the run that produced this R9 package are in `evidence/run-20261027T081038Z/` (own directory, pinned separately from R8's evidence, which stays empty exactly as R8 left it).

### 3.2 Why checks 9–11 exist: separating adapter bugs from concept bugs

An intake recheck of this package found `check_r8_n01_n04_regressions.js` failing after 4/13 passes, with the first failure on the promotion-reason field's `.value` after a view switch. Diagnosis (recorded in `docs/testing/p0-claude-w1-review-20261027/design-r9-diagnostics.{cjs,json}`) traced this to `checks/strict_dom.js` itself: it never hydrated a `<textarea>`'s `.value` from its own child text, never fell back an `<option>` with no `value=` attribute to its own text, and never exposed `input.type`, so a checkbox-type check against `.type` silently failed. The generated markup already contained the user's typed text — the mock just never read it back into `.value`. That is a test-fixture gap, not a product/concept-state loss, and the diagnostic explicitly says so.

`checks/strict_dom.js` was corrected minimally (three DOM-semantics gaps closed; no new parser, no dependency). Check 9 proves each of those three fixes in isolation. Check 11 then re-runs the identical corrected adapter against the untouched, read-only R8 baseline and the R9 candidate side by side: the R8 baseline still shows the purge-text-without-purge, draft-resurrection and navigation-loses-draft defects (red), and the R9 candidate does not (green), using one adapter for both. That rules out "the adapter fix made everything pass regardless of the real defect."

### 3.1 What the strict mock does and does not do

`checks/strict_dom.js` replaces R7's permissive mock. It refuses to return an element for an id that is neither declared in the markup nor created by the prototype itself, it keeps the nesting of parsed markup so a `select` owns its options, and it retains event listeners so a dispatched click really travels through the prototype's delegation.

Two negative mutation tests prove it can fail: renaming the static `query` id, and deleting the `detail-body` id. Under R7's mock both mutations still passed; under this one both are detected. `renderAll` no longer swallows a render error, so a broken screen surfaces as a failure instead of a blank panel.

It still cannot establish geometry, painting, real focus movement, touch or assistive-technology behaviour, and no row above claims otherwise.

---

## 4. Finding-by-finding verification

| Finding | How it was verified | Tier | Outcome |
|---|---|---|---|
| DR7-01 | Axis member sets compared with `state-semantics.md`; the two removed values swept for as enumerations across spec, matrix, prototype and every consumer document; the prototype's expiry and cycle explanations asserted present | SOURCE_CHECKED | Corrected |
| DR7-02 | All 24 canonical proof panels opened and asserted against their own record and typed edges; RQ-11 asserted to report DEP-07 to AC-12; RQ-07 asserted to keep its own READY dependency while AC-07 stays BLOCKED; RQ-03 and RQ-05 corrections asserted present, with DEP-05's Atlas-reported status preserved beside the current-policy evaluation; missing-information fallback asserted to report absence rather than a negative fact | SOURCE_CHECKED + MOCK_EXECUTED | Corrected at root |
| DR7-03 | Contract re-read for the 428, 412, 422 and receipt bindings; the mapping asserted to contain no status the contract does not define; receipted and non-receipted unknown outcomes asserted distinguishable | SOURCE_CHECKED + MOCK_EXECUTED | Corrected |
| DR7-04 | All 24 permission rows compared with the approved file; the role selector driven through five accesses with the resulting controls asserted; SCR-01 asserted not to list, name or count a Matter the access cannot read; workspace-scoped operations asserted decided by the workspace role | SOURCE_CHECKED + MOCK_EXECUTED | Corrected |
| DR7-05 | Each of the six surfaces driven through its own controls and asserted on its own content; per-screen reset asserted to stay on its screen; sticky drawer navigation present in the stylesheet | SOURCE_CHECKED + MOCK_EXECUTED for behaviour; rendered layout VERIFICATION_BLOCKED | Built; appearance unverified |
| DR7-06 | Both datasets validated structurally and for acyclicity; every expected answer recomputed from the data and compared with the stored key; separation of participant and facilitator material asserted | SOURCE_CHECKED | Assets handed off; trial NOT_RUN |
| DR7-07 | Two negative mutation tests; delegation, native dismissal, IME and keyboard routing dispatched through the real listeners; predicate boundary assertions | MOCK_EXECUTED | Corrected |
| DR7-08 | Revision labels swept across every consumer document; all three Golden Workflow sequences asserted rendered stage by stage against the approved source | SOURCE_CHECKED | Corrected |
| **R8-N01** | Revoke→re-grant proven not to resurrect a record draft (checks 10, 11); selected/bulk-result state proven not to resurrect; OWNER→VIEWER downgrade (still scoped read) proven NOT to purge; explicit discard (Sign out) proven to purge. Red→green proven against the untouched R8 baseline with the same adapter (check 11) | MOCK_EXECUTED | Corrected at root in `src/logic.js` (`purgeProtectedState`, role-transition hook, Sign-out wiring); concept-state proof only, not a product authorization/security PASS |
| **R8-N02** | Create Matter title and promotion reason proven to survive a view switch and an EN/VI locale switch; promotion draft proven not to bleed across two different documents; explicit discard proven to clear both. Red→green proven against the untouched R8 baseline (check 11) | MOCK_EXECUTED | Corrected at root in `src/logic.js` (`formDrafts` Map, reusing the existing `drafts` Map pattern) |
| **R8-N03** | `promote-target` proven distinct from `promote-expected`; missing target, target re-selected as current, missing reason/ack and a stale expected-current guard each proven to produce a validation/no-change message rather than a fabricated success; changing target proven to reset a stale acknowledgment; EDITOR (add-version only, no promote) and VIEWER (scoped read only) boundaries proven unchanged | MOCK_EXECUTED | Corrected at root in `src/logic.js` (new `promote-target` control, `promotionImpactText`, `promote-preview` handler); wire status is `DEPENDENCY_PENDING` — the current `local-contract.md` (re-read at R9 time, hash `377f7ae1758d302952e9a3417ac60dc1b88e94f9e976ed53588fd2586bd3f2c4`, 23,077 bytes) still does not define a promote-version operation or status |
| **R8-N04** | Dangling `run_all_checks.sh`/`check_manifest_pins.py` references removed; `check_screen_state_matrix.py` now exists and runs; this file, `return.md`, `findings-disposition.json` and the manifest synchronized to R9; R9's own `evidence/` populated with real per-check receipts | SOURCE_CHECKED | Corrected; independent non-author review of this disposition remains open (see `findings-disposition.json`) |

---

## 5. AC-137 manager comprehension study

The approved protocol is unchanged. It was not re-opened, re-approved or re-tuned.

- **Participants.** Exactly five real legal operations managers, corporate transactional partners or senior closing coordinators. Author self-testing, designer testing, internal AI personas and proxy engineers are disqualified. Formal consent required; no personally identifiable data and no client name in the repository.
- **Materials.** Two unseen 50-row synthetic matters: `study/scenario-a.json` (Cross-Border Subsidiary Carve-Out, 25 requirements and 25 actions, 25 edges) and `study/scenario-b.json` (Syndicated Debt Refinancing, 22 requirements and 28 actions, 25 edges). Each carries a full causal graph with typed gates, declared milestone prerequisite sets, scoped owners and declared evidence criteria. Neither is a density-only generator, and neither touches the canonical Atlas 24.
- **Participant surface.** `study/participant-surface.html` — the Control Room, the scenario selector, nothing else. The participant bundle is exactly three files.
- **Facilitator material.** `study-facilitator/facilitator-key.json`, outside the participant directory, never embedded, never served.
- **Counterbalancing.** MGR-01..03 run A then B; MGR-04..05 run B then A.
- **Questions.** Major state, top blocker, next owner and permitted action.
- **Threshold.** At least four of five answer all three correctly within ten seconds, in each scenario separately. Elapsed time and accuracy are recorded per participant and per scenario; a mean below ten seconds does not rescue an individual failure.

**The key is derived, not asserted.** `checks/build_study_datasets.py` computes each expected answer from the dataset with the same predicates the approved semantics describe, and `checks/check_study_assets.py` recomputes them independently and compares. The derivation is reviewable rather than taken on trust:

| | Scenario A | Scenario B |
|---|---|---|
| Milestones | all three BLOCKED | MSB-01 READY, MSB-02 and MSB-03 BLOCKED |
| Top blocker | `RA-07`, the ministry carve-out clearance, reaching 24 records | `RB-05`, the perfection certificate missing its legal opinion exhibit, reaching 20 records |
| Eligible Actions | 0 | 1 (`AB-28`, the escalation of that same exhibit) |
| Next owner and action | none eligible; the accountable owner is the regulatory lead on `RA-07` | `AB-28`, executable now by the security counsel |

Each scenario's top blocker is asserted to win on declared reach by a strict margin over the runner-up, so question two has one defensible answer rather than a tie broken by sort order. Scenario B is asserted to have exactly one eligible Action, so question three does too.

**Two things the facilitator should know before running this.** First, the participant surface re-implements the Control Room rendering rather than importing the prototype's: the two share the stylesheet and the predicates but are separate code, so a late change to one does not automatically reach the other. Re-run `checks/check_study_assets.py` before a session. Second, the surface deliberately shows the product's own derived primary-blocker summary, because that summary is the design under test. If the Product Owner wants the questions answered without it, that is a change to the approved protocol and needs their decision, not this package's.

**Status: TRIAL NOT_RUN / AWAITING_HUMAN_TRIAL.** No participant was contacted, no timing or accuracy was collected, and no usability result is claimed. The scoring ledger is empty by design.

---

## 6. Blocked programme, case by case

Every row is `VERIFICATION_BLOCKED` for the reason in §2. None has been partially credited from source or mock evidence.

### 6.1 Layout and responsiveness
| Case | What must be observed |
|---|---|
| V-01 | Desktop 1440×900: no horizontal scroll, no overlap, no clipping, on all eleven surfaces |
| V-02 | Desktop 1280×800: the Control Room chain, the Grid and the six new surfaces |
| V-03 | Tablet ~768px: the two-column collapse, and the filing stepper wrapping |
| V-04 | Mobile 390px: card stack, full-screen drawer, sticky drawer navigation reachable in long content |
| V-05 | 200% zoom at 1440×900: no clipped control, no lost reason text |
| V-06 | Comfortable and Compact at every breakpoint; body text measured at 14px in both |
| V-07 | Long Vietnamese and English legal titles and error strings, rendered in full, wrapping rather than truncating |
| V-08 | The last row of the 50-row and 200-row density fixtures reachable and fully readable |
| V-09 | Charts and meters: none exist in this design; confirm none has crept in |

### 6.2 Interaction
| Case | What must be observed |
|---|---|
| I-01 | Keyboard-only traversal of a full Golden Workflow walkthrough |
| I-02 | Grid row arrow and Enter navigation, and that a nested input, select or textarea keeps its own keys |
| I-03 | IME composition in the draft editor and every search field |
| I-04 | Visible focus on every interactive element, including inside the drawer |
| I-05 | Drawer close by button, Escape and backdrop, each returning focus to the opener |
| I-06 | Focus containment inside the open drawer |
| I-07 | Touch target size at 390px for buttons, checkboxes and summaries |
| I-08 | Hover, active, selected and disabled treatments measured for contrast, with hover never reducing it |

### 6.3 Assistive technology
| Case | What must be observed |
|---|---|
| A-01 | Reading order on the Control Room and the Grid |
| A-02 | Accessible names on every control, including icon-only ones |
| A-03 | Error association between a field and its message |
| A-04 | Live-region announcement of the match count and the draft result |
| A-05 | Table semantics on the Grid, the lineage table and the history table |

A screen-reader case is marked executed only if a real screen reader was run and named. None was.

### 6.4 Product behaviour, out of scope here
Persistence, enforcement, real authorisation, real filing, real import and export, and real verification belong to the implementation and its tests. No row in this package asserts any of them, and no acceptance criterion is marked PASS from a design artefact.

---

## 7. Known limits of this package

1. The prototype is synthetic and local. Nothing it shows was saved, verified, submitted, exported or enforced, and the role selector is presentation only.
2. Values the approved sources do not state are marked design-supplied where they are shown, and are listed in the prototype's own provenance notes. The categories are: English renderings of Vietnamese titles; version dates and authors other than the two Atlas records; signature party identities; filing checklist states; submission reference strings; event reason, effective time, correlation and causal links; the second Matter, the fourth member, every Matter role assignment and the verifier designation; the restricted security-log rows; and every labelled scenario.
3. The bulk result panel shows declared outcomes so that the succeeded, failed and unknown presentations can be read side by side. It states on its face that nothing was sent and nothing changed.
4. The checks reproduce the behaviour of this package's own code against approved sources. They do not and cannot establish that the product behaves this way.
5. The independent non-author QA gate remains OPEN. Neither the author nor the implementer may close it.
