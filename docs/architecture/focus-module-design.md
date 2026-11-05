# Focus module — codebase design

Design candidate v1, 2026-11-01. Task: MC-FOCUS-SEARCH-CODEBASE-DESIGN-20261101. Local Codex. **DESIGNED / NOT_IMPLEMENTED**; source-based design, not architecture, security or runtime acceptance. [Package and delivery](focus-search-codebase-design.md), [BRD](../requirements/focus-mode-brd.md). Feature-local FR-FOCUS/AC-FOCUS IDs remain proposals; existing legal rules are unchanged.

## 1. Module, interface and seam

The **Focus module** belongs under `apps/frontend/src/features/work/focus/`: it is a personal aid over Work Actions, not another business state axis. Its **interface** hides elapsed-time calculation, private storage, tab coordination, revalidation and safe display. The **seam** for callers is one provider, a snapshot and a dispatch function. Storage and transport are internal seams, not responsibilities of every button.

Illustrative types below are design contracts, not existing exports:

```ts
type FocusCommand =
  | {
      type: "start";
      target: { matterId: string; actionId: string };
      minutes: 15 | 25 | 50;
    }
  | { type: "pause" | "resume" | "extend" | "end" | "dismiss" };

type FocusHandle = {
  view: FocusView; // checking/idle/running/paused/suspended/summary/unsupported
  dispatch(command: FocusCommand): Promise<"accepted" | "stale" | "refused">;
};
// <FocusProvider identity={publicUiSession}>...</FocusProvider>
// const { view, dispatch } = useFocus()
```

`useFocus()` binds commands to the revision/generation of the view rendered to that caller. Callers do not mint IDs, manipulate deadlines, open IDB transactions, send business commands or supply an actor. `extend` means exactly +300 seconds, not resume. A stale control reconciles the current view and does not silently rebase a command. Two acknowledged sequential clicks are distinct operations.

**Depth:** My Work and the persistent controller use the same interface; timing/privacy fixes stay in one implementation. Deleting this module would spread those rules across both callers. A separate global state framework, generic timer framework or public six-method storage abstraction would reduce locality without helping this scope.

## 2. Current implementation and file plan

Verified source locations are pinned in the package manifest. Existing facts:

- `features/work/repository.ts`: `myActions()` uses `GET /me/actions`; `get()` reads a scoped work item. Backend `WorkService.MyActions` applies the effective graph and server ranking, returning all eligible candidates in `next`, not a client top-200 cache.
- `my-work-selection.ts` owns current queue/selection and `myWorkHref`; `MyActionsView` renders that selection. A Focus session must not follow later selection changes implicitly.
- `(app)/layout.tsx` composes header, bottom dock, `ActionAnnouncer` and `DraftScope`. The current draft scope covers page children only, not the header.
- `draftNamespace()` hashes the opaque login handle; it is a session epoch, not a stable principal key. `/api/auth/session` currently returns name/expiry only. Neither alone supplies the proposed Focus identity contract.
- `SignOutForm` and primary `ReadFailure` clear drafts; `IntentForm` owns command/UNKNOWN recovery. Focus must integrate without changing that recovery.

Proposed files (do not create empty barrels or per-command classes):

| Path under `apps/frontend/src/`                                            | Responsibility                                                                |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `features/work/focus/model.ts`                                             | Pure transitions, arithmetic, storage schema and observable outcomes          |
| `features/work/focus/coordinator.ts`                                       | IDB compare-and-commit, notifications, capability/error handling              |
| `features/work/focus/provider.tsx`                                         | Runtime orchestration, revalidation, ephemeral authorized labels, `useFocus`  |
| `features/work/focus/transport.ts`                                         | Browser adapter for the BFF read interface; no component fetch                |
| `features/work/focus/eligibility.ts`                                       | Server implementation of eligibility rules with injected repository reads     |
| `features/work/focus/components/focus-card.tsx` and `focus-controller.tsx` | My Work entry and persistent header controller                                |
| `app/api/focus/eligibility/route.ts`                                       | Thin authenticated/origin-checked composition of Work and Matter repositories |
| `lib/ui-session.ts`                                                        | Public token-free identity shape shared with Search; no server imports        |
| `lib/auth-provider.ts` (extend)                                            | Server-only projection of one live session to public UI identity              |
| `app/(app)/workbench.tsx` (extract composition if needed)                  | Resolve identity once; compose feature providers and existing template slots  |

