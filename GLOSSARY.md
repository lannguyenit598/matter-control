# MatterControl — domain glossary

Shared vocabulary for MatterControl's domain and architecture. Use these nouns in code discussion, task records, ADR-equivalent decisions and reviews; do not substitute generic words (component/service/boundary) for them. Architecture-vocabulary terms (module, interface, depth, seam, adapter, leverage, locality) come from the codebase-design vocabulary and are not redefined here.

## Tenancy and access

- **Workspace** — the operational container for collaboration. Holds members with the roles `OWNER` and `MEMBER`. Creating a Matter inside is a Workspace-owner operation; a Workspace role alone grants no access to any Matter's contents.
- **Matter** — the confidentiality boundary: one legal engagement. Holds explicit members with the roles `OWNER`, `EDITOR`, `VIEWER` and an `ACTIVE`/`REVOKED` status. Every business record belongs to exactly one Matter.
- **Hidden denial** — the uniform "not visible" denial for a caller with no current membership (missing, revoked, or foreign resource): the same response as a resource that does not exist, so existence is never revealed. Contrast with a **role denial**, where membership is active but the role lacks the operation.
- **Local people directory** — the PO-authorized local/dev discovery scope that lets a Workspace `OWNER` find provisioned users on the same issuer by name. Bounded by flag, issuer, and exclusion of current members; not an organization boundary.

## Work model

- **Work item** — a node of the Matter's dependency graph: a **Requirement** (an outcome that must hold) or an **Action** (a task that can be executed). Nodes carry execution, dependency and verification state as independent axes.
- **Dependency edge** — a directed prerequisite between two work items of the same Matter, gated on `COMPLETION` or `PROOF`.
- **Proof epoch** — the invalidation counter that marks previously verified state stale when criteria, evidence or versions change.
- **Filing** — an Action that carries regulatory-filing facts (stage, cycles, signature applicability). Stage transitions advance through `REQUIREMENT → PACKAGE_PREPARATION → SIGNATURE → SUBMISSION → RECEIPT → …`.

## Evidence and review

- **Criterion** — a checkable requirement attached to a work item, with a version rule (`NONE`, `CURRENT_AUTHORITATIVE`, `FIXED`).
- **Evidence** — an item offered as proof (a document version or an external reference). A **Claim** offers one evidence item for one criterion revision. An **Assessment** is a person's accept/reject decision on a claim; nobody reviews proof they supplied or offered.
- **Review grid** — a manual review matrix: rows are exact document versions, columns are versioned questions; **answers** are append-only, cited human conclusions that never change verification, execution, dependency or filing state.
- **Brief** — the delta report reconstructed from recorded history for a time window.

## Commands and history

- **Command receipt** — the immutable record of one committed command, keyed by `(actor, idempotency key)` with a request fingerprint. Replay requires the same fingerprint and **current** read authority for every represented Matter. A refused command stores no receipt.
- **UNKNOWN outcome** — a command whose result was lost before it reached the caller (`outcome-unknown`). The one safe recovery is the same-key, same-payload retry; a new intent requires an explicit discard.
- **Command gate** — the deep module every Matter-scoped command composes: it resolves memberships inside the command's transaction, applies the default-deny policy, maps Hidden denials, commits the restricted deny-audit row, handles receipt replay, and advances the event-seq fence. *(Term introduced by the 2026-10-30 command-gate deepening design; implementation may not yet exist when you read this.)*
- **Domain event** — the append-only history record of one successful command, sequenced per Matter; the only place after-the-fact truth lives.
- **Draft namespace** — the opaque per-session scope under which browser form drafts and pending attempts are kept; another sign-in or another record never sees them.
