# MC-002-INT-ARCH-CLARIFY — Manual Claude Code Handoff

**PREPARED / WAITING_MANUAL_DISPATCH. Not sent or executed.** Actual Claude Code returned the main architecture proposal and its Next-runtime correction. The supplemental call failed: exit1, is_error=true, “Not logged in”; independent read-only auth status also reports not logged in. Codex did not initiate login or change settings. See testing/step-02-3/claude-final-execution.json and claude-auth-status.json.

This handoff clarifies bounded architecture wording before engineering dispatch; it does not supersede the prior actual proposal or authorize implementation. The following prompt is self-contained and uses only supplied synthetic/source facts; tools/MCP remain off. The human may paste it into actual Claude Code after restoring its own authenticated session. No identity/provider setting change is part of the prompt.

## Complete copy-paste prompt

You are actual Claude Code, MatterControl Solution Architect. Task MC-002-INT-ARCH-CLARIFY, priority P0, document analysis only. Record actual tool/version/model and acknowledge scope. Tools/MCP off; use only this supplied context. No commands, file reads/writes, implementation, auth flow, tests, database, cloud or paid action.

Governance: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control, branch task/MC-002-solution-architecture, base e377568ac47f8f1b88e3875a8f13d7e57fc30667. Codex applies returned exact edits. Do not touch the15 historical normative architecture/ADRs, approved requirements, accepted C01/R01/R02 evidence, or unrelated Step03A work.

Already returned by actual Claude Code2.1.309 / claude-opus-5-5: Step02.3 proposal and correction, session a6577bf0-ce08-4d72-9e69-3fa29bb7b00f. This is PROPOSED / WAITING_PO_APPROVAL, not architecture approval. C01-NATIVE52b60a4 and R01/R02 accepted with their recorded limits; C01-PRODUCT OPEN. H5/W1/Q3/Q5 approved. INT-D01 not selected.

Current recommended INT-A: isolated temporary Next.js development-server root outside product src/, using pinned existing dependencies. One harness-only POST Route Handler executes unchanged frontend httpRequest before REST to unchanged native Go52b60a4 and real disposable PostgreSQL. No product UI, Task/User alias, auth bypass, shared token, source/dependency changes. Authentication/authz/Workspace-Matter isolation are excluded and remain mandatory product gates. PO must explicitly approve the temporary endpoint. Cross-root import, loopback binding and artifact exclusion remain unverified. INT-A0 Node-only is a smaller exception requiring a new explicit PO choice; INT-C defers. Engineering waits for approval and final contract.

Return bounded exact edits to docs/architecture/integration-scope-proposal.md for these three clarifications only:

1. Section5.2 currently says:

   “Method, path template, headers and body are fixed per case. Nothing caller-supplied becomes a URL, path, header, method or body, so the endpoint is **not a proxy**.”

   Yet the Zod input allows refId, a lowercase UUID, for record cases. Clarify that only validated refId fills the fixed route template. Caller-supplied URL, arbitrary path, method, headers/body overrides remain forbidden. No proxy capability.

2. Section5.4 currently says:

   “- **App-client:** outcome (value / apiError / abort), apiError.{status, code, message, details}, classification.”

   The actual Markdown wraps those identifiers in inline code. Explicitly name the schema-validated User value field for outcome=value; wire fields remain null/not-observable-via-client. The shared client returns body only, auto-serializes JSON, sets Content-Type and exposes ApiError status/code/details on errors. It does not return success status/headers. Wire controls use separate request IDs/records through the same Next runtime. Do not change the client.

3. Pin the native T11 error detail exactly “service temporarily unavailable” and retryAfter1 as a native-template convention. Accepted source52b60a4: docs/api.md148..163, errors.go58..78, testdata/unavailable.golden1..15; Codex preserved excerpts and source hashes in docs/testing/step-02-3/native-503-source-pin.json. This is a source pin, not runtime execution or a new product convention.

Preserve the existing section7 rule: failed POST stays OUTCOME_UNKNOWN. Do not retry/re-POST or use a new key, list route or SQL query to “prove” whether it committed. A non-GET503 may have committed; 201/409 on a later POST cannot establish absence or a defect. Known-ID PATCH may be read after recovery without mutation; product receipts/reconciliation stay deferred.

QA corrections follow existing scope: synthetic body markers absent from application logs; actual secret values absent everywhere. Controlled bounded synthetic response artifacts may contain synthetic values. Product auth fixtures must follow the future approved IdP, not optional INT-B test-signer choices. All runtime results remain NOT_RUN.

Output: task ID, actual identity, acknowledgment, proposed status, and JSON exact old/new edits for only the three clarifications; if exact quoted Markdown is insufficient, return replacement wording as an explicitly unapplied proposal instead of guessing an exact match. Codex then requests OpenCode independent check. Stop before implementation and PO approval; MC-002 not DONE.

## Return and next gate

Expected output: bounded patch proposal/clarification. Reviewer: actual OpenCode. No DONE or engineering readiness before actual return, independent check, explicit PO scope selection and final contract freeze. No actual manual dispatch is claimed.
