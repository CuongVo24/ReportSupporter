# W22 Break — Index Contract (QA Regression Sweep: Section Overwrite · Preview/Mermaid Perf · Blocked-Submit Feedback)

> **Lane:** Core / break_task / week22_break.
> **Branch (chung cả tuần):** `feature/W25-ui-redesign` — **toàn bộ contract W22 đi chung nhánh redesign đang chạy**, không tách nhánh con (giống W21). Contract (docs) merge thẳng vào `main`; phần thi công `src/` land trên nhánh redesign rồi mới gộp.
> **Nguồn:** QA session tương tác 2026-07-10 (Preview tools drive dev server như một tester) trên nhánh `feature/W25-ui-redesign` @ `fac0a8d`. Chạy các flow chính: khởi tạo báo cáo → editor/preview → mục lục/zoom/dark → chuyển mục. Mỗi phát hiện hành vi được **truy ngược về code để xác nhận**, không dừng ở triệu chứng.
> **Cách viết:** theo format `week21_break`/`week20_break` (Lane/Branch/Type · Findings S-mã · Micro-task · Locked · Scope · Checklist · Files · Risks · Verification · Status). Branch dùng chung cho mọi contract.
> **Chủ đề tuần:** "qa-regression" — không thêm tính năng mới, chỉ **sửa lỗi hồi quy làm hỏng flow cốt lõi** (viết nhiều chương) lộ ra khi drive app thật. Trọng tâm: một lỗi **mất dữ liệu P0** (chuyển mục ghi đè nội dung mục trước), một lỗi **hiệu năng** khi mở mục nặng có Mermaid, và một lỗi **phản hồi UX** (bấm tạo báo cáo bị chặn mà không báo gì).

## Vì sao redesign/W21 không bắt được?

W20-E và W21 tập trung **art direction & CSS** (zoom, dark, TOC parity, tách CSS). Không đụng tới **vòng dữ liệu editor↔state↔preview**. Lỗi P0 nằm ở **tầng tích hợp CodeMirror ↔ React state** (closure bind một lần), vô hình với mọi thay đổi CSS và chỉ lộ khi **chuyển qua lại giữa các mục có nội dung khác nhau** — đúng flow mà test tĩnh (render một mục) và test đơn vị (mock `onChange`) không phủ. Perf Mermaid chỉ lộ khi **một mục thực sự chứa `mermaid` + nội dung dài** rồi chuyển mục, không xuất hiện với nội dung mẫu ngắn.

## Nguyên nhân gốc (3 systemic)

