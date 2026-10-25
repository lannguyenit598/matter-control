# MatterControl — STEP 03A · Handoff Report

**MC-003A · Review build 0.1 · Exploratory**

Báo cáo bàn giao cho **Product Owner design review**. Tài liệu này tổng hợp artifact đã tạo, phạm vi đã đặc tả, các quyết định còn mở, phụ thuộc kiến trúc và giới hạn bằng chứng. Nó **không** phải xác nhận hoàn tất production, không phải usability report và không phải phê duyệt hướng hình ảnh.

---

## 1. Tóm tắt điều hành

Đã hoàn thành một **browsable concept-review artifact** (HTML) cùng **bộ đặc tả Markdown** cho STEP 03A:

- 13 screen specifications, trong đó **9 màn hình/partial tương tác** và **4 specification-only**.
- Control Room và Operational Grid dùng chung object model, state semantics và evidence model.
- Ba visual directions A/B/C; khuyến nghị **Direction A làm nền, mượn impact rail từ B và compact density từ C** — chưa được PO duyệt.
- 3 golden workflows, 12 interaction patterns, responsive strategy, accessibility strategy, usability test plan, 16-item architecture dependency list và design decision log.
- Toàn bộ dữ liệu là **Project Atlas synthetic**; mọi chuyển cảnh client-side là mô phỏng và reset khi reload.

**Sẵn sàng cho PO review:** IA, journeys, Control Room, Operational Grid, ba directions, screen specs, interaction plan, architecture dependency list.

**Chưa sẵn sàng để build production:** visual direction, design-system tokens, high-fidelity, auth/API/persistence/realtime, usability validation. Architecture gate vẫn **OPEN**; Step02.3 chạy riêng.

---

## 2. Deliverable inventory

| # | Deliverable | Vị trí | Trạng thái |
|---|---|---|---|
| 01 | Product UX Brief | HTML §01 · Specs §1 | Hoàn tất cho review |
| 02 | Persona UX Analysis | HTML §02 · Specs §2 | Hoàn tất cho review |
| 03 | Information Architecture | HTML §03 · Specs §3 | Hoàn tất cho review |
| 04 | Primary User Flows | HTML §05 · Specs §6 | Hoàn tất cho review |
| 05 | Screen Inventory | HTML §03/§09 · Specs §3.3/§5 | 13 màn hình |
| 06 | Control Room Wireframe | HTML §06 | Tương tác |
| 07 | Operational Grid Wireframe | HTML §06 | Tương tác |
| 08 | Three Golden Workflows | HTML §05 · Specs §6 | Hoàn tất cho review |
| 09 | Three Visual Directions | HTML §07 | **Chờ PO chọn** |
| 10 | Initial Design System | HTML §08 · Specs §10 | Seed exploratory |
| 11 | Interaction Specifications | HTML §10 · Specs §7 | 12 pattern |
| 12 | Responsive Strategy | HTML §11 · Specs §8 | Thiết kế, chưa QA matrix |
| 13 | Accessibility Strategy | HTML §12 · Specs §9 | Mục tiêu AA, chưa audit |
| 14 | Usability Test Plan | HTML §13 · Specs §11 | 11 bài, **chưa chạy** |
| 15 | Architecture Dependency List | HTML §14 · Specs §12 | 16 mục, gate mở |
| 16 | Design Decision Log | HTML §16 · Specs §14 | 12 quyết định, 5 chờ PO |

---

## 3. Artifact files

| File | Nội dung | Trạng thái |
|---|---|---|
| `mattercontrol-step-03a-ux-concept-review.html` | Artifact review chính: brief, personas, IA, flows, wireframes tương tác, 3 directions, design-system seed, 13 screen specs, interaction/responsive/a11y, validation plan, architecture dependencies, status brief, decision log, provenance & gate. | Hoàn tất cho review |
| `mattercontrol-step-03a-ux-specifications.md` | Đặc tả 13 màn hình, state model, interaction patterns, responsive/a11y, design tokens, test plan, architecture dependencies, deliverables, decision log. | Hoàn tất cho review |
| `mattercontrol-step-03a-handoff-report.md` | Báo cáo này: bàn giao, provenance, quyết định mở, rủi ro, giới hạn. | Hoàn tất cho review |

