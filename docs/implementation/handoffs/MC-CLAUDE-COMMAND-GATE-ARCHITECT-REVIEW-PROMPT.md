# MC-CLAUDE-COMMAND-GATE-ARCHITECT-REVIEW-20261030

Status: **PREPARED_NOT_DISPATCHED** — the human pasting this prompt starts the assignment. Prepared by actual ZCode (architecture-review session) on 2026-10-30. This is an **architecture review and decision assignment** for actual Claude Code in its Solution Architect role. It is not an implementation dispatch; no code changes are authorized to you.

## 1. Context and role

MatterControl's Matter-scoped command gate — authorization, receipt replay, deny-audit, CAS, event-seq fence — exists as one deep path (`WorkService.execute`/`readSnapshot` + `createdReceipt`) plus four scattered hand-rolled implementations whose deny-audit durability, coverage and receipt-scope rules have already drifted in shipped code. A deepening plan was produced through a structured design process (owner-settled decisions, two independent interface designs, a comparison) and is ready for **your architect review and sign-off**. Three design decisions (D1–D3 below) change or parameterize shipped behavior and cannot proceed without your ruling; D4 is a scope ruling.

You are the nonauthor reviewer: the plan was authored by ZCode. Review it as the Solution Architect owning system/domain/data/security architecture decisions. A separate session does not create independence problems here — authorship does: the plan's author is ZCode, not you, so you are reviewing nonauthor work.

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. Expected branch `codex/unified-project-flow` (HEAD at preparation `20feedbf…` with a large dirty tree — the reviewed bytes are the working tree; verify and pin what you read). All shell commands use `rtk`/`rtk proxy`. No `GLOSSARY.md`/ADR history exists except the new `GLOSSARY.md` (created 2026-10-30); there are no ADRs to re-litigate, but approved product scope, permission baseline and the architecture approval gate still bind: do not reopen positioning, tenancy policy, or anything requiring Product Owner approval.

## 2. Inputs (read in this order)

