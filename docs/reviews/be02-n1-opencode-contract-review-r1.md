# BE02 PF01..04 and F10 N1/N2 — OpenCode independent contract review R1

- **Task**: MC-BE02-N1-CONTRACT-REVIEW-R1; P0; owner: actual OpenCode, independent nonauthor.
- **Reviewer identity**: OpenCode agent harness; model GLM-5.3-Flash Free; provider opencode. The reviewed artifacts were authored by Codex (PF assertions: `docs/reviews/be02-codex-correction-return.md`) and Local Codex (N1 package: `docs/design/step-03a/handoff/step-03a-8a/codex-n1-canonical-body-r1/`). This reviewer authored none of the reviewed content; independence preserved.
- **Mode**: READ_HASH_STATIC_ONLY. No execution/import of reviewed code or reference models, no runtime/HTTP/SQL/DB/Docker, no builds/installs, no provider calls, no messaging of other agents, no Git mutation (no commits/stashes/shared status edits). Small personal read/hash/JSON utilities only (`/private/var/folders/9b/zd6k4tc179587w4ntkqvvlqr0000gn/T/opencode/be02-n1-hashcheck.py`; all repo shell commands `rtk`-prefixed per AGENTS.md).
- **Date**: 2026-10-26. **Environment**: macOS (darwin), rtk 1.0.1, Python 3.14.4, Semble present (`/Users/nguyenvanlan/.local/bin/semble`, searched `--content docs config all -k 8`).
- **Repository**: root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; HEAD at review `a62d838791ba188838c4ff00b7b6e265ac775056`.
- **Reviewed BE01 baseline**: `136eae6ad403ae3ede797faf6a0d6179c3b95685` plus patch sha256 `33297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e` (staged/uncommitted bytes at `/private/tmp/mattercontrol-backend-be01`; Mimosa commit gate blocked). The baseline is **not HEAD**; no commit substitution, no reopening of the accepted BE01 F01..03 review.
- **Pins**: master manifest `docs/testing/parallel-work-20261026/be02-n1-inputs.json` sha256 `6dd66a3768edd11d245826587fc77715ee72160338b0462452005b46a8f14d99`; 28 direct inputs + 9 correction-manifest payloads + 11 N1 output-manifest payloads verified in **three passes** (pre-review, post-review, pre-write; all `overall_all_match: true`). Full per-payload hashes: `docs/testing/be02-n1-contract-review-r1/review-inputs.json`. No pin mismatch occurred; NEEDS_INPUT_REFRESH was never triggered.
- **Outputs written** (paths verified absent before writing; no collisions): this review, `docs/testing/be02-n1-contract-review-r1/review-inputs.json`, `docs/testing/be02-n1-contract-review-r1/checks-log.json`.

## 1. Scope and method

Static document review of the Codex BE02 PF01..04 correction assertions, F10 N1/N2, and their cross-consistency with the canonical API/Filing docs and four pinned BE01 source files (`matter_dto.go`, `0001_mattercontrol_core.sql`, `user_handler.go`, `port/matter.go`) — read/hash only, no Git/Mimosa operations in that checkout. N1 reference code and vectors were analyzed statically; `reference_check.py` was never executed by this reviewer. No full 32-operation/architecture review and no duplicate author loop (per task boundary). Facts outside the pinned read set are marked **NEEDS_SOURCE**, not inferred.

Statuses carried unchanged into this review's conclusions: all 27 BE02 cases **NOT_RUN**; N1 79/79 author reference checks (author evidence, not product/HTTP coverage); F10 **OPEN**; OC01..07 **CLOSED_DOCUMENT_ONLY**; L4 **NOT_VERIFIED**; problem-type catalogue 32 entries **NOT_ADOPTED**; G3 **NOT_VERIFIED**, G4 **PENDING**, G5-B open, G6 **REWORK_REQUIRED**; STEP03B **NOT_AUTHORIZED**; client success-header capability **NOT_VERIFIED**; INT-D02/D07/D09 unselected.

## 2. Dispositions

