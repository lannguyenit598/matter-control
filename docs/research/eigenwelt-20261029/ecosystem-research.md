# Eigenwelt Labs ecosystem research for MatterControl

**Date:** 2026-10-29  
**Owner:** Research Analyst  
**Decision objective:** identify Eigenwelt Labs capabilities that are worth adapting or integrating into MatterControl without reopening approved product policy or changing MatterControl from an operational control plane into an AI document workbench.  
**Mode:** public-source research only; no clone, install, sign-in, execution, or transfer of MatterControl source or data.  
**MatterControl boundary:** Go/PostgreSQL/Next.js, explicit Workspace/Matter authorization, Requirement distinct from Action, independent execution/verification/dependency/timing/attention axes, authoritative state changes only through approved commands.

## Executive conclusion

Eigenwelt has two products relevant to MatterControl, but they solve different problems:

- **LegalWork** is a local-first desktop workbench/agent around matter files, document editing, tasks, reusable workflows, review grids, Office add-ins, and optional firm services. Its strongest contribution to MatterControl is **interaction and workflow patterns**, not a replacement frontend or backend.
- **LegalMemory** is an on-prem knowledge index with source connectors, mirrored ACLs, hybrid retrieval, exact-version citations, MCP/REST access, and an access ledger. Its strongest contribution is a potential **read-only external knowledge boundary** and several security/reliability patterns. It is not a safe shortcut to MatterControl's operational state model.

Recommendation: adopt selected patterns now, design an optional LegalMemory-compatible read boundary next, and defer code reuse or hosted integration until after P0 and a licensing/security/procurement review. Do **not** embed either product into the P0 runtime, copy their AI-driven project setup, or allow retrieved/model-generated facts to create or mutate Matters, Requirements, Actions, evidence verification, filings, deadlines, or permissions.

## Evidence method and pinned inventory

