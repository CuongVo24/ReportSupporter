# 🎨 DESIGN SYSTEM TOKENS — ReportSupporter

> **AI RULE:** File này là **single source of truth** cho mọi giá trị thị giác (màu, chữ, khoảng cách, layout A4) của ReportSupporter.
> Token ở đây phải **khớp 1:1** với preset học thuật trong `Design/Modules/2.Format.md` và bộ severity `error | warning | info` của `ReportIssue` trong `Design/Modules/3.Check.md`.
> Đụng giá trị → cập nhật file này trước, rồi mới đụng code (Golden Rule "Single Source of Truth" trong `Design/VibeCode.md`).

ReportSupporter có **hai bề mặt thị giác tách biệt nhưng phải sống chung trong một file token**:

1. **Workspace UI** — vỏ ứng dụng (editor pane, preview pane, checker panel, template picker, metadata form). Đây là chỗ người dùng *làm việc*, ưu tiên dễ đọc khi gõ lâu, có dark mode.
2. **Report Output** — chính tờ báo cáo học thuật (A4, Times New Roman 13/14, line-height 1.5, justify). Đây là chỗ *xuất ra* (preview ↔ HTML ↔ PDF ↔ DOCX), ưu tiên trung thực in ấn, **không** có dark mode.

> ⚠️ **Nguyên tắc vàng:** Hai bề mặt này KHÔNG dùng chung scale chữ. UI dùng sans-serif hệ thống cho dễ đọc màn hình; Report dùng đúng typography học thuật. Trộn lẫn hai scale là lỗi thiết kế.

---

## 1. 🧬 TOKEN PHILOSOPHY (TRIẾT LÝ)

Tất cả token là **CSS Custom Properties** (`--rs-*`), không phải biến JS/SCSS. Lý do: preview chạy trong DOM thật, và browser print/Puppeteer later (`Design/Modules/4.Export.md`) dùng lại **chính DOM đó** — nên nếu token là CSS variable thuần, preview và PDF ăn chung một nguồn, deterministic đúng tinh thần "intermediate document model" của `Design/Modules/Other/TechnicalStack.md` §3.

**Naming convention** — tiền tố `--rs-` (ReportSupporter), rồi tới *category*, rồi tới *role*, rồi tới *variant*:

```
--rs-color-<role>[-<variant>]      /* --rs-color-primary, --rs-color-severity-error */
--rs-space-<step>                  /* --rs-space-2, --rs-space-4 */
--rs-font-<family|size|weight|lh>  /* --rs-font-family-ui, --rs-report-font-size-body */
--rs-radius-<step>                 /* --rs-radius-sm */
--rs-elevation-<step>              /* --rs-elevation-1 */
--rs-z-<role>                      /* --rs-z-modal */
--rs-report-<...>                  /* MỌI token thuộc tờ báo cáo đều mang nhánh -report- */
```

**Rule cứng:**

* Token UI và token Report **không trộn nhánh**. Mọi thứ thuộc tờ báo cáo bắt buộc nằm dưới `--rs-report-*` để export đọc đúng tập con.
* Không hard-code hex/px trong component — chỉ tham chiếu `var(--rs-*)`.
* Token **primitive** (giá trị thô, vd `--rs-blue-600`) → token **semantic** (vai trò, vd `--rs-color-primary: var(--rs-blue-600)`). Component chỉ chạm token semantic.
* Dark mode chỉ override **token UI semantic** ở `[data-theme="dark"]`. Token `--rs-report-*` **bất biến** giữa hai theme (báo cáo in ra luôn nền trắng chữ đen).

---

## 2. 🎨 COLOR TOKENS

### 2.1. Primitive palette (giá trị thô — không dùng trực tiếp trong component)