| Item | Disposition | Basis |
|---|---|---|
| PF01 (versioned deterministic public projection) | **PASS_DOCUMENT_ONLY_WITH_LIMITATIONS** | Internally consistent proposal; no blocking contradiction; depends on §6 corrections C-A, C-C and on unimplemented BE01 state (§3.1) |
| PF02 (provenance placement, ETag/revision, operations wrapper) | **PASS_DOCUMENT_ONLY_WITH_LIMITATIONS** | Consistent with pinned source facts; depends on §6 corrections C-B, C-E; representation/adoption decisions unresolved by design (§8) |
| PF03 (error precedence, malformed input handling) | **PASS_DOCUMENT_ONLY_WITH_LIMITATIONS** | Precedence chain consistent (§5.3); exact catalogue conflicts identified (§6 C-D) |
| PF04 (identity seam) | **PASS_DOCUMENT_ONLY_WITH_LIMITATIONS** | Consistent with pinned adapter facts; product-auth guarantees unavailable until BE02 product auth exists (§5.6) |
| N1 (canonical body encoding) | **PASS_DOCUMENT_ONLY_WITH_LIMITATIONS** | Statically self-consistent (79/79 sections recomputed); one adoption blocker: scalar-vs-UTF-16 ordering vector missing (§6 C-A) |
| N2 (filing If-Match/expectedCycleNo ordering) | **PASS_DOCUMENT_ONLY_WITH_LIMITATIONS** | Consistent with Filing model and BE02§4 tuple; 428 stays Filing-scoped (§5.5) |

No blocking internal contradiction was found in any of the six items. The dispositions are document-only: they approve nothing for implementation, adoption or runtime.

## 3. Findings per acceptance question

### 3.1 Q1 — PF01: versioned deterministic public projection

- PF01 (`be02-codex-correction-return.md:11`) proposes a retained v1 projection deterministically encoding exactly 14 public Requirement fields: `id,matterId,title,outcome,executionState,dependencyState,verificationState,verificationApplicability,applicabilityReason,proofEpoch,workstreamId,ownerActorID,dueAt,revision`, with no RequestHash, internal receipt key, mutable live row or newly computed derived status in the body, and fail-closed behavior for legacy/unknown codecs. Internally consistent as a design.
- Pinned source facts confirm the proposal is **not yet implemented** in BE01 bytes and marks exactly what BE02 must add: `matter_dto.go:36–42` `createdResultDTO` has **no schemaVersion**; `RequestHash` is carried at `matter_dto.go:41` (internal, trusted per `port/matter.go:16–26`); encode/decode at `matter_dto.go:103–138` is plain `Marshal`/`Unmarshal` (not framed, not versioned, not deterministic-wire). Nothing in BE01 proves stable replay bytes; PF01's stable-bytes/status/headers claim is a target, not a verified property.
- **Conflict C-C (technical correction)**: PF01's 14-field projection whitelist is broader than BE02§3's create DTO proposal (`backend-http-preparation.md:38`: identity, matterId, title, outcome, execution, dependency, verification, verificationApplicability, proofEpoch, revision — no `workstreamId`, no owner field, no `dueAt`, no `applicabilityReason`). This is reconcilable (create DTO is narrower than the retained projection; owner/timing fields arrive via later owning commands per `backend-http-preparation.md:38` "metadata remains null until its owning later commands"), but the two documents never reconcile the lists explicitly. Adoption must state the field-by-field relationship: create DTO ⊂ projection whitelist, and which command owns each late field.
- **Conflict C-C2 (naming, decision not default)**: PF01 text writes the public owner field as `ownerActorID` while the internal source tag is `ownerActorId` (`be02-codex-correction-return.md:11` explicitly: "Exact owner-field naming is a contract decision, not inferred from internal ownerActorId"). The exact public spelling must be pinned before adoption; neither spelling is validated by any approved artifact in the pinned set.
- No RequestHash exposure: consistent — `RequestHash` never appears in the PF01 whitelist and is bound at the port boundary (`port/matter.go:16–26`, trusted input). No JSONB wire-byte preservation claim is made anywhere in the pinned corpus (0001 sql:189 stores response JSONB; PF01 does not claim byte preservation of that column), so there is nothing to contradict.

**Disposition**: PASS_DOCUMENT_ONLY_WITH_LIMITATIONS.

