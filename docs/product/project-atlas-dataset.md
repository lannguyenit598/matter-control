# Project Atlas — Acquisition & Corporate Restructuring

**SYNTHETIC_PROPOSAL / specification only.** Không phải bản khôi phục dataset gốc từ Document A, không phải seed code hoặc legal advice. Mọi tổ chức, người, sự kiện và deadline bên dưới đều hư cấu, không mô phỏng quy định của jurisdiction cụ thể.

Source: SRC-00A / Task 6 và SRC-00A1 §5.10 quy định quy mô và tình huống. Các ID/quan hệ/nội dung mẫu do Codex đề xuất để chuẩn bị acceptance cases; domain rules vẫn phải chốt ở Step 01.

## 1. Fixture frame

- Workspace: ATLAS-WS — Synthetic Legal Operations.
- Matter: ATLAS-001 — Project Atlas — Acquisition & Corporate Restructuring.
- Context entity labels: Atlas Buyer Demo / Atlas Target Demo; không triển khai Entity master, ownership graph hoặc temporal model.
- Internal actor aliases: U-01 coordinator, U-02 legal reviewer, U-03 operations contributor. Đây là persona fixture, không phải bộ application roles đã quyết định.
- Baseline T-1: 2026-06-14T09:00:00+07:00.
- Snapshot T0: 2026-06-15T09:00:00+07:00.
- Due timestamps dùng +07:00, không dùng thời gian máy chạy để đổi expected result.

Giả định chỉ cho fixture: DUE_SOON khi due nằm trong 48 giờ tới; OVERDUE khi chưa COMPLETED/CANCELLED và due trước T0; otherwise ON_TRACK. ON_TRACK ở completed rows không khẳng định hoàn tất đúng hạn trong quá khứ. Step 01 quyết định cách sản phẩm xử lý các trường hợp này.

## 2. Workstreams và milestones

| Workstream ID | Tên | Mục đích | Milestone chính |
|---|---|---|---|
| WS-01 | Approvals | Điều kiện phê duyệt giao dịch | MS-01 |
| WS-02 | Due Diligence | Review thông tin và xử lý gaps | MS-01 |
| WS-03 | Documents & Signatures | Version awareness và trạng thái ký | MS-02 |
| WS-04 | Funding, Transfer & Closing | Theo dõi payment/transfer/closing | MS-02 |
| WS-05 | Regulatory Filings | Chuẩn bị và theo dõi filing | MS-03 |
| WS-06 | Post-Closing | Bổ sung, bàn giao và theo dõi sau closing | MS-03 |

| Milestone ID | Tên | Due | Candidate acceptance |
|---|---|---|---|
| MS-01 | Readiness Review | 2026-06-14T17:00:00+07:00 | Nhìn rõ RQ-04 còn gap dù đã có hồ sơ review |
| MS-02 | Closing | 2026-06-18T17:00:00+07:00 | Chain từ gap đến signature/payment/closing chưa được che khuất |
| MS-03 | Filing & Post-Closing Review | 2026-06-22T17:00:00+07:00 | Phân biệt filing đang chờ authority và bước follow-up còn lại |

Chưa chốt công thức roll-up milestone. Bảng mô tả điều cần thấy, không mặc định mọi workstream/requirement là gate của milestone.

## 3. External parties

| ID | Alias synthetic | Vai trò context |
|---|---|---|
| EP-01 | Cedar Seller Demo | Bên cung cấp DD information |
| EP-02 | Elm Signatory Demo | Bên còn chữ ký cần theo dõi |
| EP-03 | Harbor Registry Demo | Nơi tiếp nhận/đánh giá filing giả định |

External party không mặc định có tài khoản hoặc quyền truy cập hệ thống.

## 4. 24 Requirements / Actions

RQ-* là Requirement; AC-* là Action. 12 đối tượng mỗi loại; không gộp thành generic Task.
Các cặp execution/verification bên dưới là expected fixture data, không phải quy tắc tự đồng bộ giữa requirement và action.