| Token | Hex | Ghi chú |
| :--- | :--- | :--- |
| `--rs-blue-600` | `#2563EB` | Brand primary |
| `--rs-blue-700` | `#1D4ED8` | Primary hover |
| `--rs-blue-100` | `#DBEAFE` | Primary nền nhạt (focus ring nền) |
| `--rs-slate-900` | `#0F172A` | Text mạnh nhất |
| `--rs-slate-700` | `#334155` | Text thường |
| `--rs-slate-500` | `#64748B` | Text phụ / placeholder |
| `--rs-slate-300` | `#CBD5E1` | Border |
| `--rs-slate-100` | `#F1F5F9` | Surface nhạt |
| `--rs-slate-50` | `#F8FAFC` | App background (light) |
| `--rs-white` | `#FFFFFF` | Surface |
| `--rs-red-600` | `#DC2626` | Severity error |
| `--rs-amber-500` | `#F59E0B` | Severity warning |
| `--rs-sky-600` | `#0284C7` | Severity info |
| `--rs-green-600` | `#16A34A` | Trạng thái "đã fix / check passed" |

### 2.2. Semantic UI tokens — LIGHT (`:root`)

| Token | Giá trị | Vai trò |
| :--- | :--- | :--- |
| `--rs-color-bg` | `var(--rs-slate-50)` | Nền tổng app workspace |
| `--rs-color-surface` | `var(--rs-white)` | Nền pane/card/panel |
| `--rs-color-surface-muted` | `var(--rs-slate-100)` | Nền phụ (gutter editor, header panel) |
| `--rs-color-border` | `var(--rs-slate-300)` | Đường viền pane, input |
| `--rs-color-text` | `var(--rs-slate-900)` | Chữ chính UI |
| `--rs-color-text-muted` | `var(--rs-slate-500)` | Chữ phụ, placeholder, meta |
| `--rs-color-primary` | `var(--rs-blue-600)` | Nút chính, link, active tab |
| `--rs-color-primary-hover` | `var(--rs-blue-700)` | Hover nút chính |
| `--rs-color-focus-ring` | `var(--rs-blue-600)` | Outline focus (a11y) |
| `--rs-color-success` | `var(--rs-green-600)` | Check passed, autosave thành công |

### 2.3. Severity tokens — map thẳng vào `ReportIssue.severity`

> Ba giá trị này phải khớp **đúng tên** với `severity: "error" | "warning" | "info"` trong `Design/Modules/3.Check.md`. Checker panel (§7.3) tô badge theo đúng ba token này — không thêm severity thứ tư.

| Token | Light | Map tới `ReportIssue.severity` | Dùng ở |
| :--- | :--- | :--- | :--- |
| `--rs-color-severity-error` | `var(--rs-red-600)` | `"error"` | Thiếu mục bắt buộc (TOC, kết luận, references) |
| `--rs-color-severity-warning` | `var(--rs-amber-500)` | `"warning"` | Bảng quá rộng, heading nhảy cấp, code thiếu language |
| `--rs-color-severity-info` | `var(--rs-sky-600)` | `"info"` | Còn `TODO` / `lorem ipsum`, gợi ý cải thiện |
| `--rs-color-severity-error-bg` | `#FEF2F2` | nền badge/row error | |
| `--rs-color-severity-warning-bg` | `#FFFBEB` | nền badge/row warning | |
| `--rs-color-severity-info-bg` | `#F0F9FF` | nền badge/row info | |

### 2.4. Readiness score tokens (Module 3 — badge 0–100)

> Check module tính **readiness score 0–100** (`Design/Modules/3.Check.md`). Badge điểm dùng ba token ngưỡng dưới đây, KHÔNG tính màu runtime.

| Token | Light | Ngưỡng gợi ý |
| :--- | :--- | :--- |
| `--rs-color-readiness-good` | `var(--rs-green-600)` | `>= 80` — sẵn sàng nộp |
| `--rs-color-readiness-medium` | `var(--rs-amber-500)` | `50–79` — còn cảnh báo |
| `--rs-color-readiness-low` | `var(--rs-red-600)` | `< 50` — còn lỗi chặn |

### 2.5. Semantic UI tokens — DARK (`[data-theme="dark"]`)

> Chỉ override nhánh UI. Severity giữ độ tương phản tối thiểu AA trên nền tối. `--rs-report-*` **không** đổi.

