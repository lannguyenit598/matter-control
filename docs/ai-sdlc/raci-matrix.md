# RACI and Agent Responsibility Matrix

Latest direct PO routing on 2026-10-26: backend execution to actual ZCode; frontend execution remains actual Antigravity; Codex retains PG/DevOps/orchestration/privacy/evidence. This supersedes the temporary backend takeover, without verifying availability or dispatch. Current bounded assignment is MC-002-INTA-FE-VALIDATION; no productUI/STEP03B gate change.


R = executes; A = accountable for acceptance; C = consulted; I = informed. One A per row. A does not authorize self-review of authored code; the independent reviewer remains mandatory.

| Activity | Codex | Claude Code | OpenDesign | ZCode | Antigravity | OpenCode | Human |
|---|---|---|---|---|---|---|---|
| Product scope and critical rules | R | C | C | I | I | C | A |
| Requirements, backlog, plan, traceability | A/R | C | C | C | C | C | I |
| Architecture, API, data, security trade-offs | C | R | C | C | C | C | A |
| UX, flows, design system and design direction | C | C | R | I | C | C | A |
| Backend implementation | C | A | I | R | I | C | I |
| Frontend implementation | C | A | C | I | R | C | I |
| Test strategy and independent verification | A | C | C | C | C | R | I |
| QA supporting development assignment | A | C | I | C | C | R | I |
| Cloud/CI/CD preparation | A/R | C | I | C | C | C | I |
| Infrastructure cost decision | R | C | I | I | I | C | A |
| Production release decision and execution | R | C | I | C | C | C | A |
| Operations, incidents, improvement tracking | A/R | C | I | C | C | R | I |

## Ownership and review artifacts

| Agent | Owns | Delivers | Independent check |
|---|---|---|---|
| Codex | PM, BA, Cloud, DevOps, PG, privacy/evidence and orchestration; backend task preparation/intake | Requirements, task contracts, risks, traceability, pipelines, release packets and assigned technical returns | Human for governance; Claude architecture/infra review and OpenCode or another nonauthor validation |
| Claude Code | Solution architecture | System/domain/API/data/security designs, ADRs, architecture reviews | Human trade-off approval; engineering/QA feasibility feedback |
| OpenDesign | UI/UX | Research, IA, flows, design system, high-fidelity screens, interactions, prototypes, handoff | Human design approval + current implementer feasibility + OpenCode accessibility |
| ZCode | Current backend execution under the latest direct PO instruction | Scoped backend source/tests/runtime returns after task prerequisites; actual availability and dispatch must be evidenced | OpenCode independent QA; architecture/PO decisions remain with existing authorities |
| Antigravity | Current frontend execution under approved scoped tasks; INT-A FE validation assigned2026-10-26 | New FE validation/source returns with original historical authorship retained; no automatic productUI scope | OpenCode independent validation; existing architecture/design/PO gates |
| OpenCode | QA and assigned support | Strategy, API/integration/E2E/visual/accessibility/performance/regression reports, bugs | Codex checks evidence; another engineer/Claude reviews any QA-authored code |
| Human | Product ownership | Recorded scope/rule/architecture/design/cost/release decisions | Decision history retained in Git |

If a reviewer also authored the changed code, Codex assigns a different reviewer and records it. Tool unavailability never transfers architecture or design approval to the implementer by default.

## Scoped full-P0 delivery ownership — latest direct PO request

[MC-P0-ZCODE-DELIVERY](../implementation/tasks/MC-P0-ZCODE-DELIVERY.md) assigns actual ZCode future productbackend+frontend implementation after wave readiness, superseding the earlier productFEexecution row for that scope. Existing AntigravityR5authorship and in-flight source-review boundary remain frozen. ZCodecannot independently approve code it changes; Codex assigns another qualified nonauthor, or the affected review is BLOCKED. Architecture/design/PO/DevOps authorities remain unchanged. This is W0planning readiness, not tool invocation or global gate approval.
