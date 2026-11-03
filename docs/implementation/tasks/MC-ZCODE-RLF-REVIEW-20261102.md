# MC-ZCODE-RLF-REVIEW-20261102

Owner: actual ZCode (ZCode Desktop, model account:zai-start-plan/GLM-5.3) acting as REVIEW-ONLY independent reviewer per `docs/implementation/handoffs/MC-ZCODE-RLF-REVIEW-20261102-PROMPT.md`. Status REVIEW_RETURNED_CHANGES_REQUIRED (proposed; completion is the PO's call). Priority P1.

## Role disclosure (material)

This session is the same ZCode product as the implementing session AND shares conversation context with it — the prompt's "fresh non-author session" condition is NOT met in the strict sense. The PO delivered the dispatch here anyway; this review therefore reviews pinned bytes against the contract with fresh methodology, but the authorship-overlap limitation is recorded prominently and does NOT preempt a second independent reviewer (OpenCode or other) if the PO routes one. Every verdict below is source/runtime evidence based, not recollection.

## Baseline

- Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; HEAD `7bf198c103476f490ebbdf58b1bd563d0bba8a61` (implementation base; work is an uncommitted dirty tree, 89 porcelain paths at review start).
- Changed-file manifest: `docs/testing/zcode-rlf-review-20261102-r1/changed-files.txt`; sha256 pin at review start: `drift-manifest.txt` (66 implementation files hashed). Re-verification at review end is mandatory before any verdict stands.
- Author namespace (claims to verify): `docs/testing/zcode-remaining-local-features-20261102-r1/`. Review outputs (mine): `docs/testing/zcode-rlf-review-20261102-r1/`.

## Skills (§4) — availability recorded honestly

Named by the prompt; availability in this environment:
- LOADED (exist, one per surface): `accessibility` (a11y/keyboard/aria claims in the diff), `vercel-react-best-practices` (React/Next source pass), `postgresql` (migrations/grants/indexes pass), `supabase-postgres-best-practices` (pooler/grant specifics if reached).
- UNAVAILABLE in this environment (recorded, not substituted): `review`, `plan-eng-review`, `go-skills-router`, `go-code-review`, `go-database`, `api-designer`, `api-security-auth-pattern`, `cso`, `vitest-skill`, `test-coverage`, `root-cause-tracing`. Their review surfaces were covered by manual methodology against the contract text; no skill was invented or renamed.

## Findings index

- RLF-REV-04-02 P1 — saved_views DELETE missing from mc_runtime least-privilege grants; B1 empirical probes are a fixed list (CI-green/production-red).
- RLF-REV-04-01 P2 — duplicate saved-view name → unmapped 23505 → 500 (no typed rejection, no test).
- RLF-REV-05-01 P2 — duplicate playbook (workspace,name) → same 500 class.
- RLF-REV-06-01 P2 — GetIntake mustList swallows store errors → 503-class failure reads as uniform 404.
- RLF-REV-07-01 P2 — guidance duplicate-title behavior diverges between memory (rejects) and PostgreSQL (no constraint).
- RLF-REV-A11Y-01 P2 — unlocalized submit labels (EN-only "Delete", "Publish vN") + identical accessible names per row; vi-parity P0.
- RLF-REV-02-01 P3 — WorkContext asserts "no criteria" when the proof read failed (should read "unavailable").

## Verdicts

RLF-01 SOURCE_PASS · RLF-02 SOURCE_PASS_WITH_LIMITATIONS · RLF-03 SOURCE_PASS · RLF-04 SOURCE_CHANGES_REQUIRED · RLF-05 SOURCE_PASS_WITH_LIMITATIONS · RLF-06 SOURCE_PASS_WITH_LIMITATIONS · RLF-07 SOURCE_PASS_WITH_LIMITATIONS · RLF-08 SOURCE_PASS_WITH_LIMITATIONS.
Overall: REVIEW_RETURNED_CHANGES_REQUIRED. Details: docs/testing/zcode-rlf-review-20261102-r1/return.md

## Next status proposal

Rework list (6 findings: 1×P1 + 4×P2 + 1×P2-a11y; 1×P3 optional) → implementing session; then delta re-review; then PO routes final acceptance. Browser/IdP/human checks remain NOT_RUN (stack paused per §9). D-BF1 unchanged.

## Rework addendum (2026-11-03, PO-routed back to the implementing session)

PO instruction "fix các finding vừa tìm được" ended the review-only boundary for the rework. All 7 findings fixed (P1 + 5×P2 + P3): B1 grant class + positive probe; typed duplicate-name refusals (saved views create/update, playbooks); GetIntake error propagation; guidance parity via 0016 UNIQUE + typed pre-check; localized submit labels + per-row aria; WorkContext criteria-null honesty. Gates after rework: make check EXIT=0 (14 pkgs, -race, fixture 55471, stopped) + pnpm check EXIT=0 (920/12). Details: rework-addendum.md in the review namespace. The review verdict history stands; the rework deltas need delta re-review; final acceptance remains the PO's call.
