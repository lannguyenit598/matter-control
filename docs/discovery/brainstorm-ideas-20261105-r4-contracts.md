# Brainstorm r4 (2026-11-05) — Ý tưởng tính năng Hợp đồng, tham chiếu eigenweltlabs/legalwork

- **Task**: brainstorm ý tưởng liên quan đến hợp đồng (điền/review tự động, …) — skill `brainstorm-ideas-new`, tham chiếu https://github.com/eigenweltlabs/legalwork
- **Owner**: ZCode (discovery cho PO) · **Status**: PROPOSAL — không intake, không approval
- **Nguồn tham chiếu**: eigenweltlabs/legalwork — computer-use agent local-first cho law firm: contract review & redlining (tracked changes trong Word), **tabular review** (trích terms nhiều tài liệu → grid có nguồn trích dẫn), drafting (brief/memo/hợp đồng/engagement letter), BYOM (Bedrock/Azure/khác), sandbox "protected-execution", MCP/skills extensibility. **License MIT** — ý tưởng dùng tự do; nếu sau này tham chiếu code phải giữ attribution. PO đã phân loại trước: legalwork = idea-only reference.
- **⚠️ Ranh giới governance (quan trọng)**: các ý tưởng "review tự động / điền tự động" bằng model là **AI-adjacent** — quyết định PO 2026-10-29 đặt AI workbench ở **later phase**, ngoài P0. Doc này đề xuất theo cấu trúc 2 tầng: **(a) khung deterministic xây NGAY trên nền có sẵn** (không AI, đúng Principle 3) và **(b) slot AI lắp VÀO SAU** khi PO mở workbench phase. Mong muốn của PO trong session này được ghi nhận là yêu cầu brainstorm; việc đảo quyết định AI phase là của PO, không phải mặc định của doc.
- **Nguyên tắc bất di bất dịch**: output AI không bao giờ thành "truth" — chỉ là **draft/suggestion + human confirm** (assessment pattern có sẵn); mọi thao tác ghi qua receipts/ETag. Ràng buộc liền mạch r3.1 giữ nguyên: mỗi ý tưởng khai báo mount trên tính năng đã có.

## 1. Map legalwork → MatterControl (nền mount có sẵn, kiểm chứng @ main `28a205ee`)

| Khả năng legalwork | Tương đương / mount trong MatterControl | Trạng thái nền |
|---|---|---|
| Contract review & redlining | Document immutable versions + `GET .../versions/:versionId/content` + diff 2 version | Pipeline version có; **diff service chưa có** |
| Tabular review (terms → sourced grid) | Operational Grid (inline edit, bulk, keyboard) + import pipeline SheetCodec + content-hash replay (0006) | Grid + import có; schema term-sheet chưa có |
| Drafting | Context records (Decision/Finding/Risk/Entity) + action drafts + human assessment | Có |
| Computer-use agent | REST + receipts idempotent (`GET /operations/:key`) + ETag/412 + event spine | Rails có; API agent-operable chưa bọc (r2 E-3, defer) |
| BYOM local-first | Posture local (ZITADEL loopback, membership-only) + synthetic-data rule | Tương thích triết lý |
| Skills/MCP extensibility | (chưa có đối tương ứng) | — |

**Contract trong domain hiện tại**: hợp đồng = document (version lineage) + điều khoản/nghĩa vụ = Requirement + nghĩa vụ ký = criterion purpose SIGNATURE (purpose-typing 0009/0011 có sẵn!) + bên = Entity (context record) + Chấp thuận (term ratified) = approval flow trên work graph. Không cần thêm aggregate mới.

## 2. 15 ý tưởng (3 góc nhìn × 5)

### Product Manager

