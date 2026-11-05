# Design — Filing Package Pre-flight v1 (MC-ZCODE-PREFLIGHT-DESIGN-20261103)

- **Status**: DESIGN_VALIDATED_BY_PO (brainstorming skill, 4/4 sections confirmed 2026-11-03) — chưa intake, chưa task, chưa implementation
- **Origin**: chọn từ 30 ý tưởng discovery r1+r2 (`docs/discovery/brainstorm-ideas-20261102-r1.md`, `-r2.md`)
- **Design facilitator**: ZCode · **PO**: xác nhận từng phần qua Understanding Lock + 4 design sections

## 1. Understanding Summary

- **What**: 1 màn hình pre-flight per filing — checklist deterministic "Sẵn sàng nộp chưa?" nhóm theo purpose (PACKAGE / SIGNATURE / OUTCOME), dòng thiếu kèm link hành động; display-only.
- **Why**: trực tiếp hóa *Completion ≠ Verified*; chặn "tuyên bố sẵn sàng vì task có vẻ xong"; keystone cho Certificate (r2#1), Drive-to-Close (r2#4), readiness rollup.
- **Who**: Transaction Owner (quyết định nộp) · Contributor (proof mình bị hỏi) · Reviewer (assess/dispute state).
- **Constraints**: deterministic (no AI) · membership authz · WCAG 2.2 AA · vi/EN theo `terminology-final.md` · Go hexa + Next Atomic + Solid Glass.
- **Scope v1**: filing-level only (PO chọn, default A). **Non-goals**: matter rollup, Certificate export, chặn submit mới (guard đã có), tạo/đính evidence từ panel, AI.
- **Success criteria (đề xuất)**: trên Atlas sample matter, trả lời đúng "nộp được chưa, thiếu gì" trong ≤1 thao tác từ filing page; usability script M1–M5 pass.
- **Nền đã xác minh trong code**: `ProofChecklist` per-subject (`domain/matter/workview.go:157`, `SubjectQuery` port/evidence.go:237), purpose enum (`evidence.go:86-101`), guard purpose-aware (`filing.go:246,359,397-404`).

## 2. Assumptions (NFR defaults, PO xác nhận nguyên khối)

| Hạng mục | Assumption |
|---|---|
| Performance | Read-model on-read; p95 <200ms trên fixture (≤~100 criteria/filing); đo trước approval |
| Scale | 1 filing/màn; không paginate v1; reopen nếu >200 dòng (E-7) |
| Security | Reuse membership checks matter/filing; không lộ tồn tại (uniform 404) |
| Reliability | Read-only, không failure mode ghi; AsOf stamp; FE revalidate sau mutation |
| Maintenance | Owner theo workflow hiện hành + independent reviewer; contract + FE tests |
| i18n | EN canonical + vi parity từ đầu; nhãn vi DỰ THẢO, đối chiếu terminology trước merge (R10 pending) |

## 3. Decision Log

| # | Quyết định | Alternatives | Lý do |
|---|---|---|---|
| D-15 | Chọn Pre-flight làm feature đáng làm nhất | Certificate (nền chưa có), Atlas seed (đóng gói), Drive-to-Close (cần cause-chain + D-14) | Keystone, 0 quyết định domain mới, gần code nhất trong nhóm đúng thesis |
| — | Approach **A: read model server-side mới** | B (FE compose — drift với guard, Certificate phải viết lại), C (nhét vào GET filing — phình contract, crossover service) | Một nguồn sự thật với guard; correctness là mục đích tồn tại của feature |
| D-16 | Panel dạng **section** trên filing detail page | Route riêng, modal | Density-first; default accepted theo silence |
| — | **Display-only** | Chặn submit | Guard chặn đã có ở backend; hiển thị trước, chặn là phase sau |
| — | `State` = **projection**, không phải state mới | Thêm lifecycle state | Principle: không phát minh semantics; mọi state nguồn từ verification/claim/assessment/dispute/waiver |
| D-20 | Comparator = **proof-sufficiency sub-predicate** của nhánh `StageSubmission/StageResponse` trong `DecideAdvance` (tách hàm pure dùng chung, không copy); UI copy "Sẵn sàng **về bằng chứng**", không claim "nộp được" | Ready == full `DecideAdvance` (over-claim — stage legality/terminal/observed-time/version-coupling ngoài phạm vi rows) | Intake PF-DOR-C1; OUTCOME không bao giờ blocking (BF-01) |
| D-21 | Đính chính: denial đọc = **uniform 404** (cả non-member lẫn foreign/missing), bỏ 403 của bản thảo | Giữ 403 (mâu thuẫn chính sách hiding đã duyệt + `readSnapshot` ErrNotFound) | Intake PF-DOR-C2; bản thảo 403 là deviation, không phải policy |
| D-22 | Wire contract: `Kind` + `Waived`/`WaiverRationale` (data nguyên văn) + `LinkRef` nullable structured; cause text = FE i18n map; row không-ID dùng Kind discriminator | Gửi display string từ server (dính R10, đổi nhãn phải đổi API); bịa CriterionID cho MISSING_PACKAGE | Intake PF-DOR-C3; wire elaboration, không đổi meaning |

## 4. Final Design

### 4.1 Domain & Service

```go
// domain/matter/workview.go (cạnh ProofChecklist)
type PreflightRowKind string // CRITERION | MISSING_PACKAGE | SIGNATURE_REQUIREMENT

type PreflightRow struct {
    Kind             string           // luôn có; MISSING_PACKAGE/SIGNATURE_REQUIREMENT không có CriterionID thật
    CriterionID      string           // rỗng khi Kind != CRITERION — KHÔNG bịa ID
    Purpose          CriterionPurpose
    Mandatory        bool
    State            PreflightState   // SATISFIED|UNSATISFIED|WAIVED|DISPUTED|PENDING_ASSESSMENT
    Blocking         bool             // OUTCOME luôn false (BF-01 — không bao giờ chặn submission)
    Waived           bool             // waiver OWNER (0007) áp dụng cho dòng này
    WaiverRationale  string           // dữ liệu nguyên văn từ bản ghi waiver — không phải UI copy
    LinkRef          *PreflightLink   // nil khi không có target thật; id lấy từ dữ liệu server
}
type PreflightLink struct { Kind, ID string } // kind: evidence|workItem|filingCriteria — chỉ route nội bộ
type FilingPreflight struct {
    FilingID, SubjectID string
    Rows                []PreflightRow
    Ready               bool // = không còn Blocking, theo predicate §6-C1 (proof-ready)
    AsOf                time.Time
}
```

`FilingService.Preflight(ctx, PreflightQuery{ActorID, MatterID, FilingID})` — resolve filing → subject work item, gọi đúng helper guard đang dùng (`filing.go` purpose helpers + `ProofChecklist`). Invariant: pre-flight "chưa xong" ⇔ guard sẽ chặn.

### 4.2 API

`GET /api/v1/matters/:id/filings/:filingId/preflight` — envelope chuẩn `{data, meta(requestId, asOf)}`. **Phân quyền đọc (Denial) uniform `404` cho cả non-member lẫn filing thiếu/ngoại lai** (đúng quy ước hiện có `readSnapshot` → `port.ErrNotFound`, `work_service.go:968-1007`, `GetFiling` tái dùng `filing_service.go:614-628`); unauthenticated đi middleware 401 hiện có; `500` wrap chuẩn. Read-only, không receipt. *(Đính chính D-21: bản thảo trước ghi 403 ngoài membership — sai so với chính sách hiding đã duyệt.)*

### 4.3 Frontend

`PreflightPanel` (organism, `features/filings/components/`) nhúng filing detail, section dưới stage status. 3 nhóm purpose (nhãn vi dự thảo: "Gói hồ sơ" / "Chữ ký" / "Kết quả" — đối chiếu terminology). Chip trạng thái **luôn kèm cause text** (không badge đỏ trần): cause text do **FE i18n map từ (kind, purpose, state, mandatory)** — server KHÔNG gửi display string (đổi nhãn R10 không phải đổi API). WAIVED tooltip = `WaiverRationale` nguyên văn (dữ liệu, escape chuẩn). Header: **"Sẵn sàng về bằng chứng: Đủ/Chưa — thiếu n dòng"** *(D-20: KHÔNG nói "Sẵn sàng nộp" — panel không claim stage legality/terminal/observed-time/version-coupling của `DecideAdvance`)* + "Dữ liệu tại …". OUTCOME group hiển thị informational, không bao giờ blocking. WCAG 2.2 AA: keyboard toàn bộ, chip có chữ; Solid Glass tokens, 0 dependency mới.

### 4.4 Error & Edge cases (mỗi case 1 contract test)

E-1 filing 0 criterion PACKAGE → blocking row (failing-first, tái hiện Z-F-01) · E-2 retired loại khỏi rows · E-3 waiver → WAIVED non-blocking + rationale · E-4 pending assessment → Blocking=true nếu mandatory & chưa satisfied (Blocking từ guard code, State chỉ hiển thị) · E-5 dispute mở → DISPUTED blocking theo guard hiện hành · E-6 subject không hợp lệ → uniform 404 · E-7 >200 dòng → không paginate v1, log đo.

### 4.5 Testing

BE: truth-table ma trận rows (memory + PG) · E-1 failing-first · **guard-alignment pin** (cùng fixture: `Ready == guardAllows` toàn bảng) · authz 403/404 · `make check` PG+race. FE: render 3 nhóm + link · i18n vi/EN parity · a11y keyboard/chip-text · revalidate mutation. Gates: `make check`, `pnpm test` + tsc. **NOT_RUN khai rõ**: browser E2E, screen-reader smoke (block G1/G7 hiện hành — vẫn mở).

### 4.6 Risks

(a) Z-F-01/02 FIXED_PENDING_VERIFY — guard có thể đổi sau OpenCode re-verify; pre-flight follow by design. (b) Nhãn vi chưa ratified (R10). (c) p95 <200ms là assumption — đo trước approval.

## 5. Handoff

- Kế tiếp: **Codex intake** lập task (owner, priority, acceptance, tests, reviewer) theo `docs/ai-sdlc/orchestration-protocol.md`; implementation KHÔNG bắt đầu nếu không có task + assignment + nonauthor reviewer.
- Note: skill `brainstorming` khuyến nghị handoff sang `multi-agent-brainstorming` cho design high-impact — skill này **không có** trong môi trường hiện tại (đã kiểm tra danh sách); ghi nhận làm limitation, thay bằng independent review bắt buộc theo workflow dự án.

## 6. Intake clarifications — trả lời PF-DOR-C1/C2/C3 (2026-11-03, design author)

Trả lời dựa trên code đọc trực tiếp; không đổi 4 section đã được PO duyệt, chỉ làm precision hóa hợp đồng như intake cho phép ("ordinary wire/test elaboration resolved through Codex/design-author coordination").

### C1 — Comparator (D-20)

`Ready` so với **proof-sufficiency sub-predicate** của nhánh `StageSubmission/StageResponse` trong `DecideAdvance` (`filing.go`), KHÔNG phải full `DecideAdvance`. Predicate gồm, theo đúng thứ tự guard:

1. `it.ProofRequired` → `EvaluateVerification(it, set, AsOf).Package.Declared()` (Z-F-01) — nếu chưa khai: row `MISSING_PACKAGE` Blocking=true (chỉ với ProofRequired; filing no-proof bỏ gate này).
2. `unsatisfied(it, set, AsOf)` (`filing.go:246`): mọi criterion `PACKAGE && Mandatory && !Retired && !Satisfied` → Blocking row.
3. Signature: (a) `ProofRequired && !SignatureNotRequired` → phải có SIGNATURE declared + mọi mandatory SIGNATURE satisfied (`res.Signature.Declared()`, predicate như `filing.go:397-404`); (b) no-proof → signature đã quan sát trên version đã submit **hoặc** waiver; (c) `SignatureNotRequired` → row WAIVED (rationale từ bản ghi waiver 0007).
4. OUTCOME: row informational, `Blocking=false` vô điều kiện (BF-01 — "an OUTCOME criterion is the authority's future decision").

Cách thực thi: **tách sub-predicate thành hàm pure dùng chung** (nhánh `StageSubmission/StageResponse` của `DecideAdvance` gọi lại hàm đó — zero copy, đúng "compose/share existing guard predicates; no new guard behavior" trong task). Stage legality, terminal, observed-time, version/reference existence, execution coupling **ngoài comparator** — panel không claim; negative-control test chứng minh full guard vẫn từ chối các case đó dù `Ready=true`.

### C2 — Denial precedence (D-21)

Đúng như Codex chỉ ra: quy ước hiện có là `readSnapshot` → `policy.DecideReadRequirement` !Allowed → `port.ErrNotFound` (`work_service.go:968-1007`), `GetFiling` tái dùng (`filing_service.go:614-628`). Pre-flight theo nguyên tắc: **authenticated non-member → 404; member + filing missing/foreign → 404** (uniform, không existence leak); unauthenticated → 401 middleware hiện có; endpoint này không dùng 403. Bản thảo §4.2 ghi 403 là sai của design author — đã đính chính §4.2.

### C3 — Wire fields (D-22)

Row có `Kind` (`CRITERION|MISSING_PACKAGE|SIGNATURE_REQUIREMENT`), `CriterionID` rỗng khi không phải criterion thật (không bịa ID), `Waived` + `WaiverRationale` (nguyên văn từ bản ghi waiver — là **dữ liệu**, không phải UI copy), `LinkRef` nullable `{kind, id}` chỉ khi có target thật, id lấy từ snapshot server (chỉ route nội bộ). **Cause text không nằm trong DTO**: FE i18n map từ `(kind, purpose, state, mandatory)` — cùng pattern label-table của work-now; đổi nhãn R10 không đụng API. Ghi nhận intake: M1–M5 usability script cho panel là dependency của PF-AC-12 — sẽ soạn scenario/expected-result khi vào phase implementation, không claimed trước.
