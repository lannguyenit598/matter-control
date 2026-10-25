# MatterControl — STEP 03A · UX Concept Specifications

## Current delegated design contract — local-r3

D-UX01..04 are **APPROVED_UNDER_PO_DELEGATION**, authority **PO_DELEGATED_TO_CODEX**, decision-maker Local Codex. Read ../../design-decisions.json and selected-design-system.md for alternatives/evidence/constraints/tokens. A is selected; B/C are retained concept alternatives, not pending PO choices. This is not a manual PO visual review or formal QA.

Control Room DOM order now exposes the blocker, explicit no-eligible-Action state at AtlasT0, prominent decision queue, Waiting On with internal owners, milestones, evidence gaps and changes. Requirement≠Action; WAITING≠BLOCKED; no invented next Action or milestone prerequisites. Only local concept markup/CSS changed; mutation/evidence/permission logic is unchanged.

Codex owns validation. RENDERED_VALIDATION_UNAVAILABLE for the policy-restricted local target; do not ask PO to capture screenshots or make routine choices. EV-UI-001 is retained historical partial evidence only and cannot accept the changed layout. Missing browser/keyboard/contrast evidence is risk-classified in risk-assessment.md with exact downstream acceptance, never marked PASS. Formal independent QA remains pending; no provider retry/switch/egress or governance waiver.

Selected tokens: Comfortable default/Compact option,14px body/12px metadata/22px app heading,4px space unit,44px/36px minimum single-line row guidance with multiline growth,32px desktop control/44px touch control design choice; no universal WCAG inference. Roles and exact values in design-tokens.json / selected-tokens.css; embedded selected CSS must match that file.

Implementation handoff is prepared, not an authorization for STEP03B or production. Source correction can proceed within the existing MC-003A scope; full-scale/prototyping and runtime acceptance have explicit prerequisites and no PO-operational-work requirement.


## Local R3 capability and evidence contract

Revision: local-r3, delegated UX decision checkpoint. Local-r1 and all previous review evidence remain historical. Classification refers to this concept, not the future production application. IMPLEMENTED_AND_TESTED is always qualified by method; no browser interaction has been executed. Render status: **RENDERED_VALIDATION_UNAVAILABLE**.

| Capability | Classification and evidence | Expected interaction for later approved STEP 03B / Antigravity |
|---|---|---|
| Canonical Atlas board/fixture state mapping | IMPLEMENTED_AND_TESTED at source-extraction layer only; r2 source-check results verify values/IDs. Not a rendered or authoritative state test. | Render the authorized source state and reasons consistently across views. |
| Row Up/Down/Enter/Space; nested-input exclusion | IMPLEMENTED_NOT_TESTED in browser. Historical local-r1 VM assertions cover only selected logic, not native focus. | Row movement must preserve context; nested inputs retain their own editing keys. Full cell navigation remains SPECIFIED_ONLY. |
| Focus rings, native dialogs, Escape and origin/tab return after rerender | IMPLEMENTED_NOT_TESTED in browser; no headless Chrome run, native focus measurement or keyboard PASS evidence. | Trap/restore focus appropriately; retain origin; provide a labeled fallback when the opener disappears. |
| Representative inline title editor | IMPLEMENTED_NOT_TESTED in browser. Shared metadata helper is unchanged from local-r1; prior VM tests are historical. | Enter commits an allowed value, Escape cancels, invalid value/error stay local; preserve selection/filter/scroll. |
| Bulk title/description/internal owner/due | IMPLEMENTED_NOT_TESTED in browser. Blank means unchanged; RQ-10 conflict/RQ-12 denial are synthetic scenarios. Metadata/audit helper unchanged; prior VM logic evidence does not prove authorization. | Preview exact IDs/fields; recheck rights/revision; per-record atomic change+audit; retain unchanged failed rows/reasons and persistent partial results. |
| Responsive CSS and all matching mobile rows | IMPLEMENTED_NOT_TESTED in browser. No viewport/zoom/touch/geometry evidence. | Keep all matching records reachable, meaningful navigation and recovery; evaluate actual device/zoom. |
| Evidence context, versions, rationale specimen | IMPLEMENTED_NOT_TESTED in browser for local display only. Historical self-review remains disclosed; missing proof/authority prevents new full acceptance. | Designated independent verifier, exact criterion/version/validity and rationale; recompute aggregates via authoritative system. |
| Upload/import/review feedback specimens | CONCEPTUAL_ONLY; upload is a toast, import wizard does not create records, no authoritative verification or filing submission. | Validate and retain provenance; upload must not verify or auto-promote. |
| Four specification-only screens; full filing lifecycle and permissions | SPECIFIED_ONLY; NOT_TESTABLE_IN_CONCEPT as complete flows. | Matter List/My Actions/Waiting On/Filing Detail and stage/error/repeat behaviors follow approved contracts. |
| Full spreadsheet paste/cell editing, real parsing/export, auth, persistence and production audit | NOT_IMPLEMENTED; NOT_TESTABLE_IN_CONCEPT. | Implement only after the separate design/architecture gates; do not infer an API or library here. |
| A/B/C direction boards | CONCEPTUAL_ONLY / REVIEW_BOARD miniatures, not a 1:1 application. | D-UX01 selects one coherent direction under PO delegation; alternatives retained as history, not a reopened vote. |

Requirement ≠ Action. Evidence Requirement ≠ Evidence. COMPLETED ≠ VERIFIED. No classification grants production readiness, formal QA or PO approval. Proposed keyboard/focus/responsive behavior elsewhere in this document is expected interaction unless this table identifies an executed source check. No blanket interaction PASS is implied.


## Local R3 corrective contract — 2026-10-25

Owner: Local Codex under explicit local remediation authorization. This revision preserves local-r1 byte-for-byte and the original export in ../../export at Git cef67c4. No OpenDesign Cloud execution occurred for this revision. Parent MC-003A remains REWORK_REQUIRED; internal critiques complete, formal independent QA PENDING_PROVIDER_ACCESS and D-UX01..04 APPROVED_UNDER_PO_DELEGATION; full STEP03A approval NOT_GRANTED.

This section and interaction-guidance.md specify the current corrective interpretation. Original source claims about missing normative inputs are superseded by direct comparison with approved requirements, without claiming full runtime conformance. The three journeys remain connected exploratory slices, not all product features.

