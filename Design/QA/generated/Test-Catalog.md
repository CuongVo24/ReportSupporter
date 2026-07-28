<!-- GENERATED FILE — edit Design/QA/catalog/test-cases.json and run npm run qa:catalog:render -->
# Test catalog chi tiết — ReportSupporter QA v3.0

- Schema: `qa-test-case@1`
- Base cases: **190**
- Expanded instances: **248**
- Canonical source: `Design/QA/catalog/test-cases.json`

## A — Thư viện và vòng đời dự án

### A01 — Thư viện và vòng đời dự án: Mở /

- **Priority:** TP0
- **Requirements:** `QA-REQ-A-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, smoke, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** playwright:e2e/project-library.spec.ts
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Empty Hub hiển thị; không crash; 0 project

**Tiền điều kiện:** Storage sạch

**Các bước:**

1. Mở `/`
   - Expected: Empty Hub hiển thị; không crash; 0 project

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### A02 — Thư viện và vòng đời dự án: Tạo dự án mới

- **Priority:** TP0
- **Requirements:** `QA-REQ-A-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, smoke, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** playwright:e2e/project-library.spec.ts
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Sinh project ID duy nhất; điều hướng `/workspace/<id>`; editor sẵn sàng

**Tiền điều kiện:** Storage sạch

**Các bước:**

1. Tạo dự án mới
   - Expected: Sinh project ID duy nhất; điều hướng `/workspace/<id>`; editor sẵn sàng

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### A03 — Thư viện và vòng đời dự án: Tìm do an, đồ án, chữ hoa/thường và khoảng trắng đầu/cuối

- **Priority:** TP1
- **Requirements:** `QA-REQ-A-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** playwright:e2e/project-library.spec.ts
- **Evidence:** actual-result

**Mục tiêu:** Mỗi query trả đúng tập project theo normalize bỏ dấu/case/trim

**Tiền điều kiện:** 4 dự án: `Bao cao mon hoc`, `Báo cáo đồ án`, `Đồ Án Web`, `Khác`

**Các bước:**

1. Tìm `do an`, `đồ án`, chữ hoa/thường và khoảng trắng đầu/cuối
   - Expected: Mỗi query trả đúng tập project theo normalize bỏ dấu/case/trim

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### A04 — Thư viện và vòng đời dự án: Mở lần lượt P1 → P2 → P1 rồi về Library

- **Priority:** TP1
- **Requirements:** `QA-REQ-A-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** playwright:e2e/project-library.spec.ts
- **Evidence:** actual-result

**Mục tiêu:** Recent xếp P1 đầu, P2 sau; không dùng created time thay access time

**Tiền điều kiện:** 3 dự án có access time khác nhau

**Các bước:**

1. Mở lần lượt P1 → P2 → P1 rồi về Library
   - Expected: Recent xếp P1 đầu, P2 sau; không dùng created time thay access time

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### A05 — Thư viện và vòng đời dự án: Duplicate rồi sửa title/section của bản sao

- **Priority:** TP1
- **Requirements:** `QA-REQ-A-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** playwright:e2e/project-library.spec.ts
- **Evidence:** actual-result

**Mục tiêu:** ID mới; nội dung/asset ban đầu tương đương; sửa bản sao không đổi bản gốc

**Tiền điều kiện:** 1 dự án có 2 section và 1 asset

**Các bước:**

1. Duplicate rồi sửa title/section của bản sao
   - Expected: ID mới; nội dung/asset ban đầu tương đương; sửa bản sao không đổi bản gốc

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### A06 — Thư viện và vòng đời dự án: Xóa, mở Trash

- **Priority:** TP1
- **Requirements:** `QA-REQ-A-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** playwright:e2e/project-library.spec.ts
- **Evidence:** actual-result

**Mục tiêu:** Dự án biến mất khỏi danh sách chính, xuất hiện trong Trash; chưa purge

**Tiền điều kiện:** 1 dự án thường

**Các bước:**

1. Xóa, mở Trash
   - Expected: Dự án biến mất khỏi danh sách chính, xuất hiện trong Trash; chưa purge

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### A07 — Thư viện và vòng đời dự án: Restore

- **Priority:** TP1
- **Requirements:** `QA-REQ-A-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** playwright:e2e/project-library.spec.ts
- **Evidence:** actual-result

**Mục tiêu:** Dự án trở lại nguyên title/section/asset; mở được

**Tiền điều kiện:** Dự án trong Trash

**Các bước:**

1. Restore
   - Expected: Dự án trở lại nguyên title/section/asset; mở được

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### A08 — Thư viện và vòng đời dự án: Reload và đóng/mở browser profile

- **Priority:** TP1
- **Requirements:** `QA-REQ-A-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** playwright:e2e/project-library.spec.ts
- **Evidence:** actual-result

**Mục tiêu:** Số project, title và thứ tự Recent giữ nguyên

**Tiền điều kiện:** 4 dự án đã lưu

**Các bước:**

1. Reload và đóng/mở browser profile
   - Expected: Số project, title và thứ tự Recent giữ nguyên

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### A09 — Thư viện và vòng đời dự án: Mở project lỗi

- **Priority:** TP2
- **Requirements:** `QA-REQ-A-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-REC-04`
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** playwright:e2e/project-library.spec.ts
- **Evidence:** actual-result

**Mục tiêu:** Recovery Center hiển thị đúng item; chọn khôi phục/loại bỏ không làm sập Library

**Tiền điều kiện:** Nạp FX-REC-04 bằng script

**Các bước:**

1. Mở project lỗi
   - Expected: Recovery Center hiển thị đúng item; chọn khôi phục/loại bỏ không làm sập Library

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### A10 — Thư viện và vòng đời dự án: Mở trực tiếp /workspace/not-found-id

- **Priority:** TP1
- **Requirements:** `QA-REQ-A-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** playwright:e2e/project-library.spec.ts
- **Evidence:** actual-result

**Mục tiêu:** Hiển thị trạng thái không tìm thấy và đường quay về Library; không tạo project rác

**Tiền điều kiện:** Project ID không tồn tại

**Các bước:**

1. Mở trực tiếp `/workspace/not-found-id`
   - Expected: Hiển thị trạng thái không tìm thấy và đường quay về Library; không tạo project rác

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### A11 — Thư viện và vòng đời dự án: Dùng Back/Forward/reload qua hai route

- **Priority:** TP1
- **Requirements:** `QA-REQ-A-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** playwright:e2e/project-library.spec.ts
- **Evidence:** actual-result

**Mục tiêu:** Route và dữ liệu đúng; không nhân đôi project hoặc mất thay đổi đã lưu

**Tiền điều kiện:** Có Library và một workspace

**Các bước:**

1. Dùng Back/Forward/reload qua hai route
   - Expected: Route và dữ liệu đúng; không nhân đôi project hoặc mất thay đổi đã lưu

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## B — Template, metadata và AI

### B01 — Template, metadata và AI: Mở Template Catalog

- **Priority:** TP0
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** playwright:e2e/templates-and-offline.spec.ts
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Hiện đúng 4 template trong ma trận; preview và tên khớp

**Tiền điều kiện:** Storage sạch

**Các bước:**

1. Mở Template Catalog
   - Expected: Hiện đúng 4 template trong ma trận; preview và tên khớp

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B02 — Template, metadata và AI: Bỏ trống từng field bắt buộc rồi submit

- **Priority:** TP1
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Field lỗi có label/message; không tạo project khi dữ liệu bắt buộc thiếu

**Tiền điều kiện:** `[mỗi template]`

**Các bước:**

1. Bỏ trống từng field bắt buộc rồi submit
   - Expected: Field lỗi có label/message; không tạo project khi dữ liệu bắt buộc thiếu

**Instances:** `B02[software-project]`, `B02[lab-report]`, `B02[internship-report]`, `B02[readme-report]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B03 — Template, metadata và AI: Tạo project

- **Priority:** TP0
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, smoke, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** playwright:e2e/templates-and-offline.spec.ts
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Section count/title/required rule khớp oracle của template; metadata điền đúng vị trí

**Tiền điều kiện:** `[mỗi template]`, metadata hợp lệ cố định

**Các bước:**

1. Tạo project
   - Expected: Section count/title/required rule khớp oracle của template; metadata điền đúng vị trí

**Instances:** `B03[software-project]`, `B03[lab-report]`, `B03[internship-report]`, `B03[readme-report]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B04 — Template, metadata và AI: Tạo, lưu, reload, preview/export HTML

- **Priority:** TP1
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Ký tự được lưu/render an toàn, không lỗi encoding/XSS; không cắt âm thầm

**Tiền điều kiện:** Metadata có tiếng Việt, các ký tự ampersand/dấu bé hơn/dấu lớn hơn/nháy đơn/nháy kép và tên dài 255 ký tự

**Các bước:**

1. Tạo, lưu, reload, preview/export HTML
   - Expected: Ký tự được lưu/render an toàn, không lỗi encoding/XSS; không cắt âm thầm

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B05 — Template, metadata và AI: Tạo báo cáo trống

- **Priority:** TP2
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Workspace có đúng 1 mục rỗng, editor focus được

**Tiền điều kiện:** Không chọn template

**Các bước:**

1. Tạo báo cáo trống
   - Expected: Workspace có đúng 1 mục rỗng, editor focus được

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B06 — Template, metadata và AI: Chạy một hành động AI

- **Priority:** TP0
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Không có request `/api/ai`; UI thông báo AI tắt/hướng dẫn cấu hình; nội dung không đổi

**Tiền điều kiện:** AI mặc định tắt; Network log sạch

**Các bước:**

1. Chạy một hành động AI
   - Expected: Không có request `/api/ai`; UI thông báo AI tắt/hướng dẫn cấu hình; nội dung không đổi

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B07 — Template, metadata và AI: Chạy AI

- **Priority:** TP0
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Không có request `/api/ai`; UI báo chưa cấu hình; không crash

**Tiền điều kiện:** AI bật nhưng thiếu provider hoặc API key

**Các bước:**

1. Chạy AI
   - Expected: Không có request `/api/ai`; UI báo chưa cấu hình; không crash

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B08 — Template, metadata và AI: Lưu AI Settings, kiểm localStorage/IndexedDB, reload cứng/mở tab mới

- **Priority:** TP0
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Provider/flag có thể persist; marker key không tồn tại trong storage; phiên mới yêu cầu nhập lại key

**Tiền điều kiện:** Key test giả `qa-secret-marker`

**Các bước:**

1. Lưu AI Settings, kiểm localStorage/IndexedDB, reload cứng/mở tab mới
   - Expected: Provider/flag có thể persist; marker key không tồn tại trong storage; phiên mới yêu cầu nhập lại key

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B09 — Template, metadata và AI: Chạy Dàn ý AI

- **Priority:** TP1
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Chỉ có request same-origin `/api/ai`; hiển thị suggestion/diff; chưa áp dụng thì nội dung gốc không đổi

**Tiền điều kiện:** AI test hợp lệ, response fixture cố định

**Các bước:**

1. Chạy Dàn ý AI
   - Expected: Chỉ có request same-origin `/api/ai`; hiển thị suggestion/diff; chưa áp dụng thì nội dung gốc không đổi

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B10 — Template, metadata và AI: Accept rồi Undo/Reject suggestion

- **Priority:** TP1
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Accept tạo đúng thay đổi và snapshot; Reject không đổi; Undo khôi phục đúng revision

**Tiền điều kiện:** AI response fixture cố định

**Các bước:**

1. Accept rồi Undo/Reject suggestion
   - Expected: Accept tạo đúng thay đổi và snapshot; Reject không đổi; Undo khôi phục đúng revision

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B11 — Template, metadata và AI: Chạy AI cho từng status

- **Priority:** TP1
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Thông báo phân biệt cấu hình/quá tải/provider/timeout; không mất nội dung; retry chỉ xuất hiện khi hợp lý

