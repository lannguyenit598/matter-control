# MC-ZCODE-R2-FIX-REVIEW-20261106 — Dispatch prompt (review-only)

Task ID: MC-ZCODE-R2-FIX-REVIEW-20261106
Requested by: Product Owner ("thực hiện theo bước đề xuất" 2026-11-06) — independent review of the R2 storage fix wave before commit.
Status target: IN_REVIEW → RETURNED (verdict + findings). Review only — no implementation, no commit, no push.

## 0. Identity and mode

- You are the dispatched **independent, non-author reviewer** of this change set. If you authored it, STOP and return `CONFLICT_OF_INTEREST`.
- Mode: **REVIEW_ONLY**. You may run read-only checks and tests. Write only your own evidence notes. No code edits, no commits.
- Record your **actual agent/tool identity** in the report.

## 1. Pinning — pre-flight (mandatory)

- Repository (absolute): `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`
- Branch: `zcode/r2-storage-fix-20261106`
- Pinned base commit: `41098a4d8690a1f3ce3864ace50fc20ca1221caa` (parent of the uncommitted wave)
- Pre-flight: record `git rev-parse HEAD` (expected = pinned base; this wave is **uncommitted**), `git branch --show-current`, `git status --porcelain` (dirty tree expected — the wave IS the dirty files; ignore other sessions' untracked files: `docs/implementation/handoffs/MC-BE-ECHO-REVIEW-20261106-PROMPT.md`, `MC-FE-*-REVIEW-20261106-PROMPT.md`, `docs/testing/`).

## 2. Scope — exactly 8 files (5 modified + 3 new), nothing else

Modified (review the diff `git diff`):

1. `ops/deploy/cloud-run/service.yaml` — expected: `containerConcurrency: 4` (line ~30, comment "4 x 25 MiB = 100 MiB"), `timeoutSeconds: 330` (line ~32), `MC_TRANSFER_TIMEOUT: 300s`, `MC_MAX_IN_FLIGHT: '4'`
2. `ops/deploy/compute-engine/cloud-init.yaml` — expected: `MC_TRANSFER_TIMEOUT=300s`, `MC_MAX_IN_FLIGHT=4`
3. `apps/frontend/src/app/api/matters/[matterId]/documents/[documentId]/versions/route.ts` — expected `timeoutMs: 330_000`
4. `apps/frontend/src/app/api/matters/[matterId]/documents/[documentId]/versions/[versionId]/content/route.ts` — expected `330_000`
5. `apps/frontend/src/app/api/matters/[matterId]/export/route.ts` — expected `330_000`

New (read whole):

6. `docs/deployment/r2-provision-and-b3.md` — operator guide (PO self-service)
7. `docs/implementation/plans/MC-ZCODE-R2-STORAGE-FIX-DESIGN-20261106.md` — design of record
8. `docs/implementation/tasks/MC-ZCODE-R2-STORAGE-FIX-20261106.md` — task record

## 3. Hard review criteria (binding)

- **No Go code changed**: `git diff --stat` must show zero `.go` files. Any Go diff = out-of-scope finding.
- Values match design §4.1 exactly (design doc = source of truth). No other value drift in the 2 manifests (compare full diff hunks, not just target lines).
- Timeout chain consistency: BFF `330_000` ≥ Cloud Run `timeoutSeconds: 330` ≥ `MC_TRANSFER_TIMEOUT: 300s`; compute-engine has no platform timeout (systemd/caddy on VM) — flag if the guide or design misstates this.
- Memory bound claim: worst case = `MC_MAX_IN_FLIGHT` × 25 MiB ≤ ~20% of 512 Mi. Check the `R2.Put` buffer claim in `apps/backend/internal/adapter/outbound/objectstore/r2.go:87-93` (reads whole body into memory; size bound `MC_MAX_UPLOAD_BYTES` 25 MiB default).
- compute-engine parity: `cloud-init.yaml` values match the Cloud Run intent (the VM has no `containerConcurrency`; `MC_MAX_IN_FLIGHT` is the only bound there).
- Guide safety: no real credentials/account IDs; token scoping instructions correct (Object Read & Write, bucket-scoped); test command matches the actual gate in `apps/backend/internal/adapter/outbound/objectstore/contract_test.go:73` (env var names, package path, `-run` pattern).
- Docs honesty: statuses say PENDING_REVIEW (not DONE); NOT_RUN list present; no overclaim of provider/deploy/billing verification.

## 4. Suggested checks (record commands + exit codes)

- `git diff` (full read) + `git diff --stat`
- Render check (optional, synthetic values): `node ops/deploy/profiles.mjs cloud-run <values> <out>` then inspect rendered YAML for the 4 values
- `grep -rn "120_000" apps/frontend/src/app/api/` — must return no hits in the three transfer routes (other JSON routes may legitimately have none either way)

## 5. Verdict format

Return: `PASS` | `PASS_WITH_LIMITATIONS` | `CHANGES_REQUIRED` + numbered findings (`R2F-xx`, severity P1-P3, file:line, evidence) + what you did NOT verify. Bind verdict to the pinned bytes.
