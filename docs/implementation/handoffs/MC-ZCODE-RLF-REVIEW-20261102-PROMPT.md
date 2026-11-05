# MC-ZCODE-RLF-REVIEW-20261102 — fresh-session independent review of MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102

## 1. Assignment: review only — do not implement, do not fix

I assign a **new ZCode session** (fresh context, non-author) as the independent reviewer of the implementation executed under the contract
`docs/implementation/handoffs/MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102-PROMPT.md` (RLF-01..08: Filing stale-transition fix, core composition, My Agenda, Saved Views, Playbooks, Intake, Guidance, integrated acceptance).

This prompt is PREPARED_NOT_DISPATCHED until the human delivers it to the actual new ZCode session.

Hard boundaries:

- You are a REVIEWER. You must not modify any implementation source file, migration, test or fixture owned by the implementing session. Your only writable outputs are your own task file and evidence namespace (§8).
- You are the same product ("ZCode") as the author but a different session with no shared memory of the authoring conversation. Treat the author's task record, return statements and test receipts as **claims to verify**, never as evidence. If the PO later routes a second independent reviewer (e.g. OpenCode), this review does not preempt or substitute it; record your verdict vocabulary exactly (§7) and do not self-award DONE.
- Verify source first, re-run selectively (§6). Static source review alone cannot prove runtime behavior: anything you did not execute stays NOT_RUN with the exact reason.
- No commits, push, merge, deploy, paid/provider/cloud actions are authorized. Do not restart the paused retained stack (§9).

## 2. Baseline, drift pinning and one-writer acknowledgment

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. Expected branch: `codex/unified-project-flow`. Implementation base prepared at `7bf198c103476f490ebbdf58b1bd563d0bba8a61` — implementation may be uncommitted in the working tree.

1. Identify your actual tool/provider/model once. Do not rename another agent as ZCode.
2. Verify actual HEAD, branch, staged/unstaged/untracked state. Build the changed-file manifest vs base `7bf198c` (expected clusters: backend `productapi`, `core/port/work.go`, `core/service/work_service.go`, `core/domain/matter/agenda.go`; frontend `features/work`, `features/filings`; migrations if any; task/evidence docs). The manifest may differ — record what is actually there; do not force-match the expectation.
3. At review start, record a **sha256 manifest of every changed file**; re-verify at review end. If a file drifts mid-review (concurrent writer), stop reviewing that file, mark its findings PROOF_BASIS_BLOCKED and report the exact conflict. Do not kill or overwrite anything to restore a pin.
4. A review whose baseline drifted is not a review of the bytes you cite. Every finding must cite `file:line` from the pinned manifest.

## 3. Inputs — read the contract and all claims before any verdict

1. The contract itself: `docs/implementation/handoffs/MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102-PROMPT.md` — §2 approved policy, §4–§11 per-slice requirements, §12 safety limits, §13 completion policy. Your review criteria are THIS document, not the author's interpretation of it.
2. `docs/implementation/remaining-features-audit-20261102.md` and `docs/requirements/p0-p1-p2-priorities.md` (capability IDs, REQ-MC-P1-12 scoping).
3. Author's records: `docs/implementation/tasks/MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102.md` and `docs/implementation/tasks/MC-REMAINING-FEATURES-20261102.md`; author's evidence namespace `docs/testing/zcode-remaining-local-features-20261102-r1/` (checkpoints, commands, UTC, exits, return).
4. `docs/implementation/p0-zcode-execution/local-contract.md` — verify the current revision the implementation actually extended (was rev13 at preparation) and whether contract changes are additive and documented.
5. Prior baselines that must survive: Focus/Search FS-R1..03 repairs (`docs/testing/focus-search-implementation-20261101-r1/return.md`, review `docs/reviews/focus-search-candidate-20261102-r1.md`), sidebar/locale receipt (`docs/testing/codex-sidebar-locale-20261102-r1/return.md`: 906/12), BA flow coverage (`docs/testing/zcode-ba-flow-completeness-20261030-r1/coverage-summary.md`), D-BF1 (no OUTCOME criterion required before APPROVAL), and the separate Filing outcome axis.
6. `docs/implementation/p0-zcode-execution/workboard.json` + `docs/ai-sdlc/project-status.md` for scheduling context only — source and actual returns supersede stale labels.

