# AI SDLC Operating Model

Ownership amendment, 2026-10-26: the Product Owner assigns both engineering layers to ZCode. This specific role amendment is effective now; it does not approve all other proposed operating choices, implementation scopes or release gates. Codex coordinates; Claude Code architects; OpenDesign designs; OpenCode verifies independently.

Owner: Codex. Status: proposed operating baseline, IN_REVIEW. Discovery is closed by Product Owner; downstream outputs must preserve that decision.

DISCOVER → DEFINE → SPECIFY → ARCHITECT → DESIGN → PLAN → IMPLEMENT → VERIFY → REVIEW → RELEASE → OBSERVE → IMPROVE.

| Stage | Responsible lead | Required output | Exit / handoff |
|---|---|---|---|
| DISCOVER | Human + Codex | Approved positioning | Closed; retain product baseline |
| DEFINE | Codex | Actors, goals, scope, measurable outcomes | Human approves scope and exclusions |
| SPECIFY | Codex | REQ IDs, rules, scenarios, acceptance criteria, NFRs | Critical rules approved; QA can derive tests |
| ARCHITECT | Claude Code | Boundaries, API/data/security contracts, ADRs, risk analysis | Human approves material trade-offs |
| DESIGN | OpenDesign | Flows, screens, states, accessibility, interaction specs | Human approves design; engineers accept handoff |
| PLAN | Codex | Prioritized task contracts, dependencies and milestone plan | Definition of Ready passes |
| IMPLEMENT | ZCode (backend and frontend) | Scoped implementation + tests + updated docs | Contract satisfied; diff and evidence submitted |
| VERIFY | OpenCode | Independent acceptance, integration and regression results | No unresolved blocking failures |
| REVIEW | Independent discipline reviewer | Findings, dispositions and approval on exact revision | All required gates pass |
| RELEASE | Codex | Release manifest, migration/rollback plan, approval | Human go/no-go, then deployment evidence |
| OBSERVE | Codex + OpenCode | Runtime health, incidents, cost/usage evidence | Compare against approved thresholds |
| IMPROVE | Codex + team | Retrospective, risks and improvement tasks | Changes enter backlog/change control |

Stage-level VERIFY precedes final REVIEW. The task board's IN_REVIEW is an initial submission review before TESTING; final independent approval is required after testing and before DONE. These are distinct checkpoints, not conflicting sequences.

## Methods made operational

- Spec-Driven Development: version requirements and acceptance scenarios before implementation; link task and tests by IDs.
- Design-Driven Development: frontend work consumes approved design revision and all relevant loading/empty/error/permission states.
- Risk-Driven Architecture: address hosting, authorization, audit integrity and data recovery risks before irreversible architecture choices.
- Agile/Kanban: order by risk, dependencies and value. Default one active implementation task per agent; urgent exceptions need Codex coordination.
- Continuous Testing: engineers test changed behavior; QA verifies independently; required checks run again after relevant changes.
- DevSecOps: secrets, dependencies, authorization, migration safety, release and observability evidence belong in task gates.
- Human-in-the-Loop: decisions listed in the charter require a recorded human decision, not an inferred approval.

## Cadence

At each handoff Codex updates status, blockers, traceability and risks. At each milestone Human receives a decision packet. During active implementation, review blockers each working day; no automation or notification schedule is installed by this document.

Feedback can return work to SPECIFY/ARCHITECT/DESIGN via change control. Never silently alter the accepted baseline while implementing.
