# N1 — exact canonical request fingerprint recommendation

Task MC-003A.8A/N1; Local Codex, technical recommendation owner by direct PO reassignment; priority P0;2026-10-26. Primary coordination branch codex/unified-project-flow; preparation base a62d838791ba188838c4ff00b7b6e265ac775056. **TECHNICAL_RECOMMENDATION_COMPLETE / REFERENCE_CHECKED / NOT_ADOPTED / IN_REVIEW**. Codex is the author and cannot independently accept this recommendation.

The PO asked Codex to take over the former ZCode N1-only handoff and continue to finish the technical deliverable. This supersedes that handoff's recipient and prepared-work status, not historical packet bytes or review evidence. The new artifacts are governance proposal/reference evidence, not production source implementation. Inputs are the exact four-file22660-byte N1 read set, actual OpenCode L2/L5 PASS_WITH_LIMITATIONS and existing candidate API/BE02 excerpts. No external provider was called.

## 1. Decision and compatibility

Choose representation-preserving canonical JSON for the request hash. Absent object members remain absent; explicit null remains null. JSON number token spelling is retained exactly. Consequently1,1.0,1e0 can all be valid numeric values for cycleNo while producing different fingerprints. This is deliberate and avoids silently adding decimal/binary floating-point conversion to the existing BE02 no-number-conversion proposal. No runtime parser or precision/range limit is selected or proven by this document.

This is a proposed local contract format, not a claim of compatibility with an external JSON canonicalization standard. Stable retries must retain number spellings, member presence, accepted preconditions and exact string content. JSON whitespace, member ordering and equivalent string-escape spelling can vary as defined below. A client that reconstructs JSON through a lossy number type may change its fingerprint; implementation must retain a lossless body representation or the encoded request for retry. Server receipt replay must never rebuild the request from a domain-normalized DTO.

No product business rule, route, field, numeric2000/64/128 bound, receipt retention or maximum body size is adopted. Selecting this hash format has cross-command/client compatibility implications and needs architecture disposition before use in product endpoints. If any deployed format/receipts already exist, their version and migration/replay compatibility must first be established; this task did not inspect or migrate product receipts. BE01's supplied-fingerprint service proof does not establish HTTP fingerprint compatibility.

## 2. Proposed canonical body encoding

For a JSON-body command, parse the supplied UTF-8 bytes into a lossless JSON value. No BOM, invalid UTF-8, nonfinite numeric constants, malformed JSON, duplicate decoded object name or unpaired surrogate is admitted. These are proposed generic representation/admission failures400, before authentication; they do not inspect Matter/domain existence. Duplicate checks apply recursively, after escape decoding: names a and \u0061 are the same member name.

The encoder operates recursively:

| Value | Exact encoding |
|---|---|
| Object | Sort decoded member names lexicographically by Unicode scalar value sequence, ascending; emit encoded name:encoded value pairs inside braces, comma-separated, no whitespace. Do not drop unknown or explicit-null members. |
| Array | Emit encoded elements in original order inside brackets, comma-separated, no whitespace. |
| String or object name | Decode equivalent JSON escapes first; emit double quotes, escape quote as backslash-quote and backslash as double-backslash, emit every U+0000..U+001F as lowercase six-character \u00xx escape; emit other scalars directly as UTF-8. No Unicode normalization, domain trimming or case folding. Solidus is emitted without an escape. |
| Number | Emit its original valid JSON number token, byte-for-byte: preserve exponent spelling, decimal fraction and negative-zero spelling. Do not round, use float64, strip zeroes, convert to a string or coerce a string to a number. |
| Boolean/null | Emit lowercase true,false,null. |

Only insignificant JSON whitespace disappears. Control escapes, supplementary-plane scalars, nested objects, large numeric lexemes, duplicate escaped names and negative zero have explicit reference vectors. The numeric token policy intentionally means this is not mathematical-value canonicalization.

An absent body is not a substitute for a JSON null body. Endpoint-specific body presence/media rules remain part of admission; this proposal's reference tuple accepts an actual JSON value and does not manufacture one for a bodyless endpoint. Any future bodyless or behaviorally meaningful query parameter contract must explicitly extend/map the tuple before that endpoint can use this version; no universal32operation conformance is claimed here.

