# MC-ZCODE-ENABLEMENT-MINIFIX-20261101 — prompt cho session ZCode mới (CO-17 scripts + OV-R13-01 + erratum)

Soạn bởi actual ZCode (coordinator) 2026-11-01. Người thực hiện: session ZCode mới. Khuyến nghị dispatch: **NGAY với kỷ luật path-rời-nhau** — 3 việc này KHÔNG đụng apps/** (fix-wave đang giữ) và không đụng docs/testing/*verify-wave*; tiền lệ chung sống đã có (coordinator-playbook session). Chuyển nguyên văn từ mục 1.

## 1. Vai trò và ranh giới

Bạn là engineer thực thi 3 việc nhỏ đã được quyết (D-1(b) ratified; OV-R13-01 do OpenCode tìm ra). KHÔNG đụng: apps/** (fix-wave đang giữ), docs/testing/opencode-verify-wave-20261031-r1/**, docs/testing/mc-p1-fix-wave-20261031-r1/**, :3000/:8080/runtime ai. Commit theo từng việc, message tham chiếu ID. Mọi lệnh prefix `rtk`; không đọc secrets; Mimosa: nếu commit bị chặn → theo `docs/implementation/plans/MC-MIMOSA-GATE-COMMIT-PLAYBOOK-20261031.md`.

## 2. Việc theo thứ tự

**M1 — OV-R13-01 (P2, deploy-blocker):** sửa YAML indent `ops/deploy/cloud-run/migrate-job.yaml` (OpenCode: parse fail trong lô 6 file); validate lại cả 6 file bằng PyYAML (receipt exit 0 cho cả 6); commit riêng "Fix OV-R13-01: migrate-job.yaml YAML structure". **Freeze-check trước: nếu file đang dirty bởi session khác → STOP, báo coordinator.**

**M2 — CO-17 scripts (D-1(b) ratified):** viết 3 script theo `docs/deployment/walkthrough-env.md` + receipts r2 (`docs/testing/zcode-ba-flow-completeness-20261030-r1/r2/commands/runtime-env.txt`, `run-records.md`): `up.sh` (PG container nhãn mc-walkthrough + migrations + build mcapi + stub IdP tự sinh key 0700 ngoài git), `mint-token.sh` (bearer cho 5 synthetic user; Idempotency-Key UUIDv7), `down.sh` (teardown đầy đủ — không để orphan như 18082). Smoke 1 lần: readyz 200 / no-token 401 / token 200 / token lạ 401; teardown sạch. Vị trí: `ops/local/walkthrough/` + cập nhật walkthrough-env.md §4 (bỏ mục "việc còn lại"). Không commit key/key material — chỉ script.

**M3 — Runbook erratum (pooler):** `docs/deployment/pilot-deploy-runbook.md` §1 — thêm erratum: Supavisor client limit **200 (Nano-tier)** đã verify từ docs chính thức (supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits); budget peak ~72–102 < 200 → giữ quyết định không thêm MC_DB_MAX_CONNS; caveat "re-check nếu compute tier khác". Commit riêng.

## 3. Outputs

Namespace `docs/testing/mc-enablement-minifix-20261101-r1/`: return.md (per-item evidence, receipts, smoke log), commands/. Cập nhật `workboard-findings.md`: OV-R13-01 → FIXED_PENDING_VERIFY; CO-17 → DONE (scripts + smoke). Task record tương ứng + KHÔNG đụng project-status.md.

## 4. Hoàn thành

3 commit (M1/M2/M3) riêng biệt + receipts; smoke teardown sạch (không orphan); dừng — verify OV-R13-01 do OpenCode làm trong wave đang chạy.
