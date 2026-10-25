# MC-003A.7 — Control Room and detail-read contract proposal

Author Local Codex PM/BA. Architecture owner actual Claude Code. Base1ec02fd. **CANDIDATE / WAITING_MANUAL_DISPATCH**; TQ-02/TQ-08 OPEN_PENDING_TARGETED_REVIEW, not closed. This is one bounded proposal, not a full architecture audit. [Exact request](request.md), [canonical requirements/fields/catalogue/navigation/testability data](read-contract-proposal.json). Local CRI/DR/NAV/CT IDs are task-local trace IDs, not new approved requirements or official APIs.

## Authority and preserved inputs

FR-009/SRS, PRD§13, AC-109/137, RULE-001..021, states/permission matrix and D-UX01..04 are approved semantic inputs. api-contracts.md§1/§2, field spelling, route layout, cursor/cache and partial-response mechanism remain **candidate**, despite historical normative wording inside that candidate. No final product wire field is established as EXISTING_APPROVED here. Reused candidate fields retain CANDIDATE_FIELD. Existing candidate routes with missing detail are EXISTING_WITH_GAP, not approved. New route suggestions CANDIDATE; alternatives NEEDS_ARCHITECTURE_DECISION. Advanced P1 is DEFERRED.

Current verified Step02source at8553a8b has byte-identical DEC-028approval and INTA-1contract versus the7snapshot input atdd959b6. INT-A is approved local transport only. Its native412 does not approve product412/bulk200; its refId/value/16KiB envelope is not copied into product reads. ClosedStep02.3wording is not reopened. K-2ImportDraft is pre-confirm preview, not a domain state; explicit guarded Requirement completion remains allowed; If-Match is only for namedCASscope, not universal or a GETrequirement. All original Claude outputs/r3 remain frozen.

## TQ-02 — information requirements

The10business information groups below are mandatoryP0; they need not be10separate UI panels or APIsections. Actionability/navigation can be embedded in cards. Complete per-group business purpose, requirements, visible behavior, entities, authorization, freshness, empty/error and navigation references are in information_groups in the canonicalJSON.

| Group | Approved requirement trace | Required visible behavior |
|---|---|---|
| CRI-01 condition | FR-009, FR-020 | Display matter/context, as-of and named exceptions; no readiness percentage |
| CRI-02 blockers | FR-005, FR-009 | Show root/target type, failed gate ID/reason, source revisions and owner; do not conflate WAITING with BLOCKED |
| CRI-03 nextActions | FR-003, FR-009 | Backend RULE-021 candidates, reasons/order; AtlasT0 zero eligible Actions with explanation |
| CRI-04 waitingOn | FR-004, FR-017 | Reason/party/owner/follow-up due; unknown waiting-since stays unknown (TQ-06) |
| CRI-05 milestones | FR-002, FR-009 | Due/timezone and backend readiness/reasons; no required set gives UNASSESSED, not vacuous ready |
| CRI-06 evidenceGaps | FR-006, FR-007, FR-009 | Criteria/subject refs and missing/expired/disputed reason; never invent Evidence for a gap |
| CRI-07 decisions | FR-001, FR-009 | Question and canonical decision lifecycle, owner only if actually assigned; DEC-AT-01/02 remain OPEN |
| CRI-08 recentChanges | FR-008, FR-019 | Event/time/actor/action/target references; no new-change claim for an old unresolved blocker; TQ-05 time-window mapping pending |
| CRI-09 actionability | FR-003, FR-018, FR-020 | Source current backend guards/capabilities, not client legal evaluation; missing hint is unknown, not allowed |
| CRI-10 navigation | FR-001, FR-009, FR-011 | Stable target type/id/matter scope; resolve in app; no arbitrary external href or harness refId |

Control Room DOM/UX priority remains blockers→NextActions with prominent Decisions→WaitingOn→Milestones→EvidenceGaps→Changes. The condition summary is context/as-of/named exceptions, not an extra authoritative workflow state or readiness percentage. No scope change, genericItem+JSONdomain replacement, client-owned readiness or invented metric.

