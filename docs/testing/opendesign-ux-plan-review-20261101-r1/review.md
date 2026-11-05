# UX Plan Review — MC-OPENDESIGN-UX-PLAN-REVIEW-20261101-R1

- Reviewer: actual OpenDesign (UI/UX owner theo AGENTS.md)
- Ngày: 2026-11-01
- Đầu vào: improvement-plan.md (P-01..P-15, D-1..D-6), audit-findings.md, accessibility-report.md, terminology-glossary-vi-en.md, workboard-findings.md, MC-LEGAL-PERSONA-FLOW-IMPROVEMENT-PLAN-20261030.md
- Vai trò: review chuyên môn UX, chốt ưu tiên — không phải duplicate audit. Quyết định D-1/D-2/D-9 đã PO RATIFY 2026-10-31 → review với tư cách quyết định đã chốt.

---

## 1. Disposition table — P-01..P-15

| ID | Vấn đề | Mức gốc | Disposition | Rationale |
|---|---|---|---|---|
| P-01 | `/workspaces` title sai "Matters/Hồ sơ" | Blocker | **AGREE** | Copy-paste error rõ ràng; S effort, impact cao vì tạo IA confusion giữa 2 đích toàn cục. Không có gì cần amend — sửa title + metadata đúng là đủ. |
| P-02 | Locale kẹt EN máy chủ | Blocker | **AGREE, AMEND effort** | Đồng ý cơ chế cookie server-readable (D-2 đã RATIFY). **Amend:** effort nên ghi **L** (không phải M–L) — middleware locale + RSC rewrite + regression trên 22 route + prod build probe = dễ 1 tuần khi tính testing. Underestimate effort ở đây gây rủi ro sprint fail. |
| P-03 | Không có data layer demo | Blocker (enablement) | **AGREE, AMEND scope** | D-1(b) đã RATIFY: phương án stub-IdP + local backend walkthrough env (không phải frontend demo fixtures). **Amend scope:** P-03 thu hẹp thành "đóng gói + tài liệu hoá môi trường walkthrough (mcapi + stub-IdP + PG fixture)" — xoá mọi tham chiếu đến in-memory demo fixtures / `API_MODE=demo` seed. Effort giảm từ L → **M**. Banner "Dữ liệu demo" không còn cần (dữ liệu qua contract thật, chỉ là synthetic fixture trong PG). AC sửa: "`pnpm dev` + documented env → vào được workbench có 3 matter mẫu" thay vì "pnpm dev thuần". |
| P-04 | ReadFailure mất context | Major | **AGREE** | Luật sư mất phương hướng khi lỗi xảy ra là UX failure nghiêm trọng. Giữ MatterTabs + breadcrumb + H1 route name khi matter read riêng OK — đúng hướng. Effort M hợp lý. |
| P-05 | Trộn ngôn ngữ ~21 literal | Major | **AGREE** | Sweep qua LocalizedText + bảng thuật ngữ là cách đúng. Phụ thuộc P-06 một phần (cần biết thuật ngữ chốt trước khi sweep) — dependency hợp lý. |
| P-06 | Thuật ngữ lẫn lộn | Major | **AGREE, AMEND dependency** | D-3 đang chờ PO batch #2 (R10 trong workboard). **Amend:** không block P-05 hoàn toàn vào P-06 — sweep EN literals ra LocalizedText ngay (key EN giữ nguyên); thay thế nhãn vi sau khi D-3 chốt. Tách 2 bước giảm critical path. |
| P-07 | Storybook crash | Major | **AGREE** | Mock next/navigation decorator + CI gate — đúng. Storybook là cửa ngõ visual/a11y, crash = gate vô hiệu. Ưu tiên sửa sớm trong Pha 0 là đúng. |
| P-08 | Tab title EN generic | Minor | **AGREE** | `generateMetadata` theo locale cookie hợp lý. NEEDS_READ_MODEL cho tên — dùng id tạm thời nếu chưa có. Effort S, đúng Minor. |
| P-09 | Thiếu kênh announce kết quả | Minor | **AGREE, REPRIORITISE ↑** | **Reprioritise từ Pha 3 → Pha 1.** Lý do: live-region shell cho kết quả hành động là accessibility requirement (WCAG 4.1.3) không phải polish — screen reader user KHÔNG biết hành động thành công/thất bại khi làm việc trên populated data. Khi Pha 1 mở walkthrough env, SR testing trên 3 Golden Workflow cần kênh này tồn tại. Nếu đợi Pha 3 thì Pha 1 SR testing sẽ incomplete. Effort M không đổi; dependency P-03 giữ nguyên. |
| P-10 | Border < 3:1 trên kính | Minor | **AGREE** | Giữ border, thêm field face/inner rim đủ 3:1 — đúng. Chỉ đo được khi có populated dialog trên glass. Effort S, đúng. |
| P-11 | Grid keyboard nav | Major | **AGREE** | AC-111/112 keyboard — cần P-03 data trước. Effort L hợp lý cho 50/200 hàng + selection + bulk. |
| P-12 | Provenance adjacency | Major | **AGREE** | Chỉ audit được sau P-03 (cần populated screens). Effort M hợp lý. |
| P-13 | Failing-stream UX | Major (risk) | **AGREE** | NOT_VERIFIED prod — đúng là phải repro trên `next start` trước khi invest. Nếu không tái lập trên prod → đóng. Nếu tái lập → Blocker. Effort M hợp lý cho error boundary + retry. |
| P-14 | Motion/spacing/z tokens | Minor | **AGREE** | Thêm dần, không block — đúng. S effort, đúng Minor. |
| P-15 | Onboarding rỗng | Polish | **AGREE** | Link trực tiếp "Tạo không gian làm việc" từ empty state — improvement nhỏ, đúng Polish. |

