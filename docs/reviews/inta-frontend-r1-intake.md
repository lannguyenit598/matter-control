# MC-002-INTA-FE-R1 — Codex intake and independent re-review disposition

Codex actual orchestration/read-only intake, 2026-10-25 Asia/Ho_Chi_Minh. Governance base `b86d7c2d60c3f3b433eb4aaf008810c1848a3863`, branch `task/MC-002-solution-architecture`. Authority DEC-028 / frozen INTA-1; trace NFR-001/002/003/008/009 and original51 integration IDs. Actual manual Antigravity R1 return is received; Gemini3.8Flash High is owner-reported identity/settings. This supersedes R1 READY/NOT_DISPATCHED statements: delivery is evidenced by its acknowledged return, not a direct Codex engineering invocation.

**Disposition: REWORK_REQUIRED. ENV_HELD; no Go/PG launch.** [Immutable owner R1 return](inta-frontend-r1-return.md), [actual OpenCode re-review](inta-frontend-r1-opencode-review.md). Companion clean at `6e2f65b51e7ead3c84274e717f8f3bcaeccf9b91` on codex/mc-002-inta-harness-r1, descendant of e25bbc6. Template3e5a642 and backend52b60a4 remain clean. No owner source edits by Codex.

## Verified retention and qualified preparation evidence

[Integrity checks](../testing/inta-frontend-r1-intake/integrity-checks.json):5/5 raw manifest hashes,5/5 export payload hashes,25/25 source-manifest entries and25/25 archive payloads verify;4 raw/export pairs byte-identical. Original archive retained unchanged:23401bytes, SHA256 `29c9537201bc1a4ecc81c3902888297a9fc3f8c537203e9981cac598f3375ab3`. Archive excludes runtime state, node_modules and build output. Current installed metadata Next16.4.2/React19.3.1/TS5.9.3/ESLint9.39.5. All36 required IDs now occur once in the owner's table, no missing/extra IDs.

Owner logs report66 unit passes/7files and7 computed guard passes, zero HTTP requests at a synthetic loopback observer; no Codex replay or independent capture attestation. UTC/exit wrappers improve provenance but byte equality alone does not prove original command capture. Script uses fetch and prints curl equivalents; wrapper/narrative and raw stdout must be labelled distinctly. Negative route compilation supports cross-root imports; successful Go transport, cache behavior and full artifact exclusion remain untested. Template typecheck/lint are owner preparation evidence; no baseline replay requested by Codex. Keyword scans are not complete actual-secret/marker privacy proof. [Qualifications](../testing/inta-frontend-r1-intake/return-qualifications.json).

## Actual independent review and disposition

OpenCode session `ses_e8e41d836ffeP3ZVDaQovlBEBD`, configured model reported by sanitized session `opencode/glm-5.3-flash-free`, exit0,95.471seconds.33snapshots/229238bytes, tools denied, packet-only. [Execution metadata](../testing/inta-frontend-r1-intake/opencode-execution.json); full input/manifest/JSONL/stderr/session retained. Reviewer itself did not attest model identity or recompute hashes; those facts come from Codex/tool intake. Verdict CHANGES_REQUIRED; no material architectural deviation identified.

Source-only closures: original R01 native snake_case, R04 envelope vocabulary/classification (identity caveat below), R05 UTF-8 caps, R06 refId/readbacks, R09 case inventory/descriptions, R10 bounded wire timeout/minor fixes. R02/R03/R07/R08 remain partial. Preserve these improvements; do not rerun old native/product baselines or reopen accepted findings.

| New finding | Required bounded correction |
|---|---|
| MC-002-INTA-FE-R1-F01 | Actual executable phase runner; safe driver-only ENV/owner-readiness gate; one-attempt substep ledger; write-once envelopes and durable checkpoints; assertions for all assigned operations/procedure evidence. Current exported helpers plus36-ID array do not execute phases |
| F02 | No counter reset/ignored persistence failures; no duplicate IDs from stale instances; actual collision paths/custom state directory aligned. Frozen contract explicitly permits a fresh boot discriminator instead of complex counter infrastructure |
| F03 | Measure installed/runtime source identity, refuse missing/mismatched identity before upstream; remove fabricated literal/unchecked override fallbacks |
| F04 | Unconditional startup policy, including test/VITEST contexts and empty prohibited keys; keep per-request controls |
| F05 | Distinguish audited public names from refused secret/auth keys in the report; no new public-key refusal policy |
| F06 | Startup exit must be observed numeric nonzero; timeout is failure; bounded finally cleanup of exact children/observer on every path |
| F07 | Validate positive PID and current ownership identity before any signal; stale/group/unknown targets refuse; accurate teardown/port observations |
| F08/F09 | Assert printed headers or qualify wording; final closed-port snapshot is not continuous never-listened proof; scope runtime/cache/artifact/privacy claims and wrapper/fetch provenance correctly |

### Review implementation advice — binding interpretations

The actual review is retained verbatim. Its suggested new server-side MC_INTA_ENV_READY gate / new503-or409 response is an implementation suggestion, not a frozen-contract amendment. Implement readiness/phase confirmation in the **driver only**; do not add an endpoint input, auth mechanism or response policy. Keep existing POST controls/status semantics from INTA-1. Owner checks coordinate only; frontend never starts/stops Go/PG.

A truly fresh run may initialize new counter state; missing previously required state, unreadable/corrupt state or write failure must never silently restart a used sequence. Atomic rename alone does not resolve stale simultaneous instances; prefer the already-approved boot discriminator or demonstrate minimal correct local allocation semantics. No distributed lock/service is requested.

F06's null-exit risk requires the other pass predicates too (matching stderr/final closed-port observation); this is a possible false-positive path, not evidence every hung child passed. The stop script's empty-PID branch already exits without signaling; the confirmed unsafe input/provenance cases are0/negative/non-numeric/stale targets. No claim any unrelated process was actually killed. These qualifications avoid turning reviewer shorthand into invented runtime facts.

## Next dependency and status

[Full Antigravity R2 prompt](../implementation/handoffs/MC-002-INTA-FE-R2-PROMPT.md): READY / NOT_DISPATCHED until human delivery/acknowledgement. Owner fixes companion only and returns a new R2 source archive/report/evidence. OpenCode independently re-reviews the exact new revision before ENV/upstream execution. No Claude or renewed PO approval for ordinary in-scope corrections; material infeasibility still stops under INTA-1.

Backend preparation remains IN_REVIEW / WAITING_ENV at clean52b60a4, no rebuild. Codex new PG/private DSN remains held; no container/database/volume, upstream HTTP or binary launch in this intake.51NOT_RUN,0PASS/0FAIL;36required/14deferred/1blocked. MC-002, C01-PRODUCT, product identity/isolation, production Cloudflare/cost/full recovery and architecture gates remain OPEN. MC-003A and unrelated files untouched.

Skipped: replaying owner unit/guard/native/product tests, runtime QA, source fixes, Go/PG provisioning/start, production deploy and merge. Remaining risk: executable phase sequencing and independent actual36case transport acceptance are still unproven.