**Tiền điều kiện:** Mock lần lượt 401/429/502/504

**Các bước:**

1. Chạy AI cho từng status
   - Expected: Thông báo phân biệt cấu hình/quá tải/provider/timeout; không mất nội dung; retry chỉ xuất hiện khi hợp lý

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B12 — Template, metadata và AI: Hủy request/đóng panel

- **Priority:** TP1
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Request bị abort; UI kết thúc loading; không áp suggestion một phần

**Tiền điều kiện:** AI request đang chạy

**Các bước:**

1. Hủy request/đóng panel
   - Expected: Request bị abort; UI kết thúc loading; không áp suggestion một phần

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### B13 — Template, metadata và AI: Accept suggestion cũ

- **Priority:** TP1
- **Requirements:** `QA-REQ-B-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Suggestion stale không ghi đè revision mới; yêu cầu tạo lại/resolve conflict

**Tiền điều kiện:** Tạo suggestion rồi sửa section trước khi Accept

**Các bước:**

1. Accept suggestion cũ
   - Expected: Suggestion stale không ghi đè revision mới; yêu cầu tạo lại/resolve conflict

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## C — Soạn thảo và asset

### C01 — Soạn thảo và asset: Gõ marker vào editor

- **Priority:** TP0
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-PERF-S`
- **Suites:** full, smoke, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Preview chứa đúng marker; production automated gate input→preview `<1500 ms`; 0 worker/page error

**Tiền điều kiện:** FX-PERF-S

**Các bước:**

1. Gõ marker vào editor
   - Expected: Preview chứa đúng marker; production automated gate input→preview `<1500 ms`; 0 worker/page error

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C02 — Soạn thảo và asset: Ctrl+S rồi reload

- **Priority:** TP0
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, smoke, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Trạng thái chuyển saving→saved; marker còn nguyên

**Tiền điều kiện:** Project có marker chưa lưu

**Các bước:**

1. Ctrl+S rồi reload
   - Expected: Trạng thái chuyển saving→saved; marker còn nguyên

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C03 — Soạn thảo và asset: Không Ctrl+S, chờ >2 giây rồi reload

- **Priority:** TP0
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, smoke, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Autosave hoàn tất và marker còn nguyên

**Tiền điều kiện:** Project có marker mới

**Các bước:**

1. Không Ctrl+S, chờ >2 giây rồi reload
   - Expected: Autosave hoàn tất và marker còn nguyên

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C04 — Soạn thảo và asset: Chuyển tab/ẩn document hoặc đóng tab rồi mở lại

- **Priority:** TP0
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Pending save được flush; thay đổi cuối cùng còn nguyên

**Tiền điều kiện:** Thay đổi đang chờ autosave

**Các bước:**

1. Chuyển tab/ẩn document hoặc đóng tab rồi mở lại
   - Expected: Pending save được flush; thay đổi cuối cùng còn nguyên

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C05 — Soạn thảo và asset: Ctrl+Shift+N

- **Priority:** TP1
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Thêm đúng 1 section, ID duy nhất, nav/editor đồng bộ

**Tiền điều kiện:** 1 section đang chọn

**Các bước:**

1. Ctrl+Shift+N
   - Expected: Thêm đúng 1 section, ID duy nhất, nav/editor đồng bộ

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C06 — Soạn thảo và asset: Ctrl+Shift+D

- **Priority:** TP1
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Thêm đúng 1 bản sao độc lập; sửa bản sao không đổi gốc

**Tiền điều kiện:** Section có title/Markdown riêng

**Các bước:**

1. Ctrl+Shift+D
   - Expected: Thêm đúng 1 bản sao độc lập; sửa bản sao không đổi gốc

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C07 — Soạn thảo và asset: Alt+Up rồi Alt+Down

- **Priority:** TP1
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Mỗi lần chỉ đổi một vị trí hợp lệ; nav, preview, numbering đồng bộ; biên đầu/cuối không lỗi

**Tiền điều kiện:** 3 section A/B/C, chọn B

**Các bước:**

1. Alt+Up rồi Alt+Down
   - Expected: Mỗi lần chỉ đổi một vị trí hợp lệ; nav, preview, numbering đồng bộ; biên đầu/cuối không lỗi

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C08 — Soạn thảo và asset: Kéo C lên đầu

- **Priority:** TP1
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Thứ tự C/A/B ở nav, preview và persisted state; reload giữ nguyên

**Tiền điều kiện:** 3 section A/B/C

**Các bước:**

1. Kéo C lên đầu
   - Expected: Thứ tự C/A/B ở nav, preview và persisted state; reload giữ nguyên

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C09 — Soạn thảo và asset: Chèn bảng GFM

- **Priority:** TP1
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-MD-01`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Đúng số hàng/cột/text; không tràn container; caption/label theo cú pháp hỗ trợ

**Tiền điều kiện:** FX-MD-01 phần table

**Các bước:**

1. Chèn bảng GFM
   - Expected: Đúng số hàng/cột/text; không tràn container; caption/label theo cú pháp hỗ trợ

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C10 — Soạn thảo và asset: Chèn/xem preview

- **Priority:** TP1
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Block `js` highlight; block thiếu language vẫn render và tạo rule warning tương ứng

**Tiền điều kiện:** Code block `js` và code block không language

**Các bước:**

1. Chèn/xem preview
   - Expected: Block `js` highlight; block thiếu language vẫn render và tạo rule warning tương ứng

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C11 — Soạn thảo và asset: Chèn/xem preview

- **Priority:** TP1
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Hai công thức render; source không mất khi save/reload

**Tiền điều kiện:** Inline `$x^2$` và block `$$...$$`

**Các bước:**

1. Chèn/xem preview
   - Expected: Hai công thức render; source không mất khi save/reload

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C12 — Soạn thảo và asset: Chèn/xem preview

- **Priority:** TP1
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Hợp lệ thành SVG; sai syntax hiện lỗi/placeholder an toàn, không crash phần preview còn lại

**Tiền điều kiện:** Mermaid hợp lệ và Mermaid sai syntax

**Các bước:**

1. Chèn/xem preview
   - Expected: Hợp lệ thành SVG; sai syntax hiện lỗi/placeholder an toàn, không crash phần preview còn lại

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C13 — Soạn thảo và asset: Paste/chèn ảnh

- **Priority:** TP0
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-IMG-01`, `FX-IMG-02`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Cả hai được chấp nhận, tạo asset/ref và hiển thị; reload còn ảnh

**Tiền điều kiện:** Lần lượt FX-IMG-01, FX-IMG-02

**Các bước:**

1. Paste/chèn ảnh
   - Expected: Cả hai được chấp nhận, tạo asset/ref và hiển thị; reload còn ảnh

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C14 — Soạn thảo và asset: Paste/chèn ảnh

- **Priority:** TP0
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-IMG-03`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Bị chặn với giới hạn 5 MiB; không tạo asset/ref rác; project vẫn sửa được

**Tiền điều kiện:** FX-IMG-03

**Các bước:**

1. Paste/chèn ảnh
   - Expected: Bị chặn với giới hạn 5 MiB; không tạo asset/ref rác; project vẫn sửa được

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C15 — Soạn thảo và asset: Dùng chọn file “Gắn ảnh”

- **Priority:** TP1
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Ref được rewrite/resolve đúng asset; không phát request tới ref cũ

**Tiền điều kiện:** File ảnh hợp lệ có basename khớp ref

**Các bước:**

1. Dùng chọn file “Gắn ảnh”
   - Expected: Ref được rewrite/resolve đúng asset; không phát request tới ref cũ

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C16 — Soạn thảo và asset: Undo từng thao tác

- **Priority:** TP1
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Mỗi Undo khôi phục đúng state trước đó, không ảnh hưởng section/asset khác

**Tiền điều kiện:** Thực hiện add/duplicate/reorder/delete section

**Các bước:**

1. Undo từng thao tác
   - Expected: Mỗi Undo khôi phục đúng state trước đó, không ảnh hưởng section/asset khác

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C17 — Soạn thảo và asset: Ctrl+Shift+F hai lần

- **Priority:** TP1
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Lần 1 ẩn chrome phụ; lần 2 phục hồi layout và selection/scroll hợp lý

**Tiền điều kiện:** Workspace thường

**Các bước:**

1. Ctrl+Shift+F hai lần
   - Expected: Lần 1 ẩn chrome phụ; lần 2 phục hồi layout và selection/scroll hợp lý

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### C18 — Soạn thảo và asset: Gõ, save, reload, export

- **Priority:** TP2
- **Requirements:** `QA-REQ-C-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Nội dung tương đương Unicode đầu vào, không mojibake hoặc mất ký tự

**Tiền điều kiện:** Chuỗi tiếng Việt NFC/NFD, emoji, ký tự đặc biệt

**Các bước:**

1. Gõ, save, reload, export
   - Expected: Nội dung tương đương Unicode đầu vào, không mojibake hoặc mất ký tự

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## D — Định dạng và Preview

### D01 — Định dạng và Preview: Mở Preview và đo computed style

- **Priority:** TP0
- **Requirements:** `QA-REQ-D-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Trang rộng 210 mm, cao tối thiểu 297 mm; lề trên/dưới 25 mm, trái 30 mm, phải 20 mm; Times New Roman 13 pt; line-height 1.5; body justify

**Tiền điều kiện:** Project dùng preset mặc định

**Các bước:**

1. Mở Preview và đo computed style
   - Expected: Trang rộng 210 mm, cao tối thiểu 297 mm; lề trên/dưới 25 mm, trái 30 mm, phải 20 mm; Times New Roman 13 pt; line-height 1.5; body justify

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### D02 — Định dạng và Preview: Xem preview

- **Priority:** TP0
- **Requirements:** `QA-REQ-D-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Đánh số `1.`, `1.1.`, `1.1.1.` đúng; không nhảy/trùng số

**Tiền điều kiện:** H1/H2/H3 cố định

**Các bước:**

1. Xem preview
   - Expected: Đánh số `1.`, `1.1.`, `1.1.1.` đúng; không nhảy/trùng số

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### D03 — Định dạng và Preview: Kiểm TOC

- **Priority:** TP0
- **Requirements:** `QA-REQ-D-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Đủ 3 entry, đúng text/thứ tự/link/page theo fixture; dot leader không chồng chữ

**Tiền điều kiện:** 3 heading có thứ tự cố định

**Các bước:**

1. Kiểm TOC
   - Expected: Đủ 3 entry, đúng text/thứ tự/link/page theo fixture; dot leader không chồng chữ

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### D04 — Định dạng và Preview: Kiểm LoF

- **Priority:** TP0
- **Requirements:** `QA-REQ-D-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Đúng 2 entry và số hình; link trỏ đúng hình

**Tiền điều kiện:** 2 hình có caption/label

**Các bước:**

1. Kiểm LoF
   - Expected: Đúng 2 entry và số hình; link trỏ đúng hình

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### D05 — Định dạng và Preview: Kiểm LoT

- **Priority:** TP0
- **Requirements:** `QA-REQ-D-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Đúng 2 entry và số bảng; link trỏ đúng bảng

**Tiền điều kiện:** 2 bảng có caption/label

**Các bước:**

1. Kiểm LoT
   - Expected: Đúng 2 entry và số bảng; link trỏ đúng bảng

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### D06 — Định dạng và Preview: Chọn từng zoom

- **Priority:** TP1
- **Requirements:** `QA-REQ-D-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Giá trị UI và transform/size tương ứng; không làm mất scroll/focus

**Tiền điều kiện:** `[Auto, 50, 75, 100, 125, Actual]`

**Các bước:**

1. Chọn từng zoom
   - Expected: Giá trị UI và transform/size tương ứng; không làm mất scroll/focus

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### D07 — Định dạng và Preview: Bật nền xem tối rồi reload

