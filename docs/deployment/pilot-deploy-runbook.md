# Pilot deploy runbook — ADR-006 (Workers + Cloud Run + Supabase + R2 + ZITADEL)

- Maintained by actual ZCode; last source-backed revision 2026-11-04 (task
  `MC-ZCODE-PILOT-DEPLOY-READINESS-20261103`, base `048776b`, branch
  `codex/pilot-deploy-readiness-20261103`).
- Status: **RUNBOOK — nothing here has been executed against a provider.** Every provider command
  is a template with operator-fill values. **NOT_RUN** marks provider actions; **LOCAL-VERIFIED**
  marks behavior proven by the local tests this revision ships (see the register below).
- Scope: synthetic-data pilot. No real legal data, no SLA, no production claim, no `$0` claim
  (decision D2 interpretation applies: alerts-before-cost, not cost-impossible).
- One canonical procedure. The six review inputs behind this revision (deploy-plan HTML + five
  reports) stay untracked outside the product tree; the deduplicated register below is the
  maintained surface. Deployment README and the ADR-007 packet links are unchanged.
- Release boundary: an executable, locally verified deployment PREPARATION. It is not a new
  application, not a platform migration, not an actual cloud deployment, and not a promise that
  every provider gate is closed. Independent review and PO approval remain separate.

## 0. Tooling, accounts and the operator variable file

Required tools (record versions in the release note; the repository pins its own when stricter):
`docker` (fixtures), `go` ≥ the pinned go.mod version, `golangci-lint` v2.x (`.golangci.yml`
pins `version: "2"` — other v2.x minors run), `node` ≥ the FE `.nvmrc`, `corepack`/`pnpm` per
`packageManager`, `wrangler` pinned in the repo (4.156.0), `gcloud` ≥ 490, `aws` CLI (R2 checks),
`jq`, `openssl` ≥ 1.1.1 (LibreSSL lacks `-starttls postgres`; use a Homebrew OpenSSL or run the
probe from a container), `psql`/`pg_dump`/`pg_restore` client majors ≥ the server's (run them in
a container if not installed locally).

Accounts/inputs the operator must already have (all missing until provisioned):
Cloudflare account + Worker name + workers.dev subdomain + R2 bucket (private) + bucket-scoped
token; GCP project + billing link + Artifact Registry + two service accounts (serving +
migrator, PI-02) + org-policy status for public ingress; Supabase project (Singapore) + project
ref + session-pooler host + CA cert + admin connection; ZITADEL instance (pilot) + web app + API
app + API key JSON; password manager (BFF key ring, role passwords, tokens).

The operator file is a **living file**: each phase lists the variables it sets; re-source after
every phase that fills values. Secrets NEVER go in it — they live in the password manager /
secret store; the file holds non-secret identifiers only. zsh-safe:

```sh
mkdir -p ~/.mc-pilot && chmod 700 ~/.mc-pilot
cat > ~/.mc-pilot/env.sh <<'EOF'
# Non-secret identifiers only. Values marked (phase) are filled by that phase; re-source after.
export MC_SRC=$HOME/mc-deploy            # (P0) clean worktree of origin/main
export RELEASE_SHA=""                    # (P0) git rev-parse HEAD of MC_SRC
export GCP_PROJECT=""                    # (P0)
export GCP_REGION=asia-southeast1
export AR_REPO=mattercontrol
export SA_RUN=""                         # (P4) mcapi-run@<project>.iam.gserviceaccount.com
export SA_MIGRATE=""                     # (P4) mcapi-migrate@<project>.iam.gserviceaccount.com
export SB_REF=""                         # (P2) Supabase project ref
export SB_POOLER=""                      # (P2) <ref>.pooler.supabase.com (Session pooler, 5432)
export R2_ACCOUNT=""                     # (P3) Cloudflare account id
export R2_BUCKET=mattercontrol-pilot-objects
export WORKER_NAME=mattercontrol-pilot
export CF_SUBDOMAIN=""                   # (P3) workers.dev subdomain
export APP_ORIGIN=""                     # (P3) https://${WORKER_NAME}.${CF_SUBDOMAIN}.workers.dev
export OIDC_ISSUER=""                    # (P5) https://<pilot-instance>.zitadel.cloud (no trailing /)
export OIDC_WEB_CLIENT_ID=""             # (P5)
export OIDC_API_CLIENT_ID=""             # (P5)
export ZITADEL_PROJECT_ID=""             # (P5) the resource project audience (see §5 audience)
export OUT=""                            # (P7) render output directory (one per render)
export IMAGE=""                          # (P6) .../mcapi@sha256:<digest>
export API_URL=""                        # (P8) Cloud Run service URL
# Admin DB connection — NO password here; psql prompts or ~/.pgpass (0600) supplies it:
#   host=$SB_POOLER port=5432 dbname=postgres user=postgres.$SB_REF sslmode=verify-full [sslrootcert=$SB_CA]
# Helper (zsh): create a secret from stdin, refuse empty values, never echo them.
mksecret(){ local V; read -rs "V?Value for $1: "; echo
  [ -n "$V" ] || { echo "empty, aborted" >&2; return 1; }
  printf '%s' "$V" | gcloud secrets create "$1" --data-file=- \
    --replication-policy=user-managed --locations="$GCP_REGION"; }
# Grant one secret to specific SAs (per-secret IAM; secret must exist first).
bindsecret(){ local s=$1; shift; for sa in "$@"; do
  gcloud secrets add-iam-policy-binding "$s" --member="serviceAccount:$sa" \
    --role=roles/secretmanager.secretAccessor; done; }
EOF
chmod 600 ~/.mc-pilot/env.sh && source ~/.mc-pilot/env.sh
```

