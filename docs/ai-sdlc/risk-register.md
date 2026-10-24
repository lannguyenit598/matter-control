# Risk Register

Scale: impact/probability = High/Medium/Low; priority is qualitative until workloads and architecture are known. Reassess at every milestone.

| ID | Risk / direct evidence | Impact / probability | Owner | Mitigation and closure evidence | Status |
|---|---|---|---|---|---|
| R-001 | Existing Go backend + Cloudflare Free Tier compatibility unverified | High / Unknown | Claude + Codex | Audit pinned code/runtime/dependencies; architecture options and Human-approved feasibility decision | OPEN, architecture gate |
| R-002 | $0/month claim lacks MVP workload, account/plan and end-to-end service inventory | High / Unknown | Codex | Quantified workload, quotas/pricing sources dated at validation, all required service costs and overflow behavior | OPEN, release gate |
| R-003 | No successful external-agent task round trip | Medium / Observed | Codex | Git fallback now; synthetic read/ack/result and isolation proof before direct route promotion | OPEN |
| R-004 | Historical signature/MCP blockers resolved according to user logs; live connection unverified | Medium / User-reported | Codex | [Follow-up evidence](../tooling/follow-up-evidence.md); verify live MCP separately before relying on it | PARTIALLY_RESOLVED, not task-ready |
| R-005 | Backend/frontend source SHAs not pinned; shell GitHub DNS failed in original probe | High / Observed | Codex | Separate authorized technical audit; not solution work in Step 00A | OPEN, downstream technical baseline |
| R-006 | Legal matter confidentiality, access boundaries, audit integrity and retention not specified | High / Unknown | Claude + Codex | Human-approved requirements, security architecture and negative authorization/recovery tests; synthetic data meanwhile | OPEN |
| R-007 | Self-review or version mismatch could produce false DONE | High / Medium | Codex | Independent reviewer, exact tested revision, task→test→review→release links | CONTROL_DEFINED, not runtime-verified |
| R-008 | Governance repo local only; no shared remote/PR/recovery destination | Medium / Observed | Codex + Human | Confirm destination and collaboration policy; publish only after authorized target is known | OPEN |
| R-009 | Current vendor docs may differ from installed app versions | Medium / Medium | Codex | Verify local help and instruction loading; do not rely on docs alone for runtime claims | OPEN |
| R-010 | Design-to-code handoff may omit states or stable artifacts | Medium / Medium | OpenDesign + Antigravity | Export manifest, version, all states, interaction/accessibility criteria and receiving-engineer acknowledgement | OPEN |
| R-011 | Both mandatory product source briefs absent; PO confirmed “chưa có” | High / Confirmed | PO provides inputs; Codex reconciles | Full A/B and provenance, full reading, original JTBD and verified delta; no fabricated sources | BLOCKS full canonical consolidation / Step 01 gate |
| R-012 | Basic signature/decision/finding/risk scenarios could be cut from P0 or expand into full P1 | High / Medium | Codex + PO domain owner | OBD-03; preserve minimum workflow representation, specify boundary at Step 01 | OPEN semantic boundary |
| R-013 | Single status could falsely equate completed, verified, unblocked and on-time | High / Medium | Codex + OpenCode | Five axes retained; Atlas counterexamples; transition/permission rules at Step 01 | CONTROL_DOCUMENTED, not implemented |
| R-014 | Synthetic Atlas assumptions could be mistaken for approved legal/product rules | Medium / Medium | Codex | Explicit proposal labels, fixed demo clock, source reconciliation and Step 01 criteria | OPEN until reviewed |
| R-015 | Expanded P0 could be silently reduced to fit free hosting or schedule | High / Unknown | Codex + PO | Keep full capability/workflow release baseline; evidence-based trade-off if constraints conflict | OPEN, no scope reduction authorized |

No residual risk has been silently accepted. Unknown probability is not low probability. Blocked tooling does not prevent product documentation; missing A/B does prevent claiming completed source consolidation. Product direction/P0 approval is not the missing gate.