## 4. Skills to load — only skills matching this project's actual stack

Project stack: **Next.js (App Router) / React / TypeScript + vitest + Storybook → BFF → Go `net/http` (sqlc + goose migrations) → PostgreSQL (Supabase-hosted) + ZITADEL OIDC**. Use only the 2026-11-02 installed skills that fit THIS stack, invoked **explicitly by name**, one skill per review surface, never 2+ skills loaded on the same page/pass. Record in your evidence which skills you loaded and what each contributed; a skill invocation is methodology, not evidence by itself.

| Review activity | Skill(s) | Rule |
|---|---|---|
| Overall diff review methodology | `review` (staff-engineer pass: bugs that pass CI but fail in production) | Load first for the diff pass; stack-agnostic |
| Contract/architecture review of the six feature contracts | `plan-eng-review` | Run against each new vertical slice's operation/schema/permission/atomicity contract |
| Any Go file | `go-skills-router` first, then only what it routes: `go-code-review`, `go-architecture-review`, `go-project-layout`, `go-api-design`, `go-error-handling`, `go-concurrency-review`, `go-security-audit`, `go-test-quality`, `go-test-table-driven`; add `go-performance-review` only when a paging/perf claim is reviewed (e.g. agenda 200-row bound) | Router-first; load secondaries in one pass. The backend is `net/http` + sqlc + goose — no gRPC/GraphQL/CLI/release surface, so `go-grpc`/`go-graphql`/`go-cli`/`go-openapi`/`go-build-release`/`go-binary-size` must not appear |
| Migrations / SQL (new tables, grants, indexes, cursors) | `go-database` + `postgresql`; add `supabase-postgres-best-practices` only for Supabase/pooler-specific grant or connection details | Check migration-number discipline, no hand-edited generated SQL, least-privilege grants, parameterized queries |
| API surface review (`/me/agenda`, saved views, intake/guidance endpoints) | `api-designer`, `api-security-auth-pattern` | REST consistency with existing productapi conventions; authz at route+service+store layers; denial precedence |
| Security pass over authorization/isolation changes | `cso` (OWASP Top 10 + STRIDE lens) | Scope it to the changed surfaces; do not regenerate a full-app threat model |
| Frontend source review | `vercel-react-best-practices` | React/Next patterns and performance claims; judged against the project's own conventions, not re-architecture |
| Frontend test review | `vitest-skill` | This is the project's actual FE test framework; never apply jest/cypress/playwright patterns to it |
| Accessibility & keyboard/focus claims | `accessibility` | WCAG 2.2 AA is a project P0; verify aria/labels/focus claims in the diff |
| Test adequacy mapping | `test-coverage` | Map each RLF risk to an existing test; name what is untested |
| Defect triage (real defect vs test artifact) | `root-cause-tracing` | Read-only investigation; no fixes |

Explicitly **do not load** (wrong stack or wrong mode for this review): `playwright-skill`, `webapp-testing`, `jest-skill`, `cypress-skill`, `cicd-pipeline-skill`, `api-rate-limiting-helper`, `api-graphql-grpc`, `openapi-spec-generator`, `fullstack-dev`, `qa`/`qa-only` (runtime-fix/QA modes), any cloud/vendor/design skills, and the Go skills excluded above. The project has no Playwright/Cypress/browser-automation infra and the retained stack is paused: browser checks stay NOT_RUN with the exact reason — do not fake them with a browser skill.

## 5. Review matrix — verify against the contract, feature by feature