The app route may compose `workRepository` and `matterRepository`; the Work feature must not import another feature repository. Pass `readActions`, `readTarget`, `readMatterName` into server eligibility at the app seam. They are owned remote reads; tests supply local adapters. `components/**` remains domain-free and never imports Focus.

Keep provider identity stable across route/theme/material changes. The model lives above page children and is never keyed by pathname or selected work ID. Use the existing header slot for the compact icon/time/context trigger; expanded controls use shared Dialog. Do not add a bottom-dock destination or a floating panel over forms. Verify 320px toolbar fit and existing native modal behavior. No countdown in the document title or live region; event announcements use `ActionAnnouncer` without per-second messages.

If the provider bridges the model through `useSyncExternalStore`, keep subscribe stable, cache immutable snapshots until a real view change, and supply the same non-sensitive checking snapshot for SSR/hydration. Do not read IDB in render or suspend the whole workbench on timer ticks. This follows the [React external-store interface](https://react.dev/reference/react/useSyncExternalStore); the feature hook itself is not implemented yet.

## 3. Identity and eligibility read interface

Proposed token-free server projection:

```ts
type UiSessionScope = {
  principalKey: string; // SHA-256 of purpose + canonical issuer + subject
  epoch: string; // existing opaque per-login draft namespace, never the handle
  validUntil: string; // current server idle/absolute limit, ISO instant
};
```

The principal key is an opaque coordination identifier, **not** a credential or protection against guessing. Origin already scopes IndexedDB. The epoch prevents a new login from reviving an older session for the same person. Derive everything server-side from one live session; never serialize `Session` (it contains `accessToken`). Preserve existing draft namespace derivation. No new signing secret is required for Focus identity. Fresh reads may extend idle expiry under the existing request-activity policy; measure that effect rather than inventing a new idle rule.

Proposed browser interface: same-origin `POST /api/focus/eligibility`, JSON, no-store. Body is strict and small:

```text
{ epoch, target?: { matterId, actionId }, query?: string }
```

`epoch` is a stale-client guard, never authentication. Validate cookie/session and exact configured Origin first; reject foreign epochs without returning old target metadata. Request/response bodies must not be logged. New code must reuse existing body-size/error conventions and add negative origin tests; there is no universal existing read-POST CSRF helper to assume.

The response has current `identity`, backend `asOf`, `checkedAt`, and one tagged outcome:

| Outcome       | Required implementation                                                                                                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `candidates`  | Filter the full authorized `next` list by title, preserving server order; cap picker display at20 and report truncation honestly. Enrich names only for displayed Matters, with bounded sequential/coalesced reads. Never fall back to the global Search results. |
| `eligible`    | Exact target exists in current `next`; obtain readable Matter name. Return title, name, reason, exact IDs and provenance, not a new edit grant.                                                                                                                   |
| `ineligible`  | Current classification/detail proves waiting/blocked/terminal/reassigned; expose only authorized cause. Preserve a suspended private reference.                                                                                                                   |
| `access-lost` | Explicit current auth/scope denial/not-found: remove target labels and resumable state. Absence from `next` alone is insufficient.                                                                                                                                |
| `unavailable` | Failed reads, unmapped/contract failure or unresolved absence; suspend generically, do not call it revoked or empty.                                                                                                                                              |

Authentication failure is HTTP401; transient unavailability503; request errors400/413. A live login with a mismatched epoch returns409 `ui-session-changed`, clears the old client view and requests fresh shell identity. No new product permission is inferred. Do not expose raw errors or request payloads.

`/me/actions` is the classifier; a target absent from its lists needs an authorized detail read before claiming reassignment/access loss. Matter-name failure prevents a protected ready presentation or Start. This MVP needs no new Go Focus command, event, PostgreSQL table or IdP mutation. Candidate/detail/name reads are bounded but can be more than one backend request; record actual fan-out.

## 4. Atomic local coordination and data lifetime

Choose **IndexedDB readwrite transactions**, with **BroadcastChannel as notification only**. A `localStorage` read-then-write lock is rejected: it is not atomic. Web Locks plus localStorage is a viable alternative but adds another capability and lock-lifetime protocol. IndexedDB already supplies the atomic seam we need. Require working IDB and a notification channel; unsupported/blocked coordination disables Start rather than creating independent tab timers.

One origin uses one cookie-authenticated principal at a time. Use database `mc-focus-v1`, one object store `current`, one singleton slot. Account changes invalidate the old slot before presenting anything. No growing per-person/session history is stored.

```text
Slot = { schema:1, generation:randomUUID, revision:safeInteger, active:null | Active }
Active = {
  principalKey, epoch, validUntil, sessionId,
  matterId, actionId,
  state:RUNNING | PAUSED | SUSPENDED,
  remainingMs, deadlineWallMs?, writtenAtWallMs
}
```

No title, Matter name, reason text, token, subject, credential, previous target or summary belongs in this schema. All stored JSON is untrusted; validate version, IDs, states, finite/safe arithmetic and time shapes before use. +5 has no product cumulative cap; numerical overflow is refused as a technical error, never allowed to produce an unbounded countdown.

Transaction protocol:

1. Capture the rendered `{generation,revision}` and local runtime epoch before any async read.
2. For Start/Resume, complete authoritative validation **outside** the IDB transaction. Check it is still current and the runtime epoch/cancellation generation still matches.
3. Open a short readwrite transaction; read slot; compare the captured generation/revision and identity constraints; compute transition and enqueue `put` from active IDB request callbacks. Do not await network/timers inside it.
4. Acknowledge only on transaction `complete`, not request success. A conflict returns `stale` without a write. Broadcast only after commit; receiving tabs read IDB rather than trusting message state.
5. End, expiry and confirmed access/session loss replace `active` with null and advance the generation/revision. This **content-free tombstone** prevents ABA resurrection by an old pending Start or Pause. It is one coordination counter, not retained Focus history. Remove all identity/target/timing fields. Bootstrap also compares the pre-read generation, so a pre-logout validation cannot recreate an old slot.

This is a narrow clarification of “remove the resumable record” in FR-FOCUS-14: no active/session result survives, but a singleton non-sensitive generation remains. Do not delete that fence while old tabs may still dispatch. IDB loss/corruption creates a new generation only through fresh authenticated bootstrap; old commands fail closed. On versionchange, close the old connection, show reconciling/unsupported, and never delete the entire database automatically.

Notifications contain only protocol version/generation/revision and generic purge/state-change reason. They are not authorization. Visible siblings clear labels before reloading after a purge; hidden siblings must read/revalidate before revealing on refocus. Channel/IDB failure suspends the local presentation and disables commands; do not claim synchronized global state during failure. End cannot be claimed committed if its transaction failed; show the unresolved local control state and provide reset/reconcile after recovery.

## 5. Timing, validation and interruptions

Pure transitions use an injected clock; the interval only updates display. RUNNING stores an absolute wall deadline; PAUSED/SUSPENDED store a frozen remaining duration. Display calculations are clamped and monotonic during a continuous visible runtime. Never decrement a stored counter per tick.

| Event                        | Rule                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Start                        | Fresh eligible read, no active slot, selected15/25/50; commit one session                                                    |
| Pause                        | Compute remaining at detection; freeze; no server write                                                                      |
| Resume                       | Fresh eligible read and explicit command; set new deadline from frozen duration                                              |
| +5                           | Add300000ms to RUNNING deadline/remaining or PAUSED duration; never unpause; unavailable in SUSPENDED/terminal               |
| Background/sleep             | Running time still elapses; drop protected labels from visible presentation before refocus checks; no per-second API traffic |
| Deadline passed              | Clear active reference even offline; generic ephemeral expiry/reset notice; no history and no work completion                |
| Stale/ineligible/unavailable | Freeze at detection; SUSPENDED survives reload with references only; successful read alone does not resume                   |
| Explicit auth/access loss    | Clear labels immediately, advance the shared fence and purge active state; later regrant cannot revive it                    |
| End                          | Explicit terminal local operation, generic in-memory summary only                                                            |

Use `performance.now()` to detect discontinuities while continuously visible, with Date.now as the cross-navigation wall clock. At restoration/refocus use fresh server time/provenance where available. A detected clock fault yields safe suspension/reset; never call it measured work or silently extend time. If offline and the recorded local deadline has passed, clear references immediately; a generic end notice is not proof that the system clock was trustworthy. Unobservable clock edits across a closed browser cannot be perfectly distinguished from sleep without an external clock; this design claims no clock attestation.

Refresh on Start/Resume/restore/refocus/relevant route or confirmed work-read change, plus proposed20-second visible refresh. Each visible tab enforces its own freshness deadline:30 seconds since completion of its last successful read, also bounded by session expiry. Start early; if no successful read by that deadline, suspend. A sibling notification alone cannot renew a tab's authorization freshness. Coalesce overlapping reads and reject responses from an older target/epoch/generation. No second-by-second API reads; measure calls for one and five visible tabs.

## 6. Shared privacy events and display lifetime

Add a small client-only `lib/mc/private-ui-events.ts` notification seam because both Focus and Search need it. Two events suffice: `session-ended` and `access-recheck`; payload contains no legal text. It owns no domain state. Integrate with `SignOutForm`, primary `ReadFailure` and the existing authenticated error handling; keep partial-denial and draft/UNKNOWN behavior unchanged.

- Explicit sign-out/401/account epoch change: notify, clear ephemeral Search results, purge Focus active slot, retain existing draft cleanup.
- A generic primary403/404 whose target is unknown: clear Search and Focus labels and force target revalidation. Do not infer that an unrelated running Focus target lost access. Purge only on confirmed target denial; unavailable checks suspend instead.
- A partial section denial must not clear unrelated private state. A new event must not call an IntentForm discard/reset function or create a new command key.

App composition resolves `UiSessionScope` under request-time Suspense and supplies it to Focus and Quick Search; keep any failure fallback free of protected labels. Do not add another token-bearing client context. Search is independent: Focus must work without importing Search and vice versa.

## 7. Tests through the interface and delivery

| Test surface                                      | BRD coverage / evidence                                                                                                           |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Model with fake clock                             | AC-FOCUS-02..08/16: pause arithmetic, extensions, terminal guards, clock faults, offline expiry                                   |
| Shared coordinator reference adapter, two handles | AC-FOCUS-07/09/16: simultaneous Starts, stale Pause/+5/End, post-End and post-logout ABA, transaction abort, failed notifications |
| Eligibility interface with owned-read adapters    | AC-FOCUS-01/08..12: server order, absent vs denied, name failure, unknown response, identity change                               |
| My Work + controller rendering                    | AC-FOCUS-01..04/11..14: same target across navigation, no raw-ID fallback, named controls and event-only announcements            |
| Official browser, two tabs, actual IndexedDB      | AC-FOCUS-04..17: real commit/notification/focus/sleep/reload/expiry/storage-failure paths; memory adapter is not IDB proof        |
| Synthetic Go/PG before-after census               | AC-FOCUS-02/06/15/17: zero domain command HTTP requests and unchanged work revisions/domain events; security read logs allowed    |
| Human trial                                       | AC-FOCUS-18, separate from AC-137                                                                                                 |

Minimum implementation checks: `pnpm check`, component stories/build, production CSS/build, existing draft/UNKNOWN/redirect suites. No new dependency by default; raw IDB/browser APIs suffice. Existing physical/browser/IdP gates remain independent. Implement one coherent candidate through verification, not a timer-only planning checkpoint. No Focus effect may repair the existing unrelated Filing stage-state bug by silently changing domain semantics.

Documentation basis: IndexedDB serializes overlapping readwrite transaction scopes and auto-commits inactive transactions; notification delivery is separate. See [MDN transaction semantics](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction). These are platform-design inputs fetched through Context7; real browser execution of this proposed module is NOT_RUN.