| # | Ý tưởng | Gen legalwork | Mount có sẵn | AI? |
|---|---|---|---|---|
| PM-1 | **Contract Term-Sheet Grid (điền tự động tầng 1)** — import spreadsheet/structured source → tự điền grid terms (bên, giá trị, ngày, nghĩa vụ) vào Grid; mỗi ô giữ nguồn (document version + hash) | Tabular review (bản deterministic) | Import + content-hash replay + Grid | Không |
| PM-2 | **Contract Playbook packs** — bộ mẫu clause-checklist per loại hợp đồng (NDA/MSA/thuê…) → tạo matter có sẵn conditions trong phút | Drafting templates | Playbooks 0014 (đã wired, cần recheck) + golden workflows | Không |
| PM-3 | **Hợp đồng deviation report** — diff version hợp đồng vs template/playbook baseline, highlight khác biệt thành Finding context records | Review & redlining (bản deterministic: diff text) | Doc versions + review grid + Finding | Diff không AI; phân loại ngữ nghĩa = AI later |
| PM-4 | **Renewal & notice-date sweeps** — key dates hợp đồng (gia hạn, báo trước) thành deadline sweep + Attention | (không trực tiếp) | Milestones + sweeps (r1#4, chưa làm — phụ thuộc) | Không |
| PM-5 | **AI obligation extraction → draft rows** (later phase) — model đọc hợp đồng → nháp Requirement/Action/criteria; người xác nhận từng dòng | Tabular review + drafting (bản AI thật) | Assessment + draft + receipts | **Có — later phase** |

### Product Designer

| # | Ý tưởng | Gen legalwork | Mount có sẵn | AI? |
|---|---|---|---|---|
| D-1 | **Redline view 2 pane** — so 2 version, highlight tracked-change style, comment = Finding | Review & redlining | `versions/:versionId/content` + doc lineage | Không |
| D-2 | **Term→Requirement promote** — 1 click từ dòng grid → nháp Requirement/Action (prefill từ ô), người confirm | Tabular review | Grid inline edit + intake | Không |
| D-3 | **Contract health card** — thẻ tổng hợp per hợp đồng: parties (Entity), key dates, trạng thái nghĩa vụ (axes), SIGNATURE readiness (preflight) | (tổng hợp) | ControlRoom patterns + preflight | Không |
| D-4 | **Party panel** — Entity context records + hợp đồng liên quan + trạng thái waiting-on bên kia | (không trực tiếp) | Context records Entity + waiting-on | Không |
| D-5 | **Approval flow "Chấp thuận" cho bản nháp hợp đồng** — vòng duyệt bản draft = action + assessment | (không trực tiếp) | Term Approval đã ratify + work graph | Không |

### Software Engineer

| # | Ý tưởng | Gen legalwork | Mount có sẵn | AI? |
|---|---|---|---|---|
| E-1 | **Contract metadata schema cho import** (parties/dates/value/governing law) — bundle + hash replay; đây là core "điền tự động" không AI | Tabular review | 0006 replay + SheetCodec | Không |
| E-2 | **Version diff service** — text diff deterministic giữa 2 document version (server tính, FE render) | Redlining nền | versionContent + immutable versions | Không |
| E-3 | **Agent-operable API (MCP wrapper)** — computer-use agent thao tác qua REST + receipts + ETag = safety rail; chuẩn bị từ giờ, kích hoạt khi PO mở | Computer-use agent | REST + receipts (r2 E-3) | **AI-adjacent — defer, chỉ giữ API sạch** |
| E-4 | **BYOM local workbench slot** — khi workbench phase mở: agent local BYO-key đọc documents, đề xuất, KHÔNG ghi trực tiếp — mọi ghi qua human confirm | BYOM + local-first | Posture local + membership + receipts | **Có — later phase** |
| E-5 | **Clause taxonomy + tagging rules** — từ điển clause type + rule tag deterministic (trả trước cho AI extraction sau này) | Tabular review | Requirements + criteria purpose | Không (nền cho AI) |

## 3. Top 5 (initial-discovery weighting + ràng buộc liền mạch r3.1)

### 1. Contract Term-Sheet Grid — "điền tự động" tầng deterministic (PM-1 + E-1 + D-2)

- **Mô tả**: schema metadata hợp đồng → import structured source → Grid tự điền, mỗi ô truy nguồn về document version (hash); 1 click promote ô → nháp Requirement/Action.
- **Vì sao**: đây chính là "điền tự động" mà **không cần AI** — deterministic, đúng Principle 3, mount 100% nền có sẵn (import + Grid + promote flow); và là **khung mà PM-5 (AI extraction) lắp vào sau** — xây rails trước, AI thay mặt "nguồn dữ liệu" sau.
- **Assumptions**: (a) schema metadata nào là tối thiểu v1 (đề xuất: parties, effective/renewal dates, value, governing law, notice period); (b) nguồn ô = document version id + hash đủ cho audit; (c) promote flow cần prefill mapping rõ.
- **Sizing**: M (import schema + grid section + promote endpoint).

### 2. Version diff / redline view (PM-3 + D-1 + E-2)

- **Mô tả**: chọn 2 version hợp đồng → diff text deterministic → highlight; lưu khác biệt quan trọng thành Finding.
- **Vì sao**: reviewer persona cần nhất; "review tự động" tầng 1 = diff máy + người đánh giá; nền versions immutable đã có; là khung cho AI redline suggestion sau này (AI chỉ *đề xuất* trên diff, người chấp thuận).
- **Assumptions**: (a) diff thuật toán nào (line-based v1); (b) content format hỗ trợ (docx/HTML/text — giới hạn v1: text-based); (c) Finding từ diff có mapping quy tắc không.
- **Sizing**: S–M.

### 3. Contract Playbook packs (PM-2)

- **Mô tả**: seed hợp đồng mẫu per loại từ playbook — matter có conditions/criteria SIGNATURE sẵn trong vài phút.
- **Vì sao**: nền Playbooks 0014 đã wired; feeding trực tiếp GW-01/03; onboarding "matter thật đầu tiên" nhanh.
- **Assumptions**: (a) trạng thái Playbooks cần recheck trước (vừa wired, chưa qua review đầy đủ?); (b) nội dung checklist do ai soạn (PO/chuyên gia — như bài học PM-3 r2: "kiến thức chưa có thì engine trống").
- **Sizing**: S–M (chủ yếu content + entry point).

### 4. Contract health card (D-3)

- **Mô tả**: thẻ per hợp đồng tổng hợp parties/dates/axes/SIGNATURE readiness — composition thuần các read model có.
- **Vì sao**: seamless tuyệt đối (r3.1 style), tăng giá trị Control Room cho vertical hợp đồng; dùng preflight SIGNATURE đã có.
- **Assumptions**: hợp đồng được mô hình hóa như matter con hay document trên cùng matter — **cần 1 quyết định mô hình hóa trước khi thiết kế** (đề xuất: hợp đồng = document + requirement set trên cùng matter, không tạo aggregate mới).
- **Sizing**: S.

### 5. AI obligation extraction (PM-5 + E-4) — **LATER PHASE, cần PO mở workbench**

- **Mô tả**: model đọc hợp đồng → nháp requirement/action/criteria rows; người xác nhận từng dòng (assessment pattern); mọi ghi qua receipts.
- **Vì sao để cuối**: giá trị lớn nhất nhưng dính quyết định AI phase 2026-10-29; rails đã chuẩn bị sẵn từ ý tưởng 1–2 nên khi mở phase là mount ngay.
- **Assumptions**: (a) PO đảo/sửa quyết định AI phase; (b) BYOM/local-first như legalwork để giữ data residency; (c) đâu là biên "đề xuất vs ghi" (chỉ nháp, không auto-commit).

## 4. Không top 5 (vì sao)

- E-3 MCP/API: giữ nguyên khuyến nghị r2 — defer, chỉ chuẩn bị API surface.
- PM-4 sweeps: đúng nhưng phụ thuộc r1#4 (sweeps framework) chưa có — không phải ý tưởng hợp đồng riêng.
- D-4/D-5: polish có giá trị nhưng nhỏ, gắn vào wave polish khi có dư địa.
- E-5 taxonomy: làm kèm ý tưởng 1, không standalone.

## Governance

- PROPOSAL discovery — không ý tưởng nào triển khai nếu chưa Codex intake → task assignment → independent review.
- Không mở lại positioning; **AI vẫn later-phase theo PO 2026-10-29** — ý tưởng 5 và mọi biến thể AI chờ PO quyết định phase.
- Tham chiếu legalwork là idea-only (MIT — attribution nếu dùng code sau này).
- Vi labels mới ("hợp đồng", "term sheet"…) phải qua bảng terminology (R10) — "Tờ trình" đã có nghĩa riêng (loại Filing), tránh tái diễn va chạm S4 của r3.
- Nền audit bám main `28a205ee`; bài học r3.1 (chỉ mount cái có thật) áp dụng cho toàn bộ.
