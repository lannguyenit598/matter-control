# MC-003A Local R1 interaction and token guidance

## Local R1 corrective contract — 2026-10-25

Owner: Local Codex under explicit local remediation authorization. This revision preserves the original export in ../../export and Git cef67c4. No OpenDesign Cloud execution occurred for this revision. Parent MC-003A remains REWORK_REQUIRED; internal critiques complete, formal independent QA PENDING_PROVIDER_ACCESS and design approval NOT_GRANTED.

This section and interaction-guidance.md specify the current corrective interpretation. Original source claims about missing normative inputs are superseded by direct comparison with approved requirements, without claiming full runtime conformance. The three journeys remain connected exploratory slices, not all product features.

- RULE-013 P0 bulk allowlist: title, description, assigned internal owner, due date. No workstream, type, links, state, criteria, roles, verify, waiver, promotion or delete. Every field initially unchanged; empty demo inputs mean unchanged, not clear. Commit rechecks row revision/permission; per-record atomic metadata+audit, independent valid rows may succeed, rejected rows unchanged with reason/retry. Results retain success/failure and before/after after successful rows deselect. RQ-10 conflict and RQ-12 denied are synthetic failure scenarios, not actual role policy. Demo title/description bounds 240/2000 are illustrative validation limits, not new approved product limits.
- RULE-003 edge = upstream dependency READY AND execution COMPLETED AND (completion edge OR VERIFIED with valid proof). NOT_REQUIRED never satisfies proof edge. RULE-008 milestone = every explicitly required Requirement READY AND COMPLETED AND (VERIFIED with valid proof OR explicitly valid NOT_REQUIRED); no required set = UNASSESSED. No demonstrated runtime verification bypass is alleged against the original.
- RULE-005/006: review exact criterion + evidence/version + validity + designated independent EDITOR/OWNER + rationale. OWNER alone is insufficient. No applicable criterion plus no unresolved dispute and reasoned OWNER process precedes NOT_REQUIRED. Upload does not verify. In this revision new acceptance stays disabled where designation/validity/components are incomplete; rationale field is a concept specimen, not stored review history.
- RULE-014: validate type/dates/scoped refs/source keys/duplicates; invalid dependency-connected group rejected whole, valid independent groups may succeed. Same source/key/content retry deduplicates; changed content conflicts. Imported VERIFIED is a claim, current proof starts UNVERIFIED. Parser/storage/error transport remain architecture choices.
- RULE-015/016/017: active workspace + explicit Matter + permitted role. OWNER/EDITOR/VIEWER may read/export scoped data; assignment never grants access. Recheck retrieval rights, escape formula-leading export text, no hidden scope leaks. P0 brief is draft view/export with t1≤t2, changes (t1,t2] separate from outstanding t2, stable event-time/order/references, explicit no-change; P1 owns managed issued snapshots. Transport/storage/format remain architecture dependent.
- Canonical Atlas: 24 labels, owners U-01/02/03, due instants, execution/verification, workstreams and seven dependency edges come from dataset §4/5. Supplied evidence EV-01/03/05/06/10 map ER-01/03/05/06/10; no supplied closing draft evidence is invented. Historical EV-03/05 self-review conflicts with later policy: preserve historical fixture, disclose discrepancy, prohibit new self-review. Historical T0 VERIFIED records are not proof of current policy enforcement; RQ-03/05 cannot satisfy a new proof edge until independent review establishes valid proof. DOC-03 current v3 is only 1/2 signed. FIL-02 receipt lacks outcome.
- Synthetic DEC-AT-01/02 remain OPEN case questions, separate from governance DEC-* and design UX-DEC-*. They do not require real PO approval as product policy. FD-01 and RISK-AT-01 use canonical IDs. Missing decision/risk owner/outcome remains visibly not supplied.
- All five axes retain text, applicability and reasons: execution, verification, dependency, timing, attention. Timing uses explicit +07 as-of/48h; terminal monitoring ON_TRACK preserves history, no due is visibly unassessed. Critical chain labels are designated fixture inputs, not legal severity inferred from text. Unknown evaluator data stays unavailable. Backend computation/enforcement is not implemented.
- RULE-021 Next Actions are assigned visible Actions NOT_STARTED/IN_PROGRESS + READY, critical-chain first then due then stable ID. At canonical T0 none qualify: remaining NOT_STARTED Actions are blocked. WAITING AC-04/05/10 stay Waiting On, respectively internal U-01/U-01/U-03. Requirements such as RQ-06 are not candidates. Follow-up is a separate explicit Action.
- RULE-008 milestones MS-01/02/03: required-Requirement sets not supplied, show UNASSESSED and unavailable counts; countdowns alone are not readiness. No prerequisite sets invented from workstream membership.
- Three canonical workflow maps and negative/repeat filing outcomes are in interaction-guidance.md and HTML local-r1-contract. Nine screens/partials have some interaction; Matter List, My Actions, Waiting On, Filing Detail remain specification-only. Import/upload/review have mock feedback without aggregate mutation. No production API/auth/persistence/audit/concurrency implementation is claimed.
- Grid: representative inline title editor Enter commit/Escape cancel, invalid input retained with local reason; row Up/Down/Enter/Space ignores nested controls. Copy/paste and full cell navigation remain specification-only. 50/100/200 DENSITY rows are non-Atlas filler, not evidence of realistic scale performance. Context drill-down names origin and has return-to-object/tab; matter-wide linked panels do not imply every row belongs to RQ-04 chain.
- Mobile removes first-eight matching-row truncation; all filtered rows generated. Advanced bulk stays a proposed desktop interaction, not approved full mobile scope. Reachability and usability remain NEEDS_CLARIFICATION pending rendered tests. Touch application navigation/dialog/filter targets use a 44px draft minimum, not a universal WCAG assertion.
- Miniature boards retain scale; Grid has 14px body, 12px metadata, readable reference specimen, multiline rows grow. Typography/focus/selected/disabled/error tokens remain a draft proposal; no rendered contrast/zoom/WCAG/usability PASS. VISUAL_VALIDATION_NOT_EXECUTED.

