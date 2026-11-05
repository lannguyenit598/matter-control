# MC-PREFLIGHT-01 — Implementation return (r1, 2026-11-03)

> **STATUS UPDATE 2026-11-04 — Independent review RECEIVED**: OpenCode (nonauthor, evidence-only) trả **PASS_WITH_LIMITATIONS · READY-for-signoff**, bound to sha256 pin 19/19 (`docs/reviews/preflight-opencode-impl-review-20261103-r1/`). Gates rerun độc lập EXIT=0 (race 805 PASS, lint 0, FE 922, build+storybook, bench 341µs/267KB/644 allocs — memory/allocs khớp claim, time trong variance; V7 flake DNS-env L1 đã resolve bằng rerun). P3-only findings **deferred to author's next touch — bytes PINNED, không fix ngay**: F1 dead helper `satisfied` (filing_preflight_test.go:63-66), F2 aria-label EN-only (preflight-panel.tsx:91); F3 E-7 defer ACCEPTED bởi reviewer. Mọi sửa trên 19 files từ giờ = drift → re-pin + re-review delta theo prompt §0.3. NOT_RUN (browser/screen-reader/M1–M5/p95 end-to-end) vẫn mở, không inferred.

- **Actual agent**: ZCode (PO chat-reroute 2026-11-03: "từ task đã duyệt … dùng các skills cần thiết để implement" — tiếp quản execution từ "Local Codex (queued)" theo tiền lệ PO-reroute; Codex giữ coordination, OpenCode giữ independent reviewer)
- **Base**: `6172f234` (post-RLF curated baseline, PF-DEP-01 thỏa; guard files byte-clean vs 978d8fc đã verify đầu session) · **Head**: uncommitted working tree (KHÔNG commit — chưa được authorize)
- **Scope**: design `docs/implementation/plans/MC-ZCODE-PREFLIGHT-DESIGN-20261103.md` §4/§6 — read-only proof-readiness read model, 1 endpoint, 1 panel. Không migration, không SQL mới, không dependency mới.
- **TDD**: 4 seam RED→GREEN đúng thứ tự (domain truth-table → store contract memory+PG → HTTP → FE panel).

## Changed files (base 6172f23)

Modified (14): `backend/internal/core/domain/matter/filing.go` (tách `ProofGapsOf` shared predicate, guard tái dùng — refusal messages byte-identical, pinned bởi test cũ) · `core/port/filing.go` (+Preflight) · `core/service/filing_service.go` (+Preflight, một snapshot `readGraph`) · `adapter/inbound/productapi/{filing_handlers.go,filing_dto.go,server.go}` (route `GET /matters/:id/filings/:filingId/preflight` + DTO) · test files: `filing_server_test.go`, `postgres/matter_test.go`, `repotest/.../contract_memory_test.go` · FE: `filings/{schemas.ts,repository.ts,labels.ts}`, filing `page.tsx`, `filing-ui.test.tsx`.
New (5): `domain/matter/filing_preflight.go` (+2 test files, +1 benchmark) · `repotest/.../contract_preflight.go` · `frontend/src/features/filings/components/preflight-panel.tsx`.

## Acceptance (PF-AC matrix)

| # | Kết quả | Bằng chứng |
|---|---|---|
| 01 scope/no-side-effects | PASS | Read-only qua `store.View`; không FilingTx/receipt/event; không write route mới |
| 02 one authorized snapshot | PASS | `readGraph` một snapshot; hidden denial non-member; `Revision` từ cùng snapshot |
| 03 E-1 missing-PACKAGE failing-first | PASS | RED đã ghi nhận trước khi implement; truth-table case Z-F-01 + contract case |
| 04 E-2..E-5 | PASS* | Retired PACKAGE loại; retired SIGNATURE → WAIVED; OWNER waiver round-trip rationale verbatim (cả 2 stores); pending-assessment blocking; *DISPUTED display-state mapping implemented nhưng chưa có test dedicated (gap ghi cho reviewer) |
| 05 E-6/E-7 | PASS* | Uniform hidden denial (404 non-member = 404 missing, service-level; HTTP: ghost=403 theo convention sibling, non-filing=404); *E-7 >200 dòng: không paginate theo design, log cảnh báo chưa làm (gap nhỏ, ghi rõ) |
| 06 guard-alignment pin | PASS | Truth-table 8 cases: `Ready` ↔ `DecideAdvance` refusal code cả hai chiều + negative control (Ready=true nhưng guard vẫn từ chối `reference-required`) |
| 07 API/error contract | PASS | Envelope flat + provenance headers `MC-As-Of`/`MC-Source-Revision` (theo convention thật của app — design sketch `{data,meta}` điều chỉnh theo thực tế, không đổi meaning) |
| 08 FE | PASS | Panel 3 nhóm purpose, chip có chữ + cause sentence, waiver rationale verbatim, link blocking rows, as-of line; page render server-side (revalidation theo pattern page hiện có) |
| 09 language/a11y | PASS* | EN canonical + vi DRAFT pairs (đánh dấu R10 trong labels.ts); links native focusable; *screen-reader smoke NOT_RUN |
| 10 gates | PASS | Backend: `go test -race ./...` với PG fixture = **804/804** (21 pkgs) · gofmt clean · `go mod tidy -diff` ok · sqlc-check ok · golangci-lint **0 issues** · FE: `pnpm check` **EXIT=0** (typecheck+lint+format+**922 tests**+agents) · `pnpm build` EXIT=0 (CSS verified) · `build-storybook` EXIT=0 |
| 11 perf (PF-AC-11) | DONE | `BenchmarkPreflightOf100Criteria` = **682µs/op** (100 criteria: 60 PKG + 30 SIG accepted + 10 OUT pending; Apple M4; 5000 iterations) — ~293× dưới ngân sách p95<200ms. Scope: computation thuần; end-to-end cộng thêm chi phí `readGraph` chung với mọi lần đọc filing |
| 12 independent/rendered | NOT_RUN | OpenCode review + browser + screen-reader + M1–M5 usability script (chưa soạn) — vẫn mở, không inferred |

