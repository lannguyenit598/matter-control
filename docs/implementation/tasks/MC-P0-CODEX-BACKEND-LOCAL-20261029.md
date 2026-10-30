# MC-P0-CODEX-BACKEND-LOCAL-20261029

- Owner: actual Local Codex; priority: usable local P0.
- Status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS. Independent reviewer: another nonauthor, not yet assigned.
- Requirements: REQ-MC-P0-01..20 compatibility; BR-001..007; W1–W7 persistence, evidence integrity, operational readiness; ADR-004 B4 and filesystem guard.
- Base/HEAD at intake: `20feedbf06c859a9806055d609f5b132fe8bb086`, `codex/unified-project-flow`; existing dirty work preserved.
- Inputs: full backend intake/local-readiness prompt; Claude hardening S0/S6 and R2 returns; hexagonal hardening design; ADR-004/005; deployment checklist; focused-workbench assignment revision 2; current workflow/status and backend rules.
- Scope/outputs: scoped `apps/backend/**` reliability fixes/tests/docs; new task-owned synthetic PostgreSQL/API resources; this task and `docs/testing/codex-backend-local-readiness-20261029-r1/**` evidence. Preserve `leonx.me/matter-control`.
- Exclusions: frontend and Claude runtime; existing DB migration/tests; real R2; external dispatch; commit/push/deploy; shared workboard writes.
- Dependencies: available local PostgreSQL image, Docker permission, installed Go/lint/sqlc dependencies; independent final review.
- Acceptance: manifest/lineage intake with explicit drift; real isolated PG contracts and `make check`; red/green regression checks for confirmed reliability fixes; bounded readiness/shutdown; cloud filesystem guard; sanitized API handoff and resource cleanup.
- Tests/evidence: command argv, UTC, exits and test-level counts recorded in evidence namespace; no fixture credentials published. Final return will record acceptance per item and proposed status.

## Candidate return — 2026-10-29

[Consolidated return](../../testing/codex-backend-local-readiness-20261029-r1/return.md): 190/190 S6 intake hashes and both aggregates verified; 101 rename-only lineages reconstructed. Seven existing backend paths modified, two tests added; no frontend/shared workboard changes. Readiness DB check/503 mapping, bounded transfer budgets and K_SERVICE/fs guard corrected; shutdown verified without implementation change.

Final `make check` with a new isolated synthetic PG fixture: 593 pass, 5 explicit skip, 0 fail; sqlc/format/tidy/lint/race passed. Owned API smoke: 200 health/ready, 401 missing bearer, paused-PG readiness 503 within 500ms, recovery 200, SIGTERM exit 0. Both created fixture containers/anonymous volumes cleaned; existing runtime preserved. Initial tmpfs-capacity and dynamic-port orchestration failures are retained separately.

Completion evidence: final source manifest/delta, test logs/counts, runtime results/handoff, cleanup and privacy evidence under the return namespace. Independent correction review, real R2, deployed/full-size performance and authenticated browser/IdP acceptance remain open. Next: Claude consumes API handoff; a nonauthor reviews this candidate. No DONE, release or production certification.
