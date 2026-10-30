# Vietnamese font correction

Actual Local Codex,2026-10-29. Root cause confirmed: previous product Inter bytes matched the retained prototype Latin subset (230codepoints), missing Vietnamese characters including ă/đ/ơ/ư/ế/ệ. This was the author's earlier asset selection error, not lack of Vietnamese support in the full Inter family.

Selected Be Vietnam Pro from its official repository commit `804e62d81abbbcdcce5686069c69b41b8c245192`, with retained OFL notice/provenance under `apps/frontend/src/app/fonts/be-vietnam-pro/`. Four full static weights400/500/600/700 are loaded via next/font/local, replacing the unused product Inter subset; prototype/evidence bytes remain unchanged. All237required ASCII/Vietnamese precomposed/decomposed codepoints exist in each font weight. Source attribution: https://github.com/bettergui/BeVietnamPro .

Production runtime CSS/HTTP font fetch matched all four selected file hashes. This proves the correct bytes are served, not rendered quality. Initial smoke failed because it assumed absolute font URLs; corrected URL resolution passed and the failed receipt is retained. No external font service is contacted at runtime and no dependency package installed.

Author checks: final `pnpm check` exit0,72files/665tests passed; isolated Webpack build/CSS guard passed. First source check collided with an intermediate evidence-basis flag name in another task; it was not edited by this font work, and the later current-source check passed. No unrelated feature acceptance inferred.

Later density task observed actual Vietnamese font rendering at390px unauthenticated and320px authenticated workspace-empty/dialog. See `docs/testing/codex-ui-density-20261029-r1/browser-checks.json` and screenshot. No full desktop/populated acceptance; independent review pending. No commit/push.

Skipped: all browser/platform glyph-shaping combinations and italic styling. Risk: font metrics differ from the old subset; the subsequent density/layout correction reduces headings and fixes wrap constraints, with remaining rendered coverage stated separately.
