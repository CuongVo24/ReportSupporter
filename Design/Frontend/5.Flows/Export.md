# 📤 FLOW — Export (Module 4) · "Ra bản nộp"

> **STATUS: ✅ SPEC.** Screen-level cho luồng xuất HTML/PDF/DOCX, theo `_FlowSpecRule.md`. Logic ở `Modules/4.Export.md`. Đây là khoảnh khắc **Trustworthy** quan trọng nhất — ra file đi nộp. Hiện thực SignatureInteractions #5 (tiến trình job thật).

## Bản đồ bước

```
[Chọn định dạng] → (cổng người soát nếu còn lỗi) → Job timeline thật → Kết quả / Lỗi + Thử lại
        ↑ (tuỳ) xem trước trang bìa
```

---

### Màn 1 — Export panel (chọn định dạng)

**0. Bố cục:** panel trong rail phải (tab Export) hoặc dialog từ primary `Xuất` ở toolbar.
**1. Primary:** **Xuất PDF** (mặc định) — một primary; PDF/DOCX/HTML là lựa chọn định dạng, không phải 3 primary ngang hàng.
**2. Phụ:** **Xuất DOCX**, **Xuất HTML** (secondary); **Xem trước trang bìa**; chọn preset.
**3. Trạng thái:**
| State | Khi nào | Hiển thị |
| :--- | :--- | :--- |
| default | report mở | nút theo định dạng + preset chọn |
| disabled | đang chạy job khác / project rỗng hoàn toàn | nút mờ + **lý do** ("Báo cáo trống") |
| (banner) còn lỗi | người soát còn `error` | banner cảnh báo trên nút (xem Màn 2) |

**4. Copy:** **Xuất PDF / Xuất DOCX / Xuất HTML** (`VoiceAndContent.md` §2). Không "Export"/"Download".
**5. Component:** Button (primary + secondary), Tabs (rail), Select (preset), Dialog (cover preview).
**6. Gate:** disabled khi đang có job running; cảnh báo (không chặn) khi còn lỗi → Màn 2.
**7. Chữ ký:** dẫn vào timeline thật (#5).

---

### Màn 2 — Cổng người soát (confirm khi còn lỗi)

**0. Bố cục:** confirm Dialog (`--rs-z-modal`).
**1. Primary:** **Vẫn xuất** (người dùng tự quyết — Export **không** chặn cứng, `4.Export.md` §6).
**2. Phụ:** **Huỷ** (quay lại sửa); link **Xem lỗi** → jump-to-spot (#1).
**3. Trạng thái:**
| State | Khi nào | Hiển thị |
| :--- | :--- | :--- |
| default | bấm Xuất khi còn `error` | "Báo cáo còn {n} lỗi chặn. Nên sửa trước khi nộp." |
| (skip) | 0 lỗi chặn | bỏ qua dialog, chạy thẳng job |

**4. Copy:** Title "Vẫn xuất dù còn lỗi?" · Body "Báo cáo còn {n} lỗi chặn. Nên sửa trước khi nộp." · **Huỷ** · **Vẫn xuất** (`VoiceAndContent.md` §7).
**5. Component:** Dialog, Button (primary `Vẫn xuất`, ghost `Huỷ`).
**6. Gate:** chỉ hiện khi checker còn severity `error`; warning/info không chặn.
**7. Chữ ký:** người soát trước khi nộp (§12.2); link xem lỗi dùng đèn rọi (#1).

---

### Màn 3 — Job timeline (đang xuất) ★

**0. Bố cục:** panel/inline trong Export tab; danh sách stage dọc.
**1. Primary:** none khi đang chạy (nút Xuất khoá loading).
**2. Phụ:** (không huỷ giữa chừng ở MVP — job nhanh; nếu thêm, là ghost **Dừng**).
**3. Trạng thái (★ đủ):**
| State | Hiển thị | Token |
| :--- | :--- | :--- |
| running | stage thật sáng dần: **Gộp nội dung → Phân tích → Định dạng → Dựng {PDF/DOCX/HTML}** (`4.Export.md` §5.5); `aria-busy` | stage hiện tại `--rs-color-primary`, sau mờ |
| done | "Đã xuất {định dạng}" + **Mở file** (toast success) | `--rs-color-success` |
| error | stage lỗi đỏ + `error.message` + **Thử lại**; UI không treo | `--rs-color-severity-error` |

**4. Copy:** stage tiếng Việt người-đọc; done "Đã xuất {định dạng}" + action **Mở file**; lỗi "Xuất {định dạng} chưa xong. Thử lại?" (`VoiceAndContent.md` §4, §6).
**5. Component:** timeline list (stateful), Button (loading + **Thử lại**), Toast.
**6. Gate:** **Thử lại** chỉ khi `error.recoverable`; lỗi không recover → ghi rõ giới hạn (vd font thiếu).
**7. Chữ ký:** **tiến trình ra bản nộp thật** (#5) — không thanh % giả.

---

### Màn 4 — Cover page preview (tuỳ chọn)

**0. Bố cục:** Dialog/overlay hiển thị tờ bìa A4 từ `metadata`.
**1. Primary:** **Xuất PDF** (từ preview).
**2. Phụ:** **Sửa thông tin** (→ metadata form), **Đóng**.
**3. Trạng thái:** empty (thiếu metadata → bìa hiện chỗ trống có nhãn, không crash, `4.Export.md` §6).
**4. Copy:** nhãn bìa từ metadata (title/school/course/lecturer/members).
**5. Component:** Dialog, preview A4 (tái dùng tờ nộp), Button.
**6. Gate:** none.
**7. Chữ ký:** tờ nộp = vật chứng (§12.2).

---

## 🎯 Điểm nhấn gu
- **Trustworthy bằng hành vi:** trạng thái job thật, lỗi có địa chỉ stage, không giả tiến trình.
- Cổng người soát *nhắc* chứ không *chặn* — tôn trọng quyền quyết của người dùng (`4.Export.md` §6).

## 📎 Cross-refs
- `Modules/4.Export.md` (§5.5 job lifecycle, §6 còn-error-vẫn-cho-xuất) · `Other/SignatureInteractions.md` #5, #1.
- `3.Patterns/LoadingSkeleton.md` · `ErrorStates.md` · `Feedback.md` · `2.Components/Button.md` (loading) / `Dialog.md` / `Toast.md` · `Other/VoiceAndContent.md` §4/§6/§7.
