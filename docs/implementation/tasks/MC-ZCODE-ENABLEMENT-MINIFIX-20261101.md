# MC-ZCODE-ENABLEMENT-MINIFIX-20261101

Owner: actual ZCode (fresh session, dispatched by the P0 coordinator). Priority: M1 = P2
(deploy-blocker until fixed) / M2 = P1 enablement / M3 = P2. Status:
**DONE_LOCAL (3/3 items committed); OV-R13-01 stays FIXED_PENDING_VERIFY — verification belongs
to OpenCode's running wave, not the author.**

Authority: coordinator dispatch `docs/implementation/handoffs/MC-ZCODE-ENABLEMENT-MINIFIX-20261101-PROMPT.md`;
decision D-1(b) RATIFIED (DEC-20261031-04); OV-R13-01 found by OpenCode verify-wave R13.

Repository `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch
`codex/unified-project-flow`, base `5e932bd` → head `bb54d6e` (+ receipts commit). Path
discipline held: no writes to `apps/**`, `docs/testing/opencode-verify-wave-20261031-r1/`,
`docs/testing/mc-p1-fix-wave-20261031-r1/`, no contact with :3000/:8080/:8081 runtimes or any
other task's containers. No secrets read or committed (walkthrough keys are generated per run,
0700/0600, outside git, destroyed at teardown).

Scope and commits (each item one commit, ID referenced):

- **M1 — OV-R13-01 (commit `6b0c358`)**: `ops/deploy/cloud-run/migrate-job.yaml` —
  `maxRetries/timeoutSeconds/containers` were indented 4 spaces under `serviceAccountName`;
  dedented to `spec.template.spec` siblings. Freeze-check passed (file clean before edit).
- **M2 — CO-17 (commit `ed23be3`)**: `ops/local/walkthrough/` (up.sh / mint-token.sh / down.sh /
  stubidp/main.go / README.md) + `docs/deployment/walkthrough-env.md` §4 status + §1/§2
  alignment.
- **M3 — runbook erratum (commit `bb54d6e`)**: `docs/deployment/pilot-deploy-runbook.md` §1 —
  Supavisor client limit verified from official docs: **200 pooler clients on Nano/Free**
  (Micro 200, direct 60) via supabase.com/docs/guides/platform/compute-and-disk (linked from
  the pooling-and-limits page). WP-8 peak ≈72 steady / ≈102 rolling deploy < 200 → decision not
  to add `MC_DB_MAX_CONNS` stands; caveat re-check if the compute tier changes.

Inputs: `docs/deployment/walkthrough-env.md` (D-1(b)), r2 receipts
(`zcode-ba-flow-completeness-20261030-r1/r2/commands/runtime-env.txt`, `run-records.md`, scratch
`/private/tmp/mc-ba-flow-evidence/` stub source + walkthrough-lib), backend verifier/config code
(verifier.go, config/product.go, app/product.go, identity_resolver.go), workboard-findings.md.

Acceptance results:

- M1: failing-before proven on HEAD bytes in rendered form (`ScannerError: mapping values are
  not allowed here`, line 17 `maxRetries`) → after: **6/6** deploy YAMLs parse (rendered form,
  matching verify-wave R13 method) + structure assertion (3 pod-spec keys as siblings, 11 env
  entries). Receipts: `m1-yaml-before.txt` / `m1-yaml-after.txt` / `validate-yaml.py`.
- M2: single smoke run — **4/4 milestones PASS**: readyz 200; no-token 401;
  `tok-wt-alice` → 200 (`{"items":[],"page":…}` — introspection → verifier → provisioned
  identity → authorization, end-to-end); unknown `tok-wt-eve` → 401. Teardown proven clean:
  3 ports free, container removed, state dir + key material destroyed, no walkthrough
  processes. The r1 orphan on 18082 confirmed FREE (matches ledger; not this session's doing).
  Receipts: `m2-smoke-up.log`, `m2-smoke-milestones.log`, `m2-smoke-down.log`,
  `m2-orphan-check.log`.
- M3: erratum recorded with same-day primary-source verification (WebFetch of the official
  compute-and-disk table). First lookup attempt failed (provider concurrency limit); retry on
  the compute-and-disk page succeeded — recorded, not hidden.

Tests run: PyYAML rendered-form validation ×6, 4-milestone smoke, teardown orphan check,
`bash -n` ×3, `gofmt -l` clean, mint-token modes (`--all`, `--u7`, `--example`). NOT run:
OpenCode verification of M1 (running wave's job); browser/authorize path for the stub (US-R-01,
open enablement follow-up); any BE/FE suite (no apps/** touched).

Reviewer: OpenCode (OV-R13-01 rerun on the new bytes) / coordinator intake for the register
rows (register rows for M1/M2 were already recorded by the coordinator session; this session
updated the CO-17 row's M3 cell + added a dated log line, left uncommitted for coordinator).

Known limitations: stub IdP is machine-token introspection only — no browser login/authorize
page (US-R-01); walkthrough env is not a production profile (no TLS, no real multi-tenancy).
Mimosa advisory findings on the scripts: 1 fixed (numeric-PID validation before kill),
2 assessed false-positive/already-hardened — `m2-mimosa-findings.md`.

Evidence: `docs/testing/mc-enablement-minifix-20261101-r1/` (return.md + commands/).