### 3.2 Q2 — PF02: provenance outside body, history headers, ETag, operations wrapper

- Volatile provenance outside the selected resource body: consistent with pinned facts. `port/matter.go:105–108` snapshot `AsOf` is read-time provenance (recomputable per snapshot, not part of the immutable stored outcome); `0001_mattercontrol_core.sql:189` stores the response as JSONB; `be02-codex-correction-return.md:11` requires the trusted response codec/schema discriminator persisted **in the same command transaction** as the immutable outcome. No contradiction.
- Truthful source for history headers: **partially outside pinned scope → NEEDS_SOURCE** (§7): `sourceRevision` (matter event sequence) and `historyMaterializedThrough` have no verified producer in the four pinned files; `api-contracts.md:16` (Provenance row) asserts them on every response, and `backend-http-preparation.md:40` explicitly forbids filling `historyMaterializedThrough` with constants. The truthful-source requirement is sound; the producing structures (e.g., `MatterHeader` Go struct fields) are NEEDS_SOURCE.
- Strong ETag/revision/codec invariant: feasible as proposed — `revision` is in the projection whitelist (`be02-codex-correction-return.md:11`) and the codec discriminator is persisted with the outcome. The invariant is a document-level design; NOT_VERIFIED as runtime behavior.
- Operations wrapper: `api-contracts.md:15` defines operations lookup `200 {status: COMMITTED, response, asOf}`; `backend-http-preparation.md:67` correctly separates the outer asOf (its own snapshot) from the unchanged nested committed outcome. PF02's requirement that the wrapper have **its own representation validator** is consistent and necessary: nothing in the pinned corpus validates the wrapper shape itself.
- Client success-header capability remains NOT_VERIFIED (carried status); separate implementable technical contract vs unresolved representation decisions (optionA etc.) is correctly separated in PF02. Conflict C-B (§6) is the one body/provenance divergence.

**Disposition**: PASS_DOCUMENT_ONLY_WITH_LIMITATIONS.

### 3.3 Q3 — PF03 + N1: error precedence and malformed input handling

- Verified precedence chain, product-proposed order: content-type/media admission → 401 → scope authorization → replay/operations → schema 422 → preconditions → existence/guards. Cross-checked against native BE01 behavior (`user_handler.go`): absent-body no-op `:102/105–107`; media → 415 `:108–110`; JSON syntax/type → 400 `:124–131`; `parseIfMatch` treats absence/`*` as unconditional `:77–95`; malformed ID → 404 `:207–209`. The chain is internally consistent and the intentional divergences are correctly labeled **product-only** (empty body no-op, charset tolerance, malformed-path 404 — BE02 must not inherit these globally).
- **Conflict C-D (technical correction, exact conflicts identified — no new error policies invented)**:
  1. `api-contracts.md:26` catalogue row `400 /problems/malformed — "JSON/syntax/type errors"` collides with PF03/N1 schema-error rows that map JSON syntax/type schema failures to **422** under the product admission order. The catalogue has **no 422-schema row** and **no 415 row**, while native BE01 uses 415 for media (`user_handler.go:108–110`). The catalogue must gain `415` and `422`-schema rows with problem-type URIs and the `/problems/malformed` wording must be re-scoped (syntax-vs-schema split must be stated one way or the other; the reviewer does not pick the policy).
  2. Problem-type URIs for the PF03 415 / 400-admission / 422-schema rows are **unassigned** in the pinned corpus; they must be assigned before adoption.
- Malformed UTF-8, duplicate decoded names, root handling: N1 vectors cover string escapes and numeric lexemes; duplicate-key rejection is specified product-side (BE02§4 "no duplicate property acceptance"). No contradiction between N1 and PF03 on these.
- N1 "hash includes unknown represented fields before validation as specified": consistent — the framed tuple hashes decoded body content (`backend-http-preparation.md:48–61`) before validation gates; rejection of forbidden actor/hash/derived-state fields is specified (`backend-http-preparation.md:59`) and hash admission of unknown represented fields is consistent with that framing. No conflict found.

**Disposition**: PASS_DOCUMENT_ONLY_WITH_LIMITATIONS.

### 3.4 Q4 — N1: canonical encoding details

