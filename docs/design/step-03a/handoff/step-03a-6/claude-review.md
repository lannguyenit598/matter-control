# MC-003A-ARCH-COMPAT — Claude Code architecture compatibility review

## 1. Identity, invocation and revision

| Field | Value |
|---|---|
| Reviewer | **Claude Code (actual)**, CLI `claude --version` → 2.1.310 (Codex dispatch-status recorded 2.1.309 earlier; version drift noted). Model `claude-opus-5-5` (Opus 5.5) |
| Invocation | Interactive Claude Code session started by the human user, who pasted the Codex-prepared prompt. Not a Codex dispatch. No `claude auth` command, login, provider/model switch, settings change or new charge was initiated. Service/provider routing of this session was not inspected |
| Timestamp | 2026-10-25T07:21Z (UTC, artifacts written shortly after) |
| Repository | /Users/nguyenvanlan/.codex/worktrees/mattercontrol-step-03a-remediation/matter-control, branch `task/MC-003A-remediation` |
| Head reviewed | `6530858c6b64873fd416c5933083c35ecf5d71e7` (Codex review preparation). Design/intake base `dbcc4a96189dc185a5113a9ad8af3296494dd2b3` is its parent (ancestor check passed). Frozen local-r3 `24103d17b5c9ca5cd23ed7f9695cb623517c76fe` present |
| Step02 references | Immutable copies under `step02-reference/docs/`. All 7 `git rev-parse dd959b6:<path>` blobs equal the manifest `source_blob` |
| Frontend reference | `/tmp/mattercontrol-step02-frontend` and `/tmp/mattercontrol-step021-frontend`: both HEAD `3e5a642479acb789eb210e73fba956f3e85082e3`, origin `https://github.com/lannguyenit598/nextjs-atomic-starter`, `git status --porcelain` empty. No drift. Read-only; no clone/reset/install |
| Tools | rtk-wrapped shell reads, local Python hash/JSON checks (`python3 -I`), Semble search on the frontend checkout, one Context7 query (React `useOptimistic`, generic, no project content) |
| Writes | Only the four new files in this directory, each checked absent first. No commit, no edits to existing files, no Step02 worktree/harness access beyond the frozen copies |

**Self-review disclosure.** api-contracts.md, security-architecture.md, dependency-engine.md, document-lineage.md, filing-model.md and ADR-001/002/003 were authored by Claude Code `claude-opus-5-5` (MC-002-ARCH). This review checks the local-r3 design against them and against approved policy. It is **not** an independent review of those documents and cannot approve them. The PO Architecture Approval Gate remains **NOT_PASSED** (project-status at dd959b6: "ARCHITECTURE_APPROVAL_NOT_GRANTED").

## 2. Input verification and read depth

`review-input-manifest.json` (mode LOCAL_PREPARATION_ONLY_NO_TRANSFER_AUTHORIZATION, sent=false): **41/41 files match bytes and SHA256; 0 missing; 7/7 source snapshots match.** No input was missing.

| Depth | Files |
|---|---|
| Full | request.md, dispatch-status.md, design-gate-decision.md, controlled-handoff.md (incl. E-01), antigravity-intake/intake.md, api-contracts.md, inta-po-approval.md, inta-approved-contract.md, INT-D01-step-02-4.md, step-02-3-opencode-clarification-review.md, permission-matrix.md, business-rules.md RULE-001..021 table, golden-workflow-acceptance.md GW-01..03 + AC-161..163, interaction-guidance.md |
| Targeted sections | state-semantics.md (applicability, execution, verification, derived, filing tables), security-architecture.md §1-6, api-auth-decision-analysis.md §1, INT-D02/D03/D09, §3, dependency-engine.md §5-7, ADR-002 §1, ADR-003 §4-5, ADR-001 status, filing-model.md and document-lineage.md (model/stage/receipt/promotion lines), r3 ux-specifications (current contracts, §1.3, §2.2-§4.6, §5.03, §5.09-5.11, §7, §8, §12 grep), design-to-code.json (20 features + A-01..16 programmatically; 25 findings not reviewed individually), design-decisions.json (D-UX01..04), acceptance-criteria AC-112/124/128/133/139, MC-002-INT-A.md status, integration-scope-proposal.md outline |
| Grep / extract only | r3 HTML concept (349 KB; extracted `applyBulk`, `commitMetadata`, `renderBulkPreview`, `openBulk`, `closeDialog`, `closeThen`; no external URLs found), returned-output.txt (409/207/Zustand/focusFallback claims), handoff-report.md, srs.md, prd.md |
| Full (second pass) | design-tokens.json, capability-evidence.md, atlas-traceability.json, selected-design-system.md (lines truncated at 400 chars), the 25 design-to-code findings (id/classification/owner/severity/remaining_acceptance; the 5 ARCHITECTURE_DEPENDENT ones dispositioned in the matrix) |
| Not read | intake.json, findings-disposition.json (top-level keys only), project-atlas-dataset.md, three-golden-workflows.md (approved acceptance read instead), integration-scope-proposal.md body |
| Frontend source (3e5a642) | data-table.tsx, dialog.tsx, http-client.ts (§1-147), backend.ts, auth.ts, auth-provider.ts (resolveSession), action-result.ts, pagination.tsx (props), button.tsx (sizes), mobile-nav.tsx, globals.css tokens, confirmation-dialog.tsx (veto line), task services listing. TaskRepository interface not opened beyond listing |

