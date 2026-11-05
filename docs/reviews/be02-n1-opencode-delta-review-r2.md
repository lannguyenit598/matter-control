# BE02/N1 — OpenCode targeted factual and candidate-delta review R2

- **Task**: MC-BE02-N1-DELTA-REVIEW-R2; P0; owner: actual OpenCode, independent nonauthor.
- **Reviewer identity**: OpenCode agent harness; model as provided by this session: **DeepSeek V4.1 Flash Free**; provider `opencode`. No provider/model/account change, login or paid route was initiated by this task. The reviewed delta response was authored by Local Codex; the reviewed N1 package was authored by Local Codex. This reviewer authored none of the reviewed content. The R1 reviewer model label (GLM-5.3-Flash Free) is historical and is not reused as the identity of this review.
- **Mode**: `READ_HASH_STATIC_ONLY`. No execution/import of reviewed code, reference model, scanner or suite; no tests/build/server/DB/HTTP/SQL/credentials/process/container/probes; no Git mutation; no provider call or messaging of other agents; no canonical contract edit.
- **Date / environment**: 2026-10-26; macOS 27.0.1 (darwin), rtk 1.0.1, Python 3.14.4, Semble binary present and CLI-responsive at `/Users/nguyenvanlan/.local/bin/semble` (no semantic content search was run; see §10 limits).
- **Repository**: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; HEAD at review and at write `a62d838791ba188838c4ff00b7b6e265ac775056`, matching the prepared base/head. Working tree pre-existing dirty/untracked state was not modified.
- **Intake gate**: `docs/testing/parallel-review-intake-20261026/be02-delta-inputs.json`, 3047 bytes, sha256 `8f2684723320833773e439eab2e25dfdd1a4d2d69b82cc45a5ef648e459e7fcd`; status `READY_NOT_DISPATCHED`; `runtime_or_credential_access: false`; `external_invocation: false`; `transitive_manifests: []`. All 14 declared inputs matched declared bytes and sha256 in the pre-review, pre-write and post-write passes (§10).
- **Outputs**: this review; `docs/testing/be02-n1-contract-review-r2/review-inputs.json`; `docs/testing/be02-n1-contract-review-r2/checks-log.json`. All three paths were verified absent before any write (collision gate: pass).
- **Retained baseline**: prior PF01..04/N1/N2 document dispositions (`PASS_DOCUMENT_ONLY_WITH_LIMITATIONS`) are retained from R1 and are not re-reviewed here. The original 27 BE02 acceptance cases stay **NOT_RUN**; the 79 author reference checks remain **cited author evidence**, not re-executed. No full 32-operation review and no BE01 source review were repeated.

## 1. Scope and method

R2 reviews only the five delta items named in the task: the C-A factual erratum, C-B presence markers, C-C field-shape reconciliation, C-D/C-E catalogue/URI and single-operation mapping, and the E-1..E-3 future-edit checklist. It is a document review: no code, no source checkout, no runtime and no adoption.

The declared read set is exactly the 14 inputs in the intake manifest, plus the manifest itself as the verification gate; the only read-set overshoot is recorded at the end of this section. `reference_check.py` was read statically and **not executed**. The C-A byte/codepoint work used small read-only stdlib utilities written for this task (not the reviewed reference program). Byte-exact checks were preferred over rendered text because U+E000 is visually blank in many fonts — the root cause of the R1 error.

Read-set discipline: one grep was scoped to `docs/architecture` and returned four matching lines from two files outside the declared input set (`api-auth-decision-analysis.md:254`, `integration-scope-proposal.md:75/121/140`). Those lines were not used as evidence, not cited, and no further reads of those files were made; the hash-verified input set is unchanged. This is recorded again in `review-inputs.json`. No Semble content search was run because it would read beyond the fixed read set; the binary and CLI were checked instead.

## 2. C-A — **ACCEPTED_FACTUAL_ERRATUM**

### 2.1 What R1 said, and why it was wrong

R1 §3.4 (line 73) and §4 C-A (line 110) stated that N1-C14 pairs the **empty string** `""` with `U+1F600`, that both scalar and UTF-16 ordering agree on that pair, and that a new discriminating vector is therefore required before N1 adoption. All three statements are withdrawn.

The actual vector does **not** contain an empty key. The second key is the single Unicode scalar **U+E000** (a BMP Private Use Area character), which is visually blank in common renderers and was misread as empty in R1's reading of the rendered file. R1 itself wrote two ASCII quote characters (`""`) at lines 73 and 110 — that is a genuine factual error in the R1 artifact, not merely a display artifact of this review.

