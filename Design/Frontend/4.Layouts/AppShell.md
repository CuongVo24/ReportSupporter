# 🏗️ APP SHELL — Khung workspace "Bàn viết → Tờ nộp"

> **STATUS: ✅ SPEC.** **AI RULE:** Route `/` là **workspace-first** (editor), KHÔNG landing (`Guideline.md` Glossary, `Modules/1.Write.md` §1). Shell hiện thực hệ ẩn dụ chữ ký `0.ArtDirection.md` §12: **bàn viết** (trái) ↔ **tờ nộp** (phải) trên mặt bàn slate, với **rail người soát + đồng hồ** bên phải. Đây là điểm tách ReportSupporter khỏi Notion/Typora/Linear — đừng "phẳng hoá" thành editor 2-pane generic.

---

## 1. 🗺️ Sơ đồ shell (desktop ≥1024px)

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOOLBAR mỏng sticky   [report ▾]   ·   Lưu thầm HH:MM   ·   [Xuất ▾] │  ← --rs-z-sticky
├───────────────┬──────────────────────────────────┬───────────────────┤
│  SECTION NAV  │   BÀN VIẾT          TỜ NỘP        │   RAIL PHẢI        │
│  (mục báo cáo)│   (editor, mono)    (A4 trên bàn) │  ┌──────────────┐ │
│               │                     ┌──────────┐  │  │ Đồng hồ ⏳    │ │
│  1. Mở đầu    │  ## Mở đầu          │ tờ A4    │  │  │ Còn 2 ngày   │ │
│  2. Nội dung  │  Báo cáo này...     │ trắng,   │  │  ├──────────────┤ │
│  3. Kết luận  │                     │ đổ bóng  │  │  │ Mức sẵn sàng │ │
│     ...       │                     │ trên     │  │  │ 75/100 ▮▮▮▯  │ │
│               │                     │ slate    │  │  ├──────────────┤ │
│               │                     └──────────┘  │  │ Người soát   │ │
│               │                                   │  │ • 1 lỗi      │ │
│               │                                   │  │ • 2 cảnh báo │ │
│               │ ◀──── kéo chỉnh tỉ lệ ────▶       │  └──────────────┘ │
└───────────────┴──────────────────────────────────┴───────────────────┘
       ▲ thu gọn được               ▲ mặt bàn = --rs-preview-bg        ▲ thu gọn / drawer
