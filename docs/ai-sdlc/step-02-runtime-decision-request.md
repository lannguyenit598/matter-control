# MC-002 — Remaining Runtime and Integration Decision Request

Prepared by Codex Cloud/DevOps from actual Claude ADR-001/003 and Step02.2 official-source refresh, 2026-10-24. Status **PREPARED / NOT_SELECTED / NOT_APPROVED**. This does not reopen product positioning, approved business rules, H5/W1 or ARCH-Q3/Q5. Normative architecture hashes are unchanged. References: [existing approval packet](step-02-approval-packet.md), [cloud assessment](../architecture/cloudflare-feasibility.md), [full budget](../deployment/free-tier-budget.md).

## Deployment conflict needing an eventual PO choice

The native Go/Echo/pgx server is evidenced locally; no unchanged Worker fetch bridge exists. Hyperdrive connects to an external database, not hosted PostgreSQL storage. The two templates lack a selected exact frontend adapter. No demonstrated production option satisfies all approved stack, Cloudflare-only and $0 constraints. This is a verification gap plus the explicit H2 paid-plan conflict, not proof that every future Go/Wasm option is impossible.

| Existing alternative | Preserved / trade-off | Evidence still needed before approval/commitment |
|---|---|---|
| H1 native Go + PostgreSQL origin, Cloudflare edge/frontend (or paired F4 Node origin) | Preserves native stack; requires non-Cloudflare hosting exception | Named eligible host/DB offers, region/TLS/private origin, durable storage, backups/restore, sleep/egress/limits, full lifecycle bill and candidate frontend tests |
| H2 Cloudflare Containers + external PostgreSQL | Preserves native Go; conflicts with zero-cost requirement | Workers Paid minimum$5 plus container/DO/network/DB/backup inventory; PO cost exception before activation; no paid action now |
| H3 Go/Wasm fetch + database bridge | Keeps Go language; substantial adapter changes, not unchanged Echo/pgx proof | Approved local spike, exact compiler/bridge, real DB errors/transactions, migration route, size/startup/CPU/memory and feature tests; no rewrite selected |
| H5 local only (already approved) | Safe technical development evidence; no production solution | Continue bounded tests; does not satisfy production deployment/cost gate |

H4 TypeScript/D1 remains an unselected major stack/database substitution, not a proposed shortcut. F1 vinext beta/F2 OpenNext still need exact pinned feature/build/runtime tests; F3 static redesign needs separate auth/security/behavior review. Native Node success does not select F4 cohosting. Codex does not select an alternative on Claude's behalf.

## Integration scope question (separate from deployment)

Actual Claude proposes (a) a transport-only local harness for reachability/problem parsing/error mapping, or (b) defer integration until a compatible product API/auth seam exists; neither is selected. C01-NATIVE can proceed independently. Any auth seam needs an identity decision; no aliases/bypass/new product routes/screens are implied. [Dependency plan](../testing/step-02-integration-poc.md).

## What a later decision record must contain

Chosen H/F and integration scope; explicitly accepted exceptions; candidate provider/plan/region and exact pinned versions; measured demand and quota headroom; full storage/identity/backup/CI/monitoring/egress inventory; approved retention/receipt/import-export parameters; security/recovery evidence; actual Claude disposition and independent OpenCode verification. Account eligibility and price facts are not runtime proof. Production commitments, paid activation and deployment remain separate approvals.

No approval request is blocking the already-ready manual C01 dispatch. These consequential decisions remain visible for subsequent work; no approval is inferred from this document.

Skipped: provider/account activation, adapter migration and topology selection. Risk: a component free allowance cannot establish a complete zero-cost service.
