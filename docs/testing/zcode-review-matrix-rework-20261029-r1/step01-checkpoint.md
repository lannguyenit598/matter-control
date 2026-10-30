# Step01 checkpoint — RMV-F04 + RMV-F02 (frontend)

Date: 2026-10-29. Identity: actual ZCode session (model account:zai-start-plan/GLM-5.3-Flash). Repo `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, base HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` (unchanged; no commit). Tools: Node 24.22.1, pnpm 12.11.2, vitest 5.0.5, tsc, eslint, prettier (installed executables via `pnpm exec`; no dependency install attempted).

## RMV-F02 — one intent = the complete command

Root cause: `run` in `answer-form.tsx` closed over current props (`expectedAnswerId`, `questionRevision`) while `IntentForm` only froze the form field values; the retry therefore mixed the original key/text with refreshed CAS facts. Secondary: the draft key embedded the CAS facts (`…:revision:expectedAnswerId`), so a refreshed view orphaned the stored attempt on remount.

Fix (`answer-form.tsx`):
- The complete command now travels in the form: hidden inputs `expectedAnswerId` / `expectedQuestionRevision` carry what the person saw; `run` builds the action input from the submitted values (`v.expectedAnswerId`, `Number(v.expectedQuestionRevision)`), never from fresh props.
- `draftKey` is cell-scoped (`review:gridId:versionId:questionId`), so the stored attempt stays reachable across props refresh and remount; the restored attempt replays the original key + CAS verbatim.
- `IntentForm` freezes the field values on an unknown outcome (existing behavior, unchanged); the frozen values now include the CAS facts, so a same-key retry is byte-faithful.
- Boundary note: an attempt is recovered through the existing session-scoped mechanism under the same cell scope. If the grid/cell itself is no longer rendered, the attempt is not offered in the UI (server-side same-key reconciliation remains possible); this is the existing supported recovery boundary, tested explicitly.

## RMV-F04 — definitive denial clears the protected surface

Fix:
- `intent-form.tsx`: new optional `onAccessLoss({kind, error})` called exactly when a command returns `unauthenticated`/`forbidden`/`not-found` (shared interface delta; all other callers unaffected — prop is optional).
- New `review-access.tsx` (feature component): `ReviewAccessProvider` (page-level) hides the whole protected grid surface (name, structure controls, matrix, detail) after a reported loss and renders an accessible denial notice (`role="alert"`, EN/VI) with Back-to-list and Sign-in navigation; `AccessLossNotice` reused standalone.
- `cell-detail.tsx` (now a client component): on loss it purges the grid's session-scoped drafts and pending attempts (`clearScopeDrafts(ns, "review:gridId:")`, new helper in `lib/mc/drafts.ts`), clears its own loaded content (answer text, quote, document name, question, history) and reports up. 412/unknown outcomes keep content (safe recovery). `AnswerForm` is keyed per cell so a cell switch starts a clean form.
- Reviews `page.tsx` wraps the grid section in `ReviewAccessProvider`. No backend change; no global 404 handling added.

## Tests (red→green)

- New `answer-form.test.tsx` (4): UNKNOWN retry keeps exact command after props refresh (verifier case); after reload the stored attempt replays original key+CAS against refreshed props; editing text after UNKNOWN does not mutate the retried command; discard starts a genuinely new intent with a new key.
- New `cell-detail.test.tsx` (5): not-found/forbidden/unauthenticated each clear every protected word (answer text, quote, document name, question, grid name, typed text) while the refusal stays readable with a Back link; 412 keeps content+typed text; UNKNOWN keeps content and retry affordance.
- Red evidence: `step01-red.log` (6 failed / 3 passed — exact verifier failure modes: payload CAS diff; `PRIVATE EXISTING ANSWER` retained). Green: `step01-green.log` (9 passed). Regression run `review + organisms + lib/mc`: 16 files / 152 tests passed (pre-existing intentional stderr traces in recovery/errors tests only). `tsc --noEmit` exit 0; eslint clean; prettier applied.

## Pins (after)

See `step01-after-hashes.txt` (8 files incl. 2 new). Before hashes in `before-hashes.txt`. IntentForm callers (form-dialog, planning/work/proof/matters/workspaces/control/filings forms) untouched; their suites pass via the organisms run above.

Limitation: browser journey not run (not authorized in this step); in-memory only — session-storage draft purge is exercised through jsdom sessionStorage.
