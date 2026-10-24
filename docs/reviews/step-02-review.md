# MC-002-QA — Architecture Review Disposition

Owner: Codex orchestration. Architect: actual Claude Code. Independent reviewer: actual OpenCode, round1 CHANGES_REQUIRED; [returned report + exact manifest](step-02-opencode-result.md). Five High and nine Medium numbered findings, no Critical reported. This is document-level review only; no source checkout, DDL/build/runtime/PoC/deploy proof.

Status: **REWORK_REQUIRED**. Send actual findings plus Codex preflight observations to Claude for targeted correction/adjudication. Do not let OpenCode recommendations amend approved business policy: RULE-003 VERIFIED-only proof gate remains authoritative; no NOT_REQUIRED-as-verified adoption. Open architecture interpretations remain explicitly gated.

Known review limitations: report counts31 inputs but actual30; “hash-verified” is not independent recomputation with all tools denied; exact transport manifests remain authoritative. The review's pure timing predicate analysis does not settle the boundary scheduler/future-validity questions. Assessments target one claim/subject per request unless explicitly multi-target; clarify CAS target rather than assuming every M:N relationship requires multi-subject writes.

All numbered findings F-01..14 await Claude disposition and appropriate re-review. Codex additionally asks about milestone recomputation intersection, latest assessment verdict, discriminator CHECK correctness, effective-owner protection on Workspace revoke, future validity boundaries, and provenance/table formatting. Original Claude and OpenCode output manifests/reports remain preserved; no fake corrected design or new PASS.

Architecture Approval Gate NOT_PASSED. Missing owner audits, unresolved hosting/frontend/identity/storage/workload/recovery choices and necessary PoCs remain gates even after document defects are resolved. Step03 not started.
