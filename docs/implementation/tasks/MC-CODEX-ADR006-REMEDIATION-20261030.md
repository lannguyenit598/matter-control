# MC-CODEX-ADR006-REMEDIATION-20261030

Owner: actual Local Codex, direct PO instruction to fix the findings after the ZCode intake. Priority P0. Status IN_REVIEW_WITH_VERIFICATION_BLOCKERS. Branch codex/unified-project-flow, HEAD20feedbf plus preserved dirty source. This task supersedes the previous writer assignment for the targeted remediation only; no competing writer is assigned by this task.

Requirements: ADR-006, receipt scope/current authority, fail-closed auth, durable opaque server sessions and pending-command recovery, provenance, local-only verification. Inputs: codex-zcode-implementation-intake-20261030-r1 and the current ZCode packets. No commit/push/cloud provisioning/retained database mutation.

Scope: BE receipt replay/reference tests; FE redirect and auth/recovery infrastructure; isolated adapter compatibility experiments; local fixture tooling and additive evidence. Preserve visual source and historical evidence. Reviewer: independent nonauthor review required after delivery.

Plan and dependencies:

1. Reproduce/fix cross-Matter creation replay and root redirect; run shared contracts and negative tests.
2. Correct the idle-expiry reference predicate, run fresh disposable PostgreSQL tests and capture actual JSON events; record superseding evidence for the mismatched/failed author packet without overwriting it.
3. Implement opt-in encrypted PostgreSQL BFF state, durable PKCE/session/pending attempts and refresh coordination; test restart, parallel clients, logout/expiry and UNKNOWN behavior. Keep local profile compatibility and fail closed on storage failure.
4. Execute isolated adapter experiments using exact public dependencies, no provider credentials or deployment; adopt only a compatible tested candidate. Record network/tool/version blockers accurately.
5. Run required BE/FE checks, pin changed source and report remaining provider/release decisions separately. No DONE without independent review.

Outputs: source fixes and docs, tests, evidence under docs/testing/codex-adr006-remediation-20261030-r1/. Acceptance: no cross-scope replay; real entry route; honest replacement evidence; no token in browser storage; durable selected profile survives separate store instances/restarts; at-most-one IdP refresh attempt per generation with unknown/crash refusing unsafe reuse; same-key recovery only after authorization; no falsely promoted cloud readiness.

Local implementation and author checks completed: receipt authority/scope/audit corrections; idle-expiry SQL reference; implemented encrypted PostgreSQL BFF state and recovery; OpenNext Worker dynamic-SSR profile/build/HTTP probes. See that directory's return.md and ops/adr006/README.md for exact results and limits. Independent review, managed-provider qualification, browser/human acceptance, cost/residency and production gates remain open. No DONE or deployment readiness promotion.
