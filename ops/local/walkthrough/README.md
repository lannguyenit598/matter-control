> Operator note: dated observations below are historical. Use the current [operations index](../../../docs/operations/README.md) for maintained setup and release boundaries. Historical evidence paths refer to the coordination archive, not this product tree.

# Local walkthrough environment — MatterControl (CO-17, decision D-1(b))

One standard, documented path to run MatterControl locally with real backend +
synthetic data — for the PO to see the product, for lawyer task trials, and for
reviewers to walk the Golden Workflows — **without ZITADEL, without cloud, and
without touching anyone's runtime**. Pattern proven live by BA flow-completeness
r2 (570 calls, GW-01→03): `docs/testing/zcode-ba-flow-completeness-20261030-r1/r2/`.

## Quickstart

```sh
ops/local/walkthrough/up.sh                 # PG + build + stub IdP + migrations + 5 synthetic users
ops/local/walkthrough/mint-token.sh --all   # the 5 synthetic principals
TOK=$(ops/local/walkthrough/mint-token.sh wt-alice)
curl -sS http://127.0.0.1:18083/readyz
curl -sS -H "Authorization: Bearer $TOK" http://127.0.0.1:18083/api/v1/workspaces
# … walk GW-01 → GW-02 → GW-03 manually or with the r2 scenario scripts …
ops/local/walkthrough/down.sh               # mandatory: full teardown, no orphans
```

## The four pieces

| Piece | What | Where |
|---|---|---|
| PG container | `mc-walkthrough-pg` (label `mc.task=MC-WALKTHROUGH`), 127.0.0.1:15432, db `mc_walkthrough` | up.sh |
| `mcapi` | built from the current tree, 127.0.0.1:18083, migrations via `mcapi migrate` + `MC_MIGRATE_ON_START=true` | up.sh |
| Stub IdP | RFC 7662 introspection (`/introspect`, `/healthz`) for `tok-<subject>` tokens; `ops/local/walkthrough/stubidp/main.go`, 127.0.0.1:18093 | up.sh |
| Synthetic principals | 5 users seeded in PG: wt-alice OWNER / wt-binh EDITOR+verifier / wt-editor2 EDITOR / wt-cuc VIEWER / wt-dung non-member | up.sh |

Tokens are opaque (`tok-<subject>`); roles come from workspace memberships granted
via the API during the walkthrough, never from the token. `Idempotency-Key` values
must be UUIDv7 — `mint-token.sh --u7` prints one (macOS `uuidgen` is v4, which the
API contract rejects).

## Configuration (environment overrides)

| Var | Default | |
|---|---|---|
| `MC_WT_STATE_DIR` | `${TMPDIR:-/tmp}/mc-walkthrough-state` | 0700; stub key material + pidfiles + logs; removed by down.sh |
| `MC_WT_PG_PORT` | `15432` | loopback only |
| `MC_WT_API_PORT` | `18083` | loopback only |
| `MC_WT_IDP_PORT` | `18093` | loopback only |
| `MC_WT_PG_IMAGE` | `postgres:18.6-alpine` | cached locally, r2-proven |

## Boundaries and security

- Synthetic data only; no PII. The stub API key pair is generated fresh per run
  (0700 dir, 0600 files, outside git) and destroyed by down.sh — never a real
  secret, never committed, never printed.
- Stub IdP is loopback-only (refuses non-loopback bind) and does not verify the
  client assertion (disposable runtime protecting nothing — documented in source).
- Ports were chosen to not collide with other live tasks (:3000/:8080/:8081,
  review fixtures 28719–28721, r1's orphan 18082). `up.sh` refuses to start if a
  port or the container name is already taken.
- This is NOT a production profile: no TLS, no real multi-tenancy, no backup.
  Real deploys follow `docs/deployment/pilot-deploy-runbook.md`.