- RULE-013 P0 bulk allowlist: title, description, assigned internal owner, due date. No workstream, type, links, state, criteria, roles, verify, waiver, promotion or delete. Every field initially unchanged; empty demo inputs mean unchanged, not clear. Commit rechecks row revision/permission; per-record atomic metadata+audit, independent valid rows may succeed, rejected rows unchanged with reason/retry. Results retain success/failure and before/after after successful rows deselect. RQ-10 conflict and RQ-12 denied are synthetic failure scenarios, not actual role policy. Demo title/description bounds 240/2000 are illustrative validation limits, not new approved product limits.
- RULE-003 edge = upstream dependency READY AND execution COMPLETED AND (completion edge OR VERIFIED with valid proof). NOT_REQUIRED never satisfies proof edge. RULE-008 milestone = every explicitly required Requirement READY AND COMPLETED AND (VERIFIED with valid proof OR explicitly valid NOT_REQUIRED); no required set = UNASSESSED. No demonstrated runtime verification bypass is alleged against the original.
- RULE-005/006: review exact criterion + evidence/version + validity + designated independent EDITOR/OWNER + rationale. OWNER alone is insufficient. No applicable criterion plus no unresolved dispute and reasoned OWNER process precedes NOT_REQUIRED. Upload does not verify. In this revision new acceptance stays disabled where designation/validity/components are incomplete; rationale field is a concept specimen, not stored review history.
- RULE-014: validate type/dates/scoped refs/source keys/duplicates; invalid dependency-connected group rejected whole, valid independent groups may succeed. Same source/key/content retry deduplicates; changed content conflicts. Imported VERIFIED is a claim, current proof starts UNVERIFIED. Parser/storage/error transport remain architecture choices.
- RULE-015/016/017: active workspace + explicit Matter + permitted role. OWNER/EDITOR/VIEWER may read/export scoped data; assignment never grants access. Recheck retrieval rights, escape formula-leading export text, no hidden scope leaks. P0 brief is draft view/export with t1≤t2, changes (t1,t2] separate from outstanding t2, stable event-time/order/references, explicit no-change; P1 owns managed issued snapshots. Transport/storage/format remain architecture dependent.
- Canonical Atlas: 24 labels, owners U-01/02/03, due instants, execution/verification, workstreams and seven dependency edges come from dataset §4/5. Supplied evidence EV-01/03/05/06/10 map ER-01/03/05/06/10; no supplied closing draft evidence is invented. Historical EV-03/05 self-review conflicts with later policy: preserve historical fixture, disclose discrepancy, prohibit new self-review. Historical T0 VERIFIED records are not proof of current policy enforcement; RQ-03/05 cannot satisfy a new proof edge until independent review establishes valid proof. DOC-03 current v3 is only 1/2 signed. FIL-02 receipt lacks outcome.
- Synthetic DEC-AT-01/02 remain OPEN case questions, separate from governance DEC-* and design UX-DEC-*. They do not require real PO approval as product policy. FD-01 and RISK-AT-01 use canonical IDs. Missing decision/risk owner/outcome remains visibly not supplied.
- All five axes retain text, applicability and reasons: execution, verification, dependency, timing, attention. Timing uses explicit +07 as-of/48h; terminal monitoring ON_TRACK preserves history, no due is visibly unassessed. Critical chain labels are designated fixture inputs, not legal severity inferred from text. Unknown evaluator data stays unavailable. Backend computation/enforcement is not implemented.
- RULE-021 Next Actions are assigned visible Actions NOT_STARTED/IN_PROGRESS + READY, critical-chain first then due then stable ID. At canonical T0 none qualify: remaining NOT_STARTED Actions are blocked. WAITING AC-04/05/10 stay Waiting On, respectively internal U-01/U-01/U-03. Requirements such as RQ-06 are not candidates. Follow-up is a separate explicit Action.
- RULE-008 milestones MS-01/02/03: required-Requirement sets not supplied, show UNASSESSED and unavailable counts; countdowns alone are not readiness. No prerequisite sets invented from workstream membership.
- Three canonical workflow maps and negative/repeat filing outcomes are in interaction-guidance.md and HTML local-r3-contract. Nine screens/partials have some interaction; Matter List, My Actions, Waiting On, Filing Detail remain specification-only. Import/upload/review have mock feedback without aggregate mutation. No production API/auth/persistence/audit/concurrency implementation is claimed.
- Grid: representative inline title editor Enter commit/Escape cancel, invalid input retained with local reason; row Up/Down/Enter/Space ignores nested controls. Copy/paste and full cell navigation remain specification-only. 50/100/200 DENSITY rows are non-Atlas filler, not evidence of realistic scale performance. Context drill-down names origin and has return-to-object/tab; matter-wide linked panels do not imply every row belongs to RQ-04 chain.
- Mobile removes first-eight matching-row truncation; all filtered rows generated. Advanced bulk stays a proposed desktop interaction, not approved full mobile scope. Reachability and usability remain NEEDS_CLARIFICATION pending rendered tests. Touch application navigation/dialog/filter targets use a 44px draft minimum, not a universal WCAG assertion.
- Miniature boards retain scale; Grid has 14px body, 12px metadata, readable reference specimen, multiline rows grow. Typography/focus/selected/disabled/error tokens remain a draft proposal; no rendered contrast/zoom/WCAG/usability PASS. VISUAL_VALIDATION_NOT_EXECUTED.



**MC-003A · local-r2 · Exploratory · rendered acceptance pending**

Tài liệu đặc tả đi kèm artifact `mattercontrol-step-03a-ux-concept-review.html`. Đây là bản đặc tả thiết kế để Product Owner review và để đội implementation chuyển thành brief — không phải bằng chứng rằng thiết kế đã được phê duyệt, đã test usability hay đã sẵn sàng production.

---

## 0. Trạng thái tài liệu

| Trường | Giá trị |
|---|---|
| Governance input | `e377568ac47f8f1b88e3875a8f13d7e57fc30667` |
| Requirements baseline | Đã duyệt · `572835a` |
| Architecture gate | **OPEN** · Step02.3 chạy riêng |
| Dataset | Project Atlas · 100% synthetic |
| As-of | T0 15 Jun 2026 09:00 UTC+07 · T-1 14 Jun 2026 09:00 |
| Phạm vi | 13 screen specifications · 16 deliverable areas |
| Review status | Brief confirmed · visual direction APPROVED_UNDER_PO_DELEGATION |
| Gate hiện tại | **Dừng tại Product Owner design review** |
| Ngôn ngữ | Giải thích tiếng Việt; giữ nguyên product label tiếng Anh khi cần |

### 0.1 Cách đọc tài liệu

- Mỗi screen specification mô tả **hành vi người dùng thấy**, không mô tả API, schema, auth provider hay persistence.
- Trạng thái **Tương tác** nghĩa là có bản dựng thao tác được trong HTML artifact. **Specification-only** nghĩa là được đặc tả đầy đủ nhưng không dựng route/dữ liệu hoạt động trong review build.
- Mọi chuyển cảnh trong prototype là **mô phỏng client-side**; reload sẽ đặt lại dữ liệu.
- Các mục ghi `PENDING_ARCHITECTURE` là phụ thuộc chưa được quyết định. UX không được tự chọn cơ chế kỹ thuật thay cho architecture owner.
- Approved normative inputs đã có. Correction scope có trace; không tuyên bố full P0 implementation conformance.

### 0.2 Không thuộc phạm vi

- Không triển khai frontend production, backend domain logic hay thay đổi Solution Architecture.
- Không tuyên bố phê duyệt hướng hình ảnh, design system, font license, usability test hay legal sufficiency.
- Không suy diễn quyền, API, pagination, validation, concurrency, optimistic update, persistence hay realtime từ giao diện.
- Không tạo “overall readiness %”, điểm số matter hay kết luận pháp lý.

---

## 1. Mục tiêu sản phẩm & nguyên tắc thiết kế

### 1.1 Mục tiêu

MatterControl phải giúp người dùng hiểu **điều gì đang đúng, điều gì đã đổi, điều gì đang chặn, vì sao, ai cần làm gì và bằng chứng nào thực sự chứng minh kết quả** — trước khi họ mở một bảng công việc.

Sản phẩm không phải generic task manager, legal-themed Jira, ERP truyền thống, spreadsheet thay thế đơn thuần, SaaS dashboard chung, AI chatbot, workflow builder hay virtual data room.

### 1.2 Mười câu hỏi giao diện phải trả lời

1. Điều gì đang đúng ngay lúc này?
2. Điều gì đã thay đổi kể từ lần xem trước?
3. Điều gì đang bị chặn?
4. Vì sao nó bị chặn?
5. Tôi có thể tác động vào đâu ngay bây giờ?
6. Ai sở hữu hành động tiếp theo?
7. Chúng ta đang chờ ai hoặc chờ điều gì?
8. Bằng chứng nào chứng minh hoàn tất?
9. Quyết định nào cần sự chú ý?
10. Điều gì xảy ra tiếp theo?

### 1.3 Quy tắc semantic bất biến

| # | Quy tắc | Hệ quả trên giao diện |
|---|---|---|
| S-01 | `COMPLETED` ≠ `VERIFIED` | Hai cột/nhãn riêng; không gộp thành một badge “done”. |
| S-02 | Upload không phải verification | Nút gửi bằng chứng chỉ tạo submission; không đổi verification aggregate. |
| S-03 | Distinct RULE-003 edge / RULE-008 milestone predicates | Không có nút “đánh dấu đạt” cho toàn Requirement. |
| S-04 | Dispute vô hiệu hóa gate | Trạng thái `DISPUTED` phải nhìn thấy và chặn kết luận đạt. |
| S-05 | Dependency readiness là derived | Không có toggle đặt `READY`; unavailable evaluation không mặc định `READY`. |
| S-06 | Reopen/reversal reblock downstream | Không xóa history; proof gate được đánh giá lại. |
| S-07 | Chỉ OWNER được cancel/reopen và promote phiên bản hiện hành | Affordance ẩn/disabled với người không có quyền; enforcement thực tế chờ kiến trúc. |
| S-08 | Persona ≠ matter role | Persona mô tả công việc; role `OWNER`/`EDITOR`/`VIEWER` mô tả quyền trong một matter. |
| S-09 | Workspace đang hoạt động **và** matter membership | Thiếu một trong hai thì không lộ tên matter, blocker hay số lượng bằng chứng. |
| S-10 | VIEWER chỉ đọc/export | Không thấy affordance sửa, nộp bằng chứng, xác minh hay chuyển trạng thái. |
| S-11 | Bulk chỉ metadata title/description/internal owner/due date | Preview theo từng row; lỗi quyền/revision giữ selection; không bulk transition status. |
| S-12 | Ngày có timezone và as-of | Dùng ngày tuyệt đối + `UTC+07`; không dùng “hôm nay” thay cho ngày. |
| S-13 | Không có overall readiness % | Thay bằng ngoại lệ, chuỗi chặn, count có ngữ cảnh và proof gate. |

