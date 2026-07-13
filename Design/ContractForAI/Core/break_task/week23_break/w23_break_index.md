# W23 Break — Index Contract (QA Regression Sweep 2: Publish Gate · Filename Slug · Editor Insert · Silent Actions · Microcopy)

> **Lane:** Core / break_task / week23_break.
> **Branch (chung cả tuần):** `main` — nhánh redesign `feature/W25-ui-redesign` đã gộp vào `main` (xem commit `a8ab924` "implement w22 fixes"), nên **W23 đi thẳng trên `main`** (hoặc nhánh ngắn `fix/W23-qa-regression` rồi PR về `main` nếu muốn cách ly). Mỗi contract = **1 commit logic riêng**; docs contract commit trước, thi công `src/` sau khi Approve từng contract.
> **Nguồn:** QA session tương tác **2026-07-13** (Preview tools drive dev server như một tester end-to-end) trên `main` @ `2777346`. Đi hết **7 module**: khởi tạo → editor/toolbar → preview → mục lục CRUD → checker/issues → persistence/snapshot → bảng điều khiển (Format/Export/Evidence/Present/Import) → command palette/focus/theme/AI/mobile. Chạy full `npm test` = **605/605 pass (127 files)**. Mỗi phát hiện hành vi được **truy ngược về code để xác nhận file:line**, không dừng ở triệu chứng; các dương-tính-giả do môi trường automation đã loại (xem cuối).
> **Cách viết:** theo format `week22_break`/`week21_break` (Lane/Branch/Type · Findings S-mã · Micro-task · Locked · Scope · Checklist · Files · Risks · Verification · Status). Branch dùng chung cho mọi contract.
> **Chủ đề tuần:** "qa-regression-2" — không thêm tính năng mới, **sửa lỗi hồi quy & rò rỉ trải nghiệm lộ ra khi drive app thật**. Trọng tâm: một mâu thuẫn **luồng xuất bản** (dialog nói "xuất được" → xuất xong fail P0), một lỗi **mất dấu tiếng Việt ở tên file**, editor **chèn block phá cấu trúc markdown**, một loạt **hành động im lặng** (không toast/không phản hồi), và **microcopy** (command palette không dấu, nhãn nội bộ `(dev)`/`(W11)`/`Phase 3` rò ra UI).

## Vì sao W22/redesign không bắt được?

W22 tập trung **vòng dữ liệu editor↔state↔preview** (stale callback, Mermaid perf, submit feedback) và đã sửa đúng phần đó. W23 lộ ra ở **các mối nối giữa hệ thống con** mà không test tĩnh/đơn vị nào phủ:
- **Luồng xuất bản có HAI hệ validation không nói chuyện với nhau** — `validateExport` (chỉ caption/format) quyết định dialog tiền-kiểm, còn `runChecker` (gate P0 evidence) chạy **bên trong** `executeExport`. Chỉ lộ khi báo cáo **thiếu minh chứng bắt buộc** — đúng flow nộp bài thật, không xuất hiện với mẫu đủ evidence.
- **Slug tên file** (`[^a-z0-9]+`) chỉ sai khi tiêu đề **có dấu tiếng Việt** — mọi test dùng title ASCII đều xanh.
- **Chèn snippet** chỉ hỏng khi con trỏ **nằm trong block khác** (fence/bảng/math) — test chèn vào doc rỗng luôn đúng.
- **aria-label editor** là **tàn dư của W22-A**: W22 forward `onChange`/`onSave` qua ref nhưng **bỏ sót `ariaLabel`** (vẫn bind một lần lúc tạo `EditorView`).

## Nguyên nhân gốc (systemic)

