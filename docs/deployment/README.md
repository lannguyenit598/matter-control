# Deployment profiles and open gates

[ADR-006](../architecture/adr/ADR-006-workers-cloud-run-supabase-r2-topology.md) selects the
pilot default: Next.js/Cloudflare Workers, Go/Cloud Run, Supabase PostgreSQL, private R2 and
ZITADEL. [ADR-007](../architecture/adr/ADR-007-portable-fe-be-deployment-profiles.md) describes
proposed App Hosting and Compute Engine alternatives. Preserve their explicit approval status.

- [Pilot runbook](pilot-deploy-runbook.md): the ONE canonical operator procedure — roles/
  migration order, deployment bindings, smoke expectations, backup/retention, rollback truth,
  the decision register (ADR-007 packet D-IDs + pilot PD-IDs) and the deduplicated three-tier
  findings register (source-backed revision 2026-11-04).
- [Portable profile runbook](portability-runbook.md): builder/profile selection and host switching.
- [Unresolved provider decisions](portability-cloud-validation-packet.md): qualification and
  workload/cost decisions; a local build is not permission to activate them.
- [Backend configuration](../../apps/backend/docs/operations.md),
  [BFF bindings](../../ops/adr006/README.md), [database grants](../../ops/adr006/db/README.md).

Treat values/examples as inputs to verify, not known provider state. Runbooks retain dated
observations and unresolved gates. Before any deployment, confirm actual account/region/quota,
HTTPS origin, IdP apps/users, Supabase TLS/pooling, R2 authorization, backup/recovery, workload
budget and release approval. No zero-cost guarantee or real-data authorization is implied.
Deployments are not triggered by the disabled example under `ops/deploy/ci/`.
