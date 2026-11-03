# MatterControl

An operational control plane for legal teams: coordinate Matters, Requirements, Actions,
documents, evidence, filings and accountable changes. Completion and verification remain
independent; attachments alone never establish readiness.

## Repository

| Path | Purpose |
|---|---|
| [apps/backend](apps/backend/README.md) | Go product API, PostgreSQL migrations and contract tests |
| [apps/frontend](apps/frontend/README.md) | Next.js application and server-side authentication/BFF |
| [ops](docs/operations/README.md) | Database roles, local tooling, backup and deployment profiles |
| [docs](docs/README.md) | Current architecture, application contract and operator documentation |

## Start locally

Follow the [local setup guide](docs/operations/local-development.md). Use synthetic data and your
own configured identity provider. There are no committed runtime credentials or working private
keys. The [API walkthrough](ops/local/walkthrough/README.md) is a separate loopback-only synthetic
backend environment; it is not a browser login or production profile.

## Checks

- Backend: `cd apps/backend` then `make check`. Set `MC_TEST_DATABASE_URL` only to a disposable
  PostgreSQL fixture to run database suites; without it those suites skip.
- Frontend: `cd apps/frontend` then `pnpm check`, `pnpm build:webpack`, and `pnpm build-storybook`.
- Deployment profile renderer: `node --test ops/deploy/profiles.test.mjs`.

See each app's instructions for tool versions, additional browser tests and durable-state suites.

## Deployment and status

The selected pilot topology is Workers + Cloud Run + Supabase + private R2 + ZITADEL.
[ADR-006](docs/architecture/adr/ADR-006-workers-cloud-run-supabase-r2-topology.md) records that
selection; [ADR-007](docs/architecture/adr/ADR-007-portable-fe-be-deployment-profiles.md) records
proposed alternative profiles. Local builds and tests do not establish cloud, cost, residency,
security, human usability or release acceptance. Follow the [deployment guide](docs/deployment/README.md).

`main` contains maintained product source and documentation. Development prompts, task ledgers,
review packets, screenshots, prototypes and test-run logs remain in the coordination archive;
see [repository policy](CONTRIBUTING.md) and [integration provenance](docs/release/integration.md).
