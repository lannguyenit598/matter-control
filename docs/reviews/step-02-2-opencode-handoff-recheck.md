## MC-002-VERIFY-022-HANDOFF — Targeted Recheck of Findings 1–3

**Basis:** the four amended/supplied snapshots only (prompt, `source-cas-evidence.json`, prior review, clarification, edge cases, verification contract, gates matrix). No tools, no file reads, no hash recomputation, no runtime, no inference of execution. This recheck is scoped to closure of my three findings in the amended manual handoff.

### Verdict

**PASS_WITH_LIMITATIONS — all three actionable findings CLOSED.** The amendment uses the cite-source route for Finding 1 and adds the two missing prompt-body items for Findings 2–3. Limitations are the standing packet-only ones: excerpt authenticity/hash at `d024e3e` was Codex's read-only action, not mine, and I performed no line-level source inspection.

### Finding 1 — If-Match 412 vs plain 409: **CLOSED**

- The unattested "CAS412" assertion is removed. The prompt now reads: "The existing stale If-Match path returns412 via errPreconditionFailed in `internal/adapter/inbound/httpapi/user_handler.go`; verify and retain that distinct path rather than merging it with plain409."
- `source-cas-evidence.json` (pinned base `d024e3e`, sha256 `aa66c697…`, `inspection_only: true`) supplies exact excerpts supporting both halves:
  - Line ~90: `errPreconditionFailed = echo.NewHTTPError(http.StatusPreconditionFailed, "If-Match does not match the current version of the resource")`.
  - Line ~311: `if in.expected != 0 && errors.Is(err, port.ErrVersionConflict) { return nil, errPreconditionFailed }`, with the in-source comment "With If-Match, a version conflict means the precondition failed (412). Without If-Match, conflicts remaining after service retries become 409 (see toProblem)."
- Internally consistent: clarification row 1 maps `ErrVersionConflict` → 409 for the without-If-Match case; the excerpt shows the with-If-Match override to 412. No contradiction. The prompt's "verify and retain" wording makes this a verify-against-source instruction backed by the citation, which satisfies the finding's required action.
- Non-blocking observation only: excerpt content is taken at face value; authenticity/hash verification is attributed to Codex, as required.

### Finding 2 — SQLSTATE/retry-predicate stop-and-escalate: **CLOSED**

- Expected-behavior paragraph now carries the escalation rule in the prompt body itself: "If the existing CAS retry predicate already matches any SQLSTATE that is now reclassified, stop and escalate to Codex/Claude; do not adjust it."
- This is a verbatim restatement of edge-cases §3, no longer dependent only on the "read edge-cases IN FULL" directive. It coexists without conflict with the standing "service CAS retry predicate" no-alter line and with "existing CAS retries/count/outcome must remain unchanged."

### Finding 3 — Echo ContextTimeout shape and observed pgx types: **CLOSED**

- Test paragraph now names both assumption checks explicitly: "Explicitly test whether Echo ContextTimeout surfaces HTTPError503 or raw DeadlineExceeded, and capture/assert the actual pgx error types/chains observed for each real fault; do not assume either API shape."
- Matches clarification §1's two "Unverified API assumptions" and edge-cases §4's observe-don't-assume rule. The test list still covers all edge-case §1 unit cases (wrapped `28P01`/`3D000`/`42501`→500; `53300`/`57P03`→503; bare typed connect→503; cancellation 499 precedence).

### Consistency of the amendment itself

No new contradictions found: 499-before-503 precedence, `retryAfter` integer 1 as unexported non-product constant, `Type` ownership with `about:blank` default, HEAD bodyless, probe/migration/config preservation, unknown-commit wording ("A5xx on a non-GET does NOT imply no change committed") all remain as previously verified. The prompt-text changes are additive one-liners within the scoped envelope.

### Preserved gates (unchanged by this recheck)

C01-NATIVE **PREPARED / WAITING_MANUAL_DISPATCH**; C01-PRODUCT **OPEN**; target status model **NATIVE_PASS / PRODUCT_OPEN** only after independent review; R01/R02 **CLOSED** at `d024e3e`; whole MC-002 **OPEN**; Architecture Approval Gate NOT_PASSED; Step03 NOT_STARTED; no C01 implementation/QA/runtime inferred, none granted.

### Delivery metadata

- **Task:** MC-002-VERIFY-022-HANDOFF recheck, packet-only. **Changed files:** none. **Tests run:** none, by design.
- **Proposed status:** findings 1–3 recorded CLOSED; proceed with manual paste of the MC-002-BE-C01 prompt into actual ZCode; OpenCode implementation QA only after a real diff/test return; Codex intakes the returned artifacts first.
- **Skipped / remaining risk:** excerpt authenticity and hash verification (Codex's read-only action, pending/attributed); no source or link re-inspection by me; residual risk limited to that authenticity being unverified by this session — it does not change dispatch readiness or any gate.
