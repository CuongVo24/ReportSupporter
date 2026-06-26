# Contract For AI — W15 Fix: Cột phụ thiếu `flex-shrink:0` → Panel Phải Bị Bóp Nát Ở 1366px

> **Lane:** Core / break_task / week15_break.
> **Branch:** `fix/w15-shell-flexshrink`.
> **Type:** Layout-correctness — finding **S1** (High, hai `.ws-side-column` đặt `width` cố định nhưng không khóa `flex-shrink` trong flex row → ở màn hẹp bị co dưới width, panel phải nát, chữ wrap từng cụm: "oát báo", "Tạo repo" cụt). Review toàn dự án sau 15 tuần (session 2026-06-26, ảnh user 1366×768).
> **Builds on:** Group A shell (`WorkspaceLayout.tsx`, `WorkspaceLayout.css`).
> **Sources:** Review 2026-06-26; `month4/W14/w14a` (shell adoption); `DesignSystem_Tokens.md §4.5` (`--rs-rail-*`); ảnh hiện trạng (panel phải ~60px thay vì 320px).

---

## 1. Micro-task Target

Khóa chiều rộng hai cột phụ để chúng **không bị flexbox co** khi tổng nội dung vượt viewport. Đây là gốc lỗi #1 (layout vỡ ngang) và #3 (panel phải sai kích thước) trong bảng review. **Không** đổi width token, **không** đổi public surface `WorkspaceLayoutProps`, **không** đổi behavior split-drag.

- **S1 — `.ws-side-column` thiếu `flex-shrink:0`; core thiếu `min-width:0`.** [WorkspaceLayout.css:120-130](src/components/WorkspaceLayout.css#L120) khai báo `.ws-side-column { width:…; … }` nhưng **không** có `flex-shrink:0`. `.ws-main-layout` là `display:flex` ([WorkspaceLayout.css:110-117](src/components/WorkspaceLayout.css#L110)); `.ws-workspace-core` đặt `flex:1` ([:422-429](src/components/WorkspaceLayout.css#L422)). Vì `flex-shrink` mặc định = 1, khi không đủ chỗ flexbox co **cả ba** theo tỉ lệ → cột phải `--rs-rail-right-width:320px` ([globals.css:109](src/app/globals.css#L109)) bị nén còn ~60px như ảnh, nội dung wrap vỡ. **Fix:** thêm `flex-shrink:0` (hoặc `flex:0 0 var(--rs-rail-*-width)`) cho `.ws-side-column-left--expanded/--collapsed` và `.ws-side-column-right--expanded/--collapsed`; thêm `min-width:0` cho `.ws-workspace-core` để chính core (chứa editor/preview co được) hấp thụ phần thiếu thay vì cột phụ. Sau fix, ở 1366px hai cột phụ giữ đúng 240/320px, editor+preview tự co.

> 🔒 **Không đổi public surface / behavior (Locked shell).** Chỉ thêm thuộc tính flex; không đổi width token, không đổi split-drag/scale.
> 🔒 **Token-only.** Không thêm px mới; dùng `--rs-rail-*-width` sẵn có.

## 2. Scope

### In scope
- **S1** [src/components/WorkspaceLayout.css](src/components/WorkspaceLayout.css) (MODIFY): `flex-shrink:0` cho 4 lớp side-column; `min-width:0` cho `.ws-workspace-core` (và `.ws-split-pane-editor`/`.ws-split-pane-preview` nếu cần để text không đẩy core rộng).

### Out of scope
- ❌ Breakpoint tiers / drawer assistant (→ **w15_fix_responsive_breakpoint_tiers_***).
- ❌ `width:100vw` scroll ngang (→ **w15_fix_shell_100vw_***).
- ❌ Đổi width token, đổi `WorkspaceLayoutProps`.

## 3. Checklist
- [ ] **S1** 4 lớp `.ws-side-column-*` có `flex-shrink:0`; `.ws-workspace-core` có `min-width:0`.
- [ ] Ở 1366px: cột trái = 240px, phải = 320px, không nén; editor+preview co lại tương ứng.
- [ ] Collapse rail vẫn 48px; split-drag và A4 scale không đổi.
- [ ] 4 gate (lint/typecheck/test/build) xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/WorkspaceLayout.css` | MODIFY | `flex-shrink:0` side-column + `min-width:0` core |

> **Import boundary:** chỉ CSS, không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| `min-width:0` làm CodeMirror tràn | Low | Editor pane đã `overflow:auto`; verify cuộn dọc, không sinh scroll ngang. |
| Khóa shrink làm tràn ở <1024 | Low | <1024 dùng tab (không render aside), không ảnh hưởng. |

## 6. Verification Plan
- Resize 1366 → 1280 → 1024: hai cột phụ giữ width, core co; panel phải đọc được, không wrap từng cụm.
- DevTools: `.ws-side-column-right--expanded` computed width = 320px.
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. **Ưu tiên #1 toàn batch (đòn bẩy cao nhất, rủi ro thấp).** Commit: `fix(shell): lock side-column flex-shrink so panels keep width`.