## Candidate response contract for actual Claude decision

**Proposed existing route:** GET /api/v1/matters/{matterId}/control-room from candidate§2. Prefer a small server-assembled display projection for a coherent authorized boundary; a composition of existing reads is acceptable if provenance/error/consistency remain explicit. No persisted ControlRoomentity, new data store, realtime service, background pipeline or cache deployment selected. Claude decides architecture; the preference is a BA-facing proposal.

**All keys in the schematic below are CANDIDATE_FIELD.** This is a type sketch, not valid Atlas payload or runtime output. The34field registry and section_card_variants define proposed types/meanings; exact names/required/nullability/encoding must be ratified by Claude. Resource-specific projections use existing typed entities; no full domain objects embedded.

```text
{
  matterRef: {kind: MATTER, id: serverUUID, matterId: serverUUID},
  meta: {asOf: serverRFC3339Offset, sourceRevision: serverSequence,
         historyMaterializedThrough: serverSequence,
         displayTimezone: namedZone, requestId: opaqueCorrelation},
  sections: {
    condition, blockers, nextActions, waitingOn, milestones,
    evidenceGaps, decisions, recentChanges, actionability, navigation
  }
}
Section = {availability: AVAILABLE | STALE | UNAVAILABLE,
           asOf: actualSectionBoundaryOrNull,
           sourceRevision: actualSectionRevisionOrNull,
           items: typedProjectedCards | [] | null,
           reason: scopedExplanationOrNull, nextCursor: opaqueOrNull}
Card = resource-specific variant with resourceRef, short label,
       actual owner/due/axis projection where applicable, and typed relatedRefs.
Reference = {kind, id, matterId}; exact criterion/version/claim/cycle IDs retained.
```

AVAILABLE+[] means successful current authorized zero. UNAVAILABLE+null is failed retrieval, never zero/READY. STALE may retain clearly labeled last-known cards only if authorized/currentlyaccessible; do not describe that region or whole view as fresh. MetaasOf is not permission to label mixed-region snapshots coherent. Server must either return coherent snapshot/evaluation or explicit per-section boundaries and unavailable/unknown globalcondition. Root inaccessibleMatter fails uniformly; no protected region reason/title/count/cursor reveals inaccessible objects. RootHTTP200for supportedpartial,503forallfailed and exacttaxonomy are candidate trade-offs for Claude, not adopted here.

Current-stateasOf comes from server, never caller. Reuse candidate sourceRevision/historyMaterializedThrough and resource revision; they identify different things. RFC3339offsets retained; named displayzone does not guess date-onlydue. No maximum age, lifetime, bytecap or numericsectiondefault is invented. Candidate collection after/limit cap200 is inherited only as a candidate. Each returned section/card is bounded, indicates continuation for more authorizeddata and does not silently clip a criticalreason or claim a complete causal chain from a page. Exact per-region ordering/cursor/snapshot strategy and section limits are READ-02/Claude decisions. No fabricated total: loaded authorizedrowcount differs from a scoped server total.

Use opaque scoped cursors and app-resolved typed references, never arbitrary external URLs or harnessrefId. Reauthorize every detail/content retrieval and every resumed cursor; no client hint confers authority. Source state/reasons are backend projections; permittedActions is optional advisory only (TQ-03). If eligibility unavailable, show unknown/appropriate safe affordance rather than invent permission; backend still enforces. Requirement and Action keep separate types; EvidenceRequirement gap never creates Evidence. Document current-pointer/signature completeness and Filing receipt/outcome/cycles remain separate. Read creates no domainchange/EventHistory/verification; operational correlation contains no legalpayload/token.

## TQ-08 — detail-read catalogue / design-to-API map

17capabilities cover every requestedP0resource plus justified Waiting/basicFindingRisk context. Each canonicalJSONrow contains the required20catalogue attributes: requirement/design/resource/existingcoverage/proposedoperation/identifier/data/links/auth/error/loading/pagination/version/cache/dependency/status/acceptance/owner. Exact nested-path alternatives are candidate architecture decisions. Some rows use multiple small collection/detail reads; operations below do not authorize implementation.

