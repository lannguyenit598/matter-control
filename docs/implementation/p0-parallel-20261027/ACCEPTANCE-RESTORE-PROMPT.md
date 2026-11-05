# MC-P0-ACCEPTANCE-RESTORE-PREP — Local Codex, executable-test planning

Owner actual Local Codex subagent `acceptance_restore`; priority P0. Read shared README completely. Use frozen requirements/source, preserve all other writers and write only your new assigned output directory. This task prepares exact test inputs/expectations; it does **not** execute any test/backup/restore/resource command or close any case.

Goal: prepare one acceptance/restore packet that ZCode and the later nonauthor QA can execute after W6 is ready, using existing canonical IDs and observed source paths. Cover all 63 AC, 14 NFR and original three Golden Workflows. Prefer existing tests/fixtures/commands when verified from source; don't build a new framework or invent test paths.

Read frozen `docs/requirements/{acceptance-criteria.md,golden-workflow-acceptance.md,business-rules.md,state-semantics.md,permission-matrix.md}` and NFR/SRS actual files, plus current contract/return/operations/config/migrations/object-store/test composition. Review current restore/load/local scope; numeric values are trial inputs, never production commitments.

Produce only new `docs/testing/p0-parallel-20261027/acceptance-restore/` after absence check:

1. `acceptance-matrix.json`: actual 63 canonical AC and 14 NFR IDs, each with requirement/source, meaningful expected behavior/negative variant, needed evidence tier, dependencies and known test candidates (actual existing path or explicitly PLANNED). Every planned execution is NOT_RUN. Retain original ids and don't infer pass from author summaries. Include original GW ids/checkpoint linkage.
2. `golden-workflow-checklist.md`: original GW-01..03/AC-161..163 stages and negative/alternative/reopen/recovery paths, actors/current permissions, before/after independent axes, exact version/epoch/evidence, history/Grid/Control Room/delta/export readback. Separate browser-only and nonbrowser-observable parts. No synthetic human-study pass.
3. `restore-plan.md`: isolated fresh-target rehearsal for complete synthetic product DB + object bytes + relationships/history. Include source/target ownership preflight, data-integrity census/hashes, backup consistency boundary, secret handling, planned commands only when supported by current operations source, destination collision/no-overwrite protections, restore comparison and readback/restart checks, timing/RPO/RTO measurement definitions and retained-resource disposition. Do not target the live run DB, use native migrations on product data, recommend broad delete/prune or turn object directory copying into full restore proof. Explicit unknown credentials/tool versions are operator inputs, not fabricated supported commands.
4. `return.md`: scope, structural counts/checks done on produced JSON only, selected frozen pins, missing inputs and exact execution prerequisites; status PREPARED_NOT_EXECUTED. Any helper is unnecessary unless needed to validate generated JSON; do not create a test framework.

Focus particularly on bulk UNKNOWN recovery (CAS is not a receipt), import source/row/content idempotency and connected-group atomicity, true `(t1,t2]` vs outstanding-at-t2 brief, revoked rights, whole-product recovery and real 5-manager AC-137. Missing browser/IdP/admin/production budgets remain dependencies; don't waive cases or block unrelated plan preparation.

End with skipped work and remaining risk. Return to parent through collaboration only. No provider payload, agent messaging, actual app/runtime/private/resource inspection, code/test/source execution, source edits or acceptance promotion.
