# W19 Break — Index Contract (Hardening Xuất Bản: Hợp Nhất Renderer · Đánh Số · Caption · Ảnh · In)

> **Lane:** Core / break_task / week19_break.
> **Branch (chung cả tuần):** `w19/near-completed` — **toàn bộ contract W19 đi chung một nhánh duy nhất**, không tách nhánh con (giống cách W18 dùng `w18/upgrade-ai`).
> **Nguồn:** Product Review + UX/QA Audit trên giao diện đang chạy (session 2026-06-29) — danh sách ~61 phát hiện phân theo Critical/High/Medium/Low. Phân tích nguyên nhân gốc quy về **4 nguyên nhân hệ thống (A–D)** + một số lỗi thứ cấp về CSS in/editor.
> **Cách viết:** theo format `week17_break`/`week18_break` (Lane/Branch/Type · Micro-task S-findings · Locked · Scope · Checklist · Files · Risks · Verification · Status). Branch dùng chung `w19/near-completed` cho mọi contract.
> **Chủ đề tuần:** "near-completed" — đóng các khuyết tật xuất bản (PDF/Preview/TOC/caption/ảnh) để đạt mức gần-hoàn-thiện trước nghiệm thu. W19 là tuần **fix lỗi**, không thêm tính năng mới lớn.

## Nguyên nhân gốc (4 systemic + thứ cấp)

| Mã | Nguyên nhân gốc | Triệu chứng (số hiệu audit) | Contract |
|---|---|---|---|
| **A** | **Hai pipeline render tách rời** preview vs export (khác renderer, khác sanitize schema, `injectHeadingNumbers` nhân đôi, TOC dựng 2 nơi, scope đánh số khác) | #5 Preview≠PDF, #6 Print Preview lệch, anchor TOC chết trong PDF, lệch số do off-by-one | `w19_fix_unified_render_pipeline` |
| **B** | **Hai nguồn đánh số** — số tác giả tự gõ trong heading + số tự sinh chồng lên; counter cấp-1 = 0 khi section mở đầu bằng `##` | #3 `6.1.6.1`, #4 `0.1`/`1.1.1.1` | `w19_fix_heading_numbering_single_source` |
| **C** | **Caption hình luôn được "tiêm" thêm**, không dò caption sẵn có (bảng thì có); label nối với `alt` đã chứa label; lệch scheme `continuous` vs per-chapter | #2 caption render 3 lần | `w19_fix_figure_caption_dedup` |
| **D** | **Ảnh tham chiếu bằng đường dẫn file cục bộ**, `resolveAssetRefs` chỉ xử lý `asset:`/`image:`; cửa sổ in là `about:blank` → ảnh chết; không có validate trước export | #1 ảnh mất trong PDF, #7 không validate trước export, #56 broken-link, #57 export validation | `w19_fix_image_embed_export_validation` |
| **TOC** | CSS `.ws-toc-link` `flex space-between` chỉ có 2 span (số/chữ), **không có dot leader, không có số trang**, indent hard-code cấp 2–3 | #9–#15, #60 TOC đè/spacing/leader/indent/cột/ngắt trang | `w19_fix_toc_print_layout` |
| **PRINT** | Cửa sổ in `window.open("","_blank")` + `print()` chạy trước khi Mermaid/KaTeX/ảnh CDN tải xong | #8 không progress, #58 `about:blank`, #59 header trùng, Mermaid/KaTeX trắng | `w19_fix_pdf_print_surface` |
| **EDITOR** | Thiếu `syntaxHighlighting(HighlightStyle)`; toolbar không `sticky` | #16 không highlight, #18 toolbar mất khi cuộn | `w19_fix_editor_readability` |

## Map đầy đủ phát hiện → xử lý

| # | Phát hiện | Mức | Xử lý |
|---|---|---|---|
| 1 | Ảnh mất trong PDF | 🔴 | `w19_fix_image_embed_export_validation` |
| 2 | Caption sinh trùng 3× | 🔴 | `w19_fix_figure_caption_dedup` |
| 3 | Numbering heading `6.1.6.1` | 🔴 | `w19_fix_heading_numbering_single_source` |
| 4 | TOC numbering `0.1`/`1.1.1.1` | 🔴 | `w19_fix_heading_numbering_single_source` |
| 5 | Preview ≠ PDF | 🔴 | `w19_fix_unified_render_pipeline` |
| 6 | Print Preview lệch Preview | 🔴 | `w19_fix_unified_render_pipeline` + `w19_fix_pdf_print_surface` |
| 7 | Không validate trước export | 🟠 | `w19_fix_image_embed_export_validation` |
| 8 | Không có progress export | 🟠 | `w19_fix_pdf_print_surface` |
| 9–15, 60 | TOC: đè title, không xuống dòng, không dot leader, spacing/indent/cột/center/ngắt trang | 🔴/🟠 | `w19_fix_toc_print_layout` |
| 16 | Editor không syntax highlight | 🟠 | `w19_fix_editor_readability` |
| 18 | Toolbar không sticky | 🟠 | `w19_fix_editor_readability` |
| 58 | Print Preview `about:blank` | 🟡 | `w19_fix_pdf_print_surface` |
| 59 | Header PDF chưa thống nhất | 🟡 | `w19_fix_pdf_print_surface` |
| 61 | Căn lề trang bìa chưa cân | 🟡 | `w19_fix_toc_print_layout` (mục cover) |
| 56 | Broken link checker | 🟠 | `w19_fix_image_embed_export_validation` |
| 57 | Export validation | 🟠 | `w19_fix_image_embed_export_validation` |

