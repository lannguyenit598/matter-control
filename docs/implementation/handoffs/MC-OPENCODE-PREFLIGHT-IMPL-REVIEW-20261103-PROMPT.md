# MC-OPENCODE-PREFLIGHT-IMPL-REVIEW-20261103-PROMPT

- **Dispatch author**: ZCode session 2026-11-03 (PO lệnh "viết prompt cho opencode review phần implement này")
- **Status**: PROPOSED_DISPATCH — OpenCode tự xác nhận pre-flight trước khi nhận
- **Role being invoked**: independent nonauthor implementation review của MC-PREFLIGHT-01 (per task `docs/implementation/tasks/MC-PREFLIGHT-01.md` + PF-DEP-02). Bạn là reviewer, KHÔNG phải author.

## 0. Pre-flight (bắt buộc, ghi kết quả vào report)

1. Repo: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`.
2. Expected HEAD: `6172f234be5a25393cddffaf841cc0370b587334` (post-RLF curated baseline). Nếu HEAD khác → STOP, report BLOCKED_BASE_MOVED, không review trên bytes khác.
3. Implementation là **uncommitted working tree** trên HEAD đó. Ngay khi bắt đầu: tạo manifest `sha256sum` cho toàn bộ 14 modified + 5 new source files (liệt kê trong §2) vào evidence dir của bạn. **Verdict của bạn bind vào các bytes đã pin**; nếu phát hiện drift giữa chừng → void pass đó, re-pin, review lại phần drifted.
4. **Nonauthor declaration**: xác nhận bạn không phải author của bất kỳ file nào trong scope; nếu vi phạm → từ chối task.

## 1. Inputs

- Design (binding): `docs/implementation/plans/MC-ZCODE-PREFLIGHT-DESIGN-20261103.md` — đặc biệt §4/§6 và decision log D-15..D-22.
- Task: `docs/implementation/tasks/MC-PREFLIGHT-01.md` (Codex's — KHÔNG sửa; acceptance matrix PF-AC-01..12 là checklist review của bạn).
- Author return: `docs/testing/preflight-impl-20261103-r1/return.md` — **author receipts = claims, không phải evidence**. Mọi claim trong đó phải được bạn verify độc lập hoặc đánh dấu UNVERIFIED.
- Author self-review trong return.md: 3 AUTO-FIXED + 1 ASK deferred — verify fixes là thật, không tin lời khai.

## 2. Scope files (pin những files này)

Modified: `backend/internal/core/domain/matter/filing.go` · `core/port/filing.go` · `core/service/filing_service.go` · `adapter/inbound/productapi/{filing_handlers.go,filing_dto.go,server.go}` · `adapter/inbound/productapi/filing_server_test.go` · `adapter/outbound/postgres/matter_test.go` · `adapter/outbound/repotest/mattercontrol/contract_memory_test.go` · `frontend/src/features/filings/{schemas.ts,repository.ts,labels.ts}` · `frontend/src/app/(app)/matters/[matterId]/filings/[filingId]/page.tsx` · `frontend/src/features/filings/components/filing-ui.test.tsx`.
New (untracked): `backend/internal/core/domain/matter/filing_preflight.go` + `filing_preflight_test.go` + `filing_preflight_perf_test.go` · `repotest/mattercontrol/contract_preflight.go` · `frontend/src/features/filings/components/preflight-panel.tsx`.

## 3. Independent verification checklist (mỗi mục: verdict + evidence path trong report của bạn)

- **V1 — Baseline re-pin (PF-DEP-02)**: tự verify 4 guard files (`filing.go`, `evidence.go`, `workview.go`, `filing_service.go` region) byte-identical với commit `978d8fc` TRỪ các hunk của implementation này (`git diff 978d8fc -- <files>`). Bind kết luận của bạn vào bytes hiện tại; source-continuity không thay thế re-verify.
- **V2 — Guard parity**: đọc `git diff HEAD -- internal/core/domain/matter/filing.go`. Verify refactor `ProofGapsOf` giữ nguyên behavior: refusal codes/messages byte-identical mọi tổ hợp reachable (PackageUndeclared precedence; SigUndeclared/SigMissing mutually exclusive), không gate bị nới, không test cũ bị sửa assertion. Nếu tìm thấy bất kỳ khác biệt observable → P0.
- **V3 — Pin test quality**: truth table trong `filing_preflight_test.go` — expected values có độc lập không (không tautology/recompute-từ-code); negative control (`TestPreflightReadyDoesNotClaimFullSubmittability`) có thật không; DISPUTED subtest pin cả display-state lẫn guard.
- **V4 — Hidden denial & authz**: service trả ErrNotFound uniform cho non-member VÀ foreign/non-filing (D-21); HTTP ghost=403 theo convention sibling, non-filing=404; không existence leak nào mới引入. Kiểm tra cả hai stores (memory + PG).
- **V5 — Wire contract (D-22)**: DTO không chứa display strings từ server; `CriterionID` rỗng cho non-criterion rows (không bao giờ fabricated); `WaiverRationale` nguyên văn từ waiver record; `Link` reserved nil — FE tự dựng link nội bộ từ context.
- **V6 — OUTCOME never blocking**: verify trong CODE (không chỉ test) rằng không đường nào cho OUTCOME row Blocking=true (BF-01).
- **V7 — Gates rerun** (chạy lại, ghi exact command + exit + UTC): backend `MC_TEST_DATABASE_URL="postgres://mattercontrol:mattercontrol@localhost:5433/mattercontrol?sslmode=disable" go test -race -count=1 ./...` (expect 804+) · `golangci-lint run ./...` · FE `pnpm check` (expect 922+, EXIT=0) · `pnpm build` · `pnpm build-storybook` · `go test ./internal/core/domain/matter/ -bench BenchmarkPreflightOf100Criteria -run XXX`. PG fixture: docker container `mc-preflight-pg` đang giữ ở port 5433; nếu đã bị xóa: `docker run -d --rm --name mc-preflight-pg -e POSTGRES_USER=mattercontrol -e POSTGRES_PASSWORD=mattercontrol -e POSTGRES_DB=mattercontrol -p 5433:5432 postgres:16-alpine`.
- **V8 — FE source check**: `PreflightPanel` — mọi status có cause text (không badge trần), vi/EN parity (vi nhãn DRAFT chờ R10 — đánh dấu có không), keyboard reach, không màu-only, Solid Glass tokens, 0 dependency mới, panel không claim "nộp được" (D-20: "Sẵn sàng về bằng chứng").
- **V9 — Self-review fixes**: 3 AUTO-FIXED trong return.md là thật trên bytes hiện tại.
- **V10 — Your call (E-7)**: size-logging >200 rows deferred — REQUIRE (P2) hay ACCEPT defer? Quyết định thuộc về bạn, không phải author.
- **V11 — NOT_RUN honesty**: browser E2E / screen-reader / M1–M5 script / end-to-end p95 — confirm return.md không tự gán DONE cho các mục này; M1–M5 script chưa tồn tại là đúng theo intake.

## 4. Constraints

- **Reviewer-only**: KHÔNG sửa bất kỳ source/docs file nào của author; KHÔNG commit/push; KHÔNG đụng task record của Codex; KHÔNG bật stack/IdP. Chỉ đọc + chạy tests/builds (read-only verification) + viết report.
- Không bypass Mimosa/hooks; lệnh bị chặn → ghi nhận refusal, không retry vòng quanh.
- Evidence dir của bạn: `docs/reviews/preflight-opencode-impl-review-20261103-r1/` (report.md + sha256 manifest + commands.log). Ghi mỗi probe: tool/version, timestamp UTC, exact command, exit, output location.

## 5. Output

Report kết thúc bằng verdict **một trong**: `PASS` / `PASS_WITH_LIMITATIONS` (liệt kê limitations + NOT_RUN còn mở) / `CHANGES_REQUIRED` (findings P0..P3 kèm file:line + fix đề xuất) / `BLOCKED` (lý do + điều kiện unblock). Đề xuất disposition cho task: READY-for-signoff hay REWORK. Codex sẽ chuyển verdict của bạn vào task record — bạn không tự sửa task.

Skills gợi ý: `review`, `go-code-review`, `go-test-quality`, `qa-only`.
