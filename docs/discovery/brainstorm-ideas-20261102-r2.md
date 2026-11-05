# Brainstorm Ideas — Newer Generation (r2), 2026-11-02

- **Task**: tiến hóa 15 ý tưởng r1 thành ý tưởng "mới hơn" (skill: `brainstorm-ideas-new`, áp cho sản phẩm đang sống — initial-discovery weighting: core value · speed to validate · differentiation)
- **Seed**: `docs/discovery/brainstorm-ideas-20261102-r1.md` (15 ý tưởng, top 5: Pre-flight filing, Atlas sample matter, Blocker cause-chain, Scheduled sweeps, As-of reads)
- **Owner**: ZCode (discovery cho PO) · **Status**: PROPOSAL — không phải approval, không mở positioning, không đụng P1/P2 baseline; AI giữ nguyên P2/later-phase (PO 2026-10-29)
- **Ràng buộc thêm**: mọi ý tưởng r2 phải khai báo gen cha r1; deterministic tuyệt đối (template/rule, không AI-inferred truth — Principle 3).

## Bản đồ gen: seed r1 → tiến hóa r2

| Gen r1 | Tiến hóa r2 |
|---|---|
| Pre-flight filing + As-of reads + Brief snapshot | **PM-1 Closing Readiness Certificate** |
| MeAgenda + Sweeps + Control Room | **PM-2 Portfolio Control Room** |
| Sweeps + playbook starters | PM-3 Deadline SLA policy presets |
| Delta Brief + digests | PM-4 Weekly narrative brief (template) |
| Playbooks RLF-05 + content-hash replay | PM-5 Playbook export/exchange packs |
| Cause-chain + Pre-flight + Next Action/Waiting On | **D-1 Drive-to-Close guided mode** |
| As-of reads | D-2 Time-machine scrubber UI |
| Work-context + Pre-flight | D-3 Proof-at-a-glance chips |
| Dependency graph + milestones | **D-4 What-if cascade preview** |
| Atlas seed + golden workflows | D-5 Onboarding "first closing in 15 phút" |
| As-of + Sweeps | E-1 Event-sourced projection layer |
| Guards Z-F + transitions | **E-2 Explainable rules engine (policy-as-code)** |
| REST + receipts | E-3 MCP/agent-operable API (⚠️ AI-adjacent — PO decision) |
| Import registry | E-4 Email/attachment capture connector |
| Durable sessions + receipts + ETag | E-5 Offline-first resilience (quá nặng, defer) |

## 15 ý tưởng r2 theo 3 góc nhìn

### Product Manager

| # | Ý tưởng | Gen r1 | Ghi chú |
|---|---|---|---|
| PM-1 | **Closing Readiness Certificate** — tài liệu deterministic, đóng dấu as-of + provenance: "matter này sẵn sàng chốt vì x/y criterion verified, filing nào đủ điều kiện, gap nào còn" — artifact xuất được cho khách/sếp | Pre-flight + As-of + Brief | Category-defining: không task tool nào phát "chứng nhận sẵn sàng" dựa trên proof |
| PM-2 | **Portfolio Control Room** — mặt sàn cross-matter: mọi matter xếp hạng theo "cần tôi hôm nay" từ 5 state axes; mới chỉ có MeAgenda (ngày) và discovery list | MeAgenda + Sweeps + Control Room | Nâng "System of Operational Truth" từ matter → practice |
| PM-3 | **Deadline SLA presets** — policy versioned per loại filing (lead time, grace, escalation matrix) → deadline tính được, không phải gõ tay | Sweeps + playbook starters | Moat: kiến thức legal-ops mã hóa deterministic |
| PM-4 | **Weekly narrative brief (template)** — tường thuật tuần tự xuất từ Delta Brief + cause-chains bằng template cố định, không AI | Delta Brief + digests | Persona Reviewer/Manager "communicate progress" |
| PM-5 | **Playbook export/exchange packs** — playbook revision export/import giữa workspaces (content-hash replay sẵn có) | Playbooks RLF-05 | Cần quyết định sharing — tương tự tension saved-view sharing |

### Product Designer

| # | Ý tưởng | Gen r1 | Ghi chú |
|---|---|---|---|
| D-1 | **Drive-to-Close mode** — chế độ dẫn dắt: hệ thống đưa THE một việc tiếp theo per matter (next action + missing proof + waiting-on) thành flow tuần tự, zero-scan | Cause-chain + Pre-flight + Next Action | "Understand the work faster" ở giới hạn; daily driver cho Transaction Owner |
| D-2 | **Time-machine scrubber** — thanh trượt thời gian trên Control Room, kéo về quá khứ + highlight diff-vs-now | As-of reads | Demo-worthy, cần as-of engine trước |
| D-3 | **Proof-at-a-glance chips** — mỗi dòng work item mang chip trạng thái proof: `PACKAGE 2/3 · SIGNATURE ✓ · OUTCOME …` | Work-context + Pre-flight | S, density-first, keyboard-friendly |
| D-4 | **What-if cascade preview** — "nếu A trượt 3 ngày thì sao": deterministic duyệt lại dependency graph → lộ cascade OVERDUE dự kiến, chưa ghi gì | Dependency graph + milestones | Planner không có cái này; hybrid D+E |
| D-5 | **Onboarding "first closing in 15 phút"** — seed Atlas → tour theo golden workflow → matter thật đầu từ playbook | Atlas seed + golden workflows | Chủ yếu content + vài entry point |

