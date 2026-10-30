# MatterControl — Design R8 intake and targeted source review

Task: **MC-P0-DESIGN-R8-INTAKE**. Reviewer: actual Codex / Local Codex. Priority: P0 coordination. Date: 2026-10-27, Asia/Ho_Chi_Minh. Scope: returned R8 package, DR7-01..08, 13 screens, approved FR/AC/NFR/GW traceability, study assets and author checks. This is not product implementation or a completed visual audit.

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; governance HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`.

**Verdict: CHANGES_REQUIRED_TARGETED.** The R8 source/spec package has advanced substantially and is useful implementation input, but three concrete concept/UX issues and a handoff-evidence inconsistency remain. Do not describe all eight R7 findings as independently closed or the entire UI as accepted. No wholesale redesign, W0 restart or per-wave approval loop is needed.

## Received package and checks

- Completed return now exists; checkpoint says COMPLETE_PENDING_VISUAL_VERIFICATION. Export `MC-P0-DESIGN-R8-local-20261027-01`. Return SHA-256 **`ba6e720a865b989f04416d1631d16317df049d4e0050c1005d21b55bc5f1b1db`**. Actual external author/tool identity is owner-reported; this intake does not independently establish a provider execution identity.
- **8/8 declared primary-output pins match**, including the 205,509-byte prototype. The reviewer additionally pinned every current package file in `docs/testing/p0-design-r8-intake-20261027/receipt.json`; package files remained unchanged through checks.
- Four Python checks reproduced with exit 0: vocabulary; canonical dataset/causal/permission transcription; study assets; CSS identity/self-containment. Owner strict-mock suite: **29/29 pass**, exit 0. Four syntax checks also exit 0. These reproduce the available six check suites without executing builders or overwriting owner outputs.
- Reviewer independently compared exact **20 FR / 63 AC / 14 NFR** sets with the coverage baseline, 13 screen IDs/nine states, reciprocal screen mappings and three GW entries. All **48 historical finding records** remain equal to R7. This is structural/source verification, not behavioral acceptance of 63 ACs.
- Main and study embedded logic match their `src/` counterparts; participant embedded datasets equal the two JSON files. CSS is identical across main/study surfaces, **17,871 bytes**. Both 50-row study datasets and facilitator materials exist; human trial remains NOT_RUN.
- Actual reviewer tools: Node **v24.22.1**, Python **3.14.4**. Commands, times, exits and outputs are in the reviewer receipts. Python bytecode generation was disabled so imports do not modify the returned package.
- Browser discovery returned **“Local browser use is disabled in Work settings.”** No native-app capture or alternate renderer was used. Rendered layout, responsive geometry, actual keyboard/focus/touch/screen-reader and human AC-137 results remain VERIFICATION_BLOCKED/NOT_RUN.

The initial reviewer-only negative-probe loader failed on the owner's Node hashbang when passed to `Function`. That loader was corrected to strip the hashbang; the successful rerun is retained separately in `reviewer-probes-rerun.json`. The original failed receipt is preserved. It is not a failure of the reviewed design.

## What R8 actually improves

The six previously prose-only surfaces now have distinct source layouts and controls: session/Matter/membership, documents/versions/signatures, Filing/package/cycles, bulk preview/results, import mapping/results and event history. These are labelled synthetic concept interactions; real persistence/enforcement is not claimed.

The approved axis vocabulary is restored. Proof panels now use typed edges/subject data rather than per-record causal guesses; RQ-11/RQ-07 regressions and historical/current-policy distinctions pass. Error mapping distinguishes missing/stale preconditions and receipted/non-receipted unknown outcomes. Personas, scoped reads and operation authority are separated. Strict static-ID failures, missing-ID mutations, actual delegated mock events and full canonical GW sequences are present. Study preparation is no longer just scenario prose.

Retain Enterprise Precision, selected tokens, Comfortable/Compact, multiline legal text and the existing icon direction. This review has no rendered evidence supporting a visual score or a claim that the UI looks finished.

## Remaining findings

### R8-N01 · P2 — Revocation announces purge while retaining the record draft

`src/logic.js:332` holds record drafts in a Map. The role-change handler at **:1404** re-renders and replaces the drawer with the access-lost panel, which says protected values/drafts **“have been purged”** (`:313–319`). It does not clear the draft Map or other protected intent state.

Reproduced using the owner's strict mock and actual listeners: open RQ-04 → enter a unique synthetic title draft → change role to REVOKED → observe purge claim → restore OWNER → open RQ-04. **The exact old draft reappears.** This proves a mismatch in the concept's privacy/recovery demonstration; it is not proof of a production leak or backend authorization failure.

Minimum correction: centralize access-loss cleanup for protected draft/selection/operation intent caches, and call it before rendering the denied state. Distinguish true revocation from a role downgrade which retains read rights. Add a regression proving revoked content cannot reappear from the old local cache after a later grant, while permitted non-revoked draft recovery still works. Until corrected, the product implementer must implement this from the approved privacy/permission policy, not copy the concept's role handler.

### R8-N02 · P2 — New forms lose unsent input when navigating away and back

`showView()` at **src/logic.js:1311–1320** calls the screen render function. `renderSession()` and `renderDocuments()` rebuild form markup with empty fields, while input listeners at **:1383–1389** retain only record-title and bulk-value edits. There is no state restoration for the new-Matter title or promotion reason.

Two strict-mock reproductions: enter an unsent Matter title on SCR-01 → Control Room → return to SCR-01: title lost; enter a promotion reason on SCR-08 → Control Room → return: reason lost. Language-driven `renderAll()` has the same reconstruction risk.

Minimum correction: retain these small form intents in scoped page/session state and restore them on permissible navigation/re-render, using the existing state approach rather than a new framework. Clear on explicit discard, logout or access loss under the appropriate policy. Test navigation and locale changes separately from revocation. No browser behavior is claimed by these mock reproductions.

### R8-N03 · P2 — Promotion has an expected-current guard but no target-version choice

At **src/logic.js:918–928**, the promotion panel offers expected-current (`promote-expected`), reason and impact acknowledgement. It supplies **no candidate/target version control**. Its impact text even says “Promoting” the version already marked CURRENT. Changing the expected-current value cannot stand in for choosing which other version becomes authoritative.

This is a missing design choice/field hierarchy in SCR-08, not a failed backend command: buttons are explicitly non-operational in this concept. Minimum correction: distinguish target version from expected prior current version, show target-specific impact and reject a same-current/no-op selection where the contract requires it. Follow the live implementation contract when wiring the real command; do not invent wire names in the design. Add a source/mock assertion that the target and concurrency guard are separate.

### R8-N04 · P2 — Reproducibility and machine-readable disposition do not match the return

`validation-plan.md:34–53` tells reviewers to run `checks/run_all_checks.sh` and lists `check_manifest_pins.py` and `check_screen_state_matrix.py`. **None of these three files exists.** The `evidence/` directory contains **no files**, despite claims that exact versions/timestamps/exits/input hashes were retained there. This intake independently reproduced the available checks and stored its own receipts, so source results are now reviewable; it does not retroactively establish the missing owner logs or unavailable runner.

Further, `findings-disposition.json` is byte-identical to R7 (SHA `72470e86…`), still identifies task **MC-P0-DESIGN-R7-UI-FINALIZATION**, and has no new DR7-01..08/R8 dispositions. The return's eight CLOSED claims are therefore not reflected in the machine-readable handoff ledger. The author return also pins only the eight main files, not the scripts/modules/study assets required to reproduce them; the reviewer's full inventory supplies a current snapshot but does not repair that author manifest.

Minimum correction: either supply the documented runner/checks and actual attempt-scoped logs, or accurately list only the commands that exist and link to verifiable receipts. Preserve historical finding records and append the current dispositions with their actual evidence scope; retain newly open findings. Provide one complete output manifest excluding its own self-hash, including supporting source/check/study assets. This is a small handoff/evidence correction, not another design-direction round.

## Disposition of the previous findings

| R7 finding | Reviewer disposition for R8 |
|---|---|
| DR7-01 vocabulary | CLOSED_SOURCE_ONLY; no new axis members observed. |
| DR7-02 proof truth | CLOSED_SOURCE_ONLY / regression mock reproduced. |
| DR7-03 errors/unknown recovery | Mapping corrected; access-loss purge remains PARTIAL via R8-N01. |
| DR7-04 roles/personas | Source presentation and scope corrections verified; no backend enforcement claim. |
| DR7-05 six surfaces | Source layouts substantially completed; SCR-01/SCR-08 input recovery and promotion target remain PARTIAL via R8-N02/03. Rendered acceptance blocked. |
| DR7-06 study assets | CLOSED_ASSET_SOURCE_ONLY; human trial NOT_RUN. The participant study surface uses separate rendering code, so validate its equivalence to the actual product before treating a future study as product usability evidence. |
| DR7-07 missing-ID blindness | Strict-ID and event mock corrections verified; tests do not cover the new regressions above. Reproducibility claims still need R8-N04 correction. |
| DR7-08 current revision/GW labels | Main UI/docs/GW sequences corrected; machine-readable finding ledger remains stale via R8-N04. |

## Exact next action and completion boundary

Use the corrected portions of R8 as source/spec input for the **current Claude Code full BE+FE implementation assignment**, with this report and its manifest attached. The historical filename `zcode-handoff.md` describes the consumer contract, not current execution ownership; the direct PO transfer to Claude remains effective. Do not restart W0, stop unrelated waves or introduce per-wave independent approval.

Resolve **R8-N01..04 in one targeted pass**. In the product, implement access-loss purge, non-revoked form recovery and target-version promotion from approved requirements/current contracts regardless of concept defects. If the design owner corrects R8, preserve the returned snapshot and use a new identified delta/candidate rather than overwriting pinned history. A further full visual review needs a permitted browser; source/mock corrections do not unlock it by inference.

Proposed status: **R8 RECEIVED_HASH_VERIFIED / TARGETED_REWORK_REQUIRED; VISUAL_ACCESSIBILITY_ACCEPTANCE_OPEN.** No independent design approval, author self-DONE, product security/auth/PG acceptance, AC-137 human PASS, MC-002 closure or production release is awarded.

Changed files by Codex: this report and the new `docs/testing/p0-design-r8-intake-20261027/` reviewer artifacts only. No returned design/source, application code, workboard, provider settings, credentials, DB/container/process state or Git index/history was changed.

Skipped: all rendering/browser/native capture, real keyboard/touch/assistive testing, human study, product execution/build, provider dispatch, credential/lifecycle and Git mutations. Remaining risk: concept source still has the three specific behavior/field issues above, and visual quality cannot yet be accepted from the available evidence.