Statically recomputed by this reviewer (Python 3.14.4, no execution of `reference_check.py`):

- **79/79 author checks pass** on static self-consistency recomputation; section counts sum exactly: 26+15+16+5+3+14 = 79.
- `example_tuple_sha256` recomputed = `1b29a47c57146de490b71702c214addfe10631977e71204ffd758c8d1790f08a` — matches the recorded value.
- R02 left hash equals the baseline (unchanged expected relation).
- Recursive canonical encoding, numeric lexeme preservation (1/1.0/1e0 fingerprint distinction), absent/null/presence marker handling, header hex/OWS framing: internally consistent across `recommendation.md`, `vectors.json`, `reference-check.json`.
- Method/template/path/precondition tuple: matches `backend-http-preparation.md:48–57` shape (`version`, `method`, `routeTemplate` :52, `path` :53, `body` :54, `preconditions` :55). Per-operation route template/path pinning is still missing in the corpus (correction C-E).
- **Conflict C-A (technical correction, the one adoption blocker)**: ordering vectors — `vectors.json:70` `N1-C14` pairs only `""` vs `U+1F600`; both Unicode scalar ordering and UTF-16 code-unit ordering agree on that pair, so the author evidence cannot distinguish the two orderings. They diverge for strings containing code points U+E000..U+FFFF vs supplementary-plane characters (e.g., U+FFFF vs U+10000). The recommendation text must name the intended ordering explicitly and `vectors.json` must gain a discriminating vector **before N1 adoption**; otherwise canonical hash stability for mixed-plane strings is asserted but unproven.
- Replay authorization/order and actor/key receipt namespace: consistent with `port/matter.go:73–79` (TCmd receipt types), `:86–97` (receipt decodes an immutable snapshot), and `0001_mattercontrol_core.sql:14` `UNIQUE(idp_issuer, idp_subject)` / `:189` response JSONB / `:191` nullable `purge_after` / `:255–263` append-only triggers. No contradiction.
- Limitation (carried): the 79 author checks prove static self-consistency only — they do **not** prove HTTP/client interoperability.

**Disposition**: PASS_DOCUMENT_ONLY_WITH_LIMITATIONS.

### 3.5 Q5 — N2: filing If-Match/expectedCycleNo ordering; no 428 transfer

- N2 keeps ordinary filing observation semantics: `If-Match` is validated **before** `expectedCycleNo` once the body has been admitted as valid. Cross-checked against `filing-model.md`: cycle reopen requires owner/due (`:48`), and owner reopen requires reason + `If-Match` filing revision (`:60`); stage-pair rejection and stale-revision rejection (`:44`, `:79`) sit after precondition checking. No contradiction found; the ordering is consistent with the API precondition-before-mutation order.
- **Do not transfer Filing 428 to Requirement create**: consistent — the BE02§4 framed tuple for Requirement create has `"preconditions": {"ifMatch": null, "ifNoneMatch": null, "expectedRevisions": {}}` (`backend-http-preparation.md:55`), i.e., Requirement create carries **no CAS precondition**, so the 428 Precondition-Required flow used for Filing reopen (`filing-model.md:60`) stays Filing-scoped. Nothing in the pinned corpus transfers it. The edit target below (§9, E-3) records this boundary explicitly so a later adoption edit cannot blur it.
- **Conflict C-B (technical correction)**: `expectedRevisions: {}` is ambiguous on the wire (absent vs present-but-empty). BE02§4 must refine it to an explicit presence-marker semantic ("{} = no revision inputs supplied", vs key absent = tuple shape invalid) so the N1 tuple decoder is deterministic.

**Disposition**: PASS_DOCUMENT_ONLY_WITH_LIMITATIONS.

### 3.6 Q6 — PF04: trusted identity seam

