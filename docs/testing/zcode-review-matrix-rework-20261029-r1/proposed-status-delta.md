# Proposed status delta (task-local proposal — not a status change until intake/reviewed)

Task: MC-REVIEW-MATRIX-ZCODE-REWORK-20261029. Proposed by actual ZCode (author of the corrected bytes).

Proposed status: **IN_REVIEW_WITH_VERIFICATION_BLOCKERS**

Rationale:
- RMV-F01..04 are corrected in source with red→green regression coverage reproducing the verifier's exact failing assertions first; the backend full gate (`make check` incl. race + fresh-fixture PG contracts, sqlc-generate + sqlc-check), frontend test suite (78 files / 707 tests), agents check, typecheck/lint and both production build engines with the CSS guard all pass on the final pinned bytes.
- Two timing failures are diagnosed as test-side click-while-disabled races with a before/after repeat set (6 runs flaky → 8 runs clean); no product code, timeout or concurrency was changed for them, and no green rerun is claimed as reliability proof.
- Verification blockers kept open: (a) no human-assisted authorized browser journey (operator checklist in `runtime-handoff.md`, all marked NOT_RUN); (b) literal `pnpm format:check` fails only on two non-source Mimosa session-state files — environment artifact, source scope clean; (c) all of this is author verification — a different non-author reviewer must re-run the affected regressions and gates on these bytes.

Not claimed: independent PASS, MC-002 DONE, Step-03 progress, release/legal/security/production acceptance, $0/RPO/RTO, D2–D9 approvals. The original MC-EIGENWELT-REVIEW-MATRIX task remains not DONE until the non-author review of these bytes completes.

Next exact action: Codex/non-author verifier reviews the corrected source pins (`final-source-manifest.csv`) and `contract-delta.md`, re-runs the affected adversarial cases (F01 presence/precedence, F02 fidelity, F04 purge, F03 traversal + the two timing tests under load), then performs the operator checklist with a human-assisted session.
