# Kế hoạch kiểm thử tổng thể — ReportSupporter

> Baseline kiểm thử thủ công E2E và regression theo rủi ro cho các luồng người dùng chính của ReportSupporter. Tài liệu này không tuyên bố bao phủ tuyệt đối; phạm vi thực tế được xác định bằng ma trận chức năng, môi trường và các ngoại lệ ở cuối tài liệu.

## 1. Thông tin tài liệu

| Thuộc tính | Giá trị |
|---|---|
| Phiên bản tài liệu | 2.0 |
| Trạng thái | Sẵn sàng review/chạy thử |
| Cập nhật gần nhất | 2026-07-22 |
| Phạm vi ứng dụng | ReportSupporter `0.1.0` |
| Loại kiểm thử | Manual E2E, exploratory có hướng dẫn, regression; liên kết một phần với Playwright/Vitest |
| Build/commit cần ghi khi chạy | `<git commit SHA>` |
| Người lập / người chạy | `<tên>` / `<tên>` |
| Run ID | `RS-E2E-<YYYYMMDD>-<nn>` |

### 1.1 Mục tiêu

- Xác nhận người dùng có thể đi trọn luồng: tạo dự án → soạn → định dạng → soát lỗi → thêm minh chứng → xuất bản → đóng gói → thuyết trình.
- Xác nhận dữ liệu cục bộ, offline/PWA, recovery, bảo mật, accessibility và hiệu năng ở mức release gate.
- Tạo kết quả có thể tái hiện: cùng build, fixture và môi trường phải cho cùng kết luận Pass/Fail.

### 1.2 Ngoài phạm vi mặc định

- Chất lượng nội dung do mô hình AI sinh ra ngoài các tiêu chí cấu trúc, an toàn và khả năng xử lý lỗi.
- Độ chính xác OCR tuyệt đối cho mọi loại tài liệu; chỉ kiểm trên fixture đã đóng băng.
- Trình duyệt/OS không có trong ma trận môi trường đã được phê duyệt.
- Hiệu năng mạng Internet hoặc uptime của nhà cung cấp AI bên thứ ba.

## 2. Thuật ngữ và quy tắc đánh giá

### 2.1 Độ ưu tiên ca test

| Mức | Ý nghĩa | Release gate |
|---|---|---|
| TP0 | Luồng sống còn, privacy, mất dữ liệu, security hoặc blocker | Phải chạy và Pass 100% |
| TP1 | Chức năng chính và compatibility quan trọng | Pass tối thiểu 95%; mọi Fail phải có quyết định rủi ro |
| TP2 | Biên, stress, tính tiện dụng hoặc cấu hình ít gặp | Có thể hoãn nếu có lý do và người chấp thuận |

`TP0/TP1/TP2` chỉ là độ ưu tiên **ca test**, không phải severity của lỗi trong ứng dụng.

### 2.2 Mức rule và mức bug

- Rule trong ứng dụng: `error`, `warning`, `info`.
- Bug phát hiện khi chạy test:
  - `S0`: mất dữ liệu nghiêm trọng, lộ bí mật/nội dung, thực thi mã độc.
  - `S1`: blocker của luồng TP0, không có workaround hợp lý.
  - `S2`: lỗi chức năng có workaround hoặc sai lệch đáng kể.
  - `S3`: giao diện/nội dung nhỏ, không cản luồng.

### 2.3 Trạng thái ca test

`Pass` · `Fail` · `Blocked` · `Not run` · `N/A` · `Retest pass` · `Retest fail`.

Một ca chỉ được ghi `Pass` khi mọi expected result và invariant liên quan đều đạt. Không dùng `Pass` nếu chưa thu được bằng chứng bắt buộc.

## 3. Hành vi nghiệp vụ đã khóa tại baseline này

Các hành vi dưới đây là oracle cho kịch bản hiện tại. Khi sản phẩm thay đổi, cập nhật cả code, automated test và tài liệu trong cùng thay đổi.

1. AI mặc định tắt. Khi tắt hoặc chưa đủ provider/API key/adapter, không phát request AI.
2. API key AI chỉ tồn tại trong bộ nhớ phiên; không được lưu trong `localStorage`, IndexedDB, log, export hoặc snapshot.
3. Khi người dùng chủ động chạy AI đã cấu hình, trình duyệt chỉ gọi first-party `/api/ai`; proxy mới gọi provider.
4. HTML/PDF/DOCX bị chặn khi checker có rule `severity=error`. Warning có thể được người dùng xác nhận để tiếp tục.
5. PPTX không bị chặn bởi lỗi `error` trong thân báo cáo; PPTX chỉ yêu cầu đã có nội dung slide.
6. Checklist Nộp bài hiển thị readiness, lỗi nghiêm trọng, minh chứng bắt buộc, layout DOCX và lịch sử export. Cổng chặn tải ZIP dùng preflight `error`.
7. Không có artifact trong **phiên hiện tại** chỉ tạo cảnh báo: người dùng vẫn có thể tải `evidence.zip`, nhưng ZIP không được chứa file report HTML/PDF/DOCX/PPTX.
8. Lịch sử export được lưu bền; Blob artifact chỉ tồn tại trong phiên hiện tại.
9. Dữ liệu dự án được lưu bền vững cục bộ. Hai ngoại lệ xử lý nội dung có chủ đích là `/api/ai` và `/api/pdf` khi người dùng kích hoạt đúng tính năng.

## 4. Môi trường và cấu hình chạy

### 4.1 Ma trận bắt buộc

Ghi phiên bản chính xác vào kết quả; không ghi chung chung “mới nhất”.

| Mã | Môi trường | Phạm vi |
|---|---|---|
| ENV-D1 | Windows 11 + Chrome stable, desktop 1440×900 | Full regression |
| ENV-D2 | Windows 11 + Edge stable, desktop 1440×900 | TP0 + compatibility TP1 |
| ENV-R1 | Chrome responsive 320×568, 375×667, 768×1024 | Layout/responsive; không thay thế thiết bị thật |
| ENV-M1 | Android Chrome trên thiết bị thật, portrait + landscape | Touch, drawer, PWA, offline TP0/TP1 |
| ENV-I1 | iOS Safari/PWA | Chỉ chạy nếu iOS nằm trong danh sách trình duyệt được hỗ trợ |