- **Priority:** TP1
- **Requirements:** `QA-REQ-D-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Chỉ vùng xem đổi nền như thiết kế; trang/nội dung đủ contrast; preference persist nếu spec yêu cầu

**Tiền điều kiện:** Preview sáng

**Các bước:**

1. Bật nền xem tối rồi reload
   - Expected: Chỉ vùng xem đổi nền như thiết kế; trang/nội dung đủ contrast; preference persist nếu spec yêu cầu

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### D08 — Định dạng và Preview: Reorder một section

- **Priority:** TP1
- **Requirements:** `QA-REQ-D-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Numbering và cả ba danh mục cập nhật, không còn entry stale

**Tiền điều kiện:** Project có TOC/LoF/LoT

**Các bước:**

1. Reorder một section
   - Expected: Numbering và cả ba danh mục cập nhật, không còn entry stale

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### D09 — Định dạng và Preview: Preview và Print Preview

- **Priority:** TP1
- **Requirements:** `QA-REQ-D-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-PAGE-01`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Page count, break position và overflow khớp manifest; không mất/tràn nội dung; heading/bảng/ảnh xử lý theo print spec

**Tiền điều kiện:** FX-PAGE-01

**Các bước:**

1. Preview và Print Preview
   - Expected: Page count, break position và overflow khớp manifest; không mất/tràn nội dung; heading/bảng/ảnh xử lý theo print spec

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### D10 — Định dạng và Preview: Scroll editor rồi preview và ngược lại

- **Priority:** TP2
- **Requirements:** `QA-REQ-D-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Scroll đồng bộ theo tỷ lệ; không rung/lặp vô hạn; người dùng vẫn cuộn chủ động được

**Tiền điều kiện:** Split view editor/preview

**Các bước:**

1. Scroll editor rồi preview và ngược lại
   - Expected: Scroll đồng bộ theo tỷ lệ; không rung/lặp vô hạn; người dùng vẫn cuộn chủ động được

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## E — Checker và Readiness

### E01 — Checker và Readiness: Chạy Soát lỗi

- **Priority:** TP0
- **Requirements:** `QA-REQ-E-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-CHK-01`
- **Suites:** full, smoke, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Danh sách và readiness khớp chính xác manifest; group/count không trùng

**Tiền điều kiện:** FX-CHK-01

**Các bước:**

1. Chạy Soát lỗi
   - Expected: Danh sách và readiness khớp chính xác manifest; group/count không trùng

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### E02 — Checker và Readiness: Chạy checker 3 lần

- **Priority:** TP0
- **Requirements:** `QA-REQ-E-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Readiness và issue list giống hệt cả 3 lần

**Tiền điều kiện:** Cùng bundle không đổi

**Các bước:**

1. Chạy checker 3 lần
   - Expected: Readiness và issue list giống hệt cả 3 lần

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### E03 — Checker và Readiness: Xóa một section bắt buộc, chạy check

- **Priority:** TP1
- **Requirements:** `QA-REQ-E-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Có đúng rule thiếu section với `severity=error` và guidance

**Tiền điều kiện:** Template có section bắt buộc

**Các bước:**

1. Xóa một section bắt buộc, chạy check
   - Expected: Có đúng rule thiếu section với `severity=error` và guidance

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### E04 — Checker và Readiness: Chạy check

- **Priority:** TP1
- **Requirements:** `QA-REQ-E-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Có đúng warning heading jump tại section chứa H3

**Tiền điều kiện:** H1 → H3

**Các bước:**

1. Chạy check
   - Expected: Có đúng warning heading jump tại section chứa H3

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### E05 — Checker và Readiness: Chạy check

- **Priority:** TP1
- **Requirements:** `QA-REQ-E-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Có đúng warning thiếu language, vị trí đúng

**Tiền điều kiện:** Code fence không language

**Các bước:**

1. Chạy check
   - Expected: Có đúng warning thiếu language, vị trí đúng

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### E06 — Checker và Readiness: Chạy check

- **Priority:** TP1
- **Requirements:** `QA-REQ-E-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Có 2 issue đúng loại/section; không gộp sai

**Tiền điều kiện:** Một ảnh và một bảng thiếu caption

**Các bước:**

1. Chạy check
   - Expected: Có 2 issue đúng loại/section; không gộp sai

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### E07 — Checker và Readiness: Chạy check

- **Priority:** TP1
- **Requirements:** `QA-REQ-E-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Có issue cho từng vị trí theo rule; không false positive ở code block nếu spec loại trừ

**Tiền điều kiện:** `TODO` và `lorem ipsum` ở hai section

**Các bước:**

1. Chạy check
   - Expected: Có issue cho từng vị trí theo rule; không false positive ở code block nếu spec loại trừ

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### E08 — Checker và Readiness: Bấm từng issue

- **Priority:** TP1
- **Requirements:** `QA-REQ-E-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Chọn đúng section và đặt editor gần đúng vị trí; focus visible

**Tiền điều kiện:** Panel có nhiều issue

**Các bước:**

1. Bấm từng issue
   - Expected: Chọn đúng section và đặt editor gần đúng vị trí; focus visible

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### E09 — Checker và Readiness: Sửa lần lượt error rồi warning theo manifest, chạy lại

- **Priority:** TP1
- **Requirements:** `QA-REQ-E-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-CHK-01`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Issue đã sửa biến mất; issue khác còn; readiness sau mỗi bước bằng đúng giá trị trong manifest

**Tiền điều kiện:** FX-CHK-01

**Các bước:**

1. Sửa lần lượt error rồi warning theo manifest, chạy lại
   - Expected: Issue đã sửa biến mất; issue khác còn; readiness sau mỗi bước bằng đúng giá trị trong manifest

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### E10 — Checker và Readiness: Chạy check

- **Priority:** TP1
- **Requirements:** `QA-REQ-E-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, smoke
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Không còn `error`; badge xanh; điểm đạt threshold submission `>=80`

**Tiền điều kiện:** Bundle sạch theo checker

**Các bước:**

1. Chạy check
   - Expected: Không còn `error`; badge xanh; điểm đạt threshold submission `>=80`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### E11 — Checker và Readiness: Chạy checker và đồng thời gõ marker

- **Priority:** TP2
- **Requirements:** `QA-REQ-E-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-STRESS-01`
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Checker hoàn tất `<10 s`; marker phản hồi `<1 s`; count khớp manifest; 0 pageerror

**Tiền điều kiện:** FX-STRESS-01

**Các bước:**

1. Chạy checker và đồng thời gõ marker
   - Expected: Checker hoàn tất `<10 s`; marker phản hồi `<1 s`; count khớp manifest; 0 pageerror

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## F — Import và OCR

### F01 — Import và OCR: Import, xem diff, chọn Append

- **Priority:** TP0
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-MD-01`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Diff đúng; thêm đúng section/content theo manifest; nội dung cũ còn nguyên

**Tiền điều kiện:** FX-MD-01

**Các bước:**

1. Import, xem diff, chọn Append
   - Expected: Diff đúng; thêm đúng section/content theo manifest; nội dung cũ còn nguyên

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F02 — Import và OCR: Import và xác nhận

- **Priority:** TP0
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-DOCX-01`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Heading/paragraph Unicode khớp manifest; warning non-blocking hiển thị đúng

**Tiền điều kiện:** FX-DOCX-01

**Các bước:**

1. Import và xác nhận
   - Expected: Heading/paragraph Unicode khớp manifest; warning non-blocking hiển thị đúng

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F03 — Import và OCR: Import và xác nhận

- **Priority:** TP0
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-PDF-01`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Text/page count khớp manifest; heading đoán có warning `heading-guessed`

**Tiền điều kiện:** FX-PDF-01

**Các bước:**

1. Import và xác nhận
   - Expected: Text/page count khớp manifest; heading đoán có warning `heading-guessed`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F04 — Import và OCR: Import riêng từng file

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-XLSX-01`, `FX-XLSX-02`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Sheet/table/merged/hidden-sheet theo oracle fixture; không trộn hai run

**Tiền điều kiện:** FX-XLSX-01 rồi FX-XLSX-02

**Các bước:**

1. Import riêng từng file
   - Expected: Sheet/table/merged/hidden-sheet theo oracle fixture; không trộn hai run

**Instances:** `F04[FX-XLSX-01]`, `F04[FX-XLSX-02]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F05 — Import và OCR: Import riêng từng file

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-PPTX-01`, `FX-PPTX-02`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Slide order/title/body/notes theo oracle fixture

**Tiền điều kiện:** FX-PPTX-01 rồi FX-PPTX-02

**Các bước:**

1. Import riêng từng file
   - Expected: Slide order/title/body/notes theo oracle fixture

**Instances:** `F05[FX-PPTX-01]`, `F05[FX-PPTX-02]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F06 — Import và OCR: Chọn Cancel ở diff

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Project hash trước/sau giống nhau; không thêm asset/snapshot rác

**Tiền điều kiện:** Bất kỳ draft import hợp lệ

**Các bước:**

1. Chọn Cancel ở diff
   - Expected: Project hash trước/sau giống nhau; không thêm asset/snapshot rác

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F07 — Import và OCR: Chọn Replace

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-MD-01`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Chỉ phạm vi được mô tả trong dialog bị thay; undo/snapshot có thể phục hồi

**Tiền điều kiện:** Project có nội dung + FX-MD-01

**Các bước:**

1. Chọn Replace
   - Expected: Chỉ phạm vi được mô tả trong dialog bị thay; undo/snapshot có thể phục hồi

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F08 — Import và OCR: Import và mở preview/check/export preview

- **Priority:** TP0
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-MD-02`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Đúng 1 placeholder; 0 request chứa `images/x.png`; không có 404/pageerror

**Tiền điều kiện:** FX-MD-02, Network log sạch

**Các bước:**

1. Import và mở preview/check/export preview
   - Expected: Đúng 1 placeholder; 0 request chứa `images/x.png`; không có 404/pageerror

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F09 — Import và OCR: Import

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-MD-03`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** 1 asset được ingest, preview hiển thị; save/reload còn ảnh

**Tiền điều kiện:** FX-MD-03

**Các bước:**

1. Import
   - Expected: 1 asset được ingest, preview hiển thị; save/reload còn ảnh

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F10 — Import và OCR: Import/chọn mapping

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-MAP-01`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** UI buộc chọn rõ file hoặc dùng quy tắc xác định; asset hash sau import khớp lựa chọn, không gắn nhầm âm thầm

**Tiền điều kiện:** FX-MAP-01

**Các bước:**

1. Import/chọn mapping
   - Expected: UI buộc chọn rõ file hoặc dùng quy tắc xác định; asset hash sau import khớp lựa chọn, không gắn nhầm âm thầm

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F11 — Import và OCR: Import

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-IMG-03`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Ảnh bị skip/placeholder với warning; phần text vẫn import; không vượt storage

**Tiền điều kiện:** FX-IMG-03 nhúng/kèm import

**Các bước:**

1. Import
   - Expected: Ảnh bị skip/placeholder với warning; phần text vẫn import; không vượt storage

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F12 — Import và OCR: Import riêng

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-IMP-05`, `FX-IMP-04`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** File đúng giới hạn không bị rule size chặn; `+1 byte` bị `file-too-large`; không treo UI

**Tiền điều kiện:** FX-IMP-05 và FX-IMP-04

**Các bước:**

1. Import riêng
   - Expected: File đúng giới hạn không bị rule size chặn; `+1 byte` bị `file-too-large`; không treo UI

**Instances:** `F12[FX-IMP-05]`, `F12[FX-IMP-04]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F13 — Import và OCR: Import riêng từng file

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-IMP-01`, `FX-IMP-02`, `FX-IMP-03`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Báo lỗi cụ thể/thân thiện; project hash không đổi; dialog đóng/Retry hoạt động

**Tiền điều kiện:** FX-IMP-01, FX-IMP-02, FX-IMP-03

**Các bước:**

