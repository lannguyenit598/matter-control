# MC-FE-FIXWAVE2-20261107 — Return (batch 2, W1–W9)

- Task ID: MC-FE-FIXWAVE2-20261107 · Executor: **actual ZCode** (PO reroute from Antigravity, recorded per dispatch; same as batch 1).
- Base: pre-flight HEAD `4068298b` on `develop` (batch-1 ended `c03368a2`; OpenCode confirmations landed as docs commits in between — backend bytes unchanged). Scope sources: D-23 §Disposition (Option C adopted by PO, amended V-03 wording carried verbatim), backlog UX-B-02..08, batch-1 W5 D-3 deviation flag.
- Status reached: **AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW** — no DONE, no closure of review findings.

## Acceptance per work item

### W1 — D-23-C implementation → **DONE, with a material measurement finding (no darkening applied)**
The amended V-03 criterion targets the field **boundary indicator**. Measuring the field's ACTUAL boundary token — the `--input` border rendered on `[data-slot='dialog-panel']` fields (`globals.css` field layer) — with the batch-1 compositing method: **3.646 light / 5.676 dark vs panel composite; 3.842 / 5.445 vs popover composite — ≥3:1 in both themes ALREADY** (`evidence/field-boundary-measure.txt`). The D-23 figures (1.218/1.635) measured `--glass-edge`, the pane decoration, which is not on the field boundary. Therefore the Option-C goal (boundary ≥3:1) is already met by the existing token; **no darkening was applied** (darkening a passing token = unneeded visual change). The amended V-03 wording is carried **verbatim** into the field-layer block comment + the `--field-face` token comment. **Flagged for the confirmation pass**: the disposition's "darken" instruction was premised on the boundary failing; the measurement shows it passing — the confirmation reviewer should confirm the no-op reading (process note: this is implementation of C's goal, not re-adjudication). On-dialog final measure still awaits walkthrough env D-1(b).

### W2 — D-3 deviation labels → **DONE (27 strings)**
All "Thủ tục"/"thủ tục" user-visible strings mapped to the D-3 FINAL term **"Hồ sơ khai"** (matter-tabs VI map, filings H1s/descriptions/buttons/empty-states/notices, control-room stats, quick-search + data-transfer kind labels, read-failure subject, body copy, metadata titles). Two sentences containing the Approval term corrected in passing ("phê duyệt" → "chấp thuận", authority context — D-3 §2.1). **Titles follow the same pageMetadata mechanism** — probe: vi titles now `Hồ sơ khai · MatterControl`, `Hồ sơ khai mới · MatterControl` (`evidence/w2-*-vi.png`, probe JSON). No test asserted the old strings (suite green).
- **Guard outcome**: "Bảng điều khoản" (term sheet) is NOT covered by terminology-final → **kept**, added to *proposed terms for OpenDesign adjudication* (with a suggested D-3-style entry: Term sheet = "Bảng điều khoản").
- Residue noted (out of scope): 2 further "Phê duyệt" hits — `proof-panel.tsx:349` (authority step, likely should be "Chấp thuận" — flag), `add-work-dialog.tsx:56` (internal HĐT approval — D-3-correct as-is).

### W3 — UX-B-02 fixture borders → **REFUTED by measurement (no change)**
Computed-style probe of the liquid-workbench story (`evidence/w3-border-probe.json`): the flagged panels' borders render `rgba(86,94,111,0.22)` = `--pane-edge`; the taste-inspector's "5.69:1" measured the **uncomposited** rgba value. Alpha-composited over the card surface the border is ≈rgb(216,218,221) → **≈1.35:1 — already whisper**. Finding refuted; no code change.

### W4 — UX-B-03 shadows → **DONE (tune, with dark defended)**
`--pane-shadow` light `rgb(38 44 57 / 0.1)` → **`rgb(38 44 57 / 0.08)`** (under the ≤8% ceiling; blur/spread carry the depth — not visibly flattening). Dark `rgb(0 0 0 / 0.24)` **defended** in the token comment (studied dark-surface pattern on near-black ground). Decision recorded verbatim in the token comment (pane-workbench.css:12-17).

### W5 — UX-B-04 fixture voice → **DONE**
Dashboard-template fixture: brand `MatterControl`, destinations `My work / Matters / Workspaces`, `My work` header + honest description, distinct per-card lines (no more "Acme Admin"/"Page title"/repeated placeholder). Product-code copy untouched. Capture `evidence/w5-dashboard-default-after.png`.

### W6 — UX-B-05 form story width → **DONE**
FormField + Select stories render in `max-w-[420px]` decorators. Capture `evidence/w6-formfield-with-error-after.png` (field ≈420px), `w6-select-invalid-after.png`.

### W7 — UX-B-06 inline-edit affordance → **DONE**
Read-mode text span no longer `flex-1` → the pencil hugs the text end. No hover-hide (touch/keyboard reachability unchanged; aria-label/behaviour identical). Suite green (intent-attempt/drafts tests cover the component paths).

### W8 — UX-B-07 error precedence → **DONE**
Error line gains `CircleAlert` icon (aria-hidden) on top of the existing `font-medium text-destructive`; hint unchanged. Visible in `w6-formfield-with-error-after.png`. form-field tests green.

### W9 — UX-B-08 4px spacing grid → **DONE (41 normalised, 0 exceptions)**
sloplint re-run at HEAD: 39 off-scale NOTEs in globals.css + 2 in pane-workbench.css → all normalised round-half-up to the 4px grid (every value within ±2px of the original). **Post-normalisation: 0 NOTE 24b in both files**; no `4px-exception` comments needed. Pre-existing FAIL/WARN items (calendar-popover width, selection-control disabled/contrast, glass-blur warns, sticky) are out of W9 scope and untouched.

## Gates
`pnpm check` **exit 0** (after moving my own temp probe script out of the frontend root — same self-inflicted format:check miss as batch 1, recorded): typegen+tsc ✓ · eslint ✓ · prettier ✓ · **vitest 954 passed | 12 skipped (125 files) — baseline held, no regressions** (matter-tabs 12, form-field 2, select 8, read-failure/filings pages all green) · agents:check ✓. Shared-.next: no `next build` run; a FOREIGN `next dev` (PID 70253, another session) came live on :3000 mid-wave — Next 16 blocks a second dev in the same dir, so the W2 label probe ran as a CLIENT against that server (same checkout bytes); my own servers (:3100/:6006) were started and stopped by me only.

## Commits (task-scoped; item IDs in bodies)
`00707d23` W1+W9 (globals.css carries both — noted deviation from the "W1 alone" suggestion) · `721bab57` W2 · `c5020566` W4+W9 (pane-workbench.css carries both) · `ce2858a4` W5+W6 · `48a9568d` W7+W8 · register/evidence commit follows.

## Tests run / NOT_RUN
- Run: full unit/component suite (954), vi title/label probe (:3000), W1 boundary math, W3 computed-border probe, Storybook after-captures, sloplint re-runs.
- NOT_RUN: production build/e2e; populated-dialog on-dialog contrast (D-1(b)); rendered matter-tabs labels with a real matter id (fail-closed probe renders no tabs for a bogus id — labels verified at source + via the green suite); OpenCode batch-2 return (PREPARED_NOT_DISPATCHED — no P0/P1 candidates to note).

## Risks
- W1 no-op reading must survive the non-author confirmation pass (the disposition text says "darken"; the measurement says the target already passes — documented, not silently applied).
- W2 changes user-visible vi copy broadly (27 strings) — vi screenshot diffs will shift; EN unchanged; no tests asserted old strings.
- W9 shifts spacing ±2px across workbench surfaces — visual regressions possible but bounded; suite + story render checks green.
- Concurrent-session note: foreign dev server on :3000 (untouched); my evidence dir `docs/testing/mc-fe-fixwave2-20261107-r1/` was pre-created untracked (used as-is).

## Skipped + remaining risk
- Skipped: batch-3 (FE Next.js review findings — its return is still pending intake; nothing pre-empted), rendered matter-tab label check with a populated matter, on-dialog contrast, prod build/e2e, "Phê duyệt" residue sweep (2 hits recorded).
- Remaining risk: D-1(b)-gated final contrast measure; term-sheet vocabulary pending OpenDesign; W1 no-op reading pending confirmation.
- Concurrent-session note (transparency): the evidence directory had been pre-created and partially pre-populated BEFORE this wave started — `evidence/before-*.png` (before-captures for W1/W5/W6/W7/W8) and `commands/off-grid-scan.mjs` were authored by another session, swept into the docs commit, and reviewed as consistent with the wave scope; they were not generated by the executes listed above and should be treated as corroborating material from that session.
