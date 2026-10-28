# MC-P0-FINAL-DELTA-REVIEW-R1 — final delta independent review

Actual reviewer/tool: **OpenCode** (this session, OpenCode harness agent; model `opencode/glm-5.3-flash-free`; session `ses_e7e7d9550ffeOCh2ARIsevkQez`, titled `MC-P0-FINAL-DELTA-REVIEW-R1 OpenCode`). Reviewer identity is declared honestly: this is the OpenCode product running in the operator's OpenCode harness on this workstation; it is **not** a Codex subagent and did not author any reviewed item. Non-author confirmation: the reviewed source is the MC-P0-CODEX-PRIMARY-REMEDIATION-20261028 candidate authored by Local Codex sessions; this session performed only read/hash/static/test actions and wrote exactly the five files in `docs/testing/p0-final-parallel-20261028/review/`.

## Verdict

**PASS_WITH_LIMITATIONS** — for the bounded scope below only.

No P0 or P1 finding was found in the five final-delta core pins, their input→tested-source bindings, the new Matter scope/history UI, or the recovery/pending-attempt frontend. Two P2 advisories are recorded (`findings.json`). The verdict is a source-level independent review; it does **not** approve release, close MC-002, declare privacy/production/IdP/Cloudflare/cost acceptance, replace rendered/visual/a11y/human acceptance, or constitute final-byte restore evidence.

## Inputs and binding verification

All six pinned inputs verified byte-exact (SHA-256, `checks.json` C03):

| File | Declared | Re-computed |
|---|---|---|
| `docs/testing/p0-codex-remediation-20261028/final-source-manifest.json` | `0f169ae1…fd821` | match |
| `docs/testing/p0-codex-remediation-20261028/return.md` | `c3c81cbc…673583` | match |
| `docs/testing/p0-codex-remediation-20261028/review-intake.json` | `c611c7e3…e57b1` | match |
| `docs/implementation/p0-zcode-execution/local-contract.md` (rev12) | `814c4192…44e30` | match |
| `docs/design/p0-handoff-r9/return.md` | `d4dc769f…14b3d` | match |
| `docs/design/p0-handoff-r9/manifest.json` | `2b68bc92…87563` | match |

Binding checks (independent, reviewer-run):

1. **Full manifest rehash**: all **714** entries of `final-source-manifest.json` re-hashed against the working tree at review time — 0 missing, 0 hash mismatch, 0 byte-size mismatch (`checks.json` C05). The manifest (created `2026-10-28T07:40:52Z`) therefore binds the exact bytes reviewed. This is a bytes-binding result, not a Git commit or a full working-tree pin: files outside the 714 selected paths are not pinned.
2. **Delta isolation**: comparing the interim review pins (`p0-codex-remediation-20261028/review/inputs.json`, 31 pinned paths) against the final manifest — exactly the 5 paths declared in `review-intake.json` changed; the other 26 inspected paths are byte-identical to the interim review's pins (`checks.json` C06). The interim `PASS_SOURCE_REVIEW_WITH_LIMITATIONS` verdict remains valid only for its own pinned bytes; this report is the separate final-delta return and does not rewrite it.

| Path (short) | interim | final |
|---|---|---|
| `service/brief_replay.go` | `f7eebe22…` | `d535f784…` |
| `service/brief_replay_test.go` | `128e7009…` | `994f20f0…` |
| `service/filing_service.go` | `ee3651eb…` | `31e57afa…` |
| `data-transfer/components/recovery-gate.test.tsx` | `bf4a95ad…` | `d7cd3b31…` |
| `data-transfer/components/recovery-gate.tsx` | `61ed718b…` | `63c6d273…` |

3. **Gate-coverage ordering**: filesystem mtimes put the final BE delta files at `07:29:06Z`, before the backend-r4 gates (`07:29:51–07:30:47Z`, `backend-gates.json`); FE core gate files at `07:30:57/07:31:41Z`, before `pnpm check` (`07:38:38–07:39:30Z`) and the Webpack build (`07:39:30–07:39:44Z`) (`checks.json` C15). Ordering is mtime-based, not cryptographic; it supports (does not prove) that the final gates ran on the currently pinned bytes, and no file touched the final manifest after its own gate within mtime resolution.

## What was reviewed (read + verified)

### 1. Backend final-delta core (`brief_replay.go`, `filing_service.go`, `brief_replay_test.go`, plus context)