```

---

## 2. 🧱 Cấu trúc 4 vùng

| Vùng | Vai trò ẩn dụ | Nội dung | Token / hành vi |
| :--- | :--- | :--- | :--- |
| **Toolbar** (sticky, mỏng) | mép bàn | report switcher · dấu **lưu thầm** (§SignatureInteractions #4) · **một** primary `Xuất` | `--rs-z-sticky`, nền `--rs-color-surface`, border-bottom `--rs-color-border`, **không** bóng |
| **Section navigator** (trái, thu gọn được) | mục lục bàn | danh sách `ReportSection` theo `order`, badge `status` (draft/review/done), click nhảy | nền `--rs-color-surface-muted`, item active viền trái `--rs-color-primary` |
| **Vùng làm việc** (giữa) | **bàn viết ↔ tờ nộp** | editor pane (mono) + preview pane (A4 trên mặt bàn slate), kéo chỉnh tỉ lệ | `--rs-editor-*` · `--rs-preview-*`; chia bằng border mảnh, không bóng |
| **Rail phải** (thu gọn / drawer) | **đồng hồ + người soát** | đồng hồ deadline · badge mức sẵn sàng · panel người soát (dùng `Tabs` cho Check/Export/Present) | nền `--rs-color-surface`, border-left `--rs-color-border` |

---

## 3. 🎚️ Tỉ lệ pane & hành vi kéo/thu

- **Bàn viết ↔ tờ nộp:** mặc định ~50/50, kéo handle giữa để chỉnh; nhớ tỉ lệ theo project (local). Min mỗi pane ~320px trước khi rơi xuống chế độ tab (xem `Responsive.md`).
- **Tờ nộp** giữ tỉ lệ A4 thật (`--rs-report-page-width/height`), scale-to-fit theo bề rộng pane, **không** bóp méo. Bóng tờ giấy `--rs-preview-page-shadow` chỉ trên màn, không vào PDF.
- **Rail phải** thu gọn thành cột icon mảnh (đồng hồ + chấm severity) → mở rộng khi cần. **Section nav** thu gọn thành icon-only.
- Chỉ **một** vùng cuộn nội dung chính tại một thời điểm có "đèn rọi" khi jump-to-spot (SignatureInteractions #1).

---

## 4. 🔁 Trạng thái shell (★ cover đủ, không chỉ happy-path)

| State | Shell hiển thị | Pattern |
| :--- | :--- | :--- |
| **Chưa có report nào** (IndexedDB rỗng) | mở thẳng **template picker** thay vì màn trắng (`1.Write.md` §6) | `3.Patterns/EmptyStates.md` |
| **Đang mở report** (đọc IndexedDB) | skeleton 4 vùng giữ layout, không spinner toàn màn | `3.Patterns/LoadingSkeleton.md` |
| **Report mở, chưa soát** | rail: badge xám "Chưa soát" + **Soát báo cáo**; không hiện điểm giả | `SignatureInteractions.md` #2 |
| **Report mở, đã soát** | rail đầy: đồng hồ + mức sẵn sàng + danh sách issue | — |
| **Rail thu gọn** | cột icon mảnh, badge severity vẫn thấy (chấm + số) | — |
| **Lỗi đọc dữ liệu** (IndexedDB) | banner cấp shell "Không mở được dữ liệu cục bộ…" | `3.Patterns/ErrorStates.md` |

---

## 5. 📐 Nguyên tắc (đối chiếu Art Direction)

1. **Nội dung là nhân vật chính, chrome lùi sau** (§3.1): bàn viết + tờ nộp chiếm sân khấu; toolbar/rail mảnh, **border** chia vùng thay vì bóng (§4).
2. **Một primary trên toolbar** (§3.6): `Xuất` là primary duy nhất ở toolbar; mọi thứ khác secondary/ghost.
3. **Mặt bàn có chủ ý:** vùng quanh tờ A4 dùng `--rs-preview-bg` (slate-100) để tờ giấy "đặt trên bàn" nổi lên — đây là chữ ký, không phải nền trống.
4. **Rail không ồn:** đồng hồ & người soát hiện diện nhưng tiết chế; chỉ "lên tiếng" ở mốc (SignatureInteractions #3).

---

## 6. 🧭 Z-index (theo token §4.4 — tránh chiến tranh z)

`--rs-z-base` nội dung pane → `--rs-z-sticky` toolbar/section nav sticky → `--rs-z-dropdown` report switcher/asset menu → `--rs-z-overlay`+`--rs-z-modal` dialog (metadata, confirm xuất) → `--rs-z-toast` phản hồi.

---

## 7. ✅ Do / ❌ Don't

| ✅ Do | ❌ Don't |
| :--- | :--- |
| Tờ nộp đặt trên mặt bàn slate (chữ ký) | Preview dán sát mép, nền trắng trơn như tab phụ |
| Border mảnh chia 4 vùng | Mỗi vùng một card đổ bóng đậm (anti-pattern §6) |
| Một primary `Xuất` trên toolbar | 3 nút đậm ngang hàng trên toolbar |
| Rail thu gọn vẫn cho thấy severity | Ẩn hẳn người soát khiến mất "độ tin" |

---

## 8. 📎 Cross-refs
- `0.ArtDirection.md` §12 (ẩn dụ chữ ký) · §5 (north-star) · `Other/SignatureInteractions.md` (rail behaviors).
- `Modules/1.Write.md` (editor/preview/section nav/autosave) · `Modules/3.Check.md` (người soát) · `Modules/4.Export.md` (toolbar Xuất).
- `2.Components/Tabs.md` (rail Check/Export/Present) · `4.Layouts/Responsive.md` · `4.Layouts/InformationArchitecture.md` · token §4.4 (z), §6.1/§6.2 (editor/preview).
