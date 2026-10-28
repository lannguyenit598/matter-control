# MatterControl R3 — current UX specification

Task MC-P0-DESIGN-R3 · P0 design prerequisite · actual author Codex, Local Codex · source proposal, independent review pending. Consumer actual ZCode when the relevant wave is activated. This package supersedes contradicted R1 proposals only; approved requirements and frozen local-r3 remain higher authority. Product positioning/discovery and D-UX01..04 remain settled.

## Scope and evidence

This is an exploratory source prototype and coherent interaction specification, not product implementation, authentication, backend guards, file handling or persisted legal operations. Prototype controls change local viewing/draft state only; no business-success toast substitutes for a command result. HTML/CSS are the exact reviewable export; browser/render/focus/touch/accessibility and user studies remain NOT_RUN. W1/W2 below are detailed consumer contracts, not execution activation.

Design stays Enterprise Precision A; selective B causal impact rail, optional C Compact. Humanist sans application stack, body 14px/1.5, metadata 12px, heading 22px; 4px spacing; 44px Comfortable / 36px Compact minimum rows grow for multiline legal text; Compact changes spacing, never font size. Palette comes unchanged from frozen local-r3 design-tokens.json. No marketing hero, KPI, readiness percentage, new font/theme/library or ornamental motion.

## Product truth and applicability

Requirement is a condition; Action is work; a Requirement may have zero or multiple Actions. Criterion is a demand for proof; Evidence is supplied proof. Completion never auto-verifies. WAITING is execution, BLOCKED dependency; either can coexist with the other axis. Membership is access, not another state.

Execution applies to Requirement/Action/Filing. Verification applies to Requirement/criterion/evidence and to Action/Filing only with explicit proof applicability. Dependency applies to Requirement/Action; Filing guards through linked records, not a freely mutable sixth Filing badge. Timing/attention apply to Requirement/Action/Filing under their own inputs. Document authoritative version and signature completeness are observations, not execution/verification aliases.

Completion edge = upstream dependency READY AND execution COMPLETED. Proof edge additionally needs VERIFIED with currently valid accepted proof; NOT_REQUIRED does not satisfy a proof edge. Milestone = all explicit required Requirements READY AND COMPLETED AND (valid VERIFIED OR explicitly valid NOT_REQUIRED). No declared set means UNASSESSED and counts unavailable. Missing evaluator results stay unavailable, never READY. Reversal/reopen re-blocks downstream claims without rewriting execution/history.

Execution transitions remain the full approved table: NOT_STARTED→IN_PROGRESS when READY; NOT_STARTED→WAITING with waiting party or condition, reason and accountable internal owner; NOT_STARTED→COMPLETED for already-performed work with attestation/time/reason and READY. IN_PROGRESS→WAITING or guarded COMPLETED; WAITING→IN_PROGRESS/COMPLETED requires response/condition, READY and retained waiting history. OWNER alone may cancel nonterminal work with reason or reopen COMPLETED/CANCELLED→IN_PROGRESS with reason. Reopen may coexist with BLOCKED and resets proof unless explicitly NOT_REQUIRED. All unlisted transitions reject; no terminal→NOT_STARTED or COMPLETED→CANCELLED erasure. Business waiting information does not settle two universally required wire fields.

Verification is derived from exact criterion/version reviews: applicable unresolved dispute first; explicit no-proof applicability next; all valid mandatory proof accepted→VERIFIED, some→PARTIALLY_VERIFIED, none→UNVERIFIED. Zero unspecified criteria stays UNVERIFIED. Only designated independent EDITOR/OWNER may accept/reject/resolve; submitter cannot self-review, OWNER role alone insufficient. OWNER applicability revision cannot bypass dispute resolution or directly turn VERIFIED/PARTIAL/DISPUTED into NOT_REQUIRED. Preserve criteria and review history; add criterion to NOT_REQUIRED first revokes to UNVERIFIED. Expiry/rejection/withdrawal/supersession recomputes appropriate aggregates; fixed-version proof is not invalidated just because another version becomes current.

Timing uses explicit as-of and timezone: nonterminal due before as-of OVERDUE; due in [as-of,as-of+48h] DUE_SOON; otherwise ON_TRACK. No due remains visibly “no due date”, not schedule health. Terminal active monitoring ON_TRACK does not erase lateness. Attention shows named causes, with critical designation/chain inputs; do not infer legal severity from a document title.

## W1 — authenticated foundation and typed Requirement

