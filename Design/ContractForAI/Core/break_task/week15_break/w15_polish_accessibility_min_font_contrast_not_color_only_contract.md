# Contract For AI — W15 Polish: Accessibility — Font Quá Nhỏ, Contrast Thấp, Trạng Thái Chỉ Dựa Màu

> **Lane:** Core / break_task / week15_break.
> **Branch:** `polish/w15-a11y`.
> **Type:** Accessibility — finding **S1** (Med, font dày đặc ở `xs=12`/`xxs=10`, preview scale nhỏ → khó đọc), **S2** (Low-Med, trạng thái save/warning **chỉ** dựa màu, contrast nút thứ cấp/disabled thấp, click target sidebar nhỏ). Gốc lỗi #18. Review toàn dự án (2026-06-26).
> **Builds on:** `globals.css` tokens, shell.
> **Sources:** Review 2026-06-26; WCAG AA (contrast ≥4.5 text, target ≥24–32px); ghi chú: axe automation + before/after ≥3 viewport là Phase 4 (tham chiếu `week14_break` Out-of-scope).

---

## 1. Micro-task Target

Nâng nền tảng a11y: cỡ chữ tối thiểu trong app shell, contrast đạt AA, trạng thái không chỉ dựa màu, target đủ lớn. Gốc lỗi #18. **Không** đổi `--rs-report-*` (A4 theo chuẩn in).

- **S1 — Cỡ chữ quá nhỏ.** [globals.css:70-73,106](src/app/globals.css#L70): `--rs-font-size-xs:12px`, `--rs-font-size-xxs:10px`, `sm:13px` — dùng rộng khắp panel/checker/preview-toc. Cộng preview bị scale (→ **w15_fix_preview_zoom_***) khiến chữ tài liệu càng nhỏ. **Fix:** đặt **sàn** chữ chính trong app shell ≥14px (body đã 14 ở [globals.css:159](src/app/globals.css#L159)); hạn chế `xxs=10` chỉ cho nhãn phụ thật sự; rà các chỗ `font-size-xs` cho nội dung đọc nhiều → nâng `sm`/`md`. Không phóng to vô tội vạ — chỉ nội dung cần đọc.
- **S2 — Phụ thuộc màu + contrast/target.** Save status chỉ màu ([globals.css:100-107](src/app/globals.css#L100)); warning chỉ màu vàng (nhiều nơi); nút disabled `opacity:0.6` ([globals.css:842-845](src/app/globals.css#L842)) có thể tụt dưới AA; click target sidebar item padding `space-3` ([WorkspaceLayout.css:340](src/components/WorkspaceLayout.css#L340)). **Fix:** trạng thái kèm **icon/text** (không chỉ màu) — phối với **w15_polish_state_token_***; bảo đảm contrast nút thứ cấp/disabled ≥ AA (chỉnh opacity → token màu muted đủ tương phản); target tối thiểu ~32px chiều cao cho item/nút. Giữ focus-visible (đã có nhiều nơi).

> 🔒 **`--rs-report-*` bất biến.** Chữ tài liệu A4 theo chuẩn in (pt), không ép theo a11y màn hình.
> 🔒 **Token-only.** Cỡ/contrast qua token; bổ sung token nếu cần.
> 🔒 **Không đóng Phase 4.** Axe automation + before/after đầy đủ vẫn là việc Phase 4 — đây là nền tảng.

## 2. Scope

### In scope
- **S1** [src/app/globals.css](src/app/globals.css) + panel CSS (MODIFY): sàn cỡ chữ nội dung đọc.
- **S2** [src/app/globals.css](src/app/globals.css) + [src/components/WorkspaceLayout.css](src/components/WorkspaceLayout.css) (MODIFY): icon/text cho trạng thái, contrast disabled, target size.

### Out of scope
- ❌ Axe automation + before/after ≥3 viewport (→ Phase 4).
- ❌ Preview zoom (→ contract riêng) — bổ trợ.
- ❌ Đổi token report.

## 3. Checklist
- [ ] **S1** nội dung đọc nhiều ≥14px; `xxs=10` chỉ còn nhãn phụ.
- [ ] **S2** save/warning có icon/text (không chỉ màu); contrast nút thứ cấp/disabled đạt AA; target ≥~32px.
- [ ] focus-visible giữ nguyên; 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/globals.css` | MODIFY | font floor, contrast, icon trạng thái |
| `src/components/WorkspaceLayout.css` | MODIFY | target size, sidebar/topbar |
| `Design/Modules/Other/DesignSystem_Tokens.md` | MODIFY (nếu cần) | token mới |

> **Import boundary:** `lucide-react` (đã có) cho icon trạng thái. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Nâng font phá layout chật | Med | Nâng có chọn lọc + verify panel không tràn. |
| Contrast đổi màu thương hiệu | Low | Chỉ chỉnh muted/disabled, giữ primary. |

## 6. Verification Plan
- Kiểm contrast (DevTools/axe thủ công) nút thứ cấp/disabled ≥4.5.
- Trạng thái save/warning đọc được khi giả lập mù màu (icon/text).
- Target sidebar/nút ≥32px.
- 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Phối với `w15_polish_state_token_*`. Commit: `polish(a11y): font floor, AA contrast, non-color status cues, larger targets`.
