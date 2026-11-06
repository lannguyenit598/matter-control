# MC-FE-DESIGN-CONFIRM-20261107 — Confirmation pass on MC-FE-DESIGN-REVIEW-20261106 r1

**CONFIRMATION_REVIEW (PROXY — fresh-context ZCode subagent)**

- Date: 2026-11-07
- Reviewer identity: fresh-context ZCode subagent spawned by the coordinator session per ADDENDUM-3 (PO-authorized proxy execution). No conversation history; authored none of the reviewed surfaces — non-author by construction. Mode: REVIEW_ONLY; the only file written is this `confirmation.md`. No commits, no installs, no code edits.
- HEAD at start of this pass (`git rev-parse HEAD`, exit 0): **`7d3dd2f1f37d4a115bd87f892d0984b57f60ce84`** (branch `develop`). Working tree: only the 2 expected untracked handoff prompt files (`MC-BE-FIXWAVE-20261106-ZCODE-PROMPT.md`, `MC-FE-NEXTJS-REVIEW-20261106-PROMPT.md`).
- Bytes basis: reviewed artifact is pin **`41098a4d`**. Pre-flight `git diff --stat 41098a4d..HEAD -- apps/frontend` → 3 files changed (2 `route.ts` under `src/app/api/matters/[matterId]/documents/[documentId]/(versions/)`, `api/matters/[matterId]/export/route.ts`) — **no design-system or reviewed-frontend file drifted**. The 5 UX-R1-25-relevant files (`dialog.tsx`, `command-palette.tsx`, `quick-search.tsx`, both stories) are byte-identical pin↔HEAD (`git diff --stat` on exactly those paths → empty). §3/§4 spot-checks bind to `41098a4d` via `git show 41098a4d:<path>`; the §2 live repro ran against current HEAD `7d3dd2f1` (byte-equivalent for the components involved).
- Environment: Node v24.22.1 (host), system Chrome via Playwright `channel:'chrome'`, `@playwright/test` resolved from existing `apps/frontend/node_modules` (nothing installed). All shell commands prefixed `rtk`; one `rtk git grep | head` pipeline terminated benignly by SIGPIPE (signal 13) — output already delivered, no hook refusal encountered.

## §1 Evidence integrity — PASS

Directory `docs/testing/fe-design-review-20261106-r1/` contents: `report.md`, `backlog.md`, `RETURN-CONFLICT-OF-INTEREST.md`, `lenses/` (exactly 5: `design-taste.md`, `impeccable.md`, `hallmark.md`, `guidelines.md`, `design-qa.md`), `commands/commands.log`, `evidence/` (267 files recursive: `screens/**` + `contrast-results-r1.json` + `taste-inspect/**`; report §6 claims "≈240 PNG/JSON" — consistent within rounding).

- SELF-REVIEW label present: `report.md` §0 (line 3, ×3 occurrences), `backlog.md` header (line 3, ×1), each lens file header (×2 in all 5). `grep -c SELF-REVIEW` → report 3 / backlog 1 / lenses 2,2,2,2,2.
- Backlog: exactly 13 UX-B rows (`UX-B-01`…`UX-B-13`, table lines 7–19); Lane column = `A` in every row; `LANE-B` appears exactly once, in the header sentence "no LANE-B items are proposed" — 0 LANE-B items.
- Spot-check (a) Storybook 72/72 — MATCHED. `commands/commands.log:16`: "`pnpm -C <wt>/apps/frontend run storybook --ci` → Storybook 10.6.3 READY on 127.0.0.1:6006 (manager 127 ms / preview 1.31 s; **72/72 stories render**; recurring console 404 in `atoms-badge--variants` only)"; corroborated by `report.md:8` and `report.md:45`.
- Spot-check (b) contrast 44/48 — MATCHED. `evidence/contrast-results-r1.json`: `grep -o '"result": "..."'` → **44 `"result": "PASS"`, 4 `"result": "FAIL"`, 48 total pairs** (22/24 × light/dark, per transcript `commands.log:25` and `report.md:50`).

## §2 UX-R1-25 independent repro — determination: RUNTIME_ARTIFACT

Claim under test: "Escape does not close the Quick-search dialog after 2 GUI attempts, despite `onCancel` present at `apps/frontend/src/components/molecules/dialog.tsx:67-70`."

