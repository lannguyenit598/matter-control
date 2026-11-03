# Curated product integration — 2026-11-03

Imported source: coordination commit `6172f234be5a25393cddffaf841cc0370b587334`.
Integration base: local `main` at `54e1db541157706dee9037b23f630faf59249c27`.
The source was authored across the existing Codex, Claude Code, ZCode and Antigravity work;
this curated import does not relabel their historical authorship or rewrite that branch.

Included: both applications and tests, migrations/generated queries, CI, operator scripts and
profiles, selected ADRs, approved rule references, design direction and canonical API contract.
Excluded: coordination tasks/handoffs/prompts/workboards, raw evidence/logs, prototype/research
iterations, source-import dossiers, machine caches, runtime metadata and `.orig` backups.
Technical app instructions required by the checked-in tooling remain with each application.

The [coordination snapshot](https://github.com/lannguyenit598/matter-control/tree/6172f234be5a25393cddffaf841cc0370b587334)
and its [historical verification record](https://github.com/lannguyenit598/matter-control/blob/6172f234be5a25393cddffaf841cc0370b587334/docs/testing/codex-rlf-verify-commit-20261103-r1/return.md)
retain the dossier without duplicating it in the product tree. These remote links resolve only
once that commit is available on the remote; it is retained locally regardless. This task does
not push either branch.

The contract is relocated from `docs/implementation/p0-zcode-execution/local-contract.md` to
`docs/api/contract.md`; normative operation tables are retained, old dispatch/pinned-runtime
bookkeeping is removed and current memory/durable storage profiles are clarified. Old historical
architecture drafts are replaced by the current source summary; ADR-006/007 retain their statuses.

Local tests/builds are distinct from browser, real IdP, assistive technology, human trial,
new-feature recovery and cloud qualification. Those gates are not closed by this merge. A
retained local database may have applied the earlier 0016 draft; reconcile its actual constraints
before a future runtime refresh. No shared runtime or database is changed by this integration.

## Local integration verification

- Backend `make check`: PASS against a new PostgreSQL 18.6 fixture, including generated SQL,
  formatting, tidy diff, zero lint issues and race suites. The owned fixture was stopped and
  retained; no existing database was migrated or reset.
- Frontend type generation/typecheck, lint, formatting and unit tests: PASS, 920 passed / 12
  skipped. The first aggregate check failed only on three references to excluded historical
  audits. Those references were changed to archive links; formatting and agent sync/check then
  passed (17 skills / 3 scoped rules). No product logic changed during that repair.
- Production Webpack build and compiled CSS guard: PASS. Storybook build: PASS, with upstream
  module-directive warnings retained as warnings.
- Profile renderer: 6/6 tests PASS. Restore script: shell syntax and temporary-output-default
  assertion PASS; no restore execution is claimed.
- Internal Markdown links and broken symlinks: checked, no broken local targets. Historical
  remote archive links were not fetched. A private-key header pattern appears only as a deliberate
  renderer rejection test string, not actual key material.
- The isolated frontend initially attempted an automatic dependency pre-run relink and failed
  on sandbox DNS. That attempt was stopped; its private dependency copy was recreated, and
  automatic pre-run install was disabled only for local verification. The committed package
  manager policy is byte-identical to the source commit. Shared dependencies/source were not
  relinked by this task.

Business code/test/fixture parity: **686 files**, zero blob differences against the
source commit (excluding obsolete `.orig` backups). Inventory SHA-256: `06456d690cf2769fa03407b28a8caf4bd79b8b299239731a671f8adf70b04f97`.

Browser/E2E, real IdP, accessibility/human trials, recovery replay and cloud qualification were
not run here. Raw local verification logs remain outside the product tree. GitHub `main` did
not appear in the read-only remote-head lookup; this operation updates local `main` only and
performs no push. Future remote publication is separate.

Vendored upstream frontend skills retain their existing whitespace to preserve upstream bytes;
those baseline-only warnings are excluded from the integration whitespace gate. Application
source and maintained documentation are checked without that exception.