- **Filing owner provenance, null vs omitted** (`apps/backend/internal/core/service/`):
  - `CreateFiling` emits `filing.created` with the full `itemSnapshot(item)`, and for an explicitly unassigned owner writes `initial["owner"] = nil` (`filing_service.go:203-206`). `itemSnapshot` omits the `owner` key when `OwnerActorID == nil` (`work_service.go:171-178`), so the explicit null is what separates known-unassigned (new creation) from legacy omitted owner. Verified against both diffs.
  - Replay marks `filingOwnerUnknown` only for a `filing.created` without the `owner` key (`brief_replay.go:129-130`) and clears it on any full-snapshot event (`:141`) — `work.updated`/`work.execution_changed`/`bulk.updated`/`filing.work_changed` (`:36-38`). The fail-closed guard at `:190-194` refuses to reconstruct a filing whose history still lacks owner provenance unless it was `CANCELLED` at t2 (closed filings drop out of the outstanding set anyway, `:205-207`). Valid live filings are not lost: any later authoritative snapshot (e.g. `filing.work_changed` emitted by `commit()` at `filing_service.go:82`) carries the real owner. `matter.FilingStage` set of 9 stages bound to `filing.go:14-31`.
  - Stage/closure/reopen semantics at t2 (`brief_replay.go:156-188`): `filing.stage_changed` maps SUBMISSION/AUTHORITY_REVIEW→WAITING, APPROVAL→COMPLETED, other eight-stage progressions→IN_PROGRESS, unknown stage→`ErrBriefUnreconstructable`; `filing.closed`→CANCELLED; `filing.reopened`→IN_PROGRESS; `proofEpoch` patched and revision bumped best-effort; proof epochs and dependency edges feed `replayBriefProof`.
  - Proof replay (`brief_proof.go`): expiry boundary, alternatives/optional proof, revoked/withdrawn/superseded/dispute precedence, stale hypothesis of criterion revisions, epoch advancement, version binding of assessments and criteria, cycle-checked historical edges, and a fail-closed refusal for BLOCKED items without historical edges — all fail `ErrBriefUnreconstructable`, never fabricated READY/VERIFIED.
  - Regression coverage: `brief_replay_test.go:159-183` (filing commands replay execution incl. closed-drops-out), `:186-191` (legacy imported blocked without edges fails closed), `:193-203` (omitted legacy owner refuses; a real `filing.work_changed` snapshot restores owner). The shared-memory W6 regression `brief: filing owner survives creation before later transitions` (`contract_w6.go:735`) covers owner-at-creation loss end-to-end.
- **Imported verification never grants verification**: `itemSnapshot` stores the label under a separate `importedVerificationClaim` key (`work_service.go:164-166`); the domain/DTO layers carry it as a separate non-authoritative field, and proof replay reads only `verification`/`applicability`/`proofRequired` (`brief_proof.go:79-86`). Import emits `import.<kind>.created` with the item snapshot plus causal `dependency.added` events referencing the creation seq inside the same group transaction (`dataops_service.go:884-910`), per-row receipts and audit entries in the same transaction (`:938-969`), `UNKNOWN` per group on lost commit acknowledgement (`:975+`).
- Review covers the service/core path shown; `postgres/` adapter content was verified by manifest binding and representative read of the import apply region only.

### 2. Frontend final-delta core (`recovery-gate.tsx`, `recovery-gate.test.tsx`, context)

- **Reload/read ≠ mutation**: mount runs exactly one `recoverTransfersAction(matterId)` (read). `recoverTransfersAction` (`actions.ts:172-232`) does `requireSession()`, session resolution, `authorizeRecovery(matterId)` = a real authorized `GET /matters/{id}` (`repository.ts:24-25`), then reads server-side slots; no POST unless `retry=true`.
- **Cached terminal receipts**: `endAttempt` settles only when reconcile has no UNKNOWN row (`pending-attempts.ts:69-81`); recovery returns `slot.results` with the retained key without any re-dispatch (`actions.ts:184-197`). A new direct `beginAttempt` is refused for `blocked/running/settled/results` (`pending-attempts.ts:59-67`) — no new attempt, no payload/scope change while an attempt is un-ACKed. Identity guard: identical-only same-key resend, different content/matter → `null` (tests `pending-attempts.test.ts:41-51`).
- **ACK matching**: `acknowledgeAttempt` releases only a settled slot with matching kind, matter and key (`pending-attements.ts:93-107`); the gate ACKs only when all submitted rows reconciled non-UNKNOWN (`recovery-gate.tsx:56-66`). A late completion cannot release a newer slot (`endAttempt` slot-object guard `:72`; test `pending-attempts.test.ts:64-80`).
- **Access loss purge, no revival**: `revokeAttempts` replaces the slot with `{blocked: matterId}` — payload and results dropped; nothing clears the marker; `beginAttempt`/recovery keep refusing; FE disables retry when blocked, child `children` (`recovery-gate.tsx:116-121`). DSN/DB not used in this path.
- **No browser storage of legal payload/tokens**: no `localStorage`/`sessionStorage`/`indexedDB`/cookie writes in production source; the only localStorage write is the UI-language preference `ui-locale` in `hooks/use-locale.ts` (interface language only). Server-side slots are process-memory WeakMaps keyed by the BFF session object (`pending-attempts.ts:23-37`), documented as local process-only (`recovery-session.ts` imports `server-only`).
- **Fail-closed UI**: forms are withheld until the gate returns ok with zero retained attempts (`recovery-gate.tsx:116-121`); blocked/no-answer/withdrawn states cannot enable retry (test `recovery-gate.test.tsx:68-92`).

