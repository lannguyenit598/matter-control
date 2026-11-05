# MC-OPENDESIGN-UX-PLAN-REVIEW-20261101 (CO-15)

- **Owner:** actual OpenDesign (UI/UX owner theo AGENTS.md)
- **Task ID:** CO-15 (Pha 2 review theo `docs/implementation/plans/MC-COORDINATION-P0-CLOSURE-PLAN-20261031.md`)
- **Authority:** Coordinator dispatch `docs/implementation/handoffs/MC-OPENDESIGN-UX-PLAN-REVIEW-20261101-PROMPT.md` và `MC-OPENDESIGN-UX-PLAN-REVIEW-20261101-ADDENDUM-1.md`
- **Priority:** P1
- **Status:** **REVIEW_RETURNED** (bàn giao kết quả review chuyên môn, không tự thực hiện code hay deploy)
- **Repository:** `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, HEAD `5e932bd`

---

## 1. Ranh giới & kỷ luật đường dẫn

- Thực hiện đúng vai trò UI/UX owner: review chuyên môn, đánh giá improvement plan và chốt thứ tự ưu tiên.
- Quyết định D-1/D-2/D-9 đã được PO RATIFY 2026-10-31 → review với tư cách quyết định đã chốt.
- **Read-only tuyệt đối:** không chạm `apps/**`, không chạm `docs/ai-sdlc/project-status.md`, không tự thực hiện plan, không commit/push.

---

## 2. Đầu vào đã xử lý

1. `docs/testing/uiux-lawyer-experience-audit-20261030-r1/improvement-plan.md` (P-01..P-15, Pha 0..3, D-1..D-6)
2. `docs/testing/uiux-lawyer-experience-audit-20261030-r1/` (audit-findings.md, accessibility-report.md, terminology-glossary-vi-en.md)
3. `docs/implementation/workboard-findings.md` (register — Z-F-01..03, D-1/D-2/D-9 RATIFIED, OV-R13-01)
4. `docs/implementation/plans/MC-LEGAL-PERSONA-FLOW-IMPROVEMENT-PLAN-20261030.md` + BA §2 personas

---

## 3. Kết quả review & Deliverables

Tất cả deliverables đã nộp vào namespace riêng: `docs/testing/opendesign-ux-plan-review-20261101-r1/`

| Deliverable | Tệp | Nội dung chính |
|---|---|---|
| **P-item Dispositions** | `review.md` §1–§2 | 15/15 items: **11 AGREE, 3 AMEND, 1 REPRIORITISE**.<br>- **P-02 AMEND effort:** M-L → **L** (middleware + RSC rewrite + 22-route regression).<br>- **P-03 AMEND scope:** Thu hẹp theo D-1(b) RATIFIED thành đóng gói walkthrough env (mcapi + stub-IdP + PG fixture); bỏ in-memory demo fixtures và demo banner; effort L → **M**.<br>- **P-06 AMEND dependency:** Tách 2 bước; sweep EN literals → LocalizedText ngay, không chờ D-3; thay nhãn vi sau khi PO duyệt R10.<br>- **P-09 REPRIORITISE ↑:** Pha 3 → **Pha 1** (Live-region shell/WCAG 4.1.3 là hạ tầng accessibility, bắt buộc có trước khi chạy VoiceOver/SR testing trên 3 Golden Workflow ở Pha 1). |
| **D-3 Terminology Final** | `terminology-final.md` | Bảng chuẩn hóa vi/en toàn diện cho Matter ("Hồ sơ"), Workspace ("Không gian làm việc"), Filing ("Hồ sơ khai", badge ngắn "Khai"), Action ("Hành động"), role badges ("Chủ hồ sơ", "Người chỉnh sửa", "Người xem"), kèm 3 amendments có căn cứ UX. |
| **UX Copy for Guard Z-F** | `ux-copy-for-guards.md` | Bộ thông điệp vi/en inline validation + tooltip button disabled cho Z-F-01 (proof-required empty package) và Z-F-02 (signature required sai criterion), trường hợp kết hợp, aria-live và pattern tổng quát. |
| **Populated UI Checklist** | `review.md` §5 | 14 tiêu chí kiểm thử (V-01..V-14) trên 2 viewport (1440px desktop + 390px mobile) cùng VoiceOver session khi walkthrough env D-1(b) sẵn sàng. |
| **Return Status** | `return.md` | Trạng thái đề xuất REVIEW_RETURNED, tóm tắt metric, hành động tiếp theo cho coordinator. |

---

## 4. Hành động tiếp theo đề xuất (Coordinator / PO)

1. Cập nhật workboard và improvement-plan với 3 AMEND và 1 REPRIORITISE.
2. Áp dụng `terminology-final.md` sau khi PO duyệt R10 (batch #2).
3. Chuyển `ux-copy-for-guards.md` cho fix-wave CO-06 để đồng bộ thông điệp với backend purpose-typing guard.
4. Lên lịch walkthrough verification session theo checklist §5 ngay khi CO-17 walkthrough env sẵn sàng.
