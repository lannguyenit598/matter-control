# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas are user goals, not application roles (approved, DEC-016); one person may serve several:

- **Transaction Owner** — coordinates the matter and closing readiness; needs state, blockers, milestones, decisions, next actions, evidence gaps. Failure to avoid: declaring readiness because tasks look complete.
- **Contributor** — performs accountable work; needs My Actions, Waiting On, assignment, due dates, required proof, bulk tools. Failure to avoid: working from stale versions or hidden prerequisites.
- **Reviewer / Manager** — assesses proof and communicates progress; needs changes, verification, exceptions, versions, blockers, pending decisions, delta brief. Failure to avoid: treating reported progress as verified truth.

Application roles are separate (OWNER / EDITOR / VIEWER, permission matrix). Desktop-first users doing high-stakes legal work; responsive/mobile supports suitable workflows, not full parity.

## Product Purpose

MatterControl gives legal and transaction teams a single operational view of matter state, dependencies, blockers, evidence, decisions, and change history. Success means understanding the work faster and making fewer operational mistakes — not visual spectacle or animation count.

## Positioning

**Control Plane for High-Stakes Legal Work**; product principle: **The System of Operational Truth for Complex Legal Matters**. Initial vertical: Transactions & Corporate Legal Work. Discovery is closed; positioning is an approved input.

The unit of coordination is a Matter — with Requirements (conditions to satisfy), Actions (work people perform), evidence criteria and supplied proof, dependencies, documents/versions, filings, and traceable changes. Completion describes execution; verification describes proof; neither a task count nor an attachment count establishes closing readiness. Not a generic task manager, legal-themed Jira, virtual data room, or legal AI chatbot.

## Operating Context

- Three acceptance workflows: GW-01 Transaction/Restructuring, GW-02 Due Diligence, GW-03 Regulatory Filing (`docs/product/three-golden-workflows.md`).
- Two primary surfaces: Matter Control Room (manager view of state, blockers, next actions, Waiting On, milestones, missing evidence, decisions, recent changes) and Operational Grid (contributor bulk work: inline editing, import trackers, export, keyboard navigation).
- Delta-based Status Brief for deterministic progress reporting (same scope, baseline, and as-of time ⇒ same result).
- Bilingual vi/EN product; user locale via cookie (D-2). Vietnamese labels follow `docs/testing/opendesign-ux-plan-review-20261101-r1/terminology-final.md` (UX Owner ratified; PO approval R10 pending).
- All demonstration/evaluation data is synthetic; no real legal matter data, secrets, or credentials in artifacts.
- Auth via ZITADEL (locally provisioned, loopback-only); membership-only data access model.

## Capabilities and Constraints

- Full Operational MVP = all 20 P0 capabilities (`docs/requirements/p0-p1-p2-priorities.md`); P1/P2 deferred per approved baseline. AI workbench is a later phase (PO decision 2026-10-29), outside P0 W1–W7.
- Five state dimensions (approved value sets): Execution (NOT_STARTED/IN_PROGRESS/WAITING/COMPLETED/CANCELLED), Verification (NOT_REQUIRED/UNVERIFIED/PARTIALLY_VERIFIED/VERIFIED/DISPUTED), Dependency (READY/BLOCKED), Timing (ON_TRACK/DUE_SOON/OVERDUE), Attention (NORMAL/ATTENTION/CRITICAL). Valid transition matrices are Step 01/02 decisions — undecided, not to be invented in design work.
- Evidence Requirement (condition to meet) is distinct from Evidence (proof supplied); an attachment does not prove a criterion. COMPLETED does not imply VERIFIED. Superseded documents must not be presented as current.
- Constraints: backend Go (`go-hexa-template` base), frontend Next.js Atomic (`nextjs-atomic-starter` base), deployment target Cloudflare Free Tier at $0/month for the verified MVP workload — feasibility unverified; infrastructure trade-offs require PO approval.

## Brand Commitments

- Name: **MatterControl**.
- Voice: precision over decoration; "understand the work faster, fewer mistakes" is the UX quality bar.
- EN canonical terms with ratified vi label pairs per `terminology-final.md` (e.g., Matter = "Hồ sơ", Action = "Hành động", Evidence = "Bằng chứng", Filing = "Hồ sơ khai", Completion vs Verification = "Hoàn tất ≠ Đã xác minh"); every new label must check that table. Binding for vi labels after PO approves R10.
- Statuses always carry cause/context (e.g., "Bị chặn" with reason; "Đang chờ: [tên]") — no bare red badges as state communication.

## Evidence on Hand

- Approved product record: `docs/product/canonical-product-context.md` (validated against approved prompt context), `docs/product/product-definition.md` (APPROVED_BY_PO, DEC-016), `docs/product/domain-glossary.md`, `docs/product/jtbd.md`.
- Requirements: PRD, SRS, permission matrix, capability register under `docs/requirements/`.
- Implementation: `apps/backend` (Go) and `apps/frontend` (Next.js) with verified local test suites (make check with PG fixtures, vitest, durable-session tests) and review records under `docs/reviews/`.
- UX evidence: contrast audit (50/52 pairs PASS), lawyer-experience audit 2026-10-30, usability prep dataset M1–M5 + T10 replay (`docs/testing/usability-prep-20261101-r1/`).
- Absences that must not be fabricated: original briefs A/B (not in repository by design), production deployment behavior, customer testimonials, real matter data, a verified $0 infrastructure bill.

## Product Principles

1. **Operational state over task counts** — the five state dimensions, not list completeness, answer "how is the matter".
2. **Completion ≠ Verified** — proof against criteria is the only closure signal; verification is its own axis.
3. **Traceable by default** — every domain change is reconstructable (event history, document version lineage, as-of provenance); reporting is deterministic, never AI-inferred truth.
4. **Requirement ≠ Action** — domain semantics stay explicit; no generic metadata blob.
5. **Keyboard-efficient density for real work** — grid/bulk workflows first-class; reduce context switching.

## Accessibility & Inclusion

- **WCAG 2.2 AA** is the binding target for all P0 surfaces (user-confirmed 2026-11-01).
- Bilingual audience: EN canonical keys with full vi parity for all P0 user-facing labels (user-confirmed 2026-11-01); vi label source is `terminology-final.md`.
- Provenance timestamps ("Dữ liệu tại …") must be visible where data freshness affects decisions.
