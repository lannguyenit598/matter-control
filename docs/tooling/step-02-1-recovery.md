# MC-002 — Agent Recovery Evidence and Correction

Codex,2026-10-24; continuation base2000d94. This record supersedes current-readiness conclusions in earlier Step02 records, without rewriting historical raw outputs or the independently reviewed fifteen architecture files. No app was reinstalled, self-signed, unquarantined, authenticated or granted a security exception.

## Host verification, not an assumed repair

Fresh host `codesign --verify --deep --strict --verbose=2` exits0 for both apps and existing agy CLI. Host app Gatekeeper assessments exit0 accepted/Notarized Developer ID. Earlier sandbox failures could not be reproduced on the host and do not establish a modified app. Their exact root cause is not proven; the former mandatory-reinstall conclusion is withdrawn. [All nine commands and outputs](../testing/step-02-1/host-provenance.json).

| Tool | Installed identity / observed certificate | Current route and limit |
|---|---|---|
| ZCode | App3.16.3; bundle dev.zcode.app; Developer ID Beijing Knowledge Atlas Technology Joint Stock Company Limited, team8A5X4JJ39T, Apple chain | Bundled CLI0.17.0 help exits0; synthetic prompt exits1: missing /Applications/ZCode.app/Contents/Resources/glm/provider/zcode-builtin.json and /config/provider/zcode-builtin.json. No owner model task ran. GUI handoff PREPARED; GUI workspace/write permission still untested |
| Antigravity | App2.26.0; com.google.antigravity; Google LLC teamEQHXZ8M8AV, Apple chain; agy1.4.7 same signer | Synthetic ACK and actual supplied-source audit succeed. Workspace engineering tools/permissions not established; no global permission repair. Runtime manual handoff PREPARED |
| agy Gatekeeper app check | codesign valid, spctl execute exit3: code valid but does not seem to be an app | Preserve the diagnostic; do not mislabel it an invalid signature or bypass a failed app assessment |

Official distribution/docs inspected: [ZCode install](https://zcode.z.ai/en/docs/install), [agents](https://zcode.z.ai/en/docs/agents), [Antigravity download](https://antigravity.google/download), [CLI headless](https://antigravity.google/docs/cli/headless.md). Context7 queries preceded official lookup. No publisher-provided checksum comparison was performed; local hashes are inventories only. Unrelated ZCode-branded domains were not treated as official sources. No download/install was necessary.

## Actual dispatch and authorization

[Installed help](../testing/step-02-1/agent-help.json) and [synthetic probe](../testing/step-02-1/agent-probes.json) identify what really ran. The first synthetic Antigravity probe combined plan with disabled slash expansion; stderr explicitly says plan then has no effect. It carried no repository content/tools and is only an ACK, not proof of read-only tool enforcement. The actual audit uses plan without that conflicting flag, sandbox and a strict no-tools task instruction; no hard per-tool deny API was exposed by installed agy help. Reported zero tools is not a general sandbox/security guarantee.

Initial audit egress was rejected because prior approvals covered Claude/OpenCode, not Google. Direct PO answer subsequently approved this exact14-snapshot58203-byte frontend packet and selected “gemini 3.8 flash” / thinkingHIGH. Actual `agy models` exits0 and lists gemini-3.8-flash-high. Audit argv pins `--model gemini-3.8-flash-high --effort high`; no global selection changed. Exit0, conversation36d93b38-79c3-4628-af8c-8b0e7375eec1,63.661s wall; returned JSON SUCCESS,1turn. Model flags and available IDs are observed; JSON does not attest effective provider model. [Selection](../testing/step-02-1/agent-model-selection.json), [execution](../testing/step-02-1/antigravity-execution.json), [packet identities](../testing/step-02-1/antigravity-input-manifest.json).

TaskB is complete for this scoped investigation, not for backend/frontend engineering readiness. The missing packaged ZCode config and unestablished headless engineering permission path are preserved as manual-dispatch limits, not reasons to impersonate either owner. The actual frontend report's unsafe/unsupported advice is dispositioned in [frontend audit](../architecture/frontend-audit.md). Both complete prompts are in docs/implementation/handoffs/ and must be returned in full to the human.


## Final headless engineering permission probe

A synthetic, non-mutating capability check requested only `rtk proxy git -C /tmp/mattercontrol-step02-frontend rev-parse HEAD`, with accept-edits/sandbox and the same pinned Gemini3.8FlashHigh/efforthigh. Actual conversation b9174f44-a511-4ab6-8f3b-da986e09b79a returned CLI exit0 / JSON SUCCESS but empty response and `denied_actions: command / RunCommand`. Stderr explicitly says headless mode cannot prompt and auto-denied the command. **The command did not run; exit0 is not successful tool execution.** [Raw probe](../testing/step-02-1/antigravity-tool-probe.json). No internal document packet was sent in this probe. Vendor diagnostic suggestions to add global allow-rules or skip permissions were NOT followed. This confirms the manual engineering handoff limit; interactive owner permissions can follow normal UI without changing global policy here. This late non-mutating probe supplements, and was not part of, the completed independent review packets.