| Token | Dark |
| :--- | :--- |
| `--rs-color-bg` | `#0B1120` |
| `--rs-color-surface` | `#111827` |
| `--rs-color-surface-muted` | `#1E293B` |
| `--rs-color-border` | `#334155` |
| `--rs-color-text` | `#E2E8F0` |
| `--rs-color-text-muted` | `#94A3B8` |
| `--rs-color-primary` | `#3B82F6` |
| `--rs-color-severity-error` | `#F87171` |
| `--rs-color-severity-warning` | `#FBBF24` |
| `--rs-color-severity-info` | `#38BDF8` |
| `--rs-color-severity-error-bg` | `rgba(248,113,113,.12)` |
| `--rs-color-severity-warning-bg` | `rgba(251,191,36,.12)` |
| `--rs-color-severity-info-bg` | `rgba(56,189,248,.12)` |

> 🔒 Severity background **bắt buộc** override ở dark mode: nếu giữ nguyên nền sáng `#FEF2F2`/`#FFFBEB`/`#F0F9FF`, row issue sẽ chói lóa giữa UI tối. Báo cáo (`--rs-report-*`) thì ngược lại — **không** override, luôn nền trắng chữ đen kể cả khi app đang dark.

---

## 3. 🔤 TYPOGRAPHY TOKENS — HAI SCALE TÁCH BIỆT

### 3.1. Scale A — Workspace UI (sans-serif, dễ đọc màn hình)

> Dùng cho vỏ app: toolbar, panel, form, badge, menu. **Không** áp vào tờ báo cáo.

| Token | Giá trị | Dùng ở |
| :--- | :--- | :--- |
| `--rs-font-family-ui` | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | Toàn bộ UI |
| `--rs-font-family-mono` | `ui-monospace, "Cascadia Code", Consolas, monospace` | Editor `<textarea>`/CodeMirror, code inline UI |
| `--rs-font-size-xs` | `12px` | Caption, meta, line number |
| `--rs-font-size-sm` | `13px` | Label form, badge |
| `--rs-font-size-md` | `14px` | Body UI mặc định |
| `--rs-font-size-lg` | `16px` | Tiêu đề panel |
| `--rs-font-size-xl` | `20px` | Tiêu đề màn / dialog |
| `--rs-font-weight-regular` | `400` | |
| `--rs-font-weight-medium` | `500` | Label, tab active |
| `--rs-font-weight-bold` | `700` | Heading panel |
| `--rs-font-lh-ui` | `1.45` | Line-height UI |

> 💡 Editor surface (Module 1 — `<textarea>` ở W1, CodeMirror 6 ở W2+ theo TechnicalStack §2) dùng `--rs-font-family-mono` + `--rs-font-size-md`, line-height nới `1.6` cho dễ gõ Markdown.

### 3.2. Scale B — Academic Report Output (PHẢI khớp `Modules/2.Format.md`)

> Đây là scale học thuật. Mọi giá trị dưới đây **bằng đúng** preset trong `Design/Modules/2.Format.md` (A4, Times New Roman, 13/14, line-height 1.5, justify, numbering `1` / `1.1` / `1.1.1`). Preview pane và export (HTML/PDF/DOCX) đọc **cùng** tập token này → preview ↔ PDF ↔ DOCX không lệch.

> ⚠️ **ĐƠN VỊ BẮT BUỘC LÀ `pt`, KHÔNG dùng `px` cho cỡ chữ report output.** Báo cáo học thuật đo bằng point (Word/PDF dùng pt). CSS quy đổi `1pt = 1/72in`, `1px = 1/96in` → **13pt ≈ 17.33px**, **14pt ≈ 18.67px**. Khai báo `14px` thực tế chỉ ≈ **10.5pt** — nhỏ hơn nhiều so với chuẩn 13/14pt. `pt` render đúng trên cả preview lẫn print nên giữ preview ↔ PDF ↔ DOCX khớp tuyệt đối. **Cấm `px` trong mọi token `--rs-report-*` về cỡ chữ.**