### Software Engineer

| # | Ý tưởng | Gen r1 | Ghi chú |
|---|---|---|---|
| E-1 | **Event-sourced projection layer** — materialized read-model per matter cập nhật từ event subscription → Control Room/agenda/portfolio tức thời, as-of rẻ | As-of + Sweeps | Enabler: làm 3 ý tưởng kia rẻ đi; S–M nếu chỉ projections tối thiểu |
| E-2 | **Explainable rules engine** — tách guards (submittable, signature gate, purpose, transitions) thành rule declarative versioned, output giải thích máy đọc được: "bị chặn vì rule R3@rev2" | Guards Z-F + transition matrices | Kéo dài brand commitment "status kèm cause" xuống mức machine-verified |
| E-3 | **MCP/agent-operable API** — bọc REST hiện có thành MCP server; receipts là safety rail (idempotency + audit) cho agent thao tác matter | REST + receipts | ⚠️ AI-adjacent: hạ tầng được, AI vẫn P2; cần PO quyết định có chuẩn bị từ giờ không. Khuyến nghị: defer, chỉ giữ API surface sạch |
| E-4 | **Email/attachment capture** — forward email → document version + nháp action (người xác nhận, không AI extraction) | Import registry | Nhạt hơn P2 "AI Document Extraction" — chỉ làm khi có demand thật |
| E-5 | **Offline-first resilience** | Durable sessions + receipts | L, desktop-first chưa chứng minh cần — defer |

## Top 5 r2

### 1. Closing Readiness Certificate (PM-1)