SCR-01 begins as neutral shell, identity/session state and accessible Matter list. Active Workspace AND explicit Matter membership AND operation permission are required at every read/write/retrieval. Workspace OWNER can create Matter and grant initial owner but cannot automatically read every confidential Matter. Assignment never grants access. VIEWER may read/export within Matter scope; EDITOR/OWNER create/edit ordinary records. OWNER manages membership/verifier designation, critical milestone sets, cancellation/reopen/applicability and authoritative version promotion. Last active OWNER cannot be removed before transfer. External party is context, never implied login.

Flow W1-A: open authorized Matter list → select Matter → show scope/role/as-of → choose “Create Requirement” → enter condition title/outcome, workstream, accountable owner, optional due and relationships → review typed summary → send only after current validation/revision contract available → pending disables duplicate command → accepted response plus scoped readback shows typed detail/history. No Action required just to create a Requirement. Decision/Finding/Risk remain typed basic contexts when needed, not arbitrary JSON tasks. Exact schemas/field presence/limits/routes/auth producer remain DEPENDENCY_PENDING.

Field behavior: persistent labels and associated hint/error; required title cannot be whitespace; due is explicit instant/timezone rather than guessed machine date. Owner options only active authorized Matter members. Foreign references reject without leaking inaccessible metadata. Keep field values and focus first invalid field; announce error summary linking fields. Preview is not a persisted result. Successful create reveals resource identity and attributable event from server, not from client-generated state.

SCR-04 detail: condition title/type, separate applicable axes, owner/due/as-of, why blocked, explicit criteria versus supplied proof, zero/multiple linked Actions, dependency list, versions and history tabs. Ordinary metadata update keeps draft outside transient Dialog child mount. OWNER critical commands get a consequence/reason review and authoritative recheck; READ/VIEWER sees clear reason/allowed read path. Do not expose critical command solely because a button is present.

SCR-13 history shows actor, target, before/after, effective and recorded times, reason, causal source and batch correlation, with authorized relation paging. Empty filter differs from no domain events. A failed mutation never creates successful domain history. Corrections append links; no normal role edits/deletes past history. Denied attempts belong to restricted security audit, never ordinary Matter history with secret details.

W1 acceptance: two users/two Matters, stale resource, changed role/revocation during create/read/history/retrieval, cross-Workspace IDs, last-owner transfer, accepted retry without duplicate effect, missing response then reconciliation. Exact readback/event evidence must be supplied later. Accepted source base, auth/wire/receipt and independent design/review gates still block activation; W1 is not runnable from this document alone.

## W2 — operate with context

SCR-03 Grid columns: identity + full legal title/type/workstream; execution; applicable verification; dependency with cause link; due/timezone; accountable owner; timing; attention. Unknown values show “unavailable”; explicit zero is zero; absent due says no due; “not applicable” never masquerades as unavailable. Row height grows, no ellipsis on title/reason/error. Selected/hover/focus have distinct treatments. Desktop identity remains readable and table scroll stays inside its labelled region; mobile uses full matching-record list with labelled axes and full-screen detail, including last row.

Grid navigation flow: scope → search/type/workstream/owner/exception filter → explicit sort → range/page → select exact IDs → open typed detail → edit → return. Search/filter changes reset page to first but keep known selected IDs in an explicit tray; hidden selected IDs are listed before bulk, never added by “all matches”. Page selection targets visible page only; global selection requires an adopted explicit scope and is not implied. Sort ties by stable ID. Changing sort/page/density does not discard drafts or select unseen rows. When an edited row stops matching, retain feedback and labelled origin/fallback focus instead of silently moving the user.

Representative editor: Enter/F2 enters field editing; input owns text arrows, Home/End, Space and composition keys. Escape cancels local edits only after explicit draft handling; Enter validates and proposes send; validation retains text and associated announced error. Row navigation only owns arrows when focus is on the row; a nested control never bubbles into row shortcuts. Full spreadsheet copy/paste/multi-cell editing is specified for later activation, not implemented by this prototype.

SCR-05 Action detail has work description, internal assignee, due, explicit parent/context links, independent dependency/execution and proof applicability, waiting relation/history and allowed transition controls. Contributors can edit any scoped permitted work, not only assigned work. Start/complete reads current gates; response does not auto-complete Requirement. OWNER reopen shows downstream exposure and retained completed history. Rejected transition retains draft/reason and gives an allowed alternative without forcing READY.

SCR-06 dependency inspector: condition → unsatisfied gate and upstream proof → downstream work → internal accountable owner → permitted step. Accessible edge table equals any diagram; exact gate, source/target, failure reason and as-of readable by keyboard/touch. Add/change/remove ordinary edges only EDITOR/OWNER, same Matter, explicit gate/reason, no self/duplicate/cycle. OWNER milestone required sets separate. Unknown relation pages/evaluator are incomplete, not empty. Concurrency rejects entire invalid edge command.

