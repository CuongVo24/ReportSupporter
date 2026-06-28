# Contract For AI — W18 Feat (A1): Command Palette (Ctrl/⌘+K)

> **Lane:** Core / break_task / week18_break.
> **Branch:** `w18/upgrade-ai` (nhánh chung cả tuần).
> **Type:** UX / discoverability — finding **S1** (Med, [Workspace.tsx:513-602](src/components/Workspace.tsx#L513) đã có ~8 phím tắt (thêm mục `Ctrl+Shift+N`, nhân đôi `Ctrl+Shift+D`, move `Alt+↑/↓`, soát `Ctrl+Enter`, preview `Ctrl+P`, xuất `Ctrl+Shift+E`, lưu `Ctrl+S`) nhưng **không có chỗ nào khám phá được** → người dùng không biết). Brainstorm 2026-06-28.
> **Builds on:** handler có sẵn trong Workspace; UI `Dialog` ([components/ui/Dialog.tsx](src/components/ui/Dialog.tsx)).
> **Sources:** Brainstorm 2026-06-28; `VoiceAndContent.md §7`.

---

## 1. Micro-task Target

Một bảng lệnh tìm-kiếm-được gom mọi hành động + phím tắt vào một nơi, mở bằng `Ctrl/⌘+K`. **Không thêm lib** — dùng `Dialog` + filter input thuần.

- **S1 — Command registry.** Khai báo danh sách lệnh thuần `{ id, label, hint(phím tắt), group, run() }` lấy từ các handler đã có (`handleCreateSection`, `handleCheck`, `handleOpenPreview`, `handleOpenExport`, `handleManualSave`, mở Cài đặt AI, Nhập Markdown, Tạo báo cáo…). Tách registry ra hàm/hook để test được.
- **S2 — Palette UI.** `CommandPalette` dựa trên `Dialog`: ô tìm kiếm + danh sách lọc theo nhãn/nhóm, điều hướng `↑/↓`, `Enter` chạy, `Esc` đóng. Hiện phím tắt bên phải mỗi lệnh (vừa chạy vừa dạy).
- **S3 — Wiring + phím mở.** Đăng ký `Ctrl/⌘+K` trong listener phím sẵn có ([Workspace.tsx:513-602](src/components/Workspace.tsx#L513)); palette dùng chung nguồn handler để không lệch hành vi với phím tắt rời.
- **S4 — A11y.** `role="dialog"` + `aria-activedescendant`/listbox pattern, focus trap, trả focus về editor khi đóng.

> 🔒 **Một nguồn sự thật cho lệnh** — palette và phím tắt rời gọi cùng handler (không nhân bản logic).
> 🔒 **Không thêm lib.** Token-only, giọng `§7`.

## 2. Scope

### In scope
- [src/components/CommandPalette.tsx](src/components/CommandPalette.tsx) (NEW): UI + filter + a11y.
- [src/components/command-registry.ts](src/components/command-registry.ts) (NEW): kiểu `Command` + builder thuần từ handler.
- [src/components/command-registry.test.ts](src/components/command-registry.test.ts) (NEW): unit (lọc, nhóm, hint khớp phím tắt).
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): mở bằng `Ctrl/⌘+K`, truyền handler vào registry.
- [src/app/globals.css](src/app/globals.css) (MODIFY): style palette (token).

### Out of scope
- ❌ Đổi/ thêm phím tắt mới (chỉ phơi bày cái đã có).
- ❌ Lệnh AI sinh nội dung (palette chỉ điều hướng/hành động UI).

## 3. Checklist
- [ ] **S1** Registry liệt kê đủ lệnh hiện hành, mỗi lệnh có hint phím tắt đúng.
- [ ] **S2** `Ctrl/⌘+K` mở; gõ để lọc; `↑/↓/Enter/Esc` hoạt động.
- [ ] **S3** Palette gọi đúng handler (không lệch với phím tắt rời).
- [ ] **S4** Focus trap + trả focus editor; aria đúng listbox. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/CommandPalette.tsx` | NEW | UI palette |
| `src/components/command-registry.ts` | NEW | kiểu + builder thuần |
| `src/components/command-registry.test.ts` | NEW | unit |
| `src/components/Workspace.tsx` | MODIFY | phím mở + wiring |
| `src/app/globals.css` | MODIFY | style (token) |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Lệch hành vi palette vs phím tắt | Med | Cùng một nguồn handler; test khớp hint. |
| Phím `Ctrl+K` đụng trình duyệt | Low | `preventDefault` trong listener; tránh khi đang ở native input. |
| Focus trap rối a11y | Med | Theo listbox pattern; test bàn phím. |

## 6. Verification Plan
- `Ctrl/⌘+K` mở palette; lọc "soát" → chạy đúng checker.
- Mỗi lệnh chạy = đúng hành vi phím tắt tương ứng.
- Keyboard-only đi trọn vòng; 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w18/upgrade-ai`): `feat(ui): command palette (ctrl+k) surfacing existing actions and shortcuts`.
