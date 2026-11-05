# INT-A stage6 recovery-read intake

Task MC-002-INTA-STAGE6-INTAKE; Local Codex PM/BA/orchestration; P0;2026-10-26; coordination branch codex/unified-project-flow, base/head a62d838791ba188838c4ff00b7b6e265ac775056 at intake. Requirements INT-PERS-03/04 and the separate backend stop prerequisite for T12. Scope is evidence verification and handoff preparation; no product source change. Actual ZCode owner/model identity is self-reported, not independently attested.

Disposition: **STAGE6_OWNER_RECOVERY_EVIDENCE_VERIFIED_WITH_LIMITATIONS / GO_STOP_CUE_RELEASED / READY_NOT_DISPATCHED**. Stage6 execution is recorded; independent runtime QA remains PENDING. No canonical result or approval gate is promoted.

## Verified evidence

[Original owner return](inta-frontend-runtime-stage6-return.md) remains unchanged. [Checks](../testing/inta-stage6-intake/checks.json):129 focused file/record/log checks PASS. All21 exports equal their raw counterparts byte-for-byte; all20 manifest payload hashes match. Before-state51 hashes equal the accepted stage5 after-state. After-state56 files match the current live ledger exactly:5 new,3 modified,none removed. Sources were independently rechecked clean at backend52b60a4, template3e5a642, harness48cc03e. Raw evidence remains /tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd/stage6/; no raw report rewrite.

Two complete app-client GET envelopes INT-PERS-03-25 and INT-PERS-04-26 carry success/value, truncated=false, and the full known-A record exactly equal to preoutage current checkpoint v2/INTA_A_UPDATED, including email/id/created_at/updated_at. Baseline v1 and current v2 checkpoint files remain byte-unchanged. The Go snapshot is append-only3855->4438 bytes, with exactly two new GET200 entries, one for each request ID. Next snapshot appends two successful harness dispatches. App-client success wire headers/status remain unobservable; Go200 is separate server evidence.

Counter24->26;22 true assertions; STAGE_6_COMPLETED; B identity and X OUTCOME_UNKNOWN preserved. No new X request or earlier envelope mutation appears in the state delta. The copied recovery-read evidence supports native read recovery after the recorded same-PG start. Go/process continuity through execution is owner-reported and corroborated by linked prior lifecycle/log evidence, not a fresh independently captured continuous process trace. No process/container health claim is made for the current instant.

## Corrections and limitations retained for QA

1. The owner report and pasted narrative say19 payloads; actual manifest has **20 payloads plus itself =21 exports**. No file is missing or silently added. Preserve the report and record this erratum here.
2. The cumulative assertion file refreshes the existing T2 timestamp to2026-10-26T00:30:02.699Z. Its pass/notes/case fields and the other19 previous assertion records are unchanged. Pinned driver.ts assertPers03/assertPers04 call assertT2; that helper writes the T2 assertion again. This is helper bookkeeping, not a newly executed T2 request. Earlier immutable stage5 snapshots remain intact.
3. Go latencies24986584ns and1112333ns are observed. Pool reconnection is a plausible interpretation, not a cause established by latency alone.
4. Both readbacks establish A equality in this observed recovery window. Do not generalize it to universal no-commit, product CAS/idempotency, crash recovery or availability guarantees. X remains unresolved; no POST replay/list/SQL/search is permitted. The prior outage evidence plus these readbacks are available for independent assessment of the narrow T11b causal claim.
5. Owner reports a Mimosa denial followed by a prescribed Write route. Original hook response/complete tool transcript are not in this packet. Route compliance is therefore owner-reported, not independently verified or retrospectively authorized. Any new denial must be followed as written; never split or reroute a denied action to evade it.
6. Limited literal scans find no credential-pattern hits outside the scan report's own pattern declarations; synthetic fixture markers are absent from retained application logs. This is not a full secret-value or egress audit. No private env/config was read.

The first verifier pass retained at initial-checks.json reported two verifier-assumption failures: expecting byte-identical prior assertions and counting declared scan patterns as credentials. Examination established the T2 helper timestamp refresh and report declarations. The corrected checks explicitly cover those cases; no owner artifact, source or runtime was repaired/replayed to make verification pass.

## Next owner step

[Separate ZCode Go-stop cue](../implementation/handoffs/MC-002-INTA-GO-STOP-PROMPT.md) is CUE_RELEASED / READY_NOT_DISPATCHED for human delivery. It permits only exact-process graceful stop after fresh identity checks; no restart or stage7. ZCode returns stopped-process evidence, then Codex verifies it before separately releasing T12. Preparing this packet does not invoke ZCode or stop Go.

The new [51-case checkpoint](../testing/inta-stage6-intake/canonical-case-checkpoint.json) records actual stage6 subevidence while retaining formal51NOT_RUN,36required/14deferred/1blocked and independent verdicts PENDING per existing governance. Reviewer: actual OpenCode for the complete frozen INT-A evidence; not invoked by this intake. BE01/F10/UX and all product/design/architecture/security/cost/release gates remain unchanged. MC-003A REWORK_REQUIRED; STEP03B NOT_AUTHORIZED.

Skipped: driver execution, record HTTP/SQL, fresh process/container probes, lifecycle, provider dispatch, full suites, browser and commit. Risk: owner route telemetry is incomplete, live resources may drift, and complete independent acceptance remains pending.
