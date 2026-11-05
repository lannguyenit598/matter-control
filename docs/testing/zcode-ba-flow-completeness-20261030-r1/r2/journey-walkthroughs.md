# Journey walkthroughs — attempt r2 (this file supersedes nothing; r1's walkthroughs at `../journey-walkthroughs.md` are untouched)

Agent: actual ZCode acting as BA (author-adjacent; NOT independent QA). Execution layer: **HTTP against an isolated local runtime** — `mcapi` built from this tree on `127.0.0.1:18081`, isolated PostgreSQL 18.6 container `mc-ba-flow-pg` (label `mc.owner=zcode-ba-flow-review`, fresh DB `mc_ba_flow_r1`, port 15499, migrated to v9 incl. `0009_criterion_purpose`), and a synthetic introspection stub IdP (loopback 18099, key pair generated inside this review runtime, protects nothing). No other agent's runtime, database or secret was read, stopped or migrated. Raw transcripts: `walkthrough-evidence/calls.jsonl` (570 logged calls with UTC/actor/method/path/status) + `gw01/gw02/gw03/traps2-narrative.md`.

Actors (synthetic, provisioned explicitly): `ba-alice` matter OWNER · `ba-binh` EDITOR + designated verifier (never submitter) · `ba-editor2` EDITOR submitter · `ba-cuc` VIEWER of matter 1 only · `ba-dung` workspace MEMBER without matter-2 membership. Data: Atlas-flavored synthetic only.

**Honesty scope:** every result below was executed over HTTP and read back from responses. The rendered browser UI was **NOT_RUN** (no browser tooling used; the stub IdP has no login UI; per prompt §1 the missing synthetic passwords are recorded as blocked, other paths used). UI-reach statements elsewhere are source + author page-test evidence.

## GW-01 — Transaction (matter "Project Atlas — BA Review")

Sequence: workspace → workspace/matter memberships → verifier designation → requirement + action (assign, due +07:00, COMPLETED) → agreement document v1/v2/v3 → OWNER promotion (impact token) → signature criterion CURRENT_AUTHORITATIVE → signatures 1/2 → evidence → verifier REJECTED → signatures 2/2 → new evidence → ACCEPTED → VERIFIED → v3 upload + promotion → supersession → payment requirement + evidence + ACCEPT → VERIFIED → critical milestone "Closing" with 3 prerequisites → dependency chains → Control Room / brief / export readback.

Executed results (narrative + call log):
- Action COMPLETED; Requirement stays `NOT_STARTED`+`UNVERIFIED` (RULE-001/AC-121).
- Partial signature → `UNVERIFIED`; REJECTED assessment recorded; full signatures + independent ACCEPT → `VERIFIED`; v3 promotion → `UNVERIFIED` (AC-107/126/128). Upload never auto-promotes: the first promotion required `expectedCurrentVersionId:""` because current was unset (RULE-011 by construction).
- Cycle `A3→A1` → `409 cycle` with full path (AC-125). Premature completion → `409 dependency-blocked` gate `COMPLETION/NOT_COMPLETED` (AC-122). Cancelled prerequisite → dependent `BLOCKED`, completion refused gate `PROOF/CANCELLED` (AC-146 — no waiver).
- VIEWER PATCH/execution → `403 forbidden`; non-member matter read → uniform `404` (AC-118/134).
- Stale second writer → `412 precondition-failed`; first write stands (AC-139). Same-key create → `Idempotent-Replayed:true`, count 1 (AC-153).
- VIEWER export 200 + Control Room 200 (approved matrix); export CSV row shows `…,NOT_STARTED,READY,UNVERIFIED,…` — axes distinct (AC-114/120).
- Milestone: `NOT_READY, 0/3` with per-prerequisite reasons `NOT_COMPLETED, PROOF_NOT_VERIFIED` (RULE-008/AC-102). Control Room: 3 blockers, 4 next actions; brief: 37 changes vs 10 outstanding, `targetLabel` present (BF-10).

## GW-02 — Due Diligence (matter "BA-DD Matter")

Second matter; verifier=binh; DD document v1/v2 + promotion; review requirement + criterion on current version → action COMPLETED → evidence → ACCEPT → `VERIFIED`; supplementary-certificate requirement → submitter self-verify `409 not-verifier` → verifier ACCEPT; dispute → `DISPUTED`; raiser cannot resolve (`409 not-verifier`); verifier resolves → recomputed `VERIFIED`; second REJECTED evidence (aggregate unchanged, an accepted claim remains); WAITING action on external party; sole-expired-evidence requirement; `/me/reviews`; discovery.

