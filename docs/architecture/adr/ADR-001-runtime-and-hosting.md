# ADR-001 — Runtime and Hosting Topology

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`; frontend `3e5a642479acb789eb210e73fba956f3e85082e3`; Cloudflare docs snapshots (Workers limits Oct 12 2026, pricing Oct 2 2026, Wasm Apr 23 2026, Hyperdrive Jun/Sep 2026, D1 Apr 2026, R2 Oct 2026).
- Status: **PROPOSED — UNRESOLVED / WAITING_PO_APPROVAL**. Blockers TB-01/02/05/06 OPEN. No option is selected; no paid activation or remote deployment is authorized.

## 1. Context

Approved constraints: Go backend (hexagonal template), PostgreSQL, Next.js frontend, Cloudflare Free Tier, $0/month for a verified MVP workload. Source facts: the Go service is a native TCP `net/http` server with fx lifecycle and a pgx pool (`internal/app/app.go`, `postgres/user_repository.go`); the template ships a native Docker image. Cloudflare facts (docs): Workers run fetch handlers, 10 ms CPU per request on Free, 128 MB memory, 1 s startup, 64 MiB uncompressed size, 100,000 requests/day; Wasm runs only precompiled modules, single-threaded, WASI experimental; Containers are Workers Paid only; Hyperdrive pools connections to an *existing* PostgreSQL from Workers (100,000 queries/day Free); D1 is SQLite-based and single-threaded per database. The existence of Wasm support does not establish that Go networking (TCP listener, pgx sockets), fx, Echo or Huma work in a Worker.

Conclusion of analysis: **no evidenced option satisfies all approved constraints simultaneously.** This ADR therefore presents alternatives for PO decision.

## 2. Options

| ID | Topology | Keeps Go + PostgreSQL | Cloudflare Free Tier only | $0 status | Main risks |
|---|---|---|---|---|---|
| H1 Hybrid | Next.js on Workers (ADR-003 adapter) or Pages static; Go native server on a non-Cloudflare host; managed PostgreSQL; R2 via S3 API | Yes, unchanged runtime | **No** — origin and DB outside Cloudflare (exception) | UNVERIFIED: depends on third-party free tiers not in evidence | Third-party free-tier durability, cold starts, egress; two vendors |
| H2 Containers | Go image in Cloudflare Containers; PostgreSQL external | Yes | No — Containers "Free: N/A" | **Not $0** (Workers Paid $5/month minimum per pricing doc) | Paid activation not approved |
| H3 Go→Wasm Worker | Rewrite inbound adapter to a Workers fetch bridge; replace pgx TCP with a Workers socket/Hyperdrive bridge; drop fx/net listener | Go language kept; adapters largely replaced | Yes in principle | UNVERIFIED | Go/TinyGo Wasm size vs 64 MiB and 1 s startup; reflection-heavy libraries (Huma, fx) compatibility unverified; 10 ms CPU per request for graph recompute; DB driver over Workers sockets unproven. Effectively a new backend |
| H4 TS + D1 | Rewrite backend in TypeScript on Workers with D1 | **No** | Yes | Plausibly $0 within D1 Free (5M rows read, 100k rows written/day, 500 MB/db) | Violates approved Go/PostgreSQL constraints; requires explicit PO change; D1 single-writer and SQLite semantics need re-design of locking |
| H5 Local-only | Docker Compose: Go + PostgreSQL + local object store; Next.js dev | Yes | N/A | $0 locally | Not a production answer; allowed only as development strategy if PO approves |

H1 sub-variants for the origin and database (each UNVERIFIED, to be evidenced by Codex with dated sources): free-tier container/VM host; always-free cloud VM running both Go and PostgreSQL; managed PostgreSQL free tier plus separate compute.

## 3. Evaluation criteria

1. Preserves approved P0 behavior and invariants without degradation (all options must; H3/H4 carry rewrite risk).
2. Preserves Go + PostgreSQL (approved constraint).
3. Fits Cloudflare Free Tier / $0 for the PO-approved workload (W1/W2 options), including storage, backups and egress — not only compute.
4. Supports synchronous causal consistency (single-writer per matter, row locks, transactions). H4 on D1 would need a different serialization mechanism (D1 is single-threaded per database, which serializes writes but changes failure and limit characteristics).
5. Security: private origin reachable only through authenticated path; secrets management.
6. Operability: backups, restore rehearsal, migrations, monitoring.

## 4. Architect's assessment (not a decision)

- H1 is the only option that keeps both approved stack constraints and the Workers-hosted frontend while plausibly costing $0 at W1. It is nevertheless an **exception** to "Cloudflare Free Tier" for the backend/database and its $0 claim is unevidenced. It requires PO approval.
- H3 should be pursued only as a time-boxed feasibility PoC if the PO prioritizes "Cloudflare-only" over "template runtime unchanged"; expected outcome is high rewrite cost.
- H2 is the cleanest technical fit but is paid; present to PO with cost.
- H4 is listed for completeness; it is not proposed, and nothing in this architecture assumes it.
- The logical architecture (ports/adapters, MatterUnitOfWork, row-lock concurrency, proxy streaming) is identical for H1/H2/H5 and does not block on this decision.

## 5. Required PoCs (safe environments only)

| PoC | Owner | Environment | Success evidence |
|---|---|---|---|
| P-BE-1 Go template native build/test | ZCode | Local disposable checkout + disposable PostgreSQL container | `go test -race` incl. PostgreSQL contract tests, migrations idempotent |
| P-BE-2 MatterUnitOfWork concurrency spike (edge/cycle/revocation races) | ZCode, verified by OpenCode | Local disposable PostgreSQL | DG-06, DM-07 pass repeatedly |
| P-BE-3 Go→Wasm feasibility (H3) | ZCode | Local `wrangler dev` only, no deploy | Size, startup, CPU per request, DB connectivity result (pass/fail recorded) |
| P-HOST-1 Origin/DB provider evidence (H1) | Codex | Documentation and pricing review; no account activation without PO approval | Dated terms, limits, backup capability |
| P-OS-1 R2/S3 streaming proxy | ZCode | Local S3-compatible emulator; R2 only after PO approves any billing step | Range streaming, checksum commit, reconciliation |

## 6. Consequences

Until decided: development may proceed only under H5 if the PO approves a local development strategy; no production feasibility is claimed; Step 02 cannot close.