**(a) Static trace (pin bytes, `git show 41098a4d:…`):**
- `dialog.tsx:67-70` verified exactly: `onCancel={(event) => { event.preventDefault(); onOpenChange(false) }}` (line 67 opens the handler, 70 closes it), plus `onClose` (74-77) bumping a `closeCount` reducer so the `[open, closeCount]` effect re-syncs if the browser force-closes on a repeated (non-cancelable) Escape. The comment block documents the veto-then-resync design.
- Consumer chain: `CommandPalette` (`organisms/command-palette.tsx`) owns `const [open, setOpen] = useState(false)` and passes `open` / `onOpenChange={setOpen}` verbatim to `Dialog`; `QuickSearch` (`features/search/components/quick-search.tsx`) renders `CommandPalette` without touching open state.
- Escape interception: none. `SearchBody`'s container `onKeyDown={navigate}` handles only Enter/ArrowDown/ArrowUp (each with `preventDefault`, no `stopPropagation`); `PaletteBody`'s `onQueryKey` handles only Enter/ArrowDown. No focus-trap library — the native `<dialog>` focus trap is used. **Hypothesis: the cancel→`setOpen(false)`→effect→`dialog.close()` chain is intact; Escape should close, so the 2 GUI failures point at the test runtime, not the component.**

**(b) Live repro (1 attempt of max 2; HEAD `7d3dd2f1`):**
- Preconditions: `lsof -i :3000` and `-i :6006` → both exit 1 (free); `git status --porcelain -- apps/frontend` → empty (clean); `apps/frontend/node_modules` exists. All green → live allowed.
- My own server only: `pnpm run storybook --ci` in `apps/frontend` on 6006 (background, killed by me after the run; `lsof` re-checked → both ports free again; frontend tree still clean).
- Script `/tmp/mc-fe-confirm-uxr125/escape-repro.mjs` (outside the repo) resolved `@playwright/test` from `apps/frontend/node_modules` via `createRequire`; launched system Chrome (`channel:'chrome'`, headless); opened story `Organisms/CommandPalette/Default` iframe URL; clicked the real trigger button; waited for `dialog[data-slot="dialog-panel"]`.
- Measured: `before` = `{ open: true, focusedTag: INPUT, focusedAutofocus: true }`; trusted `page.keyboard.press('Escape')`; after 800 ms `after` = `{ open: false }`; **`dialogClosedByEscape: true`**.
- Why Storybook suffices: the story mounts the unmodified `CommandPalette`+`Dialog` (byte-identical pin↔HEAD); the quick-search story renders only `SearchBody` (no Dialog), so the palette story is the correct surface; app-path differences ruled out statically in (a). Second live attempt unnecessary — attempt 1 was decisive.

**UX-R1-25 determination: RUNTIME_ARTIFACT — trusted-keyboard live repro closes the dialog (`open` true→false) and the static cancel chain is intact; the 2 failed GUI attempts match the run's own documented IAB limitation (it could not even click inside `showModal()` dialogs), so UX-B-13 resolves to "no wiring bug".**

## §3 Spot-check 3 owner dispositions — PASS (bytes: `git show 41098a4d:…`)

