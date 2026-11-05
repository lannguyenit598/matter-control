# Bộ dữ liệu synthetic chuẩn — usability trial 2026-11 (MC-ZCODE-USABILITY-PREP-20261101, mục 2)

- Người soạn: actual ZCode (docs-only). Người seed: executor của walkthrough env (task enablement-minifix / plan CO-19). **Danh sách dưới đây là đầy đủ — người seed KHÔNG phải tự đoán thêm gì.**
- Nền tảng seed: walkthrough env D-1(b) (`docs/deployment/walkthrough-env.md`) — PG container riêng + `mcapi` riêng + stub IdP riêng, port riêng, loopback-only, disposable. Pattern chứng minh sống: BA flow-completeness r1/r2 (`docs/testing/zcode-ba-flow-completeness-20261030-r1/`, receipts `commands/` + `r2/`).
- 100% synthetic. Không PII. Không dữ liệu matter thật. Không đụng :3000/:8080/container của task khác.
- Mỗi phiên người dùng chạy trên bộ dữ liệu **reset về trạng thái dưới đây** (xem §9).

## 0. Quy ước đặt tên

| Ký hiệu | Nghĩa |
|---|---|
| M1–M5 | 5 hồ sơ (Matter) trong 1 workspace |
| R-x / A-x / D-x / C-x | Requirement / Action / Document / Criterion |
| claim | bản ghi bằng chứng (evidence claim) đang chờ hoặc đã được xác minh |
| T1–T10 | 10 nhiệm vụ theo `docs/testing/uiux-lawyer-experience-audit-20261030-r1/task-walkthroughs.md` |
| PENDING_REVIEW / ACCEPTED / REJECTED / EXPIRED | trạng thái claim theo state-semantics |

Tên riêng nhân vật/hồ sơ là giả lập; KHÔNG dùng tên người thật, công ty thật, số hiệu văn bản thật.

## 1. Tài khoản synthetic (4 tài khoản — đủ cho 6 phiên)

Stub IdP cấp session; mật khẩu synthetic do người seed tự sinh, lưu 0700 ngoài git, bàn PO/ngày chạy. Không dùng lại mật khẩu của môi trường khác.

| Tài khoản | Tên hiển thị | Vai trong workspace | Vai trên từng matter | Phiên dùng |
|---|---|---|---|---|
| `owner@trial.local` | "Võ An" | MEMBER | OWNER trên M1–M5 | A (Contributor/Owner), C (Owner) |
| `verifier@trial.local` | "Lê Bình" | MEMBER | EDITOR + **designated verifier** trên M1–M4 | B (Reviewer) |
| `editor@trial.local` | "Trịnh Cường" | MEMBER | EDITOR trên M1–M5 | E (Contributor/import) |
| `manager@trial.local` | "Phạm Dũng" | MEMBER | VIEWER trên M1–M5 | D (Manager), F (nếu cần) |

- KHÔNG seed user non-member (không có nhiệm vụ nào dùng trong 6 phiên).
- Designated verifier chỉ đặt cho `verifier@trial.local`; không ai tự xác minh claim của chính mình (guard self-claim phải giữ nguyên).

## 2. Tổng quan 5 hồ sơ

| Matter | Vai kịch bản | Khớp với | Phiên |
|---|---|---|---|
| **M1 — "Dự án ACME — Chuyển nhượng cổ phần Công ty ACME"** | Hồ sơ giao dịch chính, có ví dụ ký tên từng phần + brief dày | GW-01 (BA r1) | A (T3, T10), B (1 claim pending), C (T5), D (T8) |
| **M2 — "VendorX — Thẩm định trước đầu tư"** | Hồ sơ DD: có case rejected, case expired, và case "action hoàn tất nhưng requirement chưa xác minh" | GW-02 (BA r1) | B (T4 + rejected/expired), D (T2 đọc) |
| **M3 — "Sát nhập Công ty B vào Công ty A — Khai trình cơ quan cạnh tranh"** | Hồ sơ khai: 3 filings ở 3 trạng thái khác nhau (đang tuần hoàn 2 chu kỳ / đã tới bước chấp thuận nhưng chưa chốt / đường âm withdrawn) | GW-03 (BA r1) | C (T6), F (câu hỏi định nghĩa), B (1 claim pending) |
| **M4 — "Dự án Delta — Chuyển nhượng vốn Công ty Delta"** | Hồ sơ **bẫy**: có blocker thật để thử vòng định-hướng-lại (H-C) | Bẫy mới, cấu trúc theo GW-01 step 17 | A (T2) |
| **M5 — "Danh mục điều kiện hoàn tất SPA (import)"** | Hồ sơ trắng để import CSV | j5-import (BA r1) | E (T9) |

