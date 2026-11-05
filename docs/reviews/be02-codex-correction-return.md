# BE02-PF-01..04 — Codex technical correction return

Task MC-BE-02-PREP; Local Codex takes over the outstanding ZCode recommendation under the PO's direct subscription-recovery instruction,2026-10-26. Branch codex/unified-project-flow, base/head a62d838791ba188838c4ff00b7b6e265ac775056. **FOUR_TARGETED_CORRECTIONS_SUPPLIED / IN_REVIEW / NOT_ADOPTED**. These correct the proposal, not an accepted BE01 code defect. No product source implementation, new endpoint activation or independent acceptance.

All9correction inputs/69379bytes still match the original manifest2bad1924…dc8deb. Actual source reference remains136eae6 plus reviewed staged patch33297560, not HEAD alone. The staged bytes and three frozen INT-A source heads were verified unchanged; [recovery checks](../testing/zcode-recovery-20261026/checks.json) record this. Original ZCode return/manifest stay immutable. No new ZCode/provider invocation is needed.

## PF01 — choose versioned deterministic projection

**Choose option(a): an explicitly versioned deterministic public projection of immutable stored data, retaining each encoder.** Current createdResultDTO at matter_dto.go36–42 has no schema version and includes RequestHash; encode/decode at103–137 persists JSON to JSONB. It is an unversioned internal persistence snapshot, not original HTTP bytes. Do not expose it wholesale or claim a JSONB wrapper preserves textual bytes.

For future new product commands, persist a trusted response codec/schema discriminator together with the immutable outcome data in the command transaction. Storage location/additive migration belongs to the later bounded implementation design; no legacy receipt is rewritten or append-only guard disabled. A retained v1 projection must deterministically encode only the public Requirement resource fields: id,matterId,title,outcome,executionState,dependencyState,verificationState,verificationApplicability,applicabilityReason,proofEpoch,workstreamId,ownerActorID(as the contract-approved public owner field),dueAt,revision. Exact owner-field naming is a contract decision, not inferred from internal ownerActorId. No RequestHash, internal receipt key, mutable live row or newly computed derived status enters that body.

Create first response and every create replay call the **same retained encoder version over the same committed snapshot**, after successful commit/current authorization. Re-encoding occurs; the guarantee is deterministic reproduced representation under a retained codec, not verbatim stored HTTP bytes. JSONB formatting/order is irrelevant only because the codec owns deterministic output and decodes preserved typed values losslessly. Unknown codec/corrupt snapshot fails closed as an internal error, never falls back to a new encoder/live state/re-execution. Encoder version/whitelist/time/numeric encoding and fixed media/content-coding behavior need byte-golden tests before activation. Request N1 canonical encoding and response codec are different contracts; do not silently reuse the request's number-token policy to encode typed persisted results.

Old unversioned receipts require an explicitly retained legacy decode/projection mapping derived from the actual baseline, with compatibility fixtures. They cannot be relabeled v1 or claimed to reproduce a historical wire response that BE01 never exposed. Until that mapping is evidenced, product HTTP must not expose/re-execute ambiguous legacy outcomes. Missing retained codecs block compatibility rather than trigger data migration or receipt rewriting.

Create status201 and stable Location/ETag are derived from contract-pinned immutable data/representation, with the discriminator retained so later changes do not silently alter replay. Delivery-only request ID/Idempotent-Replayed and current authorization/provenance metadata can vary in headers and are not replay body bytes. An own-key operations lookup has its own wrapper/status and may embed the same immutable public outcome; it does not impersonate the original201 response. Save-scope/all represented-Matter reauthorization,404-not-final-absence and retention gates remain. Proposed wrapper/body shape must explicitly replace the candidate operations body's volatile asOf location if optionA below is adopted.

## PF02 — stable body, provenance genuinely in headers

Retain **optionA** as a technical recommendation, subject to the material representation decision. The selected JSON body contains only the versioned public resource state above; asOf,sourceRevision andhistoryMaterializedThrough do **not** appear anywhere inside that selected body, including an envelope metadata member.

