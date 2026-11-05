# Claude quota interruption — source-backed ZCode handoff, 2026-10-27

**Overall state: PARTIAL_IMPLEMENTATION. W1/W2 are present on both stacks; W3 is partially implemented ahead of the living return; W4–W7 remain to complete.** Incoming owner is actual ZCode for backend/API and product frontend under the latest direct PO instruction. This summary records current source and checks, not independent product acceptance or a claim that ZCode has run.

Task MC-P0-ZCODE-RESUME-AFTER-CLAUDE, continuing MC-P0-ZCODE-EXECUTION. Actual preparation/reviewer Local Codex. Priority P0. Requirements FR-001..020, canonical AC-101..163 / NFR-001..014 / original GW-01..03. Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.

## Current working-source identity

[Fresh inventory](../testing/p0-zcode-resume-after-claude-20261027/inventory.json): **613 public app source/config/doc entries**, aggregate SHA-256 `4fcd245181a6672453cd88b125a32e1e5e962c3ad859982f675b68a2484e97f9`. The exact aggregate method, per-file bytes/hashes, symlink handling and excluded private/generated/dependency paths are recorded in that inventory and `checks.py`. No private runtime file content was read.

Compared with Claude's 472-file acknowledgement snapshot: **29 modified +141 added, zero missing**. Backend 23 modified/45 added; frontend 6 modified/96 added. Compared with the previous W1 review: 43 modified/69 added, zero missing. These are content deltas, not an authorship certification for every line or a feature-completion percentage. Preserve original ZCode/Claude contribution history.

Actual inputs are pinned in [input-pins.json](../testing/p0-zcode-resume-after-claude-20261027/input-pins.json). **Current contract is revision 7**, 34,487 B, SHA-256 `75cf6493d33f38aa4daabb8472fa8f21e66a6998ebc09a55777bc546b69869ae`. It contains §2.3 W2 and §2.4 documents/proof, including a real promotion wire contract. The final Design R9 return's old DEPENDENCY_PENDING observation was true at its rev-6 read; it is not evidence that the current rev-7 operation is absent.

Closing comparison: authored source and all six pinned coordination/design inputs stayed unchanged. The inherited inventory method also selected `apps/frontend/tsconfig.tsbuildinfo`; `pnpm check` refreshed that generated incremental cache. [closing.json](../testing/p0-zcode-resume-after-claude-20261027/closing.json) discloses this one benign delta; [post-check-cache.json](../testing/p0-zcode-resume-after-claude-20261027/post-check-cache.json) supplies its new bytes/hash and the updated aggregate. It is not a Claude/ZCode edit or an unexplained competing writer. Do not force the cache back to its pre-check hash.

## What Claude implemented

### W1 — authenticated product foundation

- PostgreSQL workspace/creation/membership/read/history/receipt/access adapters and shared memory/PG contract suites; product composition/configuration and `cmd/mcapi`.
- ZITADEL authenticated introspection verifier and lookup-only `(issuer, subject)` identity mapping; explicit product-user seed helper. Product rights remain in MatterControl, not IdP role shortcuts.
- Product HTTP catalogue with auth-first handling, strict input decoding, ETag/If-Match/CAS, idempotency/replay/UNKNOWN and separate native/product composition.
- Next.js server-side OIDC/BFF sessions: Authorization Code + PKCE/state/nonce, ID-token verification, refresh/logout/session-currentness, opaque browser cookie; Workspace/Matter navigation/admin and Requirement create/detail/history.
- CW1-F01..03 author fixes are present: recovery follows receipted vs nonreceipted operation; lost/unusable command answers preserve UNKNOWN; redirect targets reject control/backslash/external-origin cases and are revalidated. New related unit/component tests pass in the current frontend suite. This is not final independent security acceptance.

### W2 — daily operations, backend/API and frontend

Source includes:

- `internal/core/domain/matter/{workgraph,execution,derive,workview}.go`, `port/work.go`, `service/work_service.go`.
- `postgres/work_store.go`, migration `0002_work_graph.sql`, `repotest/mattercontrol/{memory_work,contract_w2}.go`.
- `productapi/work_{handlers,dto}.go`, route registration and HTTP tests: typed Actions, metadata, guarded execution/waiting, AND dependency gates, cycle/self/duplicate/cross-Matter refusals, workstreams/parties/milestones, grid/derived timing-attention, critical chain, My Actions/Waiting On. The author reports 19 W2 routes; the current total also includes later W3 additions and should not be inferred from that old count.
- `src/features/work/`: repositories/schemas/actions and Grid/filter/sort/paging/density/title edit, metadata/execution/dependency/escalation controls, planning, four-section My Actions and rejection explanations.
- Product pages at Matter work list/detail/planning and `/my-actions`; session-keyed draft support and access-loss cleanup. Actual keyboard/touch/visual operation is not proved by these unit tests.

### W3 — additional source discovered after Claude's last recorded checkpoint

The workboard and return say W3 NOT_STARTED, but the current public source contains substantial W3 work:

- `domain/matter/evidence.go`, `port/evidence.go`, `service/evidence_service.go`: document create/version upload/promotion/signatures; criteria/applicability; evidence/claims/independent assessment/revocation/disputes/verifier designation; scoped content/checklist reads and recomputation.
- `postgres/evidence_store.go`, migration **`0003_documents_evidence.sql`**, `repotest/mattercontrol/{memory_evidence,memory_objects,contract_w3}.go` and PG shared-suite registration.
- `outbound/objectstore/{store,store_test}.go`; composition/config fields for object directory/upload limits; `productapi/evidence_{handlers,dto,server_test}.go` and route registration.
- Frontend **plumbing exists**: `src/features/proof/{schemas,repository,actions}.ts`, BFF raw upload and scoped content/download routes, raw-body/client download support in `src/lib/mc/client.ts`.
- **No corresponding complete product documents/proof component/page flow was found in the inspected app route/feature inventory.** Finish W3 UI, integration, negative/recovery coverage and docs rather than recreate the backend or call the entire wave done.

Fresh selected tests exercise W3 memory contract, proof HTTP flow, upload/promotion/content and local object-store behavior and pass. They do not establish actual PG/W3 end-to-end or visual acceptance.

## Evidence: author reports versus this intake

Claude's workboard session at `2026-10-27T08:41:08.072438+00:00` reports `make check` exit 0 (17 packages, 0 lint issues, PG fixtures), frontend 30 files/325 tests and `pnpm build` exit 0 for the W1/W2 checkpoint. The execution evidence folder currently only contains the original baseline manifest, not a fresh complete raw receipt set for those claims. Preserve the statements as **author-reported**, not newly independently reproduced PG/build evidence.

Local Codex actually ran in this intake (raw stdout/stderr, commands/cwd/start/end UTC/exits retained):

| Check | Result | Scope |
|---|---|---|
| `go build ./...` | exit 0 | Current whole backend compiles, including W3 composition |
| Selected `go test -race -count=1 -json` | **226 test/subtest pass, 0 fail, 0 skip**, 7 test-bearing packages pass | Core/domain/policy/service, product API, memory W1/W2/W3 contract and object-store tests; DB-related environment variables removed |
| `pnpm check` | **exit 0, 30 files /325 tests pass** | Type generation/TypeScript/lint/format/Vitest/agent checks; no browser |

Tool observations: Go `go1.27.3 darwin/arm64`; Node `v24.22.1`; Vitest output `v5.0.5`. Receipts: [fresh handoff evidence](../testing/p0-zcode-resume-after-claude-20261027/). The check runner never loaded PG/IdP private configuration. No DB provisioning, fixture tests against PostgreSQL, token/real-user login, browser or resource lifecycle action occurred.

## Design R9 and the required addendum

The full instruction requested by the PO remains part of the takeover:

> Read and execute `docs/implementation/handoffs/MC-P0-CLAUDE-CONSUME-DESIGN-R9-ADDENDUM.md`. Consume R9 final, handle errors per operation, then continue the complete backend/API/frontend W1–W7 plan without restart or stopping after design intake.

