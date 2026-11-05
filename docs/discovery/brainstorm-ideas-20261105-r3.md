# Brainstorm Ideas — r3 (2026-11-05): BA recap + 1 tính năng đề xuất

- **Task**: đóng vai BA — tổng kết lại các tính năng hiện có của MatterControl, rồi đề xuất **1** tính năng mới (skill `brainstorm-ideas-new`, áp cho sản phẩm đang sống; weighting initial-discovery: core value · speed to validate · differentiation)
- **Owner**: ZCode (discovery support cho PO) · **Status**: PROPOSAL — không phải thiết kế duyệt, không phải approval triển khai
- **Provenance**: r1/r2 (`brainstorm-ideas-20261102-r1/r2.md`) đã bị xóa khỏi tree trong commit dọn docs `28a205ee`, khôi phục từ git history `c7ee772c` — nội dung gen cha giữ nguyên hiệu lực tham chiếu
- **Ràng buộc**: positioning đóng (Control Plane for High-Stakes Legal Work; vertical Transactions & Corporate) · không AI (PO 2026-10-29) · không mở lại P0/P1/P2 baseline · deterministic tuyệt đối (Principle 3 — không AI-inferred truth) · WCAG 2.2 AA + vi/EN parity · synthetic data only

---

## Phần A — Tổng kết hiện trạng (BA recap, grounding từ tree @ main `28a205ee`)

### A.1 Đã có trong sản phẩm

| # | Lĩnh vực | Nội dung đã implement | Trạng thái |
|---|---|---|---|
| 1 | Identity & Access | ZITADEL OIDC (issuer loopback pinned, machine-only verifier), server-side session store + opaque cookie (TTL 30s), membership-only data access (CreateWorkspace → initial OWNER), membership row-revision CAS, audit ctx INET/request_id | Hoạt động local; posture D-10 (disable self-registration vs CF Access) chờ PO |
| 2 | Matter spine | Workspace / Matter ("Hồ sơ") / Requirement / Action; work graph: dependencies, waiting-on, milestones, workstreams, parties, escalation; 5 state axes (value sets approved) |-transition matrices undecided (Step 01/02) — không được phát minh trong design |
| 3 | Evidence & Verification | Evidence Requirement ≠ Evidence; criteria purpose-typed PACKAGE/SIGNATURE/OUTCOME (migrations 0009/0011); review grids; assessments + dispositions; classifier F-08 (S0/S1/S2) | Z-F-01/02/03 đã fix (fix-wave F1) |
| 4 | Filings | Staged lifecycle; cycles/submissions/observations; D-9 purpose-typing guards — 1 refusal nêu đồng thời gap package + signature; ETag/412 optimistic concurrency; impactToken | Contract tests + verify wave leg 2 (23 cases) recorded |
| 5 | **Pre-flight filing** | `ProofGapsOf` shared predicate + `PreflightOf` + `GET /filings/:id/preflight` + `PreflightPanel` (FE) — "Sẵn sàng nộp chưa?" deterministic per filing | **Đã landing trong tree** (bench 682µs/100 criteria); **chưa qua independent review** (AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW) |
| 6 | Traceability | Event history append-only; immutable document versions; operation receipts (idempotent replay); Delta Status Brief (deterministic); matter history view | Principle 3 nền tảng; as-of *engine* chưa làm |
| 7 | Cross-matter & personal | MeAgenda cross-matter theo ngày + keyset (GET /me/agenda); My Actions; My Reviews; Saved Views riêng tư (0013); Work Context trên work item | RLF-02/03/04 landing |
| 8 | Playbooks | Schema 0014 + handlers/store + contract fixtures | RLF-05 wired; chi tiết trạng thái cần recheck trước khi xây thêm |
| 9 | Data ops | Import/export pipeline + content-hash replay (0006); metadata search ICU EN/VI (0012); Atlas dataset (docs/product/project-atlas-dataset.md) | Chưa có nút seed matter mẫu |
| 10 | UX platform | Solid Glass design system; ⌘K palette; focus search; vi/EN cookie locale (D-2); provenance timestamps "Dữ liệu tại …"; terminology-final (R10 chờ PO duyệt) | WCAG 2.2 AA là target ràng buộc P0 |
| 11 | Deploy/ops readiness | Portable CF Workers/App Hosting profiles; B1 least-privilege grants SQL; retention prune + rehearsal; migrate job; walkthrough scripts (up/mint-token/down); Supavisor pooler | Pilot candidate RELEASE_SHA 0404419 đã merge vào main; **local-only** |

