# MC-BE-01-R1 — corrected return intake

Date: 2026-10-26 (Asia/Ho_Chi_Minh). Owner: actual ZCode; intake: Local Codex. Priority: P0. Requirement linkage: FR-001/008/018/020 and BE01-T03/05/06/07/08/09/10. Proposed status: **IN_REVIEW**. Independent OpenCode review: **READY_NOT_DISPATCHED**. No DONE or architecture/release acceptance.

## Exact deliverable

Backend `/private/tmp/mattercontrol-backend-be01`, branch `codex/mc-be-01`, accepted base `52b60a4617081c41b949f2242e1784238c170f75`; HEAD remains `136eae6ad403ae3ede797faf6a0d6179c3b95685`. The correction is an uncommitted nine-file diff, +929/-15, whose binary-patch SHA256 is `33297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e`. Live diff matches owner `30-rework.patch` byte-for-byte. Do not describe HEAD136eae6 alone as the corrected revision.

Changed paths: domain `matter/access.go`; service `matter_service.go` and new `matter_service_rework_test.go`; PostgreSQL `queries_mattercontrol/matter.sql`, regenerated `mcsqlc/matter.sql.go`, `matter_test.go` and new `matter_rework_test.go`; shared repotest `mattercontrol/contract.go` and `memory.go`. All nine lie within the assigned rework scope. Native C01 and INT-A checkouts were rechecked clean at52b60a4; no source modification or runtime replay there.

## Focused disposition

| Finding | Source correction verified by Codex | Independent original counterexample |
|---|---|---|
| BE01-F01 | Saved workspace and sorted represented-Matter read authority checked in the transaction before age/hash/body; hidden denial and storage errors remain distinct | PASS: revoked A + authorized B + reused key returns uniform NotFound |
| BE01-F02 | Due boundary (`<=t_cmd`) refuses new mutation; CompleteMatter SQL preserves a future boundary; replay leaves pending work intact | PASS: elapsed boundary refuses and CompleteMatter is not called |
| BE01-F03 | Only ErrNotFound becomes absent membership; wrapped failures propagate from create/read/replay helpers | PASS: workspace membership unavailable remains ErrUnavailable |

These are **CORRECTED / FOCUSED_RECHECK_PASS / PENDING_INDEPENDENT_REVIEW**, not formally CLOSED. Source review also inspected the new shared and PG row-integrity tests. Exact equality, additional represented-Matter/concurrency/error branches and complete scope acceptance remain for the independent reviewer; three service probes alone do not prove all combinations.

## Actual evidence and limits

- Codex executed the original unchanged three overlay probes against the current dirty tree: exit0, three named passes, no failures/skips; DB variables removed, module network lookup disabled. Patch hashes before/after identical. Raw command/UTC/stdout/stderr and probe source are in [codex-recheck](../testing/be01-r1-intake/codex-recheck/probe-execution.json). This is independent focused service-double execution, not PostgreSQL or formal OpenCode QA.
- All23 entries in owner `50-hashes.txt` match retained originals. Current owner directory has25 files: inventory excludes itself and `49-redaction-scan.txt`. All25 plus both human/owner returns exported losslessly as gzip; every decompressed payload was compared with its origin.
- Owner make-check output/metadata reports exit0, 2026-10-25T18:26:15–18:26:36Z, lint0 issues,15 passing packages/5 no-test packages. Recorded makecheck uses placeholders and the wording `rtk-less`; exact shell argv is not independently available. Do not claim complete command-level provenance or rewrite historical logs.
- Independently parsed owner race JSON:1862 valid events,441 named passes/0fail/1 intentional named skip (`pgtest TestFreshSchemaDSNFrom_SkipsWithoutEnv/skip`),15 test-bearing packages/5 no-test packages. Parent/subtest passes included. Raw events span18:26:49.886557–18:27:05.153434Z; the summary's18:26:56 start is an erratum. This run's metadata correctly begins18:26:49.
- Failing-before logs are preserved with the inert domain sentinel present, not a pristine136eae6 replay. Service/memory/PG logs contain10/14/15 named FAIL entries respectively, including failed parents; terminal failed names count9/9/10. Owner's10/10/12 shorthand is not adopted as a validated leaf count. PG metadata lacks explicit start/argv. No history is fabricated and no reassurance replay was run.
- Owner inventory still anticipates a commit that never occurred; owner PG-test line count208 differs from the actual170 lines. These are recorded documentary errata, not new source defects. No owner correction loop is necessary solely for these notes.
- Known private DSN/password values were checked in memory against source/input/owner payloads before export:0matches; credentials were not copied or printed. Owner scan alone is not treated as conclusive secret proof. No DB access or process/container lifecycle by Codex; retained-running fixtures are owner-reported this turn.

## Commit gate disposition

ZCode reports Mimosa denied the commit and leaves the tree recoverable. Codex read the exact flagged immutable provisioning evidence: line13 generates `password` using `secrets.token_hex(32)` and line46 serializes that runtime variable to a private file. The cited expression contains no hardcoded credential value. This supports a narrow false-positive assessment of that expression; it does not certify project-wide security or override incomplete scanner coverage.

No hook/config/ignore/baseline/scan state was changed, no script was replayed, and no alternate commit route was attempted. Both backend and this governance intake remain uncommitted pending an ordinary permitted gate outcome. The next agent may report/triage the finding through the scanner's documented mechanism; do not disable or bypass it. Review may proceed against the immutable snapshot while commit remains blocked.

## Review handoff and remaining gates

[OpenCode prompt](../testing/be01-r1-intake/OPENCODE-REVIEW-PROMPT.md) supplies an exact manifest and read-only source/evidence review assignment. Human delivery activates only that bounded review on the actual configured OpenCode route/current permitted quota. Codex has not invoked OpenCode, sent this new BE01 payload or changed its model/provider. No new external permission is inferred from F10/C01 approvals.

The archive contains39 backend source/support files and6 frozen governance inputs; it includes the whole bounded BE01 spine so the reviewer can examine the original Makefile addition and disclosed seams as well as R1 fixes. `source-manifest.json` pins every member. `review-manifest.json` pins the complete readable packet, with bytes/hashes. Snapshots remain the review baseline if live checkouts later drift.

Nullable `purge_after`, zero key-age test seam and Makefile exception still require explicit reviewer disposition; they are not approved production defaults. BE02/HTTP/product-auth/provider/isolation/C01-PRODUCT, frozen INT-A's51 formal results, F08/F10, MC-002/MC-003A/STEP03B, Cloudflare/cost/full recovery/PO architecture/release gates remain unchanged.

Next: deliver the OpenCode prompt for a non-author source/evidence verdict with per-finding resolutions; resolve commit gate through normal controls before creating a source commit. Do not restart ZCode implementation or wait for unrelated F10/INT-A outputs.

Skipped: full gate replay, DB/runtime operations, source edits, external dispatch and commits. Risk: independent review and a permitted source commit remain outstanding; snapshot acceptance is not production readiness.
