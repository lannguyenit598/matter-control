#!/usr/bin/env bash
# Explicit, idempotent mapping of the two PO-reported synthetic Cloud identities to NEW product users
# in the task-owned RUN database. It inserts `users` rows only: no memberships, no workspaces, no email
# matching, no change to existing local-IdP users or history. Public values only; no secret is read.
set -euo pipefail
CONTAINER="${MC_RUN_PG_CONTAINER:-mc-p0-claude-pg}"
DB="${MC_RUN_DB:-mc_p0_run}"
PGUSER_NAME="${MC_RUN_PG_USER:-mcp0}"
ISSUER="https://matter-control-legal-dev-fm2k48.au1.zitadel.cloud"
# Cloud subjects of the synthetic users A and B (reported by the PO; confirmed by the first real login).
A_SUB="396984919567415686"
B_SUB="396984802881878406"
docker exec -i "$CONTAINER" psql -U "$PGUSER_NAME" -d "$DB" -v ON_ERROR_STOP=1 <<SQL
INSERT INTO users (id, idp_issuer, idp_subject, display_name) VALUES
  (gen_random_uuid(), '${ISSUER}', '${A_SUB}', 'cloud-synthetic-a'),
  (gen_random_uuid(), '${ISSUER}', '${B_SUB}', 'cloud-synthetic-b')
ON CONFLICT (idp_issuer, idp_subject) DO NOTHING;
SELECT display_name, idp_subject FROM users WHERE idp_issuer = '${ISSUER}' ORDER BY display_name;
SQL
echo "mapped Cloud subjects A/B into ${DB} (idempotent); grant memberships explicitly through the product"
