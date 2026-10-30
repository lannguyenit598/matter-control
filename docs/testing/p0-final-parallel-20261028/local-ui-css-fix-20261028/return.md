# MC-P0-LOCAL-UI-CSS-FIX-20261028

Owner: actual Local Codex, author of this build fix. Status: IMPLEMENTED_SELF_TESTED_PENDING_INDEPENDENT_REVIEW. Priority P0; R9 UI rendering and NFR-010 implementation verification. Reviewer: OpenCode, pending refresh to the new candidate pins.

## Trigger and root cause

Human supplied a screenshot of authenticated `/workspaces` showing the A subject and unstyled app shell. It establishes human-observed sign-in progress, not full Cloud-auth acceptance. The running Webpack stylesheet retained raw `@theme`/`@apply` directives and lacked `.flex`/`.font-sans` utilities. Its process exit0 had therefore overstated usable UI readiness. Existing Next config only registered Tailwind through `turbopack.rules`; Webpack had no Tailwind/PostCSS integration.

## Small fix

- Add exact dev dependency `@tailwindcss/postcss@4.3.3`, matching installed Tailwind/compiler version; lockfile updated. This is the official build integration needed for Webpack. Existing Turbopack/Vite integration cannot register the PostCSS transform for Webpack. No additional runtime library or UI system is introduced.
- Add `apps/frontend/postcss.config.mjs` with the official plugin.
- Add `scripts/check-built-css.mjs`; both `build` and new `build:webpack` run it after Next builds. It rejects raw Tailwind compiler directives and checks emitted layout, accessibility and theme utilities. This is an artifact-level regression guard; DOM unit suites had not covered compiled stylesheet contents.
- `next.config.ts` is unchanged in the delivered candidate. A temporary custom-loader experiment was reverted before completion.

## Executed validation

RTK shell throughout; primary HEAD remains `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`. Existing source work preserved. Original RV001 719-entry packet remains immutable; candidate changed only package.json/lock plus two new integration/checker files. New generated inventory and delta sit beside this return.

- Before fix: emitted CSS 25,313 bytes, raw compiler directives present, no flex/font-sans utilities. Artifact checker rejected the uncompiled output (exit1). A missing-build-directory probe also failed, separately from the actual compiler-directive reproduction.
- Fresh Webpack production build in local snapshot: exit0. Cache from the prior compiler-free build was moved into private `cache-before-postcss`, retained rather than deleted. A build before cache refresh had reused the old uncompiled artifact, which the new checker rejected.
- Primary `pnpm build:webpack`: exit0 including compiled-CSS guard.
- Primary `pnpm check`: exit0, 48 files / 482 tests pass; typecheck/lint/format/agent checks pass.
- `pnpm install --frozen-lockfile --ignore-scripts`: exit0; versions from lockfile, no lifecycle scripts.
- `pnpm peers check`: exit0, no peer issues. `pnpm audit --prod`: exit0, no known vulnerabilities.
- `pnpm build-storybook`: exit0. Existing nonfatal missing-mdx/use-client warnings retained in tool output.
- `git diff --check`: exit0.
- HTTP server now serves `/_next/static/css/623a6a062994578b.css`: HTTP200 `text/css; charset=UTF-8`, 38,875 bytes, no raw compiler directives; flex/sr-only/bg-background confirmed in the HTTP response, not just disk.

Turbopack attempts did not succeed: isolated snapshot dependency symlink was outside its resolution root; primary-source builds then hit internal port-binding EPERM, including the formally elevated attempt. No Turbopack PASS claimed. The configured supported Webpack+PostCSS path above succeeded normally. Initial package install in sandbox had DNS/store/link failures; the exact owned native worker was stopped and approved frozen-lockfile install restored all links from cached packages. Dependency audit found no version upgrades beyond the single added plugin. The small generated root `.pnpm-store` cache is retained, not part of source inventory.

## Running instance

Continue `http://localhost:3000/workspaces` or `/login`. Frontend now listener PID65281, parent65279, cwd `/private/tmp/mc-local-login-cij0dm22/frontend`. API listener49105 remains running, DB/object scope from `local-login-20261028/return.md` unchanged. Only the previously created frontend listener49106 was signaled after matching parent/start/cwd; it exited normally. Initial 5-second bind wait saw socket reuse delay and did not force-kill; subsequent startup verified no listener, allowed address reuse, and started successfully. No DB/container teardown, source rollback, commit or push.

Public source/config/package/checker updates were copied to the snapshot; existing dependencies are linked. Original private build/error logs, cached artifact and restart state remain under `/private/tmp/mc-local-login-cij0dm22` and `/private/tmp/mc-local-login-20261028-state.json`. Commands/exits are in this session's tool record; omitted individual UTC start/end are not reconstructed. Public artifact/runtime metadata contains no tokens/credentials.

Human instructed to hard-refresh (Cmd+Shift+R) and sign in again if the in-memory session was reset. Browser tool remains disabled; corrected rendered geometry/visuals are pending human confirmation. No screenshot after the fix or screen-reader evidence was fabricated.

Skipped: browser/E2E, backend rerun, Cloud/restore acceptance, release. Risk: this new four-path build delta still needs independent review; old719-source review pins cannot certify the new candidate. CR-002 remains DECISION_REQUIRED.
