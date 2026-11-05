# MC-P0 sidebar preference icon alignment

Actual Local Codex, author implementation and verification, 2026-10-29. Direct PO screenshot correction; current primary-source UI ownership retained. IN_REVIEW; independent review pending. Existing dirty changes preserved; no commit/push or backend work.

Root cause: LocaleToggle positioned the language icon relative to an outer wrapper, while Select applied pl-9 to its own wrapper instead of its native select. The resulting inset moved the control away from the icon. Select now owns an optional decorative leadingIcon with select padding and a nonshrinking icon; LocaleToggle consumes it without an additional wrapper. Wrapper min-width is zero. Added a Monitor icon beside the Appearance label, plus localized accessible label and tooltip for the theme button. Existing locale values, native select behavior, form semantics, sign-out and authentication unchanged. The account display name is deliberately left as supplied identity data.

Scope/callers: shared Select, language toggle in desktop sidebar and mobile preferences; ThemeToggle also used by existing Storybook template; route layout Appearance label. Tests/stories updated: Select native form test now exercises a leading icon; localization test checks the translated theme control label while preserving unsaved form content. Language story added. No dependency added.

Verification: pnpm check exit0,76 files/692 tests; TypeScript/lint/format/agent checks pass. Isolated Webpack build and compiled-CSS guard exit0; Storybook attempt2 exit0. Initial Storybook attempt failed because Codex used the wrong CLI path; preserved log/receipt, then resolved the actual bin from the installed package and reran successfully. No install or runtime restart. All seven scoped files match the successful build snapshot.

Actual browser: initial authenticated desktop view at1280x720 showed Vietnamese language icon inside its control and the Appearance icon aligned with its label. Later tab changed to narrow English presentation; no locale switch was sent by this task. Opened and closed Preferences on the current narrow view, saved preferences-narrow.png showing icon and chevron inside the select without spill. current-view.png retains preceding narrow context. A close-navigation action failed because its node had disappeared; no repeated blind click or settings mutation followed. No workspace, Matter, user or credential mutation. Tab kept for handoff.

Evidence receipts contain exact commands, cwd, timing and exit codes; source-manifest.json pins scoped bytes. Existing standalone tracing/chunk warnings from the isolated dependency symlink remain; no deployable-image claim. Automated E2E, full screen-reader and independent review NOT_RUN. No broader gate closure.

Skipped: full-browser language/theme interaction matrix and release checks. Risk: independent rendered coverage remains limited to the observed local desktop/narrow views.
