# MatterControl R9 — return

Task: **MC-P0-DESIGN-R9-TARGETED-CORRECTION** · Priority: **P0** · Status: **AUTHOR_COMPLETE_WITH_VERIFICATION_BLOCKERS**.
Actual author/tool/mode: Claude (Anthropic), running as the Claude Code agent in this session, direct file edits + shell execution (no sub-agent spawned for this package's content, no browser, no network).
Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. Branch: `codex/unified-project-flow`. HEAD re-verified at return time via `git rev-parse HEAD`: `a62d838791ba188838c4ff00b7b6e265ac775056` (unchanged from the task's stated base/head throughout this session).
Working tree: untracked/modified elsewhere in the repo (a separate Claude Code BE+FE implementation session's work), none of it touched, read, or staged by this task. No `git add`/`commit`/`merge`/`push` was performed.

This is a **targeted correction** of four findings a reviewer reproduced against `docs/design/p0-handoff-r8/` (R8-N01..04). It is not a re-finalization: R8's direction, art system (Enterprise Precision, Compact density, EN/VI legal text, Lucide icons), approved axis vocabulary, permission matrix, CAS semantics and six screen layouts are all carried forward unchanged and re-verified, not redesigned.

---

## 1. Inputs consumed and their hashes

| Input | Bytes | SHA-256 | Confirmed |
|---|---|---|---|
| `docs/reviews/p0-design-r8-intake-20261027.md` | 12,444 | `2fc0e55939c6caedfb7c036b1727ed044cb6253410bbd6a26d45eca77ad4eb04` | Matches task-declared pin exactly |
| `docs/design/p0-handoff-r8/return.md` | 11,319 | `ba6e720a865b989f04416d1631d16317df049d4e0050c1005d21b55bc5f1b1db` | Matches task-declared pin exactly |
| `docs/testing/p0-design-r8-intake-20261027/receipt.json` | 23,701 | `84e2ce59dd6467797d1c0d256d74fa5619ff469802d6a9665b71d83e7317a9b0` | Matches task-declared pin exactly |
| `docs/testing/p0-design-r8-intake-20261027/reviewer-probes.cjs` | 2,715 | `e27fb28a69a87e59f1fe44811eb68a7de87ea05cdd3f0fe32c1504296c6be022` | Matches task-declared pin exactly |

Re-verification command and raw output: `evidence/run-20261027T084209Z/pin_verification.*`.

`docs/implementation/p0-zcode-execution/local-contract.md` — **read-only**, never written by this task. It legitimately advanced twice during this session (the separate Claude Code BE+FE implementation session owns it):

| When read | Bytes | SHA-256 |
|---|---|---|
| Start of this session | 22,767 | `dbb349e18b8390e0ca020a0bbda5fc6b01d3962efec1dd2867e5529ed444606f` |
| Mid-session | 23,077 | `377f7ae1758d302952e9a3417ac60dc1b88e94f9e976ed53588fd2586bd3f2c4` |
| **At return time (current)** | **28,248** | **`3e89654f0fabdac877e311fa59cccc9a026b13fe0265102150095119e68d665d`** |

Re-read command and raw output: `evidence/run-20261027T084209Z/local_contract_reread.*` and `local_contract_hash.*`. This is cited for the DEPENDENCY_PENDING claim below and for the one known conflict in §4; the file itself was never modified by this task.

## 2. Package outputs

`docs/design/p0-handoff-r9/` was created by copying `docs/design/p0-handoff-r8/` forward in full (spec, matrix, prototype, CSS, `src/`, `checks/`, `study/`, `study-facilitator/`), then applying root-cause fixes. R1–R8 and all reviewer evidence under `docs/testing/` and `docs/reviews/` are untouched.

Key output hashes (full inventory with bytes+SHA-256 for every deliverable is `manifest.json`):

| File | Bytes | SHA-256 |
|---|---|---|
| `src/logic.js` | see manifest | `d8e349704d898f6d42e6cf2a9cb0394d7093b1176cb4e3f965013d59b8323c18` |
| `checks/strict_dom.js` | see manifest | `0a2f3cca2d138f4672fdb6c303b0556ee7759d40f8a39ccbeacb0d43c98bdb0b` |
| `prototype.html` (regenerated via `checks/build_prototype.py` from corrected `src/`) | see manifest | `3a6c15484a722408f66137e68b3d7ada03c0f8670ffb421e8e3489b831ae0e2c` |
| `polish.css` | see manifest | `8148d0a17d3d488f157a32fdf1c20fd2fc0b4f1079605e65b61bac6b6af59fcc` |
| `screen-state-matrix.json` (unchanged content from R8) | see manifest | `f89ffb920bb1e4c8cd0f92b34ca35531bceeac17eb0dee86ae821f5567b27101` |
| `findings-disposition.json` | see manifest | `c59a9cb9b5eb6a80b96aa5b143bd64b2ab14f5070102e5d51d0416537026f2bb` |
| `validation-plan.md` | see manifest | `ca33df6c2d60d4129eb957f39850d23bb54bf86e6395c0d66553e5e20ef7a1a1` |
| `current-ux-spec.md` | see manifest | `a6e1c030d1a48b6862ad204b3211278250ca84ebce50fc9a9166dd9a44b58e31` |
| `design-delta.md` | see manifest | `ee06e417560f4ba168833f3d7706fbe607e716d2cca7cfaffab13b7e8ca1ee68` |
| `zcode-handoff.md` | see manifest | `c1f71dc682d592f63e64aa145a4de884748859958b55eba8d59ab9a2ffd5a4a3` |

**`manifest.json`: 20,096 bytes, SHA-256 `2b68bc92431270dc456111590ca1de2231e2a10dba95829dccd0a3b68ba87563`.** 102 deliverable entries, 992,101 total bytes. Excludes itself and this `return.md` (no self-reference cycle). `return.md`'s own bytes/SHA-256 are reported in the task's closing chat message, not embedded in this file. Participant bundle (`study/participant-surface.html`, `study/scenario-a.json`, `study/scenario-b.json`) and facilitator-only material (`study-facilitator/facilitator-key.json`) are listed separately in the manifest; the facilitator key is never embedded in or served alongside the participant bundle.

## 3. Per-finding status and evidence

| Finding | Status | Root-cause fix | Evidence |
|---|---|---|---|
| **R8-N01** — purge-on-access-loss was text only | `SOURCE_CORRECTED_PENDING_REVIEW` | `purgeProtectedState()` in `src/logic.js`, invoked on the real access-loss transition (`hasMatterAccess()` true→false: role becomes `REVOKED` or `WS_OWNER_NO_MATTER`), not on a downgrade that keeps scoped read (OWNER→VIEWER); Sign-out reuses the same function | `checks/check_r8_n01_n04_regressions.js` — 13/13 MOCK_EXECUTED, exit 0; `checks/check_r8_baseline_redgreen.js` — exit 0, proves RED on the untouched, read-only R8 baseline (purge text shown, draft still resurrects) and GREEN on this candidate, same adapter. Raw logs: `evidence/run-20261027T084209Z/check_r8_n01_n04_regressions.js.*`, `check_r8_baseline_redgreen.js.*` |
| **R8-N02** — Create Matter/promotion intent lost on re-render | `SOURCE_CORRECTED_PENDING_REVIEW` | `formDrafts` Map (reuses the existing `drafts` Map pattern), keyed per document for the promotion form; cleared only by `purgeProtectedState()` | Same two check files as above; view-switch, EN/VI-locale-switch and cross-document-isolation assertions all pass |
| **R8-N03** — no distinct promotion target control | `SOURCE_CORRECTED_PENDING_REVIEW` | New `promote-target` select, independent of `promote-expected`; `promotionImpactText()` recomputes from the actual target; missing/invalid/same-as-current target and a stale `promote-expected` guard each produce a validation/no-change message, never a fabricated success; OWNER-only promotion, EDITOR add-version-without-promote, VIEWER scoped read all re-confirmed | Same check file; wire operation is `DEPENDENCY_PENDING` — `local-contract.md` at its current (28,248-byte) revision still defines no promote-version operation or status |
| **R8-N04** — dangling check scripts, empty evidence, stale ledger | `SOURCE_CORRECTED_PENDING_REVIEW` | `run_all_checks.sh`/`check_manifest_pins.py` references removed (smaller fix than building a runner); `check_screen_state_matrix.py` added (the matrix JSON already had the structure to check); `findings-disposition.json` gets `r9_corrections` (this table) and `r8_intake_dr7_findings` (DR7-01..08 carried forward), **48 historical records unchanged**; `evidence/` populated for this attempt | `checks/check_screen_state_matrix.py` — 12/12 structural checks pass, exit 0; full receipt set in `evidence/run-20261027T084209Z/` |

**Test-adapter root cause, separated from concept bugs.** An intake recheck found the first version of `checks/check_r8_n01_n04_regressions.js` failing 4/13 (promotion-reason `.value` after navigation). Root cause was in `checks/strict_dom.js` itself — it never hydrated a `<textarea>`'s `.value` from its own child text, never fell an `<option>`'s value back to its own text, and never exposed `input.type` — not in the corrected concept source (the generated markup already carried the user's text). Fixed minimally: no new parser, no dependency. `checks/check_strict_dom_adapter.js` — **9/9 self-checks pass, exit 0** — proves each fix in isolation, and still proves strict missing-ID lookups throw (negative guarantee unweakened). `check_r8_baseline_redgreen.js` then confirmed, with the same corrected adapter, that R8's defects are real (red) and R9's fix is real (green) — the adapter fix alone did not make everything pass regardless of the underlying code.

## 4. Known, isolated, out-of-scope conflict

`checks/check_canonical_dataset_and_proof.py` (carried forward unchanged from R8): **31/32 assertions pass (exit 1)**. The one failure — `"the contract still defines no 409"` — is caused by `local-contract.md` revision 6 (added by the separate implementation session after R8 was written, read-only here) defining a new `409 urn:mc:rejected` status for work-graph dependency rejections (`dependency-blocked`, `transition-not-allowed`, `cycle`, etc.), which is unrelated to this package's edit/version CAS conflict surface (428/412/422). This is **not** R8-N01..04 scope. It was not remediated: no new route, status mapping or UI was invented in response, per the no-scope-creep instruction, and the assertion was left failing honestly rather than edited to force a pass. See `findings-disposition.json` DR7-03 and `validation-plan.md` §3 row 3. Evidence: `evidence/run-20261027T084209Z/check_canonical_dataset_and_proof.py.*`.

## 5. Evidence provenance erratum

`evidence/run-20261027T081038Z/` (the first R9 evidence attempt) has malformed `"utc"` fields (`date -u +%6N` is not supported by this machine's BSD `date`, producing literal `.6NZ` instead of fractional seconds) and one placeholder `argv` on `pin_verification.receipt.json`. Full detail in `evidence/PROVENANCE-ERRATUM.md`. That directory was kept, unmodified, as the historical first-attempt record; its `stdout`/`stderr`/`exit` values are real. **`evidence/run-20261027T084209Z/` is the evidence of record** this return.md cites: valid ISO-8601 `utc_start`/`utc_end` per check, real argv throughout, re-run of all 10 checks plus pin verification plus the fresh `local-contract.md` re-read, all from `cwd` = `docs/design/p0-handoff-r9/` unless noted. Tool versions for both runs: Python 3.9.6, Node v26.12.1, macOS/Darwin arm64.

## 6. Tests run, not run, and blocked

| Tier | What | Result |
|---|---|---|
| SOURCE_CHECKED | `check_vocabulary.py`, `check_css_byte_identity.py`, `check_study_assets.py`, `check_screen_state_matrix.py`, `check_syntax.sh`, pin verification, `local-contract.md` re-read | All exit 0 |
| SOURCE_CHECKED | `check_canonical_dataset_and_proof.py` | 31/32 pass, exit 1 — see §4, out of scope |
| MOCK_EXECUTED | `check_mock_dom_bootstrap.js` | 29/29 pass, exit 0 (R8's suite, re-run unchanged against the R9 prototype) |
| MOCK_EXECUTED | `check_r8_n01_n04_regressions.js` | 13/13 pass, exit 0 |
| MOCK_EXECUTED | `check_r8_baseline_redgreen.js` | exit 0 — red on R8, green on R9 |
| SOURCE_CHECKED | `check_strict_dom_adapter.js` | 9/9 pass, exit 0 |
| NOT_RUN | AC-137 manager comprehension trial | Unchanged from R8: `TRIAL NOT_RUN / AWAITING_HUMAN_TRIAL`, no participant contacted |
| **VERIFICATION_BLOCKED** | Rendered geometry/layout/clipping/responsiveness at any viewport, real focus movement, keyboard traversal in an actual browser, touch target measurement, screen-reader output, any `BROWSER_EXECUTED` claim | No browser/renderer/screenshot tool is present in this session's tool environment; no CLI browser, alternate browser, native capture, export, server/proxy/tunnel or settings change was used as a bypass (forbidden by the task and not attempted) |

## 7. Remaining risks and next action

- Independent non-author review of this disposition has not occurred; author self-check is not independent acceptance (every new/updated finding record says `SOURCE_CORRECTED_PENDING_REVIEW`, never self-declared closed).
- §4's contract drift (409 for work-graph rejections) should be looked at by whoever owns the error-mapping design next — it is flagged, not resolved, here.
- All rendered/interactive/accessibility/human-trial verification in §6 remains blocked pending browser/human-trial tool availability.
- **Next action:** Codex intake of this R9 package; Claude Code (the separate session doing BE+FE W1–W7) consumes the `zcode-handoff.md` §8 delta (purge boundary, form-intent persistence, promotion target/guard separation) when convenient — no wave gate is added, no restart requested, and this task did not message or edit that session's workboard, contract or checkpoint.
