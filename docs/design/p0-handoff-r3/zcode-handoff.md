# ZCode R3 handoff — conditional wave consumption

Task MC-P0-DESIGN-R3; actual author Codex / Local Codex; consumer actual ZCode BE + product FE under the direct task-scoped assignment. Priority P0 design prerequisite. Proposed IN_REVIEW, not a wave activation. Actual nonauthor reviewer assigned by coordinator after intake; no dispatch here. Base/head a62d838791ba188838c4ff00b7b6e265ac775056 plus exact 38-entry input manifest. Source-only exploratory design, no app writes.

## Component and token reuse

Observed existing primitives (read/inventory, no modification): apps/frontend/src/components/atoms/{button,badge,input,textarea,select,label,skeleton}.tsx; apps/frontend/src/components/molecules/{dialog,form-field,empty-state,alert,search-input,pagination,page-header}.tsx; apps/frontend/src/components/organisms/{data-table,app-header,app-sidebar,mobile-nav}.tsx. Brace notation here lists separate files, not a real path. Task feature patterns are examples of composition only, not domain schema authority.

DataTable is presentational: no fetch, sort/page state or business rules; feature owns columns/cells/filter/selection and current authorization. Its current header band/spacing are not evidence of accepted selected-system rendering. Dialog uses native showModal, conditionally mounts children only while open; hoist legal/rationale drafts to feature state before reuse. Veto close through existing onOpenChange for pending/unsaved intent; verify repeated Escape/backdrop/focus behavior instead of replacing the primitive. FormField already links hint/error IDs through control props; feature should announce submission summary in addition. Do not create duplicate generic badge/dialog wrappers just for five-axis semantics.

Proposed business compositions belong under apps/frontend/src/features/matters/, requirements/, actions/, dependencies/, evidence/, documents/, filings/, brief/, data-transfer/ as appropriate; these are proposed activation paths, not claims of existing modules. Matter switcher and five-axis compositions live inside features, never src/components/molecules/WorkspaceMatterSwitcher or domain StateBadge. src/app/ composes routing; src/lib/ technical infrastructure; features use repositories/services and generic components. Keep exact adopted source layout/rules at activation; design does not select routes or transport.

Selected tokens: use ../step-03a/revised/local-r3/design-tokens.json and selected-tokens.css roles; no brand/font/palette change. R3 polish.css preserves all 17 selected color values by semantic role and applies the selected typography/density in its focused app layout; unused review-board selectors are not copied. Prototype embeds the complete R3 stylesheet byte-for-byte. Body 14px/1.5, metadata 12px, heading 22px, humanist sans application stack; monospace IDs/time/code/data only. Comfortable 44px minimum/8px row padding, Compact 36px/4px padding, legal text grows, same font size. Desktop controls 32px minimum; mobile 44px; 16/20px Lucide glyph is not hit target.

Variants: each generic control default/hover/focus-visible/active/disabled/pending/error/accepted feedback; selection distinct from focus; stale/unknown distinct from validation failure. UI never paints accepted proof/READY without authoritative result. Lucide baseline installed, curated Lucide Animated optional useful emphasis, exact exports/source revision/notices must be checked during activated implementation. Motion package not declared/adopted by design; CSS/platform first, no runtime CDN or telemetry. Reduced motion static, no page/row loops.

## W1 actionable consumer contract

Reach: session/auth seam, scoped Matter read/create/admin, requirement create/detail/history; feature types/validation/repository/actions/components/routes and synthetic tests once an exact accepted implementation base/owned path list is activated. Existing apps/backend/apps/frontend snapshots and BE01/BE02 returns must be preserved; no source import/commit assumption from governance HEAD.

Ordered UI slice: neutral session → authorized Matter list → Matter scope/role/as-of → typed Requirement create with zero Actions allowed → persistent field validation draft → consequence/command preview → pending/unknown/conflict/revocation recovery → accepted typed detail plus history readback. OWNER membership and designated-verifier administration are separate from normal assignment; deny last-owner removal without transfer. VIEWER read/export only; no mutation affordance granted by persona.

Semantic read needs: session rights and expiry/currentness; Workspace membership and explicit accessible Matters; operation eligibility with readable authorized reason; typed Requirement identity/title/outcome/workstream/owner/due; applicable axes; authoritative revision/as-of; criteria and linked Actions; attributable domain history with effective/recorded times and causal references. Semantic commands: create/edit typed Requirement; create authorized Matter/initial membership; explicit membership/verifier changes; guarded critical lifecycle only where activated. Field presence/null/validator syntax/error transport remain architecture-owned.

Interaction acceptance: labels/errors linked; draft outside unmounting Dialog; read-only empty versus forbidden/unavailable; foreign IDs don't leak names; neutral scope after revocation; accepted response/readback/history inseparable; unknown outcome blocks resend. Test FR-001 partial, FR-008/018, AC-101/108/118/121/134/135/136/139/140/147/149/153/158/159 with exact activation subset, not blanket PASS. Source prototype exposes viewing/draft patterns, never real login or safe idempotency.

Unblock receipts: accepted corrected/imported source base, adopted G2/INT-D02/03/09 and BE02 auth/wire/receipt contracts, relevant G3 design/nonauthor acceptance, exact W1 task READY, synthetic fixtures and independent reviewer. Missing receipt blocks only dependent implementation; this handoff itself does not approve architecture or ask PO to reapprove settled scope.

## W2 actionable consumer contract

Reach: typed Action/Requirement metadata and workstreams; active owner and due; directed edge validation/reopen propagation; explicit milestone prerequisites; party/waiting relations; authoritative five-axis state/read reasons/clock; Grid + My Actions/Waiting On + typed detail/causal table/history consumers. Use domain feature compositions and existing primitives; a generic Task+JSON substitute is outside approved model.

