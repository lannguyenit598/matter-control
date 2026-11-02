# MC-FOCUS-SEARCH-IMPLEMENTATION-20261101 — local candidate return

Actual agent: Local Codex, primary BE/API/FE writer. Branch `codex/unified-project-flow`, HEAD unchanged `978d8fc694a47e9beee528076bcf1af9473997e3`, plus preserved dirty UI. Status proposed **IMPLEMENTED_SELF_TESTED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS**. No commit/push/merge/deploy.

## Delivered behavior

- Focus: fresh server-authorized assigned Ready Action,15/25/50 minutes, pause/resume/+5/end, toolbar control across navigation/reload, atomic IDB singleton with generation/revision CAS, token-free login epoch and scoped purge. It does not complete or verify legal work, record billable time or create history/stats.
- Quick Search: authenticated same-origin read POST through existing BFF/Go/PostgreSQL, fixed Workspace/Matter/Work Items/Documents groups, EN/VI normalization and literal punctuation, filtering before limit, matching-set fingerprint, encrypted actor/epoch/query/group/hint/limit-bound5min cursors, per-group paging/partial errors, keyboard/IME/current-query guards, private/no-store responses.
- QS-D01: Work outcome excerpt/execution/due; current Document version/upload time. Same-name detection precedes paging; identical metadata keeps the honest Open to inspect hint. No raw ID primary labels, file content/filename search or new grants.
- Additive SQL support migration0012; contract revision13. Dedicated32-byte cursor-key capability is optional: absent/invalid key disables Search with503 and a fixed warning, not ordinary endpoints. Required migration failure can still block a new candidate startup; existing baseline was retained.

## Verification actually executed

| Check | Result | Evidence |
|---|---|---|
| Final backend make check | PASS: sqlc/tidy,0 lint issues, race package gates on owned PG18 | backend-final-r6.log + receipt |
| Search shared contract PG17 and PG18 | PASS, no skipped Search cases in recorded focused runs | pg17-search-r2 and pg18-search-final JSONL/receipts |
| Final frontend pnpm check | PASS:896 pass/12 skip, types/lint/format/agent config | frontend-final-r3-check.log + receipt |
| Final production Webpack + CSS guard | PASS:31 routes,2 CSS assets | direct exec91059; frontend-final-webpack-direct-receipt.json |
| Final Storybook build | PASS | frontend-final-r4-storybook.log + receipt |
| Final Turbopack | ENVIRONMENT_BLOCKED: worker-port bind Operation not permitted | frontend-final-r3/r4-turbo logs, retained; earlier pre-repair Turbo build passed, not adopted as final-byte proof |
| Finite controlled HTTP approximation |128 successful operations,40 explicit commands,5 classifier-like clients,20 Search queries + paging,0 errors; cap10 | mixed-load-http.json; fake OIDC, not actual five visible tabs/production SLO |
| Focus zero domain writes |92 Actions,2 Requirements,113 events,100 receipts, Matter revision113 unchanged before/after actual browser Focus/Search | focus-domain-final-before/after.json |
| Privacy | Known generated credentials:0 hits in selected public evidence and owned private logs; selected routine query/title canaries:0 | privacy-scan.json; bounded scope, not full certification |

The12 skipped FE tests remain skipped; this task does not waive them. Final backend text make-check output does not enumerate per-test skips, so no zero-skip whole-backend claim is made. Failed format, sandbox network/build and probe-harness attempts are retained, not replaced by green history.

Frontend was built without installation in an isolated snapshot with cloned installed dependencies; only snapshot pnpm-workspace.yaml appends verifyDepsBeforeRun:false. Product config unchanged. final-source-manifest.json binds656 source/config inputs; review-fix-delta.json identifies11 changes after nonauthor review. No apparent removed paths from older manifest selection differences were deleted.

## Actual browser observations

Separate loopback preview **http://127.0.0.1:3109/my-actions**, synthetic signed local OIDC/PKCE fixture and owned PostgreSQL. Normal sign-in/callback ran; this is not real ZITADEL acceptance. Main localhost:3000/8081 remained on existing PIDs5840/12838 and was not replaced.

