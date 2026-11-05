# Task walk-throughs — 10 nhiệm vụ luật sư

Phương pháp: mỗi nhiệm vụ đi theo thiết kế đã implement (source) + thử thật phần có thể trên runtime fail-closed. "Số bước" đếm theo điều hướng/thao tác trên source route/component. Vì UX-L-03 (không có dữ liệu populated), các nhiệm vụ 2–9 kết thúc ở trạng thái BLOCKED_RUNTIME — kết luận giá trị nằm ở (a) thiết kế có hỗ trợ nhiệm vụ không, (b) ngõ cụt thật đã quan sát. Đây KHÔNG phải đo lường người dùng thật.

## T1 — Sáng mở ứng dụng: biết việc cần làm và vì sao trong ≤10 giây
- Rendered: mở `/` → redirect `/my-actions` → **"Tạm thời không khả dụng"** (không có dữ liệu). Ngõ cụt thật duy nhất: nút "Thử lại" (honest, không fake).
- Source: workbench cho ngay 1 mục hiện tại + "Vì sao đây là việc tiếp theo" + 1 hành động chính; queue rail 4 đích + counts; Up next ≤3. Thiết kế ĐÁP ứng ≤10s nếu dữ liệu có mặt.
- Verdict: **BLOCKED_RUNTIME** (thiết kế conformant; AC-137 vẫn NOT_RUN).

## T2 — Vào một Matter: hiểu tình trạng, blocker, ai cần hành động
- Rendered: `/matters/m-atlas-01/*` → ReadFailure toàn subtree, mất tabs/CONTEXT (UX-L-05). Sau lỗi, quay lại `/matters` cũng ReadFailure → **không có lối "xem hồ sơ khác" khi API chết** (danh sách cũng chết) — dead-end thật.
- Source: Matter overview = title + as-of + role badge + "Create status brief" + Add work dialog; MatterAttention (blocked here / your work here); Control Room là read model riêng (BF-07, từng phần fail không che phần còn lại). Thiết kế conformant với info-budget ("một câu sự thật + blockers").
- Verdict: **BLOCKED_RUNTIME**; finding UX-L-05 ăn điểm này.

## T3 — Thực hiện một Action và nộp evidence
- Source: work/[itemId] → form hành động qua IntentForm/attempt infra; draft giữ qua reload (cr-002 scope bindings); evidence submit tách verification. Nộp xong quay lại giữ filter/selection (myWorkHref withFrom).
- Rendered: không vào được (BLOCKED_RUNTIME).
- Verdict: **SOURCE_READ** — luồng có thiết kế; rủi ro OUTCOME_UNKNOWN copy đã có (creation-flow-ux-r1), cần kiểm chứng rendered khi có runtime.

## T4 — Reviewer xét một evidence theo đúng version
- Source: `/my-reviews` + review-queue: mô tả trang đúng vai trò ("Evidence others have offered… not your assigned work"); proof-panel yêu cầu criterion + exact version + submitter + verifier eligibility (design brief §8; permission guard designated-verifier ≠ submitter).
- Verdict: **SOURCE_READ + BLOCKED_RUNTIME**. En-header của trang đang kẹt EN (UX-L-02).

## T5 — Theo dõi ký tên từng phần
- Source: Document versions + signature components (GW-01; document detail có "Make version current" OWNER-only); partial signature không tự thành đủ.
- Verdict: **SOURCE_READ + BLOCKED_RUNTIME**.

## T6 — Theo dõi một filing đến kết quả
- Source: filings/new route riêng (đúng action-entry: dedicated route cho high-consequence), stage flow theo state-semantics (Submission→Receipt→Authority Review→Supplement→Response→Approval; receipt ≠ approval hiển thị theo cột riêng).
- Rendered: `filings/new` cũng ReadFailure.
- Verdict: **SOURCE_READ + BLOCKED_RUNTIME**.

## T7 — Review due diligence trên review grid
- Source: WorkGrid: table role + aria-label "Work items table, scrollable", min-w 56rem trong overflow-x-auto (scroll ngang ở 390 — chấp nhận được cho grid dày desktop-first), canEdit read-only notice, density prop, filters có stories.
- Verdict: **SOURCE_READ + BLOCKED_RUNTIME**; keyboard-nav 50/200 hàng (AC-111) NOT_RUN.

## T8 — Soạn status brief gửi quản lý/khách
- Source: `/matters/[id]/data#status-brief`; AC-119 deterministic draft (cùng input → cùng facts/order/provenance).
- Verdict: **SOURCE_READ + BLOCKED_RUNTIME**.

## T9 — Import checklist từ Excel
- Source: data-transfer: bulk/import/export là dedicated area (không modal) — đúng brief; imported VERIFIED → reviewable claim, not actual VERIFIED.
- Verdict: **SOURCE_READ + BLOCKED_RUNTIME**.

## T10 — Khôi phục sau lỗi / OUTCOME_UNKNOWN / stale
- Rendered (có thật): "Thử lại" reload route, giữ được ngôn ngữ/đã chọn — không fake success, không tự retry ngầm (tốt). ReadFailure copy trung thực.
- Nhưng: sự cố streaming (UX-L-10) cho thấy **một kiểu fail không có affordance nào**: main rỗng, không lỗi, không retry. Nếu prod gặp → mất hoàn toàn khả năng khôi phục tại chỗ.
- Source: OUTCOME_UNKNOWN có thiết kế riêng (intent-form + idempotency same-key retry; "không mint key mới"; access-loss purge) — conformant với Required State Specification.
- Verdict: **PASS cục bộ (Rendered cho ReadFailure) + RỦI RO UX-L-10 + phần còn lại SOURCE_READ**.

## Bảng tổng
| # | Nhiệm vụ | Verdict | Ngõ cụt thật quan sát |
|---|---|---|---|
| T1 | Open app ≤10s | BLOCKED_RUNTIME (thiết kế OK) | Unavailable state |
| T2 | Matter comprehension | BLOCKED_RUNTIME | Mất context khi fail (UX-L-05); dead-end khi list cũng fail |
| T3 | Action + evidence | SOURCE_READ | — |
| T4 | Review evidence | SOURCE_READ | EN header (UX-L-02) |
| T5 | Signature tracking | SOURCE_READ | — |
| T6 | Filing outcome | SOURCE_READ | — |
| T7 | DD grid | SOURCE_READ | — |
| T8 | Status brief | SOURCE_READ | — |
| T9 | Excel import | SOURCE_READ | — |
| T10 | Recovery | PASS cục bộ + RỦI RO | Empty-main fail không affordance (UX-L-10) |
