# Step 02 Official Sources and Tool Evidence

Collector: Codex. Retrieved 2026-10-24; dates below are retrieval times in UTC, user-facing project date Asia/Ho_Chi_Minh. Current official sources support documentation claims only, not account entitlements or deployed behavior. Context7 resolve preceded queries for Claude Code and Cloudflare; installed CLI help was checked against documentation. Context7 returned an older/general Next.js adapter description; the live Next.js guide now recommends vinext beta, so the current source takes precedence. Likewise use current Workers 64 MiB uncompressed limit, not historical 3 MB assumptions.

Public documentation snapshots were retrieved as index.md with macOS curl, TLS verification enabled, exit 0; Python urllib first failed its local certificate store and no verification bypass was used. Full source snapshots are temporary; canonical URLs and SHA256 enable audit/retrieval comparison, not a promise future URLs remain identical.

| Source | SHA256 of fetched Markdown | Retrieved UTC |
|---|---|---|
| [workers/platform/limits](https://developers.cloudflare.com/workers/platform/limits/) | 574d5088a914872b338e03c727adf4ef4ef88a8f2a1bcc41bd3f7b200adfb25e | 2026-10-24T09:57:58.861117+00:00 |
| [workers/platform/pricing](https://developers.cloudflare.com/workers/platform/pricing/) | 116d9f42dbeda701749b04fea2ef2ed95c9733529d747c1e4b140b238ca4f2b3 | 2026-10-24T09:57:58.917852+00:00 |
| [workers/runtime-apis/webassembly](https://developers.cloudflare.com/workers/runtime-apis/webassembly/) | 518b88a1025ba85c5aca1152382fe08f029468d30ae574f4138ac3d8ef5fc98d | 2026-10-24T09:57:58.837171+00:00 |
| [workers/framework-guides/web-apps/nextjs](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) | 22eca800e14344bba6999acc0447a9e3b384e2be7e5542675b61af74f1263ac6 | 2026-10-24T09:57:58.830984+00:00 |
| [workers/framework-guides/web-apps/opennext](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) | 1c2379b6056451fdc720f4a509a820a16ed6930cdeacfff63da15a05a527d5d3 | 2026-10-24T09:57:58.828962+00:00 |
| [pages/framework-guides/nextjs/deploy-a-static-nextjs-site](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/) | f7cbbaac7670275e6ae48e741a2804552e8f8f69263db21b329e103f23d1b470 | 2026-10-24T09:57:58.835449+00:00 |
| [pages/platform/limits](https://developers.cloudflare.com/pages/platform/limits/) | 77e09b369ce18a373420038b357e2d023518e2c8875292ac8291036c5f68dd2a | 2026-10-24T09:57:59.348296+00:00 |
| [d1/platform/pricing](https://developers.cloudflare.com/d1/platform/pricing/) | ab06e38349130d15e25109fe9344189639a2801206a641d76d576daa9d04337b | 2026-10-24T09:57:59.062171+00:00 |
| [d1/platform/limits](https://developers.cloudflare.com/d1/platform/limits/) | cea930c6fba1ee7ddc2d61a233b4ea9e95d1b7ca589db67f9e235188195c1843 | 2026-10-24T09:57:59.077129+00:00 |
| [kv/platform/pricing](https://developers.cloudflare.com/kv/platform/pricing/) | 09fe0a9d7a68812192eef429d925be6b5a3d1d17fcb63f488e32635619741750 | 2026-10-24T09:57:59.060549+00:00 |
| [kv/concepts/how-kv-works](https://developers.cloudflare.com/kv/concepts/how-kv-works/) | c364f0a06726cf732e7569f4b2886701a508867b026d6cb55c0343e4c203b518 | 2026-10-24T09:57:59.132010+00:00 |
| [r2/pricing](https://developers.cloudflare.com/r2/pricing/) | e49481db71794f3a787b8e1ea986b7689ca5749423cef3a1fde07e57be0d39b2 | 2026-10-24T09:57:59.196000+00:00 |
| [r2/get-started](https://developers.cloudflare.com/r2/get-started/) | 01942d28ec61a22145b806905e4d3d33527b6564a4dea5b05b956878a35e1915 | 2026-10-24T09:57:59.294975+00:00 |
| [hyperdrive/platform/pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/) | 80e41dda3d95886d049ec3109c2526c5d4288292dbd690ba1f72035a61c529e4 | 2026-10-24T09:57:59.292835+00:00 |
| [hyperdrive/reference/supported-databases-and-features](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/) | 47e01613c4a8ac0afec05c6c6a435068bc0aefebf3187765bfd19b8dfc3f4d21 | 2026-10-24T09:57:59.330690+00:00 |
| [workers/observability/logs/workers-logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) | 7902a6e63cc96baaa3b89fbdbbb960997bb78d3629de9248a29e87376e5b85b1 | 2026-10-24T09:57:59.362827+00:00 |
| [workers/configuration/secrets](https://developers.cloudflare.com/workers/configuration/secrets/) | 330d869351d1befefa316fb3f8a4bafdca26a2b619f6ae5bfc71395bfc8d2163 | 2026-10-24T09:57:59.451173+00:00 |

Additional D1 identity source, fetched after Claude dispatch (not in original packet): [D1 overview](https://developers.cloudflare.com/d1/), SHA256 `9b79af806de66ce3d536717d3302f2367d597eefd42594a466504c4c8c40d448`, retrieved UTC 2026-10-24T10:11:38.633231+00:00; confirms SQLite semantics.

Additional official sources: [Claude CLI](https://code.claude.com/docs/en/cli-reference), [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [ZCode agents](https://zcode.z.ai/en/docs/agents), [Antigravity projects](https://antigravity.google/docs/projects). GitHub billing was read through web tooling, not included in the original Claude packet. Public/standard-runner vs private-plan allowances must be verified against the actual project/account before cost acceptance.

## Local observation ledger

| Probe | Result | Scope / limitation |
|---|---|---|
| rtk --version | 1.0.1, exit 0 | Proxy availability |
| claude --version / --help | 2.1.309, exit 0 | Installed flags checked, not a design result |
| Claude synthetic packet-only route | Sandbox result is_error=true “Not logged in”; host retry exit 0, real acknowledgement MC02-ARCH-20261024 | Existing host auth works; no login/config change; no general file/write route proven |
| Claude actual Step 02 packet | Explicit human authorization after initial automatic egress rejection; 162 SHA256-pinned snapshots, ~795 KB | Full architecture exit0,15 files; actual134-edit correction received/applied, round2 document review PASS with residual findings; final narrow correction exit0,30 edits on8 files and final independent PASS_DOCUMENT_ONLY under DEC-022; read-only transport, tools/MCP disabled; exact input-manifest.json retained |
| GitHub connector | Both repo fetch calls returned Unknown tool | Connector metadata exists but route unavailable; no data fetched through it |
| Git source fetch | Sandbox DNS failed; host ls-remote/clone exit 0 and pinned HEADs verified | Disposable source snapshots, no dependency scripts or template changes |
| ZCode help / actual audit attempt | CLI0.17.0 help exit0; plan audit exit1, missing built-in provider config | No completed owner audit; no global/provider repair |
| Antigravity presence | App2.26.0 / IDE2.5.5; no PATH agent command, IDE launcher present | No model task invocation or owner audit |
| OpenCode current version | Sandbox log-write EPERM; real prior Step01 reviews succeeded on host | Step02 named30-file packet authorized; actual review exit0, opencode/big-pickle, CHANGES_REQUIRED (5High9Medium); final session idle succeeded |
| Toolchain | Go1.27.3 darwin/arm64, Node24.22.1, pnpm executable, docker executable, Python Playwright executable | No build or browser test run; docker daemon/browser install not inspected |
| Missing PATH tools | Wrangler, tinygo, psql, Mermaid CLI, Lighthouse | No auto-install; presence of other versions outside PATH not excluded |

## Actual Claude transport

Command argument array: rtk proxy claude -p --output-format json --tools "" --restricted --strict-mcp-config --mcp-config '{"mcpServers":{}}' --disable-slash-commands --no-chrome --no-session-persistence --json-schema <prepared schema>. Packet passed over stdin; no shell substitution. The no-session-persistence flag means a timeout cannot be safely represented as resumable; inspect output and collect evidence before any repeat. Restricted mode is a process option, not a credential/provider change. No permissions bypass is used. Model identity is taken from returned modelUsage, not guessed from the CLI name.

## Later actual evidence

- Claude correction session3110fb7c-d15a-4daf-8760-ade72486f61d, claude-opus-5-5, exit0/success,134 edits on13 files; original timeout and retry/continuation recorded in step-02-execution.md.
- OpenCode round2 session ses_e925d49fdffeSMIfB3Oj123T0f, exit0,240.174s, document PASS with1Medium2Low. Export identifies actual model **opencode/glm-5.3-flash-free**, unlike round1 opencode/big-pickle. No model flag/provider/global configuration was changed by Codex; record each actual route rather than assuming a stable model from a CLI label.
- Before any GUI fallback, rtk proxy codesign --verify --deep --strict --verbose=2 /Applications/ZCode.app and /Applications/Antigravity.app each exited1: invalid signature (code or signature have been modified), architecture arm64. No launch, repair, re-sign, quarantine bypass or further bundled-CLI execution after this finding. Owner routes BLOCKED_TOOL_INTEGRITY until an official reinstall verifies.

Final narrow Claude session d3d1d13e-3e7e-4dad-a366-0aea84af9f37 / claude-opus-5-5 exit0,200456ms,30 edits (narrative says29, qualified). Final OpenCode session ses_e92505488ffe3ySTAWXz7qxG2c / opencode/glm-5.3-flash-free exit0,166.77s, outcome=succeeded, PASS_DOCUMENT_ONLY; input32 snapshots406313 bytes, exact manifests retained. No High/Medium reported;2Low recording/numeric-admission notes handled in step-02-review.md. All PoCs/build/DDL/restore/cost checks remain NOT_RUN.

## Step02.1 correction and current evidence

Historical sandbox-only signature failures and mandatory-reinstall conclusions above are superseded by fresh host validation: step-02-1-recovery.md and ../testing/step-02-1/host-provenance.json. Both apps validate/Gatekeeper accepted without repair; ZCode CLI provider config remains missing. Actual agy1.4.7 supplied-source audit returned using requested gemini-3.8-flash-high and effort high after exact PO authorization. Runtime engineering remains manual/pending. New PostgreSQL tooling drill ran separately; product restore/Cloudflare/cost remain unverified. Context7 official PostgreSQL18/OpenCode2.1.2/Antigravity CLI docs and installed help informed commands; no guessed API/flags or security workaround adopted.