## Three connected slices and canonical step coverage

| Workflow | Canonical steps | Existing representation / limits |
|---|---|---|
| GW-01 | Approval → Document → Signature → Payment → Transfer → Closing → Filing → Post-Closing | RQ-01/02, DOC-03, RQ-06, RQ-07/AC-07, RQ-08/AC-08, MS-02, FIL-01, RQ-11/12; chain/detail/version demonstrations. Transfer/closing, post-closing and filing transitions are specification-only. |
| GW-02 | Request → Document → Review → Gap → Finding → Follow-Up → Resolution | RQ-04/ER-04 request, DOC-02, RQ-03/AC-03 review, ER-04 gap, FD-01, AC-04, independent new-proof review; import is supporting intake, not a replacement for Request. Resolution not executed. |
| GW-03 | Requirement → Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement → Response → Approval | RQ-09/10, DOC-05, applicable signature criteria, exact submitted versions, EV-10 receipt, FIL-02 waiting EP-03. Supplement repeats with distinct references; actual outcome and independent review required. Rejection/withdrawal OWNER CANCELLED with evidence/reason; never silently Approval. Detail/stage mutation is specification-only. |

## One coherent draft application token system

Use mc-* for application; paper/ink/line for review-document chrome; direction boards retain their own illustrative palettes. Do not copy three themes into production. Existing light seed remains provisional, not PO-selected direction.

| Role | Draft value / use |
|---|---|
| Body / secondary / heading | 14px/1.5, 12px/1.5, 24px/1.25; Vietnamese diacritics and fallback fonts require render checks |
| Space | 4px unit; 8/12/16/24px roles |
| Execution | --mc-execution #364152; neutral terminal progress, never proof green solely for COMPLETED |
| Verification | --mc-verification #236341; VERIFIED text + proof context; other verification states retain exact text |
| Dependency | --mc-dependency #8a2925; BLOCKED reason; READY is derived, no force toggle |
| Timing | --mc-timing #775317; explicit deadline/as-of and 48h policy |
| Attention | --mc-attention #783e14; named causes, no inferred legal severity |
| Focus / selected / error / disabled | #174ea6 2px outline; #e8effa selected background; #a12622 invalid border + local reason; #626973 disabled text + reason |
| Hit areas | Draft 44px touch for navigation/dialog/filter controls; desktop compact controls assessed separately, no universal WCAG claim |

Color is supplementary, not an axis collapse; equal colors may be shared only if labels/reasons remain distinct. Existing hardcoded miniature styles remain illustrative and are not an implementation token contract. Contrast, focus clipping, touch geometry and zoom are unmeasured.

## Minimum rendered validation backlog

At 1440/1280/768/390/360 widths and 200% zoom: long Vietnamese labels; multi-line rows; scroll header alignment; mobile last matching row; empty-query reset; keyboard nested-control preservation; arrow row focus; invalid inline title recovery; drawer return after filter/rerender; all selected/disabled/error states; screen reader and contrast measurement. Do not use static detector counts as results.
