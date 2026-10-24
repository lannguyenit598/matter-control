# Step 00 — Tooling Verification Evidence

Observer: Codex. Date: 2026-10-24 (Asia/Ho_Chi_Minh). Workspace: matter-control. Scope: installed tools, instruction formats and bounded synthetic probes. This is an observation record, not an independent review or successful external orchestration report.

## E-01 — Initial workspace and instructions

- Read the exact user attachment and /Users/nguyenvanlan/.codex/RTK.md.
- Semble search against this workspace returned: No supported files found. Subsequent directory inventory showed an empty folder; git status/remote reported not a Git repository.
- No pre-existing project files were overwritten. The request is preserved byte-for-byte in docs/ai-sdlc/step-00-request.md.
- Git 2.54.0 (Apple Git-157) observed. Initial sandbox git init failed with Operation not permitted on .git; approved tool escalation succeeded with rtk git init -b main.
- Local commit/worktree/check evidence is recorded in docs/testing/step-00-validation.md.

## E-02 — Executable and application inventory

Commands used: command -v for named tools; application directory inventory; PlistBuddy reads of CFBundleIdentifier/CFBundleShortVersionString; local --help and --version.

| Component | Observed location / version |
|---|---|
| rtk | /opt/homebrew/bin/rtk |
| git | /usr/bin/git |
| gh | /opt/homebrew/bin/gh; authentication not inspected |
| codex | Existing Node installation bin/codex; used only for named MCP lookup |
| claude | ~/.local/bin/claude; 2.1.309 |
| opencode | /opt/homebrew/bin/opencode → Cellar/opencode-v2/2.1.4/bin/opencode |
| ZCode | /Applications/ZCode.app; dev.zcode.app; 3.16.3 |
| Antigravity | /Applications/Antigravity.app; com.google.antigravity; 2.26.0 |
| Antigravity IDE | /Applications/Antigravity IDE.app; com.google.antigravity-ide; 2.5.5 |
| OpenDesign | /Applications/Open Design.app; io.open-design.desktop; 0.26.0 |

No zcode, antigravity or open-design executable resolved on PATH. This does not prove no bundled CLI exists. Further exact-path inspection found ZCode's bundled CLI and an Antigravity IDE launcher.

## E-03 — Claude Code actual task attempt

Local help/version succeeded. A 35-second bounded process invoked the following from the workspace; returned immediately with exit 1:

```sh
rtk proxy claude -p 'Read only docs/tooling/probes/workspace-probe.txt and return its Probe token exactly. Do not edit files, run commands, use the network, or delegate.' --restricted --tools Read --allowedTools Read --permission-mode dontAsk --strict-mcp-config --mcp-config '{"mcpServers":{}}' --disable-slash-commands --no-session-persistence --output-format json --max-budget-usd 0.10
```

Relevant actual result fields:

```json
{
  "is_error": true,
  "terminal_reason": "api_error",
  "result": "Not logged in · Please run /login",
  "duration_api_ms": 0,
  "total_cost_usd": 0,
  "input_tokens": 0,
  "output_tokens": 0
}
```

Usage fields above are selected from the returned usage object. The result's subtype said success despite is_error=true; this record correctly treats the attempt as failed. No expected file token was returned; workspace access, instruction loading and agent worktree execution remain unverified. No login was initiated. This describes the restricted invocation's authentication state, not all GUI/terminal sessions.

## E-04 — OpenDesign

```sh
rtk proxy codex mcp get open-design --json
rtk proxy codesign --verify --deep --strict --verbose=2 '/Applications/Open Design.app'
```

Observed messages: No MCP server named 'open-design' found; invalid signature (code or signature have been modified), architecture arm64. Tool inventory also exposed no callable OpenDesign MCP transport.

The local open-design-mode skill v0.5.3 was inspected: a plugin alone does not supply MCP transport. The app was not launched, installed, repaired, signed or registered. A previous-session signature failure informed the cautious check; the failure above was verified again in this run.

## E-05 — OpenCode

Normal opencode --version and opencode run --help failed while opening ~/.local/share/opencode/log/opencode.log, with EPERM. These errors were observed inside a batch command; do not infer each command succeeded from the enclosing shell's final exit code.

Safer diagnostic: a temporary directory provided XDG_DATA_HOME, XDG_CACHE_HOME, XDG_STATE_HOME and XDG_CONFIG_HOME to the two subprocesses, without altering HOME or the original profile. The temporary directory was removed afterward.

- Isolated opencode --version: exit 0, opencode v2.1.4.
- Isolated opencode run --help: exit 0; offers --standalone, --server, --agent, --format json, --file, --model and --auto.
- Installed help did not expose --dir despite some retrieved docs mentioning it. Use the process working directory; do not copy unverified flags.
- No provider/model task was run. The isolated environment intentionally did not validate the user's configured provider, workspace reads or instruction loading. Do not use --auto as a default.

