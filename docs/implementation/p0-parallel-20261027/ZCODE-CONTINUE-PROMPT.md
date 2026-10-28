# ZCode — continue implementation while parallel review proceeds

Bạn giữ ownership duy nhất của product backend/API/frontend theo `docs/implementation/handoffs/MC-P0-ZCODE-RESUME-AFTER-CLAUDE-STOP-PROMPT.md`. Đọc toàn bộ prompt đó và thực hiện tiếp W6–W7 từ source hiện tại, giữ W1–W5/R9/current contract, không restart hay dừng ở planning/design intake. Nếu đã acknowledgement task, resume checkpoint; không tạo assignment trùng.

Codex đã giao ba nhánh riêng: ZITADEL public preflight, frozen W1–W5 source QA, acceptance/restore preparation. Chúng chỉ ghi trong `docs/testing/p0-parallel-20261027/{idp,qa,acceptance-restore}/`; read-only snapshot nằm `/private/tmp/mc-p0-parallel-20261027-0da4q45k`. Đừng sửa snapshot hoặc output của reviewer, chờ kết quả trước khi khẳng định chúng đã review/pass. Bạn không cần ngừng source độc lập để đợi.

Cập nhật owner/checkpoint trong workboard hiện có khi thực sự takeover. Khi human/coordinator giao findings, đọc return mới nhất, so frozen finding với current source trước sửa vì delta có thể đã được xử lý; thực hiện fix trong owned product paths và actual affected checks, giữ author/reviewer provenance. Không tự gọi agent khác hoặc biến source review/plan thành runtime/acceptance evidence.

Baseline operator/live-IdP change và actual restore chưa được các nhánh prep thực thi hoặc cấp quyền. Giữ original safety/private/resource/no-commit boundaries. Hoàn thiện W6/W7 và submit một final BE+FE candidate theo full prompt; current brief/bulk policy proposals chưa phải PO approval.