### 4.2 Chuẩn bị build

1. Ghi commit SHA, Node/npm version, OS và browser version.
2. Cài dependency từ lockfile: `npm ci`.
3. Chạy các gate: `npm run check:encoding`, `npm run lint`, `npm run typecheck`, `npm test`.
4. Build production: `npm run build`, sau đó `npm start` và mở `http://localhost:3000`.
5. Không dùng dev server để kết luận hiệu năng hoặc bundle.
6. Với PDF, bật `services/pdf-renderer` hoặc `docker-compose.pdf.yml`; kiểm `/api/ready` trước khi chạy nhóm H.
7. PWA/Service Worker chỉ kiểm trên HTTPS hoặc `localhost`.
8. Tạo một profile browser sạch cho full regression; không dùng dữ liệu cá nhân thật hoặc API key sản xuất.

### 4.3 Cô lập và cleanup

- Trừ khi ca nói khác, mỗi nhóm bắt đầu từ IndexedDB/localStorage/cache sạch.
- Dùng project ID riêng cho từng ca; không tái sử dụng project đã Fail nếu chưa ghi rõ.
- Trước ca kiểm persistence/offline, không xóa storage giữa các bước.
- Sau ca AI, xóa key khỏi bộ nhớ bằng đóng tab/profile và xác minh storage không chứa key.
- Không sửa record IndexedDB thủ công tùy hứng; dùng fixture hoặc script corruption có version.

## 5. Dữ liệu kiểm thử và oracle

### 5.1 Fixture có sẵn

| Mã fixture | File | Mục đích |
|---|---|---|
| FX-DOCX-01 | `src/modules/import/__fixtures__/vn_mon_hoc_report.docx` | DOCX tiếng Việt cơ bản |
| FX-DOCX-02 | `src/modules/import/__fixtures__/vn_anh_nhung_report.docx` | DOCX có ảnh nhúng |
| FX-DOCX-03 | `src/modules/import/__fixtures__/vn_track_changes_report.docx` | DOCX có track changes |
| FX-PDF-01 | `src/modules/import/__fixtures__/report-word.pdf` | PDF sinh từ Word |
| FX-PDF-02 | `src/modules/import/__fixtures__/paper-latex.pdf` | PDF sinh từ LaTeX |
| FX-PDF-03 | `src/modules/import/__fixtures__/scan-vn.pdf` | PDF scan/OCR tiếng Việt |
| FX-XLSX-01 | `src/modules/import/__fixtures__/bang_diem_merges.xlsx` | Bảng tính có merged cells |
| FX-XLSX-02 | `src/modules/import/__fixtures__/sheet_an.xlsx` | Workbook có sheet ẩn |
| FX-PPTX-01 | `src/modules/import/__fixtures__/defense-ppt.pptx` | PowerPoint desktop |
| FX-PPTX-02 | `src/modules/import/__fixtures__/defense-gslides.pptx` | PowerPoint từ Google Slides |
| FX-PERF-S | `e2e/fixtures/performance-project.ts` — `small` | 4 sections |
| FX-PERF-L | `e2e/fixtures/performance-project.ts` — `large` | 40 sections, khoảng 5 MiB asset, 10 snapshots |

### 5.2 Fixture bắt buộc phải đóng băng trước khi chạy

Các file dưới đây phải được tạo trong `Design/QA/fixtures/`, kèm SHA-256 và file manifest ghi expected count/hash. Nếu chưa có thì ca tương ứng là `Blocked`, không tự chọn file khác.

| Mã | Tên đề xuất | Nội dung/oracle tối thiểu |
|---|---|---|
| FX-MD-01 | `basic-vietnamese.md` | 3 heading, 2 paragraph, 1 table, 1 code block, Unicode tiếng Việt |
| FX-MD-02 | `missing-image.md` | Chính xác 1 ref `images/x.png`, không kèm ảnh |
| FX-MD-03 | `embedded-image.md` | Chính xác 1 ảnh data URL hợp lệ |
| FX-MD-04 | `xss-payloads.md` | `<script>`, `img onerror`, SVG event, `javascript:` URL |
| FX-IMG-01 | `image-5m-minus-1.png` | `5×1024×1024−1` byte, ảnh hợp lệ |
| FX-IMG-02 | `image-exactly-5m.png` | Chính xác `5×1024×1024` byte, ảnh hợp lệ |
| FX-IMG-03 | `image-5m-plus-1.png` | `5×1024×1024+1` byte |
| FX-IMP-01 | `empty.md` | 0 byte |
| FX-IMP-02 | `corrupt.docx` | Container DOCX hỏng có chủ đích |
| FX-IMP-03 | `mime-spoof.pdf` | Extension PDF nhưng nội dung không phải PDF |
| FX-IMP-04 | `markdown-50m-plus-1.md` | `50×1024×1024+1` byte |
| FX-IMP-05 | `markdown-exactly-50m.md` | Chính xác `50×1024×1024` byte; nội dung Markdown hợp lệ |
| FX-MAP-01 | `duplicate-basename/` | Một Markdown ref và 2 ảnh cùng basename nhưng nội dung/hash khác nhau |
| FX-CHK-01 | `checker-golden.json` | Bundle + expected issue ID/severity/section/count/readiness trước và sau từng sửa |
| FX-PAGE-01 | `pagination-golden.json` | Báo cáo nhiều trang có heading cuối trang, bảng dài và ảnh lớn; có page/layout oracle |
| FX-STRESS-01 | `checker-300-sections.json` | 300 sections và expected issue manifest cố định |
| FX-REC-01 | `indexeddb-v1.json` | DB schema v1 với số record/hash đã biết |
| FX-REC-02 | `indexeddb-v2.json` | DB schema v2 với số record/hash đã biết |
| FX-REC-03 | `indexeddb-v3.json` | DB schema v3 với số record/hash đã biết |
| FX-REC-04 | `invalid-draft.json` | Draft lệch quan hệ project/section có chủ đích |

### 5.3 Ma trận tham số chuẩn

#### Template

| Tham số | Tên | Oracle chính |
|---|---|---|
| `software-project` | Báo cáo đồ án phần mềm | 7 section gốc; có Minh chứng |
| `lab-report` | Báo cáo thực hành | 7 section gốc |
| `internship-report` | Báo cáo thực tập | 7 section gốc |
| `readme-report` | Báo cáo từ Markdown | Section sinh từ Markdown đầu vào; không có section tĩnh |