## 3. Deterministic framed fingerprint tuple

Use the following logical tuple, then encode the whole tuple with the same encoder and hash its exact UTF-8 bytes with SHA-256. This object is structural notation; canonical output member order is determined by §2, not by the pretty-print order below. Version1 is a candidate format discriminator, not an adopted endpoint field or a claim of an existing runtime format.

```json
{
  "version": 1,
  "method": "POST",
  "routeTemplate": "/api/v1/filings/{filingId}/observations",
  "path": {"filingId": "synthetic-path-placeholder"},
  "body": {"cycleNo": 1},
  "preconditions": {
    "ifMatch": ["223722"],
    "ifNoneMatch": null,
    "expectedRevisions": {"present": false}
  }
}
```

The route is illustrative structural notation, not catalogue adoption. Bind method and route template from the selected operation, and every path parameter including the already-selected scope ID. A syntactically canonical ID may be supplied by the existing routing/admission contract; do not do a domain lookup or grant authority to create the hash. Do not use caller-chosen route templates or delimiter-concatenated text. Any additional accepted input that can change command behavior must be bound; an endpoint without a complete input mapping cannot adopt this tuple yet.

For the two header slots, preserve null for an absent field. A present field becomes a nonempty list of its original HTTP field-value octet sequences, in occurrence order, after removing only outer SP/HTAB from each value; encode each sequence as lowercase hex. Thus a single ASCII ETag value "7" maps to ["223722"]. An empty present value maps to [""] and differs from absence. No weak/strong ETag conversion, comma-list sorting, ETag unquoting or duplicate-field folding is done by the fingerprint. Usability/legality of these preconditions is validated later under the unchanged endpoint policy. An adapter that only exposes coalesced/normalized header values must prove this representation or propose a versioned mapping before implementation; this reference is not that proof.

expectedRevisions is copied generically from the decoded body: absent -> {"present":false}; present -> {"present":true,"value":<original JSON value>}. Preserve null, empty object, wrong type and numeric tokens here as well. Do not fill absent with{}. Its copy in body is also retained, as required by the existing API tuple fields. expectedCycleNo remains in the complete original body, so its presence/value/token participates without an invented extra global precondition slot. Other command-specific accepted revision fields are likewise already body-bound, subject to explicit endpoint mapping.

Exclude bearer/cookie values, transport request IDs, timestamps and changing transport metadata. The idempotency key and actor identify the receipt lookup namespace, not caller-controlled trusted hash content; current authentication/authorization still use trusted server identity. Do not change an existing scope, actor or key-age policy through canonicalization.

For valid Requirement create, BE02 uses this same tuple with its own registered method/template/path and exact decoded title/outcome strings. Refine the earlier BE02 example's absent expectedRevisions:{} to the presence marker above; actual member absence remains absent in body. For that currently planned strict create DTO the extra supplied field may fail validation anyway, but it must not be silently erased before fingerprint/replay.

## 4. Validation and replay ordering

Admission can parse generic JSON, check duplicate names/scalar validity and compute the representation fingerprint. It does not run domain DTO defaults, current schema validation, CAS, target lookup or stage guards to decide whether an authorized stored receipt can replay. An authentication/current authority failure cannot disclose a hash mismatch or stored body.

After scope lock and current read authority for scope/all represented Matters, compare the candidate hash to the receipt: same -> immutable stored outcome; authorized different ->422idempotency-key-reuse; lost authority ->uniform404 with no body disclosure. Existing key-age and receipt transaction rules remain as specified. Absence of a visible outcome does not prove final absence. Never change the key/body/preconditions to try to determine a previous write outcome.

Only when no replay applies does a new command continue to schema/body validation422, preconditions, scoped existence422, guard and atomic effects. Unknown/forbidden body members are still in the hash; they fail the existing new-command schema rather than being dropped. That makes adding a field to a committed same-key request a changed-intent422, not an accidental successful replay.