Tổng: **1 workspace, 4 member, 5 matter, 4 party bên ngoài, 4 document (5 version), 12 requirement, 7 action, 6 claim, 3 filing, 1 milestone, 2 context record, 1 review grid, 3 item WAITING, 2 item BLOCKED.** Bảng đối chiếu số lượng tổng nằm ở §8.

## 3. M1 — "Dự án ACME — Chuyển nhượng cổ phần Công ty ACME"

Vai owner: `owner@trial.local`. Đích: T3 (thực hiện action + nộp evidence), T10 (replay receipt), T5 (ký tên từng phần — phiên C), T8 (brief — phiên D), B có 1 claim pending tại đây.

### Thực thể seed (số lượng chính xác)

| Loại | Số lượng | Chi tiết |
|---|---|---|
| Requirement | 3 | R1, R2, R3 (bảng dưới) |
| Action | 4 | A1, A2, A4, A5 (bảng dưới) |
| Document | 1 | D1 "Hợp đồng mua bán cổ phần ACME (SPA)" — v1 + v2 |
| Signature observation | 2 | trên D1 v2: bên mua ✓, bên bán ✓ (thiếu người làm chứng — để còn "ký từng phần") |
| Milestone | 1 | "Closing", prerequisite = R2, critical, reason: "Không thể closing khi chưa xác minh báo cáo thẩm định giá" |
| Party | 1 | "ABC Holdings (Bên mua)" |
| Claim | 2 | claim#1 ACCEPTED (C1), claim#2 PENDING_REVIEW (C3) |
| Change events | ≥20 | phát sinh tự nhiên khi seed; assert ≥20 trong cửa sổ brief của ngày chạy |

| ID | Tên | Trạng thái cuối phải đạt |
|---|---|---|
| R1 | "Phê duyệt cổ đông đã được ghi nhận" | criterion C1 (bắt buộc) — claim#1 ACCEPTED bởi verifier → **VERIFIED** |
| R2 | "Báo cáo thẩm định giá được xác nhận" | criterion C2 (bắt buộc) — **0 claim** → **UNVERIFIED (MISSING)**. Phiên A sẽ nộp evidence vào đúng criterion này |
| R3 | "Báo cáo kiểm toán độc lập" | criterion C3 (bắt buộc) — claim#2 **PENDING_REVIEW** → **UNVERIFIED (đang chờ xác minh)**. Đây là 1 trong 3 claim trong hàng chờ của phiên B |
| A1 | "Hoàn tất chuyển nhượng (closing)" | phụ thuộc R2 (proof gate) → **BLOCKED** (`dependency-blocked`, gate PROOF NOT_COMPLETED) — cấu trúc theo GW-01 step 17 |
| A2 | "Nhận chứng từ ký quỹ từ bên mua" | **WAITING**, party = "ABC Holdings (Bên mua)", condition = "Gửi chứng từ xác nhận chuyển khoản ký quỹ" |
| A4 | "Gửi biên bản bàn giao cho IC" | **IN_PROGRESS**, owner = `owner@trial.local`, **không proof gate** → T3 hoàn tất được |
| A5 | "Chốt danh mục chứng từ ký quỹ" | **IN_PROGRESS**, owner = `owner@trial.local`, không gate → **thao tác bị tiêm lỗi ở T10** |
| D1 | "Hợp đồng mua bán cổ phần ACME (SPA)" | v1 + v2; **v2 là phiên bản hiện hành** (promote có impact token theo GW-01 step 9); mô tả ghi rõ cần chữ ký: bên mua, bên bán, người làm chứng (3 bên — mới có 2/3) |

