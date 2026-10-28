# MatterControl R8 — implementation handoff for ZCode

MC-P0-DESIGN-R8-CONSOLIDATED-FINALIZATION · export revision **MC-P0-DESIGN-R8-local-20261027-01** · supersedes the R7 handoff.
Base/head `a62d838791ba188838c4ff00b7b6e265ac775056` on `codex/unified-project-flow`.

This is a consumer specification for the long BE+FE assignment already in flight across W1–W7. It adds no review gate between waves, asks for no restart, and changes nothing you own. The API contract, the database schema and the security model remain yours; this document says what the UI needs from them and how it presents what they return.

**Read this for the delta first.** If you consumed R7, the changed consumer expectations are in §1. Everything else is detail behind them.

---

## 1. Changed consumer expectations since R7

| # | What R7 told you | What R8 tells you | Why |
|---|---|---|---|
| 1 | R7 named two values that are not members of any axis — a verification value for proof age, and a dependency value for a graph cycle | Neither is a state. The verification axis keeps its five approved members and the dependency axis keeps its two approved members, unchanged | Approved `state-semantics.md` defines neither as a member. Do not add an API or schema state for either. Expiry is an input that makes the evaluator recompute the aggregate, surfaced as a reason; a graph cycle is a validation rejection on the proposed edge, not a stored state |
| 2 | Concurrent edits map to a single conflict status | 428 when the precondition is absent, 412 when it is stale, 422 on key reuse with a different fingerprint, 400 when a precondition is sent to a non-CAS operation | Your contract revision 4 §3 and §6. The UI's recovery differs per case, so a single code would make three of the four wrong |
| 3 | `OUTCOME_UNKNOWN` has one recovery path | Two paths. Receipted commands replay under the same key or expose a receipt read. Non-receipted membership commands have neither and resolve only through an authorised re-read | Your contract §2.1 |
| 4 | Screens listed mixed role and persona labels | Every screen declares personas, scoped read roles and per-operation authority separately. Workspace-scoped operations are decided by a workspace role | The approved matrix. Never derive a grant from a persona name |
| 5 | Six screens were prose | Six screens are built, with their field hierarchy, action placement, per-screen filter reset and high-risk states | DR7-05 |
| 6 | The no-match reset went to the Grid | Every filter resets its own screen and stays there | DR7-05 |

---

## 2. Component bindings

The inventory below is what actually exists under `apps/frontend/src/components/` at this base. Nothing here is invented, and no intermediate generic layer is proposed.

- **atoms** — `badge`, `button`, `card`, `input`, `label`, `select`, `skeleton`, `spinner`, `textarea`
- **molecules** — `alert`, `confirmation-dialog`, `dialog`, `empty-state`, `form-field`, `nav-menu`, `page-header`, `pagination`, `search-input`, `stat-card`, `theme-toggle`
- **organisms** — `app-header`, `app-sidebar`, `data-table`, `mobile-nav`
- **templates** — `dashboard-template`

Domain screens, their state orchestration and every business composition live under `src/features/*`. The existing `features/tasks` folder is the only feature present at this base; the features below are new.

| Screen | Feature folder | Primitives it composes |
|---|---|---|
| SCR-01 session, Matters, membership | `features/session` | `app-header`, `nav-menu`, `search-input`, `empty-state`, `data-table`, `form-field`, `confirmation-dialog`, `skeleton` |
| SCR-02 Control Room | `features/control-room` | `dashboard-template`, `card`, `badge`, `alert`, `skeleton` |
| SCR-03 Grid, My Actions, Waiting On | `features/grid` | `data-table`, `search-input`, `select`, `pagination`, `badge`, `empty-state` |
| SCR-04 / SCR-05 record drawer | `features/record` | `dialog`, `form-field`, `textarea`, `badge`, `alert` |
| SCR-06 dependency and impact | `features/dependencies` | `card`, `badge`, `alert` |
| SCR-07 proof context | `features/evidence` | `dialog`, `card`, `badge`, `alert` |
| SCR-08 documents and signatures | `features/documents` | `data-table`, `badge`, `confirmation-dialog`, `form-field`, `alert` |
| SCR-09 filing tracker | `features/filings` | `card`, `badge`, `data-table`, `form-field`, `alert` |
| SCR-10 bulk editor | `features/bulk` | `dialog`, `form-field`, `select`, `data-table`, `alert` |
| SCR-11 import wizard | `features/import` | `form-field`, `select`, `data-table`, `alert`, `empty-state` |
| SCR-12 draft brief | `features/brief` | `form-field`, `card`, `alert` |
| SCR-13 event history | `features/history` | `data-table`, `search-input`, `select`, `pagination`, `badge` |

`stat-card` is used only for counts the server returns. It is never used for a derived score, a readiness percentage or a progress ring; none of those exist in this design.

---

## 3. What the UI needs from the API

### 3.1 Per record
Identity, kind, title, workstream, internal owner (null until set, rendered as an explicit unassigned), due (null allowed), revision, and all five axis values. **The server computes dependency, timing and attention**, exactly as contract §5 already says for N1 aggregates. The UI renders what it is given and never recomputes a state client-side.

What the UI additionally needs so it can explain, rather than assert:

- **Per incoming gate**: edge id, prerequisite id, gate kind, satisfied or not, and the reason it is not. Without the reason the UI can only say "blocked", which is what DR7-02 was about.
- **Per outgoing gate**: edge id, gated record id, gate kind. This is what lets a proof panel say which downstream records a subject gates, instead of guessing that there are none.
- **Historical versus current**: where a recorded historical evaluation differs from the current-policy evaluation of the same evidence, both values, each labelled. Do not resolve the difference server-side by flipping the stored aggregate.

