# W24 Break — Index Contract (QA Regression Sweep 3 + Performance/Scale Hardening Trước Public Beta)

> **Lane:** Core / break_task / week24_break.
> **Branch (chung cả tuần):** `main` — nối tiếp W23 (redesign đã gộp; xem `w23_break_index.md §Trạng thái`). Mỗi contract = **1 commit logic riêng**; docs contract commit trước, thi công `src/` sau khi Approve từng contract.
> **Nguồn:** (1) QA session tương tác **2026-07-14** trên `main` @ `7292b48` cho track A–E (vòng đời ảnh/export); (2) production profiling **2026-07-18** + review tổng thể/CodeGraph/source verification **2026-07-19** cho track F–P (PDF capacity, worker/preview/startup, IndexedDB/snapshot, AI streaming, gate đo thật). Mỗi kết luận đều có đường code/KPI; green gate cũ được phân biệt với user-path proof.
> **Cách viết:** theo format `week23_break`/`week22_break` (Lane/Branch/Type · Findings S-mã · Micro-task · Locked · Scope · Checklist · Files · Risks · Verification · Status). Branch dùng chung cho mọi contract.
> **Chủ đề tuần:** hai track độc lập nhưng cùng mục tiêu beta: **A–E `image-lifecycle`** (đã thi công) và **F–P `performance-scale-hardening`** (contract mới, chưa thi công). Track hiệu năng ưu tiên capacity/recovery PDF, đo đường chạy thật, loại Promise treo/cache không giới hạn/write amplification; không tối ưu mù và không tăng budget để làm gate xanh.

## Vì sao W23 không bắt được?

W23 (QA sweep 2) đã sửa đúng **luồng xuất bản** (hợp nhất preflight P0/warning, disable "Vẫn xuất bản" khi P0), **slug tên file**, **editor chèn block**, **UUID→tên mục**, **hành động im lặng ở SubmissionPanel/PPTX toast**, microcopy, hydration, dock panel. Nhưng W23 test trên **mẫu đủ evidence + ảnh chèn trực tiếp** — không đi đường **báo cáo import thiếu file ảnh**. W24 lộ ra ở **tầng render ảnh và hệ quả hạ nguồn** mà không test nào phủ:

- **Render ảnh chưa nhúng chưa từng được chạm.** `PreviewPane` và `prepare-export` đều gọi `resolveAssetRefs` (thay `asset:`/`image:` bằng data-URL **nếu tìm thấy**); ref **không giải được** thì **giữ nguyên** → sanitizer gỡ `src` (protocol `asset` không whitelist) → **icon vỡ**; còn đường dẫn cục bộ `images/x.png` **lọt qua sanitizer** → trình duyệt **phát GET thật → 404**. W23-A/D/E chỉ chạm gate/nhãn/history, **không** chạm đường render này.
- **404 ảnh cục bộ làm dev-server đơ.** Mỗi ref cục bộ vỡ → `GET /images/... 404` → Next dev **compile `/_not-found` ~108s, chặn cả server** (đo được: GET / sau đó 20–70s, Fast Refresh 33s). Báo cáo nhiều hình vỡ → dội 404 liên tục → **cảm giác "app chết"** — chính là điều user mô tả.
- **Gate P0 chặn dây chuyền sang Slide.** W23 chốt "P0 chặn xuất" (đúng cho **thân báo cáo**), nhưng `executeExport` gate **mọi target kể cả `pptx`** ([use-export.ts:23](src/modules/export/use-export.ts#L23)) — xuất **slide** bị chặn bởi P0 **thân báo cáo** (thiếu evidence, ảnh body vỡ), dù slide là **deliverable khác**.
- **Không có lối phục hồi ảnh sau import.** App nhúng ảnh qua: data-URL trong file import ([extract-assets.ts](src/modules/import/extract-assets.ts)), file ảnh kèm theo khớp basename ([import-assets.ts:128](src/modules/write/import-assets.ts#L128)), hoặc chèn/paste trực tiếp. Import **thiếu file** → user chỉ nhận cảnh báo + icon vỡ, **không có nút "gắn ảnh vào đây"** → phải xoá ref thủ công rồi chèn lại. Không "triệt để".

## Baseline hiệu năng đã xác minh (2026-07-18/19)

| Probe | Kết quả hiện tại | Ý nghĩa contract |
|---|---:|---|
| CodeGraph | 408 files · 3,467 nodes · 6,807 edges · index up-to-date | Callers `runPipelineRequest`: `PreviewPane`, `Workspace`; persistence path `saveProjectBundle -> putProjectRecord`. |
| Bundle gate cũ | Workspace `104.7 KiB / 450 KiB` gzip | **Đếm thiếu** dynamic transitive graph. |
| Workspace transitive thật | 14 JS · `1,924.7 KiB raw / 596.9 KiB gzip` | `WorkspaceLoader -> Workspace` chỉ tải sau hydration và vượt budget danh nghĩa. |
| Small project production | editor-ready ~`2,182ms`; long-task total `803ms`, max `225ms`; heap ~`19.6 MiB` | Cần startup/browser gate thật, không chỉ reducer benchmark. |
| Large: 40 sections + 5 MiB assets + 10 snapshots | editor-ready ~`2,398ms`; long-task total `1,439ms`; heap ~`257.5 MiB` | Snapshot/base64 + preview payload là cost center thật. |
| Cùng project, bỏ snapshots | heap ~`58.2 MiB` (so với ~`260 MiB` có 10 snapshot) | Snapshot full-bundle là memory multiplier chính. |
| Actual worker | `ReferenceError: document is not defined` | Fake-worker perf test xanh không chứng minh worker production sống. |

> **Verdict:** public beta về kiến trúc local-first là hợp lý, nhưng PDF renderer capacity là blocker vận hành; worker hang + false-green gate + snapshot/cache amplification là blocker cho claim “hiệu năng đã được kiểm chứng”.

## Nguyên nhân gốc (systemic)

| Mã | Nguyên nhân gốc | Triệu chứng | Contract |
|---|---|---|---|
| **A** | **Ảnh chưa nhúng render thành `<img>` chết + phát request mạng.** `resolveAssetRefs` giữ nguyên ref không giải được ([resolve-assets.ts:12](src/modules/write/resolve-assets.ts#L12)); `customSchema.protocols.src` chỉ whitelist `http/https/data` — **không** có `asset`/`image` ([markdown-pipeline.ts:31](src/lib/markdown-pipeline.ts#L31)-L34) ⇒ ref mồ côi bị gỡ `src` (icon vỡ). Đường dẫn cục bộ `images/x.png` **không** bị resolve và **lọt** sanitizer ⇒ `<img src="images/x.png">` **phát GET → 404**. Áp cho cả `PreviewPane` ([PreviewPane.tsx:154](src/components/PreviewPane.tsx#L154),L177,L409) và `prepare-export` ([prepare-export.ts:56](src/modules/export/prepare-export.ts#L56)) và **`ImportPreviewDialog`** dùng chung PreviewPane ([ImportPreviewDialog.tsx:360](src/modules/import/ImportPreviewDialog.tsx#L360)). | 🔴 Ảnh báo cáo vỡ (icon/không src); 🔴 dev-server đơ hàng phút vì 404 → compile `/_not-found` 108s; ảnh chết lọt file xuất nếu gate bị bỏ qua | `w24_fix_preview_unembedded_image_placeholder_no_network` |
| **B** | **Không có đường phục hồi ảnh sau import.** Nhúng ảnh chỉ qua data-URL/khớp-basename/chèn-tay; ref cục bộ hoặc `asset:` mồ côi sau import **không có affordance gắn lại** — placeholder trơ, panel Soát lỗi chỉ báo "import lại kèm ảnh". | 🟠 Import thiếu 1 ảnh phải làm lại từ đầu hoặc sửa markdown tay; trải nghiệm sửa không "triệt để" | `w24_fix_image_recovery_attach_from_placeholder_and_issues` |
| **C** | **Gate P0 chặn dây chuyền sang deliverable khác (Slide/PPTX).** `executeExport` chạy `runChecker(bundle)` và ném lỗi với **mọi** target — nhánh `pptx` ([use-export.ts:86](src/modules/export/use-export.ts#L86)) nằm **sau** cổng P0 ([use-export.ts:23](src/modules/export/use-export.ts#L23)-L33). Xuất slide bị chặn bởi P0 **thân báo cáo** (evidence/ảnh body) không liên quan slide. | 🟠 Bấm "Xuất PowerPoint" ở tab Slide fail vì lỗi evidence/ảnh của **thân báo cáo** | `w24_fix_export_gate_scope_per_target_pptx` |
| **D** | **Lịch sử xuất bản ở ExportPanel là state phiên.** `ExportPanel` nhận `jobs` (React state in-memory từ `useExport`) — **mất khi đổi tab/remount**; bản ghi **bền** (kể cả lỗi) chỉ đọc ở `SubmissionPanel` qua `loadExportHistory` (IndexedDB, [export-history.ts:54](src/modules/export/export-history.ts#L54)). Bấm xuất → fail → đổi tab → quay lại thấy **"Chưa có lịch sử"** → tưởng chưa từng xuất/không rõ vì sao fail. | 🟡 Lịch sử + lý do lỗi xuất bản biến mất khi rời tab Xuất bản | `w24_fix_export_history_persist_in_export_panel` |
| **E** | **Gate P0 cứng, không có lối "xuất bản nháp".** P0 chặn **toàn bộ** xuất file (kể cả xem thử) — sinh viên **không xem được** Word/PDF khi còn P0 (đang soạn dở, ảnh chưa gắn). Cần **chốt chủ ý**: cho "Xuất nháp" (watermark DRAFT, bỏ qua P0 không phá file) hay giữ gate cứng. | 🟡 Không xem trước được bản Word/PDF khi báo cáo chưa hoàn chỉnh | `w24_decide_draft_export_bypass_p0_watermark` (Decide) |

### Track 2 — Nguyên nhân gốc hiệu năng/scale

| Mã | Nguyên nhân gốc | Triệu chứng / rủi ro | Contract |
|---|---|---|---|
| **F** | Renderer không admission control; browser chết không relaunch; health vẫn xanh; container không memory/PID/CPU limit. | 🔴 Burst nhiều user → page Chromium không giới hạn/OOM; crash → fail tới khi restart. | `w24_perf_pdf_renderer_capacity_recovery` |
| **G** | Renderer có thể chạy 60s trong khi gateway 30s/client 35s; cancellation không xuyên tầng; gateway buffer/copy full HTML/PDF; overload status bị collapse. | 🔴 Chromium tiếp tục đốt tài nguyên sau khi user đã timeout; 🟠 heap serverless spike. | `w24_perf_pdf_gateway_backpressure_cancellation` |
| **H** | Production Redis/proxy/PDF env là bắt buộc nhưng `.env.example`/Deployment mâu thuẫn; token renderer rỗng fail-open; proxy none tạo shared PDF bucket. | 🔴 Deploy xong AI/PDF 503 cho mọi user hoặc renderer không auth/quota chung. | `w24_perf_production_config_readiness_rate_limit` |
| **I** | Pipeline client không `error/messageerror/timeout`; pending Promise treo; worker graph có DOM dependency. | 🔴 Preview/check/format “đang chạy” vô hạn; worker production crash. | `w24_perf_pipeline_worker_fail_fast_recovery` |
| **J** | Cache pipeline không eviction; mỗi edit gửi full sections/assets, parse active hai lần, queue stale work, clone AST trên main. | 🟠 Heap tăng theo thời gian; edit report lớn giật/chậm dù stale response bị bỏ. | `w24_perf_preview_incremental_bounded_cache` |
| **K** | Workspace chỉ import trong `useEffect`; budget không theo dynamic transitive chunks. | 🔴 Startup waterfall; critical gzip thật ~596.9 KiB bị báo 104.7 KiB. | `w24_perf_startup_waterfall_transitive_chunks` |
| **L** | Autosave/project save vẫn ghi bundle lớn vào project store **và** legacy draft mỗi lần. | 🟠 Double clone/write/quota với assets base64. | `w24_perf_retire_legacy_idb_dual_write` |
| **M** | Snapshot chứa full bundle/base64; list parse payload; prune clear+rewrite toàn bộ kept snapshots. | 🔴 10 snapshot đẩy heap ~58→260 MiB; snapshot mới gây read/write amplification lớn. | `w24_perf_snapshot_storage_dedup_incremental_prune` |
| **N** | AI route buffer provider response rồi giả NDJSON; client lại `response.text()` toàn stream. | 🟠 First token chờ tới phút; serverless timeout/heap không cần thiết. | `w24_perf_ai_true_streaming_backpressure` |
| **O** | Perf tests dùng fake worker/reducer-only; bundle script bỏ dynamic graph. | 🔴 CI xanh trong khi user path lỗi/chậm; W30/W36 evidence bị suy rộng. | `w24_perf_truthful_browser_and_bundle_gates` |
| **P** | Writing stats join/regex toàn report; report health quét sections×evidence sau mỗi edit. | 🟠 Derived UI cạnh tranh main thread với preview/autosave; cần profiler xác nhận ROI. | `w24_perf_workspace_derived_metrics_incremental` |

## Map phát hiện → xử lý

| # | Phát hiện (QA 2026-07-14 · perf review 2026-07-18/19) | Mức | Xử lý |
|---|---|---|---|
| 1 | Ảnh import đường dẫn cục bộ `images/x.png` render icon vỡ **và phát GET 404** | 🔴 | `w24_fix_preview_unembedded_image_placeholder_no_network` |
| 2 | Ảnh `asset:<id>` mồ côi → sanitizer gỡ `src` → icon vỡ, không placeholder | 🔴 | `w24_fix_preview_unembedded_image_placeholder_no_network` |
| 3 | 404 ảnh cục bộ khiến Next dev compile `/_not-found` ~108s → app đơ hàng phút | 🔴 | `w24_fix_preview_unembedded_image_placeholder_no_network` |
| 4 | Ảnh chết lọt vào HTML/PDF/DOCX nếu gate bị bypass (defense-in-depth + tiền đề cho E) | 🟠 | `w24_fix_preview_unembedded_image_placeholder_no_network` |
| 5 | Import thiếu file ảnh: không có nút "gắn ảnh vào đúng ref" (placeholder + panel Soát lỗi) | 🟠 | `w24_fix_image_recovery_attach_from_placeholder_and_issues` |
| 6 | Xuất PowerPoint (tab Slide) bị chặn bởi P0 thân báo cáo (evidence/ảnh body) | 🟠 | `w24_fix_export_gate_scope_per_target_pptx` |
| 7 | Lịch sử xuất bản ở ExportPanel mất khi đổi tab; lý do lỗi không xem lại được | 🟡 | `w24_fix_export_history_persist_in_export_panel` |
| 8 | Gate P0 cứng: không xem thử được Word/PDF khi còn P0 (cần quyết "xuất nháp") | 🟡 | `w24_decide_draft_export_bypass_p0_watermark` |
| 9 | 10 user xuất PDF đồng thời có thể tạo 10 Chromium pages không cap | 🔴 | `w24_perf_pdf_renderer_capacity_recovery` |
| 10 | Chromium disconnect nhưng `/health` vẫn xanh, instance không relaunch | 🔴 | `w24_perf_pdf_renderer_capacity_recovery` |
| 11 | PDF gateway timeout trước renderer; client abort không dừng page | 🔴 | `w24_perf_pdf_gateway_backpressure_cancellation` |
| 12 | Thiếu Redis/proxy/PDF env làm production route 503 hoặc dùng chung quota | 🔴 | `w24_perf_production_config_readiness_rate_limit` |
| 13 | Worker crash làm pending Promise treo; actual worker có lỗi DOM dependency | 🔴 | `w24_perf_pipeline_worker_fail_fast_recovery` |
| 14 | Preview gửi full assets/report; cache không giới hạn; stale work vẫn được tính | 🟠 | `w24_perf_preview_incremental_bounded_cache` |
| 15 | Workspace effect-import tạo waterfall; bundle budget undercount transitive graph | 🔴 | `w24_perf_startup_waterfall_transitive_chunks` |
| 16 | Autosave ghi project + legacy full bundle | 🟠 | `w24_perf_retire_legacy_idb_dual_write` |
| 17 | Snapshot full-base64 + prune rewrite kept snapshots | 🔴 | `w24_perf_snapshot_storage_dedup_incremental_prune` |
| 18 | AI “stream” chỉ chia chuỗi sau khi provider trả xong; client cũng buffer | 🟠 | `w24_perf_ai_true_streaming_backpressure` |
| 19 | Perf/bundle gates xanh nhưng không chạy user path/worker/chunk graph thật | 🔴 | `w24_perf_truthful_browser_and_bundle_gates` |
| 20 | Stats/health quét full report trên hot edit path | 🟠 (cần profile) | `w24_perf_workspace_derived_metrics_incremental` |

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
- 🔒 **Không claim perf DONE từ unit/fake-worker/reducer-only.** Canonical evidence = production browser actual Worker + transitive resource graph + versioned fixture.
- 🔒 **Mọi queue/cache/concurrency phải hữu hạn** và có cleanup/metric; stale discard không được dùng thay cancellation/coalescing.
- 🔒 **Không đổi correctness/security để lấy tốc độ:** giữ sanitize, byte caps, `%PDF-` verify, P0 rules, offline asset parity, timing-safe token.
- 🔒 **Migration persistence phải rollback/data-loss aware:** L merge trước M; không hai contract cùng bump một DB version độc lập.
- 🔒 **Không log nội dung báo cáo, asset base64, prompt/output AI, API key/token.** Chỉ aggregate duration/bytes/count/outcome.

## Cảnh báo phạm vi (đọc trước khi Approve)
- **A không được "vá bằng cách ẩn ảnh":** ref không giải được phải thành **placeholder có ý nghĩa** (khung + tên/alt + lý do "chưa nhúng" + lối dẫn sửa), **không** xoá ảnh khỏi nội dung. Điểm cứng: **chặn request mạng** — biến ref không-nhúng thành node **không phát src ra ngoài** (đổi thành placeholder trước sanitize, hoặc chặn ở tầng resolve). Kiểm cả 3 điểm: PreviewPane, prepare-export, ImportPreviewDialog.
- **B tái dùng cơ chế asset offline sẵn có:** "Gắn ảnh" dùng `createImageAsset` (≤5MB, base64/IndexedDB) rồi **rewrite đúng ref** (đường dẫn cục bộ → `asset:<id>`; `asset:` mồ côi → id mới) trong markdown mục tương ứng — **không** upload, **không** đổi schema asset.
- **C đúng-phạm-vi, không bỏ gate:** slide/pptx chỉ gate lỗi **liên quan slide** (nếu có), **không** gate evidence/ảnh **thân báo cáo**. Cân nhắc: route pptx qua kiểm riêng thay vì `runChecker(bundle)` toàn cục. Giữ gate report cho html/pdf/docx nguyên vẹn.
- **D một nguồn, đúng race:** ExportPanel đọc `loadExportHistory` (bền) thay in-memory; đồng bộ với `recordExport` (đã `await` ở W23-E) tránh lệch; **không** đổi schema history.
- **E là Decide — chưa chạm `src/`:** chốt nhánh (giữ cứng / cho nháp watermark) + phạm vi "P0 nào vẫn chặn kể cả nháp" (vd lỗi phá vỡ file) trước khi mở contract thi công. Tôn trọng W23 lock "không nới lỏng gate" — nếu chọn nháp thì phải watermark + cảnh báo rõ, không thay thế bản nộp.
- **F/G tách trách nhiệm:** F sở hữu admission/browser/resource envelope; G sở hữu deadline/cancel/bounded forwarding/status end-to-end. Hai contract có thể chạm `server.mjs` nhưng commit theo thứ tự F→G, không phát triển song song trên cùng lifecycle code.
- **H không nới fail-closed:** mục tiêu là fail predeploy/readiness rõ, không thêm memory limiter production để né Redis.
- **I trước J:** phải diệt Promise treo/worker crash trước khi đổi protocol/cache; J có protocol fallback/version một release.
- **O là keystone đo lường:** baseline có thể đỏ trên code hiện tại; không sửa threshold để xanh. K/J/M/P dùng artifact O làm before/after.
- **L trước M:** dừng legacy write amplification trước, rồi mới normalized asset/snapshot migration; public canonical types không đổi.
- **P có exit path:** nếu profiler O chứng minh cost derived metrics dưới ngưỡng, đóng bằng evidence và không thêm cache phức tạp.

## Phát hiện đã điều tra và **loại** (dương tính giả — không viết contract)

Ghi lại để không tái điều tra:
- **"Soát lỗi 451 là bug"** → **loại.** Checker chạy đúng: seed 2 ảnh vỡ → báo đúng 2 P0 + tụt điểm 75→40. 451 là **đếm thật** trên báo cáo lớn (nhiều hình vỡ + caption thiếu + số hình lệch chương), không phải lỗi.
- **"Chèn ảnh trực tiếp không hoạt động"** → **loại.** Paste ảnh PNG vào editor → asset lưu IndexedDB, hiện trong preview, **sống sót qua reload** (assetCount:1). Pipeline chèn/paste/drop OK ([EditorPanel.tsx](src/components/EditorPanel.tsx), [use-image-insert.ts](src/modules/write/use-image-insert.ts)).
- **"Xuất bản/Nộp bài chết"** → **loại phần 'chết'.** Gate P0 hoạt động **đúng thiết kế W23-A** (dialog hiện P0, "Vẫn xuất bản" disabled). Không phải hỏng — là **chặn có chủ đích**. Phần cần cải thiện đã tách thành C (phạm vi pptx), D (history), E (decide nháp). Đủ evidence (github/demo/deploy/video) + sửa ảnh vỡ → xuất chạy.
- **"Lịch sử phiên bản 0 bản = hỏng snapshot"** → **loại.** Đúng thiết kế: snapshot chỉ tạo trước **xoá mục / tạo mới / ghi đè file / áp dụng AI** ([Workspace.tsx:461](src/components/Workspace.tsx#L461),L641,L659,L722). Nút "Lưu bản thảo" **không** tạo snapshot. Chưa làm 4 thao tác đó thì 0 bản.
- **"Slide/Trình bày không hoạt động"** → **loại.** Outline 12 slide, timeline (18ph/giới hạn 10ph), gán người nói, kịch bản, Q&A đều chạy. Chỉ nút **Xuất PPTX** dính gate (đã tách thành C).
- **Automation flakiness** → **loại (không phải lỗi app):** screenshot treo 30s, `.click()` JS không kích hoạt tab Radix (phải dispatch full pointer sequence), animation drawer đứng hình giữa chừng — đều là giới hạn browser-test; đã kiểm chứng chéo bằng DOM/IndexedDB. Không mở contract.

## Thứ tự đề xuất — Track 1 ảnh/export (đã DONE)

1. `w24_fix_preview_unembedded_image_placeholder_no_network` — **A, keystone.** Gốc của mọi triệu chứng "ảnh vỡ" + "app đơ"; sửa xong hết dội 404, preview/xuất sạch.
2. `w24_fix_image_recovery_attach_from_placeholder_and_issues` — **B.** Cho user sửa "triệt để" ngay tại chỗ sau khi A đã có placeholder làm điểm neo.
3. `w24_fix_export_gate_scope_per_target_pptx` — **C.** Gỡ chặn dây chuyền cho Slide; độc lập, nhỏ.
4. `w24_fix_export_history_persist_in_export_panel` — **D.** Một nguồn history; nhỏ, kỹ thuật.
5. `w24_decide_draft_export_bypass_p0_watermark` — **E, Decide.** Chốt chủ ý trước khi (nếu cần) mở contract thi công xuất-nháp.

### Track 2 hiệu năng/scale (đề xuất thi công)

1. `w24_perf_truthful_browser_and_bundle_gates` — **O, keystone.** Tạo baseline đỏ đáng tin; mọi tối ưu sau phải có before/after.
2. `w24_perf_pdf_renderer_capacity_recovery` — **F, blocker beta.** Cap page, relaunch browser, readiness/resource limit.
3. `w24_perf_pdf_gateway_backpressure_cancellation` — **G.** Đồng bộ deadline/cancel/status và giảm buffer amplification.
4. `w24_perf_production_config_readiness_rate_limit` — **H, blocker deploy.** Redis/proxy/PDF env validation + readiness.
5. `w24_perf_pipeline_worker_fail_fast_recovery` — **I.** Không Promise treo; actual worker sống trước khi tối ưu protocol.
6. `w24_perf_preview_incremental_bounded_cache` — **J.** Coalesce, delta assets/sections, bounded cache, giảm main-thread clone.
7. `w24_perf_startup_waterfall_transitive_chunks` — **K.** Bỏ effect waterfall, split critical graph theo gate O.
8. `w24_perf_retire_legacy_idb_dual_write` — **L.** Quick win write/quota có migration rõ.
9. `w24_perf_snapshot_storage_dedup_incremental_prune` — **M.** High-impact nhưng migration rủi ro cao; làm sau L.
10. `w24_perf_ai_true_streaming_backpressure` — **N.** Cải thiện first-token/serverless sau các blocker.
11. `w24_perf_workspace_derived_metrics_incremental` — **P.** Chỉ thi công nếu profiler O xác nhận ROI.

## Trạng thái thi công (cập nhật 2026-07-19)

| Contract | Commit | Trạng thái |
|---|---|---|
| A — Preview ảnh chưa nhúng + chặn network | [w24-fix-a] | ✅ DONE |
| B — Phục hồi/gắn lại ảnh sau import | [w24-fix-b] | ✅ DONE |
| C — Đúng-phạm-vi gate pptx/slide | [w24-fix-c] | ✅ DONE |
| D — Lịch sử xuất bản bền ở ExportPanel | [w24-fix-d] | ✅ DONE |
| E — Decide xuất bản nháp (watermark) | [w24-decide-e] | ✅ DONE (Decide) |
| F — PDF renderer capacity/recovery | docs-only | ⏳ PROPOSED |
| G — PDF gateway deadline/cancel/bounded forwarding | docs-only | ⏳ PROPOSED (sau F) |
| H — Production config readiness/rate limit | docs-only | ⏳ PROPOSED |
| I — Pipeline worker fail-fast/recovery | docs-only | ⏳ PROPOSED |
| J — Preview incremental/bounded cache | docs-only | ⏳ PROPOSED (sau I/O) |
| K — Startup waterfall/transitive chunks | docs-only | ⏳ PROPOSED (sau O) |
| L — Retire legacy IDB dual-write | docs-only | ⏳ PROPOSED |
| M — Snapshot dedup/incremental prune | docs-only | ⏳ PROPOSED (sau L) |
| N — AI true streaming | docs-only | ⏳ PROPOSED |
| O — Truthful browser/bundle gates | docs-only | ⏳ PROPOSED — keystone |
| P — Derived metrics incremental | docs-only | ⏳ PROPOSED — profile-gated |

> A–E đã DONE theo evidence 2026-07-14. F–P chỉ là **contract docs PROPOSED**: chờ Approve từng contract, docs commit trước `src/`. Gate cuối không chỉ `npm test/typecheck`; contract hiệu năng phải có artifact O/burst/migration proof tương ứng trước khi đổi sang DONE.