`compatibility-matrix-input.json` was used only as the FR list. Its null verdicts are not reused as findings.

## 3. Authority map (what outranks what)

Approved: PRD/SRS, RULE-001..021, state-semantics, permission-matrix and golden-workflow acceptance (APPROVED_BY_PO / APPROVED_INPUT at 572835a); DEC-023..025; DEC-028 (INT-A, transport only); D-UX01..04 (APPROVED_UNDER_PO_DELEGATION). Candidate: every architecture document listed above (document review PASS, PO architecture approval pending). Unresolved PO trade-offs: ADR-001 hosting, ADR-003 frontend adapter, INT-D02 identity provider, storage/retention (TB-05/06). Proposal only: INT-D02..09 analysis. The historical "PROPOSED" labels were checked against project-status rather than assumed. security-architecture.md's own header still records OpenCode round-1 CHANGES_REQUIRED. For review status this review follows project-status at dd959b6, which records the final OpenCode PASS_DOCUMENT_ONLY for the architecture set. Either way, the document remains a candidate.

## 4. Findings by boundary

### A. Frontend composition — COMPATIBLE_WITH_CONSTRAINTS
The local-r3 UX can be composed from the starter without new dependencies:
- Grid = presentational `DataTable` plus feature-owned selection, keyboard and inline editing. Control Room panels = Card/Badge/EmptyState composition.
- Context drawers and dialogs = the existing native `Dialog`. Tokens = the existing single CSS-variable/@theme system with the `mc-*` roles mapped in.
- Density = data attribute + CSS. Mobile = row-cards under the same permissions.

Adaptations, not defects:
- the page-number `Pagination` cannot drive keyset paging;
- Button sizes sit below the 44px touch choice;
- `Dialog` unmounts children on close (source-observed);
- the starter has no focus fallback for a removed opener.

Draft loss and focus-to-body were **not reproduced**. Specialized compositions (Grid, evidence review, bulk result list, filing stepper) are feature components, not replacements of primitives. ADR-003 is unresolved, so data access must stay behind a feature service seam (C-API-1). Details: [constraints](antigravity-implementation-constraints.md).

### B. API contracts — COMPATIBLE_WITH_CONSTRAINTS against the candidate; not an approved contract
Design writes and aggregate reads map to candidate endpoints for all 20 FR. The remaining gaps are technical questions, not conflicts:
- **TQ-01:** impact preview before confirm for reopen/promote;
- **TQ-02:** control-room response shape per region;
- **TQ-05:** time-based "changes since";
- **TQ-08:** detail read routes. Candidate §2 enumerates no GET for node detail, dependency edges/graph, evidence/claims/assessments, the document version ledger, filing cycles, waits, parties or the milestone list (verified by grep).

The 412/200 dispositions are in §5. The antecedent 409/207 claims in the Antigravity return contradict the candidate and are already corrected by intake INT-01; no new conflict. The closed Step02.3 refId/envelope/16 KiB items are harness-only and not applicable to product; they are not reopened. Matrix: [API/Auth](api-auth-dependency-matrix.md).

### C. Authentication / authorization — design COMPATIBLE with approved policy; mechanism CANDIDATE; integration BLOCKED until the auth seam exists
The design gates on active Workspace AND explicit Matter membership AND scoped role (S-09). VIEWER is read/export only (S-10). OWNER alone cannot verify (RULE-006). Inaccessible resources get a uniform denial without identity or count. Authn is kept separate from authz.

Source findings:
- `backend.ts:25` falls back to the shared `API_TOKEN`;
- `auth.ts:33-45` grants `'*'` demo/anonymous sessions;
- `resolveSession` returns null (fail-closed).

These are acceptable in the starter. For MatterControl, C-AUTH-1/2 must hold before any product data flows. The IdP (INT-D02) is a PO decision, still unselected. INT-A proves no product auth, isolation, idempotency or business behavior. Verify-eligibility affordance lacks a read-model hint (TQ-03); the server's 403 remains authoritative.

