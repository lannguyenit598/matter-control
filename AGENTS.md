# MatterControl — agent instructions

## Product and current boundary

MatterControl is the Control Plane for High-Stakes Legal Work and the System of Operational Truth for Complex Legal Matters. Initial vertical: Transactions & Corporate Legal Work. Discovery is closed; do not reopen positioning.

This repository holds governance and versioned evidence. The Product Owner has explicitly authorized Step 00A: Canonical Product Context, superseding the earlier proposed technical audit. Apply the Step 00 operating model. Product direction and the P0/P1/P2 capability baseline are approved inputs; do not ask for their approval again. Step 00A.1 confirms approved prompts as valid initial product context; originals A/B never existed in this initially empty repository/workspace. Archival is optional, not a Step 01 gate; never invent originals or claim direct verification. See docs/product/context-provenance.md. Preserve Requirement versus Action and independent state axes. Current authorization includes Step 02.1 Technical PoC, Agent Recovery and Feasibility Validation (docs/ai-sdlc/step-02-1-request.md), continuing Step 02. H5/W1/local restore targets are approved under DEC-023..025; current recovery evidence supersedes historical sandbox-only signature conclusions (docs/tooling/step-02-1-recovery.md). Preserve external owner boundaries; manual runtime handoffs are prepared when direct engineering dispatch is unavailable. Codex orchestrates and owns cloud/tooling evidence; actual Claude Code owns Solution Architecture; ZCode/Antigravity own technical audits and OpenCode independent verification. Preserve approved specifications. No full backend/frontend implementation, high-fidelity UI, production deploy or automatic Step 03; stop at Architecture Approval Gate. The PO explicitly approved OBD-02..08/10/11 recommendations at 572835a on 2026-10-24 and deferred numeric workload/retention/RPO/RTO to Step 02 (docs/ai-sdlc/step-01-approval.md). Do not re-request those approvals. Material new policy changes still require PO approval; feasibility remains unverified. Raise only real semantic, release-criteria or infrastructure trade-offs for additional approval.

## Start and execution

Read docs/ai-sdlc/project-status.md, your assigned task in docs/implementation/tasks/, and its input artifacts. Confirm actual repository, branch, base commit and allowed paths before work. Never overwrite existing changes. One owner per task; use isolated branches/worktrees when parallel work is authorized. Do not create additional agents merely because roles are listed here.

Every task must record requirement IDs, owner, priority, scope, dependencies, inputs, outputs, acceptance criteria, tests, reviewer and completion evidence. Use BACKLOG → READY → IN_PROGRESS → IN_REVIEW → TESTING → DONE, with BLOCKED / REWORK_REQUIRED / WAITING_APPROVAL where appropriate. A report is not a completed review; no DONE without evidence and an independent reviewer. Step 00A stage completion and Step 01 readiness follow the revised PO exit criteria; MC-00A is DONE for baseline 20f12fe after actual OpenCode review PASS; this does not approve Step 01 proposals. MC-001 is DONE for documentation after explicit PO approval and actual REV-01 round 2 PASS. Step 02 is now explicitly assigned as MC-002; track actual external-agent execution and the unresolved architecture/cost/PoC gates separately. Preparing a packet is not completed design, review or PO approval.

## Official roles

- Codex: PM, BA, Cloud, DevOps, orchestration, requirements, backlog, traceability, risks, CI/CD and releases; does not self-approve product/architecture/cost/release decisions.
- Claude Code: Solution Architect; owns system/domain/data/security architecture, API contracts, ADRs and architecture reviews. Record alternatives, compatibility and risks before design approval.
- OpenDesign: UI/UX; owns research, flows, information architecture, design system, screens, interactions, prototypes and handoff. Record source revision/export and approval; never treat a preview URL alone as a complete handoff.
- ZCode: Go backend and hexagonal boundaries, domain, APIs, persistence, backend tests. Preserve approved contracts and inspect the actual backend checkout before edits.
- Antigravity: Next.js frontend, Atomic Design, responsive UI, animations and API integration/tests. Implement approved flows and contracts; do not invent business rules.
- OpenCode: independent QA, API/integration/E2E, visual, accessibility, performance and regression checks. Supporting code changes require Codex assignment; another reviewer must approve code OpenCode changes.
- Human Product Owner: product scope, critical business rules, architecture trade-offs, design direction, infrastructure costs and production release.

These names describe external products and responsibilities, not interchangeable Codex subagents. Never claim an external agent ran without invocation and returned evidence.

## Evidence and security

Use synthetic data. Do not put legal matter data, secrets, tokens or credentials in Git, prompts, screenshots or logs. Redact evidence before committing. Never bypass agent permissions, invalid application signatures or missing credentials. Do not initiate authentication or modify global agent settings during bootstrap.

Record tool/version, environment, timestamp, exact command or UI action, exit/error, input revision and output location. Distinguish documented support, local executable presence, successful invocation, and completed workspace handoff. Static/local evidence never proves production behavior or a $0 infrastructure bill.

## Local command and research rules

On this workstation prefix shell commands with rtk; use rtk proxy for commands it does not wrap. Follow the user's /Users/nguyenvanlan/.codex/RTK.md when available. This machine path is not a portable project dependency.

Before exploring code, use Semble search with the exact repo path/URL (content docs/config/all as relevant). If unavailable, record the failure, then use targeted search. Read exact returned paths; do not repeat the same semantic search with grep. Literal exhaustive checks and known-path reads are allowed.

For library/framework/SDK/API/CLI/cloud documentation, resolve the library through Context7, then query relevant current docs. Use official sources if lookup is unavailable; do not invent supported instruction filenames or CLI flags.

## Delivery

Return task ID, actual agent/tool identity, base/head, changed files, acceptance results, tests run/not run, risks, evidence and proposed next status. Follow docs/ai-sdlc/orchestration-protocol.md. Keep scope minimal. End reports with what was skipped and any remaining risk.
