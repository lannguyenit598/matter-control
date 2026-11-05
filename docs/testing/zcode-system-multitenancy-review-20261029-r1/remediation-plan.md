# Remediation plan — MC-ZCODE system/multi-tenancy audit (pinned candidate @20feedbf)

Ordered by severity; each item names the exact file, the smallest fix, the required regression, the owner and conflicts. Prepare handoffs only — no fixes were applied by this review.

## P0 blockers

None. No confirmed cross-tenant data exposure, privilege escalation or isolation bypass was reproduced. The confirmed findings below do not block the current local P0 runtime; they DO block any multi-customer production claim.

## P1 / P2 (before any multi-company production use; A-01 recommended for the next backend remediation window)

### A-01 — Bind receipt replay to the receipt's matter scope (P2, CONFIRMED on memory + PG)

- File: `apps/backend/internal/core/service/evidence_service.go` (`createdReceipt`), shared with `workspace_service.go` creation path if the same helper is used.
- Fix: before returning a stored receipt, refuse scope mismatch: matter-scoped receipt with `rcpt.MatterID != env.header.MatterID` → `port.ErrIdempotencyKeyReuse`. Keep the HTTP URL-path fingerprint as the outer boundary (already present, `productapi/server.go:345-347`).
- Regression: promote the reviewer probe `SuiteAuditCrossScope 'same actor and key with a different matter hash…'` from the audit isolated copy into the shared contract suite (memory + PG), changed from a documenting probe to a hard refusal assertion.
- Owner: Local Codex (primary backend remediation). Conflict: none — touches only the shared receipt path; review-matrix files untouched.
- Verification: full `make check` with a fresh PG fixture + the new contract subtest.

### A-02 — Gate the local people directory out of non-local deployments (P2, SOURCE_CONFIRMED)

- Files: `internal/config/product.go` (flag), `cmd/mcapi/main.go` or composition root (`internal/app/product.go`) for startup validation.
- Fix: fail configuration at startup when `MC_LOCAL_PEOPLE_DIRECTORY=true` in any non-local profile (e.g. when MC_DATABASE_URL points outside loopback or an explicit `MC_ENV!=local`), with a clear message; keep local/dev behavior unchanged.
- Regression: config test asserting the refusal; no behavior change when the flag is false (uniform 404 already tested).
- Owner: PO decision first (deployment policy), then Local Codex. Conflict: none with the visual session.

### A-03 — Organization tenancy decision (P2 decision-required, not an implementation defect for P0)

- Decision owner: PO with Solution Architecture. Required before: multiple independent customer firms on one issuer, any organization-scoped feature, or marketing SaaS multi-tenancy.
- Design input: this audit's tenancy model section; the A-02 dependency.
- Implementation (when approved): Organization entity + org-scoped directory + lifecycle (provisioning/backup/export per org); migrate people-directory to org scope.

### A-04 — RLS / per-tenant roles as defense-in-depth (P3 backlog)

- Owner: Cloud/DevOps + Codex. Requires the migration-role/privileges deployment decision (the migration bundle explicitly defers production grants). Do not bundle into feature work.

### A-05 — Review schema defense-in-depth minors (P3 backlog, unchanged)

- Files: `migrations_mattercontrol/0008_review_matrix.sql` (cell-scoped predecessor FK, question-revision FK). Requires a PO-approved schema-change decision; 0008 is immutable — a new migration, not an edit.

## Verification still owed (independent, not by this audit session)

1. Non-author re-run of the audit probes + full gates on a fresh pinned manifest (this audit is author-of-the-review-matrix overlapping; other subsystems were nonauthor-reviewed here).
2. Browser/operator journeys after a runtime-owner handoff (A-06): tenant switch, second-user revocation, UNKNOWN reconciliation, >100-answer traversal, EN/VI/keyboard/320px checks.
3. Live IdP/R2/runtime configuration review (out of source scope).

## Immediate next actions

1. Codex intake of this audit packet; schedule A-01 into the next backend window.
2. Runtime owner: provide the disposable corrected-binary runtime handoff to unblock A-06.
3. Solid Glass visual session (this session): proceed per the combined prompt — plan + nonoverlapping prep; shared-file edits remain blocked behind the active Codex UI-fidelity writer until an actual handoff.
