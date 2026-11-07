# MC-FE-NEXTJS-REVIEW-20261106 — Dispatch prompt (review-only, skill-driven)

Task ID: MC-FE-NEXTJS-REVIEW-20261106
Requested by: Product Owner (via coordinator) — re-review of the Next.js frontend with the installed skill set.
Status target: IN_REVIEW → RETURNED (verdict + findings). This is a review, not an implementation wave.

## 0. Identity and mode

- You are the dispatched **independent, non-author reviewer** of the MatterControl frontend. If you (or the session you run in) authored any of the code under review, STOP and return `CONFLICT_OF_INTEREST`.
- Mode: **REVIEW_ONLY**. You may run tests, builds, linters and read-only probes, and write only into your own evidence directory (§6). No code edits, no dependency changes, no commits, no push.
- Record your **actual agent/tool identity** in the report. Never claim another external agent ran without invocation and returned evidence.

## 1. Pinning — pre-flight (mandatory; abort on mismatch and report)

- Repository (absolute): `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`
- Branch: `develop`
- Pinned base commit: `41098a4d8690a1f3ce3864ace50fc20ca1221caa` (merge of zcode/cert-termsheet-20261105)
- Pre-flight (record output of each):
  1. `git rev-parse HEAD` — if it differs from the pin, re-pin to actual HEAD, record the change in report §0; all verdicts bind to the re-pinned bytes.
  2. `git status --porcelain` — a dirty tree is allowed; record it and note whether any dirty file is inside `apps/frontend`.
  3. Confirm `apps/frontend/package.json` exists and reports `next 16.4.2` / `react 19.3.1`.

## 2. Scope — `apps/frontend` only

Out of scope: `apps/backend`, `tools/`, `ops/` (cross-cutting issues go in as one-line pointers, not findings).

In-scope targets (verify against the tree; do not assume from this list):

1. **App Router pages/layouts** — routing and server/client component boundaries across Hồ sơ / Filing / Action screens.
2. **BFF route handlers** — server-side session store, opaque-handle cookie only, token-exposure negatives (contract rev 3), request-meta plumbing.
3. **Guard UX copy + flows** — Z-F-01/02/03 guard surfaces (purpose-typed criteria, signature gate, NOT_DECLARED visibility), locale cookie (D-2 vi/en), instant-nav rig (`instant-nav.rig.md`).
4. **Solid Glass styling** — glass tokens + `globals.css` (known pitfalls: lightningcss dropping standard `backdrop-filter` when `-webkit-` variant present; `[open]` specificity), 32px control sizes.
5. **⌘K command palette** — native dialog + `Link` primitives, `navigation.tsx` single-source destinations.
6. **Term sheet workflows** — newest surface: `fc367ce1`, `8e32e424`, `dd4cd526` (term sheet review/recovery workflows).
7. **Test suites** — Vitest unit/component, Playwright e2e (`e2e/`), Storybook stories (incl. addon-a11y usage).
8. **OpenNext/Cloudflare wiring** — `open-next.config.ts`, `next.config.ts`, `wrangler.jsonc`, `scripts/build-worker.mjs` (config review only; no deploy).

## 3. Skill passes — invoke by exact name, in sequence

Skills auto-trigger only in fresh sessions; invoke explicitly here. **Never run two or more design-taste skills on the same page in the same pass.** Priority order if capacity is limited: A → B → D → E → C.

| Pass | Skill(s) | What to produce |
|---|---|---|
| A. Source/static | `/vercel-react-best-practices` then `/next-bundle-optimizer` | React 19 / Next 16 pattern review (async components, caching semantics, client-component leakage, dynamic imports, `"use client"` hygiene) |
| B. Accessibility | `/accessibility` | Keyboard nav, ARIA, aria-live relay (fix-wave F8), contrast; corroborate with `@storybook/addon-a11y` output if Storybook runs |
| C. Design taste (optional this round) | pick **one** lens: `/design-taste-frontend` | Consistency with approved Solid Glass intent (blur only overlays, near-opaque light faces); record which lens was used |
| D. Tests | `/vitest-skill` then `/playwright-skill` | Test-quality review: coverage gaps vs FR map, assertion strength, flake patterns (known: click-while-disabled timing flakes); run `pnpm test` and `pnpm test:e2e` only per §4 runtime rules |
| E. Performance | `/web-perf` | Only against a build you own (§4). Lighthouse/trace evidence with env recorded; dev-mode numbers must be labeled DEV_ONLY |
| F. Optional P2 | `/next-partial-prefetching-adoption` | Prefetching opportunities on navigation between matter screens |

Each pass records: skill name, version if stated, invocation evidence, findings with `file:line`.

## 4. Runtime rules — hard constraints on this workstation

1. **Prefix every shell command with `rtk`** (host rule; `rtk` proxy for commands it does not wrap). Follow `/Users/nguyenvanlan/.codex/RTK.md` if present; if absent or broken, record the failure and proceed.
2. **No shared-`.next` concurrency.** Before any `next build` / `next typegen` (which writes `.next/types`), check `lsof -i :3000` and `lsof -i :6006`. If a dev/Storybook server is live, do NOT build into the shared `.next`: either have the coordinator stop the writer, copy to an isolated worktree, or mark build-dependent rows NOT_RUN. (2026-10-31 incident: a build overwrote the live dev server's `.next`.)
3. **Semble search first** for code exploration with the exact repo path; if Semble is unavailable/broken, record the failure once, then use targeted grep. Do not re-run the same semantic query with grep.
4. Known quirks: no macOS `timeout` command; use `openssl rand` (not `tr`/`urandom`) for randomness; shell variables do not persist between separate Bash calls; `pnpm typecheck` runs `next typegen` (see rule 2).
5. Do not touch other agents' files; never modify `.mimosa/`, `.agents/`, `ops/`, or anything under evidence dirs of other tasks.
6. Storybook runtime was historically broken at baseline — verify current state; do not assume either way.

## 5. Governance and evidence rules

- Synthetic data only. No legal matter data, secrets, tokens or credentials in Git, prompts, screenshots or logs. Redact before committing.
- Distinguish explicitly in every claim: **documented support** vs **local executable presence** vs **successful invocation** vs **completed runtime verification**. Label findings that rest on source reading alone as `SOURCE_ONLY`.
- For every executed check record: tool/version, environment, timestamp, exact command (or UI action), exit/error, input revision, output location.
- `NOT_RUN` stays `NOT_RUN` — never infer browser, IdP, provider or production behavior from source checks.

## 6. Findings, verdict, output

- Finding IDs `FE-R1-01..`, severity `P0` (blocks release/gate) / `P1` / `P2` / `P3`. Each finding: location (`file:line`), evidence, impact, proposed fix (**proposal only — do not implement**).
- Verdict: `PASS` | `PASS_WITH_LIMITATIONS` | `CHANGES_REQUIRED` | `BLOCKED`, with an explicit limitations list.
- Output: `docs/testing/fe-nextjs-review-20261106-r1/` containing `report.md`, `evidence/`, `commands/`.
- Return format per `docs/ai-sdlc/orchestration-protocol.md`: task ID, actual agent identity, base/head, changed files (expected: none outside the evidence dir), acceptance results, tests run / not run, risks, proposed next status. End the report with **what was skipped and remaining risk**.

## 7. Non-goals

No fixes, no dependency upgrades, no production deploy, no provider/account changes, no Step 03 claims, no re-opening product positioning or the P0/P1/P2 baseline. Missing final independent/browser/IdP verification must remain open, not inferred.
