# §5 Cloud Run backend profile — verified local container evidence

Date 2026-10-30. Everything below ran locally on the disposable fixture (label `MC-ZCODE-ADR006-CLOUD-READINESS`, postgres 18.6, removed after) with a **synthetic** RSA key JSON (not a credential).

## Verified behavior (fresh receipts)

1. **Image builds reproducibly**: root `Dockerfile` — Go 1.26-alpine builder, `CGO_ENABLED=0 -trimpath` static binary, distroless/static nonroot runtime, object root pre-owned by uid 65532. Image sha256:879a262f….
2. **Config contract already rejects unsafe cloud profiles** (source-verified + exercised): `MC_OBJECT_BACKEND=fs` fails when `K_SERVICE` is set (config/product.go:137); R2 backend requires all four R2 settings; `MC_OIDC_API_KEY_FILE` must parse as an RSA key JSON (`keyId`/`key`/`clientId` fields) — startup failed fast on a missing migration before serving.
3. **Migration is a separate step** (as the platform profile requires): `mcapi migrate` applied 0001–0008 and exited; the server refuses to start on a pending schema (`product database has pending migrations`) unless `MC_MIGRATE_ON_START=true` (dev only).
4. **Container connectivity verified, not assumed**: with `MC_HTTP_ADDR=0.0.0.0:8080`, `/healthz` and `/readyz` answered **200** through the published port.
5. **SIGTERM drains gracefully**: `docker stop` → log `mcapi stopped gracefully`, **exit 0 in 0.17 s** (idle drain; an in-flight-request drain test through the real BFF remains for the integration stage). Well inside Cloud Run's termination window.

## Proposed pilot service profile (reviewable input, not applied)

```yaml
service: mcapi
region: asia-southeast1
ingress: all                # DECISION REQUIRED: see invocation model below
container:
  image: <registry>/<project>/mcapi:<immutable-digest>
  port: '8080'              # Cloud Run injects PORT; we pin MC_HTTP_ADDR=0.0.0.0:8080 explicitly
  resources: 1 vCPU / 512MiB
  concurrency: 40           # below in-flight cap; Go pool MaxConns 10 × instances must fit Supabase budget
autoscaling: { min-instances: 0, max-instances: 3 }   # cost bound; NOT a hard spend cap (documented)
env:
  MC_HTTP_ADDR: 0.0.0.0:8080
  MC_MAX_IN_FLIGHT: '50'    # existing in-flight admission, 503+Retry-After (source-verified)
  MC_SHUTDOWN_TIMEOUT: 10s
  # MC_OBJECT_BACKEND=r2 + MC_R2_* (secret refs); K_SERVICE set by the platform → fs rejected
  # no MC_LOCAL_PEOPLE_DIRECTORY, no MC_MIGRATE_ON_START
timeouts: { request: 10s, transfer: 60s }   # existing defaults, verified source
```

- **DB pool math**: pgx MaxConns 10 × max-instances 3 = 30 + migrator/ops 2 ≈ 32 — inside Supabase Free's direct-connection budget only without the pooler; Supabase pooler mode must be validated (pgx prepared statements + advisory locks against PgBouncer transaction mode) — **NOT_RUN** (provider gate).
- **Invocation model (DECISION REQUIRED)**: user bearer tokens are forwarded by the Worker per call; that is application auth, distinct from platform IAM. Options: (a) Cloud Run `ingress: internal-and-cloud-load-balancing` + Serverless VPC / IAM invocation from the Worker — the Worker cannot mint a Google identity token without a deployed identity (SA key/WIF), which is a real cloud action; (b) public ingress + mandatory application auth + the existing in-flight/timeout shields + edge rate admission (B3). The pilot packet presents both with costs; nothing is configured.
- **Not covered here**: real Cloud Run deploy, IAM, domain, h2c behavior on the managed endpoint — all authorized-stage checks (ADR-006 §4/B4: Cloud Run terminates TLS; container HTTP is not a missing-encryption finding).
