# return.md — MC-UIUX-LAWYER-EXPERIENCE-AUDIT-AND-PLAN-20261030 (r1)

## Danh tính & phân vai (khai thật)
- Agent/tool thực hiện: **actual ZCode** (GLM session trên ZCode Desktop), đóng vai chuyên gia UI/UX cấp cao legal-tech. Version: model GLM (session account zai-start-plan), ZCode harness browser-use + node_repl.
- Prompt soạn bởi actual Claude Code cho OpenDesign (fallback Antigravity); **PO dispatch trực tiếp vào session ZCode** → thực hiện tại đây. Deliverable KHÔNG thay thế review của OpenDesign (UI/UX owner) hay QA độc lập của OpenCode — mong muốn của task record: reviewer = PO + Local Codex intake.
- Không mạo danh agent khác; không tự phê duyệt.

## Base/HEAD + dirty
- Repo: `codex/unified-project-flow` @ **`0de3e5d`** (2026-10-30T10:49:44+07:00) — pin đầu 2026-10-30T16:26:26Z (175 dirty), pin cuối 2026-10-30T17:51:12Z (**179 dirty, HEAD không đổi**). Delta +4 entries: 1 = namespace này (untracked), 3 còn lại do session song song; tôi không đụng.
- Tôi KHÔNG thay đổi bất kỳ source/test/CSS/token nào. Ghi duy nhất: namespace này + điền task record + 1 đoạn đầu `docs/ai-sdlc/project-status.md` (được phép theo §8).

## Route nào chụp thật, route nào chỉ đọc source
- **22/22 route có bằng chứng rendered** (screenshots trong `screens/`, dev runtime `127.0.0.1:3100`, `API_MODE=demo`, webpack, IAB Chromium): 6 mặt chính chụp đa state (vi/en × light/dark × 1440/390 + drawer + settings popover), 16 route còn lại 1 state (vi-light-1440) + DOM probe.
- **KHÔNG route nào được quan sát với dữ liệu thật** (populated): demo mode không có data layer cho product features; REST đòi IdP; ZITADEL local từ chối authorize (`redirect_uri missing in client configuration`); callback pin :3000; prod demo bị guard từ chối. Toàn bộ nhận xét màn populated là SOURCE_READ + prior author artifacts (provenance trong screen-inventory.md). Đây là giới hạn lớn nhất của audit.
- Storybook: 58 stories; 13 capture; ≥3 crash TypeError; SearchPicker set render đúng.

## Số finding theo mức
Blocker 3 (UX-L-01 title Workspaces; UX-L-02 locale kẹt EN; UX-L-03 không có đường populated local) · Major 4 (UX-L-04 trộn ngôn ngữ; UX-L-05 fail mất context; UX-L-06 Storybook vỡ; UX-L-10 streaming fail rủi ro, dev-only) · Minor 3 (UX-L-07, 08, 09) · Polish 1 (UX-L-11). Điểm mạnh: 8 mục có bằng chứng. Contrast: 52 cặp đo thật, 50 PASS, 2 FAIL (border, diễn giải ngữ cảnh).

## NOT_RUN và lý do
- Keyboard-only, screen reader, zoom 200%, reflow 320px: ⛔ — không có màn populated + không cấu hình AT (chi tiết accessibility-report.md).
- Tablet 834, laptop 1280: không chạy (ngân sách; breakpoint đã đọc source).
- Dark theme cho 16 route Tier-2: thay bằng đo token cả 2 theme (script) + 1 đại diện rendered.
- Hành vi aria-live thật với dữ liệu: NOT_VERIFIED (cần runtime populated).
- Cơ chế UX-L-02 trên prod build: NOT_VERIFIED (hypothesis; probe đã ghi sẵn để chạy lại).

## Ảnh hưởng của source thay đổi song song
- HEAD không đổi trong suốt audit; hash 13 file lõi đã pin (source-manifest.json). 179 dirty entries thuộc các session song song — tôi không đọc để tránh nhầm trạng thái công việc của họ, trừ các file frontend lõi đã liệt kê (cần cho audit). Nếu deploy-readiness đổi các file đó sau thời điểm pin, hash là cơ sở đối chiếu.

## Bảo mật/PII
- Không đọc .env*, .dev.vars, ops/p0-local/secrets, bất kỳ credential nào. Không dùng runtime :3000, không sửa IdP. Ảnh chứng chứa client_id + PKCE code_challenge/state/nonce trong URL lỗi ZITADEL (đều là giá trị public/one-time, không phải secret); không có email/tên/PII; dữ liệu hiển thị chỉ synthetic ids (m-atlas-01…). Đã quét evidence: không tìm thấy secret/PII.

## Tuyên bố bắt buộc
- **Đây là đánh giá chuyên gia CHƯA kiểm chứng với người dùng thật; KHÔNG phải acceptance; KHÔNG phải PASS độc lập.** Mọi kết luận màn populated là SOURCE_READ. Cơ chế UX-L-02 là hypothesis có bằng chứng gián tiếp.
- Đề xuất trạng thái: **UX_AUDIT_RETURNED / IN_REVIEW** (reviewer: PO + Local Codex intake; sau đó OpenDesign nên review chuyên môn; bất kỳ implementation nào cần assignment + reviewer riêng).

## Checks bị bỏ qua và rủi ro còn lại
1. Không kiểm chứng populated UI → toàn bộ Tier "điểm mạnh thiết kế" có thể lệch khi có dữ liệu (mật độ grid, provenance adjacency, bulk preview).
2. UX-L-02 cơ chế chưa proven — bản sửa có thể cần chạm middleware/RSC (xếp loại effort M–L, có thể phình).
3. UX-L-10 chưa được loại trừ trên prod build — nếu tái lập là Blocker trần.
4. Storybook crash root-cause chưa định vị (chỉ chứng minh hiện tượng).
5. ZITADEL client redirect_uri lệch: ngoài phạm vi tôi sửa; cần owner IdP/config xử lý (nằm với Codex/ops).
6. Two parallel assignments có thể thay đổi frontend sau pin — cần re-run probe trước khi làm Pha 0.
