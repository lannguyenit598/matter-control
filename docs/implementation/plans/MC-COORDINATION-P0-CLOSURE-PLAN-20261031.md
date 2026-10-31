# MC-COORDINATION-P0-CLOSURE-PLAN-20261031 — Plan điều phối đóng gói P0

> **Trạng thái thực thi (cập nhật 2026-10-31 ~16:55Z bởi coordinator):** PO đã phê duyệt decision batch **4/4** (commit/re-pin, D-9, D-2, D-1(b)) — record trong `docs/implementation/workboard-findings.md` §0. CO-01 DONE (register materialised) · CO-02 DONE (orphan mcapi @18082 stopped; port audit sạch) · CO-05 prompt đã soạn · **3 prompt dispatch đã soạn**: `MC-ZCODE-P1-FIX-WAVE-20261031-PROMPT.md` (CO-03+CO-06..12, ZCode), `MC-OPENCODE-VERIFY-WAVE-20261031-PROMPT.md` (CO-13/14 — KHÔNG thể chuyển cho ZCode vì xung đột độc lập), `MC-CLAUDE-ADR006-FINAL-RETURN-20261031-PROMPT.md` (CO-05). Còn chờ: deploy-readiness session confirm freeze (chưa có ghi mới apps/** kể từ 16:30Z — tín hiệu tốt) → fix-wave session chạy CO-03 (commit baseline + contingency Mimosa git-gate) rồi CO-06..12.

- Điều phối: actual ZCode theo chỉ định trực tiếp của PO ("zcode đóng vai người điều phối"), 2026-10-31. **Plan là đề xuất điều phối: mọi approval product/architecture/cost/release vẫn thuộc PO; commit/push vẫn cần PO; independent verification vẫn thuộc OpenCode.** Vai orchestrator danh nghĩa của Codex được tôn trọng: Codex intake phê duyệt plan này hoặc PO phê duyệt trực tiếp.
- Nguyên tắc bất di bất dịch: single-writer mỗi vùng file; không DONE khi thiếu reviewer độc lập; evidence theo namespace + manifest hash; không reopen positioning; không bỏ qua gate.

## 1. Trạng thái đầu vào (chốt tại 2026-10-31T16:30Z)

### 1.1 Năm return đã nộp (đều LOCAL/RETURNED, KHÔNG cái nào là acceptance)
| Return | Trạng thái đề xuất | Kết quả lõi | Cổng còn |
|---|---|---|---|
| Deploy-readiness (WP-1..10) | LOCAL_CANDIDATE / IN_REVIEW | gates exit 0 (backend PG+race 14pk, FE 822/12, builds, durable 14/14); PI-01..04 remediated local | OpenCode 15-case packet; D1–D8/B3/D4 |
| BA flow r1 | BA_REVIEW_RETURNED | GW-01..03 live ≈150 calls; 7×P3; 18/20 | OpenCode independent |
| BA flow r2 | BA_REVIEW_RETURNED | 570 calls; 19/20 trap live; **3×P2 mới (Z-F-01..03)**; 7/3 BF dispositions; 18/20 khớp r1 | OpenCode independent; PO D-9 |
| UX audit | UX_AUDIT_RETURNED (đề xuất) | 22/22 route rendered; 3 Blocker (L-01 title, L-02 locale, L-03 enablement); 52 contrast đo | OpenDesign/PO review; D-1..D-6 |
| OpenCode portability | LOCAL_PARTIAL_PASS | 6/12 PORT PASS; PI adjudication; drift refusal | Re-pin rồi 6 PORT case + TTL 30s rerun |

### 1.2 Defect/finding đang mở (register union — nguồn chân lý duy nhất)
| ID | Mức | Nội dung gọn | Owner sửa | Cần trước |
|---|---|---|---|---|
| Z-F-01 | P2 DEFECT | Filing proof-required nộp được với package rỗng (guard đếm criterion không phân biệt purpose) | Backend primary | D-9 PO amendment |
| Z-F-02 | P2 GAP | Không có criterion-kind signature; gate chữ ký nhận bất kỳ criterion đã thỏa | Backend primary | D-9 |
| Z-F-03 | P2 GAP | `outcomeVerification: NOT_DECLARED` không lộ trên Grid/Control Room | Backend primary + FE | contract note |
| UX-L-01 | Blocker | `/workspaces` title sai "Matters/Hồ sơ" (workspaces/page.tsx:15,21) | FE primary | none |
| UX-L-02 | Blocker | Locale kẹt EN máy chủ (nội dung trang không phản ứng ngôn ngữ; `lang` vi–text en) | FE primary | D-2 (cookie locale) |
| UX-L-03 | Blocker enablement | Không có đường populated chuẩn (BA r2 chứng minh đường stub-IdP + backend khả thi) | Coordinator + PO D-1 | D-1 |
| UX-L-04..06 | Major | Trộn ngôn ngữ; fail-state mất context; Storybook crash từng phần | FE primary | none |
| UX-L-07..11 | Minor/Polish | metadata title; aria-live; border 3:1 trên kính; dev-streaming risk (prod NOT_VERIFIED) | FE primary | P-13 verify prod |
| r1 P3 ×7 | P3 | bulk-preview shape doc, questionRevision doc, workspace role vocab, 3 UX friction, OUTCOME_UNKNOWN drill | doc owners / verify | — |
| r2 P3 ×4 | P3 | 400-trước-403 receipted; stale If-Match → 403; WAITING cần PATCH riêng; drill NOT_VERIFIED | adjudicate tại intake | — |
| PI-01..04 | P2/P2/P1/P3 | Đã remediate local (WP-1/4/5/8) — **chưa được OpenCode test trên byte pin** | OpenCode rerun | CO-03 re-pin |

### 1.3 Session registry (ai đang cầm bút — cập nhật 16:30Z)
| Session | Trạng thái | Ghi chú |
|---|---|---|
| Deploy-readiness | RETURNED nhưng **tree có file apps/** đổi trong 60 phút qua** (mcbffcleanup, pending-ceiling, data-transfer tests) — phải confirm "đã xong hẳn" trước freeze | 3 container 28719–28721 giữ cho reviewer |
| BA r1 | DONE | **1 orphan: mcapi PID 26496 @18082 còn listening — cần stop** |
| BA r2 | DONE, đã tự dọn runtime | — |
| UX audit (session này) | DONE | runtime đã tắt; incident css-3000 CLOSED (self-healed) |
| OpenCode | DONE (portability delta) | chờ re-pin để chạy phần còn lại |
| Claude Code | **final return CHƯA có** → 24 FINAL case PENDING | cần PO dispatch |

**Kết luận điều phối: CHƯA đóng băng được** — phải có CO-01 xác nhận trước.

### 1.4 Tree
HEAD `0de3e5d` (không đổi từ đầu), dirty **206 entries** (179 lúc audit xong → +27 gần đây). Chưa commit gì. Mọi verdict mới đều phải sau re-pin.

## 2. Phases & công việc chi tiết

### Pha 0 — Intake & Freeze & Pin (1–2 ngày) — *mở đường cho mọi thứ*
| ID | Việc | Owner | Phụ thuộc | AC quan sát được | Effort |
|---|---|---|---|---|---|
| CO-01 | Codex intake 5 return vào workboard; materialise findings register (union bảng 1.2) thành file chung `docs/implementation/workboard-findings.md` | Codex | — | Register có state cho từng ID (OPEN/FIX_IN_PROGRESS/FIXED_PENDING_VERIFY/CLOSED_VERIFIED) | S |
| CO-02 | Stop orphan mcapi @18082 (PID 26496); kiểm kê toàn bộ listener/port map vào workboard | Codex | — | `lsof` sạch các port task; container reviewer giữ nguyên | S |
| CO-03 | **Freeze protocol**: từng session owner xác nhận "done, không còn ghi apps/**" (bắt đầu từ deploy-readiness — mtime mới nhất <60ph); sau confirm → commit/re-pin candidate KÈM findings register (Z-F-01/02 ghi là known-defect); PO phê duyệt commit | Codex + PO + session owners | CO-01 | Commit HEAD mới; manifest re-pin 37+ file; findings register đi cùng commit message | M |
| CO-04 | **PO decision batch #1** (chặn đường): (a) duyệt commit/re-pin; (b) **D-9**: state-semantics purpose-typing criterion (package/signature) cho Z-F-01/02; (c) D-2 cookie locale; (d) D-1 enablement (khuyến nghị: phương án (b) — đóng gói env stub-IdP + backend đã được BA r2 chứng minh); (e) 6 PROVIDER case: cấp hay giữ NOT_AUTHORIZED | PO | CO-01 | Biên quyết định ghi vào decision register, mỗi mục có date + scope | S |
| CO-05 | Claude final return dispatch (mở khoá 24 FINAL readiness case) | PO → Claude Code | — | 24 case có trạng thái mới | S |

### Pha 1 — Sửa defect & blocker (3–6 ngày) — *code wave trên byte đã pin*
| ID | Việc | Owner | Phụ thuộc | AC | Effort |
|---|---|---|---|---|---|
| CO-06 | Z-F-01/02: purpose-typing criterion cho package/signature gates — red-green với repro filing F của r2; update state-semantics doc theo D-9 | Backend primary | CO-03, CO-04(b) | Filing không package → chặn ở PACKAGE_PREPARATION; 0 chữ ký → chặn submission (proof-required); test r2 chạy lại xanh | M–L |
| CO-07 | UX-L-01 title fix + metadata theo route (P-01/P-08) | FE primary | CO-03 | H1/tab title = "Không gian làm việc/Workspaces" | S |
| CO-08 | UX-L-02: locale server-readable (cookie) — design note 1 trang (tác động Cache Components) rồi implement; chạy lại probe timeline 22 route trên prod build | FE primary | CO-03, CO-04(c) | H1 vi ngay t=0 trên prod build; 0 màn kẹt EN; `lang` khớp text | L |
| CO-09 | UX-L-04/05: ReadFailure context variant + i18n sweep ~21 literal + error.tsx + search-picker | FE primary | CO-03 | 0 chuỗi EN trong vi-mode (grep + screenshots); fail-state giữ breadcrumb/section name | M |
| CO-10 | Storybook crash fix (router decorator) + GlassSurface stories; `build-storybook` vào CI gate | FE primary | CO-03 | 58/58 stories render; addon-a11y chạy | M |
| CO-11 | Z-F-03: lộ `outcomeVerification` trên Grid/Control Room read models (kèm contract note) | Backend primary + FE | CO-03, CO-04(b) | Grid/CR hiện đúng NOT_DECLARED/PENDING/VERIFIED per-axis | M |
| CO-12 | **Gates re-run trên byte cuối wave**: backend make check (PG+race), FE check+builds, UX probe suite, contrast script, durable 14/14 | Primary writers | CO-06..11 | Toàn bộ exit 0; receipts vào namespace của từng fix | M |

### Pha 2 — Independent verification wave (2–4 ngày, sau commit Pha 1)
| ID | Việc | Owner | Phụ thuộc | AC | Effort |
|---|---|---|---|---|---|
| CO-13 | OpenCode: 15-case independent-review-packet (deploy-readiness) + non-author eyes cho B1 sync-guard + 2 structural test changes | OpenCode | CO-03 | 15/15 case có verdict + receipt | M |
| CO-14 | OpenCode: rerun PORT-02/03/04/05/10/11 + TTL 30s (PI-01 closure) trên byte pin; verify Z-F-01/02 fix bằng repro r2; reproduce UX-L-02 probe trước/sau fix | OpenCode | CO-03, CO-12 | PORT 12/12; PI-01..04 CLOSED_VERIFIED; Z-F fix xác nhận | M |
| CO-15 | OpenDesign: review chuyên môn improvement-plan + terminology D-3 + UX blockers (vai UI/UX owner — audit của ZCode cần owner review) | OpenDesign | CO-01 | Disposition từng P-item | S–M |
| CO-16 | Cập nhật 82-case master; chốt lộ 2 PARTIAL (AC-137 → Pha 3; keyboard/200-row → CO-12 kèm runtime) | Codex | CO-14 | Master không còn case ORPHAN | S |

### Pha 3 — Enablement & kiểm chứng với luật sư (1–2 tuần lịch)
| ID | Việc | Owner | Phụ thuộc | AC | Effort |
|---|---|---|---|---|---|
| CO-17 | Thực hiện D-1 theo lựa chọn PO (đóng gói walkthrough env + tài liệu + banner demo) | Backend/FE primary | CO-04(d), CO-08 | PO/luật sư tự chạy được env theo 1 trang hướng dẫn | M |
| CO-18 | UX Pha 1: terminology áp dụng (D-3), provenance adjacency checklist trên màn populated | FE primary | CO-17, CO-15 | Checklist provenance từng màn proof/review/filing PASS | M |
| CO-19 | **Usability trials** (usability-test-plan.md): tuyển 5–8 luật sư, 6 phiên, metrics AC-137-style ≥4/5 trong 10s; 0 hiểu sai completed≠verified/receipt≠approval | PO + moderator | CO-06..09, CO-17 | Báo cáo trial + cập nhật plan | L (lịch) |

### Pha 4 — Provider reality (song song khi PO sẵn sàng)
| ID | Việc | Owner | Phụ thuộc | AC | Effort |
|---|---|---|---|---|---|
| CO-20 | Provider qualification: verify pooler client limits (docs 404 → kênh khác), IAM negative tests thật (đóng PI-02 hẳn), smoke deploy staging per runbook | Codex/DevOps + OpenCode verify | CO-04(e) | Provider cases rời NOT_AUTHORIZED; evidence thật | M |
| CO-21 | 24 FINAL readiness case chạy trên final return của Claude | OpenCode | CO-05 | Master 82 case đủ verdict | M |
| CO-22 | B3 rate-admission: PO quyết theo brief → build nếu duyệt (D4) | Backend primary + PO | CO-04 | Decision logged; nếu build → tests | M |
| CO-23 | CI thật lần đầu (actions đã pin); quyết actionlint (cài hay thay) | Codex | CO-03 | CI green trên commit pin | S |

## 3. Decision register (PO cần chốt — gom một chỗ)
| # | Quyết định | Đề xuất của coordinator | Chặn việc |
|---|---|---|---|
| 1 | Commit/re-pin candidate (kèm known-defects register) | Commit — giữ dirty tree lâu là rủi ro drift đã thấy | CO-03, mọi verdict mới |
| 2 | D-9 purpose-typing criterion (Z-F-01/02) | Duyệt amendment + fix | CO-06 |
| 3 | D-2 cookie locale | Duyệt | CO-08 |
| 4 | D-1 enablement | Phương án (b) — env stub-IdP + backend | CO-17 |
| 5 | D-3 thuật ngữ (Matter/Filing/Action, role badge vi) | Theo glossary | CO-18 |
| 6 | 6 PROVIDER case + cloud D1–D8 + B3/D4 | Theo cloud-activation-packet | CO-20..22 |
| 7 | D-7 trần 5 MiB pending import | Chốt số cuối | (WP-7 điều chỉnh nếu đổi) |

## 4. Risk register (điều phối)
1. **Drift lặp lại**: 3 lần hash-drift đã xảy ra; freeze protocol CO-03 là bắt buộc, không xử lý tình cảm.
2. Z-F-01/02 tồn tại trong candidate cho tới CO-06 — mọi demo/trial trước đó phải nói rõ.
3. UI-with-data chưa ai chứng minh (cả 2 attempt BA + UX) — chỉ đóng sau CO-08 + CO-17.
4. Runtime mồ côi/orphan: đã 1 case (18082); quy ước mới: mọi session teardown trong return của mình hoặc ghi rõ trong workboard.
5. Single-`.next`/single-writer violation: đã có sự cố CSS 500 (self-healed); quy tắc đã vào memory + plan này.
6. OPENCODE quota/tooling: nếu OpenCode unavailable → BLOCKED đúng quy tắc, không tự thay thế; PO reroute.

## 5. Non-goals
Không mở positioning; không thêm tính năng ngoài P0; không tự deploy; không tự phê duyệt; không chạy provider nếu chưa có CO-04(e); không "hợp lệ hoá" return của nhau — mỗi return cần reviewer riêng.

## 6. Lịch trình ước tính
Pha 0: ngày 1–2 · Pha 1: ngày 3–8 · Pha 2: ngày 8–12 · Pha 3: tuần 2–3 (lịch con người) · Pha 4: theo PO. **"Sẵn sàng thử nghiệm với luật sư thật" ≈ sau Pha 2 + CO-17, khoảng tuần 2–3**, với điều kiện PO batch #1 chốt trong 48h.