## Infra

- PG fixture: docker container `mc-preflight-pg` (postgres:16-alpine, port 5433) — **GIỮ LẠI cho reviewer** rerun contract; xóa bằng `docker rm -f mc-preflight-pg`.
- Không đụng compose/stack/ZITADEL; không commit/push/deploy.

## Author self-review (2026-11-03, skills: review + go-code-review + go-test-quality)

> **Phạm vi**: author self-review (pre-review pass) — KHÔNG thay thế independent review của OpenCode.

**Pre-Landing Review: 3 issues (0 critical, 3 informational — all AUTO-FIXED)** · go-code-review verdict: **APPROVE** (sau fixes)

- **AUTO-FIXED** `[filing_preflight_test.go]` DISPUTED không có dedicated test → thêm subtest `a disputed acceptance reads DISPUTED and still blocks like the guard` (fixture `set.Disputes` tái dùng từ AC-157; pin cả display state lẫn guard-alignment cùng fixture)
- **AUTO-FIXED** `[filing.go:272-277]` Doc drift: comment retired-SIGNATURE-waiver bị mất khỏi guard khi refactor → đưa vào doc comment của `ProofGapsOf`
- **AUTO-FIXED** `[filing_preflight_perf_test.go]` `for b.N` + thiếu ReportAllocs (go 1.26) → `for b.Loop()` + `b.ReportAllocs()`; benchmark giờ công bố allocs: **328µs/op · 267KB · 644 allocs** @ 100 criteria
- **NEEDS INPUT (deferred, khuyến nghị defer)** `[filing_service.go]` E-7 size-logging cho >200 rows chưa làm — diagnostic nicety; design ghi "reopen nếu chạm ngưỡng"; để OpenCode quyết khi review
- **Gate Integrity**: gstack-gate-diff helper UNAVAILABLE (script vắng) — missing coverage ghi nhận; kiểm tra thủ công: mọi test hunk đều additive, không assertion bị nới, guard refactor giữ byte-identical refusal messages (cấu trúc: SigUndeclared/SigMissing mutually exclusive + pin tests cũ pass). APPROVAL_CLASS: không có declaration trong repo.
- **Sideways sweep (enum completeness)**: wire enums mới (kind/state/purpose) traced qua DTO↔domain↔FE schema/labels/cause — đủ 5 states × 3 kinds; không consumer ngoài diff.
- **Pass 1 CRITICAL (SQL/Race/LLM/Shell/Enum/Gate)**: no findings — read-only qua một snapshot `store.View`; không SQL; enums traced.
- **Revalidation post-fix**: go vet ✓ · gofmt clean · golangci-lint 0 issues · domain+repotest+productapi preflight suites ✓ · race trên 3 pkgs ảnh hưởng ✓ · benchmark rerun ✓. FE không đổi bytes sau lần chạy xanh (vitest 30/30, tsc 0, build, storybook) — giữ nguyên evidence.

## Skipped & remaining risk

- NOT_RUN: browser E2E, screen-reader, M1–M5 script, commit (chưa authorize), p95 end-to-end (chỉ đo computation).
- Gaps đã khai: E-7 size-logging; DISPUTED dedicated test.
- Rủi ro kế thừa: nhãn vi DRAFT chờ R10; OpenCode re-pin guard bytes trên baseline mới chưa làm (PF-DEP-02 — guard files byte-clean vs 978d8fc là continuity, không phải re-verify mới).
- Đề xuất status task: **AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW** (Codex cập nhật task record — tôi không đụng file của Codex).
