# Brainstorm r3.1 — Recheck "Closing Readiness Certificate" theo ràng buộc "tính năng có sẵn + liền mạch" (2026-11-05)

- **Task**: kiểm tra lại đề xuất r3 với ràng buộc do PO đặt: mọi building block phải **đã có trong code** và feature phải **liền mạch** với flow hiện có (skill `brainstorm-ideas-existing`)
- **Owner**: ZCode (discovery cho PO) · **Status**: PROPOSAL (recheck của `brainstorm-ideas-20261105-r3.md`)
- **Phương pháp**: audit từng claim của r3 chống source thật @ main `28a205ee` — mỗi dòng có file:line

---

## 1. Verdict

**IDEA SURVIVES — nhưng spec v1 của r3 có 4 seams phải sửa trước khi intake.** Sau sửa, Certificate v1 là composition thuần của 4 read models đã có + 1 pipeline upload đã có — không phát minh semantics mới, không infra mới.

## 2. Bảng audit: claim r3 → code thật

| # | Claim r3 | Bằng chứng code thật | Verdict |
|---|---|---|---|
| 1 | Pre-flight per filing đã có | `filing_preflight.go`: `FilingPreflight`, `PreflightOf(f, it, set, asOf)` — deterministic projection, rows + links; route + `preflight-panel.tsx` | ✅ Đúng (pending independent review) |
| 2 | "Số liệu 5 state axes của matter" | KHÔNG có read model 5-axes matrix. Nhưng `ControlState` (controlroom.go:36) đã có matter-level: `Total, ByExecution, Blocked, Overdue, Critical, AwaitingProof, OpenFilings, NegativeFilings` | ⚠️ **S1**: trích `ControlState` verbatim, không claim 5-axes |
| 3 | "x/y criterion verified" matter-level | Không tồn tại; r1 đã loại rollup này khỏi scope | ⚠️ **S1b**: bỏ khỏi v1 — không invent rollup |
| 4 | "Gap còn lại" đã có | `ControlRoom.Gaps` (controlroom.go:71): `COMPLETED_UNVERIFIED / NO_CRITERIA / PROOF_DISPUTED / NO_OWNER / NEGATIVE_FILING_OUTCOME`; `Blockers[].Reasons + Upstream` | ✅ Đúng — dùng nguyên xi |
| 5 | Delta Brief deterministic | `GET /matters/:id/brief` (server.go:233); `replayBrief(events, t2)` — event-replay outstanding-at-t2, cửa sổ `(t1,t2]`; `brief_proof.go` replay decisions | ✅ Đúng, **mạnh hơn r3 viết**: as-of replay THẬT SỰ có cho brief — certificate pin `(t1=creation, t2=now)` y hệt |
| 6 | "Phát hành = event + receipt" | Receipts: `GET /operations/:key` (server.go:142); events append-only | ⚠️ **S2**: thêm event type "certificate issued" = mở rộng event schema — làm được theo pattern nhưng không free; v1 có thể thay bằng document version (xem S3) |
| 7 | RC-D3: "hash + receipt, KHÔNG lưu document version" | **Lỗi thiết kế**: không có as-of engine toàn cục → tái render sau khi state đổi ra nội dung khác; hash không tái tạo được artifact đã phát hành | ❌→ **S3**: lưu artifact bằng document version — pipeline có sẵn |
| 8 | (ngầm) lưu artifact ở đâu | Documents là **client-streamed upload** (`uploadVersion` evidence_handlers.go:203: `Body: c.Request().Body, MaxBytes, RequestHash`) — không có đường server-generated | ✅ Có lối: FE fetch certificate HTML → **upload làm document version** qua pipeline có sẵn → immutability + lineage + tab Documents, 0 code backend mới cho lưu trữ |
| 9 | Tên vi "Tờ trình Sẵn sàng Chốt" | terminology-final.md (ratified): **"Tờ trình" = loại Filing** ("Đơn" hẹp, "Tờ trình" hành chính nội bộ — badge Filing "Khai"); "Ready = Sẵn sàng" | ❌ **S4**: va chạm thuật ngữ đã phê duyệt — chọn vi label khác, qua R10 |

