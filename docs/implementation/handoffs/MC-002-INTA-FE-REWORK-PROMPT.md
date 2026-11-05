# MC-002-INTA-FE-R1 — Antigravity manual rework prompt

You are the actual Antigravity frontend owner. Use Gemini 3.8 Flash with thinking HIGH as requested by the Product Owner; report actual identity/settings or an availability blocker, never silently substitute. Acknowledge task/tool/model, repo/branch/base, ownership, inputs, allowed paths and dependencies before edits. This prompt is READY / NOT_DISPATCHED until human delivery and your acknowledgement.

Governance root: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control
Read root AGENTS.md and /Users/nguyenvanlan/.codex/RTK.md. Prefix shell commands with rtk. Read these exact governance inputs:
- docs/ai-sdlc/project-status.md
- docs/ai-sdlc/inta-po-approval.md (DEC-028)
- docs/implementation/inta-approved-contract.md (frozen INTA-1)
- docs/implementation/tasks/MC-002-INT-A.md
- docs/implementation/inta-coordination.md
- docs/testing/integration-acceptance-matrix.md
- docs/testing/step-02-4-runtime-classification.md
- docs/reviews/inta-frontend-intake.md
- docs/reviews/inta-frontend-opencode-source-review.md
- docs/reviews/inta-frontend-return.md (immutable original; supersede claims in a new R1 return)

Authority: INT-D01=INT-A APPROVED, local synthetic transport only. Requirements NFR-001/002/003/008/009 as scoped by INTA-1; priority P0. Reviewer is actual OpenCode, independent of implementation. No full product implementation or self-awarded DONE. Claude is conditional on material architectural deviations, not required for these routine fixes.

Source ownership:
- Reuse your existing companion /tmp/mc002-inta-harness, expected clean HEAD e25bbc6933264fc46a729e6a364a3bfa02d8038f. Verify before edits. Create branch codex/mc-002-inta-harness-r1 from that exact commit only if absent; if existing, inspect provenance/status and stop on conflict. Never reset/overwrite dirty work or erase history.
- /tmp/mc002-inta-fe remains clean 3e5a642479acb789eb210e73fba956f3e85082e3; continue importing its actual unchanged src/lib/api/http-client.ts. No copy, product src/config/package/dependency/lockfile change or upgrade. Use already installed pinned dependencies.
- Go /tmp/mc002-inta-be remains clean 52b60a4617081c41b949f2242e1784238c170f75. No backend edits/build/runtime or DB operations by you in this R1 task.
- You are not alone in the workspace. Preserve others' changes, MC-003A, unrelated node_modules/.mimosa, original frontend exports/archive and other owners' evidence.
- Changes only in companion source/tests/config/driver/guard scripts and NEW R1 evidence/report. No changes to frozen contract, matrix, ledger, governance status, old reports/logs or global tool settings. No merge/push.