My Actions (SCR-03 subview, FR-010) is a real actor-scoped queue, not a replacement FR identity: eligible Actions, Waiting On and blocked Actions are separate sections; no Requirements in eligible list. RULE-021 candidates are visible assigned NOT_STARTED/IN_PROGRESS + READY, critical chain first then due/no due last then stable ID. No candidate explains waiting/blocker/unassigned as applicable. Waiting On subview lists party OR condition, reason, internal owner, follow-up due and linked context; age unavailable if waiting-since not supplied. Respond/resolve uses dedicated guarded commands; create explicit follow-up Action if needed, no automatic external messaging or “acknowledge status” mutation.

Milestone definition opens from SCR-02/06: OWNER chooses explicit required Requirements, reviews change impact/reason, rechecks revision, then server computes predicates. A VIEWER sees reasons; missing required set gives UNASSESSED, no satisfied/total. External party editor in Action/Filing context keeps typed party separate from Entity reference and user/owner. Date/attention labels use returned reasons and explicit clock; no optimistic readiness.

## Conflict, uncertain writes and recovery

Every command uses current accepted authorization and affected resource/scope revision. Governance Git SHA is source provenance, never resource ETag. Stale conflict keeps local draft and only compares current values still permitted; refresh/rebase, review changes and issue a new command against the adopted current revision. No unconditional Overwrite control.

Missing response/timeout is OUTCOME_UNKNOWN, not failed. Preserve intent, target IDs and correlation allowed by adopted contract, suspend resend, reconcile with receipt/outcome/readback mechanism. If reconciliation unavailable or permission lost, keep unknown/pending and direct user to permitted recovery; do not duplicate operation. Known rejected rows can be retried only after revalidation; accepted operation retry returns same outcome without duplicate audit effects. Wire receipt/envelope/ETag/error codes remain DEPENDENCY_PENDING until architecture adoption. Prototype recovery controls merely expose this specification and never simulate authoritative receipt success.

Revocation clears protected rendered values, byte links, comparisons and sensitive drafts from client memory; do not export a revoked draft to rescue it. Preserve only non-sensitive pending-operation status if contract permits. Navigation with authorized unsaved work offers Stay / Keep local draft / Discard explicitly; closing a transient view is not discard. Prototype drafts live in memory until reload, no persistent storage promise.

## W3 — review and versions

SCR-07 flow: criterion/components and applicability → supplied proof/exact version → submitter/recorded time → designated reviewer and separation → validity/current-versus-fixed rule → rationale and consequences → guarded review → authoritative readback and causal impact. Missing proof remains criterion-only; request/submit new proof is permitted alternative, not blank attachment. Historical EV-03/05 self-review stays disclosed and cannot establish new independent acceptance. Do not invent EV-04; ER-04 has no proof.

SCR-08 flow: document identity → version lineage → exact content reference → signatures as observations on that version → OWNER promotion review (prior version/reason/impact) → accepted authoritative version and affected current-version criteria. Upload creates distinct version only, not promotion, completed signature or verified proof. If required bytes/validity unavailable, review cannot conclude. Replacement evidence is new record; preserve prior review. Dispute requires reason, only designated independent verifier resolves, with expiry/withdrawal/reversal readbacks. File/storage limits/provider remain dependencies.

## W4 — filing without invented legal effect

SCR-09 uses Requirement → Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement → Response → Approval, with Response→Authority Review and repeat cycles. Stage names are business labels, not adopted technical enums. Package scope/owner/criteria first; identify exact versions and satisfy non-signature preparation before Signature. Submission needs all applicable package/signature criteria plus actual reference/time/version set. No-signature requires explicit OWNER applicability reason. Receipt needs actual acknowledgement; authority wait retains party and internal owner. Supplement appends a new request/owner/due/cycle; Response identifies requested items, exact new versions and response reference; waiting resumes. Approval observation needs actual outcome proof and can be COMPLETED/UNVERIFIED until separate review. Upload alone never records authoritative stage.

Cycle timeline preserves original submission and every distinct request/response. Two synthetic cycles required in VAL-GW-03; canonical FIL-02 has no such cycles at T0. OWNER rejection/withdrawal is explicit CANCELLED outcome/reason/proof, requirement unmet; correction appends history, reopen retains prior approved observation and proof epoch. ARCH-Q5 does not impose a fresh authority decision just because owner reopened: architecture must bind current review to approved observation/version/epoch interpretation, not invent another authority event. Exact cycle/schema/API binding is DEPENDENCY_PENDING.