For every item: verdict + evidence (`file:line`, pinned bytes) + what would change the verdict. Source-verified ≠ runtime-verified.

- **RLF-01 Filing stale transition**: decisive RED test exists (render stageA → select → rerender with stageB/new `detail.next`)? Selection preserved only when still allowed; invalid target can never be submitted; label/required fields/ submitted command consistent with current detail; CAS, command identity and OUTCOME_UNKNOWN handling untouched; empty-next and conflict-refresh covered. Confirm D-BF1 is unchanged in code, not just prose.
- **RLF-02 core composition**: no W1–W7 rewrites; the composed work-context area is read-only from authorized records; no duplicate attachment storage; no local path treated as permission; Focus/template/intake/guidance/review actions cannot verify or complete legal work as a side effect; Requirement vs Action and all independent axes preserved; existing Pane/glass/locale/density/keyboard behavior not regressed.
- **RLF-03 My Agenda**: server-side authorized cross-Matter read (e.g. `GET /me/agenda`) with query-side authorization in Go/PostgreSQL — no FE fan-out enumeration; stable ordering/cursor + deterministic date bounds; denied/revoked/inactive scope leaks nothing (titles, people, counts, snippets, cursors); re-authz per page; one-page-200-row limitation fixed or truthfully disclosed in UI; device-zone dates, empty/error/access-loss states; no calendar-sync/deadline/reminder overclaim.
- **RLF-04 Saved Views (REQ-MC-P1-12)**: private to owner + applicable list/Matter; versioned validated filter schema (no legal record copies, tokens, arbitrary URLs, executable queries); CRUD via existing command patterns (CAS/receipts/OUTCOME_UNKNOWN); apply restores through the existing list URL contract with Back/Forward intact; unknown/unsafe filter shapes rejected; re-applied authorization handles renamed/deleted/revoked targets; nothing shared/global.
- **RLF-05 Playbooks**: publish = immutable revision + provenance; no mutation of published revisions or old instantiations; no scripting/code execution; Matter OWNER previews exact revision (names, kinds, owner mappings, dependency graph, validation errors) before explicit apply; apply re-validates and is **atomic + idempotent with receipt**: no partial graph on failure, replay uses original command identity, uncertain results reconcile before another apply; cycles/foreign references/invalid people rejected; memory + PostgreSQL parity including restart and concurrent/replayed apply; provenance on created work is not evidence or completion.
- **RLF-06 Intake**: OWNER/EDITOR of existing active Matter only; requester metadata ≠ membership; conversion to Requirement/Action is explicit, atomic, idempotent, duplicate-proof, with re-checks at commit and UNKNOWN reconciliation; minimal documented states + audit; not a hidden draft lifecycle or workspace inbox.
- **RLF-07 Guidance**: OWNER/EDITOR drafts, Matter OWNER publishes immutable revisions; publication never satisfies criteria or changes legal state; no cross-Matter escape; readable text + attributable exact-version references (no fabricated anchors/AI citations); access-loss purges protected client state; referenced versions stay explicit when current version moves.
- **RLF-08 Integration**: migrations — inventory before adding; no reuse of `0012`, no edits to applied migrations or generated SQL, no broad grants; append-only events; Brief/history replay valid with new event target kinds; no reinterpretation of guidance/intake/playbook metadata as legal item state; Zod/DTO validation, central error mapping, hidden-resource precedence, revision CAS conventions reused; **test receipts audited**: real commands/UTC/exit codes, two actors/roles, foreign scope, revocation, stale CAS, malformed input, replay, uncertain write, atomic failure, persistence/restart; FE gates (pnpm check, prod build with compiled-CSS guard, alternate bundle, Storybook) — check the author's outputs exist and spot-re-run at least one cheap gate independently (§6).
- **Cross-cutting regression**: FS-R1..03 intact; sidebar/locale 906/12 baseline intact; EN/VI labels; 320/390px and keyboard/focus claims supported by evidence; no misleading truncated lists.

