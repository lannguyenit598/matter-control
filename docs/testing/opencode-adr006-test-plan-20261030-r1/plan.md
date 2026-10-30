# OpenCode — ADR-006 independent testing plan

Prepared by actual Local Codex, 2026-10-30. Status **READY_NOT_DISPATCHED**. This is a test assignment, not an execution result. All82 rows in `cases.csv` start NOT_RUN; no changes to the historical51 INT-A formal rows.

Target: independently verify the local synthetic pilot candidate and identify what still prevents scoped cloud activation. Reviewer: actual OpenCode, nonauthor of the reviewed source; author overlap must be disclosed per file/finding. OpenCode does not fix product source in this assignment.

## Execution order

| Stage | Work | Exit/output |
| --- | --- | --- |
| A — start now | Pin Codex evidence/current public source; create immutable isolated copy and own fixtures; run45 BOTH cases. Execute permitted browser cases when feasible. | Baseline return with actual tests/findings. Do not wait for Claude or test mixed live source. |
| B — final candidate | Consume Claude final return and source/artifact manifests; freeze a new snapshot; run24 FINAL cases plus impacted BOTH tests, complete final gates and integrated runtime. | Final candidate verdict, delta coverage and remaining blockers. If Claude has not returned, publish A and save B as PENDING_FINAL_RETURN. |
| C — browser | Seven BROWSER cases on the built application using approved browser tooling and synthetic data. | Rendered/interaction/a11y observations, separately from HTTP/unit proof. No browser permission bypass. |
| D — provider | Six PROVIDER cases after separate exact resource/action authorization and operator inputs. | Real provider evidence only; NOT_AUTHORIZED now, never counted as local PASS. |

Stages are work order, not repeated permission gates. Finish all independent work; do not stop after inventory/static review. Local final scope is69 cases (45 BOTH +24 FINAL), browser7, provider6. Availability and missing implementation must be explicit per case rather than silently dropping rows.

## Candidate boundaries

Repo `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`; preparation HEAD20feedbf plus dirty source. `input-pins.json` binds preparation artifacts, not all current source. Codex's40-path manifest is targeted; OpenCode must create its own complete public runtime/test/config snapshot manifest, including generated SQL and transitive code needed to build/test. It is not enough to compare HEAD or trust an author's totals.

Claude may continue implementation concurrently. Execute only the isolated immutable snapshot and newly owned resources; the shared checkout is read-only except the assigned QA output directory. Do not acquire authority over the live app/ports3000/8081, retained containers, Codex private fixture or Claude source files. An inactive process alone does not transfer ownership.

On snapshot input drift, list exact paths. Recopy affected public inputs once after a stable before/after pin check; if still moving, freeze only a demonstrated internally consistent candidate or mark affected cases NEEDS_INPUT_REFRESH. Continue unaffected frozen checks. Do not rebuild old hashes from guessed content or silently repin a passing verdict to new source.

## Test procedure contract

`cases.csv` defines each ID/group/phase/priority/scenario/procedure/expected result/evidence. Copy it to reviewer output and fill actual results there. Do not modify the prepared master or renumber IDs. Additional independent probes use `QA-NEW-001` onward and retain their source.

Every result needs command or UI action, tool/version, cwd, candidate/source hash, fixture identity, UTC start/end, exit/status, observed assertion and evidence link. Parse full Go JSON: test-level pass/fail/skip, package outcomes and compile failures separately. A0-fail count with exit1 is not PASS. For frontend capture exact file/test counts and every skip; do not demand historic totals after new tests land.

Per-case statuses: NOT_RUN, PASS, FAIL, BLOCKED_ENV, BLOCKED_INPUT, NOT_AUTHORIZED, NEEDS_INPUT_REFRESH. Separately tag evidence as INDEPENDENT_EXECUTION, INDEPENDENT_STATIC_CHECK or AUTHOR_EVIDENCE_CITED. A cited author run cannot satisfy an execution requirement. Missing final-only source in stage A is BLOCKED_INPUT/PENDING_FINAL_RETURN, not an invented regression. Present source-only findings without fabricated runtime reproduction.

