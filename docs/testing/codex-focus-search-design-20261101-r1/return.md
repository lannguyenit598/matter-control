# Focus + Quick Search codebase-design return

Task MC-FOCUS-SEARCH-CODEBASE-DESIGN-20261101. Actual Local Codex, no external engineering-agent dispatch or subagent execution. Branch codex/unified-project-flow, HEAD978d8fc plus preserved dirty source. Status DESIGN_CANDIDATE / IN_REVIEW; engineer handoff PREPARED_NOT_DISPATCHED. No production, business-scope or independent design acceptance claimed.

## Delivered

- [Package and continuous implementation plan](../../architecture/focus-search-codebase-design.md).
- [Focus module interface/storage/state/revalidation design](../../architecture/focus-module-design.md).
- [Quick Search module interface/BFF/Go/SQL/cursor/privacy design](../../architecture/quick-search-module-design.md).
- [Complete implementation handoff](../../implementation/handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md).
- [Task record](../../implementation/tasks/MC-FOCUS-SEARCH-CODEBASE-DESIGN-20261101.md).

The selected plugin routes this specific module/interface request to its bundled codebase-design workflow. Its Module/Interface/Seam/Adapter/Depth vocabulary and dependency/test-seam guidance were applied; improve-codebase-architecture and setup-ts-deep-modules were not invoked. No plugin/tooling installation or agent configuration change.

## Findings resolved in the design

1. Focus needs atomic cross-tab coordination, not localStorage locking or per-tab timers. IDB CAS and a content-free generation fence prevent stale post-End/logout resurrection. Title/target display and persisted references have different lifetimes.
2. Draft namespace is not a principal identifier; app header is outside the existing page draft provider. Use a token-free server identity projection and persistent app composition without exposing Session.accessToken.
3. Focus eligibility comes from server next/order, and absence alone is not proof of access revocation. Existing Go reads suffice; no domain Focus mutation/table.
4. Existing mcRequest treats all POSTs as commands. Search read-POST needs narrow explicit read semantics; original write UNKNOWN rules remain.
5. Search cannot filter a first200 client cache. Authorized SQL projection precedes matching/limit; a fingerprint and anchor-ID cursor define honest restart on concurrent change. No hidden records or broad Workspace revisions enter that fingerprint.
6. Cursor encoding/normalization/provider support are explicit: dedicated AEAD key, no query/title in cursor, EN/VI root-lower profile, literal matching and disposable PG17/18 capability tests before deployment claims.

## Validation

Source paths and current capabilities were read directly after Semble. design-inputs.json pins37 actual input files; proposed paths are deliberately not described as existing. Document checks cover local links, code fences, defined BRD IDs, scope/NOT_IMPLEMENTED labels and input closing hashes. Prettier runs only on new design/handoff/task/evidence Markdown. See checks.json for actual outcomes. No product executable tests, browser runs, database migrations, dependency install, provider provisioning, runtime restart, source commit/push or deployment in this task.

No existing BRD, canonical approval/contract, UI source, schema, pass/fail ledger or runtime was changed. The handoff gives one writer a full local-candidate sequence rather than asking for continuation after every stage; actual assignment is still separate from preparation.

Remaining design intake: confirm the content-free Focus fence and EN/VI matching profile interpretations, then implement/test the candidate and obtain a nonauthor review. Real IDB/AT/focus, clock limits, SQL capability/scale and Supabase/key provisioning evidence are future work, not feasibility already proved.

Skipped: application implementation and all runtime/provider/independent acceptance. Risk: source-aware design is not concurrency/security/performance or release proof; later implementation must pass the new negative cases as well as normal journeys.