1. Import riêng từng file
   - Expected: Báo lỗi cụ thể/thân thiện; project hash không đổi; dialog đóng/Retry hoạt động

**Instances:** `F13[FX-IMP-01]`, `F13[FX-IMP-02]`, `F13[FX-IMP-03]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F14 — Import và OCR: Import

- **Priority:** TP2
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-PDF-03`
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Không tự chạy OCR; scan được đánh dấu/cung cấp lựa chọn OCR

**Tiền điều kiện:** FX-PDF-03, OCR mặc định tắt

**Các bước:**

1. Import
   - Expected: Không tự chạy OCR; scan được đánh dấu/cung cấp lựa chọn OCR

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F15 — Import và OCR: Chạy OCR

- **Priority:** TP2
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-PDF-03`
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Có tiến trình; text output và số trang đạt manifest/tolerance đã ghi; OCR chạy local

**Tiền điều kiện:** FX-PDF-03, bật OCR

**Các bước:**

1. Chạy OCR
   - Expected: Có tiến trình; text output và số trang đạt manifest/tolerance đã ghi; OCR chạy local

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F16 — Import và OCR: Bấm Cancel

- **Priority:** TP2
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Worker/request dừng; UI hết loading; không áp draft nửa chừng

**Tiền điều kiện:** OCR/import đang chạy

**Các bước:**

1. Bấm Cancel
   - Expected: Worker/request dừng; UI hết loading; không áp draft nửa chừng

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F17 — Import và OCR: Chạy OCR

- **Priority:** TP2
- **Requirements:** `QA-REQ-F-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Hoạt động offline hoặc báo thiếu cache có hướng dẫn; không gọi CDN ngoài allowlist

**Tiền điều kiện:** App đã cache OCR assets rồi offline

**Các bước:**

1. Chạy OCR
   - Expected: Hoạt động offline hoặc báo thiếu cache có hướng dẫn; không gọi CDN ngoài allowlist

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F18 — Import và OCR: Import archive và theo dõi thời gian/heap

- **Priority:** TP0
- **Requirements:** `QA-REQ-F-002`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-IMP-06`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 16 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Fail nhanh với warning ổn định; không giải nén payload; UI/worker vẫn responsive.

**Tiền điều kiện:** FX-IMP-06 ZIP có compression ratio vượt policy

**Các bước:**

1. Import archive và theo dõi thời gian/heap
   - Expected: Fail nhanh với warning ổn định; không giải nén payload; UI/worker vẫn responsive.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F19 — Import và OCR: Import archive

- **Priority:** TP0
- **Requirements:** `QA-REQ-F-002`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-IMP-07`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 16 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Bị từ chối trước khi materialize output; project không đổi; không treo tab.

**Tiền điều kiện:** FX-IMP-07 ZIP vượt tổng uncompressed bytes

**Các bước:**

1. Import archive
   - Expected: Bị từ chối trước khi materialize output; project không đổi; không treo tab.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F20 — Import và OCR: Import archive

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-002`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-IMP-08`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Bị chặn theo resource policy với count thực tế và limit; cleanup đầy đủ.

**Tiền điều kiện:** FX-IMP-08 ZIP vượt entry/file count

**Các bước:**

1. Import archive
   - Expected: Bị chặn theo resource policy với count thực tế và limit; cleanup đầy đủ.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F21 — Import và OCR: Import archive

- **Priority:** TP0
- **Requirements:** `QA-REQ-F-002`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-IMP-09`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Không entry nào thoát sandbox hoặc ghi đè; import bị từ chối và project giữ nguyên.

**Tiền điều kiện:** FX-IMP-09 ZIP có path traversal và duplicate normalized path

**Các bước:**

1. Import archive
   - Expected: Không entry nào thoát sandbox hoặc ghi đè; import bị từ chối và project giữ nguyên.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F22 — Import và OCR: Chạy OCR

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-002`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-OCR-01`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** OCR bị chặn theo budget trước cấp phát lớn; UI có hướng dẫn và vẫn responsive.

**Tiền điều kiện:** FX-OCR-01 vượt page/pixel budget

**Các bước:**

1. Chạy OCR
   - Expected: OCR bị chặn theo budget trước cấp phát lớn; UI có hướng dẫn và vẫn responsive.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### F23 — Import và OCR: Cancel rồi chạy một import nhỏ hợp lệ

- **Priority:** TP1
- **Requirements:** `QA-REQ-F-002`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Worker abort sạch; không có state nửa chừng; ca nhỏ tiếp theo Pass.

**Tiền điều kiện:** Import/OCR adversarial đang chạy

**Các bước:**

1. Cancel rồi chạy một import nhỏ hợp lệ
   - Expected: Worker abort sạch; không có state nửa chừng; ca nhỏ tiếp theo Pass.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## G — Evidence Kit

### G01 — Evidence Kit: Tạo một evidence

- **Priority:** TP0
- **Requirements:** `QA-REQ-G-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, smoke, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Đúng kind/label/icon/form; lưu đúng một record; reload còn nguyên

**Tiền điều kiện:** `[mỗi evidence kind]`, URL/metadata hợp lệ cố định

**Các bước:**

1. Tạo một evidence
   - Expected: Đúng kind/label/icon/form; lưu đúng một record; reload còn nguyên

**Instances:** `G01[video]`, `G01[github]`, `G01[deploy]`, `G01[drive]`, `G01[figma]`, `G01[account]`, `G01[api-docs]`, `G01[slide]`, `G01[other]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### G02 — Evidence Kit: Submit riêng từng input

- **Priority:** TP1
- **Requirements:** `QA-REQ-G-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Input không hợp lệ bị chặn; không lưu record; message gắn đúng field

**Tiền điều kiện:** URL rỗng, text thường, `javascript:`, `data:`, URL sai host theo từng kind

**Các bước:**

1. Submit riêng từng input
   - Expected: Input không hợp lệ bị chặn; không lưu record; message gắn đúng field

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### G03 — Evidence Kit: Bật QR và quét bằng thiết bị/decoder

- **Priority:** TP1
- **Requirements:** `QA-REQ-G-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, smoke
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** QR giải mã đúng chính xác URL; không tự phát network request tới URL

**Tiền điều kiện:** Evidence URL HTTPS hợp lệ

**Các bước:**

1. Bật QR và quét bằng thiết bị/decoder
   - Expected: QR giải mã đúng chính xác URL; không tự phát network request tới URL

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### G04 — Evidence Kit: Mở appendix

- **Priority:** TP0
- **Requirements:** `QA-REQ-G-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Đủ 3 dòng đúng thứ tự; đúng 2 QR; không lộ field bí mật ngoài spec

**Tiền điều kiện:** 3 evidence, 2 bật QR

**Các bước:**

1. Mở appendix
   - Expected: Đủ 3 dòng đúng thứ tự; đúng 2 QR; không lộ field bí mật ngoài spec

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### G05 — Evidence Kit: Gắn mỗi evidence vào section khác nhau

- **Priority:** TP1
- **Requirements:** `QA-REQ-G-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Quan hệ đúng; appendix/QA prompt phản ánh đúng mapping

**Tiền điều kiện:** 2 section và 2 evidence

**Các bước:**

1. Gắn mỗi evidence vào section khác nhau
   - Expected: Quan hệ đúng; appendix/QA prompt phản ánh đúng mapping

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### G06 — Evidence Kit: Sửa title/URL

- **Priority:** TP1
- **Requirements:** `QA-REQ-G-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Danh sách, QR, appendix và mapping cập nhật; không còn URL cũ

**Tiền điều kiện:** Evidence đã gắn và bật QR

**Các bước:**

1. Sửa title/URL
   - Expected: Danh sách, QR, appendix và mapping cập nhật; không còn URL cũ

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### G07 — Evidence Kit: Xóa và xác nhận

- **Priority:** TP1
- **Requirements:** `QA-REQ-G-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Record, QR, appendix và liên kết biến mất; section/report khác không đổi

**Tiền điều kiện:** Evidence đã gắn

**Các bước:**

1. Xóa và xác nhận
   - Expected: Record, QR, appendix và liên kết biến mất; section/report khác không đổi

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### G08 — Evidence Kit: Tạo/sửa evidence và QR

- **Priority:** TP2
- **Requirements:** `QA-REQ-G-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** CRUD/QR local hoạt động; mở URL ngoài chỉ thất bại theo browser, không làm mất record

**Tiền điều kiện:** Offline

**Các bước:**

1. Tạo/sửa evidence và QR
   - Expected: CRUD/QR local hoạt động; mở URL ngoài chỉ thất bại theo browser, không làm mất record

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## H — Export HTML/PDF/DOCX

### H01 — Export HTML/PDF/DOCX: Ctrl+Shift+E

- **Priority:** TP0
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, smoke, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, artifact-sha256-open-parse

**Mục tiêu:** Export panel mở, hiện HTML/PDF/DOCX; focus vào panel đúng

**Tiền điều kiện:** Bundle sạch checker

**Các bước:**

1. Ctrl+Shift+E
   - Expected: Export panel mở, hiện HTML/PDF/DOCX; focus vào panel đúng

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H02 — Export HTML/PDF/DOCX: Xuất HTML

- **Priority:** TP0
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, smoke, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, artifact-sha256-open-parse

**Mục tiêu:** File `.html` verified; mở offline đủ nội dung; font/ảnh inline, Mermaid SVG tĩnh; CSP không cho script/CDN

**Tiền điều kiện:** Bundle sạch có KaTeX/Mermaid/ảnh

**Các bước:**

1. Xuất HTML
   - Expected: File `.html` verified; mở offline đủ nội dung; font/ảnh inline, Mermaid SVG tĩnh; CSP không cho script/CDN

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H03 — Export HTML/PDF/DOCX: Xuất DOCX

- **Priority:** TP0
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, artifact-sha256-open-parse

**Mục tiêu:** ZIP container DOCX hợp lệ; Word mở không repair; heading/table/image/layout theo manifest; artifact verified

**Tiền điều kiện:** Bundle sạch có heading/table/ảnh

**Các bước:**

1. Xuất DOCX
   - Expected: ZIP container DOCX hợp lệ; Word mở không repair; heading/table/image/layout theo manifest; artifact verified

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H04 — Export HTML/PDF/DOCX: Xuất PDF

- **Priority:** TP1
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** MIME PDF, header `%PDF-`, page/text/image theo manifest; artifact verified; renderer không lưu/log nội dung

**Tiền điều kiện:** PDF renderer ready

**Các bước:**

1. Xuất PDF
   - Expected: MIME PDF, header `%PDF-`, page/text/image theo manifest; artifact verified; renderer không lưu/log nội dung

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H05 — Export HTML/PDF/DOCX: Mở preflight và thử tiếp tục

- **Priority:** TP0
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, artifact-sha256-open-parse

**Mục tiêu:** Target bị chặn; nút bypass disabled; không download, không gọi renderer, không tạo job done

**Tiền điều kiện:** `[html,pdf,docx]`; bundle có đúng 1 checker `error`

**Các bước:**

1. Mở preflight và thử tiếp tục
   - Expected: Target bị chặn; nút bypass disabled; không download, không gọi renderer, không tạo job done

**Instances:** `H05[html]`, `H05[pdf]`, `H05[docx]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H06 — Export HTML/PDF/DOCX: Chọn “Vẫn xuất bản”

- **Priority:** TP1
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Chỉ target đã chọn được xuất; warning còn ghi nhận; artifact hợp lệ

**Tiền điều kiện:** `[html,pdf,docx]`; bundle chỉ có warning

**Các bước:**

1. Chọn “Vẫn xuất bản”
   - Expected: Chỉ target đã chọn được xuất; warning còn ghi nhận; artifact hợp lệ

**Instances:** `H06[html]`, `H06[pdf]`, `H06[docx]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H07 — Export HTML/PDF/DOCX: Print Preview local

- **Priority:** TP1
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Browser print mở; không tạo artifact/job/history