## Required inputs and reuse

- Codex current return,40 source pins,91-payload output manifest and actual logs under `codex-adr006-remediation-20261030-r1/`; operating notes `ops/adr006/README.md`.
- ZCode implemented-system review R-01..09 is author-review evidence, not OpenCode independent acceptance. Preserve its history and account for later Codex fixes.
- Claude assignment `MC-CLAUDE-ADR006-FINISH-TO-DEPLOY-CANDIDATE-20261030-PROMPT.md`; final return expected under `docs/testing/claude-adr006-deploy-candidate-20261030-r1/`, or an explicitly returned alternate path. Discover actual output, never assume a future file exists or is complete.
- ADR-006, approved contracts/permission matrix, current rules and operator guide. Do not import stale Map-only/adapter-absent assumptions into new tests.

Reuse source test seams and the author's retained verification programs after inspecting their lifecycle/paths. Existing programs hardcode Codex repo/output/private fixture paths: **do not run them unchanged**. Adapt copies into the reviewer namespace with independent fixture inputs and outputs; retain adaptation diff. Add independent adversarial tests for trust boundaries, rather than only rerunning green owner suites.

## Stop and acceptance criteria

Continue through the matrix even when a test fails, except where the next action risks secrets, another owner's resources or invalid fixture identity. Failures go to the implementation owner as evidence; no product patch here. Network/permission failures receive exact recorded classification, not a workaround that bypasses controls.

Verdicts are separate: SOURCE_SECURITY, LOCAL_RUNTIME, DATABASE_PRIVILEGES, BROWSER_UX_ACCESSIBILITY, RECOVERY and CLOUD_ACTIVATION. Use PASS_WITH_LIMITATIONS, CHANGES_REQUIRED, INCOMPLETE or NOT_ASSESSED as justified. CLOUD_ACTIVATION can be READY_FOR_SCOPED_AUTHORIZATION only when local critical checks and independent acceptance are actually complete and the remaining provider operations are concrete; never DEPLOYED/production-ready/$0 from local tests.

Any P0/P1 confirmed defect, cross-tenant leak, unsafe secret handling, lost/duplicated acknowledged write or silently skipped required test makes the corresponding acceptance CHANGES_REQUIRED. P2/P3 findings have explicit impact/owner and disposition. Missing browser/provider scope remains visible, not waived. Independent testing does not authorize budget/residency choices or schema proposal0009.

## Deliverable and ownership

Reviewer output only: `docs/testing/opencode-adr006-independent-testing-20261030-r1/` (absence check; resume own checkpoint or use a unique attempt if occupied). Task record prepared separately. No writes to source, other evidence namespaces, canonical ledgers or plan files.

Minimum outputs: identity/input pins + snapshot manifest; filled case matrix; raw sanitized execution logs and command metadata; reproducible QA probes; finding list with expected/actual/source/repro/impact; stage-A and final/delta return as available; source drift, privacy and cleanup receipts; outputs manifest excluding itself. Allow a concise consolidated JSON instead of needless separate files, but keep every proof addressable.

Final handoff must name exact source/artifact candidate, count executed/pass/fail/blocked/not-run by phase, list findings and exact next owner action. No automatic dispatch to Claude, no product edits or self-awarded project DONE. Skipped: cloud mutation/real credentials/provider calls unless separately authorized. Risk: authoring continues; passing frozen bytes never accepts a newer untested live tree.

Preparation readback: `preparation-checks.json` records39/40 Codex baseline pins matching; `src/lib/mc/entry-route.test.ts` changed its config imports for App Hosting compatibility. Treat it as a new unreviewed delta, not corruption or permission to restore old source. Freeze/test actual stable source and separate baseline evidence from the final candidate. No product tests were executed during preparation.