### Ngoài phạm vi W19 (không phải "lỗi" — là tính năng chưa làm → backlog)
> Các mục sau **không có nguyên nhân lỗi**; chúng chỉ chưa được hiện thực. Để lại backlog, **không** mở contract fix trong tuần hardening này:
> #17 prominence toolbar AI (design choice), #19–#23 minimap/icon tab/fold/line-highlight, #24–#28 sidebar hierarchy/width/drag-handle/draft-badge/collapse, #29–#33 zoom mặc định/jump/page-indicator, #34–#37 AI diff/undo/loading/token-estimate, #38–#40 layout panel resize/divider, #41–#46 save-state feedback & a11y, #47–#55 search/replace toàn tài liệu, outline navigator, track changes, version compare, comment, cross-reference, Table of Figures/Tables có số trang.
> *(Một phần đã có hạt giống: search per-section qua CodeMirror `search()`; `generateListOfFigures/Tables` đã sinh danh mục nhưng chưa kèm số trang — sẽ pha sau khi có engine số trang ở `w19_fix_toc_print_layout`/Puppeteer.)*

## Thứ tự đề xuất (keystone trước → phụ thuộc sau)

1. `w19_fix_unified_render_pipeline` — **A, keystone**. Gỡ trùng renderer/schema/injector; nhiều lỗi khác bám vào đây.
2. `w19_fix_heading_numbering_single_source` — **B**. Một nguồn đánh số (chạy sau A để chỉ còn 1 injector).
3. `w19_fix_figure_caption_dedup` — **C**. Caption hình dùng chung quy tắc với bảng.
4. `w19_fix_image_embed_export_validation` — **D**. Nhúng ảnh + cổng validate trước export.
5. `w19_fix_toc_print_layout` — TOC/cover CSS in (sau khi A thống nhất TOC một nguồn).
6. `w19_fix_pdf_print_surface` — bề mặt in (blob/iframe, chờ asset, progress).
7. `w19_fix_editor_readability` — highlight + sticky toolbar (độc lập, rủi ro thấp).

## Locked dùng chung mọi contract
- 🔒 **Một nhánh duy nhất `w19/near-completed`**; mỗi contract = 1 commit logic riêng (không nhánh con).
- 🔒 **Một nguồn sự thật render & đánh số.** Sau W19, preview/print-preview/PDF phải đi qua **cùng một** hàm render + **cùng một** sanitize schema + **một** `injectHeadingNumbers`. Cấm tái sinh nhánh render thứ hai.
- 🔒 **Privacy-first giữ nguyên.** Toàn bộ fix W19 chạy local/offline; **không** thêm phụ thuộc mạng. KaTeX/Mermaid chuyển sang asset local thay vì CDN (xem `w19_fix_pdf_print_surface`).
- 🔒 **Không phá public surface** `ReportSection`/`CanonicalTypes`/`CheckResult` trừ khi contract ghi rõ. Caption/heading id giữ ổn định để cross-ref sau này dùng được.
- 🔒 **Token-only / no-hex ngoài primitive**; microcopy theo `VoiceAndContent.md §7`; `--rs-report-*` bất biến (trang in trắng-đen).
- 🔒 **Không thêm lib** trừ khi contract nêu rõ. W19 cho phép tối đa: KaTeX/Mermaid **local bundle** (đã có trong `package.json`, không lib mới) và *(tuỳ Approve)* Puppeteer chỉ khi chọn nhánh số-trang server-side.

## Cảnh báo phạm vi (đọc trước khi Approve)
- **A là keystone phá vỡ trùng lặp** — chạm `prepare-export.ts`, `print-preview.ts`, `markdown-pipeline.ts`, `PreviewPane.tsx`, `helpers.ts`. Cần regression test mạnh: snapshot HTML preview vs export phải khớp cấu trúc.
- **B đụng nội dung tác giả**: phải strip số gõ tay an toàn (chỉ tiền tố `N(.N)*` ở đầu heading), không nuốt nhầm chữ. Cần test tiếng Việt có dấu.
- **Số trang trong TOC/LoF/LoT**: trình duyệt in HTML **không** tính được `target-counter` page number. `w19_fix_toc_print_layout` chỉ chuẩn hoá leader/indent/ngắt trang; **số trang thực** cần engine riêng (Puppeteer) — đánh dấu P2, không hứa trong MVP.
- **D**: nhúng ảnh data-URI làm phình bundle — cần ngưỡng kích thước + cảnh báo, không tự nhúng ảnh quá lớn.

> Tất cả contract đang ở trạng thái `PROPOSED — chờ Approve`. Chưa chạm `src/` cho tới khi Approve từng contract.
