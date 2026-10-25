# INT-A stage3 — known-A readback after same-PG restart

Task MC-002-INTA-FE-STAGE3-INTAKE; Local Codex PM/BA; priority P0; base1381601, unified branch;2026-10-26 local. Actual human-returned ZCode runtime stage3 received. Model/provider/version remain owner-reported. Status STAGE_3_EXECUTED_SUBEVIDENCE_VERIFIED / STAGE4_CUE_RELEASED_READY_NOT_DISPATCHED. Independent OpenCode/formally designated runtime QA pending; no DONE/canonical PASS.

## Evidence

[Owner report](inta-frontend-runtime-stage3-return.md) unchanged; pasted session archived losslessly. [64 focused checks](../testing/inta-stage3-intake/checks.json) pass:9exact raw/export pairs/8manifest hashes, accepted stage2 snapshot hash chain,32->35state files with3modified+3new, full A equality to baseline/current/version1, one INT-PERS-02 app-client envelope, one exact GET200 post-Go-restart log line, zero same ID in original log. Counter16/13true assertion records/STAGE_3_COMPLETED; only stage1..3 markers. Pinned clean backend52b60a4/template3e5a642/harness48cc03e and unchanged binary verified. Six new/modified live state files captured immutably before future stage4 changes.

Raw log time2026-10-26T01:20:29.941367+07:00 converts to2026-10-25T18:20:29.941367Z; duration57853333ns=57.853333ms, distinct from app-client79ms. These match the report. One report heading says32before/32after; actual after-manifest has35files, exactly32prior+3new. Erratum recorded without rewriting report. Client-success wire status/headers remain null; upstream Go200 is separate correlation, not invented client observation.

This actual known-A readback after Codex's exact same-container PG stop/start supports only the scoped persistence assertion; it is not general durability, full recovery, product state/security or independent acceptance. Live process/PG readiness claims in the owner return were not freshly re-probed by Codex in this intake; ZCode must recheck before stage4. No duplicate record HTTP/SQL, driver/case replay, lifecycle or provider call by Codex.

Limited high-signal credential-value scan across9exports+report had0matches; no backend.env read. This is not a comprehensive confidentiality or zero-egress attestation. Appendable raw logs may change; preserved snapshots/manifests are authoritative for this intake.

## Released next step

[Stage4 cue](../implementation/handoffs/MC-002-INTA-FE-STAGE4-PROMPT.md) is released for manual delivery to actual ZCode under existing DEC-028/INTA-1, READY_NOT_DISPATCHED. Run only canonical stage4 once: T9 valid If-Match1 mutation to A version2/INTA_A_UPDATED; W9 wire GET ETag2; T10 stale If-Match1 rejection412 plus unchanged version2 readback. Stop WAITING_CODEX_PG_STOP. PostgreSQL stays running through stage4; no PG outage, stage5 or future confirmation flag yet. Codex intakes actual stage4 evidence before its separate exact-PG-stop barrier.

[New51case checkpoint](../testing/inta-stage3-intake/canonical-case-checkpoint.json) preserves original IDs/36required/14deferred/1blocked and formal NOT_RUN convention while explicitly recording actual executed sub-evidence. No gate promotion for MC002/MC003A/product/auth/isolation/cloud/cost/architecture/design/release/STEP03B. BE01/F10 latest results remain independent.

Skipped: stage4..7, record probes/lifecycle by Codex, runtime suites, fresh ps/docker/health checks, independent QA and push. Risk: current processes/state may change; owner preflight is required before the next one-shot mutation.
