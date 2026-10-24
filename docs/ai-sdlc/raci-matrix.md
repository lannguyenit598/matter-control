# RACI and Agent Responsibility Matrix

R = executes; A = accountable for acceptance; C = consulted; I = informed. One A per row. A does not authorize self-review of authored code; the independent reviewer remains mandatory.

| Activity | Codex | Claude Code | OpenDesign | ZCode | Antigravity | OpenCode | Human |
|---|---|---|---|---|---|---|---|
| Product scope and critical rules | R | C | C | I | I | C | A |
| Requirements, backlog, plan, traceability | A/R | C | C | C | C | C | I |
| Architecture, API, data, security trade-offs | C | R | C | C | C | C | A |
| UX, flows, design system and design direction | C | C | R | I | C | C | A |
| Backend implementation | C | A | I | R | C | C | I |
| Frontend implementation | C | A | C | C | R | C | I |
| Test strategy and independent verification | A | C | C | C | C | R | I |
| QA supporting development assignment | A | C | I | C | C | R | I |
| Cloud/CI/CD preparation | A/R | C | I | C | C | C | I |
| Infrastructure cost decision | R | C | I | I | I | C | A |
| Production release decision and execution | R | C | I | C | C | C | A |
| Operations, incidents, improvement tracking | A/R | C | I | C | C | R | I |

## Ownership and review artifacts

| Agent | Owns | Delivers | Independent check |
|---|---|---|---|
| Codex | PM, BA, Cloud, DevOps, orchestration | Requirements, task contracts, risks, traceability, pipelines, release packets | Human for governance; Claude architecture/infra review and OpenCode validation |
| Claude Code | Solution architecture | System/domain/API/data/security designs, ADRs, architecture reviews | Human trade-off approval; engineering/QA feasibility feedback |
| OpenDesign | UI/UX | Research, IA, flows, design system, high-fidelity screens, interactions, prototypes, handoff | Human design approval + Antigravity feasibility + OpenCode accessibility |
| ZCode | Go hexagonal backend | Domain/API/persistence implementation and backend tests | Claude review + OpenCode independent tests |
| Antigravity | Next.js / Atomic Design frontend | Responsive UI, animation, integration and frontend tests | Claude technical review + OpenDesign fidelity + OpenCode tests |
| OpenCode | QA and assigned support | Strategy, API/integration/E2E/visual/accessibility/performance/regression reports, bugs | Codex checks evidence; another engineer/Claude reviews any QA-authored code |
| Human | Product ownership | Recorded scope/rule/architecture/design/cost/release decisions | Decision history retained in Git |

If a reviewer also authored the changed code, Codex assigns a different reviewer and records it. Tool unavailability never transfers architecture or design approval to the implementer by default.
