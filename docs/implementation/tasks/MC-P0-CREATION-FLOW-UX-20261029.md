# MC-P0-CREATION-FLOW-UX-20261029

Owner: actual Local Codex. Requested collaborators: Codex Product Manager and Business Analyst subagents. Priority P0 local usability. Proposed status: IN_REVIEW_WITH_VERIFICATION_LIMITATIONS.

Authority/requirements: direct PO request to improve confusing UI creation flows, with PM/BA collaboration. Preserve RULE-001/002/005/006/011/012/017/018, operation permissions and independent state axes. No positioning rediscovery, combined transaction, template generation, automatic membership or provider administration.

Scope: Workspace → Matter → explicit Requirement/Action choice → operational detail; contextual empty-state actions; Document/Filing continuation; actionable Filing prerequisites. Existing client draft/attempt infrastructure is reused. Inputs and reconciled proposals: `docs/design/creation-flow-ux-r1/{business-flow-analysis,product-flow-proposal}.md`. PM and BA own their review documents; Local Codex owns implementation and author verification. No external PM/BA product invocation is claimed.

Source ownership: original branch `codex/unified-project-flow`, initial HEAD `2d41081`; user later supplied completed Claude commits `f8c0928`, `fc09bec`, `20feedb`. Current verified HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`; existing Codex hunks retained. Exact candidate: `docs/testing/p0-final-parallel-20261028/local-creation-flow-20261029/source-manifest.json` (675 regular files; source selection refreshed after legacy-stack removal).

Acceptance and evidence:

- One shared goal-based creation panel on Matter Overview and Work. Controlled disclosure shows one form while retaining both mounted instances. Requirement/Action copy and separate payloads remain distinct; no automatic completion or verification.
- Confirmed Requirement creation uses the canonical Matter work-item route, matching Action. Owner/due/dependencies/proof remain later operations.
- Workspace/Matter empty states link to existing creation controls; Matter affordances retain OWNER-only evidence. Invites are optional in the first-value path.
- Confirmed Document and Filing creation opens the existing detail route. Missing Filing prerequisites yield actionable existing-route links instead of unusable selects.
- Workspace and Matter now bind draft/attempt scopes into Claude's CR-002 implementation. Two real-form remount tests failed before those bindings, then passed with identical original key+payload after remount.
- `make check` backend PASS including 0 lint issues; PostgreSQL tests skipped without MC_TEST_DATABASE_URL. Two Codex goimports issues corrected.
- Frontend check PASS: 54 files / 506 tests; Webpack production build and CSS artifact guard PASS. No new dependency, API, schema, business rule or numeric rate-limit decision added.
- Official browser observed normal SSO sign-in, creation of a new synthetic Workspace and Matter, exclusive type disclosure, retained Requirement input after type switches, Enter activation and canonical Requirement creation/detail. UI displayed `cloud-synthetic-b`; no claim of Synthetic A verification or token/sub inspection. User then took over browser for A; no further browser action was performed.

Reviewers: PM and BA source-only PASS_WITH_LIMITATIONS, with refreshed HEAD/panel addenda. They are independent of implementation authorship, but these are product/semantic source checks, not full technical QA or human usability acceptance. Existing OpenCode review applies only to older pinned scopes; refreshed candidate review pending.

Skipped/open: browser negative-network/reload recovery, full keyboard/focus/mobile/screen-reader matrix, AC-137, A/B isolation, current-source restore, split-role PostgreSQL grants, production directory/rate-limit/cost/release gates. No commit/push/deploy or existing DB/volume deletion.

Detailed commands, hash checks, runtime/resource identity, external return intake and browser evidence: `docs/testing/p0-final-parallel-20261028/local-creation-flow-20261029/return.md`.
