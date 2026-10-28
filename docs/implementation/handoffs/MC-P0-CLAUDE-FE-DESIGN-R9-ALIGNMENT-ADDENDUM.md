# MatterControl — đồng bộ product frontend với Design R9

Addendum cho actual Claude Code đang tiếp tục `MC-P0-CLAUDE-FINISH-AFTER-ZCODE-20261028`. Đây là implementation instruction bổ sung vào **cùng assignment BE/API/FE**, không restart, không tạo writer mới hoặc bỏ backend để chỉ làm UI. Thực hiện sau khi điều kiện single-writer của main prompt đã được đáp ứng; nếu bạn đã takeover hợp lệ thì không xin lại quyền.

Mục tiêu: product FE thể hiện đúng Design R9 bằng shared design system thực sự, thay vì giữ template tokens/font/layout rồi chỉ nối API. Hoàn thiện toàn bộ 13 screen compositions và các trạng thái có trong R9, đồng thời giữ approved business behavior/security/current implementation. Không dựng prototype thứ hai hoặc đổi visual direction.

## 1. Baseline và phạm vi

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch dự kiến `codex/unified-project-flow`. Recheck actual source/checkpoint trước sửa. Source có thể đã thay đổi; các mismatch dưới đây là điểm intake, không yêu cầu undo fix hợp lệ.

Đọc root/component AGENTS và relevant FE rules. Known inputs:

- `docs/design/p0-handoff-r9/current-ux-spec.md`
- `docs/design/p0-handoff-r9/polish.css`
- `docs/design/p0-handoff-r9/prototype.html` và source tương ứng trong package
- `docs/design/p0-handoff-r9/{screen-state-matrix.json,zcode-handoff.md,validation-plan.md,return.md,manifest.json}`
- `docs/design/step-03a/revised/local-r3/{design-tokens.json,selected-tokens.css}` cho selected token lineage; R9 là current consumer spec.
- Latest actual `docs/implementation/p0-zcode-execution/{local-contract.md,workboard.json,final-return.md}`.
- `docs/implementation/handoffs/MC-P0-CLAUDE-FINISH-AFTER-ZCODE-20261028-PROMPT.md` cho complete assignment, safety và remaining logic fixes.

Design input R9 là specification/source baseline, không phải rendered acceptance. API contract mới hơn có thể định nghĩa operations mà handoff cũ ghi DEPENDENCY_PENDING; đối chiếu actual operation và wire hiện tại, không quay lại trạng thái giả pending hoặc bịa API. Không sửa immutable design/review files để làm chúng giống implementation.

Owned edits: actual `apps/frontend/` shared UI/feature/routes/styles/tests/docs theo component rules, cùng current workboard/evidence của assignment. Business compositions ở `src/features/*`, primitives domain-free ở `src/components/`. Dùng actual existing feature folders (`control`, `proof`, `data-transfer`...) nếu đã tồn tại; không rename chỉ để khớp tên gợi ý trong handoff.

Dùng TasteSkill **app-screen** rules, Hallmark/Impeccable nếu có sẵn và phù hợp. Giữ selected Enterprise Precision A, causal hierarchy B, Comfortable mặc định/Compact opt-in. Không bốc lại palette/font/direction, không áp landing-page rules lên legal workbench. Design R9/approved behavior thắng default house-style của skill khi xung đột. Không cài engine/dependency hoặc bypass browser permission để lấy một PASS.

## 2. Audit có giới hạn trước khi sửa

Trong same assignment, ghi một bảng mapping ngắn **R9 role → current token/component → mismatch → fix → verification**. Inventory toàn bộ callers của shared component sẽ sửa; giữ auth/forms/ref forwarding/validation/keyboard/error behavior. Không audit lại W0 hoặc viết một design-system framework mới.

Observed starting mismatches cần kiểm tra:

1. `src/app/layout.tsx` dùng Geist/Geist Mono, còn R9 dùng system humanist sans + system monospace.
2. `src/app/globals.css` dùng neutral OKLCH template palette khác selected R9 light palette.
3. `PageHeader` dùng `text-2xl tracking-tight`; R9 heading 22px, normal tracking.
4. Shared button/card/badge/table có generic radius/size/shadow variants; phải đối chiếu product contexts.
5. Grid có density URL nhưng chưa đủ chứng minh 44/36px, body14px, state/selection preservation và multiline behavior tại browser.

Không nhận “aligned” chỉ vì Tailwind class trông tương tự. Cần semantic token mapping, actual component reach và computed/rendered evidence khi được phép.

## 3. Một nguồn design tokens, giữ existing API của components

Reuse `src/app/globals.css` và existing Tailwind theme mechanism. Ánh xạ vào variables/utilities hiện có; chỉ thêm semantic role chưa có. Không tạo bộ `r9-*` song song với `primary/background/...` khiến hai nguồn cùng định nghĩa màu. Không paste toàn bộ `polish.css`/HTML prototype vào production: selectors `body`, `table`, `dialog`, embedded simulation và broad overflow rules không phải component implementation.