**Tiền điều kiện:** Bundle bất kỳ

**Các bước:**

1. Print Preview local
   - Expected: Browser print mở; không tạo artifact/job/history

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H08 — Export HTML/PDF/DOCX: Xem history, reload

- **Priority:** TP1
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Hai job `done` đúng target/time/file/SHA/verified; history còn sau reload

**Tiền điều kiện:** Xuất thành công HTML rồi DOCX

**Các bước:**

1. Xem history, reload
   - Expected: Hai job `done` đúng target/time/file/SHA/verified; history còn sau reload

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H09 — Export HTML/PDF/DOCX: Retry đúng job

- **Priority:** TP1
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Job cũ chuyển running→done hoặc được cập nhật theo spec; chỉ tải đúng một artifact thành công

**Tiền điều kiện:** Tạo lỗi recoverable PDF 503/504 rồi khôi phục renderer

**Các bước:**

1. Retry đúng job
   - Expected: Job cũ chuyển running→done hoặc được cập nhật theo spec; chỉ tải đúng một artifact thành công

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H10 — Export HTML/PDF/DOCX: Xuất từng target

- **Priority:** TP2
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Mỗi artifact có QR giải mã đúng URL

**Tiền điều kiện:** 1 evidence bật QR; `[html,pdf,docx]`

**Các bước:**

1. Xuất từng target
   - Expected: Mỗi artifact có QR giải mã đúng URL

**Instances:** `H10[html]`, `H10[pdf]`, `H10[docx]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H11 — Export HTML/PDF/DOCX: Xuất từng target

- **Priority:** TP1
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Tên file được slug/sanitize, đúng extension, không rỗng/path traversal

**Tiền điều kiện:** Title Unicode và các ký tự tên file bị cấm trên Windows

**Các bước:**

1. Xuất từng target
   - Expected: Tên file được slug/sanitize, đúng extension, không rỗng/path traversal

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H12 — Export HTML/PDF/DOCX: Double-click nút export

- **Priority:** TP1
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** UI ngăn duplicate ngoài ý muốn hoặc hiển thị rõ hai job theo spec; không corrupt download/history

**Tiền điều kiện:** Export đang running

**Các bước:**

1. Double-click nút export
   - Expected: UI ngăn duplicate ngoài ý muốn hoặc hiển thị rõ hai job theo spec; không corrupt download/history

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H13 — Export HTML/PDF/DOCX: Xuất PDF

- **Priority:** TP1
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Message phân biệt bận/không khả dụng/timeout, có Retry-After khi có; gợi ý Print Preview; không tạo artifact giả

**Tiền điều kiện:** Mock PDF lần lượt 429/503/504

**Các bước:**

1. Xuất PDF
   - Expected: Message phân biệt bận/không khả dụng/timeout, có Retry-After khi có; gợi ý Print Preview; không tạo artifact giả

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### H14 — Export HTML/PDF/DOCX: Tự tính SHA-256 và parse MIME/container

- **Priority:** TP1
- **Requirements:** `QA-REQ-H-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** SHA khớp metadata; byteLength >0; `verified=true` chỉ khi kiểm tra thật sự Pass

**Tiền điều kiện:** Artifact của H02–H04

**Các bước:**

1. Tự tính SHA-256 và parse MIME/container
   - Expected: SHA khớp metadata; byteLength >0; `verified=true` chỉ khi kiểm tra thật sự Pass

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## I — Nộp bài

### I01 — Nộp bài: Mở Nộp bài

- **Priority:** TP0
- **Requirements:** `QA-REQ-I-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, artifact-sha256-open-parse

**Mục tiêu:** Nhắc chạy Soát lỗi; không giả định báo cáo sạch

**Tiền điều kiện:** Chưa chạy checker

**Các bước:**

1. Mở Nộp bài
   - Expected: Nhắc chạy Soát lỗi; không giả định báo cáo sạch

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### I02 — Nộp bài: Mở checklist từng lần

- **Priority:** TP1
- **Requirements:** `QA-REQ-I-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** 79 Fail readiness; 80 Pass readiness; threshold hiển thị rõ

**Tiền điều kiện:** Checker score 79 rồi 80, không error

**Các bước:**

1. Mở checklist từng lần
   - Expected: 79 Fail readiness; 80 Pass readiness; threshold hiển thị rõ

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### I03 — Nộp bài: Đi tới bước Đóng gói

- **Priority:** TP1
- **Requirements:** `QA-REQ-I-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Checklist lịch sử Pass mục exported; có cảnh báo ZIP không kèm report

**Tiền điều kiện:** History có export done từ phiên trước, không có Blob phiên hiện tại

**Các bước:**

1. Đi tới bước Đóng gói
   - Expected: Checklist lịch sử Pass mục exported; có cảnh báo ZIP không kèm report

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### I04 — Nộp bài: Tải ZIP

- **Priority:** TP0
- **Requirements:** `QA-REQ-I-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, artifact-sha256-open-parse

**Mục tiêu:** Cho tải `<project-slug>-evidence.zip`; ZIP có README/manifest/appendix theo spec và **không** có report artifact

**Tiền điều kiện:** Không Blob phiên hiện tại, không preflight error

**Các bước:**

1. Tải ZIP
   - Expected: Cho tải `<project-slug>-evidence.zip`; ZIP có README/manifest/appendix theo spec và **không** có report artifact

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### I05 — Nộp bài: Tải ZIP

- **Priority:** TP0
- **Requirements:** `QA-REQ-I-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, artifact-sha256-open-parse

**Mục tiêu:** ZIP chứa đúng hai artifact + README/manifest/appendix; hash/file list khớp manifest

**Tiền điều kiện:** Có HTML/DOCX Blob verified trong phiên, không error

**Các bước:**

1. Tải ZIP
   - Expected: ZIP chứa đúng hai artifact + README/manifest/appendix; hash/file list khớp manifest

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### I06 — Nộp bài: Đi tiếp/tải ZIP

- **Priority:** TP0
- **Requirements:** `QA-REQ-I-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, artifact-sha256-open-parse

**Mục tiêu:** Dialog liệt kê error; “Vẫn tải xuống” disabled; không tạo download

**Tiền điều kiện:** Có checker `error`

**Các bước:**

1. Đi tiếp/tải ZIP
   - Expected: Dialog liệt kê error; “Vẫn tải xuống” disabled; không tạo download

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### I07 — Nộp bài: Xác nhận tải ZIP

- **Priority:** TP1
- **Requirements:** `QA-REQ-I-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Cho tải; ZIP hợp lệ; warning không biến thành error

**Tiền điều kiện:** Chỉ có warning

**Các bước:**

1. Xác nhận tải ZIP
   - Expected: Cho tải; ZIP hợp lệ; warning không biến thành error

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### I08 — Nộp bài: Giải nén và kiểm từng entry

- **Priority:** TP1
- **Requirements:** `QA-REQ-I-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Không path traversal/trùng tên; CRC/container hợp lệ; manifest hash khớp artifact

**Tiền điều kiện:** ZIP từ I05

**Các bước:**

1. Giải nén và kiểm từng entry
   - Expected: Không path traversal/trùng tên; CRC/container hợp lệ; manifest hash khớp artifact

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### I09 — Nộp bài: Mở Nộp bài

- **Priority:** TP1
- **Requirements:** `QA-REQ-I-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** History còn, nhưng Blob phiên trước không được giả là còn; cảnh báo xuất lại chính xác

**Tiền điều kiện:** Tạo export, reload app

**Các bước:**

1. Mở Nộp bài
   - Expected: History còn, nhưng Blob phiên trước không được giả là còn; cảnh báo xuất lại chính xác

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### I10 — Nộp bài: Tải ZIP

- **Priority:** TP2
- **Requirements:** `QA-REQ-I-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Tên ZIP an toàn, đúng suffix; entry name hợp lệ trên Windows

**Tiền điều kiện:** Project title Unicode/ký tự cấm

**Các bước:**

1. Tải ZIP
   - Expected: Tên ZIP an toàn, đúng suffix; entry name hợp lệ trên Windows

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## J — Thuyết trình

### J01 — Thuyết trình: Mở tab Present

- **Priority:** TP0
- **Requirements:** `QA-REQ-J-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, artifact-sha256-open-parse

**Mục tiêu:** Panel mở, không tự sửa report

**Tiền điều kiện:** Project có 5 section

**Các bước:**

1. Mở tab Present
   - Expected: Panel mở, không tự sửa report

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### J02 — Thuyết trình: Sinh outline

- **Priority:** TP0
- **Requirements:** `QA-REQ-J-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, artifact-sha256-open-parse

**Mục tiêu:** Số/thứ tự/title/bullet slide khớp manifest quy tắc

**Tiền điều kiện:** 5 section có heading/bullet cố định

**Các bước:**

1. Sinh outline
   - Expected: Số/thứ tự/title/bullet slide khớp manifest quy tắc

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### J03 — Thuyết trình: Phân công/timeline

- **Priority:** TP1
- **Requirements:** `QA-REQ-J-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Mọi slide có owner hợp lệ; tổng duration khớp; không trùng/mất slide

**Tiền điều kiện:** 2 speaker, 6 slide, tổng thời lượng cố định

**Các bước:**

1. Phân công/timeline
   - Expected: Mọi slide có owner hợp lệ; tổng duration khớp; không trùng/mất slide

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### J04 — Thuyết trình: Sinh/xem script

- **Priority:** TP1
- **Requirements:** `QA-REQ-J-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Mỗi slide có script đúng liên kết; sửa/lưu/reload không mất

**Tiền điều kiện:** Outline cố định

**Các bước:**

1. Sinh/xem script
   - Expected: Mỗi slide có script đúng liên kết; sửa/lưu/reload không mất

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### J05 — Thuyết trình: Sinh Q&A

- **Priority:** TP1
- **Requirements:** `QA-REQ-J-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Có danh sách không rỗng, liên kết section hợp lệ, không render HTML độc

**Tiền điều kiện:** Report fixture cố định

**Các bước:**

1. Sinh Q&A
   - Expected: Có danh sách không rỗng, liên kết section hợp lệ, không render HTML độc

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### J06 — Thuyết trình: Chạy Mock Defense

- **Priority:** TP1
- **Requirements:** `QA-REQ-J-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Điều hướng câu hỏi/đáp án/kết thúc phiên đúng; không mất dữ liệu Present

**Tiền điều kiện:** Q&A fixture

**Các bước:**

1. Chạy Mock Defense
   - Expected: Điều hướng câu hỏi/đáp án/kết thúc phiên đúng; không mất dữ liệu Present

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### J07 — Thuyết trình: Chạy weak-sections

- **Priority:** TP1
- **Requirements:** `QA-REQ-J-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Chỉ ra đúng section theo rule/threshold hiện hành

**Tiền điều kiện:** Một section rỗng, một section ngắn, một section đủ

**Các bước:**

1. Chạy weak-sections
   - Expected: Chỉ ra đúng section theo rule/threshold hiện hành

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### J08 — Thuyết trình: Xuất PPTX

- **Priority:** TP0
- **Requirements:** `QA-REQ-J-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, artifact-sha256-open-parse

**Mục tiêu:** Container PPTX hợp lệ; PowerPoint mở không repair; slide order/text/notes đúng; artifact verified

**Tiền điều kiện:** Slide + speaker + script

**Các bước:**

1. Xuất PPTX
   - Expected: Container PPTX hợp lệ; PowerPoint mở không repair; slide order/text/notes đúng; artifact verified

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### J09 — Thuyết trình: Xuất PPTX

- **Priority:** TP1
- **Requirements:** `QA-REQ-J-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Báo chưa có nội dung slide; không download/job done

**Tiền điều kiện:** Không có slide

**Các bước:**

1. Xuất PPTX
   - Expected: Báo chưa có nội dung slide; không download/job done

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### J10 — Thuyết trình: Xuất PPTX

- **Priority:** TP1
- **Requirements:** `QA-REQ-J-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, artifact-sha256-open-parse

