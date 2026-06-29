# W20 Break — Index Contract (Import Fidelity & Submission Polish: Ảnh/Minh Chứng · Header In · Đánh Số H2 · Issues Panel · UX)

> **Lane:** Core / break_task / week20_break.
> **Branch (chung cả tuần):** `w20/import-fidelity` — **toàn bộ contract W20 đi chung một nhánh duy nhất**, không tách nhánh con (giống W18 `w18/upgrade-ai`, W19 `w19/near-completed`).
> **Nguồn:** Product Review + Terminal/PDF Audit trên báo cáo thật `ReportSupporter.pdf` + giao diện đang chạy (session 2026-06-29) — danh sách ~31 phát hiện (P0 ảnh, lỗi PDF, editor, UX, chức năng kiểm tra, PDF engine). Phân tích nguyên nhân gốc quy về **5 nguyên nhân hệ thống (A–E)**.
> **Cách viết:** theo format `week19_break` (Lane/Branch/Type · Findings S-mã · Micro-task · Locked · Scope · Checklist · Files · Risks · Verification · Status). Branch dùng chung `w20/import-fidelity` cho mọi contract.
> **Chủ đề tuần:** "import-fidelity" — báo cáo lần này **nhập từ file `.md` ngoài** (không tạo trong app), làm lộ các khuyết tật mà W19 (vốn giả định nội dung **tạo trong app**, ảnh dán = data-URI) **chưa phủ**: import chỉ map heading→section, **bỏ rơi ảnh/minh chứng/video**; checker ảnh không nhận diện đường dẫn file; đánh số caption khoá cứng vào H1 trong khi tài liệu nhập mở chương bằng H2. W20 là tuần **fix lỗi hậu-nhập + đánh bóng bản nộp**, không thêm tính năng mới lớn.

## Vì sao W19 đã fix mà lỗi vẫn còn?

W19 đóng các khuyết tật **với giả định nội dung tạo trong app** (ảnh chèn qua `use-image-insert` → data-URI `asset:<id>`). Báo cáo W20 đi theo **luồng khác**: người dùng **import một file Markdown hoàn chỉnh** trỏ tới `Figures/*.png` và `UniVillage_Final_Evidence/**` trên ổ đĩa. Luồng import (`importReadme`) **chỉ cắt section theo heading** — không ingest byte ảnh, không tạo evidence. Vì vậy:
- W19-D dựng *cổng validate* nhưng **không** làm import nhúng ảnh ⇒ ảnh vẫn 404 (chỉ bị chặn, không được sửa).
- W19-C khử trùng caption nhưng **đánh số vẫn khoá `heading.depth === 1`** ⇒ tài liệu nhập mở chương bằng `##` bị lệch số.
- W19 print surface dùng iframe có title, nhưng **Chrome vẫn tự chèn `localhost:3000` + timestamp** vì CSS `@bottom-center`/`@top-center` **không được engine in của Chrome hỗ trợ**.

## Nguyên nhân gốc (5 systemic)

| Mã | Nguyên nhân gốc | Triệu chứng (số hiệu audit) | Contract |
|---|---|---|---|
| **A** | **Import chỉ map heading→section, bỏ rơi ảnh/minh chứng/video.** `importReadme` không ingest asset; `resolveAssetRefs` chỉ thay `asset:`/`image:` nên `Figures/x.png` lọt qua → `GET /Figures/x.png 404`. Panel "Minh chứng" lấy từ `bundle.evidence` (rỗng sau import). | #1 ảnh 404 (preview+PDF), terminal 404 hàng loạt, mất evidence/hình/video panel phải | `w20_fix_import_asset_evidence_ingest` |
| **B** | **PDF in bằng `window.print()` + CSS margin-box không được Chrome hỗ trợ.** Chrome tự chèn URL `localhost:3000` + ngày-giờ vào header/footer; `@bottom-center` (footer tuỳ biến) bị bỏ im lặng. Placeholder soạn thảo không bị strip khi export. | #2 footer localhost, #3 timestamp, #4 `[CHÈN ẢNH…]`, #7 whitespace, #27 chất lượng in, #28 page-break | `w20_fix_print_header_footer_pagebreak` |
| **C** | **Đánh số caption/heading khoá cứng `heading.depth === 1`.** Tài liệu nhập mở chương bằng `##` ("2.4 Workflow…") ⇒ `chapterNum` không tăng ⇒ label luôn "Hình 1.x", lệch số tác giả & cross-ref. Ảnh 404 hiện `alt` ngay trên caption tự sinh → nhân đôi. | #5 trùng "Hình 1.2 / Hình 1.2:", #6 caption đổi số, #23 số hình sai chuỗi | `w20_fix_caption_heading_number_h2_chapters` |
| **D** | **Kiểm tra không nhận diện đường dẫn + không có Issues panel.** Rule `broken-image` chỉ bắt URL rỗng hoặc `asset:` thiếu (bỏ qua path); `runExport` đường tắt **không** chạy `validateExport`; không có panel tổng hợp lỗi, không có badge dev "broken assets". | #17 vẫn export khi 404, #18 thiếu Issues panel, #19 không lint markdown, #20–#26 thiếu scan ảnh/link/heading trùng/số hình/số bảng/ref/TOC, #VII badge dev | `w20_fix_validation_issues_panel` |
| **E** | **Editor/Preview thiếu công cụ đọc & phân cấp thị giác.** Preview không zoom preset/fit-width, không sync-scroll; sidebar cắt chữ, không collapse; toolbar AI chiếm 2 hàng & toàn xanh (lấn Save/Export); thiếu trạng thái lưu rõ ràng, dark preview, parity preview↔PDF. | #9–#16, #29–#31 | `w20_fix_editor_preview_ux` |

