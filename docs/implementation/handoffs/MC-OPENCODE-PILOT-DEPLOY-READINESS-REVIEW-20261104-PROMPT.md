# MC-OPENCODE-PILOT-DEPLOY-READINESS-REVIEW-20261104 — reviewer dispatch (manual delivery)

Status: **READY_FOR_HUMAN_DELIVERY_TO_OPENCODE** (re-pin acknowledged 2026-11-04 — PO-delegated,
performed by the author: `receipts/re-pin-acknowledgment-20261104.md`; the reviewer's own §1
recomputation remains the substantive pin control). Automated dispatch failed (OpenCode sandbox
blocked a local log path at startup). Human delivery of THIS file authorizes the review work
below — nothing else.

## 0. Identity and independence (state this first in your return)

- You are **actual OpenCode**, the independent **non-author** reviewer for
  MC-ZCODE-PILOT-DEPLOY-READINESS-20261103. The candidate was authored by **actual ZCode**
  (GLM-5.3-Flash session). Codex accepted intake on 2026-11-04 and selected you.
- Your return must OPEN with: (a) confirmation you are not the author and had no hand in the
  candidate bytes, (b) the pin re-verification result from §1. Until both are stated, the review
  has not started.
- On your acceptance, Codex moves the candidate to IN_REVIEW. A PASS verdict does NOT authorize
  commit/merge/push/deploy — those are separate Codex/PO decisions on the exact pinned bytes.

## 1. Pre-flight: pin re-verification (verdicts bind to these bytes)

Candidate worktree (READ-ONLY for you): `/private/tmp/mc-zcode-pilot-deploy-readiness-20261103`
(branch `codex/pilot-deploy-readiness-20261103`; HEAD must equal base below). Verify, then review:

- HEAD == `048776b3862ab384ab4e42356c46c0a320a93488`
- `git diff` full SHA-256 == the RECOVERED pin below (NOT the intake pin — see §1a)
- All 21 files match the manifest below (reproduced INLINE so you do not depend on reading
  `/private/tmp` copies).

## 1a. RECOVERY DELTA — acknowledged (PO-delegated, 2026-11-04) — read before review

After intake, the entire `/private/tmp/mc-*` tree was destroyed by an external actor (incident
record: `/private/tmp/mc-pilot-deploy-readiness-20261103/receipts/incident-worktree-loss-20261104.md`,
recovery receipt: `.../recovery-20261104.md`, acknowledgment: `.../re-pin-acknowledgment-20261104.md`).
The candidate was rebuilt from the author's records: **18/21 files are byte-exact with the intake
pins; 3 files (2 test files + the runbook — no production-code delta) are RECOVERED-WITH-DELTA**.
The manifest below carries the RECOVERED pins. All local gates re-passed on the recovered bytes
(gofmt/vet, B1 file-order + mirror + retention on a fresh PG17, migrate-identity, verifier
audience cases, renderer 12/12, backup rehearsal). NOTE for your independence: the re-pin
acknowledgment was performed by the AUTHOR under PO delegation — your §1 recomputation from the
worktree is the substantive control; if your recomputation matches the manifest, review the
content as-is and note the delegation in your return.