---

## 2. Personas & matter roles

### 2.1 Personas

| Persona | Câu hỏi mở màn | Bề mặt chính |
|---|---|---|
| **A · Transaction Owner / Manager** | “Điều gì đang chặn Closing, ai đang giữ nó, và tôi cần quyết định gì?” | Control Room · Status Brief · Dependency View |
| **B · Contributor** | “Hôm nay tôi có thể làm gì, cái gì đang chờ bên ngoài, và làm sao cập nhật nhiều bản ghi mà không gây lỗi?” | Operational Grid · My Actions · Import Wizard |
| **C · Reviewer** | “Bằng chứng này chứng minh tiêu chí nào, ở phiên bản tài liệu nào, và người xác minh có thực sự độc lập với người gửi?” | Requirement Detail · Evidence & Verification · Document Versions |

### 2.2 Matter roles

| Role | Hành vi nhìn thấy | Giới hạn |
|---|---|---|
| `OWNER` | Điều hành matter; cancel/reopen; promote phiên bản hiện hành; chỉ xác minh khi explicitly designated verifier và không phải submitter | Độc quyền có kiểm soát; enforcement PENDING_ARCHITECTURE |
| `EDITOR` | Thực thi, cập nhật metadata, nộp bằng chứng | Không tự xác minh bằng chứng do mình gửi; quyền xác minh cụ thể chờ kiến trúc |
| `VIEWER` | Chỉ đọc và export | Không sửa, không nộp bằng chứng, không xác minh, không chuyển trạng thái |

**Cổng truy cập hiển thị:** người dùng chỉ vào được matter khi có workspace đang hoạt động **và** tư cách thành viên của matter. Denied state chỉ nêu lý do và đường quay lại an toàn; không hiển thị dữ liệu matter trước khi cả hai điều kiện được xác nhận.

---

## 3. Information architecture

### 3.1 Xương sống object

`Matter → Workstream → Requirement → Action → Evidence → Document → Dependency → History`

- **Matter** — phạm vi sự thật và quyền truy cập.
- **Workstream** — phân đoạn điều hành (6 nhóm trong fixture), dùng như filter/segment, không phải page bắt buộc.
- **Requirement** — kết quả cần đạt; execution và verification là hai chiều riêng.
- **Action** — công việc hỗ trợ; không tự hoàn tất Requirement.
- **Evidence** — tiêu chí cần chứng minh và bản ghi đã cung cấp.
- **Document** — phiên bản hiện hành và lịch sử superseded.
- **Dependency** — trạng thái `READY`/`BLOCKED` được suy ra.
- **History** — sự kiện append-only; reopen không xóa lịch sử.

### 3.2 Điều hướng

- Workspace → Matter List → Matter.
- Trong matter: Control Room · Operational Grid · My Actions · Waiting On · Evidence & Verification · Documents · Filings · Status Brief · History.
- Độ sâu tối đa **2 tầng ngữ cảnh**: Matter → object chính → drawer/tab liên quan.
- Mở dependency, evidence hoặc document **không** đẩy người dùng sang route mới; filter, sort, scroll và selection được giữ.
- Đóng drawer trả focus về đúng trigger; nếu trigger đã bị filter loại, focus về table container và có thông báo.

### 3.3 Screen inventory

| # | Màn hình | Review build | Người dùng chính |
|---|---|---|---|
| 01 | **Matter List** — Chọn matter theo ngoại lệ, mốc và quyền | Specification-only | Transaction Owner / Manager |
| 02 | **Matter Control Room** — Hiểu matter trong một lần quét | Tương tác | Owner / Manager · Reviewer |
| 03 | **Operational Grid** — Thực thi nhanh ở 50–200 dòng | Tương tác | Contributor · Owner |
| 04 | **My Actions** — Queue việc có thể làm ngay | Specification-only | Contributor |
| 05 | **Waiting On** — Ai đang giữ bước tiếp theo | Specification-only | Owner / Manager · Contributor |
| 06 | **Requirement Detail** — Kết quả, proof gate và next action | Tương tác | Reviewer · Owner · Contributor |
| 07 | **Action Detail** — Làm việc mà vẫn thấy blocker | Tương tác | Contributor · Reviewer |
| 08 | **Dependency View** — Readiness được suy ra, không gán tay | Tương tác | Owner · Reviewer |
| 09 | **Evidence & Verification** — Đúng tiêu chí, đúng phiên bản, đúng người | Tương tác | Reviewer · Owner |
| 10 | **Document Versions** — Bản nào là sự thật hiện hành | Tương tác | Reviewer · Owner |
| 11 | **Filing Detail** — Lifecycle đến receipt và authority review | Specification-only | Owner · Contributor |
| 12 | **Excel/CSV Import Wizard** — Từ bảng lộn xộn đến cấu trúc có kiểm soát | Tương tác | Contributor · Owner |
| 13 | **Status Brief** — Bản tóm tắt có thể gửi cho người khác | Tương tác | Owner / Manager |

---

## 4. Mô hình trạng thái dùng chung

### 4.1 Execution và verification

- **Execution** trả lời “công việc đã được thực hiện/chạy chưa?” — ví dụ `WAITING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NOT_STARTED`.
- **Verification** trả lời “kết quả đã được chứng minh chưa?” — ví dụ `UNVERIFIED`, `PARTIALLY_VERIFIED`, `VERIFIED`, `DISPUTED`, `NOT_REQUIRED`.
- Action có thể `WAITING` trong khi Requirement mẹ vẫn `UNVERIFIED`. Không suy diễn giá trị thiếu.
- Canonical Atlas §4 cấp đủ 24 execution/verification/owner/due records; Local R1 khôi phục, không để dữ liệu đã có thành missing.

### 4.2 Proof gate

Gate chỉ đạt khi:

```text
RULE-003 edge: dependency READY AND execution COMPLETED
AND (gate COMPLETION OR (gate PROOF AND verification VERIFIED AND valid proof))
RULE-008 milestone: all declared required Requirements READY AND COMPLETED
AND (VERIFIED with valid proof OR explicitly valid NOT_REQUIRED); empty set UNASSESSED
```

- Không có control “đánh dấu Requirement đạt”.
- `NOT_REQUIRED` phải có lý do; không dùng như đường tắt.
- Gate là điều kiện vận hành, không phải kết luận pháp lý.

### 4.3 Dependency

- `READY`/`BLOCKED` được suy ra từ proof gate của input và điều kiện cạnh.
- Không có thao tác đặt `READY` thủ công.
- `WAITING` không đồng nghĩa `BLOCKED`: `AC-04` là `WAITING · READY`; `AC-05` là `WAITING · BLOCKED`.
- Chuỗi chính của fixture: `RQ-04 → AC-05 → AC-07 → AC-08 → AC-09`.
- Cạnh phụ: `RQ-05 → AC-05` (đã satisfied nhưng không xóa điều kiện khác), `AC-10 → AC-11`, `RQ-11 → AC-12`.
- Unavailable evaluation hiển thị “Chưa đủ dữ liệu”; không mặc định `READY`.

### 4.4 Evidence

- Completeness tính theo **criterion**, không theo số file.
- Fixture: 12 tiêu chí, 5 bản ghi được cung cấp; `ER-02` và `ER-04` thiếu.
- Mỗi quyết định xác minh phải chỉ rõ criterion + document version + submitter + reviewer.
- Reviewer phải độc lập với submitter; self-verification bị chặn.
- Upload chỉ tạo submission; aggregate là read-only derived value; dispute invalidates.
- Canonical mapping EV-01/03/05/06/10 → ER-01/03/05/06/10 được khôi phục; historical self-review EV-03/05 không conformant current policy, không cấp quyền mới.

### 4.5 Document versions

- Mỗi tài liệu có tối đa một phiên bản `current`; các phiên bản cũ là `superseded`.
- Promotion chỉ xảy ra bởi sự kiện `OWNER` rõ ràng; không tự promote theo thời gian.
- Nhãn `draft`, `submitted`, `partially signed` không được hiểu là `approved` hay `completed`.
- Fixture: 5 tài liệu, 10 phiên bản; Agreement v3 `current`, partially signed 1/2.

### 4.6 Bulk & import

