# R2 Provision & Gate B3 — Operator Guide (PO self-service)

- **Status**: READY_FOR_OPERATOR — part of MC-ZCODE-R2-STORAGE-FIX-DESIGN-20261106 (§4.2)
- **Closes**: `docs/deployment/free-phase-deploy-checklist.md` **B3** ("R2 adapter smoke-tested against a real bucket with a synthetic file") + B68–B69 (private bucket, scoped token)
- **Design basis**: `docs/implementation/plans/MC-ZCODE-R2-STORAGE-FIX-DESIGN-20261106.md`; adapter contract test: `apps/backend/internal/adapter/outbound/objectstore/contract_test.go:73` (`TestContract_R2_RealBucket`)
- **Rule**: secrets (Access Key ID / Secret Access Key) never enter the repository, prompts, screenshots or logs. Synthetic data only.

## Step 1 — Create the bucket (Cloudflare dashboard)

1. Dashboard → R2 → **Create bucket**. Suggested name: `mc-pilot-docs`.
2. Location: leave default (R2 has no APAC jurisdiction; see PO decision D-07 below).
3. Do **not** enable the `r2.dev` public subdomain and do **not** attach a public/custom domain. The bucket must stay fully private (checklist B68–B69).
4. Note the **account ID**: R2 → Overview (right sidebar). The S3 endpoint is `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

## Step 2 — Create the API token (bucket-scoped)

1. R2 → **Manage R2 API Tokens** → Create API Token.
2. Permission: **Object Read & Write** only. Scope: **only this bucket** (`mc-pilot-docs`).
   - Note: R2 token granularity has no write-without-delete option; "no delete" in checklist line 70 is not achievable at token level. Mitigation is that the application never issues a delete (`s3API` in `objectstore/r2.go` exposes only Head/Put/Get) and the token never leaves the secret store.
3. Copy the **Access Key ID** and **Secret Access Key** into the approved secret location (GCP Secret Manager for deploy; local ops secrets file `0600`). Never into `.env.example`, git, or chat.

## Step 3 — Run the real-bucket contract test (this closes B3)

```bash
export MC_TEST_R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
export MC_TEST_R2_BUCKET="mc-pilot-docs"
export MC_TEST_R2_ACCESS_KEY_ID="<key id>"
export MC_TEST_R2_SECRET_ACCESS_KEY="<secret>"
cd apps/backend
go test ./internal/adapter/outbound/objectstore/ -run TestContract_R2_RealBucket -v
```

Expected: `PASS` (the test writes, reads, damages and re-reads a synthetic object, then leaves the bucket as it was — verify in the dashboard under Objects that no test objects remain).

## Step 4 — Record evidence (mandatory before ticking the checklist)

Record per project evidence rules: tool/version (`go version`), UTC timestamp, exact command, exit code, output location (e.g. a file under `docs/testing/` or the operator notes), and the dashboard confirmation that test objects were cleaned up. Then tick **B3** and **B68–69** in `free-phase-deploy-checklist.md`.

## Step 5 — Fill deploy values and render

1. In `ops/deploy/cloud-run.values.json` (or the equivalent values file used at deploy time) set:
   - `R2_ENDPOINT` = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - `R2_BUCKET` = `mc-pilot-docs`
   - `R2_ACCESS_KEY_ID_SECRET`, `R2_SECRET_ACCESS_KEY_SECRET` = Secret Manager secret **names** (never values)
2. Render and validate the **rendered** form (templates contain `{{VAR}}` placeholders — validating the template is meaningless). The CLI is **positional**: `<profile> <values.json> <out-dir>`:
   ```bash
   node ops/deploy/profiles.mjs cloud-run <values.json> <out-dir>
   ```
   Then check the rendered `service.yaml` shows `containerConcurrency: 4`, `timeoutSeconds: 330`, `MC_TRANSFER_TIMEOUT: 300s`, `MC_MAX_IN_FLIGHT: '4'` (values from design §4.1).

## PO decisions attached (PROPOSED, not blockers for B3)

| ID | Issue | Proposal | Owner |
|----|-------|----------|-------|
| D-04 | Orphan objects (Put succeeds, AddVersion fails) accumulate forever; no GC | Defer; add a reconciliation sweep only if storage cost signals appear ($0.015/GB-month) | PO |
| D-05 | No lifecycle/retention policy on the bucket | Decide when a concrete legal retention requirement exists (NĐ 333 log retention is a separate track) | PO |
| D-07 | R2 proves no Singapore residency (no APAC jurisdiction; EU/FE only) | Assess against Decree 13/2023 when moving beyond pilot | PO |

## What this guide does NOT cover

- Actual Cloud Run / Workers deployment (Phase 2–6 of the checklist, separately authorized)
- Any code change: 0 lines of Go are touched by the storage fix; FE BFF timeouts were already applied on branch `zcode/r2-storage-fix-20261106`
- Multipart upload, presigned URLs, CORS — intentionally out of scope (proxy-through-backend design, design doc §1 Non-goals)
