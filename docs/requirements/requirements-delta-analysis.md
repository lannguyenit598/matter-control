# Requirements Delta Analysis

**Status: PROMPT_BASED_DELTA_RECORDED.** Nguồn hợp lệ là SRC-00A và [SRC-00A1](../ai-sdlc/step-00a1-request.md). Chưa đọc/so sánh trực tiếp A/B; việc archive bản gốc là optional, không chặn Step 01.

Bảng này dùng tám trục do SRC-00A / Task 7 nêu. Cột “A được yêu cầu đối chiếu” chỉ là nhãn từ chỉ thị, không chứng thực nội dung A. Các trục phản ánh thay đổi do prompt truyền đạt; không xác nhận initial seven modules hoặc gọi đây là direct A/B verified delta.

| Delta ID | A được yêu cầu đối chiếu — chưa có nguồn | Baseline hiện hành từ SRC-00A/00A1 | Tác động cần kiểm tra khi nhận A/B |
|---|---|---|---|
| DEL-01 | Generic Item | Requirement và Action riêng | Vocabulary, lifecycle và evidence applicability; không dùng generic Task thay thế |
| DEL-02 | Initial seven modules | 20 P0 capabilities theo approved prompt context | Mapping đủ từng module/capability; không tự viết danh sách bảy modules |
| DEL-03 | One initial golden journey | Ba GW-01/02/03 | Coverage và release criteria tăng; chưa biết journey gốc cụ thể |
| DEL-04 | Evidence attachment | Evidence Requirements + verification | Attachment tồn tại khác đạt criteria; authority/coverage cần rõ |
| DEL-05 | Simple documents | Document versions / lineage | Current/superseded và bằng chứng gắn version; không mất history |
| DEL-06 | Minimal tracker | Grid, bulk edit, Excel/CSV import, Excel export | Khả năng vận hành dữ liệu dày là P0; validation/error rules Step 01 |
| DEL-07 | Status changes | Auditable domain Event History | Cần biết ai/thay đổi gì/khi nào; không chọn event-sourcing architecture |
| DEL-08 | Go/PostgreSQL | Existing templates + Cloudflare Free Tier/$0 constraint | Chưa xác minh source stack/hosting feasibility; không bỏ P0, đổi stack hay thêm chi phí |

## Đối chiếu bổ sung tùy chọn nếu PO cung cấp bản gốc

1. Đọc toàn bộ A/B, lưu phiên bản/provenance.
2. Gắn section references và trích đoạn ngắn cho từng DEL; phân loại unchanged, clarified, expanded, conflicting hoặc unresolved.
3. Áp dụng B ưu tiên A về legal semantics và capability priorities; giữ positioning/constraints hiện hành.
4. Nếu thực sự có xung đột ảnh hưởng semantics, full-MVP criteria hoặc infrastructure, ghi options/consequences và yêu cầu PO quyết định đúng điểm đó.
5. Cập nhật glossary, priority mapping, workflows và Atlas; không suy luận dữ liệu fixture là yêu cầu mới.

## Trade-offs hiện thấy từ chỉ thị, chưa phải xung đột A/B đã xác nhận

- Signature/finding/decision/risk tối thiểu ở P0 workflows/dataset trong khi advanced capabilities ở P1: OBD-03.
- Delta brief P0 và historical snapshots P1: OBD-07.
- Độ rộng P0 và Cloudflare Free Tier/$0 với template backend: OBD-09.
- OBD-01 đã RESOLVED bằng xác nhận provenance SRC-00A1. Không còn source-file hard gate; chưa có blocker product direction/approved scope.

## Delta closure so với b5224ce

| ID | Trước | Sau SRC-00A1 | Classification |
|---|---|---|---|
| DEL-09 | Thiếu file gốc bị coi là Step 01 blocker | Approved prompts là baseline hợp lệ; archival originals optional | CONFLICT corrected — provenance/gate |
| DEL-10 | Core JTBD unresolved | Seven JTBD explicit, trace tới capability/Atlas | MISSING corrected — approved requirements |
| DEL-11 | Five axes có ở canonical nhưng thiếu capability trace riêng | Thêm REQ-MC-P0-20; giữ IDs hiện có và tiers P1/P2 | PARTIALLY_COVERED corrected — traceability |
| DEL-12 | Grid/roles mô tả chưa rõ inline editing và ownership | Làm rõ P0-11/P0-18, UX và AT-UX/AT-ROLE; chuẩn hóa tên capabilities | PARTIALLY_COVERED corrected — semantics |

Không đổi positioning, product direction, infrastructure constraints hoặc tự chốt business rules. Sự khác nhau giữa requirement/action, evidence criterion/actual evidence và completed/verified được giữ nguyên. Chi tiết cần phân tích là TO_BE_ANALYZED_IN_STEP_01 trong open decisions.
