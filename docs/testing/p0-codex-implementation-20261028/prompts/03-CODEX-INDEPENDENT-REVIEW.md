# Session 3 — Codex independent nonauthor patch review

I assign a fresh actual Codex reviewer to MC-P0-CODEX-PATCH-REVIEW-20261028. You must not have authored either patch; otherwise report conflict and do not approve it. This is review of isolated BE/FE patches, not new implementation or full product acceptance.

Project root: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control
Packet: docs/testing/p0-codex-implementation-20261028/
Reference branch/head: codex/unified-project-flow / a62d838791ba188838c4ff00b7b6e265ac775056. Uncommitted exact bytes are pinned by baseline-manifest.json and delivery/manifest.json; HEAD alone is not source identity.
Read applicable AGENTS/component rules, /Users/nguyenvanlan/.codex/RTK.md. Prefix shell commands with rtk. Semble-first for exploration; Context7 resolve/query for library/API/CLI documentation when needed. Preserve existing changes; no install/provider/login/account/model change, secret access, production/paid service, Git stage/commit/reset/stash/clean/merge/push, database/resource actions or permission bypass. Never repurpose HOME/home/CODEX_HOME; use task-specific cache/temp variables. No environment dumps.
Record actual agent/tool identity, exact cwd/source hashes, commands/UTC/exits, output paths and tests run/not run. Never claim DONE/acceptance/production readiness from an isolated patch. Preserve author vs independent-review evidence.

## Read-only inputs and outputs

Review durable packet delivery/manifest.json and delivery/{backend,frontend}/{changes.patch,before,after}; inspect full isolated trees only as needed:
/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/backend
/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/frontend
Baseline sibling baseline/. Live product source remains Claude-owned and must not be edited or used as unstated baseline.

Read backend/return.md, frontend/return.md, their evidence, baseline-manifest.json and prior static findings. Verify7 BE +5 FE paths and exact before/after hashes. Do not infer integrated current state from source patch existence.

Own ONLY packet review/return.md and review/inputs.json. Check absent before writing. If they already contain an earlier complete review, preserve it and use an explicitly new revision subdirectory, noting lineage. Initial reviewer hit quota: FE provisional comments existed, but NO final completed review/return was produced. Do not inherit a PASS from those comments.

## Review focus

BE: saved receipt scope access before replay outcomes/error distinctions, full Matter/workspace/source/row/op binding, no foreign item/hash/revision leakage, same actor global-key lookup, collision-safe canonicalization, legacy fail-closed compatibility and recovery, no duplicate effects. Whole-sheet parse errors must propagate safe actionable HTTP400 without file content leakage; storage errors must retain correct class; valid row errors remain represented. Verify helper extraction changes only actual caller behavior intended.

FE: preview exactness on edit/add/remove/file change; stale asynchronous preview responses; pending locking/duplicate dispatch; frozen same payload/keys on UNKNOWN and denied reconciliation; per-row missing/duplicate/unexpected receipts; visible outcomes/counts; deliberate new preview after settled attempts. Current component-local UNKNOWN identity is lost on reload/tabclose; this is a known residual preventing full F02 closure, not automatically introduced by this patch.

Read regression tests and real red/green logs; verify they test observable behavior rather than implementation copies. Final FE corrected-environment receipts may be pending; state evidence incomplete rather than inventing them. Earlier HOME override is an execution-protocol erratum, not evidence of product test failure. Do not reclassify mock UI tests as real browser/API/PG tests.

READ/HASH/STATIC_ONLY: no reviewed-code execution, installs, browser/probes, DB/resources/private/provider/Git mutations. If a test needs rerun, return exact request to its author/Claude; keep your independent review scope accurate.

## Return

Actionable correctness/security/regression findings with severity, exact before/after source lines, trigger/impact/minimal fix + required test. Separate introduced blockers, pre-existing out-of-scope residuals and evidence-only limits. If blocker found, CHANGES_REQUIRED. If no blocker, PASS_SOURCE_REVIEW_WITH_LIMITATIONS, explicitly partial scope, required corrected checks and durable UNKNOWN/PG/full integration gaps. No broad acceptance/DONE claim. Inputs.json records hashes/bytes of exact reviewed code and receipts; no circular manifest.

Do not edit author code or auto-apply patches. After author revision, re-review affected exact bytes and do not blanket inherit old verdict.
