# Journey walkthroughs — MC-ZCODE-BA-FLOW-COMPLETENESS-20261030-r1

- Agent: actual ZCode acting as BA (author-adjacent: ZCode is a partial backend author — NOT independent QA).
- Runtime: `mcapi` built from the dirty tree at HEAD `0de3e5d`, run on `127.0.0.1:18082` against the task-owned PostgreSQL fixture `mc-ba-flow-pg` (db `mc_ba_flow_r1`, migrations v9 incl. `0009_criterion_purpose`). Identity: synthetic IdP stub on `127.0.0.1:18099` (leftover of this task's earlier session, route `/introspect`, issuer `http://127.0.0.1:18099`, audience `ba-stub-aud`); bearer tokens are synthetic (`tok-ba-*`). **UI NOT_RUN**: no browser session (no synthetic IdP passwords without reading secret files, browser login blocked per prompt §1); every step below is the HTTP/API tier behind the BFF, exactly as documented in `docs/implementation/p0-zcode-execution/local-contract.md` rev 13.
- Actors: Alice `ba-alice` (Workspace OWNER / matter OWNER), Editor2 `ba-editor2` (matter EDITOR), Binh `ba-binh` (matter EDITOR + designated verifier), Cuc `ba-cuc` (matter VIEWER), Dung `ba-dung` (provisioned non-member). All data synthetic; evidence response bodies under `commands/http-walkthrough/` (final run per step; full per-call log `walkthrough.jsonl`).
- Conventions observed that shaped the runs: ETag must be sent quoted-or-unquoted strong tag; `Idempotency-Key` must be UUIDv7; workspace membership roles are `OWNER|MEMBER` while matter roles are `OWNER|EDITOR|VIEWER`; execution states use `IN_PROGRESS` (not `STARTED`); assessments require `expectedSubjectEpoch` + `expectedAssessmentId` (`""` = observed empty) + `assessedVersionId` when the evidence carries a version; first document promotion uses `expectedCurrentVersionId: null` and, once versioned criteria reference the document, an `impactToken` from `GET …?promoteTo=`.

## GW-01 — Transaction / Restructuring (matter `01a18de7-5375` "ACME Share Purchase")

| # | Step (actor) | Result | Evidence |
|---|---|---|---|
| 1 | Workspace create (Alice) | 201; workspace roles granted `MEMBER` ×3 | `gw01-ws-create`, `gw01-madd-*` |
| 2 | Matter create + matter roles EDITOR/EDITOR/VIEWER | 201/200 | `gw01-matter-create`, `gw01-mgrant-*` |
| 3 | Requirement "Shareholder approval recorded" + mandatory criterion (Editor2) | 201; proof readback `UNVERIFIED`, package part declared | `gw01-req-create`, `gw01-crit-create`, `gw01-proof-before` |
| 4 | Submit reference evidence claiming the criterion (Editor2) | 201 (`{id,kind,seq}`) | `gw01-ev-submit` |
| 5 | **Probe: submitter self-assesses** → 409 `self-claim` | correct | `gw01-probe-self-assess` |
| 6 | Designate Binh verifier (Alice, OWNER) | 200 | `gw01-verifier-designate` |
| 7 | Binh `GET /me/reviews` shows the pending claim with subject title | 200 (BF-05 queue live) | `gw01-binh-reviews` |
| 8 | Binh assesses ACCEPTED (epoch + expectedAssessmentId) | 201 → proof `verification: VERIFIED` | `gw01-binh-assess`, `gw01-proof-after` |
| 9 | Document "ACME SPA", upload v1+v2 (raw body), OWNER promotion of v2 with impact token | 201/201/200; `document.currentVersionId = v2` | `gw01-doc-create`, `gw01-v1-upload`, `gw01-v2-upload`, `gw01-doc-impact`, `gw01-promote` |
| 10 | Two signature observations on exact version v2 | 201 ×2 (completeness stays a criterion, never inferred) | `gw01-sig1`, `gw01-sig2` |
| 11 | Milestone "Closing" + PUT prerequisites (critical, reason) | 201/200 | `gw01-ms-create`, `gw01-ms-prereq` |
| 12 | Control Room readback (sections agree at one boundary) | 200 | `gw01-cr-read` |
| 13 | **Probe: dependency cycle** B→A after A→B → 409 `cycle` with `path` | correct | `gw01-dep-AB`, `gw01-dep-BA` |
| 14 | **Probe: VIEWER executes** → 403 `forbidden` (member role denial); **probe: non-member reads matter** → uniform 404 | correct | `gw01-probe-viewer-exec`, `gw01-probe-outsider` |
| 15 | **Probe: stale If-Match PATCH** → 412; item unchanged afterwards (no data loss) | correct | `gw01-probe-stale`, `gw01-after-stale` |
| 16 | **Probe: same Idempotency-Key twice** → same item id, `Idempotent-Replayed: true`, `GET /operations/{key}` receipt 200 | correct | `gw01-idem-1/2`, `gw01-op-receipt` |
| 17 | **Probe: complete action under unsatisfied PROOF gate** → 409 `dependency-blocked` with `gates[{gate: PROOF, code: NOT_COMPLETED}]` | correct | `gw01-dep-CA`, `gw01-complete-C` |
| 18 | Bulk commit (per-row key + attemptKey) | 200 | `gw01-bulk-commit` |
| 19 | Brief window (23 changes) + reversed window → 400 `invalid-window` | correct | `gw01-brief`, `gw01-brief-invalid` |
| 20 | Export CSV keeps state axes as separate columns (`execution,dependency,verification`) | 200 | `gw01-export` |

## GW-02 — Due Diligence (matter `01a18def-02d7` "VendorX Due Diligence")

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Request action IN_PROGRESS→COMPLETED | 200; requirement stays `UNVERIFIED` — "request sent" is not resolution | `gw02-act-request`, `gw02-complete-req`, `gw02-proof1b` |
| 2 | DD pack v1; criterion `versionRule: CURRENT_AUTHORITATIVE` | 201 | `gw02-v1`, `gw02-crit` |
| 3 | Claim pinned to v1; Binh REJECTS with rationale + `assessedVersionId` | 201; subject stays `UNVERIFIED` (rejected claim counts for nothing) | `gw02-ev1`, `gw02-assess1`, `gw02-proof1b` |
| 4 | FINDING + RISK context records (typed) | 201 | `gw02-finding`, `gw02-risk` |
| 5 | Follow-up action: IN_PROGRESS → PATCH owner → **WAITING with party + condition** | 200; `GET /waiting-on` lists the item (`execution: WAITING`, `attention: WAITING`, `dependency: READY` — WAITING is not BLOCKED) | `gw02-fu-*`, `gw02-waitingon` |
| 6 | v2 uploaded; first promote attempt without impact token → 409 `impact-acknowledgement-required`; with token → 200 | correct guard | `gw02-promote`, `gw02-promote2` |
| 7 | **Probe: assess the stale v1 claim** after promotion → 409 `version-not-current` | correct | `gw02-ev-old`, `gw02-assess-old` |
| 8 | v2 claim ACCEPTED by Binh → requirement `VERIFIED`; follow-up completes | 201; lineage kept (REJECTED v1 → ACCEPTED v2 in history) | `gw02-assess2`, `gw02-proof3`, `gw02-fu-complete` |
| 9 | Review grid (P1-partial): create, add version, question, answer with `expectedAnswerId:""` + `questionRevision` | 201/200/200/201 | `gw02-grid*`, `gw02-answer` |

## GW-03 — Regulatory Filing (matter `01a18df2-a493` "Merger Clearance Filing"; BF-01/BF-02 focus)

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Requirement + authority party; filing create `proofRequired: true` | 201 (`{id,kind:FILING,seq}`) | `gw03-req`, `gw03-party`, `gw03-filing` |
| 2 | Criteria: PACKAGE (versioned, dossier doc) + OUTCOME; **probe: OUTCOME criterion on the plain Requirement** → 409 `outcome-criterion-not-applicable` | BF-01 guard live | `gw03-crit-pkg`, `gw03-crit-outcome`, `gw03-crit-outcome-nonfiling` |
| 3 | Dossier v1 promoted (authoritative); PACKAGE_PREPARATION (owner required); OWNER signature-applicability `signatureNotRequired` + reason; SIGNATURE with `versionIds` | 200/200/200 | `gw03-promote-v1`, `gw03-stage-pp`, `gw03-sigapp`, `gw03-stage-sig` |
| 4 | **Probe: SUBMISSION with unsatisfied package** → 409 `guard-failed`: "package criteria are not satisfied: Complete filing package per checklist (MISSING)" | BF-01: only PACKAGE gates submission | `gw03-stage-submit-early` |
| 5 | Package claim ACCEPTED by Binh → SUBMISSION 200 (WAITING on authority) → receipt evidence → RECEIPT 200 → AUTHORITY_REVIEW 200 | receipt ≠ approval at every readback | `gw03-assess-pkg`, `gw03-stage-submit`, `gw03-stage-receipt`, `gw03-stage-review` |
| 6 | SUPPLEMENT (requestRef/owner/due → cycle 2) → RESPONSE (versionIds) → AUTHORITY_REVIEW(2) | 200/200/200 | `gw03-stage-supp`, `gw03-stage-resp`, `gw03-stage-review2` |
| 7 | Outcome evidence + APPROVAL (requires `evidenceIds`) → 200; **readback: `verification: PARTIALLY_VERIFIED`, `outcomeVerification: PENDING`** | BF-01 core: approval observed ≠ outcome accepted | `gw03-ev-outcome`, `gw03-stage-approval`, `gw03-detail2` |
| 8 | **Probe: submitter self-accepts outcome** → 409; Binh ACCEPTS → **`verification: VERIFIED`, `outcomeVerification: ACCEPTED`, `currentCycle: 2`** | BF-01 closed loop live | `gw03-self-out`, `gw03-assess-out`, `gw03-detail3` |
| 9 | Negative path on second filing `proofRequired: false` (BF-02): PACKAGE criterion + evidence + accept + OWNER no-signature applicability → SUBMISSION 200 → negative-outcome WITHDRAWN (with `evidenceIds`) → closure → reopening | 200 ×3; stage machine and negative/reopen epochs hold | `gw03-filing2`…`gw03-reopen`, `gw03-detail-f2` |

## Five user journeys (HTTP-tier observation; UI NOT_RUN)

1. **Morning comprehension** — `GET /control-room` returns one consistent snapshot (state 8 items, blockers 2, next 2, waiting 0, gaps 5, changes 20, milestones with explicit readiness). `GET /matters?q=ACME` cross-workspace discovery returns exact `total` with `workspaceName` (BF-08). Evidence `j1-*`.
2. **Execute assigned work** — `GET /me/actions` returns own-scope queues incl. waiting entries (2) without exposing other members' items. Evidence `j2-myactions`.
3. **Review and prove** — designated verifier queue `GET /me/reviews`: Binh sees 13 pending claims with subject/criterion titles; Cuc (VIEWER, not designated) sees `total: 0`. Evidence `j3-reviews*`.
4. **Communicate progress** — `GET /brief?t1&t2` returns 29 changes with `targetLabel` populated for work-item events ("Shareholder approval recorded", "Board approval record") and empty for membership-only events (contracted as "may be empty"); reversed window refused 400. Export CSV keeps axes distinct. Evidence `j4-*`.
5. **Bring existing tracker** — multipart `POST /import/preview` parses a 1-row CSV, surfaces per-row validation ("description must not be blank") with the row key retained. Evidence `j5-import`. Commit/idempotent re-import verified at contract level (SuiteW6, memory+PG) and not re-run over HTTP here.

## Journey walkthrough limits

- Real ZITADEL SSO login, browser rendering, keyboard/a11y/visual review: NOT_RUN (prompt §1 credential rule; browser sessions unavailable for this run). The `/login` UI path, BF-06 landing redirect and BF-07/09 rendered screens were verified only via component/page tests in the tree (green in this tree's `pnpm check` receipts from the remediation task, author-verified).
- `OUTCOME_UNKNOWN` (503) reconciliation was not triggered live (no deterministic fault injection through the public API); its semantics are contract-fixed (§2.1) and covered by SuiteW6/AC-139 tests on memory+PG.
- Bulk preview over HTTP was exercised only via the commit path + SuiteW6 tests: the preview request shape I first sent per the contract text was rejected (see findings ZBA-F02).