#### Evidence kind

Chạy riêng từng instance: `video`, `github`, `deploy`, `drive`, `figma`, `account`, `api-docs`, `slide`, `other`.

#### Command Palette

Chạy riêng từng command ID: `create-section`, `duplicate-section`, `move-section-up`, `move-section-down`, `save-draft`, `import-markdown`, `create-report`, `run-check`, `open-preview`, `toggle-focus-mode`, `open-export`, `open-ai-settings`.

## 6. Invariant và bằng chứng bắt buộc

Áp dụng cho mọi ca, trừ khi expected result chủ động tạo lỗi mạng/console.

1. Không có `pageerror`, unhandled rejection hoặc console `error` ngoài allowlist đã phê duyệt.
2. Không có request thất bại bất ngờ; ref ảnh không giải được phải tạo **0 request** tới đường dẫn ảnh.
3. Không gửi nội dung báo cáo tới origin ngoài allowlist:
   - static assets và API cùng origin;
   - `/api/ai` chỉ sau hành động AI đã cấu hình;
   - `/api/pdf` chỉ sau hành động Xuất PDF.
4. Không có API key trong localStorage, IndexedDB, URL, console, file export, ZIP, snapshot, screenshot hoặc trace.
5. Mọi Fail phải có actual result, bước tái hiện, screenshot/trace phù hợp và bug ID.
6. Với ca download, phải lưu artifact, kích thước, MIME, SHA-256 và kết quả mở/parse; không kết luận chỉ dựa vào toast.

## 7. Entry criteria và exit criteria

### 7.1 Entry criteria

- Các gate ở mục 4.2 Pass hoặc có waiver được ghi rõ.
- Production build khởi động được; `/api/ready` phản ánh đúng trạng thái PDF renderer.
- Fixture bắt buộc tồn tại, SHA-256 khớp manifest.
- Không có blocker môi trường; tester có quyền mở DevTools, tải file và cài PWA.
- Có sẵn tài khoản/key AI test với quota giới hạn nếu chạy AI live; không dùng key cá nhân/sản xuất.

### 7.2 Exit criteria

- TP0: 100% Pass trên ENV-D1; TP0 compatibility Pass trên ENV-D2/ENV-M1 theo ma trận.
- TP1: tối thiểu 95% Pass; mọi Fail còn lại có owner, severity, workaround và quyết định release.
- Không còn bug S0/S1 mở.
- Không có privacy violation, unexpected external request, data loss hoặc artifact hỏng.
- Performance/bundle gate automated Pass trên production build.
- Test summary, artifact, trace và danh sách N/A/Blocked đã được lưu theo Run ID.

## 8. Kịch bản kiểm thử

Quy ước cột `Dữ liệu/tiền điều kiện`: nếu ghi `[mỗi tham số]`, mỗi hàng trong ma trận tương ứng là một test instance độc lập, ví dụ `B03[software-project]`.

### A — Thư viện và vòng đời dự án

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| A01 | TP0 | Storage sạch | Mở `/` | Empty Hub hiển thị; không crash; 0 project |
| A02 | TP0 | Storage sạch | Tạo dự án mới | Sinh project ID duy nhất; điều hướng `/workspace/<id>`; editor sẵn sàng |
| A03 | TP1 | 4 dự án: `Bao cao mon hoc`, `Báo cáo đồ án`, `Đồ Án Web`, `Khác` | Tìm `do an`, `đồ án`, chữ hoa/thường và khoảng trắng đầu/cuối | Mỗi query trả đúng tập project theo normalize bỏ dấu/case/trim |
| A04 | TP1 | 3 dự án có access time khác nhau | Mở lần lượt P1 → P2 → P1 rồi về Library | Recent xếp P1 đầu, P2 sau; không dùng created time thay access time |
| A05 | TP1 | 1 dự án có 2 section và 1 asset | Duplicate rồi sửa title/section của bản sao | ID mới; nội dung/asset ban đầu tương đương; sửa bản sao không đổi bản gốc |
| A06 | TP1 | 1 dự án thường | Xóa, mở Trash | Dự án biến mất khỏi danh sách chính, xuất hiện trong Trash; chưa purge |
| A07 | TP1 | Dự án trong Trash | Restore | Dự án trở lại nguyên title/section/asset; mở được |
| A08 | TP1 | 4 dự án đã lưu | Reload và đóng/mở browser profile | Số project, title và thứ tự Recent giữ nguyên |
| A09 | TP2 | Nạp FX-REC-04 bằng script | Mở project lỗi | Recovery Center hiển thị đúng item; chọn khôi phục/loại bỏ không làm sập Library |
| A10 | TP1 | Project ID không tồn tại | Mở trực tiếp `/workspace/not-found-id` | Hiển thị trạng thái không tìm thấy và đường quay về Library; không tạo project rác |
| A11 | TP1 | Có Library và một workspace | Dùng Back/Forward/reload qua hai route | Route và dữ liệu đúng; không nhân đôi project hoặc mất thay đổi đã lưu |

