# MC-FE-FIXWAVE-20261107 — Return (batch 1, W1–W6)

- Task ID: MC-FE-FIXWAVE-20261107 · Executor: **actual ZCode** (PO direct instruction 2026-11-07; frontend execution formally Antigravity under MC-002-INTA-FE-VALIDATION — this dispatch is the PO's reroute, recorded here per dispatch §0).
- Base: pin `5a00dbc1` on `develop` — **matched actual HEAD at pre-flight, no re-pin**. Anchor files re-verified at HEAD (`globals.css:76-77,150-151` field-face; `layout.tsx`→`root-shell.tsx` D-2 split; `workspaces/page.tsx:15`; matter-tabs VI map). Scope source: MC-FE-DESIGN-REVIEW-20261106 backlog (PROXY-confirmed CONFIRMED_WITH_NOTES at 5a00dbc1).
- Status target reached: **AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW** — no DONE, no closure of design-review findings (that needs the OpenCode confirmation pass).

## Acceptance per work item

### W1 — UX-B-11 field-face ≥3:1 → **D-23 decision request (guard fired; no code change)**
Exact compositing math shows the literal criterion is infeasible inside the Solid Glass intent: a 3:1-distinct face needs ≈59L\* mid-grey (light) / ≈52L\* inverted field (dark; darker path mathematically impossible), vs the near-opaque-light/dark-material tokens — and would push the field's own text toward the AA floor (light). Current rim (1.062/1.246) and edge (1.218/1.635) are also <3:1 vs the glass composite. Stopped per dispatch guard; D-23 written with options A (literal, rejected by guard), B (ratify rim-only), C (recommended: amend criterion to the WCAG 1.4.11 boundary framing + strengthen field edge in field contexts — needs PO ratification). See [D-23](D-23-field-face-contrast.md) + `evidence/fieldface-math-output.txt`. Known limitation: on-dialog measurement still awaits walkthrough env D-1(b).

### W2 — UX-B-01 fail/empty canvas void → **DONE**
`ReadFailure` root wrapper centres primary (non-partial) failures in the remaining viewport (`min-h-[calc(100dvh-8rem)] justify-center`, read-failure.tsx:66-77); `partial` section denials stay inline by design. Template story fixture gains the workbench's secondary bands (Waiting on / Recent changes) closing the 40% void. **Measured**: content-bottom void 430px/**47.8% → 177px/19.7%** (`before/probe.json` vs `after/probe.json`); inspector hero-void 39-40% → 35% (largest-block metric; centre splits the block). Before-captures taken from a stash of exactly these changes at the same pin (`evidence/before/`), after-captures post-restore (`evidence/after/`); 3 template stories render green post-change (`changed-stories-render.json`, 0 console errors).

### W3 — UX-B-09 theme-color meta → **DONE**
`<meta name="theme-color">` emitted in root-shell head; synced by the SAME mechanism that drives `data-theme` — `themeInitScript` re-sets it pre-paint (saved-choice/OS path) and `toggleTheme` updates it on toggle (`lib/theme.ts` THEME_COLORS: light `#fafbfc` = `--workbench-background`, dark `#0d0d10` = resolved `--background` oklch(0.16 0.005 285.8) — hex pre-computed, no new mechanism). **Probe**: light meta `#fafbfc`; dark (localStorage theme=dark + reload) meta `#0d0d10` ✓ (`after/probe.json`).

### W4 — UX-B-10 touch-action → **DONE**
One globals.css layer: `button, a, summary, .control-target, input, select, textarea { touch-action: manipulation }` — scoped to controls (page pinch/pan untouched). **Probe**: computed `touch-action` on button/link = `manipulation` (before: `auto`).

### W5 — P-08 tab titles follow locale → **DONE (21 files)**
New `lib/page-metadata.ts` (`pageMetadata(en, vi)` / `localizedTitle`) reading the **same D-2 `uiLocale()` cookie** as page content — no parallel locale system. Converted 13 static metadata exports → `generateMetadata` + 4 dynamic id-page titles + login. Vi strings reuse each surface's shipped label (H1 / `matter-tabs.tsx` VI map: Hồ sơ, Việc của tôi, Lịch của tôi, Cần xác minh, Không gian làm việc, Công việc, Tài liệu, Bảng điều khoản, Rà soát, Thủ tục, Kế hoạch, Lịch, Phòng điều hành, Dữ liệu, Lịch sử, Yêu cầu, Thủ tục mới, Đăng nhập) — title never contradicts the on-screen label (P-01 precedent). **Probe**: vi cookie → `Hồ sơ · MatterControl` at t=0; en (no cookie) → `Matters · MatterControl` unchanged. New test `page-metadata.test.ts` (3 tests, mock next/headers per auth-routes.test.ts pattern) green.
Note recorded: shipped filings/term-sheet vi labels ("Thủ tục", "Bảng điều khoản") diverge from terminology-final.md ("Hồ sơ khai") — titles match the shipped labels; the D-3 divergence itself is pre-existing and NOT re-adjudicated here (flagged for intake if the PO wants a terminology sweep).

### W6 — UX-B-12 badge-story 404 → **FIXED (origin identified, trivial LANE-A)**
Reproduction with URL capture: the 404 is **`/favicon.ico` on the Storybook dev server** (`.storybook` staticDirs pointed only at the empty `public/`; no favicon served; Chrome fetches it once per origin-session — hence one 404 per capture round on whichever story triggered it, and the app's Next favicon at `src/app/favicon.ico` is unreachable to Storybook). Fix: Storybook-scoped static dir `.storybook/static/favicon.ico` (copy of the app favicon) + `staticDirs: ['../public', './static']` in main.ts. **Verified**: re-run repro → 0 404s; 5 story renders clean.

## Gates
- `pnpm check` **exit 0**: next typegen + tsc ✓ · eslint 0 errors ✓ · prettier ✓ · vitest **954 passed | 12 skipped (125 files)** incl. the new page-metadata tests ✓ · agents:check ✓. Shared-.next rule honoured: the :3100 dev server was stopped before `next typegen`; Storybook (:6006, Vite cache, separate from app .next) used for story render checks.
- Storybook render: changed-story set 5/5 green; full 72-story sweep NOT_RUN this round (was 72/72 at pin in the design review).

## Tests run / NOT_RUN
- Run: unit/component suite (954), changed-story render check, locale/theme/touch-action probes, 404 repro (before+after), void measurements, W1 math.
- NOT_RUN: production build / built-CSS guard re-run; e2e (`pnpm test:e2e` — not exercised by these items' acceptance); full 72-story sweep; populated-dialog field-face measurement (D-1(b) dependency); final contrast on-dialog measure.

## Risks
- W5 makes all converted routes' titles depend on the ui-locale cookie at request time — routes were already dynamic (root layout awaits `uiLocale()`), so no new dynamicity; prerendered-EN titles for crawlers become locale-echoed (acceptable for this product; no SEO claims).
- W2 centering changes the whole-page failure silhouette — page tests that assert failure content still pass (954 green); visual change is confined to failure states + story fixture.
- W6 touches Storybook config only (no app impact).
- D-23 (W1) leaves P-10/V-03 open pending PO decision — no silent improvisation.

## Commits (task-scoped, item IDs in bodies)
Per-commit base/head + hashes recorded in `commands/commands.log` as they land (6 commits: W1 docs · W2 · W3+W4 · W5 · W6 · register+evidence).

## Skipped + remaining risk
- Skipped per dispatch: batch-2 items (UX-B-02..08), UX-B-13 (RUNTIME_ARTIFACT — dialog untouched), any lens re-work. W1 implementation skipped by guard → D-23.
- Remaining risk: D-23 undecided (P-10/V-03 stay open); on-dialog contrast + populated-path UX still gated on walkthrough env; titles for dynamic id-pages show ids until the read-model name (P-08's known NEEDS_READ_MODEL); prettier/eslint territory outside my paths untouched.
