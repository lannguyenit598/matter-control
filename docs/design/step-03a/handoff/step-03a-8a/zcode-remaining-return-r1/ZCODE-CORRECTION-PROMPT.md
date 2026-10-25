# ZCode — correct only the remaining F-08/F-10 proposal

Tôi giao ZCode sửa đúng các điểm dưới đây trong return F-08/F-10 vừa gửi, theo cùng phạm vi “đổi sang zcode review luôn”. Dùng session/model/provider đang cấu hình, chỉ quota hiện có; không đổi model/provider/login/settings hay paid retry. Đây là feedback mới tôi gửi trực tiếp; được dùng lại đúng 21 content inputs và 3 manifests đã cho phép trước. Không thêm nguồn/file đọc, không lặp toàn bộ 19 snapshots nếu context đã có, không yêu cầu Claude chỉ vì owner label lịch sử. Xác minh metadata/hash nếu cần; tất cả shell dùng rtk/rtk proxy.

Return TEXT ONLY corrected addendum + một JSON delta unique keys, không write/commit/build/runtime/DB/browser/MCP/Semble/index hoặc gọi agent khác. Không áp route/unit/PO decision. Tool denials vẫn áp dụng; không bypass. Đây vẫn là đề xuất do bạn tác giả, không independent approval.

Sửa có mục tiêu:
1. F-08 totality: giả sử K có một claim, current ACCEPTED, Evidence không withdraw, không dispute và chưa quá expiry. Nếu assessment revoked, hoặc valid_from còn ở tương lai, hoặc version rule CURRENT_AUTHORITATIVE đã mismatch, componentSatisfied=false nhưng mọi nhánh code của bạn đều trượt -> không row. Bao phủ toàn bộ điều kiện evidence-model §4/F-07 failed vector; không cho unsatisfied mandatory component thành false-zero. Với case chưa biểu diễn được bằng vocabulary đóng, trả exact candidate mapping/code-extension decision, không bịa trạng thái đã approved.

2. F-08 null map: accepted Claude R2 chuyển DISPUTED sang condition own-axis evaluation. Nếu condition own evaluator thành công với 2 disputed subjects và chỉ evidenceGaps fail: EVIDENCE_GAP=null, DISPUTED=2, completeness=INCOMPLETE. Sửa §1.4/E5; không hồi sinh R1 mapping evidenceGaps->DISPUTED.

3. F-08 implicit/cardinality: key (revision, null, gap) cho phép hai rows khác code. Một implicit component với claim REJECTED và claim chưa review tạo hai rows theo chính proposal của bạn, mâu thuẫn E3 “không bao giờ hai null rows cùng revision”. UNIQUE NULLS NOT DISTINCT là ở (evidence_id, criterion_revision_id, component_key); nó không hạn chế các Evidence khác nhau hoặc gap rows. Chọn và trình bày một semantics nhất quán; phân biệt rõ component count với component-by-code count, stable identity khi code đổi và tác động UI. Component-only alternative trong backend blueprint vẫn chỉ là proposal; không ai đã duyệt một lựa chọn mới.

4. F-08 ordering: vocabulary order là MISSING,PENDING_REVIEW,REJECTED,EXPIRED,DISPUTED,WITHDRAWN. Cùng component trong ví dụ §1.3 phải PENDING_REVIEW trước REJECTED; sửa example/E1. Action verification là conditional theo proof_required, không phải mọi Action luôn có axis.

5. F-10: giữ 33-operation option như một partial-pagination + explicit PO residual-risk alternative nếu bạn vẫn recommend nó. Không gọi submission items constant-size/bounded: limit=1 vẫn có N submittedVersionRefs; một cycle có M receipt/outcome refs. Trả bảng rõ chiều nào bounded bằng continuation, chiều nào còn unbounded, lựa chọn PO chính xác. Nếu recommend truly bounded relations, đưa exact additional routes/envelopes/order/count and no hidden data cap; so sánh bản 35-operation proposal có 3 relation routes, chưa được approve. Không tự đổi catalogue 32 hay chấp nhận size risk.
6. Sửa dueAt date-only example sang instant/offset có fixture assumptions rõ; định nghĩa outcomeEvidenceRefs null so với [] và unavailable. Đừng viện dẫn “không có UNIQUE” như chứng minh RULE-012 đã approved mọi hình thức resubmission; đó là candidate schema permission, không phải kết luận pháp lý.

Metadata errata (không cần đọc nguồn mới):
- Printed follow-up SHA sai một nibble. Giá trị đúng đã được Codex reverify là 956946dcb100465f65bce2eb329afecf7cfc90c8506ab65e730cb0156bb7cd2c; report in ra ...bb5cd2c. Sửa ghi nhận; không giả vờ có command logs nếu chưa giữ chúng.
- Có 21 payload inputs (2+19) + 3 manifests =24 physical files, không phải tổng21.
- SHA a288b2d4 là prior ZCode recheck; underlying R2 definitions là Claude-authored; current new proposals là ZCode-authored. Giữ provenance tách biệt.
- G4 là independent Design QA, PO Architecture Approval Gate là gate riêng. F-05 đã accepted/materialized document-only, implementation chưa verified. Không bắt buộc review Claude mới trong vòng này sau reroute trực tiếp của PO.

Không review lại F-01..07/F-09/F-11, không sửa backend, không block BE-01 vì F-08/F-10. Trả finite acceptance cho revoked/future-validity/version-mismatch, implicit mixed codes, ordering, evidenceGaps-only failure và nested unbounded cases. Cần quyết định thật thì đưa recommendation/options/impact chính xác, không gửi PO một assertion “bounded” sai.

Giữ 22 CT IDs/16+4+1+1, Q1..Q8 và conditional dependencies; runtime NOT_RUN; G5-B FINDINGS_OPEN, G3 NOT_VERIFIED, G4 PENDING, G6 REWORK_REQUIRED, STEP03B NOT_AUTHORIZED. Kết thúc identity, actual/claimed hashes và skipped/risks. Không claim source/test BE-01 đã executed.
