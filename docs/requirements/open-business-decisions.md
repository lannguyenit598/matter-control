# Open Business Decisions

Product direction và capability baseline đã được PO chấp thuận. Bảng này không mở lại discovery hoặc yêu cầu duyệt lại P0. **Clarification** là chi tiết Step 01; **trade-off** chỉ cần phê duyệt bổ sung nếu phương án làm thay đổi semantics, release criteria hoặc infrastructure constraints.

| ID | Loại / owner | Câu hỏi / bằng chứng còn thiếu | Khi cần giải quyết |
|---|---|---|---|
| OBD-01 | Missing input / PO cung cấp, Codex reconcile | Full text A/B chưa có; thiếu original JTBD, initial modules/journey và legal semantics để đối chiếu. PO đã xác nhận thiếu, chưa waive gate | Trước khi tuyên bố canonical consolidated / full Step 01 entry |
| OBD-02 | Clarification / BA + PO domain owner | Đối tượng áp dụng từng state axis, transitions, reopen/cancel/dispute, verifier authority, partial evidence và điều kiện VERIFIED | Step 01 trước acceptance criteria cuối |
| OBD-03 | Semantic boundary / BA + PO | Mức P0 tối thiểu cho decisions/findings/risks, partial signatures và entity references so với P1 advanced models | Step 01; xin quyết định nếu có trade-off làm mất target P0 |
| OBD-04 | Clarification / BA | Dependency endpoints, AND/OR, cycles, cancelled prerequisites, blocked computation; next-action selection và waiting-on relationship | Step 01; fixture assumptions không tự thành rules |
| OBD-05 | Clarification / PO domain owner | Filing branches/repeats: khi nào supplement, receipt, authority review, rejection/withdrawal; stage vs state và completion/verification gates | Step 01; không suy diễn luật/jurisdiction |
| OBD-06 | Clarification / BA + PO | Deadline timezone/calendar, due-soon threshold, missing due date, escalation attention và override | Step 01 |
| OBD-07 | Semantic boundary / BA | Delta brief baseline/as-of/window, deterministic tie/order rules, visibility, no-change result; tối thiểu P0 không kéo snapshots P1 | Step 01; quyết định nếu buộc thay P0/P1 boundary |
| OBD-08 | Clarification / BA + PO | Simple roles và quyền xem/sửa/verify/export/bulk edit; import mapping, duplicates, invalid rows, rollback/partial-success expectations | Step 01; chưa chọn cơ chế auth/storage |
| OBD-09 | Infrastructure trade-off / Codex + Claude, PO quyết định | Existing Go template, PostgreSQL được nêu trong trục delta và Cloudflare Free Tier/$0 có khả thi với toàn P0 không? Chưa đủ source/runtime/workload evidence | Giữ open; audit ở task riêng khi được giao, không thiết kế solution ở Step 00A |
| OBD-10 | Acceptance detail / BA + PO | Tiêu chí pass cho early slice, alpha và full MVP, scenario coverage, usability/keyboard/mobile support và workload | Step 01; full MVP vẫn phải có toàn P0 + ba workflows |
| OBD-11 | Clarification / BA + PO | Evidence retention, superseded versions, verification invalidation, chỉnh sửa history và quyền truy cập legal data | Step 01; không tự khẳng định immutable/audit policy đã phê duyệt |

Không cần quyết định mới để giữ Requirement khác Action, giữ đủ P0, tách COMPLETED/VERIFIED, desktop-first hoặc dùng synthetic data: đó là APPROVED_INPUT.

Nếu A/B chưa thể được cung cấp, chỉ PO mới có thể chỉ định nguồn thay thế hoặc sửa gate bắt buộc đọc hai briefs. Câu trả lời “chưa có” chưa làm thay đổi gate này.