| Token | Giá trị | Khớp với `2.Format.md` |
| :--- | :--- | :--- |
| `--rs-report-font-family` | `"Times New Roman", Times, serif` | Font: Times New Roman (configurable equivalent) |
| `--rs-report-font-size-body` | `13pt` | Font size 13 (preset mặc định) |
| `--rs-report-font-size-body-alt` | `14pt` | Preset thay thế 14 |
| `--rs-report-line-height` | `1.5` | Line height 1.5 (unitless) |
| `--rs-report-text-align` | `justify` | Text alignment: justified cho body |
| `--rs-report-color-text` | `#000000` | Chữ in đen tuyền (khác UI tránh `#000`) |

**Heading hierarchy** — khớp numbering `1` / `1.1` / `1.1.1` (đơn vị `pt`):

| Token | Cấp | Size | Weight | Numbering |
| :--- | :--- | :--- | :--- | :--- |
| `--rs-report-h1-size` | Chương (`1`) | `16pt` | `700` | `1.` — sang trang mới ở PDF/DOCX (chapter-break, Format §"Chapter behavior") |
| `--rs-report-h2-size` | Mục (`1.1`) | `14pt` | `700` | `1.1` |
| `--rs-report-h3-size` | Tiểu mục (`1.1.1`) | `13pt` | `700` | `1.1.1` (cùng cỡ body, phân biệt bằng bold) |
| `--rs-report-heading-lh` | — | `1.4` | — | Line-height riêng cho heading (unitless) |
| `--rs-report-caption-size` | Caption hình/bảng | `12pt` | `400` *(italic)* | "Hình 1.", "Bảng 1." (Format §captions) |

> 🔒 Checker rule "Heading jumps levels" (`3.Check.md`) đọc đúng ba cấp h1/h2/h3 này. Nếu đổi hierarchy ở đây, phải đối chiếu lại rule đó.

---

## 4. 📐 SPACING / RADIUS / ELEVATION / Z-INDEX

### 4.1. Spacing (4px base grid)

| Token | px |
| :--- | :--- |
| `--rs-space-1` | `4px` |
| `--rs-space-2` | `8px` |
| `--rs-space-3` | `12px` |
| `--rs-space-4` | `16px` (padding pane chuẩn) |
| `--rs-space-5` | `20px` |
| `--rs-space-6` | `24px` |
| `--rs-space-8` | `32px` |
| `--rs-space-12` | `48px` |

### 4.2. Radius

| Token | px | Dùng ở |
| :--- | :--- | :--- |
| `--rs-radius-sm` | `6px` | Input, badge severity |
| `--rs-radius-md` | `10px` | Card, panel, template tile |
| `--rs-radius-lg` | `14px` | Dialog, modal |
| `--rs-radius-full` | `9999px` | Pill, avatar member |

### 4.3. Elevation (shadow — chỉ cho UI, KHÔNG cho report output)

| Token | Giá trị | Dùng ở |
| :--- | :--- | :--- |
| `--rs-elevation-0` | `none` | Pane phẳng |
| `--rs-elevation-1` | `0 1px 2px rgba(15,23,42,.08)` | Card, template tile |
| `--rs-elevation-2` | `0 4px 12px rgba(15,23,42,.12)` | Dropdown asset menu, popover |
| `--rs-elevation-3` | `0 12px 32px rgba(15,23,42,.18)` | Modal, dialog |

### 4.4. Z-index (thang bậc cố định, tránh chiến tranh z-index)

| Token | Giá trị | Lớp |
| :--- | :--- | :--- |
| `--rs-z-base` | `0` | Nội dung pane |
| `--rs-z-sticky` | `100` | Toolbar / section navigator sticky |
| `--rs-z-dropdown` | `200` | Asset insert menu, template dropdown |
| `--rs-z-overlay` | `300` | Backdrop modal |
| `--rs-z-modal` | `400` | Dialog metadata, confirm export |
| `--rs-z-toast` | `500` | Thông báo autosave / export done |

---

## 5. 📄 A4 LAYOUT TOKENS (Report Output)