Không có asset ảnh bên ngoài, không hotlink, không font tải ngoài. Font dùng system stack.

---

## 4. Những gì đã được khóa theo brief

Các quy tắc semantic dưới đây được giữ nguyên trong toàn bộ artifact:

1. `COMPLETED` **không** đồng nghĩa `VERIFIED`.
2. Upload **không phải** verification.
3. Proof gate chỉ đạt với `COMPLETED + VERIFIED` hoặc `NOT_REQUIRED` hợp lệ.
4. Dispute vô hiệu hóa kết quả; reopen/reversal reblock downstream nhưng không xóa history.
5. Dependency readiness là **derived**; không có thao tác đặt `READY`; unavailable evaluation không mặc định `READY`.
6. Chỉ `OWNER` được cancel/reopen và promote phiên bản hiện hành.
7. Persona **khác** matter role; `OWNER`/`EDITOR`/`VIEWER` là quyền trong matter.
8. Cần workspace đang hoạt động **và** matter membership; thiếu một trong hai thì không lộ dữ liệu matter.
9. `VIEWER` chỉ đọc/export.
10. Bulk chỉ metadata `owner`/`date`/`workstream`, preview theo row, giữ selection lỗi; không bulk transition status.
11. Ngày có timezone (`UTC+07`) và as-of.
12. Không có overall readiness %.
13. Action không tự hoàn tất Requirement.
14. Reviewer không được trùng submitter.

---

## 5. Interactive vs specification-only

### 5.1 Tương tác trong review build

| Màn hình / partial | Hành vi mô phỏng |
|---|---|
| Matter Control Room | Impact chain, blocker, evidence strip, decisions, waiting, milestones, changes; mở Requirement/Action drawer. |
| Operational Grid | Filter, search, sort, multi-select, bulk metadata preview/apply, row detail, density 24/50/100/200, compact mode. |
| Requirement Detail | Tab Tổng quan/Bằng chứng/Phụ thuộc/Lịch sử; proof gate; link sang Evidence/Dependency. |
| Action Detail | Execution/dependency, lý do blocked/waiting, liên kết Requirement. |
| Dependency View | Chain `RQ-04 → AC-05 → AC-07 → AC-08 → AC-09`, cạnh phụ, rule derived, không có “đặt READY”. |
| Evidence & Verification | Chọn record, review criterion/version/submitter/reviewer, xác minh/từ chối mô phỏng. |
| Document Versions | Danh sách tài liệu/phiên bản, current vs superseded, trạng thái ký. |
| Excel/CSV Import Wizard | Stepper Map → Preview → Draft; không tạo verification. |
| Status Brief | Bản narrative có as-of, blocker, decision, waiting, evidence gap, milestone, giới hạn dữ liệu. |

### 5.2 Specification-only

- **Matter List** — đặc tả đủ cho implementation brief, nhưng review build không dựng route/danh sách matter.
- **My Actions** — queue việc; chưa dựng thành màn hình hoạt động.
- **Waiting On** — grouped list; chưa dựng thành màn hình hoạt động.
- **Filing Detail** — lifecycle/checklist; chưa dựng thành màn hình hoạt động.

“Specification-only” không có nghĩa màn hình bị bỏ qua; nghĩa là review build không dựng đủ dữ liệu/route để thao tác an toàn.

### 5.3 Demo states

Có thể chuyển trạng thái demo trong toolbar: **Default · Loading · Empty · Error · Denied · Stale · Conflict · Partial success**. Mỗi state minh hoạ cách không che dữ liệu cũ, không giả realtime và không biến lỗi thành “thành công toàn bộ”.

### 5.4 Điều đã mô phỏng, không phải chức năng thật

- Mọi thay đổi state/selection/bulk/evidence decision chỉ nằm trong bộ nhớ trình duyệt và **reset khi reload**.
- Không có auth, authorization enforcement, API call, persistence, pagination server-side, concurrency control hay realtime.
- Bulk “áp dụng” cập nhật object client-side; partial failure được mô phỏng cho `RQ-10` (revision conflict) và `RQ-12` (permission denied).
- Import “tạo bản nháp” chỉ hiện toast; không tạo file hay record thật.
- Toast và focus restoration là hành vi prototype, không phải cam kết backend.

---

## 6. Hướng dẫn đọc cho đội implementation

Thứ tự đề xuất:

1. **Specs §1–§4** — mục tiêu, quy tắc semantic, persona/role, IA và state model.
2. **Specs §5** — 13 screen specs; đọc kèm HTML §09 để thấy wireframe cấu trúc.
3. **HTML §06** — tương tác Control Room/Grid để hiểu hành vi mong đợi.
4. **Specs §7–§9** — interaction, responsive, accessibility.
5. **Specs §10** — design-system seed (chỉ tham chiếu, không import production).
6. **Specs §12** — architecture dependencies; không tự chọn cơ chế kỹ thuật.
7. **HTML §07 + Specs §14** — visual directions và decision log trước khi làm high-fidelity.

**Guardrails:**

- Không suy diễn API/schema/auth/persistence từ UI.
- Không thêm overall readiness score, donut chart hay “matter health”.
- Không gộp execution và verification thành một badge.
- Không cho dropdown “Verified” tự do; luôn gắn criterion + version + reviewer độc lập.
- Không biến bulk thành “đổi tất cả trạng thái”.
- Không tự promote document version theo timestamp.
- Không tuyên bố WCAG pass, usability pass hay legal sufficiency.
- Kiểm tra repository đích trước khi dùng Next.js/Atomic Design reference.

---

## 7. Quyết định PO cần đưa ra

### 7.1 Quyết định thiết kế

1. **Chọn hướng A, B, C** hoặc biến thể có phạm vi rõ; ghi rõ pattern nào được mượn từ hướng khác.
2. **Thứ tự ưu tiên Control Room:** blocker → evidence → decision → waiting → milestone → changes.
3. **Mật độ Grid mặc định** (comfortable/compact) và mức ưu tiên của compact mode.
4. **Phạm vi mobile:** triage + action ngắn; advanced bulk ở desktop.
5. **Status Brief:** cách tạo, format và quyền export/read (chưa cần chọn implementation).

### 7.2 Hai quyết định sản phẩm đang mở

| ID | Quyết định | Ràng buộc bất biến |
|---|---|---|
| D-01 | Readiness timing | Không được vượt proof gate hoặc biến `UNVERIFIED` thành `VERIFIED`. |
| D-02 | Signature follow-up priority | Không được tự chuyển `BLOCKED` sang `READY`. |

Hai quyết định này chỉ thay đổi cách ưu tiên/công bố; không được ghi đè trạng thái chứng minh.

---

## 8. Câu hỏi phụ thuộc kiến trúc

Architecture gate **OPEN**; Step02.3 chạy riêng. Các câu hỏi dưới đây cần architecture owner trả lời trước production:

1. Xác nhận workspace active + matter membership mà không lộ dữ liệu matter như thế nào?
2. Revision/concurrency được xử lý ra sao để bulk preview phản ánh đúng?
3. Pagination/virtualization cho 50–200 dòng giữ filter/sort/selection thế nào?
4. Verification aggregate được tính ở đâu và khi nào?
5. Import parsing, file storage, export và realtime dùng cơ chế nào?
6. Ranh giới transaction cho bulk là per-row hay all-or-nothing?
7. Error taxonomy nào được backend trả về và map sang UI state ra sao?
8. Ai được xác minh evidence ngoài `OWNER`, và enforcement nằm ở đâu?
9. `NOT_REQUIRED` cần lý do/approval gì và được audit thế nào?
10. Status Brief được tạo on-demand hay snapshot; quyền export/watermark ra sao?

Danh sách đầy đủ 16 mục nằm ở **Specs §12** và **HTML §14**.

---

## 9. Rủi ro UX & giảm thiểu

| Rủi ro | Tác động | Giảm thiểu trong thiết kế |
|---|---|---|
| Quá nhiều state label cùng lúc | Người dùng bỏ qua tín hiệu quan trọng | Thứ bậc cố định; nhãn text + vị trí ổn định; chỉ dùng màu hỗ trợ. |
| Bulk partial success bị hiểu là “đã xong” | Ghi nhầm dữ liệu/niềm tin sai | Tách success/failure theo row; giữ selection lỗi; không báo thành công toàn bộ. |
| Dark command-center (B) gây mệt khi review lâu | Giảm khả năng đọc evidence | Khuyến nghị A làm nền; B chỉ mượn impact rail. |
| Mobile Grid khuyến khích thao tác nguy hiểm | Bulk sai trên màn hình nhỏ | Mobile chỉ row-card/triage/action ngắn; advanced bulk ở desktop. |
| Import mapping sai tạo record “trông hợp lệ” | Dữ liệu cấu trúc sai | Preview theo dòng, giữ lỗi, không tạo verification/completion. |
| Người dùng coi upload là verify | Kết luận hoàn tất sai | Copy và state tách submission/verification; gate không tự đổi. |
| “Bản mới nhất” bị hiểu là approved/executed | Sai trạng thái pháp lý | Nhãn current/superseded + draft/submitted/partially signed; promotion chỉ OWNER. |

