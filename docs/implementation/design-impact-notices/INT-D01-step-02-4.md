# Design Impact Notice — INT-D01 / Step02.4

Owner Codex coordination.2026-10-25 Asia/Ho_Chi_Minh. Base a7e99929e842105c7941b469422f4bfb7778bf82. **DRAFT / SCOPE_NOT_SELECTED / NOT_SENT / NOT_ACKNOWLEDGED.** No Step03A worktree or UX artifact was read, edited or dispatched to. This notice is stored in governance only, outside the design workstream.

| Decision / option | Affected UX flow | Required user-visible behavior | Architecture dependency | Recommendation for OpenDesign |
|---|---|---|---|---|
| INT-D01 / INT-A proposed | No new product flow: temporary technical harness is outside the product app; product sign-in, Control Room/Grid and unavailable views remain future flows | A harness response must not be presented to product users or labeled product auth/isolation/readiness proof. Existing approved product states stay as specified; unavailable never implies zero/READY; no inaccessible titles/counts exposed | Explicit PO approval of transport-only scope and temporary endpoint; later product API/auth and permission implementation still required | Keep design work within its separately authorized brief. Do not add a User CRUD/product harness screen or mark product flows integrated from INT-A. Label any independently authorized prototype data/simulation accurately |
| INT-D01 / INT-B recorded but not ready | Future authentication/session-expiry/denial interaction may be affected | No hardcoded/demo/shared identity represented as secure production login. Respect the existing approved disclosure/denial boundary; provider-specific sign-in/callback/error copy remains unspecified | Revised scoped design, INT-D02 identity decision, real authz/isolation boundary and material architecture approval before implementation | Record dependency/questions; do not finalize a provider-specific UX or promise role enforcement from a temporary token validator |
| INT-D01 / INT-C | Existing proposed product flows have no new runtime integration result | Preserve explicit prototype/unwired status; do not infer availability or security from document PASS | Compatible product API/auth slice and a later explicit scope approval | Continue only separately authorized design work; wait for approved API/auth handoff for binding interactions |
| INT-D01 / INT-A0 conditional | Diagnostic only, omits actual Next runtime | Never label the reduced evidence as Next/product integration | Reported INT-A infeasibility plus separate PO reduced-scope choice; not currently eligible | No new product UX action; keep diagnostic outside user flows |

State/permission constraints are unchanged: Requirement versus Action and independent Execution/Verification/Dependency/Timing/Attention; active Workspace membership AND explicit Matter membership AND scoped role; Workspace OWNER no implicit Matter access; VIEWER read/export only within approved Matter scope. Frontend cannot authoritatively compute readiness or grant permissions.

No OpenDesign model/tool was invoked, no message sent, no design review/release approval inferred. Step03A/03B are not marked DONE. A later selected decision may need an updated notice; receipt/acknowledgement must be recorded separately.

## Selected-decision update — NOT_SENT

Direct PO DEC-028 selects INT-A. Its transport-only/harness-excluded-from-product implications in the INT-A row above now apply as the selected scope. No auth/provider/product UX is implemented or proven. This notice remains governance-only NOT_SENT/NOT_ACKNOWLEDGED; no message or design worktree edit occurred, Step03A/03B not marked DONE.
