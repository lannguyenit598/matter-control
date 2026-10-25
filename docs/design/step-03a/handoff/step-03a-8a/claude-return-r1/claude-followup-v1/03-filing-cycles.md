<!-- docs/architecture/filing-model.md, source lines 1-18 -->
# Filing Design

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`.
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**.

## 1. Model

MatterControl records accountable observations about a filing; it does not file anything (RULE-012).

| Record | Purpose |
|---|---|
| `Filing` | Matter, linked Requirement (the filing obligation), authority ExternalParty, owner, `stage`, `execution_state`, `proof_required` + verification (axis present only when proof required), `proof_epoch` + `proof_epoch_opened_at`, due, `negative_outcome` {REJECTED, WITHDRAWN} nullable with `negative_outcome_epoch` |
| Package criteria | Evidence Requirements with subject = Filing; components for each declared document and signature |
| `FilingCycle` | `cycle_no` 1 = initial; ≥2 = supplement cycles; `opened_in_epoch`; request reference, owner, due, opened/closed. Cycles count authority request rounds, epochs count reopenings; independent |
| `FilingStageObservation` | Append-only: from/to stage, observation type, reference, `observed_at` (effective), evidence IDs, actor, reason; correction links |
| `FilingSubmission` (+items) | Immutable exact version set submitted in a cycle, submission reference and time |


<!-- docs/architecture/filing-model.md, source lines 46-49 -->
## 3. Cycles

AUTHORITY_REVIEW → SUPPLEMENT opens cycle n+1 with request reference, owner, due, and new package criteria revisions for requested items. RESPONSE records a new `FilingSubmission` in that cycle with exact versions (e.g., v3); cycle 1 submission with v2 remains intact (AC-129). Multiple supplement cycles are unbounded; the latest open cycle's wait is the current "Waiting On".
