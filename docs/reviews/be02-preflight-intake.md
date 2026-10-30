# MC-BE-02-PREP — ZCode technical preflight received

Date:2026-10-26, Asia/Ho_Chi_Minh. Owner/intake: Local Codex. Actual ZCode reports interactive account:zai-start-plan/GLM-5.3 via Z.AI, unchanged route; version not recorded. This is an owner feasibility return, not independent QA or architecture/PO approval. Status: **OWNER_PREFLIGHT_RECEIVED / TARGETED_TECHNICAL_CORRECTIONS_REQUIRED**, parent preparation IN_REVIEW.

## Integrity and retained recommendations

Raw return17316bytes, SHA256 `aed0ff2a66fe17586908fa3fc49f6d93d1d94c3bc8d356e931cba049c93613e1`, preserved losslessly under [intake evidence](../testing/be02-preflight-intake/intake.json). Codex reverified24/24original input hashes and backend HEAD136eae6+patch33297560; the same patch is now staged, with no source-byte change. The source remains independently reviewed but uncommitted because of the recorded Mimosa block. No baseline replay or commit retry was performed.

All eight gaps are acknowledged. Retain as candidate recommendations: separate product composition/migration/DSN; explicit fail-closed verifier and policy dependencies; strict product DTO and trusted adapter fingerprint; own-key snapshot lookup with saved-scope/all-Matter reauthorization; truthful DB fence provenance; no fabricated temporal evaluation; test-only principal construction with no runtime/config fallback. Real identity, retention/retry and representation decisions remain open.

## Four narrow technical followups

These address proposal correctness before an implementation contract is finalized. They are not new BE01 source findings and do not reopen its accepted review. Details and exact source pins are in [technical-followups.json](../testing/be02-preflight-intake/technical-followups.json).

| ID | Issue | Required clarification |
|---|---|---|
| BE02-PF-01, BG05 | Existing receipt DTO is called already version-pinned; proposed JSONB wrapper is said to yield original stored HTTP bytes without re-encoding | Existing createdResultDTO has no schemaVersion. Distinguish immutable domain data from exact HTTP bytes. Choose a versioned deterministic codec with compatibility guarantees or separately preserved wire bytes/metadata in the transaction. Preserve old receipts and whitelist public DTO fields; RequestHash is internal. |
| BE02-PF-02, BG08/06 | OptionA allows a metadata zone while keeping a resource-revision strong ETag | A zone inside JSON body is still representation data. Put volatile provenance genuinely outside the body, or choose a different validator/CAS design. Define codec/representation conditions and affected client/consumer handling. |
| BE02-PF-03, BG04/02 | Proposed400 wrong Content-Type /422 wrong field type is described as matching native, while T26 separately asks415-vs400 | Native bindJSON returns415 for unsupported media type and400 for syntax/type failures. Give one explicit product media/charset/JSON/schema/semantic matrix; mark candidate changes and retain native bytes. |
| BE02-PF-04, BG01 | Suggested core PrincipalResolver.ResolveRequest(ctx, headers) couples the abstraction to HTTP | Header extraction/token verification belongs at the adapter boundary. Any necessary core identity lookup accepts a transport-neutral verified identity. Clarify the trust chain and test-only seam. No imported-HTTP violation is asserted for code that does not exist. |

PF01 source check: `matter_dto.go:36–42,103–135` contains an ordinary persistence DTO and JSON marshal/unmarshal; `command_receipts.response` is JSONB at migration:189. JSONB normalizes textual representation, so a wrapper alone does not prove byte preservation. This follows [PostgreSQL18 JSON Types§8.14](https://www.postgresql.org/docs/18/datatype-json.html). The existing storage contract remains acceptable within BE01; the unsupported claim concerns the future HTTP recommendation.

PF02 follows the selected-representation requirement in [RFC9110§8.8.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.1). A body envelope is not a mechanism for excluding its own volatile bytes from ETag semantics. The native/INT-A ETag observation is a scoped precedent, not proof or approval of the proposed product representation. Client header consumption is an impact to list, not frontend support already verified.

The fixed fingerprint tuple still needs explicit bytes/escaping/newline/path normalization rules. Do not silently add principal material to the tuple merely because the principal is trusted: actor/key already form receipt lookup identity. Any tuple change must be explicit and vector-tested. No new numeric/provider default is selected.

## Coverage and source limits

Owner proposed T25 path canonicalization, T26 media/charset and T27 boundary refusal over HTTP. They are preserved in [acceptance addendum](../testing/be02-preflight-intake/acceptance-addendum.json), with27total planned cases, all NOT_RUN; original24case file and22CT/51INT-A IDs/results remain unchanged. Existing T13/T14/T21/T07 receive proposed additional assertions, not fabricated execution.

Owner states requirements/security/state/API-auth contents were hash-verified only, not re-read. Assertions therefore are not a fresh full-source compatibility verdict. `matter_dto.go` was not in the original24input read set; Codex separately inspected and pinned it for this intake. Its omission does not establish that the owner read it without permission—it may derive from prior author context—but its cited claims were not fresh-read attested in this preflight. Absence of an identity resolver is established only for the inspected boundary, not by a new exhaustive repository audit.

## Exact next action and gates

Deliver the [four-point ZCode correction-only prompt](../implementation/handoffs/MC-BE-02-PREFLIGHT-CORRECTION-ZCODE-PROMPT.md). It requests a compact text delta, not another eight-gap/full-architecture review or implementation. Human delivery authorizes that exact new read set; Codex has not dispatched it or inferred new BE02 payload permission from BE01/F10.

Once the technical delta is coherent, assemble the concrete architecture/PO choices: reduced local HTTP testing with explicit test-only identity/policy seams if desired; stable resource/provenance representation; exact wire/decoder contract; real identity and retry/retention only when needed for product activation. Architecture ownership stays with Claude Code; this owner feasibility loop cannot self-approve those decisions. An actual accepted corrected BE01 commit and a bounded source assignment still precede successor implementation; do not work around Mimosa by silently using another base/context.

BE02 is not implemented or independently accepted. C01-PRODUCT/auth/isolation, evaluated-state coverage, fields/routes/catalogue changes, F08/F10, architecture/STEP03B, hosting/Cloudflare/cost/recovery and release gates remain unchanged.

Skipped: source/fixture/index changes, Go/HTTP/PG tests, provider/agent dispatch and commit. Risk: technically inconsistent recommendations must not be copied directly into code; owner feasibility is not contract approval or runtime proof.
