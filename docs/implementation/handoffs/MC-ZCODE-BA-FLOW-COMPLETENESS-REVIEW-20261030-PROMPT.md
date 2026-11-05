# MC-ZCODE-BA-FLOW-COMPLETENESS-REVIEW-20261030 — prompt cho actual ZCode (vai Business Analyst)

Soạn bởi actual Claude Code (Solution Architect), 2026-10-30, theo yêu cầu trực tiếp của PO: "đóng vai một BA để kiểm tra hoàn tất tất cả các flow đã implement; viết prompt để zcode đóng vai và kiểm tra toàn diện". Handoff thủ công, chưa dispatch. Chuyển nguyên văn từ mục 1 trở xuống cho ZCode.

---

## 1. Vai trò và ranh giới

Bạn là **actual ZCode, đóng vai Business Analyst (BA)** của MatterControl. Việc của bạn: xác định **mọi flow nghiệp vụ đã được implement** có thực sự **hoàn chỉnh, đúng spec đã duyệt và dùng được bởi người dùng legal** hay không. Bạn là người đọc nghiệp vụ, không phải người sửa code.

- **Chỉ review, KHÔNG sửa source/test/config/SQL**, không commit/push/merge/reset/stash/clean/restore, không deploy, không đổi cloud/IdP/billing, không dùng secret thật, không đọc `.env*`/`.dev.vars`/key. Chỉ ghi vào namespace evidence mới (mục 8).
- **Caveat độc lập (bắt buộc ghi trong return):** ZCode là tác giả một phần backend, nên review này là `BA_REVIEW (author-adjacent)`, KHÔNG phải independent QA PASS. OpenCode vẫn sở hữu independent verification. Không viết "PASS độc lập", "DONE", "DEPLOY_READY", "production-ready".
- Không mở lại định vị sản phẩm (AGENTS.md: Discovery closed; vertical đầu tiên là Transactions & Corporate Legal Work). Không promote P1/P2 thành P0. Mong muốn mới hoặc khác spec → phân loại `RECOMMENDATION`, không phải `DEFECT`.
- Tuân thủ: đọc `AGENTS.md` gốc + `apps/backend/AGENTS.md` + `apps/frontend/AGENTS.md`; prefix mọi lệnh bằng `rtk` (`rtk proxy` nếu không có wrapper); tìm code bằng Semble trước; dữ liệu synthetic; không mạo danh reviewer khác; không tạo agent con trừ khi thật cần.
- Tài nguyên chạy hiện có (ví dụ Codex local runtime ở `localhost:3000`, ZITADEL local `mc-p0-idp`) thuộc người khác: **không dừng, không xoá, không migrate DB của họ**. Dùng container PG mới có nhãn riêng, cổng riêng, DB tên riêng; ZITADEL local dùng user synthetic `mc-alice`, `mc-bob` hiện có (không tạo credential mới, không đọc file secret — nếu thiếu mật khẩu synthetic để đăng nhập thì ghi BLOCKED đúng hành động bị chặn và dùng đường kiểm khác).

## 2. Đầu vào bắt buộc (đọc trước)

Sản phẩm/yêu cầu (nguồn chuẩn, đã PO duyệt): `docs/product/{jtbd,user-journeys,three-golden-workflows,domain-glossary,canonical-product-context}.md`; `docs/requirements/{prd,srs,business-rules,state-semantics,permission-matrix,acceptance-criteria,golden-workflow-acceptance,p0-p1-p2-priorities,open-business-decisions}.md`; Atlas synthetic dataset `docs/product/project-atlas-dataset.md`.

Review/remediation trước đó (không làm lại, chỉ kiểm lại):
- `docs/testing/codex-business-flow-review-20261030-r1/` (findings BF-01..BF-10).
- `docs/implementation/tasks/MC-CLAUDE-BUSINESS-FLOW-REMEDIATION-20261030.md` + `docs/testing/claude-business-flow-remediation-20261030-r1/return.md` — các sửa này là **author-verified only**, chưa có review độc lập, chưa có browser.
- `docs/design/legal-team-experience-20261029/{business-analysis,product-design-brief}.md`.

Source implement: backend `apps/backend/internal/adapter/inbound/productapi/server.go` (≈88 endpoint) + `internal/core/{domain,service}`; frontend `apps/frontend/src/app/(app)/**/page.tsx` (22 route) + `src/features/*`.

## 3. Danh mục flow phải kiểm (seed — bạn phải xác minh và bổ sung từ source)

