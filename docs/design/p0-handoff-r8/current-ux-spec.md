# MatterControl R8 — unified UX specification

MC-P0-DESIGN-R8-CONSOLIDATED-FINALIZATION · actual author: Claude Opus 5 (Anthropic) running in the Open Design local session · Priority P0 · status: **AUTHOR_COMPLETE_WITH_VERIFICATION_BLOCKERS**.
Repository `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.
Export revision: **MC-P0-DESIGN-R8-local-20261027-01**. Supersedes R7 (`MC-P0-DESIGN-R7-local-20261027-01`); R1–R7 are retained unchanged as historical packages.

This document is a UX consumer and handoff specification. It does not alter the approved business semantics, the permission matrix, the API contract or the database schema, all of which are owned elsewhere and are read-only inputs here.

---

## 1. What changed in R8, and what did not

R7 was reviewed in full and returned CHANGES_REQUIRED with findings DR7-01..08. R8 corrects all eight and completes the six surfaces that R7 carried as prose only. The selected visual direction is unchanged: **Enterprise Precision A**, selective causal hierarchy B, Comfortable default with Compact opt-in, 14px body text that does not shrink with density, multiline legal content, the selected semantic tokens and the existing icon direction.

| Finding | Correction in R8 |
|---|---|
| DR7-01 · unapproved enum values | `EXPIRED` and `CIRCULAR_CONFLICT` are no longer members of any axis in spec, matrix or prototype. Expiry is presented as an input that makes the evaluator recompute the aggregate; a graph cycle is presented as a validation rejection. `checks/check_vocabulary.py` compares the declared member sets against the approved source exactly. |
| DR7-02 · false causal facts in proof panels | The prototype no longer stores causal prose per record. One `derive` layer computes gates, dependency, root causes, downstream reach and consequence from the typed edges, and every panel reads it. All 24 canonical panels are asserted against their own record and edges. |
| DR7-03 · stale-revision and unknown-outcome UX | A consumer mapping of the **current** contract: 428 for an absent precondition, 412 for a stale one, 422 for key reuse, and two separate unknown-outcome rows for receipted and non-receipted commands. No status the contract does not define appears anywhere. |
| DR7-04 · persona treated as permission | Every screen separates personas, scoped read roles and operation-specific authority. Workspace-scoped operations are decided by the workspace role, never by a Matter role. Denied read and denied mutation are two different screens. |
| DR7-05 · six surfaces unbuilt | SCR-01, SCR-08, SCR-09, SCR-10, SCR-11 and SCR-13 are working screens with their own layout, navigation, fields, actions and high-risk states. |
| DR7-06 · study assets not handed off | Two 50-row datasets with full causal graphs, a participant surface, and a facilitator-only key whose expected answers are derived from the data by a checked-in script. |
| DR7-07 · self-checks that could not fail | A strict mock DOM that refuses to invent an element, retains event listeners, and is exercised by negative mutation tests. Evidence tiers are separated in `validation-plan.md`. |
| DR7-08 · stale revision labels | Every file in this package is labelled R8. The R4 export image remains historical R4 evidence and is not re-cited. Full canonical Golden Workflow sequences are rendered stage by stage. |

What R8 does **not** do: it does not change any approved requirement, rule, state semantic, permission row, acceptance criterion or Golden Workflow sequence; it does not touch `apps/backend`, `apps/frontend`, the ZCode contract or workboard, any formal ledger, or R1–R7; it makes no git mutation; and it claims no rendered, interactive, accessibility or usability result.

---

## 2. Product truth and the five state axes

### 2.1 The five independent axes

Members are exactly those defined in the approved `docs/requirements/state-semantics.md`. No value is added for presentation convenience.

1. **Execution State** — `NOT_STARTED`, `IN_PROGRESS`, `WAITING`, `COMPLETED`, `CANCELLED`. Applies to Requirement, Action and Filing. Progress is asserted by an accountable human.
2. **Verification State** — `UNVERIFIED`, `PARTIALLY_VERIFIED`, `VERIFIED`, `NOT_REQUIRED`, `DISPUTED`. Applies to Requirement, Evidence Requirement and supplied Evidence, and to an Action or Filing where proof is explicitly required. `NOT_REQUIRED` arises only from an explicit applicability decision.
3. **Dependency State** — `READY`, `BLOCKED`. Derived: READY when no incoming gate is unsatisfied. A graph cycle is **rejected at validation**; it is not a third state, and a cycle is never displayed as an accepted graph.
4. **Timing State** — `ON_TRACK`, `DUE_SOON`, `OVERDUE`. Derived under RULE-009 from the declared due date and the as-of time. A record with no due date is visibly unassessed for schedule rather than silently ON_TRACK.
5. **Attention State** — `NORMAL`, `ATTENTION`, `CRITICAL`. Derived under RULE-010 inputs, with the reasons listed.

**Proof expiry** is an input, not a state. When accepted proof loses validity, the evaluator recomputes the subject's verification aggregate and the UI shows the resulting aggregate together with expiry as the recorded reason. Expired proof cannot support VERIFIED even where a prior decision remains historically accepted.

**Graph cycles** are rejected when an edge is proposed. The UI reports the rejection, names the edges that would close the cycle, and leaves the graph unchanged. No record enters a conflict state.

### 2.2 Core invariants the design must never blur

Requirement ≠ Action. Evidence Requirement ≠ Evidence. COMPLETED ≠ VERIFIED. WAITING ≠ BLOCKED, and a record may be both. Receipt ≠ Approval. Upload ≠ acceptance. Assignment ≠ access. Membership is an access relationship, not a sixth workflow state. Terminal execution never erases an unresolved verification or dependency problem.

### 2.3 Historical record versus current evaluation

Where the recorded history and the current policy disagree, both are shown and neither is rewritten. The worked case is `DEP-05`: Atlas reports it **Satisfied** at T0 on the baseline review recorded then; applying the current independent-verification policy to the same evidence — recorded and reviewed by the same identity — evaluates it **unsatisfied**. The gate panel prints both rows and states plainly that they differ. `RQ-03` and `RQ-05` keep their recorded `VERIFIED` aggregate with the self-review caveat attached; nothing is silently flipped to UNVERIFIED without a recorded re-assessment event.

---

## 3. Authority: persona, read scope and operation

Three different things, on every screen, in three separate rows of the authority strip.

- **Persona** is who typically sits at the screen. Lead counsel, filing coordinator, paralegal, auditor. A persona name grants nothing and is never consulted when deciding whether a control appears.
- **Scoped read role** is the Matter role that may read this surface. Scoped OWNER, EDITOR and VIEWER all read the Matter, its records, its documents, its domain history, and may export within scope, with rights rechecked at retrieval.
- **Operation authority** is per operation, read from the approved matrix row for the acting role. The prototype transcribes all 24 rows and asks that table; `checks/check_canonical_dataset_and_proof.py` compares the transcription with the approved file row by row.

**Workspace scope is separate from Matter scope.** Create Matter and Workspace membership are Workspace OWNER operations. A Workspace OWNER has no automatic read of a Matter they are not a member of, and a Matter OWNER gains no workspace authority. The prototype routes those two operations through a workspace role, not through the Matter-role column.

**Denied read and denied mutation are different screens.** A denied read returns a uniform response that is indistinguishable from a record that does not exist: no title, counterparty, file name, document count, legal detail or count of what is hidden. A denied mutation inside a record the role may read keeps the record visible and read-only, withholds only that control, and says which approved row withheld it.

Verification is reserved to an explicitly designated verifier who is a Matter EDITOR or OWNER and is not the submitter. An OWNER is not automatically the verifier. Promotion of an authoritative version, cancellation, reopen, proof applicability, milestone prerequisites, filing rejection and withdrawal, and Matter membership and verifier designation are OWNER-only. EDITOR and OWNER both create and edit Requirements and Actions, assign an Action to an active member in scope, record execution transitions, submit evidence, add a document version, record filing stage observations, bulk edit and import.

---

## 4. Screens

Thirteen screen IDs, unchanged. All thirteen are reachable in the prototype: eleven as their own surface and two (SCR-04/SCR-05 and SCR-07) as the record drawer and its proof context, reached from any record anywhere in the product.

### SCR-01 · App shell, session and Matter access
Session state, accessible-Matter selection, Matter creation and membership administration.

- **Composition.** Persistent header with workspace, Matter and as-of time; a session panel; the accessible-Matter list with its own search; a Matter creation panel; a membership and verifier-designation table.
- **Session specimens.** Active; loading, which names and counts nothing before access is confirmed; expired, which explains that no token was ever held on the device; logout intent, which states that a draft held only in the tab is discarded; access lost while open.
- **Access.** Only Matters with an active membership are listed. There is no affordance anywhere that reveals a Matter the actor cannot read — not a name, an identifier, a count or a "request access to 2 more" hint.
- **Membership.** Role, state and verifier designation per member. A VIEWER cannot be designated a verifier. Revoking the last active OWNER is refused with the transfer-first reason stated inline. Assignment never grants access; revocation removes derived Matter access immediately.
- **Unknown outcome.** Membership commands are not receipted under the current contract. The screen says so, keeps the intent for an actor still permitted to see it, and offers only the authorised re-read as recovery.

### SCR-02 · Control Room
Condition → cause → downstream → accountable owner → permitted next step, in that order.

- **Composition.** Blockers and the critical causal path across the full width, then Next Actions, Important Decisions, Waiting On, Milestones, Evidence Gaps and Changes.
- **The chain is derived.** Root causes are found by walking back through unsatisfied gates; the chain is extended forward through the blocked record with the widest declared reach. Ranking prefers a root that was already unsatisfied in the status Atlas reported at T0, and any equal-reach co-root that exists only under the current policy is named as a co-root, with the consequence spelled out: clearing the named blocker alone would not clear the chain.
- **No vanity.** No readiness percentage, no score, no progress ring. Milestones with no declared prerequisite set read `UNASSESSED`, and say that a due date does not establish readiness.
- **Next Actions.** The eligible count is computed. At Atlas T0 it is zero, and the panel says so rather than promoting a Requirement or a blocked Action into the gap.

### SCR-03 · Operational Grid, with My Actions and Waiting On
- **Composition.** Search, type, sort and fixture controls; a live match count; an explicit selection line naming the exact selected IDs and any that the current filter hides; a dense multiline table with sticky headers; a card stack below 640px.
- **Search scope matches reality.** The field says it searches record ID, title in either language and internal owner, and that is exactly what it searches.
- **No match is local.** The reset control clears this grid's own search and filters and stays on this grid. It never redirects to another screen. Every screen with a filter has its own reset with the same rule.
- **Density.** Comfortable 44px rows by default, Compact 36px opt-in. Body text stays 14px in both. Selection, filter, sort and scroll survive a density change.
- **My Actions** groups the session actor's Actions by eligible, waiting, blocked and completed, with the blocking cause derived from the edge rather than written per record. A record that is both WAITING and BLOCKED appears in both groups, and the screen says why.
- **Waiting On** keeps the internal accountable owner visible beside the external party, and states that WAITING is not BLOCKED where the dependency is READY.

### SCR-04 / SCR-05 · Requirement and Action drawer
State pills for all five axes with the reason under each; owner, workstream, due and revision; incoming and outgoing gates with the reported-at-T0 and current-policy columns; the proof entry point; a draft editor for roles that may edit, or the denied-mutation panel for roles that may not; and the recovery protocol for the conditions that apply to this operation.

The drawer keeps a causal trail: origin screen, every record visited, and the proof context as its own node. Back returns to the previous node with its mode restored. Escape, backdrop dismissal and the close button all run the same cleanup and return focus to the element that opened the drawer, or to its replacement after a re-render.

### SCR-06 · Dependency and impact
Gate type, condition, cause, downstream impact and permitted next step, reachable from the Control Room chain and from any record's gate list. Ordinary edges are EDITOR or OWNER; milestone required prerequisites are OWNER only. A proposed edge that would close a cycle is rejected with the offending edges named.

### SCR-07 · Evidence and proof context
Criterion and exact version; recorded-by against reviewed-by with self-review called out when they match; the aggregate on the subject with the current-policy evaluation beside it; causal consequences derived from the typed edges; and the incoming and outgoing gates in full. Where the fixture supplies nothing, the panel says so. It never converts an absence of data into a negative fact about the product.

### SCR-08 · Documents, versions and signatures
- **Lineage table.** Every version with status, the event that added it where one is recorded, what superseded it, and what references it — distinguishing a fixed reference to an exact version from one that follows the current version.
- **Signature completeness** is evaluated against the exact version. One of two signatures is shown as one of two.
- **Add version** is EDITOR or OWNER and never promotes.
- **Promotion** is OWNER only and requires three things together: the expected current version as a concurrency guard, a reason, and an acknowledgment of the stated impact.
- **States.** Stale snapshot while open; promotion denied for this role; a superseded version still referenced, which is correct and is explained rather than "fixed".

### SCR-09 · Filing tracker
- **Stepper** over the nine approved stages, with the stage shown as its own axis beside execution and verification.
- **Package checklist** where an undeclared criterion reads as undeclared, never as satisfied and never as not-applicable without a recorded applicability reason.
- **Submission, receipt and outcome** are three separate observations. An absent outcome is shown as absent, with the receipt-is-not-approval rule stated.
- **Accountable wait** names the authority and the internal owner who remains accountable while waiting.
- **Declared paths**: the Atlas actual; two supplement/response cycles, each with its own request reference, requested items, owner, due date and distinct responding version; the no-supplement alternative as a first-class path; and rejection, withdrawal, correction and reopen, each OWNER-only and none of them an approval.

### SCR-10 · Bulk metadata editor
Exact selected IDs and the count hidden by the current grid filter, stated as in scope regardless. Four allow-listed fields, each with Unchanged as the default, Set, and Clear where clearing is permitted — with the reason printed where it is not. A per-row before-and-proposed preview. Row-atomic results separated into succeeded, failed and unknown, whose counts sum to the selection. Failed rows keep their drafts; unknown rows keep the attempt identity and block retry until reconciliation returns an answer.

### SCR-11 · Structured import
Four steps: file intent, mapping, grouped validation, result and recovery. A connected group whose row has an out-of-scope reference is rejected whole and names the offending cell; independent valid groups are unaffected. Duplicate, changed-content and invalid-value rows are reported separately — a changed-content conflict is never resolved by overwriting. An imported verification claim stays a claim. No formula, macro or embedded link is evaluated, and a value beginning with `=`, `+`, `-` or `@` is literal text on both import and export.

### SCR-12 · Draft status brief
What changed in (t1, t2] stays separate from what is outstanding at t2. An invalid window produces an error and no report. Outstanding at a t2 other than the supplied snapshot is reported as unavailable rather than inferred.

### SCR-13 · Scoped event history
Append-only timeline with actor, recorded and effective time, reason, before and after, correlation id and causal link; its own search, entity filter and paging, each with its own reset. Restricted security entries live on a separate surface with their operational detail withheld; they are never mixed into the domain timeline and never travel with a domain export. No role may edit or delete a prior entry; a correction appends.

---

## 5. The nine states, per screen

Every screen carries loading, empty, no-match, unavailable, forbidden, stale, precondition or concurrency failure, partial success and recovery. The rules are the same everywhere:

- **Loading** names and counts nothing before access is confirmed, and shifts no layout.
- **Empty** means this scope genuinely holds nothing. No placeholder row is drawn.
- **No match** is this screen's own filter, resettable on this screen, and says that records still exist.
- **Unavailable** states that something could not be evaluated and defaults nothing to READY, zero or OK.
- **Forbidden** keeps the read, withholds the one control, and cites the row that withheld it.
- **Stale** preserves the draft, compares only readable fields, and offers refresh-and-rebase.
- **Precondition or concurrency failure** distinguishes absent (428) from stale (412), because their recovery differs.
- **Partial success** counts and names succeeded, failed and unknown separately.
- **Recovery** restores the draft, rebases, reconciles anything unknown, and only then re-enables the command.

---

## 6. Error and recovery mapping

A UX consumer mapping of `docs/implementation/p0-zcode-execution/local-contract.md` revision 4. It defines nothing on the wire.

| Condition | Status | User message | Retained or purged | Permitted recovery | Disabled |
|---|---|---|---|---|---|
| CAS write with no precondition | 428 | Needs the version you are editing against; nothing changed | Draft retained | Reload, resubmit | Nothing |
| CAS write with a stale precondition | 412 | Someone else changed this; your draft is kept | Draft retained | Refresh and rebase, then a new command | Overwrite and force-save are not offered |
| Same key, different fingerprint | 422 | A different change under an earlier attempt's identity | Draft retained | New attempt with a new key, or read the earlier receipt | Resend under the old key |
| Precondition on a non-CAS operation | 400 | This operation takes no version precondition | Draft retained | Resubmit without one | Nothing |
| Receipted command, response lost | 503 outcome-unknown, receipt available | May or may not have been recorded; we can check | Draft and attempt key retained | Read the receipt, or retry the identical attempt under the same key | Retry under a new key |
| Non-receipted membership command, response lost | 503 outcome-unknown, no receipt | Outcome stays unknown until an authorised reader confirms | Intent retained for an actor still permitted to see it | An authorised re-read; re-issue only if it shows the change absent | Automatic resend |
| Revoked actor loses readback | 503 outcome-unknown, readback lost | Access ended; we cannot tell you what happened | Protected values and draft purged | An authorised owner confirms from their own read | Resend, export, download, and showing what was typed |
| Denied read | 404 uniform | No record is available at this address | Nothing to retain | Return to the accessible list | Any disclosure of what exists |
| Denied mutation in a readable record | 403 | Your role does not permit this change | Draft retained locally while read rights hold | Ask an authorised role; continue reading and exporting | Only that control |
| Evaluator unavailable | 503 unavailable | We are not showing a readiness answer we do not have | Draft retained | Retry the read | Controls depending on the missing evaluation |
| Domain conflict on a W2+ operation | DEPENDENCY_PENDING | The business condition, with the draft kept | Draft retained | Consume the status when the contract revision adds the operation | No status is guessed |

A later state, and a subsequent 412, never establish what an earlier command did. A permitted read never unlocks a blind retry.

---

## 7. Golden Workflows

All three canonical sequences are rendered stage by stage in the prototype's walkthrough, each stage naming the screen a user works on, what is recorded, the Atlas excerpt that illustrates it, and the guard that stage must not violate. Atlas excerpts are marked as examples; they do not stand in for the journey.

- **GW-01 · AC-161** — Approval → Document → Signature → Payment → Transfer → Closing → Filing → Post-Closing.
- **GW-02 · AC-162** — Request → Document → Review → Gap → Finding → Follow-Up → Resolution.
- **GW-03 · AC-163** — Requirement → Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement → Response → Approval.

Stages the Atlas snapshot does not reach are labelled as not reached. No progression is simulated into a success.

---

## 8. Interaction, density, responsiveness and accessibility intent

Stated as design intent. None of it is a measured or observed result; see §10.

- **Keyboard.** Tab and Shift+Tab through the document order; arrow keys and Enter on a focused grid row; native keys inside a nested input, textarea or select; Escape closes the drawer and returns focus. The row handler acts only when the row itself holds focus and yields entirely during IME composition, so a nested control is never hijacked.
- **Focus.** A 2px focus ring at the selected blue with offset, white on the dark header. Selected, hover and focus are three visibly different row treatments. Hover never reduces text contrast.
- **Drawer.** The navigation bar is sticky at the top of the drawer, so Back and Close stay reachable in long content. Below 640px the drawer is full-screen and the sticky offset follows the reduced padding.
- **Density.** Comfortable 44px, Compact 36px, body text 14px in both.
- **Touch.** 44px minimum control and checkbox targets below 640px.
- **Language.** Legal titles and reasons render in full in Vietnamese and English, both by default and either alone through the language control. Nothing is truncated to fit; rows grow.
- **Motion.** Only a background-colour transition on hover, suppressed entirely under `prefers-reduced-motion: reduce`.
- **Colour.** Every state carries text and a reason. Colour never carries meaning alone, and a disabled control keeps a readable reason rather than relying on opacity.

---

## 9. Implementation bindings for ZCode

The actual inventory under `apps/frontend/src/components/` is atoms, molecules, organisms and templates; see `zcode-handoff.md` for the per-screen binding. Domain screens and state orchestration belong under `src/features/*`. No intermediate duplicate UI layer is introduced and no component or library is invented.

---

## 10. What this specification does not establish

The browser is unavailable in this session: no browser, renderer, screenshot or capture tool is present in the tool environment, and no CLI browser, alternate browser, native capture, export command, server, proxy or settings change was used to work around that. Consequently every visual, geometric, interactive, assistive-technology and usability statement above is **VERIFICATION_BLOCKED**, recorded case by case in `validation-plan.md`. Rendered quality is not inferred from CSS, from R4 screenshots or from mock DOM execution. The AC-137 trial is NOT_RUN. Nothing in this package is a product result: nothing was saved, verified, submitted, exported or enforced, and no acceptance criterion is marked PASS from a design artefact.
