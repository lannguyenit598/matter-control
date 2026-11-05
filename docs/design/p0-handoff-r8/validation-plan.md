# MatterControl R8 — validation plan and actual results

MC-P0-DESIGN-R8-CONSOLIDATED-FINALIZATION · export revision **MC-P0-DESIGN-R8-local-20261027-01**.
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

All commands are run from the package directory `docs/design/p0-handoff-r8/`. The runner writes to a fresh `evidence/run-<UTC>/` directory on every execution, so no earlier log is ever overwritten.

```
bash checks/run_all_checks.sh
```

| # | Check | Command | Tier | Result |
|---|---|---|---|---|
| 1 | Input pins | `python3 checks/check_manifest_pins.py` | SOURCE_CHECKED | Every declared input matches its recorded byte count and SHA-256 |
| 2 | Axis vocabulary | `python3 checks/check_vocabulary.py` | SOURCE_CHECKED | Declared axis members in spec, matrix and prototype equal the approved sets exactly; every consumer document swept for a reintroduced status code and for stale revision labels |
| 3 | Canonical dataset and derived causality | `python3 checks/check_canonical_dataset_and_proof.py` | SOURCE_CHECKED | 24 records, 7 edges and the full action census compared with the approved Atlas document field by field; dependency re-derived independently in Python and compared with the stored values; all 24 permission rows compared with the approved matrix; contract status bindings re-read from the contract |
| 4 | Prototype behaviour | `node checks/check_mock_dom_bootstrap.js` | MOCK_EXECUTED | 29 checks, including two negative mutation tests, the DR7-02 regressions, all 24 proof panels, predicate boundaries, delegation, native dismissal, IME, per-screen reset, role matrix, SCR-01 non-disclosure and workspace scope |
| 5 | Matrix traceability | `python3 checks/check_screen_state_matrix.py` | SOURCE_CHECKED | 20 FR, 63 AC, 14 NFR, 13 screens with all nine states, 3 Golden Workflows, reciprocal requirement-to-screen mapping |
| 6 | Stylesheet identity and self-containment | `python3 checks/check_css_byte_identity.py` | SOURCE_CHECKED | The embedded stylesheet is byte-identical to `polish.css` in both HTML artefacts, and neither artefact references the network |
| 7 | Syntax | `bash checks/check_syntax.sh` | SOURCE_CHECKED | `node --check` on every inline script and check module |
| 8 | Study assets | `python3 checks/check_study_assets.py` | SOURCE_CHECKED | Both datasets structurally valid and acyclic; every expected answer re-derived from the data; participant and facilitator material proven separate |

Exact tool versions, timestamps, working directory, exit codes and input hashes for the run that produced this package are in `evidence/`.

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