| ID | Type | WS | Mô tả | Owner | Execution | Verification | Due |
|---|---|---|---|---|---|---|---|
| RQ-01 | Requirement | WS-01 | Bằng chứng approval nội bộ đầy đủ | U-01 | COMPLETED | VERIFIED | 2026-06-13T17:00:00+07:00 |
| AC-01 | Action | WS-01 | Ghi nhận approval đã nhận cho RQ-01 | U-01 | COMPLETED | NOT_REQUIRED | 2026-06-13T17:00:00+07:00 |
| RQ-02 | Requirement | WS-01 | Điều kiện chấp thuận thay đổi được chứng minh | U-02 | COMPLETED | UNVERIFIED | 2026-06-14T17:00:00+07:00 |
| AC-02 | Action | WS-01 | Gửi thông báo thay đổi liên quan RQ-02 | U-01 | COMPLETED | NOT_REQUIRED | 2026-06-14T17:00:00+07:00 |
| RQ-03 | Requirement | WS-02 | Review bộ DD hiện có được ghi nhận | U-02 | COMPLETED | VERIFIED | 2026-06-14T17:00:00+07:00 |
| AC-03 | Action | WS-02 | Review DOC-02 v2 cho RQ-03 | U-02 | COMPLETED | NOT_REQUIRED | 2026-06-14T17:00:00+07:00 |
| RQ-04 | Requirement | WS-02 | Gap về chứng từ bổ sung được giải quyết | U-02 | WAITING | UNVERIFIED | 2026-06-14T17:00:00+07:00 |
| AC-04 | Action | WS-02 | Follow-up EP-01 về chứng từ RQ-04 | U-01 | WAITING | NOT_REQUIRED | 2026-06-14T17:00:00+07:00 |
| RQ-05 | Requirement | WS-03 | Nội dung DOC-03 v3 được review | U-02 | COMPLETED | VERIFIED | 2026-06-15T17:00:00+07:00 |
| AC-05 | Action | WS-03 | Theo dõi chữ ký còn thiếu cho RQ-06 | U-01 | WAITING | NOT_REQUIRED | 2026-06-16T17:00:00+07:00 |
| RQ-06 | Requirement | WS-03 | Agreement version hiện hành có đủ chữ ký cần thiết | U-02 | IN_PROGRESS | PARTIALLY_VERIFIED | 2026-06-16T17:00:00+07:00 |
| AC-06 | Action | WS-03 | Ghi nhận receipt chữ ký đầu tiên cho RQ-06 | U-03 | COMPLETED | NOT_REQUIRED | 2026-06-15T08:00:00+07:00 |
| RQ-07 | Requirement | WS-04 | Payment condition được chứng minh | U-03 | NOT_STARTED | UNVERIFIED | 2026-06-17T17:00:00+07:00 |
| AC-07 | Action | WS-04 | Ghi nhận payment confirmation cho RQ-07 | U-03 | NOT_STARTED | NOT_REQUIRED | 2026-06-17T17:00:00+07:00 |
| RQ-08 | Requirement | WS-04 | Transfer và closing evidence đầy đủ | U-02 | NOT_STARTED | UNVERIFIED | 2026-06-18T17:00:00+07:00 |
| AC-08 | Action | WS-04 | Ghi nhận transfer/closing checklist cho RQ-08 | U-03 | NOT_STARTED | NOT_REQUIRED | 2026-06-18T17:00:00+07:00 |
| RQ-09 | Requirement | WS-05 | Post-closing filing được chấp thuận | U-02 | NOT_STARTED | UNVERIFIED | 2026-06-22T17:00:00+07:00 |
| AC-09 | Action | WS-05 | Chuẩn bị FIL-01 để đáp ứng RQ-09 | U-03 | NOT_STARTED | NOT_REQUIRED | 2026-06-19T17:00:00+07:00 |
| RQ-10 | Requirement | WS-05 | Filing notice có đủ kết quả cần theo dõi | U-02 | WAITING | PARTIALLY_VERIFIED | 2026-06-20T17:00:00+07:00 |
| AC-10 | Action | WS-05 | Chờ response FIL-02 từ EP-03 cho RQ-10 | U-03 | WAITING | NOT_REQUIRED | 2026-06-20T17:00:00+07:00 |
| RQ-11 | Requirement | WS-06 | Yêu cầu supplement được xử lý khi phát sinh | U-02 | NOT_STARTED | UNVERIFIED | 2026-06-21T17:00:00+07:00 |
| AC-11 | Action | WS-06 | Chuẩn bị follow-up khi nhận response FIL-02 cho RQ-11 | U-03 | NOT_STARTED | NOT_REQUIRED | 2026-06-21T17:00:00+07:00 |
| RQ-12 | Requirement | WS-06 | Bàn giao post-closing có acknowledgement | U-01 | NOT_STARTED | UNVERIFIED | 2026-06-22T17:00:00+07:00 |
| AC-12 | Action | WS-06 | Gửi bàn giao sau supplement/resolution cho RQ-12 | U-01 | NOT_STARTED | NOT_REQUIRED | 2026-06-22T17:00:00+07:00 |

