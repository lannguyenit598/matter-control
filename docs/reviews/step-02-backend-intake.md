# MC-002-BE — ZCode Backend Return Intake

Codex PM/DevOps collector,2026-10-24; base9d317c3b7b71b51eb856dd559b27e77c48b8f67a, branch task/MC-002-solution-architecture. Actual runtime owner is ZCode, per user return and artifact provenance; GLM5.3Flash/model/session identity is owner-reported, not independently attested here. No backend test/build/DB restart or source change was executed by Codex.

## Direct evidence and preservation

Original source and worktree are clean, correct origins and source d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b; branch task/MC-002-be-poc. Existing binary42186050bytes matches owner SHA256ff973fb7883c16898e5cfef6bb4e80df0252abc17ff5235c52fdc7ebabd9ad03. Read-only host inspection confirms the exact retained app image ID, PostgreSQL container exited0, loopback15455 binding and anonymous volume; no listener on18091/15455. No resource was started/deleted or pruned.

[User return](../testing/step-02-backend-intake/zcode-return.txt), [intake checks](../testing/step-02-backend-intake/checks.json), [host state](../testing/step-02-backend-intake/host-state.json), [durable export manifest](../testing/step-02-backend-poc/manifest.json). There are20 logs plus2 PID records. One original shell-trace line contained an actual per-run disposable DB password, contradicting the owner blanket redaction claim. Codex did not include that value in its review packets or Git; the original ZCode session transport was not audited. Codex recorded the original artifact hash, sanitized the export and original exact task log with a concurrency hash guard, retaining all nonsecret evidence. Source/stored/post-redaction hashes make the change explicit. No credential/global setting was changed. The private container retains its normal configured credential; do not reuse it for future fixtures.

## Actual reviews

Actual OpenCode2.1.4 / opencode/glm-5.3-flash-free, session ses_e917e3944ffe6y18sR8sJysMln, exit0: **PASS_WITH_LIMITATIONS for native template characterization**, with2 affected acceptance lines requiring owner rechecks. [Verbatim QA](step-02-backend-opencode-result.md), [execution](../testing/step-02-backend-intake/opencode-execution.json). Review used only supplied sanitized snapshots, no runtime replay or hash recomputation. Initial packet predates the later in-place local-log sanitization; the statement that the original still holds a password is historical, now superseded by the redaction follow-up record.

Actual Claude Code / claude-opus-5-5, session d4633b32-7d45-4576-bd6b-22c73c716cc1, exit0/success: **C01 confirmed, unchanged-contract implementation obligation; no normative ADR change needed**. [Architect return](step-02-backend-claude-disposition.md), [execution](../testing/step-02-backend-intake/claude-execution.json). Earlier owner wording “escalated” did not itself prove architect execution; this is the actual returned review.

## Acceptance and disposition

| Finding / criterion | Current evidence and disposition |
|---|---|
| Dependency/build/image/native runtime | Recorded command exits, binary hash, Docker identities and HTTP exchanges support template characterization; app image ID is not a published release digest |
| Migrations | Six migrations1..6 applied, Goose rows0..6; one retained no-op rerun. Unretained third-run claim removed |
| CAS/persistence/recovery/probes | HTTP201/read/list,404/422/409,200→version2/stale412, readback after restart, DB-down health200/ready503/data500 and recovery supported; sample clean error body is not universal leakage proof |
| R01 Medium | Both race-suite package runs exit0,11 ok packages+5 no-test packages. Nonverbose output does not enumerate per-test skips. ZCode must return bounded JSON/verbose rerun against a fresh verified disposable DB; NOT_RUN by Codex |
| R02 Medium | Three invalid-config exit1 markers exist, but argv/stderr messages not retained. Exact messages remain owner assertions; ZCode must return paired captures. Pending-migration guard is separately evidenced |
| M01..M05 | Package count, no-op run count, original-secret wording, unlabeled raw62 semantics and initial-healthy versus stopped-health snapshots corrected/qualified. Actual independent correction recheck verified M01..M05 (documentary only), without closing R01/R02 |
| C01 High against future product conformance | Template generic500/about:blank lacks approved503 unavailable+retryAfter. Future outbound classification must expose a core/port outcome, keep pgx types out of inbound, retain500 for unexpected faults and preserve unknown-commit/idempotency/current-auth. No fix or product conformance PASS is claimed |

Claude's detailed remediation/case list is advisory and all its new acceptance tests are NOT_RUN. Optional retryAfter units/header clarifications are not adopted here. Its shorthand “only deadline yields503/everything else500” omits Echo HTTPError status mapping visible in source; read it as the examined core-error branch, not an exhaustive theorem. Its diagnostic-log commentary concerns only these synthetic samples and does not approve a general logging policy. No normative architecture/product file changes.

## Next state

MC-002-BE: **TEMPLATE_CHARACTERIZATION_PASS_WITH_LIMITATIONS / EVIDENCE_REWORK_REQUIRED_R01_R02**. This is not full PoC acceptance or MC-002 DONE. [Complete focused ZCode handoff](../implementation/handoffs/MC-002-ZCODE-RECHECK-PROMPT.md) is PREPARED / WAITING_MANUAL_DISPATCH. Codex preserves ownership rather than running the backend rechecks itself. Future503 implementation and any compatible frontend/backend contract/auth scaffold remain separate work; no automatic integration, Step03, cloud deployment or paid activation.

Skipped: backend runtime replay, per-test rerun, invalid-config rerun, container runtime execution, MatterControl transaction/object/full-recovery harness and Cloudflare/cost verification. Risks: R01/R02 evidence gaps and C01 product-conformance obligation remain open.


Final actual OpenCode documentary recheck: session ses_e9176fa1dffedPMAvkCsrMBY3K, opencode/glm-5.3-flash-free, exit0/outcome succeeded. [Verbatim return](step-02-backend-opencode-recheck.md), [execution](../testing/step-02-backend-intake/opencode-recheck-execution.json). M01..M05 verified; actual Claude disposition correctly bounded. R01/R02 remain OPEN / NOT_RUN / REWORK_REQUIRED; characterization verdict is not upgraded to full acceptance. A nonblocking Echo-status wording nit is qualified above; no source change or test rerun.

## Superseding final R01/R02 evidence closure

This file records the initial intake/correction checkpoints. Actual ZCode focused recheck has now returned and actual OpenCode session ses_e91610e71ffeC42yXslkK7ke8v returned PASS_WITH_LIMITATIONS: R01 PASS/CLOSED, R02 PASS/CLOSED. [Current closure](step-02-backend-r01-r02-closure.md). Earlier EVIDENCE_REWORK_REQUIRED/manual-waiting/open labels here are historical, not current. The recheck raw artifacts retain their hashes;205 named pass/0fail/0namedskip and4 exit1 command/error pairs are now supported. C01 remains an unchanged-contract future implementation obligation; no product/integration/production/cost gate closed.
