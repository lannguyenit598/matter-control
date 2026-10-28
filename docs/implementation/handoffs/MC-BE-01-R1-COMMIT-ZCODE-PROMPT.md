# MC-BE-01-R1 — ZCode commit-only completion

I assign actual ZCode, the BE01 source owner, to complete only the permitted commit of the unchanged independently reviewed R1 correction. Human delivery activates this bounded completion; Codex has prepared, not dispatched, it. This does not authorize BE02, new source edits, product auth/policy, architecture approval, deployment or any security-tool bypass.

Governance root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` on `codex/unified-project-flow`.
Read root AGENTS.md, current-workflow.md, project-status.md for current ownership/status, MC-BE-01.md, docs/reviews/be01-r1-opencode-review.md and docs/testing/be01-r1-opencode-review/intake.json. Read applicable backend instructions. Record actual agent/tool/version/model/provider; use current configured session/quota only, no login/provider/model/settings change. You are not alone: preserve all concurrent edits.

Source worktree: `/private/tmp/mattercontrol-backend-be01`, branch `codex/mc-be-01`.
Expected HEAD: `136eae6ad403ae3ede797faf6a0d6179c3b95685`.
Reviewed uncommitted binary-patch SHA256: `33297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e`.
Reviewed per-file hashes: docs/testing/be01-r1-intake/source-manifest.json. Do not describe HEAD alone as corrected.

## Security gate first

OpenCode returned SOURCE/EVIDENCE PASS_WITH_LIMITATIONS and RESOLVED F01/F02/F03 for this exact snapshot. Makefile exception accepted; nullable purge_after/zero-age policy accepted only as bounded test seams. No new source rework or full test replay is requested.

The prior Mimosa refusal remains unresolved. The Codex-owned immutable provisioning evidence cited by the scanner uses `secrets.token_hex(32)` and serializes that runtime variable; Codex/OpenCode have recorded a narrow false-positive assessment. **That assessment is not scanner clearance.**

Use only the documented supported disposition/rescan interface available in the session that enforces the existing Mimosa gate. Record its exact status, scope/coverage and any allowed action. Do not edit hooks/settings/ignore lists/baselines/ledgers/reports or immutable provisioning evidence; do not install or switch tools, host, project context or command wrapper to evade the refusal. Do not forge a successful scan. If no permitted resolution mechanism exists, or it still refuses, stop and return BLOCKED with the exact error and required operator action. Do not keep trying equivalent commits.

## Only after ordinary gate permission

Recheck actual branch/HEAD, the complete live diff hash, per-file source hashes and Git index. A pre-existing staged change, extra dirty file, missing source, source drift or unrelated edit blocks this task: return the exact discrepancy, never reset/stash/overwrite/restore it. Stage only these nine reviewed paths:

- internal/core/domain/matter/access.go
- internal/core/service/matter_service.go
- internal/core/service/matter_service_rework_test.go
- internal/adapter/outbound/postgres/queries_mattercontrol/matter.sql
- internal/adapter/outbound/postgres/mcsqlc/matter.sql.go
- internal/adapter/outbound/postgres/matter_test.go
- internal/adapter/outbound/postgres/matter_rework_test.go
- internal/adapter/outbound/repotest/mattercontrol/contract.go
- internal/adapter/outbound/repotest/mattercontrol/memory.go

Use normal rtk-prefixed Git commands and existing configured Git identity. No `--no-verify`, force, hook suppression, fabricated approvals or new code. Verify staged diff matches the reviewed patch and no unrelated staged paths exist before committing. Prepared message `/private/tmp/mc-be01-evidence/r1/31-commit-message.txt` has SHA256 `25730724aad420e37dc8ac32279a2004ade2be6973626339b3c7daddd7716fe5`; verify it before use. Do not silently substitute a changed message. Honour any normal enforced checks; previous passing tests are not permission to bypass a required hook.

After commit, verify one parent equals136eae6, the136eae6→newHEAD binary diff is byte-identical to the reviewed patch, all39source/support file hashes still match the manifest, and the working tree/index are clean. If a hook modifies source, do not undo it or declare equivalence; stop and return the change for scoped reassessment. No push/merge/PR or other worktree/DB/container/process action.

## Return

Text return with actual identity, permitted gate evidence or remaining block, source branch/base/newHEAD, exact nine paths and patch/file equivalence, command UTC/exits, index/tree state and resource disposition unchanged. Record tests NOT_RERUN unless an ordinary enforced gate actually ran them; preserve any such evidence and skips honestly. No credential/env dump or legal data.

Propose IN_REVIEW pending Codex completion intake, not self-awarded DONE. If blocked, preserve the dirty reviewed tree and existing durable patch; do not reassign F01/F02/F03 or request a redundant OpenCode review. Stop after the return; include skipped checks and remaining risks.