## Map đầy đủ phát hiện → xử lý

| # | Phát hiện | Mức | Xử lý |
|---|---|---|---|
| 1 | Toàn bộ ảnh 404 (preview+PDF) | 🔴 | `w20_fix_import_asset_evidence_ingest` |
| — | Panel phải mất evidence/hình/video khi nhập .md | 🔴 | `w20_fix_import_asset_evidence_ingest` |
| 2 | PDF còn footer `localhost:3000` | 🔴 | `w20_fix_print_header_footer_pagebreak` |
| 3 | PDF in timestamp trình duyệt | 🔴 | `w20_fix_print_header_footer_pagebreak` |
| 4 | Placeholder `[CHÈN ẢNH…]` còn sót | 🟠 | `w20_fix_print_header_footer_pagebreak` |
| 5 | Caption trùng "Hình 1.2 / Hình 1.2:" | 🟠 | `w20_fix_caption_heading_number_h2_chapters` (+ A: ảnh sống thì hết alt) |
| 6 | Caption đổi số (2.2 vs 2.3) | 🟠 | `w20_fix_caption_heading_number_h2_chapters` |
| 7 | Khoảng trắng lớn trước figure | 🟠 | `w20_fix_print_header_footer_pagebreak` |
| 8 | Bảng sát mép (glossary) | 🟡 | `w20_fix_print_header_footer_pagebreak` (cell padding) |
| 9 | Preview quá nhỏ / không zoom preset | 🟠 | `w20_fix_editor_preview_ux` |
| 10 | Không sync-scroll preview | 🟠 | `w20_fix_editor_preview_ux` |
| 11 | Sidebar cắt chữ, không tooltip | 🟡 | `w20_fix_editor_preview_ux` |
| 12 | Không collapse sidebar | 🟡 | `w20_fix_editor_preview_ux` |
| 13 | Toolbar AI dày ~2 hàng | 🟡 | `w20_fix_editor_preview_ux` |
| 14 | Nút AI quá nổi, Save/Export chìm | 🟠 | `w20_fix_editor_preview_ux` |
| 15 | Trạng thái lưu không rõ | 🟡 | `w20_fix_editor_preview_ux` |
| 16 | Không có progress export rõ | 🟡 | `w20_fix_editor_preview_ux` (surface pha từ W19) |
| 17 | Vẫn export khi đang 404 | 🟠 | `w20_fix_validation_issues_panel` |
| 18 | Không có panel Issues | 🟠 | `w20_fix_validation_issues_panel` |
| 19 | Không highlight lỗi markdown | 🟡 | `w20_fix_validation_issues_panel` |
| 20 | Không scan Broken Image | 🟠 | `w20_fix_validation_issues_panel` |
| 21 | Không scan Broken Link | 🟠 | `w20_fix_validation_issues_panel` |
| 22 | Không scan Duplicate Heading | 🟡 | `w20_fix_validation_issues_panel` |
| 23 | Không kiểm tra Figure Number | 🟠 | `w20_fix_validation_issues_panel` + `w20_fix_caption_heading_number_h2_chapters` |
| 24 | Không kiểm tra Table Number | 🟡 | `w20_fix_validation_issues_panel` |
| 25 | Không kiểm tra Reference (Hình 5.2 không tồn tại) | 🟠 | `w20_fix_validation_issues_panel` |
| 26 | Không kiểm tra TOC đồng bộ | 🟡 | `w20_fix_validation_issues_panel` |
| 27 | Browser print chất lượng thấp | 🟠 | `w20_fix_print_header_footer_pagebreak` |
| 28 | Page break chưa tối ưu | 🟠 | `w20_fix_print_header_footer_pagebreak` |
| 29 | Màu xanh tràn lan, thiếu hierarchy | 🟡 | `w20_fix_editor_preview_ux` |
| 30 | Thiếu Dark Preview | 🟡 | `w20_fix_editor_preview_ux` |
| 31 | Preview ≠ PDF | 🟠 | `w20_fix_editor_preview_ux` (parity CSS) |
| VII | Terminal 404 không hiện trong UI dev | 🟠 | `w20_fix_validation_issues_panel` (badge dev) |

