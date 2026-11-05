# LegalWork feature inventory for MatterControl

Research date: 2026-10-29  
Scope: the public `eigenweltlabs/legalwork` repository and its first-party product/user-guide material.  
Evidence labels: **Documented** means stated by a first-party README/product page; **Source-observed** means visible in the public repository structure or source-facing documentation; **Unverified** means not established by the material reviewed here.

## Executive summary

LegalWork is a local-first legal workbench and computer-use agent. Its core user promise is: select an authorised folder, ask in plain English, and review/draft/redline documents on the user's machine with a model chosen by the firm. The product combines document editing, reusable workflows/skills, tasks/intake, storage connections, tabular review, recorder/voice features, evaluations and optional remote/team services.

The strongest MatterControl lessons are interaction and work-product patterns, not code to copy: a task is the entry point; files and instructions are attached to that task; a workflow produces a reviewable artifact; every extracted value should expose its source; and local/remote/provider boundaries are visible before a user sends sensitive material. LegalWork is not evidence that an autonomous result is legally verified or that a MatterControl state transition is complete. MatterControl must keep its own permission, audit, receipt, CAS and “outcome unknown” semantics.

## Source identity, licence and confidence

- Repository: <https://github.com/eigenweltlabs/legalwork>.
- README at the observed public `dev` branch: <https://raw.githubusercontent.com/eigenweltlabs/legalwork/dev/README.md>.
- User guide snapshot set: [docs/research/eigenwelt-20261029/user-guide/PROVENANCE.md](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/research/eigenwelt-20261029/user-guide/PROVENANCE.md). The public GitHub ref API pinned `dev` at `2b8cb18d338da618f686fcdf4dea0ec0eedbe819` on 2026-10-29.
- Requested guide: <https://github.com/eigenweltlabs/legalwork/blob/dev/docs/user-guide/index.md>. The index and 24 topic pages were retrieved over HTTPS, preserved and verified against the immutable commit in the snapshot set.
- Licence: the repository `LICENSE` states MIT and permits use, copying, modification, distribution, sublicensing and sale subject to preserving the notice: <https://raw.githubusercontent.com/eigenweltlabs/legalwork/dev/LICENSE>.
- Product detail: <https://eigenweltlabs.com/legalwork> and task/intake detail at <https://eigenweltlabs.com/legaltasks>.
- The repository README says development checks are `pnpm typecheck`, `pnpm build` and `pnpm test:e2e`; this report did not install or run LegalWork.

MIT permits reuse of code, but it does not transfer Eigenwelt service terms, model rights, third-party notices, or the legal suitability of a feature. Any code reuse would require a separate dependency/license/security review.

## User-guide findings (documented constraints)

The guide is unusually explicit about boundaries that are directly useful for MatterControl:

- **Tasks are not deadlines or executions.** A task has Open/In progress/Done/Cancelled states, owner, due date, attachments and history. A due date does not schedule an agent run or create a calendar event. A calendar reminder does not execute a workflow. A scheduled run is a separate object, runs only while the local computer is awake and LegalWork is open, and a sent run proves delivery to chat rather than completion.
- **Project context is scoped.** A project contains files, details, notes, tasks, reviews, calendar and chats. A local folder or linked storage reference does not itself grant access to another user. Sharing has separate switches for documents/folders, reviews, notes, tasks, calendars, recordings and project details; chats are shared separately. Tabular Review sharing can expose referenced documents even when general document sharing is off, which is an important warning for MatterControl ACL UX.
- **State and evidence are first-class.** Calendar calculations retain inputs, rule version, source links and reasoning trace; calculated/imported dates can be Needs review, and changing a date/source clears confirmation. Tabular Review distinguishes Not found, Needs review, empty, error and stale answers. A plausible cell is not accepted as proof; users inspect the cited page/highlighted region.
- **Review has explicit modes.** Tabular Review applies questions as columns to documents as rows, persists the review/questions/answers/evidence, and supports Only JEV, JEV + LLM, or Only LLM. Missing/incompatible models produce an error rather than silently switching provider or region. OCR/preparation errors are distinct from no relevant provision.
- **Workflow resources are versioned inputs, not authority.** A workflow has instructions, evidence requirements, expected output and attached templates/playbooks. It must be tested on a representative document; editing a workflow does not rewrite previous outputs. A loose SKILL.md is not automatically installed into the library. Imports and shared workflow packages must be reviewed before use.
- **Files have deliberate save semantics.** A connected-storage working copy is not published until the user chooses Save to connection. Word tracked changes and comments are reviewable; PDF annotation/fill/sign operations produce copies, and a visual signature stamp is not a cryptographic signature. Complex Office fidelity requires checking in the target Office application.
- **Wiki and dashboards separate draft, source and snapshot.** Wiki agent suggestions are staged until the user chooses Save to wiki. A dashboard preview is not saved until Save; live dashboards query current source records while snapshots freeze data with a timestamp. Imports do not silently execute another wiki's queries.
- **Integrations are capability- and worker-scoped.** A catalogue entry is not proof an integration is connected. Local-command MCP integrations run on the worker where software and credentials must exist; remote workspaces do not run commands on the laptop by default. Connector status, auth expiry and worker reachability are separate concerns.
- **Privacy is layered.** Folder permissions, Tool Permissions, provider consent and OS microphone/Accessibility/Screen Recording permissions are separate layers. Stored secrets may need an explicit apply/reload. Local processing does not mean every provider or connector is offline; shared projects, wiki sharing, calendar feeds and cloud transcription copy data to services.
- **Feature visibility is not implied by translation keys or source code.** The guide says screen inventory, live UI, account access, permissions and enabled integrations establish availability. Older route/translation entries can be hidden or developer-only. MatterControl should use the reachable UI/contract as evidence, not a dormant route or enum.