### A.2 Đang hở (BA gap list)

- **Verification debt**: pre-flight chưa qua independent review; W1–W8 deploy verification NOT_RUN; browser/IdP/recovery final verification còn mở.
- **Compliance vn-law** (track riêng): 4 gate đỏ — policy/DSAR, consent, hồ sơ DLXB (stack offshore SG/CF/Supabase), log retention vs NĐ 333; gói A1+A2 (gate 01.A) đang chờ PO.
- **Capability gaps**: chưa có sweeps định kỳ (Timing/Attention thụ động), chưa có as-of reads, chưa có cause-chain UI, chưa có seed matter mẫu, portfolio cross-matter chỉ có MeAgenda.
- **Deferred**: P1/P2 theo baseline (AI workbench là later phase).

### A.3 Hàm ý BA

Sản phẩm đã trả lời được "**việc gì đang thế nào**" (5 axes, Control Room, Grid, Brief) và "**filing đủ điều kiện nộp chưa**" (pre-flight) — nhưng **chưa có artifact nào mang được câu trả lời đó ra ngoài hệ thống**. Transaction Owner hiện phải chụp màn hình / kể lại; "tuyên bố sẵn sàng vì task có vẻ xong" — thất bại số 1 của persona — vẫn chỉ được ngăn *trong app*, không chứng minh được *ra bên ngoài*.

---

## Phần B — Đề xuất 1 tính năng: **Closing Readiness Certificate** ("Tờ trình Sẵn sàng Chốt")

### B.1 Gen

| Gen cha | Trạng thái gen |
|---|---|
| r1#1 Pre-flight filing | **Đã ship** — dữ liệu readiness per filing sẵn sàng |
| Delta Status Brief | Đã có — số liệu deterministic + provenance |
| r1#5 As-of reads | v1 **không cần** — dùng timestamp hiện tại + provenance footer |

→ khác r2 (khi Certificate phụ thuộc 2 ý tưởng chưa làm), giờ **2/3 gen đã có thật trong tree** — rủi ro thấp nhất trong top 5 r2, và là bước kế tiếp tự nhiên của pre-flight vừa landing.

### B.2 Mô tả

Một artifact **xuất được** từ matter, deterministic, đóng dấu provenance:

- Baseline scope + as-of timestamp + issuer (actor phát hành) + content hash
- Số liệu 5 state axes của matter; per-filing readiness (mount trực tiếp dữ liệu pre-flight: criterion PACKAGE đủ/thiếu, SIGNATURE chưa đạt, waiver); danh sách gap còn lại; waiting-on/blockers chính
- Footer provenance bắt buộc "Dữ liệu tại …" (brand commitment đã có)
- Phát hành ghi thành **event + operation receipt** (traceable by default; tái phát hành là hành động truy vết được, không ghi đè)

Ranh giới bắt buộc: đây là **tờ trình trạng thái vận hành**, không phải ý kiến pháp lý hay attest tuân thủ pháp luật — track compliance vn-law (gate 01.A…) xử lý việc đó riêng và phải được nêu rõ trên artifact.

### B.3 Vì sao chọn đúng 1 cái này (BA reasoning)

1. **Core value**: trực tiếp hóa nguyên tắc "Completion ≠ Verified" thành bằng chứng mang ra ngoài được — đúng failure-to-avoid số 1 của Transaction Owner (PRODUCT.md).
2. **Speed to validate**: v1 render được từ read models hiện có + fixture/Atlas matter, **chưa cần backend mới ngoài 1 endpoint phát hành**; đo phản ứng 2–3 lawyer trước khi đầu tư thêm.
3. **Differentiation ★★★**: không task manager / planner / data room nào phát "chứng nhận readiness dựa trên proof, deterministic, truy vết được" — category-defining, đúng "System of Operational Truth".
4. **Nóng**: mount lên pre-flight vừa landing (tăng giá trị tính năng vừa ship và tạo áp lực hoàn tất independent review của nó).

### B.4 Quét 3 góc nhìn (nén)

