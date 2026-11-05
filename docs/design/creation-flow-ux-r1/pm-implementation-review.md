# Creation flow R1 — PM implementation review

## Identity and boundary

- Reviewer: Local Codex product-manager subagent, independent of the source edits reviewed here.
- Repository / branch / inspected HEAD: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` / `codex/unified-project-flow` / `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`.
- Review mode: `SOURCE_ONLY`. The reviewed changes are uncommitted working-tree changes on top of that HEAD.
- Inputs: `product-flow-proposal.md`, `business-flow-analysis.md`, the changed creation components/pages and their focused tests.
- Not performed: browser/rendered inspection, runtime, test execution, build, API call, IdP flow or human usability study.

## Verdict

`PASS_SOURCE_ONLY_WITH_LIMITATIONS`

No substantive product-rule, transaction-boundary or first-value-flow blocker was found. The implementation is coherent with Slice 1 and includes two bounded dead-end fixes from Slice 2. This is not a rendered, accessibility, runtime or release PASS.

## Source acceptance

| Area | Disposition | Source evidence |
| --- | --- | --- |
| Shared Requirement/Action decision | PASS source-only | `apps/frontend/src/features/work/components/work-creation-panel.tsx` explains the distinction and examples before either form. It does not imply a Requirement-first policy or merge commands. |
| Preserve unresolved intent | PASS source-only | Both forms are passed as mounted children of separate `<details name="new-work-kind">` elements. Closing a disclosure does not conditionally unmount either `IntentForm`; Action and Requirement retain separate idempotency keys and draft keys. |
| One visible form | PASS source-only, rendered verification pending | The same-name native details group expresses exclusive disclosure, and closed details hide descendants. The focused test proves both start hidden and the Action input node/value survives a choice switch. Actual browser/assistive-technology behavior remains `NOT_RUN`. |
| Consistent entry points | PASS source-only | Matter Overview and Work both compose the same `WorkCreationPanel`. Both expose an `Add work` link to `#create-work`; Work places the panel before filters/grid. |
| Requirement versus Action semantics | PASS source-only | Copy says Requirement is a condition that must be true and Action is work to perform; it explicitly says Action completion does not verify the Requirement. Required fields and separate server actions remain unchanged. |
| Canonical Requirement destination | PASS source-only | `CreateRequirementForm` now persists `matter:{matterId}:new-requirement` and routes confirmed success to `/matters/{matterId}/work/{id}`, matching the rich operational detail used by Action. Its focused test asserts the route. |
| Workspace → Matter first-value path | PASS source-only | Workspace empty state links to the existing form; Workspace detail gives authorized owners a Create Matter CTA and passes the affordance only when owner data/ETag are present. People and later setup are described as optional. |
| Permissions | PASS source-only | Matter create is offered only when owner-only member data and the workspace ETag are available. Work creation remains behind Matter OWNER/EDITOR `canEdit`; VIEWER retains read-only copy. API authorization remains unchanged. |
| Document continuation | PASS source-only | Confirmed Document creation now routes to `/matters/{matterId}/documents/{id}`, where upload is a separate operation. Upload/current-version semantics were not collapsed. |
| Filing prerequisites and continuation | PASS source-only | When Requirement or authority Party is absent, the form is replaced by actionable Work/Planning links. With prerequisites, existing readable options and required fields remain; confirmed success routes to Filing detail. Filing owner remains optional at create with its existing package-preparation hint. |
| Receipts/CAS/unknown outcome | PASS source-only | The changes continue to use `IntentForm`; no new combined command, fresh-key retry, automatic state transition or success-before-confirmation path was introduced. |
| Readable identity | PASS for touched flows | User choices display Workspace/Matter titles, Requirement titles, Party names and member display names. Opaque IDs remain route/request keys, not choice labels. |

## Non-blocking limitations to retain

