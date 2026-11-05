# Design — Closing Readiness Certificate v1 & Contract Term-Sheet Grid v1 (2026-11-05)

- **Task**: design 2 tính năng được PO chọn từ brainstorm r3/r3.1/r4 (skill `brainstorming`, quy trình full: đánh giá → chọn 2 → Understanding Lock → approaches → design → duyệt)
- **Owner**: ZCode (discovery + design cho PO) · **Status**: DESIGN_APPROVED_IN_DIALOG (PO duyệt Lock + approach + design trong session 2026-11-05) — chưa phải approval triển khai theo workflow (cần task record + independent review)
- **Nền audit**: main `28a205ee` · Docs nguồn: `docs/discovery/brainstorm-ideas-20261105-r3.md`, `-r3.1-recheck.md`, `-r4-contracts.md`

---

## Phần 1 — Closing Readiness Certificate v1

### 1.1 Understanding summary
- Artifact đọc-only per matter: composition của ControlRoom (figures + Gaps + Blockers) + Brief `(t1,t2]` + PreflightOf per filing mở; phát hành 1 cú click có confirm; lưu = document version HTML qua pipeline upload hiện có.
- Tồn tại để: mang "sẵn sàng chốt chưa" ra ngoài app — chống failure-to-avoid số 1 của Transaction Owner (tuyên bố sẵn sàng khi chưa đủ bằng chứng).
- Người dùng: Transaction Owner phát hành; Reviewer/Manager/khách đọc.
- Ràng buộc: 100% nền có sẵn (r3.1 seams S1–S4 đã sửa); deterministic "what you see is what you sign"; disclaimer pháp lý trên artifact; WCAG 2.2 AA; vi/EN parity.
- Non-goals: server-side PDF (v2), chữ ký số, attest tuân thủ pháp luật, as-of quá khứ, thêm event type mới.

### 1.2 Design (Approach A — BE snapshot, đã duyệt)
**Backend — 0 migration:**
- `ReadinessCertificate(ctx, matterID)` trong `DataOpsService` (cùng họ read model với Brief), tái dùng snapshot read boundary của Brief → 1 snapshot nhất quán (AsOf + Revision).
- Envelope: `AsOf, Revision, Figures (ControlState), Gaps[], Blockers[], BriefOutstanding[], Filings[] (PreflightOf mỗi filing mở), TemplateVersion`.
- Route `GET /matters/:id/readiness-certificate`; authz membership đọc chuẩn. Thuần composition, không mutation.

**Frontend:**
- `features/readiness/certificate-view.tsx`: render deterministic từ envelope; inline CSS + print stylesheet; footer bắt buộc `Dữ liệu tại {AsOf} · Template {version} · Tài liệu vận hành — không phải ý kiến pháp lý`.
- Entry: nút trên Control Room + link từ PreflightPanel.
- Phát hành: dialog confirm → `POST /matters/:id/documents` (tạo doc) → `POST .../versions` upload HTML (client-streamed, mediaType `text/html`) → link tới tab Documents. Quyền: theo permission matrix hiện hành (EDITOR tạo được document).

### 1.3 Edge cases
Matter không filing mở → section "Không có hồ sơ khai mở"; upload version fail sau tạo doc → retry cùng docId; state đổi giữa render/upload → artifact vẫn đúng AsOf của nó (bytes pin).

### 1.4 Testing
Contract fixture `contract_readiness.go` (pattern `contract_preflight.go`); service test deterministic trên event fixture; perf test composition (pattern preflight perf); FE vitest + storybook + a11y P0; vi/EN parity.

### 1.5 Điều kiện tiên quyết
**Preflight independent review PASS** trước khi Certificate mount (preflight hiện AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW).

---

## Phần 2 — Contract Term-Sheet Grid v1

### 2.1 Understanding summary
- Schema metadata hợp đồng (parties, effective/renewal, value, governing law, notice) → import xlsx → Grid tự điền, ô truy nguồn (document version + hash) → promote 1-click thành nháp Requirement/Action/Milestone/Entity.
- Tồn tại để: "điền tự động" tầng deterministic (không AI) — và là rails mà AI extraction (later phase) thay vào đúng chỗ.
- Người dùng: Contributor nhập bulk, Reviewer kiểm nguồn, Transaction Owner promote.
- Mô hình hóa (PO chốt): hợp đồng = document + requirement set trên **cùng matter**; term = **fact**, obligation = Requirement — tách bạch (Principle 4).
- Non-goals: AI extraction, clause taxonomy, diff/redline, aggregate mới.

