# MatterControl — remaining feature audit, 2026-11-02

Task: MC-REMAINING-FEATURES-20261102. Actual Local Codex, with two explicitly requested read-only Product Manager and Business Analyst subagents. Inspected branch `codex/unified-project-flow`, clean HEAD `7bf198c103476f490ebbdf58b1bd563d0bba8a61`. This is source/requirements traceability, not fresh runtime or independent release acceptance. No application/service/container was started.

## Conclusion

No approved P0 capability was found entirely absent from source. The previous [BA coverage summary](../testing/zcode-ba-flow-completeness-20261030-r1/coverage-summary.md) maps the 20 P0 API surfaces and three HTTP Golden Workflows. That does not establish 20/20 product acceptance: connected browser, multi-actor, keyboard/screen-reader, scale, human comprehension and independent verification remain separate.

The old [Eigenwelt R2 inventory](../research/eigenwelt-20261029/implementation-status-20261029-r2.md) is historical. Focus, Quick Search, shared controls, title navigation and the separate Filing outcome axis have since been implemented. Reimplementing those modules would duplicate existing work.

## Current inventory and immediate scope

| Item | Classification | Current source/evidence | Next action |
|---|---|---|---|
| Filing next-stage selection | DEFECT_OPEN | `apps/frontend/src/features/filings/components/filing-forms.tsx:303` initializes the selected target once from `detail.next[0]`; the current test at `filing-ui.test.tsx:326` does not cover refreshed detail | Add a rerender regression; retain a still-valid user choice, discard an invalid old target, and prevent stale-stage commands |
| P0 core / three Golden Workflows | IMPLEMENTED; acceptance incomplete | Existing work/proof/filing/control/data services and route inventory; BA coverage above | Reuse, connect and verify; repair reproduced defects, not rebuild W1–W7 |
| Focus and Quick Search | IMPLEMENTED_SELF_TESTED; final review/acceptance pending | `apps/frontend/src/features/work/focus/`, `apps/frontend/src/features/search/`, BFF Focus/Search routes, Go Search service and migration0012; [author return](../testing/focus-search-implementation-20261101-r1/return.md) | Reconcile repaired FS-R1..03, test actual races/access loss/current cursors, preserve independent-review boundary |
| Manual Review Matrix / evidence basis | IMPLEMENTED within bounded manual/criterion scope | Review service/store/API/FE and `features/proof/components/evidence-basis.tsx` | Verify connected authorized exact-version/history/revocation paths; do not invent validated page/quote anchors or AI extraction |
| Per-Matter Agenda | PARTIAL | `apps/frontend/src/app/(app)/matters/[matterId]/agenda/page.tsx:39` uses one bounded page and warns about incomplete results | Keep the warning honest; add authoritative cursor-based cross-Matter My Agenda without unbounded per-Matter fanout |
| Consolidated work context | PARTIAL | Work detail has outcome/proof/dependencies and scattered exact-version references | Compose existing authorized context into one useful read-only section; no new access or local-path attachments |
| Cross-Matter My Agenda | NOT_IMPLEMENTED | No `/me/agenda` capability in the current API/module inventory | Implement authorized aggregate API plus FE, stable cursors/as-of, bounded filters and current access checks |
| Versioned playbooks | NOT_IMPLEMENTED | No persisted playbook domain/API/FE module | Implement immutable published revisions, preview and atomic idempotent instantiation under the approved policy below |
| Human-triaged intake | NOT_IMPLEMENTED | No intake entity/API/UI/lifecycle | Implement inside an existing Matter, including original request/provenance and explicit idempotent conversion into work |
| Matter guidance | NOT_IMPLEMENTED | `apps/backend/internal/core/domain/matter/context.go:18` has DECISION/FINDING/RISK/ENTITY, no versioned draft/publish guidance | Implement bounded Matter-only versioned guidance with attributable sources and access-loss handling |
| Private Saved Views | NOT_IMPLEMENTED; REQ-MC-P1-12 | Existing filters are URL state in `features/work/components/work-filters.tsx`, not persisted named views | Persist validated private filters, restore through existing lists and reauthorize underlying data |
| Other P1 depth | MOSTLY NOT_IMPLEMENTED / PARTIAL_FOUNDATION | Basic context/signature/filing records do not establish legal authorities/propositions/questions, entity master/temporal relations/provenance, advanced risks/filings/signatures/POA, management export or historical snapshots | Keep separate from this bounded assignment; require implementation-ready semantics and acceptance before adding them |
| Redline/DOCX editing, connector, Office, reminder delivery, LegalMemory/MCP, AI P2 | NOT_IMPLEMENTED / DEPENDENCY_OR_POLICY_GATED | The original [assessment](../research/eigenwelt-20261029/mattercontrol-integration-assessment.md) places these later and introduces provider/license/channel/sharing/retention dependencies | Do not substitute a mock or speculative adapter; outside this assignment |
| Voice / remote workers / model fusion | INTENTIONALLY_DEFERRED | Original assessment explicitly defers them | No implementation assignment |

The Filing outcome axis is **not** an open implementation gap: current `work_service.go:1025,1149`, `work_dto.go:91–103`, `work-grid.tsx:171` and `control-room-view.tsx:202,263,305` propagate/render it separately. D-BF1 remains a policy choice: APPROVAL without an OUTCOME criterion currently exposes NOT_DECLARED. Do not turn that choice into an automatic new guard.

## Product Owner decision recorded in this chat

On 2026-11-02 the PO explicitly selected: **“Duyệt phạm vi local và các quyền nêu trên (khuyến nghị)”** in response to the bundled scope question. Approved for this implementation assignment:

1. My Agenda reads only records currently authorized to the caller.
2. Workspace OWNER publishes playbook revisions; Matter OWNER applies them. Applying a template does not grant Matter membership or complete/verify work.
3. Intake belongs only to an existing Matter; its OWNER/EDITOR may record and triage it. No workspace inbox or external submission channel.
4. Guidance belongs only to its Matter; OWNER/EDITOR may draft, OWNER may publish. No firm/workspace library or implicit cross-Matter sharing.
5. Saved Views store personal private filters only. No sharing, copied report data or immutable snapshot feature.

This resolves these local scope/policy choices, not production access, retention, infrastructure/provider costs, deployment or P0 release. Existing priority IDs stay unchanged: Saved Views remains P1-12. Other P1/P2 capabilities are not promoted into this assignment. D-BF1 is unchanged and does not block the chosen local slices.

## Continuous delivery order

Filing regression/fix → preserve and test existing P0/Focus/Search/Review behavior → My Agenda plus contextual work composition → private Saved Views → playbook author/publish/preview/apply → human intake/triage/convert → guidance draft/version/publish → integrated regression and one consolidated candidate.

Implementation is delegated manually through the [full ZCode prompt](handoffs/MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102-PROMPT.md). Preparing it is not execution. One writer owns this assignment when the human actually delivers it. Internal checkpoints are for recovery, not requests to start the next wave.

Skipped: fresh tests/builds, browser, IdP, databases, cloud and source changes. Risk: this audit establishes source gaps and bounded scope; implementation and independent acceptance still need actual evidence.