Selected light values từ R9:

| Role | Value |
|---|---|
| Background | `#f6f8fa` |
| Surface | `#ffffff` |
| Primary text | `#17212b` |
| Muted text | `#52606d` |
| Line | `#c6ced6` |
| Focus / accent | `#174ea6` |
| Selected surface | `#e8effa` |
| Error | `#a12622` |
| Disabled text | `#626973` |
| Execution | `#364152` |
| Verification | `#236341` |
| Dependency READY | `#174ea6` |
| Dependency BLOCKED | `#8a2925` |
| Timing | `#775317` |
| Attention | `#783e14` |
| Header / header text | `#101820` / `#ffffff` |

Preserve distinct roles even if two share a value; error, dependency and verification must not collapse into one success/failure color model. Bind inherited aliases carefully: e.g. light `background/surface/foreground/muted-foreground/ring/destructive/success` to their proper R9 roles; muted **surface** is not muted **text**. Map selection independently of primary-button fill. Verify foreground/background contrast on actual component pairs; names alone are not sufficient.

Current dark theme must remain functional; do not apply light values to its text/surfaces or silently remove theme controls. R9 selected light palette does not authorize inventing a new full dark art direction. Preserve existing coherent dark role mapping, extend missing semantic roles with accessible pairs, document dark-specific deviations and test them separately. Do not claim dark visually matches a light-only reference.

Typography/layout tokens:

- Body: `"Segoe UI", "Helvetica Neue", Arial, sans-serif`, **14px / 1.5**.
- Mono: `ui-monospace, SFMono-Regular, Menlo, monospace`, only appropriate IDs/time/code/data; tabular figures for aligned numeric columns.
- Heading: **22px**, semibold, normal tracking; metadata **12px**. Preserve browser user font scaling, no text clipping.
- Spacing base **4px**; R9 gap **12px**, gutter **16px**, panel radius **8px**, control radius **4px**; contextual metrics follow actual R9 screen composition.
- Comfortable rows **minimum44px**, 8px vertical padding; Compact **minimum36px**, 4px vertical padding; **14px body in both**. Long titles/reasons increase height; no fixed-height clipping.
- Desktop controls minimum **32px**; small-screen touch targets minimum **44px**, regardless of 16/20px icon glyph. Apply appropriate coarse-pointer target sizing too.
- Focus **2px + offset**, selected/hover/focus distinguishable, white focus on dark header.
- Motion only the selected restrained feedback (R9 hover background transition 160ms); respect reduced motion, no entrance animation/animated operational status.

If removing Geist loader/variables, first inspect every consumer; remove only unused font imports/declarations. Do not globally replace arbitrary font/class strings across source. Preserve component exports and caller expectations; add/adjust shared variants only when multiple actual product callers need them.

## 4. Đồng bộ shared UI rồi đến 13 screen compositions

Order: tokens/fonts → shared primitives → shell/navigation → feature compositions → states/interactions → rendered check. This is implementation order within the same long task, not new approval gates.

Shared checklist:

- Button/link-button: consistent sizes/radius/focus/loading/disabled explanation; destructive intent remains distinct; no duplicate submit on pending/UNKNOWN.
- Input/select/textarea/form-field: actual label/help/error association, visible validation, legible disabled values; preserve controlled drafts and form values through re-render.
- Card/page-header: R9 hierarchy/padding/typography, no decorative oversized KPI cards or arbitrary whitespace. Actual frequent action and scope visible.
- Badge/state: accessible text/reason, distinct state axes; no “green=complete and verified” conflation. Chip may keep text on one line, but long title/reason must wrap.
- Dialog/drawer: keep native dialog/working focus behavior; sticky Back/Close; causal context; mobile fullscreen where R9 calls for it. Same behavior via full routes may remain only if equivalent context/navigation/focus is actually demonstrated and any deviation is explicit.
- Tables/list/pagination: actual row density, correct selection/hover/focus, accessible header/order, no truncation of essential legal text; scoped scroll only when data genuinely requires it. Do not hide overflow on page/body to mask broken geometry or focus.
- Shell: MatterControl identity, Workspace/Matter context, role/as-of/session currentness, consistent navigation, mobile menu. No made-up counts or inaccessible scope names.

Record actual component/route for every screen ID; do not use directory-name matching as proof:

| R9 screen | Product surface to align |
|---|---|
| SCR-01 | Session, accessible Matters/workspaces, membership |
| SCR-02 | Control Room: blockers → next actions → waiting → milestones → gaps → changes |
| SCR-03 | Work Grid, My Actions, Waiting On |
| SCR-04/05 | Requirement and Action detail/context/form compositions |
| SCR-06 | Dependency reasons and causal impact |
| SCR-07 | Proof context/checklist/review |
| SCR-08 | Documents, immutable versions, signature observations, promotion |
| SCR-09 | Filing stages, cycles, submissions, observations |
| SCR-10 | Bulk edit preview, selection, per-row results/reconciliation |
| SCR-11 | Import preview, connected-group validation/results |
| SCR-12 | Draft Brief/export, window and source provenance |
| SCR-13 | Scoped domain history, causal links, recorded/effective time |