## W5 — understand and trace

SCR-02 order is Blockers → Next Actions with Important Decisions adjacent → Waiting On → Milestones → Evidence Gaps → Changes; Finding/Risk context follows. Largest region is causal chain, not vanity metric. Each node shows condition/cause/downstream/accountable owner/permitted step. Unknown Decision owner/outcome stays not supplied. Read views use consistent authorized snapshot/revision/as-of; partial region failure is visible. No critical badge from risk narrative alone.

Canonical T0: 24 rows, 12 Requirements + 12 Actions; Actions 4 COMPLETED, 3 WAITING, 5 NOT_STARTED, 0 IN_PROGRESS. No eligible Next Action: AC-07/08/09/11/12 all BLOCKED; WAITING AC-04/05/10 have internal owners U-01/U-01/U-03 and belong to Waiting On. AC-05 may be WAITING and BLOCKED. RQ-06 is not an Action. MS-01..03 have no declared required sets: UNASSESSED and counts unavailable. Due is not readiness. Historical fixture assumptions and EV-03/05 self-review remain historical caveats; new tests use separately labelled synthetic fixtures.

Trace flow keeps Matter, origin view/tab, filters, sort, page, selected IDs, source as-of, scroll and focused row/cell: blocker→causal detail→Requirement/Action→criterion→exact proof/version→return to record tab→origin. If row removed by filter, return to labelled list heading with context notice. If revoked, purge protected origin and return to neutral authorized scope.

## W6 — bulk, import, export and handover

SCR-10 allowlist exactly title, description, assigned internal owner, due date. Each field starts Unchanged; Set is explicit and Clear is a separate choice only when adopted validation permits (title/owner not empty). Empty text is not implicit clear. Preview exact selected IDs, before/proposed values within rights, changed fields, unchanged fields and each rejection. Recheck rights/revisions per record; accepted per-record metadata+audit atomic. Persist result rows and failed drafts; unknown outcomes reconcile before retry; partial result is not all-success toast. No bulk type/links/waiting/state/criteria/role/verify/waiver/promotion/delete.

SCR-11 import: choose synthetic source → type/column mapping → date/source-row-key/scoped-reference/group/duplicate validation → preview exact independent and connected groups → confirm scope → authoritative per-group results. Invalid connected group rejects whole; valid independent groups can succeed. Same identity/key/content retry deduplicates effects, changed content requires explicit reconciliation, no fuzzy merge. Imported VERIFIED remains original claim with current proof UNVERIFIED. No formula/macro execution or embedded link fetch. Errors remain mapped to source row/group, failed drafts recoverable, unknown writes not automatically re-imported.

SCR-12 export subview: explicitly review Matter/filters/scope/as-of/timezone and state/version fields; VIEWER is permitted in scope; recheck generation/retrieval rights, no hidden counts/filenames/errors. Spreadsheet formula-leading text literal, no new library selected. Empty export identifiable. Status Brief is draft view/export only: choose t1≤t2; separate changes recorded in (t1,t2] from outstanding at t2; exclude event at t1, include event at t2; t1=t2 gives no changes; stable recorded-event time then stable event order and references. Effective time also visible, never silently substitutes for recorded time. Source data missing recorded-time field is a dependency; prototype Atlas time narrative is labelled illustration, not authoritative recorded-time report. Same authorized revisions/window produce same facts; changed rights/source identified. No managed issued-report archive/snapshot P1.

## Interaction contract

All screen-specific states and roles appear in screen-state-matrix.json and the inventory below. Cross-screen: named text controls; Tab/Shift+Tab follow DOM order; persistent visible reasons outside disabled controls; links/buttons for reasons are touch/keyboard reachable, never hover-only. Field errors are associated and announced through polite status/error summary; preserve entered values. Loading uses quiet shape skeleton/aria-busy; no shimmer. Full/zero/empty-filter/missing/not-applicable/unavailable are distinct.

Production Grid keyboard model: row focus arrows move rows; Tab enters named cell/control; Enter/F2 edits; input retains text-navigation and IME; Escape cancels editor before any dialog close. Prototype uses ordinary table buttons/inputs and row arrow shortcuts only; it does not claim complete ARIA spreadsheet behavior. Sort/page/filter announce range without stealing focus; density preserves selected IDs, draft and focused object. Dialog: native modal top layer, named heading, initial heading/first relevant control, trap Tab, Escape routed through draft handling, return exact opener; if opener absent, list heading fallback. Rationale is not accidentally discarded on backdrop. Prototype dialog does not close on backdrop; draft retained in page memory.