**Mục tiêu:** Vẫn xuất thành công; lỗi thân báo cáo không chặn PPTX

**Tiền điều kiện:** Report có checker `error`, slide hợp lệ

**Các bước:**

1. Xuất PPTX
   - Expected: Vẫn xuất thành công; lỗi thân báo cáo không chặn PPTX

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## K — Command Palette và shortcut

### K01 — Command Palette và shortcut: Ctrl+K

- **Priority:** TP0
- **Requirements:** `QA-REQ-K-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Palette mở; focus vào search; Escape đóng và trả focus

**Tiền điều kiện:** Focus ngoài input/editor

**Các bước:**

1. Ctrl+K
   - Expected: Palette mở; focus vào search; Escape đóng và trả focus

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### K02 — Command Palette và shortcut: Tìm soat loi, SOÁT LỖI, xem truoc, nop bai

- **Priority:** TP1
- **Requirements:** `QA-REQ-K-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Kết quả normalize bỏ dấu/case đúng, không hiện command ngoài match

**Tiền điều kiện:** Palette mở

**Các bước:**

1. Tìm `soat loi`, `SOÁT LỖI`, `xem truoc`, `nop bai`
   - Expected: Kết quả normalize bỏ dấu/case đúng, không hiện command ngoài match

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### K03 — Command Palette và shortcut: Chạy bằng chuột/Enter

- **Priority:** TP1
- **Requirements:** `QA-REQ-K-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Đúng một handler chạy; state/navigation đúng; palette đóng hợp lý

**Tiền điều kiện:** `[mỗi Command Palette ID]`, state riêng

**Các bước:**

1. Chạy bằng chuột/Enter
   - Expected: Đúng một handler chạy; state/navigation đúng; palette đóng hợp lý

**Instances:** `K03[create-section]`, `K03[duplicate-section]`, `K03[move-section-up]`, `K03[move-section-down]`, `K03[save-draft]`, `K03[import-markdown]`, `K03[create-report]`, `K03[run-check]`, `K03[open-preview]`, `K03[toggle-focus-mode]`, `K03[open-export]`, `K03[open-ai-settings]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### K04 — Command Palette và shortcut: Chạy riêng từng tổ hợp ở workspace

- **Priority:** TP0
- **Requirements:** `QA-REQ-K-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Đúng một hành vi theo command; ngăn default browser khi cần; không lặp do key repeat

**Tiền điều kiện:** `[Ctrl+S, Ctrl+Shift+N, Ctrl+Shift+D, Alt+Up, Alt+Down, Ctrl+Enter, Ctrl+P, Ctrl+Shift+F, Ctrl+Shift+E]`

**Các bước:**

1. Chạy riêng từng tổ hợp ở workspace
   - Expected: Đúng một hành vi theo command; ngăn default browser khi cần; không lặp do key repeat

**Instances:** `K04[Ctrl+S]`, `K04[Ctrl+Shift+N]`, `K04[Ctrl+Shift+D]`, `K04[Alt+Up]`, `K04[Alt+Down]`, `K04[Ctrl+Enter]`, `K04[Ctrl+P]`, `K04[Ctrl+Shift+F]`, `K04[Ctrl+Shift+E]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### K05 — Command Palette và shortcut: Ctrl+K

- **Priority:** TP1
- **Requirements:** `QA-REQ-K-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Chèn/toggle Markdown link theo editor keymap; không mở Palette

**Tiền điều kiện:** Focus trong CodeMirror, có selection

**Các bước:**

1. Ctrl+K
   - Expected: Chèn/toggle Markdown link theo editor keymap; không mở Palette

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### K06 — Command Palette và shortcut: Ctrl+K và shortcut workspace

- **Priority:** TP1
- **Requirements:** `QA-REQ-K-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Không phá nội dung input; global shortcut bị bỏ qua theo context

**Tiền điều kiện:** Focus ngoài CodeMirror nhưng trong input/dialog

**Các bước:**

1. Ctrl+K và shortcut workspace
   - Expected: Không phá nội dung input; global shortcut bị bỏ qua theo context

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### K07 — Command Palette và shortcut: Chạy riêng trên selection rỗng/có text

- **Priority:** TP1
- **Requirements:** `QA-REQ-K-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Markdown/snippet/search/heading đúng; selection/cursor hợp lý; Undo được

**Tiền điều kiện:** `[Ctrl+B, Ctrl+I, Ctrl+Backtick, Ctrl+Shift+C/T/M/Q, Ctrl+H, Ctrl+Alt+1/2/3]`

**Các bước:**

1. Chạy riêng trên selection rỗng/có text
   - Expected: Markdown/snippet/search/heading đúng; selection/cursor hợp lý; Undo được

**Instances:** `K07[Ctrl+B]`, `K07[Ctrl+I]`, `K07[Ctrl+Backtick]`, `K07[Ctrl+Shift+C]`, `K07[Ctrl+Shift+T]`, `K07[Ctrl+Shift+M]`, `K07[Ctrl+Shift+Q]`, `K07[Ctrl+H]`, `K07[Ctrl+Alt+1]`, `K07[Ctrl+Alt+2]`, `K07[Ctrl+Alt+3]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## L — Persistence, recovery, offline và PWA

### L01 — Persistence, recovery, offline và PWA: Reload 5 lần và đóng/mở browser

- **Priority:** TP0
- **Requirements:** `QA-REQ-L-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Hash dữ liệu nghiệp vụ không đổi; không nhân đôi record

**Tiền điều kiện:** Project có text/assets/evidence/present state

**Các bước:**

1. Reload 5 lần và đóng/mở browser
   - Expected: Hash dữ liệu nghiệp vụ không đổi; không nhân đôi record

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### L02 — Persistence, recovery, offline và PWA: Ẩn tab/đóng tab ngay

- **Priority:** TP0
- **Requirements:** `QA-REQ-L-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Flush pending save; lần mở sau có thay đổi cuối

**Tiền điều kiện:** Thay đổi trong cửa sổ autosave 2 giây

**Các bước:**

1. Ẩn tab/đóng tab ngay
   - Expected: Flush pending save; lần mở sau có thay đổi cuối

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### L03 — Persistence, recovery, offline và PWA: Sửa khác nhau và lưu xen kẽ

- **Priority:** TP1
- **Requirements:** `QA-REQ-L-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Không mất dữ liệu âm thầm: phải phát hiện conflict hoặc có quy tắc last-write rõ và cảnh báo; ghi bug nếu silent overwrite

**Tiền điều kiện:** Hai tab cùng project

**Các bước:**

1. Sửa khác nhau và lưu xen kẽ
   - Expected: Không mất dữ liệu âm thầm: phải phát hiện conflict hoặc có quy tắc last-write rõ và cảnh báo; ghi bug nếu silent overwrite

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### L04 — Persistence, recovery, offline và PWA: Sửa project

- **Priority:** TP1
- **Requirements:** `QA-REQ-L-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** UI báo quota, giữ draft trong memory, không nhân bản full bundle vào recovery; Retry hoạt động khi giải phóng quota

**Tiền điều kiện:** Mô phỏng `QuotaExceededError`

**Các bước:**

1. Sửa project
   - Expected: UI báo quota, giữ draft trong memory, không nhân bản full bundle vào recovery; Retry hoạt động khi giải phóng quota

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### L05 — Persistence, recovery, offline và PWA: Offline rồi soạn/check/xuất HTML/DOCX

- **Priority:** TP0
- **Requirements:** `QA-REQ-L-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** playwright:e2e/templates-and-offline.spec.ts
- **Evidence:** screenshot, console-network-log

**Mục tiêu:** Các chức năng client-side hoạt động; dữ liệu lưu; không gọi AI/PDF âm thầm

**Tiền điều kiện:** App đã online ít nhất một lần

**Các bước:**

1. Offline rồi soạn/check/xuất HTML/DOCX
   - Expected: Các chức năng client-side hoạt động; dữ liệu lưu; không gọi AI/PDF âm thầm

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### L06 — Persistence, recovery, offline và PWA: Đóng app khi offline rồi mở lại

- **Priority:** TP1
- **Requirements:** `QA-REQ-L-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** playwright:e2e/templates-and-offline.spec.ts
- **Evidence:** actual-result

**Mục tiêu:** Shell/route tải từ cache; project còn; trạng thái offline rõ

**Tiền điều kiện:** Route đã cache

**Các bước:**

1. Đóng app khi offline rồi mở lại
   - Expected: Shell/route tải từ cache; project còn; trạng thái offline rõ

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### L07 — Persistence, recovery, offline và PWA: Offline và mở URL

- **Priority:** TP1
- **Requirements:** `QA-REQ-L-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** playwright:e2e/templates-and-offline.spec.ts
- **Evidence:** actual-result

**Mục tiêu:** Hiển thị offline fallback/không khả dụng có hướng dẫn; không màn trắng

**Tiền điều kiện:** Profile mới chưa từng vào app

**Các bước:**

1. Offline và mở URL
   - Expected: Hiển thị offline fallback/không khả dụng có hướng dẫn; không màn trắng

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### L08 — Persistence, recovery, offline và PWA: Cài PWA, mở standalone

- **Priority:** TP1
- **Requirements:** `QA-REQ-L-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Cài/mở được; icon/name/start URL đúng; dữ liệu cùng origin còn

**Tiền điều kiện:** HTTPS/localhost, manifest hợp lệ

**Các bước:**

1. Cài PWA, mở standalone
   - Expected: Cài/mở được; icon/name/start URL đúng; dữ liệu cùng origin còn

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### L09 — Persistence, recovery, offline và PWA: Chọn cập nhật

- **Priority:** TP1
- **Requirements:** `QA-REQ-L-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** App flush autosave trước reload; bản mới mở với draft nguyên vẹn

**Tiền điều kiện:** Có draft chưa autosave và SW update chờ

**Các bước:**

1. Chọn cập nhật
   - Expected: App flush autosave trước reload; bản mới mở với draft nguyên vẹn

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### L10 — Persistence, recovery, offline và PWA: Nạp từng DB cũ rồi mở app

- **Priority:** TP2
- **Requirements:** `QA-REQ-L-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-REC-01`
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Migration lên v4; record count/hash theo manifest; migration idempotent khi reload

**Tiền điều kiện:** `[FX-REC-01,02,03]`

**Các bước:**

1. Nạp từng DB cũ rồi mở app
   - Expected: Migration lên v4; record count/hash theo manifest; migration idempotent khi reload

**Instances:** `L10[FX-REC-01]`, `L10[FX-REC-02]`, `L10[FX-REC-03]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### L11 — Persistence, recovery, offline và PWA: Mở và thao tác Recovery Center

- **Priority:** TP2
- **Requirements:** `QA-REQ-L-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-REC-04`
- **Suites:** full
- **Estimated / timeout:** 5 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result

**Mục tiêu:** Khôi phục/loại bỏ độc lập, không crash hoặc ảnh hưởng project lành

**Tiền điều kiện:** FX-REC-04

**Các bước:**

1. Mở và thao tác Recovery Center
   - Expected: Khôi phục/loại bỏ độc lập, không crash hoặc ảnh hưởng project lành

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## M — Responsive, accessibility, privacy và performance

### M01 — Responsive, accessibility, privacy và performance: Thực hiện tạo/chọn section, mở drawer/panel, save/check

