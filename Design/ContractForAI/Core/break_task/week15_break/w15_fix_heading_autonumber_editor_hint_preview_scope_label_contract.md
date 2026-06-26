# Contract For AI — W15 Fix: `#` Thành "2 …" Trong Preview Mà Editor Không Báo — Thiếu Hint & Nhãn Phạm Vi

> **Lane:** Core / break_task / week15_break.
> **Branch:** `fix/w15-heading-number-hint`.
> **Type:** Clarity / affordance — finding **S1** (Med, heading tự đánh số toàn cục → "Thành viên & Phân công" (section 2) hiện "2 …" trong preview, editor chỉ thấy `#` → gây bối rối), **S2** (Low-Med, preview không nhãn rõ đang xem **chương hiện tại** hay **toàn báo cáo** + mục lục tự sinh). Review toàn dự án (2026-06-26).
> **Builds on:** Module 2 format (`PreviewPane.tsx`, `numberHeadings`).
> **Sources:** Review 2026-06-26; `VoiceAndContent.md §7` (microcopy).

---

## 1. Micro-task Target

Làm người dùng hiểu vì sao có số "2" và đang preview phạm vi gì. Gốc lỗi #11. **Không** đổi thuật toán đánh số (đúng theo thiết kế), chỉ thêm tín hiệu giải thích.

- **S1 — Đánh số tự động không có hint trong editor.** [PreviewPane.tsx:43-88](src/components/PreviewPane.tsx#L43) `injectHeadingNumbers` + [:238-246](src/components/PreviewPane.tsx#L238) `numberHeadings` chèn tiền tố số toàn cục (lọc theo `activeSectionId`). Section "Thành viên & Phân công" là thứ 2 → "2 ". Editor (CodeMirror) chỉ hiển thị `#` thô → user tưởng lỗi. **Fix (không đổi số):** thêm **hint** cạnh editor/preview, vd dòng chú thích nhỏ: "Tiêu đề được tự đánh số khi xuất bản — bạn không cần gõ số." Đặt ở header vùng preview hoặc dưới toolbar editor; token-only, theo `VoiceAndContent §7`.
- **S2 — Preview không nhãn phạm vi.** PreviewPane render TOC tự sinh + nội dung; user không rõ là toàn báo cáo hay chương hiện tại. `sections`+`activeSectionId` được truyền vào ([PreviewPane.tsx:164-171](src/components/PreviewPane.tsx#L164)). **Fix:** thêm nhãn nhỏ đầu preview: "Xem trước: chương hiện tại" / "Xem trước: toàn báo cáo" tùy chế độ; nếu chỉ render chương active thì ghi rõ. Chỉ nhãn, không đổi logic render.

> 🔒 **Không đổi thuật toán đánh số / pipeline.** Số vẫn tính như cũ; chỉ thêm hint + nhãn.
> 🔒 **Token-only + giọng `VoiceAndContent §7`.**

## 2. Scope

### In scope
- **S1** [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx) hoặc shell preview header (MODIFY): thêm hint "tự đánh số khi xuất bản".
- **S2** [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx) (MODIFY): nhãn phạm vi preview.

### Out of scope
- ❌ Đổi `numberHeadings`/`injectHeadingNumbers`.
- ❌ Zoom/scale, màu giấy (→ contract riêng).

## 3. Checklist
- [ ] **S1** có hint giải thích heading tự đánh số (gần editor hoặc preview).
- [ ] **S2** preview có nhãn rõ "chương hiện tại" / "toàn báo cáo".
- [ ] Không đổi số heading thực tế.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/PreviewPane.tsx` | MODIFY | hint + nhãn phạm vi |
| `src/components/WorkspaceLayout.css` / `globals.css` | MODIFY | style hint (token) |

> **Import boundary:** không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Hint chiếm chỗ preview | Low | Một dòng nhỏ, có thể dismiss/nằm trong header. |
| Nhãn sai phạm vi | Low | Suy từ `sections`/`activeSectionId` đã truyền sẵn. |

## 6. Verification Plan
- Mở section 2: preview hiện "2 …" + có hint giải thích; editor vẫn `#`.
- Nhãn phản ánh đúng chế độ render.
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `fix(preview): explain auto-numbered headings + label preview scope`.