AC-05/06 cùng hỗ trợ RQ-06; RQ-05 đã có evidence review, không cần ép tạo một Action chỉ để có cặp 1:1. Rule mọi Requirement bắt buộc có Action hay không còn ở Step 01.

Waiting On fixture: RQ-04/AC-04 → EP-01; AC-05 → EP-02; RQ-10/AC-10 → EP-03. Candidate Next Actions: giải quyết gap qua AC-04; theo dõi AC-05 nhưng hiển thị dependency chưa đạt; theo dõi AC-10. Đây là các lựa chọn demo, không định nghĩa automatic ranking.

## 5. Seven dependencies và critical blocker chain

Giả định fixture: mỗi edge nêu điều kiện riêng; target chỉ READY khi tất cả incoming gates thỏa. Không có incoming edge thì READY theo dependency axis, dù execution vẫn có thể WAITING. Đây chưa phải policy sản phẩm; Step 01 chốt OBD-04.

| ID | Prerequisite | Target | Gate fixture | T0 |
|---|---|---|---|---|
| DEP-01 | RQ-04 | AC-05 | Verification = VERIFIED | Unsatisfied |
| DEP-02 | AC-05 | AC-07 | Execution = COMPLETED | Unsatisfied |
| DEP-03 | AC-07 | AC-08 | Execution = COMPLETED | Unsatisfied |
| DEP-04 | AC-08 | AC-09 | Execution = COMPLETED | Unsatisfied |
| DEP-05 | RQ-05 | AC-05 | Verification = VERIFIED | Satisfied |
| DEP-06 | AC-10 | AC-11 | Execution = COMPLETED | Unsatisfied |
| DEP-07 | RQ-11 | AC-12 | Verification = VERIFIED | Unsatisfied |

Critical chain: **RQ-04 → AC-05 → AC-07 → AC-08 → AC-09**, ảnh hưởng readiness, closing và filing. Các cạnh execution-only không có nghĩa đủ điều kiện pháp lý để payment/transfer; semantics thật chưa được đặc tả.

Expected dependency snapshot: AC-05/07/08/09/11/12 = BLOCKED; các record còn lại = READY theo giả định trên. RQ-04 có thể READY về dependency nhưng WAITING về execution; đó là hai chiều độc lập.

Attention fixture: RQ-04 và AC-05 = CRITICAL vì chuỗi blocker; RQ-02, RQ-06, AC-04, AC-10 = ATTENTION; các record còn lại NORMAL. Đây là nhãn demo được gán rõ, chưa là escalation algorithm.

## 6. Five documents / ten versions