1. **Exclusive-disclosure proof is incomplete.** `work-creation-panel.test.tsx` proves the Action node survives the switch, but it does not explicitly assert that Action becomes non-visible/non-focusable after Requirement opens. Add that assertion and a rendered keyboard/screen-reader check before accessibility PASS. This is a verification gap, not a source blocker.
2. **Hash-link focus is unverified.** The `Add work` links target the correct section, but deterministic focus/announcement after fragment navigation has not been observed in a browser. Keep CF-12 open.
3. **Access-loss purge is broader than the target scope.** Existing `PurgeDrafts` clears all drafts in the tab rather than only the lost user+Matter scope. It is privacy-safe but can discard unrelated drafts and remains a known UX limitation; this change neither introduced nor resolved it.
4. **Filing draft resume is source-supported but untested end to end.** The Filing form retains its Matter-scoped draft key and prerequisite navigation does not clear it, but leave navigation-return evidence open until a focused/browser test exists.
5. **Human comprehension remains unmeasured.** AC-137 (at least 4 of 5 representative managers correct within 10 seconds) is still `NOT_RUN`; clear source copy is not a substitute.

## Scope integrity

- No atomic Workspace→Matter→work wizard was added.
- No new endpoint, API contract, required field, auto-assignment, template/default record or inline prerequisite transaction was added.
- Requirement and Action remain independent; execution, verification, dependency, timing and attention are not collapsed.
- Document upload and OWNER promotion remain separate.
- Filing creation and Filing stage observations remain separate; MatterControl does not claim to submit a filing.

## Proposed next status

The reviewed creation-flow source is `READY_FOR_AUTHOR_TESTING`, followed by nonauthor rendered keyboard/accessibility verification. Product sign-off remains blocked on that evidence and the planned human comprehension check, not on another source redesign.

Skipped: test/build execution, browser/rendered review, runtime/API/IdP verification and human usability testing.

Remaining risk: native disclosure/focus behavior and comprehension are source-plausible but not proven in the supported browser and assistive-technology matrix.

## Input-refresh addendum — 2026-10-29

This addendum supersedes only the earlier HEAD, exclusive-disclosure implementation description and missing-assertion note. All other scope findings above remain source-valid.

- Refreshed repository / branch / HEAD: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` / `codex/unified-project-flow` / `20feedbf06c859a9806055d609f5b132fe8bb086`.
- Refreshed `work-creation-panel.tsx` SHA-256: `135f25fb8f89d6849a567e2d2f366d0a7d65ed12fc25ba924ee02c1b15389ab4`.
- Concurrent commits `f8c0928`, `fc09bec` and `20feedb` advanced HEAD while preserving the creation-flow source. This refresh does not review their wider product scope.

### Corrected source disposition

- `WorkCreationPanel` no longer relies only on native same-name `<details>` exclusivity. It is now a client component with one explicit `selected: 'action' | 'requirement' | null` state. Each disclosure's controlled `open` value is mutually exclusive, and the summary handler prevents the native toggle before selecting or clearing that type.
- Both supplied form React nodes remain mounted in the two `<details>` elements; changing `selected` only changes disclosure state. No conditional form unmount or merged create command was introduced.
- The focused test now explicitly asserts that Action becomes not visible after Requirement is selected, while also proving the same Action input node and its entered value survive. The earlier statement that this assertion was absent is therefore closed at source-test level.
- Shared `IntentForm` has gained persisted receipted-attempt recovery for CR-002 (`usePendingAttempt`, stored key+values, restored unknown state and same-key frozen retry). `WorkCreationPanel` continues to call the unchanged `CreateActionForm` and `CreateRequirementForm` instances supplied by its parents; it does not intercept submission, replace keys or bypass this recovery.

### Refreshed verdict

`PASS_SOURCE_ONLY_WITH_LIMITATIONS` remains unchanged. Mutual exclusion and retained input now have direct source and focused-test coverage. Browser focus order, accessibility-tree behavior for controlled closed `<details>`, fragment-target focus, error discoverability in a collapsed panel, AC-137 comprehension and end-to-end attempt restoration remain `NOT_RUN` in this review.

No test/build/browser/runtime command was executed by this reviewer during the refresh.