Mobile retains every matching P0 record, reasons, permission and simple metadata/observation paths; full-screen detail with back returns list position. Complex bulk/import/comparison use staged summary/detail/review flow with explicit desktop continuation alternative carrying authorized draft/scope when adopted, not a role ban or feature deletion. Tablet collapses navigation and secondary rail before content clips. At 200% zoom preserve meaningful reading order and keyboard reach; long English/Vietnamese labels wrap. Rendered geometry, keyboard trap/focus return and touch measurements NOT_RUN.

Lucide is the only icon family; baseline installed lucide-react. Text labels remain primary. No external CDN, new animation package, Potlab/Lordicon mixing. Product glyph candidates 16px Compact/20px standard versus 32px desktop/44px mobile target. Curated Lucide Animated only for useful focus/activation, real pending upload or short authoritative success, reserve geometry, preserve focus/draft, static reduced-motion. No page load choreography, row loops or completion implying VERIFIED. Exact exports/source notices/source revision checked by ZCode at activation; no icons copied in this source prototype.

## Five connected experience moments

| Moment | Actor / initial truth / intent | Steps and feedback | Authoritative result and recovery | Keyboard / mobile |
|---|---|---|---|---|
| Understand | scoped manager VIEWER, T0, identify blocker/owner | Control Room → RQ-04 chain → read ER-04 missing / U-02 → see waiting AC-04 U-01 | No mutation; no eligible Action explained; unavailable overview cannot assert readiness | Tab to cause; same order in single column; all reasons text |
| Trace | scoped contributor, AC-05 WAITING+BLOCKED, find cause | open AC-05 → DEP-01 RQ-04/ER-04 → missing proof → return AC-05 → origin | read-only; preserve filter/page/selection/as-of; revoke clears protected origin | native dialog back/focus, full-screen detail on mobile |
| Operate | EDITOR, authorized draft, update full title | Grid filter → open editor → type → preview → validation/conflict/unknown recovery | real save only after current server contract/revision and readback; prototype only draft preview; rebase preserves text | nested text keys/IME; mobile detail editor; dense spacing same font |
| Review | designated independent verifier, exact proof/criterion, decide validity | criterion → components/version/submitter/designation → rationale → guarded command → current readback | server recomputes aggregate/impact; unavailable/no authority means pending; no self-review override | persistent reason and named controls; readable proof context on mobile |
| Handover | scoped VIEWER/manager, t1/t2, explain changed vs outstanding | choose window/scope → provenance → changes then outstanding → review draft → scoped retrieval | no-change explicit; t1>t2 rejected; unknown source blocks complete report; no P1 issued snapshot | error linked to window; single-column draft, export still rights-checked |

## Screen and state inventory

### SCR-01 — App Shell & Session Navigation

Question: Select authorized Matter without exposing inaccessible titles

Wave P0-W1. Read: all scoped roles. Workspace OWNER creates Matter/initial owner; Matter OWNER manages members/designations with last-owner guard.

- **loading**: Membership loading keeps neutral shell; no Matter name/count until access confirmed.
- **empty**: No accessible Matters; Workspace OWNER may create through guarded flow, others request access outside this UI.
- **no match**: List search has no match; clear query, not empty-workspace claim.
- **unavailable**: Membership service unavailable: neutral shell and retry.
- **forbidden**: Invalidate pending navigation; remove protected content and names, return to authorized Matter list.
- **stale**: Membership snapshot stale: suspend writes and refresh rights.
- **conflict**: Concurrent membership/last-owner transfer: retain intent, show allowed revision comparison only.
- **partial**: Mixed independent memberships shown only from accepted reads; unavailable groups explicitly unknown.
- **recovery**: Revalidate session, reopen only authorized scope; no cached grant survives.

Subviews: Matter List, session, membership/verifier designation.

### SCR-02 — Executive Control Room

Question: What blocks this Matter and who can act?

Wave P0-W5. Read all scoped roles; changes through dedicated detail commands; Decisions OWNER/EDITOR per basic context permissions.

- **loading**: Keep section headings and shape skeletons; no derived values while loading.
- **empty**: No exceptions in accepted snapshot; no claim of legal completion.
- **no match**: Filter excludes exceptions: state filter and clear it.
- **unavailable**: Failed overview region says unavailable with as-of; Next Actions/readiness never assume empty/READY.
- **forbidden**: Remove full Matter view, including counts and causal titles.
- **stale**: Show historical as-of and suspend action eligibility claims until fresh.
- **conflict**: Open record changed: keep origin and request authorized refresh, no overwrite.
- **partial**: One unavailable region leaves other authorized regions labelled with their own freshness.
- **recovery**: Refresh failed region; preserve filter, focused chain node and return context.