- **UX-L-01 CONFIRMED_FIXED — accurate.** `app/(app)/workspaces/page.tsx:21` = `title={<LocalizedText en="Workspaces" vi="Không gian làm việc" />}` (h1 source, exactly the report's cited line); line 25 description uses "hồ sơ" as the D-3 vi term for matters ("mở một hồ sơ của nó") — the Workspaces surface carries correct vi labels, not a leaked "Matters".
- **P-08 STILL_OPEN — accurate.** `workspaces/page.tsx:15` = `export const metadata: Metadata = { title: 'Workspaces' }` (EN literal, exactly the report's cited line); all sibling page metadata titles are EN literals (`git grep "metadata: Metadata = { title"` → 10+ EN hits); `root-shell.tsx:23` = `title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` }` → vi pages render EN tab titles ("Matters · MatterControl" pattern confirmed plausible from source).
- **Z-F guard copy — accurate, verbatim.** Approved copy source located in history (`28a205ee` pruned it from the pin lineage): `git show 151543b5:docs/testing/opendesign-ux-plan-review-20261101-r1/ux-copy-for-guards.md` (authored by OpenDesign 2026-11-01). `features/filings/components/filing-forms.tsx:282-283` (Z-F-01 inline validation) matches the approved EN+VI strings **character-for-character** ("Cannot submit — this filing requires supporting evidence…" / "Chưa thể nộp — hồ sơ khai này yêu cầu bằng chứng…"); Z-F-02 at :275-276 also matches verbatim.

## §4 Spot-check 2 backlog factual bases — B-09 PASS, B-12 PARTIAL (noted)

- **B-09 (theme-color claimed absent) — CONFIRMED.** `grep -rn "theme-color" apps/frontend/src apps/frontend/public` → exit 1, zero matches (also absent from `.storybook/`).
- **B-12 (badge story references a 404 resource) — occurrence confirmed, mechanism NOT confirmed.** The 404 is real: `commands.log:16` records "recurring console 404 in `atoms-badge--variants` only". But `atoms/badge.stories.tsx` and `atoms/badge.tsx` reference **no external resource** (grep for `url(`/`.png`/`.svg`/`.ico`/`favicon`/`manifest` → exit 1); the story imports only the cva-based `Badge`. `.storybook/{main,preview,navigation-mock}` and `apps/frontend/public/` show no asset refs either. The backlog's "Fix the 404 resource in the badge story" therefore over-attributes: the 404's origin cannot be identified from story source (likely Storybook-internal, e.g. `/favicon.ico` with an empty `public/`). UX-B-12 stays valid as Storybook-hygiene work, but its factual basis needs re-wording before someone "fixes" a reference that does not exist.

## §5 Lane check — PASS

All 13 backlog rows carry Lane = `A` and each proposal stays inside approved space: existing tokens only (B-02 targets `--workbench-border`/`--glass-edge`; B-03/B-11 are tune-or-ratify of existing Solid Glass tokens with an explicit ratification path), D-3 terminology (B-04), approved plan items (B-08 = P-14 spacing adoption), hygiene additions (B-09/10/12), local component/story refinements (B-01/05/06/07), verification/bug-fix (B-13). `grep -in "rainbow|overshoot|58px|radius-32|glass-everywhere|…"` over `backlog.md` hits **only line 21**, the deliberate-exclusion statement itself. No adjudicated-REJECTED direction (glass-everywhere, radius-32-everywhere, rainbow accents, overshoot animations, 58px titles) is re-proposed.

## Verdict: CONFIRMED_WITH_NOTES

The r1 evidence base is intact, its two measured claims reproduce exactly, all 5 spot-checked dispositions/factual bases are accurate (4 fully; B-12's mechanism wording is the one discrepancy), and the single open discrepancy UX-R1-25 resolves to RUNTIME_ARTIFACT under independent repro. On this basis r1 results may gate with attribution "owner-confirmed + non-author-confirmed (this file)".

**What a PROXY confirmation does NOT establish:** This is not an external non-author product. The reviewer is a fresh-context ZCode subagent — (1) same model family as the self-review author (context-independence only, not vendor/model independence; instructions were authored by the coordinator session); (2) it verifies recorded evidence and one repro — it did not re-run the 5 lenses, so it cannot catch systematic capture-method errors shared across both sessions; (3) populated-runtime surfaces, production build, screen-reader correctness and the vi grep-sweep remain unverified exactly as r1 left them; (4) an **OpenCode/OpenDesign confirmation remains recommended before any release-level gate** cites these results (per ADDENDUM-3).

## Skipped + remaining risk

- **Skipped:** lens re-runs, prod build gate, screen-reader session, vi grep-sweep, populated runtime walkthrough, applying any backlog item, second live Escape attempt (attempt 1 decisive), in-app (dev-server) Escape test at full app session depth — covered by static trace of the identical app wiring. 2 live-repro-adjacent runs (Storybook on 6006) were started and stopped by this pass only; ports and the frontend tree verified clean afterwards.
- **Remaining risk:** B-12's 404 source is unidentified — whoever picks up UX-B-12 must first locate the actual requesting URL from a browser console capture, not "fix the story reference"; UX-B-13's backlog row should be updated to reflect the RUNTIME_ARTIFACT determination (verification done, no wiring fix needed); P-08/P-10 remain open as recorded; all populated-runtime and production-build limitations from r1 §7 carry over unchanged.
