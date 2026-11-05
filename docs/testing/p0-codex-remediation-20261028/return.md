# MC-P0-CODEX-PRIMARY-REMEDIATION-20261028 — candidate return

Actual agent/tool: Local Codex. Authority: direct PO confirmation that Claude stopped and Codex takes over primary source. Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`, unchanged. Product source is uncommitted. Status: **IN_REVIEW_WITH_VERIFICATION_BLOCKERS**, not full P0 acceptance, MC-002 DONE or release approval.

## Delivered source

| Intake item | Implemented behavior | Disposition |
|---|---|---|
| CL-01 | Filing commands emit complete work snapshots; Brief applies stage/closure/reopen and retains owner. New creation explicitly records known-unassigned owner; legacy omitted owner fails closed until an authoritative later snapshot. Shared memory/PG test reproduces owner-at-creation loss before the fix. | Corrected, current-source author tests pass; final pin delta review pending |
| CL-02 | Historical criteria, claims, assessments, disputes, documents, epochs and dependency edges feed the same domain evaluator at t2 as live reads. Expiry boundary, alternatives/optional proof, revoked/withdrawn/old-epoch/stale-revision proof and downstream gates have regressions. Missing historical inputs/edges fail `brief-unreconstructable`, never invented READY/VERIFIED. | Corrected with legacy compatibility/availability limit |
| CL-03 | Import retains optional `verification` as non-authoritative `importedVerificationClaim`, includes it in content identity, persists through existing DB columns for Requirement and Action, and exposes preview/API/readback/UI. Import dependency edges now have causal events in the same transaction; a real memory/PG gate failure exposed the missing events before this correction. | Corrected, no migration or automatic verification |
| CL-04 | Before command dispatch, exact bulk/import payload and keys are kept server-side under the live BFF session. Reload/tab-close inspection does not POST. UNKNOWN recovery is explicit and re-authorized; terminal receipts are cached until matching browser ACK, including lost-response recovery without mutation resend. Server-side locks refuse concurrent/different/settled-unacknowledged attempts. Access loss purges protected data and leaves a refusal marker that re-grant cannot revive. | Implemented/tested within local process-only session profile; restart/expiry/sign-out recovery is not durable |
| CL-05 | R9 semantic tokens, typography, sizing/focus/reduced motion, independent-axis badges and Verification grid column; Data/History tabs, actual cursor pagination and event provenance; authorized workspace/Matter/role/read-time scope across Matter routes; initial EN/VI preference/date/history infrastructure. Existing dark theme retained. | Source implementation improved; complete localization/rendered/a11y/human acceptance remains open |
| CL-06 | Fresh backend and frontend gates run on final candidate bytes; earlier failures remain retained. Generic recovery-test clicks now wait for the real pending transition to finish rather than clicking a disabled control. | Current-source gates pass, scoped precisely below |
| CL-07 | Restore compares exact Matter identity/fact set at boundary B, not a subset after the source marker. Mandatory acceptance checks affect exit status. DSN targeting is parsed structurally with no-query support, local-host/override refusal and safe stdin handling. Existing DBs/volumes are not removed. | Nine checker tests and two local runtime runs pass; final-source repeat blocked by approval-review availability |

Contract is revision12, preserving approved business rules and prior author history. The revision10 provenance claim was corrected: exact earlier bytes were retained in the immutable intake snapshot and exported in `retained-contract-rev10.md`; they were not “unrecoverable”. No history/evidence was rewritten.

Source identity: `final-source-manifest.json` pins **714 selected public source/rules/config files**. `source-delta.json` lists **70 added/modified paths** against the original 697-file takeover snapshot. `source-drift-check-final.json` records zero closing drift. The selection excludes private env/keys, dependencies and runtime/build outputs; it is not a Git commit or full working-tree manifest.

Two disjoint Codex workers began BE/FE changes and hit quota before completed returns. Root Codex inspected and completed their partial source, ran the integrated gates and owns this return. This is not new external ZCode/Antigravity/Claude execution.

## Executed validation

| Check | Actual result / evidence |
|---|---|
| Backend final R4 | sqlc1.31.1 generated comparison, gofmt, tidy-diff, golangci-lint, full `go test -race -count=1 -json ./...`: all exit0. **764 pass /4 skip /0 fail**, zero malformed JSON lines. `validation/backend-r4/` contains raw stdout/stderr, exact argv/UTC/exit and enumerated skip summary. Native legacy and product PG tests use their separate assigned synthetic databases. |
| Frontend final R5 | `pnpm check` exit0: type generation/TypeScript, ESLint, Prettier, **44 files /444 tests**, agent config. `pnpm exec next build --webpack` exit0; history/Data/product routes in build output. `validation/frontend-r5/` contains exact commands/times/logs. |
| Default Turbopack | Both sandbox and approved host attempts failed at compiler-worker port binding (`Operation not permitted`). They are retained in `validation/frontend-final/` and `validation/frontend-build-host/`. Webpack is the documented supported Next16 alternative; package/build defaults and dependencies were not changed. Webpack success does not establish default Turbopack success. |
| Pure restore checker | **9 tests pass**, shell syntax pass. `restore/checker-r2/`. `restore/baseline-oracle-red.json` records the exact former comparator wrongly accepting a missing original Matter. |
| Local restore attempt1 | `restore/runs/20261028T071518Z/`: **53 Matters,3 objects**. Census/object/readback/restart equality; post-boundary marker absent. Exit0. Before DSN-helper correction. |
| Local restore attempt2 | `restore/runs/20261028T072524Z/`: **54 Matters,3 objects**, zero object failures and exact boundary readback. Corrupt/truncated archives each exit1, zero tables left; altered object readback exit1; missing object yields a different availability report (readback exit0, recorded accurately). Acceptance exit0 after structural DSN correction. This predates the final legacy-Filing owner correction. |
| Final-source restore repeat | **NOT_EXECUTED_APPROVAL_REVIEW_UNAVAILABLE**. Automatic approval review exhausted its quota; it did not determine the action unsafe and no bypass was attempted. `restore/final-source-run-blocked.json`. Existing successful runs are not relabelled as final-byte restore. |
| Public evidence patterns | 113 selected new log/JSON/text evidence files: zero credential-bearing PostgreSQL URI, private-key header or bearer-JWT pattern hits. `public-evidence-pattern-scan.json`. This counts-only check is not an actual-secret scan or complete privacy acceptance. |

The four backend skips remain explicit: helper skip-without-env branch, PostgreSQL group-fault injection case designed for memory seam only, environment-gated performance tool and environment-gated restore test. Restore was executed separately as above; this does not erase the skip event. No zero-skips claim.

Tool versions: Go1.27.3, Node24.22.1, pnpm12.11.2, Python3.14.4, golangci-lint2.14.0; pinned cached sqlc1.31.1. No dependency upgrade/install or global agent/provider setting change.

## Independent review intake

`review/return.md` reports **PASS_SOURCE_REVIEW_WITH_LIMITATIONS** for its pinned BE/transfer/restore core. The non-author reviewer identified terminal-receipt retention, restore DSN targeting and Filing owner snapshot defects; corrections and regressions were made. Reviewer also reran pure/local targeted suites and checked owner runtime receipts.

The final report still contains the prior historical-owner limitation. Later reviewer messages checked the fail-closed legacy-owner correction, but the reviewer hit quota before refreshing the report. **Five pinned source/test paths differ** from `review/inputs.json`; exact paths are in `review-intake.json`. Later Matter scope UI and full visual/history/style design acceptance are outside that detailed core review. The retained verdict is accepted only for its pinned inputs, not promoted to blanket final-source approval.

## Remaining gates and exact next work

1. Refresh the independent review for the five final core pin changes, generic recovery-test synchronization and new Matter scope/header UI; bind it to `final-source-manifest.json`. Preserve the earlier review and append a separate final-delta return.
2. When the official approval mechanism is available, execute the same bounded restore rehearsal on fresh run/DB/object names for the final candidate. Do not reuse or overwrite retained attempts or route around the approval failure.
3. Perform permitted browser-backed UI/UX, keyboard/focus/touch/screen-reader and full product E2E checks against the actual FE/API/PG; initial locale support does not satisfy complete NFR-010. Five real manager trials for AC-137 cannot be simulated by source tests.
4. Finish human ZITADEL Cloud login, audience/token, A/B authorization/isolation, refresh/logout/currentness and failure-recovery validation. This continuation did not read the API key or make provider/admin changes.
5. Inventory legacy histories that lack proof/edge/owner provenance before release. Fail-closed Brief availability is intentional; no fabricated backfill or approved-policy waiver.

Local transfer retention expires with its BFF session/process and is not multi-process/production recovery. Local synthetic restore does not prove production recovery, IdP backup, Cloudflare compatibility, cost/$0, production security or release readiness. Historical INT-A formal cases/T11c UNKNOWN and MC-002/C01-PRODUCT gates are not self-closed by these product tests.

Skipped: browser/human/provider/private-key workflows, production/paid actions, external-agent dispatch and Git mutation. New synthetic restore DBs/object roots/evidence remain retained; existing DBs/containers/volumes are preserved. Main risk: final independent/rendered/IdP acceptance and final-byte restore remain open despite passing current-source BE/FE gates.
