# Eigenwelt features — roadmap and sequencing

Author: actual Claude Code, 2026-10-29. Status: PLAN (nothing built). The user opted out of questions and said Codex has stopped implementing, so every open decision below is **my call, stated as a default, not a PO approval**. Execution of a slice starts only after the human accepts this roadmap and its slice plan; that acceptance is the "named, accepted source assignment" that `docs/testing/codex-claude-return-intake-20261029-r1/return.md` asks for before any B/C/D write. Until then no Go, SQL or migration is written.

Inputs: `docs/research/eigenwelt-20261029/mattercontrol-integration-assessment.md`, `docs/testing/claude-eigenwelt-features-r1/{return,decisions-needed,backend-handoff-requests}.md`, the backend pattern read from `ControlService`/`context_*` (one Matter-scoped feature, end to end).

## Already done (do not redo)

Focused workbench base, read-only Matter Agenda, Evidence basis (criterion level; CBHI-F01..03 fixed). Visual fidelity of the shell belongs to Codex's UI task.

## Order, and why

| # | Slice | Plan | Why here |
|---|---|---|---|
| 1 | Manual document review matrix | `2026-10-29-review-matrix.md` (detailed, ready) | highest value for due diligence; only needs rights the matrix already grants (OWNER/EDITOR write, any member read); self-contained tables; no policy change |
| 2 | Golden Workflow journeys + "My agenda" | write its own plan after slice 1 starts | frontend-only, no ownership dependency, can run in parallel with slice 1 |
| 3 | Versioned playbooks | own plan, after slice 1 ships | reuses create-Requirement/Action/dependency command gates; biggest transactional design; D5 default below |
| 4 | Matter-scoped intake | own plan | needs only rights that exist; request is not a Matter state |
| 5 | Scoped knowledge (Matter scope) | own plan, **small** | extend existing context records with a `GUIDANCE` kind, draft/publish and source links; no new sharing surface |
| 6 | Saved views (filters only) | own plan | validated filter objects; snapshots stay gated on D4 |
| — | Everything else | not planned | connector, LegalMemory/MCP, AI, redlines, reminders, voice: dependencies, not work |

Each slice gets its own plan file before execution (one subsystem per plan). A later slice is not planned in detail now because its contract depends on lessons from the earlier ones (migration shape, receipt helpers, UI patterns).

## Defaults I am assuming (my calls — reject any of them before the slice that uses it)

| ID | Default | Used by |
|---|---|---|
| D1 | The accepted roadmap is the ownership receipt; one writer at a time on `server.go`, `product.go`, policy; before each slice re-check `git status` and ask Codex to confirm it is not writing | all backend slices |
| D2 | Intake is Matter-scoped: OWNER/EDITOR of an existing Matter records a request in it; no workspace-wide inbox | slice 4 |
| D3 | Knowledge is Matter-scoped (extends context records); no workspace/firm library | slice 5 |
| D4 | Saved filters only; no persistent copied snapshots | slice 6 |
| D5 | Playbooks: workspace OWNER publishes a revision, Matter OWNER instantiates it; no new role | slice 3 |
| D6 | Review answers: OWNER/EDITOR write, every active member reads; never verifies or completes anything | slice 1 |
| D7–D9 | no connector, no reminders, no AI: stay blocked | — |

## Rules that apply to every slice

- Pattern to copy (verified in source): pure domain type in `internal/core/domain/matter`; inbound port + `…Tx`/`…Snapshot` interfaces in `internal/core/port`; service built on `WorkService.execute(ctx, actor, matter, op, policy.DecideCreateRequirement, body)` for writes and `readSnapshot` for reads; `createdReceipt` for idempotent creates; memory store in `repotest/mattercontrol` and PostgreSQL store with sqlc queries, **both run by one shared contract**; DTO + handler + route in `productapi`; composition in `internal/app/product.go`.
- New migration numbers: re-inventory immediately before writing (latest applied today: `0007_filing_signature_applicability.sql`). Never edit applied migrations or `mcsqlc/`.
- TDD red-first for every behavior; hidden-resource precedence: an id from another Matter must be indistinguishable from a missing one.
- Events: new events use their own `TargetKind` (like `CONTEXT_RECORD`); Brief replay ignores non-node targets, and each slice adds a test proving a Brief still reconstructs after its events.
- Backend gate per slice: `make check` with a **new labelled task-owned PostgreSQL fixture** (loopback, random credentials, bounded CPU/memory/PIDs, private storage; prove DSN ownership before setting `MC_TEST_DATABASE_URL`); report skips.
- Frontend gate per slice: `pnpm check`, `pnpm build` and `pnpm build:webpack` with the CSS guard (only after the other writer's files settle), browser check on the owned runtime with ordinary authorized synthetic data.
- Repo rule: **no commit or push unless the user asks.** Every plan's "Commit" step is therefore replaced by "record evidence and leave the tree uncommitted".
- Evidence per slice: new `docs/testing/<slice>-r1/` with return, source manifest/delta, command receipts, screenshots; task record in `docs/implementation/tasks/`.
- English and Vietnamese for every user-visible string; keyboard, 390/320 px, access-loss purge as in the workbench.

## Review Focus (cross-slice)

1. A reference to another Matter's document/version/item must fail the same way as a missing one (no existence leak).
2. A revoked member must lose read access at once, including derived lists, counts and cached pages.
3. An UNKNOWN outcome after a write must reconcile with the original idempotency key, never a fresh one.
4. Derived "stale/superseded/expired" labels must come from stored facts or the server's reason code, never from a frontend guess (lesson of CBHI-F01..03).
5. Nothing in these slices may change verification, a Requirement/Action state or a Filing as a side effect.
