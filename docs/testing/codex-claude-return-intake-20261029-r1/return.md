# Claude return intake — 2026-10-29

Task MC-CLAUDE-RETURN-INTAKE-20261029. Actual Local Codex; primary checkout on `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`. The human-forwarded paste is truncated/corrupted in several places; this intake uses the actual repository packets to resolve those paths. No application source, runtime, private credentials, shared workboard or original evidence was modified. No external message or agent invocation.

**Disposition: CHANGES_REQUIRED for the new Evidence basis annotations.** Backend intake is corroborated at the byte level; its final nonauthor review remains open. Shared auth/Agenda review found no new confirmed defect within this scope, with the limits below.

## Integrity and evidence attribution

- All 16 artifact hashes across `claude-backend-handoff-integration-20261029-r1/artifacts.sha256` and `claude-eigenwelt-features-r1/artifacts.sha256` match. See `integrity.json`.
- Original Codex backend manifest: 192 entries, zero current hash drift; aggregate reproduces `e649a03a30f17824e2e334bf30753c9ff3813aeb7535a6c9fc5d3051513a00d8`. The prior 593 pass / 5 skip / 0 fail remains this Codex session's historical test evidence for unchanged bytes, not a new run by Claude or a new independent approval.
- Claude reports 27 targeted backend passes and replacement of its own 8081 binary. The runtime handoff is intact, but those execution/binary/live-session claims were not independently re-observed here. Codex did not read scratchpad credentials or restart anything.
- Eigenwelt source manifest: 11 files, 3 current hash drifts: `agenda-filters.tsx`, `matter-tabs.tsx`, and the work-item page. Earlier focused-workbench source manifest: 25 files, 5 drifts: `nav-menu.tsx`, `account-menu.tsx`, `my-actions-view.tsx`, `work-ui.test.tsx`, and My Actions page. These match areas reported to have concurrent work; exact authorship of each later byte is not inferred. They are later source drift, not failure of the original artifact hashes.
- `auth.ts`, `request-time.ts`, `env.ts`, `test/setup.ts` and `draft-scope-server.tsx` remain covered by the earlier focused-workbench manifest; AccountMenu has later drift and was reviewed as current source. `reviewed-source-manifest.json` pins the 14 frontend files actually reviewed now.
- Claude's receipts contain 72 files / 656 tests and a successful build/CSS guard at 08:48–08:49 UTC. These are retained owner results on its combined tree, not proof of all later drift. No fresh full-tree result is claimed here.

## Confirmed findings

### CBHI-F01 — P2: non-current does not prove superseded or invalid proof

`apps/frontend/src/features/proof/evidence-basis.ts:142` sets `versionSuperseded` for every version with `current=false`. `components/evidence-basis.tsx:189` also labels every such version “superseded”. A newly uploaded version is deliberately not promoted automatically; a FIXED criterion may legitimately accept a non-current version. The repro supplies a satisfied FIXED claim on a never-promoted v1 (document current pointer null): the new view still emits the stale warning. This misstates legal evidence provenance/validity while the server correctly reports the claim satisfied.

Minimum correction: distinguish the neutral fact “not current authoritative version” from actual rule-relative staleness. Use the backend claim reason/satisfying result for proof validity rather than re-deriving it from `current`. Do not claim a version was formerly current unless the contract/history proves that. Keep CURRENT_AUTHORITATIVE stale cases visible and FIXED cases consistent with the server. Add cases for never-promoted, valid FIXED non-current, and genuine CURRENT_AUTHORITATIVE mismatch.

### CBHI-F02 — P2: expiry annotation disagrees with the half-open validity window

`apps/frontend/src/features/proof/evidence-basis.ts:144-145` checks only assessment `effectiveUntil < asOf`. The backend at `apps/backend/internal/core/domain/matter/evidence.go:430` expires at equality and also checks evidence `validUntil`. The new annotation can therefore omit “Past its validity” when the server already reports EXPIRED. The assert repro confirms `effectiveUntil == asOf` yields `expired=false`.

Minimum correction: align annotation with the server-derived claim reason; if timestamps are additionally displayed/interpreted, honor both validity boundaries and equality. Never override the backend criterion/claim result. Add equality and evidence-validUntil coverage, including different evidence/assessment validity endpoints.

### CBHI-F03 — P2: unresolved document-version metadata is mislabeled as an outside reference

`apps/frontend/src/features/proof/components/evidence-basis.tsx:194-201` chooses the outside-reference branch whenever `c.version` is null, even when `c.evidence.kind` is DOCUMENT_VERSION. Missing version metadata can arise from separately timed read snapshots or a partial input; the view model preserves that kind, as the repro confirms. The component then states that this stored document evidence was an unvalidated human-entered outside reference.

