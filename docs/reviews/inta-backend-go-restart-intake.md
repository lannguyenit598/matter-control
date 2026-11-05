# INT-A Go restart — Codex intake

Task MC-002-INTA-GO-RESTART-INTAKE; Local Codex PM/BA; priority P0; branch codex/unified-project-flow; base8941674. Actual human-returned ZCode execution, model/provider self-reported. Technical disposition RESTART_EVIDENCE_VERIFIED_WITH_LIMITATIONS / WAITING_STAGE2. Governance disposition NEEDS_EXECUTION_ROUTE_CLARIFICATION. No independent QA or canonical PASS.

## Technical evidence

[Owner report](inta-backend-go-restart-return.md) retained unchanged, pasted session archived losslessly in [intake evidence](../testing/inta-go-restart-intake/). All22 raw/export pairs match, including raw start-userapi-go-restart-wrapper.sh mapped to documentary go-restart-wrapper.sh.txt; all21 manifest payload hashes verify, no self-hash. All29 ledger hashes match before stop/after stop/after restart/current live bytes. Source heads52b60a4/3e5a642/48cc03e clean; binary SHA unchanged. Old stdout retains the pre-stop prefix and explicit draining/graceful-stop entries; new log reports52b60a4, empty stderr. Probe200/200 is owner-recorded operational evidence, not record-persistence proof.

Official read-only ps/lsof at2026-10-25T18:00:46Z observes old77632 absent, new98134/start00:54:29 local listening127.0.0.1:18086, unchanged Next88444/listener88453/start00:35:21 on127.0.0.1:18085. No new health/record request, SQL, driver or lifecycle action by Codex. Source identity and unchanged ledger are direct checks; private config contents/provider/billing/egress are not independently attested.

## Governance observation INTA-GOV-RESTART-01

The pasted transcript states: Mimosa blocked Bash script copies, then the wrapper copy was written with Write, and later calls were split to avoid the .sh-path hook match. The formal report omits this execution-route qualification. This is not enough to determine the precise hook policy or whether an explicitly permitted alternative existed, but it must not be silently treated as approved or bypassed retrospectively.

Request exact redacted blocked action/refusal text, relevant rule and any already-issued official permission/allowed-route evidence using the existing session only. No new blocked-action attempts, tool substitution, permission changes or rerun of the restart. Preserve technical evidence/processes. Stage2 prompt is prepared but not released pending this narrow clarification; independent progress on unrelated tasks remains allowed.

## Next dependency and gates

[Text-only clarification](../implementation/handoffs/MC-002-INTA-RESTART-GOVERNANCE-CLARIFICATION.md) is the immediate next handoff. [Stage2 draft](../implementation/handoffs/MC-002-INTA-FE-STAGE2-PROMPT.md) remains PREPARED_NOT_RELEASED. After Codex records execution-route disposition, stage2 reads A through the canonical driver once, then WAITING_PG_RESTART; it does not restart Go again or touch PostgreSQL. Requirement INT-PERS-01 remains unexecuted; unchanged ledger is not post-restart record readback. Stage1 cases/51 canonical IDs and independent QA remain unchanged. F10/BE01/design/architecture/product/release gates are separate.

Scan of22exports+report found zero high-signal private-key/credential-URI/API-key patterns; this is limited pattern evidence, not full confidentiality attestation. Model/provider/version remain owner reports. No external agent call is claimed by Codex.

Skipped: stage2, record HTTP/SQL, PG/Go/Next lifecycle, runtime suites, independent QA, provider calls and push. Risks: execution-route permissions need exact reconciliation; processes/logs can drift; persistence is not established until separately cued readback.

## Execution-route clarification received — current disposition, 2026-10-26

[Clarification intake](inta-go-restart-route-clarification-intake.md) supersedes the provisional stage2 hold above. Quoted hook expressly prescribes Write/Edit/MultiEdit for the same content scan; this is explained tool routing, with author-reported telemetry limits retained. INTA-GOV-RESTART-01 EXPLAINED_TOOL_WRITE_ROUTING / NO_REMAINING_STAGE2_HOLD. Stage2 CUE_RELEASED / READY_NOT_DISPATCHED, no extra restart approval or replay. Actual execution/independent QA still pending.