### B — Khởi tạo, metadata và AI

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| B01 | TP0 | Storage sạch | Mở Template Catalog | Hiện đúng 4 template trong ma trận; preview và tên khớp |
| B02 | TP1 | `[mỗi template]` | Bỏ trống từng field bắt buộc rồi submit | Field lỗi có label/message; không tạo project khi dữ liệu bắt buộc thiếu |
| B03 | TP0 | `[mỗi template]`, metadata hợp lệ cố định | Tạo project | Section count/title/required rule khớp oracle của template; metadata điền đúng vị trí |
| B04 | TP1 | Metadata có tiếng Việt, các ký tự ampersand/dấu bé hơn/dấu lớn hơn/nháy đơn/nháy kép và tên dài 255 ký tự | Tạo, lưu, reload, preview/export HTML | Ký tự được lưu/render an toàn, không lỗi encoding/XSS; không cắt âm thầm |
| B05 | TP2 | Không chọn template | Tạo báo cáo trống | Workspace có đúng 1 mục rỗng, editor focus được |
| B06 | TP0 | AI mặc định tắt; Network log sạch | Chạy một hành động AI | Không có request `/api/ai`; UI thông báo AI tắt/hướng dẫn cấu hình; nội dung không đổi |
| B07 | TP0 | AI bật nhưng thiếu provider hoặc API key | Chạy AI | Không có request `/api/ai`; UI báo chưa cấu hình; không crash |
| B08 | TP0 | Key test giả `qa-secret-marker` | Lưu AI Settings, kiểm localStorage/IndexedDB, reload cứng/mở tab mới | Provider/flag có thể persist; marker key không tồn tại trong storage; phiên mới yêu cầu nhập lại key |
| B09 | TP1 | AI test hợp lệ, response fixture cố định | Chạy Dàn ý AI | Chỉ có request same-origin `/api/ai`; hiển thị suggestion/diff; chưa áp dụng thì nội dung gốc không đổi |
| B10 | TP1 | AI response fixture cố định | Accept rồi Undo/Reject suggestion | Accept tạo đúng thay đổi và snapshot; Reject không đổi; Undo khôi phục đúng revision |
| B11 | TP1 | Mock lần lượt 401/429/502/504 | Chạy AI cho từng status | Thông báo phân biệt cấu hình/quá tải/provider/timeout; không mất nội dung; retry chỉ xuất hiện khi hợp lý |
| B12 | TP1 | AI request đang chạy | Hủy request/đóng panel | Request bị abort; UI kết thúc loading; không áp suggestion một phần |
| B13 | TP1 | Tạo suggestion rồi sửa section trước khi Accept | Accept suggestion cũ | Suggestion stale không ghi đè revision mới; yêu cầu tạo lại/resolve conflict |

### C — Soạn thảo và asset

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| C01 | TP0 | FX-PERF-S | Gõ marker vào editor | Preview chứa đúng marker; production automated gate input→preview `<1500 ms`; 0 worker/page error |
| C02 | TP0 | Project có marker chưa lưu | Ctrl+S rồi reload | Trạng thái chuyển saving→saved; marker còn nguyên |
| C03 | TP0 | Project có marker mới | Không Ctrl+S, chờ >2 giây rồi reload | Autosave hoàn tất và marker còn nguyên |
| C04 | TP0 | Thay đổi đang chờ autosave | Chuyển tab/ẩn document hoặc đóng tab rồi mở lại | Pending save được flush; thay đổi cuối cùng còn nguyên |
| C05 | TP1 | 1 section đang chọn | Ctrl+Shift+N | Thêm đúng 1 section, ID duy nhất, nav/editor đồng bộ |
| C06 | TP1 | Section có title/Markdown riêng | Ctrl+Shift+D | Thêm đúng 1 bản sao độc lập; sửa bản sao không đổi gốc |
| C07 | TP1 | 3 section A/B/C, chọn B | Alt+Up rồi Alt+Down | Mỗi lần chỉ đổi một vị trí hợp lệ; nav, preview, numbering đồng bộ; biên đầu/cuối không lỗi |
| C08 | TP1 | 3 section A/B/C | Kéo C lên đầu | Thứ tự C/A/B ở nav, preview và persisted state; reload giữ nguyên |
| C09 | TP1 | FX-MD-01 phần table | Chèn bảng GFM | Đúng số hàng/cột/text; không tràn container; caption/label theo cú pháp hỗ trợ |
| C10 | TP1 | Code block `js` và code block không language | Chèn/xem preview | Block `js` highlight; block thiếu language vẫn render và tạo rule warning tương ứng |
| C11 | TP1 | Inline `$x^2$` và block `$$...$$` | Chèn/xem preview | Hai công thức render; source không mất khi save/reload |
| C12 | TP1 | Mermaid hợp lệ và Mermaid sai syntax | Chèn/xem preview | Hợp lệ thành SVG; sai syntax hiện lỗi/placeholder an toàn, không crash phần preview còn lại |
| C13 | TP0 | Lần lượt FX-IMG-01, FX-IMG-02 | Paste/chèn ảnh | Cả hai được chấp nhận, tạo asset/ref và hiển thị; reload còn ảnh |
| C14 | TP0 | FX-IMG-03 | Paste/chèn ảnh | Bị chặn với giới hạn 5 MiB; không tạo asset/ref rác; project vẫn sửa được |
| C15 | TP1 | File ảnh hợp lệ có basename khớp ref | Dùng chọn file “Gắn ảnh” | Ref được rewrite/resolve đúng asset; không phát request tới ref cũ |
| C16 | TP1 | Thực hiện add/duplicate/reorder/delete section | Undo từng thao tác | Mỗi Undo khôi phục đúng state trước đó, không ảnh hưởng section/asset khác |
| C17 | TP1 | Workspace thường | Ctrl+Shift+F hai lần | Lần 1 ẩn chrome phụ; lần 2 phục hồi layout và selection/scroll hợp lý |
| C18 | TP2 | Chuỗi tiếng Việt NFC/NFD, emoji, ký tự đặc biệt | Gõ, save, reload, export | Nội dung tương đương Unicode đầu vào, không mojibake hoặc mất ký tự |

### D — Format và Preview

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| D01 | TP0 | Project dùng preset mặc định | Mở Preview và đo computed style | Trang rộng 210 mm, cao tối thiểu 297 mm; lề trên/dưới 25 mm, trái 30 mm, phải 20 mm; Times New Roman 13 pt; line-height 1.5; body justify |
| D02 | TP0 | H1/H2/H3 cố định | Xem preview | Đánh số `1.`, `1.1.`, `1.1.1.` đúng; không nhảy/trùng số |
| D03 | TP0 | 3 heading có thứ tự cố định | Kiểm TOC | Đủ 3 entry, đúng text/thứ tự/link/page theo fixture; dot leader không chồng chữ |
| D04 | TP0 | 2 hình có caption/label | Kiểm LoF | Đúng 2 entry và số hình; link trỏ đúng hình |
| D05 | TP0 | 2 bảng có caption/label | Kiểm LoT | Đúng 2 entry và số bảng; link trỏ đúng bảng |
| D06 | TP1 | `[Auto, 50, 75, 100, 125, Actual]` | Chọn từng zoom | Giá trị UI và transform/size tương ứng; không làm mất scroll/focus |
| D07 | TP1 | Preview sáng | Bật nền xem tối rồi reload | Chỉ vùng xem đổi nền như thiết kế; trang/nội dung đủ contrast; preference persist nếu spec yêu cầu |
| D08 | TP1 | Project có TOC/LoF/LoT | Reorder một section | Numbering và cả ba danh mục cập nhật, không còn entry stale |
| D09 | TP1 | FX-PAGE-01 | Preview và Print Preview | Page count, break position và overflow khớp manifest; không mất/tràn nội dung; heading/bảng/ảnh xử lý theo print spec |
| D10 | TP2 | Split view editor/preview | Scroll editor rồi preview và ngược lại | Scroll đồng bộ theo tỷ lệ; không rung/lặp vô hạn; người dùng vẫn cuộn chủ động được |

