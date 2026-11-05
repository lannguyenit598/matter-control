# Unblock runbook (public identifiers only)

Human / owner actions, in order:

1. **Browser tool.** Finish cmux Computer Use onboarding and grant Screen Recording (check_permissions currently reports accessibility=true, screen_recording=false and the daemon says onboarding is still in progress). Headless browsers and other tools are out of bounds for this task.
2. **Port 3000.** The Cloud web app only accepts `http://localhost:3000/api/auth/callback`. An unowned runtime (`/private/tmp/mc-local-login-cij0dm22`) holds 3000 and 8081. Its owner must release or hand it over; nobody should kill it for me.
3. **Verified synthetic accounts.** An IdP administrator must provide synthetic users A and B whose e-mail can be verified through the normal flow (or replacement verified users). Nobody should disable verification or admin-verify an address; passwords and codes are typed by the person only.
4. **Frozen source.** An unowned writer is changing `next.config.ts`, `package.json`, `pnpm-lock.yaml` and adding `postcss.config.mjs` and `scripts/check-built-css.mjs` under apps/frontend. Decide that fix first (see R2-CSS-02), then re-pin the manifest.

Then rerun (owner of the auth slot): build the pinned snapshot with Turbopack (`node node_modules/next/dist/bin/next build`, node_modules cloned with `cp -Rc`, not symlinked, and never through pnpm), start the owned API and frontend on 8081/3000, and run `ui/playwright.rest.config.ts` (`PRODUCT_REST_URL=http://localhost:3000`, traces, HAR and video off) plus cases R2-RV001-BACK, R2-CR002-OBS and R2-GW-01..03 from `browser/cases.json`.