Propose header names MC-As-Of,MC-Source-Revision,MC-History-Materialized-Through. These are names for review, not implemented/adopted headers. MC-As-Of is the actual command/snapshot DB instant for the response; MC-Source-Revision is the actual observed event fence. MC-History-Materialized-Through requires a proven source with its exact semantics. Do not replace it with wall-clock, zero or an unrelated temporal boundary field merely because one is available. If required provenance is unavailable, retain the fail-closed/reduced-scope decision gate rather than invent a value. Existing truthful-fence intentions are retained; this is not proof that a specific BE01 field satisfies every history contract.

With one fixed public representation/codec/media/content-coding per endpoint version and every body-affecting state change bumping the resource revision, candidate ETag"<revision>" can continue to map to revision CAS. Equal ETag must mean equal selected representation bytes within its applicable resource representation; codec changes cannot keep an unchanged strong validator while changing body bytes. A representation-version change therefore needs explicit negotiated/versioned resource identity/validator policy before deployment; no silent codec swap. no-store or weak ETags do not fix this invariant.

Recommend create201,replay201 and GET200 encode the same public resource representation when describing the same resource revision. GET uses the actual current authorized snapshot; create replay always uses the original committed revision, not GET's newer revision. Operations lookup wrapper is a separate representation and must not reuse the nested resource's ETag as a validator for its whole wrapper. Reads/lookup may return later truthful provenance headers while their immutable resource body stays stable; headers must accurately identify what their values describe.

Impact: API§1/endpoint schemas/examples, response DTO/codec, retained receipt metadata, server adapter and frontend response-envelope/header consumption need a single reviewed update. Current shared client success headers are not observable in INT-A, so product client support is **NOT_VERIFIED**. If browser CORS is later required, expose only approved public metadata header names under the approved topology; do not enable CORS or pick a host/provider now. Native User/INT-A ETags and body bytes remain unchanged. Real identity, provenance availability, wire shape and representation choice still gate activation.

## PF03 — one proposed media/decoder/status matrix

This is a **product-only candidate**, distinct from native bindJSON415/400 behavior and the existing candidate API400 type row. It intentionally proposes422 for syntactically valid body schema/type errors. No current handler or historical fixture is changed.

Order: generic HTTP media/JSON admission ->authentication401 ->current scope/represented-Matter authorization ->authorized replay ->new-command schema/body422 ->endpoint preconditions ->scoped existence/guards/effects. Keep the accepted filing-family ordering and N2 tie scoped to ordinary observations; this does not apply a filing428 rule to Requirement create.

