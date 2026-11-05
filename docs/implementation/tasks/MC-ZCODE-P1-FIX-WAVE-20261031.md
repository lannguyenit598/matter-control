# MC-ZCODE-P1-FIX-WAVE-20261031

- **Task ID:** MC-ZCODE-P1-FIX-WAVE-20261031 · **Owner:** actual ZCode (PO: "zcode thực hiện hết", prompt docs/implementation/handoffs/MC-ZCODE-P1-FIX-WAVE-20261031-PROMPT.md) · **Priority:** P1 · **Status:** IN_REVIEW
- **Requirement IDs:** Z-F-01, Z-F-02, Z-F-03 (BA r2), UX-L-01, UX-L-02, UX-L-04, UX-L-05, UX-L-06 (UX audit r1) · decisions DEC-20261031-01..04 (D-9, D-2, D-1(b) acknowledged)
- **Scope:** close 3×P2 backend gaps + FE Blocker/Major set on the P0 candidate; NO deploy/cloud/IdP, no push, no :3000/:8080 touch, no positioning, no self-verification.
- **Base:** 0de3e5d → baseline 4b6a65f (committed this wave, DEC-20261031-01) → coordinator 5e932bd (docs, mid-wave). Wave deltas = working tree + per-fix patches in docs/testing/mc-p1-fix-wave-20261031-r1/.
- **Inputs:** workboard-findings.md (register), coordination plan CO-03/06..12, BA r2 findings + repros, UX audit findings + probe recipe, host tooling quirks (Mimosa hook, goose, no shared-.next).
- **Outputs:** per-fix patches f1/f2/f4/f5/f6, migration 0011, D-9 doc amendments, f4 design note, Storybook navigation mock + GlassSurface stories, probe script + log, findings-update.md, this record.
- **Acceptance criteria & results:**
  - Z-F-01: outcome-only proof-required filing refused at PACKAGE_PREPARATION — ✓ (red→green, test encodes the r2 repro).
  - Z-F-02: proof-required submission requires declared+satisfied SIGNATURE criteria; OWNER waivers intact — ✓.
  - Z-F-03: outcomeVerification on grid + control-room rows, FE per-axis — ✓.
  - UX-L-01: Workspaces title/H1 — ✓. UX-L-02: vi at t=0, lang matches, no hydration flip — ✓ probe 22/22 on prod build. UX-L-04/05: literals localized, failure keeps h1/breadcrumb — ✓. UX-L-06: Storybook builds, 60 stories, no router crash at module level — ✓.
  - Gates: backend make check exit 0 (PG+race, dedicated container, deleted after); FE 830/12/0 + durable 14/14 + 3 builds exit 0; walkthrough SuiteGW 8/8.
- **Tests run:** listed above. **Tests NOT run:** browser-rendered UX + contrast.js (no browser), pnpm preflight (CI/verify-wave), provider/IdP cases.
- **Reviewer:** OpenCode (verify wave CO-13/14) — mandatory; this return is not a review.
- **Evidence:** docs/testing/mc-p1-fix-wave-20261031-r1/ (return.md, findings-update.md, source-manifest.json + .sha256, per-fix patches, commands/ incl. the Mimosa BLOCKED log).
- **Completion evidence status:** all fix-units have red→green receipts + gate exits; commit of the deltas BLOCKED by the Mimosa git-gate (project-wide scan of pre-existing code, no disposition interface — not bypassed; durable patches + tree per contingency).
