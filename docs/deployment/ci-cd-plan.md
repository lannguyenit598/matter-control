# CI/CD Plan — Step 02

Owner: Codex — DevOps. Status: **PROPOSED / NOT_INSTALLED / NO_DEPLOYMENT**. Exact templates are pinned in repository-audit.md. This plan does not select a hosting topology or install workflows into either source repo.

## Source and quality admission

Use governance requirement/architecture/ADR revisions plus exact backend/frontend SHAs in a candidate manifest. Source repo remains separate from governance; no Git remote or release destination inferred. Review untrusted contribution code in jobs without deployment credentials. Pin actions/toolchains/dependency locks and use least-privilege read permissions by default; do not expose secrets to fork-controlled code. Keep synthetic fixture data, redact logs and apply artifact expiry after approved retention policy.

Backend's existing .github/workflows/ci.yml and Makefile declare generated SQL, formatting/tidy, lint/architecture dependency guards, race/unit and disposable-PostgreSQL tests. Frontend declares typecheck/lint/format/unit/agents:check, build and Playwright. These are source facts; no successful workflow execution is claimed. Review exact versions and script side effects before activating or running them. Do not treat skipped PostgreSQL/integration jobs as PASS.

## Candidate pipeline after owner/architecture direction

| Stage | Proposed checks / output | Owner / gate |
|---|---|---|
| Requirements + architecture input | Approved FR/RULE/AC, pinned architecture/ADR and source manifest, exact allowed candidate | Codex; PO major decision acceptance |
| Backend verification | Template checks plus scoped authorization, revision/idempotency, atomic audit, graph/cycle/concurrency/expiry/version tests; use disposable DB only | ZCode; OpenCode independent results |
| Frontend verification | Existing scripts/build, exact adapter compatibility, server/action/cookie/session/redirect/header/cache tests, 50/200-row and failure states | Antigravity; OpenCode verification |
| Worker packaging/preview if selected | Pin Wrangler/adapter/workerd; record bundle/startup/CPU/memory/request assumptions and local preview smoke | Codex with Antigravity/ZCode; no production-limit proof from dev mode |
| Schema/object lifecycle | Migration forward/compatibility and restore rehearsal; DB/blob reconciliation, authorization and backup manifests | Claude design, ZCode implementation, OpenCode validates |
| Staging only if authorized | Environment-scoped credentials, nonproduction synthetic dataset, measured quota/failure behavior and smoke; no wildcard bypass routes | Separate environment/resource/account approval required |
| Release candidate | All required checks, independent review, approved workload/cost/lifecycle policy and data protection requirements, reproducible artifacts | Architecture/implementation/release gates separately |
| Production | Human go/no-go, exact revisions, rollback/forward recovery plan, observed usage/cost/health | NOT_AUTHORIZED in Step02 |

## Credentials and remote actions

Use an account/environment scoped token only after the target, minimum scopes and secrets destination are approved. Environment variables in repository files are names only; never values. Some Wrangler secret commands immediately deploy a version, so they are not setup-time read-only checks. Do not create credentials, remote databases/buckets, bindings or paid plans as a side effect of a build. This step performs none.

## Recovery and cost controls

Record database migration compatibility and forward recovery, object version/source manifest and previous code version together; application rollback alone cannot undo committed schema/data. Retention, legal holds and RPO/RTO remain unresolved numeric/lifecycle inputs. A reversible test environment and restore proof are required before production assurances.

Use explicit job timeout/concurrency, short necessary diagnostic artifacts, cancellation rules and quota ceilings consistent with approved workload. [GitHub billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) depends on actual plan/repo visibility/runner and storage. [Full-service budget](free-tier-budget.md) includes all mandatory origin/database/backup/identity/storage/traffic services. No cost guardrail or paid-service hard cap was installed.
