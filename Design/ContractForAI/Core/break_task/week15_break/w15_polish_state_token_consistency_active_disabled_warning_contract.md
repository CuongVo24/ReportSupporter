# Contract For AI — W15 Polish: Trạng Thái Active/Disabled/Warning Không Thống Nhất Token

> **Lane:** Core / break_task / week15_break.
> **Branch:** `polish/w15-state-tokens`.
> **Type:** Design-token consistency — finding **S1** (Low-Med, nhiều cơ chế biểu thị trạng thái rời rạc: toolbar không disabled mà chỉ mờ, AI note chỉ là text vàng, tab active của primitive, sidebar active chỉ vạch xanh → user không phân biệt được active/click-được/disabled/cảnh báo). Gốc lỗi #17. Review toàn dự án (2026-06-26).
> **Builds on:** `globals.css`, `WorkspaceLayout.css`, primitives (`Tabs`, `Button`).
> **Sources:** Review 2026-06-26; `DesignSystem_Tokens.md §2.2/§2.3`.

---

## 1. Micro-task Target

Thống nhất **một bộ quy ước** cho 4 trạng thái (active / enabled / disabled / warning) để mọi thành phần dùng chung token + affordance. Gốc lỗi #17. **Không** đổi logic, chỉ chuẩn hóa biểu đạt.

- **S1 — Các trạng thái biểu đạt bằng cách khác nhau.** Ví dụ rời rạc:
  - Toolbar editor: không có `disabled` thật, chỉ contrast thấp ([EditorPanel.tsx:145-152](src/components/EditorPanel.tsx#L145)) → giống disabled giả (đã xử lý contrast ở **w15_fix_editor_surface_***, ở đây là quy ước).
  - AI note: chỉ `<span>` màu warning ([AiAssistBar.tsx:118-122](src/modules/write/ai/AiAssistBar.tsx#L118)) — không icon nhất quán/affordance.
  - Tab phải: primitive `Tabs` ([Workspace.tsx:226-245](src/components/Workspace.tsx#L226)).
  - Sidebar active: chỉ `border-left:3px` ([WorkspaceLayout.css:355-358](src/components/WorkspaceLayout.css#L355)).
  - Save status: chỉ dựa màu xanh ([globals.css:100-107](src/app/globals.css#L100)).
  **Fix:** định nghĩa **state convention** (ưu tiên dựa token có sẵn `--rs-color-primary`/`text-muted`/`severity-*`): active = primary + đậm + chỉ báo (không chỉ vạch); disabled = `opacity`/`cursor:not-allowed` + tooltip, dùng nhất quán (primitive Button đã có `:disabled`); warning = icon + màu severity (không chỉ màu). Áp đồng nhất cho sidebar/tab/nút/note. Ghi convention vào `DesignSystem_Tokens.md`. Đây là chuẩn hóa **biểu đạt**, không đổi hành vi.

> 🔒 **Không đổi logic / public surface.** Chỉ thống nhất class/token trạng thái + affordance.
> 🔒 **Token-only.** Dùng `--rs-color-*` semantic; không hex thô.

## 2. Scope

### In scope
- **S1** [src/app/globals.css](src/app/globals.css) + [src/components/WorkspaceLayout.css](src/components/WorkspaceLayout.css) (MODIFY): chuẩn hóa active/disabled/warning; [DesignSystem_Tokens.md](Design/Modules/Other/DesignSystem_Tokens.md) (MODIFY): ghi convention.

### Out of scope
- ❌ Toolbar contrast fix (đã ở **w15_fix_editor_surface_***).
- ❌ A11y contrast/font (→ **w15_polish_accessibility_***).
- ❌ Đổi logic state.

## 3. Checklist
- [ ] **S1** active/disabled/warning có quy ước thống nhất; sidebar active không chỉ vạch; warning có icon+màu; disabled có cursor+tooltip.
- [ ] Convention ghi trong `DesignSystem_Tokens.md`.
- [ ] Không đổi hành vi; 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/globals.css` | MODIFY | state classes |
| `src/components/WorkspaceLayout.css` | MODIFY | sidebar/tab active |
| `Design/Modules/Other/DesignSystem_Tokens.md` | MODIFY | state convention |

> **Import boundary:** không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Chuẩn hóa làm đổi nhiều chỗ | Med | Làm từng nhóm (sidebar/tab/note); verify thị giác. |
| Trùng với fix contrast | Low | Phối hợp: fix lo màu chữ, polish lo quy ước state. |

## 6. Verification Plan
- Soi từng trạng thái: active rõ (không chỉ vạch), disabled có cursor+tooltip, warning có icon.
- 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Làm **sau** `w15_fix_editor_surface_*`. Commit: `polish(ui): unify active/disabled/warning state tokens`.
