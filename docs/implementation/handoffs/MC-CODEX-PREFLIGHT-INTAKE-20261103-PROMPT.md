# MC-CODEX-PREFLIGHT-INTAKE-20261103-PROMPT

- **Dispatch author**: ZCode session 2026-11-03 (PO đã chọn "Qua Codex intake" trong close của brainstorming/design flow)
- **Status**: PROPOSED_DISPATCH — Codex tự xác nhận trước khi nhận; không tự động bắt đầu implementation
- **Base**: `codex/unified-project-flow` (design doc chưa commit, nằm trong dirty tree — đọc từ working tree)

## Nhiệm vụ: INTAKE design Filing Package Pre-flight v1

PO đã duyệt thiết kế qua full brainstorming process (Understanding Lock + 4/4 design sections confirm). Design doc: **`docs/implementation/plans/MC-ZCODE-PREFLIGHT-DESIGN-20261103.md`** (DESIGN_VALIDATED_BY_PO).

Codex được yêu cầu:

1. **Tạo task record** theo `docs/ai-sdlc/orchestration-protocol.md`: ID (đề xuất `MC-PREFLIGHT-01`), owner, priority (đề xuất P1-adjacent — sau RLF wave đang chạy), scope = design doc §4, acceptance = §4.5 gates + guard-alignment pin, tests, reviewer (nonauthor bắt buộc), status BACKLOG → READY khi đủ.
2. **Quyết định sequencing** — 2 dependency đang mở:
   - RLF-02..05 đang in-flight trên cùng dirty tree → preflight code nên đợi RLF đóng/commit để tránh đụng cây (đặc biệt `filing-forms.tsx`, `work_handlers.go` cùng vùng).
   - Guard Z-F-01/02 FIXED_PENDING_VERIFY — OpenCode re-verify ×re-pin trước khi preflight build trên guard (design risk (a), doc §4.6).
3. **Chỉ định ownership thực thi** theo latest PO amendment (Codex primary backend remediation) hoặc reroute theo PO — quyền quyết thuộc PO/Codex, không tự gán.
4. **Điều khoản cứng**: không bắt đầu code khi chưa có task + assignment + nonauthor reviewer; không commit đè dirty tree; nếu Mimosa gate từ chối commit → playbook `docs/implementation/plans/MC-MIMOSA-GATE-COMMIT-PLAYBOOK-20261031.md`; nhãn vi trong design là DỰ THẢO chờ R10.

## Inputs

- `docs/implementation/plans/MC-ZCODE-PREFLIGHT-DESIGN-20261103.md` (design đầy đủ: domain, API, FE, E-1..E-7, testing, risks)
- `docs/discovery/brainstorm-ideas-20261102-r1.md` + `-r2.md` (nguồn ý tưởng, D-15/D-16 decision log)
- Code nền đã verify: `workview.go:157`, `evidence.go:86-101`, `filing.go:246,359,397-404`

## Đầu ra mong đợi từ Codex

Task record + routing quyết định + trả lời 2 sequencing dependency. KHÔNG implementation trong lần intake này.
