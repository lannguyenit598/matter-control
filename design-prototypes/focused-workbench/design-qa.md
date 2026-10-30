# Design QA — selected focused workbench

Source visual truth: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/design/legal-team-experience-20261029/concepts/concept-3.png
Implementation: http://127.0.0.1:4176/
Screenshot: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control/design-prototypes/focused-workbench/evidence/desktop-final.jpg
Viewport:1487x1058 CSS px; source1487x1058px; screenshot1487x1058px; 1:1 comparison, no scaling/crop normalization required. State: light, Ready queue, first task, disclosures closed, no dialog. Source and implemented screenshot opened together in the same comparison tool input. This is author design QA of an isolated prototype, not independent product acceptance.

## Findings and iteration history

- Initial P2: sidebar/main/next-rail alignment and primary-button dimensions differed. Set sidebar260px, next rail256px, task heading40px, primary min200x56px, and matched Due today text. Recaptured desktop-final.jpg and compared against the selected source. No actionable P0/P1/P2 visual mismatch remains in the selected state.
- Interaction P2: unmounting a dialog did not return focus to the invoking button. Capture previous focused element before showModal; restore on cleanup. Browser Escape probe now returns focused=true for Open task.
- Responsive P2: History queue overflowed the390px screen by ~8px. Removed decorative queue icons only below420px and tightened spacing; document scrollWidth equals innerWidth at390 and320px. All queue labels remain available.

## Required fidelity surfaces

Fonts/typography: local Inter variable; readable hierarchy and selected title wrapping match the source. Source is generated imagery so exact font identification is inferred; small glyph/weight differences are P3. Main heading34px, task40px, body17px. Focused title/button/reason/disclosure regions were legible in full-resolution shared comparison; DOM size checks supplemented them. No unreadable asset area required a separate crop.

Spacing/layout: selected three-region composition, fixed-width260px sidebar, dominant task pane, narrow supporting Up next. Default contains no input/editor. Desktop alignment rechecked after correction. Mobile reflows to a top navigation and supporting next list below primary content; no horizontal overflow at measured widths.

Colors/tokens: light neutral R9-aligned surfaces, dark primary action, blue active/focus, restrained due amber. No rainbow state-badge row. Background tonal/glyph differences from image are P3.

Images/assets: the target is text-and-icon UI. Official Lucide icons and Inter font are used. Account uses a standard UserRound icon rather than the source's text-initial avatar (P3 functional visual substitution). No recreated illustration, rasterized screen, CSS art or handcrafted SVG assets.

Copy/content: selected default task, reason, outcome, queues, date anchor29Oct2026 match the mock. Footer deliberately says interactive synthetic/no backend, rather than implying real legal data. First Previous is genuinely disabled at the boundary, unlike the nonfunctional mock's visual arrow. These are intentional correctness differences.

## Browser checks actually performed

- Queue switching, Next, selected next item, Blocked explanation and History empty state.
- Open task; native dialog Escape; focus returned after fix.
- Start preview; state feedback explicitly says proof unverified/no backend; reopening shows next preview step.
- Matters navigation; no textbox before New matter activation; synthetic create produces temporary row with explicit simulation confirmation.
- Draft name remains after Cancel/reopen.
- 390x844 and320x760 overflow measurements passed.
- Browser console errors/warnings observed: none in the inspected preview session.

## Checks and limits

Build exit0. Two small model tests plus four Sites scaffold tests:6pass. Sites checks are packaging checks only; no deployment was performed.
Not checked: production API/auth/PG, real permissions/data, server recovery/UNKNOWN, automated accessibility or screen readers, dark theme, Vietnamese localization, moderated legal-team success, independent QA. These are outside this isolated visual prototype; do not promote them to PASS.

## Follow-up polish

P3: exact generated-font glyph spacing, account avatar treatment and responsive stylistic tuning with intended users. None blocks reviewing the selected prototype structure.

final result: passed