---

## 10. Provenance & adaptation log

- **Governance input:** `e377568ac47f8f1b88e3875a8f13d7e57fc30667`.
- **Requirements:** đã duyệt · `572835a`.
- **Architecture gate:** OPEN · Step02.3 chạy riêng.
- **Fixture:** Project Atlas, 100% synthetic.
- **As-of:** T0 15 Jun 2026 09:00 UTC+07; T-1 14 Jun 2026 09:00.

### 10.1 Thành phần fixture

- 6 workstreams: Approvals · DD · Documents & Signatures · Funding Transfer Closing · Regulatory Filings · Post-Closing.
- 3 milestones: 14 Jun, 18 Jun, 22 Jun 2026.
- 12 requirements `RQ-01..12`; 12 actions `AC-01..12`.
- Chain chính: `RQ-04 → AC-05 → AC-07 → AC-08 → AC-09`.
- Cạnh phụ: `RQ-05 → AC-05`, `AC-10 → AC-11`, `RQ-11 → AC-12`.
- `AC-04` = `WAITING` + dependency `READY`; `AC-05` = `WAITING` + dependency `BLOCKED`.
- 5 documents / 10 versions; Agreement v3 current, partially signed 1/2.
- 12 evidence criteria; 5 supplied; `ER-02` và `ER-04` thiếu.
- 3 external parties: Cedar Seller Demo · Elm Signatory Demo · Harbor Registry Demo.
- `FIL-01` unsubmitted; `FIL-02` `WAITING` Authority Review (receipt có, outcome thiếu).
- 2 open decisions: readiness timing · signature follow-up priority.
- 1 DD finding; 1 closing-delay risk.
- 24 base records; 50/100/200-row density extensions là dữ liệu nhân tạo, được dán nhãn.

### 10.2 Adaptation minh bạch

- Action labels cho `AC-01..AC-03`, `AC-06`, `AC-10..AC-12` và map workstream được **design đặt** để dễ đọc, không phải tên lịch sử.
- Mapping 5 evidence records vào criterion là **minh hoạ thiết kế**; fixture không cung cấp mapping chi tiết.
- Các ví dụ self-verifier lịch sử không được tái sử dụng; mọi review mô phỏng dùng reviewer khác submitter.
- Version promotion là sự kiện `OWNER` rõ ràng, không tự động theo thời gian.
- Density 50/100/200 rows không phải Project Atlas.

---

## 11. Giới hạn bằng chứng

- **Không có per-ID trace** cho `FR-001..FR-020`, `NFR-001..NFR-014`, `RULE-001..RULE-021` vì nội dung đầy đủ chưa được cấp. Không có tuyên bố full-trace verification.
- **Không có production behavior:** auth, authorization, API, pagination, server validation, concurrency, optimistic update, persistence, realtime — tất cả `PENDING_ARCHITECTURE`.
- **Không có usability evidence:** 11 bài test đã lên kế hoạch nhưng chưa chạy; không có participant, success rate hay lỗi quan sát thật.
- **Không có accessibility audit:** mục tiêu WCAG 2.2 AA ở mức thiết kế; chưa có kết quả kiểm thử.
- **Không có legal conclusion:** artifact không xác nhận hoàn tất giao dịch, không thay thế tư vấn pháp lý.
- **Không có external validation:** dữ liệu 100% synthetic; font hệ thống; không có ảnh thật/hotlink.
- **Không có visual-direction approval:** D-08, D-09 và các quyết định token vẫn chờ PO.
- **Không có architecture decision:** tài liệu không thay đổi Solution Architecture hay domain logic.

Không được trích dẫn artifact này như bằng chứng rằng thiết kế đã “pass” usability, accessibility hay production readiness.