## Thứ tự đề xuất (keystone trước → phụ thuộc sau)

1. `w20_fix_import_asset_evidence_ingest` — **A, keystone**. Làm ảnh & minh chứng **sống** sau import; nhiều "lỗi nhìn như chưa hoàn thiện" tan ngay. Chạy trước để các contract sau test trên báo cáo có ảnh thật.
2. `w20_fix_caption_heading_number_h2_chapters` — **C**. Đánh số đúng khi chương bắt đầu bằng `##` (phổ biến ở tài liệu nhập).
3. `w20_fix_validation_issues_panel` — **D**. Checker nhận diện path + Issues panel + badge dev + gate mọi đường export.
4. `w20_fix_print_header_footer_pagebreak` — **B**. Khử header/footer trình duyệt, strip placeholder, page-break & padding bảng.
5. `w20_fix_editor_preview_ux` — **E**. Zoom/sync/sidebar/hierarchy/dark/parity (rủi ro thấp, độc lập).

## Locked dùng chung mọi contract
- 🔒 **Một nhánh duy nhất `w20/import-fidelity`**; mỗi contract = 1 commit logic riêng (không nhánh con).
- 🔒 **Import phải bảo toàn (fidelity).** Sau W20, nhập một `.md` có ảnh/minh chứng **không** được "rơi" nội dung im lặng: hoặc ingest được, hoặc báo rõ "không tìm thấy ảnh" (không 404 thầm lặng).
- 🔒 **Privacy-first / offline-first giữ nguyên.** **Không** tự fetch ảnh `http(s)`; chỉ đọc file người dùng chủ động cung cấp (drag-drop/upload kèm `.md`, hoặc thư mục đã được cấp quyền). Không thêm phụ thuộc mạng.
- 🔒 **Một nguồn sự thật render & đánh số** (kế thừa W19): preview/print-preview/PDF đi qua **cùng** render + sanitize + `injectHeadingNumbers`. Cấm tái sinh nhánh render thứ hai.
- 🔒 **Không phá public surface** `ReportSection`/`CanonicalTypes`/`CheckResult` trừ khi contract ghi rõ; caption/heading id ổn định cho cross-ref.
- 🔒 **Token-only / no-hex ngoài primitive**; microcopy theo `VoiceAndContent.md §7`; `--rs-report-*` bất biến (trang in trắng-đen).
- 🔒 **Không thêm lib** trừ khi contract nêu rõ. W20 cho phép *(tuỳ Approve)* bật **Puppeteer** đã có stub (`renderPdfWithPuppeteer`) **chỉ** khi chọn nhánh in server-side cho header/footer/số trang thật.

## Cảnh báo phạm vi (đọc trước khi Approve)
- **A đụng I/O file**: đọc ảnh từ ổ đĩa trong trình duyệt cần người dùng cấp file/thư mục (File System Access API hoặc upload kèm). Nếu không có quyền → **degrade**: chỉ map path + cảnh báo, **không** bịa ảnh. Nhúng data-URI làm phình IndexedDB ⇒ ngưỡng + cảnh báo (kế thừa W19-D).
- **B — header/footer thật**: trình duyệt `print()` **không** cho CSS điều khiển header/footer hệ thống; chỉ có thể **ẩn** bằng `@page { margin: 0 }` + padding nội dung (Chrome bỏ header/footer mặc định khi margin = 0) **hoặc** chuyển sang **Puppeteer** để có footer "Trang x/y" thật. Đánh dấu Puppeteer = P2 tuỳ Approve, mitigation `@page margin:0` là mặc định.
- **C đụng đánh số**: cho phép chương bắt đầu ở H1 **hoặc** H2 (auto-detect mức heading nông nhất làm "chương"). Cần test tài liệu nhập (H2-chương) lẫn tài liệu app (H1-chương) không hồi quy.
- **D có thể "ồn"**: scan nhiều rule dễ spam; gom theo severity, cho phép ẩn/snooze; gate P0 chỉ cho ảnh chết.
- **E phần lớn là UX/polish**: tách rõ "bug" (parity preview≠PDF #31, button hierarchy #14) khỏi "tính năng tiện ích" (sync-scroll, collapse) để Approve theo lát.

> Tất cả contract đang ở trạng thái `PROPOSED — chờ Approve`. Chưa chạm `src/` cho tới khi Approve từng contract.
