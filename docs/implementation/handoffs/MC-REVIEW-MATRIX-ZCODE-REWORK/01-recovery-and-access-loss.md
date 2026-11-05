# Step01 — RMV-F04 access loss and RMV-F02 faithful UNKNOWN recovery

Read COMMON.md first. Execute in the same ZCode rework session; priority is the P1 protected-content finding, followed by the related recovery defect. Do not edit backend in this step.

## Owned paths

- `apps/frontend/src/features/review/components/{answer-form,cell-detail,review-matrix,grid-structure-forms,create-grid-dialog}.tsx` and relevant review tests.
- Review page composition at `src/app/(app)/matters/[matterId]/reviews/page.tsx` only if needed to clear/re-read the whole protected surface.
- `src/components/organisms/intent-form.tsx`, its tests and existing domain-free draft/attempt helpers under `src/lib/mc/` only when the root cause is shared. Inspect every caller; adapt all callers broken by an intentional interface change. Keep feature-specific data out of shared primitives.
- Narrow new review feature components/tests only when required; no shell/layout/My Work/Agenda/timezone/auth-policy/visual-token edits. Record any necessary shared interface delta before applying it.

## F04 — definitive denial must invalidate the protected review surface

Reproduce the verifier test: open a cell with an existing answer/quote, submit, receive `not-found`, and observe existing content remains despite the refusal message. Clearing just the form is insufficient.

Implement a minimal propagation/invalidation path compatible with existing access-loss patterns. After `unauthenticated`, `forbidden` or `not-found` from a review command/read, clear protected grid/document names, questions, answers/history and citations within the affected review surface. Purge its session-scoped drafts/attempts and reauthorize/re-read before showing them again. Keep safe Back/Sign-in navigation and announce the state accessibly. Do not flash or restore stale payload on ordinary rerender/remount. Do not claim retroactive removal of screenshots or bytes already copied outside the UI.

Acceptance cases:

1. All three definitive denial kinds remove existing grid/detail/history text as well as newly entered text. No write control keeps operating against the denied surface.
2. Draft/UNKNOWN state for that protected scope is cleared; reload/remount/new sign-in cannot revive it. Do not clear another session's valid work or unrelated drafts.
3. 412 retains the person's text and explains re-read; temporary unavailable/transport/UNKNOWN preserves safe recovery. Do not classify every404 anywhere in the app as a global sign-out.
4. A selection no longer present after authorized re-read gets an honest unavailable-selection state; a later successful, explicitly authorized read may display fresh data.
5. Shared IntentForm changes leave existing creation/membership/proof/Data refusal/recovery behavior intact; run relevant caller tests, not only a mocked local shell.

## F02 — freeze the complete command, not only visible fields

Reproduce the verifier test: UNKNOWN answer at expectedAnswerId="", revision1; refresh props to another current answer/revision2; retry. Current code sends the old key/text with the new CAS fields.

Ensure one intent identifies the complete submitted command: matter/grid/version/question scope, expected answer, wording revision, conclusion, text/page/quote and original key. While pending/UNKNOWN, props or URL selection changes cannot reinterpret it. Reconcile the original key/receipt or safely replay the exact command under existing semantics; no replacement key, automatic submit or adoption of new wording. A new intentional command is possible only through the existing explicit resolved/discard flow, with UNKNOWN information retained as policy requires.

Audit how draftKey changes with revision/answer ID: changing that lookup must not silently hide an unresolved request on remount. Reuse existing session-scoped attempt/reconciliation mechanisms; do not add a second persistence system, global callback cache or copied document/token storage. Keep safe recovery understandable if the old intent no longer matches the current view.

Acceptance cases:

1. Same mounted form after props refresh: byte-equivalent serialized request payload and identical key on retry; exactly one user-triggered retry.
2. Ordinary remount/navigation/reload under the supported existing same-session recovery mechanism keeps the original scope/CAS/key. Explicitly test or mark any currently unsupported reload boundary; never claim durability from a useRef-only fix.
3. Editing visible text after UNKNOWN does not mutate the retried command. A401/403/404 response ends protected recovery and purges scope; a412 preserves text without an automatic retry.
4. Client/repository integration asserts the actual request body/headers, not only callback state; same-key backend replay remains possible. With a changed current question/answer, original replay returns its original receipt rather than submitting a new interpretation.

Run red→green focused tests, relevant shared IntentForm/draft/proof/Data/creation regressions, then record the checkpoint. Do not run all build engines after every small edit; final gate belongs to04. Continue02 with exact after-step source pins.

Skipped: unrelated visual changes, new persistence policy and live retained-session disruption. Risk: an in-memory-only freeze or input-only purge can pass narrow tests while leaving the original defects open.
