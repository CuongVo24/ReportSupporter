# Contract For AI — W15 Fix: Chỉ Một Breakpoint `1024` → Thiếu Nấc Thu Gọn Assistant Ở Laptop 1366

> **Lane:** Core / break_task / week15_break.
> **Branch:** `fix/w15-responsive-tiers`.
> **Type:** Responsive-correctness — finding **S1** (Med-High, `isDesktop` chỉ 2 trạng thái: ≥1024 hiện đủ 4 cột, <1024 chuyển tab → 1366px rơi vào "desktop đầy đủ" nên quá tải). Review toàn dự án (2026-06-26).
> **Builds on:** Group A shell (`WorkspaceLayout.tsx`).
> **Sources:** Review 2026-06-26; đề xuất tier: ≥1440 đủ 4 cột · 1024–1439 assistant thành drawer · 768–1023 editor/preview tab · <768 một cột.

---

## 1. Micro-task Target

Thêm nấc breakpoint trung gian để màn laptop phổ thông (1366) không phải nhồi đủ 4 cột. Gốc lỗi #20 (và giảm nhẹ #1/#3). **Không** đổi nội dung từng panel, **không** đổi `WorkspaceLayoutProps`.

- **S1 — `matchMedia("(min-width:1024px)")` là breakpoint duy nhất.** [WorkspaceLayout.tsx:55-61](src/components/WorkspaceLayout.tsx#L55) chỉ phân `isDesktop`. ≥1024 render đủ left aside + split editor/preview + right aside ([:152-238](src/components/WorkspaceLayout.tsx#L152)). 1366px vẫn = desktop đầy đủ → 4 cột tranh ngang. Đã có sẵn `MobileDrawer` và state `isRightDrawerOpen`/`isLeftDrawerOpen` ([:42-43](src/components/WorkspaceLayout.tsx#L42)) nhưng chỉ dùng khi `!isDesktop`. **Fix:** thêm tầng `isWide` (`min-width:1440px`). Logic:
  - `isWide` (≥1440): giữ nguyên 4 cột như hiện tại.
  - `isDesktop && !isWide` (1024–1439): **editor + preview** giữ split; **right aside** không render cố định mà mở dạng drawer qua nút sẵn có (tái dùng `MobileDrawer side="right"` + `isRightDrawerOpen`); left aside có thể giữ collapsed-rail mặc định.
  - `!isDesktop` (<1024): giữ nguyên tab hiện tại.
  Tái dùng tối đa cơ chế drawer đã có; chỉ mở rộng điều kiện render, không viết drawer mới.

> 🔒 **Không đổi nội dung panel / public surface.** Chỉ đổi điều kiện render theo viewport; `sidePanel`/`editor`/`preview` props nguyên vẹn.
> 🔒 **Không phá <1024.** Tab editor/preview + 2 drawer hiện tại giữ nguyên.

## 2. Scope

### In scope
- **S1** [src/components/WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) (MODIFY): thêm `isWide` matchMedia 1440; nhánh 1024–1439 đưa right aside vào drawer; nút mở assistant hiện ở topbar cho tầng này.

### Out of scope
- ❌ flex-shrink cột (→ contract riêng) — bổ trợ nhưng tách.
- ❌ Đổi nội dung 5 tab assistant / IA (→ **w15_polish_ia_workflow_***).
- ❌ Viết drawer mới (tái dùng `MobileDrawer`).

## 3. Checklist
- [ ] **S1** ở 1366px: right assistant mặc định **không** chiếm cột cố định, mở bằng nút (drawer); editor+preview rộng rãi.
- [ ] ≥1440 vẫn đủ 4 cột như cũ; <1024 vẫn tab.
- [ ] Nút mở/đóng assistant ở tầng 1024–1439 hoạt động; Esc/backdrop đóng drawer.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/WorkspaceLayout.tsx` | MODIFY | thêm tier `isWide`, route right aside → drawer ở 1024–1439 |

> **Import boundary:** tái dùng `MobileDrawer` đã import; không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Thêm tier làm rối state | Med | Dùng đúng `isRightDrawerOpen` sẵn có; chỉ thêm 1 media query. |
| Nút mở assistant thiếu ở tier giữa | Med | Hiện nút topbar khi `isDesktop && !isWide`. |
| SSR mismatch matchMedia | Low | Giữ pattern `useEffect`+`useState` như `isDesktop`. |

## 6. Verification Plan
- Resize 1500 → 1366 → 1100 → 900: lần lượt 4-cột → (split + drawer assistant) → (split + drawer) → tab.
- Mở/đóng assistant drawer ở 1366; focus trap + Esc.
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Làm **sau** `w15_fix_side_column_flexshrink_*`. Commit: `fix(shell): add 1440 tier; assistant becomes drawer on laptop widths`.
