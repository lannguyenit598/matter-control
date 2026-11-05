# Coverage and recovery intake — frozen bytes only

Task `MC-P0-CODEX-PARALLEL-20261028/COVERAGE-RECOVERY`; priority P0; actual author **Local Codex internal subagent** `p0_coverage_recovery_20261028`. Status **IN_REVIEW / PREPARED_NOT_EXECUTED**. Reviewer: later independent nonauthor, not invoked here. Parent authorization limits this task to read/hash/static preparation and these three owned outputs. Claude remains the live product writer.

Manifest-supplied root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, base/head `a62d838791ba188838c4ff00b7b6e265ac775056`; no Git command run. Reviewed snapshot `/private/tmp/mc-p0-codex-parallel-20261028-h9mtoxwx`, captured `2026-10-28T03:10:38.929789+00:00`. Manifest SHA-256 `39fc4961995958e850d9261c77db7514c983bd0c9b22dab8b68f6d9d6b2ad841`: actual JSON 535 entries. Selected input bytes/hashes match that manifest; exact pins and observed counts are in `inputs.json`. Semble search succeeded before source discovery; no fallback. No live source/private files/raw runtime logs read.

## Outcome and coverage

Canonical scope stays **20 FR / 63 AC / 14 NFR / 3 original GW**. SRS FR headings span `docs/requirements/srs.md:15–376`; NFR rows `:401–414`. AC-101..160 are the 60 headings of `docs/requirements/acceptance-criteria.md:7–550`; AC-161..163 are at `docs/requirements/golden-workflow-acceptance.md:58–68`. The prepared acceptance matrix contains exactly 77 AC/NFR rows (63+14), plus three GW records. No ID, business rule or settled PO decision changes are proposed.

| Frozen workboard field | Actual count | Interpretation |
|---|---:|---|
| FR implementation | 14 author-tested / 6 NOT_STARTED | Stale source coverage; not a completion percentage |
| AC results | 21 author service-level labels / 42 NOT_RUN | No UI/E2E or independent acceptance implied |
| NFR | 14 NOT_RUN | Includes security/performance/accessibility/recovery evidence still needed |
| GW | 3 NOT_RUN, empty ledgers | Correctly remains unclosed despite W7 title |
| Independent FR review | 20 PENDING_FINAL_BATCH | No final independent acceptance |

The six stale FR backend/API/FE rows are **FR-008/012/013/014/018/019** (workboard row starts `:458/:613/:639/:666/:823/:855`). Source may exist without complete verification. Historical matrix pins reconcile **30 matching / 9 changed / 2 outside this selected snapshot**; the two uninspected paths are `apps/frontend/playwright.config.ts` and `ops/p0-local/docker-compose.yml`, not proven deleted. See `inputs.json` for exact changed paths. Reuse canonical expectations; rebind execution/candidate pins.

## W7 does not close original workflows

`apps/backend/internal/core/service/gw_ledger_test.go:29` creates only a memory-backed work/matter/workspace service SUT. There are three named tests and ten checkpoint calls; one checkpoint is vacuous. No complete persisted 24-stage (8+7+9) workflow ledger appears here.

- GW-01 `:101–144` checks signature completion/unverified, a PROOF blocker and one nonempty history payload. Approval/payment are merely created and discarded (`:142–143`); no document authority, transfer, actual closing progression, filing or post-closing sequence.
- GW-02 `:149–189` checks an owned external WAITING Action, READY dependency, and an unverified Requirement. No document→review→gap→finding→supplement→independent resolution path.
- GW-03 `:195–219` creates a generic Action, completes it, and checks unverified. No FilingService/cycles/receipts/approval are exercised; `stageEvents >= 0` at `:218` always passes. History read errors are also discarded at `:87`.
- Useful existing source: `contract_w4.go:150–279` genuinely defines nine-stage filing progression, version-pinned submissions, two supplement cycles and owner reopening. Five W4 scenarios start at `:107/:150/:281/:337/:388`, called by memory `contract_memory_test.go:66` and PG `postgres/matter_test.go:356`. Reuse this seam, update assertions/fixtures for current signature guards, and add missing cross-view checkpoint evidence. This is source reach, not a test PASS.