> Định nghĩa hình học tờ A4 cho **preview pane** và **export**. Browser print/Puppeteer later (`4.Export.md`) phải dùng đúng các margin này qua `@page` CSS để PDF khớp preview. DOCX (`docx` lib) đọc cùng số đo để section/margin trùng khớp.

| Token | Giá trị | Ý nghĩa |
| :--- | :--- | :--- |
| `--rs-report-page-width` | `210mm` | Khổ A4 ngang |
| `--rs-report-page-height` | `297mm` | Khổ A4 dọc |
| `--rs-report-margin-top` | `25mm` | Lề trên (academic preset mặc định, Format §Margin) |
| `--rs-report-margin-bottom` | `25mm` | Lề dưới |
| `--rs-report-margin-left` | `30mm` | Lề trái (chừa gáy đóng quyển) |
| `--rs-report-margin-right` | `20mm` | Lề phải |
| `--rs-report-content-width` | `calc(210mm - 30mm - 20mm)` | Bề rộng vùng chữ (≈160mm) — checker "Table too wide" đối chiếu giá trị này |
| `--rs-report-header-height` | `12mm` | Vùng header (tên báo cáo / chương) |
| `--rs-report-footer-height` | `12mm` | Vùng footer |
| `--rs-report-pagenum-area` | `10mm` | Dải đặt số trang trong footer (Format §"page number configuration") |
| `--rs-report-gap-paragraph` | `6px` | Khoảng cách giữa hai đoạn |
| `--rs-report-gap-chapter` | `page-break-before: always` | Chương mới sang trang (PDF/DOCX) |

> 🔒 Margin trái/phải bất đối xứng (30/20mm) là chủ ý để chừa gáy đóng quyển báo cáo in — đừng "cân lại" cho đẹp.

---

## 6. 🧩 COMPONENT TOKENS

> Token cấp component chỉ **alias** lại token semantic ở trên, để mỗi bề mặt có một điểm chỉnh tập trung. Không sinh giá trị mới.

### 6.1. Editor pane (Module 1 — Write)

| Token | Giá trị |
| :--- | :--- |
| `--rs-editor-bg` | `var(--rs-color-surface)` |
| `--rs-editor-font` | `var(--rs-font-family-mono)` |
| `--rs-editor-font-size` | `var(--rs-font-size-md)` |
| `--rs-editor-line-height` | `1.6` |
| `--rs-editor-gutter-bg` | `var(--rs-color-surface-muted)` |
| `--rs-editor-padding` | `var(--rs-space-4)` |

### 6.2. Preview pane (Module 1 + Module 2)

| Token | Giá trị |
| :--- | :--- |
| `--rs-preview-bg` | `var(--rs-slate-100)` (nền "bàn làm việc" quanh tờ A4) |
| `--rs-preview-page-bg` | `var(--rs-white)` (chính tờ giấy) |
| `--rs-preview-page-shadow` | `var(--rs-elevation-2)` (đổ bóng tờ giấy — chỉ trên màn hình, **không** xuất PDF) |
| `--rs-preview-font` | `var(--rs-report-font-family)` |
| `--rs-preview-font-size` | `var(--rs-report-font-size-body)` |
| `--rs-preview-line-height` | `var(--rs-report-line-height)` |
| `--rs-preview-text-align` | `var(--rs-report-text-align)` |

### 6.3. Checker panel (Module 3 — severity badges)

| Token | Giá trị |
| :--- | :--- |
| `--rs-checker-bg` | `var(--rs-color-surface)` |
| `--rs-checker-row-error` | `var(--rs-color-severity-error-bg)` |
| `--rs-checker-row-warning` | `var(--rs-color-severity-warning-bg)` |
| `--rs-checker-row-info` | `var(--rs-color-severity-info-bg)` |
| `--rs-checker-badge-radius` | `var(--rs-radius-sm)` |
| `--rs-checker-badge-error` | `var(--rs-color-severity-error)` |
| `--rs-checker-badge-warning` | `var(--rs-color-severity-warning)` |
| `--rs-checker-badge-info` | `var(--rs-color-severity-info)` |

