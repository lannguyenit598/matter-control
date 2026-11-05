Review status: COMPLETE for the assigned frozen reading set. BRAINSTORM, Observability and Operational SRE Debuggability lens. No Blocker finding; three Major implementation-readiness findings.

Actual reviewer: Local Codex subagent acting as `egm-codebase-details`. This is source/design analysis, not implementation, independent runtime acceptance or approval.

Reading confirmations:
- Read persona `/Users/nguyenvanlan/.codex/plugins/cache/egm/egm/0.1.0/agents/codebase_details.md`, integration document `/Users/nguyenvanlan/.codex/plugins/cache/egm/egm/0.1.0/docs/codex.md`, and `/Users/nguyenvanlan/.codex/RTK.md`.
- Read sibling `review-inputs-manifest.json`.
- Read ALL seven required frozen documents in full: `concepts_brief.md`; both requirements BRDs; `focus-search-codebase-design.md`; `focus-module-design.md`; `quick-search-module-design.md`; and `MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md`.
- Read both frozen component `AGENTS.md` files in full.
- Read these frozen actual source files in full: frontend `src/lib/mc/client.ts`, `src/lib/mc/errors.ts`, `src/lib/auth-provider.ts`, `src/app/api/auth/session/route.ts`, `src/app/(app)/layout.tsx`, `src/components/organisms/read-failure.tsx`; backend `internal/adapter/inbound/productapi/server.go`.
- Read selected source ranges: backend `internal/core/service/work_service.go:1240–1320`, `internal/core/service/workspace_service.go:995–1080`, `internal/adapter/outbound/postgres/matter_store.go:80–130`; frontend `src/features/work/repository.ts:1–160`.
- Semble search succeeded against the exact frozen root. All shell commands used `rtk`.
- All project evidence below refers to paths relative to `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/egm-focus-search-plan-20261101-r1/review-inputs`. No live source, memory, parent conversation or other reviews were consulted.

DETAILS-01 — Major — Successful HTTP responses can conceal unavailable Search capabilities.

Dimension: Observability and Operational SRE Debuggability.

Affected scope: `docs/architecture/quick-search-module-design.md:79–90,108,149`; `docs/requirements/quick-search-brd.md:103`.

Evidence: The proposed protocol deliberately permits HTTP 200 with one or more unavailable/stale groups. The stated trace contract records request IDs, status and duration only. Those fields cannot distinguish a healthy 200 from a response where Documents consistently fails. The BRD already permits status, type counts and duration without recording query text.

Existing versus proposed: Partial Search responses are proposed, not implemented. This is a missing diagnostic acceptance contract, not evidence of an existing incident or permission leak.

Operational risk: A service can appear healthy by HTTP success rate while a complete search category has stopped working. A slow fingerprint, pool wait and authorization dependency failure also need different remedies.

Minimum fix: Define one privacy-safe server outcome record for the new Search operation: HTTP outcome, fixed group name, group outcome, bounded reason code and duration. Capture stage timing for authorization/snapshot acquisition, fingerprint/page execution and response processing where needed to explain the preflight results. Explicitly exclude queries, result labels, cursors, actor/target identifiers and fingerprint values. Verify a forced single-group failure produces HTTP 200 plus a diagnosable unavailable-group outcome. Existing logging is sufficient; no analytics service or monitoring platform is required.

Counterargument: The UI already tells the user which group failed. That solves user-facing honesty, but does not allow an engineer to diagnose repeated degraded successes without reproducing the confidential search.

DETAILS-02 — Major — “Trace request IDs” lacks an executable correlation boundary.

Dimension: Observability and Operational SRE Debuggability.

Affected scope: `docs/architecture/quick-search-module-design.md:92,149`; `apps/frontend/src/lib/mc/client.ts:21–37,60–70,84–92,124–130`; `apps/backend/internal/adapter/inbound/productapi/server.go:110,221–230`.