```json
{
  "base": "048776b3862ab384ab4e42356c46c0a320a93488",
  "diff_sha256_RECOVERED": "164db6e8af39f7c23f8d7ad165b5fe95061fca2691647e13b09ad7161af912d1",
  "diff_sha256_intake_SUPERSEDED": "fbb487eb58f18401410d11cb660beea90be97acb470460b02b959f14462df17e",
  "files": {
    "apps/backend/.env.example": "4f62411439baa680eea685d747a5ac96305b82d51b24e5d00944b8a3a6ece465",
    "apps/backend/docs/operations.md": "9fe8a1073b3efc40ba4c03bce8a03e677a1ea3d94eb6a8b8ec5bad4a695bb98d",
    "apps/backend/internal/adapter/outbound/identity/zitadel/verifier.go": "c43c1b917975bb208f61e196df60e04935e2791bda77d5e7425cfabb83ed82ca",
    "apps/backend/internal/adapter/outbound/identity/zitadel/verifier_test.go": "d720ea2dd0fa02e02ad3c73ecfda39439b3ead584e58a7fbe94cc87c83d1b541",
    "apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go": "2ad9a01f21ec60af9a0842adb518e1d9fc4c27792bab391049399a9091532f94",
    "apps/backend/internal/adapter/outbound/postgres/b1_operator_sequence_test.go": "e2024b61095e13fa7bfdde623f59fa75b3878855a5ce2ca84d8c0390254bee67",
    "apps/backend/internal/adapter/outbound/postgres/tls_verify_full_test.go": "4ac6e0078eac07fcadb71d74a470a757e93ed215a4c5a57c8e329ca6add63457",
    "apps/backend/internal/app/product_migrate_test.go": "e7df280ed343736a42697c629b00a20f2807bdac1409bb91e4c4283e71acccb6",
    "docs/deployment/README.md": "9d9ac3e67d6fb4e45c12495c9d5cda4a39b3efb55968978fd7facf35c2fa3e52",
    "docs/deployment/pilot-deploy-runbook.md": "f9a462359ac72bca2bcc613dd66a5e2cba1185ce94407bf05851c0407f5cf8b0",
    "docs/deployment/portability-cloud-validation-packet.md": "3cec4ddf9809dc04141fd3fdbd2d3c73fcc02870951c688b5d08b300d16a33a6",
    "ops/adr006/db/README.md": "88c3b64ff24d451a7faf805158947f849d3dde8b43a0add8f7456f89ab5fb120",
    "ops/adr006/db/b1-roles.sql": "6c14e2325f9c7798acc0b0ae82cd7b073cc1ef5080155def6685d8abb700f92a",
    "ops/adr006/db/b1-runtime-grants.sql": "c675aa7d8c6a689d5f3ad1a71a7fb5f99c18e614128d1284ba533b5a31d2dd89",
    "ops/backup/scheduled-dump.sh": "8bb017c46af393c26c2382af6248c9c0bcbe16529acf94e3b20e894288e91de3",
    "ops/backup/scheduled-dump.test.sh": "0d679e0b7f6d71eac742f661c58249a5f0d3d1e9b3fd214a20117e3bb3e0f62f",
    "ops/deploy/cloud-run/migrate-job.yaml": "29da27fbca7750076eaaa44fd5f1bd17593b29d9409ddfebede46a426a026f34",
    "ops/deploy/cloud-run/service.yaml": "cbf87b64e78c00d1f301f93a79c335d117a7a71df3120645333ec7f609452b4b",
    "ops/deploy/profiles.mjs": "c2d4736cafeea1f402b742c4257ff04903222928e2a9be9d0dade8b5bd971bf7",
    "ops/deploy/profiles.test.mjs": "b04a4c2fa6caab40f60058439585de4ac4e4c0c434d34ec5feb0c700d342ace0",
    "ops/deploy/worker/wrangler.vars.json": "5c4ed2f98338c34c13349f478206078c2296eedbe56e52d34a837ce6ba898565"
  }
}
```

All 21 hashes above were computed directly from the recovered worktree bytes
(`shasum -a 256`); the reviewer still recomputes them per §1 — never trust a transcription.

Any drift → STOP; report the exact mismatch. Do not review stale bytes and do not "re-pin" on
your own authority. If the worktree path itself is unreadable in your sandbox, stop and report;
the human may copy the worktree to a location you can read — the hashes above stay the authority.
(The intake-pins manifest Codex saved — `codex-review-inputs.json` — was destroyed with the
/incident and is superseded by the manifest above; its three deviating entries are recorded in
§1a and in the recovery receipt.)

## 2. Inputs to read (in order)

1. Author's dispatch report: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/handoffs/MC-ZCODE-PILOT-DEPLOY-READINESS-REVIEW-DISPATCH-20261104.md` (repo path absolute-pinned; coordination checkout is on `codex/unified-project-flow` — read-only for you; do NOT touch its in-flight Filing Pre-flight delta).
2. Author's task evidence (read-only; if a path is sandbox-blocked, record the exact path+error and mark affected items NOT_REPRODUCIBLE_SANDBOX — never silently skip):
   `/private/tmp/mc-pilot-deploy-readiness-20261103/` → `return.md`, `disposition.md` (finding map for ALL six review inputs), `qualification-handoff.md` (W1–W8), `receipts/gate-receipts.md`, `receipts/wp1-red-reproduction.md`, `receipts/wp4-tls-verification.md`, `receipts/wp4-tls-node-receipt.md`, `receipts/wp5-backup-rehearsal.txt`, `receipts/node-tls-receipt.mjs`.
3. The candidate diff itself in the worktree (§1).

Treat every author receipt as a CLAIM. Re-run what is cheap (§4); classify what you cannot re-run as NOT_REPRODUCIBLE_SANDBOX or NOT_RUN rather than PASS.

## 3. Review scope — five focus areas (from the dispatch report §7)