Lập `flow-inventory.md`: với mỗi flow ghi route UI, endpoint API, AC/REQ/RULE liên quan, persona/role, có UI reach được không. Nếu thấy flow/endpoint không nằm trong danh sách dưới đây, thêm F-extra và nêu.

| ID | Flow | Phạm vi cần phủ |
|---|---|---|
| F01 | Identity | đăng nhập SSO, callback, `/` → My Actions, đăng xuất, session hết hạn/idle, quay lại trang đang làm |
| F02 | Workspace & thành viên | tạo workspace, danh sách, thêm/thu hồi thành viên (picker theo tên), Workspace OWNER không tự đọc matter mật |
| F03 | Matter | tạo matter, danh sách/khám phá cross-workspace, matter members (OWNER/EDITOR/VIEWER), designated verifiers, member candidates |
| F04 | Workstream & Milestone | tạo workstream, milestone, critical milestone, required prerequisites (PUT), lý do khi đổi ảnh hưởng readiness |
| F05 | Requirement & Action (work items) | tạo/sửa, execution start/wait/complete, applicability, escalation, cancel/reopen (OWNER), stale revision, gán assignee |
| F06 | Dependency / Blocker / Waiting-On | thêm/gỡ edge, chống cycle, blocker giải thích được, Waiting-On khác dependency, danh sách `waiting-on` |
| F07 | Evidence & Proof | evidence criteria (tạo/revision), nộp evidence, claims, assessment (verify/reject), dispute, resolution, revocation, withdrawal, non-submitter verifier, hàng chờ verifier (`/me/reviews`) |
| F08 | Document & Version & Signature | tạo document/version, nội dung/tải về, promotion (OWNER), supersede, signature theo version, partial vs đủ chữ ký |
| F09 | Filing lifecycle | tạo filing, stage, observations/correction, signature-applicability, negative outcome, closure, reopening; package vs authority-outcome; **receipt ≠ approval** |
| F10 | Review grid (due diligence) | tạo grid/version/question, revision, answers, lịch sử ô, removal; liên hệ tới gap/finding |
| F11 | Context records & Parties | decision/finding/risk/entity, PATCH, external parties (không tự có account), gắn context đúng |
| F12 | Orientation views | Control Room, Matter overview/brief, My Actions, My Reviews, Agenda, Planning, Work list/detail |
| F13 | Data operations | bulk preview→commit, import preview→commit (mapping, trùng, orphan, lỗi), export CSV/Excel, phân biệt state axes trong export |
| F14 | History & Status Brief | event history theo ngữ cảnh, delta brief (baseline/as-of, no-change rõ ràng, provenance, access-loss chặn output) |
| F15 | Recovery & concurrency | `OUTCOME_UNKNOWN`, `operations/:key/reconciliation`, idempotency key khi reload, stale conflict giữ draft, pending import |
| F16 | Cross-cutting | từ chối quyền (ẩn vs 403/404), empty/loading/error state, múi giờ client, ngôn ngữ/nhãn, tên thay vì ID thô, bàn phím, a11y cơ bản, điều hướng quay lại bộ lọc cũ |

## 4. Phương pháp (làm theo thứ tự)

**Bước A — Inventory & truy vết.** Lập `traceability-matrix.csv`: mỗi hàng = (REQ-MC-P0-01..20) × (AC liên quan) × (GW-01/02/03) × (flow F-id) × cột `API`, `UI reach`, `unit/contract test có?`, `kết quả BA` ∈ {COMPLETE, PARTIAL, MISSING, NOT_VERIFIED}. Mọi `COMPLETE` phải có file:line hoặc bằng chứng chạy; không dựa vào lời tuyên bố của task/return trước. Thêm các hàng P1 đã có implement một phần (signature tracking, review grids, context records, saved views nếu có) và ghi rõ chúng đứng ở đâu so với baseline P1.

**Bước B — Kiểm lại BF-01..BF-10 trên source hiện tại** (HEAD `0de3e5d` + dirty tree). Mỗi finding: `CLOSED_VERIFIED` (có test hoặc chạy thật), `CLOSED_SOURCE_ONLY` (đọc code, chưa chạy), `OPEN`, `REGRESSED`, kèm bằng chứng. Không tin lại return của tác giả.

