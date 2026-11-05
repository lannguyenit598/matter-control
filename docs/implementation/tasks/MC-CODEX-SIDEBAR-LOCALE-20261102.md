# MC-CODEX-SIDEBAR-LOCALE-20261102

Owner actual Local Codex; priority P2; status IN_REVIEW / IMPLEMENTED_SELF_TESTED. Requirement: fix the independently reviewed desktop navigation landmark remaining in the old language after a live locale change. Base86ac376cb0cb81e2219170bcdfe09c9940e906ca, branch fix/ui-issues-remediation. Direct PO authorization covers implementation and local checks only; no merge/push/deploy or restart of the paused local stack.

Scope: AppSidebar reads the existing useLocale context; remove the fixed server-computed nav label and redundant layout locale read. Preserve brand/footer slots, server account content, links, current-route behavior and form identity. Callers inspected: app layout, DashboardTemplate test and stories; BottomNav remains unchanged.

Inputs: current review finding, installed client-boundary guide and existing locale provider/toggle implementation. Outputs: minimal source fix, integration regression and docs/testing/codex-sidebar-locale-20261102-r1/. Acceptance: VI/EN initial locale and round-trip toggles keep the landmark and links aligned without navigation/remount; existing sidebar controls and draft identity survive. Two RED tests failed before implementation; four focused files/nine tests PASS after implementation. Full FE check, Webpack/CSS and Storybook run in an isolated copy with cloned installed dependencies and automatic dependency reconciliation disabled there only. No installs or primary runtime changes.

Reviewer: nonauthor verification of the new delta pending. Source self-tests do not constitute browser/screen-reader or merge/release approval. Evidence receipts record exact candidate bytes, commands, times and exits.

Gate remediation: initial full check passed typecheck/lint then found two pre-existing formatting failures in this branch (Select utility ordering and Proof panel JSX wrapping). Only formatting was corrected at those two locations; failed log/receipt retained. Final-inputs.json extends the four-file bug-fix pins with those two formatting-only paths.

Final evidence: pnpm check906pass/12skip; Webpack/CSS and Storybook PASS. All6source pins match tested snapshot. All9paused local ports verified closed. No commit/merge/push; browser/E2E/screen-reader and nonauthor follow-up remain open.

PO follow-up authorization: merge the tested remediation into codex/unified-project-flow. This permits the local fix commit and fast-forward integration; no push, runtime restart, independent acceptance or release gate promotion follows. Earlier no-commit/no-merge statements describe the preceding implementation turn.