## 6. Independent re-verification — selective, isolated, honest

1. Re-run cheap gates yourself in isolated task-owned fixtures: backend `make check` (memory + PostgreSQL synthetic fixture you create and own, verified ID/port/cwd) and FE `pnpm check`/targeted vitest files for the changed areas. Record command, UTC, exit, pass/fail/skip.
2. Do NOT rebuild into shared `.next` outputs, do not restart the paused retained stack (ports 3000/3109/8081/18084/18094/8080/55440/55441/55462 were closed at handoff — re-inventory before relying on that), do not touch retained containers/volumes/databases, do not prune anything.
3. Heavier runtime proof (connected GW-01/02/03 browser path, real IdP login, 200-row grid, screen-reader announcement): verify only the author's receipts exist and are internally consistent; re-executing is optional if a supported browser + synthetic login fixture is available under §9 limits. Otherwise mark NOT_RUN — author receipts are not your independent results and never upgrade to PASS by silence.
4. If the author's status is `PARTIAL_IMPLEMENTATION`, review completed slices fully and mark the rest NOT_IMPLEMENTED — do not review prose instead of code.
5. Obey real tool/security refusals (Mimosa hook refuses `bash <script>.sh` and `rm` on script paths; run logic inline). Prefix shell commands with `rtk` per `/Users/nguyenvanlan/.codex/RTK.md`. Semble-first exploration; targeted search after a recorded failure.

## 7. Findings and verdict vocabulary

- Findings: `RLF-REV-xx-NN`, severity P1 (contract violation / security / data integrity) / P2 (real defect or missing wiring) / P3 (polish), each with pinned `file:line`, exact quote, why it violates the contract section, and required remedy. No finding without evidence; no praise without verification.
- Per-slice verdicts: `SOURCE_PASS` (source-verified, within limitations listed) / `SOURCE_PASS_WITH_LIMITATIONS` / `SOURCE_CHANGES_REQUIRED` / `NOT_IMPLEMENTED` / `PROOF_BASIS_BLOCKED` (drift or missing receipt).
- Overall: `REVIEW_RETURNED_IN_REVIEW_WITH_OPEN_BLOCKERS`, `REVIEW_RETURNED_CHANGES_REQUIRED`, or `REVIEW_RETURNED_SOURCE_PASS_WITH_LIMITATIONS`. Independent-review completion of the whole assignment is the PO's call; you propose status, you do not declare DONE.
- Explicitly restate: browser/human/IdP/provider checks left NOT_RUN (if any), and that D-BF1 remains unchanged.

## 8. Outputs — your own namespace only

Create (check absence first; never overwrite the author's files):

1. `docs/implementation/tasks/MC-ZCODE-RLF-REVIEW-20261102.md` — task record: requirement/contract IDs, owner (actual identity), base/head + drift manifests, skills loaded with contribution notes, findings index, verdicts, next status.
2. `docs/testing/zcode-rlf-review-20261102-r1/` — `return.md` (§5 matrix, §6 re-runs, §7 verdicts, skipped checks, remaining risks), `commands.log` (reproducible commands/UTC/exits), `drift-manifest.txt` (sha256 start/end), findings files as needed.
3. Final packet must end with: what was skipped and why; remaining risks; the exact next action (e.g. rework items → back to implementing session; or PO routes final acceptance).

## 9. Execution limits

Synthetic data only; no legal matter data, secrets, tokens or credentials in evidence — redact before writing. No production/retained DB for any test; fixtures are new, isolated, bounded, labeled, and stopped at the end with retained resource receipts. No IdP administration, no MFA/email bypass, no commits/push/merge/deploy, no paid or provider/cloud mutations. Do not claim an external agent or human participant ran; AC-137/AC-FOCUS-18 human checks remain human. If a refusal blocks a review step, record it and continue independent work around it; report the exact refusal text.
