# OpenCode portability QA return — ADR-007 delta

- Identity: **actual OpenCode independent QA**, provider `opencode`, model `glm-5.3-flash-free`, OpenCode harness. No Claude Code/Codex/ZCode/Antigravity impersonation.
- Task: `MC-OPENCODE-ADR006-INDEPENDENT-TESTING-20261030`, addendum `MC-OPENCODE-ADR006-PORTABILITY-RETURN-ADDENDUM-20261030`.
- Candidate under test: `codex/unified-project-flow` @ `0de3e5dbb8ef578c7288ba9c49ecaeddbbcbdcee` (author base `20feedbf…`), i.e. Claude's committed portability delta. Reviewer re-pin: **29/29** declared source entries matched; 4 extra author receipts pinned by hash only.
- Prior work preserved: Stage A results (`case-results-a.json`) unchanged, including BE-03..06; the 82-case master was not modified. Final deploy-readiness and PROVIDER statuses were not promoted.
- Proposed status: **PORTABILITY_DELTA_LOCAL_PARTIAL_PASS / IN_REVIEW_WITH_OPEN_BLOCKERS**. No deployment, provider, cost, residency or D1–D7 approval. Workers + Cloud Run remains the selected default.

## 1. Executed counts

| Measure | Count |
| --- | --- |
| PORT cases added | 12 (`PORT-01..12`) |
| Independently executed | **6** — `PORT-01, PORT-06, PORT-07, PORT-08, PORT-09, PORT-12` |
| Scoped NOT_RUN | **6** — `PORT-02, PORT-03, PORT-04, PORT-05, PORT-10, PORT-11` |
| Prior 82-case results changed | 0 (master untouched) |
| FINAL readiness cases promoted | 0 (24 remain pending) |
| PROVIDER cases | 6 remain `NOT_AUTHORIZED` |

Author receipts are cited as `AUTHOR_EVIDENCE_CITED` or recounted; they are not counted as my runs.

## 2. Case results

| ID | Status | Evidence class | Result |
| --- | --- | --- | --- |
| PORT-01 | PASS | INDEPENDENT_EXECUTION | Renderer 5/5; App Hosting invariants 4/4; entry-route 2/2; adapter CJS/ESM import rationale reviewed (TS1192 pre-fix → clean post-fix, assertions still meaningful). |
| PORT-02 | NOT_RUN | NOT_RUN | Four end-to-end profile combinations not re-executed; partial render/parse coverage only. Author smokes recounted, not rerun. |
| PORT-03 | NOT_RUN | NOT_RUN | State-switch/new-process probes not executed. |
| PORT-04 | NOT_RUN | NOT_RUN | Stale old-build Server Action probe not executed. |
| PORT-05 | NOT_RUN | NOT_RUN | Complete artifact sentinel scan not executed; PI-03 stays open. |
| PORT-06 | PASS | INDEPENDENT_EXECUTION | Gap reproduced: one `SERVICE_ACCOUNT` drives both serving service and migrate job; job holds `MC_MIGRATE_DATABASE_URL`, serving does not. Real IAM NOT_RUN. |
| PORT-07 | PASS | INDEPENDENT_EXECUTION | Rendered fetch script fail-closed on mid-fetch failure; empty-success accepted at fetch but refused by app config; stale files survive later failure; modes 0700/0600/0400; no secret output. |
| PORT-08 | PASS | INDEPENDENT_EXECUTION | PyYAML parses all rendered YAML + apphosting.yaml; `caddy validate --network none` exit 0 “Valid configuration”. TLS/firewall/systemd/COS/journald NOT_RUN. |
| PORT-09 | PASS | INDEPENDENT_STATIC_CHECK | Approved 30s vs candidate 15s throughout (Go default, test, both templates, both renders) — mismatch confirmed. |
| PORT-10 | NOT_RUN | NOT_RUN | SIGTERM/abort through both BE profiles not rerun; author drain receipts cited only. |
| PORT-11 | NOT_RUN | NOT_RUN | Connection/memory measurements not executed; D7 numbers remain proposed, not approved. |
| PORT-12 | PASS | INDEPENDENT_EXECUTION | Smokes recount 23/21/22/22 exactly (88 assertions, 4 executions); durable 174 = 13-file mixed suite, reproduced by my own composition run; 12 PG-gated tests identified; failed/overwritten receipts inventoried. |

Per-case argv, cwd, UTC, exit, fixture and assertion are in `portability-intake/case-results-portability.json`.

## 3. Profile-specific verdicts (local only)

| Profile | Verdict | Basis |
| --- | --- | --- |
| Worker + Cloud Run (selected default) | **LOCAL CONFIG PASS; RUNTIME NOT INDEPENDENTLY RERUN** | Renderer/tests/invariants pass; author smoke recounted only. |
| Worker + Compute Engine | **LOCAL CONFIG PASS; RUNTIME NOT INDEPENDENTLY RERUN** | Rendered VM template parses; Caddy validates; fetch script fail-closed in a stub. No COS/systemd/TLS proof. |
| App Hosting + Cloud Run | **LOCAL CONFIG PASS; ARTIFACT PROOF OPEN** | App Hosting invariants pass; PI-03 artifact sentinel scan not executed. No buildpack/preview proof. |
| App Hosting + Compute Engine | **LOCAL CONFIG PASS; ARTIFACT/RUNTIME OPEN** | Same as above, plus the VM legs above. |

