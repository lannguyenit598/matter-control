# MC-BE01-MIMOSA-ZCODE-INVESTIGATION-R1 — ZCode investigation return

Date: 2026-10-26. Actual actor: **ZCode** (ZCode Desktop app 3.16.3, darwin 27.0.0 arm64), interactive session, model self-reported `account:zai-start-plan/GLM-5.3-Flash` via Z.AI. Session window 2026-10-26T14:38:32Z–14:51Z (Asia/Ho_Chi_Minh 21:38–21:51). Status: **BLOCKED — BLOCKED_NO_DISPOSITION_INTERFACE**. No disposition was performed; no scan, commit or state change was attempted.

## 1. Verified inputs

Governance root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, HEAD `a62d838791ba188838c4ff00b7b6e265ac775056` (observed 14:38Z and again 14:50Z). Handoff prompt SHA256 `c876cbfa9d9329468d680ed0ce5548ed022fb46e0694c878a71747ce6385fe1b`.

Backend checkout `/private/tmp/mattercontrol-backend-be01` (git worktree of `/private/tmp/mattercontrol-step02-backend`), branch `codex/mc-be-01`, HEAD `136eae6ad403ae3ede797faf6a0d6179c3b95685`: exactly the nine reviewed staged paths, staged diff 53067 bytes, SHA256 `33297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e`, unstaged bytes 0, no untracked files — re-verified after all investigation work. Source/index modifications: **none**.

Hash-verified pins (all match, bytes+SHA256): the six `mimosa-operator-inputs.json` direct inputs (operator prompt `46c770…`, `MIMOSA-FINDING-RESOLUTION.md` `a365eb…`, `flagged-source-analysis.json` `084797…`, `intake.json` `45c6d6…`, `provision-command.py` `1200bd…`, `be01-r1-commit-blocked-intake.md` `3101d1…`), plus `mimosa-operator-inputs.json` itself `66523b…`. All seven retained intake artifacts decode to their pinned bytes/hashes, including `owner-return.txt` (9151 bytes, `65ca650f…`) and `32-commit-attempt-blocked.log` (1760 bytes, `8c75d072…`).

## 2. Phase A — the original enforcement route (observed, read-only)

**Integration identity.** ZCode plugin **`mimosa` version 1.0.4** (`mimosa@zcode-plugins-official`), user scope, installed 2026-10-23 from the official CDN zip SHA256 `50d4da2cc1a24c63db06b51758699d5ffbf22aa4c79ae001a823e8177f0a1fe7` (`~/.zcode/cli/plugins/installed_plugins.json`). Components: user-level hooks, CLI (`payload/dist/cli.js`), and an optional stdio MCP server (`payload/dist/mcp/server.js`, exposed this session as `mcp__plugin_mimosa_mimosa__security_scan{,_start,_status,_cancel,_resume}`). The sealed deep scan manifest reports producer string `mimosa0.1.0` for the MCP scan engine; the plugin package is 1.0.4. Both recorded; no version mapping asserted.

**The refusing hook.** The plugin registers `PreToolUse` with matcher **`Bash`** → `node ${ZCODE_PLUGIN_ROOT}/hooks/run-hook.cjs git-gate-hook.mjs` (timeoutMs 120000, statusMessage "Mimosa 正在检查命令与 Git 门禁…"). The refusal log's "Mimosa L3" wording matches this component: the README documents `git-gate-hook.mjs` as the gate that "阻止 Bash 直接写源码旁路；`git commit/push` 前运行 L3 深度项目审计" (graded L3 deep project audit before commit/push; high=deny, medium=ask, low/info=notice). The hook's actual decision logic ships AES-256-GCM encrypted (`git-gate-hook.mjs.mimosa`, Ed25519-signed protected build) and was deliberately not decrypted or executed; behavior below is from official docs plus observed artifacts, marked accordingly.

**Enforcement scope.** Hook registration is user-level (fires in every session of this host where the plugin is enabled). The gate's audit target is the **session project root**, not the Bash cwd: the refusal (00:44Z, backend commit cwd `/private/tmp/mattercontrol-backend-be01`) cites `provision-command.py` under the governance root; the backend worktree has no `.mimosa/` directory at all; the MCP scan job record for the same session pins `request.project` to the governance root. (Binding to `ZCODE_PROJECT_DIR` is an inference from these three observations, not from hook internals.)

**Gate record consulted.** The project finding-ledger `.mimosa/finding-ledger/v1/` contains **14 batches, 0 events, 0 findings**; `grep` finds zero references to `f4bd71af` or `provision-command` anywhere under the project `.mimosa/`; `mimosa ledger show finding:f4bd71af4f1cfebcec9cb0a4` returns "✗ finding 不存在". `mimosa status --json` reports `overall: inconclusive`, `findings.total: 0`. Conclusion: the commit gate's refusal derives from live static detection of the flagged source content (L3 audit), **not** from any stored per-finding gate record; no per-finding clearance state exists that could be flipped. Whether the gate additionally consults the latest sealed scan is not provable without the encrypted internals and is recorded as unknown.

**No repository Git hook.** `mimosa git-gate status` (documented reader) reports `installed: false` for both pre-commit and pre-push in the governance repo and in the backend main repo (`/private/tmp/mattercontrol-step02-backend/.git/hooks`); the governance `.git/hooks` directory contains only `.sample` files. The ZCode PreToolUse plugin hook is the only observed Mimosa enforcement route.

## 3. Phase B — disposition capability: none exposed (all candidates examined)

