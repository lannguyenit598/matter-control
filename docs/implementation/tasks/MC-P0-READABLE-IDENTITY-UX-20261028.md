# MC-P0-READABLE-IDENTITY-UX-20261028

Owner: actual Local Codex. Priority: P0 local usability. Proposed status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS. Repository: primary coordination checkout; branch `codex/unified-project-flow`, HEAD `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`. Dirty source is identified by the delivery manifest, not HEAD alone.

Requirement: direct PO request to replace technical identifiers in navigation, member lists and pickers with recognizable names, and stop requiring manual user-ID entry. PO additionally approved a local/dev OWNER-only directory of provisioned users in the same ZITADEL issuer (at most 20 results); production organization visibility remains undecided.

Scope: readable workspace breadcrumb, member lists and membership forms; bulk work-item/person selection; display-name fallback; two additive member-candidate reads and opt-in configuration. Stable URL/wire identifiers, membership command authorization, CAS, receipts and unknown-outcome handling remain authoritative. No IdP administration, new provisioning, schema migration, production deployment or Git commit is assigned.

Dependencies: existing W1–W7 source and Design R9 semantics; approved local runtime; explicitly provisioned synthetic users. Inputs: previous `local-admin-medusa-r1/source-manifest.json`, current primary source and PO directory approval. Outputs: source changes, API documentation, tests, `local-readable-ux-r2/` delivery manifest/delta/logs/runtime. Failed initial attempt retained in `local-readable-ux-r1/`.

Acceptance and author evidence:

- Breadcrumb/member options display names; selected values remain correct internal IDs. Membership tests retain one-send behavior after an unknown outcome.
- Matter OWNER reads active workspace candidates in an authorized snapshot. Workspace directory is disabled by default and OWNER-only; PostgreSQL also rechecks active ownership and same issuer, excludes current members, bounds results and searches literal case-insensitive names.
- Bulk selection supplies current item revision automatically; existing preview invalidation, per-row outcomes and same-attempt recovery tests pass.
- 48 frontend files / 483 tests, typecheck/lint/format/agent checks, Webpack production build and compiled-CSS guard pass. Relevant backend race suites and real PostgreSQL directory test pass.
- Updated owned runtime serves API health/readiness and login/session/CSS over HTTP. This does not prove authenticated member-picker interaction or rendered/accessibility acceptance.

Reviewer: independent source reviewer and human/browser acceptance pending. No external agent invocation claimed. Existing MC-002/product/security/release gates remain open. Exact results, retained resources and limitations: `docs/testing/p0-final-parallel-20261028/local-readable-ux-r2/return.md`.
