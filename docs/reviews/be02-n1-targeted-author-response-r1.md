# BE02/N1 — targeted author response to independent review R1

Actor Local Codex; branch codex/unified-project-flow; base/head a62d838791ba188838c4ff00b7b6e265ac775056. **AUTHOR_CLARIFICATION_SUPPLIED / IN_REVIEW / NOT_ADOPTED**. Original author proposals, independent report and canonical API/BE02/Filing documents remain unchanged. This addendum closes no architecture or product gate by itself.

## C-A — factual clarification, no change to ordering norm

The review says N1-C14 compares an empty key to U+1F600. Actual vectors.json70–72 compares **U+1F600 and U+E000**. U+E000 is a private-use character which can be visually empty; it is not the empty string. Scalar order puts E000 before1F600, while UTF-16 code-unit order puts D83D (emoji leading surrogate) before E000. Existing expected bytes therefore already distinguish the two. recommendation.md23 explicitly selects Unicode scalar order; reference_check.py54–55 uses sorted(value).

[Escaped/code-point/UTF8/UTF16 evidence](../testing/parallel-review-intake-20261026/unicode-c14-clarification.json) contains four assertions computed by a small personal stdlib check; the original reference program and its 79 checks were not executed. Preserve the independent report verbatim and request a narrow factual erratum for C-A. No new encoding choice, canonical edit or claim of client interoperability is introduced.

## C-B — exact existing presence semantics

The future adopting edit must replace the old BE02 example with the already specified N1 marker:

| Input body | Tuple expectedRevisions |
| --- | --- |
| member absent | `{"present":false}` |
| member present as `{}` | `{"present":true,"value":{}}` |
| member present as null | `{"present":true,"value":null}` |

The body preserves actual presence/value. The reviewer suggestion that bare `{}` could mean no revision input must not collapse absent versus present-empty; recommendation.md56 already forbids that. Requirement create still has absent If-Match represented as null and no create CAS. This is a proposed future E-2 edit, not adoption.

## C-C — reconcile representation shape without inventing owners

BE02 paragraph38 proposes ten fields: identity, matterId, title/outcome, execution/dependency/verification state, verificationApplicability, proofEpoch, revision. PF01 proposes the same concepts plus applicabilityReason, workstreamId, public owner and dueAt. The command request itself admits only title/outcome; it is a different shape from both response candidates.

| Group | Proposed reconciliation | Remaining authority/evidence |
| --- | --- | --- |
| Common ten fields | One codec must use exact contract-approved public names over trusted immutable outcome | Architecture adoption of public resource DTO |
| applicabilityReason/workstreamId/public owner/dueAt | If included, values must come from the trusted stored snapshot; no fabricated null/default or later live-row replay | Owning-command semantics and available stored fields remain NEEDS_SOURCE/decision |
| Public owner spelling | Keep unresolved; internal ownerActorId cannot decide public ownerActorID vs ownerActorId | Exact public name requires contract authority |
| RequestHash/receipt internals | Always excluded from public projection | Existing PF01 invariant retained |

Do not activate HTTP until the selected complete projection is supported or a bounded reduced representation is explicitly approved.

## C-D — proposed catalogue delta, not a policy decision

Retain PF03's ordered candidate semantics: unsupported media415; malformed syntax/encoding/duplicate decoded names/admission400; after current authorization and applicable replay ordering, new-command schema422. Candidate URI names for review are `/problems/unsupported-media-type` (415), existing `/problems/malformed` narrowed to admission/syntax400, and `/problems/schema-validation` (422). These names are proposals, not new adopted API entries. Preserve endpoint-specific existing replay conflict/error conventions and native routes. Architecture must adopt exact status/URI/catalogue wording before implementation.

## C-E — only one scoped candidate operation mapping

| Field | Requirement create candidate |
| --- | --- |
| method | POST |
| routeTemplate | `/api/v1/matters/{matterId}/requirements` |
| path | matterId, from the admitted canonical path value |
| body | Complete admitted decoded JSON before schema/replay policy; preserve unknown/presence/numeric token distinctions as N1 defines |
| ifMatch / ifNoneMatch | Header presence/octet encoding per N1; actual absent values null; create If-Match remains not applicable, not Filing428 |
| expectedRevisions | Exact presence marker above copied from complete original body |
| receipt namespace | Authenticated actor/key stay lookup scope, not extra fingerprint content |

No other operation is mapped or activated here. GET/bodyless routes and all32operations do not automatically adopt the tuple; each behavior-affecting input requires explicit mapping.

## E-1..E-3 — proposed edit checklist and adoption boundary

- E-1 API§1: add a candidate reference to one N1 definition; selected resource body excludes ALL volatile provenance JSON members. Keep proposed explicit HTTP headers; “trailing metadata” must not be read as permission to add a JSON metadata member. Give operations wrapper an appropriate independent validator; adopt exact catalogue changes only after authority review.
- E-2 BE02§4: presence-marker correction and the scoped route table above; retain create CAS-none. Do not create a second encoder specification.
- E-3 Filing L5: reference the proposed N1 absent/null/fingerprint rule and ordinary-observation N2 precondition order. Filing If-Match/428 stays Filing-scoped; no transfer to Requirement create.

NEEDS_SOURCE items from review§5 remain unverified source facts, not new defects or implementation authorization. Resolve exact source paths through the retained source manifest before another scoped read. No source checkout, SQL/runtime, product codec/route or canonical document was changed here. BE01 source PASS remains; Mimosa/accepted corrected commit is a separate gate. The 27 BE02 tests stay NOT_RUN; author79reference checks remain historical author evidence; full F10 and Step03B stay open.

Next: include this small delta in a targeted independent factual/candidate review, followed by architecture/PO adoption decisions. No full review/author loop or forced adoption is requested. Skipped: reviewed code execution, backend implementation, canonical edits, DB/HTTP, credentials, provider calls and commit. Risk: candidate field/URI/header choices still need authority and implementation evidence; a document PASS does not supply them.
