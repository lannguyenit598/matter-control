# Filing Package Pre-flight v1 — Codex intake

Date2026-11-03, Asia/Ho_Chi_Minh. Actual Local Codex. User dispatch MC-CODEX-PREFLIGHT-INTAKE-20261103-PROMPT accepted for **documentation intake only**. Branch `codex/unified-project-flow`, observed HEAD `7bf198c103476f490ebbdf58b1bd563d0bba8a61` plus active RLF dirty work. Design is read/pinned from the working tree, not described as committed.

## Routing outcome

- Task created: [MC-PREFLIGHT-01](../implementation/tasks/MC-PREFLIGHT-01.md), priority P1-adjacent, **BACKLOG** pending DoR.
- Product/design status remains **DESIGN_VALIDATED_BY_PO** as directly confirmed by the PO. The four approved design sections are not reopened or rejected by intake.
- Future implementation owner: **actual Local Codex**, BE/API/FE, under the latest primary-source PO amendment. This is a queued owner assignment, not permission to code now or a takeover of the active ZCode RLF work.
- Independent guard and final implementation reviewer: **actual OpenCode**, planned/nonauthor acknowledgement and exact input pins still required. No OpenCode/tool/provider invocation was performed and no reviewer PASS is awarded here.

## The two requested sequencing decisions

**1. RLF first, Pre-flight implementation afterward.** The actual RLF task is IN_PROGRESS. Its checkpoint now claims author completion through RLF-04 and a next RLF-05 playbook slice; that is newer than the discovery's RLF-02..05 shorthand, but not a final handoff. The shared tree contains route/service, Filing form, Agenda, Saved View and Playbook edits. No consolidated RLF return is present. Keep that writer uninterrupted; require its actual source handoff/frozen baseline and explicit no-overlap ownership before releasing Pre-flight. This does not require unrelated cloud/human release gates or automatic commitment of dirty files.

**2. Guard evidence exists, but a new-baseline pin is still needed.** The OpenCode Wave2 r2 report independently verified backend behavior and source-level G1 on978d8fc, with browser/AT checks explicitly NOT_RUN. Current backend `filing.go`, `evidence.go`, `workview.go` and `filing_service.go` are each byte-identical to that commit. That confirms continuity, not new independent execution or full Z-F-01/02 closure. After the RLF handoff, OpenCode must bind/re-verify the applicable guard fixture/predicate on the adopted bytes and retain limitations; only then can the Pre-flight guard-alignment pin be executable. A pending browser test does not erase the older source verdict, and source continuity does not fabricate browser acceptance.

## Contract compatibility to settle before READY

These are concrete implementation-contract questions, not permission to change approved business rules:

1. **Which guard is compared?** `filing.go:317–343,376–456` checks more than criteria: stage legality, terminal state, observed time, versions/reference and execution coupling. For no-proof filings the signature check reads submitted VersionIDs. A row-only Ready value cannot automatically equal every possible `DecideAdvance` request. Specify predicate/target stage and fixture inputs; represent/explain non-row prerequisites or qualify the claim. Keep OUTCOME from becoming a new submission blocker.
2. **Membership denial:** design §2/E-6 says uniform hiding but §4.2 says403 outside membership. Existing `work_service.go:968–1007` returns ErrNotFound on read denial and `filing_service.go:614–628` reuses it. Record a compatible status/precedence contract; do not silently select a disclosure policy.
3. **Cause/waiver wire data:** design §4.3 requires explanatory cause and WAIVED rationale, absent from the row sketch in §4.1. Specify the concrete reason/provenance/link representation, including missing-criterion rows without fabricated IDs. The M1–M5 usability steps also need an actual script before claiming that future acceptance.

These are tracked in the task's DoR/acceptance matrix. Material changes to meaning or security return to PO; ordinary wire/test elaboration can be resolved through Codex/design-author coordination without another approval of the same scope.

R10 Vietnamese terminology is still draft for this panel. The existing terminology artifact is an input, not evidence of current ratification. The p95 target and all BE/FE/browser/human checks are future work, not results of this intake.

## Evidence and preservation

`docs/testing/preflight-intake-20261103-r1/inputs.json` pins the design/discovery/protocol/review/context sources. Guard pins are provisional observations; no future reviewed baseline is invented. Re-read/re-pin mutable RLF inputs after handoff.

Only the task, this report and new intake evidence are written. Original design/discovery/author checkpoint/review artifacts and product source remain untouched by Codex. No Git staging/commit, service/container/DB/IdP lifecycle, test/build, provider action or reviewer dispatch occurred.

Historical Mimosa playbook was read for context; its old commit approval or escalation examples grant no new execution permission. A future refusal requires actual classification and supported audited resolution, preserving the explicit no-bypass rule.

Next action: RLF source return → Codex contract/baseline reconciliation → OpenCode guard re-verify/re-pin and acknowledgement → READY → separately released implementation. All substantive Pre-flight acceptance rows remain NOT_RUN.

Skipped: implementation, runtime, tests/builds, external dispatch and rendered/human validation. Remaining risk: shared RLF source is still moving; guard comparator/API denial/rationale contract must be made precise before coding.