**Superseded review claim:** `docs/reviews/p0-zcode-progress-check-20261028.md:29` said no W6 PG references were found. The frozen snapshot now has `contract_w6.go:101` with **13 shared scenarios**, memory entrypoint `contract_memory_test.go:105`, PG entrypoint `postgres/matter_test.go:649`. Scenarios include new-row graph resolution, group rollback, replay/conflict, lost acknowledgement, concurrency, revocation, and temporal execution/proof/import replay. Implementation/test presence is confirmed; current author-run logs were not supplied in this selected review and were not opened. Execution remains unverified here; do not repeat “no W6 PG tests.”

## Restore proof is a sample, not whole-product recovery

Author narrative `final-return.md:33` and workboard `:2404–2411` report migrations 0001–0006, a one-transaction **2 users / 1 workspace / 1 matter / 1 requirement / 1 event / 1 receipt** seed, dump→fresh target comparison, and a matching synthetic object probe. These are author-reported partial receipts; raw dump/log/credential paths were not accessed. It is not proof that the archive/probe were linked to committed document versions or that actual complete relationships were recovered.

Prepared `restore-plan.md:23–40` requires a representative GW dataset and a 32-table V9 census, lineage/constraints/row hashes plus every DB-referenced object. Frozen source now declares **33 product tables in seven migration files**: `.../migrations_mattercontrol/0006_dataops.sql:6` adds `import_sources`; `0007_filing_signature_applicability.sql:5–8` adds four filing fields. Candidate census must include populated import/receipt provenance and applicability state. Presence of an empty `import_sources` table proves no import restoration. No schema mutation is authorized by this report.

Still unproven: representative two-matter/role/proof/filing dataset; consistent DB+object boundary; full stable row/hash/constraint census; real version-object links; corrupt/truncated archive, missing object and mismatched hash rejection; scoped API/export/bytes/revoked-user readback; replay/no-duplication and restart; pre/post-boundary data-loss inventory; complete phase timings. Object-store corruption/scope tests already exist at `objectstore/store_test.go:69/:95`, and checksum validation occurs at EOF in `objectstore/store.go:127–132`; reuse them but add archive/recovered-reference checks. Object adapter tests alone cannot establish whole-product restore.

`restore-plan.md:42–59` specifies consistency/fresh-target/API/restart proof; `:69–77` specifies incident-to-usable recovery timing and actual acknowledged loss. The narrative's five-minute timestamp window is neither measured recovery duration nor approved RTO/RPO. AC-155 `acceptance-criteria.md:505–512` and NFR-014 `srs.md:414` remain open. Numeric policy/budget decisions remain the existing release gates, not re-requested approvals for approved scope.

## Stale fields to reconcile after Claude's stable checkpoint

Do not edit owner records from this intake. Workboard top status already records the ZCode→Claude stop; `owner` at `:4` still names ZCode, while historical `execution_owner/current_source_checkpoint` coexist with later transitions. Bind the final active owner, source manifest, input contract and author receipts explicitly. `local_contract` at `:1849–1853` remains revision 9/hash `06b4…`; actual file is revision 10/SHA-256 `14fb18e302ffe2d71bfbfcbfbc50bf932d0e58e74abb9cbcab824503b2b5eb66`, whose own footer `:220` still says revision 9. W7 `remaining_w7:2399` says restore not done while `restore_receipt:2404` reports the sample run; distinguish sample complete from whole-product open. `final_label:2414` precedes unfinished postrun changes `:2415+`; older final-return sections are historical, not current candidate proof.

Cloud public bundle `cloud-inputs.json:5–39` separates USER_REPORTED setup, public discovery, candidate audience, unverified subjects and unchanged runtime. Successful unauthenticated discovery receipt `discovery-check-curl.json:13–24` establishes only discovery; earlier DNS/CA failures remain separate receipts. It does not establish private key/client linkage, effective callback/refresh, real user audience, explicit product identity mapping, current permissions, login or UI→API→PG. Local redirect failures cannot automatically be attributed to the supplied Cloud client.

## Delivery and acceptance of this preparation

Outputs only: `return.md`, `execution-checklist.md`, `inputs.json` in this directory. Static preparation criteria: canonical counts reconciled; relevant input hash pins match; stale fields identified without owner edits; workflow/restore proof gaps and feasible next steps documented. All runtime acceptance results remain NOT_RUN. Proposed next status **IN_REVIEW**, then implementation-owner consumption and later independent review; no DONE promotion.

Skipped: source edits, tests/builds, DB/Docker/process/restore/provider/network/browser/secret/raw-runtime/Git actions. Risk: selected frozen source and author summaries cannot establish the evolving candidate's behavior, human comprehension, whole-product recovery or release readiness.