1. `docs/implementation/plans/MC-ZCODE-COMMAND-GATE-DEEPENING-20261030.md` — the plan under review: settled decisions §2, variant comparison §3, interface sketch §4, red-green reproducer set §5, **open decisions D1–D4 §6**, blast radius §7, verification §8.
2. `GLOSSARY.md` — the **Command gate** definition the plan commits to.
3. Source anchors the plan cites (verify each against the working tree, do not trust the plan's quotes):
   - `internal/core/service/work_service.go:82-134` (execute), `:956-997` (readSnapshot), `:136-144` (casCheck), `:1308-1316` (matterDeny), `:371-402` (CreateAction private replay);
   - `internal/core/service/evidence_service.go:63-100` (createdReceipt), `:74-83` (un-audited key-reuse/expiry refusals);
   - `internal/core/service/matter_service.go:86-134` (CreateRequirement's own gate), `:189-203`, `:272-320` (accessFrom, authorizeReceiptScope), `:325-339` (deny — audit-swallow at `:335-337`), `:130` (implicit receipt-kind guard);
   - `internal/core/service/dataops_service.go` — the 8 inline authorization blocks and hand-appended event/fence (`:344-353`), row receipts, `NewDataOpsService(… logger any)`;
   - `internal/core/service/workspace_service.go:40-53`, `:385-409`, `:412-425`, `:805-826` (deny copies + weaker receipt-scope rule);
   - `internal/core/service/review_service.go:17-29` (composition evidence: ReviewService{w *WorkService} — not a migration target);
   - test surface: `matter_service_test.go`, `matter_service_rework_test.go` (note the pinned `TestCreateRequirement_ReplayIgnoresPendingBoundary`), `dataops_service_w6_test.go`, `workspace_service_w1_test.go`, memory/PG contract kits (`contract.go` audit-count assertions, `contract_w6.go:310`).
4. Background (optional, for isolation context): `docs/testing/zcode-system-multitenancy-review-20261029-r2/return.md` — the Phase A audit that surfaced the gate divergences and their isolation relevance.

## 3. Required rulings (the core of this assignment)

For each of D1–D4 record one verdict — **ACCEPT / AMEND (with your exact wording) / REJECT (with reasoning)** — plus any condition:

- **D1 — Bulk-row refusal audit scope.** Plan recommends auditing access-class row refusals only (hidden, role, key-reuse/expiry, hidden-replay); "validation"/"stale"/"unknown-item" row outcomes stay unaudited. Rule on the boundary: is the proposed class list correct and complete? Consider audit volume (a 5000-row bulk of stale rows) against the restricted audit's purpose.
- **D2 — Replay vs boundary guard ordering.** Today inconsistent: Matter replay ignores a pending boundary (pinned by `TestCreateRequirement_ReplayIgnoresPendingBoundary`); CreateAction replay is guard-first. The plan proposes the uniform rule **"replay is boundary-exempt; the guard runs before `build` only"** — this preserves the pinned test but **changes CreateAction's replay behavior under a pending boundary**. You must rule explicitly whether that behavior change is architecturally correct (does a lost response replay constitute "the command already happened", making the boundary guard moot?) or whether guard-first-uniform is required instead (which breaks the pinned test and needs its own justification).
- **D3 — keyAge on W2/W3 replay.** Adds audited key-expiry to receipted replay paths that lack it today. With the default `KeyAgePolicy{}` wiring nothing changes in production; a configured policy would newly refuse aged-key replays there. Rule on uniformity vs the risk of retrofitting a policy onto previously-always-replayable intents.
- **D4 — Residual body-internal role refusals** (e.g. `evidence_service.go:601-603`, `:899`, `workspace_service.go:665-679`) stay unaudited in this migration. ACCEPT as a recorded follow-up, or require explicit `env.deny` calls now (widens the diff).

Additionally rule on, briefly:

- **Variant selection** (plan §3): A-base shape + B's generic replay seam + B's ordering rule. Confirm or amend, with attention to seam placement (what stays outside the gate) and the per-row bulk resolution (both designs rejected a batch entry method — do you concur?).
- **Reproducer set** (plan §5): are these the right three red tests, and do the required test-double changes (memory `FailAt` audit-fault hook, audit-count assertion deltas) stay inside acceptable test-kit discipline?
- **Blast-radius claim** (plan §7): spot-check that the listed files/changes plausibly cover the migration and that "no port/domain/adapter/migration change" holds at the sketch level.

## 4. Boundaries

- Read-only for application source, migrations, tests and configs. Your permitted writes: a new evidence/decision namespace under `docs/testing/` (check absence first, e.g. `docs/testing/claude-command-gate-architect-review-20261030-r1/`) and **nothing else**. Do not edit the plan file itself — your record supersedes it per the verdicts; the plan owner will reconcile.
- No implementation, no tests run against retained resources, no commits/pushes/merges, no runtime lifecycle, no dependency on or restart of any retained process. If you run any read-only verification (grep/source reads suffice for this assignment), record commands.
- Preserve all dirty work and other writers' files. The review-matrix rework writer owns `features/review/**` and upload-attempt tests; the implementation session may be changing backend files concurrently — pin what you review and note drift.
- Independence: do not self-approve any ZCode-authored fix; this assignment approves a DESIGN, not implementation. Implementation still requires its own writer handoff and nonauthor verification afterward.

## 5. Deliverable and final response

In your namespace, write `return.md` containing:

1. Per-D verdict table (D1–D4 + variant selection + reproducer set + blast radius) with exact conditions/amended wording.
2. Overall verdict: one of `ARCHITECT_APPROVED_WITH_CONDITIONS`, `CHANGES_REQUIRED_PLAN`, or `ARCHITECT_REJECTED` with reasoning.
3. The exact conditions the implementing owner must satisfy (including any D2 behavior-change documentation and test updates you require).
4. Anything you verified against source vs accepted from the plan, and what you did NOT verify.
5. Skipped checks and remaining risks.

End the final response with skipped checks and remaining risks. If a material architectural conflict exists that only the Product Owner can resolve (e.g. D2's behavior change if you rule guard-first), state it as a PO decision explicitly instead of silently choosing.
