# MC-CODEX-PROJECT-LOCAL-20261101

- Owner: actual Local Codex; priority P0 manual-test enablement.
- Authority: direct PO request to check current project changes and start local manual testing.
- Requirements: existing P0 BF-01..10, GL-FORM-01/02, D-9, local auth and data-preservation constraints; no new business policy.
- Status: IN_REVIEW / LOCAL_MANUAL_READY_WITH_KNOWN_TEST_FAILURES.
- Inputs: primary source at `64b9e03` plus preserved dirty changes, current project instructions, workboard findings, approved local/Cloud auth profiles.
- Scope: source inventory/review, isolated backend/frontend tests/build, fresh copy of retained synthetic DB, new loopback manual runtime; no application source edits.
- Dependencies: existing Docker PostgreSQL image, installed Node/Go dependencies, private approved auth configuration; human test-account login.
- Outputs/evidence: `docs/testing/codex-project-local-20261101-r1/return.md`, pins, execution receipts and runtime readiness.
- Acceptance: current source built, explicit check outcomes, retained DB unmodified, new local UI/API ready, test failures and missing objects disclosed. Met within this local boundary.
- Tests: backend make check with real isolated PostgreSQL PASS; frontend 842 pass/1 fail/12 skip; build/CSS PASS; preflight 8/8; renderer 6/6. Details and failed attempts retained in the return.
- Reviewer: PO manual testing; nonauthor QA required for final fix-wave acceptance. This task grants no independent product/release PASS.
- Exclusions: commit/push/deploy, credential disclosure or IdP administration, rewriting other agent evidence, changing business policies.