1. **Operator SQL split vs Go mirrors**: `ops/adr006/db/b1-roles.sql` (bootstrap-only) + new `b1-runtime-grants.sql` against `b1ProfileSQL`/`b1RuntimeGrants` in `b1_least_privilege_test.go` (sync guard now covers 4 files). Check: bootstrap has NO unconditional dependency on migrated objects; grant classes exact; Search EXECUTE present once; statement formatting matches the file conventions the tests rely on.
2. **File-order + constrained-admin semantics**: `b1_operator_sequence_test.go` — the documented order (bootstrap → passwords → migrate as mc_migrator with NO DSN search_path → runtime grants → bff-state + ownership → bff grants → probes), the CREATEROLE-only admin path relying on `createrole_self_grant`, idempotent re-runs, SHOW probes, Search-as-runtime (EN/VI), refusals. Verify the PostgreSQL semantics claims (PG16+ createrole self-grant; role-level GUCs applied server-side per login) against PG docs, and that W1 remains the provider gate.
3. **Renderer conditional blocks + optional keys**: `ops/deploy/profiles.mjs` (`{{#KEY}}` block stripping; optional keys validated like required ones; unknown-key rejection; worker profile pins) and the two YAML templates absent/present (CA mount in service AND migrate job; MC_SEARCH_CURSOR_KEY). Structural asserts exist; an actual YAML-parse of all four render variants after `pnpm install` is a WELCOME ADD (the author noted this gap).
4. **Runbook register accuracy**: `docs/deployment/pilot-deploy-runbook.md` §1/§2 vs `disposition.md` — every A/F/C/Z/R/comprehension item mapped, corrected report assertions kept SEPARATE from code fixes, no invented approvals (packet D3=VM region / D4=VM TLS used accurately; PD-1..PD-8 statuses real), NOT_RUN labels truthful, budget Appendix A free of the "BFF 20×2" fiction.
5. **Backup argv safety**: `ops/backup/scheduled-dump.sh` — MC_BACKUP_SCHEMA validation (empty/invalid/dup/uppercase), `-n` per schema as argv (no interpolation), archive confinement check, credential hygiene; and `scheduled-dump.test.sh` asserts vs script behavior.

Also sanity-check the smaller fixes: verifier audience comment vs unchanged strict checks (2 new tests), `.env.example` TTL dedup, `invoker-iam-disabled` annotation vs official docs, migrate-identity test, smoke-expectation corrections in runbook §6 (each is source-cited).

## 4. Re-runnable local gates (no provider access needed)

Use task-owned disposable fixtures only; never a retained DB; destroy containers after; synthetic
runtime-generated credentials only. Record tool versions + exit codes.

```sh
# Renderer (no deps):            cd <worktree> && node --test ops/deploy/profiles.test.mjs
# Backup rehearsal (docker):     bash ops/backup/scheduled-dump.test.sh
# Go targeted (needs disposable postgres:17 or :18):
docker run -d --name mc-oc-review-pg --label mc-task=mc-opencode-review -e PGPASSWORD=<runtime-generated> -p 127.0.0.1:55493:5432 postgres:17
export MC_TEST_DATABASE_URL='postgres://postgres:<same-value>@127.0.0.1:55493/postgres?sslmode=disable'
cd apps/backend && go test -count=1 -run 'TestB1OperatorFileSequence|TestB1LeastPrivilegeProfile|TestBFFStateRetentionPurge' ./internal/adapter/outbound/postgres/
go test -count=1 -run 'TestMigrate' ./internal/app/ && go test -count=1 -run 'TestVerify' ./internal/adapter/outbound/identity/zitadel/
# TLS fixture test: takes MC_TLS_TEST_DATABASE_URL + MC_TLS_TEST_CA_FILE; SKIPS cleanly when unset (its PASS is fixture-scoped — fine to leave skipped; do not count a skip as a pass)
# Optional full: make check (same env) — heavier
# Optional FE artifact path (needs pnpm install in a COPY, not the shared checkout):
#   apps/frontend: pnpm install --frozen-lockfile && pnpm build:worker && pnpm preflight .open-next --require-artifacts
```

## 5. Hard boundaries for this review

- READ-ONLY on the candidate worktree and the coordination checkout; change NO source; supporting
  code changes (if any verdict needs them) loop back to ZCode via a separate Codex assignment —
  you propose, you do not edit.
- No commit/merge/push, no provider calls/auth/probes (W1–W8 stay NOT_RUN), no secret access or
  rotation, no IAM/cloud mutation, no paid services, no deployment, no changes to lint rules,
  no touching other agents' in-flight files (Filing Pre-flight delta included).
- Do not modify the six review inputs in sunstar or any evidence file under
  `/private/tmp/mc-pilot-deploy-readiness-20261103/` (they are inputs, not your workspace).
- Never bypass a sandbox/permission/Mimosa refusal: record it and continue elsewhere.

## 6. Deliverable

Write your review where Codex routes it (suggested:
`docs/reviews/pilot-deploy-readiness-opencode-review-20261104-r1/` in the coordination checkout,
plus a pointer in `docs/implementation/tasks/` per convention). Structure:

1. Header: identity + independence confirmation + pin re-verification result (§0/§1).
2. Verdict per focus area (§3) with file:line evidence for every finding; severity + the exact
   required change for each CHANGES_REQUIRED item.
3. Gate re-run receipts (commands, versions, exits) and the classification (REPRODUCED /
   NOT_REPRODUCIBLE_SANDBOX / NOT_RUN) for each author claim you relied on.
4. Overall verdict: PASS / PASS_WITH_LIMITATIONS / CHANGES_REQUIRED — explicit that PASS only
   closes the local-source review; provider gates W1–W8 and PO decisions PD-1..PD-8 stay open.
5. End with skipped checks and remaining risks.
