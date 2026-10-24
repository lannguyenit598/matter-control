# Source-of-Truth Structure

Git is the canonical record for text, instructions, contracts, exported design manifests and sanitized evidence. Chat and app state are input channels; accepted decisions/results must be captured in versioned files.

| Path | Contents / owner |
|---|---|
| docs/ai-sdlc/ | Governance, tasks protocol, decisions, risks, traceability and dashboard / Codex |
| docs/product/ | Approved positioning, later scope and outcome records / Codex + Human |
| docs/requirements/ | Requirement IDs, rules, acceptance criteria and approvals / Codex |
| docs/architecture/ | System/domain/API/data/security design and ADRs / Claude Code |
| docs/design/ | UX/UI specs, source/export manifest and handoffs / OpenDesign |
| docs/tooling/ | Observed agent capabilities and invocation evidence / Codex |
| docs/implementation/ | Task files, backlog, implementation notes / Codex + engineers |
| docs/testing/ | Test plans, cases, run results and limitations / OpenCode |
| docs/reviews/ | Independent findings, dispositions and approvals / reviewers |
| docs/deployment/ | Environment/CI/CD/recovery/hosting evidence / Codex |
| docs/operations/ | Observability, incidents, runbooks and cost tracking / Codex |
| docs/release/ | Release manifests, Human decisions and deployed evidence / Codex |

Empty future domains contain README boundaries, not invented implementation documents.

Root AGENTS.md is the shared project instruction source; CLAUDE.md adds architect-specific context. Structured task files are the canonical task status records; project-status.md is a derived dashboard and must match them. Stage completion/readiness is distinct from task DONE: per SRC-00A1, Step 00A is COMPLETED while MC-00A remains IN_REVIEW pending independent review. [Context provenance](../product/context-provenance.md) identifies approved prompts as the valid initial product source; original A/B archival is optional.

The two supplied template repositories remain separate sources. Pin their exact commits in a separately assigned technical baseline task; Step 00A now consolidates product context. A cross-repository task records every repo/head in its return packet; release manifests identify the complete tested combination.

This repo has a local baseline only; no governance remote or shared PR workflow has been configured. Do not point origin at one of the template repositories to solve that gap. Confirm the intended remote before publishing.

No secrets, real legal documents, private provider logs, generated credentials, or unredacted screenshots. Large design/media artifacts may use approved storage with immutable references/checksums and a Git manifest. Approval evidence is never inferred from an uploaded artifact.