### D. Domain invariants — COMPATIBLE
r3 S-01..S-13, §4 and the controlled-handoff contract preserve every listed invariant:
- Requirement≠Action, criterion≠Evidence, COMPLETED≠VERIFIED, WAITING≠BLOCKED;
- server-derived dependency and milestone readiness (distinct RULE-003/RULE-008 predicates);
- exact-version lineage with explicit OWNER promotion, and signature completeness as a separate observation;
- filing receipt ≠ outcome, repeated cycles retained, negative outcome via OWNER CANCELLED;
- append-only history.

Two implementation hazards are recorded as constraints:
1. The concept's local `commitMetadata` checks each row against its *current* revision at commit. Production must CAS against the preview-bound revision (C-BULK-3).
2. r3 "structured draft" for import must not become a persisted draft record state (matrix FR-013; spec wording clarification by the UX owner).

### E. UI state and interaction — COMPATIBLE_WITH_CONSTRAINTS / DEFERRED_TO_IMPLEMENTATION
Rules for the interaction states:
- **Optimistic display:** only for single-record metadata fields; never for gates or axes (C-OPT-*).
- **Pending/rollback:** explicit, not implied.
- **Conflict:** a 412 opens reconciliation with the server value and the retained draft.
- **Bulk:** per-row atomicity with a persistent result list, failed rows still selected, and a failed-only re-preview.
- **Unknown outcome:** a mutation timeout, network error or 503 is outcome-unknown and is retried with the same Idempotency-Key. The starter currently treats it as plain failure (`action-result.ts:17-23`, `http-client.ts:109-124`).
- **Drafts:** owned above the Dialog.
- **Focus:** a filtered-out trigger falls back to the labeled container.
- **Nested editors:** keep their own keys.

Starter `toActionFailure` collapses 403/409/412/428/503 into generic text and needs typed results at feature level. All keyboard, focus, contrast and zoom acceptance remains runtime work (G3/G4). Static contrast is not computed acceptance.

### F. Golden Workflows — COMPATIBLE at document level
GW-01, GW-02 and GW-03 each trace to candidate endpoints, approved state guards and matrix permissions step by step (API/Auth matrix §D):
- GW-01 Transaction: Approval→…→Post-Closing;
- GW-02 Due Diligence: Request→…→Resolution;
- GW-03 Filing: Requirement→…→Approval, including the repeat-supplement and rejection alternatives.

No P0 build is implied. AC-161..163 require persisted behavior and stay NOT_RUN.

## 5. Candidate 412 / 200 disposition (explicit)

| Item | Classification |
|---|---|
| 412 native INT-A (T10) | **Already approved contract — transport scope only** (DEC-028/INTA-1); runtime NOT_RUN; not product evidence |
| 412 product stale-revision (and stale-criterion-revision) | **Compatible proposal** — CANDIDATE_NOT_YET_APPROVED; consistent with RULE-018; client must always send If-Match (candidate 428 on missing is stricter than native) |
| 200 product bulk with per-row outcomes | **Compatible proposal** — CANDIDATE_NOT_YET_APPROVED; consistent with RULE-013/AC-112/AC-133; stale rows arrive as STALE inside 200, never 412; 200 with failures is not success |
| 200 bulk under INT-A | **Not applicable** (no bulk route) |
| 409-for-stale / 207 (Antigravity return) | **Contract conflict with candidate — already corrected by intake INT-01**; no further action |

No candidate is promoted to an approved requirement by this review.

## 6. Conflicts and required changes

No CHANGE_REQUIRED against approved policy or D-UX01..04 was found. Bounded items:

| # | Source | Type | Smallest fix | Owner | Acceptance |
|---|---|---|---|---|---|
| K-1 | r3 HTML `commitMetadata` uses current revision at commit | Concept simulation shortcut (not a design defect) | Production binds CAS to preview revision (C-BULK-3) | Antigravity / ZCode | Contract test: row changed between preview and commit → STALE, unchanged |
| K-2 | r3 §4.6 / I-10 "structured draft" | Spec wording ambiguity | Define "Draft" as pre-confirm preview; no draft record state | Codex/OpenDesign (UX spec) | Spec line updated or corrigendum; no new state in implementation |
| K-3 | r3 I-11 / permission-matrix "impact summary" vs candidate post-commit impact | Needs technical decision (TQ-01) | Server dry-run or labeled non-authoritative preview + server result after commit | Claude (contract), Codex/OpenDesign (copy) | Decision recorded before reopen/promote slice |
| K-4 | FR-009 per-region stale/error vs unspecified control-room shape | Needs evidence (TQ-02) | Specify sectioned response | Claude / ZCode | Contract shows per-section status/asOf |
| K-6 | Candidate §2 has no detail read routes (TQ-08) | Needs evidence: contract detail, not a conflict | Enumerate read routes/shapes with revision/asOf/uniform 404 | Claude / ZCode | Read catalogue present before drawer/tab integration |
| K-5 | Starter seams (`backend.ts:25`, `auth.ts:33-45`, `action-result.ts:48-70`, `http-client.ts:82-86`) | Implementation adaptation | C-AUTH-1/2, C-API-2/3, C-IDEM-2 | Antigravity | Unit tests on mapping; negative auth tests in first slice |

