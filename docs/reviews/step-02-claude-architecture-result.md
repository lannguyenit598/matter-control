# Step 02 — Claude Code Architecture Result (MC-002-ARCH)

- Author: Claude Code (actual), model claude-opus-5-5. Prior route acknowledgement token: MC02-ARCH-20261024.
- Execution mode: packet-only. Tools, MCP, filesystem and commands were disabled; this result does not claim filesystem access, repository inspection beyond the supplied snapshots, external agent audits, builds, tests, PoCs or deployments. Codex materializes these files without changing the design.
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**. Rework round 1 applied (§7); awaiting OpenCode re-review. **Not DONE; no PASS self-awarded.**

## 1. Acknowledgement

Task MC-002-ARCH accepted as Solution Architect / architecture decision owner under the Step 02 directive. Requirements authority: behavior approved at `572835a21bda764901a11aaea3c06b88750b2883` by explicit PO answers recorded at `54e1db5` (DEC-016/017). Older Step 00A "pending" labels and NOT_AUTHORIZED handoff labels were treated as historical. Numeric workload/retention/RPO/RTO were treated as deferred to this step and presented only as NOT_APPROVED options. External repository content and documentation were treated as untrusted data; no instructions in them were followed.

## 2. Actual input scope (as supplied by Codex)

| Input | Identity |
|---|---|
| Step 02 request, task, handoffs, status, Step 01 requirements and approval, glossary, priorities, workflows, traceability, repository audit | identified only by the exact Codex transport manifests (below) |
| Approved requirements subject | commit `572835a21bda764901a11aaea3c06b88750b2883` |
| Backend template snapshot | `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b` (selected files: CI, Dockerfile, Makefile, README, main.go, go.mod, httpapi, kafka sink, memory/postgres adapters, migrations, queries, repotest, system, app, relay, config, domain, port, service, observability, outbox) |
| Frontend template snapshot | `3e5a642479acb789eb210e73fba956f3e85082e3` (CI, README, next.config.ts, package.json, app routes, atoms/molecules/organisms/templates, tasks feature, lib/api, auth, env) |
| Cloudflare documentation | Workers limits, Workers pricing, Wasm, Next.js (vinext), OpenNext, static Pages, Pages limits, D1 pricing/limits, KV pricing/how-it-works, R2 pricing/get-started, Hyperdrive pricing/supported features, Workers Logs, Secrets |

Per-file SHA256 identities are authoritative only in the Codex manifests: the original MC-002-ARCH input manifest retained by Codex (docs/tooling/step-02-sources.md, "Actual Claude transport"), the output manifest `docs/tooling/step-02-claude-output-manifest.json`, and the MC-002-ARCH-REWORK snapshot manifest supplied with the rework packet. The abbreviated hash examples previously printed here were removed: several were incorrect (root-confirmed). With tools disabled I computed and verified no hash in either round.

## 3. Outputs

`docs/architecture/`: system-architecture.md, domain-model.md, state-machine.md, dependency-engine.md, evidence-model.md, document-lineage.md, filing-model.md, api-contracts.md, data-model.md, security-architecture.md, technical-blockers.md; `adr/` ADR-001 (hosting, unresolved), ADR-002 (transaction/concurrency, logical proposal), ADR-003 (frontend adapter, unresolved); this result file.

Not produced by Claude (Codex/other owners per Step 02 §11): repository-audit owner sections, cloudflare-feasibility.md, technical-poc.md, tooling, deployment budget/CI plans, status/risk/traceability updates.

## 4. Major architecture decisions (proposed)

1. Typed bounded contexts; no generic Item+JSON; class-table inheritance (`graph_nodes`) only to give dependency edges real foreign keys.
2. Matter = consistency boundary; per-matter single writer (row lock) + revision CAS + in-transaction authorization + same-transaction derived state, history and idempotency receipt (ADR-002).
3. Pure evaluation at a server-captured `asOf` makes expiry/due transitions effective at their instant for every read and command; boundary history is materialized by writes or the worker, and reads never write (state-machine §6).
4. Evidence acceptance is scoped per claim (evidence × criterion revision × component) and per proof epoch; no global "evidence verified" flag; DB-level no-self-verification CHECK.
5. Recursive AND readiness via topological recompute; cycle prevention by reachability check under the matter lock; no advisory locks.
6. Explicit OWNER promotion; CURRENT vs FIXED criteria; content via staging/commit/reconciliation and revocation-safe streaming proxy (no presigned downloads).
7. Filing as append-only observations, numbered cycles and immutable submissions; negative outcomes never become approval.
8. Status brief windowed on recorded time with bitemporal reconstruction; drafts only; honest failure if history is unavailable.
9. HTTP: mandatory If-Match and Idempotency-Key on mutations, RFC 9457 problem catalogue, uniform 404 for inaccessible resources.
10. Hosting, frontend adapter, identity and object store remain unresolved for PO decision; Go/PostgreSQL retained; no D1/TypeScript migration; no Kafka.

