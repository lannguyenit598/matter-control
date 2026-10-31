# Playbook: commit baseline khi bị Mimosa git-gate chặn (2026-10-31)

Bối cảnh: fix-wave (MC-ZCODE-P1-FIX-WAVE-20261031) phải commit baseline candidate; rủi ro tiền lệ MC-BE-01-R1 (git-gate hook chặn commit agent, BLOCKED_NO_DISPOSITION_INTERFACE). PO đã phê duyệt commit (DEC-20261031-01).

## 0. Dữ kiện đã xác minh 2026-10-31
- Mimosa plugin trên máy: **1.0.4** — chưa có kênh disposition/false_positive (khớp kết luận R1: `docs/testing/be01-zcode-mimosa-investigation-r1/report.md`).
- **Không có native git hook** trong repo → gate chỉ là PreToolUse(Bash) của agent harness → **chỉ chặn agent chạy `git commit`, không chặn con người gõ lệnh trong Terminal**.
- PO đã ratify commit (DEC-20261031-01) — quyền commit thuộc PO, không phải agent.

## 1. Cây quyết định (làm theo thứ tự, dừng ở nhánh đầu tiên xử lý được)

### Bước 1 — Để session thử commit bình thường
Có thể gate không fired ở ngữ cảnh này (R1 xảy ra trên nhánh `codex/mc-be-01` với sealed-build state khác). Nếu commit thành công → xong, không cần gì thêm.

### Bước 2 — Nếu bị chặn: phân loại refusal TRƯỚC khi chọn hướng
Đọc stderr/log của lần commit bị chặn:
- **(a) Refusal là finding bảo mật thật** (vd. quét thấy secret/credential trong nội dung commit) → đây KHÔNG phải vấn đề gate: sửa nội dung (xoá secret, redact) rồi commit lại. Loop bình thường.
- **(b) Refusal là cùng git-gate "sealed build"/no-disposition như R1** → sang Bước 3.

### Bước 3 — **Đường khuyến nghị: PO tự commit trong Terminal** (không bypass, không đụng plugin)
Cơ sở: gate là guard-rail cho AGENT; con người với quyền PO đã phê duyệt commit thì tự gõ lệnh là hành sử dụng quyền của mình — gate không bị qua mặt, plugin không bị đụng, không có "agent vượt quyền".
1. Coordinator chuẩn bị commit sheet (xem §2): danh sách file staged, commit message, thứ tự.
2. **PO mở Terminal, dán 3 lệnh** (add → commit → tag/ghi nhận). KHÔNG chạy qua agent.
3. Agent session (fix-wave) sau đó `git rev-parse HEAD` để re-pin — việc ĐỌC git không bị gate.

### Bước 4 — Nếu PO không tiện tự gõ: escalate maintainer Mimosa
Gửi R1 report + đề nghị (theo thứ tự ưu tiên R1): (i) rule/dataflow fix, (ii) gate honour disposition `false_positive` qua audit. Chờ maintainer — trong lúc chờ, fix-wave vẫn chạy theo fallback (durable patch, không commit).

### Bước 5 — Tuyệt đối cuối: PO-authorized evidence edit
Chỉ khi PO hiểu rõ và ra lệnh rõ ràng bằng văn bản; phải audit trail đầy đủ (ai, khi nào, sửa gì, lý do) — theo đúng hierarchy R1: "rule/dataflow fix preferred > audited false_positive state honored by gate > PO-authorized evidence edit".

### KHÔNG BAO GIỜ
Sửa/touch file hook/plugin · `git commit --no-verify` · giả mạo seal/ledger state không có phê duyệt văn bản · để agent "thử cách khác" quanh gate mà không có quyết định PO.

## 2. Commit sheet (coordinator chuẩn bị sẵn — PO dán khi cần)

```sh
cd /Users/nguyenvanlan/Documents/code/pet-projects/matter-control
git add -A
git commit -m "P0 local candidate baseline @0de3e5d+dirty (DEC-20261031-01)

Known defects at baseline (see docs/implementation/workboard-findings.md):
Z-F-01/Z-F-02 (P2, filing package/signature guards purpose-blind),
UX-L-01/02/04/05/06, PI-01..04 remediated pending independent verify.
Fix wave MC-ZCODE-P1-FIX-WAVE-20261031 follows as separate commits."
git log -1 --format='%H %ci %s'
```

Ghi chú: `git add -A` gồm cả docs/testing evidence — nếu muốn tách, commit code trước (`git add apps/ ops/ .github/`), evidence sau. Sau commit: coordinator/session re-pin manifest, mở verify wave cho OpenCode.

## 3. Trách nhiệm
| Bước | Ai |
|---|---|
| Phân loại refusal | Fix-wave session (báo coordinator) |
| Chuẩn bị commit sheet | Coordinator (ZCode) |
| Gõ lệnh commit | **PO** (người duy nhất) |
| Escalate maintainer | PO/vendor channel |
| Re-pin + mở verify | Coordinator/fix-wave session |
