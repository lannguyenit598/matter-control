# MC-002-BE-C01 — Native Slice Acceptance at 52b60a4

Codex PM/BA/DevOps, 2026-10-25 Asia/Ho_Chi_Minh. Governance intake base13efdef8e859cd9689b264596926fca9fb626e9c, branch task/MC-002-solution-architecture. Actual implementation owner ZCode desktop (model identity owner-reported); independent reviewer actual OpenCode2.1.4 / opencode/glm-5.3-flash-free. Scope is the native template slice only; no product/architecture/production approval.

**Current state: NATIVE_PASS / PRODUCT_OPEN.** R1's3 bounded corrections are independently accepted, no further manual C01-native dispatch or reassurance rerun. Parent MC-002 remains OPEN, Architecture Approval Gate NOT_PASSED, Step03 NOT_STARTED.

## Required findings closed

| Item | Checked artifact / actual disposition |
|---|---|
| F1 | New map_error subtest asserts both context.Canceled and port.ErrUnavailable survive the ConnectError multi-error wrap; immediate PASS on previously correct code is honestly recorded. Codex independently ran the new committed test at52b60a4: race exit0,2 named passes(parent+subtest), noDB. OpenCode CLOSED |
| F5 | docs/api499 row changed to cancellation winning over every other classification; exact prescribed wording, no other API behavior change. OpenCode CLOSED |
| F6 | Exactly one stale persistence-rule sentence replaced with authorized SQLSTATE-first classification; other rules left untouched. OpenCode CLOSED |
| E-03 | Owner makecheck/raceJSON corrected-working-tree runs exit0;1193valid lines,279unique named pass events(parent/subtests),0fail/0namedskip;11packagepass+5no-test skips. Commit created after those runs with no recorded test-tree hash; production code unchanged and sole changed test independently run at committed head. OpenCode accepts this qualification and CLOSED, no full rerun requested |
| F8 | Seven disclosed synthetic body values absent in retained application-log samples; exact credential scan owner-asserted, corrected scan supersedes invalid empty-pattern attempt. No exact scanUTC/general privacy guarantee inferred. OpenCode CLOSED scoped |

Source basefd747ae11aad05bd98737bc91f6bd19894fd72e7 → head52b60a4617081c41b949f2242e1784238c170f75, task/MC-002-be-c01, clean. Exactly3files,+16/−2, test/docs only. No production implementation/dependency/config/schema/migration/retry/auth/API changes in R1. [Intake](step-02-c01-r1-intake.md), [verbatim owner return](step-02-c01-zcode-rework-return.md), [actual independent review](step-02-c01-r1-opencode-review.md), [execution](../testing/step-02-c01-r1-intake/opencode-execution.json).

OpenCode session **ses_e90ff024dffeuJ1Kmcnp6qicY9**, exit0,60.596s, verdict **PASS_WITH_LIMITATIONS — accept C01-NATIVE at52b60a4**. Packet-only code/evidence review, no runtime/file/hash operations. Codex's focused test is independent local execution, not OpenCode replay; ZCode's full suite/runtime remains owner execution. No new Claude round was needed for the exact previously prescribed changes; accepted F2/M1 dispositions remain unchanged.

## Evidence preservation and limitations

All16 R1 exports match/tmp originals;14payloads+2lists. Both original lists contain stale self-hash entries; all non-self entries match. Codex preserves originals and provides a [canonical16-file inventory](../testing/step-02-c01-r1-intake/verified-export-manifest.json), excluding itself. OpenCode accepts this inventory correction; no claim original self-hashes validated. The prior19owner exports and59protected governance artifacts remain unchanged. Four exact fixtures stopped/exit0 and four ports show no listeners at read-only inspection; no DB/container/volume mutation by Codex. Unrelated .mimosa directories untouched.

Native acceptance inherits prior qualified characterization: HTTP outage/recovery/clientcancel samples and wire-shape/composition tests, not an independent DB replay. HTTP57014 remains NOT_RUN (separate repository real-fault57014 evidence exists); HTTP42P01 is repository-plus-mapping composition, no replayed HTTP sample. Dirty pre-commit binary remains behavior evidence, not reproducible commit-stamped artifact. Optional F3/F4/F7 hardening is nonblocking, not silently implemented or waived as product proof. Hash equality is integrity consistency, not authorship or runtime authenticity.

## Remaining gates and next action

C01-PRODUCT remains OPEN/NOT_RUN for authorization/inaccessible-resource/current-rights, idempotency/receipts/unknown-commit recovery, full UoW, Workers adapter, log policy and product retry convention; product policy/production commitments stay separately gated. Complete catalogue/product correctness is not accepted by native PASS. R01/R02 remain CLOSED.

No more ZCode rework prompt is needed for this slice. Integration remains PENDING until an explicitly approved compatible API/auth or transport-only scope is available; current Task/User/session mismatch is unchanged. Full product transaction/object/access/recovery, deployment adapter/provider/retention/cost/account feasibility remain open. Existing frontend native acceptance and tiny tooling restore keep their original limitations. [Remaining-gate matrix](../ai-sdlc/step-02-remaining-gates.md), [existing concrete decision request](../ai-sdlc/step-02-runtime-decision-request.md). No automatic integration, architecture approval, Step03 or production action.

Skipped: full-suite/DB/smoke replay and unrelated product/cloud work. Risk: native evidence acceptance does not establish product conformance, production recovery or a zero-cost service.