| Document ID | Tên synthetic | Versions và lineage | Version-aware scenario |
|---|---|---|---|
| DOC-01 | Internal approval record | v1 SUPERSEDED → v2 CURRENT | RQ-01 evidence tham chiếu v2 |
| DOC-02 | DD information pack | v1 SUPERSEDED → v2 CURRENT | AC-03 review v2; vẫn có gap riêng RQ-04 |
| DOC-03 | Transaction agreement | v1 SUPERSEDED → v2 SUPERSEDED → v3 CURRENT | v3 review content đạt, signature chỉ 1/2; EP-02 còn chờ |
| DOC-04 | Closing checklist | v1 CURRENT | Bản draft chưa phải evidence closing completed |
| DOC-05 | Filing notice package | v1 SUPERSEDED → v2 CURRENT | FIL-02 nộp v2; history vẫn chỉ rõ v1 |

CURRENT/SUPERSEDED và 1/2 signatures là mô tả fixture, không bổ sung state machine đã phê duyệt. Không giả lập chữ ký pháp lý, e-sign service hoặc advanced signature tracking.

## 7. Evidence requirements và evidence

| ER ID | Subject | Criterion fixture | Evidence tại T0 | Verification |
|---|---|---|---|---|
| ER-01 | RQ-01 | Approval record đúng revision có review | EV-01 → DOC-01 v2 | VERIFIED |
| ER-02 | RQ-02 | Acknowledgement cho thay đổi | Missing — không tạo evidence giả | UNVERIFIED |
| ER-03 | RQ-03 | DD review record về pack hiện tại | EV-03 → DOC-02 v2 + review note | VERIFIED |
| ER-04 | RQ-04 | Chứng từ bổ sung giải quyết gap | Missing; đang chờ EP-01 | UNVERIFIED |
| ER-05 | RQ-05 | Review nội dung agreement current | EV-05 → DOC-03 v3 + review note | VERIFIED |
| ER-06 | RQ-06 | Xác nhận đủ hai chữ ký trên đúng version | EV-06 → DOC-03 v3, mới 1/2 | PARTIALLY_VERIFIED |
| ER-07 | RQ-07 | Payment confirmation | Missing | UNVERIFIED |
| ER-08 | RQ-08 | Transfer/closing evidence phù hợp | Missing; DOC-04 draft chưa đủ | UNVERIFIED |
| ER-09 | RQ-09 | Kết quả approval của FIL-01 | Missing | UNVERIFIED |
| ER-10 | RQ-10 | Receipt và outcome của FIL-02 | EV-10 → receipt reference + DOC-05 v2; outcome missing | PARTIALLY_VERIFIED |
| ER-11 | RQ-11 | Supplement/resolution record nếu cần | Missing; applicability còn mở theo filing response | UNVERIFIED |
| ER-12 | RQ-12 | Handover acknowledgement | Missing | UNVERIFIED |

| Evidence ID | Evidence requirement | Source reference | Người ghi nhận / reviewer | Recorded / reviewed at (+07:00) |
|---|---|---|---|---|
| EV-01 | ER-01 | DOC-01 v2 | U-01 / U-02 | 2026-06-13T10:00:00+07:00 / 2026-06-13T11:00:00+07:00 |
| EV-03 | ER-03 | DOC-02 v2 + review note | U-02 / U-02 | 2026-06-14T14:00:00+07:00 / 2026-06-14T14:00:00+07:00 |
| EV-05 | ER-05 | DOC-03 v3 + content review note | U-02 / U-02 | 2026-06-14T11:00:00+07:00 / 2026-06-14T11:00:00+07:00 |
| EV-06 | ER-06 | DOC-03 v3, one signature receipt | U-03 / U-02 | 2026-06-15T08:00:00+07:00 / 2026-06-15T08:00:00+07:00 |
| EV-10 | ER-10 | Receipt reference + DOC-05 v2 | U-03 / U-02 | 2026-06-14T16:00:00+07:00 / 2026-06-14T16:00:00+07:00 |

Reviewer authority/separation policy là OBD-02/08 ở Step 01; cùng người ghi nhận review note không mặc định được phép tự verify mọi loại evidence trong sản phẩm. Quy tắc independent code review của AI SDLC là phạm vi khác.

