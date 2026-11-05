# Persona usability — attempt r2 (Bước E)

Boundary: this assessment is drawn from **live API behavior** (what the system returns, guards, reasons and read models) plus source/author-page-test reading of the screens. **No rendered-UI session was run** (see return §NOT_RUN), so answers about glanceability/keystrokes are model-level, not screen-level. Per persona, the three assignment questions: (1) do I know the next task within ≤10 s? (2) can I complete it without knowing the data model/IDs? (3) do I know what changed after I acted?

## Transaction Owner (ba-alice persona, exercised live)

1. **Next task in ≤10 s:** model-level YES — Control Room returned blockers with reasons+upstream, nextActions with `unblocks` and linked decisions, milestones with unsatisfied reasons, and the matter-root brief variant exists (BF-07/§13). Whether a manager actually reads it in 10 s is AC-137's human protocol — NOT_RUN.
2. **Without data-model knowledge:** mostly YES at API level — reads return names (`targetLabel`, party names, member display names, milestone names) and reasons, not raw IDs; the BF-10 fix put human labels in brief changes (verified live: `targetLabel` present). Owners still need concept vocabulary (Requirement vs Action, criterion vs evidence) that the glossary defines but no UI can remove; waiting/dependency/timing/attention arrive as separate labeled axes.
3. **What changed:** YES — deterministic brief with `(t1,t2]` changes vs outstanding (verified twice with different windows), event history with actor/time, `dependencyReasons` naming the failed gate.

Owner-only flows exercised live: promotion (with impact token acknowledgement — an extra deliberate step, good for legal intent), cancellation with reason, milestone prerequisites with reason, verifier designation, filing closure/reopening, signature applicability. Friction: Z-OBS-04 (stale-If-Match grant → 403 instead of the documented 412) is an owner-path rough edge.

## Contributor (ba-editor2 persona, exercised live as submitter)

1. Next task: YES model-level — `/me/actions` + Control Room next actions; empty states explain (suite).
2. Without model knowledge: YES with one live snag — WAITING needs the owner set via a separate PATCH first (`waiting-owner-required`; Z-OBS-05/r1 F-06). Everything else walked in one command sequence with plain reasons on every refusal (reference-required, package-criteria-required, signature-required, waiting-details-required — all observed live with human-readable detail).
3. What changed: YES — per-row bulk results, `Idempotent-Replayed` on retry, OUTCOME-criterion PENDING states.

Contributor-visible defect: Z-F-01/Z-F-02 mean a contributor **can** push a filing to SUBMISSION with an empty declared package or without any signature observation (proof-required case) — the system will not stop them; only the proof-read disclosure (`package.declared:false`, criteria list) hints at it. For a legal-operations product this is the kind of silent omission the product principles say to prevent.

## Reviewer / verifier (ba-binh persona, exercised live)

1. Next task: YES live — `/me/reviews` returned exactly the pending claim with subject/criterion/evidence context (BF-05); drained after decision; empty for submitter/viewer/non-member (verified).
2. Without model knowledge: YES — the checklist carries criterion title/purpose, claim submitter, evidence reference, and the assess command needs only verdict+rationale (plus the concurrency token).
3. What changed: YES — assessments are recorded with rationale and recompute downstream (verified: DISPUTED → resolve → recomputed VERIFIED; expiry flips to MISSING without any screen visit).

Reviewer protections verified live: submitter self-verify refused (regular + filing outcome), raiser-cannot-resolve, non-designated refusal, stale-epoch/current-version refusals (suite + live via filing B's non-current claim).

## Manager / scoped viewer (ba-cuc persona, exercised live)

1–3: reads only — Control Room 200, export 200 with distinct axes and formula-escaped cells, no write path succeeded (PATCH/execution/evidence/bulk all denied — with the Z-OBS-03 precedence quirk). VIEWER sees the same five-axis truth; no hidden counts leaked ( SuiteBF + live discovery totals).

## Dead ends / guess-screens observed (model level)

- None blocking at the API tier: every refusal returned a named code + human detail + the allowed next states (verified on all walked commands).
- The name-vs-ID principle holds on every walked read; the only raw-ID surface observed is `gates[].sourceId` / cycle `path` inside problem details (support detail, acceptable) and dependency edge payloads consumed by the UI panels (which render names — source-verified, browser NOT_RUN).

## Verdict

Model-level usability is consistent with the approved journeys: every persona could complete its golden-workflow job over the API with reasons, not guesses. The open usability risk is exactly the one both attempts record: **the rendered UI (BF-03/04/06/07/09/10 screens, keyboard, a11y, comprehension timing) remains unverified**, plus the two P2 filing-completeness defects that a rendered UI would make visible only if the disclosure is actually read.
