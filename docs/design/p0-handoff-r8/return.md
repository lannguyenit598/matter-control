# MC-P0-DESIGN-R8 — actual execution return

Task: **MC-P0-DESIGN-R8-CONSOLIDATED-FINALIZATION** · Priority: **P0**.
Governance Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch: `codex/unified-project-flow`. Base/Head: `a62d838791ba188838c4ff00b7b6e265ac775056` (unchanged — zero product repository commits, zero git mutations).
Export revision: **MC-P0-DESIGN-R8-local-20261027-01**. Date: 2026-10-27 (local session clock).
Proposed status: **COMPLETE_PENDING_VISUAL_VERIFICATION** — every finding below is SOURCE_CHECKED and/or MOCK_EXECUTED by a script actually run this session; no rendered/interactive/accessibility evidence exists or is claimed.

This run resumed the prior same-task session's in-flight output (owner_session `MC-P0-DESIGN-R8-local-20261027-01`, started `2026-10-27T06:25:43Z`). That session had already built the full package and the `checks/` + `study/` + `study-facilitator/` trees; this run's job was a gap audit, not a rebuild. Two real gaps were found and closed; everything else was verified in place.

---

## 1. What this run actually did

Ran the existing check scripts under `checks/` against the existing package (did not rewrite them):

- `python3 checks/check_vocabulary.py` — found 4 failures, fixed 3 by editing content, left 1 (itself) which only passes once `return.md` exists:
  - `zcode-handoff.md:16` — the R7→R8 delta table literally spelled `EXPIRED` next to its five approved verification siblings and `CIRCULAR_CONFLICT` next to both approved dependency siblings, which the vocabulary scanner (correctly) flags as an enumeration-shaped window even though the prose was explaining what *not* to do. Reworded the row to describe the two rejected values without listing live siblings alongside them. Re-ran: passes.
  - `design-delta.md:103` — closing status line still carried an earlier revision number (two back from the current one) in the completion label, a stale label left over from an earlier edit pass. Changed to the current revision. Re-ran: passes.
  - `return.md` not existing was the 4th failure — closed by this file.
  - Final state: `python3 checks/check_vocabulary.py` → 0 FAIL.
- `python3 checks/check_canonical_dataset_and_proof.py` → all checks PASS (24 canonical records, 7 edges, RQ-11/RQ-07 proof-panel fidelity, permission matrix transcription, CAS precondition statuses 428/412/422/400 only — no generic catch-all conflict status reintroduced).
- `python3 checks/check_study_assets.py` → all checks PASS; trial status honestly `NOT_RUN`.
- `python3 checks/check_css_byte_identity.py` → polish.css / embedded `<style>` / study surface `<style>` are byte-identical (17,871 bytes); both HTML surfaces are self-contained.
- `bash checks/check_syntax.sh` → `node --check` reports zero syntax errors across every inline script and check module.
- `node checks/check_mock_dom_bootstrap.js` → 29/29 checks PASS, including the DR7-07 negative-mutation tests (renamed/deleted required static ID both caught), DR7-02 regression checks (RQ-11, RQ-07), and the explicit `MOCK_EXECUTED` limits disclaimer (no rendering/geometry/focus/touch/AT claimed).

No other file needed editing: every other claim the checks make against the approved sources (state-semantics, Atlas dataset, permission matrix, local-contract.md revision 4 §2.1/§3/§6) already held.

---

## 2. DR7-01 .. DR7-08 disposition

