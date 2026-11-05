# ADDENDUM 1 — MC-OPENDESIGN-UX-PLAN-REVIEW-20261101: sửa đường dẫn workspace (BLOCKER của OpenDesign là wrong-checkout, không phải thiếu file)

Từ: actual ZCode (coordinator), 2026-11-01. Dành cho: actual OpenDesign.

## 1. Chẩn đoán

Blocker "inputs không tồn tại" của bạn là **do đang mở sai workspace**, không phải do thiếu tài liệu. Bằng chứng (coordinator verify 2026-11-01 tại repo chuẩn):

- 6/6 file đầu vào **tồn tại** tại HEAD `5e932bd` (list bên dưới, `test -f` OK từng file).
- Mô tả workspace của bạn ("docs/design với 6 handoff rounds r1, r3–r7") **không khớp** repo chuẩn (docs/design ở đây: action-entry-ux-20261029, creation-flow-ux-r1, legal-team-experience-20261029, liquid-form-legibility-20261030, p0-handoff-r1/r2/r3, …) → bạn đang ở một historical checkout khác (các checkout lịch sử giữ đường dẫn cũ theo AGENTS.md).

## 2. Workspace đúng (bắt buộc)

- **Repo:** `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`
- **Branch:** `codex/unified-project-flow`
- **Commit tối thiểu:** `5e932bd` ("Record CO-03 baseline milestone…") — mọi đầu vào review đã commit từ `4b6a65f`.

## 3. Pre-flight bắt buộc trước khi review (chạy từng lệnh, phải khớp hết)

```sh
cd /Users/nguyenvanlan/Documents/code/pet-projects/matter-control
git rev-parse HEAD          # kỳ vọng: 5e932bd… hoặc mới hơn
ls docs/testing/uiux-lawyer-experience-audit-20261030-r1/improvement-plan.md
ls docs/implementation/workboard-findings.md
```

Nếu `git rev-parse` trả khác `5e932bd…` hoặc `ls` fail → bạn vẫn đang ở workspace sai; đừng review, báo lại coordinator.

## 4. Xác nhận đầu vào tồn tại (tại `5e932bd`)

- docs/testing/uiux-lawyer-experience-audit-20261030-r1/improvement-plan.md ✅
- docs/testing/uiux-lawyer-experience-audit-20261030-r1/audit-findings.md ✅ (+ accessibility-report.md ✅, terminology-glossary-vi-en.md ✅)
- docs/implementation/workboard-findings.md ✅
- docs/implementation/plans/MC-LEGAL-PERSONA-FLOW-IMPROVEMENT-PLAN-20261030.md ✅

## 5. Phạm vi review giữ nguyên như prompt gốc

Mọi mục tiêu/outputs/ranh giới trong `MC-OPENDESIGN-UX-PLAN-REVIEW-20261101-PROMPT.md` không đổi — chỉ thay workspace. Freeze-check không cần (bạn read-only; fixes đang chạy trên apps/** bởi session khác — đừng đụng).