Lưu ý seed: promote D1 v1→v2 phải đi đúng guard (lần 1 không impact token → 409 `impact-acknowledgement-required`, lần 2 có token → 200) — GW-01 step 9 / GW-02 step 6 đã chứng minh; giữ nguyên để lịch sử có event thật.

## 4. M2 — "VendorX — Thẩm định trước đầu tư"

Đích: T4 phiên B (hàng chờ review + tìm case rejected/expired), T2-đọc phiên D (manager), và là **case dạy "hoàn tất ≠ đã xác minh"** (H-B).

| Loại | Số lượng | Chi tiết |
|---|---|---|
| Action | 2 | A-2.1, A-2.2 |
| Requirement | 4 | R-2.1 … R-2.4 |
| Document | 1 | D2 "DD pack VendorX" — v1 + v2 (v2 hiện hành, promote có impact token) |
| Claim | 4 | #3 REJECTED, #4 ACCEPTED, #5 PENDING_REVIEW, #6 ACCEPTED-đã-hết-hạn |
| Party | 1 | "VendorX" |
| Context record | 2 | 1 FINDING + 1 RISK (typed) |
| Review grid | 1 | 3 hàng: 2 đã trả lời, 1 câu hỏi đang mở |
| Change events | ≥10 | assert ≥5 trong cửa sổ brief |

| ID | Tên | Trạng thái cuối phải đạt |
|---|---|---|
| A-2.1 | "Gửi yêu cầu tài liệu VendorX" | execution **COMPLETED** |
| A-2.2 | "Theo dõi hồ sơ bổ sung từ VendorX" | **WAITING** (party VendorX, condition "Nộp bổ sung tài liệu mục 4.2") |
| R-2.1 | "Bộ tài liệu pháp lý VendorX đầy đủ" | criterion C-2.1 `versionRule: CURRENT_AUTHORITATIVE`; claim#3 trên **v1 REJECTED** (rationale: "Thiếu bảng sở hữu cổ phần — nộp bản cập nhật"), claim#4 trên **v2 ACCEPTED** → **VERIFIED**; lineage REJECTED→ACCEPTED phải đọc được trong lịch sử (GW-02 step 8) |
| R-2.2 | "VendorX xác nhận đã nhận yêu cầu tài liệu" | A-2.1 COMPLETED nhưng R-2.2 **UNVERIFIED, 0 claim** → **case "gửi yêu cầu ≠ đã được đáp ứng"** (GW-02 step 1) |
| R-2.3 | "Báo cáo rủi ro pháp lý chốt" | claim#5 **PENDING_REVIEW** → hàng chờ của phiên B |
| R-2.4 | "Chứng nhận pháp lý đối tác còn hiệu lực" | claim#6 ACCEPTED với **`ValidFor` = 1 giây lúc seed** → đã trôi qua cửa sổ hiệu lực → criterion reason **EXPIRED** ("accepted proof is past its validity" — `evidence.go:292`). Kết quả: requirement hiển thị **không còn proof hiệu lực dù từng được chấp nhận** |

Cách seed EXPIRED (xác định, không phụ thuộc thời gian): nộp evidence → verifier chấp nhận với `ValidFor=1s` → chờ 2 giây → đọc lại thấy EXPIRED. KHÔNG cần đợi "hết hạn theo lịch".

## 5. M3 — "Sát nhập Công ty B vào Công ty A — Khai trình cơ quan cạnh tranh"

Đích: T6 phiên C (đi theo một filing tới kết quả, 2 chu kỳ supplement), phiên F (câu hỏi định nghĩa receipt≠approval, approval≠outcome). Cấu trúc theo GW-03 (BF-01/BF-02).

3 filings, một authority party dùng chung:

| Filing | proofRequired | Trạng thái cuối phải đạt |
|---|---|---|
| **F1 — "Khai trình sát nhập (cơ quan cạnh tranh)"** | true | Đi đủ: PACKAGE_PREPARATION → SUBMISSION → **RECEIPT** (biên nhận, ví dụ "S-2026-0142") → AUTHORITY_REVIEW → **SUPPLEMENT** (yêu cầu bổ sung của cơ quan, có due) → RESPONSE (nộp phụ lục) → AUTHORITY_REVIEW chu kỳ 2. **currentCycle = 2, đang dừng ở AUTHORITY_REVIEW — chưa có outcome.** `signatureNotRequired` do OWNER quyết (có reason) theo GW-03 step 3 |
| **F2 — "Khai trình đầu tư nước ngoài"** | true | Đi tới: SUBMISSION → RECEIPT → AUTHORITY_REVIEW → **APPROVAL** (có evidenceIds) + outcome evidence đã nộp, outcome claim **PENDING_REVIEW** → đọc đúng **`verification: PARTIALLY_VERIFIED`, `outcomeVerification: PENDING`** (GW-03 step 7 — đây là case "đã thấy chấp thuận ≠ hồ sơ đã xong") |
| **F3 — "Cập nhật thông tin doanh nghiệp"** | false | Đường âm: PACKAGE_PREPARATION → SUBMISSION → outcome **WITHDRAWN** (có evidenceIds) → CLOSED. Không reopen (để gọn) |

| Loại | Số lượng | Chi tiết |
|---|---|---|
| Filing | 3 | F1, F2, F3 như trên |
| Document | 2 | D3 "Dossier khai trình" v1 (current authoritative); D4 "Phụ lục trả lời yêu cầu bổ sung" v1 |
| Criterion | 2 trên F1 (PACKAGE purpose + OUTCOME purpose), 2 trên F2 (PACKAGE + OUTCOME) | purpose-typed theo 0011; KHÔNG đặt criterion OUTCOME lên requirement thường (guard `outcome-criterion-not-applicable` — GW-03 step 2) |
| Claim | 3 | package F1 ACCEPTED; package F2 ACCEPTED; outcome F2 PENDING_REVIEW (→ hàng chờ phiên B) |
| Party | 1 | "Ủy ban Cạnh tranh Quốc gia (synthetic)" |

Lưu ý: seed theo đúng thứ tự GW-03 r1 (criteria PACKAGE khai **trước** Package Preparation — áp cho cả filing không-proof). Các probe guard (409) đã được r1 chứng minh; khi seed nếu gặp 409 thì đó là seed sai thứ tự, không phải lỗi sản phẩm.

## 6. M4 — "Dự án Delta — Chuyển nhượng vốn Công ty Delta" (hồ sơ bẫy)

Đích: T2 phiên A (hiểu tình trạng + blocker + ai cần hành động), vòng H-C (tìm đường từ blocker về điều kiện tiên quyết).

| ID | Tên | Trạng thái cuối phải đạt |
|---|---|---|
| R-T1 | "Giấy chứng nhận đăng ký đầu tư" | criterion bắt buộc, **0 claim, evidence MISSING** → **UNVERIFIED (MISSING)** — nguyên nhân gốc của blocker |
| R-T2 | "Hồ sơ pháp lý công ty mục tiêu đầy đủ" | claim ACCEPTED → **VERIFIED** (một phần hồ sơ xanh để không toàn đỏ) |
| A-T1 | "Nộp hồ sơ đăng ký với cơ quan" | phụ thuộc R-T1 (proof gate) → **BLOCKED** (`dependency-blocked`, gate PROOF NOT_COMPLETED) |
| A-T2 | "Kiểm tra án phí và lệ phí" | **IN_PROGRESS**, owner = `owner@trial.local`, sẵn sàng làm (tương phản với A-T1) |
| A-T3 | "Chờ kết quả tra cứu tư pháp" | **WAITING** (party "Trung tâm tra cứu tư pháp (synthetic)", condition "Trả kết quả tra cứu án tích") |
| Party | 1 | "Sở Kế hoạch & Đầu tư (synthetic)" |

Đọc lại Control Room của M4 sau seed phải thấy: **1 blocker (A-T1), 1 waiting (A-T3), next = A-T2** — đúng một câu sự thật + blockers theo thiết kế BF-07.

## 7. M5 — "Danh mục điều kiện hoàn tất SPA (import)" + file CSV

Đích: T9 phiên E. M5 **trống** (0 work item). `editor@trial.local` là EDITOR.

File CSV (nguyên văn, lưu cùng bộ prep, mã hoá UTF-8, không BOM) — **12 dòng dữ liệu: 10 hợp lệ + 2 lỗi cố ý**:

```csv
type,title,description,owner,due,dependsOn
REQUIREMENT,"Điều kiện 1 — Báo cáo thẩm định giá","Báo cáo thẩm định giá được chấp nhận",,2026-12-01,
REQUIREMENT,"Điều kiện 2 — Phê duyệt IC","Nghị quyết IC chấp thuận giao dịch",,2026-12-05,1
ACTION,"Việc 1 — Nộp hồ sơ đăng ký","Nộp hồ sơ đăng ký giao dịch với cơ quan",,2026-12-10,1;2
REQUIREMENT,"Điều kiện 3 — Chuyển quyền sở hữu","Đăng ký chuyển quyền sở hữu cổ phần hoàn tất",,2026-12-20,3
ACTION,"Việc 2 — Thu chứng từ thanh toán","Nhận chứng từ chuyển đợt 2 từ bên mua",,2026-12-22,4
ACTION,"Việc 3 — Chốt bộ hồ sơ closing","Scan và nộp bộ hồ sơ closing vào kho",,2026-12-28,5
REQUIREMENT,"","(dòng lỗi 1 — thiếu tiêu đề)",,2026-12-15,
REQUIREMENT,"Điều kiện 4 — Giấy xác nhận không vi phạm","Giấy xác nhận không vi phạm pháp luật",,31-12-2026,
ACTION,"Việc 4 — Hủy tài khoản hệ thống nội bộ","Thu hồi quyền truy cập hệ thống của bên bán",,2026-12-23,9
REQUIREMENT,"Điều kiện 5 — Công bố thông tin","Thông báo hoàn tất giao dịch cho nhân viên",,2026-12-30,5
```

Ghi chú: dòng 7 (thiếu tiêu đề) và dòng 8 (ngày sai định dạng `31-12-2026` thay vì `2026-12-31`) là **2 lỗi T9 bắt participant sửa**. Đáp án cho moderator (không đọc trước cho participant): (1) dòng thiếu tiêu đề → đặt tiêu đề "Bản án tích ban quản lý công ty mục tiêu"; (2) dòng ngày sai → sửa thành `2026-12-15`. Cột `dependsOn` tham chiếu **số thứ tự dòng** (row key) — chỉ dùng số dòng trong file; nếu mapping UI yêu cầu khác thì mapping theo UI, không sửa file.

Sau commit: imported items có claim VERIFIED-phần **chưa được xác minh độc lập** ("imported VERIFIED → reviewable claim, not actual VERIFIED" — T9 phải thấy điều này; nếu không thấy là regression).

## 8. Case "receipt replay" (T10, phiên A) — chỉ định chính xác

- **Thao tác bị lỗi:** hoàn tất action **A5 "Chốt danh mục chứng từ ký quỹ"** trên M1 (completion operation, không phải nộp evidence — tránh đụng claim C2 mà T3 vừa tạo).
- **Cách tiêm lỗi (kịch bản, chạy đúng 1 lần):** sau khi request hoàn tất đã được server commit nhưng **trước khi response tới UI** — cắt kết nối (fault-injection script của env; nếu env chưa có thì dùng cách thủ công: ngắt mạng loopback của tab). Kết quả UI phải là **OUTCOME_UNKNOWN** (503 `outcome-unknown`, "no rollback asserted").
- **Phục hồi đúng:** participant thử lại **cùng intent** (UI giữ key, không mint key mới) → server replay receipt (`Idempotent-Replayed: true`) → item COMPLETED đúng 1 lần.
- **Assertion sau phục hồi (người seed ghi vào runbook, moderator không làm):** (a) A5 = COMPLETED; (b) lịch sử A5 có **đúng 1** event hoàn tất; (c) `GET /operations/{key}` trả 200. Nếu thấy 2 event = regression idempotency — dừng phiên, ghi lại.
- Lưu ý phạm vi: đây là **replay receipt của thao tác** (idempotent retry theo T10/H-E). KHÔNG liên quan probe bảo mật cross-matter replay (R-02/A-01 của system review) — case đó ở tầng service, người luật sư không thấy, không đưa vào trial.

## 9. Reset giữa các phiên + teardown

