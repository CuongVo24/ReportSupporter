# 🔤 TYPOGRAPHY — Cặp font & thang chữ

> **STATUS: 🟡 SKELETON** — điền dần. Giá trị thang chữ canonical ở `Design/Modules/Other/DesignSystem_Tokens.md` §3; file này diễn giải **cách dùng** và **cặp font**, không nhân bản con số.

> **AI RULE:** Hai scale **không trộn** — UI (sans-serif) và Report (Times New Roman, đơn vị `pt`). Xem `0.ArtDirection.md` §8.

## 1. 🅰️ Hai scale (tóm — chi tiết token §3)
| Scale | Dùng ở | Font | Đơn vị |
| :--- | :--- | :--- | :--- |
| A — Workspace UI | vỏ app, panel, form | sans-serif hệ thống / mono cho editor | `px` |
| B — Report Output | tờ báo cáo A4 | Times New Roman | `pt` |

## 2. 🔗 Pairing rules
- [ ] UI heading vs body: cách phân cấp bằng size + weight (không màu).
- [ ] Editor: mono + line-height 1.6.
- [ ] Report: heading hierarchy h1/h2/h3 khớp numbering `1`/`1.1`/`1.1.1`.

## 3. 📏 Thang chữ thực dụng
- [ ] Bảng map token → ngữ cảnh dùng (label, caption, panel title, dialog title).
- [ ] Quy tắc về độ dài dòng (measure) cho preview pane.

## 4. 📎 Cross-refs
* `Modules/Other/DesignSystem_Tokens.md` §3 (giá trị) · §3.2 (đơn vị `pt` bắt buộc).
* `Modules/2.Format.md` (preset học thuật phải khớp).
* `0.ArtDirection.md` §8 (gu chữ).
