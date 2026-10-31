# Claude portability return — Codex bounded intake

Actual Local Codex,2026-10-30. Source/evidence inspection, hash verification and a fresh renderer test run only. No product source edits, provider calls, container lifecycle, secret reads, commit or push. Full system/runtime/managed-provider acceptance is not performed here.

## Verified

- Claude's29 changed-file entries match current bytes and sizes29/29. This is its declared delta, not a complete final-source or evidence manifest.
- Recounted four retained author smoke receipts:23/0,21/0,22/0,22/0. These are88 assertions across four executions, not88 unique product requirements or Codex-rerun runtime tests. All use local Go/PG, fake IdP and fake S3; fake S3 validates signature presence, not cryptographic SigV4 correctness.
- Fresh `rtk proxy node --test ops/deploy/profiles.test.mjs`:5/5PASS, exit0. Raw log and UTC/argv/cwd/exit are retained.
- The entry-route test import adjustment preserves existing assertions and addresses the adapter's module shape; source intake accepts it as a reasonable correction, with final runtime/type acceptance left to independent QA.
- `durable-bff-pg-r1.log` reports174PASS across13files,0skip. Its argv runs the whole OIDC directory and `src/test` as well as the durable-attempt test. This is a mixed suite executed with PG configured, **not174 database integration cases**. Count integration cases from actual test identities for independent reporting.

## Candidate identity and task scope

Author base is20feedbf. Current checkout HEAD is `0de3e5dbb8ef578c7288ba9c49ecaeddbbcbdcee`, commit subject “Add P0 local candidate with portable Workers/App Hosting and Cloud Run/Compute Engine deployment profiles (ADR-007)”. The29 declared source pins still match. The author's “no commit” statement describes its turn; this intake does not attribute the later commit to that agent or claim a push. OpenCode must record the actual new base and dirty-byte snapshot.

This completes the **portability author return**, not the separate `MC-CLAUDE-ADR006-FINISH-TO-DEPLOY-CANDIDATE-20261030` readiness assignment. Four profile smokes do not establish B1 production role packaging, CI BFF activation, large pending-import Worker resource fit, cleanup/retention, final restore, browser or provider acceptance. ADR-006 Workers+Cloud Run remains the default; ADR-007 alternatives and D1–D7 remain proposed, not approved by this intake.

## Remaining findings and review targets

| ID | Class / priority | Evidence and required action |
| --- | --- | --- |
| PI-01 | CONFIRMED approval mismatch /P2 | Go default and both deployment profiles still use15s; ADR-004 approved30s. Restore30s consistently and test. Existing local15s revocation timings do not verify a30s deployment profile. No need to request the already approved TTL decision again. |
| PI-02 | CONFIRMED deployment-identity separation gap /P2 | `cloud-run/service.yaml:21` and `migrate-job.yaml:17` both use the same `SERVICE_ACCOUNT` placeholder. The job needs the migration-secret reference at its lines34–35. Merely omitting that env var from the serving container does not define a separate IAM identity/secret permission boundary. Before cloud activation, provide separately scoped migrator identity/secret policy and a negative verification plan. Actual provider IAM is NOT_RUN; this is not a claim of a live credential leak. |
| PI-03 | REQUIRED release-artifact proof /P1 acceptance risk | Author reproduced app-root `.env.local`/`.dev.vars` copying into App Hosting standalone output. Git-only restriction and gitignore-string tests are useful but do not inspect actual git contents, builder-generated files or the final server artifact. QA must use synthetic secret sentinels and inspect the complete deployable artifact; require a release preflight rejecting forbidden tracked/source/build inputs. No actual secret leak is asserted by this intake. |
| PI-04 | Evidence-description erratum /P3 | Author return says Caddy validate PASS in the checks table but also “caddy validate not run” in NOT_RUN. Retained YAML/Caddy log is the source to adjudicate. Keep TLS issuance and systemd/COS runtime NOT_RUN; add an erratum rather than overwrite historical receipts. |

Other required checks: exact stage/profile substitutions vs rendered templates; physical BFF cleanup and role separation; real18.6PG role negatives; two-user business semantics; pending import versus document upload; immutable secret versioning/rotation behavior; renderer executable side effects and validation; actual VM supervision not inferred from Docker flags. Public-ingress and numeric capacity decisions require PO disposition and measured connection budgets, including BFF concurrency.

## Disposition

**PORTABILITY_AUTHOR_RETURN_RECEIVED / SOURCE_DELTA_VERIFIED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS.** No independent system PASS, deploy permission, alternative-host adoption, cost or residency approval. OpenCode's82-case plan remains active; the portability addendum supplies additional checks without renumbering or promoting existing cases. Do not treat this return as the missing final deploy-readiness output.

Skipped: full backend/frontend gates, four runtime re-executions, browser/a11y, provider/IAM/realSigV4, resource lifecycle and release actions. Remaining risk: source delta integrity and local profile assertions do not establish managed deployment behavior or secret isolation of the released artifact.
