# MC-P0-CLAUDE-CURRENT-RUNTIME-BROWSER-R3: return

**Identity:** actual Claude Code (Anthropic), model `claude-sonnet-5-5`, local CLI session. Author/runtime verifier only; not independent source QA.
**Branch / HEAD:** `codex/unified-project-flow` at `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`. No Git write, source/package/env/workboard edit, install, `pnpm exec`, restore rerun, lifecycle action or agent dispatch.
**Candidate:** `local-admin-medusa-r1/source-manifest.json`, SHA-256 `f43738bf…1028`; 721/721 members matched when I opened (before 16:04:43Z; exact time not captured). **At close 710/721 match**: see "Source drift" below.
**Proposed status:** `IN_REVIEW_WITH_VERIFICATION_BLOCKERS`. Nothing here is an independent, release, MC-002 or AC-137 PASS.

## Result in one line
The browser is still unusable (`BLOCKED_BROWSER_PERMISSION`), so no login, rendered, keyboard, mobile or Golden Workflow case could be run. The 11 non-browser, read-only HTTP checks on the live instance passed, including the served CSS being compiled.

## Completed (11 PASS, all against `localhost:3000` / `127.0.0.1:8081` by public URL, cookie-less, redirects not followed)

| Case | Observed |
|---|---|
| HTTP-LOGIN-200 | `/login` 200, title "Sign in · MatterControl" |
| **HTTP-CSS-SERVED** | one stylesheet, 41,382 bytes; no raw `@theme/@apply/@tailwind`; `.flex`, `.sr-only`, `.bg-background` present. This confirms on the running instance that the earlier R2-CSS-02 correction is what is served. It does not prove it renders well. |
| HTTP-HTML-FACTS | `<html lang="en">`, viewport meta, a `<main>` landmark, theme init script (HTML-level only) |
| HTTP-SECURITY-HEADERS | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Cache-Control and Permissions-Policy are set (values in `cases.json`; informational, not assessed) |
| HTTP-BFF-SESSION-SIGNED-OUT | cookie-less `/api/auth/session` 200, `authenticated:false` |
| HTTP-404 | unknown route 404 |
| HTTP-SIGNED-OUT-ROUTE-SWEEP | 12/12 product routes show "Sign-in required" |
| API-HEALTHZ / API-READYZ | 200 / 200 |
| API-NO-TOKEN-401 / API-BOGUS-TOKEN-401 | 401 `urn:mc:unauthenticated` both |

Side effect to know: the bogus-bearer request made the running API do one Cloud introspection call. I did not call `/api/auth/login`, so no pending login state was added to Codex's instance, and I never used the human's cookie or session.

## Source drift (not mine)
Eleven members of the 721-entry manifest changed between 16:04:43Z and 16:05:58Z, after my opening check: backend `productapi/handlers.go`, `productapi/server.go`, `core/port/workspace.go`; frontend `matters/[matterId]/page.tsx`, `matter-scope.tsx` and its test, `grant-matter-member-form.tsx`, `matter-members.tsx`, `matters/repository.ts`, `matters/schemas.ts`, `workspace-members.tsx` (exact hashes and mtimes in `source-drift.json`). The intake said backend bytes were unchanged; that no longer holds for the working tree. I did not edit, revert or re-pin anything. My 11 HTTP checks ran after those edits (about 16:07Z-16:08Z) but against processes that predate them (frontend started 15:54:20Z, API 22:26:50 local), so they describe the running instance, not the current tree. Codex needs to re-pin the manifest; a later rebuild will serve different bytes.

## Runtime identity (read-only)
`next-server` pid 72015 (parent 72013), cwd `/private/tmp/mc-local-login-cij0dm22/frontend-medusa-r1`, started 22:54:20 local (15:54:20Z), on 127.0.0.1:3000; `mcapi` pid 49105 on 127.0.0.1:8081. This matches `runtime.json`. Lifecycle stays with Codex; nothing was stopped, restarted or rebound.

## Blocked, with the exact blocker

| Item | Status | Blocker / next action |
|---|---|---|
| Browser capability | **BLOCKED_BROWSER_PERMISSION** | `cmux-cua`: `check_permissions` reports the session ended; `list_apps`, `health_report` and `start_session` each fail with "Computer Use onboarding is still in progress. Finish setup in cmux, then retry." R2 read accessibility=true, screen_recording=false. **Human setting needed:** finish the cmux Computer Use onboarding and grant Screen Recording to "cmux Computer Use" (`com.cmuxterm.cua`) under System Settings > Privacy & Security > Screen Recording. I used no headless browser, alternate tool, OS capture or server rendering. |
| Login -> callback -> Workspaces as A | BLOCKED_BROWSER_PERMISSION | The PO's confirmation and screenshot (synthetic A, verified, signed in) are cited as `HUMAN_CONFIRMED_ACCOUNT_READY`; I did not see the screenshot and did not log in. It is not issuer/audience/refresh/role acceptance. |
| RV-001 Back link at the browser | BLOCKED_BROWSER_PERMISSION | needs a session + browser; unit/source evidence remains the cited author evidence |
| Desktop/mobile/reflow, keyboard/focus/dialogs, EN/VI, light/dark | BLOCKED_BROWSER_PERMISSION | rendered behaviour is unobserved |
| Golden Workflows on new synthetic fixtures | BLOCKED_BROWSER_PERMISSION | no fixture was created and the human's Matter was not touched |
| Synthetic B | UNKNOWN | ask the human only for "verified / not verified" (never credentials) |
| A/B isolation, VIEWER denial, grant/revoke | BLOCKED | needs B, a separate session/fixture, a browser and a coordinated slot |
| Real refresh | WAITING_REAL_EXPIRY | no mock clock, no lifetime change |
| Logout/relogin, API outage | NOT_RUN | would end the human's session or stop their API during a demo; needs an isolated session and an explicit slot |
| Screen reader | NOT_RUN | no assistive tool executed |
| CR-002 | DECISION_REQUIRED | still a PO choice (browser storage, server slot with contract revision, or explicit local limitation); no key minted, no blind resend |
| AC-137 | AWAITING_HUMAN_TRIAL | five managers needed; protocol already prepared under `ui/` |

## Skipped / risks
- The 11 HTTP checks are signed-out and HTML/CSS-level. They say nothing about authenticated data, roles, refresh, or how the page looks.
- The 721-file candidate contains Codex's 18 modified and 2 new frontend files (presentation/CSS) that OpenCode has not yet reviewed; my results are scoped to that manifest hash only.
- R2 outputs and its deviations (pnpm install side effect, killed Cloud runtime, `.env.local`) are preserved unchanged and still apply.
- The stopped R2 stack's databases (`mc_r2_20261028t153728z`, `mc_rr_*`) remain as R2 recorded.

## Next human actions
1. Finish cmux Computer Use onboarding and grant Screen Recording (above).
2. Tell me whether synthetic B is verified.
3. When the human can type the password/MFA in a separate test browser profile, rerun `BR-LOGIN-A`, `BR-RV001-BACK`, the R9 render/keyboard cases and, on newly created fixtures, the Golden Workflows; agree a slot for logout/outage/revoke.
4. PO: decide CR-002.