- **Priority:** TP0
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-R1`
- **Fixtures:** Không
- **Suites:** full, smoke, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, environment-version

**Mục tiêu:** Không overflow ngang ngoài vùng chủ đích; control không che nhau; thao tác chính dùng được

**Tiền điều kiện:** `[320×568, 375×667, 768×1024]`

**Các bước:**

1. Thực hiện tạo/chọn section, mở drawer/panel, save/check
   - Expected: Không overflow ngang ngoài vùng chủ đích; control không che nhau; thao tác chính dùng được

**Instances:** `M01[320x568]`, `M01[375x667]`, `M01[768x1024]`

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M02 — Responsive, accessibility, privacy và performance: Tap, scroll, mở/đóng drawer, reorder nếu hỗ trợ touch

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-M1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, environment-version

**Mục tiêu:** Touch target dùng được; không kẹt scroll; orientation change không mất state

**Tiền điều kiện:** Android thật portrait/landscape

**Các bước:**

1. Tap, scroll, mở/đóng drawer, reorder nếu hỗ trợ touch
   - Expected: Touch target dùng được; không kẹt scroll; orientation change không mất state

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M03 — Responsive, accessibility, privacy và performance: Bật Dark mode, đi qua mọi panel, reload

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, smoke
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, environment-version

**Mục tiêu:** Theme áp dụng nhất quán và persist; CodeMirror selection/active line/readability đạt contrast

**Tiền điều kiện:** Light mode

**Các bước:**

1. Bật Dark mode, đi qua mọi panel, reload
   - Expected: Theme áp dụng nhất quán và persist; CodeMirror selection/active line/readability đạt contrast

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M04 — Responsive, accessibility, privacy và performance: Tab/Shift+Tab/Enter/Space/Escape qua Library, Workspace, dialog, tabs

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, environment-version

**Mục tiêu:** Thứ tự focus hợp lý; focus ring rõ; modal trap và trả focus đúng; không keyboard trap

**Tiền điều kiện:** Keyboard only

**Các bước:**

1. Tab/Shift+Tab/Enter/Space/Escape qua Library, Workspace, dialog, tabs
   - Expected: Thứ tự focus hợp lý; focus ring rõ; modal trap và trả focus đúng; không keyboard trap

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M05 — Responsive, accessibility, privacy và performance: Chạy axe automated

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, environment-version

**Mục tiêu:** Không có violation serious/critical; violation còn lại được triage, không bỏ qua âm thầm

**Tiền điều kiện:** Các route/panel chính

**Các bước:**

1. Chạy axe automated
   - Expected: Không có violation serious/critical; violation còn lại được triage, không bỏ qua âm thầm

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M06 — Responsive, accessibility, privacy và performance: Dùng screen reader cơ bản

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, environment-version

**Mục tiêu:** Label/name/role đúng; thay đổi quan trọng có live announcement; icon-only button có accessible name

**Tiền điều kiện:** Dialog/toast/progress/checker

**Các bước:**

1. Dùng screen reader cơ bản
   - Expected: Label/name/role đúng; thay đổi quan trọng có live announcement; icon-only button có accessible name

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M07 — Responsive, accessibility, privacy và performance: Preview, appendix, HTML export

- **Priority:** TP0
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-MD-04`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, environment-version

**Mục tiêu:** Không script/event/javascript URL nào thực thi; nội dung nguy hiểm bị sanitize/escape; app vẫn hoạt động

**Tiền điều kiện:** FX-MD-04 nhập qua editor và import

**Các bước:**

1. Preview, appendix, HTML export
   - Expected: Không script/event/javascript URL nào thực thi; nội dung nguy hiểm bị sanitize/escape; app vẫn hoạt động

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M08 — Responsive, accessibility, privacy và performance: Lưu, QR, appendix, export

- **Priority:** TP0
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, environment-version

**Mục tiêu:** Payload không thực thi; URL scheme nguy hiểm bị chặn; QR không chứa URL đã bị từ chối

**Tiền điều kiện:** Evidence URL và metadata có payload XSS

**Các bước:**

1. Lưu, QR, appendix, export
   - Expected: Payload không thực thi; URL scheme nguy hiểm bị chặn; QR không chứa URL đã bị từ chối

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M09 — Responsive, accessibility, privacy và performance: Mở từng surface

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, environment-version

**Mục tiêu:** Mỗi surface có placeholder; 0 request ref, 0 HTTP 404, 0 pageerror

**Tiền điều kiện:** Broken ref tại Preview, ImportPreview, export preparation

**Các bước:**

1. Mở từng surface
   - Expected: Mỗi surface có placeholder; 0 request ref, 0 HTTP 404, 0 pageerror

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M10 — Responsive, accessibility, privacy và performance: Chọn file hợp lệ

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, environment-version

**Mục tiêu:** Ref được rewrite đúng; placeholder biến mất; ảnh persist; checker issue tương ứng biến mất

**Tiền điều kiện:** Placeholder có action Gắn ảnh

**Các bước:**

1. Chọn file hợp lệ
   - Expected: Ref được rewrite đúng; placeholder biến mất; ảnh persist; checker issue tương ứng biến mất

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M11 — Responsive, accessibility, privacy và performance: Theo dõi Network/storage/log trong phiên thường, AI và PDF

- **Priority:** TP0
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, environment-version

**Mục tiêu:** Phiên thường không gửi marker; AI chỉ gửi nội dung yêu cầu qua `/api/ai`; PDF chỉ gửi HTML qua `/api/pdf`; key marker không xuất hiện ở nơi cấm

**Tiền điều kiện:** Marker nội dung và marker key riêng biệt

**Các bước:**

1. Theo dõi Network/storage/log trong phiên thường, AI và PDF
   - Expected: Phiên thường không gửi marker; AI chỉ gửi nội dung yêu cầu qua `/api/ai`; PDF chỉ gửi HTML qua `/api/pdf`; key marker không xuất hiện ở nơi cấm

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M12 — Responsive, accessibility, privacy và performance: Chạy e2e/workspace-performance.spec.ts

- **Priority:** TP0
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-PERF-S`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** playwright:e2e/workspace-performance.spec.ts
- **Evidence:** screenshot, console-network-log, environment-version

**Mục tiêu:** Editor-ready `<6000 ms`, input→preview `<1500 ms`, long-task total `<2500 ms`, 0 worker error

**Tiền điều kiện:** FX-PERF-S, production

**Các bước:**

1. Chạy `e2e/workspace-performance.spec.ts`
   - Expected: Editor-ready `<6000 ms`, input→preview `<1500 ms`, long-task total `<2500 ms`, 0 worker error

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M13 — Responsive, accessibility, privacy và performance: Chạy cùng performance spec

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-PERF-L`
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** playwright:e2e/workspace-performance.spec.ts
- **Evidence:** actual-result, environment-version

**Mục tiêu:** Editor-ready `<9000 ms`, input→preview `<3000 ms`, long-task total `<4500 ms`, 0 worker error

**Tiền điều kiện:** FX-PERF-L, production

**Các bước:**

1. Chạy cùng performance spec
   - Expected: Editor-ready `<9000 ms`, input→preview `<3000 ms`, long-task total `<4500 ms`, 0 worker error

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M14 — Responsive, accessibility, privacy và performance: Chạy npm run perf:collect và npm run check:bundle

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** script:scripts/check-bundle-budget.mjs
- **Evidence:** actual-result, environment-version

**Mục tiêu:** Library initial `<=200 KiB`, Workspace initial `<=200 KiB`, editor-ready critical transitive `<=650 KiB`; không chấp nhận `UNMEASURED` trong CI

**Tiền điều kiện:** Production performance artifact

**Các bước:**

1. Chạy `npm run perf:collect` và `npm run check:bundle`
   - Expected: Library initial `<=200 KiB`, Workspace initial `<=200 KiB`, editor-ready critical transitive `<=650 KiB`; không chấp nhận `UNMEASURED` trong CI

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M15 — Responsive, accessibility, privacy và performance: Mở Snapshot History sau từng hành động

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, environment-version

**Mục tiêu:** Mỗi hành động có/không có snapshot đúng policy; không tạo snapshot do chỉ gõ/save thông thường

**Tiền điều kiện:** Thực hiện riêng add/delete/replace/import/AI destructive

**Các bước:**

1. Mở Snapshot History sau từng hành động
   - Expected: Mỗi hành động có/không có snapshot đúng policy; không tạo snapshot do chỉ gõ/save thông thường

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M16 — Responsive, accessibility, privacy và performance: Restore

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-001`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, environment-version

**Mục tiêu:** Nội dung/section/asset theo snapshot trở lại; state mới không bị trộn; có thể tiếp tục chỉnh sửa/lưu

**Tiền điều kiện:** Snapshot có hash biết trước

**Các bước:**

1. Restore
   - Expected: Nội dung/section/asset theo snapshot trở lại; state mới không bị trộn; có thể tiếp tục chỉnh sửa/lưu

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M17 — Responsive, accessibility, privacy và performance: Preview mặc định, cấp consent, sau đó hủy/revoke

- **Priority:** TP0
- **Requirements:** `QA-REQ-M-002`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-MD-05`
- **Suites:** full, critical
- **Estimated / timeout:** 10 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, environment-version

**Mục tiêu:** Mặc định không request; consent mới tải với no-referrer; revoke/cancel không tạo request muộn.

**Tiền điều kiện:** FX-MD-05 có ảnh remote và Network log sạch

**Các bước:**

1. Preview mặc định, cấp consent, sau đó hủy/revoke
   - Expected: Mặc định không request; consent mới tải với no-referrer; revoke/cancel không tạo request muộn.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M18 — Responsive, accessibility, privacy và performance: Mở các route chính và kiểm CSP header/nonce

- **Priority:** TP0
- **Requirements:** `QA-REQ-M-002`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, environment-version

**Mục tiêu:** Không unsafe-inline ngoài policy; nonce hợp lệ; app hoạt động; payload inline trái phép không chạy.

**Tiền điều kiện:** Production build

**Các bước:**

1. Mở các route chính và kiểm CSP header/nonce
   - Expected: Không unsafe-inline ngoài policy; nonce hợp lệ; app hoạt động; payload inline trái phép không chạy.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M19 — Responsive, accessibility, privacy và performance: Preview, import và export HTML/PDF

- **Priority:** TP0
- **Requirements:** `QA-REQ-M-002`
- **Environment:** `ENV-D1`
- **Fixtures:** `FX-MD-06`
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, environment-version

**Mục tiêu:** ID được prefix; sink sau plugin vẫn sanitize; payload không thực thi.

**Tiền điều kiện:** FX-MD-06 có DOM-clobbering/plugin payload

**Các bước:**

1. Preview, import và export HTML/PDF
   - Expected: ID được prefix; sink sau plugin vẫn sanitize; payload không thực thi.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### M20 — Responsive, accessibility, privacy và performance: Kiểm storage, Clear data, backup/export và privacy copy

