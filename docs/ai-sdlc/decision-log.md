# Decision Log

| ID | Date | Decision / proposal | Authority | Status | Evidence / consequence |
|---|---|---|---|---|---|
| DEC-001 | 2026-10-24 | MatterControl positioning and Transactions & Corporate vertical; discovery closed | Human | APPROVED_INPUT | [Original request](step-00-request.md), [baseline](../product/README.md) |
| DEC-002 | 2026-10-24 | Official team roles and Human approval areas | Human | APPROVED_INPUT | Original request; RACI translates the assignments |
| DEC-003 | 2026-10-24 | Use supplied Go/Next.js templates, OpenDesign, Cloudflare Free Tier; target $0/month for verified workload | Human | APPROVED_CONSTRAINT | Feasibility is unverified; no architecture/cost exception approved |
| DEC-004 | 2026-10-24 | Create a local governance Git repo and use structured Git handoff as current baseline | Codex, within Step 00 scope | IMPLEMENTED_WITHIN_SCOPE | Empty folder observed; task files and protocol created; no remote configured |
| DEC-005 | 2026-10-24 | Do not execute invalidly signed OpenDesign | Codex, verification boundary | HISTORICAL_BOUNDARY | Later user logs report valid signature and MCP registration; live readiness remains unverified |
| DEC-006 | 2026-10-24 | Use Step 00 operating model; old proposed Step 00A audit superseded | Human | ADOPTED_FOR_USE / PROPOSAL_SUPERSEDED | Explicit Step 00A directive; no inference that all Step 00 evidence passed independent review |
| DEC-007 | 2026-10-24 | Step 00A is Canonical Product Context, not technical audit | Human | APPROVED_INPUT | [Step 00A request](step-00a-request.md), [rebaseline](scope-rebaseline.md); no code/architecture/UI/deploy |
| DEC-008 | 2026-10-24 | Product direction and initial 19 P0 rows / 14 P1 / 7 P2 baseline approved; three workflows are MVP acceptance targets | Human | APPROVED_INPUT | [Capability register](../requirements/p0-p1-p2-priorities.md); no blanket reapproval needed |
| DEC-009 | 2026-10-24 | A/B full documents unavailable | Human confirms input fact | HISTORICAL_FACT_CLARIFIED_BY_DEC-011 | PO answer “chưa có”; originals never in repo/workspace, not missing mandatory inputs |
| DEC-010 | 2026-10-24 | Produce source-independent artifacts with explicit partial/assumption labels; retain source gate | Codex within scope | SUPERSEDED_BY_DEC-011/012 | Historical b5224ce source gate; current completion follows SRC-00A1 |
| DEC-011 | 2026-10-24 | Approved prompts are valid initial context; originals never in initial empty repo/workspace, archival optional | Human | APPROVED_INPUT | SRC-00A1 §2/7; context-provenance.md; no direct A/B verification claimed |
| DEC-012 | 2026-10-24 | Explicit seven JTBD, refined capability names/coverage and twelve revised exit criteria | Human | APPROVED_INPUT / APPLIED | SRC-00A1 §5/10/11; preserve IDs, add P0-20; Step 00A COMPLETED, Step 01 READY_FOR_BUSINESS_ANALYSIS; task IN_REVIEW, independent review Pending |

| DEC-013 | 2026-10-24 | Authorize Step 01 BA with Codex ownership; stop at Product Requirements Approval Gate | Human | APPROVED_INPUT | step-01-request.md; no architecture/code/UI/deploy or automatic Step 02 |
| DEC-014 | 2026-10-24 | Send explicitly named baseline and Step 01 documentation packets to configured OpenCode/provider for independent reviews | Human | APPROVED_EGRESS_FOR_NAMED_PACKETS | Explicit chat replies; no real legal data/credentials; read-only review, no blanket external publishing permission |
| DEC-015 | 2026-10-24 | Close MC-00A for 20f12fe after actual OpenCode PASS and DoD evidence assessment | Codex records evidence | DONE_BASELINE_ONLY | REV-00A returned result; no Critical/High, advisory findings disposition; Step 01 proposals not covered |

APPROVED_INPUT is evidence from the supplied request, not an approval of all generated documents. Later decisions need context, options, consequences, approver and source/revision. Architecture ADRs will live under docs/architecture/ when assigned.

## Step 01 Product Owner decisions — closure

| ID | Date | Decision | Authority | Status | Evidence / consequence |
|---|---|---|---|---|---|
| DEC-016 | 2026-10-24 | Approve all recommendation B choices for OBD-02..08/10/11 (OBD-08 B/B), exact subject 572835a | Human Product Owner | APPROVED / RECORDED | [Direct human answer and scope](step-01-approval.md); MC-001 DONE / Step 01 COMPLETED; no behavioral edits, no Step 02 start |
| DEC-017 | 2026-10-24 | Defer numeric workload, retention period and RPO/RTO to Step 02 feasibility | Human Product Owner | DEFERRAL_APPROVED / VALUES_PENDING | [Direct human answer](step-01-approval.md); values require approval before commitments/release; no cost/stack/retention/lifecycle guarantee |

