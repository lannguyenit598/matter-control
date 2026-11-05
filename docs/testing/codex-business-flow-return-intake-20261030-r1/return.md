# BF remediation + Liquid Form — Codex return intake

Actual Local Codex,2026-10-30. Branch codex/unified-project-flow; HEAD0de3e5dbb8ef578c7288ba9c49ecaeddbbcbdcee unchanged. Read/hash/source inspection, targeted tests and one proposed acceptance probe. No primary application source edits, migration, runtime restart, container operation, IdP/private credential access, commit/push/deploy by this intake.

**Disposition: candidate received, targeted checks pass; BF-01 remains PARTIAL; follow-up required before consolidated acceptance.** GL-FORM is SOURCE_CORRECTED / AUTHOR_AND_TARGETED_TESTED, rendered verification pending. Local Codex authored the original appearance proposal, so this is not independent visual approval of that proposal. Business fixes are Claude-authored; selected checks here are separate executions, not exhaustive QA.

## 1. Packet integrity and source movement

Initial business packet:21/21 output hashes MATCH;120/121 source entries MATCH. globals.css was the sole mismatch and byte-equal to the separately prepared Liquid Form proposal. This was a later integration delta, not evidence of lost business source.

After the user's GL-FORM return:29/29 output hashes MATCH;123/125 source entries MATCH. Two mismatches: globals.css and the plan document. The live CSS differs from the prepared form proposal only in the light field-face/hover tokens and a short comment (cooler inset tint); the plan has the GL-FORM line appended after its earlier pinned bytes. Preserve both packet revisions rather than rewriting prior author receipts. The current source manifest must be regenerated after the writer finishes, and all current checked bytes must be bound to the same final candidate before QA/runtime acceptance. Source manifests are change inventories, not complete whole-tree snapshots.

See integrity.json (first intake) and integrity-gl-addendum.json (second intake). At the final closing read the author had refreshed the CSS/build evidence:34/34output hashes MATCH and124/125source entries MATCH. Only the plan document remained stale; all current application-file entries in that manifest matched. This supersedes the two-entry mismatch as a current-status claim, not as historical evidence. closing-checks.json records that final recheck; this report does not inherit later unseen changes.

## 2. Finding intake

| Finding | Intake disposition | Evidence / limit |
|---|---|---|
| BF-01 package/outcome | PARTIAL, remaining final-proof gap reproduced | Purpose split, mandatory package submission gates, separate checklist parts and independent outcome assessment exist. With a declared outcome criterion the regression passes. With only accepted PACKAGE criteria, aggregate remains VERIFIED even though outcomeDeclared=false/outcomeReady=false. |
| BF-02 no-outcome-proof filing | SOURCE_IMPLEMENTED / QA_PENDING | IsFiling reaches work detail, checklist/form capabilities no longer disappear solely on proofRequired=false. Selected HTTP/service/UI tests pass. No connected browser journey. |
| BF-03 client-zone date entry | SOURCE_IMPLEMENTED / TARGETED_PASS | LocalDateTimeField/local-time helper and due/completion/filing/brief callers exist. Selected +07/DST/non-hour/invalid/ambiguous/unchanged-value tests pass. Browser zone/autofill behavior not observed. |
| BF-04 searchable related records | SOURCE_IMPLEMENTED_BOUNDED / QA_PENDING | Backend title search feeds SearchPicker rather than only the old first200 array; truncation is explicit. Narrowing is the current continuation method, not arbitrary full-result browsing. Duplicate/indistinguishable titles and full browser traversal were not certified. |
| BF-05 verifier queue | SOURCE_IMPLEMENTED / TARGETED_PASS | Authorized /me/reviews + page/nav exist; memory/HTTP and component tests pass. No large-tenant/PG query-plan or rendered revoked-access proof here. |
| BF-06 default landing | SOURCE_IMPLEMENTED / AUTHOR_TESTED | Root/OIDC default target My Work; deep-link/RV-001 constraints remain in source. Full login not run here. |
| BF-07 operational Matter landing | SOURCE_IMPLEMENTED / QA_PENDING | Shared ControlRoomView reused, member controls disclosed, secondary tabs grouped. No comprehension or rendered navigation acceptance. |
| BF-08 Matter discovery | SOURCE_IMPLEMENTED_WITH_UX_FOLLOWUP | Authorized cross-workspace read model and page exist; memory/HTTP/component tests pass. Search remains a native GET form that performs a document navigation; see CI-02. |
| BF-09 focused work step | SOURCE_IMPLEMENTED / TARGETED_PASS | WorkNow and role/state-derived primary transition exist; viewer form correction in source/tests. Responsive keyboard/disclosure acceptance not run. |
| BF-10 readable Brief | SOURCE_IMPLEMENTED / TARGETED_PASS | Local-time window, quick windows and historical targetLabel/readable mapping exist. Selected UI tests pass; no new end-to-end brief/export/PG acceptance in this intake. |
| GL-FORM-01 | APPLIED_SOURCE_CONFIRMED / RENDER_NOT_RUN | Form density, field tokens and modal optical settings integrated. Latest light token adjustment passes the same28-pair bounded model. Neither that model nor compiled CSS proves actual display. |
| GL-FORM-02 | SOURCE_FIX_AND_COMPONENT_REGRESSION_CONFIRMED | Stable outer/content element tree across frost/liquid/opaque, conditional material layers only. New3transition regressions and existing dialog/form tests pass (14total). The blue outer frame's actual cause still requires browser observation. |

## 3. CI-01 — P1 carried BF-01: absent outcome still permits a misleading final aggregate