The filename and text mentioning Claude are historical routing; **this takeover makes actual ZCode the consumer/executor**. Keep design output and reviewer evidence read-only. R9 return/manifest pins match and all 102 payloads still match; consume compatible deltas and record it in the existing workboard. No current explicit R9-consumption checkpoint was found; implementation similarities alone do not establish it happened.

Use Enterprise Precision/Comfortable+Compact/EN-VI/Lucide and the complete 13-screen map, scoped draft purge/retention, separate promotion target/expected-current/impact acknowledgment, truthful UNKNOWN and contextual navigation. Do not copy fixture authorization/evaluators into product enforcement.

Known design checker gap: the global `"409" not in contract` assertion is stale after rev 6, which introduced guarded domain refusals. Missing CAS remains 428, stale CAS 412, domain refusal 409, key reuse 422 and lost command response UNKNOWN. Do not delete 409 or conflate these to make an old checker green. Current rev 7 extends domain rejection codes for W3; update actual product consumers/tests together. Pinned design correction remains with its design owner.

## Stale records to reconcile after acknowledgement

- Final return's identity section still names contract rev 5 and says R8 not consumed; its footer still says W2–W7 outstanding despite the W2 completed section.
- Workboard contract is rev 6, while actual source is rev 7; current_source_checkpoint is the 472-file intake acknowledgement and W3 remains NOT_STARTED despite the discovered source.
- Top owner/history fields span prior ZCode/Claude sessions. Append the new ZCode execution-owner transition while preserving attribution; do not rewrite all history.
- API docs/`api.http` and some contract planned/old object-port text lag implementation. Synchronize docs/config/catalogue against actual code when completing W3; do not use old prose as authority to delete source.

## Exact continuation and blockers

1. Verify the 613-entry working snapshot/current deltas, acknowledge takeover and reconcile one workboard. Check there is no concurrent implementation writer.
2. Consume the full R9 addendum and current rev-7 producer/consumer contract. Preserve CW1 fixes and W1/W2 passing behavior.
3. Finish **partial W3** across real document/proof UI and backend/API/PG/object integration, ownership/version/review/epoch/concurrency/UNKNOWN negatives and complete docs/config/tests.
4. Implement **W4 Filing → W5 Control Room/context → W6 bulk/import/export/brief → W7 stabilization/full GWs/isolated recovery and handover** on both stacks. No new W0 or per-wave independent-review stop.

Existing dependencies remain: effective ZITADEL redirect URI configuration differs from its receipt; real user-token audience unverified; no UI→BFF→Go→PG human-session acceptance; browser/keyboard/touch/visual/screen-reader and AC-137 real manager study pending. No bootstrap/master/admin credentials are added by this owner transfer. Missing human/browser/production decisions do not block unrelated author code/tests. Cloudflare/cost/recovery/production and Mimosa commit gates are not closed.

Resources (Claude-reported, **not live verified** here): `mc-p0-claude-pg`, loopback `55440`, task label `mc.task=MC-P0-CLAUDE-TAKEOVER`, retained volume `mc-p0-claude-pgdata`; separate native/product test DBs and `mc_p0_run`; existing `mc-p0-idp-*` stack. Verify exact ownership/state before use, do not replay prepare/provision or delete volumes. Source owner change is not proof of health or authority over unrelated resources.

Proposed status: **handoff READY_NOT_DISPATCHED; product PARTIAL_IMPLEMENTATION**. [Full ZCode prompt](../implementation/handoffs/MC-P0-ZCODE-RESUME-AFTER-CLAUDE-PROMPT.md). Source changes may continue under the latest user-authorized task boundary, but no accepted commit, unsupported Mimosa disposition, release or independent approval is invented.

Skipped: product fixes, full PG/IdP/build/browser/runtime/restore audit, secret reads, database/container lifecycle, security/commit retries, Git mutation and actual ZCode invocation. Remaining risk: W3 source is ahead of its checkpoint, W4–W7 remain incomplete, and auth/runtime/UX/independent acceptance are not established.
