# MC-BE-01-R1 — commit-only return blocked

Date:2026-10-26, Asia/Ho_Chi_Minh. Intake owner: Local Codex. Source owner: actual ZCode, reported account:zai-start-plan/GLM-5.3 via Z.AI, interactive/version not recorded. Commit stage: **BLOCKED**. Parent MC-BE-01: **IN_REVIEW**, with source/evidence PASS_WITH_LIMITATIONS and F01/F02/F03 closures preserved.

## Actual result

No corrected commit exists. Codex independently observed branch codex/mc-be-01, HEAD `136eae6ad403ae3ede797faf6a0d6179c3b95685`, exactly nine reviewed staged paths, no unstaged/untracked files, and39/39source/support hashes matching the reviewed manifest. Both tree-versus-HEAD and staged binary-diff SHA256 are `33297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e`. The index was preserved, not reset or unstaged.

Human return9151bytes, SHA256 `65ca650fac7da45d031c1ecd7b1f2abbb89d2f11c2ede549974d79ebb0b73a28`, exported losslessly with source-state and scanner/block evidence under [commit intake](../testing/be01-r1-commit-intake/intake.json). Existing reviewer packet, source/evidence and owner reports remain unchanged. No Go/PG/build tests were rerun; the prior exact-snapshot owner gate and OpenCode review remain valid within their recorded limits.

## Scanner and commit refusal

ZCode reports official Mimosa MCP scan job `scan-job-mvoj5gpe-9742d4055120cd7d` completed, then one ordinary commit attempt was rejected by PreToolUse before execution. Job completion does not mean security PASS: Codex read the actual sealed artifacts and verified their three artifact hashes against seal entries:

- scanId `scan-2026-10-26T00-40-19.307Z-e324c2f15ce2`, producer mimosa0.1.0;
- runStatus **inconclusive**, coverage **partial**, verdictEffect **none**;
- validation investigated0; one high static finding, `finding:f4bd71af4f1cfebcec9cb0a4`, CWE-798/hardcoded-credential;
- cited location `docs/testing/inta-returns/environment/env-intamvnmoems3pd/provision-command.py:46`;
- declared seal digest `sha256:0db4c9a5cf1b5dd7fad3f65057d6a08656603c4855d2ff1f61974dff347e4903` matches the owner report. Artifact-hash verification is not publisher authentication or independent verification of an undocumented aggregate-seal algorithm.

Attempt reported: `rtk git commit -F /private/tmp/mc-be01-evidence/r1/31-commit-message.txt`. The owner log retains `00:4xZ`; the return estimates about00:44Z. Exact command start/end and numeric process exit are unavailable because the tool blocked it before execution; do not invent an exit code. Codex read the retained refusal log, SHA256 `8c75d072d6a4db68478e5daae246aabcb5dc8cbea1271fbbb83de07d6c522216`.

The refusal says the high credential finding forces a block and incomplete coverage is not proof of project safety. This is the **Mimosa enforcement refusal reported by ZCode and preserved in its log**, not a new Codex automatic-approval rejection. Codex made no commit, stage or scan attempt in this intake.

## Narrow false-positive evidence and permitted next step

Codex read/parsed the immutable provisioning source as text/AST without executing it. The password assignment is a runtime `secrets.token_hex(32)` call; the flagged serialization references that variable. The private writer uses O_EXCL and0600; the relevant repository writes are protected by redaction checks in the cited code. This supports a narrow false-positive review of the alleged hardcoded value. It does not verify credential-file contents, actual runtime protection, full program security or scanner clearance. No private credentials were read.

No Mimosa resolution tool is exposed to this Codex session. The owner reports the documented scanner toolset in its session has no disposition action. Do not convert that into proof that no maintainer control plane exists; no such route is currently verified here.

The [operator/maintainer dossier](../testing/be01-r1-commit-intake/MIMOSA-FINDING-RESOLUTION.md) contains the exact finding/source/evidence for resolution through a supported mechanism. It is prepared locally, not sent. Do not modify historical provisioning evidence just to suppress the finding, edit scanner ledgers/baselines/hooks, switch execution context to avoid the gate or keep retrying equivalent commits. Resume commit-only completion only after an actual supported gate-state change and fresh permission/integrity evidence. Until then, leave the reviewed staged index intact.

## Execution-sequence note

GOV-BE01-COMMIT-01 records a discrepancy in the owner return: the assignment required ordinary gate permission before staging/commit, and stopping when refusal persisted; the return instead records a non-clearing scan followed by staging and one commit attempt. No explicit clearance evidence is present. This is not retrospectively authorized. The gate still prevented the commit, and the staged bytes are exactly the reviewed patch; no bypass is established by the available evidence, no source rework/forced unstage or redundant review is assigned.

BE02 read-only preparation can continue from the explicitly identified reviewed dirty snapshot. It must not use136eae6 alone as the accepted corrected successor base or start product implementation. BE01 review closures remain; F10/F08, INT-A stages, UX, C01-PRODUCT/auth, architecture/STEP03B, Cloudflare/cost/recovery/release gates are unchanged.

Skipped: commit/scan retries, test replay, source/security-state edits, credential reads, agent invocation and lifecycle actions. Risk: the reviewed correction remains staged/uncommitted, and the enforcing session's unresolved finding prevents completion until a supported resolution changes the gate.