Current aggregate in apps/backend/internal/core/domain/matter/evidence.go continues to mark all-current-mandatory-criteria accepted as VERIFIED. Missing mandatory OUTCOME is not represented as an unsatisfied obligation, so package-only accepted filings remain VERIFIED. The new package/outcome split truthfully reports outcome not declared, but the generic verification badge/aggregate can still read Verified.

Fresh isolated domain probe (copied current domain source and existing test fixtures, no shared source changes):

    aggregate=VERIFIED packageReady=true outcomeDeclared=false outcomeReady=false

missing-outcome-cache-owned.log records the actual execution and a failing proposed conservative acceptance assertion. This is the explicitly retained D-BF1 case, not an unexpected failure of the author's current aggregate definition. The earlier missing-outcome-probe.log is only a setup failure from the default Go cache permission, not red behavioral evidence; rerun used a private owned cache and reached the assertion.

Recommend separating two decisions: (a) recording an actual authority APPROVAL fact; (b) asserting independently verified outcome. Do not hide an actual approval merely because the team has not configured its checklist. A compatible remedy can keep recording APPROVAL under existing evidence guards, but expose missing outcome as not independently verified and never label the overall final outcome Verified. Package readiness can remain true. Preserve previous facts/assessments/epochs; do not infer outcome criteria from old titles. If PO instead chooses to require an OUTCOME declaration before APPROVAL, record that stricter policy and its explicit legacy handling. This intake chooses neither policy on PO's behalf and changes no source.

BF-01 must remain PARTIAL until the selected semantics cover no-outcome filings as well as the happy path. The author table's unconditional Fixed is too broad.

## 4. CI-02 — P2: Matter Search reintroduces whole-document navigation

apps/frontend/src/features/matters/components/matter-discovery.tsx uses a native `<form action="/matters" method="get">`; its new test explicitly asserts that design. A normal submit follows native document navigation, rather than the application's enhanced client navigation. This conflicts with the previously requested smooth search behavior; no runtime observation is claimed here.

Use the project's supported Next form/client-navigation pattern, preserving the URL query, Back/Forward, progressive enhancement, bounded reads, loading indication and existing access boundaries. Do not remove GET/deep-link semantics or replace this with uncontrolled global fan-out. Add a meaningful browser check that submitting Search does not replace the document; the current component attribute test does not prove this.

## 5. CI-03 — candidate refresh and evidence precision

- Regenerate the source manifest after the latest form-token/plan edits and include the stable-tree files. At the second intake the29outputs were byte-consistent with two stale source/doc entries; the closing refresh reached34/34outputs and left only the plan document stale (124/125source entries match). All current application entries match the refreshed source manifest. This is an integration pin gap, not an accusation that business source was lost.
- Author red-before BF tests fail on missing new symbols/modules on pristine HEAD. That proves feature absence/compile incompatibility, not reproduction of the original behavioral defect. Keep that label honest. The new isolated missing-outcome assertion supplies a concrete observable value for the remaining edge case.
- The new glass regression directly asserts same input DOM node/value/focus on3tier transitions. It does not itself mount an IntentForm and assert a saved UNKNOWN key/payload or exercise real browser focus trapping. Stable identity supports state retention, but the stronger claim still needs the actual intent/browser scenario.
- The plan still contains a GroupA docs/HTTP pending phrase despite later return evidence. Clean the checkpoint when finalizing; preserve historical receipts.

## 6. Checks executed by Local Codex now

| Check | Actual result |
|---|---|
| Current domain + BF/GW memory + selected discovery/criterion HTTP tests, -race/-json |20test pass events incl parent suites,0fail/0skip,3packages; no PostgreSQL DSN supplied |
| Selected new date/discovery/queue/WorkNow/data-transfer/work/filing/tab Vitest |9files/130PASS |
| Glass tier/dialog/form tests |4files/14PASS; includes3transition regressions |
| Current form token contrast model |28/28 selected pairs pass; numerical model only |
| Proposed no-outcome final-proof assertion in isolated domain copy |1test FAIL as expected for the retained D-BF1 case; observed values above |

The default backend targeted run passed. An additional run with a private cache also passed; it does not expand coverage. No real PostgreSQL, migration/full make check, full801-test run/build/Worker/Storybook, IdP, runtime swap, browser/a11y or AC-137 was executed by this intake. The additional34-output closing manifest includes author refresh receipts; they remain author evidence. Claude's734/6backend and801/12frontend plus builds remain author receipts, not re-executed totals. The local runtime was explicitly retained on old build/database; source presence does not show localhost has these changes.

## 7. Exact next actions

1. Resolve the final-outcome representation/policy for CI-01/D-BF1; correct BF-01 disposition and add package-only/no-outcome plus declared-outcome/reopen regressions across read surfaces.
2. Correct enhanced Matter Search CI-02 without changing its authorized read model.
3. Freeze and repin the integrated BF+GL candidate, then run applicable final gates on those bytes; fresh nonauthor QA focuses on migrations, independent review, revocation, UNKNOWN recovery, paging, timezones and glass fallback state retention.
4. Prepare a fresh synthetic migration0009 runtime or obtain an explicit resource-owner handoff for the retained login database. Do not silently migrate it, lose data or stop unrelated processes. Browser/human journeys remain blocked until permitted tooling/user-assisted sessions are available.

Skipped: application fixes, retained-resource lifecycle, fresh PG/cloud/IdP/browser/human/performance tests, commit/push/deploy. Remaining risk: absent-outcome verified aggregate, search navigation friction, stale source pins and unobserved rendered/connected journeys remain open.