| ID / resource | Requirement trace | Status | Proposed GET operations (all candidate) |
|---|---|---|---|
| DR-01 Matter | FR-009, FR-018 | CANDIDATE | GET /api/v1/matters/{matterId} |
| DR-02 Workstream | FR-001, FR-009 | CANDIDATE | GET /api/v1/matters/{matterId}/workstreams; GET /api/v1/workstreams/{id} |
| DR-03 Milestone | FR-002, FR-009 | EXISTING_WITH_GAP | GET /api/v1/matters/{matterId}/milestones; GET /api/v1/milestones/{id} |
| DR-04 Requirement | FR-001, FR-006 | CANDIDATE | GET /api/v1/requirements/{id} |
| DR-05 Action | FR-001, FR-003, FR-011 | CANDIDATE | GET /api/v1/actions/{id} |
| DR-06 Dependency/blocker | FR-005, FR-009 | CANDIDATE | GET /api/v1/nodes/{id}/dependencies |
| DR-07 Evidence Requirement | FR-006, FR-007 | CANDIDATE | GET /api/v1/evidence-requirements/{id} |
| DR-08 Evidence | FR-006, FR-007 | CANDIDATE | GET /api/v1/evidence/{id}; GET /api/v1/evidence/{id}/claims |
| DR-09 Verification history | FR-007, FR-008 | CANDIDATE | GET /api/v1/evidence-claims/{id}/assessments |
| DR-10 Document | FR-015 | CANDIDATE | GET /api/v1/documents/{id}; GET /api/v1/documents/{id}/versions |
| DR-11 Document Version | FR-015, FR-016 | EXISTING_WITH_GAP | GET /api/v1/document-versions/{id} |
| DR-12 Filing | FR-016, FR-004 | CANDIDATE | GET /api/v1/filings/{id}; GET /api/v1/filings/{id}/cycles |
| DR-13 External Party | FR-017, FR-004 | CANDIDATE | GET /api/v1/matters/{matterId}/external-parties; GET /api/v1/external-parties/{id} |
| DR-14 Decision | FR-001, FR-009 | CANDIDATE | GET /api/v1/decisions/{id} |
| DR-15 Event History | FR-008, FR-019 | EXISTING_WITH_GAP | GET /api/v1/matters/{matterId}/events |
| DR-16 Waiting relation | FR-004, FR-017 | CANDIDATE | GET /api/v1/waits/{id} |
| DR-17 Basic Finding/Risk context | FR-001, FR-009 | CANDIDATE | GET /api/v1/findings/{id}; GET /api/v1/risks/{id} |

Allreads inherit activeWorkspaceANDexplicitMatterANDrole, same-Matterrelationship validation, uniform inaccessible/nonexistent confidentiality and immediate revocation. O/E/Vread is not permission to mutate, verify, promote or cancel. Foreign resource IDs/linked IDs never confer access. Exact401/404/403mapping remains candidate; use role-specific403text only where the caller is already authorized to know the target. No sixth state, documentACLengine or external-partyaccount introduced. Readmetadata/content are separately protected where needed; no signedURL/cache loophole.

Collections propose inherited keysetpaging; cursor/resource revisions are not If-Matchwriteguards. Node/exactcriterion/version/claim/cycle IDs support futureguardedcommands but do not define newCASscope. Cache/projectionmechanism is not selected: preserve current auth/revocation, do not serve per-user legaldata to another user, and expose stale/error without reassuring defaults. BasicFinding/Risk supports RULE-020/FR001/AC159 and currentFD01/RISK-AT01context only; advancedP1authorities/entitygraphs/scoring remain deferred.

## Contextual navigation integration

The10NAVrows specify initialrefs/data, detailfetchdata, reauthorization, visibleloading/error and preservedstate in the canonicalJSON. They cover ControlRoom→Blocker→Requirement→Criterion→Evidence→VerificationHistory; Grid→typedRow→Inspector; Filing→exactDocumentVersion→cycles/waiting/supplement; plus dependency/decision/eventcontext. Never substitute currentDocumentVersion for a submitted/proofversion. Missing/expired/superseded proof remains visible truth; historicalself-reviewAtlasnotes are not acceptednewverification. Loading retainsorigincontext; detailfailure does not erase draft/selection. Closing restoresconnectedtrigger or labeledfallback. Allnativefocus/keyboard/renderbehavior remains NOT_TESTED.

