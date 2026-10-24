# Open Business Decisions

Product direction và capability baseline đã được PO chấp thuận. Bảng này không mở lại discovery hoặc yêu cầu duyệt lại P0. **Clarification** là chi tiết Step 01; **trade-off** chỉ cần phê duyệt bổ sung nếu phương án làm thay đổi semantics, release criteria hoặc infrastructure constraints.

| ID | Loại / owner | Câu hỏi / bằng chứng còn thiếu | Khi cần giải quyết |
|---|---|---|---|
| OBD-01 | Provenance / PO + Codex | SRC-00A1 xác nhận approved prompts là nguồn hợp lệ; originals chưa từng ở repo/workspace, archival optional | RESOLVED — không chặn Step 01; xem context-provenance.md |
| OBD-02 | Clarification / BA + PO domain owner | Đối tượng áp dụng từng state axis, completion vs verification, transitions, reopen/dispute, evidence verifier permissions, verification reversal, partial evidence và điều kiện VERIFIED | TO_BE_ANALYZED_IN_STEP_01 — Step 01 trước acceptance criteria cuối |
| OBD-03 | Semantic boundary / BA + PO | Mức P0 tối thiểu cho decisions/findings/risks, partial signatures và entity references so với P1 advanced models | TO_BE_ANALYZED_IN_STEP_01 — Step 01; xin quyết định nếu có trade-off làm mất target P0 |
| OBD-04 | Clarification / BA | Dependency satisfaction/endpoints, AND/OR, cycles, cancelled prerequisites, blocker/readiness calculations; Requirement cancellation/waiver, next-action selection và Waiting On | TO_BE_ANALYZED_IN_STEP_01 — Step 01; fixture assumptions không tự thành rules |
| OBD-05 | Clarification / PO domain owner | Filing lifecycle transitions/branches/repeats: khi nào supplement, receipt, authority review, rejection/withdrawal; stage vs state và completion/verification gates | TO_BE_ANALYZED_IN_STEP_01 — Step 01; không suy diễn luật/jurisdiction |
| OBD-06 | Clarification / BA + PO | Deadline timezone/calendar, due-soon threshold, missing due date, escalation attention và override | TO_BE_ANALYZED_IN_STEP_01 — Step 01 |
| OBD-07 | Semantic boundary / BA | Report snapshot semantics, delta brief baseline/as-of/window, deterministic tie/order rules, visibility, no-change result; tối thiểu P0 không kéo snapshots P1 | TO_BE_ANALYZED_IN_STEP_01 — Step 01; quyết định nếu buộc thay P0/P1 boundary |
| OBD-08 | Clarification / BA + PO | Simple roles and ownership, quyền xem/sửa/verify/export; bulk operation behavior gồm validation, permission và failure consistency; import mapping, duplicates, invalid rows, rollback/partial-success expectations | TO_BE_ANALYZED_IN_STEP_01 — Step 01; chưa chọn cơ chế auth/storage |
| OBD-09 | Infrastructure trade-off / Codex + Claude, PO quyết định | Existing Go template, PostgreSQL được nêu trong trục delta và Cloudflare Free Tier/$0 có khả thi với toàn P0 không? Chưa đủ source/runtime/workload evidence | TO_BE_ANALYZED_IN_STEP_01 — Giữ open; audit ở task riêng khi được giao, không thiết kế solution ở Step 00A |
| OBD-10 | Acceptance detail / BA + PO | Tiêu chí pass cho early slice, alpha và full MVP, scenario coverage, usability/keyboard/mobile support và workload | TO_BE_ANALYZED_IN_STEP_01 — Step 01; full MVP vẫn phải có toàn P0 + ba workflows |
| OBD-11 | Clarification / BA + PO | Document authority/current version, evidence retention, superseded versions, verification reversal/invalidation, chỉnh sửa history và quyền truy cập legal data | TO_BE_ANALYZED_IN_STEP_01 — Step 01; không tự khẳng định immutable/audit policy đã phê duyệt |

Không cần quyết định mới để giữ Requirement khác Action, giữ đủ P0, tách COMPLETED/VERIFIED, desktop-first hoặc dùng synthetic data: đó là APPROVED_INPUT.

Không có blocker còn mở về product direction hoặc approved scope. Các business rules ở trên chính là đầu vào Step 01, không chặn việc bắt đầu BA. OBD-09 là risk downstream: Step 01 phân tích workload/NFR; architecture và feasibility kỹ thuật thuộc Step 02/task riêng, chưa có quyết định thay constraint.
