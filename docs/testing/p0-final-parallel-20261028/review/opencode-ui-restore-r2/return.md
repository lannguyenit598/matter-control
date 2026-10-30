# MC-P0-OPENCODE-UI-RESTORE-DELTA-R2 — OpenCode review return

**Identity:** actual OpenCode CLI v2.1.4, provider `opencode`, model `glm-5.3-flash-free` (identity probe exit 0 at 2026-10-28T16:20:53Z; model is session-configured, self-reported). Independent non-author; `codex/unified-project-flow` at HEAD `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc` at open (16:04:17Z) and close (16:22:28Z). Round-2 permission mode: read/hash/static analysis plus (not needed this round) focused pure tests via installed entries only — no `pnpm exec`, no install/relink, no Docker/PG/IdP/browser/lifecycle/credential access, no source edits. Every shell command was rtk-prefixed.

## Verdicts (three, separated)

| # | Scope | Verdict |
|---|---|---|
| A | 20-path source delta: 4-path CSS build fix (`local-ui-css-fix-20261028`) + 16-path presentation delta (`local-admin-medusa-r1`), pinned by manifest SHA `f43738bf…1028` (721 entries, captured 15:54:09.908900Z) | **PASS_WITH_LIMITATIONS** (anchored to the pinned bytes; 4 CSS pins still byte-identical on disk at 16:22:28Z; 16 presentation pins verified at opening and closing member receipts) |
| B | Retained restore evidence `claude-runtime-r2` (46 payloads) | **PASS_WITH_LIMITATIONS** (internally consistent, author-run, not new runtime proof) |
| C | The 721-entry manifest as an authoritative snapshot of the live tree beyond the pinned 20 paths | **NEEDS_INPUT_REFRESH** (31 pinned entries drifted during review; untracked-file set grew 3→6) |

CR-002 remains `DECISION_REQUIRED`. RV-001 stays `CLOSED_SOURCE_ONLY`, scoped to its round-1 reviewed bytes; not reopened (see §5).

## 1. Scope A — source delta review (pinned bytes)

Method: full member verification of the 721-entry manifest at open (16:04:59Z) and close (16:17:20Z); artifact-level three-way inventory diff of `claude-rv001-fix` (719, `de8424ea…4489`) → `local-ui-css-fix-20261028` (721, `91e3904a…abe6`) → `local-admin-medusa-r1` (721, `f43738bf…1028`); `git diff HEAD` on the 16 presentation paths (they had no prior dirty state, so the diff isolates exactly this wave); whole-file reads of the 4 CSS paths.

**Shape is exactly the claimed contract.** A→B: package.json, pnpm-lock.yaml modified; postcss.config.mjs, scripts/check-built-css.mjs added (baselines validated against the A-era manifest). B→C: 16 paths modified, 0 added/removed. The 4 CSS-path pins are byte-identical in B, C and on disk (16:22:28Z recheck).

### A.1 CSS build fix (4 paths)

- `package.json`: exact devDependency `@tailwindcss/postcss: 4.3.3` (matching the installed Tailwind 4.3.3 family; lock resolves `@tailwindcss/node`, `@tailwindcss/oxide` 4.3.3 and postcss 8.5.31); `build` and `build:webpack` now chain `node scripts/check-built-css.mjs`.
- `next build --webpack` is a real flag for the pinned Next 16.4.2: bundled CLI docs `node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md:101` ("Build using the bundled Webpack") and the dist parser `dist/lib/bundler.js` `parseBundlerArgs` maps `options.webpack → Bundler.Webpack`; `dist/cli/next-build.js` passes that bundler into the build. Closed the round's open question from the code, not from memory.
- `postcss.config.mjs`: minimal `@tailwindcss/postcss` plugin. With the pre-existing turbopack `*.css` rule in `next.config.ts` still registered, Tailwind is now integrated through two mechanisms; a possible double application on Turbopack builds is **not** evaluated here (see RD2-002). Author-claimed build runs (`pnpm check`, `build:webpack`, Storybook, frozen-lockfile install, peers, audit) are cited-not-rerun per the round-2 permission; the running server on :3000 belongs to Codex and was not touched.
- `scripts/check-built-css.mjs` (812 B): recursively reads `.next/static`, asserts at least one CSS asset, no raw `@theme|@apply|@tailwind|@custom-variant` directives, and presence of `.flex{`, `.sr-only{`, `.bg-background{`. Weakness: the raw-directive regex misses `@plugin`, `@config`, `@reference`, `@utility`, so "no raw directives" is overstated as a general Tailwind proof (RD2-002). The three must-have utility assertions materially reduce a false green.

### A.2 Presentation delta (16 paths)

Diff-level and token-level verification; all five checks from the review contract pass at source level:

