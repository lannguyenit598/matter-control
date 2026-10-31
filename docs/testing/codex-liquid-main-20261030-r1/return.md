# Liquid Glass main-screen remediation — author return

Actual Local Codex,2026-10-30. Branch codex/unified-project-flow, base/head0de3e5dbb8ef578c7288ba9c49ecaeddbbcbdcee plus this uncommitted UI delta. Direct PO implementation request, frontend-design skill applied. No claim of independent or browser acceptance. Status IN_REVIEW_WITH_VERIFICATION_BLOCKERS.

## Root cause and change

The displacement-map kernel was connected only to Dialog. Cards and buttons still used flat opaque faces; the shell had little background variation for a transparent material to reveal. Existing client-side GlassSurface/kernel is reused, with no new dependencies.

- Sidebar and Control Room sections now compose the existing real refraction surface on supported Chromium. Text stays in the unwarped foreground layer; unsupported engines keep the frosted host finish. Refraction is restrained around dense reading content rather than applied to each table cell.
- The application gets a restrained blue/sea/warm atmospheric field; sidebar, cards, stat cards, Matter scope/tab bar, record lists/tables use translucent faces, lit rims and depth. Matter tabs become a glass navigation group, retaining actual links, horizontal overflow and aria-current.
- Native buttons and button-styled links share a capsule finish with a specular face, blur for clear variants and dense tints for primary/destructive actions. Buttons are still native buttons, not a copied div-based implementation; submit/loading/disabled/focus semantics are retained. Buttons use CSS glass finish, not a new per-button SVG displacement renderer.
- Record hover/focus surfaces and Control Room rows gain separation without changing business states, ordering or handlers. Reduced-transparency/forced-color overrides follow the material rules; reduced-motion removes the new lift. Dense text and state foreground colors retain their approved roles.
- New GlassOnBackdrop and LiquidWorkbench stories show controls and reading surfaces in context. A native form-submit/keyboard test confirms Enter still submits once with the new finish.

## Verification actually executed

| Check | Result | Evidence |
| --- | --- | --- |
| Final pnpm check |typegen/tsc/lint/format/agents PASS;731testPASS/12SKIP,84filesPASS/1SKIP|frontend-check-final.log/json|
| Final isolated production Webpack build |PASS;2 compiled CSS assets, CSS guard PASS|frontend-build-final.log/json|
| Final Storybook build |PASS, upstream module-directive warnings retained|storybook-final.log/json|
| New local runtime |login200, glass/control/navigation/reduced-transparency CSS present, API health200|runtime.json|
| Source whitespace |git diff --check PASS|observed command output|

No source installs, backend tests, Worker re-qualification or database mutations were needed for this presentation-only delta. Actual authenticated geometry, contrast sampling, mobile/keyboard/assistive-technology behavior and live refraction rendering are **NOT_VERIFIED**: cua browser entry returned “Local browser use is disabled in Work settings”. No headless/OS/screenshot bypass was used. Storybook build does not close that limitation.

## Runtime and provenance

Built a new isolated public frontend copy, using installed node_modules read-only via symlink without install/relink. Standalone tracing emits symlink-outside-root warnings; this handoff runs `next start` with those installed dependencies, not the standalone deployment artifact. No cloud portability acceptance is inferred.

Old owned frontend PID48109 was matched to its exact cwd/start/listener before SIGTERM. New frontend PID71345 runs from `/private/tmp/mc-liquid-manual-_7psy_qa/frontend`, port3000. Existing API8081, local database and copied document store remain unchanged. Since this manual runtime deliberately uses memory BFF sessions, the frontend restart requires human sign-in again. No token/cookie/password was read from the browser or exported.

The13 changed public source files are pinned and compared with the runtime build copy in source-manifest.json; unrelated OpenCode QA edits are preserved. No commit/push. This new visual delta must be separately consumed by OpenCode if its snapshot predates these pins; passing an older snapshot does not accept these UI bytes.

## References and limits

Reference gallery: https://liquidglassdesign.com/ui. Liqui's primary documentation explains why a real backdrop matters and documents Chromium refraction/frosted fallback: https://liqui.design/docs and https://liqui.design/docs/components. The requested direct button page was unavailable through the documentation fetcher; no code was copied or package installed. The Apple page returned a JavaScript-only shell and its linked Markdown fetch failed; no undocumented Apple API or platform-equivalence claim is made. This is the repository's own accessible web material implementation, not UIKit/AppKit.

Skipped: authenticated browser/visual/a11y acceptance, per-device frame-time measurement, Worker/provider/release checks, commit/push. Remaining risk: appearance, contrast under actual user backdrops and GPU cost of multiple live panels need browser verification; CSS/build success alone is not that evidence.
