> **Current decision:** Human [DEC-028](inta-po-approval.md) selects INT-D01=INT-A at e7dbfbf. The unselected/awaiting-choice wording below is historical preparation. Execution now follows the [selected INTA-1 contract](../implementation/inta-approved-contract.md) and manual task gates; no runtime result is inferred.

# Step02.3 — Product Owner Integration/API/Auth Decision Package

Prepared by Codex PM/BA/Cloud/DevOps,2026-10-25 Asia/Ho_Chi_Minh, governance base e377568ac47f8f1b88e3875a8f13d7e57fc30667. Actual Claude Code owns the [scope proposal](../architecture/integration-scope-proposal.md) and [nine-decision analysis](../architecture/api-auth-decision-analysis.md). **PROPOSED / WAITING_PO_APPROVAL. No implementation or acceptance execution is authorized by this document.**

## The one selection needed for the next local milestone

**INT-D01 — Select a small transport-only integration, or wait for product API/auth.**

Already approved: H5 local work, W1 measurement inputs, local restore exercise targets and ARCH-Q3/Q5. Already accepted with limits: C01-NATIVE at52b60a4, R01/R02, native frontend and tiny tooling restore. These choices/results remain intact. The frontend Task feature and backend User API are different resources; existing builds do not connect them.

| Choice | What it enables | Trade-off / evidence limit |
|---|---|---|
| **INT-A — recommended** | A temporary isolated harness executes inside the pinned Next.js runtime, calls the existing frontend HTTP primitive over real REST into unchanged native Go and real disposable PostgreSQL. Check persistence, compatibility, errors/outage/recovery and request correlation | It is technical transport evidence only. No product screen or feature. Authentication, roles, Workspace/Matter isolation, browser/session and product security are outside this milestone; they remain mandatory product gates. Selecting INT-A explicitly requires PO approval of its one temporary harness-only endpoint, isolated outside the product app/build |
| INT-C — defer | Wait for an approved compatible product API/auth slice | Avoids temporary harness work; transport defects surface later together with product defects |

An authenticated temporary harness (INT-B) is not recommended or ready for implementation: token validation over an unscoped User API would still not prove authorization. If the PO requires auth in this milestone, Claude must return a revised scoped design and approval package first. No hardcoded/shared token or anonymous permission bypass is an option.

**Recommendation:** select INT-A and explicitly accept its transport-only evidence boundary. This does not waive any approved product security requirement. A Node-only client script cannot be reported as Next.js integration; the accepted result must demonstrate execution through the actual selected Next.js harness boundary.

**Benefit:** discover actual HTTP/schema/persistence/error compatibility problems before coupling them to MatterControl business features.

**Impact:** no business rules, permissions, product API catalogue, accepted C01 behavior, stack direction or hosting/provider choice changes. Backend source remains unchanged. Antigravity adds only isolated temporary test assets after contract approval; Codex later creates a fresh synthetic environment. Local infrastructure bill is unmeasured; no paid service is activated and no production cost is claimed.

**Risk:** the generic frontend client does not expose every wire detail; the finalized design must distinguish client checks from raw wire controls, with no invented header/status evidence. Harness isolation and loopback limits must be verified before execution. Unauthenticated synthetic local transport proves no safe access to legal data.

**Validation:** actual owner execution followed by independent OpenCode verification of the [acceptance matrix](../testing/integration-acceptance-matrix.md), then Claude architecture-conformance review. All runtime rows are currently NOT_RUN. No mock database, curl/process exit alone, source review or authenticated happy path substitutes for the required assertions.

**Approval owner:** Human Product Owner for INT-D01 scope/evidence boundary. Claude owns technical contract details; material deviations return to the PO.

## Other decisions remain visible without blocking local transport

The [analysis](../architecture/api-auth-decision-analysis.md) records all16 requested fields per decision, including impacts, prerequisites and evidence gaps.

