# MC-FE-DESIGN-REVIEW-20261106 — Dispatch prompt (design review + gated improvement, skill-driven)

Task ID: MC-FE-DESIGN-REVIEW-20261106
Requested by: Product Owner (via coordinator) — design-quality review of the MatterControl frontend using the three deliberately installed design lenses, then a prioritised UI/UX improvement backlog.
Status target: IN_REVIEW → RETURNED (verdict + improvement backlog + optional prepared quick-win patches). Design direction changes remain a PO decision; nothing here approves commits, merges or deploys.

## 0. Identity and mode

- You are the dispatched design reviewer. UI/UX design ownership sits with OpenDesign; if you are OpenDesign this is your owning review, otherwise you are an independent reviewer and must not have authored the code under review (non-author rule) — if you did, STOP and return `CONFLICT_OF_INTEREST`.
- Two phases: **Phase 1 REVIEW** (always) and **Phase 2 IMPROVE** (gated, §6). Record your actual agent/tool identity; never claim an external agent ran without invocation and returned evidence.
- Mode discipline: Phase 1 is read-only (screenshots, Storybook, probes). Phase 2 produces a backlog and, at most, **prepared patch files in an isolated worktree — no commits, no push, no edits to the live checkout**.

## 1. Pinning — pre-flight (mandatory; abort on mismatch and report)

- Repository (absolute): `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`
- Branch: `develop`
- Pinned base commit: `41098a4d8690a1f3ce3864ace50fc20ca1221caa`
- Pre-flight (record each):
  1. `git rev-parse HEAD` — re-pin if different; verdicts bind to re-pinned bytes.
  2. `git status --porcelain` — dirty tree allowed; record; note dirty files under `apps/frontend`.
  3. Environment check for design tooling: Chrome availability, Node version, and whether `puppeteer-core` is installed. Known baseline: **puppeteer-core is NOT installed** → impeccable's `--render`/slop-lint render path is BLOCKED; record and use the browser fallback in §4 instead of installing anything (no dependency installs without explicit approval).

## 2. Scope and approved design anchors

Surfaces (verify against the tree; walk what exists, skip what does not): Workspaces list, Matter (Hồ sơ) detail, Filing (Hồ sơ khai) screens, Actions (Hành động), Approvals (Chấp thuận), Control Room / Grid, ⌘K command palette, Preflight panel, term-sheet screens (newest: `fc367ce1`/`8e32e424`/`dd4cd526`), Storybook stories.

**Approved anchors — review against these, not against personal taste:**

- **Solid Glass intent (PO-adjudicated 2026-11-01):** blur on overlays only; near-opaque light faces; dark mode without saturation boost. Tokens live in `globals.css` (lines ~50-53, 130); known pitfall: lightningcss drops standard `backdrop-filter` when the `-webkit-` variant is present.
- **Terminology (D-3, FINAL):** Matter = "Hồ sơ", Filing = "Hồ sơ khai"/"Khai", Action = "Hành động", Approval = "Chấp thuận", As-of = "Dữ liệu tại"; Vietnamese role names per `terminology-final.md`.
- **Dimensions already ruled:** work-primary 160x44 is PO-approved (not a bug); UI-F10 corrected to 32px.
- **Already-rejected directions (do NOT re-propose):** glass-everywhere, radius 32 everywhere, rainbow accents, overshoot animations, 58px titles. The 3-lens borrow list was adjudicated down to the ⌘K palette only — refinement, not replacement.

## 3. Skill passes — strict single-lens sequencing

**Hard rule: never run two or more design-taste skills on the same page in the same round.** Each lens below is its own separate pass; do not interleave. Record per-pass evidence so verdicts can be attributed to a single lens.

| Order | Skill | Pass output |
|---|---|---|
| 1 | `/design-taste-frontend` | Taste lens: composition, hierarchy, restraint, craft across all surfaces (separate round, own screenshots) |
| 2 | `/impeccable` | Quality lens: consistency of primitives, spacing/type rhythm, states (hover/focus/empty/loading/error), micro-interactions; note render-path limitation (§1.3) and fall back to browser capture |
| 3 | `/hallmark` | Identity lens: does the product feel like one system — token adherence, Solid Glass conformance, brand coherence across vi/en |
| 4 | `/web-design-guidelines` then `/frontend-design` | Guideline conformance: layout, responsive behaviour, interaction affordances, cross-screen IA |
| 5 | `/design-testing-strategy` + `/browser-use:web-gui-tester` | Design QA (G3/G4 framing): testable design criteria, visual QA against the running app or Storybook; structured capture per surface |

