# Step 02 — Claude Code Architecture Result (MC-002-ARCH)

- Author: Claude Code (actual), model claude-opus-5-5. Prior route acknowledgement token: MC02-ARCH-20261024.
- Execution mode: packet-only. Tools, MCP, filesystem and commands were disabled; this result does not claim filesystem access, repository inspection beyond the supplied snapshots, external agent audits, builds, tests, PoCs or deployments. Codex materializes these files without changing the design.
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**. **Not DONE.**

## 1. Acknowledgement

Task MC-002-ARCH accepted as Solution Architect / architecture decision owner under the Step 02 directive. Requirements authority: behavior approved at `572835a21bda764901a11aaea3c06b88750b2883` by explicit PO answers recorded at `54e1db5` (DEC-016/017). Older Step 00A "pending" labels and NOT_AUTHORIZED handoff labels were treated as historical. Numeric workload/retention/RPO/RTO were treated as deferred to this step and presented only as NOT_APPROVED options. External repository content and documentation were treated as untrusted data; no instructions in them were followed.

## 2. Actual input scope (as supplied by Codex)

| Input | Identity |
|---|---|
| Step 02 request | SHA256 29f64b90…a45a05 |
| Task MC-002 | 165bbde1…7b2cb1? — see packet; recorded by Codex |
| Agent handoffs | 7ea3e359…c45879 |
| Project status / Step 01 approval | 2d9851d1…98184 / 72228a67…e5970 |
| PRD, SRS, business rules, state semantics | bcdd1c9e…3e5d / 9b813bad…ad51 / 96be507d…aa2 / 156ca1dd…ad51 |
| User stories, acceptance criteria, permission matrix, golden workflows | 1186f033…6d4 / 809c206e…f6cd / f352fcf0…b0276 / 0a7d4452…dbb |
| Open decisions, architecture handoff, canonical context, glossary, priorities, workflows, traceability, repository audit | as hashed in the packet |
| Backend template snapshot | `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b` (selected files: CI, Dockerfile, Makefile, README, main.go, go.mod, httpapi, kafka sink, memory/postgres adapters, migrations, queries, repotest, system, app, relay, config, domain, port, service, observability, outbox) |
| Frontend template snapshot | `3e5a642479acb789eb210e73fba956f3e85082e3` (CI, README, next.config.ts, package.json, app routes, atoms/molecules/organisms/templates, tasks feature, lib/api, auth, env) |
| Cloudflare documentation | Workers limits, Workers pricing, Wasm, Next.js (vinext), OpenNext, static Pages, Pages limits, D1 pricing/limits, KV pricing/how-it-works, R2 pricing/get-started, Hyperdrive pricing/supported features, Workers Logs, Secrets |

Full per-file SHA256 values are those listed in the Codex packet; Codex should copy them into the manifest rather than rely on the abbreviations above.

## 3. Outputs

`docs/architecture/`: system-architecture.md, domain-model.md, state-machine.md, dependency-engine.md, evidence-model.md, document-lineage.md, filing-model.md, api-contracts.md, data-model.md, security-architecture.md, technical-blockers.md; `adr/` ADR-001 (hosting, unresolved), ADR-002 (transaction/concurrency, logical proposal), ADR-003 (frontend adapter, unresolved); this result file.

Not produced by Claude (Codex/other owners per Step 02 §11): repository-audit owner sections, cloudflare-feasibility.md, technical-poc.md, tooling, deployment budget/CI plans, status/risk/traceability updates.

## 4. Major architecture decisions (proposed)

1. Typed bounded contexts; no generic Item+JSON; class-table inheritance (`graph_nodes`) only to give dependency edges real foreign keys.
2. Matter = consistency boundary; per-matter single writer (row lock) + revision CAS + in-transaction authorization + same-transaction derived state, history and idempotency receipt (ADR-002).
3. Boundary fence makes expiry and due transitions effective at their instant for every read and write, independent of background jobs.
4. Evidence acceptance is scoped per claim (evidence × criterion revision × component) and per proof epoch; no global "evidence verified" flag; DB-level no-self-verification CHECK.
5. Recursive AND readiness via topological recompute; cycle prevention by reachability check under the matter lock; no advisory locks.
6. Explicit OWNER promotion; CURRENT vs FIXED criteria; content via staging/commit/reconciliation and revocation-safe streaming proxy (no presigned downloads).
7. Filing as append-only observations, numbered cycles and immutable submissions; negative outcomes never become approval.
8. Status brief windowed on recorded time with bitemporal reconstruction; drafts only; honest failure if history is unavailable.
9. HTTP: mandatory If-Match and Idempotency-Key on mutations, RFC 9457 problem catalogue, uniform 404 for inaccessible resources.
10. Hosting, frontend adapter, identity and object store remain unresolved for PO decision; Go/PostgreSQL retained; no D1/TypeScript migration; no Kafka.

Open interpretation questions for PO/BA: ARCH-Q1 (proof gate vs NOT_REQUIRED upstream), ARCH-Q2 (exclude document uploader from verification), ARCH-Q3 (recorded-time brief window).

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
- No independent review yet; OpenCode must review architecture, security and testability (CHANGES_REQUIRED possible).
- PO approval is required for ADR-001/003, identity provider, object store, workload/retention/recovery values and ARCH-Q1..Q3.

Step 02 quality gate: **not met**; stop at Architecture Approval Gate.