| Input | Proposed result / position |
|---|---|
| Missing Content-Type for a JSON-body command |415 before JSON parsing |
| Syntactically valid unsupported media type, including text/plain or unselected application/*+json |415 |
| Malformed Content-Type syntax or duplicate charset parameter |400 format admission |
| application/json, optional one charset=utf-8 (case-insensitive name/value, valid quoted form accepted) |Continue; JSON is UTF-8. No charset alias or other parameter is implicitly accepted. |
| Unsupported charset or other syntactically valid unapproved media parameter |415 |
| Malformed JSON, trailing second document, empty required JSON body, BOM/invalid UTF-8/unpaired surrogate |400 generic admission, same N1 rule |
| Duplicate decoded property name, recursively, including escaped aliases |400 generic admission, same N1 rule |
| Valid JSON with wrong root/field type, unknown property, forbidden actor/hash/derived property |422 body validation for a new command, after auth/replay; never silently drop it before hashing |
| Well-typed field failing semantic validation |422 for a new command |
| Unsupported media plus malformed body |415 media result first; do not parse unselected content |
| Missing/invalid identity plus otherwise admitted schema-invalid body |401 first |
| Lost Matter access plus otherwise admitted schema-invalid body |Uniform404 before body details |
| Authorized same key but changed body/precondition fingerprint |422idempotency-key-reuse before new-command schema/CAS |

For create with CAS scope none, valid new-command body plus any supplied If-Match yields proposed400precondition-not-applicable; absence does not produce428. For ordinary filing observations only, retain N2 If-Match-before-expectedCycleNo candidate. No retryAfter number, IdP, retention or body-size value is selected. Malformed header handling/other command families outside this bounded matrix still require their own existing endpoint mapping, not extrapolation from native code.

Fingerprint: use the single [Codex N1 candidate](../design/step-03a/handoff/step-03a-8a/codex-n1-canonical-body-r1/recommendation.md), no trailing newline in hashed UTF-8 bytes. Keep absent/null and number tokens distinct, decoded string content exact, no Unicode/domain normalization, principal excluded from hash, trusted actor/key retained as receipt identity. No DTO defaulting/unknown-field removal before replay. N1 remains not adopted; its79reference checks are not product HTTP coverage.

Propose T25 path pin for review: decode the path parameter once under the route parser, then require the selected lowercase canonical UUID spelling; percent-encoded variants yielding exactly that same decoded identifier bind the same canonical path ID. Uppercase/noncanonical IDs and invalid/double-encoded residual escapes are candidate generic400path-format failures, without resource existence lookup. This is a product routing proposal, not native INT-A uppercase404 behavior or a verified router guarantee. Never double-decode, use caller route templates, fold arbitrary strings or bypass scope authorization. Actual router handling must be tested before adopting this equivalence.

## PF04 — transport-neutral verified identity seam

Keep Authorization extraction/token syntax/verification at inbound/identity adapters. A verifier must establish issuer,subject and applicable token constraints using the separately selected identity contract. Illustrative adapter signature only: VerifyToken(ctx,token)->VerifiedIdentity{issuer,subject}. Any core lookup then accepts issuer/subject primitives (or an equivalent transport-neutral verified identity), for example LookupActor(ctx,issuer,subject)->ActorID; it does not accept HTTP headers/request objects and does not itself treat unverified caller text as verified claims. Preserve issuer/subject identity exactly under the approved identity mapping; do not invent case-folding or auto-provisioning.

The composition root wires the trusted verifier adapter and lookup into the inbound boundary, which supplies the already-trusted ActorID to the existing use-case port. Domain/service stay free of HTTP/JWT/provider SDK concerns. Verified identity alone grants no Matter access: existing in-transaction/snapshot memberships and role checks remain authoritative. Missing verifier/policy fails product startup; unknown identity rejects without implicit user or membership creation. Real provider/claim/clock/failure policy remains INT-D02, not selected here.

Synthetic identities are reachable only by explicit test construction/DI, never a product runtime config/env flag, fallback verifier or anonymous/debug route. Those local synthetic tests would not prove real authentication. Do not implement the previously suggested core ResolveRequest(ctx,headers) interface. No source port has been edited.

## Minimal impacts and acceptance addendum

Later authorized changes must cover receipt codec/version storage/read projection and own-key authorization; public DTO/error/admission/fingerprint adapters; product composition/identity lookup; provenance header/client consumption; revision/representation compatibility tests and docs. These do not require a generic framework, legacy User changes, native binary substitution or modifying old receipts/evidence.

[PF acceptance supplement](../testing/zcode-recovery-20261026/be02-correction-assertions.json) adds deterministic expectations under existing BE02-T07/T13/T14/T21 and T25/T26/T27, without renumbering the original27planned cases. All product cases remain NOT_RUN. Main review checks: deterministic re-encode under retained codec (not JSONB verbatim); legacy/unknown-codec refusal; variable header provenance with identical body/revision; same resource revision codec-change validator protection; complete media/JSON precedence; verified-only lookup boundary and no runtime test-principal selection.

Status: PF01..PF04 **CORRECTION_SUPPLIED / PENDING_INDEPENDENT_CONTRACT_REVIEW**, not independently CLOSED. Existing source/evidence BE01PASS stands but corrected commit remains MimosaBLOCKED. Bounded BE02 implementation/base, representation/identity/retry/retention and truthful provenance decisions are still prerequisites. No full architecture rewrite or second ZCode correction loop is needed. F08/F10/INT-A/UX/catalogue32/22CT/51INTA and STEP03B gates unchanged.

Skipped: product code, tests/build/DB/HTTP/browser, identity/provider selection, external review dispatch, commit/scan retry and lifecycle. Risk: these coherent recommendations still need contract/source compatibility and client/codec/real-auth implementation evidence before activation.