- Bulk chỉ sửa `title`, `description`, `assigned internal owner`, `due date`; không đổi execution/verification.
- Preview theo từng row; phân biệt permission failure, revision conflict và success.
- Hàng thành công bỏ chọn; hàng lỗi giữ chọn để xử lý tiếp. Không thông báo “thành công toàn bộ” khi có lỗi.
- Import đi theo `Upload → Map → Preview → Draft`; tạo structured draft, không tạo verification/completion.

### 4.7 Thời gian

- Mọi ngày hiển thị kèm `UTC+07` hoặc timezone đã chọn, và có `as-of` khi là snapshot.
- Diff “kể từ T-1” là mẫu mô phỏng, không phải audit log lịch sử.
- Không dùng “hôm nay”, “vừa xong” thay cho ngày tuyệt đối.

### 4.8 State taxonomy

| State | Hành vi hiển thị |
|---|---|
| Default | Dữ liệu hiện tại, nhãn trạng thái có text, không chỉ màu. |
| Loading | Giữ cấu trúc/khung; không hiển thị số liệu cũ như thể hiện tại. |
| Empty | Nói rõ bộ lọc/điều kiện đang loại gì; có đường xóa filter. Không kết luận “không có việc”. |
| Error | Nêu lỗi, dữ liệu nào còn an toàn, bước phục hồi; không hiển thị dữ liệu cũ như hiện tại. |
| Denied | Chỉ lý do thiếu quyền + đường quay lại; không lộ dữ liệu matter. |
| Stale | Hiển thị as-of; không giả realtime. |
| Conflict | Chỉ row/field xung đột; không ghi đè; cho tải bản mới. |
| Partial success | Tách success/failure; giữ selection lỗi; không báo thành công toàn bộ. |

---

## 5. Screen specifications

### 01 · Matter List

**Trạng thái review:** Specification-only — đặc tả đầy đủ nhưng không dựng route/dữ liệu hoạt động trong review build.

**Người dùng chính:** Transaction Owner / Manager · **Wireframe archetype:** `list`

**Mục tiêu.** Giúp người dùng chọn đúng matter để mở mà không bị dẫn dắt bởi một điểm readiness chưa được duyệt.

**Thứ bậc thông tin**

- Ưu tiên matter có blocker, mốc gần hoặc quyết định mở.
- Mỗi hàng nêu ngày cập nhật, người phụ trách, workstream đang chú ý và một tín hiệu ngoại lệ.
- Không có overall score, không có pie chart danh mục.

**Hành động chính**

- Mở Control Room.
- Lọc theo matter của tôi, đang chặn, cần quyết định.
- Tìm kiếm theo tên/ID matter.

**Trạng thái.** Loading: skeleton giữ cấu trúc. Empty: không có matter trong membership. Error: retry, không hiện dữ liệu cũ như hiện tại. Denied: workspace/membership. Stale: as-of rõ.

**Điều hướng.** Workspace → Matter List → Control Room.

**Desktop.** Danh sách giàu ngữ cảnh; cột ID/name, trạng thái chú ý, milestone, role. Mở matter bằng Enter.

**Mobile.** Row-card, ưu tiên blocker và mốc; không hiển thị toàn bộ chỉ số.

---

### 02 · Matter Control Room

**Trạng thái review:** IMPLEMENTED_NOT_TESTED trong browser; partial local code, không có native interaction acceptance.

**Người dùng chính:** Owner / Manager · Reviewer · **Wireframe archetype:** `control`

**Mục tiêu.** Trả lời nhanh: điều gì đúng, điều gì chặn, vì sao, ai đang giữ, bằng chứng nào thiếu, quyết định nào mở và điều gì đổi.

**Thứ bậc thông tin**

- Chuỗi chặn và tác động downstream.
- Bằng chứng thiếu/không đạt proof gate.
- Quyết định mở, bên đang chờ, mốc, finding/risk.
- Thay đổi kể từ lần xem trước; không có % readiness.

**Hành động chính**

- Mở Requirement/Action trên chain.
- Mở Status Brief.
- Mở Evidence, Dependency, Document.
- Lọc workstream khi cần.

**Trạng thái.** Loading: giữ khung. Empty: matter chưa có ngoại lệ. Error/denied/stale/conflict/partial: thông điệp rõ, không che dữ liệu cũ.

**Điều hướng.** Matter mặc định; drawer cho object; không rời trang khi xem evidence.

**Desktop.** Hai vùng: impact/evidence/changes và decision/waiting/milestones. Rail ẩn được ở tablet.

**Mobile.** Stack: blocker trước, 2 quyết định, 3 bên chờ, milestone; CTA Status Brief vẫn 44px.

---

### 03 · Operational Grid

**Trạng thái review:** IMPLEMENTED_NOT_TESTED trong browser; partial local code, không có native interaction acceptance.

**Người dùng chính:** Contributor · Owner · **Wireframe archetype:** `grid`

**Mục tiêu.** Cho phép legal power user làm việc chính xác trên nhiều bản ghi mà không mất ngữ cảnh hoặc vô tình đổi trạng thái.

**Thứ bậc thông tin**

- Toolbar tìm/lọc/sort và số record.
- Bảng dày với execution, verification, dependency, due, owner, evidence cue.
- Bulk tray; detail drawer; import/export.

**Hành động chính**

- Multi-select, bulk metadata title/description/internal owner/due date.
- Mở detail, sort, filter, import, export.
- Xem evidence gap ngay trên row.

**Trạng thái.** Loading/empty/error/denied/stale/conflict/partial. Partial success giữ selection lỗi; filter count không thay đổi ngoài ý muốn.

**Điều hướng.** Grid giữ filter/scroll/selection khi mở drawer; đóng trả focus.

**Desktop.** Bảng internal scroll; Comfortable mặc định với row tối thiểu 44px, Compact tùy chọn tối thiểu 36px; nội dung nhiều dòng được tăng chiều cao; sticky header; keyboard row nav.

**Mobile.** Row-card, đọc state trước; advanced bulk chuyển desktop; không bảng ngang.

---

### 04 · My Actions

**Trạng thái review:** Specification-only — đặc tả đầy đủ nhưng không dựng route/dữ liệu hoạt động trong review build.

**Người dùng chính:** Contributor · **Wireframe archetype:** `myactions`

**Mục tiêu.** Giảm thời gian tìm việc: chỉ hiện hành động thuộc người dùng hoặc nhóm, sắp theo hạn và mức chặn.

**Thứ bậc thông tin**

- RULE-021: eligible assigned Actions only; critical chain first, due ascending/no due last then stable ID; Waiting On separate.
- Mỗi item nêu requirement mẹ, dependency và evidence cần nộp.
- Không trộn waiting với actionable.

**Hành động chính**

- Mở Action Detail.
- Cập nhật metadata.
- Nộp artifact; không tự verify.

**Trạng thái.** Empty: không có việc được giao — phân biệt với bị chặn. Denied: không có quyền. Stale: thời điểm tải.

**Điều hướng.** Matter → My Actions; deep-link về Requirement/Action.

**Desktop.** Queue + detail panel; shortcuts mở nhanh.

**Mobile.** Đây là màn hình ưu tiên mobile; card theo hạn, tap mở full-screen detail.

---

### 05 · Waiting On

**Trạng thái review:** Specification-only — đặc tả đầy đủ nhưng không dựng route/dữ liệu hoạt động trong review build.

**Người dùng chính:** Owner / Manager · Contributor · **Wireframe archetype:** `waiting`

**Mục tiêu.** Tách rõ chờ bên ngoài, chờ nội bộ và chờ hệ thống; không để người dùng nhầm WAITING với BLOCKED.

**Thứ bậc thông tin**

- Nhóm theo bên chờ; tuổi chờ chỉ hiện khi có waiting_since.
- Liên kết requirement/action/filing; due và as-of.
- Cảnh báo khi chờ đã ảnh hưởng downstream.

**Hành động chính**

- Mở object liên quan.
- Ghi nhận follow-up (concept; chưa phải messaging).
- Xem impact nếu bên kia không phản hồi.

**Trạng thái.** Aging unavailable: “Chưa có dữ liệu chờ”, không hiện 0. Empty: không có external wait. Stale/error rõ.

**Điều hướng.** Matter → Waiting On; trở lại Control Room.

**Desktop.** Grouped list + impact preview.

**Mobile.** Card theo bên chờ; hiển thị due/as-of, không hứa realtime.

---

### 06 · Requirement Detail

**Trạng thái review:** IMPLEMENTED_NOT_TESTED trong browser; partial local code, không có native interaction acceptance.