No profile is approved for deployment by this return.

## 4. PI adjudications (independent, not inherited)

| ID | Verdict | Key evidence | Next owner |
| --- | --- | --- | --- |
| PI-01 | **CONFIRMED** (P2) | ADR-004 row 4 approves `MC_OIDC_CACHE_TTL=30s`; candidate Go default, config test assertion, cloud-run template, cloud-init and both renders are **15s**. The 15s window is shorter than approved (approval/configuration mismatch, not a weaker revocation window). Matter-membership reauthorization and JWKS remain separate paths. | Backend/FE primary owner to make 30s consistent; Codex to re-pin corrected source; QA rerun at 30s. |
| PI-02 | **CONFIRMED** (P2) | My own renders: serving service and migrate job share one `SERVICE_ACCOUNT` (equal:true from a single values key); job carries the migration-secret ref, serving does not. Env omission is not an IAM/secret-permission boundary. | Backend/DevOps to add a separately scoped migrator identity + secret policy + provider-negative plan (authorization required). |
| PI-03 | **OPEN / PARTIALLY CONFIRMED** (P1 acceptance risk) | Author sentinel run found `.next/standalone/.dev.vars` copied into the App Hosting standalone bundle and a Worker guard refuses a secret in `.env.local`; but no complete final artifact + git-inventory scan with independent sentinels was executed, and at candidate time no release preflight enforced forbidden inputs. No live leak is asserted. | FE primary owner to land a release preflight; Codex to pin it; QA to run PORT-05 against the pinned artifact. |
| PI-04 | **ERRATUM CONFIRMED** (P3) | Retained `receipts/yaml-caddy-validate.out` records `caddy_validate: "Valid configuration"`; my own `--network none` run exits 0 with “Valid configuration”. The return's NOT_RUN prose clause “caddy validate not run” is the inaccurate statement. Keep TLS issuance/firewall/systemd/COS/journald NOT_RUN. | Claude Code for the erratum text; Codex intake to record it. |

## 5. Concurrent-writer drift (must be read with this return)

During this session a **concurrent primary writer** modified product source in the shared worktree: `ops/deploy/{profiles.mjs,profiles.test.mjs,cloud-run/service.yaml,cloud-run/migrate-job.yaml,compute-engine/cloud-init.yaml,cloud-run.values.example.json}`, `apps/backend/internal/config/{product.go,product_test.go}`, added an untracked `apps/frontend/scripts/release-preflight.mjs`, plus many P0 backend/frontend files. Latest observed mtimes: **2026-10-31T15:17–15:29Z**. The edits appear to remediate PI-01 (30s), PI-02 (`MIGRATOR_SERVICE_ACCOUNT`, split fetch script) and PI-03 (release preflight).

These bytes are **not** the candidate under test. They are uncommitted, unreviewed and untested by me; this return issues **no verdict** on them. My evidence is pinned to HEAD `0de3e5d` and the 2026-10-30T04:14Z renders. Hash-level before/after pin: `portability-intake/drift-concurrent-writer.json`.

Consequence: PORT-02/03/04/10 were not started against the drifting worktree, because doing so would test an unpinned candidate rather than the Claude delta.

## 6. Skipped checks and remaining risk

Skipped (not inferred as passes):

- Four end-to-end profile runtime combinations; multi-instance state switch; stale Server Action; SIGTERM/abort reruns; connection/memory measurements.
- Complete App Hosting artifact + git-inventory sentinel scan and release-preflight enforcement.
- Real App Hosting buildpack/preview support, Workers platform limits, real HTTPS/`__Host-` cookies, ZITADEL, Supabase TLS/pooler/budget, R2 SigV4, Cloud Run IAM/scale-in/probes, VM firewall/TLS/COS/systemd/journald, Secret Manager IAM, browser/a11y, cost/residency.

Remaining risk: local rendering, parsing and stubbed-script behavior do not prove managed-provider behavior or secret isolation of the released artifact. The TTL mismatch and one-identity gap are confirmed source defects in the tested candidate; the live worktree remediation is unverified. D1–D7 and numeric workload/retention/RPO/RTO remain unapproved.

## 7. Evidence index

- Matrix + PI adjudications: `portability-intake/case-results-portability.json`
- Input re-pins: `portability-intake/input-repins.json` (29/29 + 4 receipts)
- Drift record: `portability-intake/drift-concurrent-writer.json`
- Probes: `portability-intake/{port06-08-render-matrix.py,port07-secrets-probe.sh,port08-caddy-validate.py,port09-ttl-compare.py,port12-recount.py}`
- Pinned renders/values: `portability-intake/renders/`, `portability-intake/qa-values/`
- Run logs (argv/cwd/UTC/exit): `commands/portability-port01-renderer`, `portability-port01-fe-profile-tests`, `portability-port06-08-render`, `portability-port07-secrets`, `portability-port08-caddy-validate`, `portability-port09-ttl`, `portability-port12-recount`, `portability-port12-durable-composition`
- Author delta (read-only): `docs/testing/claude-deployment-portability-20261030-r1/`
- Codex bounded intake (read-only): `docs/testing/codex-claude-portability-intake-20261030-r1/`

## 8. Next gate

Stage B remains `PENDING_FINAL_RETURN`: Claude's final deploy-readiness return is still absent, so the 24 FINAL cases cannot be promoted. No project gate is closed and no deployment is approved by this document.
