# MC-P0-IDP-PREFLIGHT — Local Codex, public static diagnosis

Owner actual Local Codex subagent `idp_preflight`; priority P0. Read the shared README in this directory completely; its frozen-source, ownership, safety, reporting and no-duplicate-session rules apply. You are not the external Claude/OpenCode/ZCode agent and must not invoke one.

Goal: remove uncertainty around the known ZITADEL redirect rejection/audience blocker by preparing a **concrete reviewable operator plan**, without touching live IdP or secrets. Requirements: FR-008/018, W1 auth/session/API boundary, relevant NFR security and denied/revoked scopes. Actual login remains NOT_RUN.

Frozen inputs: `ops/p0-local/{README.md,prepare.sh,provision.sh,provision-continue.sh,docker-compose.yml}`, app public `.env.example`/`.env.local.example`, backend product config and ZITADEL verifier, frontend OIDC flow/config/session and auth routes, current contract/author return. Read exact files; private runtime receipts/keys are absent intentionally. Verify selected pins.

Investigate:

1. Expected issuer/topology/client types/redirects/logout/dev-mode/audience values across producer scripts and consumers. Trace exact source lines for each; distinguish web client id, project id and API introspection client id. Verify whether source reveals a defect or only a hypothesis; do not call the prior runtime error reproduced in this task.
2. Official version-appropriate support for HTTP-loopback redirect configuration and authenticated introspection audiences. Resolve docs through Context7, then official docs/source if needed. Cite URLs supporting specific configuration fields; no guessing endpoints or uploading internal code/ids to research tools.
3. Produce a minimal operator change proposal with **read-before-write** current-app inspection, exact intended fields/values derivable from public source, what must still be discovered live, how to preserve unrelated client settings, validation/rollback criteria, redaction requirements and precise authority needed. No actual API call or command execution; use placeholders only for genuinely unknown ids/credentials, label them explicitly. If exact supported mechanism cannot be verified, mark it NEEDS_OPERATOR_DISCOVERY rather than inventing an API.
4. Audience verification plan using a permitted real end-user login/introspection, not admin/machine token substitution. Strict checks stay on. Separate successful redirect configuration from session establishment and Go principal/authorization evidence.

Write only new `docs/testing/p0-parallel-20261027/idp/` after absence check, containing `return.md` and `inputs.json` (selected pins/tool/doc references). Include compact source mismatch table, confirmed vs inferred findings, reviewable proposed operator delta and exact next bounded action. No new scripts/frameworks or source fix. Target a concise usable report.

Acceptance: source/docs support every concrete recommendation; unknown live configuration remains UNKNOWN; no private read/mutation/probe/provider payload; operator has a specific plan rather than another generic "fix redirect" request. Return to parent using collaboration, not cross-thread messaging. Skipped work and remaining risk at end.
