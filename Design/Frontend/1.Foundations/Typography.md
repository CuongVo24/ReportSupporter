# 🔤 TYPOGRAPHY — Cặp font & thang chữ

> **STATUS: ✅ SPEC.** Giá trị thang chữ canonical ở `Design/Modules/Other/DesignSystem_Tokens.md` §3; file này diễn giải **cách dùng** và **cặp font**, không nhân bản con số.
>
> **AI RULE:** Hai scale **không trộn** — UI (sans-serif, `px`) và Report (Times New Roman, `pt`). Trộn hai scale = lỗi thiết kế nghiêm trọng (preview lệch PDF). Xem `0.ArtDirection.md` §8.

---

## 1. 🅰️ Hai scale tách biệt

| Scale | Dùng ở | Font token | Đơn vị |
| :--- | :--- | :--- | :--- |
| **A — Workspace UI** | vỏ app, panel, form, badge, menu | `--rs-font-family-ui` (sans) / `--rs-font-family-mono` (editor) | `px` |
| **B — Report Output** | tờ nộp A4 | `--rs-report-font-family` (Times New Roman) | **`pt`** (bắt buộc, token §3.2) |

> ⚠️ `--rs-report-*` cỡ chữ **cấm `px`** — báo cáo học thuật đo bằng `pt` để preview ↔ PDF ↔ DOCX khớp tuyệt đối (token §3.2: 13pt ≈ 17.33px).

## 2. 🔗 Pairing rules

- **UI heading vs body:** phân cấp bằng **size + weight**, không bằng màu (§8). Panel title `--rs-font-size-lg` weight `bold`; body `--rs-font-size-md` regular; label/badge `--rs-font-size-sm` weight `medium`.
- **Bàn viết (editor):** `--rs-font-family-mono` + `--rs-font-size-md`, line-height **1.6** (`--rs-editor-line-height`) cho dễ gõ Markdown.
- **Tờ nộp (report):** heading hierarchy khớp numbering Format: h1 `16pt`/`1.` · h2 `14pt`/`1.1` · h3 `13pt`/`1.1.1` (h3 cùng cỡ body, phân biệt bằng bold). Caption `12pt` italic.

## 3. 📏 Thang chữ thực dụng (token → ngữ cảnh)

| Token UI | Cỡ | Dùng ở |
| :--- | :--- | :--- |
| `--rs-font-size-xs` | 12px | caption, meta, line number, dấu lưu thầm |
| `--rs-font-size-sm` | 13px | label form, badge, suggestion người soát |
| `--rs-font-size-md` | 14px | body UI, editor |
| `--rs-font-size-lg` | 16px | tiêu đề panel/rail |
| `--rs-font-size-xl` | 20px | tiêu đề màn / dialog title |

- **Độ dài dòng (measure) tờ nộp:** vùng chữ A4 ≈160mm (`--rs-report-content-width`) — giữ measure học thuật thật, scale-to-fit khi pane hẹp, **không** giãn chữ.
- Hạn chế IN HOA / in nghiêng trong UI; để dành ngữ nghĩa báo cáo (caption "Hình 1.", "Bảng 1.").

## 4. 📎 Cross-refs
- `Modules/Other/DesignSystem_Tokens.md` §3 (giá trị) · §3.2 (đơn vị `pt` bắt buộc) · `Modules/2.Format.md` (preset học thuật phải khớp) · `0.ArtDirection.md` §8 · `4.Layouts/Responsive.md` (scale-to-fit tờ nộp).