- **PM**: artifact trả tiền được; mở đường premium tier; đo adoption bằng "số certificate phát hành/matter chốt".
- **Designer**: entry point 1 nút từ Control Room + PreflightPanel ("Phát hành Tờ trình"); view đọc-only + print stylesheet; keyboard: `C` từ matter; vi label chờ terminology R10 (đề xuất "Tờ trình Sẵn sàng").
- **Engineer**: composition thuần read model + 1 issuance endpoint (event + receipt + hash); không infra mới (HTML print-to-PDF, không headless chrome trên Workers free tier); không đụng transition matrices.

### B.5 Phương án đã cân nhắc — vì sao không phải cái này

| Phương án (r2) | Vì sao không phải đề xuất duy nhất của r3 |
|---|---|
| Portfolio Control Room | Cần sweeps cho số liệu Attention "sống"; authz cross-workspace rộng; M nhưng phụ thuộc chưa có |
| What-if cascade | Transition matrices undecided → cascade chỉ đổi Timing hiển thị, giá trị nửa vời |
| Drive-to-Close | S–M, chỉ composition UI — tốt nhưng "ít mới" làm tính năng đề xuất đơn lẻ; để làm song song khi có dư địa |
| Explainable rules engine | M–L, cần transition matrices được duyệt; nền tảng dài hạn, không validate nhanh được |

### B.6 Assumptions cần test (thứ tự rẻ→đắt)

1. Số liệu trong app đủ tin để xuất ra ngoài (liên quan kỷ luật verification) — test: render từ fixture matter, tự audit nội dung.
2. Lawyer thật sự cần artifact ngoài app (không chỉ xem trong Control Room) — test: 2–3 lawyer xem bản in từ Atlas/fixture, đo phản ứng.
3. Format v1: HTML + print-to-PDF có chấp nhận được chưa (chờ server-side PDF) — xem RC-D1.
4. Wording ranh giới pháp lý (tờ trình vận hành ≠ ý kiến pháp lý) — test với PO + nhãn vi/EN.

### B.7 Sizing · phụ thuộc

- **Sizing**: M — backend: 1 composition read model + `POST /matters/:id/readiness-certificate` (event + receipt + hash, ETag/412 convention sẵn); FE: certificate view + print CSS + 2 entry points; vi/EN + WCAG AA theo chuẩn P0.
- **Phụ thuộc cứng**: pre-flight read model (đã có, **cần independent review xong trước khi mount**), receipts/event spine (có), terminology-final (có), Atlas/fixture dataset (có).
- **Phụ thuộc mềm (v2+)**: as-of engine (pin đúng mốc quá khứ), server-side PDF, lưu certificate vào document version lineage.

### B.8 Decision points (đánh số RC-D* để tránh va chạm D-1..D-22 đã dùng)

- **RC-D1 — format v1**: (a) HTML tự-chứa + print-to-PDF trình duyệt [khuyến nghị — $0 target, không headless trên Workers free tier]; (b) server-side PDF tĩnh; (c) link read-only. *Ghi chú: sửa khuyến nghị D-12 của r2 (PDF tĩnh) vì ràng buộc infra CF Workers; default-if-silent: (a).*
- **RC-D2 — phạm vi v1**: (a) per-matter closing readiness, nhúng chi tiết per-filing từ pre-flight [khuyến nghị]; (b) per-filing thuần (trùng PreflightPanel); default-if-silent: (a).
- **RC-D3 — immutable như thế nào**: (a) v1 = content hash + event/receipt phát hành, không lưu thành document version [khuyến nghị — lean]; (b) lưu document version ngay v1. default-if-silent: (a).

### B.9 Validate nhanh nhất (trước khi viết service nào)

Render certificate tĩnh từ dữ liệu fixture 1 matter Atlas (script nội bộ, không commit product code) → in ra → cho 2–3 lawyer đọc trong 1 buổi — đo: có tin không, có đem ra gặp khách/sếp không, thiếu gì. Trả lời assumption 1/2/4 trong 1 ngày.

---

## Governance

- Đây là **discovery output / PROPOSAL**: không ý tưởng nào được thực hiện nếu chưa qua Codex intake → task assignment → independent review theo workflow hiện hành.
- Không mở lại positioning; không đề xuất AI; không đổi P0/P1/P2 baseline; mọi số liệu demo synthetic.
- Điều kiện tiên quyết liên quan (không phải part của tính năng): pre-flight cần independent review PASS trước khi Certificate mount; terminology R10 do PO duyệt cho vi label.