| Mã | Nguyên nhân gốc | Triệu chứng | Contract |
|---|---|---|---|
| **A** | **Callback CodeMirror bind một lần lúc khởi tạo, không cập nhật theo section.** `EditorPanel` tạo `EditorView` trong `useEffect(…, [])` ([EditorPanel.tsx:48](src/components/EditorPanel.tsx#L48)) và `editor-setup.ts` gắn `opts.onChange`/`opts.onSave` vào `updateListener` **đúng một lần** ([editor-setup.ts:39](src/modules/write/editor-setup.ts#L39)). `handleChange` lại đóng kín (`closure`) trên `activeId` ([Workspace.tsx:209](src/components/Workspace.tsx#L209)); `EditorPanel` không có `key` theo mục ([Workspace.tsx:1203](src/components/Workspace.tsx#L1203)) nên instance sống xuyên suốt. Khi chuyển mục, effect đồng bộ ([EditorPanel.tsx:35](src/components/EditorPanel.tsx#L35)) dispatch thay toàn bộ doc → `docChanged` → `onChange` **cũ** chạy với `activeId` **cũ** → ghi nội dung mục **mới** đè lên mục **cũ**. Autosave lưu bản hỏng. | 🔴 Chuyển mục → nội dung mục trước bị đè thầm lặng (mất dữ liệu); Ctrl+S trong editor dính cùng closure | `w22_fix_editor_stale_callback_section_overwrite` |
| **B** | **Preview dựng lại toàn bộ mỗi lần render + Mermaid re-import/re-render, `key={index}`.** Thân `contentParts.map` ([PreviewPane.tsx:351](src/components/PreviewPane.tsx#L351)) chạy `parseMarkdown`→`injectHeadingNumbers`→`renderMdastToHtml` cho mọi phần trên **mỗi** render (không memo hoá theo phần); `MermaidRenderer` `await import("mermaid")` + `mermaid.initialize` + `mermaid.render` **mỗi** lần effect chạy ([MermaidRenderer.tsx:14](src/modules/write/MermaidRenderer.tsx#L14)); danh sách phần dùng `key={index}` khiến React tái dùng nhầm instance (khối Mermaid ↔ khối HTML) khi số phần đổi. | 🟠 Đơ/giật rõ khi mở mục có `mermaid` + nội dung dài; chuyển vào mục nặng không hoàn tất mượt; reconciliation sai vị trí | `w22_fix_preview_mermaid_rerender_key_perf` |
| **C** | **Submit khởi tạo bị chặn nhưng không có phản hồi thị giác.** Bấm "Tạo báo cáo" khi thiếu trường bắt buộc: `handleSubmitTemplate` chặn đúng (`setErrors` + `return`, [ProjectInitializer.tsx:120](src/modules/write/ProjectInitializer.tsx#L120)) nhưng thực nghiệm cho thấy **không lỗi nào hiển thị** (không `[role="alert"]`, không `aria-invalid`, không cuộn tới field lỗi), người dùng thấy nút "chết". Cần chốt nhánh: lỗi được set nhưng không render, hay init thất bại thầm lặng. | 🟡 Nút "Tạo báo cáo" không phản hồi khi thiếu Trường/Khoa hoặc Thành viên; người dùng không biết vì sao | `w22_fix_initializer_blocked_submit_feedback` |

## Map phát hiện → xử lý

| # | Phát hiện (QA 2026-07-10) | Mức | Xử lý |
|---|---|---|---|
| 1 | Chuyển mục ghi đè nội dung mục trước — mất dữ liệu, autosave lưu bản hỏng | 🔴 | `w22_fix_editor_stale_callback_section_overwrite` |
| 2 | Ctrl+S trong editor lưu nhầm mục (cùng closure stale) | 🔴 | `w22_fix_editor_stale_callback_section_overwrite` |
| 3 | Đơ/giật khi mở mục chứa Mermaid + nội dung dài | 🟠 | `w22_fix_preview_mermaid_rerender_key_perf` |
| 4 | `key={index}` cho danh sách phần preview — reconciliation sai | 🟠 | `w22_fix_preview_mermaid_rerender_key_perf` |
| 5 | Bấm "Tạo báo cáo" thiếu trường bắt buộc → không phản hồi/không báo lỗi | 🟡 | `w22_fix_initializer_blocked_submit_feedback` |

## Phát hiện đã điều tra và **loại** (dương tính giả — không viết contract)

Ghi lại để không tái điều tra:
- **"Nút Mở mục lục mobile hỏng"** → **loại.** `MobileDrawer` cho mục lục tồn tại đầy đủ ([WorkspaceLayout.tsx:389](src/components/WorkspaceLayout.tsx#L389)); triệu chứng do query kiểm thử tìm thẻ `<aside>` mà drawer không dùng `<aside>`, không phải lỗi app.
- **"Label a11y mất dấu tiếng Việt"** (`MUC LUC`, `Keo sap xep muc`) → **loại.** Source dùng **đúng dấu** ("Kéo sắp xếp mục", "Thu gọn mục lục" — [SectionNav.tsx:143](src/components/SectionNav.tsx#L143), [SectionNav.tsx:346](src/components/SectionNav.tsx#L346)); mất dấu là do công cụ snapshot a11y lược bỏ diacritics khi serialize, không phải chuỗi trong code.
- **"Sync-scroll preview→editor một chiều"** → **chưa xác nhận, gộp làm mục verify của B.** Nhánh editor→preview chạy đúng ([WorkspaceLayout.tsx:189](src/components/WorkspaceLayout.tsx#L189)); chiều ngược lại quan sát thấy không cuộn nhưng có thể do app đang ở trạng thái kẹt bởi A/B lúc test — cần re-test sau khi A/B đã fix, không đủ cơ sở mở contract riêng.

## Thứ tự đề xuất (chặn mất dữ liệu trước → đo lại perf → UX nhỏ)

1. `w22_fix_editor_stale_callback_section_overwrite` — **A, keystone.** Lỗi mất dữ liệu nghiêm trọng nhất, chặn ngay. Làm **trước** vì vòng ghi-đè của A khuếch đại churn render, có thể là chất xúc tác cho triệu chứng đơ của B — sửa A rồi mới đo lại B cho sạch.
2. `w22_fix_preview_mermaid_rerender_key_perf` — **B.** Sau khi A yên, **profile lại** mục nặng-Mermaid; sửa key, memo hoá render theo phần, cache import Mermaid.
3. `w22_fix_initializer_blocked_submit_feedback` — **C.** Độc lập, nhỏ; chốt nhánh (lỗi không render vs init câm) rồi bảo đảm submit bị chặn luôn có phản hồi.

## Locked dùng chung mọi contract
- 🔒 **Một nhánh thi công duy nhất `feature/W25-ui-redesign`**; mỗi contract = 1 commit logic riêng (không nhánh con). Docs contract gộp vào `main`.
- 🔒 **Không mất dữ liệu người dùng.** Sau W22, không thao tác điều hướng/lưu nào được **im lặng** ghi đè/đánh rơi nội dung một mục. Nếu buộc phải chọn, thà chặn + báo còn hơn hỏng thầm lặng.
- 🔒 **Một nguồn sự thật render** (kế thừa W19/W20): preview/print-preview/PDF chia sẻ pipeline; sửa perf preview **không** được đẻ nhánh render thứ hai hay lệch kết quả với print.
- 🔒 **Không đổi public surface** `ReportSection`/`CanonicalTypes`/`CheckResult`/`ExportTarget` trừ khi contract ghi rõ; sửa closure/perf là **nội bộ**, không đổi hợp đồng dữ liệu.
- 🔒 **Không thêm lib.** Sửa bằng vốn có (React ref/`useMemo`/`key`, `EditorView`, mermaid đã cài). Không kéo state manager hay memo lib.
- 🔒 **Token-only / no-hex ngoài primitive**; microcopy theo `VoiceAndContent.md §7`; `--rs-report-*` bất biến (trang in trắng-đen).
- 🔒 **Có test hồi quy cho A.** Lỗi mất dữ liệu phải kèm test (unit/integration) mô phỏng chuyển mục A→B rồi quay lại A xác nhận nội dung A còn nguyên — chống tái phát.

## Cảnh báo phạm vi (đọc trước khi Approve)
- **A có nhiều cách sửa, chọn cách tối thiểu rủi ro:** (1) forward `onChange`/`onSave` qua `ref` (giữ instance editor, luôn gọi callback mới nhất — ít churn nhất, khuyến nghị), hoặc (2) `key={activeSection.id}` để remount editor mỗi mục (đơn giản nhưng mất undo-history/scroll khi chuyển mục), hoặc (3) chuyển `handleChange` sang functional update không đóng trên `activeId` **và** truyền `activeId` qua ref. Ưu tiên (1). Phải verify **undo/redo, autosave, focus** không hồi quy.
- **B là perf, đo trước khi sửa:** sau khi A fix, dùng Performance profiler xác nhận nút thắt thật (Mermaid render đồng bộ? re-parse? layout thrash từ `ResizeObserver` zoom ở [WorkspaceLayout.tsx:144](src/components/WorkspaceLayout.tsx#L144)?). Sửa theo bằng chứng: cache `import("mermaid")` ở module scope + `mermaid.initialize` một lần; memo hoá HTML từng phần theo nội dung; đổi `key={index}` sang key ổn định theo nội dung/loại phần. **Không** đổi diện mạo sơ đồ.
- **C phải chốt nhánh trước khi sửa:** re-test sạch (điền qua React onChange thật, không set DOM value trực tiếp) để phân biệt "lỗi set nhưng không render" với "validation pass nhưng `onInitialize`/`handleInitialize` không advance". Fix bao trùm cả hai: submit bị chặn **luôn** hiển thị lỗi + focus field lỗi đầu tiên; init thất bại **luôn** có toast. Không được đổi luật validation (`validateMetadata`) — chỉ đảm bảo phản hồi.

> Tất cả contract đang ở trạng thái `PROPOSED — chờ Approve`. Chưa chạm `src/` cho tới khi Approve từng contract.
