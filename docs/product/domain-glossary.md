# Domain Glossary

Source: SRC-00A / Task 1, 2, 3, 5; source documents A/B MISSING.
**Định nghĩa bên dưới là WORKING_INTERPRETATION của BA, chưa reconcile với toàn văn legal addendum.** Đây là mô hình ngôn ngữ nghiệp vụ, không phải schema/API/architecture.

| Thuật ngữ | Nghĩa làm việc | Ranh giới cần giữ | Baseline tier |
|---|---|---|---|
| Workspace | Không gian cộng tác chứa các matter và người tham gia | Không mặc định đồng nghĩa legal entity hay tenant boundary kỹ thuật | P0 context; isolation rules Step 01 |
| Matter | Vụ việc/giao dịch legal được điều phối như một tổng thể | Không gộp thành một Action hay đồng nhất với tài liệu | P0 context |
| Workstream | Nhóm công việc theo phạm vi chuyên môn trong matter | Không phải Milestone; cardinality/membership chưa chốt | P0 context, Atlas cần 5–6 |
| Milestone | Mốc kết quả/điểm kiểm soát quan trọng | Không chỉ là ngày đến hạn hoặc một action hoàn tất | P0 |
| Requirement | Điều kiện, nghĩa vụ hoặc kết quả cần được đáp ứng | Không phải thao tác thực hiện; không gộp vào generic Task | P0 |
| Action | Việc thực hiện cụ thể, có người phụ trách và trạng thái execution | Có thể góp phần đáp ứng Requirement; Action completed không tự đáp ứng Requirement | P0 |
| Dependency | Quan hệ điều kiện tiên quyết giữa các đối tượng nghiệp vụ được phép | Phân biệt ordering, gate và waiting; endpoints/điều kiện cụ thể Step 01 | P0 |
| Evidence Requirement | Tiêu chí về bằng chứng cần có để chứng minh một điều kiện | Khác bằng chứng thực tế; cần làm rõ applicability, số lượng và verifier | P0 |
| Evidence | Bằng chứng được cung cấp để đánh giá tiêu chí | Document/attachment chỉ là một loại nguồn; không tự VERIFIED | P0 |
| Document | Identity của tài liệu trong nghiệp vụ | Không đồng nhất với file binary hoặc Evidence Requirement | P0 |
| Document Version | Một revision xác định của Document, có lineage | Không âm thầm ghi đè phiên bản; current/superseded khác signature completeness | P0 |
| Filing | Quá trình nộp hồ sơ và theo dõi tương tác/kết quả với nơi tiếp nhận | Không chỉ upload file; receipt không mặc định approval | P0 lifecycle; advanced packages P1 |
| External Party | Bên bên ngoài cần phối hợp/chờ phản hồi | Không tự là user có account hoặc Entity master; quyền truy cập chưa mặc định | P0 |
| Entity | Chủ thể được đề cập trong matter, ví dụ tổ chức liên quan | Tham chiếu đơn giản không kéo ownership graph/temporal model vào MVP | P0 reference nếu cần context; Entity master P1, graph P2 |
| Decision | Câu hỏi cần quyết định và kết quả/lý do/người quyết định khi có | Khác Action và Finding; decision mở phải hiển thị được trong context | P0 basic context; Structured Decisions P1 |
| Finding | Quan sát/kết luận từ review cần xử lý hoặc theo dõi | Không đồng nhất với Risk; GW-02 và Atlas cần mức tối thiểu | P0 basic workflow record; Advanced Findings P1 |
| Risk | Khả năng/hệ quả bất lợi cần chú ý trong matter | Khác Finding đã quan sát và blocker hiện hữu; không tự thêm risk engine | P0 basic Atlas context; Advanced Risks P1, intelligence P2 |
| Legal Question | Vấn đề pháp lý chưa có câu trả lời được công nhận | Không phải mọi Decision đều là Legal Question | P1 Open Legal Questions |
| Event History | Lịch sử thay đổi domain truy vết được | Không thay bằng last-updated timestamp hoặc log trạng thái đơn thuần | P0 |

## Quan hệ ngôn ngữ cần xác nhận ở Step 01

- Matter chứa context Workstream/Milestone, Requirement và Action. Cardinality, quan hệ liên-matter và quyền thay đổi chưa chốt.
- Requirement có thể cần nhiều Action và Evidence Requirement. Hoàn thành một Action không tự chứng minh mọi điều kiện đã đáp ứng.
- Evidence có thể tham chiếu một Document Version; version mới và verification của version cũ phải được phân biệt.
- Filing có package/document/signature/receipt/response liên quan nhưng không mặc định cần advanced filing packages P1.
- Waiting On thể hiện người/bên/điều kiện đang chờ; không đồng nhất với một generic free-text note.
- Next Action là thông tin cần làm tiếp; automatic ranking, số lượng và selection rules chưa được quyết định.
- Requirement/Action, evidence criterion, version, filing và external party cần semantics rõ, không đẩy tất cả vào generic metadata blob.

## Ranh giới P0 / P1 cần chốt chi tiết

GW-01/GW-03 có Signature, GW-02 có Finding; Control Room có decisions; Atlas có partially signed document, 2 open decisions, findings và risk. Vì thế P0 phải biểu diễn được những tình huống này ở mức tối thiểu. Đây không phải chấp thuận triển khai toàn bộ signature tracking, structured decision engine hoặc advanced findings/risks của P1.

Mức tối thiểu cụ thể chưa có A/B; ghi tại OBD-03. Không loại các tình huống P0, cũng không kéo trọn mô hình P1 vào MVP.