---

## 2. Tổng hợp amendments và reprioritisations

### AMEND (3 items):

1. **P-02 effort → L** (thay vì M–L). Locale middleware rewrite + 22-route regression trên prod build là ≥1 tuần. Underestimate effort ở Blocker = rủi ro sprint fail.

2. **P-03 scope thu hẹp** theo D-1(b) RATIFIED: "đóng gói walkthrough env (mcapi + stub-IdP + PG fixture)" thay vì "frontend demo fixtures in-memory". Effort L → M. AC sửa: `pnpm dev` + documented env variables + script setup → workbench có 3 matter mẫu. Xoá banner "Dữ liệu demo" khỏi yêu cầu.

3. **P-06 dependency tách bước**: sweep EN literals → LocalizedText ngay (không chờ D-3); thay nhãn vi sau khi D-3 chốt. Critical path ngắn hơn.

### REPRIORITISE (1 item):

4. **P-09 ↑ Pha 3 → Pha 1.** Live-region shell là accessibility infrastructure, không phải polish. SR testing trong Pha 1 walkthrough cần kênh này. Không reprioritise = Pha 1 SR testing incomplete = kết luận accessibility ở Pha 1 gate thiếu basis.

### Rationale cho AGREE-all trên phần còn lại:

Improvement plan của ZCode phản ánh đúng mức nghiêm trọng và thứ tự ưu tiên cho 11 items còn lại. Điểm mạnh đáng ghi nhận: plan giữ kỷ luật không bịa số liệu, không hứa timeline, phân biệt rõ SOURCE_READ vs OBSERVED_RENDERED, và ghi giới hạn trung thực (§9). Backlog structure (Pha 0–3 với cổng ra rõ ràng) là mô hình hợp lý cho sản phẩm ở giai đoạn này.

---

## 3. D-3 Terminology — Disposition

Xem file riêng: [`terminology-final.md`](./terminology-final.md)

**Tóm tắt quyết định UX owner:**

