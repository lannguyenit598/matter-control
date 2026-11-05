# Proposed shared status/contract delta — not applied

For the shared workboard/contract owner; avoid racing Claude's documentation consumers.

- Task MC-P0-CODEX-BACKEND-LOCAL-20261029: IN_REVIEW_WITH_VERIFICATION_BLOCKERS. Backend-only Local Codex candidate ready for a nonauthor review; no DONE or release promotion.
- Record fresh PostgreSQL make check: 593 test passes, 5 explicit skips, 0 failures; sqlc/format/tidy/lint/race gates passed. Six packages have no test files, separate from skips.
- Operational contract addendum proposal: product readiness always pings PG with a 500ms deadline; failures/draining use generic 503 `urn:mc:unavailable`; health remains liveness. Positive `MC_TRANSFER_TIMEOUT` defaults to 60s for upload/content/import/export/bulk commit; ordinary requests remain 10s. Socket read/write budgets stay finite. Existing auth, size/concurrency limits, receipts/CAS and OUTCOME_UNKNOWN semantics remain.
- Record K_SERVICE/fs fail-closed guard and active-request shutdown drain/cancel verification. Do not mark ADR-004 B4 capacity closed: deployed RTT, near-25 MiB HTTP/workbook and bulk workload measurements remain open. B3 real R2 is not run. No role-level timeout, instance-cap, keep-alive or backup scheduling action occurred.
- Preserve S5 API-reference/Postman/tester-app deferral; the narrow backend API runtime addendum does not reopen it.
- Next: nonauthor final-source review; Claude/human retained-runtime uptake and authenticated UI/IdP verification. No new policy, provider, production, cost or recovery acceptance.

Skipped: shared-file writes and external dispatch. Risk: local passing gates do not establish release or provider readiness.