### E — Soát lỗi và Readiness

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| E01 | TP0 | FX-CHK-01 | Chạy Soát lỗi | Danh sách và readiness khớp chính xác manifest; group/count không trùng |
| E02 | TP0 | Cùng bundle không đổi | Chạy checker 3 lần | Readiness và issue list giống hệt cả 3 lần |
| E03 | TP1 | Template có section bắt buộc | Xóa một section bắt buộc, chạy check | Có đúng rule thiếu section với `severity=error` và guidance |
| E04 | TP1 | H1 → H3 | Chạy check | Có đúng warning heading jump tại section chứa H3 |
| E05 | TP1 | Code fence không language | Chạy check | Có đúng warning thiếu language, vị trí đúng |
| E06 | TP1 | Một ảnh và một bảng thiếu caption | Chạy check | Có 2 issue đúng loại/section; không gộp sai |
| E07 | TP1 | `TODO` và `lorem ipsum` ở hai section | Chạy check | Có issue cho từng vị trí theo rule; không false positive ở code block nếu spec loại trừ |
| E08 | TP1 | Panel có nhiều issue | Bấm từng issue | Chọn đúng section và đặt editor gần đúng vị trí; focus visible |
| E09 | TP1 | FX-CHK-01 | Sửa lần lượt error rồi warning theo manifest, chạy lại | Issue đã sửa biến mất; issue khác còn; readiness sau mỗi bước bằng đúng giá trị trong manifest |
| E10 | TP1 | Bundle sạch theo checker | Chạy check | Không còn `error`; badge xanh; điểm đạt threshold submission `>=80` |
| E11 | TP2 | FX-STRESS-01 | Chạy checker và đồng thời gõ marker | Checker hoàn tất `<10 s`; marker phản hồi `<1 s`; count khớp manifest; 0 pageerror |

### F — Import

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| F01 | TP0 | FX-MD-01 | Import, xem diff, chọn Append | Diff đúng; thêm đúng section/content theo manifest; nội dung cũ còn nguyên |
| F02 | TP0 | FX-DOCX-01 | Import và xác nhận | Heading/paragraph Unicode khớp manifest; warning non-blocking hiển thị đúng |
| F03 | TP0 | FX-PDF-01 | Import và xác nhận | Text/page count khớp manifest; heading đoán có warning `heading-guessed` |
| F04 | TP1 | FX-XLSX-01 rồi FX-XLSX-02 | Import riêng từng file | Sheet/table/merged/hidden-sheet theo oracle fixture; không trộn hai run |
| F05 | TP1 | FX-PPTX-01 rồi FX-PPTX-02 | Import riêng từng file | Slide order/title/body/notes theo oracle fixture |
| F06 | TP1 | Bất kỳ draft import hợp lệ | Chọn Cancel ở diff | Project hash trước/sau giống nhau; không thêm asset/snapshot rác |
| F07 | TP1 | Project có nội dung + FX-MD-01 | Chọn Replace | Chỉ phạm vi được mô tả trong dialog bị thay; undo/snapshot có thể phục hồi |
| F08 | TP0 | FX-MD-02, Network log sạch | Import và mở preview/check/export preview | Đúng 1 placeholder; 0 request chứa `images/x.png`; không có 404/pageerror |
| F09 | TP1 | FX-MD-03 | Import | 1 asset được ingest, preview hiển thị; save/reload còn ảnh |
| F10 | TP1 | FX-MAP-01 | Import/chọn mapping | UI buộc chọn rõ file hoặc dùng quy tắc xác định; asset hash sau import khớp lựa chọn, không gắn nhầm âm thầm |
| F11 | TP1 | FX-IMG-03 nhúng/kèm import | Import | Ảnh bị skip/placeholder với warning; phần text vẫn import; không vượt storage |
| F12 | TP1 | FX-IMP-05 và FX-IMP-04 | Import riêng | File đúng giới hạn không bị rule size chặn; `+1 byte` bị `file-too-large`; không treo UI |
| F13 | TP1 | FX-IMP-01, FX-IMP-02, FX-IMP-03 | Import riêng từng file | Báo lỗi cụ thể/thân thiện; project hash không đổi; dialog đóng/Retry hoạt động |
| F14 | TP2 | FX-PDF-03, OCR mặc định tắt | Import | Không tự chạy OCR; scan được đánh dấu/cung cấp lựa chọn OCR |
| F15 | TP2 | FX-PDF-03, bật OCR | Chạy OCR | Có tiến trình; text output và số trang đạt manifest/tolerance đã ghi; OCR chạy local |
| F16 | TP2 | OCR/import đang chạy | Bấm Cancel | Worker/request dừng; UI hết loading; không áp draft nửa chừng |
| F17 | TP2 | App đã cache OCR assets rồi offline | Chạy OCR | Hoạt động offline hoặc báo thiếu cache có hướng dẫn; không gọi CDN ngoài allowlist |

### G — Evidence Kit

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| G01 | TP0 | `[mỗi evidence kind]`, URL/metadata hợp lệ cố định | Tạo một evidence | Đúng kind/label/icon/form; lưu đúng một record; reload còn nguyên |
| G02 | TP1 | URL rỗng, text thường, `javascript:`, `data:`, URL sai host theo từng kind | Submit riêng từng input | Input không hợp lệ bị chặn; không lưu record; message gắn đúng field |
| G03 | TP1 | Evidence URL HTTPS hợp lệ | Bật QR và quét bằng thiết bị/decoder | QR giải mã đúng chính xác URL; không tự phát network request tới URL |
| G04 | TP0 | 3 evidence, 2 bật QR | Mở appendix | Đủ 3 dòng đúng thứ tự; đúng 2 QR; không lộ field bí mật ngoài spec |
| G05 | TP1 | 2 section và 2 evidence | Gắn mỗi evidence vào section khác nhau | Quan hệ đúng; appendix/QA prompt phản ánh đúng mapping |
| G06 | TP1 | Evidence đã gắn và bật QR | Sửa title/URL | Danh sách, QR, appendix và mapping cập nhật; không còn URL cũ |
| G07 | TP1 | Evidence đã gắn | Xóa và xác nhận | Record, QR, appendix và liên kết biến mất; section/report khác không đổi |
| G08 | TP2 | Offline | Tạo/sửa evidence và QR | CRUD/QR local hoạt động; mở URL ngoài chỉ thất bại theo browser, không làm mất record |

