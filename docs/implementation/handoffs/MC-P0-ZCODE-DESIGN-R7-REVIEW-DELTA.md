# ZCode — delta từ review Design R7; tiếp tục full P0 BE+FE

Đây là cập nhật input cho **assignment MC-P0-ZCODE-EXECUTION đang chạy**, không phải assignment mới, không restart W0 hoặc checkpoint, không thêm review gate sau từng wave. Tiếp tục hoàn thành cả backend và frontend W1–W7, self-test/repair, rồi trả một gói review cuối theo full plan đã giao.

Đọc `docs/reviews/p0-design-r7-full-review-20261027.md` (**16,656 bytes**, SHA-256 `c271018278efa75a6dfd26655045d71b9b632e1dc4b5c69f1388e399f20e1d2f`). Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, prepared HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`, branch `codex/unified-project-flow`; xác minh actual checkout/checkpoint trước khi consume.

Design R7 source/spec verdict **CHANGES_REQUIRED**; R8 correction prompt đã được chuẩn bị cho design owner, **chưa có return R8 và chưa được coi đã dispatch/executed**. Các phần spec đã đúng vẫn dùng được theo approved requirements; không dừng implementation độc lập để chờ toàn bộ R8.

Áp dụng ngay trong phần triển khai liên quan:

1. Approved state semantics ưu tiên: không tạo aggregate Verification `EXPIRED` hay Dependency `CIRCULAR_CONFLICT`. Expiry là input/reason; graph cycle bị reject.
2. Typed subject/edge/proof hiển thị đúng: RQ-11 có DEP-07→AC-12; RQ-07 không nhận BLOCKED từ Action AC-07. Không copy generic proof fallback sai của prototype. Giữ historical/current-policy distinction.
3. Theo living contract do bạn sở hữu: missing CAS 428, stale CAS 412; domain conflicts theo actual problem contract. OUTCOME_UNKNOWN theo per-operation receipt/CAS/readback table; current state hoặc 412 không tự chứng minh write trước và không cho blind resend.
4. Theo permission matrix, không suy grants từ personas. Scoped VIEWER read/history/export; EDITOR bulk/import/ordinary dependency edits; OWNER-specific promotion/cancel/reopen/applicability/membership; designated independent verification riêng.
5. Sáu surface SCR-01/08/09/10/11/13 của R7 vẫn SPECIFIED_ONLY. Bạn vẫn phải implement chức năng thật theo plan/requirements; dùng existing primitives và consistent UX, ghi assumptions cụ thể. Design owner đang được giao bổ sung layout; không lấy việc thiếu mockup làm cớ để để product endpoint/UI TODO. Nếu thiếu quyết định business/contract thực sự thì cô lập đúng dependency và tiếp tục phần khác.
6. Browser/human/visual acceptance còn NOT_RUN hoặc BLOCKED. Không lấy source/mock pass, old screenshot hay prototype fixture làm product enforcement/visual PASS. Không bypass Work settings.

Ghi delta đã consume vào workboard **do chính bạn sở hữu**, actual source/contract revision và affected implementation items. Giữ dữ liệu synthetic và safety boundaries cũ. Khi actual R8 return tới, xác minh return + payload pins, tích hợp delta vào cùng checkpoint; không mặc định R8 đã được review/approved hoặc yêu cầu restart.

Nếu thấy mismatch giữa review và contract/source mới, ghi exact file/revision và xử lý theo approved precedence; không đổi requirements theo prototype. Không sửa design output hoặc reviewer evidence. Kết thúc assignment dài bằng source/diff, FE→API→Go→PG evidence, negative tests và coverage trung thực như full plan, không dừng ở acknowledgement của delta này.