## 4. Runtime rules — hard constraints on this workstation

1. **Prefix every shell command with `rtk`** (host rule; proxy for unwrapped commands). Follow `/Users/nguyenvanlan/.codex/RTK.md` if present; else record the failure and proceed.
2. **No shared-`.next` concurrency:** before starting any dev server or build, check `lsof -i :3000` and `lsof -i :6006`. Never `next build` while a writer is live (2026-10-31 incident).
3. **Populated-path reality:** the local demo path has known gaps (product data 503s; ZITADEL authorize rejects the configured redirect_uri; stub-IdP browser login was an unowned gap). Do not burn the round making login work. Priority: (a) Storybook stories as the primary reviewable surface — verify current Storybook health first (historically partially broken), then (b) whatever app pages render without IdP, then (c) mark the rest `VERIFICATION_BLOCKED` with the exact blocker.
4. **Concurrency with other sessions:** shared registers/boards may be edited live by other sessions — re-read immediately before any insert.
5. Synthetic data only in screenshots; no secrets/tokens/credentials in captures or logs. macOS quirks: no `timeout` command; `openssl rand` for randomness; shell vars do not persist between Bash calls.
6. A11y and code-level Next.js review live in `MC-FE-NEXTJS-REVIEW-20261106` — cross-reference, do not duplicate that work here.

## 5. Delta verification — prior design state to recheck at HEAD

Return a disposition per item (`CONFIRMED_FIXED` / `STILL_OPEN` / `REGRESSED` / `NOT_FOUND`), with visual or source evidence:

1. UX audit 2026-10-30 blockers: Workspaces mislabeled "Matters/Hồ sơ"; page content stuck in server-locale EN (cookie-locale D-2 fix); populated local path absence.
2. Fix-wave UX items marked `FIXED_PENDING_VERIFY`: UX-L-01/02/04/05/06 (+ Z-F-01/02/03 guard copy using approved UX copy).
3. F8 aria-live relay (reprioritised to Pha 1 by OpenDesign CO-15) — present and announced correctly?
4. Populated-UI checklist **V-01..V-14** (from D-3/CO-15) — run what is runnable, mark the rest blocked.
5. Plan P-01..P-15 status vs current tree (P-06 split still respected: EN sweep now, vi labels after R10?).
6. Contrast: previously 50/52 pairs PASS — re-run the pair sweep on changed surfaces; flag any new pair.

## 6. Phase 2 — improvement backlog (gated)

Classify every improvement into exactly one lane:

- **LANE-A (within approved intent):** polish inside the Solid Glass intent, D-3 terminology, and existing token system — spacing/type rhythm, state coverage, empty/loading/error polish, copy corrections to D-3, a11y-adjacent visual fixes. No PO gate needed in principle; still routed through the normal implementation dispatch (e.g. a fix-wave).
- **LANE-B (material design direction):** anything that changes the visual language, adds dependencies, adds motion/refraction systems, alters the adjudicated borrow-list outcome, or reopens a rejected direction. **Requires explicit PO approval — present as a decision request (D-nn), not a change.**

Backlog format (one row per item): ID `UX-B-01..` · lens(es) that surfaced it · surface + `file:line` · evidence (screenshot path) · proposal · effort S/M/L · lane · dependency on prior items (e.g. vi labels after R10).

Quick-win patches (LANE-A, effort S, zero-risk only) may be prepared as **patch files** under the evidence dir in an isolated worktree — never applied to the live checkout, never committed. Applying them is a separate dispatch decision.

## 7. Verdict and output

- Findings `UX-R1-01..` severity `P0` (broken/blocked core flow, PO-ruled violation) / `P1` / `P2` / `P3`; each with surface, `file:line`, evidence path, and which lens found it.
- Verdict: `PASS` | `PASS_WITH_LIMITATIONS` | `CHANGES_REQUIRED` | `BLOCKED` + explicit limitations.
- 3-lens synthesis table (per the 2026-11-01 precedent): per lens — keep / refine / reject, then the adjudicated union.
- Output: `docs/testing/fe-design-review-20261106-r1/` containing `report.md`, `lenses/design-taste.md`, `lenses/impeccable.md`, `lenses/hallmark.md`, `backlog.md`, `evidence/`, `commands/`.
- Return per `docs/ai-sdlc/orchestration-protocol.md`: task ID, actual agent identity, base/head, changed files (expected: none outside evidence dir), acceptance results, tests/visual passes run vs not run, risks, proposed next status, **what was skipped + remaining risk**.

