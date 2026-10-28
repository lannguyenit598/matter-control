# BE01 — ZCode investigate original Mimosa integration and resolve exact finding

Task: MC-BE01-MIMOSA-ZCODE-INVESTIGATION-R1. Priority P0.
Status: READY_NOT_DISPATCHED. Human delivery assigns actual ZCode. Codex coordinates and intakes the return; the actual enforcing security mechanism retains authority.

## 1. Objective and confirmed context

Identify the original Mimosa integration/PreToolUse hook that blocked ZCode's BE01 commit, then resolve the exact finding through a documented, authorized, audited finding-scoped mechanism if available. Return a concrete maintainer action if unavailable. This is not another backend implementation, scan or commit task.

Confirmed historical facts:
- Actual ZCode invoked Mimosa MCP, producer mimosa0.1.0.
- Original scan: scan-2026-10-26T00-40-19.307Z-e324c2f15ce2.
- Finding: finding:f4bd71af4f1cfebcec9cb0a4.
- Occurrence: occurrence:457d6114dd662aa87811834e.
- ZCode's PreToolUse hook refused the commit before Git executed. This is not proof of a repository Git hook or that every other agent has the same gate.
- Current Codex Security completed-scan reader rejected this legacy ID with Invalid UUID at scanId. That only establishes reader incompatibility; migration necessity and current gate scope are unproven. Do not invent a UUID or submit the legacy ID repeatedly to unrelated readers.

## 2. Workspace and inputs

Governance root: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control
Branch: codex/unified-project-flow
Prepared HEAD: a62d838791ba188838c4ff00b7b6e265ac775056
Backend checkout: /private/tmp/mattercontrol-backend-be01
Backend branch/base: codex/mc-be-01 / 136eae6ad403ae3ede797faf6a0d6179c3b95685
Reviewed staged patch SHA256: 33297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e

Read applicable AGENTS/RTK and current assigned-task status. Semble first for exploration. Verify actual roots/HEAD/status; preserve concurrent work. A changed shared documentation HEAD is a revision observation, not permission to reset; verify the pinned task inputs and exact backend snapshot separately.

Read and hash-verify:
1. docs/testing/parallel-work-20261026/mimosa-operator-inputs.json and its six pinned inputs.
2. docs/testing/be01-r1-commit-intake/MIMOSA-FINDING-RESOLUTION.md
3. docs/testing/be01-r1-commit-intake/flagged-source-analysis.json
4. Retained owner-return.txt.gz and 32-commit-attempt-blocked.log.gz in that same intake directory, verifying decoded hashes against intake.json. Read sealed scan records from existing retained copies only as needed.
5. docs/testing/be01-mimosa-operator-return-20261026/disposition.md and evidence.json.

The allegation is hardcoded credential at provision-command.py:46. Existing counterevidence: line13 generates password via secrets.token_hex(32); line46 serializes the variable through an exclusive0600 private writer. Preserve this narrow evidence; do not turn it into a whole-file security PASS or rewrite historical evidence.

## 3. Acknowledge actual execution identity

Before work, return actual ZCode tool/version, current model/provider/session and understood scope. Use the existing permitted route only. If subscription/quota prevents execution, return BLOCKED_QUOTA; do not login, switch provider/model/account or activate paid services. App presence is not proof of a successful invocation.

## 4. Phase A — inspect the original enforcement route read-only

Use ZCode's currently exposed official Mimosa tools and their actual documentation. Identify:
- Integration/plugin/MCP name and version, the concrete documented tool names and supported schemas.
- Which PreToolUse hook produced the refusal, its owning configuration/integration and whether its enforcement scope is session-, project- or repository-level. Distinguish observed evidence from assumptions.
- Whether the hook reads a finding store, scan result or another gate record; identify only the documented nonsecret reference, not a guessed internal database.
- Supported read/adjudication mechanism for the exact original scan/finding/occurrence and any operator authority it requires.

Prefer integration metadata and docs. If needed, inspect only the specific hook configuration fields needed to identify its matcher, command, owning plugin and scope. Configuration files may contain secrets: parse locally and output only those nonsecret fields. Never dump an entire global configuration, environment, auth/provider section, command argument containing a credential, private backend.env/postgres.env or unrelated keychain/provider state. If bounded access cannot exclude secrets safely, record the missing metadata instead of broadening access.

No undocumented shell/API/database write, guessed CLI flag or speculative ID conversion. Read-only discovery is not permission to modify global settings or hook files.

## 5. Phase B — exact supported resolution, if available

If official documentation exposes an authenticated finding/occurrence-scoped false-positive adjudication or rule-correction workflow, verify its target and semantics before using it. Within this assignment, the human authorizes that exact audited disposition for finding f4bd71af… only, using the existing static counterevidence. Follow normal tool approvals. Record operation, authority, reason, scope, timestamp and returned receipt; then read back the actual resulting state through the documented interface.

This authorization does not cover editing a baseline/allowlist file, disabling a hook/rule, changing a severity just to clear a gate, modifying sealed artifacts, reclassifying unrelated findings or granting a broad exception. If the available mechanism requires any such action, STOP at a concrete proposal for the human/maintainer. Do not treat remediation workflow generated/applied/verified as false-positive adjudication without documented semantics.

If only new scans are available, return BLOCKED_NO_DISPOSITION_INTERFACE with the exact documented interface and maintainer change needed. No scan is assigned. If a supported scoped disposition requires another operator's authority or a product fix, record that dependency; do not contact anyone externally.

A successful finding disposition is not automatically full scan clearance. The original scan remains inconclusive/partial/verdictEffect none unless the authoritative system truthfully records otherwise. Report current normal commit permission as PERMITTED_WITH_RECEIPT, BLOCKED_WITH_RECEIPT or NOT_ESTABLISHED; do not test it by attempting a commit.

## 6. Preservation and prohibitions

Keep exactly the nine reviewed staged paths and patch intact. Read-only Git head/status/diff hashing is allowed. No stage/unstage/reset/stash/commit/merge/push, --no-verify, alternate agent/host/context commit route, source/evidence rewrite, scan retry, provisioning script execution, credentials, DB/HTTP/Docker/runtime or dependency operations. No edits to hooks/security ledgers/baselines/global agent settings. No BE02 implementation, R4 interference or MC-002/Step03B gate promotion.

## 7. Only new outputs

Verify this directory is absent before creation:
/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/be01-zcode-mimosa-investigation-r1/

Write only report.md and evidence.json there. If occupied, STOP/report; never overwrite an earlier return. Do not edit shared status files or earlier dossiers. Logs must be bounded/redacted; retain no private values, config dumps or action tokens. Refer to sensitive native receipts by nonsecret identifiers rather than exporting them wholesale.

Return:
- Actual identity, tool/version, root/base/head and input hash checks.
- Original enforcing integration/hook and proven scope, with exact nonsecret evidence.
- Documented resolution capability and authority available/missing.
- Every actual action/read and its UTC/exit/error/receipt; preparation is not execution.
- Exact finding disposition and separately verified commit-gate state, or a precise blocker and the minimum maintainer action.
- Backend HEAD, nine staged-path/patch preservation and source/index modifications = none.
- Proposed status: RESOLVED_FINDING_AWAITING_CODEX_INTAKE or BLOCKED with reason. Never BE01 DONE or full security PASS.

## 8. Stop after return

Even if a supported resolution succeeds, do not commit. Codex will intake the actual receipt, recheck snapshot and normal commit-only conditions under a separate assignment. End with work skipped and remaining risk.
