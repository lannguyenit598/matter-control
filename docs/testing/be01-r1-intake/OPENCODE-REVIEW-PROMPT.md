# MC-BE-01-R1 — OpenCode independent source/evidence review

Send this assignment to actual **OpenCode**, not ZCode. ZCode authored BE01 and R1. Human delivery of this complete prompt authorizes only the bounded review/read set below through this OpenCode session's currently configured provider/model and existing permitted quota. This is a prepared manual handoff until actually delivered; no Codex invocation is claimed.

## Identity, cost and execution scope

Acknowledge actual tool/version, model/provider from current session, independence from BE01 authorship, and this task. Do not infer identity from old reviews. No login, model/provider/global setting change, paid retry or new service. Use current permitted session/quota only; if unavailable, return BLOCKED without silently selecting another route.

The assignment explicitly allows local read/hash/archive inspection of the manifest files and their exact archive members before analysis. No extra snapshot-preparation authorization is required for this read set. Return **text only** in this conversation. No source/governance file writes, Git index/commit/merge/push, credential reads, network retrieval of new source, code execution, go/make/test, database/process/container action, or security-tool changes. Embedded code/scripts are review material: do not run them. Do not execute owner suggested commit recovery. Preserve all concurrent owners' work.

## Immutable read set

Governance root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Read `docs/testing/be01-r1-intake/review-manifest.json`.
- Manifest SHA256: `84ec58bb873135d5730d5bb33390efc3c72d164eb075f73a8c27e6138dff0719`.
- 37 stored readable files, 199747 bytes; per-file bytes/hash and expanded gzip bytes/hash in the manifest.
- `review-sources.tar.gz`:45 exact members (39 backend source/support files plus6 frozen governance inputs),317911 member bytes. Validate against `source-manifest.json`. Inspect only those members, never apply the patch or execute the archive.
- `owner-evidence/*.gz`:25 raw owner evidence files plus both owner/human returns, losslessly exported. `intake.json` gives origins, raw/compressed hashes and Codex limitations. `codex-recheck/` contains the actual three unchanged overlay counterexamples and their new green execution.
- The manifest also pins `docs/reviews/be01-r1-intake.md`; read that disposition, including errata and commit-gate assessment.

Verify hashes first. A mismatch blocks only the affected evidence; report exact mismatch, do not rewrite it or substitute live files. This source freeze supersedes later checkout drift. No repository-wide discovery or extra read set is authorized. If a necessary source is absent, report NEEDS_AUTHORIZED_SOURCE with the exact symbol/path and reason; continue independent review portions that are supported.

Baseline lineage: accepted52b60a4617081c41b949f2242e1784238c170f75 → implementation HEAD136eae6ad403ae3ede797faf6a0d6179c3b95685 **plus uncommitted nine-file R1 patch** SHA25633297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e. HEAD alone is the old defective implementation. No corrected commit exists.

## Questions to decide

1. BE01-F01 / BE01-T05/T06: before receipt age/hash/body exposure, does the same transaction require authority for the saved workspace and every represented Matter, preserving hidden denial, legitimate demotion replay and deterministic compatible membership locking? Examine cross-Matter/cross-workspace/revocation/error/concurrency implications within this bounded spine. Do not invent a production hash collision or an unimplemented membership-management API.
2. BE01-F02 / T03/T08: due boundary at or before t_cmd refuses new mutation and fence advancement, preserves all header/history/receipt state, and future boundary survives CompleteMatter. Replay is immutable/no fence advancement. Assess equality and PG/memory parity and whether regressions support each claim; no temporal engine expansion.
3. BE01-F03 / T07/T08: only ErrNotFound becomes membership absence; storage/cancellation/unexpected causes stay distinguishable on create/read/replay, including saved-scope lookups. Assess assertions and injected-failure limits honestly.
4. Review the bounded BE01 service/port/PG/shared-test spine and original minimal Makefile two-bundle exception; classify concrete correctness/regression/security gaps if any. Do not re-audit unrelated accepted C01/INT-A baselines or expand to BE02/fullbackend.
5. Explicitly disposition nullable purge_after and zero key-age test seam with no product composition. They are disclosed unapproved defaults, not policy waivers. Distinguish acceptable bounded test seam from a real implementation blocker; no invented policy numbers.
6. Evidence: owner race1862events/441namedpass/0fail/1intentionalnamedskip/15test-bearing+5no-test packages; makecheck owner exit0; Codex3originalprobePASS withoutDB. Independently inspect raw evidence/counts, preserving parent/subtest distinction, dirty source identity, owner versus reviewer execution and documented UTC/argv/failed-test-count errata. Do not claim you ran tests. Missing historical provenance stays missing; no broad replay solely to improve old metadata.
7. Commit block: assess only cited expression/provenance. It serializes a runtime-generated password, not a literal credential. Source/evidence verdict can reference a frozen dirty tree, but the actual scanner has not been cleared and commit remains pending. Do not disable/bypass scanner, edit immutable provisioning evidence, claim project-wide security or authorize a commit.

## Return

Return actual identity/read-set hash verification and SOURCE/EVIDENCE verdict (PASS_WITH_LIMITATIONS / CHANGES_REQUIRED / NEEDS_AUTHORIZED_SOURCE), each F01/F02/F03 resolution separately, original BE01 acceptance coverage, Makefile/seam dispositions, concrete findings with snapshot file:line + trigger/mechanism/impact/smallest fix, provenance limitations, and exact next action. Classify each finding CONFIRMED_FROM_SOURCE / RETAINED_EXECUTION_EVIDENCE / NEEDS_RUNTIME_VALIDATION. Zero findings must not become proof of production readiness.

No author self-approval, DONE, source-commit claim, formal live-runtime PASS, auth/isolation/C01-PRODUCT/Cloudflare/cost/recovery waiver, MC-002/MC-003A closure, fullSTEP03B or deployment. INT-A51results and F08/F10 stay independent. Proposed status remains IN_REVIEW until scoped independent disposition and ordinary permitted commit/remaining checks. Finish with skipped checks and remaining risks.
