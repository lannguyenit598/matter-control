# MC-EIGENWELT-REVIEW-MATRIX-VERIFY-20261029

- Owner: actual Local Codex, nonauthor of the review-matrix feature; priority P0 local verification.
- Status proposed: REWORK_REQUIRED. Original author task/evidence preserved.
- Requirement mapping: BR-001..007; REQ-MC-P0-06/07/15; approved slice Review Focus 1–5, receipt/CAS, hidden resources, proof independence and read-only review semantics.
- Base/HEAD: `20feedbf06c859a9806055d609f5b132fe8bb086`, branch `codex/unified-project-flow`, primary dirty checkout.
- Scope: read-only source/evidence review; independent gates and adversarial tests in private scratch copies and a new task-owned synthetic PG fixture. Proposed regression patch only; no source fix in shared checkout.
- Inputs: human-pasted verification prompt, Claude 43-file source manifest/return, slice plan/roadmap, previous backend manifest for provenance.
- Outputs: `docs/testing/codex-review-matrix-verification-20261029-r1/` consolidated return, intake/final pins, command/test/mutation logs, proposed regression patch, fixture/cleanup records and task-local status delta.
- Acceptance: source/artifact/migration integrity; backend make check + targeted contracts; concurrency, Unicode, ACL and scale cases; two scratch mutation checks; frontend check/targeted/build gates and independent adversarial regressions; no retained-data lifecycle or secret disclosure.
- Results: 43/43 source pins, 11/11 artifact pins; 0001–0007 unchanged, only 0008 new. Backend 634 pass/5 skip/0 fail; original targeted 32 pass. PG races/1,250-cell read/full-graph isolation pass. Both mutations detected. Frontend full check 691 pass/1 upload timeout; targeted first 42 pass/1 UNKNOWN retry failure, subsequent 43 pass retained separately. Both build engines/CSS guards pass in private output.
- Findings: omitted expectedAnswerId accepted; UNKNOWN retry changes CAS fields; 101 answers silently truncated to total 100; protected cell detail retained after confirmed access denial. All have proposed failing tests in evidence. Source not fixed here.
- Reviewer/next: actual feature author responds; a separate verifier checks corrected source. Codex's earlier reliability implementation is outside this feature's independent verdict; only the one-nil readiness test compatibility edit is reviewed here.
- Skipped: human-assisted rendered verification, full screen-reader/localization audit, real R2, retained DB outage/migration/rollback, new policy decisions, other features and commit/push/deploy. Runtime probes only; no release/MC-002/security/legal acceptance.
