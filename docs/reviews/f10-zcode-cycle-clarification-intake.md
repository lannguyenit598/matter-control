# F10 — narrow ZCode cycle/replay clarification received

Task MC-003A.8A;2026-10-26; Local Codex orchestration/intake, P0. Actual coordination checkout /Users/nguyenvanlan/Documents/code/pet-projects/matter-control, branch codex/unified-project-flow, base/head a62d838791ba188838c4ff00b7b6e265ac775056 at intake. Inputs: human-returned ZCode clarification and the existing seven-file74405-byte clarification manifest. No new provider invocation. ZCode GLM-5.3/account:zai-start-plan identity is session-declared; version UNKNOWN. Author-side clarification, not independent acceptance.

Disposition: **L2_EXACT_CANDIDATE_CITATION_CONFIRMED / L5_RECOMMENDED_CANDIDATE_RECEIVED / NARROW_INDEPENDENT_CHECK_PREPARED**. F10 OPEN; L4 source compatibility NOT_VERIFIED; no new implementation/adoption or gate closure.

## Integrity and source verification

[14 integrity checks](../design/step-03a/handoff/step-03a-8a/zcode-f10-cycle-clarification-r1/checks.json) PASS: original manifest SHA4c81d78b…695b571;7/7 source bytes/hashes,74405bytes; lossless retention of the12378-byte human return; exact committed contents of the two cited architecture documents. These are file/provenance checks, not semantic/running test results or proof of the author's tool actions. The read/hash sequence in the pasted report remains author-reported; no original command transcript was provided.

Codex independently verifies:

- api-contracts.md:25038bytes,SHA49ec8aa506386df03c4995a53553d51dd615e1fd0e1fd02f4fd45d146d576e75, latest content commit8521c2a08d87f6b070900d8c2b6f490a89d34e09 and exact committed bytes.
- filing-model.md:7652bytes,SHA632f9c8670c98de2065f40a28ed34f31257c1615a1e73cfd25fcafc7a90c60dd, latest content commit3a86ca829d15ea15c50743f67573163046393407 and exact committed bytes.

This resolves the author's commit-pin evidence limitation locally. It does not establish whole-source compatibility or convert candidate architecture into approved policy. Original read manifests, accepted OC01..07 clauses, prior reviewer report and canonical architecture sources remain unchanged.

## Technical disposition

**L2:** ZCode explicitly binds its alias api-conventions to candidate api-contracts§1 lines14–15 and§1.1 line66. The proposed alias-only replacement is supported. Keep current scope/all represented-Matter authorization before disclosure, authorized changed-hash422, lost-authority uniform404, immutable same-key/hash replay and same-key lost-ack retry. Do not carry these proposed product semantics over to INT-A's native transport characterization. No standalone filename or approved source was invented.

**L5:** Author recommends optional observation types accept omitted/null as unbound cycle_noNULL; required types reject omitted/null with422; provided positive integer cycle must resolve under the path filing; a valid older target is allowed. expectedCycleNo is required for named targets and checked if supplied on an unbound observation. Missing expectedCycleNo422/stale412 and If-Match428/412 remain within the reviewed filing-family order. Supplement continues to derive n+1 server-side. This is now a concrete candidate, not an unanswered author question. No full author rewrite or redundant Claude confirmation is assigned.

Two important distinctions are retained in the small review packet:

1. Earlier C1 says expectedCycleNo names the caller's believed **current open cycle**, while body cycleNo names the observation's **target**. Example: current3/target1/expected3 can bind1; current3/target1/expected1 is stale412. These Codex-derived expected examples restate the earlier candidate, not new business approval.
2. Omitted/null equivalence in stored binding does not by itself define equality of the canonical request hash. api-contracts§1 includes canonical body and preconditions in that hash. The new clause must not silently change global canonicalization or assume same-key replay when the wire body changes. Review must pin or explicitly defer that representation detail. Likewise, the word float should not silently introduce a lexical numeric-token policy for a value written1.0; fractional versus integral-number wording needs an explicit narrow disposition, not an invented source guarantee.

The author's statement that this requires no additional decision loop is treated as a scope recommendation. Routine serialization can be resolved technically, but it does not waive independent review of new clause text, L4 compatibility or the existing architecture/PO adoption gate. Previously closed OC01..07 remain CLOSED_DOCUMENT_ONLY; these are checks of the newly supplied L5 rule and L2 citation, not reopened original findings.

## Review-ready delta and next action

[Candidate delta](../design/step-03a/handoff/step-03a-8a/zcode-f10-cycle-clarification-r1/review-packet/02-candidate-delta.json) transcribes the author rule, explicitly preserves target/CAS distinction and contains10new L5-E* document-expected examples. The compressed original return retains the exact author matrix L5-R1..R6/S. Codex examples are attributed to intake, not falsely described as already accepted by ZCode/OpenCode. They do not replace or renumber T1..T22,T14b or22CT; all remain DOCUMENT_EXPECTED/runtimeNOT_RUN. T14b and12supersession trace records are untouched.

[Exact narrow packet](../design/step-03a/handoff/step-03a-8a/zcode-f10-cycle-clarification-r1/review-manifest.json):5files,29322stored bytes; owner return, new candidate delta, source excerpts, prior actual independent return and protected review boundaries. [Copy-ready OpenCode prompt](../design/step-03a/handoff/step-03a-8a/zcode-f10-cycle-clarification-r1/OPENCODE-L2-L5-CHECK-PROMPT.md) prepared/notdispatched, only new L2/L5 clauses and expected examples. The prior reported route is opencode/deepseek-v4.1-flash-free,CLI2.1.4; this is not newly attested live routing. Manual recipient must verify exact destination before payload access; no automatic transfer, fallback, paid retry or new provider permission is inferred from prior packets.

After this bounded check, consolidate the technical recommendation and unresolved source/PO decisions once; do not restart the full32operation audit or repeatedly ask the author to confirm the same clauses. L4/role-mapping/link-PK proof, proposed2000/64/128bounds, envelope source/limit, traversal and B35 adoption remain outside this small check. Catalogue32; all new fields/routes/filters/bounds NOT_ADOPTED. G3NOT_VERIFIED,G4PENDING,G5-Bremainingdispositionsopen,G6REWORK_REQUIRED,STEP03BNOT_AUTHORIZED,architecturePOgateNOT_PASSED. F08/BE01/BE02/INT-A/UX untouched.

Skipped: runtime/build/tests/DB/browser, provider dispatch, canonical contract edits, full-source compatibility and commit. Risk: candidate binding equivalence still needs its request-representation disposition, and no small author clarification grants independent or PO approval.
