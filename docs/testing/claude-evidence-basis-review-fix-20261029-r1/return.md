# MC-P0-CLAUDE-EVIDENCE-BASIS-REVIEW-FIX-20261029 — return (author verification)

Agent: actual Claude Code (`claude-sonnet-5-5`), same session. Branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` (dirty tree; intake and final HEAD identical). Nothing committed, pushed or deployed; no backend, Go/SQL, shared routing/policy, dependency or UI-shell/Agenda/route/tab/page file touched. Proposed status: **IN_REVIEW_WITH_VERIFICATION_BLOCKERS**.

Owned paths (intake bytes = Codex's reviewed manifest; final bytes in `source-delta.json`): `features/proof/evidence-basis.ts`, `features/proof/components/evidence-basis.tsx`, `features/proof/evidence-basis.test.tsx`. Intake check: the three files were unchanged since my original write (mtimes 15:39–15:40) and the only caller is the work-item page, which passes the same props; no other writer was touching them.

## Findings

| ID | Disposition | Fix |
|---|---|---|
| CBHI-F01 | **Fixed** | `current=false` no longer implies "superseded" or a stale claim. The version keeps a neutral annotation ("not the current version") with no promotion history invented. Staleness flags now come from the server's per-claim result code (`claim.reason`: `VERSION_SUPERSEDED`, `OLD_EPOCH`, `EXPIRED`, `NOT_YET_VALID`, `WITHDRAWN`, `REVOKED`, `DISPUTED`); stored facts that are not rule judgements (withdrawn, revoked, challenged) are also read from the records. The flag `versionSuperseded` became `staleVersion` with neutral wording that fits CURRENT_AUTHORITATIVE and FIXED alike ("Accepted on a version that is not the required one"). |
| CBHI-F02 | **Fixed** | No timestamp re-derivation any more: `expired` is the server's `EXPIRED`, so the half-open boundary (`asOf >= effectiveUntil`, evidence `validUntil`, both endpoints) is the backend's, never a second rule engine, and a past timestamp cannot override a satisfying claim. Both endpoints are now displayed exactly as stored ("evidence valid until", "decision effective until"). |
| CBHI-F03 | **Fixed** | The component branches on `evidence.kind`. EXTERNAL_REFERENCE keeps the outside-reference disclaimer. DOCUMENT_VERSION with resolved metadata shows the exact version; with missing metadata it shows "Document version details are unavailable in this read." (EN/VI) and never claims an outside reference. No page or quote anchor is shown. |

English and Vietnamese parity kept for every new string; no new role, permission, API field or command key.

## Regression tests (red before green)

I wrote the new cases first and ran them against the unchanged implementation: **10 failed / 6 passed** (red). After the fix the proof suite is **3 files / 31 tests passed**. New cases (all assert model flags and rendered language where relevant):
- F01: never-promoted v1 accepted by a FIXED rule → no flags, annotated not current; satisfied FIXED on non-current v1 while v2 is current → no flags; real CURRENT_AUTHORITATIVE mismatch (server reason) → `staleVersion` flagged; rendered: no "superseded", no stale badge for the valid case, server-derived badge for the mismatch.
- F02: equality (`effectiveUntil == asOf`, reason EXPIRED) flagged; evidence `validUntil` expiry with a later assessment endpoint flagged, both endpoints preserved; a past timestamp with a satisfying claim is not flagged; rendered text shows both endpoints.
- F03: DOCUMENT_VERSION with missing version metadata → "unavailable", no "typed by a person"/"not validated"; EXTERNAL_REFERENCE keeps the disclaimer; normal exact-version display unchanged.
- The rest of the previous cases were kept; one count assertion (`spa-1.pdf` appears for the required, offered and assessed version) was corrected.

## Gates (receipts in `receipts/`)

- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm agents:check`: pass on the combined tree (`gates-split.txt`).
- Full Vitest: **72 files / 665 tests passed** in one full run; in four other full runs exactly one timing-sensitive test failed each time (`upload-attempt` or `proof-ui` upload cases, and once `action-entry` Planning draft). I verified that the failure also occurs with my test file excluded, that each of those tests passes alone (16 ms for the upload ones, 12/12 for `action-entry`), and that I did not touch them. This is the pre-existing whole-suite timing flake under machine load (Codex and dev servers running); a green rerun is not proof it is gone. Because of it, `pnpm check` as one command did **not** return a green exit twice (`pnpm-check-attempt1/2-flaky-upload-test.txt`); its other stages pass.
- **`pnpm build` / `build:webpack`: NOT_RUN.** The other writer was still editing fonts, `globals.css` and layout during this assignment, so a build would not describe a settled tree, and I have no owned output directory arrangement for a build beside the served `next dev`.
- Browser (ordinary authorized synthetic data, my signed-in Chromium): **BROWSER_OBSERVED** only for the existing real Requirement with one criterion and no evidence: list, deep link `?criterion=`, empty-evidence state, stale id and Back origin render correctly; console clean. **NOT_RUN:** a real exact-version claim, verifier decision, expiry boundary and missing-metadata case (needs a document upload and a second user B); those are fixture-tested only.

## Not done / risks

Backend 192-entry gate rerun (backend unchanged), D2–D9, B/C/D features, visual-fidelity work, S5, real providers and deployment are out of scope and stay open. This is author verification: a separate non-author must review the corrected bytes. Risk: validity wording now depends entirely on the server's claim `reason`; if the API ever omits `reason` for a non-satisfying claim, no flag is shown (the criterion list still shows the criterion-level reason).

## Runtime disposition

Unchanged: web `http://localhost:3000` (`next dev`, mine), API `127.0.0.1:8081` (rebuilt earlier, not touched), Chromium signed in as synthetic user A. Nothing restarted.

## Next exact review action

A non-author reviews `source-delta.json` paths against the three corrected files and re-runs `pnpm vitest run src/features/proof` (expect 3 files / 31 tests), then a rendered check with a real submitted-and-assessed claim once a second synthetic user exists.