## E-06 — ZCode actual task attempt

The packaged entry point /Applications/ZCode.app/Contents/Resources/glm/zcode.cjs was found by directory inspection.

```sh
rtk proxy node /Applications/ZCode.app/Contents/Resources/glm/zcode.cjs --help
```

Exit 0; help reports zcode 0.17.0 and supports app-server, --prompt, --attach, --cwd, --json, --disallowed-tools and --mode. Help explicitly states --prompt defaults to yolo; the task probe overrode it with plan.

```sh
rtk proxy node /Applications/ZCode.app/Contents/Resources/glm/zcode.cjs --cwd /Users/nguyenvanlan/Documents/code/pet-projects/matter-control --mode plan --disallowed-tools 'Bash Edit Write NotebookEdit Task Agent WebFetch WebSearch' --json --prompt 'Read only docs/tooling/probes/workspace-probe.txt and return its Probe token. Do not edit files, execute commands, use network tools, or delegate.'
```

Bounded at 25 seconds; exited 1 immediately. stderr reported inability to locate CLI ZCode Built-in Provider Config, trying /Applications/ZCode.app/Contents/Resources/glm/provider/zcode-builtin.json and /config/provider/zcode-builtin.json. No task output/token. The CLI's existence is verified; launching its model runtime this way is blocked by packaging/configuration. No config, auth or app-server changes made.

## E-07 — Antigravity

Read-only app metadata verified the versions in E-02. The App resources/bin contained language_server and webm_encoder; the IDE contained Contents/Resources/app/bin/antigravity-ide. No headless agent invocation was attempted via the IDE launcher; opening an IDE is not proof of task dispatch.

Current official docs describe workspace rules and local/new-worktree choices. No GUI task, workspace permission grant, login, API call, instruction-loading test or output collection was performed. These remain UNVERIFIED.

## E-08 — Source repository access

```sh
rtk git ls-remote --symref https://github.com/lannguyenit598/go-hexa-template HEAD
rtk git ls-remote --symref https://github.com/lannguyenit598/nextjs-atomic-starter HEAD
```

Both reported Could not resolve host: github.com in the sandbox. The web tool could open the two supplied GitHub pages. No clone, exact branch/SHA baseline, dependency audit or backend/frontend compatibility test was performed. Web visibility does not prove authenticated push/PR permissions.

## E-09 — Current documentation and instruction formats

Context7 resolve-library-id preceded query-docs for Claude Code, OpenCode, Antigravity, ZCode and Cloudflare Workers. Selected libraries were /websites/code_claude, /anomalyco/opencode, /websites/antigravity_google, /websites/zcode_z_ai_en and /llmstxt/developers_cloudflare_workers_llms-full_txt. Local help takes precedence for installed CLI flags.

- [Claude CLI](https://code.claude.com/docs/en/cli-reference): print/JSON and worktree interface; installed help independently inspected.
- [Claude project memory](https://code.claude.com/docs/en/memory): CLAUDE.md and imports; root CLAUDE.md is used here.
- [OpenCode instructions](https://github.com/anomalyco/opencode/blob/dev/services/www/src/docs/content/instructions.mdx): v2 AGENTS.md guidance.
- [OpenCode permissions](https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/permissions.mdx): documented permissions; no project permissions config installed.
- [Antigravity rules](https://antigravity.google/docs/rules): workspace AGENTS.md supported by current docs.
- [Antigravity projects](https://antigravity.google/docs/projects): local/new-worktree modes; not exercised locally.
- [ZCode agent](https://zcode.z.ai/en/docs/agents): workspace AGENTS.md, no import expansion; keep core rules in the root file.
- OpenDesign local skill: /Users/nguyenvanlan/.codex/plugins/cache/open-design/open-design/0.5.3/skills/open-design-mode/SKILL.md; transport boundary inspected, no generation workflow started.
- [Workers languages](https://developers.cloudflare.com/workers/languages/), [limits](https://developers.cloudflare.com/workers/platform/limits/), [Next.js](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/): feasibility references only, no numeric cost/runtime commitment inferred.

## Outcome and permissions

External agent task attempts: Claude Code and ZCode, both failed before a workspace read result. OpenCode help/version succeeded only with isolated XDG directories. No external agent completed a task; no API/MCP route was promoted to production-ready orchestration.

No new integrations installed, no global config edited, no cloud/account permissions changed, no credential files read/exported and no production action taken. Bounded subprocess probes are actual CLI attempts, not successful handoffs. Raw private agent logs were not copied into the repository.
