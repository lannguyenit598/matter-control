# MatterControl — parallel assignments, 2026-10-27

Task MC-P0-PARALLEL-20261027; priority P0; coordinator actual Local Codex. Direct PO request: assign parallel work and provide prompts/owners while ZCode implements. Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; reference HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`. Parent remains MC-P0-ZCODE-EXECUTION. Canonical scope FR-001..020, AC-101..163, NFR-001..014, original GW-01..03.

| Assignment | Actual intended owner | Owned output only | Dependencies / acceptance |
|---|---|---|---|
| Product W6–W7 and residual gaps | Actual ZCode, manual continuation | Existing product source/task paths in the STOP prompt | Complete BE/API/FE and applicable evidence; acknowledge takeover in existing workboard. No competing source writer. |
| MC-P0-IDP-PREFLIGHT | Local Codex subagent `idp_preflight` | `docs/testing/p0-parallel-20261027/idp/` | Public source/official-doc diagnosis; reviewable operator delta, unknowns and authority boundary; no admin/private/runtime action. |
| MC-P0-W1W5-STATIC-QA | Local Codex subagent `w1w5_source_qa` | `docs/testing/p0-parallel-20261027/qa/` | Frozen source review with actionable line-bound findings, tests/requirements and limits. No acceptance from source alone. |
| MC-P0-ACCEPTANCE-RESTORE-PREP | Local Codex subagent `acceptance_restore` | `docs/testing/p0-parallel-20261027/acceptance-restore/` | Canonical acceptance/GW matrix and isolated restore test plan; planned results remain NOT_RUN. |

Prompts are in this directory. Internal assignment tools may dispatch the three Codex subagents after prompt preparation; actual statuses and returns are recorded separately in `status.json`. The ZCode continuation is manual; no ZCode invocation/acknowledgement is implied. These Codex subagents are not the external products Claude Code, OpenCode or ZCode. Their source/planning results do not constitute external review or PO/release acceptance. Do not run a duplicate session from a prompt already dispatched without a new coordinator assignment.

## Shared frozen inputs and boundaries

Read `docs/testing/p0-parallel-20261027/snapshot-manifest.json` first. Frozen root: `/private/tmp/mc-p0-parallel-20261027-0da4q45k`. It contains 829 selected public source/docs/config files, 8,561,170 B at capture. Verify relevant hashes from the manifest before use and at closeout. The original working source may progress independently; review conclusions bind the frozen bytes, not a future ZCode delta.

No app private env/key files, ops runtime/secrets/.env or external symlink targets were copied; three source symlinks were recorded but not followed. Do not fetch those targets or private credentials to fill gaps. Public ops scripts are inspection material, never a provisioning authorization.

Read original root AGENTS and RTK instructions. Use Semble first for code discovery when available; locate against the canonical repository, then inspect corresponding frozen paths. For exact known frozen paths, direct reads are allowed. Component rules in the frozen apps apply to interpretation. All shell commands use RTK. Current library/SDK/CLI/provider documentation requires Context7 then official sources if unavailable. Public generic technical questions only; do not upload snapshot/source packets to another provider.

Each subagent owns only its named output directory, must check absence before creation, and must not overwrite others. You are not alone in this repository. Never revert other edits. Do not edit product source, workboard, contract, design, requirements, previous evidence or another output area. No source execution/import/tests/build/install, no HTTP/SQL/ps/lsof/docker/private probes, no browser/capture/export, admin call, resource lifecycle, settings/provider changes, agent messages, commit/scan/stage/push/merge/deploy or Mimosa bypass. Official public documentation research is allowed; report unavailable docs rather than invent exact API/CLI support.

Output must identify actual subagent/tool, task/base/snapshot/hash, requirement links, checks performed/not performed, findings/plan evidence, limitations and proposed status. Source assertions are STATIC_REVIEWED, proposed cases are NOT_RUN, live-state claims UNKNOWN. No self-awarded DONE/ACCEPTED, MC-002/Step03B/production approval. End with skipped work and remaining risk.

## Integration

Codex checks returns and consolidates actionable gaps. ZCode consumes findings after human/coordinator delivery, repairs its owned source and records actual author checks; it continues independent W6 work while review runs. If a finding's frozen location changed, compare current bytes and determine whether it is already fixed before editing. Live IdP mutation and actual restore are separate bounded execution steps after a concrete plan/resource preflight and applicable authority, not assigned by these preparatory prompts.
