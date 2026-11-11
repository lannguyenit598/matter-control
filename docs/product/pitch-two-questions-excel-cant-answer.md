# Pitch: Two questions Excel cannot answer

Đối tượng: partner / transaction counsel / fund ops — người đang vận hành deal trên Excel + Outlook + shared drive. Đặt **hai điểm mạnh bị đánh giá thấp nhất lên đầu** theo vòng verify 2026-11-10 (J7/J8): đây là hai câu hỏi mà bảng tính không bao giờ trả lời được.

## 1. "Người mới vào deal giữa chừng nắm bối cảnh trong bao lâu?" (J7 — onboard-context)

MatterControl: **Control Room** = một màn hình trả lời "vụ việc này đang đứng ở đâu" — gaps, gates, decisions, risks theo từng record, kèm **Event History** truy vết từng thay đổi (ai, khi nào, vì sao, theo nguồn nào). Không ai phải kể chuyện lại từ đầu; hệ thống kể.

Demo path (dữ liệu synthetic, walkthrough env): login → mở matter → Control Room → thấy blocker có lý do → mở một record → đọc history có provenance.

## 2. "Tại thời điểm closing, version nào là cơ sở của kết luận này?" (J8 — as-of provenance)

Mọi dữ liệu mang provenance (`MC-As-Of` / `MC-Source-Revision`, nhãn "Dữ liệu tại…"); Status Brief là **delta deterministic** — cùng baseline + cùng as-of ⇒ cùng kết quả, không ai "bịa" báo cáo. Khi fund/auditor hỏi lại sau 6 tháng, câu trả lời nằm trong hệ thống chứ không trong trí nhớ ai cả.

Demo path: mở document → version lineage (sha256) → promotion có impact preview → brief với as-of timestamp.

## Điểm khác biệt cốt lõi (1 dòng mỗi ý)

- **Completion ≠ Verified** — associate báo xong ≠ counsel xác minh; verification là trục độc lập, có verifier riêng.
- **Bằng chứng gắn đúng version** — evidence chỉ đến version cụ thể; version mới không âm thầm vô hiệu hoá kết luận cũ mà có impact preview.
- **Receipt + idempotency + CAS** — không "ai save sau người đó thắng"; không double-submit khi mạng rớt.
- **Filing preflight** — biết thiếu hồ sơ chứng minh gì TRƯỚC khi advance stage; receipt authority không tự thành approval.
- **(Mới, 2026-11-11) Thông báo in-app** — quá hạn/bị chặn/sắp đến hạn/chờ bạn xác minh, suy ra trực tiếp từ trạng thái thật, không phải entry tay.
- **(Mới, 2026-11-11) Email capture** — .eml gắn vào matter thành document bất biến + envelope truy được, khỏi copy-paste tay.

## Ranh giới phải nói ngay (chống kỳ vọng sai)

Không e-sign/e-filing execution, không AI, không thay Word/Outlook — MatterControl là **control plane điều phối và chứng minh**, không phải công cụ thực hiện. AI là phase sau (PO decision 2026-10-29).

## Trạng thái trung thực khi trình bày

- Đã có: local implementation với local gates xanh; browser walkthrough với IdP thật (evidence 2026-11-11).
- Chưa có: production deployment đã kiểm chứng, quyết định hosting/DPA (packet chờ PO), M1–M5 usability với người dùng thật.