### SCR-03 — Operational Grid

Question: Which record can I safely work on?

Wave P0-W2. All scoped roles read; EDITOR/OWNER edit metadata; My Actions uses actual assignee identity; Waiting On keeps party and accountable owner.

- **loading**: Retain headers/toolbar with row skeletons and aria-busy; selection inactive.
- **empty**: Zero typed records; EDITOR/OWNER can create typed record, VIEWER sees explanation.
- **no match**: Zero filtered matches; announce count and reset filters without pretending data was deleted.
- **unavailable**: Grid read failed: retain last-good as stale if still authorized; editing unavailable.
- **forbidden**: Purge unauthorized rows, drafts and selected IDs; no failure title leak.
- **stale**: Keep draft/selection, visibly label source as-of; require current revision before send.
- **conflict**: Keep field draft; compare only readable current values; rebase on accepted revision.
- **partial**: Independent row results visible; failed rows/drafts remain selected; unknown rows not retried.
- **recovery**: Reset filters or reopen retained draft; restore row/cell/focus after navigation.

Subviews: My Actions, Waiting On, row draft.

### SCR-04 — Requirement Detail & Lifecycle Drawer

Question: Has the condition been attained and proved?

Wave P0-W1. EDITOR/OWNER create/edit/attest guarded completion; OWNER cancel/reopen/applicability only; designated independent verifier separately reviews proof.

- **loading**: Drawer title skeleton until authorized read; criteria/links load independently.
- **empty**: Requirement with zero Actions is valid; unspecified criteria means UNVERIFIED unless explicit applicability decision.
- **no match**: Linked-tab filter empty; reset only that tab.
- **unavailable**: Evaluation unavailable stays unknown; cannot attest readiness from cached fields.
- **forbidden**: Close detail and clear protected context; safe draft handling under revocation policy.
- **stale**: Show criteria/resource revision and as-of; current-version proof may be stale.
- **conflict**: Retain draft and permitted before/current/proposed comparison; new guarded command after rebase.
- **partial**: Criterion/relations partly unavailable: mark affected claims unknown, retain available evidence context.
- **recovery**: Return to origin Grid/Control Room/tab; readable reason for prohibited completion.

### SCR-05 — Action Detail & Assignment Drawer

Question: What work is allowed next?

Wave P0-W2. EDITOR/OWNER edit/assign/start/wait/complete under guards; OWNER cancel/reopen. Assignee is not the only permitted editor.

- **loading**: Header, assignment and causal reason placeholders; no inferred eligibility.
- **empty**: No linked Requirement is not proof of completion; require explicit scoped relationship when needed.
- **no match**: History/filter empty remains local to tab.
- **unavailable**: Dependency result unavailable; start/complete disabled with readable reason.
- **forbidden**: Remove protected record and revoke pending commands; show generic access loss.
- **stale**: Keep draft, disable send pending current permission/revision.
- **conflict**: Rebase metadata or allowed transition after authorized current read.
- **partial**: Metadata success independent of failed transition is explicit; never combine into one success.
- **recovery**: Return to My Actions/Waiting On with actor/filter/row preserved.

### SCR-06 — Dependency Graph & Impact Inspector

Question: Why is this target blocked and what follows?

Wave P0-W2. All scoped roles inspect; EDITOR/OWNER ordinary edges; OWNER milestone required set with reason.

- **loading**: Label edge table columns while reading graph.
- **empty**: No incoming edges means READY only from successful authoritative evaluation.
- **no match**: No matching path under filter; preserve graph context, allow reset.
- **unavailable**: Graph/evaluator unavailable: no READY default.
- **forbidden**: Redact inaccessible graph targets and all derived counts.
- **stale**: Stale graph cannot accept edits until revalidated.
- **conflict**: Cycle/concurrent edge change rejects whole command, returns only authorized path.
- **partial**: One relation page unavailable marks graph incomplete; do not imply full impact census.
- **recovery**: Accessible edge list is equivalent to diagram; return to originating record/gate.

### SCR-07 — Evidence Submission & Verification Drawer

Question: Does exact proof meet this criterion independently?

Wave P0-W3. Read all scoped roles; submit EDITOR/OWNER; accept/reject/resolve dispute only designated independent EDITOR/OWNER; OWNER alone insufficient.