**ADR:** none proposed. No material new architectural choice arises. TQ-01..08 are contract-detail questions inside existing candidate documents, and none edits api-contracts.md here. Remaining technical questions: [API/Auth matrix §E](api-auth-dependency-matrix.md).

## 7. Coverage and verdict

| Coverage | Level |
|---|---|
| Document | Substantial. Full or targeted reading of the governing inputs listed in §2; some inputs unread as listed |
| Source | Partial. Frontend starter seams read at 3e5a642; r3 HTML extracted for bulk/dialog only; no backend source reviewed in this task |
| Runtime | **None.** No build, test, server, browser or rendering. INT-A runtime is NOT_RUN and proves no product endpoint |
| Security | **None verified.** Policy and candidate mechanism compared on paper only; no negative test, token or isolation evidence |

**Verdict: `ARCHITECTURE_COMPATIBLE_WITH_CONSTRAINTS_DOCUMENT_ONLY`.**

Scope of the verdict:
- It means the frozen local-r3 design, D-UX01..04 and the Antigravity-reported feasibility are compatible with approved policy and with the candidate architecture, subject to the listed constraints.
- It is not a runtime PASS, security verification, approval of the candidate architecture, or closure of G3 rendered or G4 independent QA.
- The open TQs and the absent auth seam block integration of the matching slices, not this document verdict.

FR status counts: 16 COMPATIBLE_WITH_CONSTRAINTS, 1 COMPATIBLE (FR-003), 2 CANDIDATE_NOT_YET_APPROVED (FR-012 bulk, FR-018 auth mechanism) and 1 UNKNOWN / NEEDS_EVIDENCE (FR-009 control-room shape).

The matrix also holds:
- per-row dispositions for all A-01..A-16, so Codex can move each G5 row: A-01/02/06/13 candidate or PO-pending; A-09/11 deferred to implementation; A-12 compatible; the rest compatible with constraints;
- the 5 ARCHITECTURE_DEPENDENT findings (UX-R01/R02/R04/N04/N09), each compatible at document level and still open for independent QA and runtime tests;
- 12 cross-cutting rows, each carrying requirement IDs.

Full matrix: [architecture-compatibility-matrix.json](architecture-compatibility-matrix.json).

## 8. Gate status (proposed for Codex intake; not self-approved)

| Gate | Proposed status |
|---|---|
| G5 architecture compatibility | Actual Claude review returned: ARCHITECTURE_COMPATIBLE_WITH_CONSTRAINTS_DOCUMENT_ONLY. Integration of each slice still needs the then-approved contract, the auth seam and negative tests |
| G3 rendered | Unchanged: BLOCKED_BY_TOOLING / NOT_TESTED |
| G4 independent QA | Unchanged: PENDING |
| PO Architecture Approval Gate (MC-002) | Unchanged: NOT_PASSED |
| MC-003A | Unchanged: REWORK_REQUIRED at overall gate; not DONE |
| STEP03B / product implementation | NOT_AUTHORIZED |

Exact next steps:
1. Codex intakes these four artifacts (author, tool, revision, hashes).
2. Codex records K-2 as a UX-spec wording item for the UX owner.
3. Codex tracks TQ-01..08 under the architecture workstream for resolution with the first relevant slice.
4. Codex keeps G3/G4 as separate gates.

No routine choice is returned to the PO. The PO-owned items are the IdP (INT-D02), hosting/adapter (ADR-001/003), retention/limits (TQ-07) and the overall Architecture Approval Gate.

## 9. Skipped and remaining risk

Skipped:
- full reads of the inputs marked "Not read" in §2;
- the 349 KB HTML beyond the extracted functions;
- individual review of the 20 non-architecture design-to-code findings (QA/render-owned);
- backend source;
- any build, test, render or browser run;
- the Next.js 16.4.2 docs (no version-specific Next claim is relied on here);
- verification of the installed React behavior (the Context7 reference docs only).

Remaining risk:
- **HIGH:** product auth seam absent, and the IdP unselected.
- **HIGH if mis-implemented:** bulk-200-as-success and unknown-outcome-as-failure.
- **MEDIUM:** the control-room shape, the unenumerated detail reads (TQ-08), reopen/promote impact preview, starter error flattening, and ADR-003 transport uncertainty.
- **LOW:** import "draft" wording and pagination adaptation.

All rendered, keyboard, contrast and security risks remain open under G3/G4 and later negative tests.
