# ✅ FORM VALIDATION

> **STATUS: ✅ SPEC.** **AI RULE:** Validate **đúng lúc** (không gắt khi đang gõ), message gắn field, đọc được bằng screen reader. Nguồn chân lý validate là zod ở ranh giới I/O (`Modules/1.Write.md` §3.4). Copy ở `Other/VoiceAndContent.md` §4.

---

## 1. Áp ở đâu (ReportSupporter)

| Bề mặt | Field | Nguồn |
| :--- | :--- | :--- |
| Metadata form | title (required), school, course, lecturer, members, (tuỳ) hạn nộp | `1.Write.md` §5.1 |
| Evidence link manager | url (đúng dạng URL), title, kind | `1.Write.md` §3, `3.Check.md` (`broken-evidence-url-shape`) |
| Cấu hình export | preset, toggle TOC/figures/tables | `4.Export.md` |

## 2. Quy ước thời điểm

```
đang gõ      → KHÔNG báo lỗi (không gắt)
blur / submit → validate
lỗi đã hiện   → cập nhật realtime khi sửa (lỗi biến mất ngay khi hợp lệ)
hợp lệ        → KHÔNG tô xanh ồn ào
```

## 3. Hiển thị (gắn field, không gom toàn cục)

```
[ Tiêu đề ]                       ← Input
┌─────────────────────────────┐
│                             │  ← viền --rs-field-border (error)
└─────────────────────────────┘
⚠ Tiêu đề không được để trống.   ← message: icon + chữ, --rs-color-severity-error
```
- Message dưới field, nối bằng `aria-describedby`; **icon + chữ**, không chỉ đổi màu viền (a11y §7b).
- Submit khi còn lỗi → focus field lỗi đầu tiên + nêu thiếu gì (không chặn câm).

## 4. ✅ Do / ❌ Don't

| ✅ Do | ❌ Don't |
| :--- | :--- |
| Validate blur/submit | Báo lỗi mỗi keystroke |
| Chỉ rõ cách sửa | Chặn submit mà không nói thiếu gì |
| icon + chữ + aria | Chỉ đổi màu viền |

## 5. 📎 Cross-refs
- `2.Components/Input.md` · `ErrorStates.md` · `Other/VoiceAndContent.md` §4 · `Modules/1.Write.md` §3.4/§5.1 · token §6.5 / §7b.