- Trusted issuer/subject → transport-neutral identity seam: consistent with `0001_mattercontrol_core.sql:14` `UNIQUE(idp_issuer, idp_subject)` as the identity key pair. Extraction/verifier staying in the adapter is consistent with `user_handler.go` (native auth plumbing remains adapter-local) and with `backend-http-preparation.md:44` ("Product auth runs before any product use-case invocation").
- No fake-identity runtime flag, no silent verifier fallback, no auto-membership: no contradicting statement in the pinned corpus (`backend-http-preparation.md:44`: "Unknown identity provisioning must be explicitly defined; no implicit user/membership creation is proposed"). PF04 asserts the negatives; the pinned files do not introduce them.
- **Unavailable until product auth exists** (guarantees PF04 correctly leaves out): real issuer/subject extraction from the product transport; verifier strictness (no silent fallback); membership authorization inside the command transaction or read snapshot (`backend-http-preparation.md:44` — verified identity alone grants no Matter access); per-workspace scope authorization (AC-134/AC-135 mechanics, `api-contracts.md:266`). Wiring facts for the product auth seam (`app.go:125, 201–220`, `access.go:95–111/152–162`, `matter_service.go:130/298–319`, `openapi.go:116`) are **NEEDS_SOURCE** (§7).
- Identity-provider reality (actual IdP issuer/subject values, JWKS) is outside document review — remains an architecture/PO/infra decision item (§8).

**Disposition**: PASS_DOCUMENT_ONLY_WITH_LIMITATIONS.

### 3.7 Q7 — Adoption compatibility: exact future edits (none made in this task)

Listed in §9. Separation requested by the task is applied there: technical blockers (§6) vs architecture-adoption decisions vs PO material-scope choices vs infra/limits vs retry conventions (§8). Exact public owner field and legacy codec/validator compatibility are decisions, not defaults — both are placed in §8.

### 3.8 Q8 — Tests and scope

- All **27 BE02 acceptance cases remain NOT_RUN** (this review ran none; static mode). The 79 N1 reference checks are **author evidence only** (statically recomputed 79/79, not executed).
- F10 remains **OPEN**; L4/role-PK **NOT_VERIFIED**; bounds/envelope/traversal and remaining design gates stay open (G3/G4/G5-B/G6 statuses unchanged, §1).
- Mimosa remains blocked; **no BE02 implementation and no Step03B activation follows from these document PASS dispositions**.

## 4. Minimum technical corrections (adoption blockers in the narrow sense)

| ID | Target | Correction | Why blocking for adoption |
|---|---|---|---|
| C-A | N1 `recommendation.md` + `vectors.json` (N1-C14, `vectors.json:70`) | Add an explicit Unicode **ordering rule** (scalar vs UTF-16 code-unit) and a discriminating ordering vector (current C14 pair `""`/`U+1F600` agrees under both) | Canonical hash for mixed-plane strings is unspecified; silent divergence risk on adoption |
| C-B | BE02§4 `backend-http-preparation.md:55` | Refine `expectedRevisions: {}` into an explicit presence-marker semantic (present-empty vs absent), carried into the N1 tuple decoder | Decoder determinism; absent-vs-present ambiguity would change fingerprint/replay behavior |
| C-C | PF01 whitelist (`be02-codex-correction-return.md:11`) vs BE02§3 DTO (`backend-http-preparation.md:38`) | Reconcile the 14-field projection whitelist against the narrower create DTO; state create ⊂ projection and the owning command per late field (`workstreamId`, owner, `dueAt`, `applicabilityReason`); pin the exact public owner-field spelling (PF01 text `ownerActorID` vs internal tag `ownerActorId`) | Two different public field lists in two adopted documents is a contract defect; owner-field naming is explicitly a contract decision |
| C-D | API Problem catalogue (`api-contracts.md:26`) | Add `415` and `422`-schema rows with assigned problem-type URIs; re-scope the `/problems/malformed` "JSON/syntax/type errors" wording against PF03's 422-schema mapping; keep the PF03 415/400-admission/422-schema rows covered | Catalogue currently omits two statuses the product order requires; URIs must exist before any adoption edit |
| C-E | Per-operation route binding | Pin the exact route template/path strings per operation for tuple adoption (BE02§4 gives one example tuple, `:52–53`; no per-op table exists) | N1 binds intent to method/template/path; per-op pinning is the only way adoption stays deterministic |

None of these contradicts the reviewed documents' own claims; each is a gap or cross-document collision that must be closed **in the adopting edits**, not silently repaired here.

## 5. NEEDS_SOURCE (facts outside pinned scope)

Facts marked NEEDS_SOURCE were **not** verified in this review (outside the four pinned source files); no attempt was made to traverse unrelated trees:

- `RequirementRead` / requirement read struct: presence and shape of `asOf`/`sourceRevision` fields.
- `MatterHeader` Go struct fields (history-header producers).
- `internal/adapter/inbound/httpapi/server.go:35/48/90` (route/registration facts).
- `internal/adapter/inbound/httpapi/errors.go:67/97` (native error mapping).
- `internal/adapter/outbound/postgres` app wiring: `app.go:125/201–220` ( UserService + legacy Migrate/PendingMigrations wiring, per `backend-http-preparation.md:19` BG-03).
- `internal/core/... matter_migrate.go:35/66` (product vs legacy migration entry points).
- `internal/adapter/outbound/postgres access.go:95–111/152–162` (authorization queries).
- `internal/core matter_service.go:130/298–319` (command transaction boundaries).
- `internal/adapter/inbound/httpapi openapi.go:116` (schema registration).

Implication: if any of these reveal a conflicting fact (e.g., a header producer absent entirely), the affected disposition does not change (document-only), but the corresponding adoption edit (§9) must be re-checked against the real structures before implementation.

## 6. Architecture / PO decision list (not defaults, not self-adopted)

1. **Owner field public spelling**: `ownerActorId` vs `ownerActorID` (C-C2). Decision, not inference.
2. **Whitelist reconciliation shape**: which command owns each late projection field (C-C). Architecture.
3. **OptionA vs body provenance**: `api-contracts.md:16` places `asOf`/`sourceRevision`/`historyMaterializedThrough` in (or on) every response including bodies; BE02/PF02 optionA keeps volatile provenance out of the selected resource body. The API§1 Provenance row must be reframed to optionA (headers/trailing metadata only) or optionA abandoned. Architecture/PO.
4. **Problem catalogue policy**: exact syntax-vs-schema split (400 vs 422 wording) and the assigned problem-type URIs (C-D). Architecture; URIs are a contract decision.
5. **Operations 200 wrapper validation**: adopt PF02's wrapper-representation-validator requirement into API§1 (`:15`). Architecture.
6. **N1 ordering rule**: scalar vs UTF-16 (C-A). Architecture (with vector evidence required).
7. **Per-operation route/path pinning table** (C-E). Architecture.
8. **Legacy codec/validator compatibility**: whether the BE01 plain codec (`matter_dto.go:103–138`) counts as a legacy codec that must fail closed (PF01) or remains for native routes only; validator compatibility for native routes must not change (`user_handler.go` semantics preserved). Architecture.
9. **Real identity/provider**: actual IdP issuer/subject provisioning rules; no implicit membership creation. PO/infra.
10. **Retention/deadline/skew/limits**: numeric workload, retention, RPO/RTO, payload/field size limits remain deferred to Step 02 per the approved OBD decisions; no numbers are chosen here. PO/infra (previously approved direction, numbers deferred).
11. **Retry conventions**: client retry behavior against the 404 "no committed outcome visible" semantics (`api-contracts.md:15`). Architecture/PO.

## 7. Source/contract compatibility implications

- **BE01 native routes stay untouched**: every product-only divergence (absent-body no-op `user_handler.go:102/105–107`, charset tolerance `:108–110`, malformed-path 404 `:207–209`, `parseIfMatch` unconditional absence/`*` `:77–95`) remains native behavior; BE02 product registration must not reuse or globally modify these paths (`backend-http-preparation.md:20, 86`).
- **BE01 DTO is not the BE02 public body**: `createdResultDTO` lacks schemaVersion (`matter_dto.go:36–42`) and its codec is plain Marshal/Unmarshal (`:103–138`); PF01's projection requires a new persisted codec discriminator + deterministic encoder in the same command transaction (`be02-codex-correction-return.md:11`). Additive migration location is a later bounded implementation design; no legacy receipt rewrite and no append-only guard disabled (`0001_mattercontrol_core.sql:255–263` triggers remain).
- **RequestHash boundary unchanged**: trusted at the port (`port/matter.go:16–26`), internal-only (`matter_dto.go:41`), never caller-supplied (`backend-http-preparation.md:61`).
- **API contract files are not edited here**: §9 lists the exact future edits; the canonical files retain their pinned bytes (`api-contracts.md` sha256 `49ec8aa5…76e75`; `backend-http-preparation.md` `542d3e6f…21531`; `filing-model.md` `632f9c86…60dd`).

