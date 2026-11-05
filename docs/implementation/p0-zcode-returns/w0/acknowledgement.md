# MC-P0-ZCODE-DELIVERY — W0 acknowledgement (V2)

Date: 2026-10-26 (UTC window 17:01–17:25Z). Status: **W0_RETURNED / IN_REVIEW — read/hash/static preparation only.** No implementation, runtime, repair, staging or gate pass is claimed.

## 1. Actual identity and route

- Tool: **ZCode** (ZCode Desktop app 3.16.3, darwin 27.0.0 arm64), interactive session.
- Model/provider (self-reported): `account:zai-start-plan/GLM-5.3-Flash` via Z.AI. No login, provider/model/account switch or paid activation; quota is available in this session and no billing recovery is inferred.
- Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; HEAD before and after work `a62d838791ba188838c4ff00b7b6e265ac775056`.
- Delivery route: **manual human prompt delivery, actually received and acknowledged here.** No direct Codex→ZCode engineering dispatch is verified; none is claimed.

## 2. Understood scope

V2 assignment activates W0 only: one read/hash/static preparation pass producing the six original W0 outputs, **with the V2 R5 delta incorporated** (the original `w0/` directory was absent, so no separate `w0-r5-delta` supplement is written). Scope: map all 20 FR-001..020 to actual source, consolidate real missing decisions, return one exact W1 contract, produce wave progress/estimates. Prohibitions acknowledged: no source/index/security-state/global-memory/settings writes; no execution of imported code; no scans/commits/runtime/probes/signals; no dependency copy/install; no credentials; no Mimosa workaround; no subagent spawning or external messaging. Architecture/Design/STEP03B remain unpassed; P1/P2 excluded; production release is a separate PO gate.

## 3. Authorship overlap (disclosed, with consequences)

| Work | ZCode relationship | Consequence applied |
|---|---|---|
| BE01 matter spine (`apps/backend` matter increment: service/domain/port/SQLC for Requirement create/get) | **ZCode is the author** (codex/mc-be-01 @136eae6 + reviewed staged patch 33297560…) | Any W1 backend change extending it makes ZCode the author of the changed set → **independent reviewer must be Codex (nonauthor of source) or another qualified nonauthor**; ZCode cannot self-approve |
| Antigravity R4/R5 harness payloads (INT-A transport) | Nonauthor; ZCode performed the received independent R5 source review | Review stays frozen; any future ZCode repair of it → ZCode becomes author → different reviewer required (INTA-REVIEW-NEXT) |
| FE template baseline (`apps/frontend` @3e5a642) and go-hexa template (BE01 ancestry 52b60a4) | Not authored by ZCode (imported template bytes) | Reuse as-is; no framework migration |
| MC-003A.8 F-08/F-10 design proposals, Mimosa investigation | ZCode-authored documents/proposals | Treated as proposals only; adoption belongs to Claude/PO; no self-adoption in this packet |
| Historical FE driver-stage runtime rounds | ZCode executed runtime owner role earlier | Not authorship of current FE/product code; no runtime authority implied |

## 4. R5 verdict incorporated (V2 delta)

Actual received verdict: **CHANGES_REQUIRED_SOURCE_ONLY + PROOF_BASIS_BLOCKED; stage BLOCKED_CONTRACT_NOT_BINDING; RUNTIME_NOT_RELEASED** (review `6f977d66…`, intake accepted by Codex with provenance-errata: R5-Z01 corrected to 8 match / 14 mismatch, entries 9..22 — reviewer prose off-by-one acknowledged, no artifact rewritten). R5-I01..06 confirmed; INT-A closure subtrack defined (INTA-PROOF-DEC → INTA-CORR-NEXT → INTA-REVIEW-NEXT → INTA-STAGE-NEXT → INTA-RUNTIME-NEXT); W0 may propose the proof-basis decision section (done in decision-package §7) but adopts nothing. Transport-harness gates are kept separate from product-feature gates.

## 5. Input verification result

All 16 V2 direct pins match (bytes+SHA-256). The transitive original P0 manifest (`docs/testing/p0-zcode-plan-20261026/inputs.json`, `e19c1c2d…`) and its 42 declared pins were hashed: **42/42 match**, including current-workflow (`2e3db1e7…`), project-status (`17a95c19…`), coverage (`d3bd6927…`), all requirement/product/architecture/review/design receipts, component AGENTS, go.mod, package.json. **No pin drift; no NEEDS_INPUT_REFRESH.** Source-visibility facts used: `apps/backend` = BE01 snapshot 136eae6+patch 33297560 (137 files), `apps/frontend` = template baseline 3e5a642 (323 files), `tools/inta-harness` = 48cc03e (temporary, excluded from product) — import still uncommitted; HEAD alone is not accepted product source.

## 6. Reads performed (bounded)

Declared pins (all), hash-verified. Bounded extra reads with Semble-first compliance: one Semble query (`semble search "Requirement service create get transaction receipt" apps/backend`, 5 symbol chunks returned with exact paths/lines); backend/frontend directory listings; component AGENTS; project-status/current-workflow tails (hash-verified files, bounded sections); design/auth/BE02 architecture receipts (pinned). No private env/config/provider state inspected; no imported code executed. Per-read details and exits are in `return.md`.
