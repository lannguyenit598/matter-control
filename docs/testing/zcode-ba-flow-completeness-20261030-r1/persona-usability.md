# Persona usability — MC-ZCODE-BA-FLOW-COMPLETENESS-20261030-r1 (Bước E)

- Agent: actual ZCode acting as BA (author-adjacent). Method: API-tier walkthrough + UI source reads (routes/components in the dirty tree). **No rendered-UI or human session: the ≤10-second comprehension questions below are answered from what the API/model guarantees is available on each surface, NOT from observed users.** AC-137-style measurement stays NOT_RUN.

## Transaction Owner (matter OWNER)

- *Do I know the next work in ≤10 s?* Supported: matter landing is the Control Room brief variant (BF-07 fix) with blockers/next/waiting/milestones up front, "Your work here", one-row tabs; control-room `nextActions` are ready, open, ranked (RULE-021). Residual: rendered hierarchy and label comprehension unverified in browser.
- *Can I act without knowing data model/IDs?* Supported: create flows take plain titles; verifiers/members picked by name (member candidates; BF-04 search picker). Promotion requires reason + impact acknowledgement — two deliberate confirmation steps, wording verified only in source.
- *Do I know what changed after my action?* Supported: append-only history + delta brief with `targetLabel` (empty labels for membership events — ZBA-F04); control-room `changes`.

## Contributor (EDITOR)

- *Next work?* `/my-actions` own-scope queues; WAITING items show party + condition and stay out of blocked state (live-verified readback).
- *Can I complete without understanding the proof model?* Mostly: proof panel groups Package/Outcome (BF-01/02 fixes) and completion of an action never implies verification — but the contributor must understand why a completed action still shows UNVERIFIED. The API messages (`guard-failed` naming the unsatisfied criterion, `waiting-owner-required`, `signature-required`) are actionable; rendered guidance NOT_RUN.
- *What changed?* Per-item history + dependencies with `cause_seq` events (contract-tested).

## Reviewer / independent verifier (designated EDITOR/OWNER)

- *Next work?* **Live-verified**: `GET /me/reviews` surfaces pending claims with subject/criterion titles without knowing the item in advance (BF-05 closed). Non-designated roles see an empty queue (live: VIEWER total 0).
- *Can I assess without the data model?* The assessment requires `expectedSubjectEpoch`/`expectedAssessmentId`/`assessedVersionId` — the UI fills these from the readback (source-verified); API consumers need the contract. Rejections (`self-claim`, `version-not-current`, `stale-review`) explain themselves (live).
- *What changed?* Claim history keeps REJECTED→ACCEPTED lineage visible (live-verified).

## Manager / scoped VIEWER

- *Next work?* VIEWER has read-only surfaces (My Work read paths); viewer offered no execution step in the UI (BF-09 fix, source-verified). Live: 403 on write with `urn:mc:forbidden`.
- *Can I report without IDs?* Brief + export avoid raw ids as primary text (BF-10 fix; live `targetLabel` for work items; empty for some membership events — ZBA-F04). Rendered readability NOT_RUN.
- *What changed?* Delta brief with explicit no-change and access-loss protection (SuiteW6; access-loss live behavior covered by tests).

## Cross-cutting observations (Bước E general)

1. Terminology is consistent at the API tier (Requirement/Action/Evidence/Claim/Assessment/Stage) and maps to Vietnamese labels in the tree (vi strings present for all new copy per remediation receipts); rendered bilingual check NOT_RUN.
2. No raw UUIDs are required in any golden-workflow decision (all picks by name/search); ids appear only in technical-details toggles by design.
3. Dead-ends checked: none found in the three golden workflows — every refusal carried the unblocking information (criterion name, gate code, required fields).
4. Remaining guess-risks for first-run users (to test in Phase 1 of the persona plan): choosing between "record outcome evidence" vs "verify" at approval time; understanding that a completed action ≠ verified requirement (the product states it, but nothing proves comprehension without humans).