### 2.2 Design (Approach A — TermLine riêng, đã duyệt)
**Migration `0015_contract_term_lines.sql`** (Down data-safe — bài học OV-F1-03):
- Long-format, enum đóng (Principle 4 — không JSON blob): `id, matter_id, document_version_id, field (PARTY | EFFECTIVE_DATE | RENEWAL_DATE | NOTICE_PERIOD | VALUE_AMOUNT | VALUE_CURRENCY | GOVERNING_LAW | NOTE), value_text, value_date, value_numeric, source_hash, promoted_ref, revision, audit columns`.

**Import**: bundle type mới `contract-term-sheet` trong registry hiện có; re-import cùng hash = no-op (pattern 0006); hash khác theo cùng document version → replace rows của version đó (idempotent v1). *(Implementation pre-step: verify shape của import registry trước khi code.)*

**API**: `GET /matters/:id/term-lines`; `POST /matters/:id/term-lines/:id/promotion` — mapping cố định per field: PARTY → Entity context record; EFFECTIVE_DATE/RENEWAL_DATE → Milestone; NOTICE_PERIOD → Action nháp; VALUE_*/GOVERNING_LAW/NOTE → Requirement nháp. Kết quả ghi `promoted_ref`; promote lần 2 = link existing, không trùng.

**FE**: view "Term Sheet" trong matter nav, pattern Operational Grid (inline, bulk, keyboard); chip nguồn (version + hash) mỗi dòng; promote = dialog prefill + confirm. 0 AI.

### 2.3 Edge cases
Import file đổi hash → replace + report; promote khi target đã xóa → lỗi rõ ràng; field ngoài enum → dòng lỗi import, không nuốt tĩnh lặng.

### 2.4 Testing
Migration up/down; replay idempotency; promotion guard tests; contract fixture; FE vitest + storybook. Vi labels "Bảng điều khoản"/"Hợp đồng" qua R10 (tạm EN key).

---

## Phần 3 — NFR (default đã được PO xác nhận trong Lock)

Hiệu năng: certificate render < 1s/matter (preflight 682µs/100 criteria); import ≤ 5MiB ceiling hiện hành. Bảo mật: mọi read/write qua membership authz; certificate không phơi gì ngoài quyền. Availability: local-first hiện trạng. Bảo trì: template certificate + enum field versioned trong repo.

## Phần 4 — Decision Log

| # | Quyết định | Phương án đã cân nhắc | Lý do chọn |
|---|---|---|---|
| 1 | Chọn cặp: Certificate + Term-Sheet Grid | Drive-to-Close; Grid+diff | 2 track bổ khuyết (proof/closure + vertical HĐ), cùng M, cùng rails cho AI sau |
| 2 | Hợp đồng = document + requirement set trên cùng matter | Matter riêng per HĐ | Không aggregate mới; quan hệ matter↔matter là seam mới |
| 3 | Phát hành theo permission matrix hiện có | Chỉ OWNER | Không thêm role; tạo document = quyền tự nhiên |
| 4 | Pilot import = xlsx tự soạn | Dataset Atlas | PO kiểm soát nội dung synthetic, dễ demo |
| 5 | Understanding Lock confirmed | — | PO xác nhận 2026-11-05 |
| 6 | Certificate = Approach A (BE snapshot endpoint) | B FE-compose (skew), C server-storage (seam mới) | Point-in-time statement phải 1 snapshot; test được |
| 7 | Term-Sheet = Approach A (TermLine riêng) | B metadata JSON (vi phạm Principle 4), C context record (bẻ cong semantics) | Fact ≠ obligation; enum đóng tường minh |
| 8 | Lưu artifact = document version pipeline (S3) | Hash-only (không tái tạo được) | Immutability + lineage + Documents tab miễn phí |
| 9 | vi label "Kiểm soát sẵn sàng"/"Bảng điều khoản" qua R10 | "Tờ trình…" (va term đã ratify — S4) | Tránh va chạm terminology |

## Phần 5 — Rủi ro & điều kiện mở

- **Preflight review** chưa PASS — gate thật của Certificate.
- **Import registry shape** cần verify tại bước code (design giả định pattern 0006).
- **R10 terminology** pending — vi label tạm EN key, không block EN.
- AI workbench phase: Term-Sheet là rails; extraction chỉ mount khi PO mở phase (quyết định 2026-10-29 còn hiệu lực).
- Triển khai phải qua workflow hiện hành: task record → assignment → independent review → DONE kèm evidence.