Ordered daily flow: filter/search → stable sort/page → select exact page IDs → row/cell edit → retain invalid/conflicted draft → current revision send → authoritative readback and event → keep origin/density/selected ID/focus. Filter page reset and hidden selected IDs explicit; no implicit all-match mutation. Row arrows only on row, input owns keys/IME; Enter/F2 edit and Escape local cancel, Tab/Shift+Tab native focus. After changed row no longer matches, explain and focus list fallback. Mobile matching-row cards, full detail and permitted simple edit preserve P0; staged complex flow/desktop continuation described rather than deleted.

Semantic read needs: allowed typed transitions/reasons; edge type/source/target/gates/cause/revision; complete authorized impact paging; milestone explicit required set or UNASSESSED; next-action candidates/order/exclusions; Waiting On party OR condition plus internal owner/reason/due, waiting-since only if supplied; due/as-of/timezone and separate attention causes. Semantic commands: edit allowed metadata, assign active member, start/wait/complete under state guards, OWNER cancel/reopen/escalation/milestone definition, reasoned ordinary edge changes and waiting response. No force-READY or arbitrary aggregate proof command.

Acceptance: FR-001/002/003/004/005/010/011/017/020; exact tests in matrix and validation plan. Completion/proof/milestone predicates differ; NOT_REQUIRED fails proof edge. Reopen preserves downstream completed history while reblocking; concurrency rejects cycles/foreign refs/lost update. Negative VIEWER/revocation/stale/wrong Matter, no candidate and undefined milestones explicit. W2 accepted source/state/propagation/clock contract plus W1 acceptance and relevant independent design receipt required.

## W3 through W6

| Wave | Reuse / composition / variants | Semantic data and commands needed | Interaction acceptance / dependency |
|---|---|---|---|
| W3 documents/proof | generic Dialog/FormField/Badge; evidence/document feature layouts; missing/partial/disputed/expired/current/fixed variants | criterion revision/components/applicability, exact version/proof, submitter/designation/validity, lineage; submit/review/challenge/resolve, OWNER reasoned promotion/applicability | no self-review, no stale-version substitution; OWNER is not verifier; upload not promotion; dependency secure file/object/read policy and accepted validity/classifier contracts |
| W4 filing | feature timeline/edge table/version list; preserve exact cycle references, not new diagram library | scope/package/signature criteria, exact submitted versions, actual reference/time/receipt/outcome, authority wait, each request/response owner/due; stage observations/OWNER correction/reopen | two cycles/no-supplement/reject/withdraw/incomplete package; ARCH-Q5 reopen interpretation; F10 cycle/relation/read paging adopted before binding |
| W5 overview/context | app shell + generic panels/table; feature causal rail, decisions/waits/milestones/gaps/changes | consistent authorized snapshot/as-of/revision, cause/impact/owner/allowed step, explicit unavailable grain; basic Decision/Finding/Risk references | hierarchy/empty eligible/undefined set correctness; gap classifier/read boundary adoption, nonauthor review and AC-137 separate from source checks |
| W6 bulk/import/export/brief | existing form/table/dialog/paging; feature staging/result panels; unchanged/set/clear and persistent failed/unknown variants | exact selected IDs and changes, revision/rights checks and accepted receipts; typed source keys/groups/dedup; authorized export scope/window/as-of/recorded-order/provenance | four bulk fields only; per-row atomic audit; invalid connected import group whole; escape spreadsheet values; no changed-window/rights leakage; adopted admission/bounds/receipt/export policy |

## Architecture dependencies

| Dependency | Authority / required receipt | Wave impact |
|---|---|---|
| Primary source base and normal commit conditions | Codex intake of corrected imported base and exact source/task activation; no bypass of Mimosa | W1+ |
| Auth/session/token and membership boundary | Actual Solution Architecture adoption, material decisions PO; exact G2/INT-D02/03/09 + BE02 accepted reference | W1+ |
| Resource revision, commands, outcomes, receipts and errors | Adopted architecture contract; missing response reconciliation and safe retry criterion; Git commit never resource ETag | all mutation waves |
| State/clock/propagation and gap granularity | Exact adopted state wire/evaluator/F08 reference, authoritative not UI | W2/W3/W5 |
| Filing cycle/version/epoch and complete scoped paging | Exact adopted F10/nested-read binding and ARCH-Q5 interpretation; no invented enum or fresh authority outcome | W4 |
| File limits/local object seam and secure retrieval | Accepted synthetic object policy; production provider/cost separate | W3 |
| Import/export/admission/retention budgets | Architecture + PO numeric approval when needed; not guessed from prototype size | W6/W7 |
| Independent source/design, rendered interaction and manager acceptance | Nonauthor review receipt, later allowed exact-revision captures and actual AC-137 ledger | relevant FE waves |

No endpoint/DTO/status code/table/ETag format/auth provider/storage/SSE/export library is adopted here. No adoption receipt was provided by this bounded read set; use DEPENDENCY_PENDING, not an illustrative route as production truth. Product/permission/state rules remain already approved and do not need a new vote.

## Return expectations

At activation pin exact paths/source revisions and tests; preserve existing component contracts/draft behavior. Supply per-stage actor/state/proof/version/event/readback/export ledger for three complete GWs. Actual test outcomes, nonauthor review and accepted gates required before DONE. This design author cannot approve its own correction. Next coordinator action: intake hashes, then assign nonauthor semantic/testability review of R3 without activating implementation or altering frozen packets.

Skipped: source implementation, library setup/research for unselected APIs, runtime/tests, browser and external dispatch. Risk: semantic proposals and unrendered interaction code require independent review; pending wire/source/budget receipts still gate ZCode implementation.
