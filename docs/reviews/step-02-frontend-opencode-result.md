## MC-002-FE-VERIFY — OpenCode independent review (no tools; supplied snapshots only)

### Verdict: CHANGES_REQUIRED

Required changes are **documentary corrections only** to `docs/testing/step-02-frontend-poc.md` and `manifest.json`, plus future-run methodology. **No PoC re-execution is required.** Runtime pass results stand. Conditional disposition after corrections: **PASS_WITH_LIMITATIONS** for MC-002-FE local-scope template PoC (H5). Integration gate unchanged; MC-002 remains open.

### Verification basis
- I compared each raw log against report/manifest claims, recomputing counts/arithmetic and quote-matching. **Runtime replay was not performed** (explicitly out of scope). Hash values were computed by **Codex** (intake), not by me — accepted as chain-of-custody corroboration only, not independently recomputed here.
- Evidence classes: for steps 3 and 5, exit code 0 and UTC window are **in-log**; for 01–08 and 10, exit codes/UTC are **owner-manifest assertions**, corroborated indirectly per step by tool banners. Line numbers are unavailable in the supplied snapshot format; anchors below are exact quoted strings.

### Headline cross-checks (independently recomputed)
- **99 unit tests — CONFIRMED.** `05-test.log` enumerates 18 files; per-file counts 5+3+9+7+16+4+6+6+8+13+5+3+4+2+1+4+2+1 = exactly 99; summary "Test Files 18 passed (18) / Tests 99 passed (99)".
- **9 E2E — CONFIRMED as count.** `10-playwright.log`: "Running 9 tests using 1 worker"; "9 passed (13.7s)". Spec-file names and Chromium-cache detection claims in the report are *not* in this log (FE-07).
- **Hashes — consistent.** `manifest.json` ↔ intake `checks.json` values match for all 11 artifacts; not recomputed by me.
- **Versions corroborated:** Next 16.4.2 (07 banner, 09/11 start banners), pnpm 12.11.2 ("Done in 2.1s using pnpm v12.11.2"), Storybook 10.6.2, ESLint 9.39.5, Prettier 3.9.10, Vitest 5.0.5 (01 install table). Node v24.22.1 never appears in any log — owner assertion only.

### Findings

**FE-VERIFY-01 · MEDIUM — report asserts port release its own raw logs contradict.**
Locations: `docs/testing/step-02-frontend-poc.md` §3.3 ("Stopped server PID cleanly; confirmed port 3088 released.", "confirmed port 3089 released."), §3.5 ("confirmed port 3096 released."). Contradicting anchors: `09-production-start.log` — "WARNING: Port 3088 still occupied after kill." and "WARNING: Port 3089 still occupied after kill."; `11-rest-negative.log` — "WARNING: Port 3096 still occupied after kill."
Impact: submitted narrative directly contradicts in-log evidence; "cleanly released / stopped cleanly" is unestablished. Later no-listener state (`listeners.json`, 15:05:01Z, all four ports free) proves processes absent ~7 min later, not historical graceful stop.
Minimal correction: reword to "kill signal sent; immediate post-kill check still showed port occupied; mechanism unresolved; all ports observed free at 15:05Z."

**FE-VERIFY-02 · MEDIUM — zero-outbound/zero-leak phrasing overclaims.**
Location: §3.5 "Zero private backend requests dispatched; zero data leaked."
Actually observed: fail-closed EmptyState for /dashboard and /tasks in REST mode; single occurrence of "[auth] No authentication provider configured…"; no fetch/ECONNREFUSED errors in `11-rest-negative.log`; code path (`backend.ts`: `requireSession()` before any fetch) and the mocked-unit-test assertion that fetch is not called. No runtime network spy or request counter exists.
Minimal correction: restate as indirect evidence — "no backend fetch observed in server log; code path cannot dispatch without a session; only request-count evidence is the mocked unit test."

**FE-VERIFY-03 · MEDIUM — exit codes/UTC unverifiable in 8 of 11 steps.**
Intake `checks.json`: `utc_in_raw_log: false`, `exit_marker_in_raw_log: false` for 01–08 and 10. Only 09/11 embed "UTC Start/End" and "Exit Code: 0" (matching manifest). Indirect corroboration per step succeeded (01 "Done in 2.1s"; 02 "✓ Types generated successfully"; 04 "All matched files use Prettier code style!"; 05 99-pass summary; 06 "agent config OK: 17 skills, 3 scoped rules"; 07 route table; 08 "Storybook build completed successfully"; 10 Playwright 9-pass). `03-lint.log` has no banner and no marker — empty output is consistent with 0 errors/0 warnings but does not evidence exit 0.
Minimal correction: label manifest `exit_code` fields "asserted; corroborated by success banner"; require future wrappers to echo the base command's exit with `set -o pipefail` plus UTC stamps into every log.

