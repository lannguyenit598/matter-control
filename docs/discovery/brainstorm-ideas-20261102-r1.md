# Brainstorm Ideas — Existing Product, r1 (2026-11-02)

- **Task**: Brainstorm ý tưởng tính năng mới dựa trên nền đã implement (skill: `brainstorm-ideas-existing`)
- **Owner**: ZCode (discovery support cho PO) · **Status**: PROPOSAL — đây là tài liệu discovery, KHÔNG phải thiết kế duyệt, không mở lại positioning, không phải phê duyệt triển khai
- **Cơ sở**: PRODUCT.md + inventory thực tế của repo @ `codex/unified-project-flow` (dirty tree 2026-11-02: RLF-02 Work Context, RLF-03 My Agenda, RLF-04 Saved Views, RLF-05 Playbooks đang thực hiện dở)
- **Ràng buộc**: không đề xuất lại 20 P0 đã chốt; không đếm lại P1/P2 baseline; **loại trừ AI** (P2 AI features + AI workbench — PO quyết định 2026-10-29, later phase); mọi ý tưởng phải bám vào capability đã có trong code.

## Nền đã implement (tóm tắt grounding)

- **Domain**: workspace/matter/requirement/action, work graph (dependencies, waiting-on, milestones, workstreams, parties, escalation), documents immutable versions, evidence + criteria purpose-typed (PACKAGE/SIGNATURE/OUTCOME — migrations 0009/0011), filings staged lifecycle + cycles/submissions/observations, review grids, context records (Decision/Finding/Risk/Entity), receipts (idempotent replay), event history, import/export + delta Brief, metadata search ICU EN/VI (0012).
- **Mới landing (dirty tree)**: Saved Views riêng tư theo actor (0013), MeAgenda cross-matter theo ngày + keyset (GET /me/agenda), Work Context trên work item, Playbooks schema (0014, chưa wire API).
- **FE**: Control Room, Operational Grid, work-now ("why now" từ bảng label), agenda-view read-only theo ngày, ⌘K palette, focus search, vi/EN cookie locale.
- **Nguyên tắc ràng buộc thiết kế**: operational state over task counts · Completion ≠ Verified · traceable by default (as-of) · Requirement ≠ Action · keyboard-efficient density · WCAG 2.2 AA · vi/EN parity.

## 15 ý tưởng theo 3 góc nhìn

### Product Manager (giá trị kinh doanh, strategic alignment)

| # | Ý tưởng | Bám vào nền nào |
|---|---|---|
| PM-1 | **Filing Package Pre-flight** — 1 màn hình "Sẵn sàng nộp chưa?" per filing: liệt kê deterministically criterion PACKAGE đủ/thiếu, SIGNATURE chưa đạt, waiver hiện hữu, link thẳng tới việc còn thiếu | ProofChecklist (port/evidence.go), purpose-typing 0009/0011, guard Z-F-01/02 đã fix, staged filing lifecycle |
| PM-2 | **Escalation sweeps tự động** — cron sweep biến OVERDUE → Attention CRITICAL + escalate tự động theo policy, thay vì escalate tay | Timing/Attention axes, endpoint escalation, MeAgenda |
| PM-3 | **Status Brief snapshot chia sẻ được** — bản Brief delta xuất HTML/PDF standalone, footer provenance "Dữ liệu tại …" | Delta Brief (dataops), export, commitment provenance trong PRODUCT.md |
| PM-4 | **Playbook starter packs theo 3 golden workflows** — seed sẵn GW-01/GW-02/GW-03 thành playbook mẫu để workspace mới tạo matter trong vài phút | RLF-05 playbooks (in-flight), docs/product/three-golden-workflows.md |
| PM-5 | **Readiness rollup trên Control Room** — tổng hợp per filing/matter: "x/y criterion đã verified, filing nào đủ điều kiện nộp", deterministic, không AI | ControlRoom read model, verification axis, Completion ≠ Verified |

### Product Designer (UX, usability, delight)

