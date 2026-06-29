# Contract For AI — W20 Fix (E): Editor/Preview UX (Zoom · Sync · Sidebar · Hierarchy · Dark · Parity)

> **Lane:** Core / break_task / week20_break.
> **Branch:** `w20/import-fidelity` (nhánh chung cả tuần).
> **Type:** UX/readability + visual hierarchy. **Approve theo lát** (tách "bug" khỏi "tiện ích").
> **Findings:**
> - **S1** (🟠) — **Preview khó đọc** (#9, #31): zoom kẹt ~63% "Tự động", không có preset (50/75/100/125/Fit-Width); preview ≠ PDF do dùng nhánh CSS `@media screen` khác hẳn `@media print` ([print-css.ts:58](src/modules/export/print-css.ts#L58)).
> - **S2** (🟠) — **Hierarchy thị giác ngược** (#14, #29): nút AI ("Viết lại/Cải thiện/Dịch/Chuẩn thuật ngữ") **toàn xanh** chiếm ~2 hàng ([toolbar]), trong khi Save/Export chìm ⇒ người dùng khó tìm hành động chính.
> - **S3** (🟡) — **Sidebar mục lục chật** (#11, #12): chữ "2.4 Wo…" bị cắt, không tooltip, không collapse để mở rộng editor.
> - **S4** (🟡) — **Phản hồi trạng thái** (#10, #15, #16, #30): thiếu sync-scroll preview↔editor; "Đã lưu" không nói rõ local/khi nào; pha export (đã có ở W19 `use-export`) chưa surface; preview luôn nền trắng chói cạnh editor tối.
> **Builds on:** `Workspace.tsx`, `EditorPanel.tsx`, `PreviewPane.tsx`, toolbar AI, `use-export.ts` (pha có sẵn), `globals.css`.
> **Sources:** Product Review 2026-06-29 (#9–#16, #29–#31).

---

## 1. Micro-task Target

Tăng khả năng đọc & rõ phân cấp **mà không** đổi pipeline render: zoom preset + parity, gom toolbar AI + nâng Save/Export, sidebar tooltip/collapse, sync-scroll & trạng thái rõ, dark preview tuỳ chọn.

- **S1 — Zoom preset & parity.** Thêm preset 50/75/100/125/Fit-Width cho preview. Đưa preview dùng **cùng** khung CSS in (hoặc tỉ lệ A4) để "preview ≈ PDF" (#31) — tái dùng `buildPrintCss` ở chế độ screen-scaled thay vì nhánh `@media screen` riêng.
- **S2 — Hierarchy.** Gom 4 nút AI thành **một** cụm/`AI ▼` (dropdown/segmented); Save/Export thành nút chính (primary token) nổi hơn AI. Giảm "biển xanh" — chỉ hành động chính dùng accent.
- **S3 — Sidebar.** Tooltip full title khi hover (#11); nút collapse `‹/›` để mở rộng editor (#12); item không cắt cứng.
- **S4 — Phản hồi.** Sync-scroll preview↔editor (#10, theo heading/anchor); save-status rõ ("✓ Đã lưu cục bộ • vài giây trước", #15); surface pha export đã có (#16); toggle **Dark Preview** (#30) giữ trang in trắng-đen khi export.

> 🔒 **Không** đổi nội dung render/đánh số (A/C/D lo). Chỉ lo trình bày & điều khiển.
> 🔒 Token-only, microcopy `§7`; trang in vẫn trắng-đen bất kể dark preview.

## 2. Scope

### In scope
- [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx) (MODIFY): zoom preset/Fit-Width; (opt) dùng khung print-css scaled; dark toggle.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): toolbar AI gom + nâng Save/Export; sidebar collapse; sync-scroll wiring; surface pha export.
- [src/modules/write/*toolbar*](src/modules/write) (MODIFY): gom nút AI thành cụm.
- [src/components/EditorPanel.tsx](src/components/EditorPanel.tsx) (MODIFY nhẹ): phát sự kiện scroll/anchor cho sync.
- [src/app/globals.css](src/app/globals.css) (MODIFY): token hierarchy, zoom, sidebar tooltip/collapse, dark preview.

### Out of scope
- ❌ Minimap/fold/line-highlight, search toàn tài liệu, outline navigator, track-changes (backlog W19 đã ghi).
- ❌ Đổi engine render/đánh số.

## 3. Checklist
- [ ] **S1** Zoom preset + Fit-Width; preview gần khớp PDF.
- [ ] **S2** Toolbar AI gom; Save/Export là hành động chính rõ.
- [ ] **S3** Sidebar tooltip + collapse mở rộng editor.
- [ ] **S4** Sync-scroll, save-status rõ, pha export hiển thị, dark preview. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/PreviewPane.tsx` | MODIFY | zoom/parity/dark |
| `src/components/Workspace.tsx` | MODIFY | toolbar gom, hierarchy, collapse, sync |
| `src/components/EditorPanel.tsx` | MODIFY | scroll/anchor events |
| `src/app/globals.css` | MODIFY | token hierarchy/zoom/sidebar/dark |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Parity preview↔PDF kéo theo đổi render | Med | Chỉ scale khung CSS in ở screen; không đổi HAST. |
| Sync-scroll giật khi nội dung dài | Med | Map theo heading/anchor + throttle. |
| Dark preview lẫn vào bản in | Med | Dark chỉ ở screen; export ép `--rs-report-*` trắng-đen. |
| Gom toolbar giấu hành động quen | Low | Segmented/`AI ▼` vẫn lộ nhãn; giữ phím tắt. |

## 6. Verification Plan
- Đổi zoom 50–125 + Fit-Width hoạt động; preview gần khớp layout PDF.
- Save/Export nổi hơn AI; toolbar 1 cụm AI.
- Hover sidebar ra full title; collapse mở rộng editor; cuộn editor → preview theo. Dark preview bật/tắt, PDF vẫn trắng-đen. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w20/import-fidelity`): `feat(ui): preview zoom presets & PDF parity, grouped AI toolbar with primary Save/Export, collapsible tooltip sidebar, sync-scroll, clear save state and dark preview`.
