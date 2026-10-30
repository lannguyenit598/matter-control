# Backend API handoff for Claude

Task: MC-P0-CODEX-BACKEND-LOCAL-20261029. Actual Local Codex, 2026-10-29. Backend candidate is local dirty source on `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`; use `final-source-manifest.json`, not HEAD alone, to identify it.

## Existing user-facing runtime — preserved

- Observed API: `http://127.0.0.1:8081`, API base `http://127.0.0.1:8081/api/v1`. PID 87393 at intake/final inventory. Executable is in Claude's private scratchpad; source revision, DB credentials and OIDC key were not read. Health/readiness 200 and missing-token refusal 401 were observed read-only at 08:15:41 UTC. These observations do not prove that this binary includes the new candidate or the new DB probe.
- Existing PG: `mc-p0-claude-pg`, PostgreSQL 18, loopback 55440. Existing IdP stack on 8080 preserved. Frontend PID 87665 on 3000 observed in final inventory; Claude owns frontend lifecycle. Codex did not stop/restart it, write frontend files, install dependencies or build into `.next`.
- Keep the existing frontend API base and authorized data. Do not point it at the now-removed empty fixture. Updating the retained API binary/config is pending its runtime owner; Codex did not access its private configuration to perform that replacement.

## Candidate verification runtime — cleaned up

- Final fixture API: `http://127.0.0.1:57945`, API base `/api/v1`, PID 93021, actual Local Codex owner. Private binary `/private/tmp/mc-codex-backend-local-20261029-r2/mcapi`; synthetic configuration/signing key only, unreachable loopback introspection. This was a readiness/unauthenticated fixture, not an authenticated frontend target.
- Product migration version 7. `fs` object backend at `/private/tmp/mc-codex-backend-local-20261029-r2/objects`. No legal data or real identity/provider credentials used.
- PG fixture `mc-codex-be-local-20261029-r2`: cached PostgreSQL 18.6 image; 1 CPU, 512 MiB memory, 128 PIDs, anonymous task-owned volume, random credentials in owner-only private files. Host port 56901 during final make check; Docker assigned 57632 after a restart. Final outage test used pause/unpause to preserve that mapping.
- Final smoke: health 200, ready 200, missing bearer 401; while PG paused, health 200 and ready 503 in 0.5018s with a generic problem; after unpause, ready 200. API SIGTERM exit 0, 0.0035s observed shutdown. Unit tests separately verify active-request drain and forced cancellation.
- API is stopped and reaped. Both task-created containers (`...-r1`, `...-r2`) and their anonymous volumes were removed after owner-label checks. No fixture API is listening for Claude. Private test files/binary remain outside Git for audit; they contain no real credentials. See `runtime-results.json` and `cleanup.json`.

## Copyable continuation for Claude

Backend intake and isolated PostgreSQL checks are complete for the manifest-pinned candidate. Preserve `leonx.me/matter-control` and all dirty work. No product API field, domain status, CAS, receipt/key or permission change was introduced. `/readyz` now reflects DB availability and emits product 503 when unavailable. `MC_TRANSFER_TIMEOUT` is a new positive duration, default 60s, for document upload/content download, import preview/commit, export and bulk commit; ordinary routes remain 10s. `K_SERVICE` plus filesystem mode is rejected. A possible write timeout remains OUTCOME_UNKNOWN; reconcile with the original key.

Continue focused-workbench against your retained authorized runtime. Before claiming the new backend behavior there, rebuild/restart only the API you own, with your existing approved DB/object/OIDC configuration and the same loopback API address. Do not replace its data with a fixture. From `apps/backend`, a sanitized build/launch template is:

```sh
rtk proxy go build -o "$MC_CLAUDE_RUN_DIR/mcapi" ./cmd/mcapi
# In the runtime owner's existing approved environment, after its own graceful API stop:
rtk proxy env MC_TRANSFER_TIMEOUT=60s "$MC_CLAUDE_RUN_DIR/mcapi"
```

`MC_CLAUDE_RUN_DIR` must be your own private run directory; this is an operator template, not an executed lifecycle action or a request to expose its environment. Validate `/healthz`, `/readyz` and unauthenticated refusal after launch. Claude owns any frontend rebuild/restart needed by its own configuration; no API-base change is needed by this candidate. Browser/IdP/authenticated flow verification stays with Claude/human.

Next exact actions: Claude consumes this handoff and continues its focused-workbench validation; a separate nonauthor reviews the nine backend paths against the final manifest. Codex retains the proposed status delta for the shared workboard owner.

Skipped: retained-runtime replacement, authenticated/browser/IdP verification and real R2. Risk: the existing 8081 process is not proven to run the corrected bytes; no deployment readiness is certified.
