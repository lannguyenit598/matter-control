# MC-ZCODE-R2-STORAGE-FIX-20261106

| Trường | Giá trị |
|---|---|
| **Requirement** | Fix D-01/D-02 từ audit lưu trữ file R2 2026-11-06; đóng điều kiện tiên quyết gate B3 (free-phase-deploy-checklist) |
| **Owner** | ZCode (backend execution owner, PO restore 2026-10-26; FE 3 dòng thuộc assignment P0 BE+FE) |
| **Priority** | P2 (deployment-blocking cho pilot Phase 2-6) |
| **Status** | MERGED — `develop@06a60016` (no-ff, PO duyệt 2026-11-06); interim fresh-context review PASS_WITH_LIMITATIONS (R2F-01/02 đã fix); formal external review qua dispatch packet khi PO cần verdict binding; B3 chờ PO provision |
| **Base / Head** | base `develop@41098a4d` → branch `zcode/r2-storage-fix-20261106` (38ae2458 + 26680dc1) → merged `develop@06a60016`, local-only chưa push |
| **Scope** | Config/manifest + 1-dòng FE ×3 + guide B3 + task record. **0 dòng Go** |
| **Dependencies** | Design MC-ZCODE-R2-STORAGE-FIX-DESIGN-20261106 (DESIGN_VALIDATED_BY_PO từng phần, 2026-11-06) |
| **Inputs** | Audit findings D-01..D-08 (memory `mc-r2-storage-audit-20261106`); ADR-006/007; free-phase-deploy-checklist B3/B68-69 |
| **Outputs** | 5 file sửa + 3 file mới (danh sách dưới) |

## Changed files

1. `ops/deploy/cloud-run/service.yaml` — `containerConcurrency` 10→4; `timeoutSeconds` 75→330; `MC_TRANSFER_TIMEOUT` 60s→300s; `MC_MAX_IN_FLIGHT` 10→4 (+2 comment đồng bộ)
2. `ops/deploy/compute-engine/cloud-init.yaml` — `MC_TRANSFER_TIMEOUT=300s`; `MC_MAX_IN_FLIGHT=4`
3. `apps/frontend/src/app/api/matters/[matterId]/documents/[documentId]/versions/route.ts` — `timeoutMs` 120_000→330_000
4. `apps/frontend/src/app/api/matters/[matterId]/documents/[documentId]/versions/[versionId]/content/route.ts` — 120_000→330_000
5. `apps/frontend/src/app/api/matters/[matterId]/export/route.ts` — 120_000→330_000
6. **NEW** `docs/deployment/r2-provision-and-b3.md` — guide PO tự provision bucket + token + chạy `TestContract_R2_RealBucket` (đóng B3) + PO decisions D-04/05/07
7. **NEW** `docs/implementation/plans/MC-ZCODE-R2-STORAGE-FIX-DESIGN-20261106.md` — design of record (R2F-02 bổ sung vào danh sách)
8. **NEW** `docs/implementation/tasks/MC-ZCODE-R2-STORAGE-FIX-20261106.md` (file này)

## Acceptance criteria & kết quả

| AC | Kết quả |
|---|---|
| AC1 Worst-case upload buffer ≤ ~20% memory instance | ✅ 4×25MiB=100MiB trên 512Mi; verify bằng render thực tế |
| AC2 Chuỗi timeout BFF ≥ platform ≥ backend | ✅ 330s ≥ 330s ≥ 300s; 25MiB @ ≥0.7 Mbps |
| AC3 Manifest render + validate ở dạng RENDERED | ✅ `node ops/deploy/profiles.mjs cloud-run <values> <out>` exit ok; YAML parse OK (`timeoutSeconds: 330`, `concurrency: 4`); values synthetic /tmp/mc-r2-render |
| AC4 Backend no-drift | ✅ `make check` exit 0 với PG fixture — golangci-lint 0 issues, `go test -race` all ok (objectstore 10.1s, postgres 149.8s) |
| AC5 FE gates | ✅ `pnpm check` xanh lần 2 (typecheck/lint/format/test/agents); `pnpm test` 951/951 pass, 124 files; lần 1 có 1 flake `pending-attempts.test.ts` "Bug 2" — pass 8/8 isolated, không tái hiện |
| AC6 Guide B3 đầy đủ bước PO + evidence format | ✅ docs/deployment/r2-provision-and-b3.md |

## Tests run / not run

- **Run**: backend `make check` (PG `mc-r2-check-pg:5434` postgres:18-alpine — container GIỮ lại cho reviewer); FE `pnpm check` ×2 + `pnpm test` + vitest isolated `pending-attempts.test.ts`; manifest render + YAML parse
- **NOT_RUN**: real-bucket `TestContract_R2_RealBucket` (cần token R2 — PO chạy theo guide, là chính gate B3); deploy thật Cloud Run/Workers; load-test 4 concurrent uploads; verify billing $0; browser E2E download

## Reviewer

- **Interim review** (fresh-context subagent, cùng harness — KHÔNG thay thế review external): `PASS_WITH_LIMITATIONS` 2026-11-06, 2 findings đã fix trước commit: R2F-01 (P2) guide ghi sai cú pháp CLI render (flag `--values/--out` → positional) — đã sửa; R2F-02 (P3) task record thiếu design doc trong Outputs — đã bổ sung. Hard criteria đều PASS (0 file .go, values khớp design §4.1, chuỗi timeout đúng, memory claim đúng, guide không có secret thật).
- **Formal independent review**: dispatch packet sẵn tại `docs/implementation/handoffs/MC-ZCODE-R2-FIX-REVIEW-20261106-PROMPT.md` — PO có thể dispatch external reviewer nếu muốn verdict binding trước DONE.
- Commit: theo playbook Mimosa (nếu bị chặn → PO Terminal per precedent termsheet 20261105).

## Risks

- Concurrency 4 là ceiling mọi request — nếu pilot cần cao hơn phải nâng kèm memory (quyết riêng)
- Flake "Bug 2" xuất hiện 1/2 lần full-run — đã pass 2/2 isolated, nên theo dõi
- B3 phụ thuộc PO có quyền dashboard R2 + payment method (checklist:39 đã tick)