## Step 02 assignment and packet authorization

| ID | Date | Decision | Authority | Status | Evidence / consequence |
|---|---|---|---|---|---|
| DEC-018 | 2026-10-24 | Start Step02 with Claude architect, Codex cloud/orchestration, external owner audits and independent QA; stop Architecture Approval Gate | Human Product Owner | APPROVED_ASSIGNMENT | step-02-request.md; approved constraints retained; no production/Step03/full implementation |
| DEC-019 | 2026-10-24 | Send exact prepared162-snapshot (~795KB) Step02 packet to Claude Code/Anthropic | Human Product Owner | APPROVED_NAMED_PACKET_EGRESS | Direct reply “Cho phép gửi packet Step 02 này tới Claude Code/Anthropic”; step-02-input-manifest.json; all tools/MCP disabled; initial automatic egress rejection resolved |

| DEC-020 | 2026-10-24 | Send named30-snapshot (~338KB) Step02 architecture review packet through configured OpenCode provider | Human Product Owner | APPROVED_NAMED_PACKET_EGRESS | Direct reply “Cho phép gửi packet review Step 02 này qua OpenCode”; actual round1 CHANGES_REQUIRED; tools denied |
| DEC-021 | 2026-10-24 | Send prepared32-snapshot (~367KB) Step02 correction packet to Claude Code/Anthropic | Human Product Owner | APPROVED_NAMED_PACKET_EGRESS | Direct reply “Cho phép gửi packet sửa Step 02 này tới Claude Code/Anthropic”; hash527f5378…f87db53; initial new-payload auto-review rejection resolved; tools/MCP disabled |
| DEC-022 | 2026-10-24 | Send corrected32-snapshot (~411KB) Step02 review packet and further corrections/reviews of the same Step02 document scope between Claude Code/Anthropic and configured OpenCode | Human Product Owner | APPROVED_BOUNDED_REVIEW_LOOP_EGRESS | Direct reply “Cho phép packet này và các vòng sửa/review cùng phạm vi Step 02”; tools/MCP disabled, no credentials/real legal records/out-of-scope documents; no architecture/cost/activation approval |

## Step 02 partial decisions — local validation

| ID | Date | Decision | Authority | Status | Evidence / consequence |
|---|---|---|---|---|---|
| DEC-023 | 2026-10-24 | Approve H5 isolated local technical PoCs with synthetic data after owner-tool integrity verification | Human Product Owner | APPROVED_LOCAL_ONLY | Direct reply “Phê duyệt H5 local”; [scope](step-02-local-approval.md); no cloud/paid/production/full implementation/Step03 approval |
| DEC-024 | 2026-10-24 | Approve W1 measurement envelope and local restore targets RPO24h/RTO8h | Human Product Owner | APPROVED_LOCAL_TEST_INPUTS | Direct reply “Duyệt W1 và mục tiêu restore local”; [exact values](step-02-local-approval.md); no measured capacity or production guarantee; retention/import limits remain open |
| DEC-025 | 2026-10-24 | Accept ARCH-Q3 recorded-time Brief window and ARCH-Q5 post-reopen evidence/new proof-epoch assessment interpretation | Human Product Owner | ACCEPTED_INTERPRETATIONS | Direct reply “Chấp nhận cả hai diễn giải”; [exact scope](step-02-local-approval.md); no authority-reissue requirement or unrelated policy exception |

## Step02.1 explicit authority

| ID | Date | Decision | Authority | Status | Evidence / consequence |
|---|---|---|---|---|---|
| DEC-026 | 2026-10-24 | Continue MC-002 with agent provenance/recovery, owner audits/local PoCs, Codex synthetic restore, independent verification and full manual prompts when needed | Human Product Owner | APPROVED_ASSIGNMENT | step-02-1-request.md; no full product/UI/production/paid activation; gate stays open if feasibility unresolved |
| DEC-027 | 2026-10-24 | Send exact14-snapshot58203-byte frontend audit packet to Antigravity/Google; select Gemini3.8Flash with thinkingHIGH | Human Product Owner | APPROVED_NAMED_PACKET_AND_MODEL | Direct answer “có và chọn model là gemini 3.8 flash với thinking là HIGH”; actual available slug gemini-3.8-flash-high and effort high pinned; no global setting change or blanket new-payload permission |


## INT-D01 explicit Product Owner scope approval

| ID | Date | Decision | Authority | Status | Evidence / consequence |
|---|---|---|---|---|---|
| DEC-028 | 2026-10-25 | Select INT-D01=INT-A at e7dbfbf; permit isolated local temporary Next harness→REST→unchanged Go52b60a4→new synthetic PostgreSQL after finalized contract/task prerequisites | Human Product Owner, direct chat approval | APPROVED_LOCAL_SCOPE / EXECUTION_PENDING | [Approval and limits](inta-po-approval.md), [frozen INTA-1 contract](../implementation/inta-approved-contract.md);36required/14product-deferred/1production-blocked, all51NOT_RUN. Stop at manual handoff if direct engineering unavailable. No auth/product/production/Cloudflare/$0/recovery waiver, no automatic fallback/merge/MC-002 DONE |