## API/Auth dependencies and remaining questions

READ-01serverprojection/composition, READ-02snapshot/partial/bounds and READ-03typedreads/schema/errors require actualClaude. A01/02authn+scope,A03contracts,A04paging,A08errors,A11protectedcontent,A12derivedtruth remain the correspondingtechnicaldependencies. None changes approvedlegalpolicy. TQ02candidate response andTQ08candidate catalogue prepared, not resolved. Existingproduct412/bulk200remaincandidates; no writeendpoint amended.

TQ01reopen/promotepreview staysopen and is not added to theseGETs as an authoritative dry-run. TQ03capabilityhint may enrichread UX but is not a newgrant. TQ04error/retrycopy remainsproposal/POdecision where required. TQ05changes-window mapping andTQ06waiting-since are material readdependencies, exposed as unknown/proposed until decided. TQ07expiry/importlimits remainseparate; no newnumericvalues. All8TQsretained with owners inJSON; no closedclarification reopened and no newADR assumed.

## Testability and gated reconciliation

22CTscenarios are **NOT_RUN** withFR/ACreferences, expectedobservablebehavior and requiredfutureevidence. They cover authorized/denied/missing/crossworkspace/invalidreference,empty/multipleblockers,COMPLETEDUNVERIFIED,WaitingOn,detailrevocation,missing/supersededproof,filingversions,conditionalpartial/unavailable,freshness,cursors,navigation,decisions,changes,protectedcontent,actionability andreadnomutation/privacy. AC109needs scope/sourceboundary+domainreadback,not screenshotsalone; AC137managerprotocol remains unexecuted and unchanged. Structuraldocumentchecks cannot turn anyCT/ACresultPASS.

After actualClaude review, **conditional Antigravity reconciliation** consumes only that reviewedrevision: map10groups/17reads/10NAVtransitions to existingCard/Badge/Dialog/DataTable/EmptyState reuse and specializedControlRoom/Grid/evidence/bulk/filing components; check adequate refs, error/loading/draft/focus/revocation states. No newtemplateaudit, install, productimplementation orstagepermission. Reconciliation is PREPARED_DEPENDENCIES_ONLY, not performed now. IndependentOpenCodecontract/testabilityreview remainsPENDING; preserve existing QApacket, no403retry/provider switch or assumed permission for this newpayload.

## Current resolution / gate record

Claudeauthpreflight2026-10-25T07:45:22.986627Z: exit1,loggedInfalse,authMethodnone,apiProviderfirstParty. No prompt/login/provider/settingschange. Directauthenticatedreviewunavailableinthisenvironment; humanpreviousmanualreview is not authentication for Codex. [Complete targeted prompt](../MC-003A-TQ02-TQ08-CLAUDE-PROMPT.md). State **WAITING_MANUAL_DISPATCH**. Actual targetedreviewreturnNOT_AVAILABLE; noapprovedcontract/compatibilityverdict fabricated.

PriorG5ARCHITECTURE_COMPATIBLE_WITH_CONSTRAINTS_DOCUMENT_ONLY remainsrecorded; TQ02/TQ08notclosed andtheir integration remainsgated. G3renderedBLOCKED_BY_TOOLING,G4independentQAPENDING,G6closurePENDING. MC003AREWORK_REQUIRED; full03B/highfidelity/frontendbackendimplementationNOT_AUTHORIZED. Permittednow: boundedproposal/refinement/traceability andactualauthorizedtargetedreview. Exactnexttask: Claude selects readarchitecture, returns reviewedshapes/catalogue plus explicitapprovalstate/constraints; Codexintakes; thenfocusedAntigravityreconciliation andauthorizedindependenttestabilityreview. Nootherworktree changed.
