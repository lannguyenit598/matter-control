# MC-P0-ZCODE-DELIVERY — W0 return (V2)

Status: **W0_RETURNED / IN_REVIEW.** Actual ZCode (ZCode Desktop 3.16.3, darwin 27.0.0 arm64, model self-reported `account:zai-start-plan/GLM-5.3-Flash` via Z.AI). Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; HEAD before **and** after: `a62d838791ba188838c4ff00b7b6e265ac775056`. Route: manual human delivery, actually received; no direct dispatch claimed. Mode: read/hash/static/docs only.

## 1. Input verification (before work)

- V2 packet `docs/testing/inta-r5-zcode-review-intake/p0-v2-inputs.json`: **16/16 direct pins match** (bytes+SHA-256), including the received R5 review `6f977d66…`, its two QA outputs, R5 findings/preflight/manifests, R5 intake docs and design-handoff context manifest.
- Transitive original P0 manifest `docs/testing/p0-zcode-plan-20261026/inputs.json` (`e19c1c2d…`, 8421 bytes): **42/42 declared pins match** — plan, task, prompts, coverage, assignment, AGENTS (root + both components), current-workflow, project-status, quality-gates, orchestration, step-01 approval, traceability, all requirement docs (PRD/SRS/priorities/business-rules/state-semantics/permission-matrix/AC/golden-workflows), product docs, source-layout, source-import manifest (provenance only), 4 architecture receipts, 3 review receipts, design-gate/register/system/handoff, go.mod, package.json.
- **No pin drift. No NEEDS_INPUT_REFRESH.** No reread of the whole project was needed; bounded section reads of the two large hash-verified status files are recorded below.

## 2. Actions log (UTC, exact commands abbreviated, all exit 0 unless noted)

| UTC | Action | Exit |
|---|---|---|
| 17:01:09Z | `date` + `git rev-parse HEAD` + `branch --show-current` + W0/W0-r5-delta dir absence checks (both ABSENT → original six outputs per V2 rule) + named-doc presence | 0 |
| 17:02–17:08Z | Read in full: p0-zcode-delivery-plan.md, tasks/MC-P0-ZCODE-DELIVERY.md, p0-v2-inputs.json, p0-zcode-delivery-r5-addendum.md | 0 |
| 17:09Z | `shasum -a 256` 16 V2 pins | 0, 16/16 match |
| 17:10Z | `shasum -a 256` 42 original manifest pins | 0, 42/42 match |
| 17:11Z | Read coverage.json + inta-r5-zcode-review-intake.md + receipt.json + provenance-errata.json | 0 |
| 17:12Z | Read apps/backend/AGENTS.md, apps/frontend/AGENTS.md, source-layout.md | 0 |
| 17:13Z | Bounded tails: project-status.md (last 60 lines + MC-P0 grep), current-workflow.md (last 40 lines) — both files hash-pinned | 0 |
| 17:14Z | Source tree listings (backend dirs, 77 .go count; frontend src dirs); `semble --help` | 0 |
| 17:15Z | `semble search "Requirement service create get transaction receipt" apps/backend` → 5 symbol chunks with exact paths/lines (matter_service.go:178-221, requirement.go:144-175, port/matter.go:1-42, repotest memory.go:74-117, matter_dto.go:103-138) | 0 |
| 17:16–17:19Z | Read mvp-scope.md, three-golden-workflows.md, permission-matrix.md, backend-http-preparation.md, design-gate-decision.md, selected-design-system.md, next-milestone-handoff.md; grep api-auth-decision-analysis.md recommendations + tail; grep SRS FR headings + api-contracts.md section headers | 0 |
| 17:21Z | W0 dir absence re-check + `mkdir -p` docs/implementation/p0-zcode-returns/w0 | 0 |
| 17:21–17:24Z | Write acknowledgement.md, source-gap-map.json, decision-package.md, w1-contract.md, progress.json | 0 |
| 17:25Z | `python3 json.load` parse check on both JSONs (JSON_PARSE_OK) + hash/size the five outputs | 0 |

No other files were read or written; no source/index/security-state/settings/memory writes; no execution of imported code; no scans/commits/runtime/probes/signals/credentials/dependency operations; no subagent spawned; no external messaging.

