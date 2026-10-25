# MC-002 Step02.3 — OpenCode Review-Only Assessment

**Task:** MC-002-INT-REVIEW-ONLY. **Reviewer:** OpenCode (actual), independent QA. **Scope:** the supplied packet only (proposal, decision analysis, acceptance matrix, PO decision package, integration task plan, runtime decision request, prior OpenCode final review, 503 source pin). Packet-only: no tools, commands, files, URLs, hashes, tests, or edits executed; no Claude call or authentication; not acting as Solution Architect or PO. Human's review-only instruction grants no implementation or architecture approval.

---

## Verdicts

**PO-decision-package readiness: READY for the INT-D01 scope selection (PASS_WITH_LIMITATIONS).** The package presents a well-formed PO trade-off (INT-A vs INT-C, transport-only evidence boundary, explicit endpoint approval, deferred gates G‑1..G‑9) with all product/approved baselines preserved. Neither prior prerequisite is a substantive blocker to the scope selection itself. Two limitations: (a) the PO would sign text referencing §5, which currently contains one internal contradiction (F1) — best landed before sign-off, or carried in the decision record as an ARCH-FINAL condition; (b) this is document readiness only, not feasibility, and no runtime row is executed.

**Engineering-dispatch readiness: NOT READY (CHANGES_REQUIRED technically, sequestered to ARCH-FINAL).** Dispatch is correctly not requested this step. It must wait for: PREREQ01, PREREQ02, and the prepared-but-not-dispatched Claude clarification return (with independent check) per the decision package; then ARCH-FINAL contract freeze and Codex owner contracts.

**Overall document verdict — PASS_WITH_LIMITATIONS.** No new matrix content defect; no scope/security-breaking defect found (no Task→User alias, no bypass, no shared principal, no proxy leak — guards intact across all documents). But it is a document-only review: no tests, no hashes, no runtime behavior verified; two prior prerequisite wordings remain open in the architect-owned proposal.

---

## Findings (by severity)

**F1 — Major (pre-existing, live): PREREQ02 / proposal §5.2 internal contradiction with INT-ENV-04.**
§5.2 states "Nothing caller-supplied becomes a URL, path, header, method or body, so the endpoint is not a proxy," while the validated `refId` must become a path parameter (matrix INT-ENV-04: "used exclusively as a fixed path parameter of the fixed route template"). The matrix wording was corrected (QX-batch); the architect document was not amended. Since the PO approval explicitly covers "the temporary harness-only endpoint in §5," approving §5 verbatim would approve contradictory text. **Disposition: not a PO/scope blocker** (the substance — Zod-validated refId confined to a fixed template, endpoint not a proxy — is unchanged either way), but it should be clarified in the proposal before or simultaneously with PO sign-off for approval-record precision; it is a mandatory gate before ARCH-FINAL freeze and owner dispatch. No silent waiver; the fix is architect-owned wording, and matrix §8 already records it as a pre-dispatch gate.

**F2 — Medium (pre-existing, live): PREREQ01 / proposal §5.4 app-client envelope has no defined success-value field.**
§5.4 lists app-client fields (`outcome` value/apiError/abort, `apiError.*`, `classification`) but never defines where the schema-validated body value is carried, its field name, or its truncation interaction with the 16 KiB cap. Matrix T1/T2 (and T10's field-for-field comparison via INT-PERS checkpoints) depend on that body being in the envelope. **Disposition: does not block a PO scope decision** — pure technical contract detail, Claude-owned, frozen at ARCH-FINAL. **It does block contract freeze and engineering dispatch**, because dispatch would produce envelope claims that T1/T2 cannot be asserted against comparably.

**F3 — Minor (new): client option pass-through is assumed, not verified.**
Proposal §4 asserts body-only client observation via the client's `headers` option, and §5.2/matrix INT-ENV-04 require client calls to pass `init: { cache: 'no-store' }` — both presume an http-client option surface the packet never evidences. INT-ENV-07's confirmation list covers cross-root import, loopback binding, glob pickup, handler dynamicity, and fetch caching, but not the client's own pass-through support. **Recommendation (bounded):** extend ARCH-FINAL / INT-ENV-07 to confirm the shared client supports the exact `headers` and cache-init options as used; deviations reported, not worked around. Does not affect PO scope.

**F4 — Minor (new): INT-PERS-04/T11b "causally verifies the DB was stopped before the write" has no named evidence.**
The strict no-change assertion for T11b hinges on causal verification that is never defined. **Recommendation (bounded):** name the evidence class at ARCH-FINAL — e.g., Codex-recorded container-stop command exit with UTC strictly before the PATCH envelope `startedAt`, plus container/storage identity equality — or drop the variant. Does not affect PO scope.

**F5 — Informational / verification limits for this review.**
- `src/lib/api/http-client.ts` is not included in this packet; the architect reports having read it, but this review cannot independently verify the client's `code` mappings (e.g., 503→`HTTP_ERROR` in T11a/T8, `NETWORK_ERROR`/status 0 in T12) or its option surface (F3). These remain architect-attested claims until ARCH-FINAL or execution.
- The 503 source pin (`native-503-source-pin.json`) pins file SHA-256s under an ephemeral `/tmp/...` checkout; per the prior review it is treated as supplied read-only accepted source, not independently re-verified here. Longer-term re-verification should rely on the recorded hashes, noting checkout ephemerality as residual risk.

---

## Explicit PREREQ dispositions (summary)

| Prereq | Blocks PO scope decision? | Blocks contract freeze / dispatch? |
|---|---|---|
| PREREQ01 (app-client value-field wording §5.4) | **No** | **Yes — both** (assertions T1/T2/T10 require a defined envelope body field) |
| PREREQ02 (validated-refId fixed-path-param wording vs §5.2) | **No — substance unchanged** (recommend landing before/with PO sign-off because PO approves §5 text) | **Yes — both** |

The prepared manual Claude clarification prompt can resolve both in one bounded return; its return plus independent check remains a pre-dispatch prerequisite, which the packet correctly does not claim as landed.

---

## Remaining risk

- All 51 acceptance rows stand NOT_RUN independently of this review; packet readiness implies nothing about Next-runtime feasibility (cross-root import, loopback binding, client pass-through), Cloudflare viability, $0 cost, or full recovery.
- Dispatch readiness additionally depends on external-owner paths (Codex provider-gaps, Antigravity dispatch limits) outside this packet, and on ARCH-FINAL not regressing the corrected matrix wording.
- If the PO selects INT-A0 or INT-C, Sections A–E re-author; this review's matrix applicability lapses as written.
- Step03A files are out of scope and were not assessed.

**Explicitly not endorsed:** no tests executed, no hashes verified, no runtime/production behavior proven, no PREREQ waived, no architect document rewritten, no PO selection or approval recorded. Skipped: everything requiring execution, tools, or edits. MC-002 remains OPEN / WAITING_APPROVAL; C01-PRODUCT OPEN; Architecture Approval Gate NOT_PASSED.