Every documented surface in the exposed Mimosa 1.0.4 toolset was checked for a finding-scoped false-positive adjudication. None exists:

| Candidate interface | Documented receipt | Disposition? |
| --- | --- | --- |
| MCP `security_scan_start/status/cancel/resume` | Scan lifecycle only (skill + scan-contract.md); business-logic states are `vulnerable/safe/shadow/needs_runtime/inconclusive`, `verdictEffect none` "until the product adopts a separate reviewed policy"; `compare` reports absence under partial coverage as `unknown` | No |
| `mimosa ledger list/show` (used, read-only) | `findings=0, events=0`; `show finding:f4bd71af…` → "✗ finding 不存在" | Read only |
| `mimosa ledger record` | Help: reads a batch from stdin, `batchId` idempotent, content not overwritable; no flags documented; batch schema not documented for hand-authoring; status vocabulary (`open/blocked/fixed_static/runtime_verified/reopened/needs_review/inconclusive`) contains **no false_positive/dismissed state**; guessing a batch would be an undocumented write | No |
| `mimosa validate <finding-id>` | Built-in validators are only `path-traversal-read-doc/v1` and `command-exec-remote-runner/v1`, and only for `fixed_static` findings; invoked with our finding id it refused: "✗ finding ledger 为 partial 或包含读取错误，拒绝运行验证" — and no credential validator exists at all | No |
| `mimosa backlog import/triage` | Help: "导入项一律保持 unproven … 不会自动标为 runtime_verified，也不会自动 dismissed" | No |
| `mimosa policy init/check` | Coverage/threat-model configuration, no policy file exists; not finding adjudication; `init` would be a state write | No |
| `mimosa-ignore` suppression comments | Documented as not trusted by the hook blocking gate (`--no-ignore-comments` is what the gate uses); adding one would also require editing immutable evidence | No |
| Gate mode env vars (`MIMOSA_NO_GIT_GATE`, `MIMOSA_GIT_GATE_MODE`, `MIMOSA_GIT_GATE_FAILURE_MODE`) | Documented switches, but using them = disabling/weakening the hook — explicitly excluded by this assignment | Prohibited |
| Native `mimosa git-gate` | Not installed in either repo; `install/uninstall` would modify hooks — prohibited | Prohibited |

**Result: `BLOCKED_NO_DISPOSITION_INTERFACE`.** The exposed toolset documents no authenticated finding/occurrence-scoped false-positive adjudication, and no rule-correction workflow reachable from this session. This matches, and now explains, the earlier Codex-side return (`BLOCKED_NO_SUPPORTED_DISPOSITION_MECHANISM`, operator route) and the owner return ("no disposition action in the documented interface").

## 4. Commit-gate state and maintainer actions

Current normal commit permission: **NOT_ESTABLISHED** (no disposition performed; gate not re-tested by commit attempt, per assignment). The original scan remains inconclusive/partial/verdictEffect none.

Minimum maintainer actions, in preference order:

1. **Scanner-maintainer rule/dataflow correction (preferred):** correct the native hardcoded-credential rule so a runtime-generated secret (`secrets.token_hex(32)`) serialized into an exclusive-0600 private file outside the repository is not classified as a hardcoded literal credential, preserving detection of true literals; publish as a new protected rule pack; then a separately authorized rescan legitimately clears the finding.
2. **Documented, audited, finding-scoped disposition:** add a `false_positive`/`wont_fix` state to the ledger/sealed-scan finding space with review authority and receipt, **and** wire the L3 git gate to honor that state — today the gate re-detects from source and the ledger has no such state, so a ledger-only annotation would not clear the block. Must be keyed to `scan-2026-10-26T00-40-19.307Z-e324c2f15ce2` / `finding:f4bd71af4f1cfebcec9cb0a4` / `occurrence:457d6114dd662aa87811834e`, with actor, authority, reason, timestamp and receipt; partial coverage must stay visible.
3. **PO-authorized evidence edit (fallback, needs explicit Product Owner authorization):** modify the immutable provisioning evidence `provision-command.py` (e.g., restructure line 46) and rescan. This is a rewrite of sealed intake evidence and is not authorized by this task.

Explicitly rejected as bypasses (not performed, not proposed as solutions): `MIMOSA_NO_GIT_GATE=1`, gate mode overrides, `git-gate uninstall`, hook/ledger/baseline edits, `--no-verify`, alternate host/context commit routes, repeated scan retries, UUID fabrication for the legacy scan ID.

## 5. What was done / skipped, remaining risk

Done: read-only verification of all pins and artifacts; plugin/hook/store inspection; documented read-only CLI receipts (`--help`, `status --json`, `ledger list`, `ledger show`, `validate`, `git-gate status` ×2, `policy check`, `mcp status`); two read attempts against the exact finding id through documented interfaces (both refused, recorded above). New outputs: this directory only (`report.md`, `evidence.json`).

Skipped: any disposition write, new scans, commit attempts, hook/baseline/ledger/settings edits, backend status/audit CLI runs (to avoid initializing Mimosa state in the preserved backend worktree), decryption of protected hook internals, external contact. `mimosa doctor`, `knowledge`, `threat-model` subcommands were examined at help level only.

Remaining risk: the enforcing hook's internal decision logic is encrypted, so "gate re-detects from source" rests on documented behavior plus the empty-ledger/zero-reference observations, not on internals; plugin version drift could change interfaces; the nine-path reviewed patch remains uncommitted and BE01 remains IN_REVIEW/BLOCKED pending a maintainer action above and a separate Codex intake.