Evidence: The frozen shared HTTP client supplies authentication and command headers, but its request/response contract neither forwards nor exposes a correlation identifier. The backend registers `requestMeta`, but that helper's implementation is outside the frozen selection; its existing behavior cannot be inferred. The visible central 5xx log records status, problem type and error text. The plan requires request-ID traces without specifying how a BFF request and its Go read are joined.

Existing versus proposed: The client shape is existing source. Complete browser/BFF/Go correlation for the new routes is unverified; this report does not claim the wider repository has no tracing.

Operational risk: On timeout or cancellation, an engineer may find a BFF failure and several Go reads without knowing which belonged together. Focus further fans one browser operation into classification/detail/name reads.

Minimum fix: During source reconciliation, inventory the existing request metadata mechanism and reuse it. Specify the exact identifier propagation and safe error-response behavior for the two new BFF routes and their downstream reads. Add one success and one timeout/cancellation check proving the same operation can be followed across BFF and Go without logging legal text or session identifiers. Do not introduce OpenTelemetry or a second tracing framework solely for this candidate.

Counterargument: Existing middleware may already provide everything required. If verified, this becomes a small documentation/test change rather than new instrumentation; the frozen client does not establish that integration today.

DETAILS-03 — Major — Isolated performance evidence does not establish that the two features can coexist with ordinary commands.

Dimension: Observability and Operational SRE Debuggability.

Affected scope: `docs/architecture/focus-module-design.md:89,97,147`; `docs/architecture/quick-search-module-design.md:108,124–126,162`; `concepts_brief.md:32–41,85–91`; `apps/backend/internal/core/service/work_service.go:1247–1311`; `apps/backend/internal/adapter/inbound/productapi/server.go:55–56,110`.

Evidence: Existing `MyActions` traverses readable Matters, loads each work graph and computes effective state/critical chain before ranking candidates. A Focus picker cap of 20 does not bound that underlying classification work. The proposed refresh runs independently in each visible tab. Search additionally hashes the entire authorized projection per requested group. Both use the same `/api/v1` admission limit. Sequential Search groups reduce simultaneous acquisitions within one request; they do not bound concurrent tabs or repeated typing.

The brief correctly acknowledges fingerprint cost and the Focus design already requires one-/five-tab measurements. Those acknowledged risks are not new findings. The missing piece is a combined acceptance scenario that checks ordinary product operations while both workloads run.

Operational risk: Each feature can pass an isolated timing check while their combined requests exhaust shared admission or database capacity, delaying the real work commands the BRDs require to remain usable.

Minimum fix: Extend P1's synthetic experiment with one combined scenario: five visible Focus tabs, repeated valid Search typing/paging and a representative ordinary command/read. Record full classifier work, complete fingerprint cost, admission refusals, pool wait, cancellation completion and ordinary-operation outcomes against the same fixture without the new workload. State concrete local pass/fail expectations before running it; this need not establish a production latency SLA. If it fails, first adjust refresh/request coalescing or the paging implementation rather than adding infrastructure.

Counterargument: Five visible tabs may exceed typical usage and the approved W1 fixture may be small. That is why the scenario should be labelled precisely and compared with baseline; small result pages alone are not evidence that the underlying work is small.

Minimal coherent plan recommendation: Keep the proposed architecture and privacy boundaries. Add the small diagnostic/correlation contract before building dependent UI, and make the P1 evidence include combined resource contention. Preserve the already specified fault, privacy-canary and real-browser checks. The biggest actual readiness weakness is that existing full-graph classification and proposed whole-projection hashing share product capacity without a combined acceptance test.

No new product decision is needed to add these checks. A genuine product trade-off arises only if measured coexistence cannot meet the selected freshness/search behavior: then present the measured alternatives for freshness or paging explicitly. Do not convert this review into a request to reapprove settled legal rules or infrastructure.

Skipped: tests, builds, browser/provider execution, live Git verification and all mutations, as required by the read-only assignment.
Remaining risk: frozen source supports these readiness findings, but cannot establish runtime load, production diagnostics or deployed privacy behavior.
