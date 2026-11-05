# Fix-wave #1 HOLD run — 2026-11-01 (post-pin dac4262)

- **Agent:** actual ZCode (fix-wave #1 session, continuing per direct PO/coordinator instruction after the pin). **Author-adjacent verification at the pin — every verdict below is AUTHOR-RUN; OpenCode's independent re-run remains the closure gate.** Nothing here is CLOSED_VERIFIED.
- **Re-pin:** product-code bytes are pinned at **`dac4262`** ("Fix wave F1-F6…"); `dac4262..HEAD(783d798)` = records/docs only, **0 apps/** files changed** (verified by `git diff --name-only`) — so receipts anchor to `dac4262` bytes at HEAD `783d798`. The fix commit landed via playbook B3 (PO Terminal commit) per the adjudication record `72266cb`.

## HOLD-2 — Z-F-01/02 repro r2 on the NEW semantics (HTTP, committed bytes)

New test `TestZFRepro_R2FilingF_OnD9Semantics_HTTP` (productapi, `filing_server_test.go`) replays the r2 filing-F scenario over HTTP against the in-memory contract double:

1. **Z-F-01 / filing F**: proof-required filing with a single OUTCOME criterion → `POST …/stage PACKAGE_PREPARATION` → **409 `package-criteria-required`** — exactly where the old r2 driver passed. The old script failing here IS the fix working.
2. **Z-F-02**: package criterion declared + accepted by the independent verifier, no SIGNATURE criterion → `POST …/stage SUBMISSION` → **409 `signature-criteria-required`** (package gate outranks, so the package must be satisfied first — the test proves the precedence too).
3. **D-9 flow**: PACKAGE + SIGNATURE + OUTCOME declared; package and signature claims offered by alice and accepted by bob (designated verifier); `SIGNATURE` advance carries the version; SUBMISSION → 200, stage `SUBMISSION`, `outcomeVerification: PENDING`; checklist exposes `package`/`signature`/`outcome` parts and the SIGNATURE criterion's purpose.
- Receipt: full productapi package `-race` **57/57 exit 0** — `commands/hold-20261101/zf-repro-http-full-package.log`.
- Test-authoring notes (for the record): the create-criterion response carries the WHOLE checklist sorted by id (pick the new criterion by title, not position); claims are created by the evidence submission (read claim ids from the proof checklist afterwards); verifier designation is NOT part of `proofFixture` (TestProof_HTTPFlow does it inline).

## HOLD-3 — locale probe 22 routes on the prod build at the pin

- Frontend tree clean vs `dac4262` (0 diff). Temp copy rebuilt (node build **29/29**), `next start` isolated on 127.0.0.1:18925 (API_MODE=rest, unreachable API base — same method as the wave probe).
- **22/22 PASS** — `<html lang="vi">` + vi strings + h1 present at t=0 on every route: `commands/hold-20261101/probe-22-routes-pin-dac4262.log`. Probe server stopped after the run.

## HOLD-4 — root-shell split adjacency (PI-02/03)

- Worker build at the pin: **exit 0** (`.open-next/worker.js`).
- Node preflight `pnpm preflight .next/standalone --require-artifacts`: **exit 0** ("clean"); worker preflight `pnpm preflight .open-next --require-artifacts`: **exit 0**.
- Ops renderer `node --test ops/deploy/profiles.test.mjs`: **6/6 pass**.
- **Interpretation caveat (binding):** OpenCode leg-2 (OV-R8-01, P1) proved `release-preflight.mjs` is **content-blind** — these "clean" results prove only STRUCTURAL adjacency (the root-shell node/worker split + resolveAlias did not break the artifact shape, no `.env`-name crash, profiles renderer green). Content trust (sentinels/PEM detection) is unproven until wave-2 G2 fixes the script and OpenCode re-runs the R8 probes. PI-02 (service accounts) verdict stands per OpenCode (render-verified on `bb54d6e`; no SA-relevant file changed since).

## HOLD-5 — PORT/TTL backlog

- **TTL-30s (PI-01): stays CLOSED without a rerun** — OpenCode's `verify-PORT-TTL-rerun` anchored `bb54d6e`; `git diff bb54d6e..dac4262 -- apps/backend/internal/config/product.go` is **empty** (the TTL-carrying config), and the leg-2 diff-scope check already kept ops/.github/scripts untouched. File-continuity extends the verdict to the pin.
- **PORT-02 (four local profiles): PARTIAL at the pin** — node profile **built AND booted** (the probe server above served all 22 routes), worker artifact **built + preflight-clean**; Cloud Run-shaped container, AppHosting adapter artifact and the Go image build: NOT_RUN here (time-boxed; local docker build is possible without provider inference and is left to the OpenCode PORT re-run for a pinned four-profile pass).
- **PORT-03/04/10/11: NOT_RUN** — same honest scope OpenCode recorded (running BFF+stub-IdP with origin swaps, old/new build pair with a browser form submission, loaded services + load generator). They belong to the OpenCode PORT re-run after the wave-2 units land.

## NOT_RUN / skipped

- Anything in the wave-2 lane (OV-F1-01..04, OV-R8-01, OV-R12-01, F8/G7): assigned to the next session by the dispatch board; this run did not touch their files.
- Browser-rendered UX verification and contrast.js (no browser in this session); Storybook runtime render.

## Verdicts proposed (all AUTHOR-RUN, for OpenCode confirmation)

| Item | Verdict at `dac4262` |
|---|---|
| Z-F-01/02 backend semantics (r2 repro, HTTP) | **PASS_AUTHOR_RUN** (OpenCode already PASS on committed bytes; UI path stays blocked by OV-F1-01 → REWORK_REQUIRED stands until wave-2 G1) |
| Locale 22-route probe (prod build at pin) | **PASS_AUTHOR_RUN 22/22** |
| Root-shell adjacency (PI-02/03) | **STRUCTURAL PASS_AUTHOR_RUN**; content trust awaits OV-R8-01 fix |
| TTL-30s | **CLOSED extended by file-continuity** |
| PORT-02 | **PARTIAL_AUTHOR_RUN**; PORT-03/04/10/11 NOT_RUN |
