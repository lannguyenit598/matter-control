# INT-A external-procedure closeout readiness

2026-10-26; Codex assembly candidate, not independent QA. References resolve from this file. Existing evidence is not automatically formal PASS; no rerun/teardown is assigned by this table. Original canonical matrix and selected contract remain unchanged.

| ID | Evidence available | Remaining assessment / action |
|---|---|---|
| INT-ENV-01 | [Codex original provisioning/checks](../inta-returns/environment/env-intamvnmoems3pd/) | Assemble freshness/emptyDB/ownership/caps/secret-safe handoff proof; reviewer assesses original records, no fresh-empty requirement now. |
| INT-ENV-02 | [Backend migrate/start evidence](../inta-returns/backend/runtime-intamvnmoems3pd/) | Pin successful migration after the retained failed attempt; distinguish attempts, no replay. |
| INT-ENV-03 | Backend start/restart evidence and [Go-stop intake](../../reviews/inta-backend-go-stop-intake.md) | Assemble whole lifecycle and source identity; direct final Go wait status remains NOT_OBSERVED. |
| INT-ENV-04 | [R4 source/guard evidence](../inta-returns/frontend/r4/), pinned harness48cc03e,23 actual endpoint cases | Pin strict route/input/method/baseURL/no-store boundaries; reference actual immutable source, no new endpoint or source patch. |
| INT-ENV-05 | R4 eight live guards with measured zero upstream calls | Available R4 summary explicitly lists disabled404,API_MODE andproduction refusal; establish exact evidence for every other required auth/bypass variable. Missing runtime coverage must be NOT_RUN, not inferred from source or mislabeled failed. |
| INT-ENV-06 | [27-attempt correlation](request-correlation.json),23 endpoint envelope files, seven markers | Complete fixed-table/substep/no-retry proof with exact source references and envelope caps; do not equate27attempts with27logical cases. |
| INT-ENV-07 | Next16.4.2 actual envelopes, [runtime launch report](../inta-returns/frontend/runtime-intamvnmoems3pd/03-launch-meta.txt), R4 typecheck/lint | Retain default Turbopack failure and accepted runtime --webpack observation. Assess cross-root/dynamic/cache/glob evidence; flag missing checks without changing bundler or source. |
| INT-COR-01 | [26 unique Go matches plus one unreachable T12 attempt](request-correlation.json) | Reviewer assesses attribution; T12 intentionally has no server-side request line. No request replay to obtain logs. |
| INT-PRIV-01 | Per-stage scans, bounded complete envelopes, current application-log snapshots | Assemble all retained artifacts/source archive scope and actual-secret-value scan provenance. Pattern-only checks do not complete the actual-secret requirement. Do not export or expose private env/credential values. |
| INT-ISO-01 | Clean pinned backend/template/harness and unchanged binary; historical R4 isolation checks | Pin shared-client/dependency/lockfile hashes and exact unchanged trees at final checkpoint; no broad test replay. |
| INT-ISO-02 | Sibling harness location, historical R4 product typecheck/lint | R4 explicitly skipped production build. Product build/test/CI module exclusion evidence needs exact disposition; source separation alone does not prove artifact absence. |
| INT-ISO-03 | Go already stopped with verified logs/PID/listener absence | Next and PG still running. Future separate exact-owner graceful Next stop and Codex same-PG stop; verify zero owned listeners and retain container/volume/evidence, no removal/prune. |
| INT-CONF-01 | Frozen INTA-1, seven stage intakes, this evidence/gap assembly | Complete above evidence/teardown and variance disposition, then actual independent OpenCode conformance review. No invocation or new payload authorization inferred here; Claude only if material architecture deviation arises. |

All13 procedure formal results remain NOT_RUN and independent verdictsPENDING under the existing convention. Several have actual owner/Codex subevidence; NOT_RUN must not be paraphrased as nothing having executed. Follow the newest actual return rather than historical prepared labels. No product recovery/auth/CAS/idempotency, production cost/release or Design Gate acceptance is implied.