## 8. Exact future edits required (not executed in this task)

- **E-1 — API§1 (`docs/architecture/api-contracts.md`)**: (a) Provenance row `:16` — reframe `asOf`/`sourceRevision`/`historyMaterializedThrough` to the optionA placement (response headers/trailing metadata; not part of the stored resource body) or record optionA's rejection; (b) operations row `:15` — add the wrapper-representation-validation requirement (`{status, response, asOf}` wrapper validated independently); (c) Problem catalogue `:26` — add `415` and `422`-schema rows with URIs, re-scope `/problems/malformed`; (d) reference N1 canonicalization for product commands once adopted.
- **E-2 — BE02§4 (`docs/architecture/backend-http-preparation.md`)**: `:55` — refine `expectedRevisions: {}` presence-marker semantics; add per-operation routeTemplate/path pinning (C-E); keep `ifMatch: null` for Requirement create (no CAS transfer, N2).
- **E-3 — Filing L5 (`docs/architecture/filing-model.md`)**: record the N1 canonical-body limitation status `ADEQUATE_WITH_N1_LIMITATION_DOCUMENT_ONLY` (source: `candidate-supplement.json:81`); state explicitly that Filing reopen's `If-Match`/428 semantics (`:60`) are Filing-scoped and are **not transferred to Requirement create**; note that N1 tuple adoption applies to product commands only, never to native filing-stage machinery.

## 9. Tests not run (scope statement)

Not run in this review, by design and by mode: any execution of `reference_check.py` or any reviewed/derived code; all 27 BE02 acceptance cases (NOT_RUN); any HTTP/client interoperability check of N1 framing; any runtime/DB/SQL verification (JSONB behavior, triggers, UNIQUE constraint behavior at runtime); any Go build/test of the BE01 checkout; any client success-header capability verification (NOT_VERIFIED); any product/HTTP coverage claim from the 79 author checks. The 79/79 and `example_tuple_sha256` results in §3.4 are this reviewer's static recomputations, not executions.

## 10. Proposed status

- Task MC-BE02-N1-CONTRACT-REVIEW-R1: **deliverable complete → proposed IN_REVIEW** (independent PO/architecture acceptance of this review is a separate gate).
- PF01..PF04, N1, N2: **PASS_DOCUMENT_ONLY_WITH_LIMITATIONS** (document-only; adoption blocked until §4 corrections C-A..C-E are incorporated via §8 edits E-1..E-3 plus the §6 decisions).
- Explicit non-events: no self-adoption, no code edits, no codec implementation, no SQL/runtime work, no gate bypass, no commit. Mimosa commit gate stays blocked; architecture/PO acceptance and the corrected accepted BE01 source remain separate gates.

## 11. Skipped checks and remaining risk

**Skipped checks** (recorded, not silently omitted): execution-based verification of N1 (reference_check.py and any runtime framing of vectors); HTTP/client interoperability; runtime database verification of JSONB/trigger/UNIQUE behavior; all 27 BE02 acceptance cases; verification of NEEDS_SOURCE facts (§5) including `app.go`, `server.go`, `errors.go`, `matter_service.go`, `access.go`, `openapi.go`, `MatterHeader`, `RequirementRead` structures; the full 32-operation review (explicitly out of scope); client success-header capability; BE01 F01..03 re-review (out of scope by task).

**Remaining risk**: (1) if N1 is adopted before C-A's ordering vector exists, mixed-plane string keys could hash differently between implementations — the highest-severity residual risk; (2) §9 edits E-1..E-3 are not yet applied, so API§1/BE02§4/Filing docs remain internally inconsistent with PF03/N1 until adopted; (3) NEEDS_SOURCE facts could contradict assumed structures (e.g., no real `sourceRevision` producer) — dispositions would not change, but the affected adoption edits would; (4) the 79 author checks prove nothing about real HTTP/client behavior; (5) all numeric workload/retention/deadline/skew decisions remain open per approved deferral — nothing in this review binds them.