**Người dùng chính:** Reviewer · Owner · Contributor · **Wireframe archetype:** `requirement`

**Mục tiêu.** Xác định Requirement có thực sự đạt proof gate không, thiếu gì và ai cần làm gì tiếp theo.

**Thứ bậc thông tin**

- Header: execution + verification + workstream + owner + due.
- Proof gate và lý do chưa đạt.
- Evidence criteria, Actions, Dependency, Documents, History.

**Hành động chính**

- Nộp bằng chứng (không verify).
- Mở Evidence/Documents/Dependency.
- OWNER reopen; người khác không thấy affordance.

**Trạng thái.** Loading; missing evidence; no criteria mapped; conflict; denied; unavailable evaluation = không kết luận.

**Điều hướng.** Drawer từ Grid/Control Room; tab giữ ngữ cảnh.

**Desktop.** Drawer 620px; tab + side facts.

**Mobile.** Full-screen sheet, tab ngắn, back giữ vị trí list.

---

### 07 · Action Detail

**Trạng thái review:** IMPLEMENTED_NOT_TESTED trong browser; partial local code, không có native interaction acceptance.

**Người dùng chính:** Contributor · Reviewer · **Wireframe archetype:** `action`

**Mục tiêu.** Giúp người dùng hiểu Action đang chờ/blocked vì đâu và hoàn thành phần việc mà không tự nhảy sang trạng thái Requirement.

**Thứ bậc thông tin**

- Execution/dependency; owner/due.
- Why blocked + downstream.
- Requirement mẹ, evidence/submission, history.

**Hành động chính**

- Cập nhật metadata.
- Nộp artifact.
- Mở dependency/requirement.

**Trạng thái.** Missing evaluation; permission denied; conflict; stale. Không tự complete Requirement.

**Điều hướng.** Drawer từ Grid/My Actions.

**Desktop.** Drawer 560px; không rời bảng.

**Mobile.** Full-screen; action chính 44px.

---

### 08 · Dependency View

**Trạng thái review:** IMPLEMENTED_NOT_TESTED trong browser; partial local code, không có native interaction acceptance.

**Người dùng chính:** Owner · Reviewer · **Wireframe archetype:** `dependency`

**Mục tiêu.** Giải thích một trạng thái BLOCKED/READY bằng inputs, rule và downstream; không dùng graph trang trí.

**Thứ bậc thông tin**

- Chuỗi chính; node trạng thái thật.
- Inputs → Rule → Derived state.
- Cạnh phụ, reopen impact, unavailable evaluation.

**Hành động chính**

- Mở node.
- Xem downstream.
- Xem lịch sử (nếu có).

**Trạng thái.** Unavailable: chưa đủ dữ liệu, không READY. Cycle/conflict/error: nêu rõ, không tự sửa.

**Điều hướng.** Panel từ Control Room/Requirement/Action.

**Desktop.** Chain + rule panel.

**Mobile.** Vertical chain; rule panel dưới.

---

### 09 · Evidence & Verification

**Trạng thái review:** IMPLEMENTED_NOT_TESTED trong browser; partial local code, không có native interaction acceptance.

**Người dùng chính:** Reviewer · Owner · **Wireframe archetype:** `evidence`

**Mục tiêu.** Cho reviewer quyết định có kiểm chứng được một outcome cụ thể hay không, với dấu vết người gửi/người xác minh.

**Thứ bậc thông tin**

- Completeness theo criterion, không theo số file.
- ER-02/ER-04 thiếu; records table.
- Review panel; aggregate read-only.

**Hành động chính**

- Chọn record.
- Xác minh/từ chối nếu đủ quyền và độc lập.
- Mở document version.

**Trạng thái.** Reviewer = submitter: chặn. Missing outcome/draft: chặn. Conflict/denied/stale: rõ. Không free dropdown.

**Điều hướng.** Panel từ Control Room/Requirement; giữ filter.

**Desktop.** Wide panel 930px; table + review.

**Mobile.** Stack, record table đơn giản; decision buttons 44px.

---

### 10 · Document Versions

**Trạng thái review:** IMPLEMENTED_NOT_TESTED trong browser; partial local code, không có native interaction acceptance.

**Người dùng chính:** Reviewer · Owner · **Wireframe archetype:** `documents`

**Mục tiêu.** Nhận diện bản hiện hành và trạng thái thực (draft, submitted, partially signed) mà không nhầm với approved/completed.

**Thứ bậc thông tin**

- Nhóm theo tài liệu; current đứng đầu; superseded dưới.
- Signature/submission status; evidence link.
- OWNER promotion event.

**Hành động chính**

- Xem lịch sử.
- Mở evidence liên quan.
- OWNER promote phiên bản (chỉ OWNER).

**Trạng thái.** No current version; multiple candidates: cảnh báo. Permission denied; stale. Không auto promote.

**Điều hướng.** Panel từ Requirement/Documents; ở lại ngữ cảnh.

**Desktop.** Version ledger + history.

**Mobile.** Accordion theo tài liệu.

---

### 11 · Filing Detail

**Trạng thái review:** Specification-only — đặc tả đầy đủ nhưng không dựng route/dữ liệu hoạt động trong review build.

**Người dùng chính:** Owner · Contributor · **Wireframe archetype:** `filing`

**Mục tiêu.** Theo dõi một filing từ package đến approval, đặc biệt WAITING ON AUTHORITY, supplement và response.

**Thứ bậc thông tin**

- Lifecycle hiện tại: FIL-02 Authority Review; receipt present, outcome missing.
- Package completeness và signatures.
- Response actions, history.

**Hành động chính**

- Submit; ghi reference/receipt.
- Tạo response action.
- Đọc outcome/approval.

**Trạng thái.** Unsubmitted (FIL-01); waiting authority; missing package; supplement requested; denied/conflict.

**Điều hướng.** Matter → Filings → Filing Detail; link về Requirement.

**Desktop.** Lifecycle + package checklist + history.

**Mobile.** Stepper rút gọn, tập trung next step.

---

### 12 · Excel/CSV Import Wizard

**Trạng thái review:** IMPLEMENTED_NOT_TESTED trong browser; partial local code, không có native interaction acceptance.

**Người dùng chính:** Contributor · Owner · **Wireframe archetype:** `import`

**Mục tiêu.** Nhập dữ liệu DD nhanh nhưng không tạo completion/verification giả; cho phép sửa lỗi trước khi tạo bản nháp.

**Thứ bậc thông tin**

- Upload → Map → Preview → Draft.
- Lỗi theo dòng; duplicate/permission/revision.
- Không tạo verification.

**Hành động chính**

- Chọn tệp, map cột.
- Sửa dòng lỗi.
- Tạo structured draft.

**Trạng thái.** File invalid; mapping missing; duplicate; partial success; denied; server error PENDING.

**Điều hướng.** Từ Grid; đóng giữ filter/selection.

**Desktop.** Modal rộng, preview table.

**Mobile.** Full-screen stepper, mapping cuộn dọc.

---

### 13 · Status Brief

**Trạng thái review:** IMPLEMENTED_NOT_TESTED trong browser; partial local code, không có native interaction acceptance.

**Người dùng chính:** Owner / Manager · **Wireframe archetype:** `brief`

**Mục tiêu.** Truyền đạt trạng thái có as-of, blocker, decision, waiting và giới hạn dữ liệu; không tạo cảm giác “mọi thứ đã xong”.

**Thứ bậc thông tin**

- Tóm tắt → blocker → decision → waiting → evidence → milestone → changes.
- Không overall %; as-of rõ.
- Ghi chú dữ liệu tổng hợp/không phải kết luận pháp lý.

**Hành động chính**

- Đọc; mở object liên quan.
- Xuất/chia sẻ (concept; quyền export APPROVED for scoped OWNER/EDITOR/VIEWER).

**Trạng thái.** Stale: as-of. Missing: ghi rõ chưa có. Error: không tạo brief giả. Denied: không export.

**Điều hướng.** Matter → Status Brief; có thể mở từ Control Room.

**Desktop.** Trang/bản in; hierarchy dọc.

**Mobile.** Một cột, ưu tiên blocker và decision.

---


---

## 6. Ba golden workflows

### GW-01 · Transaction / Restructuring

Từ “thấy chặn” đến “brief phản ánh sự thật mới”. Critical chain: `RQ-04 → AC-05 → AC-07 → AC-08 → AC-09`.

