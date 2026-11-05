# Pane list corners and panel rim — Local Codex return

Task MC-CODEX-PANE-RIM-FIX-20261101. Actual agent/tool: Local Codex, local frontend tooling and approved in-app browser. Branch/head `codex/unified-project-flow` / `64b9e0315e210953d7a7eaeacc0643b269a14ad9`. Status **IMPLEMENTED / LOCAL_BROWSER_VERIFIED_WITH_LIMITATIONS / IN_REVIEW**. Existing dirty work preserved; no external/nonauthor PASS implied.

## Causes and smallest correction

1. The list container had radius22px while both li backgrounds and full-row links had radius0. The shared hover/focus-within paint therefore extended into square corners. Pane CSS now gives first/last rows the corresponding inherited logical corner radii, including all four on a one-row list; direct row anchors inherit them. It does not clip overflow, text, controls or keyboard focus.
2. Dense Control Room sections painted their own CSS border/material around a nested GlassSurface. The measured visual radius was22px, while the nested optical map was requested with radius14; displacement sampled surrounding borders/content and produced repeated/folded bottom rims. Remove that redundant GlassSurface wrapper from Section; retain the shared CSS frosted material, border, light rim and shadow. Dialog/sidebar optical components remain unchanged. No text/icon/business state is removed or added.

Changed application files: `apps/frontend/src/app/pane-workbench.css` and `apps/frontend/src/features/control/components/control-room-view.tsx`. Both match the isolated running snapshot in delivery-source-check.json. inputs.json records original pins; original bytes retained privately in the run folder.

## Actual verification

- `node node_modules/vitest/vitest.mjs run src/features/control src/features/matters/components/matter-discovery.test.tsx src/test/action-entry.test.tsx src/components/molecules/glass-surface.test.tsx`: **4 files /31 tests PASS**, related.json; raw log in private run folder.
- `pnpm run build:webpack`: **PASS**, including compiled CSS guard; build.json.
- Changed two files Prettier check: PASS. `git diff --check`: PASS.
- `pnpm run check`: **FAIL at existing unrelated formatting** in src/features/filings/components/filing-guard-copy.test.tsx, after successful typecheck and lint. No whole-check PASS claimed; no unrelated assertion/format changed. check.json.
- Before browser: list/links radius0 versus container22. Keyboard focus reproduced the same shared focus-within background paint. After: first link22px22px0px0px, last0px0px22px22px, overflowvisible and focus ring retained. Icons/names/routes unchanged. Actual pointer-hover could not be driven by the available browser API; the hover declarations were inspected and share the repaired row/anchor shapes. This is not a claimed automated pointer-hover execution.
- Before sections: transparent host, CSS rim/shadow plus three nested glass layers/filter. After all five sections: one CSS surface, radius22, border1px, zero nested glass layers. Light Milestones screenshot shows the folded/double bottom rim removed. Dark list keyboard interaction and light panel were captured. At390px document width remains390, panels358px and no nested optical layers. Mobile result is screenshot/DOM verification, not physical iPad evidence.

Artifacts: before-matter.png, before-list-focus.png, after-list-dark-focus.png, after-milestones-light.png, after-matter-mobile.png, browser-checks.json and command/source receipts. Screenshots use the existing synthetic local records. No domain mutation was submitted during QA.

## Local handoff and limits

App: http://localhost:3000. New frontend source/build: `/private/tmp/mc-pane-rim-fix-20261101/frontend`; wrapper PID32797, runtime.json. Old listener26987 was verified by cwd and parent26985 before termination. Build completed in a new snapshot before swap. API127.0.0.1:8081 and all database/container/object resources unchanged. Memory-session restart was followed by normal previously authorized Cloud SSO; no credentials/tokens/cookies were read/exported. Browser viewport reset, light/English appearance retained, QA tab kept open.

Skipped: direct automated pointer-hover, physical Safari/iPad, complete accessibility certification, backend/Storybook reruns and independent acceptance. The unrelated full-check formatting failure remains open. No commit, push, cloud mutation, deployment or P0/MC-002 gate closure.