| # | Ý tưởng | Bám vào nền nào |
|---|---|---|
| D-1 | **Blocker cause-chain** — chuỗi "A bị chặn bởi B (owner X) bị chặn bởi C" tương tác được từ work-now/Control Room | dependency edges, waiting-on, work-now label tables ("Bị chặn" phải kèm lý do — brand commitment) |
| D-2 | **Matter mẫu population từ bộ Atlas** — 1 nút seed matter demo hoàn chỉnh (dataset M1–M5) qua pipeline import sẵn có → evaluators thấy sản phẩm "sống" ngay | Atlas dataset (docs/product/project-atlas-dataset.md), import preview/commit + content-hash replay (0006), usability blocker "NO populated local path" (audit 2026-10-30) |
| D-3 | **Agenda hành động được** — reschedule due date inline từ agenda-view (PATCH + ETag CAS), kéo thả giữa các ngày | agenda-view read-only, work-items PATCH, ETag concurrency |
| D-4 | **Bulk undo bằng receipts** — chọn nhiều dòng Grid → bulk operation → undo toast dẫn bằng operation receipt | Operational Grid bulk edit, receipts idempotent replay (GET /operations/:key) |
| D-5 | **Timeline "history as story"** — event history render thành dòng thời gian: actor, delta, version lineage tài liệu | GET /matters/:id/events, immutable doc versions, commitment "Dữ liệu tại …" |

### Software Engineer (khả năng kỹ thuật, data leverage, scalability)

| # | Ý tưởng | Bám vào nền nào |
|---|---|---|
| E-1 | **As-of time-travel reads** — `?asOf=` trên read models (Control Room, work item): tái dựng state tại mốc thời gian từ event spine, deterministic | event history append-only, immutable versions, receipts, Principle 3 "traceable by default" |
| E-2 | **Durable scheduled jobs framework** — cron nền (Workers cron theo ADR-006 / job nội bộ) chạy sweeps: overdue, due-soon, agenda digest, retention | deploy-readiness (TTL, retention rehearsal), ADR-006 topology |
| E-3 | **Saved-view sharing + default view** — nâng view từ private → workspace-shared role-gated + default view per matter | RLF-04 saved views (hiện private by design — uniform 404) |
| E-4 | **Outbox/webhook event stream** — transactional outbox + HMAC-signed webhook retry cho integration sau này | closed no-array event schema, receipts, event append |
| E-5 | **Search nâng cấp cross-matter** — ranking trong ⌘K (recently viewed, overdue boost), filter query tương thích saved views | SearchService cursor sealing, 0012 ICU EN/VI, local focus search |

## Top 5 ưu tiên

### 1. Filing Package Pre-flight (PM-1)

- **Mô tả**: màn hình checklist deterministic per filing trước khi nộp — criterion nào PACKAGE đã đủ / thiếu, SIGNATURE chưa ký / đã waiver, outcome nào chưa có; mỗi dòng thiếu là 1 link hành động.
- **Vì sao chọn**: đúng lời hứa cốt lõi "Completion ≠ Verified" và golden workflow GW-03; nền đã có ~80% (ProofChecklist, purpose-typing, guards Z-F-01/02) → effort nhỏ, impact thẳng vào sai lầm đắt giá nhất của Transaction Owner (tuyên bố sẵn sàng khi chưa đủ bằng chứng). Task manager khác không có khái niệm proof-based readiness — differentiation thật.
- **Assumptions cần validate**: (a) ProofChecklist hiện đủ dữ liệu per filing (không chỉ per action); (b) guard submittable đã đọc đúng purpose (Z-F-01/02 fix cần OpenCode verify ×re-pin); (c) PO muốn pre-flight chỉ hiển thị hay chặn submit.
- **Sizing**: S–M (backend compositions + 1 FE screen).

### 2. Matter mẫu population từ bộ Atlas (D-2)

- **Mô tả**: nút "Tạo matter mẫu" trong workspace trống → seed 1 matter đầy đủ state (actions, evidence, filings, blockers) từ dataset Atlas qua import pipeline hiện có.
- **Vì sao chọn**: "NO populated local path" là 1 trong 3 blocker của UX audit 2026-10-30 và trực tiếp phục vụ trials (đang trong kế hoạch week 2–3); import + content-hash replay đã có → feasibility cao nhất trong danh sách; toàn synthetic nên sạch chính sách dữ liệu.
- **Assumptions cần validate**: (a) Atlas dataset đủ giàu để thể hiện cả 5 state dimensions; (b) import bundle format khớp SheetCodec hiện có; (c) seed vào workspace của caller (membership model giữ nguyên).
- **Sizing**: S (chủ yếu packaging dataset + 1 FE entry point).

### 3. Blocker cause-chain (D-1)

