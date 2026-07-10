# Contract For AI — W22 Fix (B): Hiệu Năng Preview — Re-parse Mỗi Render · Mermaid Re-import · `key={index}`

> **Lane:** Core / break_task / week22_break.
> **Branch:** `feature/W25-ui-redesign` (nhánh chung cả tuần).
> **Type:** Bug hiệu năng + correctness reconciliation. **Chạy sau A** để đo lại trên vòng render đã sạch.
> **Findings:**
> - **S1** (🟠) — **Preview dựng lại toàn bộ mỗi render.** Thân `contentParts.map` ([PreviewPane.tsx:351](src/components/PreviewPane.tsx#L351)-L389) gọi `resolveAssetRefs`→`parseMarkdown`→`injectHeadingNumbers`→`normalizeCaptions`→`renderMdastToHtml` cho **mọi phần** trên **mỗi** lần render, không memo hoá kết quả HTML theo nội dung phần. Mỗi keystroke (sau debounce 250ms) và mỗi lần đổi mục là một lần parse+render lại tất cả.
> - **S2** (🟠) — **Mermaid re-import + re-initialize + re-render mỗi lần.** `MermaidRenderer` `await import("mermaid")` rồi `mermaid.initialize` rồi `mermaid.render` **mỗi** lần effect `[code]` chạy ([MermaidRenderer.tsx:14](src/modules/write/MermaidRenderer.tsx#L14)-L49); không cache module-level, không tách `initialize` khỏi `render`. Với mục chứa `mermaid` + nội dung dài, đây là công việc nặng lặp lại gây đơ/giật rõ khi mở mục.
> - **S3** (🟡) — **`key={index}` cho danh sách phần.** Danh sách chia theo regex Mermaid ([PreviewPane.tsx:131](src/components/PreviewPane.tsx#L131)-L137) render với `key={index}` ([PreviewPane.tsx:360](src/components/PreviewPane.tsx#L360),L383); khi số phần / vị trí phần đổi (thêm/bớt khối `mermaid`), React tái dùng nhầm instance (`MermaidRenderer` ↔ `div` HTML) → trạng thái/DOM lệch.
> **Builds on:** `PreviewPane.tsx`, `MermaidRenderer.tsx`, pipeline `markdown-pipeline`/`format`. Đo lại **sau** khi (A) đã fix vòng ghi-đè khuếch đại churn.
> **Sources:** QA session 2026-07-10, phát hiện #3–#4 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Giảm công việc lặp trong preview để mở/soạn mục nặng-Mermaid mượt, và sửa `key` để reconciliation đúng — **không đổi diện mạo** preview/PDF.

- **S1 — Memo hoá render theo phần.** Cache HTML mỗi phần theo nội dung (+ ngữ cảnh đánh số/caption cần thiết) để phần không đổi không parse lại; chỉ phần thay đổi mới re-render. Giữ **một nguồn sự thật** với print (không tách nhánh render).
- **S2 — Mermaid một lần.** Đưa `import("mermaid")` + `mermaid.initialize` lên **module scope / một lần**; `render` chỉ chạy khi `code` đổi thật; giữ SVG cũ trong lúc vẽ để không nhấp nháy. Bảo toàn xử lý lỗi (`.mermaid-error`).
- **S3 — Key ổn định.** Thay `key={index}` bằng key theo **loại + nội dung/thứ tự ổn định** của phần để tránh tái dùng nhầm instance.

> 🔒 **Không đổi kết quả render:** preview sau fix phải khớp trước fix và khớp PDF (parity W20-E). Đây là tối ưu, không phải đổi phong cách.
> 🔒 Không thêm lib; dùng `useMemo`/module cache + mermaid đã cài.

## 2. Scope

### In scope
- [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx) (MODIFY): memo hoá HTML từng phần; key ổn định; giữ thứ tự đánh số/caption đúng (`renderState`/`captionState` không được lệch do memo).
- [src/modules/write/MermaidRenderer.tsx](src/modules/write/MermaidRenderer.tsx) (MODIFY): cache import + initialize một lần; render theo `code` đổi; chống nhấp nháy; giữ nhánh lỗi.
- (Điều tra) [src/components/WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) `ResizeObserver` zoom ([L144](src/components/WorkspaceLayout.tsx#L144)-L173): xác nhận `observer.observe(inner)` + `setHeight(inner…)` không tạo vòng layout khi nội dung đổi; chỉ sửa nếu profiler chỉ ra.

### Out of scope
- ❌ Đổi giao diện/màu sơ đồ Mermaid hay layout trang A4.
- ❌ Ảo hoá (virtualize) preview dài (backlog nếu memo chưa đủ).
- ❌ Gộp/đổi pipeline markdown dùng chung với export.

## 3. Checklist
- [ ] **Đo trước:** profiler xác nhận nút thắt (Mermaid render? re-parse? layout thrash?) — sửa theo bằng chứng.
- [ ] **S1** Phần không đổi không parse lại; mở/soạn mục nặng mượt hơn rõ (đo lại profiler).
- [ ] **S2** Mermaid import+initialize một lần; render chỉ khi `code` đổi; không nhấp nháy; lỗi vẫn hiện `.mermaid-error`.
- [ ] **S3** Key ổn định; thêm/bớt khối `mermaid` không lệch DOM/instance.
- [ ] Preview **giống hệt** trước fix và khớp PDF; đánh số heading/caption không sai. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/PreviewPane.tsx` | MODIFY | memo HTML từng phần; key ổn định; giữ đúng đánh số/caption |
| `src/modules/write/MermaidRenderer.tsx` | MODIFY | cache import+initialize; render theo code; chống nhấp nháy |
| `src/components/WorkspaceLayout.tsx` | MODIFY (nếu profiler chỉ ra) | chặn vòng ResizeObserver↔setHeight |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Memo hoá làm lệch đánh số heading/caption (state `renderState`/`captionState` xuyên phần) | High→mitigated | Memo phải bao gồm ngữ cảnh đánh số của phần; verify số hình/bảng/heading khớp trước-sau + khớp PDF. |
| Cache Mermaid module-level rò giữa nhiều instance/diagram | Med | Cache `initialize` một lần (global), nhưng `render` theo id/code riêng; test nhiều sơ đồ cùng trang. |
| Đổi key làm mất/nhân bản node preview | Low | Key theo loại+thứ tự ổn định; test thêm/bớt/di chuyển khối mermaid. |
| Tối ưu che lấp nút thắt thật (vd layout thrash) | Med | Bắt buộc profile trước; không "tối ưu mù". |

## 6. Verification Plan
- **Sau khi A fix**, tạo mục có 1 khối `mermaid` + ~40 đoạn văn; profile mở mục + gõ: xác nhận thời gian render giảm, không long-task đơ; chuyển vào/ra mục mượt.
- So sánh ảnh preview trước/sau fix: giống hệt; xuất PDF: khớp preview (đánh số hình/bảng/heading đúng chuỗi).
- Thêm khối `mermaid` thứ hai giữa văn bản rồi xoá: DOM không lệch, không sơ đồ "ma"; lỗi cú pháp mermaid vẫn hiện `.mermaid-error`.
- Re-test sync-scroll preview→editor (mục đã treo ở QA) sau khi A/B fix: xác nhận hai chiều hoặc mở finding riêng nếu vẫn lệch. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`
