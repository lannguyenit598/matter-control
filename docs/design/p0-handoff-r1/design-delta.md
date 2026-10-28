# MatterControl Design Delta — Task MC-P0-DESIGN-R1

## 1. Provenance, Authority, and Execution Mode

- **Task ID**: MC-P0-DESIGN-R1
- **Parent Task**: MC-P0-ZCODE-DELIVERY / MC-003A Remediation & Continuation
- **Priority**: P0 (Mandatory Core Delivery)
- **Status**: `PREPARED_NOT_DISPATCHED / SOURCE_AND_SPEC_UPDATE_ONLY`
- **Execution Role**: Design Executor in selected project (`mattercontrol-step-03a-atlas-ux-concepts-f857`), coordinated by Local Codex
- **Future Implementer**: ZCode (Backend + Frontend product implementation)
- **Governance Root**: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`
- **Branch**: `codex/unified-project-flow`
- **Prepared Governance HEAD**: `a62d838791ba188838c4ff00b7b6e265ac775056`
- **Input Manifest**: `docs/testing/p0-design-handoff-20261026/inputs.json` (26/26 input files verified via SHA-256)
- **Execution Mode**: Local Codex / OpenDesign Cloud (secure BYOK, read-only design executor, zero unauthorized external dispatch, zero credentials/paid service invocation)
- **Boundary**: Output confined strictly to `docs/design/p0-handoff-r1/`. Zero edits to `apps/backend`, `apps/frontend`, `tools/inta-harness`, historical Antigravity R5 packets, BE01, scans, or frozen design artifacts.

---

## 2. Preserved Decisions (Non-Negotiable Baseline)

The following design decisions were delegated to Codex under PO authority (`D-UX01..04`, recorded in `docs/design/step-03a/design-decisions.json` and `docs/design/step-03a/design-decision-register.md`) and are strictly preserved without reopening:

1. **Visual Foundation (D-UX01)**:
   - Base is **Direction A (Enterprise Precision)**: single disciplined design system.
   - Selective inclusion of **Direction B causal impact rail** for dependency inspection and drill-down context.
   - Selective inclusion of **Direction C compact behavior** for high-density operational work.
   - No new A/B/C voting, no external UI library branding (no IBM Carbon, no Linear, no shadcn copy-paste).
2. **Density and Hierarchy (D-UX02)**:
   - **Comfortable** is the default density (minimum 44px row height, 8px vertical padding).
   - **Compact** is an explicit user opt-in (minimum 36px row height, 4px vertical padding).
   - Text size does NOT shrink with density; multiline legal titles, status reasons, and error text expand vertically and must never be truncated with ellipsis to force an artificial line count.
   - Selection, active filter/sort criteria, scroll position, and focus survive density switching.
3. **Control Room Information Architecture (D-UX03)**:
   - DOM reading order and visual hierarchy:
     1. Critical Blockers (`attention: CRITICAL` / `dependency: BLOCKED`)
     2. Next Actions queue
     3. Dedicated **Important Decisions** queue (prominently placed alongside Next Actions)
     4. Waiting On queue (with explicit internal accountable owners)
     5. Milestone Tracking (satisfied/total counts, explicit blocker reasons; zero percentage readiness)
     6. Evidence Gaps
     7. Recent Changes & Audit
4. **Responsive and Mobile Strategy (D-UX04)**:
   - Mobile supports overview, blocker triage, matter navigation, record details, evidence viewing, and permitted simple updates (e.g. status acknowledgment, basic note/owner edit).
   - Dense multi-column grid, complex bulk actions, and multi-file imports retain an explicit desktop-optimized alternative or deferred continuation, with zero hidden removal of P0 capabilities or security guarantees.
5. **Domain Semantics & 20 P0 Capabilities**:
   - Strict separation of five state dimensions: **Execution**, **Verification**, **Dependency**, **Timing**, and **Attention**.
   - `COMPLETED != VERIFIED`; `WAITING != BLOCKED`.
   - Requirement is an outcome/condition; Action is human work; Evidence Requirement is a criterion; Evidence is submitted proof.
   - No overall readiness percentage. No generic `Task` or `User` aliases.
   - Canonical Atlas T0 state remains byte-stable and truthful: zero eligible Next Actions at T0 (explicitly explained as blocked, not a missing data bug).
   - Submitter cannot verify own evidence; OWNER status does not confer automatic verifier authority.
   - File upload is not verification; filing receipt is not regulatory approval.
   - Reopening preserves audit history; cross-matter access is strictly denied (404-indistinguishable).

---

## 3. Existing (local-r3) to New (MC-P0-DESIGN-R1) Corrections Delta

| Item ID | Scope / Area | Existing State (local-r3) | New State (MC-P0-DESIGN-R1 Delta) | Rationale & Authority |
|---|---|---|---|---|
| **DELTA-01** | **Implementation Phasing Architecture** | Single exploratory review artifact without explicit engineering intake breakdown. | Concrete 7-Wave Delivery Plan (W1 Shell & Core Requirements → W2 Grid, Actions & Dependencies → W3 Evidence & Versions → W4 Filing Lifecycle → W5 Control Room & Context → W6 Bulk, Import, Export & Brief → W7 Golden Workflows & E2E). | Aligns UX design directly with ZCode implementer roadmap in `docs/implementation/p0-zcode-delivery-plan.md`. |
| **DELTA-02** | **Wave 1 Intake Specification** | App shell, session, and navigation were implied in HTML wireframe but lacked granular state specifications. | Comprehensive Wave 1 UX specification detailing App Shell, Workspace/Matter navigation, Sign-in/Session state, Requirement Create/Read, Scoped Event History, and all 7 error/edge states (`loading`, `empty`, `unavailable`, `forbidden`, `stale`, `conflict`, `unsaved-draft`). | Prevents ZCode implementation ambiguity in W1; pins exact role permissions and recovery flows. |
| **DELTA-03** | **Next Action T0 Truthfulness** | HTML prose explained no-candidate state, but wireframe card layout had partial ambiguity between empty state and loading state. | Explicit `EMPTY_EXPLAINED` card contract at T0 stating exact causal chain: 12 Actions present, 2 IN_PROGRESS blocked by unreviewed evidence, remaining NOT_STARTED blocked by prerequisite dependencies. Zero candidates displayed, zero invented work. | Satisfies RULE-021, AC-103, AC-144, and finding `UX-N08`. |
| **DELTA-04** | **Designated Verifier & Owner Separation** | Local concept HTML displayed reviewer labels, but detail drawer allowed simulated self-review in demo mode. | Strict visual and interaction separation: Submitter identity is immutable; Verifier must be a designated Matter Verifier who is NOT the submitter. If current user is submitter or non-designated, verification actions are disabled with explicit tooltip reason. | Resolves finding `UX-N04`, enforces RULE-006, AC-107, AC-140. |
| **DELTA-05** | **Bulk Edit Contract & Partial Results** | Simulated bulk update in concept-review applied uniform updates across selected rows. | Explicit bulk metadata allowlist (`internal_owner`, `due_date`, `description` note only). Type, links, state, and criteria are strictly non-bulk. Result contract specifies per-record atomic success/failure reporting with persistent failure reasons. | Resolves finding `UX-R01`, enforces RULE-013, AC-113, AC-133. |
| **DELTA-06** | **Proof-Edge vs Milestone Semantics** | Milestone readiness could be confused with proof verification in summary cards. | Explicit dual-criteria model: Proof-edge requires upstream `dependency: READY`, `execution: COMPLETED`, and `verification: VERIFIED`. Milestone readiness requires conjunction of designated required Requirements being COMPLETED + VERIFIED (or explicitly `NOT_REQUIRED`). | Resolves finding `UX-R04`, enforces RULE-003, RULE-008, AC-102, AC-105. |
| **DELTA-07** | **Delta Status Brief Windowing** | Draft brief showed snapshot summaries without formal window separation. | Strict window contract: Baseline $t_1$, As-of $t_2$ ($t_1 \le t_2$). Section A: Changes in $(t_1, t_2]$; Section B: Outstanding items at $t_2$. Stable chronological sorting, explicit "no changes recorded" state, provenance header. | Resolves finding `UX-N09`, enforces RULE-016, AC-119, AC-138. |
| **DELTA-08** | **Language & Label Overflow** | Fixed English labels in wireframes; Vietnamese labels existed only in review documentation. | Fully specified bilingual string length envelope (English baseline + Vietnamese diacritics/expanded text up to 140% width). Multiline flex/grid cell expansion rules defined; zero truncation of legal titles. | Resolves finding `UI-T01`, `OBS-UI-001`, enforces a11y & internationalization. |
| **DELTA-09** | **Mobile Alternative Workflows** | Grid on mobile was flagged as `NEEDS_CLARIFICATION` / vertical stacking. | Defined explicit Mobile Triage Card stack with filter chips, single-record drill-down, quick-acknowledge actions, and an explicit modal warning for complex bulk operations recommending desktop. | Resolves finding `UX-R05-MOBILE`, enforces D-UX04 and AC-150. |
| **DELTA-10** | **Authentication & External Dependencies** | Auth was treated as a black-box login screen. | Auth-provider screens marked strictly as `DEPENDENCY_PENDING` until architecture adoption. Product UI specifies standard session states (Active, Expired, Revoked, Cross-Matter Denied) with strict non-leaking 404 responses. | Enforces security invariants RULE-017, AC-134, AC-135. |

---

## 4. Stale Legacy Wording Errata

The following statements from earlier exploration rounds (STEP 03A local-r1 / local-r2 / initial briefs) are formally cataloged as **ERRATA** and superseded:

1. **Errata E-01 (Visual Direction Voting)**:
   - *Legacy Wording*: "Product Owner must choose between Direction A, B, or C before frontend development begins."
   - *Correction*: **SUPERSEDED**. Direction A (Enterprise Precision) was approved as the single foundation under PO delegation (`D-UX01`), incorporating B's impact rail and C's compact density. No PO vote is pending.
2. **Errata E-02 (Percentage Readiness)**:
   - *Legacy Wording*: "Display overall Matter readiness as a percentage (e.g. 78% Complete)."
   - *Correction*: **PROHIBITED BY DOMAIN CONTRACT**. Rule RULE-008 and AC-102 strictly prohibit overall percentage readiness. Readiness is expressed solely as satisfied/total counts of designated required prerequisites plus explicit blocker lists.
3. **Errata E-03 (Generic Task & User Model)**:
   - *Legacy Wording*: "Users can create tasks, assign them to team members, and check them off."
   - *Correction*: **SUPERSEDED**. MatterControl operates on distinct legal `Requirements` (conditions) and operational `Actions` (human tasks). Personas do not confer roles; rights require active Workspace and Matter memberships.
4. **Errata E-04 (Automated Verifier Assignment)**:
   - *Legacy Wording*: "The Matter Owner automatically verifies completed work."
   - *Correction*: **SUPERSEDED**. Rule RULE-006 strictly requires a matter-designated verifier who cannot be the submitter. Owner status alone does NOT confer verifier authority.
5. **Errata E-05 (Rendered Pass Claims)**:
   - *Legacy Wording*: "CSS contrast calculations confirm WCAG 2.1 AA PASS across all screens."
   - *Correction*: **RETRACTED AS ERRATA**. Source static sRGB ratios meet mathematical targets, but rendered browser contrast, focus ring visibility, and 200% zoom remain `RENDERED_NOT_RUN` due to policy restrictions on the local test target.

---

## 5. Outstanding Authority Gates and Prerequisites

Before ZCode executes product code for any wave, the following gates remain open and must be satisfied:

```
[GATE-INDEPENDENT-QA] (HIGH)
├── Status: INDEPENDENT_QA_PENDING (BLOCKED_BY_PROVIDER_ACCESS)
├── Requirement: Nonauthor independent domain and contract review of MC-003A / P0 handoff.
├── Owner: Codex Orchestrator to route when authorized provider/reviewer access exists.
└── Authority Constraint: Neither author (Codex/Antigravity) nor future implementer (ZCode) may self-approve.

[RENDERED-VALIDATION-GATE] (MEDIUM)
├── Status: RENDERED_NOT_RUN
├── Requirement: Headless/browser rendered testing at 1440px, 1280px, 390px, and 200% zoom.
├── Owner: Codex validation coordinator / Authorized prototype runner.
└── Authority Constraint: No mock screenshot or CSS static check can substitute for real browser evidence.

[STEP_03A_APPROVED / STEP_03B Gate]
├── Status: REWORK_COMPLETE_IN_REVIEW (Formal STEP_03A_APPROVED not yet issued).
├── Authority: Final PO formal design gate sign-off.
└── Boundary: This handoff prepares ZCode for execution; it does NOT constitute authorization to commit unreviewed code to `apps/frontend` or `apps/backend`.
```
