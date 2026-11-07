# MC-ENABLE-E2-E4-20261107 — Return (AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW)

- Executor: **actual ZCode** (PO routing proposed ZCode; enablement was historically a Codex
  intake item — this session executed it as the dispatched owner). Base: `4068298b` (develop).
- Scope held: **0 files under apps/**; changes only in `ops/local/walkthrough/browser/` (new),
  `docs/deployment/walkthrough-env.md` (§5), `ops/p0-local/README.md` (2 errata),
  `docs/implementation/workboard-findings.md` (§21), and this evidence dir.
- Loopback-only held: faultproxy refuses non-loopback listen/upstream; next dev `-H 127.0.0.1`;
  every published docker port bound to 127.0.0.1. No product code, no commits of secrets
  (test passwords and key file stay 0600 outside git; only file NAMES appear in scripts).

## E-2 — stub-IdP browser login gap (US-R-01) → CLOSED as RUNNABLE (browser path via real local IdP)

The stub IdP (CO-17) stays machine-token-only by design; the browser path uses the task-owned
ZITADEL profile (ops/p0-local) — the config-first route the dispatch prescribed. Nothing blocked
remained that required code: the one documented config defect (web-app redirect_uri) was already
fixed in the retained ZITADEL data (probe 2026-11-07: authorize → 302 Login UI; erratum written;
the 2026-10-27 README finding is stale).

Proven (evidence/ + commands/cold-3-browser-check.log):
- login → authorize (Login UI v2) → callback → session cookie `mc_session` → populated
  `/workspaces`, for BOTH seeded users, scripted (Playwright channel:'chrome', global npm root,
  no repo dependency), twice (warm + cold-start cycle).
- loginName = **plain username**; `@localhost` and email forms are rejected by this profile.
- callback round-trip ~1.0–1.1s; authorize/login UI first-load ~20s (dev-mode ZITADEL Login UI).
- Backend strict verifier (introspection, private_key_jwt assertion) accepts tokens under
  `MC_OIDC_AUDIENCE=396855005832806403` (project id) — populated pages render = behavioral
  confirmation of the audience contract; the token itself was NOT decoded out-of-band.
- Seeded via the REAL UI command path (seed-browser.mjs; no SQL against event-sourced tables):
  workspace "Walkthrough WS (synthetic)" (mc-alice Owner, mc-bob Member via the member picker —
  requires the dev-only `MC_LOCAL_PEOPLE_DIRECTORY=true`), matters M1/M2/M3 (one duplicated M1
  row from a failed iteration — synthetic, recorded; not deleted to avoid SQL on projections).

Does NOT prove: production behavior, IdP hardening, TLS/multi-tenant posture, $0 bill,
matter-level two-actor flows (matter access is granted separately in the product; mc-bob has
workspace membership only — the G1 verifier session must grant matter access itself).

## E-4 — fault-injection hooks (US-R-02) → CLOSED as RUNNABLE (demonstrated)

`faultproxy/main.go` (loopback-pinned forwarder, mode-file controlled: `off` / `latency-ms=N` /
`status=NNN`), sitting on :8082 which `apps/frontend/.env.local` already targets — zero product
or frontend config changes. One command per fault, obvious inverse each:
`fault-5xx.sh [code]` / `fault-latency.sh [ms]` / `api-stop.sh` (inverse `api-start.sh`) /
`fault-restore.sh`; `fault-demo.mjs` demonstrates all of them once.

Demonstrated (evidence/e4-results.json + e4-*.png, 13 steps):
- 503 injected at the proxy (upstream never called); latency measured 2007ms vs 3–11ms baseline;
  api-stop → 502 `upstream_unavailable`; every restore returns 200 within ms.
- UI during faults (real browser, logged-in session): ReadFailure "Temporarily unavailable —
  Your session is unaffected. Nothing shown here is a result." with Try again, h1/sidebar
  preserved (independently corroborates the UX-L-05 fix shape); after restore, populated UI
  returns; after api restart, populated UI returns.

## Gates

- End-to-end smoke: fresh env up → browser login both users → populated screenshots →
  fault 5xx → restore → env down → orphan check CLEAN. ✓
- Full cycle repeated from the runbook alone (cold start, 4 stages, receipts
  commands/cold-{1,2,3,4}-*.log): down CLEAN → up CLEAN → browser-check PASS both users →
  down CLEAN (0 listeners / 0 running containers across {3000,8082,8083,55440,8080}). ✓
- Existing smoke touching these paths: the CO-17 readyz sequence is the same readiness probe —
  it ran green inside up.sh (readyz 200 direct + via proxy); the stub-IdP env itself was NOT
  re-run (untouched, separate stack). ZITADEL compose lifecycle per ops/p0-local README.
- Tests run: bash -n ×8 scripts; no unit/e2e suites exist for ops scripts (NOT_RUN: Storybook,
  prod build, FE vitest — no product files changed, out of scope).

## Runtime end-state

Env DOWN at return time (cold-cycle stage 4); volumes retained (`mc-p0-claude-pgdata`,
mc-p0-idp) so the next session gets the populated env immediately via up.sh. State dir
(pidfiles/logs/fault-mode/constructed env/object store) destroyed. Nothing left running.

## Mimosa advisory disposition

down.sh L66 (`kill "$pid"`) flagged 命令注入 (medium): **already-hardened** — the pid is
validated numeric by a `case` guard before any kill (same pattern as the CO-17 m2 advisories,
see mc-enablement-minifix-20261101-r1/m2-mimosa-findings.md). No fix needed; recorded.

## Skipped / remaining risk

- Skipped: M1–M5 dataset alignment (the US-PREP dataset spec was never committed and was lost
  with the 2026-11-05 docs cleanup — not reconstructible from history; seeded data is a
  minimal representative set, clearly marked synthetic); matter-level grant for mc-bob
  (G1 setup); Storybook/prod build checks (no product files touched); ZITADEL admin-side
  re-verification of the /dev callback URI (primary URI proven; /dev unused by the BFF).
- Risks: (1) dev-mode everything (ZITADEL plain HTTP, next dev) — walkthrough only;
  (2) `MC_LOCAL_PEOPLE_DIRECTORY=true` is dev-only by design and must never leak to production
  profiles (constructed env only, not committed anywhere); (3) stale-error artifact in
  Login UI v2 can log a "User not found" attempt line before success (cosmetic, recorded in
  results JSON); (4) frontend .env.local is gitignored and machine-local — the runbook states
  the exact values to (re)create it.
- Independent review: none yet — non-author reviewer should re-run the cold cycle from
  walkthrough-env.md §5 + browser/README.md and the browser-check/fault-demo receipts.

Proposed next status: IN_REVIEW (task-scoped commit by author per pre-authorized scope).