### 3. Matter scope/history/pagination/grid/header (new UI, deepened as requested)

- `matter-scope.tsx` (server): session-first (`:20`), one authorized matter read, labels only from that read (`:31-45`); read failure = refusal marker + no child content (test `matter-scope.test.tsx:37-53`). No scope data invented; role/time come from the API. Mounts for every matter child route via `app/(app)/matters/[matterId]/layout.tsx`.
- `matter-history.tsx`: displays only the API payload (schema `matters/schemas.ts:38-56` keeps actor/target/reason/causeSeq/correlation/commandKey/before/after); missing values render "Not recorded" (`:89-109`), pagination only via server `nextCursor`-built hrefs (`:135-149`); test asserts no invented actor/reason/cause and no next link without cursor (`matter-history.test.tsx:46-62`). `formatUiInstant` pins UTC and never changes a legal instant (`lib/locale.ts`).
- `history/page.tsx`: cursor from queryGuard (`length ≤ 2000`), `firstHref` only when a cursor was supplied, `nextHref` encoded; read failure → refusal marker; no fabricated actor/cause/asOf.
- `matter-tabs.tsx` links the eight sections that all exist as routes under `app/(app)/matters/[matterId]/` (verified literal directory listing: control-room, data, documents, filings, history, planning, work, page); active announced with `aria-current="page"`, not colour alone.
- `work-grid.tsx` / `work-badges.tsx`: five independent axes each carry their own badge with icon + text (`work-badges.tsx:18-98`, flags never colour-only); table has sr-only caption, `scope="col"`/`scope="row"`, keyboard-approachable scroll region (`tabIndex=0` + aria-label), and empty/filtered empty states; "Not an active member" fallback shown instead of fabricated owner names (`work-grid.tsx:65-72`).
- `globals.css` defines the semantic five-axis tokens (execution/verification/dependency-ready/dependency-blocked/timing/attention, light+dark), `:focus-visible` handling, `control-target`, and `prefers-reduced-motion` guard (grep bind, `globals.css:34-81,155,187,199-205`); primitives (`badge.tsx`, `button.tsx`, `card/input/select`, `page-header.tsx`, `app-header.tsx`) match the reviewed token set; locale infrastructure limited to UI copy (`LocalizedText` passes user-authored legal content through untouched, `localized-text.tsx`).

This is a source review. Rendered layout, visual fidelity, real keyboard traversal, touch/screen-reader output and human acceptance remain **NOT_RUN** by this reviewer and are never claimed.

## Reviewer-run pure tests (exact, all exit 0)

| Command (shortened, full argv in `checks.json`) | Result |
|---|---|
| apps/backend GOCACHE task-local, `env -u TEST_DATABASE_URL -u DATABASE_URL`: `go test ./internal/core/service -run '^TestReplayBrief' -count=1` | ok 0.501s (replay suite incl. all new filing-owner/stage/legacy tests) |
| same env: `go test ./internal/adapter/outbound/repotest/mattercontrol -run '^TestSuiteW6_MemoryStore$/^brief:_filing_owner_survives_creation_before_later_transitions$' -count=1 -v` | PASS (shared-memory owner-at-creation case) |
| apps/frontend `pnpm test` on `pending-attempts.test.ts`, `components/recovery-gate.test.tsx`, `components/data-transfer-attempt.test.tsx`, `matters/components/matter-scope.test.tsx`, `matters/components/matter-history.test.tsx` | 5 files, 28 tests passed |
| apps/frontend `pnpm test src/components/organisms/recovery.test.tsx` (pending-transition click helper fix) | 1 file, 8 tests passed |
| ops/p0-local/restore-rehearsal `python3 -m unittest -v test_verify.py` | 9 tests OK (both DSN no-query replacement cases present and passing) |
| `rtk bash -n ops/p0-local/restore-rehearsal/run.sh` | syntax OK |