> Badge text + suggestion lấy `--rs-font-size-sm`. Badge nhóm theo severity đúng Acceptance "Issues are grouped by severity" (`3.Check.md`).

### 6.4. Template picker (Module 1)

| Token | Giá trị |
| :--- | :--- |
| `--rs-template-tile-bg` | `var(--rs-color-surface)` |
| `--rs-template-tile-radius` | `var(--rs-radius-md)` |
| `--rs-template-tile-shadow` | `var(--rs-elevation-1)` |
| `--rs-template-tile-border-active` | `var(--rs-color-primary)` |
| `--rs-template-tile-gap` | `var(--rs-space-4)` |

### 6.5. Metadata form (Module 1)

| Token | Giá trị |
| :--- | :--- |
| `--rs-field-bg` | `var(--rs-color-surface)` |
| `--rs-field-border` | `var(--rs-color-border)` |
| `--rs-field-border-focus` | `var(--rs-color-focus-ring)` |
| `--rs-field-radius` | `var(--rs-radius-sm)` |
| `--rs-field-label-size` | `var(--rs-font-size-sm)` |
| `--rs-field-gap` | `var(--rs-space-3)` |

---

## 7. 🔗 HOW MODULES CONSUME TOKENS

> Quy tắc đọc token theo từng module — để preview ↔ export deterministic đúng triết lý "cùng AST, cùng nguồn" của `Design/Modules/Other/TechnicalStack.md`.

| Module | Đọc nhánh token | Mục đích |
| :--- | :--- | :--- |
| **1. Write** | `--rs-color-*`, `--rs-font-family-ui/mono`, component `--rs-editor-*`, `--rs-template-*`, `--rs-field-*` | Vỏ workspace, editor, form metadata |
| **2. Format** | **`--rs-report-*`** + A4 tokens (§5) | Áp typography học thuật + layout A4 lên cây hast trước khi render |
| **3. Check** | `--rs-color-severity-*` + `--rs-checker-*` | Tô badge theo `ReportIssue.severity`; đọc `--rs-report-content-width` để xét bảng quá rộng |
| **4. Export** | **`--rs-report-*`** + A4 tokens (§5) — **cùng tập với Module 2** | HTML nhúng đúng token; browser print dùng chính DOM đó → PDF MVP; `docx` lib map số đo A4/font sang DOCX |

**Vì sao preview ↔ PDF ↔ DOCX khớp nhau:** Module 2 (Format) và Module 4 (Export) đọc **chung một tập `--rs-report-*`**. Preview pane (§6.2) cũng alias chính tập đó. Vậy nên:

* Đổi `--rs-report-font-size-body` → preview, PDF, DOCX cùng đổi một lượt.
* Token UI (`--rs-color-bg`, dark mode...) **không bao giờ** rò vào tờ báo cáo, vì export chỉ đọc nhánh `--rs-report-*`.

> 🔒 **Đây là hợp đồng bất di:** bất kỳ token nào ảnh hưởng tới *nội dung in ra* phải nằm dưới `--rs-report-*`. Token nào chỉ ảnh hưởng *màn hình làm việc* nằm ngoài nhánh đó. Vi phạm ranh giới này = preview lệch PDF = lỗi nghiêm trọng.

---

## 8. 📎 CROSS-REFERENCES

* `Design/Modules/2.Format.md` — preset A4 / Times New Roman 13-14 / line-height 1.5 / justify / numbering mà §3.2 và §5 phải khớp.
* `Design/Modules/3.Check.md` — `ReportIssue.severity = "error" | "warning" | "info"` mà §2.3 map vào.
* `Design/Modules/1.Write.md` — editor/preview/template/metadata surfaces tiêu thụ token §6.
* `Design/Modules/4.Export.md` — đọc nhánh `--rs-report-*` để PDF/DOCX khớp preview.
* `Design/Modules/Other/TechnicalStack.md` — stack đã khoá; token là CSS custom properties thuần, không kéo lib styling ngoài stack.
* `Design/Modules/Other/OptimizePerformance.md` — token này dùng chung cho cả preview re-render đã debounce (xem perf doc).