### 2.2 Independent byte/codepoint inspection

Source: `vectors.json`, 8673 bytes, sha256 `1277c5e02f6d5d6e5ddb1f8531c3128bda36b8238092940b7cef27d61d0e614b` (unchanged).

| Representation | First input key | Second input key |
|---|---|---|
| Vector literal (line 71) | raw UTF-8 `f0 9f 98 80` | raw UTF-8 `ee 80 80` |
| Codepoint | U+1F600 (GRINNING FACE, `So`) | **U+E000** (BMP private use, `Co`) |
| Equivalent `\u` spelling | `\ud83d\ude00` | `\ue000` |
| UTF-8 bytes | `f0 9f 98 80` | `ee 80 80` |
| UTF-16BE code units | `d83d de00` | `e000` |
| Scalar sequence length | 1 | 1 (not 0) |

The recorded expected value (line 72) is `{"<U+E000>":2,"<U+1F600>":1}` with UTF-8 hex `7b22ee8080223a322c22f09f9880223a317d` and sha256 `cddbdeacace14eb6923e88dfafb2a3e7df21ec908682f50a886b7b9567692d02`. Both values match the codepoint evidence file exactly.

### 2.3 Does the existing vector discriminate scalar order?

**Yes.** Sorting the two decoded names under the three plausible byte/code-unit rules gives:

| Ordering rule | First key | Recorded expected order? |
|---|---|---|
| Unicode scalar value (recommendation.md:23) | U+E000 (`0xE000`) then U+1F600 (`0x1F600`) | **yes** |
| UTF-16 code-unit sequence | U+1F600 (`D83D DE00`) then U+E000 (`E000`) | no |
| UTF-8 byte sequence | U+E000 (`ee…`) then U+1F600 (`f0…`) | yes — but this is order-isomorphic to scalar order for well-formed UTF-8 |

An independent minimal encoder built for this pair (sort by codepoint, escape only quote/backslash/control, emit other scalars as UTF-8) produced exactly the recorded expected bytes and sha256 under scalar ordering. Under UTF-16 code-unit ordering it produced different bytes (`7b22f09f9880223a312c22ee8080223a327d`, sha256 `04208f6cdb854e2ab1b07dd3633a39dec854344fe72824cf7f2fdb4e2e33129e`) and did not match. The pair therefore already distinguishes scalar ordering from UTF-16 code-unit ordering, which is the only distinction C-A claimed was untested. UTF-8 byte ordering needs no separate vector because valid UTF-8 is designed to sort consistently with scalar order.

Ordering norm evidence (static reads, no execution): `recommendation.md:23` says "Sort decoded member names lexicographically by **Unicode scalar value sequence**, ascending"; `reference_check.py:55` encodes dict members with `sorted(value)` (Python `str` ordering is by code point). The author's clarification assertions were independently re-checked: all four are true (`actual_private_use_key_not_empty`, `scalar_and_UTF16_orders_differ`, `existing_expected_matches_scalar_order`, `existing_expected_rejects_UTF16_order`), and its `source_sha256` matches `vectors.json`.

### 2.4 Erratum and disposition

**Erratum**: R1 §3.4 line 73 and §4 C-A line 110 are corrected as above. The original R1 report is preserved byte-identical (`docs/reviews/be02-n1-opencode-contract-review-r1.md`, 29144 bytes, sha256 `3f0f8cb79cdd815822c0e4c1636696989bb4af3a6cfdc1a08abffa15112553da`) and is not rewritten. The author's C-A response is factually correct.

**Disposition: ACCEPTED_FACTUAL_ERRATUM.** C-A is closed. No vector addition, no new ordering rule, no canonical edit and no re-execution of the 79 author checks are required. The scalar ordering norm was already explicit and is not a new undecided algorithm.

**Residual, non-blocking**: U+E000 renders blank in many fonts; future reviewers should inspect bytes, not rendered text. The clarification's `escaped` column shows equivalent `\u` spellings for legibility; the vector's literal input uses raw UTF-8 for both keys, which does not affect the analysis. The vector proves the scalar-vs-UTF-16 rule distinction; it does not by itself prove that a particular implementation avoids locale collation — that is an implementation-conformance test, **NOT_RUN**, not an undecided rule.

## 3. C-B — **ACCEPTED_AS_EXISTING_N1_SEMANTIC_NO_NEW_DECISION**

The author's three-state table is exactly the marker already defined by N1:

| Input body | Tuple `preconditions.expectedRevisions` | Pinned evidence |
|---|---|---|
| member absent | `{"present":false}` | `recommendation.md:47`, `:56`; `reference_check.py:81` |
| member present as `{}` | `{"present":true,"value":{}}` | `recommendation.md:56`; `reference_check.py:82–83` |
| member present as `null` | `{"present":true,"value":null}` | `recommendation.md:56`; `reference_check.py:82–83` |

- The body copy is retained: `recommendation.md:56` ("Its copy in body is also retained"), so the marker supplements rather than replaces the body member. The author states this correctly.
- The three states are independently differentiated by vectors `N1-R09` (`{}` vs `{"expectedRevisions":{}}`, `same:false`) and `N1-R10` (`{}` vs `null`, `same:false`).
- **R1's suggestion is withdrawn.** R1 §3.5 (line 83) suggested reading bare `{}` as "no revision inputs supplied". That would collapse present-but-empty into absent and is expressly forbidden by `recommendation.md:56` ("Do not fill absent with{}"). The author's rejection is technically correct.
- **Create CAS-none remains unchanged.** `backend-http-preparation.md:34`: "Create has CAS scope none: supplied If-Match produces candidate400 precondition-not-applicable, not428"; `:55` has `"ifMatch": null` for the create example; `api-contracts.md:13` and `:43` keep the scope-none 400 mapping. No 428 and no Filing precondition is transferred. The author states this correctly.
- **Residual precision (not a new decision):** distinguish *body-member* absence (the three-state marker above) from *tuple-slot* omission. N1 §3 defines a fixed tuple and `reference_check.py` always emits the marker, so omitting the marker slot is malformed tuple shape, not a fourth body state. The delta's table covers the body states; an adopting E-2 edit should cite N1 as the normative source for the marker rather than presenting a second independent definition.

**Disposition: accepted as the existing N1 semantic; no new decision, no adoption.**

## 4. C-C — **ACCEPTED_WITH_ONE_REQUIRED_SHAPE_CLARIFICATION**

### 4.1 Counts and shape separation

| Shape | Members | Source |
|---|---|---|
| Create request | **2**: title, outcome (plus path/headers, not body members) | `backend-http-preparation.md:34` ("JSON containing only title/outcome") |
| BE02 create result DTO proposal | **10**: identity, matterId, title, outcome, execution, dependency, verification, verificationApplicability, proofEpoch, revision | `backend-http-preparation.md:38` |
| PF01 retained v1 projection | **14**: id, matterId, title, outcome, executionState, dependencyState, verificationState, verificationApplicability, applicabilityReason, proofEpoch, workstreamId, ownerActorID, dueAt, revision | `be02-codex-correction-return.md:11` |

The author's count and grouping are correct: the 10 BE02 concepts are the common core; the 14 PF01 fields add `applicabilityReason`, `workstreamId`, the public owner field and `dueAt`. The request shape (2 members) is distinct from both response candidates, which is an important separation and is correctly stated. Four of the common ten also have different names between BE02 and PF01 (`identity`/`id`, `execution`/`executionState`, `dependency`/`dependencyState`, `verification`/`verificationState`); the author correctly leaves exact public naming to contract authority, consistent with `backend-http-preparation.md:38` ("Final field names/envelope are technical-review output").

- **Ownership stays a decision, not invented.** `applicabilityReason`, `workstreamId`, public owner and `dueAt` have no verified producer in the pinned documents; `backend-http-preparation.md:38` says metadata remains null until its owning later commands, and `:40` forbids filling unavailable values with constants. The author places owning-command semantics and stored-field availability in `NEEDS_SOURCE/decision` and does not fabricate a producer, a stored value or activation. Correct.
- **Public owner spelling stays unresolved.** `ownerActorID` (PF01 prose) vs internal `ownerActorId`; PF01:11 itself says exact owner-field naming is a contract decision. The author keeps it unresolved. Correct.
- **RequestHash/receipt internals excluded.** Consistent with PF01:11 and N1:58. Correct.

### 4.2 Required clarification: field **presence** must be fixed per representation version

The delta's phrase "**If included**, values must come from the trusted stored snapshot" leaves member presence optional per response. That is not compatible with the retained representation invariant:

- `be02-codex-correction-return.md:11` defines the v1 projection whitelist as the 14 public fields (a whitelist; the text does not by itself require every member in every response).
- `be02-codex-correction-return.md:27` requires create201, replay201 and GET200 to encode the **same public resource representation** when describing the same resource revision.
- `backend-http-preparation.md:38` says metadata remains null until its owning later commands; `:40` forbids filling unavailable values with constants.
- `be02-codex-correction-return.md:25` makes a strong ETag map to equal selected representation bytes.