## 8. Non-goals

No commits, no push, no dependency installs, no re-adjudication of already-rejected directions, no re-opening product positioning or the approved P0/P1/P2 baseline, no production deploy, no Step 03 claims. Unrunnable surfaces stay `VERIFICATION_BLOCKED` — never inferred from Storybook or source.

## 9. ADDENDUM-1 (2026-11-06) — re-dispatch hardening after CONFLICT_OF_INTEREST return

First dispatch returned `CONFLICT_OF_INTEREST` per §0 (correct behaviour; return record `RETURN-CONFLICT-OF-INTEREST.md`). Its read-only pre-flight surfaced two facts that bind every re-dispatch:

1. **Branch label ≠ pin:** the executing session sat on `zcode/r2-storage-fix-20261106` while HEAD was byte-identical to the pin `41098a4d`. From now on record `git branch --show-current` alongside `git rev-parse HEAD`; verdicts bind to the pinned **bytes** — a matching HEAD on a differently named branch is acceptable only if recorded.
2. **Foreign dirty workstream in the shared checkout:** 3 dirty files under `apps/frontend` belong to an R2 storage-fix workstream (5 M + 5 ??). Therefore:
   - **Preferred: isolated worktree** — `git worktree add <tmp-dir> 41098a4d` and run every lens pass against that clean tree. Do not build, serve, or capture from the shared checkout.
   - If the shared checkout must be used: foreign dirty files are untouchable, and every capture must state that dirty bytes may have been served — such passes are labelled `DIRTY_STATE_UNVERIFIED` and cannot produce PASS verdicts on affected surfaces.

3. **Routing placeholder:** reviewer identity is filled by the PO's routing decision in the dispatch note (ADDENDUM-2). If the PO explicitly waives the non-author rule for ZCode, all output must be labelled `SELF-REVIEW / OWNER-CONFIRMATION` per the MC-003A.8 precedent: it cannot gate any release or stage, and a non-author reviewer is still required before any verdict gates anything.

## 10. ADDENDUM-2 (2026-11-06) — PO routing decision: ZCode + explicit non-author waiver

The PO has routed this review to **actual ZCode** with an explicit waiver of the §0 non-author rule. Binding conditions:

1. **Label everywhere:** `SELF-REVIEW / OWNER-CONFIRMATION` must appear in `report.md` §0, in the header of every lens report (`lenses/*.md`), in `backlog.md`, and next to every verdict/severity line. An unlabelled verdict from this run is invalid.
2. **What this run can and cannot do:** it may produce findings, the 3-lens synthesis, and the improvement backlog. It **cannot** produce a DONE, gate a release/stage, or close any `FIXED_PENDING_VERIFY` / `CONFIRMED_FIXED` item as independently verified — §5 dispositions from this run are owner confirmations, not independent verification.
3. **Non-author confirmation still required:** the synthesis report must be handed to a non-author reviewer (OpenDesign or OpenCode) for a confirmation pass before any verdict gates anything. Recommended shape: confirmation review of `report.md` + `backlog.md` only, not a full re-run.
4. **Bias control:** the reviewer authored the in-scope surfaces. Lens passes must evaluate against the §2 approved anchors (not against implementation rationale), and findings against the reviewer's own prior work must be listed explicitly in a dedicated "own-work findings" subsection.
5. **Everything else unchanged:** §1 pins + ADDENDUM-1 pre-flight hardening (isolated worktree at `41098a4d` mandatory — the shared checkout carries the R2 dirty workstream), §3 single-lens sequencing, §4 runtime rules, §6 lanes (LANE-B still needs PO approval regardless of this waiver), §7 output paths, §8 non-goals.
6. The session that returned `CONFLICT_OF_INTEREST` may resume this task: its §1 pre-flight evidence (Chrome present, Node v24.22.1, puppeteer-core absent, dirty-tree inventory) is recorded and reusable after re-verifying bytes at start.