Author-run receipts inspected read-only (cited, not reviewer-run): backend-r4 `test-summary.json` `764 pass / 4 skip, 0 malformed` with the four named skips (helper-without-env branch, memory-seam-only PG rollback case, env-gated perf tool, env-gated restore test); frontend-r5 raw stdout shows `Test Files 44 passed (44) / Tests 444 passed (444)` + Webpack production build exit 0; restore run `20261028T072524Z` summary (census/objects/readback IDENTICAL, post-boundary marker absent, corrupt/truncated refusals exit 1 with 0 tables left, altered-object readback exit 1, missing-object DETECTED); `restore/final-source-run-blocked.json` status `NOT_EXECUTED_APPROVAL_REVIEW_UNAVAILABLE` (quota exhaustion, no bypass, no unsafe determination).

## Findings

No P0/P1. Two P2 advisories (full fields in `findings.json`):

- **F1 (P2)** `brief_replay.go:185-187`: for `filing.stage_changed`/`closed`/`reopened`, the replay's own revision bump only happens when the carried state already has a numeric `revision`; a legacy `filing.created` without `revision` yields `Revision: 0` in the brief until a later full `filing.work_changed`. Cosmetic/informational; blocks nothing; suggest documenting or treating missing revision as unavailable in a later revision, plus one replay regression on a revision-less legacy filing.
- **F2 (P2)** `apps/frontend/src/app/(app)/matters/[matterId]/page.tsx:29,76` interpolates route params into URLs without `encodeURIComponent`, while `matter-scope.tsx:19,28` and `history/page.tsx:28,43` encode. Runnable exploit is limited (Next rejects `>`-multi-segment params into a single dynamic segment; ids are UUIDs). Hardening-only; align the pattern in a later revision.

Notes (not findings): replay fails closed on a hypothetical historical `filing.stage_changed` back to `REQUIREMENT` (not a reachable stage from `NextStages` forward flow); evidence ordering above is mtime-based; the retained `ui-locale` keyed storage holds only the interface language preference.

## Interim review relation

The prior `PASS_SOURCE_REVIEW_WITH_LIMITATIONS` (`review/return.md`) is preserved historical evidence for its 31 pinned inputs. This report is a separate, additive final-delta return; nothing was rewritten in the earlier review or any manifest/source. Its disclosed limitations carry forward as still-open: legacy-history availability inventory before release; process-only transfer recovery; no production/IdP/backup/cost claims.

## Explicitly not run / still open (skipped work)

- Full `go test ./...`/PG suite, full FE `pnpm check`, default Turbopack build — author receipts read only; not re-executed by this reviewer (out of delta-review budget: not cited as reviewer-run).
- Final-source restore rehearsal: still `NOT_EXECUTED_APPROVAL_REVIEW_UNAVAILABLE`; the retained successful runs predate the final legacy-Filing owner fix, so **final-byte restore evidence remains missing**.
- Browser/rendered/visual/accessibility/keyboard/touch/screen-reader verification; full product E2E; ZITADEL Cloud login/audience/token/isolation checks; AC-137 human trials; Cloudflare/cost/$0; production security — none attempted; tools/present evidence do not support these claims; kept `NOT_RUN`/`OUTCOME_UNKNOWN`.
- PG/DB lifecycle, Docker, provider admin, credential reads (allowlist had none for this task), Git mutation (branch/HEAD unchanged; no stage/commit).
- Not pinned and not fully read: the FE siblings beyond the recovery/scope set (e.g. `work-ui.test.tsx`, `data-transfer-ui.test.tsx`, the full `bulk-section.tsx`/`import-section.tsx` render paths) were not read line-by-line; their correctness is bound to the manifest pins and the author receipts only, not to this review's own reading.

## Residual risks

- Availability/data-compatibility: legacy histories lacking owner provenance or decision inputs fail closed (`brief-unreconstructable`) — intentional, but pre-release inventory must count affected histories and choose the reconciliation policy (already listed in the remediation return as next work item 5).
- The approval-review mechanism remains the only path for the final-byte restore; until then release gates stay open regardless of this verdict.
- This review ran on uncommitted working-tree bytes pinned by `final-source-manifest.json`; any later source write invalidates the pins and requires re-review of the affected paths.

Closing hashes of these outputs are in `outputs-manifest.json` (which excludes itself). Session boundary in UTC: first command 2026-10-28T07:56:31Z; outputs written ≤ 2026-10-28T08:07:06Z.
