# F10 binding reconciliation R2 — intake

Task MC-003A.8A; actual actor Local Codex PM/BA; priority P0; branch codex/unified-project-flow; base1e87693. Actual human-returned ZCode author proposal received, version UNKNOWN/model self-reported. Text-only return; no external invocation, new author source read, runtime or independent approval is claimed. Original bytes archived losslessly; JSON duplicate-key validation passed.

## Progress and disposition

C1 now proposes filing+initial-cycle1 atomic creation, existing target cycle versus expected-current-cycle CAS, server-derived supplement n+1, atomic cycle/observation/links/revision/events and rollback. RESPONSE is removed from observation types, consistent with the candidate model's FilingSubmission representation. C2 now proposes RETRACT/REPLACE, role from new payload, original-target corrections, latest-seq terminal correction and deactivation of superseded replacements with immutable history. These address prior representational gaps at proposal level; contract/PO acceptance remains pending.

C3 pins main/link scalar payload and unbound link-count grain, but two residuals remain. Current status RECONCILED_CANDIDATE_RECEIVED / PROVENANCE_CLARIFICATION_REQUIRED / NOT_ADOPTED.

1. F10-PROVENANCE-DISCOVERY (P1), Clause3 L1/GP1: main event gives observationId/count, not E3 or a discoverable commandKey. targetId=E3 assumes the unknown ID; correlationId is not defined as commandKey. The claimed no-guess <=2-filter path is not established. Source distinction: commandKey is present in api-contracts.md §2 and DR15 existing_coverage, but not the indexed DR15 reviewed_operations. An explicit filter/discoverability/auth delta is needed if relying on it; do not claim absence from all sources.
2. F10-PROVENANCE-LEGACY-BOUNDS (P1), Clause3 versus inherited DR15 fields: scalar-only payload does not constrain reason/before/after. Specify exact scalar projection and forbid full evidenceRefs/replacement expansions there. Cite scalar limits or disclose missing numeric bounds; no new business cardinality cap.

Minimal candidate remediation for item1: existing same-Matter events seq pagination without targetId can discover link targetRef by matching causeSeq/main seq and observationId. It may take many bounded pages, not <=2 calls; no ID guessing or hidden new filter. This is Codex advice, not adopted architecture. Stable-dataset completion only; per-page sourceRevision changes do not guarantee a coherent traversal. Terminal correction/effective-lineage rules must remain explicit rather than treating all historical links as current binding.

Two focused architect assertions also remain: stale filing/cycle CAS versus changed-stage guard precedence for concurrent supplement; and terminal correction/superseded replacement effective lineage at asOf. These are contract acceptance questions, not permission for Codex to choose new product policy.

## Evidence and next step

33/34 prior recorded input hashes match current bytes. The one changed path, inta-coordination.md, is mutable and changed legitimately in the stage1 intake; its old hash matches the exact previously recorded Git base. Historical hash drift is not misreported as all-current-input integrity failure or all34 current matches. Protected contract/index/F11/INT-A checkpoint bytes remain unchanged.

The author explicitly did not read source-gap-note.md/supplement manifest; no retroactive payload permission or fresh verification is inferred. Fifteen acceptance rows are DOCUMENT_EXPECTED, runtimeNOT_RUN. Source/schema/contract edits have not been applied.

[Provenance-only follow-up](F10-PROVENANCE-FOLLOWUP-PROMPT.md) is complete and prepared for human delivery, NOT_DISPATCHED. It preserves C1/C2 proposed clauses and asks only for the two provenance corrections; no full11-finding/32-operation review. Architect acceptance, PO catalogue/policy decisions and independent review remain separate from ZCode authorship.

Catalogue32 remains current; B35/L2 are unadopted. Zero extra routes is not zero query/field/schema/semantic change. F08 clarified candidate, original22CT/16+4+1+1, Q1..Q8 conditions, all gate statuses and independent BE01/INT-A flow remain unchanged. The Go restart cue is unaffected; no lifecycle operation or engineering reassignment.

Skipped: external agent/provider calls, runtime/build/DB/browser/security suites, implementation, migrations and independent acceptance. Risk: discovery and whole-event projection are unpinned; lifecycle/correction policy still requires the proper contract/PO authority.