Fixture không đòi tất cả evidence phải là Document riêng. Receipt reference là bằng chứng phi-file trong specification, giữ tổng Documents là 5. UI/spec phải thể hiện rõ evidence nào chưa có, không tạo attachment rỗng để lấp chỗ.

## 8. Two filing processes

| Filing ID | Subject / party | Stage tại T0 | Execution / verification | Documents/evidence | Remaining path |
|---|---|---|---|---|---|
| FIL-01 | RQ-09 / EP-03 | Requirement | NOT_STARTED / UNVERIFIED | DOC-04 draft làm input; chưa có package nộp | Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement nếu cần → Response → Approval |
| FIL-02 | RQ-10 / EP-03 | Authority Review | WAITING / PARTIALLY_VERIFIED | DOC-05 v2 đã nộp, EV-10 receipt có, chưa outcome | Supplement/Response/Approval còn phải theo dõi |

FIL-02 là notice độc lập có thể nộp trước closing trong câu chuyện hư cấu; không khẳng định quy trình pháp lý thực tế. Stage của filing khác Execution/Verification State. Workflow không tự chuyển approval vì đã có receipt.

## 9. Two open decisions, one finding, one risk

| ID | Loại / state | Nội dung synthetic | Links |
|---|---|---|---|
| DEC-AT-01 | Decision / OPEN | Khi nào chốt readiness review trong lúc gap chưa giải quyết? | RQ-04, MS-01; chưa có quyết định waiver |
| DEC-AT-02 | Decision / OPEN | Ưu tiên follow-up chữ ký hay đợi đủ supplementary evidence? | AC-05, EP-02, DEP-01; chưa override dependency |
| FD-01 | Finding / OPEN | Thiếu chứng từ hỗ trợ trong DD pack | RQ-04, ER-04, DOC-02 v2, AC-04 |
| RISK-AT-01 | Risk / OPEN | Closing có thể trễ vì chuỗi gap → signature → payment | RQ-04, AC-05/07/08, MS-02 |

Các IDs DEC-AT là dữ liệu sản phẩm synthetic, khác governance DEC-xxx; risk sản phẩm khác project risk R-xxx.

## 10. Event History và delta example

Snapshot baseline T-1 có DOC-03 v2 current/chưa review v3; DOC-05 v1 current/chưa receipt; AC-03 IN_PROGRESS và RQ-03 UNVERIFIED. Các dòng khác giữ như T0 trừ những thay đổi liệt kê dưới đây.

| Event ID | Time (+07:00) | Actor | Domain change | Reference |
|---|---|---|---|---|
| EVT-01 | 2026-06-14T10:00:00+07:00 | U-03 | DOC-03 v3 added; v2 current → superseded | DOC-03 |
| EVT-02 | 2026-06-14T11:00:00+07:00 | U-02 | Content review v3 recorded; RQ-05 UNVERIFIED → VERIFIED | ER-05, EV-05 |
| EVT-03 | 2026-06-14T14:00:00+07:00 | U-02 | AC-03 IN_PROGRESS → COMPLETED; RQ-03 UNVERIFIED → VERIFIED | ER-03, EV-03 |
| EVT-04 | 2026-06-14T15:00:00+07:00 | U-03 | DOC-05 v2 added; v1 superseded; FIL-02 package submitted | FIL-02 |
| EVT-05 | 2026-06-14T16:00:00+07:00 | U-03 | Receipt added; FIL-02 enters Authority Review; RQ-10 PARTIALLY_VERIFIED | EV-10, EP-03 |
| EVT-06 | 2026-06-15T08:00:00+07:00 | U-03 | First signature receipt; AC-06 COMPLETED; RQ-06 PARTIALLY_VERIFIED | EV-06, DOC-03 v3 |