### H — Export HTML/PDF/DOCX

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| H01 | TP0 | Bundle sạch checker | Ctrl+Shift+E | Export panel mở, hiện HTML/PDF/DOCX; focus vào panel đúng |
| H02 | TP0 | Bundle sạch có KaTeX/Mermaid/ảnh | Xuất HTML | File `.html` verified; mở offline đủ nội dung; font/ảnh inline, Mermaid SVG tĩnh; CSP không cho script/CDN |
| H03 | TP0 | Bundle sạch có heading/table/ảnh | Xuất DOCX | ZIP container DOCX hợp lệ; Word mở không repair; heading/table/image/layout theo manifest; artifact verified |
| H04 | TP1 | PDF renderer ready | Xuất PDF | MIME PDF, header `%PDF-`, page/text/image theo manifest; artifact verified; renderer không lưu/log nội dung |
| H05 | TP0 | `[html,pdf,docx]`; bundle có đúng 1 checker `error` | Mở preflight và thử tiếp tục | Target bị chặn; nút bypass disabled; không download, không gọi renderer, không tạo job done |
| H06 | TP1 | `[html,pdf,docx]`; bundle chỉ có warning | Chọn “Vẫn xuất bản” | Chỉ target đã chọn được xuất; warning còn ghi nhận; artifact hợp lệ |
| H07 | TP1 | Bundle bất kỳ | Print Preview local | Browser print mở; không tạo artifact/job/history |
| H08 | TP1 | Xuất thành công HTML rồi DOCX | Xem history, reload | Hai job `done` đúng target/time/file/SHA/verified; history còn sau reload |
| H09 | TP1 | Tạo lỗi recoverable PDF 503/504 rồi khôi phục renderer | Retry đúng job | Job cũ chuyển running→done hoặc được cập nhật theo spec; chỉ tải đúng một artifact thành công |
| H10 | TP2 | 1 evidence bật QR; `[html,pdf,docx]` | Xuất từng target | Mỗi artifact có QR giải mã đúng URL |
| H11 | TP1 | Title Unicode và các ký tự tên file bị cấm trên Windows | Xuất từng target | Tên file được slug/sanitize, đúng extension, không rỗng/path traversal |
| H12 | TP1 | Export đang running | Double-click nút export | UI ngăn duplicate ngoài ý muốn hoặc hiển thị rõ hai job theo spec; không corrupt download/history |
| H13 | TP1 | Mock PDF lần lượt 429/503/504 | Xuất PDF | Message phân biệt bận/không khả dụng/timeout, có Retry-After khi có; gợi ý Print Preview; không tạo artifact giả |
| H14 | TP1 | Artifact của H02–H04 | Tự tính SHA-256 và parse MIME/container | SHA khớp metadata; byteLength >0; `verified=true` chỉ khi kiểm tra thật sự Pass |

### I — Nộp bài

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| I01 | TP0 | Chưa chạy checker | Mở Nộp bài | Nhắc chạy Soát lỗi; không giả định báo cáo sạch |
| I02 | TP1 | Checker score 79 rồi 80, không error | Mở checklist từng lần | 79 Fail readiness; 80 Pass readiness; threshold hiển thị rõ |
| I03 | TP1 | History có export done từ phiên trước, không có Blob phiên hiện tại | Đi tới bước Đóng gói | Checklist lịch sử Pass mục exported; có cảnh báo ZIP không kèm report |
| I04 | TP0 | Không Blob phiên hiện tại, không preflight error | Tải ZIP | Cho tải `<project-slug>-evidence.zip`; ZIP có README/manifest/appendix theo spec và **không** có report artifact |
| I05 | TP0 | Có HTML/DOCX Blob verified trong phiên, không error | Tải ZIP | ZIP chứa đúng hai artifact + README/manifest/appendix; hash/file list khớp manifest |
| I06 | TP0 | Có checker `error` | Đi tiếp/tải ZIP | Dialog liệt kê error; “Vẫn tải xuống” disabled; không tạo download |
| I07 | TP1 | Chỉ có warning | Xác nhận tải ZIP | Cho tải; ZIP hợp lệ; warning không biến thành error |
| I08 | TP1 | ZIP từ I05 | Giải nén và kiểm từng entry | Không path traversal/trùng tên; CRC/container hợp lệ; manifest hash khớp artifact |
| I09 | TP1 | Tạo export, reload app | Mở Nộp bài | History còn, nhưng Blob phiên trước không được giả là còn; cảnh báo xuất lại chính xác |
| I10 | TP2 | Project title Unicode/ký tự cấm | Tải ZIP | Tên ZIP an toàn, đúng suffix; entry name hợp lệ trên Windows |

### J — Thuyết trình

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| J01 | TP0 | Project có 5 section | Mở tab Present | Panel mở, không tự sửa report |
| J02 | TP0 | 5 section có heading/bullet cố định | Sinh outline | Số/thứ tự/title/bullet slide khớp manifest quy tắc |
| J03 | TP1 | 2 speaker, 6 slide, tổng thời lượng cố định | Phân công/timeline | Mọi slide có owner hợp lệ; tổng duration khớp; không trùng/mất slide |
| J04 | TP1 | Outline cố định | Sinh/xem script | Mỗi slide có script đúng liên kết; sửa/lưu/reload không mất |
| J05 | TP1 | Report fixture cố định | Sinh Q&A | Có danh sách không rỗng, liên kết section hợp lệ, không render HTML độc |
| J06 | TP1 | Q&A fixture | Chạy Mock Defense | Điều hướng câu hỏi/đáp án/kết thúc phiên đúng; không mất dữ liệu Present |
| J07 | TP1 | Một section rỗng, một section ngắn, một section đủ | Chạy weak-sections | Chỉ ra đúng section theo rule/threshold hiện hành |
| J08 | TP0 | Slide + speaker + script | Xuất PPTX | Container PPTX hợp lệ; PowerPoint mở không repair; slide order/text/notes đúng; artifact verified |
| J09 | TP1 | Không có slide | Xuất PPTX | Báo chưa có nội dung slide; không download/job done |
| J10 | TP1 | Report có checker `error`, slide hợp lệ | Xuất PPTX | Vẫn xuất thành công; lỗi thân báo cáo không chặn PPTX |

