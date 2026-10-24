# Step 02 Architecture Approval Packet — Pending

Owner: Codex orchestration/cloud; architecture author: actual Claude Code. Requirements subject572835a, PO approval54e1db5, task MC-002. **No decision in this packet is approved.** Independent architecture round1 is CHANGES_REQUIRED; correction/re-review precede logical architecture approval. Step02 is not DONE, and Step03 is not authorized by approving an individual item here.

## 1. Logical candidate

[System](../architecture/system-architecture.md), [domain](../architecture/domain-model.md), [state](../architecture/state-machine.md), [proof](../architecture/evidence-model.md), [API](../architecture/api-contracts.md), [data](../architecture/data-model.md), [security](../architecture/security-architecture.md). Typed domain, five independent axes, PostgreSQL transaction/history/receipt boundary, explicit document promotion and numbered Filing cycles are Claude's candidate. [Review disposition](../reviews/step-02-review.md) must identify the exact corrected subject and independent verdict before approval; current findings are not waived by this packet. Approved product rules remain unchanged.

## 2. Runtime and next validation strategy

| Choice | Concrete effect | Current evidence / consequence |
|---|---|---|
| H5 local validation first — Codex recommendation for the next bounded step | Authorize only disposable local Go/PostgreSQL/frontend/object-emulator technical PoCs after actual owner routes are available; preserve the approved stack | Requires no selected cloud provider or paid activation. This does not resolve deployment or $0 production feasibility and cannot close Step02 by itself |
| H1 hybrid candidate investigation | Permit investigation of a native Go origin and PostgreSQL outside Cloudflare while keeping Cloudflare frontend candidates | Explicit hosting-constraint exception required before selecting topology. [Provider research](../deployment/provider-options.md) has not found a complete evidenced $0 production stack; no provider is recommended for activation |
| H3 Cloudflare-only Go/Wasm investigation | Time-box a local compatibility experiment with a new fetch/database bridge | Substantial adapter changes, unproven pgx/Echo/Huma/Fx compatibility and CPU budget; preserve Go/PostgreSQL constraints and stop on incompatibility |
| H2 paid Cloudflare Containers / other paid origin | Investigate a paid alternative | Budget and activation require separate concrete approval. No spend or service activation is requested here |

[ADR-001](../architecture/adr/ADR-001-runtime-and-hosting.md) owns these alternatives. H4 TypeScript/D1 is not the default or a recommended substitution. An approved H5 validation strategy does not approve H1/H2/H3 or a production release. ZCode's missing packaged provider configuration and Antigravity's unverified direct route remain operational gates; structured [owner handoffs](../implementation/agent-handoffs.md) are ready.

## 3. Workload and recovery targets

Claude's W1/W2/W3 options are in [system §12](../architecture/system-architecture.md). Codex proposes **W1 as a measurement envelope**, subject to PO choice: one workspace, at most10 active Matters,15 named users,5 concurrent editors,300 records/Matter,2GB stored content and25MiB/file. These are test inputs, not measured capacity. “A few imports/exports per week” still needs a numeric frequency/peak and maximum rows before a cost or performance commitment; no inferred usage distribution is accepted.

For a first local restore exercise only, Codex proposes measuring against **RPO24 hours / RTO8 hours**, using daily logical backup plus corresponding object-copy/checksum inventory. These are proposed engineering targets, not promises or legal retention advice. The exercise must restore DB, history, versions, proof references, permissions and content together; failed measurement remains a blocker. Production values/provider guarantees require separate acceptance and evidence.

Retention options remain R-A (retain history/versions until a disposition policy is approved) or R-B (explicit period after closure plus hold/erasure requirements). Neither is a numeric retention commitment. PO must supply or approve the actual policy before storage growth, erasure behavior or a production budget can be accepted. W1 and the recovery proposals may be approved independently of cloud/provider activation.

## 4. Decisions that remain evidence-gated

Frontend vinext/OpenNext/static/native-Node choice ([ADR-003](../architecture/adr/ADR-003-frontend-runtime.md)); identity provider; object storage and any R2 billing step; receipt/audit retention; brief recorded-vs-effective interpretation; stricter verifier exclusions, if desired. No provider/adapter choice is recommended before owner PoCs. Do not bundle unresolved choices into a blanket architecture approval. Any proposal conflicting with approved RULE-003 requires a separate business change request, not an architecture reinterpretation.

## 5. Approval gate acceptance

Record each PO answer with exact subject, scope, consequences and DEC ID. Reconcile actual owner audits, independent security review, required PoCs, full service budget and remaining Critical/High blockers. Only then can MC-002 reach DONE and a separate Step03 assignment be considered. A document review PASS, local build or successful preview alone cannot satisfy this gate.

No cloud account, payment method, service, production resource, source template or global agent setting has been changed. Current request is not permission to publish this packet or internal artifacts to additional providers.
