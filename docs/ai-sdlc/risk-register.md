# Risk Register

Scale: impact/probability = High/Medium/Low; priority is qualitative until workloads and architecture are known. Reassess at every milestone.

| ID | Risk / direct evidence | Impact / probability | Owner | Mitigation and closure evidence | Status |
|---|---|---|---|---|---|
| R-001 | Existing Go backend + Cloudflare Free Tier compatibility unverified | High / Unknown | Claude + Codex | Audit pinned code/runtime/dependencies; architecture options and Human-approved feasibility decision | OPEN, architecture gate |
| R-002 | $0/month claim lacks MVP workload, account/plan and end-to-end service inventory | High / Unknown | Codex | Quantified workload, quotas/pricing sources dated at validation, all required service costs and overflow behavior | OPEN, release gate |
| R-003 | No successful external-agent task round trip | Medium / Observed | Codex | Git fallback now; synthetic read/ack/result and isolation proof before direct route promotion | OPEN |
| R-004 | OpenDesign signature invalid and MCP missing | High / Observed | Human + Codex | Official reinstall by Human, valid signature and approved MCP verification; no bypass | BLOCKED |
| R-005 | Backend/frontend source SHAs not pinned; shell GitHub DNS failed | High / Observed | Codex | Authorized read-only source access, branch/SHA/license/dependency baseline | OPEN for Step 00A |
| R-006 | Legal matter confidentiality, access boundaries, audit integrity and retention not specified | High / Unknown | Claude + Codex | Human-approved requirements, security architecture and negative authorization/recovery tests; synthetic data meanwhile | OPEN |
| R-007 | Self-review or version mismatch could produce false DONE | High / Medium | Codex | Independent reviewer, exact tested revision, task→test→review→release links | CONTROL_DEFINED, not runtime-verified |
| R-008 | Governance repo local only; no shared remote/PR/recovery destination | Medium / Observed | Codex + Human | Confirm destination and collaboration policy; publish only after authorized target is known | OPEN |
| R-009 | Current vendor docs may differ from installed app versions | Medium / Medium | Codex | Verify local help and instruction loading; do not rely on docs alone for runtime claims | OPEN |
| R-010 | Design-to-code handoff may omit states or stable artifacts | Medium / Medium | OpenDesign + Antigravity | Export manifest, version, all states, interaction/accessibility criteria and receiving-engineer acknowledgement | OPEN |

No residual risk has been silently accepted. Unknown probability is not low probability. Blocked tooling does not prevent review of governance artifacts or a manual Step 00A audit.