Resolve actual review findings INTA-FE-R01..R09; disposition R10 without unrelated refactoring:
1. Native schema/fixtures use created_at/updated_at. Add native-shaped success and camel-only rejection tests; retain native UUID/timestamp assertions in the driver.
2. Add the missing companion-local driver and executable phase/assertion plan for all 36 required logical IDs. Generate an alphanumeric 8–32 runId before any create; refuse existing owned evidence/assets collision. Retain request/substep envelopes and expected/actual/assertion results. Exactly one upstream attempt per intended substep, no retries or duplicate writes to obtain headers. Persist immutable checkpoints and stop on unexpected/unknown outcomes. Environment/log/cleanup IDs are procedures, not endpoint operations.
3. Make generated request IDs unique across process restart, dev reload and runId switching while preserving mc-int/runId/case binding, safe characters and <=128 limit. Use the smallest boot-discriminator/persisted-counter solution; test re-instantiation and switching.
4. Use contract outcomes value/apiError/abort, add unavailable classification separate from ApiError code; client success headers/status remain not observable. Wire evidence is separate. Record installed actual Next version and actual harness source revision/archive identity, not INTA-1 as a revision or a hardcoded version. Document abort reachability; do not add caller controls merely to exercise it.
5. Cap every retained body/error surface at 16384 encoded bytes, Unicode-safe; avoid duplicate/unbounded raw details. Flag any truncation and block full-body/schema/equality/persistence acceptance on truncated evidence. Test CJK/emoji/object/error-details cases.
6. Validate a fixed per-case required/forbidden lowercase UUID refId table before dispatch. Missing/extra/invalid control fields return bounded generic 400 and zero upstream; T5/T8 unchanged-A readbacks are mandatory. Test the entire endpoint allowlist with valid runIds.
7. Refuse production/product-auth environment at harness startup before listening, plus per-request fixed URL/opt-in checks. Audit actual template env key names and enumerate additional session/provider-secret names only, never values. Do not load product env files. Generic errors must not echo configured values. Consult installed Next CLI help/docs and Context7 per AGENTS for any selected library/CLI mechanism. No global settings or permission bypass.
8. Re-capture authoritative guard checks with one intended invalid dimension each, computed assertions, exact argv/UTC/exits, raw stdout/stderr and measured zero upstream. Use pure synthetic bounded doubles for unit/guard evidence only and label them clearly; they do not replace actual Next/Go/PG runtime cases. Keep any added guard observer local/owned; no new provider/API or production code. Stop only exact recorded owned PID/process groups, graceful bounded shutdown; never lsof-port/xargs-kill, killall or unknown-process cleanup. Port conflict means stop.
9. New R1 report corrects all 36 IDs including INT-ENV-05/06/07, case descriptions, 503-only expectations, request-ID/runId plan, actual installed versions, prior narrative/cleanup limitations. Use preparation evidence labels; do not mark full matrix rows PASS. Preserve originals.
10. Bound wire request duration with a fixed local timeout and explicit outcome evidence. Address/disposition remaining minor R10 items without dependency changes.

Driver sequencing must match INTA-1 exactly: guards/feasibility -> T1/T2/W1/W2 and fixed initial negatives -> immutable A checkpoint -> coordinated Go restart INT-PERS-01 -> same PG stop/start INT-PERS-02, before T9 -> T9/W9/T10 -> PG outage T11a/b/c/W11 with Go kept running -> same PG recovery without Go restart -> read-only INT-PERS-03/04 -> Go stop/T12 -> privacy/correlation/isolation/owned teardown -> independent conformance QA. T5=422 empty name; T8=409 duplicate email; T6-W=400 malformed JSON; T7-W=415 JSON bytes/no content type; W9=GET after update. T11c POST X always OUTCOME_UNKNOWN: never retry/re-POST/new-key/list/SQL lookup. No replay of create/update across checkpoints.

This R1 assignment authorizes preparation, focused harness-only checks and owned synthetic guard verification. It does NOT authorize starting Go, creating/using PG or executing the coordinated 36 cases yet. Driver must pause safely before any upstream action until Codex supplies verified new ENV/private DSN handoff and coordinated owner readiness. Codex owns PG lifecycle; ZCode owns Go lifecycle. Do not invent a DSN or use defaults/retained databases. Shared-client/native/full baseline reruns are unnecessary; run focused regression checks for these changes and actual relevant harness compile/guard checks only. Stop for inability to satisfy frozen scope; no fallback INT-A0/B/C.

Outputs:
- Commit companion changes on R1 branch, record exact base/head and complete changed-file list; immutable full source archive excluding runtime outputs/secrets, complete payload hash manifest (no self-hash cycle).
- New raw evidence /tmp/mc002-inta-evidence/frontend/r1/; reviewed exports docs/testing/inta-returns/frontend/r1/ only after redaction/integrity checks; never overwrite originals.
- New report docs/reviews/inta-frontend-r1-return.md: acknowledgement/identity, base/head, R01..R10 disposition with file/line and checks, actual argv/UTC/exit/stdout/stderr, test counts/skips and limits, driver phase plan/runId, audit key names, source/archive/export hashes, ownership/cleanup disposition, blockers and next dependency. Keep raw evidence distinguishable from narrative. No secret/real legal data in logs, prompts, archives or Git.
- Proposed status IN_REVIEW, awaiting OpenCode source re-review and later verified ENV/runtime QA. All 51 canonical rows remain NOT_RUN (36 required,14 deferred,1 blocked). MC-002 and C01-PRODUCT remain OPEN.

Skipped: no product/auth/isolation implementation, no Cloudflare/cost/full recovery validation, no paid service/production deployment or MC-003A change. Remaining risk: cross-root feasibility and all coordinated runtime assertions still require actual independent verification.
