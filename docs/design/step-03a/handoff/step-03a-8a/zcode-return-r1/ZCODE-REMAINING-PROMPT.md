# MC-003A.8A — ZCode: two remaining contract items

Tôi giao ZCode review và đưa đề xuất có mục tiêu cho đúng F-08 EVIDENCE_GAP row unit và F-10 nested design, theo quyết định trực tiếp của tôi: “đổi sang zcode review luôn”. Tôi cho phép model/provider hiện đang active trong ZCode session xử lý đúng hai input trong manifest và sử dụng lại 19 snapshots đã liệt kê. Báo actual tool/version/model/provider từ metadata sẵn có trước; không đổi model/provider/account/login/settings. Chỉ quota đã bao gồm hiện tại, không API job/paid retry/credits/overage; nếu không giữ được giới hạn thì dừng báo tôi.

Manifest:
/Users/nguyenvanlan/.codex/worktrees/mattercontrol-step-03a-remediation/matter-control/docs/design/step-03a/handoff/step-03a-8a/zcode-return-r1/remaining-context/manifest.json
SHA256: d470179ac9f1d137b79fb4601f6b0012fd80f3b8883ad42d48ac630e939db3ba
Manifest bytes: 2926
New inputs: 2 files, 9054 bytes (content unchanged).

Được đọc đúng manifest, hai inputs và 19 snapshots cũ; chỉ local read-only hash/metadata verification. Mọi shell command dùng rtk/rtk proxy. Không mở thêm file nguồn, grep/Semble/index/MCP/browser; không write/commit/runtime/build/Go/PostgreSQL/frontend hoặc gọi agent khác. Return TEXT ONLY Markdown và JSON unique keys. Official tool denials vẫn áp dụng, không bypass.

Quyết định này đã giao phạm vi F-08/F-10 cho ZCode; không yêu cầu tôi xác nhận lại chỉ vì artifact có nhãn READY_NOT_DISPATCHED hoặc nhãn Claude cũ trong source. Nhãn đó là lịch sử chuẩn bị/provenance, không phải thiếu authorization cho cùng nhiệm vụ này. Việc đổi assignee này không chuyển toàn bộ ownership kiến trúc, không cấp product/architecture approval.

Bạn đã review các đề xuất trước. Lần này, nếu bạn đề xuất row unit/route/constraint mới thì phải công khai mình là tác giả của đề xuất đó; không gọi việc tự kiểm tra đề xuất của mình là independent approval. Các thay đổi catalogue/domain/size-risk cần trình PO cụ thể; không tự chọn thay PO. Không bắt buộc gọi lại Claude trong đợt này.

ZCode đã chấp nhận các đề xuất ở mức DOCUMENT_ONLY; không review lại 11 findings hoặc 32 operations/architecture. F-07 alignment đã được Codex chép cơ học vào candidate kế thừa theo đề xuất đã được review; F-11 được ghi là fixture tài liệu, không runtime. Phạm vi lần này chỉ:

1. F-08 EVIDENCE_GAP: recommend một row unit cụ thể (criterion hay component), stable row key, dedup/order, total semantics và count-source. Minh họa một criterion nhiều components, nhiều gap codes cho cùng row, component implicit/null, thay đổi criterion revision và thiếu một số section. Nêu rõ tương thích với card hiện có ref/criterionRevisionRef/componentKey và evidenceGaps.total, không tạo Evidence giả hay áp percentage/state mới. Nếu không thể quyết định từ nguồn đã có, trả exact semantic trade-off cần PO, không tự mở thêm nguồn.

2. F-10 nested: recommend đúng một phương án đủ cụ thể để PO quyết định, không chỉ liệt kê lại O1..O4. Nếu cần route mới, ghi exact method/path/IDs/queries/response/order/continuation và số operations trước/sau; nếu không, chứng minh reachability và giới hạn payload mà không bịa cap hoặc ngầm chấp nhận complete embedding. Bao phủ submissions[], submittedVersionRefs và receipt/outcome evidence refs, exact versions, permissions/revocation, snapshot boundaries/partial-page labels và consumer impacts. So sánh ít nhất một alternative, compatibility/migration/ADR requirements, câu phê duyệt PO cụ thể cần thiết, finite document acceptance assertions và các bước runtime còn chưa kiểm chứng. Không chọn provider/cost policy, không tự mở rộng catalogue 32, không áp UNIQUE/domain rule hay chấp nhận risk thay PO.

Mỗi output phân biệt approved business requirement, candidate technical choice, authority/owner, recommendation, alternatives, exact current-vs-proposed wire shape, acceptance và remaining approvals. Return một targeted addendum + JSON delta unique keys; không sửa bất kỳ artifact nào. Recommendation không phải PO approval.

Giữ 22 CT IDs/16+4+1+1, tám QA dispositions với Q2/Q4/Q6/Q8 conditional, runtime NOT_RUN. G5-A document compatibility giữ; G5-B FINDINGS_OPEN; G3 NOT_VERIFIED; G4 PENDING; G6 REWORK_REQUIRED; STEP03B NOT_AUTHORIZED. Không production implementation/deploy. Kết thúc bằng identity/hash verification/skipped/risks.
