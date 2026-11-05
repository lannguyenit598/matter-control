# MC-ZCODE-P1-FIX-WAVE-2-20261101 — takeover completion

- Current owner: actual Local Codex, under the PO's 2026-11-01 “tiếp nhận và hoàn tất”. Preserve actual ZCode authorship of G1/G4/G5/G6 commits and G2/G3/G7 precursor work.
- Base/head: `codex/unified-project-flow`, `64b9e0315e210953d7a7eaeacc0643b269a14ad9` plus existing dirty work. No competing writer is assigned by the PO. Intake captured exact source pins before edits.
- Priority: P1; status **IN_REVIEW_WITH_VERIFICATION_BLOCKERS / WAITING_COMMIT_AUTHORIZATION**. No DONE or CLOSED_VERIFIED.
- Requirements/findings: G1 OV-F1-01, G2 OV-R8-01, G3 OV-F1-02, G4 OV-F1-03, G5 OV-R12-01, G6 OV-F1-04, G7 F8/P-09. Approved D-9 purposes, independent proof/state axes and command recovery unchanged.
- Inputs: original Wave2 prompt, OpenCode leg-2 return/findings, current findings register, OpenDesign guard copy, actual primary source and four existing fix-unit commits.
- Scope: complete existing fixes, wire shell action announcements, reconcile stale regression copy/format, red→green reproduction, PG/race/frontend/build gates, evidence, current findings and reviewer handoff. No new business features, dependency, provider, DB policy or deployment change.
- Protected: existing OpenCode verify-wave namespace, QA resources, manual :3000/:8081, IdP :8080, all unrelated dirty UI work. No primary runtime refresh in this assignment.
- Dependencies: installed Go/Node tooling and a new owned PostgreSQL18.6 fixture; official browser availability for actual G1 Filing and G7 screen-reader smoke.
- Outputs: source/test candidate, staged16-path Wave2-only patch (layout contains only announcer import/wrapper), findings update and evidence under docs/testing/mc-p1-fix-wave-2-20261101-r1/.
- Acceptance: each G-unit has new or retained source fix and fresh test evidence; status distinguishes author verification from nonauthor acceptance, actual UI/screen-reader proof from DOM simulation, combined dirty source from staged-only bytes, and synthetic local from release/cloud claims.
- Verification: red→green G1..G7; full backend make check with dedicated PG; frontend check; Webpack/Turbopack/Worker/Storybook builds; durable BFF14/14; release-preflight real-main/CLI tests including tracked files. Exact final counts/receipts and staged-only checks are in return.md.
- Independent reviewer: OpenCode, prepared not dispatched. No provider payload sent in this takeover.
- Commit gate: automatic approval review rejected ordinary git commit because explicit commit authority was not established for this takeover. No history mutation, workaround, hook bypass or human-terminal workaround. Staging remains for review; explicit PO authorization required before another commit attempt.
- Remaining gates: G1 browser Filing submission and G7 real assistive-technology smoke blocked because official browser is disabled in Work settings; nonauthor review pending. Fixture stopped/retained; no existing DB/volume removed.