- **Mô tả**: từ work-now/Control Room, mở được chuỗi nguyên nhân blocked: "A ← B (owner X) ← C", mỗi nút click-through tới record, hiển thị waiting-on và deadline của từng khâu.
- **Vì sao chọn**: brand commitment "status luôn kèm cause" đã có ở work-now level 1; chain là nâng tự nhiên; Transaction Owner persona cần đúng điều này ("state, blockers, next actions"); thuần read-model của edges đã có — không phát minh semantics mới.
- **Assumptions cần validate**: (a) cycle handling trong dependency graph (cần policy hiển thị); (b) depth limit bao nhiêu là đủ cho grid density.
- **Sizing**: S–M (read model + UI composition).

### 4. Durable scheduled sweeps (E-2, gộp PM-2)

- **Mô tả**: framework job định kỳ chạy sweep: OVERDUE/DUE_SOON detection, Attention transition, escalation theo policy, agenda digest — "hệ thống chạy cả khi bạn ngủ".
- **Vì sao chọn**: Timing/Attention axes hiện là dữ liệu thụ động; deadline-driven là bản chất legal work; nền deploy-readiness (TTL, retention, rehearsal) + ADR-006 đã có sẵn chỗ neo; mở đường cho mọi digest/reminder sau này.
- **Assumptions cần validate / Decision point**: (a) **D-11 đề xuất**: ai sở hữu Timing transitions — sweep tự động ghi state, hay sweep chỉ gắn cờ + người ghi? **Khuyến nghị: sweep tự động transition Timing (deterministic từ due date), Attention vẫn do người; default-if-silent: chỉ Timing.** (b) hạ tầng cron phải qua PO phê duyệt infra ($0 target — Workers cron free tier, cần verify); (c) transition matrices đang undecided — sweep chỉ dùng transition đã được duyệt, không phát minh.
- **Sizing**: M (job framework + policy surface nhỏ).

### 5. As-of time-travel reads (E-1)

- **Mô tả**: tham số `?asOf=` trên read model trọng yếu (Control Room trước, work item sau) — tái dựng đúng state tại mốc thời gian từ event spine, cùng baseline + as-of ⇒ cùng kết quả.
- **Vì sao chọn**: Principle 3 "traceable by default" đã hứa as-of provenance; khác biệt hóa mạnh nhất trong list (không đối thủ task/legal nào làm deterministic time-travel); nền evidence spine (events append-only, immutable versions, receipts) đã đủ để làm; phục vụ Reviewer/Manager khi trả lời "hôm qua mình báo gì".
- **Assumptions cần validate**: (a) event schema đủ để replay state (closed no-array — cần kiểm chứng từng read model); (b) scope đầu chỉ 1 read model (Control Room) để chứng mẫu; (c) chi phí truy vấn trên fixture phải đo (0010 indexes).
- **Sizing**: M–L (bắt buộc chứng mẫu trước).

## Không chọn vào top 5 (vì sao)

- PM-3 Brief snapshot: đè lên P1 "Management-Ready Export" đã defer — nên gắn vào wave P1 thay vì ý tưởng mới.
- PM-5 Readiness rollup: bị PM-1 phủ lớn phần giá trị, làm sau khi pre-flight có thể đo được.
- D-3 Agenda inline reschedule: nhỏ, làm được ngay như polish của RLF-03 — không cần discovery.
- D-4 Bulk undo: undo semantics là thay đổi domain đáng kể (compensating operations) — cần thiết kế riêng.
- D-5 Timeline: đẹp nhưng trùng P1 "Historical Report Snapshots" đã defer.
- E-3 Saved-view sharing: mâu thuẫn với quyết định privacy-by-design vừa chốt của RLF-04 — cần PO đảo quyết định trước.
- E-4 Outbox/webhooks: infra mới không gắn outcome người dùng ngay — để sau khi có integration demand thật.

## Governance

- Tài liệu này là **discovery output**, không phải phê duyệt: không ý tưởng nào được thực hiện nếu chưa qua Codex intake → task assignment → independent review theo workflow hiện hành.
- Không mở lại positioning; không đề xuất AI (PO 2026-10-29).
- 2 decision points nêu trên (D-11 timing sweeps; pre-flight hiển thị hay chặn) là trade-off thật cần PO — kèm khuyến nghị và default-if-silent theo đúng quy ước PO.