| Mã | Nguyên nhân gốc | Triệu chứng | Contract |
|---|---|---|---|
| **A** | **Hai nguồn validation lệch nhau ở luồng xuất bản.** `handleExportClick` dùng `validateExport(bundle)` (chỉ caption/format, [ExportPanel.tsx:73](src/modules/export/ExportPanel.tsx#L73)) để bật dialog tiền-kiểm với thông điệp "chỉ cảnh báo nhẹ, vẫn xuất được" ([ExportPanel.tsx:339](src/modules/export/ExportPanel.tsx#L339)); nhưng `executeExport` **bên trong** lại `runChecker(bundle)` và **ném lỗi** nếu có P0 (`severity==="error"`, thiếu evidence github/video/deploy) ([use-export.ts:22](src/modules/export/use-export.ts#L22)-L32). P0 **không** được surface ở dialog ⇒ user bị dẫn 2 bước rồi mới thấy job "Lỗi". | 🔴 Dialog "Vẫn xuất bản" nhưng xuất xong fail P0 evidence không báo trước; nút không disable theo lỗi chặn | `w23_fix_publish_precheck_gate_vs_p0_evidence` |
| **B** | **Slug tên file xoá ký tự có dấu thay vì chuyển tự.** `bundle.project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")` ([use-export.ts:126](src/modules/export/use-export.ts#L126), [SubmissionPanel.tsx:85](src/modules/export/SubmissionPanel.tsx#L85)) không NFD-normalize; "Báo cáo đồ án phần mềm" → `b-o-c-o-n-ph-n-m-m`. Trong khi anchor heading dùng `lib/slugify` (NFD + bỏ dấu) đúng ([slugify.ts:13](src/lib/slugify.ts#L13)-L19). | 🟠 Tên file `.html`/`.docx`/`-evidence.zip` mất dấu, khó đọc, không nhất quán với anchor | `w23_fix_export_filename_diacritics_slug` |
| **C** | **`insertSnippet` không nhận biết ngữ cảnh block.** Chỉ thêm **một** newline dẫn đầu nếu `doc[from-1] !== "\n"` ([insert-snippet.ts:17](src/modules/write/insert-snippet.ts#L17)), không kiểm tra con trỏ có đang trong fence/bảng/math; block mới chèn vào giữa block cũ → markdown hỏng. Nút "Chèn ảnh" chỉ chèn placeholder chết `![Mô tả ảnh](image:asset_id)` ([insert-snippet.ts:52](src/modules/write/insert-snippet.ts#L52)), không mở trình chọn ảnh. Ngoài ra `ariaLabel` editor bind một lần lúc tạo `EditorView` ([EditorPanel.tsx:73](src/components/EditorPanel.tsx#L73)) — tàn dư W22-A (đã forward onChange/onSave qua ref nhưng bỏ sót ariaLabel). | 🟠 6 nút toolbar chèn liên tiếp phá cấu trúc; ảnh chỉ ra placeholder; screen-reader đọc sai mục | `w23_fix_editor_insert_block_context_image_and_stale_arialabel` |
| **D** | **Định danh thô/không tươi lộ ra UI.** `IssuesPanel` hiển thị `Mục: {issue.sectionId}` = UUID ([IssuesPanel.tsx:254](src/components/IssuesPanel.tsx#L254)) và aria-label `Đi tới phần ${issue.sectionId}` ([IssuesPanel.tsx:280](src/components/IssuesPanel.tsx#L280), [CheckerPanel.tsx:93](src/modules/check/CheckerPanel.tsx#L93)) — user/screen-reader không biết lỗi ở mục nào (dialog xuất bản lại hiển thị đúng `[Tên mục]`). | 🟡 Panel Soát lỗi chỉ UUID; a11y đọc UUID | `w23_fix_issues_panel_section_title_not_uuid` |
| **E** | **Hành động không phản hồi.** Tải `evidence.zip` thành công không toast, lỗi chỉ `console.error` ([SubmissionPanel.tsx:96](src/modules/export/SubmissionPanel.tsx#L96)-L100); "Xuất PowerPoint (.pptx)" ([PresentPanel.tsx:151](src/modules/present/PresentPanel.tsx#L151)) bấm không thấy gì; lịch sử nộp bài (`loadExportHistory`) lệch với jobs in-memory của ExportPanel do `recordExport` fire-and-forget ([use-export.ts:175](src/modules/export/use-export.ts#L175)) đua với `refreshHistory` phụ thuộc `[jobs]` ([SubmissionPanel.tsx:36](src/modules/export/SubmissionPanel.tsx#L36)). | 🟡 Người dùng không biết đã tải/đã xuất hay chưa; lịch sử nộp bài thiếu bản thành công | `w23_fix_silent_actions_feedback_zip_pptx_history` |
| **F** | **Microcopy & nhãn nội bộ.** `command-registry.ts` hardcode **không dấu** toàn bộ ("Viet bao cao", "Them muc moi", "Soat loi bao cao" — [command-registry.ts:33](src/components/command-registry.ts#L33)-L45+); nhãn dev/lộ lịch trình rò ra UI: `(dev)` ([IssuesPanel.tsx:94](src/components/IssuesPanel.tsx#L94)), "Tối ưu kịch bản bằng AI (W11)" ([ScriptView.tsx:54](src/modules/present/ScriptView.tsx#L54)), "Xuất PPTX (Phase 3)" ([ExportPanel.tsx:267](src/modules/export/ExportPanel.tsx#L267)); dialog xóa mục nói tĩnh "đang chứa nội dung… không thể hoàn tác" kể cả mục rỗng và **có** snapshot khôi phục ([Workspace.tsx:1287](src/components/Workspace.tsx#L1287)); tooltip AI báo "Vui lòng bật AI trong Cài đặt" cả khi AI **đã bật** nhưng thiếu key (`state==="unconfigured"`, [AiAssistBar.tsx:53](src/modules/write/ai/AiAssistBar.tsx#L53),L167). | 🟢 Command palette lệch giọng (mất dấu); nhãn nội bộ lộ; thông điệp sai/dọa | `w23_polish_microcopy_diacritics_internal_labels_dialogs` |
| **G** | **Hydration mismatch ở Radix Select (zoom).** SSR và client render `id`/`aria-controls` khác nhau ⇒ 2 console error mỗi lần load ([ui/Select.tsx](src/components/ui/Select.tsx), điều khiển zoom [WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx)). | 🟢 Lỗi hydration lặp lại; nguy cơ patch DOM sai a11y | `w23_fix_zoom_select_hydration_mismatch` |
| **H** | **IA/mật độ ở laptop 1024–1439px.** Bảng điều khiển là **modal drawer che nội dung** dưới 1440px (dock cạnh phải chỉ khi `min-width:1440` — [WorkspaceLayout.tsx:88](src/components/WorkspaceLayout.tsx#L88)-L89); không thể vừa xem lỗi vừa sửa. Module Thuyết trình (outline 12 slide + gán người nói + kịch bản + Q&A) nhồi trong drawer ~300px. | 🟢 Vòng "Xem lỗi → đóng drawer → sửa → mở lại → check lại"; Present chật | `w23_ux_assistant_panel_breakpoint_present_density` |

## Map phát hiện → xử lý

| # | Phát hiện (QA 2026-07-13) | Mức | Xử lý |
|---|---|---|---|
| 1 | Dialog tiền-kiểm nói "xuất được" (chỉ cảnh báo caption) nhưng export fail P0 evidence không báo trước | 🔴 | `w23_fix_publish_precheck_gate_vs_p0_evidence` |
| 2 | Nút "Vẫn xuất bản" không disable khi có lỗi chặn P0 | 🔴 | `w23_fix_publish_precheck_gate_vs_p0_evidence` |
| 3 | Tên file xuất (.html/.docx/-evidence.zip) mất dấu tiếng Việt (`b-o-c-o-n-ph-n-m-m`) | 🟠 | `w23_fix_export_filename_diacritics_slug` |
| 4 | Nút toolbar chèn block vào giữa fence/bảng/math → markdown hỏng | 🟠 | `w23_fix_editor_insert_block_context_image_and_stale_arialabel` |
| 5 | "Chèn ảnh" chỉ chèn placeholder chết, không mở trình chọn ảnh | 🟠 | `w23_fix_editor_insert_block_context_image_and_stale_arialabel` |
| 6 | aria-label editor stale ("Editor: Mở đầu" khi đang sửa mục khác) | 🟡 | `w23_fix_editor_insert_block_context_image_and_stale_arialabel` |
| 7 | Panel Soát lỗi hiển thị UUID mục thay vì tên mục (kể cả aria-label) | 🟡 | `w23_fix_issues_panel_section_title_not_uuid` |
| 8 | Tải evidence.zip / Xuất PPTX không có toast/phản hồi nào | 🟡 | `w23_fix_silent_actions_feedback_zip_pptx_history` |
| 9 | Lịch sử nộp bài lệch với lịch sử xuất bản (thiếu bản thành công) | 🟡 | `w23_fix_silent_actions_feedback_zip_pptx_history` |
| 10 | Command palette + vài toast không dấu tiếng Việt (source thật) | 🟢 | `w23_polish_microcopy_diacritics_internal_labels_dialogs` |
| 11 | Nhãn nội bộ rò UI: `(dev)`, `(W11)`, `Phase 3` | 🟢 | `w23_polish_microcopy_diacritics_internal_labels_dialogs` |
| 12 | Dialog xóa mục dọa tĩnh "đang chứa nội dung/không thể hoàn tác" kể cả mục rỗng & có snapshot | 🟢 | `w23_polish_microcopy_diacritics_internal_labels_dialogs` |
| 13 | Tooltip AI "bật AI trong Cài đặt" cả khi đã bật nhưng thiếu API key | 🟢 | `w23_polish_microcopy_diacritics_internal_labels_dialogs` |
| 14 | Hydration mismatch Radix Select (zoom) — 2 error mỗi load | 🟢 | `w23_fix_zoom_select_hydration_mismatch` |
| 15 | Bảng điều khiển che nội dung ở 1024–1439px; Present chật trong drawer | 🟢 | `w23_ux_assistant_panel_breakpoint_present_density` |
| 16 | Import làm phẳng phân cấp heading (H2 thành mục top-level 10., 11.) | 🟢 | `w23_decide_import_heading_hierarchy_flatten` (Đã quyết định chọn Nhánh A: xem [Quyết định Thiết kế](file:///e:/ReportSupporter/Design/Decisions/w23_import_heading_hierarchy_decision.md)) |

## Phát hiện đã điều tra và **loại** (dương tính giả — không viết contract)

Ghi lại để không tái điều tra:
- **"Enter không commit khi đổi tên mục"** → **loại.** Source xử lý đúng `onKeyDown` Enter/Escape + `onBlur` ([SectionNav.tsx:159](src/components/SectionNav.tsx#L159)-L163); triệu chứng do phím Enter tổng hợp trong automation bị `handleKeyDown` toàn cục nuốt (`isNativeEditable` guard [Workspace.tsx:809](src/components/Workspace.tsx#L809) đúng, nhưng key ảo không tới input). Click/blur thật commit chuẩn — đã xác nhận.
- **"Drawer bảng điều khiển không trượt vào"** → **loại.** Drawer render đúng vị trí (transform từ 100%→0 qua `@keyframes ws-drawer-slide-right`, [WorkspaceLayout.css:763](src/components/WorkspaceLayout.css#L763)); QA chụp giữa animation nên thấy `translateX(280px)`. Tắt animation → x=1000 đúng. Không phải lỗi app.
- **"Sidebar không co khi resize xuống mobile"** → **loại.** `matchMedia("(min-width:1024px)")` + `{isDesktop && <aside>}` ([WorkspaceLayout.tsx:88](src/components/WorkspaceLayout.tsx#L88),L267) chuyển sang drawer + tab "Bàn viết/Tờ nộp" đúng khi reload ở 375px; QA đổi kích thước sau khi mount nên state chưa cập nhật tới lúc chụp. Reload xác nhận responsive đúng.
- **"Xuất PDF hỏng"** → **chưa xác nhận, KHÔNG mở contract.** `exportPdfViaBrowserPrint` mở dialog in hệ thống ([export-pdf.ts:11](src/modules/export/export-pdf.ts#L11)) — treo môi trường automation nên **không bấm được**, không có bằng chứng lỗi. **Watch-item:** code clone *toàn bộ* stylesheet app vào iframe in ([export-pdf.ts:62](src/modules/export/export-pdf.ts#L62)); cần **kiểm thủ công in ở dark mode** xem nền tối có lem trang in không — nếu có, mở finding riêng ở W24.

## Thứ tự đề xuất (chặn luồng nộp bài trước → editor → nhãn/phản hồi → kỹ thuật → IA)

1. `w23_fix_publish_precheck_gate_vs_p0_evidence` — **A, keystone.** Chạm trực tiếp giá trị cốt lõi (nộp bài); mâu thuẫn gate gây mất niềm tin nặng nhất.
2. `w23_fix_export_filename_diacritics_slug` — **B.** Nhỏ, tái dùng `lib/slugify`; sửa 2 call site.
3. `w23_fix_editor_insert_block_context_image_and_stale_arialabel` — **C.** Editor là nơi soạn thảo — chèn hỏng cấu trúc là lỗi hằng ngày.
4. `w23_fix_issues_panel_section_title_not_uuid` — **D.** Map sectionId→title; dùng lại nguồn tên mục dialog xuất bản đã có.
5. `w23_fix_silent_actions_feedback_zip_pptx_history` — **E.** Chốt nhánh race lịch sử trước; thêm toast cho zip/pptx.
6. `w23_polish_microcopy_diacritics_internal_labels_dialogs` — **F.** Gom microcopy; theo `VoiceAndContent.md §7`.
7. `w23_fix_zoom_select_hydration_mismatch` — **G.** Kỹ thuật, độc lập.
8. `w23_ux_assistant_panel_breakpoint_present_density` — **H.** IA/design, cần cân nhắc breakpoint kỹ.
9. `w23_decide_import_heading_hierarchy_flatten` — **Đã hoàn thành quyết định thiết kế (chọn Nhánh A):** xem [Quyết định Thiết kế](file:///e:/ReportSupporter/Design/Decisions/w23_import_heading_hierarchy_decision.md).

## Locked dùng chung mọi contract
- 🔒 **Thi công trên `main`** (redesign đã gộp); mỗi contract = 1 commit logic riêng. Docs contract commit trước phần `src/`.
- 🔒 **Không thao tác nào được im lặng.** Sau W23, mọi hành động sinh tệp/xuất/tải (zip, pptx, export) đều **có phản hồi** (toast thành công/lỗi); không `console.error` câm.
- 🔒 **Một nguồn slug** — tên file tái dùng `lib/slugify` (NFD), không đẻ regex slug thứ hai. Anchor và tên file dùng chung logic bỏ dấu.
- 🔒 **Một nguồn sự thật validation xuất bản** — dialog tiền-kiểm và gate thực thi phải **cùng** phản ánh P0/warning; không để gate ẩn trong `executeExport` mà dialog không biết.
- 🔒 **Không đổi luật checker/validate** (`runChecker`, `validateExport`, `validateMetadata`) — chỉ **surface** kết quả đúng chỗ. P0 vẫn là P0.
- 🔒 **Không đổi public surface** `ReportSection`/`CanonicalTypes`/`CheckResult`/`ExportTarget`/`ExportJob` trừ khi contract ghi rõ.
- 🔒 **Không thêm lib.** Sửa bằng vốn có (React ref/state, toast W13/W20, `EditorView`, `lib/slugify`, mermaid/qr đã cài).
- 🔒 **Token-only / no-hex ngoài primitive**; microcopy tiếng Việt **đủ dấu** theo `VoiceAndContent.md §7`; `--rs-report-*` bất biến (trang in trắng-đen).
- 🔒 **Không rò nhãn nội bộ** (`(dev)`, `(W11)`, `Phase N`, mã tuần) ra UI người dùng cuối.

## Cảnh báo phạm vi (đọc trước khi Approve)
- **A không được nới lỏng gate:** đồng bộ dialog với `runChecker` để P0 **hiển thị + chặn** (disable "Vẫn xuất bản" khi có P0), **không** phải bỏ gate để "xuất cho xong". Warning (caption) vẫn cho xuất; P0 (evidence/thiếu chương) thì chặn có giải thích + lối dẫn sửa.
- **B phải giữ va-đập tên file hợp lệ:** sau NFD bỏ dấu, vẫn chặn ký tự cấm trên Windows/macOS; fallback `"report"` khi rỗng. Verify "Báo cáo đồ án phần mềm" → `bao-cao-do-an-phan-mem.html`.
- **C chèn theo ngữ cảnh, không phá undo:** dùng CodeMirror `syntaxTree`/dòng hiện tại để biết đang trong fence/bảng/math rồi chèn **ngoài** block (blank line ngăn cách trên-dưới). Trình chọn ảnh dùng cơ chế asset offline sẵn có (base64/IndexedDB) — **không** upload server. aria-label: re-dispatch `contentAttributes` khi `ariaLabel` đổi (giống ref pattern W22-A) hoặc `EditorView.contentAttributes.of` reconfigure — **không** remount (mất undo/scroll).
- **E chốt nhánh lịch sử trước khi sửa:** xác nhận race `recordExport` (fire-and-forget) vs `refreshHistory([jobs])` bằng re-test; fix bằng `await recordExport` rồi refresh, hoặc refresh sau khi ghi xong — **không** đổi schema lịch sử.
- **G chọn cách tối thiểu:** ưu tiên mounted-guard (render Select sau `useEffect` set mounted) hoặc `suppressHydrationWarning` đúng chỗ; **không** tắt SSR toàn trang. Xác nhận id ổn định giữa server/client.
- **H là design, không "sửa mù":** đo lại các breakpoint tier (đã có `1024`/`1440`) trước khi hạ mốc dock; cân nhắc cho panel dock-thu-hẹp-editor ở ≥1280 thay vì che. Present nên có lối "mở rộng toàn màn hình" thay vì nới drawer.
- **Decide (import) chốt chủ ý trước:** flat-section có thể là **chủ đích** (app là danh sách mục phẳng). Không sửa cho tới khi quyết: giữ phẳng (và giải thích nhãn "H+0") hay dựng phân cấp con trong mục.

## Trạng thái thi công (cập nhật 2026-07-13)

Tất cả 8 contract code + quyết định import đã **DONE** (mỗi contract 1 commit logic riêng, xem cột commit). Gate cuối: **`npm test` 617/617 pass (130 files)**, **`tsc --noEmit` sạch**.

| Contract | Commit | Trạng thái |
|---|---|---|
| A — Publish gate P0 | `d2ad82f` (+refactor) | ✅ DONE |
| B — Slug tên file | `be6abd1` | ✅ DONE |
| C — Editor insert/ảnh/aria | `530051a` (+refactor) | ✅ DONE |
| D — UUID → tên mục | `b792b9b` | ✅ DONE |
| E — Silent actions/history | `4da955e` (+vá bug toast) | ✅ DONE |
| F — Microcopy | `13dd92d` | ✅ DONE |
| G — Hydration Select | `01ac1e4` | ✅ DONE |
| H — Dock panel 1280 | `56c7add` | ✅ DONE |
| Decide — import heading | `47a789b` | ✅ Đã quyết định (Nhánh A) |

**Sửa hậu-review (không nằm trong 8 commit gốc):** tách `preflight.ts` dùng chung (A); disable-thay-vì-ẩn nút xuất (A); gỡ dead code `isConfirmOpen` (A); forward `onImageInserted` qua ref + Toast thay `alert()` + chặt `getBlockContext` (C); **vá bug toast PPTX replay khi remount tab** (E). Xem §Status từng contract.
