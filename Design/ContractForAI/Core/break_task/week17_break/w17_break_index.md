# W17 Break — Index Contract (Nâng UX: Thoát Ngõ Cụt Màn Trống + Markdown→PPTX Thật)

> **Lane:** Core / break_task / week17_break.
> **Branch (chung cả tuần):** `w17/upgrade-ux` — **toàn bộ contract W17 cùng đi trên một nhánh duy nhất**, không tách nhánh con như W16.
> **Nguồn:** Review UX (session 2026-06-28) trên build hiện tại — người dùng gặp 2 nỗi đau gốc khi báo cáo về trạng thái rỗng và khi muốn ra slide: (a) **Màn "Báo cáo trống" là ngõ cụt** — xóa hết mục thì kẹt cứng, không thêm được section, không thả/nhập được markdown, không có đường về trang bắt đầu; (b) **Markdown→PPTX chưa làm** — nút "Xuất PPTX (Phase 3)" bị disable cứng dù dữ liệu slide đã sẵn.
> **Cách viết:** theo format `week16_break` (Lane/Branch/Type · Micro-task S-findings · Locked · Scope · Checklist · Files · Risks · Verification · Status). Khác W16 ở chỗ **Branch dùng chung `w17/upgrade-ux`** cho mọi contract.

## Map nỗi đau review → contract

| # Nỗi đau (review) | Contract |
|---|---|
| 1 Màn "Báo cáo trống" kẹt cứng — không add section, không nhập markdown, không về được trang bắt đầu | `w17_fix_empty_report_recovery_hub` |
| 2 Chưa convert Markdown/Outline → PPTX (nút disable "Phase 3") | `w17_feat_present_export_pptx` |

## Root cause (đã truy ra trong review)

- **#1** — Nhánh `!activeSection` ([Workspace.tsx:634-646](src/components/Workspace.tsx#L634)) render `EmptyState` **không** truyền `actionLabel`/`onAction` (dù [EmptyState.tsx:8-9,25-29](src/components/states/EmptyState.tsx#L8) hỗ trợ), đồng thời set `sidePanel={null}` → mất cả 2 nút "Nhập Markdown" + "Tạo báo cáo" (vốn ở [Workspace.tsx:699-718](src/components/Workspace.tsx#L699)) và không truyền `onAddSection`. Trạng thái này bị kích hoạt khi xóa mục cuối — `executeDeleteSection` đặt `activeId = null` ([Workspace.tsx:262-263](src/components/Workspace.tsx#L262)) → `sections` rỗng → ngõ cụt.
- **#2** — Nút PPTX bị `disabled` cứng ([PresentPanel.tsx:109-121](src/modules/present/PresentPanel.tsx#L109)) dù `usePresent` đã cấp đủ `slides`/`speakers`/`scripts`/`timeline` ([PresentPanel.tsx:26-41](src/modules/present/PresentPanel.tsx#L26)). Thiếu mỗi bước convert `SlideOutline[]` → file `.pptx`.

## Thứ tự đề xuất (rủi ro thấp & đòn bẩy cao trước)

1. `w17_fix_empty_report_recovery_hub` — #1 (sửa bug kẹt; tác động lớn, không thêm lib; tái dùng `handleCreateSection`/import dialog/`isInitializing` đã có).
2. `w17_feat_present_export_pptx` — #2 (tính năng mới; cần thêm 1 lib `pptxgenjs` client-side; nối vào hệ thống job export đã có).

## Locked dùng chung mọi contract
- 🔒 **Một nhánh duy nhất `w17/upgrade-ux`** cho cả tuần. Mỗi contract = 1 commit logic riêng trên nhánh này (không tạo nhánh con).
- 🔒 **Privacy-first cho luồng không-AI giữ nguyên.** Export PPTX chạy **client-side**, không gửi nội dung báo cáo ra mạng; không phụ thuộc cấu hình AI.
- 🔒 **Không phá `ReportSection` shape / `CanonicalTypes`.** Recovery hub chỉ tái dùng handler có sẵn; không đổi public surface của types trừ khi contract ghi rõ (vd mở `ExportTarget` thêm `"pptx"` — có chủ đích, ghi trong contract #2).
- 🔒 **Token-only / no-hex ngoài primitive**; giọng microcopy theo `VoiceAndContent.md §7`.
- 🔒 **Chỉ thêm lib khi contract nêu rõ.** W17 chỉ cho phép `pptxgenjs` (trong #2); recovery hub không thêm lib.
- 🔒 `--rs-report-*` bất biến — tờ A4 luôn trắng-đen.

## Cảnh báo phạm vi (đọc trước khi Approve)
- #2 PPTX **thêm dependency** `pptxgenjs` (~bundle nặng). Cân nhắc `import()` động để tránh phình bundle trang chính. Cần cập nhật `Design/` (Module Present / Export) khi Approve.
- #1 cần chốt hành vi khi xóa mục cuối: **hiện màn trống có nút** hay **tự về `ProjectInitializer`** — contract đề xuất "màn trống có nút" làm mặc định, kèm option tự-về như biến thể (chọn lúc Approve).

> Tất cả contract đã `COMPLETED` và lên `w17/upgrade-ux` (đã merge vào `main`).