### 3.2 Per proof subject
Applicability (explicit requirement, explicit NOT_REQUIRED, or undeclared), criterion text, exact version reference, recorded-by, reviewed-by, aggregate, and whether the recorder and reviewer are the same identity. Absent fields must be **absent**, not defaulted: the UI prints "not supplied" for an absent field and must never be given a zero or an empty string that it would have to interpret.

### 3.3 Per document
Version list with status, the event that added each version where one exists, supersession links, and each reference's binding — fixed to an exact version or following the current one. Signature criteria are evaluated per version: required count, executed count, and per party the state, observation time and evidence reference.

### 3.4 Per filing
Stage, execution, verification, package checklist with an explicit undeclared state, submitted versions with their reference and time, receipt as its own observation, outcome as its own observation that may be absent, the external party and the internal accountable owner, and the supplement cycles as a list where each cycle keeps its own request reference, requested items, owner, due date and responding versions. A second request must never overwrite the first.

### 3.5 Per bulk and import operation
Row-atomic results in three groups — succeeded, failed with a reason, unknown with the attempt identity needed to reconcile. The three counts must sum to the submitted selection. For import, group membership and whether a group is connected, so the UI can explain why a whole group was rejected while an independent group survived.

### 3.6 Per history page
Event id, recorded time, effective time, actor, entity, operation, before, after, reason, correlation id and causal link. Cursor paging on `(recorded_at, seq)` with the limit declared in the response meta, as contract §2 already specifies. Restricted security entries are a **separate endpoint**, never merged into this one and never included in a domain export.

---

## 4. Error presentation contract

The UI consumes these and nothing else. It never invents a status.

| Server | UI behaviour |
|---|---|
| 428 precondition-required | "Needs the version you are editing against; nothing changed." Draft kept, submit still enabled |
| 412 precondition-failed | "Someone else changed this; your draft is kept." Refresh and rebase; overwrite is not offered anywhere |
| 422 idempotency-key-reuse | "A different change under an earlier attempt's identity." New attempt with a new key, or read the earlier receipt. Resend under the old key is disabled |
| 400 precondition-not-applicable | "This operation takes no version precondition." Resubmit without one |
| 503 outcome-unknown, receipted | Receipt read, or retry the identical attempt under the same key. Retry under a **new** key is disabled |
| 503 outcome-unknown, non-receipted | No success and no failure is displayed. Only an authorised re-read resolves it. Automatic resend is disabled. A later state or a subsequent 412 is never treated as proof of the earlier command |
| 503 outcome-unknown, readback lost | Protected values and draft purged. No export, download or "show what I typed". A permitted earlier read never unlocks a resend |
| 404 uniform | "No record is available at this address for your access." Nothing is disclosed about what exists |
| 403 | The record stays visible and read-only; only that control is withheld, with the reason named |
| 503 unavailable | No readiness answer is shown. Nothing defaults to READY, zero or OK |

Operations the contract has not yet defined — requirement edit, bulk, import, filing stages, promotion — are marked `DEPENDENCY_PENDING` in this design. The UI shows the business condition and keeps the draft. It does not borrow the membership rule for them and does not guess a code. Each one lands here when your contract revision adds it.

---

## 5. Authorisation the UI expects to be enforced server-side

The UI hides and disables according to the approved matrix, and that is presentation only. Every one of these must be enforced and negatively tested on the server; a hidden button proves nothing.

- Scope is active Workspace membership **and** explicit Matter membership **and** role permission.
- Workspace OWNER creates a Matter and administers workspace membership, and has no automatic read of a Matter they are not a member of.
- OWNER only: milestone required prerequisites, cancellation, reopen, proof applicability, promotion of an authoritative version, filing rejection, withdrawal and correction, Matter membership and verifier designation.
- EDITOR and OWNER: create, edit, assign, execution transitions, ordinary dependency edges, evidence submission, add version, filing stage observations, bulk and import.
- VIEWER: read and scoped export, rights rechecked at retrieval.
- Verification: an explicitly designated verifier who is an EDITOR or OWNER and is not the submitter. An OWNER is not automatically a verifier.
- Assignment never grants access. Revocation removes derived Matter access immediately and pending reads, exports, downloads and bulk commands must recheck current rights.
- A denied read is uniform and discloses nothing — no title, counterparty, file name, count or legal detail, and inaccessible is indistinguishable from non-existent.

---

## 6. Wave mapping

No wave gains a review gate from this document, and W0 is not reopened.

| Wave | What this design adds to what you are already building |
|---|---|
| W1 | SCR-01: accessible-Matter list with the caller's role and read as-of; session currentness; membership administration with the last-active-OWNER guard; the 428 / 412 / receipted / non-receipted presentations |
| W2 | SCR-03, SCR-04, SCR-05, SCR-06: the typed record payload of §3.1 including per-gate reasons, and the record drawer with its causal trail |
| W3 | SCR-08: version lineage, reference bindings, signature criteria per version, and OWNER promotion with expected version, reason and impact |
| W4 | SCR-07 and SCR-02: proof subject payload of §3.2, and the Control Room chain built from gates and their reasons |
| W5 | SCR-09: filing stage, checklist, three separate observations, and repeated supplement cycles with distinct bindings |
| W6 | SCR-10, SCR-11, SCR-12: row-atomic bulk results, grouped import validation, scoped draft brief and export with formula-leading values kept literal |
| W7 | SCR-13: scoped domain history with causal links and paging, and the separate restricted security surface |

---

## 7. Boundary

This handoff proposes no API change, no schema change, no library adoption and no framework version. It does not mark any acceptance criterion as passing, does not close MC-002, and does not grant design, architecture, security or release approval. Rendered, interactive, accessibility and usability quality are unverified in this package; see `validation-plan.md` for the case-by-case record.
