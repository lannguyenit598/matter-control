# Focused-workbench fidelity correction

Task: MC-P0-CODEX-UI-FIDELITY-20261029. Actual Local Codex,2026-10-29. Branch `codex/unified-project-flow`; coordination HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`. Source was already dirty; preceding Claude/Codex work preserved. No commit/push/backend edit or external agent invocation.

## Result

Selected prototype geometry is now implemented in the real product shell/My Work:260px desktop sidebar(210px intermediate), flat content instead of rounded dashboard container, mobile-only top header, account/preferences at the desktop sidebar foot, Inter loaded through next/font/local using the existing prototype asset with its OFL notice,34px page heading,40px current item, blue queue/nav selection,256px Up next rail,200×56px primary task link, reference section/disclosure spacing and≤800px stacking.320/390 rules preserve wrapping and target sizes. Dark mode maps the new scoped palette to existing dark roles.

Navigation/data/actions remain real and unchanged. UI still says Open task because the current workbench does not implement the prototype's simulated start/complete handlers. No fake people/roles/workspaces/dates or extra task steps were added. Scope/as-of is retained as a footer rather than interrupting the header/queue hierarchy. Protected state, receipts/CAS, access-loss/UNKNOWN handling and auth source were not rewritten.

The changes affect the shared authenticated shell/page headings, so connected Matter screens inherit its geometry; individual domain forms retain their existing sizing and behavior. Sidebar/mobile account rendering uses the existing authenticated component in Suspense. The new layout test confirms skip target, navigation, account/preferences and mobile trigger slots remain accessible in the component tree; it does not prove CSS breakpoint or browser focus behavior.

## Verification

| Check | Observed result |
|---|---|
| `pnpm check`, initial run | Typecheck/lint/format passed.631pass/1fail: new template test lacked Next pathname mock. Corrected test setup. |
| `pnpm check`, second run | Typecheck/lint/format passed.631pass/1fail: existing proof/upload-attempt test timed out at5s. Same flake reported by Claude; no timeout/assertion changes made. |
| `pnpm test --maxWorkers=2` | Exit0,68files/632tests passed. Reduced contention, not proof the existing flake is resolved. |
| `pnpm agents:check` | Exit0,17skills/3scoped rules. |
| Next Webpack build | Isolated full compile/type generation/prerender succeeded, exit0. First attempt failed because build-only REST config omitted API_BASE_URL; retained log. Corrected with nonsecret loopback placeholder for compilation, no token/private env. |
| Compiled CSS guard | Exit0,2assets verified. |
| Storybook build | Exit0, output to owned temporary directory. Existing module-directive/chunk warnings; no rendered Storybook claim. |
| HTTP/CSS smoke | Existing3000 dev server `/login`200;66850-byte CSS asset200 contains new shell/workbench styles. No authenticated requests or rendering. |
| Whitespace | `git diff --check` passed for affected source. |

Build snapshot: `/private/tmp/mc-workbench-build-ubh20n93/frontend`; source-only copy excludes private env, existing node_modules linked without installation. Standalone output-tracing warnings arise because the dependency link points outside that snapshot; compile success is not a tested distributable image. Storybook output: sibling`storybook/`. Main runtime build artifacts were not replaced by production builds; `next typegen` ran through the prescribed source check. No active process/container/database was stopped/restarted.

Live frontend PID87665/cwd confirmed at intake; retained Claude return identifies it as next dev with the approved Cloud profile. An unauthenticated HTTP/CSS check confirms current styles are served. Existing user cookies, data and process-memory sessions were not read/copied or changed. The user can reload `http://localhost:3000/my-actions`; a retained session is required to see actual work. Reference4176 remains untouched.

## Limitations and remaining work

The official browser inventory reported local browser use disabled in Work settings. No browser/CDP/headless/OS capture fallback was used. Desktop/mobile visual matching, dark geometry, keyboard/focus and authenticated workflows remain NOT_RUN by this author. Earlier Claude browser evidence predates these CSS changes and cannot certify them.

An optional fontTools glyph-coverage inspection could not decode WOFF2 because the Python Brotli extension is unavailable; no package was installed. The same local Inter bytes as the selected prototype are used, with Arial fallback; Vietnamese glyph/wrapping still requires rendered validation.

Exact source hashes are in`source-delta.json`; initial before-hashes cover10files and explicitly do not reconstruct every pre-edit byte of previously dirty files. Full command output for checks/test/Storybook was returned through tools; only build and HTTP receipts are durable in this directory. No fabricated raw test transcript is supplied.

Proposed status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS. Latest direct PO assignment transfers this visual correction from Claude to Codex; reference handoffs now note that ownership to avoid a second writer.

Next: enable the permitted browser surface, compare product and4176 at the same viewport/theme/locale and verify narrow keyboard/focus behavior; independently review source. Keep the known proof-upload timeout open.

Skipped: browser/e2e/IdP mutation, new features, production deployment and independent acceptance. Risk: source/build/CSS proof does not establish final rendered equivalence; full default check still has the reproduced upload-test flake.