**Bước C — Walk-through hành trình bằng dữ liệu Atlas synthetic.** Dùng ít nhất hai người dùng (A, B) và ba vai OWNER / EDITOR / VIEWER, cộng một non-member. Thực hiện đầy đủ, theo `golden-workflow-acceptance.md`:
- GW-01 Transaction: approval → document/version → signature (partial rồi đủ) → payment/transfer proof → closing readiness (prerequisite tường minh) → filing → post-closing.
- GW-02 Due Diligence: request → document → review → gap → finding → follow-up → resolution (proof mới được review).
- GW-03 Regulatory Filing: requirement → package → signature → submission → receipt → chờ authority → supplement/response → outcome (kể cả negative outcome, reopening).
- 5 hành trình trong `user-journeys.md` (Morning comprehension, Execute assigned work, Review and prove, Communicate progress, Bring existing tracker).
Ưu tiên chạy qua **trình duyệt** nếu công cụ được cấp; nếu không, chạy tầng HTTP/API đúng đường BFF và ghi rõ giới hạn "UI NOT_RUN". Không bypass permission, không giả lập thao tác UI rồi gọi là browser.

**Bước D — Bẫy "false success" (bắt buộc thử từng cái, ghi kết quả):**
1. Action COMPLETED nhưng chưa có proof → requirement vẫn UNVERIFIED, mọi view (Control Room, Grid, My Actions, brief, export) đồng nhất.
2. Người nộp evidence tự verify → bị từ chối; verifier không được chỉ định → bị từ chối.
3. Evidence gắn version cũ sau khi có version mới / chứng cứ hết hạn → không được tính là đủ.
4. Partial signature hiển thị như đã ký đủ? Signature trên version sai?
5. Submission/receipt filing tự thành approval? Package verified ≠ authority outcome verified (BF-01).
6. Filing không có proof: có lối đi hợp lệ hay ngõ cụt (BF-02)?
7. Request đã gửi / file đã nhận ≠ resolution (GW-02).
8. WAITING tự biến thành BLOCKED khi không có dependency? BLOCKED có giải thích nguyên nhân dẫn?
9. Dependency cycle, cross-matter reference, gỡ edge không lý do → bị chặn.
10. Hoàn tất khi còn blocker → bị chặn; cancel không phải waiver.
11. VIEWER cố ghi; EDITOR cố cancel/reopen/promote/applicability; Workspace OWNER đọc matter mật → bị từ chối đúng ma trận quyền; ẩn so với lộ tồn tại đúng quy ước.
12. Assignee không phải matter member; assignment không cấp quyền truy cập.
13. Sửa với revision cũ (stale) → từ chối, draft còn nguyên, không mất dữ liệu người dùng nhập.
14. Gửi lại cùng idempotency key sau reload / mạng chập → không tạo trùng; kết quả không rõ → trạng thái `OUTCOME_UNKNOWN` hiển thị đúng và recovery chạy được.
15. Bulk: preview khác commit? lỗi từng dòng có hành động khắc phục? Import cùng nguồn lần hai idempotent? Import có "proof claims" chỉ chờ review, không tự verify.
16. Export giữ phân biệt state axes, không làm phẳng thành một status; VIEWER export đúng phạm vi đã duyệt.
17. Brief: baseline/as-of, mục "không thay đổi" rõ ràng, nguồn tham chiếu mở được; mất quyền truy cập → không xuất; không dùng timestamp kỹ thuật thô (BF-10).
18. Múi giờ: ngày nhập theo múi giờ client, hiển thị nhất quán giữa form/list/brief/export (BF-03).
19. Danh sách có >200 bản ghi: picker/dependency/filing-requirement không cắt âm thầm (BF-04).
20. Điều hướng ngữ cảnh: mở chi tiết rồi quay lại giữ bộ lọc/selection; thay đổi chưa lưu có save/discard.

**Bước E — Đánh giá "người dùng legal có hoàn thành được việc không".** Với từng persona (Transaction Owner, Contributor, Reviewer, Manager/Viewer) đặt 3 câu: Tôi có biết việc kế tiếp là gì trong ≤10 giây? Tôi có hoàn thành nó mà không cần biết model dữ liệu/ID? Tôi có biết điều gì đã thay đổi sau khi tôi làm? Ghi ngõ cụt, bước thừa, thuật ngữ kỹ thuật, ID thô, nhãn không rõ, thiếu bước kế tiếp, màn hình phải đoán.

**Bước F — Khoảng trống so với phạm vi duyệt.** Liệt kê P0 chưa đủ, chỗ implement vượt P0 (đang là P1 một phần), và các thiếu sót mà GW-01/02/03 cần nhưng không có P0 nào đỡ. Không tự đề xuất tính năng mới ngoài baseline trong mục này.