---

## 12. Trạng thái validation

| Hạng mục | Trạng thái |
|---|---|
| Product brief | Đã xác nhận theo governance input |
| Requirements baseline | Đã duyệt (`572835a`) |
| Visual direction | **Chưa duyệt** — chờ PO |
| Design system | Seed exploratory — chưa phải production token |
| Prototype interaction | Đã kiểm tra thủ công trong Chrome headless; không có runtime error quan sát được trong các luồng chính |
| Responsive matrix | Thiết kế đã có; **chưa chạy đủ** 360–1920 trong trình duyệt thật |
| Accessibility | Mục tiêu AA; **chưa audit** |
| Usability | **Chưa chạy** bài test nào |
| Architecture | Gate OPEN; 16 mục chờ quyết định |

Ghi chú kiểm tra prototype: các luồng chính (chuyển view, filter/sort/search, chọn hàng, bulk preview/apply, mở Requirement/Action, evidence review, import stepper, demo states, focus restoration) đã được chạy tự động trong Chrome headless và không phát sinh lỗi runtime. Đây là kiểm tra kỹ thuật của artifact, **không phải** usability test.

---

## 13. Đề xuất bước tiếp theo (sau PO review)

Chỉ thực hiện sau khi PO ra quyết định; không phải cam kết timeline.

1. **PO chốt hướng** A/B/C và các pattern mượn chéo.
2. **Chốt thứ tự ưu tiên Control Room, mật độ Grid, phạm vi mobile, format Status Brief.**
3. **Trả lời hai quyết định sản phẩm** readiness timing và signature follow-up priority.
4. **Architecture owner trả lời** các mục `PENDING_ARCHITECTURE` liên quan trước khi implementation.
5. **High-fidelity + design tokens** theo hướng đã chọn; không trộn token giữa các board.
6. **Usability test** với 3 persona; ghi cả failure; không suy diễn kết quả.
7. **Accessibility audit** và kiểm tra responsive matrix trước khi tuyên bố readiness.
8. **Implementation brief** cho Codex/Antigravity, kèm guardrails ở §6.

---

## 14. Gate

> **DỪNG TẠI PRODUCT OWNER DESIGN REVIEW GATE.**
>
> Không high-fidelity, không production frontend, không tuyên bố hướng hình ảnh đã duyệt. Trả artifact này cho PO review trước khi mở nhánh thiết kế tiếp theo.

**Trạng thái:** `MC-003A · REVIEW BUILD 0.1` · **PO decision required**

---

## Appendix A · Fixture snapshot nhanh

| Tín hiệu T0 | Giá trị |
|---|---|
| Chuỗi chặn | `RQ-04 → AC-05 → AC-07 → AC-08 → AC-09` |
| Quyết định mở | 2 (readiness timing · signature follow-up priority) |
| Bên đang chờ | 3 (Cedar Seller Demo · Elm Signatory Demo · Harbor Registry Demo) |
| Evidence | 12 criteria · 5 supplied · `ER-02`/`ER-04` thiếu |
| Requirements | 12 · `RQ-02` `COMPLETED + UNVERIFIED` |
| Actions | 12 · `AC-04` `WAITING/READY` · `AC-05` `WAITING/BLOCKED` |
| Documents | 5 · 10 versions · Agreement v3 current, partially signed 1/2 |
| Filings | 2 · `FIL-01` unsubmitted · `FIL-02` WAITING Authority Review |
| Watch | 1 DD finding · 1 closing-delay risk |
| Records | 24 base · density extensions 50/100/200 (synthetic) |
| As-of | 15 Jun 2026 09:00 UTC+07 · T-1 14 Jun 2026 09:00 |

## Appendix B · File manifest

```text
mattercontrol-step-03a-ux-concept-review.html   ~308 KB   HTML concept review + interactive wireframes
mattercontrol-step-03a-ux-specifications.md     ~51 KB    Screen specs + shared model + deliverable map
mattercontrol-step-03a-handoff-report.md        —         Handoff, provenance, open decisions, limits
```

Không có thư mục asset, không dependency ngoài, không build step. Mở HTML trực tiếp trong trình duyệt hiện đại.

---

*Kết thúc báo cáo bàn giao · MC-003A review build 0.1 · không phải phê duyệt production.*