- **Trước MỖI phiên (kể cả diễn tập):** chạy reset = xóa DB container + seed lại từ đầu theo §3–§7 (script seed idempotent, mục tiêu <5 phút). Lý do: phiên B và E làm thay đổi trạng thái (chấp nhận claim, import item); mỗi phiên phải mở đầu y hệt để đo lường so sánh được.
- Sau seed chạy §10 smoke. Fail bất kỳ dòng nào → sửa seed, không mở cửa đón participant.
- **Teardown cuối ngày:** `docker rm -f` container PG walkthrough; kill `mcapi` + stub IdP; xóa key tạm (tiền lệ orphan 18082 — đừng lặp).

## 10. Smoke checklist sau seed (API readback, chạy bằng token synthetic)

| # | Kiểm | Kỳ vọng |
|---|---|---|
| 1 | `readyz` | 200 |
| 2 | request không token | 401 |
| 3 | token hợp lệ 4 tài khoản | 200 |
| 4 | token lạ | 401 |
| 5 | `GET /me/reviews` (verifier@) | **total = 3** (claim#2 M1, claim#5 M2, outcome F2 M3) |
| 6 | `GET /me/actions` (owner@) | thấy A4, A5 (IN_PROGRESS); A1/A-T1 không ở hàng "sẵn sàng" |
| 7 | Control Room M4 | blockers = 1 (A-T1), waiting = 1 (A-T3), next = A-T2 |
| 8 | R-2.2 (M2) | execution COMPLETED + verification **UNVERIFIED** (hai trục tách biệt) |
| 9 | R-2.4 (M2) | reason EXPIRED (proof hết hiệu lực) |
| 10 | F1 (M3) | currentCycle = 2, stage hiện tại AUTHORITY_REVIEW, có receipt chu kỳ 1 |
| 11 | F2 (M3) | `verification: PARTIALLY_VERIFIED`, `outcomeVerification: PENDING` |
| 12 | F3 (M3) | WITHDRAWN + CLOSED |
| 13 | Brief M1 (cửa sổ ngày chạy) | ≥20 changes |
| 14 | Brief M2 | ≥5 changes; outstanding có `proofExpired` cho R-2.4 |
| 15 | M5 | 0 work item |
| 16 | D1 (M1) | v2 hiện hành; 2/3 chữ ký (thiếu người làm chứng) |
| 17 | Login trình duyệt 4 tài khoản | vào được đúng vai (badge OWNER/EDITOR/VIEWER) |
| 18 | Giao diện tiếng Việt | tiêu đề trang + nội dung hiển thị tiếng Việt **không kẹt EN** (UX-L-02 đã đóng) |

## 11. Yêu cầu môi trường (điều kiện để bộ dữ liệu này chạy được)

| ID | Yêu cầu | Trạng thái / chủ sở hữu |
|---|---|---|
| E-1 | Bộ script `up.sh` / `mint-token.sh` / `down.sh` đóng gói từ receipts r2 | đang làm ở task enablement-minifix (walkthrough scripts) |
| E-2 | **Stub IdP có trang login trình duyệt** (form → session) cho 4 tài khoản synthetic + chấp nhận `redirect_uri` của origin frontend trial — **GAP MỚI, chưa có chủ**: r2 stub chỉ có `/introspect` cho machine token | cần Codex intake ghi nhận (xem return.md) |
| E-3 | Frontend trial chạy origin riêng (ví dụ :3100) trỏ backend trial; **UX-L-01 (tiêu đề Workspaces) và UX-L-02 (locale) đã đóng** trước ngày chạy — điều kiện tiên quyết của test-plan | điều kiện mở khóa ở logistics-checklist |
| E-4 | **Fault-injection script** cho T10 (cắt response sau commit, đúng 1 lần, có lệnh bật/tắt) — **GAP MỚI** | cần Codex intake ghi nhận |
| E-5 | Script reset+seed lại (<5 phút) theo đúng §3–§7 | người seed viết khi đóng gói |
| E-6 | 1 phiên chạy trên mobile 390 (thiết bị thật hoặc devtools) | logistics mục thiết bị |
| E-7 | Migrations hiện hành (0001→0010; nếu 0011 `criterion_purpose_signature` đã áp thì chạy tới 0011) | theo env chuẩn |

Ranh giới: env trial KHÔNG phải production profile (không TLS, không multi-tenant thật, không backup) — chỉ dùng để trial, đúng walkthrough-env §3.