Numeric validity is distinct from token preservation. For cycleNo, the candidate accepts an exact positive integral numeric value, so1,1.0,1e0 pass that check. Fractional1.5,zero/negative and string"1" fail body422 for a new command. Wrong JSON type at the document root is body422 after auth/replay when syntax is otherwise admitted, not a new generic admission400. No storage integer range, precision or runtime allocation policy is invented; approved schema/resource bounds must be separately pinned before product activation. No underflow/overflow or silent coercion is permitted.

N2's narrow candidate order is unchanged: after valid new-command body, If-Match missing428/stale412 first, then expectedCycleNo required-missing422/supplied-stale412, then scoped existence. Both missing with valid body returns428. Bad body with missing If-Match returns the earlier body422. This document does not independently close N2 or revise the already-reviewed family ordering.

## 5. Required observable consequences

| Inputs, all other tuple fields fixed | Expected outcome |
|---|---|
| optional type body with cycleNo omitted vs null | Both may persist NULL; different canonical body/fingerprint. Same key across the two ->authorized422, not replay. |
| cycleNo1 vs1.0 vs1e0 | All positive-integral values; three distinct body/fingerprint representations. |
| object reorder/outer whitespace only | Same canonical bytes/hash. |
| decoded stringa vs escaped \u0061 | Same canonical bytes/hash. |
| precomposedé vs e+combining acute | Different string sequences/bytes/hash; no normalization. |
| -0 vs0 | Different fingerprint tokens; both invalid cycleNo for a new command. |
| original matching hash with now-stale live CAS | Replay after current authority, without running current CAS validation first. |
| changed If-Match/body/expectedCycleNo/expectedRevisions/path | Different tuple, hence different hash except theoretical SHA-256 collision; authorized same-key reuse422. |
| only bearer/request ID changes, same trusted actor/authority | Fingerprint unchanged; authentication and current permission still independently required. |

Full normative/reference examples and actual checker results are in [vectors](vectors.json) and [reference-check evidence](reference-check.json). The checker implements only a model of this proposed encoding and the small replay/body-order table. It imports no backend/frontend/harness source, uses no DB/HTTP or live receipts and does not prove wire/runtime integration or standards compliance. Tests of this model must not promote T*/22CT/51INTA results.

## 6. Exact future edits and review boundary

After adoption only: API Contracts§1 Idempotency row would replace the undefined canonical-body term with a reference to this encoding and tuple mapping, with the section inserted beside§1 conventions. Filing L5 would state same storedNULL/different representation hash explicitly. BE02 preparation§4 would reference the same definition, presence marker and lossless number/header behavior, rather than define a second algorithm. No canonical architecture file or BE02 proposal has been rewritten by this deliverable.

The implementation work, if later authorized, must reach lossless request admission/duplicate detection, DTO parsing, header acquisition, receipt fingerprint handoff, client retry body retention and interoperability tests. Current product source behavior/feasibility/L4 compatibility is NOT_VERIFIED. This is a concrete compatibility delta to be assessed with the existing contract decision set, not a PO business-policy reapproval request or an assignment to implement all of these now.

N1 status: **TECHNICAL_PIN_SUPPLIED / REFERENCE_CHECKED / PENDING_INDEPENDENT_CONTRACT_ACCEPTANCE**. Do not call the original Medium finding independently CLOSED. Original reviewer and ZCode snapshots/manifest remain immutable. No additional author clarification is pending and the old ZCode handoff is superseded. One consolidated contract review can assess this new N1 definition plus the existing N2 pin; no full32operation/repeated author loop is assigned. F10OPEN;OC01..07CLOSED_DOCUMENT_ONLY;L4NOT_VERIFIED;catalogue32/fieldsroutesboundsfiltersNOT_ADOPTED;G3NOT_VERIFIED/G4PENDING/G5-Bremainingitemsopen/G6REWORK_REQUIRED/STEP03BNOT_AUTHORIZED. Source-import/BE01/BE02/INT-A/F08/UX concurrent work is preserved.

Skipped: production implementation/build/integration/security/DB/browser tests, external provider dispatch, canonical contract adoption, Git stage/commit/push and lifecycle. Risks: clients/headers may not retain the required representation; reference tests do not prove product compatibility, resource behavior or independent acceptance.