- One Start activation; authorized Action/Matter visible; Pause24:43, +5->29:43 stays PAUSED, explicit Resume runs.
- Tab2 independently reauthorized same session; Pause there converged to29:20 in both tabs. Reload and client navigation retained same target/paused duration.
- End summary explicitly says no work completed; sibling became idle; reload did not resurrect it.
- New active session logout through actual form immediately hid/disabled sibling Focus. Subsequent login did not revive the session.
- Search hOp dOnG matched original Vietnamese labels, rendered outcome/execution and version/upload metadata;5->10->14 unique work destinations without URL navigation. After a long interruption an expired cursor safely showed Results changed; explicit Refresh worked.
- Escape clears text, then closes and returns focus. EN/light and VI/dark Focus inspected. Screenshots focus-desktop.jpg,focus-vi-dark.jpg,search-desktop-append.jpg contain synthetic-only data.
- Requested viewport overrides did not reliably affect the controlled tab: initial reads stayed1280px, a later read574px. Exact320/390/800/801/zoom acceptance is NOT_RUN; no mobile PASS is inferred. Overrides reset. Official tool reset recovered the browser connection; no alternate browser/hidden storage access used.
- One React418 HTML hydration warning was observed at06:15:06.985Z. Fresh reload and another full logout/login did not add one. Root cause remains unconfirmed; no suppression or speculative source fix was applied. Treat it as an open browser-quality investigation, not zero-console-error evidence.

## Nonauthor source review and author repair

Fresh-context actual Local Codex reviewer (not OpenCode) verified656 inputs and returned REWORK_REQUIRED in docs/reviews/focus-search-candidate-20261102-r1.md. One repair pass addressed FS-R1 Resume denial handling, FS-R2 backward-clock restoration and FS-R3 pagination session-loss propagation. Each was reproduced RED then verified GREEN in focused suites. Guards additionally seal a terminal epoch, make repeated suspension idempotent, and reject inconsistent stored RUNNING deadlines. The browser-discovered strict-target wire bug was repaired with a two-ID transport projection regression.

These findings are **AUTHOR_FIXED_PENDING_REVIEW**, not independently CLOSED. The original report is preserved. A manual nonauthor delta/runtime QA handoff is prepared, not dispatched or executed.

## Remaining verification / exact next action

See all36 rows in acceptance-matrix.md/json. Remaining: nonauthor review of11-file repair and final manifest; full real two-tab racing/storage-failure/account-switch/revocation matrix; exact responsive/zoom/reduced-motion/assistive-tech tests; five-user trial; real ZITADEL/provider legs; full mixed SQL/pool/cancellation instrumentation; exact migrator/runtime least-privilege migration preflight; baseline application->candidate reversal.

Reversal was not claimed: a hash baseline alone is insufficient to reconstruct the preserved dirty pre-feature application artifact. The running user baseline was never replaced. Prepare a sealed baseline application/config snapshot before a controlled reversal; do not guess a GitHEAD-only baseline, down-migrate legal schema or touch existing volumes.

Next: nonauthor reviewer consumes final-source-manifest + review-fix-delta + original report and verifies repair, then executes explicitly owned remaining synthetic browser cases. Production/MC-002/P0/release approval stays open.

## Resources and preservation

- Retain QA Next3109, API18084, fixture IdP18094 and owned PG18:55462 for manual testing; memory BFF login is lost if Next restarts. Only fixture login is automatic; no real account credentials are used.
- Owned PG17:55463 stopped after exact ID/label verification; data/container/volumes retained (pg17-disposition.json). No prune/remove/down or mutation of existing databases/volumes.
- Private credentials/raw runtime logs remain only in the task private directory with0600/0700 permissions, not exported. Known-secret scan is bounded and point-in-time.
- The finite load probes intentionally added synthetic Actions;80 retained from the earlier faulty/overlapped harness attempts,40 from the final controlled run. Initial seed had12 Actions; current fixture therefore has132 Actions. Those explicit probe writes are outside the Focus-only zero-write census window. The earlier script used work-items instead of workItems; no product error was inferred.

Skipped: commit/push/deploy, real IdP/cloud/human acceptance and the unexecuted rows above. Remaining risk: author repairs await nonauthor acceptance, one transient hydration warning remains unexplained, exact responsive and reversal proof are incomplete.