| Decision | Current authority / recommended disposition | Approval owner when ready |
|---|---|---|
| INT-D02 identity provider/token integration | No provider selected. Keep the product sign-in/identity seam separate; evaluate portable OIDC, Cloudflare Access and self-hosted alternatives before selection. Synthetic User records are data, never identities | PO selects provider/material sign-in trade-offs; Claude defines validation |
| INT-D03 authorization/isolation | Preserve the approved active Workspace AND explicit Matter membership AND scoped role rule. Workspace OWNER has no implicit Matter access. No new policy approval requested; implementation/tests remain open | Claude technical enforcement, QA verification; PO for policy changes |
| INT-D04 production H topology | H5 already approved for local use. H1 needs hosting exception and provider evidence; H2 has a dated paid-plan conflict; H3 needs substantial adapter evidence; H4 stack/database substitution not selected. Keep production unselected | PO before material topology/cost exception |
| INT-D05 frontend F adapter | No exact adapter/feature fit verified. Native Node success selects none of F1–F4. Any adapter/Go-Wasm spike is a separate future assignment, not part of approving INT-A | Claude recommendation; PO material runtime/behavior trade-offs |
| INT-D06 storage/recovery | Preserve PostgreSQL direction and accepted tiny tooling restore limitations. No production database/object/backup provider, RPO/RTO or full-product recovery proof. No reassurance rerun | PO providers/objectives/cost; Claude recovery design |
| INT-D07 retention/admission/import/export parameters | Numeric deferral remains valid; no values invented or erased. Candidate correctness constraints are architecture proposals, not newly approved policy. Values and lifecycle validation required before production commitments | PO, with relevant legal/business inputs |
| INT-D08 workload/full cost | W1 is a local input envelope, not achieved capacity. Full service inventory/account eligibility/demand/headroom/bill remain unverified; $0/month remains a target | PO production envelope and cost exception |
| INT-D09 product errors/retry conventions | Native retryAfter1 is a template convention. Product units/range/header/catalogue and unknown-outcome recovery remain a future Claude proposal/PO decision; no silent retry or C01-PRODUCT closure | Claude proposal, PO material behavior decision |

## API/Auth and C01 boundaries

Approved product requirements constrain behavior. The fifteen historical architecture/API/security documents have independent DOCUMENT_REVIEW_PASS and await overall PO architecture approval. The request's phrase “approved architecture” does not promote those candidates to approval.

Authentication identifies a caller; authorization determines permitted operations; Workspace/Matter isolation limits which resources may be accessed. Their successful enforcement needs separate negative evidence at all direct/indirect retrieval and command paths. INT-A implements none of them and never disables the existing fail-closed session in order to connect.

C01-NATIVE stays accepted with its recorded limits. C01-PRODUCT remains OPEN/NOT_RUN for inaccessible-resource/current-rights cases, receipts/idempotency/unknown-outcome recovery, MatterUnitOfWork, product logging/error conventions and deployment-adapter cases applicable to the selected future topology. Transport checks can validate native problem propagation and persistence only.

## Approval record and exact next action

The human explicitly reassigned the remaining Claude clarification/review portion to OpenCode and skipped Claude review for this round. Actual OpenCode returned PASS_DOCUMENT_ONLY and closed the value/refId wording plus source-option and DB-stop evidence issues; Codex applied its bounded documentation clarifications. The [routing override](step-02-3-review-routing.md) supersedes the old manual Claude handoff for these current items. The historical Claude failure is retained; no Claude return/login is awaited for this current round. PO selection, final contract freeze and later execution/conformance gates remain required.

**No PO selection has been received for INT-D01.** This is a reviewable decision package, not a decision record. The INT-Dnn identifiers are proposals, not DEC approvals. The specific permission to send analysis packets to Claude/OpenCode authorizes analysis only.

Suggested approval wording:

> Select INT-A: the isolated local Next.js-runtime transport harness with unchanged native Go and real synthetic PostgreSQL. Accept that authentication, authorization, Workspace/Matter isolation and all product gates are excluded from this local milestone and remain mandatory later. Authorize only the finalized bounded technical PoC under that scope; no production/provider/paid/Step03 approval.

If approved, Claude first finalizes the exact temporary API/harness contract and exclusion criteria. Codex records the approval and issues exact per-repository owner tasks/manual prompts; ZCode operates unchanged Go, Antigravity implements the harness, Codex provisions the owned fixture, OpenCode verifies and Claude checks conformance. See the [conditional task plan](../implementation/step-02-integration-task-plan.md). Engineering is not dispatched in this step.

Stop at **Integration/API/Auth Decision Approval Gate**. MC-002 OPEN / WAITING_APPROVAL; C01-PRODUCT OPEN; Architecture Approval Gate NOT_PASSED; Step03 NOT_STARTED_BY_STEP02.3. A later local PASS cannot establish Cloudflare viability, full recovery or $0 cost.

Skipped: implementation, all runtime/database/integration tests, provider/account/paid activation and deployment. Risk: only independently reviewed proposal readiness can close this document step; all engineering and product-security evidence remains future work.


## Step02.4 continuation

Use the [current scope decision package](step-02-4-scope-decision.md) for the next PO response, conditional51-case classifications and execution-planning gates. This record remains historical Step02.3 input. No scope has been selected; no new architecture approval, implementation or runtime result is implied.
