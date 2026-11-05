# Claude Code — consume verified Design R9 and continue the full P0 assignment

Tiếp tục **phiên implementation MC-P0-CLAUDE-TAKEOVER / MC-P0-ZCODE-EXECUTION hiện tại**, làm cả backend/API/frontend. Đây là input addendum cho plan dài đang chạy, không phải restart, task review-only hoặc gate xin duyệt sau từng wave.

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, reference HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`. Working source uncommitted; recheck actual checkpoint và preserve tiến độ hợp lệ. Tuân thủ root/component rules và safety hiện hành. Không đổi owner hay overwrite writer khác.

## 1. Consume final R9 thay cho checkpoint cũ

Đọc đầy đủ `docs/reviews/p0-design-r9-final-intake-20261027.md`, rồi verify:

- `docs/design/p0-handoff-r9/return.md`: **12,863 B**, SHA-256 `d4dc769f1958f486a17a9a90fa5b1060de3172a2b07b544c6f1adff788b14b3d`.
- `docs/design/p0-handoff-r9/manifest.json`: **20,096 B**, SHA-256 `2b68bc92431270dc456111590ca1de2231e2a10dba95829dccd0a3b68ba87563`.
- Manifest: **102 payloads / 992,101 B**, no missing/extra/duplicate paths; excludes manifest/return to avoid cycles. Validate relevant consumer files before consumption.
- Contract read at intake: revision 6, **28,248 B**, SHA-256 `3e89654f0fabdac877e311fa59cccc9a026b13fe0265102150095119e68d665d`. Nếu implementation của chính bạn đã tiến hợp lệ, reconcile delta và ghi actual revision/hash; không rollback contract/source về pin này.

Consumer input gồm current spec, design delta, `zcode-handoff.md` (legacy filename; actual consumer là Claude), matrix/CSS/prototype/supporting source và findings/validation. Manifest-verified không có nghĩa visual/security acceptance. Ghi một consumption checkpoint vào **workboard hiện có**, giữ lịch sử R2–R8 và prior source authorship.

## 2. Áp dụng behavior thật, không copy fixture enforcement

- R8-N01: đúng scoped access-loss boundary purge protected draft/selection/preview/intent; revoke→regrant không hồi sinh dữ liệu; read-preserving downgrade và scope không bị ảnh hưởng không bị global-clear. UNKNOWN/readback-lost không biến thành resend/success/rollback.
- R8-N02: form intent theo identity/Workspace/Matter/document; giữ qua navigation/locale/render khi còn quyền, không bleed giữa contexts; expected-current và acknowledgment gắn đúng revision/target/impact.
- R8-N03: promotion target riêng expected-current guard, reason/impact acknowledgment rõ; missing/current/stale cases đúng; OWNER-only promotion, EDITOR add-version, VIEWER scoped read. Design packet ghi wire DEPENDENCY_PENDING không phải lý do để bỏ P0: đến W3, hoàn thiện versioned contract/backend/API/FE promotion thật trong approved product scope và test concurrency/rights/bytes/version references.
- Giữ Enterprise Precision, Comfortable/Compact, EN/VI legal content, Lucide và Atomic/features patterns. Causal Back/context, My Actions phân loại, truthful error/empty/unavailable/UNKNOWN states vẫn bắt buộc. Không sao chép local prototype actor/evaluator thành authorization hoặc giả persistence.

## 3. Reconcile 409 theo operation, giữ CAS và UNKNOWN đúng

R9 canonical checker còn exit 1 vì assertion global `"409" not in contract`. Codex đã xác định rev 6 §2.3 thêm `409 urn:mc:rejected` cho work-graph guarded refusals, trong khi CAS vẫn 428/412. Không sửa backend bỏ 409 chỉ để check design xanh; cũng không đổi mọi stale edit thành 409.

Trong owned product source/contract/tests của bạn, bảo đảm:

1. Missing required precondition → 428; stale ETag/revision → 412 với draft/rebase phù hợp, không force overwrite.
2. Explicit work-graph guarded rejection → 409 + typed code/allowed alternatives/failed gates/cycle path theo actual contract và safe visibility. Present đúng actionable reason, không generic “someone edited this”, không optimistic success hoặc automatic retry. Backend chứng minh refusal không mutate domain data/event success.
3. Idempotency-key misuse và other validation giữ đúng catalogue; UNKNOWN do mất response không bị nhầm thành một guarded rejection đã xác nhận. Receipted vs nonreceipted recovery tiếp tục đúng CW1-F01/F02.
4. Có boundary/client/component regression phân biệt các trường hợp, quyền foreign/revoked, lost/truncated response và no-second-mutation. Reuse existing tests/helpers thay vì tạo abstraction mới.

Giữ pinned R9 read-only; sửa global checker thuộc design owner/phạm vi correction riêng. Trong final evidence ghi rõ **known nonbrowser design-check gap**, không gọi “all green/only browser blocked”. Actual emitted result là **30 pass + 1 fail**, không phải narrative 31/32. Đây là reporting erratum, không thêm một implementation defect mới.

## 4. Đi tiếp toàn bộ BE+FE, không dừng ở design intake

Tiếp tục `MC-P0-CLAUDE-CONTINUE-W1-FIXES-TO-FULL-P0-PROMPT.md` và full execution plan hiện tại: xác nhận CW1-F01..03 đã sửa → hoàn thiện W2 work graph/Grid → W3 documents/proof → W4 Filing → W5 Control Room/context → W6 bulk/import/export/brief → W7 stabilize/full GWs/restore. Dùng thứ tự dependencies của plan, không ordering cũ trong design handoff.

Mỗi slice cần BE behavior/API/real FE/persistence/history/readback và meaningful negatives. Source còn thiếu thì tiếp tục implement. Browser/IdP/human-study/security/production blockers tách riêng và không chặn source độc lập; không bypass hoặc tự cấp quyền đọc admin secrets. Không stage/commit/scan retry/merge/deploy, mutate unrelated DB/volume/resource hoặc sửa design package/evidence.

Tự test/sửa, cập nhật cùng workboard và một `final-return.md` của assignment với exact source/diff/contract/design manifests, 20 FR/63 AC/14 NFR/3 original GW coverage, actual commands/logs/UTC/exits/hashes và remaining blockers. Không dừng xin “tiếp tục” sau intake hay từng wave; không self-DONE/ACCEPTED/MC-002 closure/Step03B/release approval. Chỉ báo full code complete khi cả backend/API/frontend đủ và applicable evidence đúng; thiếu code vẫn PARTIAL_IMPLEMENTATION.

**Consume R9 final ngay trong checkpoint hiện tại, reconcile operation-specific errors rồi tiếp tục hoàn thành sản phẩm P0. Không cần thêm một vòng design rewrite hay chờ independent visual acceptance để làm phần source độc lập.**