- Auth/returnTo intact: `login/page.tsx` keeps the exact `/api/auth/login?returnTo=<encodeURIComponent(returnTo)>` plain-link (no prefetch comment preserved); `AccountMenu`/`SignOutForm` untouched; single-origin logout POST comment preserved.
- Controls/labels: all form components and their labels are untouched by this wave (only `atoms/*` sizing/padding and presentation classes changed); localized strings keep `en`/`vi` pairs; no sample rows, fake metrics or invented routes introduced (lists still render only real REST data).
- No unmount risk from the new native `<details>` block in the app shell: it contains only Locale/Theme toggles, no mutation form; the toggles remain reachable on mobile (header `details`) and desktop (sidebar footer).
- State axes not conflated: no state-axis token drift in the presentation paths; on the contrary, dark `--dependency-ready` was decoupled from `--primary` into a stable oklch value (light `#174ea6` at `globals.css:36`; mapping `--color-dependency-ready` at :114). One presentation-only note: `matter-list`/`workspace-list` role badges previously used `primary` for OWNER; the wave renders all roles as `variant="neutral"` with the truthful role string as text (RD2-003).
- Token/icon realism: every custom class used resolves (`text-dependency-ready`, `bg-background`, `text-muted-foreground`, `bg-card`, `divide-border`, `w-[14.25rem]`); all newly imported lucide icons exist in the installed `lucide-react` (`Scale`, `Settings2`, `ArrowRight`, `UserRound`, `Building2`, `Briefcase` — CJS require probe return `object` for each).

Minor presentation notes recorded as findings RD2-004/005/006 (brand icon colored with a state-axis token purely decoratively; sidebar footer `grid-cols-2` holding a single `<LocaleToggle/>` child; native `<details>` popover does not close on outside click or navigation; `font-feature-settings: 'cv02','cv03','cv04','cv11'` is Inter-specific and inert for the Arial fallback chain).

**Rendered-state limitation (not repaired here):** no keyboard/focus-order/contrast/reflow/screen-reader verification; visual quality per the Medusa reference and the build-gate behavior were authored-claimed only (cited-not-rerun). Those remain the human/browser/build-transfer gates.

## 2. Scope B — retained `claude-runtime-r2` evidence

46/46 payload pins re-verified in my namespace at 16:18:38Z (SHA-256 + byte size per `outputs-manifest.json` `d77db579…7826f`). Claim-vs-artifact cross-checks, all consistent:

- Restore run `20261028T153536Z`: summary.json matches steps.log/restore-run-sh.log (exit 0, 15:35:36–15:36:07Z, 31 s); census TSV has exactly 34 table rows with `matters 54` and `workspaces 51`; 3 object hashes identical; marker source 1 / restored 0; boundary `15:35:48.507148+00 seq-sum 12408`; archive 241,230 B = archive.sha256/archive.bytes; corrupt/truncated `pg_restore` exits 1 with 0 tables left; altered-object readback exit 1; missing-object detected by comparison (exit 0, output differs). `readback.diff` is the 133-byte verdict JSON (missing/unexpected/differing empty; counters match; object_failures 0) — not a mismatch; the two readback JSON receipts are byte-identical (same SHA).
- Negative probes: 26 cases — summary `pass 21, fail 0, not_observable 5`; per-case rows confirm 21 PASS (health/ready, 401 with and without bearer, signed-out BFF, 12 signed-out routes, callback no-params/unbound-state, login redirect shape) and 5 RV-001 cases NOT_OBSERVABLE with HTTP 200, matching the return's account of the wrong probe surface. Statically corroborated: the matter layout mounts `MatterScope`, which renders `<ReadFailure kind="sign-in">` before any work-item content when unauthenticated — so the signed-out probes indeed cannot exercise RV-001.
- Browser cases: 31 rows — 24 `BLOCKED_BROWSER_TOOL_UNAVAILABLE`, 1 `AWAITING_HUMAN_TRIAL` (AC-137), `R2-CSS-01` PASS (Turbopack CSS hashed artifacts: 41,045 B, no raw directives, all three utilities), `R2-CSS-02` FAIL (Webpack CSS 25,313 B, raw directives true, all three utilities false), plus the five R2 forwarded rows (incl. `R2-RV001-BACK`, `R2-CR002-OBS`, `R2-GW-01..03`). The Webpack reproduction honestly notes the build failed at collect-page-data on the author's own env typo after the CSS stage — the CSS defect statement stands on the emitted asset.
- Auth/idp cases: lineage-pinned to the prior namespace; PASS rows map to the probe receipts; `hosted-login-reachable NOT_RUN`, `human-login-A BLOCKED_EMAIL_VERIFICATION`, real-token/isolation/refresh/expiry/outage rows blocked — matching the return table.
- Author-run deviations disclosed and visible in artifacts: unintended pnpm pre-script install attempt (kept in `fe-snapshot-build.log` with its failure text and its node_modules re-link), first build with invalid `API_MODE`, earlier self-created gitignored `.env.local` (public ids, outside the manifest, not copied into the snapshot); pinned-Go-build receipt is weak (`go-build-mcapi.log` empty; binary existence instead evidenced by resource-ledger + owned-runtime ps + probes hitting :8084), `docker-identity-check` stderr contains template-parse errors while pg_isready stdout succeeded and container identity is separately recorded in `containers-before-restore.json` with distinct IDs/ports.
- Ownership boundaries respected: the 15:42:45Z closing inventory shows the unowned `mc-local-login` runtime on :3000/:8081 was never signalled or reused; `restore-target` started only after the recorded approved `docker start` (15:35:05Z); secret scan of the 41-file namespace reports no DSN/password/JWT/cookie/bearer; credentials used only through the private allowlist paths. R1's "runtime retained" line is correctly declared no longer true (disclosed termination).
- Restore scripts pinned unchanged since R1 (run.sh `8e4af211…488`, verify.py `93e21772…f42b` hash re-verified at write time, test_verify.py `80d8c5ed…`); pure checker 9/9 OK with fail-closed semantics in the test names; `bash -n` clean.