Executed results:
- `ba-cuc` (matter-1-only) on matter 2 → uniform `404 urn:mc:not-found` (AC-118). `ba-dung` (workspace member, no matter membership) → 0 matters in `GET /matters`, empty queue (BF-08/AC-118). dung's explicit VIEWER grant failed `403` because the fixture reused a stale matter ETag — CAS working as designed; the explicit-VIEWER read path is proven by cuc on matter 1 (export/control-room 200). The stale-If-Match grant returning 403 instead of the contract's 412 is recorded as observation Z-OBS-04.
- BF-08 discovery: alice 2, cuc 1, dung 0 — exact `total`, authorization precedes names.
- Self-verify `409 not-verifier`; dispute lifecycle per AC-157 (DISPUTED non-satisfying; raiser barred; verifier resolution recomputes, not restores).
- Waiting action: `WAITING` + dependency `READY` + ATTENTION reason `WAITING`; waiting-on view shows item/party/condition (AC-104). Note: the first WAITING attempt without an internal owner was refused `409 waiting-owner-required` — correct FR-004 guard (also r1 finding F-06).
- Sole evidence with `validUntil` past, ACCEPTED → subject `UNVERIFIED`, criterion reason `MISSING` (AC-126 — expiry at its instant).
- BF-05: verifier sees the pending claim `PENDING_REVIEW`; submitter and non-member empty; drains after acceptance.

## GW-03 — Regulatory Filing

Filing A (proofRequired=true; PACKAGE criterion on current package version + OUTCOME criterion): package evidence ACCEPT → `package ready:true, outcome 0/1` → PACKAGE_PREPARATION → SIGNATURE → submission-without-reference `409 reference-required` → SUBMISSION (execution `WAITING`, verification `PARTIALLY_VERIFIED`) → RECEIPT (`ov:PENDING`) → AUTHORITY_REVIEW → SUPPLEMENT (cycle 2, requestRef/owner/due) → RESPONSE (exact version) → AUTHORITY_REVIEW → APPROVAL with outcome evidence → execution `COMPLETED`, verification `PARTIALLY_VERIFIED`, `outcomeVerification:PENDING` → submitter self-accept `409 not-verifier` → verifier ACCEPT → `VERIFIED`+`ACCEPTED`. Linked Requirement stays `NOT_STARTED`/`UNVERIFIED` (AC-163; BF-01 proven live).

Filing B (proofRequired=true, single PACKAGE criterion): evidence pinned to a **non-current** version → claim not satisfying → SUBMISSION refused `409 guard-failed` (current-version gate, AC-128 family). `outcomeVerification:NOT_DECLARED` disclosure observed on a filing without an OUTCOME criterion. The "aggregate VERIFIED + NOT_DECLARED" combination was not reproduced in this run (B stayed at SIGNATURE after the fixture's unpromoted version); the disclosure is verified and the residual matches the remediation's documented limitation + open PO decision D-BF1.

Filing C (proofRequired=false): PACKAGE_PREPARATION refused until ≥1 criterion declared (`package-criteria-required`); submission with no signature observation and no OWNER no-signature decision refused `409 signature-required` (filing.go:379-394); after a signature observation: SUBMISSION → RECEIPT → AUTHORITY_REVIEW → negative-outcome REJECTED (stage unchanged, `negativeOpen:true`, evidence retained) → **APPROVAL refused `409` "a rejection or withdrawal is recorded; an owner must reopen the filing before approval"** → OWNER closure → execution `CANCELLED` → reopening → `IN_PROGRESS`, negative resolved, history preserved (AC-145).

Filing D (proofRequired=false): package checklist reachable (BF-02); signature-applicability OWNER-only (`403` for EDITOR; recorded by OWNER with reason).

Filing F (probe for Z-F-01): proofRequired=true with a **single OUTCOME criterion and zero PACKAGE criteria** — PACKAGE_PREPARATION passed, SIGNATURE passed on external refs, **SUBMISSION succeeded with `package.declared=false, total=0`** (see findings Z-F-01).

## Traps batch 2 (traps2-narrative.md)

- Bulk AC-112/133: preview exactly 3 rows valid; commit with one stale row → `SUCCESS / FAILURE(stale: item revision 3, expected 2) / SUCCESS`; failed row unchanged.
- Export AC-148: `=1+2 cmd` / `@SUM probe` exported as `'=1+2 cmd` / `'@SUM probe` — formula-neutral literals.
- D21/BF-03 (API tier): due `2026-06-18T17:00:00+07:00` read back `2026-06-18T10:00:00Z` — one instant; timing `OVERDUE` at read as-of.
- F15: unknown `GET /operations/{key}` and unknown-key reconciliation → uniform `404`.
- BF-04 (API side): >200 items → page 1 exactly 200 + `nextCursor`; page 2 returns the remainder; no silent cap. FE search picker = source + author page tests; browser NOT_RUN.

## NOT_RUN / limits

Rendered browser journeys, keyboard/a11y/visual review — NOT_RUN. Real ZITADEL SSO login — NOT_RUN (stub IdP used for the bearer path). True `OUTCOME_UNKNOWN` fault injection — NOT_RUN (unknown-key semantics executed; same-key replay executed). AC-137/150/151/154 — NOT_RUN (humans/browser/budgets). Import commit over HTTP — NOT_RUN (W6 import covered by the green `-race` contract suites; r1 reached the same boundary).