- **Matter = "Hồ sơ"** — GIỮU. Lý do: đã dùng xuyên suốt app, đổi sang "Vụ việc" = churn lớn + "Vụ việc" gợi hình sự nhiều hơn transaction/corporate. "Hồ sơ" đủ rộng cho cả quỹ đầu tư và law firm. Điều kiện: Document tab phải gọi là "Tài liệu" (đang đúng) và Workspace title KHÔNG được trùng "Hồ sơ" (P-01 sửa).
- **Filing = "Hồ sơ khai"** — CHỐT. "Khai" ngắn gọn cho badge, "Hồ sơ khai" đầy đủ cho heading/breadcrumb. Loại "Đơn" (quá hẹp) và "Tờ trình" (gợi hành chính nội bộ).
- **Action = "Hành động"** — CHỐT. Bỏ "tác vụ" (task-like, lệch ngữ nghĩa pháp lý). Work item = "Công việc".
- **Role badges → nhãn vi** — CHỐT: OWNER → "Chủ hồ sơ", EDITOR → "Người chỉnh sửa", VIEWER → "Người xem". Badge hiện mã raw OWNER/EDITOR/VIEWER — phải map nhãn.
- 3 amend nhỏ so với glossary đề xuất: xem terminology-final.md §2.

---

## 4. Z-F-01/02 purpose-typing — UX review

### Context
Z-F-01 (filing proof-required nộp được package rỗng) và Z-F-02 (không criterion-kind signature, gate chữ ký nhận bất kỳ) đang fix trong fix-wave CO-06 theo D-9 RATIFIED (purpose-typing criterion: package/signature).

### UX assessment

Guard Z-F mới chặn luật sư khi:
- **Z-F-01 guard:** Filing yêu cầu bằng chứng (proof-required) nhưng package rỗng → chặn nộp
- **Z-F-02 guard:** Filing yêu cầu chữ ký nhưng criterion không phải loại signature → chặn nộp

Đây là **fail-closed đúng thiết kế** — nhất quán với triết lý "từ chối rõ ràng" đã chứng minh hoạt động ở prod demo guard (TB-12). UX copy phải:
1. Nói rõ **vì sao** bị chặn (không phải chỉ "không thể nộp")
2. Nói rõ **cần làm gì** để mở khoá
3. Dùng giọng trung lập, không đổ lỗi người dùng

**UX copy vi/en:** xem file riêng [`ux-copy-for-guards.md`](./ux-copy-for-guards.md)

---

## 5. Checklist UX cần verify khi có populated UI

Audit gốc (UX-L-03) ghi rõ: "Không màn populated nào được quan sát" — mọi kết luận grid/review/filing/import là SOURCE_READ. Khi walkthrough env sẵn sàng (P-03 / D-1(b)), cần verify ngay:

| # | Mục verify | Màn/flow | Tiêu chí pass | Phương pháp |
|---|---|---|---|---|
| V-01 | Grid dày (50+ rows) hiển thị đúng, không tràn, truncation có tooltip | `/matters`, My Work grid, Control Room | Mọi cột hiển thị dữ liệu; text dài truncate + ellipsis + title attr; không horizontal overflow | Screenshot 1440px + 390px |
| V-02 | Provenance adjacency (version/criterion/submitter/as-of liền kề quyết định) | Proof panel, review cells, filing detail | Từng cell có provenance visible trong 1 viewport (không cần scroll thêm để thấy "ai, khi nào") | Rendered checklist per screen |
| V-03 | Field trên glass surface (dialog/panel) contrast ≥ 3:1 | Form dialog trên Liquid Glass backdrop | Input field face vs composite glass background ≥ 3:1 (đo computed color) | Contrast script v2 trên populated dialog |
| V-04 | Role badge hiển thị nhãn vi (không phải mã OWNER/EDITOR/VIEWER) | Matter detail, member list | Badge text = "Chủ hồ sơ" / "Người chỉnh sửa" / "Người xem" | Screenshot vi mode |
| V-05 | Empty → populated transition: grid load không flash trắng, skeleton/loading state có | My Work, Matters list | Chuyển từ loading → data: skeleton hoặc shimmer, không blank content area > 300ms | Record screen + manual timing |
| V-06 | Bulk action (select nhiều rows) có feedback rõ | Grid with bulk select | Selected count visible, action bar appears, SR announce selected count | Keyboard + SR test |
| V-07 | Filing submission guard Z-F UX copy hiển thị đúng khi bị chặn | Filing form (proof-required + empty package) | Guard message hiển thị đúng copy vi/en theo ux-copy-for-guards.md; nút disabled + tooltip/message visible | Screenshot + SR read |
| V-08 | Waiting-on display: biết ai cầm bóng | Matter detail, My Work | "Đang chờ: [tên bên]" visible; nhóm theo bên chịu trách nhiệm nếu có | Screenshot populated matter |
| V-09 | Status Brief output readable với populated data | Status Brief generation | Ngày/giờ theo múi giờ client; tên thay vì ID; delta từ mốc chọn readable | Generate brief + check output |
| V-10 | Import preview với dữ liệu thật | Import CSV flow | Ánh xạ cột hiển thị đúng; lỗi báo theo dòng; preview accurate | Import synthetic CSV |
| V-11 | Keyboard-only navigation qua grid (AC-111) | Work grid, matters grid | Tab/arrow navigate rows; Enter/Space select; focus visible; no trap | Keyboard-only walkthrough |
| V-12 | Screen reader announce trên hành động (P-09 live-region nếu đã implement) | Any action completion | SR announce "Hành động thành công/thất bại" + context | VoiceOver/NVDA session |
| V-13 | Document version: "bản hiện hành" vs "bản đang thương lượng" nhãn rõ | Document detail, version list | Current version có nhãn "Hiện hành"; superseded có nhãn "Đã thay thế"; chờ promote có nhãn "Đang chờ" | Screenshot populated doc |
| V-14 | Matter member visibility ("ai thấy matter này") | Matter settings/detail | Khu hiển thị thành viên + vai + scope truy cập visible | Screenshot |

**Quy trình verify:**
1. Dựng walkthrough env theo D-1(b) (mcapi + stub-IdP + PG fixture)
2. Seed 3 matter mẫu theo 3 Golden Workflow (GW-01/02/03)
3. Chạy checklist V-01..V-14 trên 2 viewport (1440px desktop + 390px mobile)
4. Chạy VoiceOver session trên GW-01..03 (V-06, V-12)
5. Ghi kết quả + screenshot vào evidence namespace

---

## 6. Lộ trình pha — sửa đổi theo review

Pha 0–3 của improvement plan giữ nguyên cấu trúc. Sửa đổi:

- **Pha 0:** P-03 scope = đóng gói walkthrough env (D-1(b)), không phải frontend fixtures. P-02 effort = L.
- **Pha 1:** **Thêm P-09** (live-region shell). Lý do: SR testing trên Golden Workflow trong Pha 1 cần kênh announce tồn tại; đợi Pha 3 = SR testing Pha 1 incomplete.
- **Pha 2–3:** không đổi ngoài việc P-09 đã rời khỏi Pha 3.

---

## 7. Ghi chú bổ sung

### Điểm mạnh plan ghi nhận
- Kỷ luật phân loại bằng chứng (OBSERVED_RENDERED vs SOURCE_READ vs NOT_VERIFIED) — đây là practice tốt, nên giữ xuyên suốt project.
- Tuyên bố giới hạn (§9) trung thực — không overclaim.
- Backlog structure Pha 0–3 với cổng ra rõ ràng — mô hình phù hợp cho P0 product ở giai đoạn pre-trial.
- Design system audit đúng: token discipline mẫu mực (0 literal color, forced-colors/reduced-motion fallback) → nền tảng vững.

### Rủi ro chưa cover trong plan
- **OV-R13-01** (YAML parse fail migrate-job) — deploy-blocker, không nằm trong improvement plan nhưng ảnh hưởng deploy → cần track song song. Không thuộc phạm vi review này nhưng ghi nhận.
- **Batch #2 decisions (R1–R11)** chờ PO — D-3 terminology trong đó. Nếu PO chưa duyệt R10 thì P-06 sweep vi labels bị block. Mitigation: tách bước như amend ở mục 2.