- **loading**: Criterion/version/submitter/reviewer placeholders; review action unavailable.
- **empty**: Missing proof: criterion remains visible, no fabricated EV-04.
- **no match**: No matching supplied proofs; reset proof filter without clearing criterion.
- **unavailable**: File or validity unavailable: do not accept; retain criterion and allowed next step.
- **forbidden**: Clear protected bytes/metadata/draft and pending review; generic access-loss recovery.
- **stale**: Criterion/version/reviewer designation changed: retain rationale in authorized context, refetch.
- **conflict**: No force accept; compare authorized current revision, re-evaluate exact proof.
- **partial**: Some mandatory components accepted: PARTIALLY_VERIFIED, list missing components.
- **recovery**: Submitter can submit replacement; designated non-submitter reviews; no independent verifier means pending.

### SCR-08 — Document Version & Signature History

Question: Which exact version does this observation concern?

Wave P0-W3. Scoped read all; add version EDITOR/OWNER; promote OWNER only; signature observation separately guarded.

- **loading**: Version list skeleton; no current default guessed.
- **empty**: No versions: add allowed version, no proof claim.
- **no match**: Version filter has no match; clear it.
- **unavailable**: Bytes unavailable differs from missing metadata; do not substitute current bytes.
- **forbidden**: Recheck every retrieval; remove URLs/metadata after revocation.
- **stale**: Expected prior authoritative version changed; promotion suspended.
- **conflict**: OWNER promotion rebases explicit impact/reason on current prior version.
- **partial**: Upload pending/unknown does not promote; partial signature observation does not verify all criteria.
- **recovery**: Inspect historical fixed version; current-version criteria may need new independent review.

### SCR-09 — Regulatory Filing Tracker & Package Manager

Question: What has the authority actually acknowledged or decided?

Wave P0-W4. EDITOR/OWNER stage observations under package guards; OWNER negative controls/reopen; independent verifier proof review separately.

- **loading**: Timeline/package/cycle placeholders, stages not guessed.
- **empty**: No filing yet: create typed scope/package when allowed; no submission implied.
- **no match**: No matching cycle/reference: reset filter, retain all history.
- **unavailable**: Package or authority observation unavailable: disable next stage with persistent reason.
- **forbidden**: Remove submitted-package metadata/links, revoke pending stage update.
- **stale**: Package version changed since preview; recheck guards before recording observation.
- **conflict**: Retain observation draft and exact versions; OWNER correction appends attributed event.
- **partial**: Receipt without outcome remains Authority Review/WAITING with partial proof.
- **recovery**: OWNER rejection/withdrawal/correction/reopen preserves cycles; no automatic requirement to reissue authority decision under ARCH-Q5.

### SCR-10 — Bulk Metadata Editor & Preview Modal

Question: Exactly which fields and records will change?

Wave P0-W6. EDITOR/OWNER only; title, description, assigned internal owner, due date. No type/links/waiting/state/criteria/roles/verification/promotion/delete.

- **loading**: Load exact selected IDs/current permitted values for preview, not all-match inference.
- **empty**: Nothing selected: return to Grid; never target all records implicitly.
- **no match**: Selected IDs hidden by filter remain explicitly listed and require confirmation; no hidden rows added.
- **unavailable**: Preview validation unavailable: keep draft and selection, do not send.
- **forbidden**: Recheck each row and redact inaccessible values; retain permitted failure identity only.
- **stale**: Accepted row revision differs: re-preview that row.
- **conflict**: No overwrite; current-readable comparison/rebase; new command when accepted contract allows.
- **partial**: Persistent succeeded/failed/unknown results; success deselects, failed drafts remain; unknown reconciliation before retry.
- **recovery**: Unchanged separate from clear; only description/due can propose clear subject to adopted validation; title/active owner cannot be empty.

### SCR-11 — Structured Import Wizard

Question: Which import groups are valid and what will be created?

Wave P0-W6. EDITOR/OWNER only; no imported role grants or authoritative VERIFIED labels.

- **loading**: Read/parse/validate stages labelled; no imported count until result known.
- **empty**: Empty input is not success; choose source again.
- **no match**: Preview filter has no matching errors/rows; full group scope still explicit.
- **unavailable**: Parser unavailable: keep mapping/source identity when safe, do not execute formulas/macros/links.
- **forbidden**: Revoke commit and remove protected reference resolutions.
- **stale**: Scoped reference revisions changed: revalidate groups.
- **conflict**: Same source/key/content deduplicates; changed content requires reconciliation, no fuzzy name merge.
- **partial**: Connected invalid group rejected whole; independent valid groups may commit; persistent result per group.
- **recovery**: Return failed group drafts; resolve refs then re-preview; unknown outcome reconciles before resend.

### SCR-12 — Delta Status Brief Generator & Viewer

Question: What changed in this window, and what remains at t2?

