# Contract For AI — W15 Fix: Nội Dung Preview Dùng Token Theme → Khối Tối Trên Tờ Giấy Trắng

> **Lane:** Core / break_task / week15_break.
> **Branch:** `fix/w15-preview-paper-tokens`.
> **Type:** Output-fidelity — finding **S1** (High, `.ws-preview-container` render nội dung bằng `--rs-color-surface`/`--rs-color-text` (đổi màu theo theme) trong khi tờ A4 ép trắng-đen → ở dark mode thành khối tối nằm trên giấy trắng, sai hoàn toàn bản xuất PDF/DOC). Review toàn dự án (2026-06-26).
> **Builds on:** Module 1/2 preview (`PreviewPane.tsx`, `globals.css`).
> **Sources:** Review 2026-06-26; `--rs-report-*` invariant (tờ A4 luôn trắng-đen, Locked tuần #3); ảnh: trang giấy trắng nhưng nội dung là theme dark.

---

## 1. Micro-task Target

Tách màu **nội dung tài liệu** khỏi token UI theme: nội dung trong tờ A4 phải luôn theo bảng màu "giấy" (nền trắng/chữ đen) bất kể app sáng hay tối. Gốc lỗi #4. **Không** đổi pipeline markdown, **không** đổi cấu trúc DOM preview.

- **S1 — `.ws-preview-container` dùng token UI theme bên trong tờ giấy.** [PreviewPane.tsx:326-327](src/components/PreviewPane.tsx#L326) bọc toàn bộ nội dung trong `.ws-preview-container`; CSS [globals.css:571-580](src/app/globals.css#L571) đặt `background-color: var(--rs-color-surface)` + `color: var(--rs-color-text)`. Hai biến này lật tối ở dark mode ([globals.css:2546-2588](src/app/globals.css#L2546)). Trong khi `.ws-preview-page` (khung A4) ép `background: var(--rs-white)` + `color: var(--rs-report-color-text,#000)` ([WorkspaceLayout.css:524-539](src/components/WorkspaceLayout.css#L524)). Kết quả: giấy trắng nhưng container con tô nền tối + chữ sáng → khối tối trên giấy. **Fix:** `.ws-preview-container` (và mọi block phụ render trong tờ giấy: TOC/LOF/LOT, bảng, code) dùng **token report/giấy** — `background: transparent` (để lộ nền trắng của `.ws-preview-page`) hoặc `var(--rs-white)`, `color: var(--rs-report-color-text)`; không tham chiếu `--rs-color-surface/text`. Rà các block trong tờ giấy còn dùng token UI: `.ws-toc-container`/`.ws-toc-title` ([globals.css:676-691](src/app/globals.css#L676)) đang dùng `--rs-color-surface-muted`/`--rs-color-text` → chuyển sang màu giấy trung tính (xám rất nhạt cố định) để khớp bản xuất.

> 🔒 **`--rs-report-*` bất biến (Locked #3).** Tờ A4 + nội dung trong nó luôn trắng-đen; không lật theo theme.
> 🔒 **Không đổi pipeline/DOM.** Chỉ đổi token màu của container nội dung; markdown→HTML giữ nguyên.

## 2. Scope

### In scope
- **S1** [src/app/globals.css](src/app/globals.css) (MODIFY): `.ws-preview-container` + `.ws-toc-*`/`.ws-lof-*`/`.ws-lot-*` dùng màu giấy (transparent/`--rs-white` + `--rs-report-color-text`), bỏ `--rs-color-surface/text` trong vùng tờ giấy.

### Out of scope
- ❌ Zoom/scale typography preview (→ **w15_fix_preview_zoom_***).
- ❌ Cơ chế bật/tắt dark theme (→ **w15_fix_os_darkmode_***).
- ❌ Đổi pipeline markdown / heading numbering.

## 3. Checklist
- [ ] **S1** ở dark mode: nội dung trong tờ A4 vẫn nền trắng + chữ đen (khớp PDF); không còn khối tối.
- [ ] TOC/LOF/LOT trong preview dùng màu giấy, không lật theo theme.
- [ ] Light mode không đổi diện mạo so với trước.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/globals.css` | MODIFY | preview-container + toc/lof/lot → token giấy |

> **Import boundary:** chỉ CSS. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| `transparent` lộ nền không mong muốn | Low | `.ws-preview-page` luôn `--rs-white`; transparent lộ đúng trắng. |
| TOC mất tương phản trên giấy | Low | Dùng xám cố định nhạt (vd token report border) thay surface-muted. |

## 6. Verification Plan
- Bật dark (OS/forced): so preview với bản export HTML/PDF — trùng nền trắng/chữ đen.
- Light mode: preview không đổi.
- 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. **Ưu tiên cao** (lỗi sai-bản-xuất). Commit: `fix(preview): document content always uses paper colors, not UI theme`.
