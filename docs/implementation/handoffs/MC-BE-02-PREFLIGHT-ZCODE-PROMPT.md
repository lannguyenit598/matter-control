# MC-BE-02-PREP — ZCode read-only technical preflight

I assign actual ZCode to review the feasibility of the prepared BE02 boundary while OpenCode independently reviews BE01. This prompt's human delivery activates only the local read-only preflight described here; Codex has prepared it, not dispatched it. You authored BE01: do not review/approve your own implementation or replace OpenCode's verdict.

Governance root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`.
Reference backend: `/private/tmp/mattercontrol-backend-be01`, branch `codex/mc-be-01`, HEAD136eae6ad403ae3ede797faf6a0d6179c3b95685 plus nine-file uncommitted patch SHA25633297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e. This is not an accepted corrected commit.

## Identity and allowed actions

Acknowledge actual tool/version/model/provider, current source identity and this scope. Use the currently configured session/provider/model and existing permitted quota. No login, paid retry, provider/model/settings/security-hook change. No subagent or forwarding to another provider. You are not alone; preserve all concurrent owners' edits.

You may read the named governance documents below and source files explicitly listed in `docs/testing/be02-preparation/inputs.json`, and run ordinary read-only hash/Git status/diff checks. Read applicable instructions first; Semble may be used solely for the listed source symbols/path context. Do not index or read unrelated repositories. Additional necessary source/rule files require identifying their exact path and reason; report missing inputs rather than widening the source set silently. Never read credentials or runtime private config.

Read root AGENTS.md and `/Users/nguyenvanlan/.codex/RTK.md`; current-workflow.md and project-status.md for current owners/status only; MC-BE-02-PREP.md; backend-http-preparation.md; inputs.json; acceptance-cases.json; then the named input paths after verifying bytes/SHA256. Prefix shell commands with rtk. If source changes while you review, report drift and its affected gaps; do not reset/stash/fix or claim the new source matches the original packet.

No source/governance writes, branch/commit/stage/merge/push, go/make/test/build, DB/SQL, process/container/network/provider setup or runtime requests. Do not bypass the existing commit block or edit immutable provisioning evidence. Return **text only in this conversation**; no output files are required or authorized.

## Required return, narrowly scoped

For BG01..BG08 in backend-http-preparation.md, return one of CONFIRMED_TECHNICAL_GAP / PROPOSED_RESOLUTION / NEEDS_AUTHORIZED_SOURCE / DECISION_REQUIRED, with exact source reference and the smallest compatible change:

- Product graph/migration isolation and explicit fail-closed identity/policy wiring; preserve native User/C01/INT-A.
- Candidate two Requirement endpoints and operations lookup; identify the smallest required new port methods/fields, no generic framework or business feature.
- Exact DTO/fingerprint vectors: field order/whitespace/escape equivalence, scope/content differences, duplicate/unknown/actor/hash/derived-field rejection. Clarify proposed status precedence; never trust a JSON actor/hash.
- Immutable wire replay/provenance: compare version-pinned projection with persisted wire bytes, choose a technical recommendation and compatibility conditions. Do not fill new provenance from the current clock or later live resource.
- BG08 strong ETag versus changing body asOf/sourceRevision: compare stable-resource representation with metadata outside the body versus explicitly changing representation/CAS conventions. Do not assume no-store or a weak ETag fixes If-Match. Recommend, do not adopt.
- Errors including boundary_due, unavailable, outcome_unknown and cancellation; separate technical mapping from INT-D09 policy. No new numeric defaults. Clarify known-abort versus lost-ack semantics and own-key reconciliation.
- Any missing acceptance case in the prepared matrix, exact proposed ID/trigger/expected behavior and why it is needed.

Return a minimal ordered source-change list with callers/tests/config/docs affected; distinguish what can be implemented only after BE01 acceptance from what also needs INT-D02/07/09 or a material representation decision. If a test-only principal/explicit policy seam could permit bounded local HTTP adapter tests before a real provider is selected, describe that as a separately approvable local scope, never product authentication or a runtime default. Do not add such code now.

This is owner technical feasibility output, not independent acceptance or architecture/PO approval. Existing candidate32 operations, F08/F10,22CT/51INT-A IDs/results and MC002/MC003A/STEP03B/security/cost/recovery gates remain unchanged. Do not start BE02 implementation, request duplicate BE01 work or rerun accepted baselines. Stop after text return; include skipped checks and remaining risks.