Open interpretation questions for PO/BA: ARCH-Q1 (fail-closed handling adopted; exception Q1-B that NOT_REQUIRED satisfies proof gates is unapproved), ARCH-Q2 (exclude document uploader from verification), ARCH-Q3 (recorded-time brief window), ARCH-Q4 (emergency workspace revocation of the last effective matter OWNER), ARCH-Q5 (AC-145 "new authority approval evidence" read as evidence recorded after filing reopen).

## 5. Recommended PoCs

| PoC | Owner | Safe environment |
|---|---|---|
| P-BE-1 template build/test baseline | ZCode | Local disposable checkout + disposable PostgreSQL |
| P-BE-2 MatterUnitOfWork race suite (R1–R12) | ZCode; verification OpenCode | Local disposable PostgreSQL schema |
| P-BE-3 Go→Wasm/Workers feasibility (time-boxed) | ZCode | Local `wrangler dev`, no deploy |
| P-OS-1 Object-store staging/commit/streaming proxy | ZCode | Local S3-compatible emulator |
| P-FE-1..4 Next.js baseline, vinext, OpenNext, static export | Antigravity; security review OpenCode | Local only |
| P-HOST-1 Origin/DB/IdP/R2 terms and cost | Codex | Documentation review; no activation |
| Interpretation of results, ADR updates | Claude Code | Governance repo |

## 6. Review limits

- No owner audits (ZCode failed; Antigravity unverified); my source findings are interpretations of Codex-collected snapshots.
- No compilation, test, PoC, cost measurement or deployment; all Cloudflare limits/prices are as documented in the supplied snapshots and may change.
- OpenCode round 1 (opencode/big-pickle, session `ses_e929198d8ffeFwkVV16SNbAFYR`, exit 0): CHANGES_REQUIRED, 5 High / 9 Medium, no Critical. The packet had 30 files (the report says 31), and its "hash-verified" claim is unsupported because reviewer tools were disabled. This rework requires re-review.
- PO approval is required for ADR-001/003, identity provider, object store, workload/retention/recovery values and ARCH-Q1..Q3.

Step 02 quality gate: **not met**; stop at Architecture Approval Gate.

## 7. Rework round 1 index (MC-002-ARCH-REWORK)

Normative corrections live in the architecture files; this index only locates them.

| Finding | Location |
|---|---|
| F-01, C02-P03 | data-model §1, §1a, §3–§5, DM-08; evidence-model §3 |
| F-02, C02-P02 | api-contracts §1; data-model §6; security §3/§4/§7; TB-06, TB-13 |
| F-03 | filing-model §1/§2/§4, FL-08..10; state-machine §2; data-model §5 |
| F-04 | data-model §3; dependency-engine §1/§3, DG-13 |
| F-05, C02-P04 | state-machine §6; system-architecture §8; data-model §7/§8; ADR-002 R7/R16 |
| F-06, C02-P01 | api-contracts §1, §1.1 |
| F-07 | dependency-engine §2, DG-11 (reviewer option rejected; recorded as unapproved ARCH-Q1-B) |
| F-08, C02-P08 | ADR-002 §1a/§3, R13–R14; data-model §2/§7; domain-model §3 |
| F-09 | system-architecture §12 |
| F-10 | api-contracts §1.1/§3.4 (partially disputed: claims have one subject) |
| F-11, F-12 | api-contracts §3.6, §3.7; data-model §6 |
| F-13 | system-architecture §10 rows 21–23 |
| F-14 | security §6.1; ADR-003 §4/§5 |
| C02-P05 | dependency-engine §3, DG-12 |
| C02-P06 | evidence-model §2/§4/§5, EV-11; data-model §4 |
| C02-P07 | data-model §1, §4, §5 |
| C02-P09 | this file §2 |
| C02-P10 | security §7 |