1. Mở Project Atlas từ Matter List; Control Room là điểm vào mặc định.
2. Đọc tín hiệu T0: 1 chuỗi chặn, 2 quyết định mở, 3 bên đang chờ, 2 tiêu chí trọng yếu thiếu.
3. Chọn `AC-05`, mở “vì sao chặn” và downstream bị ảnh hưởng.
4. Mở `RQ-04`: `WAITING · UNVERIFIED`, hạn 14 Jun, chờ Cedar Seller Demo.
5. Mở Evidence & Verification: `ER-04` thiếu; DD pack v2 là bản hiện hành.
6. Gửi bằng chứng (mô phỏng) — chỉ tạo submission, không đổi verification.
7. Reviewer độc lập kiểm tra đúng `ER-04` + DD pack v2.
8. Aggregate được suy ra; `RQ-04` chỉ đạt gate khi execution và verification cùng đạt.
9. Dependency Engine tính lại; unavailable evaluation không là `READY`.
10. Downstream `AC-07/08/09` chỉ `READY` khi điều kiện thỏa; không gán tay.
11. Control Room cập nhật chain/evidence/waiting; giữ filter và vị trí.
12. Status Brief tạo bản as-of mới, nêu điều đã đổi và điều vẫn chờ; không có điểm tổng.

### GW-02 · Due Diligence

Import dữ liệu lộn xộn → cấu trúc → gap → finding → follow-up.

1. Mở Import Wizard từ Operational Grid.
2. Map cột requirement/evidence gap/workstream/due/owner; preview lỗi theo dòng.
3. Tạo structured requirements/actions ở trạng thái nháp; không tạo verification.
4. Review evidence criteria; phân biệt “đã cung cấp” và “đã xác minh”.
5. Phát hiện `ER-04` thiếu; mở DD finding #1 và gán follow-up `AC-04`.
6. `AC-04` hiển thị `WAITING` nhưng dependency `READY`; không bị coi là blocker hệ thống.
7. Khi Cedar Seller Demo phản hồi, tạo Evidence Record; upload chưa phải verification.
8. Reviewer độc lập xác minh theo criterion + version; finding đóng bằng dữ liệu.
9. Grid giữ selection/filter khi mở detail; kết quả được ghi trong History.

### GW-03 · Regulatory Filing

`FIL-02` đang `WAITING` ở Authority Review; receipt có, outcome thiếu. `FIL-01` chưa submit. Lifecycle là state machine có ngữ cảnh, không phải workflow builder.

`Preparation → Review → Signature collection → Submission → Receipt → Authority Review → Supplement → Response → Approval`

1. Mở Filing Detail từ Control Room hoặc danh sách Filings.
2. Kiểm tra package completeness và mốc thời gian bằng checklist có nguồn.
3. Theo dõi signature collection; phân biệt chờ chữ ký với blocked.
4. Submit và ghi filing reference; submission không đồng nghĩa approval.
5. `FIL-02` chuyển `WAITING ON AUTHORITY`; receipt có, outcome thiếu.
6. Nếu có supplement request, tạo response actions và gán owner; deadline `UTC+07`.
7. Mọi thay đổi package/version phải chỉ rõ phiên bản hiện hành.
8. `FIL-01` giữ `unsubmitted`; không dùng cùng trạng thái với `FIL-02`.
9. Kết thúc ở approval hoặc ngoại lệ có giải thích; không ẩn failure sau badge xanh.

**Ngoài luồng chính nhưng phải nhìn thấy:** hai quyết định mở — readiness timing và signature follow-up priority — chỉ thay đổi cách ưu tiên/công bố, không được ghi đè proof gate hay dependency.

---

## 7. Interaction specifications

Expected interaction targets, not execution results. Capability classifications above govern what exists; native focus/keyboard and full cell workflows remain unaccepted.

| # | Pattern | Kích hoạt | Hệ thống | Phục hồi | Keyboard / motion |
|---|---|---|---|---|---|
| I-01 | Giải thích vì sao bị chặn | Chọn node `AC-05` hoặc “Mở Dependency View” | Drawer/panel `Inputs → Rule → Derived state`; nêu downstream; không có “đặt READY” | Thiếu dữ liệu → “Chưa đủ dữ liệu”, không mặc định `READY`; đóng trả focus về node | Enter mở, Esc đóng, ring rõ; 160ms hoặc tức thời khi reduced motion |
| I-02 | Làm nổi tác động downstream | Chọn `AC-05` trên impact chain | Highlight `AC-07/08/09`, trạng thái `BLOCKED`, lý do dẫn xuất | Bỏ chọn trả highlight mặc định; không reset scroll/drawer khác | Arrow keys giữa node; highlight bằng border + nhãn, không chỉ màu |
| I-03 | Mở detail không mất vị trí | Click row/ID trong Grid | Drawer bên phải; giữ filter, sort, scroll, selection, độ rộng cột; tab Tổng quan/Bằng chứng/Phụ thuộc/Lịch sử | Close trả focus về row trigger; row bị filter loại → focus table container + thông báo | Enter mở; ArrowUp/Down; Space chọn; Esc đóng; 160ms |
| I-04 | Preview bulk & partial failure | Chọn nhiều hàng → Sửa metadata → preview | Chỉ title/description/internal owner/due date; kết quả permission/revision theo row | Hàng thành công bỏ chọn; hàng lỗi giữ chọn; “1 áp dụng · 2 giữ lựa chọn” | Native focus trap; Esc đóng; live region; không tuyên bố optimistic update |
| I-05 | Xác minh / từ chối bằng chứng | Mở Evidence Record → Xác minh/Từ chối | Hiển thị criterion, version, submitter, reviewer; chặn self-verification; aggregate read-only | Lỗi quyền/phiên bản rõ; không ghi đè quyết định trước; không tự hoàn tất Requirement | Focus vào criterion trước; Enter xác nhận, Esc hủy |
| I-06 | Nhận diện phiên bản hiện hành | Mở Documents từ detail | Nhóm theo tài liệu; một `current`; superseded ở dưới; nhãn draft/submitted/partially signed | Promotion chỉ là sự kiện `OWNER`; không quyền → chỉ đọc | Current được đọc trong accessible name, không chỉ in đậm |
| I-07 | Waiting On aging | Xem danh sách chờ bên ngoài | Bên chờ, đối tượng, due/as-of, lý do; thiếu `waiting_since` → “Chưa có dữ liệu chờ”, không hiện 0 | WAITING/BLOCKED nêu cạnh nhau; không suy “actionable” chỉ từ owner | Mỗi hàng là button/link có accessible name; sort/filter chuẩn |
| I-08 | Thay đổi kể từ lần xem trước | Mở “Thay đổi kể từ T-1 09:00” | Event + timestamp + loại thay đổi + actor/role + link object | Không có audit trail → nói rõ không có dữ liệu, không suy diễn diff; mở object quay lại giữ danh sách | Timeline có heading/thứ tự; không cần motion |
| I-09 | Lọc công việc có thể hành động | Filter “Đang chặn” hoặc My Actions | Kết quả theo state + quyền; row bị chặn có lý do; `AC-04` vẫn ở Waiting On | Empty state nói filter đang loại gì + nút xóa filter | `aria-pressed`; live region; focus không nhảy |
| I-10 | Import có mapping & preview | Chọn tệp → map cột → preview → draft | Mapping, validation theo dòng, duplicate, thiếu owner/date; không tạo verification/completion | Dòng lỗi giữ để sửa; dòng hợp lệ tạo nháp; không báo “thành công” nếu chỉ một phần | Stepper có heading/step hiện tại; bảng mapping có label |
| I-11 | Reopen / reversal | `OWNER` mở object đã đóng → Reopen | Impact preview downstream, lý do bắt buộc, xác nhận; history giữ nguyên; gate đánh giá lại | Fail → không đóng dialog; lỗi quyền/version rõ; non-OWNER không thấy affordance | Destructive không là primary mặc định; focus vào lý do trước; Esc an toàn |
| I-12 | Focus, reduced motion & phục hồi | Bàn phím, dialog, screen reader | Focus ring luôn thấy; native dialog trap; Esc đóng; live region cho toast; selection/vị trí grid giữ | Đóng drawer trả focus trigger; trigger mất → heading/container có nhãn | Reduced motion bỏ animation; trạng thái đổi ngay nhưng vẫn có text; không dựa vào hover |

---

## 8. Responsive strategy

Mobile là thiết kế lại có ưu tiên: thấy blocker, hiểu lý do, mở detail, cập nhật ngắn. Bulk nâng cao và so sánh nhiều cột vẫn là công việc desktop.

