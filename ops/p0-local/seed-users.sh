#!/usr/bin/env bash
# Explicit, idempotent product-user provisioning for the task-owned RUN database.
# Inserts `users` rows only (issuer + ZITADEL subject -> product user). It creates NO
# workspaces or memberships and is never run against the *_test databases.
# Public inputs only (runtime/provisioning.json); no secret is read or printed.
set -euo pipefail
cd "$(dirname "$0")"
CONTAINER="${MC_RUN_PG_CONTAINER:-mc-p0-claude-pg}"
DB="${MC_RUN_DB:-mc_p0_run}"
PGUSER_NAME="${MC_RUN_PG_USER:-mcp0}"

python3 - "$CONTAINER" "$DB" "$PGUSER_NAME" <<'PY'
import json, subprocess, sys
container, db, user = sys.argv[1:4]
prov = json.load(open("runtime/provisioning.json"))
issuer = prov["issuer"]
sql = []
for u in prov["test_users"]:
    # single-quote escaping for the two text values; ids and names are synthetic
    q = lambda s: "'" + s.replace("'", "''") + "'"
    sql.append(
        "INSERT INTO users (id, idp_issuer, idp_subject, display_name) "
        f"VALUES (gen_random_uuid(), {q(issuer)}, {q(u['id'])}, {q(u['username'])}) "
        "ON CONFLICT (idp_issuer, idp_subject) DO NOTHING;")
subprocess.run(["docker", "exec", "-i", container, "psql", "-U", user, "-d", db, "-v", "ON_ERROR_STOP=1"],
               input="\n".join(sql) + "\n", text=True, check=True)
PY
echo "seeded users into ${DB} (idempotent)"
