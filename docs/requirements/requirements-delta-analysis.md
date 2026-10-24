# Requirements Delta Analysis

**Status: SOURCE_COMPARISON_BLOCKED.** Document A và B chưa có; PO đã xác nhận “chưa có”. Chưa đọc/so sánh hai bản đầy đủ.

Bảng này dùng tám trục do SRC-00A / Task 7 nêu. Cột “A được yêu cầu đối chiếu” chỉ là nhãn từ chỉ thị, không chứng thực nội dung A. Không thể tính verified delta, xác nhận initial seven modules hay kết luận xung đột đã được giải quyết.

| Delta ID | A được yêu cầu đối chiếu — chưa có nguồn | Baseline hiện hành từ SRC-00A | Tác động cần kiểm tra khi nhận A/B |
|---|---|---|---|
| DEL-01 | Generic Item | Requirement và Action riêng | Vocabulary, lifecycle và evidence applicability; không dùng generic Task thay thế |
| DEL-02 | Initial seven modules | 19 P0 capabilities | Mapping đủ từng module/capability; không tự viết danh sách bảy modules |
| DEL-03 | One initial golden journey | Ba GW-01/02/03 | Coverage và release criteria tăng; chưa biết journey gốc cụ thể |
| DEL-04 | Evidence attachment | Evidence Requirements + verification | Attachment tồn tại khác đạt criteria; authority/coverage cần rõ |
| DEL-05 | Simple documents | Document versions / lineage | Current/superseded và bằng chứng gắn version; không mất history |
| DEL-06 | Minimal tracker | Grid, bulk edit, Excel/CSV import, Excel export | Khả năng vận hành dữ liệu dày là P0; validation/error rules Step 01 |
| DEL-07 | Status changes | Auditable domain Event History | Cần biết ai/thay đổi gì/khi nào; không chọn event-sourcing architecture |
| DEL-08 | Go/PostgreSQL | Existing templates + Cloudflare Free Tier/$0 constraint | Chưa xác minh source stack/hosting feasibility; không bỏ P0, đổi stack hay thêm chi phí |

## Quy tắc đối chiếu khi đủ nguồn

1. Đọc toàn bộ A/B, lưu phiên bản/provenance.
2. Gắn section references và trích đoạn ngắn cho từng DEL; phân loại unchanged, clarified, expanded, conflicting hoặc unresolved.
3. Áp dụng B ưu tiên A về legal semantics và capability priorities; giữ positioning/constraints hiện hành.
4. Nếu thực sự có xung đột ảnh hưởng semantics, full-MVP criteria hoặc infrastructure, ghi options/consequences và yêu cầu PO quyết định đúng điểm đó.
5. Cập nhật glossary, priority mapping, workflows và Atlas; không suy luận dữ liệu fixture là yêu cầu mới.

## Trade-offs hiện thấy từ chỉ thị, chưa phải xung đột A/B đã xác nhận

- Signature/finding/decision/risk tối thiểu ở P0 workflows/dataset trong khi advanced capabilities ở P1: OBD-03.
- Delta brief P0 và historical snapshots P1: OBD-07.
- Độ rộng P0 và Cloudflare Free Tier/$0 với template backend: OBD-09.
- Hai nguồn bắt buộc chưa có: OBD-01. Không đồng nghĩa PO chưa chấp thuận product direction.