Additional guide coverage from the immutable snapshot set:

- **Getting started and screens:** the app distinguishes New Chat, Project, Task, Workflow, Calendar deadline, Scheduled task, Review, Wiki and Evaluation records. A remote browser client does not gain access to the browser user's local folders automatically. The screen map explicitly warns that a documented optional screen may not be installed or enabled.
- **Workspaces/chats:** a workspace binds conversations and execution to a local directory or remote worker. Remote workers can have different files, credentials, models and permissions. Stop cancels queued work but does not undo an edit already applied. A workspace export is not a backup of every cloud account, secret or remote source.
- **Models/Fusion:** provider credentials can come from settings, environment or managed configuration. A listed model may be unavailable because of account, region or quota. Fusion uses up to three candidate models and the main model synthesises; extra runs can increase time/cost. Chat, OCR, JEV and layout models are separate choices.
- **Connected storage/email:** a storage connector does not automatically index files into LegalMemory, and a Drive connection does not grant mailbox access. Email connectors have separate scopes and write permissions. A network-share/storage link is not the same as copying or granting provider access.
- **Audio/recorder:** local transcription requires a downloaded model and local resources; cloud transcription uses a selected region and network. Meeting detection offers a Record action but does not begin recording automatically. Voice Mode and cloud transcription are separate from local recorder behavior.
- **Office add-ins:** Word/Excel/PowerPoint add-ins use a secure localhost connection and require the desktop app to remain running plus OS trust/permissions. Local transport does not mean document content stays local if the selected model provider is hosted.
- **Troubleshooting/support:** a successful connection test for one subsystem does not test other subsystems. Detailed support exports can contain paths, commands, excerpts or paraphrases despite message-body omission and best-effort redaction; users must inspect before sharing.
- **Localization:** only English and German are shipped in the inspected build; other locale tables are incomplete/archive material. Translation keys are not evidence that a control is reachable.

## Capability matrix