| Breakpoint | Hành vi |
|---|---|
| ≥ 1366px | Desktop đầy đủ: rail, Control Room 2 cột, Grid nhiều cột + drawer 520px. |
| 1024–1365px | Rail thu gọn; Control Room giữ 2 cột đến 980px; Grid ẩn cột ít quan trọng, vẫn internal scroll. |
| 768–1023px | Tablet: một cột nội dung; Grid có column chooser; drawer 360px; bulk preview khả dụng. |
| ≤ 767px | Mobile: nav hàng ngang, blocker chain dọc, Grid → row-card, drawer full-screen; advanced bulk ở desktop. |
| ≤ 430px | Giảm chrome, giữ target 44px, không bảng rộng; empty/error/denied vẫn đọc được. |

**Nguyên tắc “không tràn ngang”:** max-width 100%, `min-width: 0`, wrap có kiểm soát. Bảng desktop có internal scroll; mobile thay bằng row-card. Không ẩn overflow để che lỗi bố cục.

Chưa chạy đủ matrix 360/390/430/600/768/820/1024/1366/1440/1920 trong trình duyệt thật; đây là thiết kế responsive, không phải tuyên bố QA đã pass.

---

## 9. Accessibility strategy

Mục tiêu là **WCAG 2.2 AA ở mức thiết kế**. Chưa có audit, chưa có kết quả kiểm thử; mọi tuyên bố “đã đạt” sẽ là sai.

- **State không phụ thuộc màu:** execution, verification, dependency, timing luôn có nhãn chữ và vị trí ổn định.
- **Tương phản:** text thường ≥ 4.5:1; text lớn/icon ≥ 3:1; hover không làm chữ nhạt; disabled là ngoại lệ duy nhất và phải có lý do gần đó.
- **Bàn phím (expected, browser NOT_TESTED):** mọi control truy cập bằng Tab; Grid hỗ trợ ArrowUp/Down, Enter, Space; Esc đóng dialog; focus-visible rõ; focus trở về trigger.
- **Touch targets:** lựa chọn thiết kế 44×44px trên touch; desktop control 32px, row Comfortable 44px/Compact 36px tối thiểu với nội dung nhiều dòng được tăng chiều cao. Đây không phải tuyên bố ngưỡng WCAG phổ quát.
- **Screen reader:** table có caption/label, header scope, row ID trong accessible name; chip trạng thái có text; toast dùng live region; tab có `aria-selected`.
- **Motion:** chỉ animate để báo thay đổi trạng thái; reduced motion tắt transform/pulse.
- **Ngôn ngữ:** font stack hỗ trợ tiếng Việt; line-height đủ cho dấu; thuật ngữ sản phẩm giữ nguyên, giải thích tiếng Việt.
- **Thời gian & lỗi:** ngày tuyệt đối + timezone + as-of; error nói cái gì hỏng, dữ liệu nào còn an toàn và bước phục hồi.

---

## 10. Design system seed

> **Exploratory — không được import như production token.** Token lấy hướng A làm tham chiếu để kiểm tra tính khả thi. Selected A tokens define the current direction; alternative board palettes are historical, not mixed into this system.

### 10.1 Core palette (hướng A tham chiếu)

| Token | OKLch | Dùng cho |
|---|---|---|
| `--bg` | 0.973 / 0.004 / 250 | Nền trang |
| `--surface` | 1.0 / 0 / 0 | Panel, bảng |
| `--fg` | 0.19 / 0.018 / 250 | Chữ chính |
| `--muted` | 0.48 / 0.014 / 250 | Chữ phụ |
| `--border` | 0.875 / 0.008 / 250 | Đường phân cách |
| `--accent` | 0.47 / 0.135 / 255 | Active/focus/selection |

### 10.2 Semantic states

| State | OKLch | Dùng cho |
|---|---|---|
| success | 0.45 / 0.10 / 154 | `VERIFIED` · closed |
| warning | 0.56 / 0.125 / 72 | `WAITING` · due soon |
| danger | 0.50 / 0.17 / 27 | `BLOCKED` · disputed |
| info | 0.50 / 0.09 / 235 | context · derived |
| ink | 0.19 / 0.018 / 250 | primary action |
| accent-soft | 0.94 / 0.022 / 255 | selection · focus |

Màu không bao giờ là tín hiệu duy nhất; mọi trạng thái có nhãn chữ. Cặp foreground/background phải được kiểm tra trước khi triển khai.

### 10.3 Typography

| Vai trò | Stack | Dùng cho |
|---|---|---|
| Display | Iowan Old Style (system serif) | Matter title, section heading, brief title |
| Body | Avenir Next → Segoe UI → Helvetica Neue → sans-serif | Nội dung, label, table cell |
| Mono | SFMono / Cascadia | ID, state, timestamp, số liệu; tabular numbers |

Không tải font ngoài; chưa xác minh license hay khả dụng trên runtime đích.

### 10.4 Spacing, density, motion

- Base 4px; layout 12 cột; max content 1440px; gutter 24/16/12px.
- Control Room: Comfortable. Grid: Comfortable mặc định 44px, Compact tùy chọn 36px minimum single-line row; multiline tăng chiều cao; touch control 44px. Density không thay đổi state/reason, focus hoặc selection.
- Radius: 4px controls · 6–8px panels · 999px chỉ cho pill trạng thái nhỏ.
- Motion: 120ms state feedback; 160ms drawer/panel; tối đa 200ms cho transition có ngữ cảnh; tôn trọng `prefers-reduced-motion`.
- Icons: outline 16/20px, stroke nhất quán; không emoji làm icon chức năng.
- Atomic Design: atoms (state label, ID link, date stamp, evidence dot, verification seal, dependency arrow, tag, checkbox, focus ring) → molecules (proof gate, evidence row, version row, bulk preview row) → organisms (impact chain, evidence ledger, review panel, grid toolbar, bulk tray, import stepper, status brief) → templates (matter shell, Control Room, Grid + inspector, detail drawer, mobile triage stack).

Next.js + Atomic Design chỉ là reference; repository, library version và component availability chưa được xác minh.

---

## 11. Usability test plan

> **Chưa chạy bài test nào. Không có usability PASS, không có external test, không có số liệu giả.** Khi chạy, ghi lại participant, task, success signal và lỗi quan sát được.

| # | Bài test | Success signal | Failure signal |
|---|---|---|---|
| U-01 | Matter comprehension trong 10 giây | Nêu blocker chính + ít nhất một mốc/evidence thiếu | Mô tả chung chung hoặc đọc số liệu không liên quan |
| U-02 | Xác định critical blocker | Chỉ đúng `RQ-04`/`AC-05` và `AC-07/08/09` bị ảnh hưởng | Chọn sai node hoặc coi mọi `WAITING` là `BLOCKED` |
| U-03 | Tìm next action | Phân biệt việc của mình với bên ngoài | Thử sửa trạng thái hệ thống hoặc mở nhầm Grid |
| U-04 | Waiting vs Blocked | `AC-04` `WAITING/READY`, `AC-05` `WAITING/BLOCKED` | Đồng nhất hai trạng thái |
| U-05 | Completed vs Verified | Nêu `COMPLETED + UNVERIFIED` và `ER-02` | Coi completed là verified |
| U-06 | Missing evidence recognition | `ER-02` và `ER-04`, DD pack v2 cho `ER-04` | Đếm số file thay vì tiêu chí |
| U-07 | Current document version | Agreement v3 current, partially signed 1/2; v1/v2 superseded | Coi bản mới nhất là executed/approved |
| U-08 | Grid 50–200 rows | Hoàn thành không mất selection/scroll; không nhầm row | Mất ngữ cảnh hoặc đọc sai state |
| U-09 | Bulk editing | Hiểu 1 thành công, 1 permission fail, 1 revision conflict; giữ lựa chọn lỗi | Tưởng tất cả thành công hoặc đổi status hàng loạt |
| U-10 | Excel/CSV import | Import đúng, giữ dòng lỗi, không tuyên bố complete | Bỏ qua validation hoặc tưởng upload = verify |
| U-11 | Ba golden workflows | Không auto-complete; hiểu thay đổi readiness sau review; filing `WAITING` đúng | Thao tác sai gate hoặc nhầm lifecycle |

Cần ít nhất một phiên cho mỗi persona chính; báo cáo cả failure. Sample size và kết quả không được bịa.

---

## 12. Architecture dependency list

Architecture gate vẫn mở; Step02.3 chạy riêng. Các mục dưới đây mô tả **hành vi người dùng mong đợi**, không chọn API, auth provider, database hay cơ chế realtime.