Baseline clarification: FIL-02 tại T-1 là Package Preparation, IN_PROGRESS/UNVERIFIED; AC-10 tại T-1 IN_PROGRESS, chuyển WAITING khi nhận receipt/đợi authority tại EVT-05. RQ-05 trước EVT-02 là COMPLETED/UNVERIFIED; AC-06 trước EVT-06 IN_PROGRESS; RQ-06 trước EVT-06 UNVERIFIED; RQ-10 trước EVT-05 UNVERIFIED, execution IN_PROGRESS. Đây là narrative snapshots, không phải replay implementation.

Candidate delta brief T-1 → T0: DD review completed; agreement version changed/reviewed but not fully signed; filing receipt received and waiting authority. RQ-04 vẫn là unresolved blocker được hiển thị dưới mục outstanding, **không gọi là newly created**. Cùng phạm vi/baseline/T0 phải cho cùng nội dung nghiệp vụ; formatting/order policy cần Step 01.

## 11. Acceptance scenario inventory — NOT_RUN

| Test ID | Tình huống / candidate expected observation | P0 coverage |
|---|---|---|
| AT-STATE | RQ-01 Completed + Verified khác RQ-02 Completed + Unverified; AC-04 Waiting vẫn READY, AC-05 Waiting + BLOCKED | 01, 05, 07, 20 |
| AT-BLOCK | Critical chain đủ bốn cạnh, blocker nguồn RQ-04 và milestone context nhìn thấy | 02, 03, 05, 09 |
| AT-EVIDENCE | ER-02/04 missing khác attachment có sẵn; EV-06 thiếu chữ ký không thành VERIFIED | 06, 07, 15 |
| AT-TIME | RQ-04/AC-04 OVERDUE tại T0; AC-05 DUE_SOON theo fixture; attention không bị gộp timing | 09, 11, 20 |
| AT-DOC | DOC-03 v2 superseded, v3 current/partially signed; evidence giữ version reference | 15 |
| AT-FILING | FIL-02 chờ EP-03 với receipt nhưng chưa approval; FIL-01 chưa nộp | 04, 16, 17 |
| AT-HISTORY | Version, review, receipt và execution changes có actor/time/context | 08 |
| AT-BRIEF | Delta T-1/T0 deterministic; thay đổi mới tách khỏi outstanding blocker | 19 |
| AT-UX | Control Room nêu exceptions; Grid bulk edit hai Action hợp lệ; inline editing một record; My Actions theo actor, contextual detail, keyboard và giảm context switching; không tự ghi COMPLETED hàng loạt vượt rules | 03, 04, 09, 10, 11, 12 |
| AT-IO | Excel/CSV import specimen của cùng 24 records có typed IDs/relations; specimen lỗi reference/duplicate phải có phản hồi theo rule Step 01; Excel export giữ các state axes và version context | 01, 13, 14 |
| AT-ROLE | Owner assignment có thể truy vết; My Actions phản ánh đúng người phụ trách; actor được phép xem/sửa/verify/export theo role matrix Step 01; actor ngoài quyền bị từ chối, không lộ dữ liệu qua Grid/export/brief | 18 |
| AT-GW | Mở rộng snapshot bằng scenario progression để đi hết GW-01/02/03; snapshot T0 chưa chứng minh final resolution/approval | Toàn workflows |

AT-UX/IO/ROLE là specification cho thao tác kiểm thử, chưa có UI, files import/export, quyền runtime hoặc kết quả PASS. DISPUTED/CANCELLED cũng chưa có positive fixture; Step 01 bổ sung negative/edge coverage, không nói Atlas đã bao phủ mọi transition.

## 12. Count / consistency gate

6 workstreams; 3 milestones; 24 Requirements/Actions (12 + 12); 7 dependencies; 5 documents / 10 versions; 3 external parties; 2 filing processes; 12 evidence requirements; 5 supplied evidence records; 2 open decisions; 1 finding; 1 risk; 1 critical blocker chain.

T0 phải có đủ chín trường hợp yêu cầu: Completed + Verified, Completed + Unverified, Blocked, Waiting, Overdue, Missing evidence, Superseded document, Partially signed document, Filing waiting on authority. Kiểm tra specification không phải chạy sản phẩm hoặc chứng minh full MVP.