| Capability | User journey / inputs | Outputs and boundary | Evidence | MatterControl fit |
|---|---|---|---|---|
| Local workbench | Choose a folder/matter-like document area, authorise files, ask in natural language | Reads, drafts and redlines on the local machine by default | Documented in README | **Near-term inspiration:** make a Matter the clear work context and show the current scope before actions. Do not equate a folder with an authorised Matter. |
| Tasks and intake | Create a task with status, assignee, priority, due date, tags, notes and attachments; optionally receive an email/API request and apply triage instructions | Assigned task retains original request/attachments; owner reviews before starting a workflow; intake does not automatically reply; due dates do not schedule runs | Documented at <https://eigenweltlabs.com/legaltasks> and [tasks snapshot](../../research/eigenwelt-20261029/user-guide/tasks-intake.md) | **Delivery candidate, priority unassigned:** task inbox and task detail as the primary entry to legal work. Preserve human acceptance and audit events; never auto-promote intake to a legal decision. |
| Workflows | Start a reusable workflow from a task; attach instructions, references and templates; edit/reuse the workflow | A repeatable guided execution with linked context and resulting work product; saved instructions do not themselves schedule a run | Documented in [skills/workflows snapshot](../../research/eigenwelt-20261029/user-guide/skills-workflows.md) | **Near-term:** playbook objects with explicit version, owner, inputs, outputs and approval state. Keep a workflow execution separate from Matter state mutation. |
| Skills / hub | Install or publish reusable skills and resources; team can share workflows/skills under a paid sync plan | Reusable instruction/resource package | Documented in product page and README (“skills, plugins, MCP connectors”) | **Later:** curated legal playbooks. Require provenance, permission scope, version pin and review before activation. |
| Document editing | Open DOCX, XLSX, PPTX or Markdown; ask the agent to edit; in Word inspect tracked changes and accept/reject | Local working copy and/or saved document with tracked changes/comments; connected-storage save-back is explicit | Documented in product page and [files snapshot](../../research/eigenwelt-20261029/user-guide/files-documents.md) | **Near-term:** document workspace and explicit draft/current/version distinction. Never overwrite the authoritative record without an explicit command and receipt. |
| Tabular review | Select a document set and fields/columns to extract; choose Only JEV, JEV + LLM or Only LLM | Saved rows/questions/answers/evidence, progress/error counts, filtering and cited source cells; missing/incompatible models error rather than silently switching | Documented in [reviews snapshot](../../research/eigenwelt-20261029/user-guide/reviews.md) | **High-value delivery candidate, priority unassigned:** Matter-level review grid where each cell has source document, page/anchor, extraction timestamp, confidence and reviewer disposition. Cell extraction is a lead, not proof. |
| Source/citation UX | Review a generated answer or extracted value alongside the source context | Human can inspect the cited material before relying on output | First-party product positioning states sources are shown; exact API not verified | **Design candidate, priority unassigned:** every generated status, summary or field should expose source/evidence and distinguish inference from recorded fact. |
| Memory Drive / storage | Connect a storage location; select files/folders for a task; edit a local working copy; intentionally save back | Files from connected storage become task context; save-back is deliberate | Product page lists Google Drive, Dropbox, Box, OneDrive, SharePoint, S3-compatible, Azure Blob, GCS, WebDAV, SMB, SFTP and FTP/FTPS | **Later:** connector boundary only after Matter ACLs, provider ACL mirroring, consent, import receipts and safe deletion semantics are designed. Do not silently index or sync legal files. |
| Models / BYOK | Use a local model or own API key/provider (README names AWS Bedrock and Azure OpenAI; product page describes compatible providers) | Data is sent only to the selected model/provider; hosted Eigenwelt plans add team/service features | Documented in README/product page | **Required architecture:** provider and residency shown before send; key is never stored in Matter data; record provider/model/version in evidence without recording secrets. |
| Paid hosted service | Sign in for team sync, included AI usage, intake and admin controls; Plus/Pro pricing and residency are product claims | Hosted inference/team sync/Intake with service-specific retention and billing | Documented at <https://eigenweltlabs.com/legaltasks>; plan limits/prices are time-sensitive | **Do not import as a P0 dependency.** Use local synthetic mode first; treat cloud/provider behavior, cost and retention as separate approvals. |
| Voice / recorder | Recorder/transcription runs locally; Voice Mode sends microphone audio and a chat excerpt to OpenAI under the user's key and starts only when requested | Transcript or voice instruction; external-send boundary differs by feature | Documented in README/product page | **Later:** optional dictation, with a clear “leaves device” warning and no silent inclusion in legal evidence. |
| Plugins / MCP / remote worker | Manage extensions in Settings; connect an MCP server or optional remote worker | New tools/capabilities and possibly remote execution | Documented in README/product page; exact extension protocol not verified | **Later and guarded:** tools need capability manifests, allowlists, per-Matter consent, dry-run preview, audit, timeout and fail-closed behavior. Never infer that an MCP response is an authorised state change. |
| Evaluations | Run private benchmarks against tasks/models/variants, including tool/skill/workflow variants | Comparative quality evidence | Documented on product page | **High-value internal control:** frozen golden workflows and reviewer-labelled evidence for MatterControl; evaluation pass must not auto-close a legal task. |
| Telemetry/privacy | Official builds may send anonymous event names/counts/durations and content-free error fingerprints to EU-hosted PostHog; setting can disable it; `pnpm dev` sends nothing | Operational telemetry, explicitly not documents/prompts/matter content according to README | Documented in README and <https://github.com/eigenweltlabs/legalwork/blob/dev/TERMS.md> | **Design requirement:** privacy mode and data-flow ledger visible in Settings. MatterControl should default to no telemetry for legal content and separately record any opt-in. |
| Packaging/local operation | Desktop builds for macOS, Windows and Linux; local dev UI and desktop commands | Local application; user does not need Docker/Python for released installers according to README | Documented in README | **UX lesson:** a single local “ready” state with dependency diagnostics is valuable. It is not evidence of production deployment or recovery. |

## Reusable interaction patterns for MatterControl