13 screen IDs need not equal 13 routes. Preserve current routes/API/user jobs; don't duplicate a feature because the prototype shows it in a drawer. When multiple surfaces currently share a panel (e.g. data-transfer), implement intended hierarchy/reachability/states for all jobs, not one checkbox saying “screen exists”.

For every surface, bind the **exact applicable nine-state set from R9 screen-state-matrix** to real product implementations/tests. Distinguish loading, empty/no-match, unavailable/denied/unknown/stale cases according to the actual matrix and operation; do not manufacture a state just to fill a row. Keep zero distinct from unavailable and no-access. Never replace a failing fetch with a plausible empty screen.

Critical behavior while aligning:

- R9 access-loss purge is real: affected protected data/drafts/selection/pending previews cleared by identity/Workspace/Matter scope; re-grant never revives old values. A role downgrade that retains read access is not automatic full revocation.
- Form intent persists through allowed rerenders/view/locale changes, scoped to actor/document/Matter; clear on explicit discard/logout/access loss.
- Promotion target is independent of expected-current guard; preview/acknowledgement binds actual target, never hides server conflict.
- Control Room facts/labels must share the declared read boundary or detect mismatch; display causal reasons including transitive blockers (main prompt F04/F05).
- Preserve filter/sort/density/selection/scroll/context through intended navigation; reset filter on its own screen; stale selection is revalidated before mutation.
- Evidence author/verifier separation, five state axes, receipt vs approval, UNKNOWN recovery and authorization remain server-authoritative. Visual polish cannot waive or hide them.

## 5. Chứng minh mức đồng bộ bằng source và browser evidence riêng

Add only meaningful tests needed by changed behavior: same body font across densities, critical shared-component variants/focus contracts, protected-state purge, form-intent preservation, promotion binding, row keyboard handlers not hijacking nested controls/IME, actual per-operation error recovery. Reuse existing test/story infrastructure and fixtures; no new visual-testing framework merely for this addendum.

Run required current FE `pnpm check` and `pnpm build` after stable changes; story/E2E checks per existing project rules and available permission. Shared token/component changes must cover all affected callers, not just the Grid demo.

If permitted browser is available, inspect **real product routes** at **1440, 768, 390px**, plus breakpoint boundaries affecting drawer/controls (R9 mentions640 and older responsive CSS760; implement from each screen's current spec and test both sides where relevant). Use long synthetic VI/EN titles, long reasons/IDs, full/empty/error/denied/UNKNOWN states, both densities, light and existing dark. Use a deterministic task-owned synthetic product dataset; fixtures/mock mode must be explicitly labeled and never evidence of real auth/API/PG enforcement.

Retain before/after screenshots and compact measurements for:

- Computed font family/size/line-height, correct loaded/fallback stack.
- Actual palette roles, text/control/focus contrast.
- Row minimum heights and natural multiline growth; touch targets, no hidden essential text.
- Header/sidebar/content edges, gutters, panel/control radii; no unintentional page overflow or sticky controls covering content/focus.
- Keyboard sequence, focus return, nested-input/IME behavior, drawer/mobile navigation; reduced motion and user text scaling/zoom.
- Each screen's main job, scope and causality readable without relying solely on color.

Capture route/state/viewport/theme/source revision/tool/time with evidence; review matched states side by side with R9, not arbitrary screenshot image similarity scores. Cover all 13 IDs, not only representative three screens. A shared-component screenshot proves that component, not every consuming composition. Exact live auth/browser cases remain separate from synthetic render checks.

Browser denied/unavailable is an explicit verification blocker, not permission to use alternate headless/CLI/native capture. Complete source and feasible tests, list missing rendered rows accurately. Source/mock PASS cannot be converted into rendered/keyboard/touch/screen-reader or AC-137 human acceptance. Human trial still requires real participants.

## 6. Same workboard và một final return

Add FE design-alignment mapping/coverage into same workboard/final candidate. Use statuses per item: `MATCHED_FROM_SOURCE`, `CORRECTED_AUTHOR_TESTED`, `RENDERED_CHECKED` (only actual execution), `VERIFICATION_BLOCKED`, `DEVIATION_NEEDS_REVIEW`; do not call the whole design accepted yourself.

Return in main consolidated handoff:

1. Token/typography/component mapping and exact changes/deviations from R9.
2. All13 screen mappings, applicable states and real routes/feature owners.
3. Before/after evidence/computed checks and source/test/build hashes/receipts, with mock vs real runtime distinguished.
4. Remaining visual/accessibility/human-review blockers and exact next action.

Continue backend/W6/W7/auth fixes from main prompt; integrate this FE work into that same candidate. No pause after palette/fonts to ask for continuation, no new design vote, no independent self-approval, no commit/merge/deploy.
