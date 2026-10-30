# ZCode review-matrix rework packet

Prepared by actual Local Codex, 2026-10-29. Manual handoff: PREPARED_NOT_DISPATCHED. The human delivering a prompt assigns its named scope to actual ZCode; do not claim a Codex subagent is ZCode. No external message/tool dispatch happened during preparation.

## Required outcome and order

Fix the four confirmed RMV findings, resolve or precisely explain the recorded timing failures, and deliver a corrected candidate with a source-bound validation handoff. No new product feature is needed for this rework.

Run these prompts **sequentially in the same ZCode session**. Read [COMMON.md](COMMON.md) before each prompt; keep one writer for shared files. Do not open four parallel writers or wait for permission after each routine bounded fix. If a concrete blocker affects one slice, record it and continue independent permitted work.

| Order | Prompt | Required scope |
|---|---|---|
| 1 | [01 — recovery and access loss](01-recovery-and-access-loss.md) | RMV-F04 P1 and RMV-F02 P2; frontend review surface/shared form recovery |
| 2 | [02 — explicit answer expectation](02-explicit-answer-expectation.md) | RMV-F01 P2; backend request-presence/CAS/ACL contract |
| 3 | [03 — complete bounded history](03-bounded-history.md) | RMV-F03 P2; backend pagination and frontend history continuation |
| 4 | [04 — stability and final handoff](04-stability-and-final-handoff.md) | Diagnose timing failures, final gates, authorized rendered handoff, consolidated candidate |

At preparation HEAD was `20feedbf06c859a9806055d609f5b132fe8bb086` on `codex/unified-project-flow`; all 43 source entries still matched the verifier manifest. Recheck at execution; HEAD alone does not identify dirty bytes. Preserve later drift and authorship.

## Additional acceptance gaps that must be covered

1. UNKNOWN must preserve the entire original command and key through refreshed props, ordinary remount/navigation and permitted same-session recovery; a new question revision must not replace its CAS facts.
2. After a definitive authorization denial, clear the protected review surface, including grid/detail/history/citations, and purge its drafts/attempts. Unrelated transient errors and 412 conflicts must not erase legitimate user text.
3. History stays bounded to at most 100 per page; older records must be reachable and metadata truthful. Include 0/1/100/101/205 cases, concurrent additions, cursor validation and reauthorization. Do not merely remove the cap or add a cosmetic partial badge.
4. Retain the failed full upload test and targeted UNKNOWN retry test logs. Diagnose pending-state/async scheduling/harness behavior before changing code or timeouts. A later green run is not proof of reliability.
5. Final independent review and actual authorized browser checks remain separate from ZCode author verification. No P0/MC-002/release closure follows automatically.

Do not add partial root indexes/FKs, new schema migrations, broad ID cleanup, cross-Matter agenda, playbooks, intake, knowledge, AI/providers, export or a new persistence framework. Schema defense-in-depth and minor accessibility wording beyond touched controls remain recorded follow-ups unless directly required by these fixes. Existing immutable migration 0008 must not be changed or downgraded.

## Copyable dispatch

```text
You are actual ZCode. Read COMMON.md and execute prompts 01→04 sequentially from:
/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/handoffs/MC-REVIEW-MATRIX-ZCODE-REWORK/

Own only their named review-matrix rework paths; preserve current source, all dirty work,
leonx.me/matter-control and the other UI writer's files. Fix RMV-F01..04 with red-before-green
tests and finish a manifest-pinned candidate with evidence or specific blockers. Do not
stop at planning. No commit/push/merge/deploy, real R2, retained DB tests/migration/rollback,
provider/IdP changes, competing writer or external-agent dispatch.
```

Skipped at preparation: actual ZCode invocation, implementation and new tests. Risk: existing candidate remains REWORK_REQUIRED until corrected bytes receive independent verification.