Password generation: `openssl rand -hex 24` (URL-safe without encoding). Base64 values can
contain `/` (structurally breaks connection-URL parsing) and `+` (client-dependent) — proven
synthetically by `ops/backup/scheduled-dump.test.sh` (§7 note). Store every generated value in
the password manager FIRST; nothing secret is typed into a command line or logged.

## 1. Findings register (three tiers, deduplicated from the six review inputs)

Legend: owner/type: **SRC** = fixed in this candidate's source (with its local test), **OP** =
operator action at deploy time, **PO** = Product Owner/provider decision, **PRV** = provider-side
qualification (needs real account). Status: FIXED (locally verified), READY (procedure in this
runbook, execution NOT_RUN), OPEN (needs the named decision/authorization). Every A/F/C/Z/R and
comprehension item maps to a row here or its listed parent; the exhaustive per-finding map lives
in the task's private disposition document linked from the release note at candidate SHA.

### Tier 1 — first-deploy blockers

| # | Finding (parent IDs) | Owner/type | Exact source | Local test/receipt | Closure condition | Status |
|---|---|---|---|---|---|---|
| 1 | `b1-roles.sql` cannot run first on a fresh DB — grants on not-yet-created tables abort under `ON_ERROR_STOP=1` (F1, C1, R1) | SRC | `ops/adr006/db/b1-roles.sql` (now bootstrap-only, no table/function grants), new `ops/adr006/db/b1-runtime-grants.sql` | RED receipt (EXIT=3 at :69 on 048776b) + `TestB1OperatorFileSequence` (green) | operator runs the split files in §3 order on the pilot project | FIXED |
| 2 | Passwords were set after migrate (A1) | SRC | §3 order: passwords step 2, migrate step 3 | `TestB1OperatorFileSequence` executes that exact order | §3 executed on the pilot | FIXED |
| 3 | Runtime/migrator schema resolution required a DSN `search_path` the pooler may drop (A2, C7, R14) | SRC | role-level `ALTER ROLE … SET search_path = mcapp` in the bootstrap file | `TestB1OperatorFileSequence` migrates and probes with NO DSN search_path | `SHOW search_path`/`current_schema()` probes on the pilot (§3 step 7) | FIXED (provider probe READY) |
| 4 | Supavisor `role` GUC / startup-param forwarding doubt (C7, R3) | SRC+PRV | role settings apply server-side per login (not pooler-forwarded); client runtime params verified locally; pooler forwarding of `statement_timeout` stays a provider check | `TestB1OperatorFileSequence` SHOW statement_timeout with client param | pilot §3 step 7 SHOW probes through the session pooler | FIXED (provider probe READY) |
| 5 | Search EXECUTE grant missing for `mc_runtime` (A4, C4, R11) | SRC | `GRANT EXECUTE ON FUNCTION mcapp.mc_search_key_v1(text) TO mc_runtime` in the runtime-grants file | B1 mirror suites incl. `SuiteSearch` as mc_runtime; file-order test calls the function | Search works on the pilot only with the flag decision PD-4 | FIXED |
| 6 | Search cursor key absent from deployment surface (A7, R24) | SRC | optional `MC_SEARCH_CURSOR_KEY` secret-reference in the renderer/templates (absent ⇒ feature stays honestly unavailable) | `profiles.test.mjs` optional-key tests | render + deploy with/without PD-4 | FIXED |
| 7 | Worker deployment variables missing / hand-editing tracked source (A9, F8) | SRC | renderer `worker` profile renders `wrangler.vars.json` + exact `--var` flags; tracked `wrangler.jsonc` untouched | `profiles.test.mjs` worker tests + `wrangler deploy --dry-run --var` gate receipt | operator deploys with rendered flags (§5) | FIXED (deploy NOT_RUN) |
| 8 | Cloud Run public ingress had no invoker binding; allUsers blocked by org policy (A10, C9, F7) | SRC+OP | declarative `run.googleapis.com/invoker-iam-disabled: 'true'` in the service template (official doc, re-checked 2026-11-04); allUsers alternative documented | `profiles.test.mjs` ingress test | service applies; org constraint `run.managed.requireInvokerIam` checked at P4 | READY |
| 9 | CA mount for pgx `sslrootcert` paths was missing in rendered templates (A3, C5, R12) | SRC | optional `DATABASE_CA_SECRET` mounts `/secrets/dbca` in service AND migrate-job | `profiles.test.mjs` CA tests; `TestTLSVerifyFullPaths` (trusted/wrong CA/wrong host) | laptop probe (§4 step 1) decides whether the operator sets it | READY |
| 10 | Constrained non-superuser bootstrap never proven (A5, C6, R2/R3) | SRC | bootstrap file self-grants `createrole_self_grant` (SET/INHERIT) at role creation; file-order test runs it as CREATEROLE-only admin on PG17 | `TestB1OperatorFileSequence` (constrained admin path) | P2.1 provider probe: `SHOW createrole_self_grant` + `rolcreaterole`; pilot §3 executed as project admin | FIXED (provider gate READY) |
| 11 | amd64 images (A11 item 2) | OP | build with `--platform linux/amd64` or Cloud Build | — | §4 step 2 manifests linux/amd64 | READY |
| 12 | Hex passwords (R5) | SRC | `openssl rand -hex 24` documented in §0, `ops/adr006/db/README.md` | URL round-trip check in `ops/backup/scheduled-dump.test.sh` | operator generates hex | READY |
| 13 | Duplicate `MC_OIDC_CACHE_TTL` in `.env.example` (F12/plan note, R-notes) | SRC | removed the `0s` duplicate; the 30s default + 0s explanation kept once | — | — | FIXED |
| 14 | Audience doc conflict (C5/Stage6#1/R4 elephant) | SRC | `verifier.go` Config comment, `operations.md`, `.env.example` now pin the resource PROJECT audience; verifier checks unchanged | `TestVerify_ProjectAudienceAmongAudIsAccepted` + `TestVerify_ClientIdOnlyAudienceIsRefused` | first login through the pilot IdP confirms; 401-on-valid-session fallback = re-render | FIXED |

### Tier 2 — sustained-operation requirements

| # | Finding | Owner/type | Exact source | Test/receipt | Status |
|---|---|---|---|---|---|
| 15 | `MC_BACKUP_SCHEMA` documented but ignored — whole-database dump (C11, R10) | SRC | `scheduled-dump.sh` validates the selection, passes `-n` per schema as argv, refuses unexpected TABLE DATA in the archive | `ops/backup/scheduled-dump.test.sh` (24 checks incl. auth/storage exclusion + restore to NEW target) | FIXED |
| 16 | Dump authority undefined (mc_owner NOLOGIN; mc_runtime cannot read mc_bff) (C11/R10) | SRC | script header + §7 name the working authorities (project admin member of mc_owner) | rehearsal receipt | FIXED |
| 17 | BFF key ring never persisted (R6) | OP | §5 step 3: password manager FIRST, then `wrangler secret put`; rotation keeps prior versions (§9) | — | READY |
| 18 | `latest` secret-version rollback limitation (C13) | DOC | §9 rotation: a previous code revision + `latest` secrets is NOT an exact previous-secret rollback; rotation order documented | — | DOC-FIXED |
| 19 | Secure-erasure promises (rm -P/shred) (plan P5, R-notes) | DOC | §10: operator custody + protected storage; no erasure claim on SSDs | — | DOC-FIXED |
| 20 | `/readyz` keep-alive claim (F10, plan A11/P11) | DOC | §8: platform probes + documented Supabase auto-pause resume; scale-to-zero is a cold start, not an outage signal | — | DOC-FIXED |
| 21 | BFF cleanup path (A8, F9, R23) | OP | `go run ./cmd/mcbffcleanup` from the operator machine (manual path); no new image; image unchanged | — | READY |
| 22 | Workers/DB budget mislabeled ("BFF 20×2" App Hosting numbers) (F10, C8, R18) | DOC | Appendix A budget rebuilt (client slots vs per-role pools vs max_connections vs fan-out) | — | DOC-FIXED |
| 23 | Supabase Free auto-pause (plan N2) | OP+PO | §8: manual resume documented; paid tier is PD-1 | — | READY |

### Tier 3 — feature-scope / operator choices

| # | Finding | Owner/type | Closure |
|---|---|---|---|
| 24 | People-directory flag for the pilot (A6, C10, plan N3) | PO | PD-3; feature flag off unless approved for that environment; directory lists only provisioned product users (no self-registration dependency), but the exposure boundary is still a PO call |
| 25 | Search in the pilot (A4/A7, plan N4) | PO | PD-4 (default: absent; feature degrades cleanly) |
| 26 | Hyperdrive / pool flags / new backup image / Scheduler (F4, C8, R10) | PO | NOT added; re-evaluate only if the pilot budget appendix shows pressure |
| 27 | Rate limits, monitoring beyond budget alerts, secret-version pinning | PO | unchanged out-of-scope; see §9 limitation row 18 |

## 2. Decision register

ADR-007 packet IDs are reused ACCURATELY (D3 = VM region, D4 = VM TLS — not residency/rate-limit
shorthand). Pilot-only choices get stable PD-IDs. Approval status is real: nothing here is
approved by this runbook; §1 status columns and this table are inputs for the PO review, not
decisions.

| ID | Decision (source) | Options | Recommendation | Needed by | Approval status |
|---|---|---|---|---|---|
| packet D1 | Which alternative profiles to qualify (packet) | none / App Hosting / CE / both | none for the first pilot | P6+ | OPEN — PO (default: skip; profile A only) |
| packet D2 | Billing exposure alerts | budget alert only / + hard cap | alert 1/5/10 USD, no hard cap | P4 | OPEN — PO |
| packet D3 | VM region (packet: Compute Engine profile) | asia-southeast1 / us-* free tier | n/a unless D1 selects CE | — | OPEN — PO (skip if D1=none) |
| packet D4 | VM TLS ingress (packet) | Caddy / LB / Tunnel | n/a unless D1 selects CE | — | OPEN — PO (skip if D1=none) |
| packet D5 | Platform transport auth | none (application auth) / Cloud Run IAM | none (declared in the template via invoker-iam-disabled) | P4/P8 | ACK — consistent with ADR-007 Decision item 6 (transport boundary; asymmetry remains a PO security/cost decision); no new approval sought here |
| packet D6 | App Hosting preview support | accept / downgrade Next | n/a (profile A only) | — | OPEN — PO (skip if D1=none) |
| packet D7 | Numeric workload bounds (in-flight 10, concurrency 10, maxScale 3, pending 5 MiB) | accept as pilot defaults | accept | P4 | OPEN — PO (packet D7: accept as pilot defaults or set from measured workload; numeric workload deferred to Step 02 by step-01-approval 2026-10-24; OBD-09 values remain OPEN; values PO-owned per ADR-007 Decision item 5) |
| PD-1 | Supabase plan (plan N2) | Free (auto-pause after inactivity, no PITR) / Pro | Free for the synthetic pilot + §8 manual resume | P2 | OPEN — PO |
| PD-2 | Workers plan (plan N1) | Free / Paid $5/mo | decide AFTER the §5 dry-run receipt + real CPU observation (bundle gzip is NOT CPU qualification) | P5 | OPEN — PO |
| PD-3 | `MC_LOCAL_PEOPLE_DIRECTORY=true` for the pilot (A6) | off (add members via seeded SQL/API) / on for pilot | off by default; if on: pilot-only env var, never committed to the template | P8 | OPEN — PO |
| PD-4 | Metadata Quick Search in the pilot (A4/A7) | absent (clean degradation) / enabled via secret | absent unless the PO wants it; then one shared key, all instances | P7 | OPEN — PO |
| PD-5 | ZITADEL instance + MFA policy (plan N5) | reuse dev instance / new pilot instance; admin MFA / end-user MFA | new pilot instance; admin MFA required; end-user MFA separate | P5 | OPEN — PO |
| PD-6 | Residency acceptance (plan D3 shorthand) | Workers edge global + R2 hint + ZITADEL region | accept for synthetic pilot, explicitly NOT a residency exception | P2/P3 | OPEN — PO |
| PD-7 | First-release recovery (R16) | drop/recreate the project on first-release DB failure / retain-state forward-fix only | retained-state diagnosis + forward fix; destructive recreate needs separate explicit approval of the exact resource | any phase | OPEN — PO |
| PD-8 | Supabase CA mount (`DATABASE_CA_SECRET`, A3) | no mount (system roots verify) / mount `/secrets/dbca` from a Secret Manager CA | decide from the §4 step 1 laptop probe; mount only if the probe fails; never downgrade sslmode | P7 | OPEN — probe result + operator |

## 3. Database — roles, passwords, migrations, grants (in this exact order)

All psql steps run as the Supabase project admin via the session pooler with `ON_ERROR_STOP=1`.
A partial run is never a success. Files are the split operator deliverables
(`ops/adr006/db/README.md`); the Go tests execute them verbatim in this order.

1. **Bootstrap** (roles/schemas/default-privileges, no table grants):
   ```sh
   psql "$SB_ADMIN_CONN" -v ON_ERROR_STOP=1 -f "$MC_SRC/ops/adr006/db/b1-roles.sql"
   ```
   PG16+ required. As a non-superuser CREATEROLE admin the file's first statement sets
   `createrole_self_grant` so the admin keeps the SET/INHERIT rights the OWNER-to-owner and
   role-setting statements need; on a superuser connection it is harmless.
2. **Passwords** (operator step BEFORE migrate — role GUCs exist now, roles authenticate):
   generate `openssl rand -hex 24` → password manager → then in psql (`\password` keeps values
   out of logs): `\password mc_migrator`, `\password mc_runtime`, `\password mc_bff`;
   `mc_maintenance` stays NOLOGIN until the cleanup job is activated (§7).
3. **Migrations as the migration identity** (never the serving identity; PI-02):
   ```sh
   MC_DATABASE_URL="postgresql://mc_migrator.${SB_REF}:<PW>@${SB_POOLER}:5432/postgres?sslmode=verify-full[&sslrootcert=<CA>]" \
     go run ./cmd/mcapi migrate     # or the rendered migrate-job.yaml (§4)
   ```
   NO `search_path` in the DSN: the role-level setting resolves mcapp server-side. Adding
   `&search_path=mcapp` explicitly still works (client startup parameters override role
   defaults). The migrate command validates the full config but never reads the OIDC key or
   contacts the IdP (proven: `TestMigrateProductNeverReadsOIDCKeyOrContactsIdP`) — do not grant
   the migration SA OIDC-key access.
4. **Runtime grants** (per-table, sequences, function hardening, Search EXECUTE):
   ```sh
   psql "$SB_ADMIN_CONN" -v ON_ERROR_STOP=1 -f "$MC_SRC/ops/adr006/db/b1-runtime-grants.sql"
   ```
5. **BFF state** as the admin (database-level CREATE) + ownership alignment:
   ```sh
   psql "$SB_ADMIN_CONN" -v ON_ERROR_STOP=1 -f "$MC_SRC/ops/adr006/bff-state.sql" \
     -c "ALTER TABLE mc_bff.state OWNER TO mc_owner"
   psql "$SB_ADMIN_CONN" -v ON_ERROR_STOP=1 -f "$MC_SRC/ops/adr006/db/b1-bff-grants.sql"
   ```
6. **Idempotency**: re-running 1/4/5/6 is supported and tested; grant re-runs are no-ops.
7. **Probes (provider, NOT_RUN until §3 runs on the pilot)**:
   ```sh
   # migrator: role GUC applied at login, schema resolved by the role setting
   psql "host=$SB_POOLER port=5432 dbname=postgres user=mc_migrator.$SB_REF sslmode=verify-full" \
     -c "SHOW role" -c "SHOW search_path" -c "SELECT current_schema()"
   # runtime: fresh login WITHOUT DSN search_path resolves mcapp
   psql "host=$SB_POOLER port=5432 dbname=postgres user=mc_runtime.$SB_REF sslmode=verify-full" \
     -c "SHOW search_path" -c "SHOW statement_timeout" -c "SELECT count(*) FROM users"
   # DDL refusal + BFF isolation
   psql "...user=mc_runtime..." -c "CREATE TABLE mcapp.x(i int)"          # must be denied
   psql "...user=mc_bff..." -c "SELECT count(*) FROM mc_bff.state"        # OK
   psql "...user=mc_bff..." -c "SELECT count(*) FROM mcapp.users"         # must be denied
   psql "$SB_ADMIN_CONN" -c "SELECT max(version_id) FROM mcapp.goose_db_version"   # 16
   ```
   Stop condition: any probe error → halt, diagnose retained state (no destructive action;
   PD-7), fix forward, re-run the failed step from the top of its file. P2.1 also records
   `SHOW createrole_self_grant`, `rolcreaterole`, server version ≥ 16, UTF8, ICU > 0.

## 4. Backend (Cloud Run)

1. **TLS probe (laptop scope)** — decide PD-8:
   `openssl s_client -starttls postgres -connect "$SB_POOLER:5432" -servername "$SB_POOLER" -verify_return_error </dev/null`
   If the pooler chain verifies against system roots → DSNs without `sslrootcert`; else set
   `DATABASE_CA_SECRET` in the values JSON (the renderer mounts `/secrets/dbca` in service AND
   migrate job; the operator DSN then carries `&sslrootcert=/secrets/dbca/ca.pem`). The BFF has
   its own existing `BFF_DATABASE_CA` (Node/pg path). Never downgrade to `sslmode=require`.
   Laptop/openssl is NOT Supabase proof; the deployed-path checks stay NOT_RUN.
2. **Image** — amd64 manifest check is the gate (A11): `docker buildx build --platform
   linux/amd64 … --push` or Cloud Build; record `IMAGE=<repo>@sha256:<digest>`; verify
   `docker buildx imagetools inspect` shows linux/amd64. The image builds mcapi only (migrate is
   the same binary's `migrate` subcommand; cleanup runs from the operator machine, §7).
3. **Values + render** — non-secret values JSON → `node ops/deploy/profiles.mjs cloud-run
   values.json out/` (fresh dir per render; OUT is a fixed path, never `out-*` globs):
   renderer fails closed on placeholders, mutable tags, equal serving/migrator SAs (PI-02),
   non-https endpoints, malformed optional secret references. Optional keys:
   `MC_SEARCH_CURSOR_KEY` (PD-4) and `DATABASE_CA_SECRET` (PD-8 from step 1).
4. **Secrets + IAM** — per-secret accessor grants only: serving SA → `mcapi-database-url`,
   `R2_*`, `mcapi-oidc-api-key`, [`mcapi-search-cursor-key`], [`mcapi-database-ca`]; migrator SA
   → additionally `mcapi-migrate-database-url` ONLY. PI-02 negative check: serving SA DENIED
   `gcloud secrets versions access` on `mcapi-migrate-database-url` (runbook §4 in the old plan
   wording; keep the check at the end of this phase).
5. **Apply order**: `gcloud run jobs replace migrate-job.yaml` → `gcloud run jobs execute …
   --wait` (§3 must already be complete) → `gcloud run services replace service.yaml` → verify
   `$API_URL/healthz` from outside (the image has no shell; probe externally).
6. **Public ingress boundary** — the template ships the declarative
   `run.googleapis.com/invoker-iam-disabled: 'true'` (official docs 2026-11-04: no invoker IAM
   binding needed; recommended under domain-restricted-sharing org policies). If the org's
   managed constraint `run.managed.requireInvokerIam` forbids it, the supported alternative is
   the allUsers → roles/run.invoker binding — an explicit operator/PO step, never applied by this
   render. Nothing here exposes a service by itself.
7. **Stop/recovery**: job failure → read `gcloud run jobs executions logs` (verb-corrected from
   the plan), fix forward, re-execute; never hand-edit goose versions. Service config error →
   the process exits 1 listing every problem (validated config); correct the values and re-render
   (fresh OUT dir). First-release failure with no previous revision: retained-state diagnosis +
   forward fix (PD-7); destructive recreate of the Supabase project needs separate explicit
   approval of that exact resource.

## 5. Frontend (Cloudflare Worker)

1. **Origin first (no circular deploy-then-configure)**: `$APP_ORIGIN` is known from §0/P3
   (workers.dev subdomain). Register the exact redirect `${APP_ORIGIN}/api/auth/callback` and
   post-logout `${APP_ORIGIN}/` in ZITADEL BEFORE the first deploy; `/logged-out` is NOT a route
   (logout redirects to `/login?signedOut=1`).
2. **Non-secret variables without touching tracked source (A9)**: fill a worker values JSON
   (keys = `wrangler.jsonc`'s vars + `APP_ORIGIN/OIDC_*/BFF_STATE_KEY_ID`) and render:
   ```sh
   node "$MC_SRC/ops/deploy/profiles.mjs worker values.json out/"   # renders wrangler.vars.json
   ```
   then deploy with the rendered flags (verified against the installed wrangler's `--var` flag at
   the gate receipt; the worker profile's command output prints the exact invocation):
   `cd apps/frontend && pnpm exec wrangler deploy --var API_MODE:rest --var API_BASE_URL:… --var …`
3. **Secrets (separate, never --var)**: `wrangler secret put BFF_DATABASE_URL` (BFF role,
   `sslmode=verify-full`, hex password), `BFF_STATE_KEYS` (JSON ring) and optional
   `BFF_DATABASE_CA` (PEM pipe: `head -1` must be `-----BEGIN CERTIFICATE-----`; multi-line PEM
   is piped from a file, never pasted). **Persist the ring in the password manager BEFORE
   putting it in wrangler** — rotation (§9) needs every prior version; replacing the ring with
   only the new entry logs every session out. Optional non-secret var
   `BFF_MAX_PENDING_BYTES` (sealed pending-import ceiling; default 5 MiB, packet D7) rides the
   same `--var` rendering when the PO changes it — never raised to "make a workload fit".
4. **Build + qualification gates before activation**: `pnpm build:worker` → `pnpm preflight
   .open-next --require-artifacts` → `pnpm exec wrangler deploy --dry-run --outdir /tmp/…` and
   read the gzip size line (budget input for PD-2; NOT a CPU qualification — plan N1's bundle-size
   probe cannot settle the Free-vs-Paid choice).
5. **NOT_RUN**: real Worker CPU/memory/body limits (near-25 MiB pending imports), Supavisor
   session behavior from workerd, ZITADEL end-to-end, R2 SigV4 from workerd — each is a
   separately authorized provider qualification (§6 case list, private task handoff).
6. **Stop/recovery**: dry-run failure → fix values, re-render (fresh OUT). First deploy fails →
   wrangler keeps the previous version until you `versions deploy`; there is no rollback below
   the FIRST release (§9).

## 6. Smoke tests (users A, B, C) — synthetic only, NOT_RUN until deployed

Expectations below match the source (each deviation from the old plan is source-backed):

- Login lands on **`/my-actions`** (not `/workspaces`); reload keeps the session; logout is
  `POST /api/auth/logout` → 303 to **`/login?signedOut=1`** (BFF session destroyed; the refresh
  token is revoked at the issuer best-effort; there is no `/logged-out` route).
- A creates workspace → matter → grants B (workspace grant; matter grant picks from workspace
  members). B sees only granted content; **C (non-member) receives the uniform hidden response
  404** (never an arbitrary 403/404 mix). Active-role denial (e.g. demotion to viewer) is a
  separate case from membership.
- Revocation timing: membership change applies on the next request (DB-checked per request);
  token revocation at the IdP is observed within the 30 s `MC_OIDC_CACHE_TTL` window (§9 note).
- Error taxonomy (do not conflate): expired/invalid token → sign-in again; audience/issuer
  mismatch → 401 on a valid session ⇒ re-render with the corrected audience and redeploy (the
  audience pin is the resource project id, §1 row 14); IdP unavailable → unavailable, session
  preserved; missing product identity (no `mcapp.users` row for the issuer+sub) → refused;
  missing membership → uniform 404. No sealed-token extraction, no debug token routes, no
  weakened checks to settle the audience.
- Create work (requirement/action), restart the Worker, data persists (durable BFF state).
- Completion does not itself perform independent proof acceptance: with proof requirements
  declared, completing an action leaves verification UNVERIFIED — source-backed by the gate
  contract rows (`contract_gw2.go` "Approval completed"/"Payment completed without proof" assert
  `Execution: COMPLETED, Verification: UNVERIFIED`), exercised as mc_runtime by the B1 suites.
- Documents: upload/download exact **1 MiB** and **25 MiB** (not "near") synthetic objects;
  SHA-256 byte equality; oversize (> `MC_MAX_UPLOAD_BYTES` 25 MiB) refused; wrong-`Origin`
  refused. Duplicate upload behavior: derive from code at execution time (the old plan's
  "already stored" text was unverified). Local S3 ≠ real R2 SigV4 (R2 case is provider-gated).
- Quick Search (only if PD-4): query "dang" finds "Đặng" (EN/VI folding); private/non-member
  results stay hidden; search runs under the runtime grants (§3) with the shared cursor key.
- Durable session behavior across redeploys: same origin + same key ring → sessions survive;
  a new origin is a controlled re-login. Unknown-outcome writes stay unknown until reconciled
  via receipt (never blanket-retried). A stale Server Action after redeploy surfaces the
  client's outcome-unknown/recovery messaging (action-result.ts), and HTTP 409
  `urn:mc:ui-session-changed` is the separate API-route session-change case — do NOT assert one
  blanket 409 for both (plan/R9 correction).
- API unavailable → UI shows "unavailable", never an empty list.
- Negative: anon key against the private schemas returns nothing (Data API negative, §3);
  non-member uniform 404.

## 7. Backups, restore, retention (WP5)

- **Backup = the operator-run script** (no new image, bucket, Scheduler or IaC):
  `MC_BACKUP_DSN` (project admin — a member of `mc_owner`; `mc_runtime` cannot read `mc_bff`,
  `mc_owner` is NOLOGIN, neither is a dump authority for the full set), `MC_BACKUP_SCHEMA`
  (**required**, e.g. `mcapp,mc_bff` — an empty/invalid selection exits 2; a whole-database dump
  never happens silently), `MC_BACKUP_DIR` (second location, 0700), `MC_BACKUP_RETAIN` (7).
  The archive lists TABLE DATA only for the selected schemas (verified in-rehearsal); it contains
  NO R2 document bytes and NO encryption keys — their custody is separate (§0/§9).
- **mc_bff in or out — state it explicitly**: including `mc_bff` archives encrypted BFF
  sessions, which restore usable ONLY with the unchanged `BFF_STATE_KEYS` ring (sign-in-after-
  restore works); excluding `mc_bff` means users sign in again (cleaner). Decide and record in
  the release note. Neither choice implies R2 or key backup.
- **Rehearsal**: `bash ops/backup/scheduled-dump.test.sh` (docker + node) runs the actual script
  against a task-owned disposable PG, proves schema confinement, restore-to-NEW-target row
  census, auth/storage exclusion, loud failures and retention. Provider-scheduled execution
  stays NOT_RUN. The restore rehearsal helper (`ops/p0-local/restore-rehearsal/`) remains the
  RPO/RTO drill; the earlier local rehearsal evidence (2026-10-31) is historical.
- **Cleanup**: `go run ./cmd/mcbffcleanup` from the operator machine (bounded DELETE batches,
  24 h grace default); no new image (the Dockerfile builds mcapi only — intentional). Activate
  `mc_maintenance LOGIN PASSWORD` only when running it (§3 step 2 note). Nothing is scheduled
  remotely under this revision.

## 8. Monitoring and availability truth

- Cloud Run: 5xx rate, p95 latency, instance count (alert on sustained 5xx; exclude first cold
  start). Budget alerts per packet D2. Supabase dashboard: DB size (check at 400/500 MB),
  pooler connections. R2: storage + Class A/B ops. ZITADEL: DAU. `security_audit_events`:
  repeated denials (no tokens/content in labels).
- **Keep-alive truth**: `/readyz` is a platform probe (startup probe in the template), NOT a
  public keep-alive API: do not schedule public probes of it. Supabase Free auto-pause is
  handled by the documented manual resume (dashboard); a paid tier (PD-1) removes the pause.
  Scale-to-zero is a cold start, not an outage; no automatic scheduler or paid upgrade is
  introduced by this runbook.
- A silent backup gap is a failure: the dump run's JSON summary line is the receipt.

## 9. Rollback, rotation, recovery (truthful limits)

- Code: Cloud Run → previous revision; Worker → `wrangler rollback <version>`; keep the previous
  revision/version until §6 passes. **First release has no previous revision** — recovery is
  retained-state diagnosis + forward fix (PD-7).
- Schema: forward-fix only; never run Down migrations in place. Faulty-migration path =
  restore-from-dump into a clean project (rehearsal).
- **Secrets and revisions do not roll back together**: every secret reference binds `latest`, so
  a previous code revision + `latest` secrets is NOT an exact previous-secret rollback. Rotation
  order (per credential): issue new → deploy → verify provider acceptance → revoke old →
  confirm; for the BFF ring: ADD the new key id, switch `BFF_STATE_KEY_ID`, KEEP prior entries
  until all rows sealed under them expired — removing an entry early logs those sessions out
  (never while commands have unknown outcomes). Passwords/keys live in operator custody
  (password manager/secret store); this runbook never claims SSD-safe erasure (no `rm -P`/shred
  promises) and never auto-deletes/revokes an existing key — cleanup is separately authorized.
- `MC_OIDC_CACHE_TTL=30s`: token revocation is observed within that window; membership is
  DB-resolved per request (immediate).

## 10. Cleanup (end of pilot; separately authorized)

Delete, in order, recording what and when: Worker versions, Cloud Run service + migrate job,
Artifact Registry images, Secret Manager versions, the two SAs + WIF bindings, R2 bucket
contents + token + bucket, ZITADEL project/application, Supabase project (or pause), backup
location. No secure-erasure claim (§9). NOT_RUN.

## 11. Out of scope

Real legal data, residency decision (PD-6), rate admission quotas (B3/D4), receipt retention
(B7/TB-06), custom domain/WAF, horizontal FE scaling, production SLA, Hyperdrive, monitoring
beyond budget alerts, secret-version pinning. Each is a separate PO decision.

## Appendix A — connection budget (corrected; no fictitious Worker instance cap)

| Consumer | Bound | Source |
|---|---|---|
| mcapi (Cloud Run) | pgx MaxConns 10 per instance × maxScale 3 = 30; a rolling deploy overlaps old+new revisions → 60 | `pool.go` MaxConns 10, template maxScale |
| BFF (Worker) | ONE short-lived connection per state transaction (pg native Socket under nodejs_compat); the bound is transaction fan-out from request concurrency — Workers have NO "20 × 2 instances" instance cap (that was App Hosting arithmetic) | `durable-state.ts` |
| migrator/ops | ≤ 2 (job; operator psql) | runbook |
| Supavisor | per compute tier client slots (Nano/Free ≈ 200 clients) + per-role server pool; `max_connections` is per project and customizable — 102 < 200 alone does NOT prove safety for every configuration; check the tier's per-role pool + max_connections at P2.1 | supabase compute-and-disk docs (2026-11-01 erratum) |
| Qualification evidence | actual pool/role/server budgets measured on the pilot (P2.1 + §3 step 7 + P8) — no new pool flags/Hyperdrive by default | this runbook |

## Appendix B — TLS matrix (scopes kept distinct)

| Scope | Method | Status |
|---|---|---|
| Laptop → pooler (openssl probe) | §4 step 1 | NOT_RUN (no provider) |
| pgx verify-full honors sslrootcert + hostname (Go) | `TestTLSVerifyFullPaths` on task-owned fixture | LOCAL-VERIFIED 2026-11-04 |
| Node/pg (BFF) `ca` + rejectUnauthorized | fixture receipt (post-install gate) | LOCAL-VERIFIED / see receipt |
| Final Go image → real Supabase | image built, NOT pushed | NOT_RUN |
| deployed Worker → actual Supabase | — | NOT_RUN (provider authorization) |

Keep-alive, residency, Workers Free CPU: §8/PD-2. Original six review files: untracked, immutable;
the private task disposition links this runbook at the candidate SHA.