| Finding | Status | Evidence |
|---|---|---|
| DR7-01 (banned enum values) | CLOSED | `checks/check_vocabulary.py` 0 FAIL after the two edits above. `EXPIRED` appears 0 times and `CIRCULAR_CONFLICT` appears 0 times in `prototype.html`; both appear only in explanatory "this is not a state" prose in the docs, verified not to match the sibling-enumeration pattern. |
| DR7-02 (proof-panel root cause, RQ-11/RQ-07, missing-data fallback) | CLOSED (pre-existing, re-verified) | `checks/check_canonical_dataset_and_proof.py`: RQ-11→DEP-07→AC-12 gate present, RQ-07 reports its own READY dependency (not AC-07's BLOCKED), AC-07 confirmed as the actually-blocked distinct subject, RQ-03/RQ-05 historical-baseline-vs-current-policy caveat intact, AC-06 COMPLETED/READY/U-03 intact, AC-DEMO-PROOF excluded from the canonical 24. `checks/check_mock_dom_bootstrap.js`: "fallback reports unavailable instead of asserting a negative fact" PASS. |
| DR7-03 (CAS precondition statuses, OUTCOME_UNKNOWN, revoked-actor purge) | CLOSED (pre-existing, re-verified) | `check_canonical_dataset_and_proof.py`: contract binds missing-precondition→428, stale→412, no generic catch-all conflict status reintroduced, non-receipted membership commands distinguished. `check_mock_dom_bootstrap.js`: "error mapping uses 428/412/422/503 ... contains no invented [catch-all conflict status]" PASS. Mapping table lives in `current-ux-spec.md`/`design-delta.md` (not touched this run — already present). |
| DR7-04 (persona/role/operation separation) | CLOSED (pre-existing, re-verified) | `check_mock_dom_bootstrap.js`: "role changes alter permitted operations exactly as the approved matrix says" and "SCR-01 never lists, names or counts a Matter this access cannot read" and "Create Matter and Workspace membership are decided by the workspace role" all PASS. |
| DR7-05 (6 real screens, reset scoping, sticky drawer nav, Golden Workflows) | CLOSED for behavior/structure; **rendered appearance stays VERIFICATION_BLOCKED** (see §3) | `check_mock_dom_bootstrap.js`: click delegation, per-screen reset (never routes to Grid), native dialog cleanup parity, nested-input/IME exclusion from row key handling, bulk row-atomic outcomes, filing submission/receipt/outcome separation, all three Golden Workflow sequences rendered in full, restricted security log separated from ordinary history — all PASS. `validation-plan.md:73` already states this split explicitly. |
| DR7-06 (AC-137 study assets) | CLOSED | `checks/check_study_assets.py`: 50-row acyclic typed datasets for both scenarios, re-derivable major-state/blocker/next-action keys, unambiguous top-blocker, 5 managers / counterbalanced order / 3 questions / 4-of-5-in-10s threshold preserved, participant bundle (`study/participant-surface.html`, `scenario-a.json`, `scenario-b.json`) carries no facilitator material, facilitator key stays in `study-facilitator/`, scoring ledger pre-filled with structure only — trial status honestly `NOT_RUN`/`AWAITING_HUMAN_TRIAL`. |
| DR7-07 (self-check overclaim / missing-ID blindness) | CLOSED (pre-existing, re-verified) | `checks/check_mock_dom_bootstrap.js` now fails strict-mode boot on auto-vivified IDs, has negative tests for a renamed and a deleted required static ID, retains event handlers for click/Escape/keyboard/focus assertions, and prints an explicit `MOCK_EXECUTED` / "Limits: mock DOM execution only. No rendering, geometry, painting, real focus, touch or assistive-technology behaviour is established here." disclaimer rather than overclaiming rendered proof. |
| DR7-08 (stale revision/shortened GW labels) | CLOSED (pre-existing, re-verified; one real fix this run) | `prototype.html:234` banner reads "MC-P0-DESIGN-R8 candidate (supersedes R7)", not an earlier revision number. `current-ux-spec.md:183` carries the full GW-02 `Request → Document → Review → Gap → Finding → Follow-Up → Resolution` sequence, not a shortened gap/signature excerpt. `design-delta.md`'s own closing line was still carrying an earlier revision number — fixed this run, see §1. |

---

## 3. Six new screens (DR7-05) — status

All six (SCR-01 login/session/Matter switcher, SCR-08 document/version lineage, SCR-09 filing lifecycle, SCR-10 bulk edit, SCR-11 import mapping, SCR-13 domain-event history) exist in `prototype.html` with distinct DOM structure, per-screen validation, and their own reset scope — confirmed structurally and via mock-DOM execution per §2 (DR7-05 row). **Not verified**: actual rendered layout, 200%-zoom/50–200-row reachability, keyboard-only navigation, touch targets, screen-reader behavior. This requires a browser/render tool this session does not have authorization to use.

---

## 4. VERIFICATION_BLOCKED — explicit list (nothing beyond this is claimed as rendered/tested)

Per `validation-plan.md` §2/§6 (already written by the prior session, re-confirmed, not altered):

- Rendered scannability and visual hierarchy of all 13 screens (Control Room, Grid, My Actions, Waiting On, drawers, and the 6 new screens) — no screenshot or browser render was taken.
- Responsive behavior at named breakpoints and 200% zoom.
- 50-row and 200-row table reachability/virtualization under real layout.
- Keyboard-only navigation, focus order, and focus restoration on dialog/drawer close.
- Touch target sizing and touch interaction.
- Screen-reader / assistive-technology passes.
- Any accessibility tool run, hash, or version claim for the above — none exists; none is asserted.

Everything in this section is `VERIFICATION_BLOCKED`, consistent with `validation-plan.md:111` ("Every row is `VERIFICATION_BLOCKED` for the reason in §2. None has been partially credited from source or mock evidence."). This run did not attempt a headless browser, `od export`, or any renderer bypass, per the governing instructions.

---

## 5. Conflicts found

None. `docs/implementation/p0-zcode-execution/local-contract.md` sha256 `b418471bc137839b906397a406d572001b7992076ac64c52e3618fd7d1e268a3` matches the pinned value in the task brief; its CAS status codes (428/412/422/400, with no generic catch-all conflict status defined) match what `current-ux-spec.md`, `design-delta.md`, and the check scripts already assume. No revision drift to isolate.

---

## 6. Reviewable deliverables (current byte counts / sha256, computed this run with `sha256sum`)

| File | Bytes | SHA-256 |
|---|---:|---|
| `current-ux-spec.md` | 25,329 | `066849ac3c36331da9d1b938e789b169377df41cc54dd21236949362af072cb1` |
| `design-delta.md` | 27,842 | `049b140bbdb1cce4a4a576b57083471894731047dd00c82ca82964e4a7e33016` |
| `findings-disposition.json` | 78,967 | `72470e86a1d1cfc13de34a157be2768f0195a9df3369a325cf74764578760076` |
| `polish.css` | 17,871 | `8148d0a17d3d488f157a32fdf1c20fd2fc0b4f1079605e65b61bac6b6af59fcc` |
| `prototype.html` | 205,509 | `3f104029a2846a4ab6183d32676172a28e2a4b28f079b7174228a3d937369df6` |
| `screen-state-matrix.json` | 63,600 | `f89ffb920bb1e4c8cd0f92b34ca35531bceeac17eb0dee86ae821f5567b27101` |
| `validation-plan.md` | 15,440 | `38e20472eae3f68362edde3705e63129d74889d5922156e75d1f110f24d75301` |
| `zcode-handoff.md` | 13,022 | `869931cc816b5126df7d1f1b24005872597e718a1c3fb057ad24ae417a7f8130` |

`findings-disposition.json` and `polish.css` were not edited this run (sha256 above matches what was already on disk before this session touched anything else); `current-ux-spec.md` is unchanged content-wise from the prior session (hash recorded here for completeness, not because this run edited it).

---

## 7. Remaining work (not in this run's scope)

- A real human AC-137 trial (5 managers, 2 scenarios, counterbalanced) — assets are ready, trial itself requires a person and is out of scope for a local design session.
- A real browser-based visual/interactive/accessibility pass — requires a render tool this session is not authorized to invoke.