The public organization inventory was read from the official [Eigenwelt Labs GitHub organization](https://github.com/eigenweltlabs) and its [GitHub API repository listing](https://api.github.com/orgs/eigenweltlabs/repos?per_page=100&type=public) on 2026-10-29. It contained four public, non-archived repositories:

| Repository | Revision inspected | License reported by repository/API | Relevance |
|---|---|---|---|
| [legalwork](https://github.com/eigenweltlabs/legalwork) | `dev` at [`2b8cb18d338da618f686fcdf4dea0ec0eedbe819`](https://github.com/eigenweltlabs/legalwork/commit/2b8cb18d338da618f686fcdf4dea0ec0eedbe819), 2026-10-28 | MIT; exact [license text](https://github.com/eigenweltlabs/legalwork/blob/dev/LICENSE) | High: workbench, tasks, workflows, document review, external connectors |
| [LegalMemory](https://github.com/eigenweltlabs/LegalMemory) | `main` at [`bdc62e8b71abb526da3e4970ffbcb4ee03b077cf`](https://github.com/eigenweltlabs/LegalMemory/commit/bdc62e8b71abb526da3e4970ffbcb4ee03b077cf), 2026-10-22 | AGPL-3.0; exact [license text](https://github.com/eigenweltlabs/LegalMemory/blob/main/LICENSE) | High: permission-aware legal knowledge and external retrieval APIs |
| [legaloss](https://github.com/eigenweltlabs/legaloss) | `main` at [`fa0ba4699561b214e39963d0467a56bee51e9364`](https://github.com/eigenweltlabs/legaloss/commit/fa0ba4699561b214e39963d0467a56bee51e9364), 2026-10-22 | MIT | Low: discovery/index product, not a reusable Matter workflow service |
| [emotion-steering](https://github.com/eigenweltlabs/emotion-steering) | `main` at [`a12431875f9f7e1d498af6955704b48ba353404e`](https://github.com/eigenweltlabs/emotion-steering/commit/a12431875f9f7e1d498af6955704b48ba353404e), 2026-06-11 | Apache-2.0 | Out of scope: model-behavior research, not legal operations |

The requested LegalWork guide exists at [`docs/user-guide/index.md`](https://github.com/eigenweltlabs/legalwork/blob/dev/docs/user-guide/index.md) and was read from the pinned `dev` revision. It describes itself as a bundled manual and explicitly says that the live UI, screen inventory, account access, permissions, and enabled integrations determine what is actually available. This warning is important: a guide entry or translation key is not runtime proof. Direct pinned source links below use the inspected revisions where practical.

Evidence strength used in this report:

- **Code-observed:** a concrete implementation or interface is visible in repository source; this does not prove execution or correctness.
- **Guide-documented:** a versioned user guide or technical reference describes behavior; this alone does not establish implementation completeness.
- **Published capability:** first-party product page or terms describe the product, but this review did not execute it.
- **Inference/recommendation:** a proposed MatterControl use derived from the sources; not an Eigenwelt claim and not an approved implementation.

## LegalWork: verified capability map

### Product and deployment model

LegalWork's repository describes a local computer-use agent that reviews, redlines and drafts files with a user-selected model, supports skills/plugins/MCP connectors, and runs on the machine by default. The current monorepo contains a Vite/React application, Electron desktop runtime, server, OpenCode router and orchestrator; the app dependency manifest includes React, React Router, TanStack Query, Base UI, shadcn, CodeMirror, ProseMirror, Lexical and document-editor packages. This is materially different from MatterControl's Next.js/Go service architecture, even though some frontend concepts are portable. Sources: [repository README](https://github.com/eigenweltlabs/legalwork/tree/dev#readme), [workspace manifest](https://github.com/eigenweltlabs/legalwork/blob/dev/package.json), [app manifest](https://github.com/eigenweltlabs/legalwork/blob/dev/apps/app/package.json), and [app/server layout](https://github.com/eigenweltlabs/legalwork/tree/dev/apps).

The desktop application is MIT-licensed and can use local models or a firm's own provider keys. Eigenwelt account services are optional and separately governed: the official terms distinguish the free local app from subscriptions/models/hosted firm services, and explain that content sent to a selected third-party model is governed by that provider. Connected services and LegalMemory also transmit selected content outside the ordinary local workspace boundary. Sources: [LegalWork terms](https://github.com/eigenweltlabs/legalwork/blob/dev/TERMS.md), [product page](https://eigenweltlabs.com/legalwork), and [pricing page](https://eigenweltlabs.com/pricing).

The repository has recent signed releases, including stable `v0.2.17` at commit `4cd058941a96752ce7aca97ea71c97341f56a84b`, and rolling alpha builds. That demonstrates active delivery, not production suitability for MatterControl. Source: [LegalWork releases](https://github.com/eigenweltlabs/legalwork/releases).

### Work and intake pattern

The pinned guide defines a task with description, status, assignee, priority, due date, tags, attachments and history. It separates local tasks from firm intake, and distinguishes a due date from an autonomous scheduled run or calendar event. Intake converts messages into reviewable tasks; it does not automatically send a response. Starting work explicitly selects a workflow and local folder, and marking a task done does not validate its attached output. Source: [Tasks and intake guide](https://raw.githubusercontent.com/eigenweltlabs/legalwork/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/tasks-intake.md).

**MatterControl relevance:** high as a pattern. It reinforces the approved separation between work state and verification. The useful idea is a bounded intake record reviewed by a human before it becomes an authoritative Matter/Requirement/Action—not importing LegalWork's four task statuses as MatterControl semantics.

### Matter/project work context

LegalWork's project is a working context for files, details, notes, tasks, reviews, calendar and chats. It can link external folders, save configurable project fields, and optionally run an assistant over existing files to propose details/tasks/notes. The guide repeatedly requires users to review extracted details and dates against sources. Sharing has explicit content categories; linked folders preserve provider permissions; offline conflicts surface `Keep both`, `Use the other version`, or `Keep mine` instead of silently overwriting. Source: [Projects and sharing guide](https://raw.githubusercontent.com/eigenweltlabs/legalwork/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/projects-sharing.md).

**MatterControl relevance:** medium-high for progressive disclosure, source-linked setup proposals, and explicit conflict handling. MatterControl must not adopt assistant-created facts as current truth or weaken its explicit Matter ACL.

### Tabular review

The native Tabular Review models documents as rows and questions as columns, saves answers and evidence, distinguishes preparation errors from `Not found`, `Needs review`, empty, stale and error states, and lets users inspect cited pages/regions. Changing a source, question or model can make answers stale; source-hash mismatch means the evidence refers to another version. Stop/continue/retry behavior preserves completed cells and does not automatically restart paid inference. Source: [Tabular Review guide](https://raw.githubusercontent.com/eigenweltlabs/legalwork/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/reviews.md).

**MatterControl relevance:** very high as a future derived-evidence surface. The distinction between `not found`, `needs review`, `stale`, technical error and verified result maps well to MatterControl's non-collapsed state model. A review cell must remain a derived claim with exact source/version/hash, reviewer disposition and as-of—not a verified Requirement or filing fact merely because extraction completed.

### Storage and document editing

Connected storage supports account providers and file protocols, read-only or write access, provider-specific search, a local working copy, explicit save-back, and conflict handling. The guide says ordinary storage does not automatically index files in LegalMemory. The file guide distinguishes local save from publishing back, warns that supported extensions do not guarantee full fidelity, and treats a signature stamp as a visual mark rather than a cryptographic signature. Sources: [Connected storage](https://raw.githubusercontent.com/eigenweltlabs/legalwork/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/connected-storage.md) and [Files and document editors](https://raw.githubusercontent.com/eigenweltlabs/legalwork/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/files-documents.md).

**MatterControl relevance:** medium. A future DMS connection should use explicit working-copy/publish semantics and preserve external version/conflict evidence. Building Office editors into P0 would be scope expansion.

### Integrations and extension surface

LegalWork exposes connectors, plugins, skills, file storage and custom MCP connections. Its guide correctly distinguishes catalog presence from a connected and authorized tool, local-command execution from remote-workspace execution, and ordinary storage from LegalMemory indexing. The source also implements a standalone filesystem-backed server with scoped owner/collaborator/viewer tokens, import preview, audit, inbox/outbox and host approval for writes. Sources: [Integrations guide](https://raw.githubusercontent.com/eigenweltlabs/legalwork/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/integrations.md) and [LegalWork server README](https://github.com/eigenweltlabs/legalwork/tree/dev/apps/server#readme).

**MatterControl relevance:** use the capability/connection-status pattern, not the plugin runtime. Generic plugin/MCP execution inside MatterControl would create a new high-risk authority surface and is not needed for P0.

### Evaluations

LegalWork can define tasks with input documents, deliverables and pass/fail criteria, run model/feature variants, and inspect criterion-level results. Its guide explicitly says a model judge is still a model and the score is not legal validation. Source: [Evaluations guide](https://raw.githubusercontent.com/eigenweltlabs/legalwork/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/evaluations.md).

**MatterControl relevance:** later, for evaluating optional extraction/classification helpers. It is not a substitute for product acceptance tests, independent proof verification or legal-team usability trials.

## LegalMemory: verified capability map

### What the codebase implements

LegalMemory is a Python/FastAPI on-prem appliance with PostgreSQL/pgvector, OpenSearch, an ingestion pipeline, connectors, a React/Vite console, MCP and a REST API. Its README lists read-only source connectors, durable sync/tombstones, a resumable pipeline, pre-ranking permission compilation, hybrid retrieval, exact-version provenance, an access ledger, backup/restore and a frozen retrieval benchmark. The repository contains implementation and tests for these areas; this review did not run them. Source: [LegalMemory README at the inspected revision](https://github.com/eigenweltlabs/LegalMemory/blob/bdc62e8b71abb526da3e4970ffbcb4ee03b077cf/README.md).

### Permission model

The technical reference says authorization is compiled before ranking. Project/document/source grants are evaluated with deny-wins semantics; external objects with unknown ACLs fail closed; source groups are source-qualified to avoid same-name collisions; the access-explain endpoint uses the same evaluator as retrieval. The configuration supports a stricter `intersect` mode requiring both a mirrored source allow and a local project/document allow. Source: [Access control reference](https://raw.githubusercontent.com/eigenweltlabs/LegalMemory/bdc62e8b71abb526da3e4970ffbcb4ee03b077cf/docs/src/content/docs/product/access-control.md).

**MatterControl relevance:** very high as a design pattern. If integrated, MatterControl must require the intersection of LegalMemory visibility and MatterControl's own Workspace/Matter authorization. LegalMemory's project grant must never be translated into a MatterControl role or used to bypass a hidden-Matter denial.

### External access

LegalMemory exposes a stateless streamable-HTTP MCP endpoint at `/mcp/`, `POST /api/search`, OpenAPI, and short-lived document download capabilities. OAuth binds tokens to the appliance audience; clients cannot supply their own principals. MCP tools cover search, exact document reads, related documents, traversal, matters, entity resolution and ontology. Every tool invocation writes an access-ledger event; search query text is fingerprinted rather than stored verbatim. External-client registration creates no token or grant by itself. Source: [External access reference](https://raw.githubusercontent.com/eigenweltlabs/LegalMemory/bdc62e8b71abb526da3e4970ffbcb4ee03b077cf/docs/src/content/docs/product/external-access.md).

**MatterControl relevance:** this is the cleanest future integration boundary. Prefer a narrow REST adapter for deterministic UI queries before considering MCP. MCP is useful for an assistant, but MatterControl's normal UI should not require an agent protocol to retrieve a document citation.

### Retrieval and provenance

LegalMemory compiles ACL scope in SQL, sends lexical/semantic/identifier searches inside that scope, fuses them, applies version-status boosts, re-verifies results in SQL and collapses to one document result. Superseded/draft versions rank lower rather than disappearing, and exact version/source records remain available. Failures raise instead of silently changing retrieval modes. Source: [Retrieval reference](https://raw.githubusercontent.com/eigenweltlabs/LegalMemory/bdc62e8b71abb526da3e4970ffbcb4ee03b077cf/docs/src/content/docs/concepts/retrieval.md).

**MatterControl relevance:** high for a future knowledge lookup, provided citations include external document/version/source identity and no result is treated as operational truth without an authorized human disposition.

### Connector contract

LegalMemory documents a versioned `plugin_drop` schema for customer DMS exporters: stable external id, human path/name, content pointer, optional metadata, ACL entries, and tombstones. Missing ACL means unknown and fails closed; malformed rows, path escape or missing content abort rather than half-sync. Source: [Plugin connector contract](https://raw.githubusercontent.com/eigenweltlabs/LegalMemory/bdc62e8b71abb526da3e4970ffbcb4ee03b077cf/docs/src/content/docs/development/plugin-connectors.md).

**MatterControl relevance:** high as a reference for a future connector envelope, but copying this exact AGPL implementation is unnecessary. MatterControl can define its own neutral source-observation contract with stable ids, version/hash, ACL snapshot, deletion state and reconciliation receipts.

### Marketing versus implementation boundary

The official LegalMemory product page describes a firm-hosted, read-only shadow index, permission-preserving connections, MCP/HTTP access and supported implementation services. Those statements are consistent with the repository's architecture, but the marketing page's broad interoperability claims are not evidence that a particular third-party DMS or AI product is configured or certified in a MatterControl environment. Source: [LegalMemory product page](https://eigenweltlabs.com/legalmemory).

## LegalOSS and emotion-steering disposition

LegalOSS is an MIT-licensed community index with repository-verification and maintainer-claim mechanics. It is useful as a discovery source for future legal-tech research, not as a runtime dependency or product feature for MatterControl. Source: [LegalOSS README](https://github.com/eigenweltlabs/legaloss#readme).

Emotion-steering serves model steering vectors and is unrelated to legal operational truth, authorization, evidence, workflow or documents. It should not enter the MatterControl roadmap. Source: [emotion-steering README](https://github.com/eigenweltlabs/emotion-steering/blob/main/README.md).

## Reuse and integration options

| Option | What it means | License/architecture consequence | Recommendation |
|---|---|---|---|
| Pattern reuse | Recreate interaction/state patterns from specifications, not copied code | Lowest coupling; still record design provenance | **Use now** for intake review, stale/error distinctions, conflict handling, source/version evidence and access explainability |
| LegalMemory API adapter | MatterControl calls a separately deployed LegalMemory REST endpoint with user-bound identity | No code copied; operational, privacy, OAuth, data-residency and vendor/deployment review still required | **Design next**, read-only only |
| LegalMemory MCP client | Assistant or support tool calls identity-bound MCP tools | Adds protocol/client security and agent authority surface | **Later**, never required for core UI |
| LegalWork deep link/export | Open a Matter-authorized working copy or exported package in a local LegalWork workspace | Requires explicit handoff, version identity and return/import reconciliation | **Later pilot** |
| Copy LegalWork UI/code | Reuse MIT components/source | Legal notice required; many components depend on Vite/Electron/OpenCode/editor packages and are a poor fit for Next.js | **Do not do wholesale**; separately review any tiny component and all third-party notices |
| Embed/modify LegalMemory code | Run forked AGPL service or copy modules | AGPL network-use/source-offer obligations may apply; repository also carries third-party notices; commercial license is offered | **Do not do without legal/license approval** |

LegalWork's MIT license permits use, modification and distribution with copyright/license notice, but that does not automatically license third-party dependencies, trademarks, hosted services, product content or external provider APIs. LegalMemory is AGPL-3.0 and its README says modified network use or distribution carries copyleft obligations; organizations unable to accept those terms are directed to a commercial license. Treat that as a legal-review gate, not an engineering interpretation.

## Recommended MatterControl roadmap

### Near: incorporate patterns without external dependency

1. **Human-reviewed intake draft**
   - Accept an email/API/upload as a non-authoritative intake item with source, attachments, received-at, proposed Matter link, proposed assignee and triage status.
   - A permitted user must confirm conversion into a Matter, Requirement or Action; no model or connector performs that mutation automatically.
   - Keep the original message and attachments as provenance, and never treat their contents as instructions.

2. **Evidence-state vocabulary for derived results**
   - Use distinct states for `not found`, `needs review`, `stale`, `source changed`, `technical error`, `permission lost` and `verified`.
   - Completion of extraction/review execution must not imply legal verification.

3. **Access explanation for administrators/support**
   - Provide a read-only explanation based on MatterControl's actual ACL evaluator: caller, effective role, Matter/record scope, allow/deny cause and as-of.
   - Never enumerate hidden Matters merely to explain denial to an unauthorized user.

4. **Explicit external-copy/conflict semantics**
   - For future imports/exports, show source version/hash, working-copy state, save-back/publish result, conflict and reconciliation receipt.

These are compatible with approved policy and improve usability/reliability without adding an AI authority.

### Next: bounded external knowledge and DMS design

1. Define a provider-neutral `KnowledgeSource`/`KnowledgeCitation` read contract: provider, external document id, exact version id/hash, title, source URI, retrieved-at/as-of, access decision, excerpt/page/locus, and optional download capability.
2. Prototype a **read-only LegalMemory REST adapter** behind a feature flag. Bind the request to the signed-in MatterControl identity and requested Matter. Require intersection with MatterControl Matter ACL; fail closed on identity, audience, permission, citation or currentness errors.
3. Define a source-observation connector envelope inspired by LegalMemory: stable external id, version/hash, path/label, ACL snapshot quality (`known`/`unknown`), tombstone, cursor/checkpoint and reconciliation report.
4. Design a tabular evidence-review aggregate as derived data: immutable input set/version, typed questions, per-cell status, exact citation, human disposition and rerun lineage.

These require architecture and security review; none is a P0 implementation commitment.

### Later: optional productivity surfaces

- Office/desktop handoff for tracked-change drafting, with an export manifest and deliberate import/reconciliation—not direct mutation of the authoritative record.
- Versioned reusable workflow/skill library with owner, review status, allowed tools/data, test corpus, revision and rollback.
- Private evaluation suite for optional classifiers/extractors using legal-team criteria, criterion-level evidence and no claim of legal correctness from a judge-model score.
- Saved search/research views over authorized external knowledge, always with source/version citations and currentness.

### Out of scope for MatterControl's current direction

- Chat or an autonomous agent as the primary navigation or system of record.
- Model-generated creation, verification, permission, filing outcome, deadline or status changes without an approved human command.
- Voice mode, meeting recording, dictation, multi-model Fusion, model billing/credits and a general plugin marketplace.
- Copying LegalWork's desktop shell/editor stack or replacing MatterControl with LegalMemory.
- Emotion/model steering research.

## Decision-ready integration contract for a future LegalMemory pilot

A pilot should not start until all of the following are approved and testable:

1. **Read-only surface:** only search, list and exact-document/citation reads; no external write or MatterControl command invocation.
2. **Identity binding:** OAuth/OIDC token validated for the LegalMemory resource; user identity cannot be supplied in request parameters.
3. **Authorization intersection:** LegalMemory admits the document **and** MatterControl admits the caller to the Matter/context. Unknown mapping or ACL is denial.
4. **No policy import:** LegalMemory project roles/grants never create MatterControl roles or memberships.
5. **Citation completeness:** external document id, version id/hash, source object, page/chunk/locus, retrieved-at and source currentness required before display as evidence.
6. **Derived-only semantics:** search/extraction results are suggestions or evidence candidates; a permitted human separately records or verifies operational truth.
7. **Audit and privacy:** record actor, provider, query fingerprint/correlation, filters, result ids and disposition without storing privileged query/content unnecessarily.
8. **Failure truthfulness:** distinguish unauthenticated, forbidden/hidden, no result, stale index, provider unavailable, partial page and outcome unknown; no silent fallback to a broader corpus.
9. **Revocation and retention:** test removal of source access, group membership, Matter access and download capability; define cache purge and evidence retention behavior.
10. **License/deployment review:** decide unmodified separate AGPL appliance versus commercial terms before any fork, modification or hosted network use.

## Confidence-rated claims

| Claim | Confidence | Basis/caveat |
|---|---|---|
| LegalWork is an active MIT local-first desktop workbench with tasks, workflows, review grids, document/Office surfaces and optional provider/team services. | High | Current repository, bundled guide, terms and releases; not executed locally. |
| LegalMemory implements a permission-aware on-prem index with MCP/REST, connectors, hybrid retrieval and exact-version provenance. | High for source presence; medium for operational quality | Current code/docs/tests describe concrete surfaces; no build, load, security or deployment verification was run. |
| A read-only LegalMemory adapter can be architecturally compatible with MatterControl. | Medium-high | Interfaces and identity/ACL model are suitable, but identity mapping, dual authorization, privacy, performance and deployment have not been proven. |
| Copying LegalWork's app wholesale would accelerate MatterControl. | Low/negative | Stack and product center differ; coupling and dependency review would outweigh benefit. |
| LegalWork/LegalMemory AI output is safe to become operational truth automatically. | Rejected | Their own guides/terms require human inspection; MatterControl policy requires authoritative commands and independent verification. |

## High-impact unknowns

- Whether a target firm's DMS, identity provider and ethical-wall model map cleanly to LegalMemory's principals and MatterControl's Workspace/Matter ACL.
- LegalMemory scale, latency, availability, backup/restore and revocation behavior on the actual corpus; repository claims are not production evidence.
- Whether the firm accepts AGPL obligations or needs Eigenwelt commercial terms.
- Whether users need a LegalWork desktop handoff at all once MatterControl's own My Work/Matter Overview flow is usable.
- Which future P1/P2 extraction/review use case justifies model processing, and under what provider/data-residency contract.
- Exact retention and legal-hold rules for copied text, embeddings, citations, working copies and derived review tables.

## Next evidence-gathering step

After P0 usability is stable, run a document-only architecture spike—not an integration build—with three artifacts:

1. an identity/authorization sequence for MatterControl → LegalMemory REST, including the dual-ACL decision and hidden-resource behavior;
2. a provider-neutral citation schema mapped to LegalMemory's exact response fields and MatterControl evidence/provenance requirements;
3. a license/deployment options memo comparing separate unmodified AGPL appliance, commercial LegalMemory license, and a clean-room provider-neutral connector.

Only after those pass architecture, security and PO review should a synthetic, read-only pilot be authorized.

## Research limitations

- Public sources were inspected at the revisions above; mutable product pages and branch documentation may change.
- No repository was cloned and no application, connector, model, MCP server, API, release binary or deployment was executed.
- No third-party integration claim was treated as certification, and no marketing claim was treated as runtime proof.
- No MatterControl implementation, policy, task status or release gate was changed.