**FE-VERIFY-04 · LOW — manifest UTC drift vs raw logs.**
Step 3 manifest `14:55:09Z` vs log "UTC Start: 2026-10-24T14:55:08Z"; step 5 manifest `14:57:53Z` vs log "UTC Start: 2026-10-24T14:57:56Z". Corrigendum: copy raw values verbatim.

**FE-VERIFY-05 · LOW-MEDIUM — "loopback" was a port-availability claim, not a bind-scope claim.**
`11-rest-negative.log`: launch "$ next start -p 3096" with no `-H 127.0.0.1`; Next banner advertises "- Network: http://192.168.1.59:3096" → default bind on all interfaces. During each few-seconds window, a demo-mode server ("data is in-memory and every visitor can change it") was LAN-reachable.
Minimal correction: future starts use `-H 127.0.0.1 -p <port>`; correct wording in report. Functional PASS unaffected.

**FE-VERIFY-06 · LOW — smoke wrappers do not gate assertions (methodology).**
Intake observation: standalone step-3/5 wrappers unconditionally exit 0 and print "NOT FOUND" on failed content greps. In this packet the "Sign-in required" content checks did match, so no false PASS is demonstrated — but a future content failure would still record manifest `exit_code: 0, PASS`.
Minimal correction: make every content assertion set nonzero exit on miss; document which criteria each wrapper actually asserts.

**FE-VERIFY-07 · LOW — details asserted beyond log content.**
Not present in raw artifacts: "Playwright detected existing Chromium… (Chromium 1248)"; "across security.spec.ts and tasks.spec.ts" (log shows count and one worker only); "668MB" node_modules figure (544 packages corroborated in 01 log; the byte figure is an unlogged external measurement); "Server ready in < 1s" (log says "in 2 iterations", not seconds); Node v24.22.1 not printed. `08-build-storybook.log` also shows an omitted warning: "No story files found for the specified pattern: src/**/*.mdx". Observed CSP includes `'unsafe-inline'` for script-src/style-src — "headers present" is accurate, but flag for later security architecture work.
Minimal correction: annotate/drop out-of-log details; add the mdx warning.

**FE-VERIFY-08 · INFO — E2E retry semantics.**
`playwright.config.ts`: `retries: process.env.CI ? 1 : 0`; run under CI=true. Summary "9 passed" could absorb one first-attempt failure unless flagged flaky; no flaky marker appears. Optional: next acceptance rerun set retries 0 for unambiguous single-attempt evidence. Not gating now.

**FE-VERIFY-09 · INFO — corrections to the earlier supplied-source audit accepted.**
§4 items (no measured CPU; regex permits UUIDs; static export needs redesign/security review rather than inherent secret leakage; rm -rf/shallow-clone rejected; install writes node_modules while lockfile stays frozen; pipefail requirement) align with the disposition table in `docs/architecture/frontend-audit.md`. No further action.

### Accepted criteria vs remaining gaps
**Accepted (H5 local scope, P-FE-1 baseline):** install; typecheck; lint; format; unit 99/99; agents:check; next build (Turbopack, PPR); Storybook build; production start/routes (307→/dashboard, 200, tasks table, custom 404; restart on 3089); Playwright 9/9 demo-mode; REST fail-closed EmptyState + auth warning on 3096. Correctly scoped out: no Go connectivity or PostgreSQL persistence proof; F1/F2 UNTESTED/NOT_RUN; F3 BLOCKED pending redesign/security review; F4 compatible-in-principle only; no Step-02 pass, no deploy/cost/scale certification.

**Remaining gaps before MC-002-FE closes:** land FE-VERIFY-01..07 corrections; contract/auth seam specification and approval (Claude Code/Codex) still outstanding; ZCode result intake excluded here; the "confirmed released" and "zero data leaked" phrases must not carry into later packets.

### Out of scope / what was skipped
Backend return (explicitly out of scope; no integration assessment). No replay, no MCP/tools, no file changes, no reads beyond supplied snapshots; hash values not recomputed; intake attestation fields (e.g., `protected_requirements_unchanged: 25`) accepted as Codex attestation, not re-verified. No architecture, cost, or PO approvals are granted by this review; no runtime claims beyond what the logs show.

**Remaining risk:** all runtime conclusions rest on one ~8-minute window (14:50–14:58Z) on one machine with owner-asserted exit codes in 8/11 steps; transcription drift in two manifest entries confirms manual assembly. After the listed corrections, the evidence set is adequate for PASS_WITH_LIMITATIONS without re-execution.