- **Priority:** TP1
- **Requirements:** `QA-REQ-M-003`
- **Environment:** `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, environment-version

**Mục tiêu:** UI mô tả đúng plaintext local boundary; clear xóa đúng phạm vi; export không chứa field ngoài spec.

**Tiền điều kiện:** Project có dữ liệu nhạy cảm giả lập

**Các bước:**

1. Kiểm storage, Clear data, backup/export và privacy copy
   - Expected: UI mô tả đúng plaintext local boundary; clear xóa đúng phạm vi; export không chứa field ngoài spec.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## N — Server và API security

### N01 — Server và API security: Chạy production config checker cho cả hai fixture

- **Priority:** TP0
- **Requirements:** `QA-REQ-N-001`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** script:scripts/check-production-config.mjs
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Valid Pass; invalid fail-closed và nêu tên biến thiếu mà không lộ giá trị.

**Tiền điều kiện:** Production config fixtures valid và invalid

**Các bước:**

1. Chạy production config checker cho cả hai fixture
   - Expected: Valid Pass; invalid fail-closed và nêu tên biến thiếu mà không lộ giá trị.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### N02 — Server và API security: Gửi request qua trusted và untrusted ingress

- **Priority:** TP0
- **Requirements:** `QA-REQ-N-002`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** vitest:src/lib/server/rate-limit.test.ts
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Chỉ trusted chain ảnh hưởng canonical client identity; spoof trực tiếp bị bỏ qua.

**Tiền điều kiện:** Spoofed forwarding header matrix

**Các bước:**

1. Gửi request qua trusted và untrusted ingress
   - Expected: Chỉ trusted chain ảnh hưởng canonical client identity; spoof trực tiếp bị bỏ qua.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### N03 — Server và API security: Đổi IP/key độc lập và vượt từng quota

- **Priority:** TP0
- **Requirements:** `QA-REQ-N-002`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Limiter IP và key độc lập, dùng shared state; xoay một vế không né được quota.

**Tiền điều kiện:** Hai app instance dùng Redis test

**Các bước:**

1. Đổi IP/key độc lập và vượt từng quota
   - Expected: Limiter IP và key độc lập, dùng shared state; xoay một vế không né được quota.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### N04 — Server và API security: Gọi AI/PDF qua các instance

- **Priority:** TP0
- **Requirements:** `QA-REQ-N-002`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Production fail-closed với public error ổn định; không fallback local âm thầm.

**Tiền điều kiện:** Production Redis unavailable

**Các bước:**

1. Gọi AI/PDF qua các instance
   - Expected: Production fail-closed với public error ổn định; không fallback local âm thầm.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### N05 — Server và API security: Dùng từng ticket gọi PDF gateway

- **Priority:** TP0
- **Requirements:** `QA-REQ-N-003`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Chỉ ticket hợp lệ dùng một lần được chấp nhận; expiry/replay bị từ chối.

**Tiền điều kiện:** PDF ticket hợp lệ, hết hạn và replay

**Các bước:**

1. Dùng từng ticket gọi PDF gateway
   - Expected: Chỉ ticket hợp lệ dùng một lần được chấp nhận; expiry/replay bị từ chối.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### N06 — Server và API security: Gửi same-site, cross-site và thiếu metadata

- **Priority:** TP0
- **Requirements:** `QA-REQ-N-003`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** vitest:src/app/api/pdf/__security__/pdf-access.fuzz.test.ts
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Access policy đúng; defense-in-depth không thay authentication; renderer không bị gọi khi reject.

**Tiền điều kiện:** Origin/Fetch Metadata/admission matrix

**Các bước:**

1. Gửi same-site, cross-site và thiếu metadata
   - Expected: Access policy đúng; defense-in-depth không thay authentication; renderer không bị gọi khi reject.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### N07 — Server và API security: Gọi renderer cho từng token

- **Priority:** TP0
- **Requirements:** `QA-REQ-N-003`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Missing/invalid bị từ chối timing-safe; valid tiếp tục; không log token.

**Tiền điều kiện:** Renderer token missing/invalid/valid

**Các bước:**

1. Gọi renderer cho từng token
   - Expected: Missing/invalid bị từ chối timing-safe; valid tiếp tục; không log token.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### N08 — Server và API security: Chạy bounded fuzz cho frame, requestId, delta và no-newline tail

- **Priority:** TP0
- **Requirements:** `QA-REQ-N-004`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** vitest:src/app/api/ai/__security__/ai-stream-bounds.fuzz.test.ts
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Parser bounded, output deterministic, public error generic và không echo dữ liệu.

**Tiền điều kiện:** AI stream fragmentation/oversize corpus

**Các bước:**

1. Chạy bounded fuzz cho frame, requestId, delta và no-newline tail
   - Expected: Parser bounded, output deterministic, public error generic và không echo dữ liệu.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### N09 — Server và API security: Đọc chậm, abort, disconnect và timeout

- **Priority:** TP0
- **Requirements:** `QA-REQ-N-004`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Backpressure/abort propagation đúng; buffer không tăng vô hạn; resource được giải phóng.

**Tiền điều kiện:** Slow client/provider và abort fixture

**Các bước:**

1. Đọc chậm, abort, disconnect và timeout
   - Expected: Backpressure/abort propagation đúng; buffer không tăng vô hạn; resource được giải phóng.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### N10 — Server và API security: Chạy AI/PDF success và error rồi thu log

- **Priority:** TP0
- **Requirements:** `QA-REQ-N-005`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Log chỉ có cause code/aggregate; không chứa marker nội dung hoặc credential.

**Tiền điều kiện:** Marker riêng cho key, prompt, HTML và tài liệu

**Các bước:**

1. Chạy AI/PDF success và error rồi thu log
   - Expected: Log chỉ có cause code/aggregate; không chứa marker nội dung hoặc credential.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### N11 — Server và API security: Gọi diagnostics

- **Priority:** TP1
- **Requirements:** `QA-REQ-N-005`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, machine-readable-security-evidence

**Mục tiêu:** Chỉ valid token nhận operator detail; response không chứa nội dung tài liệu/key.

**Tiền điều kiện:** Operator token missing/invalid/valid

**Các bước:**

1. Gọi diagnostics
   - Expected: Chỉ valid token nhận operator detail; response không chứa nội dung tài liệu/key.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### N12 — Server và API security: Gọi public ready và operator diagnostics

- **Priority:** TP0
- **Requirements:** `QA-REQ-N-005`
- **Environment:** `ENV-CI`, `ENV-D1`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Public response generic; operator response phân biệt cause; không lộ topology/secrets.

**Tiền điều kiện:** Ready/degraded/unready service states

**Các bước:**

1. Gọi public ready và operator diagnostics
   - Expected: Public response generic; operator response phân biệt cause; không lộ topology/secrets.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

## O — Supply-chain và release evidence

### O01 — Supply-chain và release evidence: Chạy CI action pin checker

- **Priority:** TP0
- **Requirements:** `QA-REQ-O-001`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** script:scripts/check-ci-actions.mjs
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Mọi external action pin full commit SHA; mutable tag bị từ chối.

**Tiền điều kiện:** Workflow hiện tại

**Các bước:**

1. Chạy CI action pin checker
   - Expected: Mọi external action pin full commit SHA; mutable tag bị từ chối.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### O02 — Supply-chain và release evidence: Chạy production audit cả hai workspace

- **Priority:** TP0
- **Requirements:** `QA-REQ-O-001`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Audit gate fail khi có vulnerability actionable; JSON evidence luôn được lưu.

**Tiền điều kiện:** Root và renderer lockfiles

**Các bước:**

1. Chạy production audit cả hai workspace
   - Expected: Audit gate fail khi có vulnerability actionable; JSON evidence luôn được lưu.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### O03 — Supply-chain và release evidence: Resolve digest, sinh SBOM và scan

- **Priority:** TP0
- **Requirements:** `QA-REQ-O-002`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** SBOM/scan cùng exact digest với image được integration test.

**Tiền điều kiện:** PDF image build một lần

**Các bước:**

1. Resolve digest, sinh SBOM và scan
   - Expected: SBOM/scan cùng exact digest với image được integration test.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### O04 — Supply-chain và release evidence: Chạy vulnerability gate

- **Priority:** TP0
- **Requirements:** `QA-REQ-O-002`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Fixable Critical/High chặn CI; unfixed vẫn hiện đầy đủ trong evidence.

**Tiền điều kiện:** Trivy report có fixed/unfixed findings

**Các bước:**

1. Chạy vulnerability gate
   - Expected: Fixable Critical/High chặn CI; unfixed vẫn hiện đầy đủ trong evidence.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### O05 — Supply-chain và release evidence: Chạy isolation integration profile

- **Priority:** TP0
- **Requirements:** `QA-REQ-O-003`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** script:scripts/test-pdf-integration.mjs
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Read-only/tmpfs/no-new-privileges, JS-off, egress blocked, caps/deadline và admission đều được chứng minh.

**Tiền điều kiện:** Docker renderer image

**Các bước:**

1. Chạy isolation integration profile
   - Expected: Read-only/tmpfs/no-new-privileges, JS-off, egress blocked, caps/deadline và admission đều được chứng minh.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### O06 — Supply-chain và release evidence: Chạy canonical coverage, fuzz và repeated loop

- **Priority:** TP1
- **Requirements:** `QA-REQ-O-003`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, machine-readable-security-evidence

**Mục tiêu:** Threshold đạt; unexpected stderr/flaky result làm gate fail.

**Tiền điều kiện:** Coverage/fuzz/flake configuration

**Các bước:**

1. Chạy canonical coverage, fuzz và repeated loop
   - Expected: Threshold đạt; unexpected stderr/flaky result làm gate fail.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### O07 — Supply-chain và release evidence: Kiểm schema, owner, reviewBy và exitCondition

- **Priority:** TP0
- **Requirements:** `QA-REQ-O-004`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** script:scripts/check-supply-chain.mjs
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Waiver thiếu/sai/hết hạn chặn gate; không có bypass ngầm.

**Tiền điều kiện:** Security waiver registry

**Các bước:**

1. Kiểm schema, owner, reviewBy và exitCondition
   - Expected: Waiver thiếu/sai/hết hạn chặn gate; không có bypass ngầm.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### O08 — Supply-chain và release evidence: Sinh release-evidence manifest strict

- **Priority:** TP0
- **Requirements:** `QA-REQ-O-004`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** script:scripts/generate-release-evidence.mjs
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Manifest liên kết commit, lockfiles, image, SBOM, scan, audit, QA plan/catalog/fixture và bundle hashes.

**Tiền điều kiện:** Toàn bộ machine artifacts sẵn sàng

**Các bước:**

1. Sinh release-evidence manifest strict
   - Expected: Manifest liên kết commit, lockfiles, image, SBOM, scan, audit, QA plan/catalog/fixture và bundle hashes.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### O09 — Supply-chain và release evidence: Chạy canonical GitHub Actions workflow

- **Priority:** TP0
- **Requirements:** `QA-REQ-O-004`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Mọi lane Pass trên đúng commit; evidence upload kể cả khi failure.

**Tiền điều kiện:** Exact release commit

**Các bước:**

1. Chạy canonical GitHub Actions workflow
   - Expected: Mọi lane Pass trên đúng commit; evidence upload kể cả khi failure.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### O10 — Supply-chain và release evidence: Quan sát aggregate error/latency

- **Priority:** TP1
- **Requirements:** `QA-REQ-O-004`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full
- **Estimated / timeout:** 6 / 15 phút
- **Automation:** Manual
- **Evidence:** actual-result, machine-readable-security-evidence

**Mục tiêu:** Có số liệu theo cửa sổ quy định; không log report content/API key.

**Tiền điều kiện:** Staging beta

**Các bước:**

1. Quan sát aggregate error/latency
   - Expected: Có số liệu theo cửa sổ quy định; không log report content/API key.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### O11 — Supply-chain và release evidence: Kiểm artifact names, paths, hashes và retention

- **Priority:** TP0
- **Requirements:** `QA-REQ-O-004`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Coverage và qa/security evidence đầy đủ, tải được, retention 90 ngày.

**Tiền điều kiện:** CI run completed

**Các bước:**

1. Kiểm artifact names, paths, hashes và retention
   - Expected: Coverage và qa/security evidence đầy đủ, tải được, retention 90 ngày.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

### O12 — Supply-chain và release evidence: Upload draft QA release rồi finalize prerelease

- **Priority:** TP0
- **Requirements:** `QA-REQ-O-004`
- **Environment:** `ENV-CI`
- **Fixtures:** Không
- **Suites:** full, critical
- **Estimated / timeout:** 8 / 20 phút
- **Automation:** Manual
- **Evidence:** screenshot, console-network-log, machine-readable-security-evidence

**Mục tiêu:** Asset hash khớp index; URL ghi vào report; không upload khi secret/hash gate fail.

**Tiền điều kiện:** Manual evidence bundle đã validate

**Các bước:**

1. Upload draft QA release rồi finalize prerelease
   - Expected: Asset hash khớp index; URL ghi vào report; không upload khi secret/hash gate fail.

**Cleanup:** Thực hiện cleanup và khôi phục profile/storage theo mục Cô lập dữ liệu của master plan.