| # | Chủ đề | Trạng thái | Expected visible behavior |
|---|---|---|---|
| A-01 | Authentication | `PENDING_ARCHITECTURE` | Workspace đang hoạt động → chọn matter có membership; không lộ dữ liệu trước khi xác nhận. |
| A-02 | Authorization enforcement | `PENDING_ARCHITECTURE` | OWNER/EDITOR/VIEWER có affordance khác nhau; UI ẩn/disable nhưng enforcement do backend. |
| A-03 | API contracts | `PENDING_ARCHITECTURE` | Cùng object state giữa Control Room, Grid và drawer; chưa chốt endpoint/payload/versioning. |
| A-04 | Pagination & loading | `PENDING_ARCHITECTURE` | 50–200 dòng giữ filter, sort, selection, scroll; loading không mất ngữ cảnh. |
| A-05 | Backend validation | `PENDING_ARCHITECTURE` | Lỗi theo row/field; giữ dữ liệu đã nhập; phân biệt lỗi dữ liệu với lỗi quyền. |
| A-06 | Concurrency & revision | `PENDING_ARCHITECTURE` | Conflict nhận diện trước khi ghi; user thấy row xung đột và tải bản mới. |
| A-07 | Optimistic updates | `PENDING_ARCHITECTURE` | Nếu dùng, phải có pending rõ và rollback an toàn; gate không được trông đã đạt trước xác nhận. |
| A-08 | Error taxonomy | `PENDING_ARCHITECTURE` | Phân biệt loading/stale/denied/validation/conflict/dependency failure/partial/system error. |
| A-09 | Persistence | `PENDING_ARCHITECTURE` | Artifact chỉ mô phỏng client-side, reset khi reload; không tuyên bố durability. |
| A-10 | Realtime synchronization | `PENDING_ARCHITECTURE` | Nếu có cập nhật từ người khác, UI hiện stale/conflict, không tự ghi đè. |
| A-11 | Evidence storage | `PENDING_ARCHITECTURE` | File gắn criterion + exact document version + submitter; upload không đổi verification. |
| A-12 | Verification aggregate | `PENDING_ARCHITECTURE` | Aggregate read-only derived; dispute invalidates; `NOT_REQUIRED` cần lý do. |
| A-13 | Bulk transaction semantics | `PENDING_ARCHITECTURE` | RULE-013 per-record atomic change+audit; partial success explicit, failed values unchanged and selection retained; mechanism pending. |
| A-14 | Import parsing | `PENDING_ARCHITECTURE` | Map cột, preview, validation, structured draft; không tạo verification. |
| A-15 | Export & reporting | `PENDING_ARCHITECTURE` | Status Brief/export phản ánh as-of; không thêm score chưa duyệt. |
| A-16 | Frontend reference | `VERIFY SEPARATELY` | Next.js + Atomic Design chỉ là reference; kiểm tra repo/version trước implementation. |

**Không có quyết định kiến trúc nào được chốt trong tài liệu thiết kế này.** Architecture owner giữ quyền quyết định; mọi mục `PENDING_ARCHITECTURE` cần được trả lời trước handoff production.

---

## 13. Deliverables 01–16

| # | Deliverable | Nơi thể hiện | Trạng thái |
|---|---|---|---|
| 01 | Product UX Brief | HTML §01 · tài liệu §1 | Chuẩn bị source review; rendered acceptance pending |
| 02 | Persona UX Analysis | HTML §02 · tài liệu §2 | Chuẩn bị source review; rendered acceptance pending |
| 03 | Information Architecture | HTML §03 · tài liệu §3 | Chuẩn bị source review; rendered acceptance pending |
| 04 | Primary User Flows | HTML §05 · tài liệu §6 | Chuẩn bị source review; rendered acceptance pending |
| 05 | Screen Inventory | HTML §03/§09 · tài liệu §3.3/§5 | 13 màn hình |
| 06 | Control Room Wireframe | HTML §06 | Tương tác |
| 07 | Operational Grid Wireframe | HTML §06 | Tương tác |
| 08 | Three Golden Workflows | HTML §05 · tài liệu §6 | Chuẩn bị source review; rendered acceptance pending |
| 09 | Three Visual Directions | HTML §07 | D-UX01 APPROVED_UNDER_PO_DELEGATION |
| 10 | Initial Design System | HTML §08 · tài liệu §10 | Seed exploratory |
| 11 | Interaction Specifications | HTML §10 · tài liệu §7 | 12 pattern |
| 12 | Responsive Strategy | HTML §11 · tài liệu §8 | Thiết kế, chưa QA matrix |
| 13 | Accessibility Strategy | HTML §12 · tài liệu §9 | Mục tiêu AA, chưa audit |
| 14 | Usability Test Plan | HTML §13 · tài liệu §11 | 11 bài, chưa chạy |
| 15 | Architecture Dependency List | HTML §14 · tài liệu §12 | 16 mục, gate mở |
| 16 | Design Decision Log | HTML §16 · tài liệu §14 | UX-DEC history + four delegated D-UX decisions recorded |

---

## 14. Decision log & PO review gate

### 14.1 Quyết định đã ghi

| ID | Quyết định | Trạng thái |
|---|---|---|
| UX-DEC-01 | Control Room và Operational Grid dùng chung object model | Đề xuất |
| UX-DEC-02 | Không có overall readiness percent | Theo brief |
| UX-DEC-03 | RULE-003 edge differs from RULE-008 milestone | Theo brief |
| UX-DEC-04 | Dependency readiness là derived | Theo brief |
| UX-DEC-05 | Evidence review theo exact criterion + document version | Theo brief |
| UX-DEC-06 | Bulk edit chỉ metadata title/description/internal owner/due date | Theo brief |
| UX-DEC-07 | Impact rail là pattern chính để giải thích blocker | Đề xuất |
| UX-DEC-08 | Direction A làm nền, mượn B impact rail và C compact density | **APPROVED_UNDER_PO_DELEGATION** |
| UX-DEC-09 | Mobile là triage + action ngắn | **APPROVED_UNDER_PO_DELEGATION** |
| UX-DEC-10 | Status Brief là narrative có as-of, không phải dashboard score | Đề xuất |
| UX-DEC-11 | Không high-fidelity trước khi chọn hướng | Theo brief |
| UX-DEC-12 | Auth/API/persistence không được giả định | Theo brief |

### 14.2 Delegated UX choices recorded

D-UX01..04 are decided under PO delegation. See ../../design-decisions.json and selected-design-system.md; no routine selection or screenshot task assigned to PO. Formal independent QA/stage gates are not waived.

### 14.3 Gate

> **Dừng tại Product Owner design review.** Direction approved under explicit PO delegation; no STEP03A/03B gate waiver. No production frontend or full high-fidelity execution before mandatory gates.

---

## 15. Provenance & limitations

### 15.1 Provenance

- Governance input: `e377568ac47f8f1b88e3875a8f13d7e57fc30667`.
- Requirements approved: `572835a`.
- Project Atlas adaptation: T0 15 Jun 2026 09:00 UTC+07; T-1 14 Jun 2026 09:00.
- Fixture: 6 workstreams, 3 milestones, 12 requirements, 12 actions, 5 documents/10 versions, 12 evidence criteria/5 supplied records, 3 external parties, 2 filings, 2 open decisions, 1 DD finding, 1 closing delay risk.
- Explicit adaptation: Canonical Atlas §4 fields restored for all 24 records. Canonical evidence mapping restored; historical EV-03/05 self-review remains disclosed.
- Corrected examples: reviewer khác submitter; version promotion là sự kiện `OWNER` rõ ràng, không tự động theo thời gian.
- Density: 50/100/200 rows là dữ liệu nhân tạo, được dán nhãn; không phải Project Atlas.

### 15.2 Limitations

- Normative inputs now supplied and reviewed for corrective scope. See consolidated findings for trace; no full P0 runtime certification.
- Không có production auth, API, pagination, server validation, concurrency, optimistic update, persistence hay realtime. Tất cả `PENDING_ARCHITECTURE`.
- Không có usability test, accessibility audit, legal conclusion hay external validation. Dữ liệu 100% synthetic.
- Font stack dùng hệ thống; không có tuyên bố license ngoài. Không có ảnh thật, không có hotlink.
- Architecture gate mở và Step02.3 chạy riêng; tài liệu này không thay đổi kiến trúc hay domain logic.

---

*Kết thúc đặc tả · MC-003A local-r2 · không phải phê duyệt production.*
