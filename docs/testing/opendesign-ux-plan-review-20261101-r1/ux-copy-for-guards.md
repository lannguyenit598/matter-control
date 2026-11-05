# UX Copy cho Guard Z-F — Filing bị chặn vì thiếu package/chữ ký

- Tác giả: actual OpenDesign (UI/UX owner), 2026-11-01
- Context: Z-F-01 (package rỗng) và Z-F-02 (criterion không phải signature) — guard purpose-typing theo D-9 RATIFIED
- Nguyên tắc copy: (1) nói rõ vì sao chặn; (2) nói rõ cần làm gì; (3) giọng trung lập, không đổ lỗi; (4) nhất quán với fail-closed design (TB-12)

---

## 1. Z-F-01 — Filing proof-required nhưng package rỗng

**Trigger:** Luật sư cố nộp (submit) filing có `proof_required = true` nhưng chưa đính kèm bằng chứng nào (package rỗng).

### Copy — Inline validation message (hiện tại nút Submit)

**VI:**
> Chưa thể nộp — hồ sơ khai này yêu cầu bằng chứng. Vui lòng đính kèm ít nhất một tài liệu chứng minh trước khi nộp.

**EN:**
> Cannot submit — this filing requires supporting evidence. Please attach at least one document before submitting.

### Copy — Tooltip trên nút Submit (disabled state)

**VI:**
> Nộp: cần đính kèm bằng chứng

**EN:**
> Submit: evidence required

### Hành vi UX:
- Nút Submit **disabled** (not hidden — luật sư cần biết action tồn tại nhưng chưa đủ điều kiện)
- Validation message hiện inline dưới khu đính kèm, không phải toast/alert (vì action = contextual, không phải system-level)
- Message xuất hiện khi: (a) trang load với package rỗng, hoặc (b) luật sư xoá attachment cuối cùng
- Khi đính kèm ≥ 1 tài liệu → message biến mất, nút Submit enabled
- Screen reader: `aria-live="polite"` trên message container → SR announce khi message xuất hiện/biến mất

---

## 2. Z-F-02 — Filing yêu cầu chữ ký nhưng criterion không phải loại signature

**Trigger:** Luật sư cố nộp filing có requirement loại chữ ký (signature-required) nhưng criterion đính kèm không phải criterion-kind `signature`.

### Copy — Inline validation message

**VI:**
> Chưa thể nộp — hồ sơ khai này yêu cầu chữ ký hợp lệ. Bằng chứng đính kèm không phải loại chữ ký. Vui lòng đính kèm chữ ký đúng loại.

**EN:**
> Cannot submit — this filing requires a valid signature. The attached evidence is not a signature. Please attach the correct signature type.

### Copy — Tooltip trên nút Submit (disabled state)

**VI:**
> Nộp: cần chữ ký hợp lệ

**EN:**
> Submit: valid signature required

### Copy — Trường hợp có cả package rỗng VÀ sai criterion (Z-F-01 + Z-F-02 đồng thời)

**VI:**
> Chưa thể nộp — hồ sơ khai này yêu cầu bằng chứng và chữ ký hợp lệ. Vui lòng đính kèm tài liệu chứng minh và chữ ký đúng loại.

**EN:**
> Cannot submit — this filing requires supporting evidence and a valid signature. Please attach the required documents and correct signature type.

### Hành vi UX:
- Tương tự Z-F-01: nút disabled, inline message, aria-live
- Nếu cả 2 guard trigger → gộp thành 1 message (không hiện 2 message riêng lẻ — avoid message spam)
- Khi luật sư sửa lần lượt (thêm attachment, rồi thêm signature) → message cập nhật realtime theo guard còn lại

---

## 3. Pattern tổng quát cho future guards

```
[VI] Chưa thể [hành_động] — [lý_do_rõ_ràng]. [Hướng_dẫn_cụ_thể].
[EN] Cannot [action] — [clear_reason]. [Specific_guidance].
```

Nguyên tắc:
- Mở đầu "Chưa thể" (không phải "Lỗi" hay "Không được phép" — luật sư không làm sai, điều kiện chưa đủ)
- Lý do sau dấu gạch ngang — 1 câu
- Hướng dẫn — 1 câu, bắt đầu bằng "Vui lòng" (vi) / "Please" (en)
- Không dùng mã lỗi, ID, hoặc thuật ngữ kỹ thuật (criterion-kind, purpose-typing, guard)
- Giọng: trung lập → người dùng có thẩm quyền, hệ thống hỗ trợ