If create201 can emit 10 members while GET200 emits 14 for the same revision, the two are different representations for the same strong validator, breaking the invariant. The shape must therefore be fixed, not optional per field. Two admissible resolutions exist; **the reviewer does not choose**:

1. **Fixed 14-member representation for all resource responses**, emitting **stored** nulls for metadata not yet set by an owning command. A stored null is authoritative data, not a fabricated default; the author's "no fabricated null/default" must be read as forbidding synthesized values, not stored nulls.
2. **An explicitly approved bounded reduced representation** for create/replay, with the same-representation/strong-ETag invariant re-scoped and documented for that path (the author's own closing sentence allows "a bounded reduced representation … explicitly approved").

This is an adoption-condition clarification, not a factual defect in the delta. No DTO policy, field ownership or stored value is adopted here. The author's warning not to activate HTTP until the complete projection is supported or a reduced representation is approved is correct.

**Disposition: accepted with one required shape clarification before the corresponding E-1/E-2 adoption edits; ownership and public spelling remain decisions; no invention and no activation.**

## 5. C-D — **ACCEPTED_AS_CANDIDATE_DELTA_WITH_INCOMPLETE_CATALOGUE_EDIT_SCOPE**

### 5.1 Pinned catalogue facts

`docs/architecture/api-contracts.md` (sha256 `49ec8aa5…76e75`) currently has:

- `:26` **400** `/problems/malformed` — "JSON/syntax/**type** errors".
- `:39` **422** `/problems/validation` — "Field validation", `errors[] {field, message}`.
- `:43` **400** `/problems/precondition-not-applicable` — If-Match on a scope-none endpoint.
- `:46` **428** `/problems/precondition-required`.
- **No 415 row**, no `/problems/unsupported-media-type`, no `/problems/schema-validation`.
- `:20` RFC 9457 `application/problem+json` with `type` URIs "below".
- Other unqualified 422 references exist at `:16` (client `asOf` on current-state views), `:18` (derived-field write), and §3.8 `:254` (`t1 > t2`/`t2 > asOf`).

The author's candidate set is: 415 `/problems/unsupported-media-type`; 400 `/problems/malformed` narrowed to admission/syntax; 422 `/problems/schema-validation` for new-command schema. The status values are consistent with PF03's ordered candidate (`be02-codex-correction-return.md:33–53`) and with N1's 400 admission rules (`recommendation.md:17`). The URIs follow the existing kebab-case `/problems/...` convention and do not collide with existing strings.

### 5.2 Technical gaps in the edit scope (no URI policy adopted)

1. **422 split boundary.** There would be two 422 types: the existing `/problems/validation` ("Field validation") and the proposed `/problems/schema-validation`. PF03 has two distinct 422 rows — syntactically valid wrong root/field type, unknown or forbidden property (`:46`), and well-typed field failing semantic validation (`:47`). The delta proposes the new URI but does not state which row maps to which URI, so the catalogue would carry two 422 types with undefined semantics. An alternative architecture choice is to re-scope the existing `/problems/validation` to cover both and add no URI. Both are architecture decisions; the boundary must be chosen by authority.
2. **Knock-on references.** If a second 422 type is adopted, the existing unqualified 422s at `:16`, `:18` and §3.8 must be explicitly re-pointed or explicitly retained. The delta's "preserve endpoint-specific existing replay conflict/error conventions" covers idempotency 422/409 and stale-revision, but not this field-vs-schema split. Omitting it would silently reclassify existing 422 responses.
3. **415 wording.** PF03 maps **missing Content-Type** (`:39`), syntactically valid unsupported media (`:40`) and unsupported charset/parameter (`:43`) to 415. A URI named `/problems/unsupported-media-type` under-describes the *missing* case; the catalogue "When" column must enumerate absent + unsupported + unapproved parameter, or the URI name must be reconsidered. This is a naming/wording decision, not a status conflict.
4. **400 `/problems/malformed` narrowing.** The row's "type errors" wording must be explicitly removed (types move to 422), and the narrowed row must still cover malformed Content-Type syntax and duplicate charset (`be02-codex-correction-return.md:41`) as well as JSON admission/encoding/duplicate-name failures (`:44–45`). "admission/syntax 400" is directionally correct but needs that explicit scope.
5. **Catalogue-wide vs slice scope.** Adding 415/422 rows to the problem catalogue affects every `/api/v1` JSON-body command, not only Requirement create. The delta must state whether the new 422 type is catalogue-wide or scoped to the product Requirement slice; otherwise it changes the meaning of existing endpoint mappings (e.g., §3.8) without an explicit decision.
6. **Create If-Match 400 is already covered.** The existing `:43` `/problems/precondition-not-applicable` remains the correct mapping for `backend-http-preparation.md:34`'s "supplied If-Match produces candidate400 precondition-not-applicable, not428". No new 400 URI is needed; the delta should say so to avoid implying `/problems/malformed` covers it.

No URI, status mapping or DTO policy is adopted by this review. No claim is made that all 32 operations are mapped; the author explicitly disclaims that, and this review agrees.

**Disposition: accepted as a candidate delta; the status direction is consistent, but the catalogue edit scope (422 boundary + knock-on references + 415 wording + catalogue-wide scope) is incomplete and must be completed by architecture authority before adoption.**

## 6. C-E — **ACCEPTED_AS_SINGLE_SCOPED_CANDIDATE_MAPPING_WITH_TWO_PINNED_DEPENDENCIES**

Field-by-field check of the author's one scoped Requirement-create candidate:

| Tuple field | Author's candidate | Pinned check | Result |
|---|---|---|---|
| method | POST | `backend-http-preparation.md:52`; `api-contracts.md:87` | consistent |
| routeTemplate | `/api/v1/matters/{matterId}/requirements` | `backend-http-preparation.md:52`; base `/api/v1` and `/matters/{matterId}/…` at `api-contracts.md:11`; `POST /matters/{m}/requirements` at `:87` | consistent |
| path | `matterId` from the admitted canonical path value | `backend-http-preparation.md:53`; N1 `recommendation.md:52` ("every path parameter including the already-selected scope ID") | consistent, with dependency below |
| body | complete admitted decoded JSON before schema/replay; preserve unknown/presence/numeric-token distinctions | N1 `recommendation.md:56`, `:68`; `backend-http-preparation.md:59` (no silent drop) | consistent |
| ifMatch / ifNoneMatch | header presence/octet encoding per N1; absent → null | `recommendation.md:54`; `reference_check.py:70–75`; `backend-http-preparation.md:55` | consistent, with dependency below |
| expectedRevisions | exact presence marker from the complete original body | C-B; `recommendation.md:56` | consistent |
| receipt namespace | authenticated actor/key stay lookup scope, not extra fingerprint content | `recommendation.md:58`; `backend-http-preparation.md:61` | consistent |

Dependencies / precision:

1. **Canonical path determinism depends on T25.** The `path.matterId` value is only deterministic across percent-encoded spellings if PF03's T25 candidate (`be02-codex-correction-return.md:57`) or an equivalent routing rule is adopted. N1:52 allows "a syntactically canonical ID … supplied by the existing routing/admission contract", so the mapping is structurally sound, but the equivalence decision is unresolved. Without it, two spellings of the same ID can hash differently — an idempotency-equivalence decision, not a correctness bug.
2. **Create header policy.** A supplied If-Match is already pinned as candidate 400 precondition-not-applicable (`backend-http-preparation.md:34`), not 428; the E-2 edit should cite that sentence rather than leave "not applicable" open. `If-None-Match` policy for Requirement create is not stated in the pinned corpus (the only `If-None-Match: *` use is membership create at `api-contracts.md:67`); it needs an explicit endpoint decision before activation.
3. **Tuple version.** N1's tuple carries `"version": 1` (`recommendation.md:39`). The C-E table does not restate it; an adopting per-operation table should state the tuple version once as a format constant, so the mapping is unambiguous.
4. **BE02's illustrative body.** The example at `backend-http-preparation.md:54` shows only `title`/`outcome`. That must be marked illustrative or replaced with a complete-body reference; otherwise a reader could take it as a closed body whitelist, contradicting N1 §4's rule that unknown/forbidden members are still hashed before schema rejection and C-E's own "complete admitted decoded JSON".
5. No other operation is mapped, and the author explicitly does not claim the 32-operation catalogue is mapped. Correct.

**Disposition: accepted as the single scoped candidate mapping, subject to the T25/canonical-path and create-header-policy decisions and the illustrative-example fix; no URI/DTO policy adopted and no activation.**

## 7. E-1..E-3 — **ACCEPTED_WITH_PRECISION_ITEMS**

### E-1 (API§1)

- **Provenance outside all selected JSON body members**: satisfied by the author's "ALL volatile provenance JSON members". This matches PF02:21 (optionA: `asOf`/`sourceRevision`/`historyMaterializedThrough` never inside the selected body, including an envelope metadata member).
- **No JSON trailing-metadata loophole**: the author closes the "JSON metadata member" reading ("'trailing metadata' must not be read as permission to add a JSON metadata member"). However, **"trailing metadata" remains undefined**. The adopting edit should define provenance placement as explicit HTTP **response header fields only** — not a JSON member, not bytes appended after the resource object, not a second JSON document, and not an HTTP trailer object. Otherwise a "trailing" payload outside the object but inside the entity body could still be argued.
- **Wrapper validator scoped correctly**: the author requires an "appropriate independent validator", which supplies independence but not scope. The adopting edit should state: the validator validates the operations wrapper representation `{status, response, asOf}` (`api-contracts.md:15`) only; the wrapper's own `asOf` is permitted there; the validator is **not** the nested resource's ETag and does not validate or alter the nested resource body. PF01:17/PF02:27 require exactly this separation.
- **Command-response envelope gap (potential contradiction if "ALL" is read literally)**: `api-contracts.md:16` says every response includes `eventSeqs[]` for commands, and §3 examples include `derivedChanges`. PF01:11 excludes any field outside the 14-member resource projection, including newly computed derived status, and says nothing about where `eventSeqs[]`/`derivedChanges` live. If E-1's "ALL volatile provenance" includes `eventSeqs[]`, it contradicts `:16`; if it excludes it, the command response has no defined carrier. The adopting edit must define a command envelope outside the resource representation (so create/replay/GET of the same revision still encode identical resource bytes per PF02:27) or narrow `:16` for product commands. Architecture decision; no shape adopted here.
- **N1 referenced once**: no second encoder is proposed (good), but the **normative home is unresolved**. The single N1 definition currently lives in a task-handoff recommendation (`docs/design/step-03a/handoff/.../recommendation.md`), not in a canonical contract. API§1 should not reference a handoff artifact as normative: one authoritative location (for example the API§1 Idempotency row at `api-contracts.md:14`, or a separately cited contract section) must be pinned first; API§1, BE02§4 and Filing then reference it rather than restate it. The author's "add a candidate reference to one N1 definition" is directionally right but does not name the home.
- **Catalogue changes only after authority review**: correct; no adoption.

### E-2 (BE02§4)

- Presence-marker correction, the one-operation route table, create CAS-none and "do not create a second encoder specification" are all correct and consistent with `recommendation.md:60` and C-B.
- **Additional required edits**: `backend-http-preparation.md:55`'s `expectedRevisions: {}` and `:54`'s two-field `body` example must both be replaced/marked as above; the edit should cite N1 §3 as the marker's normative source. A supplied If-Match must retain the already-pinned candidate 400 precondition-not-applicable (`:34`); no 428.
- No other operation, no second algorithm, no activation.

### E-3 (Filing)

- **N1 referenced, not redefined**: correct in principle. The edit should say "reference N1" and mark the N2 If-Match-before-expectedCycleNo order as the **proposed** candidate it is (`recommendation.md:72`), not as adopted.
- **Filing If-Match/428 stays Filing-scoped**: explicit and correct; `filing-model.md:60` reopen requires the filing revision, and `backend-http-preparation.md:34` keeps Requirement create at 400, not 428. No transfer.
- **"L5" has no anchor** in `filing-model.md`: the string appears only in the two reviews, not in the target document. The adopting edit should name the actual sections (Filing §3 cycles and §4 reopen effects) or define "L5" explicitly, so the edit target is unambiguous.
- The R1 E-3 item about the N1 limitation status (`ADEQUATE_WITH_N1_LIMITATION_DOCUMENT_ONLY`, sourced from `candidate-supplement.json:81`) is **not adjudicated in R2**: that source file is outside the R2 intake, so the status is not re-verified here and remains subject to the prior R1 record.

**Disposition: E-1..E-3 are directionally correct future-edit checklists. Acceptance is subject to four precision items — define "trailing metadata", scope the wrapper validator, pin N1's normative home, and fix the E-2 example/E-3 anchor — plus the command-envelope question. No edit is made here.**

## 8. Document candidate verdict

**`DELTA_RESPONSE_PASS_DOCUMENT_ONLY_WITH_LIMITATIONS`** — the targeted author response is factually correct on C-A, applies the existing N1 marker correctly on C-B, separates request/response shapes correctly on C-C, and proposes directionally consistent C-D/C-E candidates and E-1..E-3 checklists. It adopts nothing.

Adoption conditions recorded (not satisfied by this review):

1. C-C representation **field presence** fixed (fixed-14-with-stored-nulls or an explicitly approved reduced representation) and the same-representation/strong-ETag invariant preserved.
2. C-D catalogue edit scope completed: 422 boundary vs `/problems/validation`, knock-on 422 references, 415 "When" wording for missing Content-Type/unapproved charset, and catalogue-wide vs slice scope; existing 400 `/problems/precondition-not-applicable` retained for create.
3. C-E canonical-path (T25) and create header policy decided; tuple version and complete-body example stated.
4. E-1 "trailing metadata" defined, wrapper validator scoped, N1 normative home pinned, command `eventSeqs[]`/`derivedChanges` placement resolved.
5. E-2 example/marker fixed and N1 cited; E-3 anchored to real Filing sections.
6. All prior R1 adoption conditions not superseded here (owner spelling, owning commands, optionA, legacy codec compatibility, per-operation pinning).

No final adoption, no canonical edit, no implementation, no Step03B activation, and no claim that the 32-operation catalogue is mapped.

## 9. Carried statuses and gates

- PF01..04, N1, N2: `PASS_DOCUMENT_ONLY_WITH_LIMITATIONS` (R1, retained; not re-reviewed).
- 27 BE02 acceptance cases: **NOT_RUN**.
- 79 author reference checks: cited author evidence only; not re-executed; no HTTP/client interoperability proof.
- F10 **OPEN**; OC01..07 **CLOSED_DOCUMENT_ONLY**; L4 **NOT_VERIFIED**; problem-type catalogue 32 entries **NOT_ADOPTED**; G3 **NOT_VERIFIED**; G4 **PENDING**; G5-B open; G6 **REWORK_REQUIRED**; STEP03B **NOT_AUTHORIZED**; client success-header capability **NOT_VERIFIED**; INT-D02/D07/D09 unselected.
- BE01 baseline `136eae6ad403ae3ede797faf6a0d6179c3b95685` plus patch sha256 `33297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e` was **not re-read or re-verified** in R2 (outside the intake); the prior BE01 review PASS and the Mimosa/accepted-commit gate are unchanged.
- No source, index, security state or canonical contract was modified; no provider/model/account change; no external messaging.

Remaining **authority** gates: C-C shape/ownership/public owner spelling; C-D catalogue URIs/status boundaries/scope; C-E T25 path, create header policy, tuple version; E-1 optionA placement, header names, wrapper validator scope, N1 normative home and command envelope; E-3 Filing anchor; PF01 legacy codec/validator compatibility; identity/provider, retention/limits/deadline/retry decisions.

Remaining **source** gates (`NEEDS_SOURCE`, not read in R2): `RequirementRead` `asOf`/`sourceRevision`; `MatterHeader` producers; `httpapi/server.go` route registration; `httpapi/errors.go` native mapping; `app/app.go` wiring; product `matter_migrate.go`; `access.go` authorization queries; `matter_service.go` transaction boundaries; `openapi.go` schema registration; T25 router behavior; client success-header capability. These are later bounded reads, not defects invented here.

## 10. Inputs, outputs, identity, time, limits

### 10.1 Verified inputs (14/14 match, bytes and sha256)

| Path | Bytes | SHA-256 |
|---|---|---|
| `AGENTS.md` | 8886 | `9f9ad043592401557a4eac6812d45e758a058f9aad9206735d3c19f154950beb` |
| `docs/reviews/be02-n1-opencode-contract-review-r1.md` | 29144 | `3f0f8cb79cdd815822c0e4c1636696989bb4af3a6cfdc1a08abffa15112553da` |
| `docs/testing/be02-n1-contract-review-r1/review-inputs.json` | 15171 | `f3783d96d235dba13c0bce48526bc295e6e7c818e146f6c0846bfb03fc124ad0` |
| `docs/testing/be02-n1-contract-review-r1/checks-log.json` | 8371 | `b4558557cfcc8775abbda9cdda8108b14399147e308350921d4214a77ee42801` |
| `docs/reviews/be02-n1-targeted-author-response-r1.md` | 6748 | `b146b0bb5b876fb2cbff7e3225d77a1d152656a2f82655cc97bf6de8d60db089` |
| `docs/testing/parallel-review-intake-20261026/unicode-c14-clarification.json` | 1556 | `2f197468c8eca77a4545fa109ae1e25d78d53d255b69af89e0b5bf11142541ab` |
| `docs/design/step-03a/handoff/step-03a-8a/codex-n1-canonical-body-r1/vectors.json` | 8673 | `1277c5e02f6d5d6e5ddb1f8531c3128bda36b8238092940b7cef27d61d0e614b` |
| `docs/design/step-03a/handoff/step-03a-8a/codex-n1-canonical-body-r1/recommendation.md` | 14401 | `ead64d2e73f029640f65c1794972a761b93f524fdf1335f8c1d1eb1ced398e20` |
| `docs/design/step-03a/handoff/step-03a-8a/codex-n1-canonical-body-r1/reference_check.py` | 7656 | `60600a3b72001e6bf8649865922276f1b782d8a35a1358db7098793b747fb238` |
| `docs/reviews/be02-codex-correction-return.md` | 14522 | `0184448afc818479e199fb2c9c727bf6e810361b19091b92ebf53e87be106afb` |
| `docs/architecture/backend-http-preparation.md` | 14177 | `542d3e6fa900051b489847adbe9d75e4278db89352b580c7209948f75d221531` |
| `docs/architecture/api-contracts.md` | 25038 | `49ec8aa506386df03c4995a53553d51dd615e1fd0e1fd02f4fd45d146d576e75` |
| `docs/architecture/filing-model.md` | 7652 | `632f9c8670c98de2065f40a28ed34f31257c1615a1e73cfd25fcafc7a90c60dd` |
| `docs/implementation/handoffs/MC-BE02-N1-DELTA-REVIEW-R2-OPENCODE-PROMPT.md` | 3131 | `b590e2f5e536ae0779858c2e36f51ba6c4f378a150cc3b61fe7fc5dc804a7a1f` |

Intake manifest: 3047 bytes, sha256 `8f2684723320833773e439eab2e25dfdd1a4d2d69b82cc45a5ef648e459e7fcd`; verified before review, before write and after write; no `NEEDS_INPUT_REFRESH`. All 14 inputs matched in every pass.

### 10.2 Outputs

This review: `docs/reviews/be02-n1-opencode-delta-review-r2.md` — hash/bytes reported in `checks-log.json` and the completion report, not here (a document cannot contain its own digest).

`docs/testing/be02-n1-contract-review-r2/review-inputs.json` — pin verification record (14 inputs, three passes, preserved R1 artifacts, read-set note, output inventory). Its own hash is recorded in `checks-log.json`.

`docs/testing/be02-n1-contract-review-r2/checks-log.json` — chronological checks. Its own hash is excluded from its content and reported only in the completion report; no output manifest hashes itself.

### 10.3 Identity, time, limits

Identity as stated in the header; no provider/model/account change, no login, no paid route, no external messaging. Early checks ran from approximately 2026-10-26T14:40Z (intake mtime 14:38:30Z; the first tool invocation was not time-stamped). The pre-write pass was at **2026-10-26T14:45:20Z**; the post-write pass is recorded in `checks-log.json` with its exact UTC time.

Limits: read/hash/JSON/codepoint utilities only; no reviewed code/reference/scanner execution; no source import; no tests/build/server/DB/HTTP/SQL/credentials/process/container/probes; no Git/source/index/security-state or canonical contract modification; no output beyond the three declared paths; one read-set overshoot (four lines from two non-input architecture files) recorded above and not used; Semble content search not run to preserve the read set.

## 11. Skipped checks and remaining risk

**Skipped checks**: execution of `reference_check.py` and any runtime framing of N1 vectors; the 79 author reference checks (cited, not rerun); all 27 BE02 acceptance cases; HTTP/client interoperability and success-header capability; runtime DB/SQL/JSONB/trigger/UNIQUE behavior; all `NEEDS_SOURCE` structures/paths listed in §9; the full 32-operation review; BE01 source re-review; any canonical document edit; any provider/agent dispatch.

**Remaining risk**:

1. If the C-C presence-shape clarification is not resolved before adoption, create/replay/GET representations for the same revision can differ, weakening the strong-ETag invariant and enabling representation-validator mismatches.
2. If the C-D 422 boundary and knock-on references are not fixed, existing 422 responses (derived-field writes, client `asOf`, status-brief validation) may be silently reclassified, and the 415 row may not cover missing Content-Type.
3. If C-E proceeds without the T25 canonical-path and create header-policy decisions, idempotency equivalence and supplied-If-Match behavior remain ambiguous.
4. If E-1's "trailing metadata" and command envelope are not defined, `eventSeqs[]`/`derivedChanges` have no authorized placement, and a literal reading of "ALL volatile provenance" conflicts with `api-contracts.md:16`.
5. The N1 definition remains in a handoff artifact until its normative home is pinned; referencing it from API§1 before that would make a canonical document depend on a non-canonical task output.
6. The 79 author checks and all document only evidence still prove nothing about HTTP/client behavior; source/runtime facts remain unverified until the bounded later reads in §9.
