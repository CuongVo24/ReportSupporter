# W24 Break — Index Contract (QA Regression Sweep 3: Vòng Đời Ảnh · Preview Vỡ · Dev-Server Đơ · Gate Chặn Dây Chuyền · Lối Phục Hồi)

> **Lane:** Core / break_task / week24_break.
> **Branch (chung cả tuần):** `main` — nối tiếp W23 (redesign đã gộp; xem `w23_break_index.md §Trạng thái`). Mỗi contract = **1 commit logic riêng**; docs contract commit trước, thi công `src/` sau khi Approve từng contract.
> **Nguồn:** QA session tương tác **2026-07-14** (Preview tools drive dev server như tester end-to-end) trên `main` @ `7292b48`. Tập trung đúng phần user báo: **"bỏ hình vào báo cáo"** + **kiểm tra sức khỏe / Xuất bản / Nộp bài / Trình bày / Slide** — user không rõ "lỗi giao diện hay thật sự không hoạt động". Đã tái hiện triệu chứng ảnh vỡ (paste ảnh sống OK; import đường dẫn cục bộ + `asset:` mồ côi vỡ), chạy Soát lỗi (đếm đúng), Xuất bản (bị gate P0), Nộp bài, Slide. Mỗi phát hiện **truy ngược về code xác nhận file:line**; các dương-tính-giả do automation đã loại (xem cuối).
> **Cách viết:** theo format `week23_break`/`week22_break` (Lane/Branch/Type · Findings S-mã · Micro-task · Locked · Scope · Checklist · Files · Risks · Verification · Status). Branch dùng chung cho mọi contract.
> **Chủ đề tuần:** "image-lifecycle" — **không thêm tính năng mới**, sửa **vòng đời ảnh** và các **hệ quả dây chuyền** lộ ra khi báo cáo thật có ảnh chưa nhúng. Kết luận điều tra: **không module nào chết** — tất cả triệu chứng "không hoạt động" đều truy về **một gốc: ảnh chưa được nhúng thật sự**, cộng cơ chế chặn/phản hồi quá im lặng.

## Vì sao W23 không bắt được?

W23 (QA sweep 2) đã sửa đúng **luồng xuất bản** (hợp nhất preflight P0/warning, disable "Vẫn xuất bản" khi P0), **slug tên file**, **editor chèn block**, **UUID→tên mục**, **hành động im lặng ở SubmissionPanel/PPTX toast**, microcopy, hydration, dock panel. Nhưng W23 test trên **mẫu đủ evidence + ảnh chèn trực tiếp** — không đi đường **báo cáo import thiếu file ảnh**. W24 lộ ra ở **tầng render ảnh và hệ quả hạ nguồn** mà không test nào phủ:

- **Render ảnh chưa nhúng chưa từng được chạm.** `PreviewPane` và `prepare-export` đều gọi `resolveAssetRefs` (thay `asset:`/`image:` bằng data-URL **nếu tìm thấy**); ref **không giải được** thì **giữ nguyên** → sanitizer gỡ `src` (protocol `asset` không whitelist) → **icon vỡ**; còn đường dẫn cục bộ `images/x.png` **lọt qua sanitizer** → trình duyệt **phát GET thật → 404**. W23-A/D/E chỉ chạm gate/nhãn/history, **không** chạm đường render này.
- **404 ảnh cục bộ làm dev-server đơ.** Mỗi ref cục bộ vỡ → `GET /images/... 404` → Next dev **compile `/_not-found` ~108s, chặn cả server** (đo được: GET / sau đó 20–70s, Fast Refresh 33s). Báo cáo nhiều hình vỡ → dội 404 liên tục → **cảm giác "app chết"** — chính là điều user mô tả.
- **Gate P0 chặn dây chuyền sang Slide.** W23 chốt "P0 chặn xuất" (đúng cho **thân báo cáo**), nhưng `executeExport` gate **mọi target kể cả `pptx`** ([use-export.ts:23](src/modules/export/use-export.ts#L23)) — xuất **slide** bị chặn bởi P0 **thân báo cáo** (thiếu evidence, ảnh body vỡ), dù slide là **deliverable khác**.
- **Không có lối phục hồi ảnh sau import.** App nhúng ảnh qua: data-URL trong file import ([extract-assets.ts](src/modules/import/extract-assets.ts)), file ảnh kèm theo khớp basename ([import-assets.ts:128](src/modules/write/import-assets.ts#L128)), hoặc chèn/paste trực tiếp. Import **thiếu file** → user chỉ nhận cảnh báo + icon vỡ, **không có nút "gắn ảnh vào đây"** → phải xoá ref thủ công rồi chèn lại. Không "triệt để".

## Nguyên nhân gốc (systemic)

| Mã | Nguyên nhân gốc | Triệu chứng | Contract |
|---|---|---|---|
| **A** | **Ảnh chưa nhúng render thành `<img>` chết + phát request mạng.** `resolveAssetRefs` giữ nguyên ref không giải được ([resolve-assets.ts:12](src/modules/write/resolve-assets.ts#L12)); `customSchema.protocols.src` chỉ whitelist `http/https/data` — **không** có `asset`/`image` ([markdown-pipeline.ts:31](src/lib/markdown-pipeline.ts#L31)-L34) ⇒ ref mồ côi bị gỡ `src` (icon vỡ). Đường dẫn cục bộ `images/x.png` **không** bị resolve và **lọt** sanitizer ⇒ `<img src="images/x.png">` **phát GET → 404**. Áp cho cả `PreviewPane` ([PreviewPane.tsx:154](src/components/PreviewPane.tsx#L154),L177,L409) và `prepare-export` ([prepare-export.ts:56](src/modules/export/prepare-export.ts#L56)) và **`ImportPreviewDialog`** dùng chung PreviewPane ([ImportPreviewDialog.tsx:360](src/modules/import/ImportPreviewDialog.tsx#L360)). | 🔴 Ảnh báo cáo vỡ (icon/không src); 🔴 dev-server đơ hàng phút vì 404 → compile `/_not-found` 108s; ảnh chết lọt file xuất nếu gate bị bỏ qua | `w24_fix_preview_unembedded_image_placeholder_no_network` |
| **B** | **Không có đường phục hồi ảnh sau import.** Nhúng ảnh chỉ qua data-URL/khớp-basename/chèn-tay; ref cục bộ hoặc `asset:` mồ côi sau import **không có affordance gắn lại** — placeholder trơ, panel Soát lỗi chỉ báo "import lại kèm ảnh". | 🟠 Import thiếu 1 ảnh phải làm lại từ đầu hoặc sửa markdown tay; trải nghiệm sửa không "triệt để" | `w24_fix_image_recovery_attach_from_placeholder_and_issues` |
| **C** | **Gate P0 chặn dây chuyền sang deliverable khác (Slide/PPTX).** `executeExport` chạy `runChecker(bundle)` và ném lỗi với **mọi** target — nhánh `pptx` ([use-export.ts:86](src/modules/export/use-export.ts#L86)) nằm **sau** cổng P0 ([use-export.ts:23](src/modules/export/use-export.ts#L23)-L33). Xuất slide bị chặn bởi P0 **thân báo cáo** (evidence/ảnh body) không liên quan slide. | 🟠 Bấm "Xuất PowerPoint" ở tab Slide fail vì lỗi evidence/ảnh của **thân báo cáo** | `w24_fix_export_gate_scope_per_target_pptx` |
| **D** | **Lịch sử xuất bản ở ExportPanel là state phiên.** `ExportPanel` nhận `jobs` (React state in-memory từ `useExport`) — **mất khi đổi tab/remount**; bản ghi **bền** (kể cả lỗi) chỉ đọc ở `SubmissionPanel` qua `loadExportHistory` (IndexedDB, [export-history.ts:54](src/modules/export/export-history.ts#L54)). Bấm xuất → fail → đổi tab → quay lại thấy **"Chưa có lịch sử"** → tưởng chưa từng xuất/không rõ vì sao fail. | 🟡 Lịch sử + lý do lỗi xuất bản biến mất khi rời tab Xuất bản | `w24_fix_export_history_persist_in_export_panel` |
| **E** | **Gate P0 cứng, không có lối "xuất bản nháp".** P0 chặn **toàn bộ** xuất file (kể cả xem thử) — sinh viên **không xem được** Word/PDF khi còn P0 (đang soạn dở, ảnh chưa gắn). Cần **chốt chủ ý**: cho "Xuất nháp" (watermark DRAFT, bỏ qua P0 không phá file) hay giữ gate cứng. | 🟡 Không xem trước được bản Word/PDF khi báo cáo chưa hoàn chỉnh | `w24_decide_draft_export_bypass_p0_watermark` (Decide) |

## Map phát hiện → xử lý

| # | Phát hiện (QA 2026-07-14) | Mức | Xử lý |
|---|---|---|---|
| 1 | Ảnh import đường dẫn cục bộ `images/x.png` render icon vỡ **và phát GET 404** | 🔴 | `w24_fix_preview_unembedded_image_placeholder_no_network` |
| 2 | Ảnh `asset:<id>` mồ côi → sanitizer gỡ `src` → icon vỡ, không placeholder | 🔴 | `w24_fix_preview_unembedded_image_placeholder_no_network` |
| 3 | 404 ảnh cục bộ khiến Next dev compile `/_not-found` ~108s → app đơ hàng phút | 🔴 | `w24_fix_preview_unembedded_image_placeholder_no_network` |
| 4 | Ảnh chết lọt vào HTML/PDF/DOCX nếu gate bị bypass (defense-in-depth + tiền đề cho E) | 🟠 | `w24_fix_preview_unembedded_image_placeholder_no_network` |
| 5 | Import thiếu file ảnh: không có nút "gắn ảnh vào đúng ref" (placeholder + panel Soát lỗi) | 🟠 | `w24_fix_image_recovery_attach_from_placeholder_and_issues` |
| 6 | Xuất PowerPoint (tab Slide) bị chặn bởi P0 thân báo cáo (evidence/ảnh body) | 🟠 | `w24_fix_export_gate_scope_per_target_pptx` |
| 7 | Lịch sử xuất bản ở ExportPanel mất khi đổi tab; lý do lỗi không xem lại được | 🟡 | `w24_fix_export_history_persist_in_export_panel` |
| 8 | Gate P0 cứng: không xem thử được Word/PDF khi còn P0 (cần quyết "xuất nháp") | 🟡 | `w24_decide_draft_export_bypass_p0_watermark` |

## Locked dùng chung mọi contract
- 🔒 **Thi công trên `main`**; mỗi contract = 1 commit logic riêng. Docs contract commit trước phần `src/`.
- 🔒 **Không nới lỏng gate P0 của thân báo cáo** (giữ đúng W23-A lock). C chỉ **đúng-phạm-vi** gate cho deliverable khác (slide), **không** bỏ gate report. E là **quyết định của chủ dự án** (watermark, có kiểm soát), **không** phải nới lỏng thầm.
- 🔒 **Không thao tác nào im lặng** (kế thừa W23): ảnh vỡ phải có **placeholder giải thích + lối sửa**, không icon-vỡ trơ; gắn ảnh lại phải có toast.
- 🔒 **Preview không được phát request mạng** cho ref ảnh không giải được (đường dẫn cục bộ / `asset:` mồ côi) — nguồn gốc làm đơ dev-server và bẩn file xuất.
- 🔒 **Một nguồn nhúng ảnh** — tái dùng `createImageAsset`/`extractEmbeddedAssets`/`resolveAssetRefs` sẵn có; **không** đẻ pipeline ảnh thứ hai; ảnh vẫn offline base64/IndexedDB, **không** upload server.
- 🔒 **Một nguồn lịch sử xuất bản** — ExportPanel và SubmissionPanel cùng đọc `loadExportHistory` (IndexedDB); không đẻ store thứ hai.
- 🔒 **Không đổi luật checker/validate** (`runChecker`, `validateExport`, quy tắc evidence/ảnh) — chỉ surface & đúng-phạm-vi.
- 🔒 **Không đổi public surface** `ReportSection`/`ReportAsset`/`CheckResult`/`ExportTarget`/`ExportJob` trừ khi contract ghi rõ.
- 🔒 **Không thêm lib.** Sửa bằng vốn có (React/state, sanitizer schema, toast W13/W20, `lib/slugify`, `createImageAsset`).
- 🔒 **Token-only / no-hex ngoài primitive**; microcopy tiếng Việt **đủ dấu** theo `VoiceAndContent.md §7`; `--rs-report-*` bất biến (trang in).

## Cảnh báo phạm vi (đọc trước khi Approve)
- **A không được "vá bằng cách ẩn ảnh":** ref không giải được phải thành **placeholder có ý nghĩa** (khung + tên/alt + lý do "chưa nhúng" + lối dẫn sửa), **không** xoá ảnh khỏi nội dung. Điểm cứng: **chặn request mạng** — biến ref không-nhúng thành node **không phát src ra ngoài** (đổi thành placeholder trước sanitize, hoặc chặn ở tầng resolve). Kiểm cả 3 điểm: PreviewPane, prepare-export, ImportPreviewDialog.
- **B tái dùng cơ chế asset offline sẵn có:** "Gắn ảnh" dùng `createImageAsset` (≤5MB, base64/IndexedDB) rồi **rewrite đúng ref** (đường dẫn cục bộ → `asset:<id>`; `asset:` mồ côi → id mới) trong markdown mục tương ứng — **không** upload, **không** đổi schema asset.
- **C đúng-phạm-vi, không bỏ gate:** slide/pptx chỉ gate lỗi **liên quan slide** (nếu có), **không** gate evidence/ảnh **thân báo cáo**. Cân nhắc: route pptx qua kiểm riêng thay vì `runChecker(bundle)` toàn cục. Giữ gate report cho html/pdf/docx nguyên vẹn.
- **D một nguồn, đúng race:** ExportPanel đọc `loadExportHistory` (bền) thay in-memory; đồng bộ với `recordExport` (đã `await` ở W23-E) tránh lệch; **không** đổi schema history.
- **E là Decide — chưa chạm `src/`:** chốt nhánh (giữ cứng / cho nháp watermark) + phạm vi "P0 nào vẫn chặn kể cả nháp" (vd lỗi phá vỡ file) trước khi mở contract thi công. Tôn trọng W23 lock "không nới lỏng gate" — nếu chọn nháp thì phải watermark + cảnh báo rõ, không thay thế bản nộp.

## Phát hiện đã điều tra và **loại** (dương tính giả — không viết contract)

Ghi lại để không tái điều tra:
- **"Soát lỗi 451 là bug"** → **loại.** Checker chạy đúng: seed 2 ảnh vỡ → báo đúng 2 P0 + tụt điểm 75→40. 451 là **đếm thật** trên báo cáo lớn (nhiều hình vỡ + caption thiếu + số hình lệch chương), không phải lỗi.
- **"Chèn ảnh trực tiếp không hoạt động"** → **loại.** Paste ảnh PNG vào editor → asset lưu IndexedDB, hiện trong preview, **sống sót qua reload** (assetCount:1). Pipeline chèn/paste/drop OK ([EditorPanel.tsx](src/components/EditorPanel.tsx), [use-image-insert.ts](src/modules/write/use-image-insert.ts)).
- **"Xuất bản/Nộp bài chết"** → **loại phần 'chết'.** Gate P0 hoạt động **đúng thiết kế W23-A** (dialog hiện P0, "Vẫn xuất bản" disabled). Không phải hỏng — là **chặn có chủ đích**. Phần cần cải thiện đã tách thành C (phạm vi pptx), D (history), E (decide nháp). Đủ evidence (github/demo/deploy/video) + sửa ảnh vỡ → xuất chạy.
- **"Lịch sử phiên bản 0 bản = hỏng snapshot"** → **loại.** Đúng thiết kế: snapshot chỉ tạo trước **xoá mục / tạo mới / ghi đè file / áp dụng AI** ([Workspace.tsx:461](src/components/Workspace.tsx#L461),L641,L659,L722). Nút "Lưu bản thảo" **không** tạo snapshot. Chưa làm 4 thao tác đó thì 0 bản.
- **"Slide/Trình bày không hoạt động"** → **loại.** Outline 12 slide, timeline (18ph/giới hạn 10ph), gán người nói, kịch bản, Q&A đều chạy. Chỉ nút **Xuất PPTX** dính gate (đã tách thành C).
- **Automation flakiness** → **loại (không phải lỗi app):** screenshot treo 30s, `.click()` JS không kích hoạt tab Radix (phải dispatch full pointer sequence), animation drawer đứng hình giữa chừng — đều là giới hạn browser-test; đã kiểm chứng chéo bằng DOM/IndexedDB. Không mở contract.

## Thứ tự đề xuất (gốc ảnh trước → phục hồi → gate phụ → history → decide)

1. `w24_fix_preview_unembedded_image_placeholder_no_network` — **A, keystone.** Gốc của mọi triệu chứng "ảnh vỡ" + "app đơ"; sửa xong hết dội 404, preview/xuất sạch.
2. `w24_fix_image_recovery_attach_from_placeholder_and_issues` — **B.** Cho user sửa "triệt để" ngay tại chỗ sau khi A đã có placeholder làm điểm neo.
3. `w24_fix_export_gate_scope_per_target_pptx` — **C.** Gỡ chặn dây chuyền cho Slide; độc lập, nhỏ.
4. `w24_fix_export_history_persist_in_export_panel` — **D.** Một nguồn history; nhỏ, kỹ thuật.
5. `w24_decide_draft_export_bypass_p0_watermark` — **E, Decide.** Chốt chủ ý trước khi (nếu cần) mở contract thi công xuất-nháp.

## Trạng thái thi công (cập nhật 2026-07-14)

| Contract | Commit | Trạng thái |
|---|---|---|
| A — Preview ảnh chưa nhúng + chặn network | [w24-fix-a] | ✅ DONE |
| B — Phục hồi/gắn lại ảnh sau import | — | ⏳ PROPOSED |
| C — Đúng-phạm-vi gate pptx/slide | — | ⏳ PROPOSED |
| D — Lịch sử xuất bản bền ở ExportPanel | — | ⏳ PROPOSED |
| E — Decide xuất bản nháp (watermark) | — | ⏳ PROPOSED (Decide) |

> Tất cả **PROPOSED** — chờ Approve từng contract; docs commit trước, `src/` sau. Gate cuối mỗi contract: `npm test` xanh + `tsc --noEmit` sạch (W23 baseline: 617/617).
