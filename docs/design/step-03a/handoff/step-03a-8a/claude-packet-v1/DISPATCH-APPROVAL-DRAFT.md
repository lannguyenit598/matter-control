# Human approval draft — NOT an authorization record

Status: WAITING_SCOPED_AUTHORIZATION. Codex prepared this text; it becomes human authorization only if the Product Owner explicitly sends/approves it. No Claude dispatch has occurred here. A human-relayed Claude response reports it stopped before reading/tools/writes; this is not independently attested session telemetry.

Prior READY_NOT_DISPATCHED describes preparation only; it is not the status of the official approval mechanism. The previous bounded Codex documentation writes/commit were permitted through the normal mechanism. That permission does not authorize this new Claude payload. No tool permission denial may be bypassed by this draft.

## Copyable message — send only when you approve

Tôi là Product Owner MatterControl. Tôi cho phép dispatch thủ công MC-003A.8A, chỉ F-01..F-10, vào chính Claude Code interactive session hiện tại qua Anthropic, với model claude-opus-5-5.

Trước nội dung repository, xác nhận tool/version/model/provider bằng session metadata sẵn có, không đọc credentials hoặc đổi cấu hình. Claude Code 2.1.310 là thông tin đã báo cáo, chưa được Codex xác minh độc lập. Nếu model/provider thực tế khác hoặc không xác nhận được, dừng và báo lại; không tự đổi.

Tôi cho phép đọc manifest tại:
/Users/nguyenvanlan/.codex/worktrees/mattercontrol-step-03a-remediation/matter-control/docs/design/step-03a/handoff/step-03a-8a/claude-packet-v1/manifest.json
Manifest SHA256: eed788550530966eea23a66a20e1edd84f18fa024963b60fb132f0a3028f0979
Manifest bytes: 11607

Sau khi kiểm tra đúng hash, tôi cho phép đọc và xử lý trong session này đúng 12 snapshot được manifest liệt kê tại cùng thư mục, tổng nội dung snapshot 164137 byte. Được đọc metadata file và chạy phép tính hash cục bộ chỉ cho manifest/các snapshot đó. Được đối chiếu SHA256/bytes với manifest, rồi phân tích F-01..F-10. Không cần và không được tự snapshot lại hoặc mở nguồn gốc để bù context. Không dùng grep/Semble hay tìm kiếm repository ngoài packet. Thiếu ngữ nghĩa thì trả NEEDS_AUTHORIZED_SOURCE với exact path/sections/reason; không tự mở thêm.

Quyền này bao phủ việc đưa chính manifest và 12 snapshot vào context của model/provider nêu trên, cùng đề xuất addendum/delta trong câu trả lời. Không bao phủ dependency-engine.md, grep ngoài allowlist, nguyên bản report ZCode có extra-scope, fixture F-11, file không liệt kê, credential hoặc legal data thật.

Output: TEXT ONLY trong chat hiện tại. Trả Markdown và JSON/code blocks chứa đề xuất sửa; đây là nội dung đề xuất, không phải quyền ghi file. Không tạo/sửa bất kỳ file nào, kể cả step-03a-8/ hoặc step-03a-8a/; không commit. Không runtime/build/Go/PostgreSQL/frontend/browser/MCP, không gọi agent/provider khác.

Chi phí: chỉ session interactive hiện tại và quota đã bao gồm trong gói; không separate API job, paid retry, mua credits, bật overage hoặc đổi provider/model. Không cam kết chi phí thực tế bằng 0. Nếu cần chi phí ngoài giới hạn này hoặc không thể giữ giới hạn, dừng và báo tôi.

Message phê duyệt của tôi này giải quyết execution gate đang thiếu trong 00-focused-handoff.md cho đúng phạm vi trên, nếu các quyền công cụ hiện tại cho phép. Nó không tắt hoặc vượt official approval mechanism. Sau khi xác minh manifest/identity, chuyển execution status sang IN_PROGRESS rồi review ngay; không yêu cầu thêm một vòng xác nhận chỉ vì snapshot/handoff vẫn mang nhãn lịch sử PREPARED/READY_NOT_DISPATCHED.

Đọc 00-focused-handoff.md trong packet để nhận đầy đủ F-01..F-10 và các tiêu chí. Nếu nó yêu cầu đọc trực tiếp nguồn hoặc snapshot thêm, chỉ dẫn packet-only/text-only này được ưu tiên. Trả trước/sau, exact references, rationale/approved-vs-candidate authority, alternatives/compatibility, ADR/PO decision need, AC và giới hạn cho từng finding. F-07/F-10 có thể trả DECISION_REQUIRED/NEEDS_AUTHORIZED_SOURCE; không bịa enum, route hoặc bound.

Giữ nguyên 32-operation baseline, toàn bộ 22 CT IDs và phân loại 16/4/1/1; mọi runtime NOT_RUN. F-11 thuộc Codex. Giữ conditional QA và các gate MC-003A REWORK_REQUIRED, STEP03B NOT_AUTHORIZED. Không tự đóng findings hoặc cấp product/architecture approval.

Kết thúc bằng identity, manifest SHA, 12 snapshot verification results, từng F disposition, đề xuất Markdown/JSON và skipped/remaining risks.