### K — Command Palette, phím tắt và editor shortcut

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| K01 | TP0 | Focus ngoài input/editor | Ctrl+K | Palette mở; focus vào search; Escape đóng và trả focus |
| K02 | TP1 | Palette mở | Tìm `soat loi`, `SOÁT LỖI`, `xem truoc`, `nop bai` | Kết quả normalize bỏ dấu/case đúng, không hiện command ngoài match |
| K03 | TP1 | `[mỗi Command Palette ID]`, state riêng | Chạy bằng chuột/Enter | Đúng một handler chạy; state/navigation đúng; palette đóng hợp lý |
| K04 | TP0 | `[Ctrl+S, Ctrl+Shift+N, Ctrl+Shift+D, Alt+Up, Alt+Down, Ctrl+Enter, Ctrl+P, Ctrl+Shift+F, Ctrl+Shift+E]` | Chạy riêng từng tổ hợp ở workspace | Đúng một hành vi theo command; ngăn default browser khi cần; không lặp do key repeat |
| K05 | TP1 | Focus trong CodeMirror, có selection | Ctrl+K | Chèn/toggle Markdown link theo editor keymap; không mở Palette |
| K06 | TP1 | Focus ngoài CodeMirror nhưng trong input/dialog | Ctrl+K và shortcut workspace | Không phá nội dung input; global shortcut bị bỏ qua theo context |
| K07 | TP1 | `[Ctrl+B, Ctrl+I, Ctrl+Backtick, Ctrl+Shift+C/T/M/Q, Ctrl+H, Ctrl+Alt+1/2/3]` | Chạy riêng trên selection rỗng/có text | Markdown/snippet/search/heading đúng; selection/cursor hợp lý; Undo được |

### L — Persistence, recovery, offline và PWA

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| L01 | TP0 | Project có text/assets/evidence/present state | Reload 5 lần và đóng/mở browser | Hash dữ liệu nghiệp vụ không đổi; không nhân đôi record |
| L02 | TP0 | Thay đổi trong cửa sổ autosave 2 giây | Ẩn tab/đóng tab ngay | Flush pending save; lần mở sau có thay đổi cuối |
| L03 | TP1 | Hai tab cùng project | Sửa khác nhau và lưu xen kẽ | Không mất dữ liệu âm thầm: phải phát hiện conflict hoặc có quy tắc last-write rõ và cảnh báo; ghi bug nếu silent overwrite |
| L04 | TP1 | Mô phỏng `QuotaExceededError` | Sửa project | UI báo quota, giữ draft trong memory, không nhân bản full bundle vào recovery; Retry hoạt động khi giải phóng quota |
| L05 | TP0 | App đã online ít nhất một lần | Offline rồi soạn/check/xuất HTML/DOCX | Các chức năng client-side hoạt động; dữ liệu lưu; không gọi AI/PDF âm thầm |
| L06 | TP1 | Route đã cache | Đóng app khi offline rồi mở lại | Shell/route tải từ cache; project còn; trạng thái offline rõ |
| L07 | TP1 | Profile mới chưa từng vào app | Offline và mở URL | Hiển thị offline fallback/không khả dụng có hướng dẫn; không màn trắng |
| L08 | TP1 | HTTPS/localhost, manifest hợp lệ | Cài PWA, mở standalone | Cài/mở được; icon/name/start URL đúng; dữ liệu cùng origin còn |
| L09 | TP1 | Có draft chưa autosave và SW update chờ | Chọn cập nhật | App flush autosave trước reload; bản mới mở với draft nguyên vẹn |
| L10 | TP2 | `[FX-REC-01,02,03]` | Nạp từng DB cũ rồi mở app | Migration lên v4; record count/hash theo manifest; migration idempotent khi reload |
| L11 | TP2 | FX-REC-04 | Mở và thao tác Recovery Center | Khôi phục/loại bỏ độc lập, không crash hoặc ảnh hưởng project lành |

### M — Responsive, theme, accessibility, security, privacy và hiệu năng

