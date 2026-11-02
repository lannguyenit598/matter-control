# MC-CODEX-SIDEBAR-LOCALE-20261102 — local fix

Actual Local Codex, base/head86ac376cb0cb81e2219170bcdfe09c9940e906ca on fix/ui-issues-remediation. Status IN_REVIEW / IMPLEMENTED_SELF_TESTED. Direct PO request fixes the prior independent review finding; no merge/commit/push performed.

AppSidebar is now the small locale-aware client boundary, using the existing useLocale hook like BottomNav. Its label updates with the provider's current locale; the obsolete fixed navAriaLabel prop and duplicate server locale read are removed. The route layout remains server-rendered, server account/footer content is still passed as slots, and preference changes trigger no navigation/reload. DashboardTemplate assertion updated. Existing stories continue to exercise the shared sidebar.

Regression: two tests RED before implementation; four focused files/nine tests GREEN afterward. Tests use the real LocaleProvider and LocaleToggle/native change event, round-trip both EN and VI, check active link semantics, and retain the exact mounted unsaved-input element/value. Raw focused outputs are in this chat; regression-results.json does not claim a retained raw transcript.

The initial full check passed typecheck/lint and failed only on two pre-existing formatting errors in this branch. Fixed utility-class ordering in Select and JSX wrapping in ProofPanel without behavior changes; initial failure log retained. Final six-path source pins in final-inputs.json match primary and isolated snapshot. Snapshot clones installed dependencies without installing/relinking and disables dependency reconciliation only within that copy.

Final checks actually executed: pnpm check PASS,906passed/12skipped,117test files passed/1skipped; Webpack production build with CSS guard PASS; Storybook build PASS. Receipts record exact cwd, argv, UTC and exit. Primary .env/credentials were excluded from snapshot; no provider/auth calls performed.

All nine previously stopped local ports remain closed. No FE/BE/DB/IdP runtime restart. No backend change or backend suite rerun. Browser/E2E/screen-reader verification NOT_RUN because the user requested the local stack remain stopped; compiled and jsdom evidence does not certify those gates. Independent re-review of this new delta remains pending.
