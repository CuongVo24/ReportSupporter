# Contract For AI — W15 Fix: `.ws-shell width:100vw` → Scroll Ngang + Quá Nhiều Scrollbar Lồng

> **Lane:** Core / break_task / week15_break.
> **Branch:** `fix/w15-shell-100vw-scroll`.
> **Type:** Layout-correctness / UX — finding **S1** (Med-High, `.ws-shell{width:100vw}` tính cả scrollbar dọc → luôn rộng hơn viewport vài px → scroll ngang tổng), **S2** (Low-Med, 5–6 container `overflow:auto` lồng nhau → người dùng không biết đang cuộn cái gì). Review toàn dự án (2026-06-26).
> **Builds on:** Group A shell (`WorkspaceLayout.css`).
> **Sources:** Review 2026-06-26; ảnh hiện trạng có horizontal scrollbar ở đáy preview + scroll tổng.

---

## 1. Micro-task Target

Bỏ scroll ngang ký sinh và gom các vùng cuộn về tối thiểu. Gốc lỗi #2. **Không** đổi behavior cuộn dọc của editor/preview/side-panel.

- **S1 — `width:100vw` sinh scroll ngang.** [WorkspaceLayout.css:7](src/components/WorkspaceLayout.css#L7) `.ws-shell { width:100vw; … }`. `100vw` **bao gồm** chiều rộng scrollbar dọc nên shell rộng hơn vùng client → trình duyệt thêm scrollbar **ngang** (đúng dấu hiệu trong ảnh). **Fix:** đổi `width:100vw` → `width:100%` (hoặc bỏ hẳn vì `.ws-shell` đã là block con của body); thêm `overflow-x:hidden` ở `.ws-shell` như chốt chặn. Lưu ý có **bản trùng** `.ws-shell` ở [globals.css:164-168](src/app/globals.css#L164) (không set width) — xử lý trùng ở contract dedup, ở đây chỉ sửa bản WorkspaceLayout.css đang thắng.
- **S2 — Nhiều `overflow:auto` lồng gây rối.** Các vùng cuộn: `.ws-split-pane-editor` ([:441-446](src/components/WorkspaceLayout.css#L441)), `.ws-editor-cm-parent` ([globals.css:558-562](src/app/globals.css#L558)), `.ws-split-pane-preview`/`.ws-preview-viewport` ([:502-514](src/components/WorkspaceLayout.css#L502)), `.ws-side-panel-content-scroll` ([:201-205](src/components/WorkspaceLayout.css#L201)), `.ws-side-tabs-content-scroll` ([globals.css:250-254](src/app/globals.css#L250)). Editor có **2 lớp** cuộn lồng (`split-pane-editor` + `cm-parent`) → thừa. **Fix:** để CodeMirror tự quản cuộn — bỏ `overflow:auto` ở `.ws-split-pane-editor` (giữ ở `cm-parent`), hoặc ngược lại, chỉ **một** lớp cuộn cho editor. Đảm bảo mỗi cột chỉ một thanh cuộn dọc rõ ràng; không cột nào sinh cuộn ngang (table rộng trong preview xử lý bằng `overflow-x:auto` riêng cho `table`, không cho cả page).

> 🔒 **Không đổi behavior cuộn nội dung.** Editor/preview/side-panel vẫn cuộn dọc; chỉ bỏ scroll ngang ký sinh + lớp cuộn thừa.
> 🔒 **`--rs-report-*` bất biến.** Không đụng kích thước tờ A4.

## 2. Scope

### In scope
- **S1** [src/components/WorkspaceLayout.css](src/components/WorkspaceLayout.css) (MODIFY): `.ws-shell` `100vw`→`100%` + `overflow-x:hidden`.
- **S2** [src/components/WorkspaceLayout.css](src/components/WorkspaceLayout.css) + [src/app/globals.css](src/app/globals.css) (MODIFY): gỡ một lớp `overflow:auto` thừa ở editor; bảo đảm preview không cuộn ngang toàn trang (chỉ table).

### Out of scope
- ❌ Dedup `.ws-shell` trùng (→ **w15_polish_duplicate_dead_css_***).
- ❌ flex-shrink cột phụ (→ contract riêng).
- ❌ Zoom/scale preview (→ contract riêng).

## 3. Checklist
- [ ] **S1** không còn scroll ngang tổng ở 1366/1280/1024; `.ws-shell` width `100%`.
- [ ] **S2** editor chỉ một thanh cuộn dọc; preview không cuộn ngang toàn trang (table tự cuộn nếu rộng).
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/WorkspaceLayout.css` | MODIFY | S1 width + S2 editor overflow |
| `src/app/globals.css` | MODIFY | S2 `cm-parent`/table overflow nếu cần |

> **Import boundary:** chỉ CSS. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Bỏ overflow editor làm mất cuộn | Med | Giữ đúng một lớp cuộn; verify file dài cuộn được. |
| `overflow-x:hidden` ẩn nội dung tràn hợp lệ | Low | Chỉ ẩn ở shell; nội dung tràn thật (table) có cuộn riêng. |

## 6. Verification Plan
- Resize 3 viewport: không có scrollbar ngang ở đáy cửa sổ/preview.
- Editor dán văn bản dài: cuộn dọc mượt, một thanh.
- Preview chèn bảng rộng: chỉ bảng cuộn ngang, trang không.
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `fix(shell): width 100% to kill ghost horizontal scroll`; `fix(shell): collapse nested editor scroll containers`.