| ID | TP | Dữ liệu/tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|---|
| M01 | TP0 | `[320×568, 375×667, 768×1024]` | Thực hiện tạo/chọn section, mở drawer/panel, save/check | Không overflow ngang ngoài vùng chủ đích; control không che nhau; thao tác chính dùng được |
| M02 | TP1 | Android thật portrait/landscape | Tap, scroll, mở/đóng drawer, reorder nếu hỗ trợ touch | Touch target dùng được; không kẹt scroll; orientation change không mất state |
| M03 | TP1 | Light mode | Bật Dark mode, đi qua mọi panel, reload | Theme áp dụng nhất quán và persist; CodeMirror selection/active line/readability đạt contrast |
| M04 | TP1 | Keyboard only | Tab/Shift+Tab/Enter/Space/Escape qua Library, Workspace, dialog, tabs | Thứ tự focus hợp lý; focus ring rõ; modal trap và trả focus đúng; không keyboard trap |
| M05 | TP1 | Các route/panel chính | Chạy axe automated | Không có violation serious/critical; violation còn lại được triage, không bỏ qua âm thầm |
| M06 | TP1 | Dialog/toast/progress/checker | Dùng screen reader cơ bản | Label/name/role đúng; thay đổi quan trọng có live announcement; icon-only button có accessible name |
| M07 | TP0 | FX-MD-04 nhập qua editor và import | Preview, appendix, HTML export | Không script/event/javascript URL nào thực thi; nội dung nguy hiểm bị sanitize/escape; app vẫn hoạt động |
| M08 | TP0 | Evidence URL và metadata có payload XSS | Lưu, QR, appendix, export | Payload không thực thi; URL scheme nguy hiểm bị chặn; QR không chứa URL đã bị từ chối |
| M09 | TP1 | Broken ref tại Preview, ImportPreview, export preparation | Mở từng surface | Mỗi surface có placeholder; 0 request ref, 0 HTTP 404, 0 pageerror |
| M10 | TP1 | Placeholder có action Gắn ảnh | Chọn file hợp lệ | Ref được rewrite đúng; placeholder biến mất; ảnh persist; checker issue tương ứng biến mất |
| M11 | TP0 | Marker nội dung và marker key riêng biệt | Theo dõi Network/storage/log trong phiên thường, AI và PDF | Phiên thường không gửi marker; AI chỉ gửi nội dung yêu cầu qua `/api/ai`; PDF chỉ gửi HTML qua `/api/pdf`; key marker không xuất hiện ở nơi cấm |
| M12 | TP0 | FX-PERF-S, production | Chạy `e2e/workspace-performance.spec.ts` | Editor-ready `<6000 ms`, input→preview `<1500 ms`, long-task total `<2500 ms`, 0 worker error |
| M13 | TP1 | FX-PERF-L, production | Chạy cùng performance spec | Editor-ready `<9000 ms`, input→preview `<3000 ms`, long-task total `<4500 ms`, 0 worker error |
| M14 | TP1 | Production performance artifact | Chạy `npm run perf:collect` và `npm run check:bundle` | Library initial `<=200 KiB`, Workspace initial `<=200 KiB`, editor-ready critical transitive `<=650 KiB`; không chấp nhận `UNMEASURED` trong CI |
| M15 | TP1 | Thực hiện riêng add/delete/replace/import/AI destructive | Mở Snapshot History sau từng hành động | Mỗi hành động có/không có snapshot đúng policy; không tạo snapshot do chỉ gõ/save thông thường |
| M16 | TP1 | Snapshot có hash biết trước | Restore | Nội dung/section/asset theo snapshot trở lại; state mới không bị trộn; có thể tiếp tục chỉnh sửa/lưu |

## 9. Smoke và regression suite

### 9.1 Smoke 8–10 phút

Chuẩn bị sẵn fixture/project để thời gian không bị dùng cho setup.

1. A01–A02: mở Library và tạo project từ `software-project`.
2. C01–C03: gõ marker, preview, save/autosave và reload.
3. E01/E10: chạy checker trên fixture sạch/lỗi đã chuẩn bị.
4. G01[github]/G03: thêm GitHub evidence và sinh QR.
5. H02: xuất và mở HTML offline.
6. M01[375×667]/M03: kiểm mobile drawer và Dark mode.

### 9.2 Critical regression 25–30 phút

Chạy Smoke cộng thêm: F02, F08, H03, H05[docx], I05, J02, J08, L05, M07 và M11.

### 9.3 Full regression

Chạy toàn bộ TP0 → TP1 → TP2 theo nhóm. Các test instance tham số phải được ghi thành dòng kết quả riêng, không gộp “tất cả Pass”.

## 10. Ma trận automation hiện có

| Khu vực | Automated coverage hiện có | Phần vẫn manual/chưa đủ |
|---|---|---|
| Library | `e2e/project-library.spec.ts` | Recovery, deep link, multi-browser |
| Template/offline | `e2e/templates-and-offline.spec.ts` | Toàn bộ template oracle, thiết bị thật, PWA install/update |
| Pipeline worker | `e2e/pipeline-worker.spec.ts` | Mermaid lỗi, asset boundary, browser compatibility |
| Performance | `e2e/workspace-performance.spec.ts` | Mobile/Edge và checker stress 300 sections |
| Accessibility | Vitest/axe trong `src/modules/__a11y__` và component tests | Keyboard flow, screen reader, mobile touch |
| Export/import/AI | Nhiều Vitest subsystem | Download/open artifact thật, proxy/provider lỗi E2E, Word/PowerPoint visual QA |

Playwright hiện mặc định Desktop Chrome/light. Không ghi Edge/mobile/dark là automated cho tới khi `playwright.config.ts` có project tương ứng.

## 11. Mẫu ghi kết quả

### 11.1 Test run header

| Run ID | Commit | Build | OS | Browser/device | DB schema | AI config | PDF renderer | Tester | Bắt đầu/kết thúc |
|---|---|---|---|---|---|---|---|---|---|
| | | Production | | | v4 | Off/Test | Off/Ready | | |

### 11.2 Kết quả từng ca

| Test instance | TP | Environment | Fixture + SHA | Kết quả | Actual result | Evidence | Bug ID/severity | Người chạy | Thời gian |
|---|---|---|---|---|---|---|---|---|---|
| | | | | Pass/Fail/Blocked/N/A | | screenshot/trace/artifact | | | |

### 11.3 Test summary

| TP | Total | Pass | Fail | Blocked | Not run | N/A | Pass rate |
|---|---:|---:|---:|---:|---:|---:|---:|
| TP0 | | | | | | | |
| TP1 | | | | | | | |
| TP2 | | | | | | | |

### 11.4 Quyết định release

- S0/S1 còn mở: `<không/có — danh sách>`
- Privacy/data-loss/security gate: `<Pass/Fail>`
- Performance/bundle gate: `<Pass/Fail/Blocked>`
- Rủi ro được chấp thuận: `<danh sách + người duyệt>`
- Kết luận: `<Go / Conditional Go / No-Go>`

## 12. Traceability theo khu vực

| Requirement area | Test group |
|---|---|
| Library/lifecycle | A01–A11 |
| Template/metadata/AI | B01–B13 |
| Write/autosave/assets | C01–C18 |
| Format/preview | D01–D10 |
| Checker/readiness | E01–E11 |
| Import/OCR | F01–F17 |
| Evidence/QR | G01–G08 |
| Export/artifact | H01–H14 |
| Submission package | I01–I10 |
| Present/PPTX | J01–J10 |
| Commands/shortcuts | K01–K07 |
| Persistence/PWA/recovery | L01–L11 |
| Responsive/a11y/security/privacy/performance | M01–M16 |

---

**Quy tắc bảo trì:** mọi thay đổi về template, evidence kind, command, checker rule, export gate, DB schema, network destination hoặc budget hiệu năng phải cập nhật tài liệu này và automated test liên quan trong cùng pull request. Ghi commit SHA của baseline thay vì mô tả “tại thời điểm viết”.