Wave P0-W6. Scoped OWNER/EDITOR/VIEWER read/export; P0 draft only, no managed issued-report snapshot.

- **loading**: Window/provenance headings kept; no generated draft while source incomplete.
- **empty**: No changes in (t1,t2] is explicit; outstanding may still exist.
- **no match**: Filtered draft scope empty differs from no changes in all Matter data.
- **unavailable**: History/source unavailable: cannot claim complete brief; label incomplete or block export.
- **forbidden**: Recheck generation AND retrieval rights; purge protected draft.
- **stale**: Source/window/permissions changed: regenerate visibly under new provenance.
- **conflict**: Invalid t1>t2 linked error; altered source revision needs fresh draft, not overwrite.
- **partial**: Any source gap identified, never output an apparently complete issued report.
- **recovery**: t1=t2 excludes events; stable recorded-time ordering with stable tie order; explicit draft.

Subviews: Excel export scope.

### SCR-13 — Scoped Event History & Audit Ledger

Question: Who changed this and on which evidence?

Wave P0-W1. All scoped roles domain history read; no role edits/deletes prior events; security log access separate.

- **loading**: Timeline row skeletons with actor/time/reference headings.
- **empty**: No domain events in scope/window; denied security events are not invented domain events.
- **no match**: No event matches query; clear query or adjust window.
- **unavailable**: History service/page unavailable: missing portion labelled, not zero.
- **forbidden**: No restricted audit metadata or inaccessible target title in denial.
- **stale**: Show source as-of; refresh appends new accepted history without rewriting old.
- **conflict**: Correction appends causal link/reason, no edit of prior event.
- **partial**: Paged timeline incomplete until authorized relation traversal completes; counts unavailable if not supplied.
- **recovery**: Return origin and exact event anchor; preserve filter/time window; no normal-user delete.

## Golden Workflow inventory

Use the complete approved workflows in ../../requirements/golden-workflow-acceptance.md. Dashboard and signature reconciliation are supporting subscenarios, never replacements for GW/AC identities.

GW-01 / AC-161: Approval → Document → Signature → Payment → Transfer → Closing → Filing → Post-Closing. Authorized OWNER/contributors/independent verifier record approval proof, promoted exact agreement, partial/complete signatures, actual payment/transfer confirmations, explicit milestone closing prerequisites, filing per GW-03 and handover acknowledgement. Every step preserves separate execution/proof and attributable history. Alternatives: missing signature WAITING/partial, completion without proof, explicitly reasoned no-signature scope. Negatives: upstream reopen/expiry re-block, current-only version supersession, stale completion, cancelled prerequisite cannot satisfy closing. No actual payment/signature service implied.

GW-02 / AC-162: Request → Document → Review → Gap → Finding → Follow-Up → Resolution. Contributor records request and exact received pack; reviewer identifies missing criterion; typed Finding/owner/follow-up links retained; external wait/response; independent resolution proof then explicit Requirement completion. Alternatives no gap and incomplete response; negatives rejected/expired/disputed proof, wrong-Matter response, forbidden read, concurrent review, duplicate import. Request sent/document exists never equals resolved gap.

GW-03 / AC-163: Requirement → Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement → Response → Approval. Contributor records package/actual observations, OWNER controls applicability/negative/reopen, designated verifier proof. Test two distinct supplement-response cycles, return to Authority Review each time, preserve exact versions and history. Also no-supplement success, incomplete-package denial, no-signature applicability, rejection/withdrawal, stale version, wrong reference, revocation and reopen under ARCH-Q5. Receipt never approves; approval observation can remain UNVERIFIED.

Each workflow checkpoint records actor/permission, before/after axes, exact criterion/proof/version, domain event, Grid/Control Room readback and scoped delta/export. Full integrated results remain NOT_RUN; Atlas T0 is not a completed progression.

## Dependencies and acceptance boundary

DEPENDENCY_PENDING: accepted primary source/import base; adopted auth/session/wire/receipt/revision contract; state propagation/clock/gap classifier; F10 relation/cycle binding/paging; upload/retrieval policy and local object seam; import/export/retention numeric budgets; nonauthor design semantic/testability review; permitted rendered revision capture; AC-137 study. Exact endpoints/DTOs/codes/tables/ETag syntax/provider/library choices intentionally unresolved. No adopted architecture is claimed from design or a Git commit. See zcode-handoff.md for per-wave unblock receipts and validation-plan.md for test oracles.

Skipped: implementation, backend/runtime, rendered/assistive/user testing and reviewer dispatch. Risk: source/spec corrections require independent semantic acceptance and actual product enforcement before use as implementation truth.
