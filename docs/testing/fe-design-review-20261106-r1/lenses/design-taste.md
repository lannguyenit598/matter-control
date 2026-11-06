# Lens 1 — design-taste-frontend (taste lens)

**SELF-REVIEW / OWNER-CONFIRMATION** — per ADDENDUM-2 of MC-FE-DESIGN-REVIEW-20261106. This is NOT independent verification. Reviewer identity: actual ZCode (model GLM-5.3-Flash), waived non-author rule by explicit PO routing decision. A non-author confirmation pass (OpenDesign or OpenCode) is required before any of this gates anything.

- Base bytes: `41098a4d8690a1f3ce3864ace50fc20ca1221caa` (isolated worktree `/private/tmp/mc-fe-design-review-20261106/wt-41098a4d`, clean at pin; shared checkout HEAD had moved to `26680dc1` — not reviewed).
- Method: Storybook 10.6.3 served from the worktree at `127.0.0.1:6006`; all **72 stories** captured (1440×900, system Chrome via Playwright `channel:'chrome'`) + 5 forced-dark (`globals=theme:dark`) → `evidence/screens/lens1-design-taste/`. App IdP-free surfaces (6, cookie `ui-locale=vi`) → `evidence/screens/lens1-design-taste/app/`. Curated visual reads: 12 captures. Instrumented: `inspect.mjs --app` on `templates-dashboardtemplate--liquid-workbench` and `http://127.0.0.1:3100/matters` → `evidence/taste-inspect/{dashboard-story,app-matters}/`.
- Anchor policy: reviewed against §2 approved anchors (Solid Glass intent, D-3, ruled dimensions, rejected directions). Taste house rules that conflict with PO-adjudicated anchors (e.g. "no glass/backdrop blur", "no violet") are **anchor-superseded** and are not findings; only violations OF the anchors are.

## What the lens saw (keep / refine / reject per 2026-11-01 precedent)

**KEEP** (verified in captures):
- Honest product voice at t=0 in vi: `Hồ sơ`, `Không gian làm việc`, `Việc của tôi`, honest fail copy ("Không có gì hiển thị ở đây là một kết quả.") — `app/matters-vi.png`, `app/my-actions-vi.png`.
- Single near-black/inverted primary per screen; colour reserved for status; pale tint pills (`feedback--alerts`, `datatable--default`); hairline row rules, no zebra; right-side action cluster restrained (`Tập trung`, `Tìm kiếm ⌘K`, theme toggle).
- Dark discipline: neutral dark ground, rims not saturation, **inverted white primary** (`--liquid-workbench-dark`, `button--glass-on-backdrop-dark`).
- Fail-closed blocks keep H1/breadcrumb/tabs context + Retry (`ReadFailure` visible on `/matters`, `/my-actions`) — the P-04 fix renders.
- State coverage as stories: search-picker slow/failed/unavailable/no-match/permission-lost/with-error; button loading/disabled; datetime error states.

**REFINE** (findings below).

**REJECT**: none — no rejected direction (glass-everywhere, radius-32, rainbow, overshoot, 58px titles) re-appeared; observed glass is confined to panes/overlays with near-opaque light faces and neutral dark (anchor-conformant in all 6 app captures + story set).

## Findings (taste lens)

All findings carry the **SELF-REVIEW** label: surfaced by the author of these surfaces, owner-confirmation only.

- **UX-R1-01 (P2, taste)** — Fail/empty canvas void: 39–40% of the first screen is one empty block below the ReadFailure card on app pages (1200×420 @ 240,480 measured) and below the template table (1440×360 @ 0,540). Defensible once as "the screen's one rest"; measured twice = refinement. Proposal: close the void (vertically center the fail card at this canvas height, or add one secondary context line/link under the card). Surface: `app/(app)/matters/page.tsx` fail branch + `components/templates/dashboard-template.stories.tsx` fixture. Evidence: `taste-inspect/app-matters/report.json` (`hero-void`), `taste-inspect/dashboard-story/report.json`. Effort S. LANE-A. Own-work: yes (fix-wave authored ReadFailure; ZCode authored template fixture).
- **UX-R1-02 (P3, taste)** — Liquid fixture panel borders read dark: `#57606d on #f1f2f5` (5.69:1) on 5 panels (measured). Whisper-border rule wants 1.1–1.3:1; token set has `--workbench-border #dfe3e9` / `--glass-edge` (12% alpha). Story-fixture scope (not observed on real app pages, whose borders render whisper-light). Proposal: align liquid-variant fixture borders to tokens. Surface: `dashboard-template.stories.tsx` fixture + glass CSS. Evidence: `taste-inspect/dashboard-story/report.json` (`heavy-borders`). Effort S. LANE-A. Own-work: yes.
- **UX-R1-03 (P3, taste)** — Panel shadows slightly heavy: `rgba(38,44,57,0.1) 0 8px 20px/-12px` ×5 (10% alpha vs the ≤8% house ceiling). Anchor nuance: Solid Glass "depth is thickness" (panel < card < popover) makes float shadows part of the material, and these read as gentle in renders — defend-or-tune, not a violation. Proposal: optionally step to 8% alpha. Surface: glass/workbench CSS shadows. Evidence: `taste-inspect/dashboard-story/report.json` (`heavy-shadow`). Effort S. LANE-A. Own-work: yes (Solid Glass Phase C).
- **UX-R1-04 (P3, taste)** — Story fixtures use generic placeholder content ("Acme Admin", "Page title", "Page description", "No users found", identical "Operational truth, in context." ×3). Not product copy, but it degrades Storybook's role as the design-review surface (reviewers see template furniture instead of product voice; D-3 terms unused in fixtures). Proposal: fixture copy sweep to product voice + D-3 terms. Surface: `*.stories.tsx`. Evidence: `templates-dashboardtemplate--default.png`, `organisms-datatable--empty.png`. Effort S–M. LANE-A. Own-work: yes.
- **UX-R1-05 (INFO, anchor-superseded)** — Inspector `button-fx`/`gradient` FAILs on `.glass-button`: face fill is flat (`bg-primary`, `button.tsx:15`); the flagged `linear-gradient(165deg, 10% white → transparent 58%)` is the `liquid-action-sheen` edge finish over the face — the Solid Glass "finish is at the edge (rim + hairline + shadow, never a face gradient)" rule (`globals.css:50-55`) holds at source. Disposition: anchor-superseded, no change. Evidence: `taste-inspect/app-matters/report.json`, `button.tsx`. Own-work: yes — explicitly recorded as checked.
- **UX-R1-06 (INFO, measurement discrepancy)** — Inspector `no-title`/`headings 0` on `/matters` contradicts a direct DOM probe (`document.querySelector('h1')` → "Hồ sơ", `app/_results.json`); the template story does render its title from a fixture slot whose heading semantics were not verified in-story. Semantic-heading audit belongs to MC-FE-NEXTJS-REVIEW-20261106 — cross-referenced, not duplicated here.

## Capture gaps recorded
- `organisms-bottomnav--vietnamese-labels` renders empty at 1440×900 (mobile-only component) — re-capture at 390px in the guideline pass (Pass 4).
- `organisms-commandpalette--default` shows the closed trigger only; open-state capture is an interaction task (Pass 5).
- `atoms-badge--variants` logged one console 404 (resource, non-fatal; story rendered) — noted for the quality lens.
- Production-build gate (`next build && next start`) NOT_RUN (shared-.next/checkout rule + round budget); all renders are dev-server evidence (inspector `dev-server` WARN). Marked in report limitations.
