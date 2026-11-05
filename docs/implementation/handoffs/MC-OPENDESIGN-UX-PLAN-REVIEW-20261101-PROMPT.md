# MC-OPENDESIGN-UX-PLAN-REVIEW-20261101 — prompt cho actual OpenDesign (CO-15: review chuyên môn UX)

Soạn bởi actual ZCode (coordinator) 2026-11-01. Người thực hiện: **actual OpenDesign** (UI/UX owner theo AGENTS.md). Khuyến nghị dispatch: **NGAY** — độc lập với fix-wave (không đụng apps/**). Chuyển nguyên văn từ mục 1.

## 1. Vai trò và ranh giới

Bạn là UI/UX owner, review chuyên môn (không phải duplicate audit): đánh giá improvement-plan do ZCode soạn (ZCode là auditor değil owner UX) và CHỐT thứ tự ưu tiên. Read-only toàn bộ source; không sửa apps/**; không commit; evidence namespace riêng. Mọi lệnh prefix `rtk`. Không đọc secrets.

## 2. Đầu vào

1. `docs/testing/uiux-lawyer-experience-audit-20261030-r1/improvement-plan.md` (P-01..P-15, Pha 0..3, D-1..D-6 — trong đó D-1/D-2/D-9 ĐÃ được PO ratify 2026-10-31).
2. `docs/testing/uiux-lawyer-experience-audit-20261030-r1/` (audit-findings, accessibility-report, terminology-glossary-vi-en).
3. `docs/implementation/workboard-findings.md` (register — Z-F-01..03 đang fix, OV-R13-01 mới).
4. BA §2 personas + `docs/implementation/plans/MC-LEGAL-PERSONA-FLOW-IMPROVEMENT-PLAN-20261030.md`.

## 3. Việc

1. **Disposition từng P-item** (P-01..P-15): AGREE / AMEND (nêu rõ) / REJECT (lý do chuyên môn) / REPRIORITISE — với tư cách owner, quyết định của bạn là tiếng nói UX chính thức sau audit.
2. **Ratify/sửa D-3 terminology** (glossary vi/en): Matter, Action, Filing, role badges — chốt bảng cuối.
3. **Kiểm 2 P2 đang fix** dưới góc UX: Z-F-01/02 purpose-typing (guard chặn filing thiếu package/chữ ký) — UX copy/thông điệp khi bị chặn cần nói gì cho luật sư (đề xuất copy vi/en).
4. **Bổ sung khoảng trống audit không phủ** (populated UI chưa ai thấy): checklist UX cần verify ngay khi walkthrough env sẵn sàng.
5. Không mở lại positioning; không đề xuất ngoài P0/P1/P2 (RECOMMENDATION_NEEDS_PO nếu có).

## 4. Outputs

`docs/testing/opendesign-ux-plan-review-20261101-r1/`: review.md (disposition table + rationale), terminology-final.md (nếu amend), ux-copy-for-guards.md (mục 3), return.md (đề xuất trạng thái REVIEW_RETURNED / IN_REVIEW). Điền 1 đoạn vào task record tương ứng + KHÔNG đụng project-status.md (coordinator gộp).

## 5. Hoàn thành

Mọi P-item + D-3 có disposition có rationale; ít nhất 1 amend/reprioritise có cơ sở (nếu thấy mọi thứ hoàn hảo, nói rõ vì sao); dừng — không tự thực hiện plan.
