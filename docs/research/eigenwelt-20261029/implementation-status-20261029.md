# Eigenwelt recommendations: current implementation inventory

Date: 2026-10-29. Actual Local Codex. Method: Semble, exhaustive literal checks over product source, route registration, feature/service/migration inventories and targeted component reads. This is source presence assessment, not a full code audit or runtime acceptance. Concurrent work may change this snapshot.

| Recommendation | Source-level status | Evidence / gap |
|---|---|---|
| Focused workbench | PARTIAL | `apps/frontend/src/features/work/my-work-selection.ts`, `components/my-actions-view.tsx`, app My Actions route implement queue/current/Up next and URL selection. PO reports visual mismatch; source comparison confirms shell/type/spacing differences. No new rendered acceptance. |
| Task context / instructions / attachments | PARTIAL | Work-item details/outcome, proof criteria, evidence and document versions exist. Not a consolidated task-context/attachment workbench. |
| Evidence drawer | PARTIAL foundation | `features/proof/components/proof-panel.tsx`, proof repository and backend proof/evidence/version endpoints exist. Existing panel is not the proposed source/version drawer or page/quote citation contract. |
| Explainable document review matrix | NOT_FOUND_IN_PRODUCT_SOURCE | Operational work grid exists (`features/work/components/work-grid.tsx`); it is a work-item grid, not documents × review questions with persisted cited answers. No review service/migration/routes found. |
| Versioned firm playbooks/templates | NOT_FOUND_IN_PRODUCT_SOURCE | Template developer guides/shared layout templates are not legal playbook objects or preview/instantiation commands. |
| Human-triaged intake | NOT_FOUND_IN_PRODUCT_SOURCE | Historical evidence “intake” refers to agent handoff intake, not product legal requests. No product intake lifecycle/routes found. |
| Redlines / document editing | PARTIAL foundation | Document upload, exact versions, content download and promotion exist. No product tracked-change/redline editor/review flow found. |
| Calendar/deadline view | PARTIAL foundation | Work-item due dates, milestones and planning exist. No dedicated agenda/calendar view or external calendar sync found. |
| Saved views / report snapshots | PARTIAL foundation | URL queue/filter state, exports and deterministic Brief exist. No persistent named saved-view/dashboard or report-snapshot feature found. |
| Firm wiki / knowledge retrieval | NOT_FOUND_IN_PRODUCT_SOURCE | Matter context records are not a shared firm wiki, full-text authorized knowledge service or grounded assistant. |
| External storage connections | PARTIAL foundation | Filesystem/R2 object storage adapters exist; these store MatterControl objects, not DMS/Drive connectors with selected import and external ACL mapping. |
| Office add-in | NOT_FOUND_IN_PRODUCT_SOURCE | No Office channel/module found. |
| Private evaluations | PARTIAL | Memory/PG contract suites W1..W7 and tests exist. They are not evidence of a completed current-source Golden Workflow browser trial or a product model-evaluation service. |
| Scheduled reminders | NOT_FOUND_IN_PRODUCT_SOURCE | Due-date/timing logic exists; no user notification/scheduler delivery feature found. |
| Read-only assistant/MCP bridge / LegalMemory | NOT_FOUND_IN_PRODUCT_SOURCE | Developer MCP tooling and research docs are not a MatterControl user-facing API integration. |
| Voice / remote workers / fusion | DEFERRED_BY_ASSESSMENT; no product implementation found | These are explicitly not recommended for current P0. |

Implementation evidence searched: frontend product features/routes, backend service/API/migrations, proof panel, My Work selection and test contract inventory. Route list currently includes work, proof, documents, filings, control, import/export and Brief; no newly proposed feature endpoints. Negative findings mean no implementation located in these authoritative paths, not proof that no untracked/private branch could contain one.

No product source changes, builds, tests, browser/IdP/provider calls or acceptance gates executed by this inventory. AI extraction/assistant/contradiction remain P2-04/05/06. The PO's new request asks for an implementation handoff; it does not by itself configure external providers, resolve license terms, or settle new confidentiality policies.