## 5. Phân loại và mức độ

Loại: `DEFECT` (mâu thuẫn spec/AC/RULE đã duyệt hoặc cho kết quả sai), `GAP` (spec P0 đã duyệt nhưng thiếu/không reach được), `UX_FRICTION` (làm được nhưng sai ưu tiên/nhầm/khó), `RECOMMENDATION` (ngoài spec, đề xuất), `NOT_VERIFIED` (không kiểm được — nêu lý do).

Mức độ: **P0** = sai sự thật nghiệp vụ hoặc rò quyền hoặc mất dữ liệu (false verification, lộ matter, mất draft); **P1** = flow golden không hoàn thành được hoặc ngõ cụt; **P2** = hoàn thành được nhưng gây nhầm/chậm đáng kể; **P3** = đánh bóng. Không gán P0 cho UX friction thuần.

## 6. Quy tắc bằng chứng

Mỗi finding gồm: `id`, `flow`, `actor/role`, `trigger`, `steps tái hiện`, `expected` (trích REQ/AC/RULE/BR), `actual`, `evidence` (file:line, response API đã redact, đường dẫn screenshot/log), `severity`, `class`, `suggested_correction` (mô tả nghiệp vụ, không viết code), `acceptance_to_add`. Phân biệt rõ: *đọc source* / *đã chạy thật* / *browser quan sát*. Không suy diễn; không rõ thì `NOT_VERIFIED`. Lưu cả bước thất bại và thử lại; không nới tiêu chí để "xanh". Quét secret trong evidence trước khi bàn giao. Dữ liệu chỉ synthetic.

## 7. Giới hạn thời gian và phạm vi

Một assignment liên tục, không dừng hỏi "tiếp tục?". Ưu tiên theo thứ tự: BF-01..10 → GW-01/02/03 → các bẫy ở Bước D → hành trình còn lại → F-extra. Nếu hết khả năng chạy (thiếu công cụ/quyền), hoàn tất phần đọc/truy vết/HTTP và ghi chính xác phần NOT_RUN; không gọi thiếu công cụ là lỗi sản phẩm.

## 8. Đầu ra

Namespace `docs/testing/zcode-ba-flow-completeness-20261030-r1/` (nếu tồn tại: attempt con `-r2`, không ghi đè):
- `flow-inventory.md` (F01..F16 + F-extra, route/API/AC/role).
- `traceability-matrix.csv` (P0 × AC × GW × flow).
- `journey-walkthroughs.md` (từng bước, actor, kết quả thực tế, bằng chứng).
- `findings.json` + `findings.md` (xếp theo mức độ), kèm bảng trạng thái BF-01..10.
- `coverage-summary.md`: mỗi REQ P0, mỗi GW, mỗi flow F → COMPLETE / PARTIAL / MISSING / NOT_VERIFIED, có tỷ lệ tổng (ví dụ "x/20 P0 COMPLETE") và liệt kê chính xác phần chưa kiểm.
- `persona-usability.md` (Bước E) và `scope-gaps.md` (Bước F).
- `source-manifest.json` (hash các file đã đọc/ảnh hưởng, HEAD, dirty snapshot trước/sau, xác nhận không đổi), `commands/` (argv, cwd, UTC, exit, version tool), `return.md`.
- Task record `docs/implementation/tasks/MC-ZCODE-BA-FLOW-COMPLETENESS-REVIEW-20261030.md` (đã tạo khung — điền kết quả); thêm MỘT đoạn ngắn ở đầu `docs/ai-sdlc/project-status.md`.

`return.md` phải nói: agent/tool/version thật, base/head + dirty hash, flow nào đã chạy thật vs chỉ đọc, đếm finding theo mức độ/loại, coverage tổng, flow nào NOT_VERIFIED và vì sao, nêu rõ không phải independent QA. Đề xuất trạng thái: `BA_REVIEW_RETURNED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS`. Kết thúc bằng checks bị bỏ qua và rủi ro còn lại.

## 9. Điều kiện hoàn thành

Xong khi mọi flow F01..F16 có kết luận kèm bằng chứng (hoặc NOT_VERIFIED có lý do), BF-01..10 có trạng thái, ba Golden Workflow được walk-through (hoặc ghi rõ giới hạn), danh sách finding đã phân loại, và source không bị đổi. Sau đó dừng — không tự sửa lỗi, không mở assignment mới.
