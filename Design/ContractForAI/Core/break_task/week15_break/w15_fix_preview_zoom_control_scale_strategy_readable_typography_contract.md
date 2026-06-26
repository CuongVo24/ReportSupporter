# Contract For AI — W15 Fix: Preview Chỉ Auto-Scale → Trang Co ~0.44, Chữ Li Ti, Không Có Zoom Control

> **Lane:** Core / break_task / week15_break.
> **Branch:** `fix/w15-preview-zoom`.
> **Type:** Readability / control — finding **S1** (Med-High, scale tính `availableWidth/794` → ở split 50% màn 1366 ra ~0.44, body 13pt hiển thị ~5–6px, khoảng trắng chết dưới do `transform-origin:top center`), **S2** (Med, không có UI zoom/Fit-width/% — user không biết đang ở scale bao nhiêu). Review toàn dự án (2026-06-26).
> **Builds on:** Group A shell (`WorkspaceLayout.tsx`, `WorkspaceLayout.css`).
> **Sources:** Review 2026-06-26; đề xuất control: Fit width · 75% · 100% · 125% · Page width · Actual size.

---

## 1. Micro-task Target

Cho người dùng kiểm soát zoom preview + đặt mặc định ưu tiên đọc được thay vì "nhét cả trang". Gốc lỗi #5 (scale) và #12 (typography nhỏ). **Không** đổi nội dung render, **không** đổi `--rs-report-*`.

- **S1 — Auto-scale ép nhỏ, origin top tạo khoảng trắng chết.** [WorkspaceLayout.tsx:89-108](src/components/WorkspaceLayout.tsx#L89): `availableWidth = viewport.clientWidth - 48; a4Width=794; nextScale = availableWidth/794`. Ở 1366 với split 50% + 2 rail, nửa preview ~350px → scale ~0.44 → A4 794px co còn ~350, chữ body 13pt × 0.44 ≈ 6px. `.ws-preview-scale-wrapper { transform-origin: top center }` ([WorkspaceLayout.css:516-522](src/components/WorkspaceLayout.css#L516)) khiến phần dưới khi scale nhỏ để lộ vùng trống. **Fix:** đổi chiến lược — mặc định **Fit width** (scale để A4 lấp đúng bề rộng khả dụng, không nhỏ hơn ngưỡng đọc được, vd min 0.6) **nhưng** cho phép user override; khi user chọn % cụ thể thì bỏ auto.
- **S2 — Thiếu zoom control hiển thị.** Hiện scale chỉ là state nội bộ `scale` ([:48](src/components/WorkspaceLayout.tsx#L48)), không có UI. **Fix:** thêm thanh nhỏ ở đầu/đáy vùng preview: `Fit width | 75% | 100% | 125% | Actual` (token-only, dùng primitive Button/Select sẵn có). Lưu lựa chọn vào state `zoomMode`; auto-fit chỉ chạy khi `zoomMode==="fit"`. Hiển thị % hiện tại. Giữ inline `transform: scale()` (giá trị runtime hợp lệ).

> 🔒 **Không đổi nội dung render / `--rs-report-*`.** Chỉ đổi hệ số scale + thêm control; A4 794px và margin giữ nguyên.
> 🔒 **Token-only.** Control dùng primitive + token; không hex/px thô mới.

## 2. Scope

### In scope
- **S1** [src/components/WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) (MODIFY): đổi công thức scale (fit-width + min đọc-được), tôn trọng `zoomMode`.
- **S2** [src/components/WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) + [src/components/WorkspaceLayout.css](src/components/WorkspaceLayout.css) (MODIFY): thanh zoom control + style token.

### Out of scope
- ❌ Màu nội dung preview (→ **w15_fix_preview_content_paper_***).
- ❌ Heading numbering hint (→ contract riêng).
- ❌ Đổi A4 size/margin/pipeline.

## 3. Checklist
- [ ] **S1** mặc định Fit-width không xuống dưới ngưỡng đọc; không còn khoảng trắng chết lớn.
- [ ] **S2** zoom control hoạt động (Fit/75/100/125/Actual), hiện % hiện tại; chọn % thì tắt auto-fit.
- [ ] Resize vẫn cập nhật khi ở chế độ Fit; A4 794px/margin không đổi.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/WorkspaceLayout.tsx` | MODIFY | scale strategy + `zoomMode` + control UI |
| `src/components/WorkspaceLayout.css` | MODIFY | style thanh zoom (token) |

> **Import boundary:** primitive `Button`/`Select` từ `@/components/ui`; không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Min-scale làm A4 tràn ngang khi pane hẹp | Med | Khi tràn cho preview cuộn ngang trong vùng riêng, không phá layout. |
| Control chiếm chiều cao preview | Low | Thanh mảnh ~28px token control-height-sm. |
| ResizeObserver loop | Low | Giữ guard hiện có; chỉ recompute khi `zoomMode==="fit"`. |

## 6. Verification Plan
- 1366 split 50%: mặc định đọc được (≥ ~0.6); chọn 100% → A4 thật + cuộn; Actual size đúng 1:1.
- Resize ở Fit cập nhật; ở % cố định giữ nguyên.
- 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `fix(preview): fit-width scaling with readable floor`; `feat(preview): add zoom control (fit/75/100/125/actual)`.
