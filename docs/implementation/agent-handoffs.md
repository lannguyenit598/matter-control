# MC-002 — Agent Handoffs

Codex orchestrates; the named external owners retain engineering responsibility. Current authority: Step02.1/DEC-026, H5/W1/restore targets DEC-023..025; approved behavior572835a. No Step03/product/production/paid action.

| Assignment | Actual execution / current state | Next packet |
|---|---|---|
| Claude architecture | Actual authored/corrected15 files; independent document review PASS; no runtime certification | Existing architecture and exact final manifests; review any architecture-impacting owner finding before ADR edits |
| ZCode MC-002-BE | Host app valid; CLI0.17.0 synthetic task exits1 missing packaged provider config; no owner audit/build | [FULL manual prompt](handoffs/MC-002-ZCODE-PROMPT.md), PREPARED / WAITING_MANUAL_DISPATCH |
| Antigravity MC-002-FE | CLI1.4.7 supplied-source audit returned, requested Gemini3.8FlashHigh/efforthigh; runtime NOT_RUN; actual headless RunCommand auto-denied | [FULL manual prompt](handoffs/MC-002-ANTIGRAVITY-PROMPT.md), runtime PREPARED / WAITING_MANUAL_DISPATCH |
| OpenCode MC-002-VERIFY-021 | Actual review and final recheck PASS_WITH_LIMITATIONS,3Low closed, no replay | step-02-execution-report.md / step-02-poc-validation.md; actual returned report required |
| OpenDesign | NOT_STARTED | Step03 not authorized |

[Recovery and corrected provenance](../tooling/step-02-1-recovery.md) supersedes historical invalid-signature/reinstall conclusions. No global auth/provider/permission settings changed. Manual prompts specify exact pinned source/worktrees, ownership, input docs, commands, safety, acceptance, evidence and return reports. Preparing a packet is not execution. Do not confuse the actual frontend supplied-source audit with its still-pending runtime task.

Return task ID, actual tool/model/version, source/base/head/worktree/changed paths, every command UTC/exit/log, expected/actual assertions, failure/skips/risks, proposed status and artifact manifest. Independent OpenCode review follows exact owner returns. Codex may coordinate integration only after both isolated owner PoCs pass and a compatible authorized API/session seam is available. Template Task versus User and missing identity are unresolved; no invented mapping or auth bypass. Keep MC-002 open through Architecture Approval Gate.
