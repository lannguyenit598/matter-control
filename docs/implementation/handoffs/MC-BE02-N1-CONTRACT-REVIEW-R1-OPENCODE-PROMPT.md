# BE02 PF01..04 and F10 N1/N2 — combined independent contract review R1

Task MC-BE02-N1-CONTRACT-REVIEW-R1; P0; actual owner OpenCode, independent nonauthor. Requirements FR-001/008/018/020, AC-101/118/134/135/147/153, NFR-001/002 and F10 N1/N2. **READY_NOT_DISPATCHED / READ_HASH_STATIC_ONLY**. No R4, running PostgreSQL or accepted BE01 commit dependency for this document review.

Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; prepared base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. Verify current root/branch/HEAD and applicable instructions, RTK and Semble before exploration. You are not alone: preserve all other owners' edits. No reset/stash/stage/commit/merge/push or shared status/task edits. Record actual OpenCode tool/version/model/provider and nonauthor independence; use the current permitted route only, no login/switch/new paid route. Human delivery assigns this task; preparation alone is not dispatch.

READ_HASH_STATIC_ONLY. No execution/import of reviewed code/reference models/scanners/suites; no credentials/private env, process signals/probes, HTTP/SQL/DB/Docker/lifecycle, build/install/download, provider calls or messaging other agents. Small personal read/hash/JSON/static utilities are allowed. Verify the pinned read set before and after review; mismatch means NEEDS_INPUT_REFRESH, not silent pin repair. Write only the unique outputs below after checking absence. A collision means STOP/report. Inputs remain read-only. No need to create a worktree for read-only inputs with disjoint new output directories; no source/index mutation is authorized.

## Inputs and review boundary

Start with `docs/testing/parallel-work-20261026/be02-n1-inputs.json`. Verify direct pins, all nine original correction-manifest inputs and all eleven N1 output-manifest payloads. Read the Codex BE02 correction return/PF assertions, HTTP preparation and original/additional acceptance cases; N1 completion/recommendation/reference source/vectors/results/execution/provenance; API/Filing/auth-decision/permission context and prior L2/L5 supplement pinned there.

For four source facts only, the pin manifest identifies `/private/tmp/mattercontrol-backend-be01/internal/adapter/outbound/postgres/matter_dto.go`, its `migrations_mattercontrol/0001_mattercontrol_core.sql`, `internal/adapter/inbound/httpapi/user_handler.go` and `internal/core/port/matter.go`. Read/hash only; no Git/index/Mimosa operations in that checkout. The reviewed baseline is 136eae6 plus patch 33297560, not HEAD alone. Do not substitute a new accepted commit or reopen the accepted BE01 F01..03 review.

## Acceptance questions

1. PF01: versioned deterministic public projection from immutable snapshot; same retained encoder for first response/replay, stable bytes/status/headers, legacy/unknown-codec fail closed. No RequestHash exposure, mutable live-state replay or JSONB wire-byte preservation claim.
2. PF02: all volatile provenance genuinely outside selected resource body; truthful source for history headers; strong ETag/revision/codec invariant; operations wrapper has its own representation validator. Separate implementable technical contract from unresolved representation/adoption decisions and client success-header capability.
3. PF03 + N1: consistent content-type/media/JSON/auth/permission/replay/schema error precedence; malformed UTF-8/duplicate decoded names/root handling; hash includes unknown represented fields before validation as specified. Identify exact conflicts rather than inventing new error policies.
4. N1: recursive canonical encoding, Unicode scalar ordering/string escapes, numeric lexeme preservation, absent/null/presence and header hex/OWS framing, method/template/path/precondition tuple. Verify 1/1.0/1e0 fingerprint distinction, replay authorization/order and actor/key receipt namespace. Read reference code/vectors statically; 79 author checks do not prove HTTP/client interoperability.
5. N2: ordinary filing observation keeps If-Match before expectedCycleNo after admitted valid body; do not transfer Filing 428 to Requirement create with no CAS.
6. PF04: trusted issuer/subject to transport-neutral identity seam; extraction/verifier stay in adapter. No fake-identity runtime flag, silent verifier fallback or auto-membership. Identify which trust/authorization guarantees remain unavailable until product auth exists.
7. Adoption compatibility: list exact future edits required in API§1, BE02§4 and Filing L5 without editing those canonical files. Separate technical blockers from architecture adoption, PO material-scope choices, real identity/provider, retention/deadline/skew/limits and retry conventions. Exact public owner field and legacy codec/validator compatibility are decisions, not defaults.
8. Tests and scope: all 27 BE02 cases remain NOT_RUN; 79 N1 reference checks are author evidence. F10 L4/role-PK, bounds/envelope/traversal and remaining design gates stay open. Mimosa remains blocked; no BE02 implementation or Step03B activation follows from document PASS.

Return per-PF and N1/N2 disposition, minimum technical corrections or PASS_DOCUMENT_ONLY_WITH_LIMITATIONS, a concise architecture/PO decision list, and exact source/contract compatibility implications. Avoid a full 32-operation/architecture review or duplicate author loop. If a required fact lies outside pinned scope, mark NEEDS_SOURCE rather than traverse unrelated private/product trees.

## Outputs and stop

Only these new paths:

- `docs/reviews/be02-n1-opencode-contract-review-r1.md`
- `docs/testing/be02-n1-contract-review-r1/` containing `review-inputs.json` and `checks-log.json`.

Verify absence first; preserve other sessions. Return actual identity, base/head/pins, questions answered, exact findings/lines, tests not run, output bytes/hashes and proposed status. No self-adoption, code edits, codec implementation, SQL/runtime, gate bypass or commit. Architecture/PO acceptance and corrected accepted BE01 source remain separate gates. End with skipped checks and remaining risk.
