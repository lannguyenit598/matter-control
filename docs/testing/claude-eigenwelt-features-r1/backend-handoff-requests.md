# Backend handoff requests (no Go/SQL was written by this task)

Ownership: Codex's backend session is active; **no receipt exists** for the paths below. Next migration number is `0008` (latest applied: `0007_filing_signature_applicability.sql`). Never edit `mcsqlc/` directly; run `make sqlc-generate`.

Shared files every feature touches (need the receipt first): `internal/adapter/inbound/productapi/server.go` (route registration), `internal/app/product.go` (composition), `internal/core/policy/*` (decisions), `docs/api.md`, `.golangci.yml` only if a new package needs a rule.

## B. Manual source-linked review matrix

- **Entities (new tables, Matter-scoped, FK to Matter):** `review_grids` (id, matter, name, created_by); `review_grid_documents` (grid, exact `version_id`, position); `review_questions` (id, grid, **revision**, text, immutable per revision); `review_answers` (id, grid, version_id, question_id, question_revision, state ∈ PENDING/REVIEWED/ABSENT/ERROR, answer text, author, answered_at, optional user-entered `page`/`quote` labelled *unvalidated*, `source_revision`, supersedes_id). History is append-only: a new answer row supersedes the previous.
- **Stale rule:** an answer is STALE when its `question_revision` is not the question's current revision or its `version_id` is no longer in the grid / the document's current version was replaced and the grid tracks "current"; stale is derived, never stored as a rewrite.
- **ACL:** read = any active Matter member; write answers = OWNER/EDITOR; referenced versions must belong to the same Matter (cross-Matter reference rejected, not hidden). Hidden-resource precedence as elsewhere.
- **Commands:** create grid, add/remove document version, create/revise question, record answer. All idempotent (`Idempotency-Key`), CAS on grid/question revision.
- **Invariants:** an answer never changes verification, a Requirement/Action state or a Filing; "ABSENT" is a recorded human conclusion; no OCR/model error states exist for the manual feature.
- **Tests required:** shared memory/PG contract; cross-Matter reference rejected; revoked-member cannot read; stale after question revision; UNKNOWN replay returns the original answer; export uses existing conventions.
- **Frontend (mine, after the API exists):** Zod schemas, `features/review/*`, route `/matters/[id]/reviews`, bounded filters, accessible cell detail.

## C. Versioned playbooks

- Tables: `playbooks`, `playbook_revisions` (immutable once published; author, approver, published_at), `playbook_entries` (kind REQUIREMENT/ACTION, title, outcome, stable `ref`, bounded count), `playbook_edges` (ref→ref gates). Instantiation: preview (validates refs, cycles, role mapping against eligible current Matter members) then a single idempotent command that creates real Requirements/Actions/dependencies through the existing command gates. Define transaction semantics explicitly (all-or-nothing) without changing existing bulk partial-success behavior. Never copy memberships, evidence, verification or completion state. Template edits never rewrite instantiated Matters (store `playbook_revision_id` on created items only as provenance).
- Needs decision D5 for author/instantiate roles.

## D. Intake, scoped knowledge, saved views

Blocked on D2/D3/D4 in `decisions-needed.md`. First slice if approved: Matter-scoped `intake_requests` (request text, attachments as existing document versions, requester context, received_at, proposed destination, triage state) with idempotent conversion that links to an authorized existing Matter; saved views as validated filter objects (`saved_views`: owner, scope, whitelisted filter JSON), ACL re-validated on each load.

## Not requested here

Connector, LegalMemory/MCP, AI, redlines, reminders (dependencies, not backend ownership).