## 3. After-work verification

HEAD unchanged `a62d838…`. Only the six new W0 files exist under `docs/implementation/p0-zcode-returns/`. Input re-verification (after): four key declared pins spot-checked (original P0 manifest `e19c1c2d…`, R5 review `6f977d66…`, R5 addendum `9fa91c17…` — all match their before-values). The V2 packet file itself (`p0-v2-inputs.json`) was content-verified before work via its 16 declared pins (all matched) but was not self-hashed then; its first-captured self-hash after work is `a52ad1d18da80474…` (full value retained in session evidence). No drift detected in any declared pin during the session.

## 4. Output hash table (return.md itself excluded — its hash is reported in the delivery message)

| File | Bytes | SHA-256 |
|---|---:|---|
| acknowledgement.md | 5,089 | `6cb9e8871fb625b0df4807f09cb4410e7edec17feec402e2b862ca5998d51cc2` |
| source-gap-map.json | 15,425 | `b1a29bcc08552daa950d4289b3747e4352500d696cf4b9101a3e84d5031492d9` |
| decision-package.md | 11,077 | `e2028080f1f646bacae28f5b83dbeeda39fab7c74e010ae5b0d0b64a9330b5fc` |
| w1-contract.md | 7,384 | `46075b4b409593978218f0615e0604cc081782c4f01fd95d7e7c207568ce7167` |
| progress.json | 6,327 | `c868f884447a821de9d1d0a35c0ff1fa5f1d852646c6cfb238bac5629ff04fad` |

No self-hashing manifest is included anywhere.

## 5. Result summary

- **20/20 FR-001..020 mapped** to actual file/symbol evidence with honest statuses (source-gap-map.json): reusable backend = BE01 typed Requirement create/read transactional spine (service/domain/port/SQLC + receipt/idempotency + fault-injectable repos); frontend = clean template baseline with zero product features; 14/20 FRs have no supporting backend logic beyond domain types; all FRs need HTTP endpoints.
- **One deduplicated decision package** (8 areas D1–D8) with recommended minimal options, impacts, deciders and exact unblock receipts; already-approved items (P0 scope, OBD-02..08/10/11, H5/W1 local inputs, D-UX01..04, permission matrix, Option A) listed as not-reopened. Includes the INTA-PROOF-DEC proposal (P-A interval evidence / **P-B deny-by-construction recommended** / P-C explicit re-adjudication) — proposed, not adopted.
- **Exact W1 contract** (w1-contract.md): FR-001-partial/008/018 + NFR subset, backend/FE change reach with named paths, fixture/test plan, reviewer proposal (Codex nonauthor for ZCode source; REVIEW_BLOCKED fallback), BLOCKED_ON_GATES until D1/D2/D4/D7 receipts.
- **Progress** (progress.json): W0..W7 statuses/dependencies/next actions, INT-A closure subtrack states, earliest ready work, estimate ranges per wave with explicit assumptions and no dates/percentages.

## 6. Proposed next status and dependency

Proposed: **IN_REVIEW / W0_RETURNED.** Exact next dependency: Codex intake of this packet, then routing — D1 to Mimosa maintainer/PO, D2+D3 to Claude (technical adoption), D4 to design authority, D8 (§2) to Architecture/PO. No wave activation, no source repair (INTA-CORR-NEXT stays PLANNED_NOT_ASSIGNED), no Antigravity or ZCode correction is started by this W0.

## 7. Skipped work and remaining risks

Skipped: all implementation/runtime/staging/test/scan/commit operations; private env/config/provider inspection; provider or reviewer contact; memory/global writes; second W0 or workspace-wide hash snapshot. Remaining risks: (1) the accepted never-listen criterion may be unsatisfiable by sampling alone — the §2 decision is on the critical path of INT-A closure; (2) Mimosa maintainer response latency gates every wave's source base; (3) reviewer scarcity can force honest REVIEW_BLOCKED; (4) estimates exclude gate/review wait time by design; (5) BG-08 ETag representation and INT-D02 remain genuinely open trade-offs that could reshape the W1 contract surface.