## 3. Spec v1 sửa lại (seam-free)

```
Certificate v1 = pure composition @ thời điểm phát hành:
  ├─ ControlRoom (đã có): ControlState figures + Gaps[] + Blockers[].Reasons/Upstream + NextActions ranked
  ├─ Brief(t1=matter creation, t2=now) (đã có): Outstanding[] + Changes[] trong cửa sổ
  ├─ Per-filing PreflightOf (đã có): mỗi filing mở 1 section readiness
  └─ Kết xuất: FE render HTML deterministically (print stylesheet)
Phát hành:
  ├─ FE upload HTML làm document version mới (pipeline upload + content-hash có sẵn)
  ├─ Event + operation receipt theo pattern hiện có (S2 — hoặc defer nếu PO muốn tối giản v1)
  └─ Artifact nằm ở tab Documents với lineage + provenance "Dữ liệu tại …"
```

- **S1/S1b**: không claim 5-axes matrix, không "x/y criterion verified" — chỉ statement các con số `ControlState` + `Gaps` + per-filing preflight **nguyên văn như app hiển thị** ("what you see is what you sign").
- **S3 (thay RC-D3 cũ)**: immutability = document version (có lineage, superseded semantics, listing) — KHÔNG hash-only. RC-D3 mới chỉ còn 1 lựa chọn hiển nhiên; default-if-silent: upload-version.
- **RC-D1 (format)**: đơn giản hóa — nội dung HTML là document version; in PDF = trình duyệt. Server-side PDF vẫn là v2.
- **S4 (vi label)**: ứng viên thay "Tờ trình Sẵn sàng": **"Kiểm soát sẵn sàng"** / "Bản kiểm soát sẵn sàng chốt" — quyết định cuối qua quy trình R10 (chưa duyệt thì UI dùng EN key + label tạm).
- **Điều kiện tiên quyết giữ nguyên**: pre-flight cần independent review PASS trước khi mount.

## 4. Re-rank top 5 dưới ràng buộc "có sẵn + liền mạch" (3 góc nhìn, nén)

| Hạng | Ý tưởng | Mount lên gì (đã có thật) | Sizing | Góc nhìn |
|---|---|---|---|---|
| 1 | **Readiness Certificate (sửa S1–S4)** | ControlRoom + Brief replay + PreflightOf + document-version pipeline | M | PM |
| 2 | **Preflight rollup trên Control Room** — ControlState thêm "filings đủ điều kiện nộp x/y" | ControlState + PreflightOf (loop các filing mở) | S | PM/Engineer |
| 3 | **Proof-at-a-glance chips** — chip `PACKAGE 2/3 · SIGNATURE ✓` trên dòng filing/work | PreflightOf rows + work view | S | Designer |
| 4 | **Cause-chain view** — "A ← B (owner X)" từ blocker | `Blockers[].Upstream + Reasons` đã có sẵn dữ liệu chain | S | Designer |
| 5 | **Drive-to-Close guided mode** — 1 việc một lúc | `NextActions` **đã ranked** + Gaps + Waiting | S–M | PM/Designer |

**Lưu ý quan trọng**: hạng 2–4 không phải đối thủ của hạng 1 — chúng là **các bước liền mạch dẫn tới hạng 1**. Lộ trình khuyến nghị: hạng 2 (S, landing độc lập) → hạng 3/4 (S, polish cùng đợt) → hạng 1 (M, mount lên đủ nền). Hạng 5 độc lập, làm song song khi có dư địa.

## 5. Assumptions cần validate (giữ nguyên từ r3, bổ sung 1)

1–4 như r3 (độ tin dữ liệu khi xuất; lawyer có cần artifact ngoài app; print-to-PDF đủ chưa; ranh giới pháp lý).
5. **(mới, từ S4)** vi label không va "Tờ trình" — test với bảng terminology R10.

## Governance

PROPOSAL discovery — không intake, không approval. Không mở positioning, không AI, không đổi baseline. Số liệu audit bám commit `28a205ee`; pre-flight vẫn AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW.
