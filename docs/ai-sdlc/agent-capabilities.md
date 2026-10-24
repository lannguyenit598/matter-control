# Verified Agent Capability Matrix

Observed 2026-10-24, Asia/Ho_Chi_Minh, in this Codex task's restricted filesystem/network environment. These results do not describe all capabilities available in an interactive terminal or GUI.

Legend: **OBSERVED** = directly measured; **DOCS** = current vendor documentation; **UNVERIFIED** = not demonstrated; **BLOCKED** = attempted operation failed. Full evidence: [verification record](../tooling/verification-2026-10-24.md).

| Agent | CLI/API/MCP and invocation | Workspace access | Branch/worktree support | Handoff and collection | Permission boundary / verdict |
|---|---|---|---|---|---|
| Claude Code | OBSERVED CLI 2.1.309, help and bounded print invocation; no dedicated Claude MCP exposed | BLOCKED probe: Not logged in, no file-read result | DOCS + local help: --worktree; agent worktree not exercised | JSON returned an error; no completed task | Restricted Read-only tools, no MCP, no permissions bypass; direct route needs available authentication |
| OpenDesign | OBSERVED app 0.26.0; MCP lookup says no server named open-design; no callable MCP tools in this session | UNVERIFIED | UNVERIFIED; do not assume native Git support | Use task/design packet and export manifest when available; no run started | BLOCKED invalid arm64 signature; do not launch, repair, self-sign or register it |
| ZCode | OBSERVED app 3.16.3; bundled CLI help reports 0.17.0, prompt/cwd/json and app-server; no PATH command or dedicated MCP found | BLOCKED read-only probe: built-in provider config not located | Agent integration UNVERIFIED; prepared Git branch is fallback | Help verified; task returned startup error, no output artifact | Explicit plan mode (headless default is yolo); provider packaging unresolved; app-server protocol not exercised |
| Antigravity | OBSERVED App 2.26.0 and IDE 2.5.5; no antigravity command on PATH; IDE launcher exists; no dedicated MCP exposed | UNVERIFIED in GUI | DOCS: local/new worktree selection; installed-app flow untested | Manual task file/branch and returned review artifacts proposed | GUI authentication, workspace grant and autonomous API dispatch unverified; do not infer absence of all APIs |
| OpenCode | OBSERVED installed CLI v2.1.4; default startup blocked by log-write EPERM; isolated XDG version/run-help succeeds | UNVERIFIED; isolated help did not test workspace reading | External Git branch/worktree usable in principle; native support untested | CLI offers run and JSON events; no model task submitted | Original profile not changed; isolated config has no proven provider auth; do not add undocumented --dir flag |
| Codex (current) | OBSERVED file/exec/research tools; local Git setup and document edits | OBSERVED this workspace | Local Git lifecycle recorded in verification evidence | This bootstrap delivered locally; external agent success count remains zero | .git mutation requires sandbox escalation; no remote publish or cloud permission changes |

No direct end-to-end external-agent handoff is verified. Capability means neither authentication nor acceptance. Built-in Codex subagents would not count as Claude Code, OpenDesign, ZCode, Antigravity or OpenCode.

## Supported instruction formats

| Agent | Format set up here | Evidence and limits |
|---|---|---|
| Codex | Root AGENTS.md | Current session consumes user-provided AGENTS instructions; future automatic loading not separately tested |
| Claude Code | CLAUDE.md importing AGENTS.md, plus architect role | Vendor documents CLAUDE.md/imports; probe did not prove instruction loading |
| ZCode | Root AGENTS.md with explicit backend role | Vendor documents workspace AGENTS.md, no import expansion; installed-version loading untested |
| Antigravity | Root AGENTS.md with explicit frontend role | Current vendor docs support root AGENTS.md; installed-app loading untested |
| OpenCode | Root AGENTS.md with explicit QA/support role | Current v2 documentation supports AGENTS.md; actual task loading untested |
| OpenDesign | Explicit [design handoff](../design/README.md), not an invented auto-loaded instruction file | Local skill requires independently registered MCP; no supported workspace auto-loader verified |

Do not create guessed ZCODE.md, OPENDESIGN.md or agent settings that imply unsupported automation. Shared AGENTS.md is self-contained for core rules; task-specific documents must be explicitly supplied/read.

## Promotion test

To promote a route to verified: record tool/version, exact worktree and base SHA; issue a synthetic read-only task; require returned file token and task acknowledgement; collect output/error plus duration; verify no unrelated modifications. Separately test instruction loading and branch isolation before allowing writes. Authentication/installation changes are separate approved actions.
