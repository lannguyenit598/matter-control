# MC-FOCUS-SEARCH-CODEBASE-DESIGN-20261101

Owner: actual Local Codex. Priority P1 implementation design. Status IN_REVIEW / DESIGN_CANDIDATE. Requirement linkage: direct PO request for codebase design from Focus and Quick Search BRDs; FR-FOCUS-01..14, AC-FOCUS-01..18, QS-BR-001..007, QS-AC-001..018 (feature-local proposals, no canonical renumbering).

Scope: design deep modules/interfaces/seams/adapters, current-source gap map, FE/BFF/Go/SQL/storage behavior, test surfaces and one continuous implementation handoff. Inputs: current two BRDs, permissions, shared contract, app/work/auth/palette/client source, Go read/service/PG snapshots and actual schema. Baseline codex/unified-project-flow at978d8fc plus preserved dirty work. Dependencies: selected CodebaseDesign plugin local workflows and current source. No dependency installation, implementation, runtime/resource action or provider mutation.

Outputs:

- `docs/architecture/focus-search-codebase-design.md`
- `docs/architecture/focus-module-design.md`
- `docs/architecture/quick-search-module-design.md`
- `docs/implementation/handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md`
- `docs/testing/codex-focus-search-design-20261101-r1/`

Acceptance: trace current gaps; small caller interfaces; actual file paths/capabilities distinguished from proposed paths; identity/privacy/concurrency/pagination/normalization/error semantics explicit; bounded no-engine/no-SQL-Focus alternatives compared; continuous engineer plan and BRD-linked QA coverage. Validate documentation anchors/links, source pins, no executable contract/approval status mutation, and document formatting.

Reviewer: nonauthor architecture/API and product intake pending; this author does not self-approve release or change BRD acceptance. Engineering handoff PREPARED_NOT_DISPATCHED. Tests: documentation/source integrity only; all new Focus/Search product/browser/PG/provider tests NOT_RUN. Completion evidence and selected skill paths in evidence return. No additional Codex agents/external agent invocation this design task.

Risks/next: actual browser IDB/focus/AT, SQL Unicode/ICU support/scale plans, dedicated cursor key and real provider behavior require implementation-time evidence. Next action is explicit assignment of the prepared handoff to one source writer. No commit/push/deploy or automatic source work from design preparation.
