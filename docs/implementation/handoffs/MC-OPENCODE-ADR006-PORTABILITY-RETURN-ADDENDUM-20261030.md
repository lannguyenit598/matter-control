# OpenCode QA addendum — Claude portability return received

Continue `MC-OPENCODE-ADR006-INDEPENDENT-TESTING-20261030`; do not restart, discard evidence, create a second writer or replace the82-case master. Read this addendum with the existing full prompt/plan. Same local-only permissions and source/output boundaries apply.

## Inputs and identity

Claude return: `docs/testing/claude-deployment-portability-20261030-r1/return.md`, changed-file manifest, copy-vs-final, four smoke receipts, verification programs and build/measurement/failed receipts. Read ADR-007, `docs/deployment/portability-runbook.md`, cloud-validation packet and `ops/deploy/**`, App Hosting YAML/test and entry-route test change.

Codex bounded intake: `docs/testing/codex-claude-portability-intake-20261030-r1/{return.md,checks.json,input-pins.json}`. Verified29/29 declared source pins; independent renderer5/5; retained four author smoke counts23/21/22/22 parsed, not rerun. Actual current HEAD at intake is `0de3e5dbb8ef578c7288ba9c49ecaeddbbcbdcee`; author base20feedbf is historical. Record actual branch/head/source bytes before executing; a new commit does not prove dirty source is clean or accepted.

**This return is for portability, not completion of the separate final deploy-readiness task.** Consume its delta now. Do not promote all24 FINAL readiness cases merely because four host combinations passed. Missing final SQL/CI/cleanup/recovery outputs remain explicit pending items; finish available cases independently. Workers+Cloud Run stays selected; alternative-host/cloud decisions D1–D7 are not approved here.

## Additional independent cases

Append these12 IDs in the reviewer-owned matrix, initially NOT_RUN. Do not modify the82-case prepared master. Reuse existing case evidence where exactly equivalent, but record coverage links instead of double-counting one assertion as two independent runs.

| ID | Scope | Procedure / expected proof |
| --- | --- | --- |
| PORT-01 | Local source/build | Reproduce renderer5-test suite and type/profile invariants. Review changed entry-route import against adapter-generated CommonJS and normal ESM; existing routing/profile assertions must remain meaningful. |
| PORT-02 | Local four profiles | Independently run Worker+CloudRun-shaped container, Worker+VM-shaped container, AppHosting-adapter/Node+CloudRun-shaped, Node+VM-shaped. Pin actual artifacts and same Go image; map every substitution. Provider/AppHosting buildpack/systemd proof cannot be inferred. Default topology acceptance and alternative portability verdicts remain separate. |
| PORT-03 | Local state switch | Same-origin host swap with same DB/keyring keeps session; changed origin/issuer/client refuses old namespace; cross-user cache/data negative; new process not just new JS object. |
| PORT-04 | Local Server Actions | Stale old-build action submitted to new build is refused without a write. Observe actual error/UI recovery; do not require universal409 unless that protocol is explicitly guaranteed. |
| PORT-05 | Local packaging/security | Synthetic sentinels in tracked-forbidden file, ignored app-root file and builder/runtime env in isolated fixtures. Inspect complete App Hosting standalone/server/client artifacts and git source inventory. Confirm release guard refuses forbidden inputs; gitignore string assertions are insufficient. Never use real env files/secrets. |
| PORT-06 | Local config / provider plan | Trace serving vs migration service identity and migration-secret refs. Render with distinct identities and verify serving cannot be configured with migration credentials by default. Current templates use one SERVICE_ACCOUNT: reproduce source gap; real IAM negative remains provider-authorized. |
| PORT-07 | Local VM script test | Extract actual rendered secret-fetch script into owned scratch; stub supported fetch boundary to fail/return empty values. Verify fail-closed and partial/stale secret-file handling, restrictive ownership/modes and no secret output. No root-path writes or metadata server calls. A stub test is not COS/Secret Manager proof. |
| PORT-08 | Local config/tooling | Parse rendered YAML with a real parser; validate Caddy config with network disabled if approved local image available. Separate parsing/validate PASS from cert issuance, firewall, systemd restart, COS reboot and journald NOT_RUN. Resolve return's contradictory Caddy statement from retained evidence. |
| PORT-09 | Local revocation/config | Compare15s source/templates with30s approved setting; final regression tests must use actual corrected profile. Report auth-cache delay accurately, distinct from Matter-membership reauthorization/JWKS and fake-IdP counter. |
| PORT-10 | Local failure lifecycle | Repeat loaded SIGTERM and bounded client abort through both BE profiles; verify byte/hash/row counts and no extra version. Add slow consumer/backpressure timeout probe; Docker graceful-stop PASS does not prove Cloud Run scale-in or systemd supervision. |
| PORT-11 | Source/local measurement | Check aggregate connection bounds for Go and BFF plus rolling instances, memory for concurrent near25MiB requests and large pending imports. RSS of Wrangler parent/toolchain is not isolate memory and wall time is not billed CPU. D7 workload numbers remain proposed; do not approve them as QA. |
| PORT-12 | Evidence/accounting | Recount author checks and tests by actual identities.174 in13files is a mixed suite with PG enabled, not174SQL integration tests. Preserve failed/overwritten receipt disclosures, map exact snapshot substitutions and re-pin all new reviewer probes/output. |

Source acceptance concerns PI-01..04 are in the Codex intake; adjudicate independently rather than inheriting findings or closures. Corrected final source should receive a new pin and relevant rerun. No product-source fix is assigned to OpenCode.

## Execution and return

Use newly owned fixtures; do not start/read Claude or Codex retained containers/private credential paths just because they exist. Author verification programs hardcode paths/resources; adapt copies and retain diffs before invoking. Do not call real S3/R2/provider to make a fake-signature test look real. Synthetic server signature-presence checks do not verify SigV4.

Reuse the existing reviewer output directory with a distinct `portability-intake/` attempt area; do not overwrite A-stage logs. Publish additional-case results and profile-specific verdicts with original82-case coverage linked. Remaining FINAL readiness cases and provider6 cases retain their own status. If Claude final readiness return is absent, report precise unfinished scope and continue independent available work, not repeated blanket WAITING.

No deployment, provider mutation, external messaging, author source edit or project gate closure. End with actual executed counts, exact findings/next owner, skipped checks and remaining risk.