- **Mô tả**: một artifact xuất được (PDF/HTML), deterministic và đóng dấu: baseline scope + as-of timestamp + số liệu 5 axes + per-filing readiness + danh sách gap + provenance footer "Dữ liệu tại …". Là bằng chứng, không phải lời khẳng định.
- **Vì sao chọn**: trực tiếp hóa câu thất bại cần tránh số 1 của Transaction Owner ("tuyên bố sẵn sàng vì task có vẻ xong"); gộp 3 gen r1 thành 1 thứ khách hàng sẵn sàng trả tiền; differentiation ★★★ — không đối thủ phát "chứng nhận readiness dựa trên proof".
- **Assumptions cần test**: (a) v1 chỉ cần read models hiện có + timestamp hiện tại (as-of đầy đủ đến sau); (b) khách hàng tin số liệu trong app đủ để xuất ra ngoài; (c) định dạng nào (PDF vs link read-only) — **D-12: khuyến nghị PDF-before-link, default-if-silent: PDF tĩnh**.
- **Validate nhanh nhất**: render certificate từ Atlas sample matter (cần r1 #2), cho 2–3 lawyer xem — đo反应, chưa cần backend mới.
- **Sizing / phụ thuộc**: M · phụ thuộc r1#1 (pre-flight data), r1#2 (validate), r1#5 (as-of sau).

### 2. Portfolio Control Room (PM-2)

- **Mô tả**: trang mới `/portfolio`: mọi matter của các workspace mình là thành viên, xếp hạng deterministic "cần tôi hôm nay" — CRITICAL trước, rồi OVERDUE count, rồi BLOCKED count; mỗi dòng là cause-chain thu gọn.
- **Vì sao chọn**: giá trị cốt lõi của "System of Operational Truth" chỉ trọn vẹn ở tầm practice; manager là người chọn mua tool; MeAgenda đã mở đường cross-matter (authz per-page + keyset đã giải).
- **Assumptions cần test**: (a) **D-13: chính sách xếp hạng** — khuyến nghị composite cố định từ 5 axes (không ML, không weight cấu hình được ở v1); default-if-silent: fixed ordering; (b) authz portfolio: hợp membership các workspace, không rò matter không có quyền; (c) hiệu năng N matters — đo trên fixture.
- **Validate nhanh nhất**: static prototype từ dữ liệu fixture 5–10 matter, kiểm với persona manager trong 1 buổi usability (scripts A–F sẵn).
- **Sizing / phụ thuộc**: M · phụ thuộc r1#4 (sweeps để Attention số liệu sống).

### 3. What-if cascade preview (D-4)

- **Mô tả**: trong planning view, kéo due date hoặc giả lập một action trượt → recompute deterministic timeline phụ thuộc → overlay cascade dự kiến (mà không ghi DB), kèm "m milestone/filing sẽ trượt".
- **Vì sao chọn**: biến dependency graph từ mô tả thành công cụ quyết định; differentiation ★★★ (planner chung không có cascade deterministic); demo 30 giây là hiểu.
- **Assumptions cần test**: (a) graph nhỏ đủ dùng (per matter, không cross-matter) ở v1; (b) semantics giả lập không ghi — read-only branch trong service; (c) transition matrices undecided → cascade chỉ đổi Timing hiển thị, không ghi Attention.
- **Validate nhanh nhất**: prototype trên fixture dependency graph, cho Transaction Owner thử "kéo trượt" — đo có ra quyết định khác không.
- **Sizing / phụ thuộc**: M · độc lập tương đối, nền graph + milestones đã có.

### 4. Drive-to-Close guided mode (D-1)

- **Mô tả**: một nút "Đưa tôi tới việc tiếp theo": flow tuần tự một việc-một-lúc — next action khả dụng, hoặc proof còn thiếu, hoặc đang chờ ai (cause-chain) — kết thúc khi hết việc khả dụng → hiện readiness summary.
- **Vì sao chọn**: "hiểu nhanh hơn" ở giới hạn — zero-scan; dùng đúng các P0 đã có (Next Action, Waiting On, Missing Evidence); speed-to-validate cao nhất trong top 5 vì chỉ là composition UI.
- **Assumptions cần test**: (a) "một việc tiếp theo" xác định thế nào khi nhiều việc song song — **D-14: khuyến nghị thứ tự cố định (BLOCKED loại, rồi OVERDUE, rồi earliest due), không personalization v1**; default-if-silent: fixed ordering; (b) có gây "tunnel vision" bỏ sót việc khác không — test usability.
- **Validate nhanh nhất**: Wizard-of-Oz trên 1 matter Atlas với 3 người dùng — trước khi viết service nào.
- **Sizing / phụ thuộc**: S–M · phụ thuộc r1#3 (cause-chain) cho bước "đang chờ ai".

### 5. Explainable rules engine (E-2)

- **Mô tả**: guards rải rác (filing submittable, signature gate, purpose typing, dependency blocker logic) tách thành rule table declarative, versioned; mọi status bị chặn kèm rule id + rev + dữ liệu đầu vào → cause-chain machine-verified, UI và Certificate đều trích dùng được.
- **Vì sao chọn**: nền tảng niềm tin — "Bị chặn vì R3@rev2, vì criterion X chưa verified" là điều competitor không làm được khi guard chôn trong if-else; chuẩn bị sẵn cho transition matrices khi Step 02 duyệt; Engineer perspective "data leverage" thuần túy.
- **Assumptions cần test**: (a) extract từng phần nhỏ (bắt đầu 3 guards đã fix Z-F) không break contract tests hiện có; (b) explain output không rò dữ liệu nhạy cảm trong log; (c) versioning rule cần replay giống event schema.
- **Validate nhanh nhất**: tách 1 guard (signature gate) thành rule + explain string, chạy lại contract tests xanh — bằng chứng kiến trúc khả thi trong 1–2 ngày.
- **Sizing / phụ thuộc**: M–L · phụ thuộc transition matrices được duyệt để mở rộng.

## Không top 5 (vì sao)

- E-1 Projections: enabler thật nhưng không standalone-validate được — ghi làm phụ thuộc tăng tốc của #1/#2, làm khi portfolio/as-of ép hiệu năng.
- D-2 Time-machine: chờ as-of engine (r1#5); UI đẹp nhưng không có thì chưa demo được gì.
- PM-3 SLA presets: cần nội dung pháp lý do PO/chuyên gia cung cấp — kiến thức chưa có thì engine trống.
- E-3 MCP/API agents: chiến lược hấp dẫn nhất về platform nhưng dính AI-adjacency — cần PO quyết trước; receipts đã làm nó an toàn khi đến lúc.
- PM-5 Exchange: cùng rào sharing-by-design như r1; E-4/E-5/D-5: defer theo ghi chú bảng.

## Governance

- PROPOSAL discovery — không ý tưởng nào triển khai nếu chưa Codex intake → task assignment → independent review.
- Phụ thuộc chéo r1→r2: r2 không thay thế r1, nó mount lên; nếu PO duyệt, thứ tự khuyến nghị: r1#2 (Atlas seed, S) → r1#1 (pre-flight) → r2#1 (Certificate v1) song song r2#4 (drive-to-close, S–M).
- 3 decision points mới: D-12 (certificate format), D-13 (portfolio ranking), D-14 (next-task ordering) — mỗi điểm đã có khuyến nghị + default-if-silent.