CR-002: not observed (needs a session) — `DECISION_REQUIRED` unchanged. Restore scope is backend/database only; the return explicitly does not claim a frontend restore and no RPO/RTO numbers are claimed (explicitly no production commit).

## 3. Scope C — manifest authority over the live tree

| Receipt | UTC | Result |
|---|---|---|
| Open, full 721-member check | 16:04:59Z (start stamp; run <1 s pattern) | 0 missing; **5 mismatches** (matter-members, matter-scope.test, matter-scope, matters/repository.ts, workspace-members); selection 724 (extras = 3 legacy symlink dirs); all 20 delta pins matched |
| Close #1, full 721-member check | 16:17:20Z | 0 missing; **31 mismatches** (11 backend + 20 frontend paths outside the delta); selection 727 (extras = 3 symlinks + 3 new untracked backend files: `member_candidates.go`, `member_candidates_test.go`, `people_directory_test.go`); all 20 delta pins matched |
| Stability recheck | 16:22:28Z | identical 31-path mismatch set and 6 extras; all 20 delta pins matched |
| Delta-pin recheck (C pins, all 20) | 16:22:01Z | **20/20 matched** (an intermediate ad-hoc probe at 16:22:00 that mixed B-era pins for the 16 presentation paths produced a false "16 mismatch" alarm; superseded — the method error is documented, not drift) |

Writer activity was observed during the review (mtimes 16:04:43Z, 16:05:58Z, 16:10:52Z, 16:13:53Z across matters/workspace member flows, backend identity/work ports, sqlc artifacts, and `lib/oidc/flow.ts` + flow.test.ts — the latter are RV-001-scope-adjacent). HEAD and the branch never moved; the porcelain digest changed. An intermediate probe result that briefly suggested the 16 delta paths had been rewritten was a reviewer-script error (B-era pins instead of C pins), superseded by the full member runs; no drift ever touched the 20 pinned delta paths.

**Consequence:** the manifest `f43738bf…1028` no longer describes 31 live members and 3 new untracked files. Everything outside the pinned 20-path delta is out of authority → `NEEDS_INPUT_REFRESH` for the affected scope. RV-001 conclusions keep their original scope (the reviewed fix bytes); the new `flow.ts`/`flow.test.ts` writes are a **new review item** after consolidation, not a silent extension or a reopening of the closed audit.

## 4. Machine-readable receipts

Opening (16:04:59Z), closing (16:17:20Z), stability (16:22:28Z) and 46-pin (16:18:38Z) member-level receipts with actual UTC, including the full manifest-vs-fs pairs for all mismatches, are embedded in `checks.json` of this directory. `outputs-manifest.json` pins the other four files (not itself).

## 5. Round-1 reconciliation (per intake)

- Old claim limitation: my round-1 `inputs.json` ("member_check … re-checked at close") and the old `outputs-manifest.json` key_input_pins line ("verified open+close") read stronger than what was executed. The only full-member receipt of round 1 is old check C4 (~15:18Z: 719/719, 722-path selection, 3 symlink dirs). The close-time check (old C12, 15:36:39Z) covered the 9 pinned packet-file hashes, HEAD equality and the porcelain digest `dc0f69bee6b002bf` — not a second member-level run. This round's receipts are the first machine-readable second full-member verification; the old statement is hereby limited to that scope. Old artifacts under `review/opencode-post-rv001-r1/` are preserved untouched (manifest `a734e3f2…ba27`; the four payload hashes re-verified at 16:19:18Z, incl. `findings.json f3d91454…edf7`).
- OR1-001..006 remain valid as recorded; delta-author claims (`pnpm check`, builds) and the author-declared pre-fix baseline `f9cbbdf4` keep their recorded disposition (cited/lineage-UNPROVEN respectively). No old output was rewritten; no audit restarted.

## 6. Not claimed / skipped

No browser/visual/keyboard/contrast outcome verified; no hosted IdP, email-verification, real-token, A/B isolation, refresh/expiry, logout, or outage run; no frontend-restore claim; backend and frontend gates beyond the pinned delta not run (author claims cited only); no build re-run including `pnpm check`/`build:webpack`/turbopack double-application behavior; no commit/branch/deploy/paid-provider actions; no CR-002 observation; no verdict on anything outside the pinned 20 paths and the retained evidence namespace; full member verification receipts are point-in-time (16:22:28Z) and stop being current the moment the writer writes again.