1. **Task-first entry:** the legal user should land on “what needs my attention,” not a blank technical dashboard. Show owner, due date, status, next action and matter scope; hide identifiers behind human-readable names.
2. **Progressive disclosure:** show a short task summary, then expand “instructions,” “sources,” “activity,” and “technical evidence.” This directly addresses the current MatterControl problem of exposing too many IDs and controls at once.
3. **Work context is explicit:** a work session should show Matter, workspace, user role, effective time, selected sources and provider. A user must be able to remove a source before execution.
4. **Reviewable artifacts:** distinguish draft, proposed change, accepted change and current authoritative version. For a document or extracted field, provide side-by-side evidence and an explicit accept/reject/reconcile action.
5. **Structured review grids:** each row/column has a stable semantic label; each cell can open its source quote/page/record; filters are user-language labels such as “Needs review,” not raw enum/ID values.
6. **Safe intake:** retain the original request and attachments, display the triage result as a proposal, and require an authorised user to confirm assignment/scope. Intake should not silently mutate Matter, filing or status state.
7. **Visible boundary before external processing:** “Local,” “Your provider,” and “Hosted provider” should be visually distinct. Show region/retention and estimated cost when available. Never hide this in a tooltip.
8. **Audit as a human timeline:** expose “who did what, when, to which Matter, with which source/version,” while keeping raw technical IDs available in an advanced drawer.

## Concrete integration recommendations (not new approval or priority)

The following are delivery suggestions derived from the reference product. They do not create a new MatterControl P0/P1/P2 requirement, change the approved roadmap, or authorize implementation. Product Management/PO must map each suggestion to an existing requirement or explicitly prioritize it.

### Recommended design backlog

- Replace technical-ID-first navigation/dropdowns with display name + role/status and a secondary “copy ID” affordance.
- Convert the Create Matter screen into a single primary button that opens a focused dialog/drawer. Show only required fields initially; reveal advanced fields on demand.
- Consider a task/activity entry model that can link to a Matter and preserve the original request, attachments, assignee, due date and next action.
- Consider a source/evidence drawer for generated or extracted values, with “not verified” and “needs review” states.
- Add a provider/data-boundary summary before a model or external connector is used.

### Design next, do not silently implement

- Matter-level tabular review with source/page citations and per-cell reviewer disposition.
- Versioned playbooks/workflows and skill packages with owner, revision, allowed tools, input/output contract and approval status.
- Storage connector framework with read-only first, explicit import, ACL check and deletion/tombstone handling.
- Private evaluation fixtures for golden legal workflows; keep evaluation outcomes distinct from production acceptance.

### Keep out of the current P0 unless separately approved

- Autonomous email/API intake that creates or assigns work without confirmation.
- Remote workers, voice-to-cloud, hosted AI plans, MCP tools that can mutate Matter state, or broad filesystem indexing.
- Reuse of LegalWork source as a dependency without reviewing third-party notices, code signing, provider terms and security boundaries.

## Verification gaps and caveats

- The guide snapshot is pinned to the public dev ref recorded in `docs/research/eigenwelt-20261029/user-guide/PROVENANCE.md`. This pins the research input, not a release guarantee; feature availability still depends on the running build, account, permissions and enabled integrations.
- The guide documents UI/user-facing constraints, not internal API contracts. No endpoint, database schema or runtime compatibility claim is made.
- Marketing/product pages describe available plans and capabilities; they do not prove runtime behavior, security, accessibility, or legal-work accuracy.
- The README says anonymous telemetry excludes documents/prompts/matter content; the TERMS and privacy policy should be read before adopting any analogous telemetry policy.
- “Local by default” does not mean every operation stays local: selected model providers, Voice Mode, team sync, Intake, storage connectors and remote workers have distinct data paths.
- No LegalWork code was installed, imported, executed or modified. No claim is made that a feature is suitable for production MatterControl without an independent implementation and security review.

## Primary sources

- Repository/README: <https://github.com/eigenweltlabs/legalwork>, <https://raw.githubusercontent.com/eigenweltlabs/legalwork/dev/README.md>
- User-guide target: <https://github.com/eigenweltlabs/legalwork/blob/dev/docs/user-guide/index.md>
- Immutable guide snapshots and hashes: [PROVENANCE.md](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/research/eigenwelt-20261029/user-guide/PROVENANCE.md); immutable source base <https://raw.githubusercontent.com/eigenweltlabs/legalwork/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/>
- Licence: <https://raw.githubusercontent.com/eigenweltlabs/legalwork/dev/LICENSE>
- Product overview: <https://eigenweltlabs.com/legalwork>
- Tasks and Intake: <https://eigenweltlabs.com/legaltasks>
- Terms/privacy references: <https://github.com/eigenweltlabs/legalwork/blob/dev/TERMS.md>, <https://eigenweltlabs.com/privacy>

