# Design R9 final return — bounded intake, 2026-10-27

**Disposition: RECEIVED_VERIFIED / USABLE_IMPLEMENTATION_INPUT_WITH_KNOWN_CONTRACT_GAP.** Packaging closeout is received. No full-suite, browser, independent visual, product-security or release acceptance is granted. The source/mock corrections previously inspected remain available to the product implementer; another broad design revision is unnecessary.

Task MC-P0-DESIGN-R9-FINAL-INTAKE, parent MC-P0-DESIGN-R9-TARGETED-CORRECTION. Priority P0. Actual reviewer Local Codex, reviewing packaging/source/mock evidence; historical Codex design/CSS contributions do not receive independent visual acceptance from this intake. Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. Requirements: existing R8-N01..04 and canonical P0 FR/AC/NFR/GW coverage. Product implementation remains actual Claude Code's separate long BE+FE assignment.

## Integrity and evidence verified

- `docs/design/p0-handoff-r9/return.md`: **12,863 B**, SHA-256 `d4dc769f1958f486a17a9a90fa5b1060de3172a2b07b544c6f1adff788b14b3d` — matches the user-supplied final return pin and now identifies R9.
- `manifest.json`: **20,096 B**, SHA-256 `2b68bc92431270dc456111590ca1de2231e2a10dba95829dccd0a3b68ba87563` — matches the supplied pin. All **102 unique payloads / 992,101 B** match declared lengths/hashes; no missing/undeclared paths. Manifest and return are explicitly excluded; return pins the manifest, avoiding a self-reference cycle.
- Current read-only implementation contract: **revision 6, 28,248 B**, SHA-256 `3e89654f0fabdac877e311fa59cccc9a026b13fe0265102150095119e68d665d` — matches the return's current-input pin.
- All **48 historical finding records** compare equal as parsed JSON with R8; inherited finding lists remain unchanged. R9 adds its current correction/disposition data rather than replacing historical authorship.
- All **13 new receipts** in `evidence/run-20261027T084209Z/` have valid timezone-aware ordered UTC start/end fields and concrete argv. Their records include the failing canonical check, rather than hiding it. The old run is retained and the provenance erratum explains its malformed UTC/placeholder argv. This verifies retained provenance structure, not the truth of every historical command independently.

Exact input/payload pins, receipt validation and fresh reviewer logs are in [verification.json](../testing/p0-design-r9-final-intake-20261027/verification.json). Prior 13/13 targeted regression, 9/9 adapter selfchecks and R8/R9 red→green executions remain applicable: reviewed prototype/logic/adapter/test bytes match the previously executed snapshot. Those unchanged suites were not rerun solely to generate another PASS.

## Scoped dispositions

| Item | Intake disposition |
|---|---|
| R8-N01 purge | Previously inspected concept cleanup and selected revoke/regrant/downgrade regressions retained. Broader multi-scope product enforcement is not proved by this concept fixture. |
| R8-N02 form intent | Corrected state/markup and selected navigation/locale/document regressions retained. No browser interaction PASS inferred. |
| R8-N03 promotion target | Separate target/expected-current concept controls and selected mock checks retained. Wire remains DEPENDENCY_PENDING in this design packet; actual W3 promotion implementation is still the product owner's existing scope. |
| R8-N04 packaging/evidence | Final return, complete manifest, valid replacement receipts and erratum are verified. Some ledger/validation references still point at the historical first run, but the return/erratum explicitly designate the replacement run as evidence of record. Packaging no longer lacks a final return. |

## Contract gap reproduced and classified

Reviewer executed the unchanged `check_canonical_dataset_and_proof.py`: **exit 1**, with **30 PASS / 1 FAIL** in actual stdout, **31 emitted check results**. The owner's “31/32” count is a reporting erratum; it does not represent an additional failed check. The failing label is exactly `the contract still defines no 409`.

At `checks/check_canonical_dataset_and_proof.py:183`, the condition is `"409" not in contract`: a global text assertion over the entire living contract. Contract revision 6 §2.3 defines `409 urn:mc:rejected` for work-graph guarded refusals and separately retains missing/stale CAS as 428/412. Thus a work-graph 409 does not, by itself, falsify the CAS mapping. The global assertion is broader than the invariant it intends to protect. The next assertion also merely forbids 409 among fixture statuses; its label does not prove every mapped status exists in the current contract.

This is a **known checker/design-consumer reconciliation gap**, not evidence that CAS now returns 409 and not a reason to remove the product's work-graph rejection contract. Formal architecture/source acceptance of rev 6 remains separate. Do not claim all nonbrowser checks pass or that only browser blockers remain: this nonbrowser gap is still open and disclosed.

Reviewer also executed `check_screen_state_matrix.py`: **12/12 pass, exit 0**. Its checks establish counts, duplicate FR/screen checks and reciprocal mappings; it does not compare every AC/NFR/GW identifier or every state name against an independent canonical source. Therefore it is structural bookkeeping evidence, not complete requirements or behavioral acceptance.

Both new executions used existing read-only check scripts, exact argv/cwd/UTC/exits and separate reviewer stdout/stderr. No design file or product source was changed.

## Next action

Use the [Claude consumption addendum](../implementation/handoffs/MC-P0-CLAUDE-CONSUME-DESIGN-R9-ADDENDUM.md) in the existing product implementation session. It pins the final design, preserves current working progress, calls for operation-specific 409 vs CAS/UNKNOWN behavior/tests, and continues the complete W1–W7 plan without another wave approval gate. The design checker correction remains a small owner-scoped follow-up, not a product-author permission to overwrite pinned R9 evidence.

This intake does not dispatch Claude, reassign the design package, approve an architecture change or close MC-002/Step03B. It records a concrete handoff that the human may deliver to the already-authorized implementation owner.

Skipped: product source edits, full new source/semantic/visual/accessibility audit, browser/human study, PG/IdP/lifecycle/private actions, unchanged-suite reruns and Git mutation. Remaining risk: nonbrowser contract-check reconciliation and browser/real-user evidence remain open; local source/mock success does not establish product or production readiness.