Minimum correction: branch on `evidence.kind`. When document-version details are unavailable, show an honest unresolved-metadata state without claiming external provenance; reserve the existing outside-reference text for EXTERNAL_REFERENCE. Preserve exact identifiers privately in the model if needed for an existing authorized link, without inventing names/page/quote anchors. Add component assertions for both kinds with missing version details.

`basis-reproduction.log` and `reproduction-source.cjs.txt` exercise the actual pure TypeScript implementation via the installed TypeScript transpiler in a temporary Node VM. Harness exit 0 means the incorrect outputs were reproduced, not that the candidate is correct. The component fallback in F03 is additionally confirmed by source inspection; no browser rendering was run.

## Requested auth and Agenda review

- `getSession` keeps React render-local memoization, waits for request-time execution before REST session resolution, and preserves the existing provider-based fail-closed path. The tiny `awaitRequest` wrapper aliases Next's `connection`; it does not store sessions or create a global principal cache. AccountMenu and DraftScope call it before the time-reading session helpers; current layout places them in Suspense. The auth-session route separately awaits `connection`.
- Installed Next 16.4.2 `connection.md` confirms the request/prerender boundary semantics. Existing unit tests globally stub the wrapper, so their passes do not themselves prove a live request boundary or rendered isolation. No new confirmed defect in this change was found; this is not an exhaustive auth/security audit or production runtime proof. Existing demo/anonymous configuration escape paths remain subject to the project's product-runtime policy; no new policy was approved here.
- AgendaView has one `useTimeZone` call; its test has one per-test UTC reset and one controlled change to Asia/Ho_Chi_Minh. No duplicate `deviceZone('UTC')` call exists in current source. Grouping uses the device display zone while persisted instants stay unchanged. The pure merge/filter and current component tests pass. The later filter/tab/page drifts prevent blanket approval of the original combined feature manifest.
- Existing user browser login, screenshot comparison, responsive/focus state, flaky whole-suite upload behavior and live binary hash were not re-verified. Source/targeted-test conclusions are separate from Claude's browser observations.

## Tests actually run here

From `apps/frontend`:

```sh
rtk proxy pnpm test src/lib/auth.test.ts src/lib/env.test.ts src/app/api/auth/auth-routes.test.ts src/features/work/agenda.test.ts src/features/work/components/agenda-view.test.tsx src/features/proof/evidence-basis.test.tsx
```

Exit 0, 6 files / 54 tests pass, Vitest 5.0.5, start 15:56:43 Asia/Ho_Chi_Minh, duration 1.07s (`scoped-tests.log`). This is the existing regression suite and lacks the confirmed corner cases above. Separate actual-source reproduction: `rtk proxy node /private/tmp/mc-review-basis.cjs`, exit 0 (`basis-reproduction.log`). No product-source tests were added or altered during intake.

## Backend requests and ownership disposition

D1: retain the existing Codex backend ownership. **No new Claude write receipt for B/C/D is issued by this intake.** The old backend reliability task is delivered, so “Codex is actively writing backend right now” should not be used as the sole blocker. New features need a named, accepted source assignment after their actual product/contract dependencies are resolved. A split writer arrangement for shared routing/composition/policy files is only a proposal, not an instruction to start parallel edits.

D2–D9 remain PO/architecture/provider decisions; receiving an external recommendation does not approve them. In particular D5/D6 define roles for new playbook/review capabilities. The review-matrix proposal's “cross-Matter rejected, not hidden” wording must be reconciled with existing hidden-resource precedence before contract adoption. Migration 0008 is only the proposed next slot: re-inventory immediately before assigning any migration.

The optional `matterTitle` addition remains a bounded request, not approved expansion. No new schema, API route, role, read model, contract adoption, provider operation or automatic implementation follows from this return.

## Next exact action

Claude can receive the prepared `docs/implementation/handoffs/MC-P0-CLAUDE-EVIDENCE-BASIS-REVIEW-FIX-PROMPT.md` manually and correct only its Evidence basis model/component/tests, preserving the concurrent visual writer. The prompt is PREPARED_NOT_DISPATCHED. Return new source/evidence pins; another reviewer checks corrected bytes. Keep the overall tasks IN_REVIEW_WITH_VERIFICATION_BLOCKERS and leave backend nonauthor review and full combined/frontend journeys open.

Skipped: application edits, shared status writes, full check/build/Storybook/e2e, live browser/auth/runtime verification, flaky whole-suite reproduction, PG rerun, real R2, B/C/D implementation, commit/push/deploy and external messaging. Risk: the new proof explanation can mislead until corrected; current targeted passes do not clear the combined candidate or pending policy decisions.
