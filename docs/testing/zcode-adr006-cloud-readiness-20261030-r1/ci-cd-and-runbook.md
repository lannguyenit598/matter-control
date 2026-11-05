# §8 CI/CD templates + ADR-006 runbook delta (reviewable artifacts, nothing triggered)

## CI shape (proposed for adoption after the adapter decision; PR jobs carry NO cloud credentials)

```yaml
# .github/workflows/deploy-backend.yml (protected, manual approval; sketch — adopt after handoff)
# jobs:
#   build-and-scan: docker build + trivy + go test (PG fixture via repository secrets restricted to this env)
#   deploy: environment: cloud-validation (required reviewers)
#     permissions: { id-token: write, contents: read }   # WIF — no stored GCP key
#     steps: [auth via google-github-actions/auth@vX (WIF), deploy cloudrun revision, run mcapi migrate as a ONE-OFF job with the migrator role, smoke healthz/readyz]
#   rollback: prior revision retained; documented command, human-executed
# Serialized: concurrency group "mcapi-deploy" so deploy+migration never overlap.
```

Principles encoded: immutable image digest + revision identity; migrate runs once (never per autoscaled instance — platform contract verified in `cloud-run-profile.md`); secrets by reference only; no auto-deploy on push; skip accounting in the backend gate carried over. Worker side mirrors: `opennextjs-cloudflare build` + `wrangler versions upload` (staged), deploy job manual, rollback = prior Worker version.

## Runbook delta for the active checklist (patch proposal — the shared checklist file needs the DevOps writer handoff)

1. Replace the Cloud Run FRONTEND assumption (ADR-004 superseded): frontend = Worker (adapter per PoC), origin = Workers domain or custom; the runbook's "frontend service on Cloud Run" steps are historical.
2. Entry journey: `/` currently redirects to the nonexistent `/dashboard`; the real entry is the `(app)` route family (workspaces). The redirect fix rides the next.config handoff.
3. Database: roles = B1 profile; migrate = separate serialized step as `mc_migrator`; runtime connects via the pooler path decided at validation; Supabase pause behavior is an availability gate, not a cost footnote.
4. Rollback order per ADR-006: Worker version first (frontend/auth), Cloud Run revision second (API), schema expand/contract + forward-fix; goose down is destructive and NOT a rollback path.
5. Retained-runtime steps (login DB, demo E2E) stay scoped to their historical sections.
