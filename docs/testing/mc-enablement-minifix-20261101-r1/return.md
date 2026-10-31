# MC-ZCODE-ENABLEMENT-MINIFIX-20261101 — return

- Executor: actual ZCode (fresh session). Dispatch: coordinator handoff prompt (M1/M2/M3,
  path-separated from fix-wave/verify-wave). Branch `codex/unified-project-flow`, base `5e932bd`.
- Result: **3/3 items DONE, 4 commits** — M1 `6b0c358`, M2 `ed23be3`, M3 `bb54d6e` + receipts
  commit. OV-R13-01 = FIXED_PENDING_VERIFY (OpenCode reruns in the live wave); CO-17 = DONE.

## M1 — OV-R13-01 (P2 deploy-blocker) → FIXED_PENDING_VERIFY

- Freeze-check: `ops/deploy/cloud-run/migrate-job.yaml` clean before edit (no other writer).
- Defect: `maxRetries`/`timeoutSeconds`/`containers` indented 4 spaces too deep under
  `serviceAccountName` (line 17ff) — not YAML-valid in any form.
- Evidence pair (rendered form = placeholders substituted, matching verify-wave R13's method —
  raw `{{VAR}}` is itself invalid YAML for both migrate-job AND service.yaml, a templating
  artifact, not a defect):
  - before (HEAD `5e932bd` bytes): `ScannerError: mapping values are not allowed here`, line 17,
    column 21 (`maxRetries: 0`) — `m1-yaml-before.txt`
  - after: **6/6** files parse (`migrate-job.yaml`, `service.yaml`, `cloud-init.yaml`,
    `deploy.yml.disabled`, `backend.yml`, `frontend.yml`) + structure assertion for
    migrate-job (pod-spec siblings, 11 env entries) — `m1-yaml-after.txt`, reproducible via
    `validate-yaml.py`
- Commit `6b0c358` (1 file, 22/22 lines).

## M2 — CO-17 (D-1(b) walkthrough env) → DONE

- Files (`ops/local/walkthrough/`): `up.sh` (preflight + PG container `mc-walkthrough-pg` label
  `mc.task=MC-WALKTHROUGH` on 127.0.0.1:15432 + `go build ./cmd/mcapi` + fresh 0700/0600 stub
  key pair outside git + stub IdP + `mcapi migrate` + serve with `MC_MIGRATE_ON_START=true` +
  5 synthetic users `wt-alice/wt-binh/wt-editor2/wt-cuc/wt-dung`; failure trap tears everything
  down so a failed up leaves no orphans), `mint-token.sh` (`<user>` / `--all` / `--u7` UUIDv7
  for Idempotency-Key / `--example`), `down.sh` (pidfile SIGTERM→KILL, container rm, guarded
  state-dir rm incl. keys, mandatory orphan check), `stubidp/main.go` (loopback-only RFC 7662
  stub, `active:false` for unknown tokens, contract mirrored from
  `internal/adapter/outbound/identity/zitadel/verifier.go`), `README.md`.
- Smoke (one run, `m2-smoke-*.log`): up EXIT=0 after two failed attempts recorded in the same
  receipt (psql absent from host PATH — removed from preflight; REPO_ROOT one `..` short —
  fixed). Milestones 4/4: readyz **200**; no-token **401**; `tok-wt-alice` **200**
  (`{"items":[],...}`); `tok-wt-eve` **401**. Teardown: EXIT=0, ports 15432/18083/18093 free,
  no processes, state dir gone, container gone (`m2-orphan-check.log`). r1 orphan 18082 found
  FREE (Codex intake already reaped it; matches ledger line 15499/18099/18081/18082 STOPPED).
- walkthrough-env.md: §4 rewritten to status (to-do list removed), §1/§2 aligned
  (18.6-alpine cached image, `mcapi migrate`, `down.sh`).
- Mimosa advisories (non-blocking): pidfile-kill finding FIXED (numeric-PID validation);
  dirname-idiom + guarded-rm findings assessed FP/hardened — `m2-mimosa-findings.md`.
- Commit `ed23be3` (6 files, +567).

## M3 — runbook erratum (pooler) → DONE

- `pilot-deploy-runbook.md` §1: erratum block added after the WP-8 connection budget:
  Supavisor **max pooler clients = 200 on Nano/Free** (Micro 200; max direct 60) — verified
  same-day from supabase.com/docs/guides/platform/compute-and-disk (the pooling-and-limits page
  defers per-tier numbers there). Budget ≈72 steady / ≈102 rolling < 200 → `MC_DB_MAX_CONNS`
  decision **stands**; caveat re-check off-Nano. First lookup attempt hit a provider
  concurrency limit; the compute-and-disk fetch succeeded (both attempts recorded).
- Commit `bb54d6e` (1 file, +10).

## Register / records

- workboard-findings.md: coordinator session had already recorded OV-R13-01 FIXED_PENDING_VERIFY
  (`6b0c358`) and CO-17 DONE (`ed23be3`); this session updated the CO-17 row (M3 commit + smoke
  note) and appended a dated minifix log line. **Left uncommitted** for the coordinator (they
  own the register writes; no competing-writer snapshot taken).
- Task record: `docs/implementation/tasks/MC-ZCODE-ENABLEMENT-MINIFIX-20261101.md` (committed).

## What was skipped / remaining risk

- OV-R13-01 verification deliberately NOT self-claimed — OpenCode reruns in the running wave.
- No BE/FE suites run (no apps/** writes); no push (DEC-20261031-01); no contact with
  :3000/:8080/:8081 or other tasks' containers; fix-wave's dirty apps/backend files untouched.
- US-R-01 remains open (stub has no browser login/authorize page) — enablement follow-up
  blocking trial session E-2; US-R-02 (fault injection for T10) untouched.
- Residual risk: none known in the committed bytes beyond the already-registered defects;
  walkthrough scripts are local-only tooling (loopback, disposable, synthetic data).
