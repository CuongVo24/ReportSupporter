<!-- GENERATED FILE — edit Design/QA/catalog/test-cases.json and run npm run qa:catalog:render -->
# Danh mục kiểm thử tổng thể chi tiết — ReportSupporter QA v3.1

## Tổng quan coverage

- Schema: `qa-test-case@1`
- Phiên bản catalog: `3.1.0`
- Base cases: **190**
- Expanded environment instances: **386**
- Canonical source: `Design/QA/catalog/test-cases.json`
- Mỗi case bên dưới có test data, tiền điều kiện, từng bước/expected, evidence và cleanup.

| Tầng kiểm thử | Base acceptance case | Automated suite |
|---|---:|---:|
| component | 58 | 2 |
| e2e | 166 | 2 |
| integration | 141 | 7 |
| manual | 55 | 0 |
| performance | 26 | 3 |
| release | 12 | 3 |
| security | 68 | 4 |
| unit | 3 | 5 |

| Cách thực thi | Số base case |
|---|---:|
| automated | 24 |
| hybrid | 3 |
| manual | 163 |

## Bản đồ nhóm A–O

| Nhóm | Phạm vi | Base case | Expanded instances | Tầng kiểm thử |
|---|---|---:|---:|---|
| A | Thư viện và vòng đời dự án | 11 | 18 | e2e, integration |
| B | Template, metadata và AI | 13 | 29 | e2e, component, integration, security, manual, performance |
| C | Soạn thảo nội dung | 18 | 30 | e2e, component, integration, performance |
| D | Định dạng và Preview | 10 | 17 | e2e, component, integration, manual |
| E | Checker và Readiness | 11 | 15 | integration, e2e, manual |
| F | Import và an toàn tài nguyên | 23 | 37 | integration, e2e, performance |
| G | Evidence Kit | 8 | 29 | e2e, integration, security |
| H | Export HTML/PDF/DOCX | 14 | 32 | integration, e2e, manual, security, performance |
| I | Nộp bài | 10 | 18 | e2e, integration, security |
| J | Thuyết trình | 10 | 17 | e2e, component, manual |
| K | Command Palette và shortcut | 7 | 48 | component, e2e, manual, security |
| L | Persistence, recovery, offline và PWA | 11 | 21 | integration, e2e, performance |
| M | Tương thích, accessibility, privacy và phi chức năng | 20 | 39 | manual, e2e, security, performance |
| N | Server/API security | 12 | 24 | integration, security, unit, performance |
| O | Release và supply-chain | 12 | 12 | release, security |

## Automated coverage ngoài browser E2E

Các suite dưới đây là lớp regression riêng. Chúng không thay thế manual/E2E acceptance của case `hybrid`, nhưng bắt buộc được ghi trong canonical CI evidence.

| Suite | Tầng | npm command | Phạm vi nguồn | Expected/evidence |
|---|---|---|---|---|
| `AUT-UNIT-SUBSYSTEMS` — Unit và integration regression cho các subsystem | unit, integration | `npm run test:subsystems` | `src/lib`, `src/modules`, `src/components`, `src/app` | Toàn bộ Vitest subsystem pass; không có skipped/focused test ngoài allowlist. Evidence: test-log, junit-or-console-summary |
| `AUT-COMPONENT-A11Y` — Component interaction và accessibility contracts | component, unit | `npm run test:subsystems` | `src/components`, `src/modules/__a11y__` | Component, keyboard, focus, ARIA và primitive accessibility tests pass. Evidence: test-log, coverage-report |
| `AUT-COVERAGE` — Coverage gate cho unit/component/integration | unit, component, integration | `npm run test:coverage` | `src/lib`, `src/components`, `src/app`, `src/modules` | Coverage command pass đúng threshold của repository và artifact coverage được giữ 90 ngày trên CI. Evidence: coverage-report, ci-run-url |
| `AUT-E2E-BROWSER` — Browser E2E trên production-like build | e2e | `npm run test:e2e` | `e2e` | Playwright E2E pass; trace/screenshot/video của failure được upload. Evidence: playwright-report, trace, screenshot |
| `AUT-SECURITY-FUZZ` — API security contracts và fuzz bounds | unit, integration, security | `npm run test:subsystems` | `src/app/api/ai/__security__`, `src/app/api/pdf/__security__`, `src/lib/server` | Security/fuzz tests pass với bound hữu hạn; lỗi trả generic cause và không rò nội dung. Evidence: test-log, security-summary |
| `AUT-PERFORMANCE-UNIT` — Pipeline và workspace performance budget | performance, integration | `npm run test:performance` | `src/modules/pipeline/pipeline-performance.test.ts`, `src/modules/workspace/workspace-performance.test.ts` | Các percentile/budget assertion pass trên runner được khai báo. Evidence: performance-json, test-log |
| `AUT-PERFORMANCE-E2E` — Workspace performance E2E | performance, e2e | `npm run test:perf:e2e` | `e2e/workspace-performance.spec.ts` | E2E performance scenario pass và artifact đo có commit/environment. Evidence: playwright-report, performance-json |
| `AUT-PDF-UNIT` — PDF renderer unit contracts | unit, security | `npm run test:pdf-unit` | `services/pdf-renderer` | Renderer unit/security contracts pass khi JavaScript bị vô hiệu và input bị giới hạn. Evidence: test-log, security-summary |
| `AUT-PDF-INTEGRATION` — PDF service integration và artifact validation | integration, security | `npm run test:pdf-integration` | `scripts/test-pdf-integration.mjs` | Renderer readiness, admission, render và PDF parse/open assertions pass. Evidence: integration-log, pdf-artifact, artifact-hash |
| `AUT-PRODUCTION-CONFIG` — Production configuration gate | integration, security, release | `npm run check:production-config` | `scripts/check-production-config.mjs` | Valid production config pass; missing/unsafe config fail closed. Evidence: gate-log, ci-run-url |
| `AUT-BUNDLE-BUDGET` — Application bundle size gate | performance, release | `npm run check:bundle` | `scripts/check-bundle-budget.mjs` | Bundle size nằm trong budget và báo cáo gắn exact commit. Evidence: bundle-budget-json, ci-run-url |
| `AUT-QA-META` — QA catalog, fixture, report và evidence meta-tests | integration, release | `npm run qa:check` | `scripts/qa-meta.test.mjs`, `scripts/qa-validate.mjs`, `scripts/qa-fixtures.mjs` | Catalog/render/traceability/fixture/report/bundle negative và positive tests đều pass. Evidence: qa-check-log, release-evidence-manifest |


## Kịch bản thực thi A–O

## A — Thư viện và vòng đời dự án

### A01 — Thư viện và vòng đời dự án: Mở /

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-A-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, smoke, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | playwright:e2e/project-library.spec.ts |

**Mục tiêu/acceptance cuối:** Empty Hub hiển thị; không crash; 0 project

**Test data:** Storage sạch

**Tiền điều kiện:** Storage sạch

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build, mở Library bằng profile riêng của case và xác nhận trạng thái IndexedDB theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Storage sạch
   - **Expected:** Library tải xong; URL, số project và trạng thái Trash/Recent khớp dữ liệu chuẩn bị. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở `/`
   - **Expected:** Empty Hub hiển thị; không crash; 0 project
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của A01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Empty Hub hiển thị; không crash; 0 project
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `A01@ENV-D1`, `A01@ENV-D2`

**Cleanup/isolation:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.

### A02 — Thư viện và vòng đời dự án: Tạo dự án mới

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-A-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-A11Y`, `ENV-M1` |
| Fixtures | Không |
| Suite | full, smoke, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | playwright:e2e/project-library.spec.ts |

**Mục tiêu/acceptance cuối:** Sinh project ID duy nhất; điều hướng `/workspace/<id>`; editor sẵn sàng

**Test data:** Storage sạch

**Tiền điều kiện:** Storage sạch

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build, mở Library bằng profile riêng của case và xác nhận trạng thái IndexedDB theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Storage sạch
   - **Expected:** Library tải xong; URL, số project và trạng thái Trash/Recent khớp dữ liệu chuẩn bị. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tạo dự án mới
   - **Expected:** Sinh project ID duy nhất; điều hướng `/workspace/<id>`; editor sẵn sàng
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của A02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Sinh project ID duy nhất; điều hướng `/workspace/<id>`; editor sẵn sàng
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `A02@ENV-D1`, `A02@ENV-D2`, `A02@ENV-A11Y`, `A02@ENV-M1`

**Cleanup/isolation:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.

### A03 — Thư viện và vòng đời dự án: Tìm do an, đồ án, chữ hoa/thường và khoảng trắng đầu/cuối

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-A-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | playwright:e2e/project-library.spec.ts |

**Mục tiêu/acceptance cuối:** Mỗi query trả đúng tập project theo normalize bỏ dấu/case/trim

**Test data:** 4 dự án: `Bao cao mon hoc`, `Báo cáo đồ án`, `Đồ Án Web`, `Khác`

**Tiền điều kiện:** 4 dự án: `Bao cao mon hoc`, `Báo cáo đồ án`, `Đồ Án Web`, `Khác`

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build, mở Library bằng profile riêng của case và xác nhận trạng thái IndexedDB theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 4 dự án: `Bao cao mon hoc`, `Báo cáo đồ án`, `Đồ Án Web`, `Khác`
   - **Expected:** Library tải xong; URL, số project và trạng thái Trash/Recent khớp dữ liệu chuẩn bị. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tìm `do an`, `đồ án`, chữ hoa/thường và khoảng trắng đầu/cuối
   - **Expected:** Mỗi query trả đúng tập project theo normalize bỏ dấu/case/trim
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của A03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Mỗi query trả đúng tập project theo normalize bỏ dấu/case/trim
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `A03@ENV-D1`, `A03@ENV-D2`

**Cleanup/isolation:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.

### A04 — Thư viện và vòng đời dự án: Mở lần lượt P1 → P2 → P1 rồi về Library

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-A-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | playwright:e2e/project-library.spec.ts |

**Mục tiêu/acceptance cuối:** Recent xếp P1 đầu, P2 sau; không dùng created time thay access time

**Test data:** 3 dự án có access time khác nhau

**Tiền điều kiện:** 3 dự án có access time khác nhau

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build, mở Library bằng profile riêng của case và xác nhận trạng thái IndexedDB theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 3 dự án có access time khác nhau
   - **Expected:** Library tải xong; URL, số project và trạng thái Trash/Recent khớp dữ liệu chuẩn bị. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở lần lượt P1 → P2 → P1 rồi về Library
   - **Expected:** Recent xếp P1 đầu, P2 sau; không dùng created time thay access time
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của A04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Recent xếp P1 đầu, P2 sau; không dùng created time thay access time
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `A04@ENV-D1`

**Cleanup/isolation:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.

### A05 — Thư viện và vòng đời dự án: Duplicate rồi sửa title/section của bản sao

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-A-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | playwright:e2e/project-library.spec.ts |

**Mục tiêu/acceptance cuối:** ID mới; nội dung/asset ban đầu tương đương; sửa bản sao không đổi bản gốc

**Test data:** 1 dự án có 2 section và 1 asset

**Tiền điều kiện:** 1 dự án có 2 section và 1 asset

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build, mở Library bằng profile riêng của case và xác nhận trạng thái IndexedDB theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 1 dự án có 2 section và 1 asset
   - **Expected:** Library tải xong; URL, số project và trạng thái Trash/Recent khớp dữ liệu chuẩn bị. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Duplicate rồi sửa title/section của bản sao
   - **Expected:** ID mới; nội dung/asset ban đầu tương đương; sửa bản sao không đổi bản gốc
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của A05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** ID mới; nội dung/asset ban đầu tương đương; sửa bản sao không đổi bản gốc
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `A05@ENV-D1`

**Cleanup/isolation:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.

### A06 — Thư viện và vòng đời dự án: Xóa, mở Trash

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-A-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | playwright:e2e/project-library.spec.ts |

**Mục tiêu/acceptance cuối:** Dự án biến mất khỏi danh sách chính, xuất hiện trong Trash; chưa purge

**Test data:** 1 dự án thường

**Tiền điều kiện:** 1 dự án thường

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build, mở Library bằng profile riêng của case và xác nhận trạng thái IndexedDB theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 1 dự án thường
   - **Expected:** Library tải xong; URL, số project và trạng thái Trash/Recent khớp dữ liệu chuẩn bị. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xóa, mở Trash
   - **Expected:** Dự án biến mất khỏi danh sách chính, xuất hiện trong Trash; chưa purge
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của A06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Dự án biến mất khỏi danh sách chính, xuất hiện trong Trash; chưa purge
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `A06@ENV-D1`

**Cleanup/isolation:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.

### A07 — Thư viện và vòng đời dự án: Restore

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-A-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | playwright:e2e/project-library.spec.ts |

**Mục tiêu/acceptance cuối:** Dự án trở lại nguyên title/section/asset; mở được

**Test data:** Dự án trong Trash

**Tiền điều kiện:** Dự án trong Trash

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build, mở Library bằng profile riêng của case và xác nhận trạng thái IndexedDB theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dự án trong Trash
   - **Expected:** Library tải xong; URL, số project và trạng thái Trash/Recent khớp dữ liệu chuẩn bị. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Restore
   - **Expected:** Dự án trở lại nguyên title/section/asset; mở được
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của A07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Dự án trở lại nguyên title/section/asset; mở được
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `A07@ENV-D1`

**Cleanup/isolation:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.

### A08 — Thư viện và vòng đời dự án: Reload và đóng/mở browser profile

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-A-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | playwright:e2e/project-library.spec.ts |

**Mục tiêu/acceptance cuối:** Số project, title và thứ tự Recent giữ nguyên

**Test data:** 4 dự án đã lưu

**Tiền điều kiện:** 4 dự án đã lưu

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build, mở Library bằng profile riêng của case và xác nhận trạng thái IndexedDB theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 4 dự án đã lưu
   - **Expected:** Library tải xong; URL, số project và trạng thái Trash/Recent khớp dữ liệu chuẩn bị. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Reload và đóng/mở browser profile
   - **Expected:** Số project, title và thứ tự Recent giữ nguyên
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của A08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Số project, title và thứ tự Recent giữ nguyên
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `A08@ENV-D1`, `A08@ENV-D2`

**Cleanup/isolation:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.

### A09 — Thư viện và vòng đời dự án: Mở project lỗi

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | e2e, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-A-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-REC-04` |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | playwright:e2e/project-library.spec.ts |

**Mục tiêu/acceptance cuối:** Recovery Center hiển thị đúng item; chọn khôi phục/loại bỏ không làm sập Library

**Test data:** Dùng đúng fixture `FX-REC-04`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** Nạp FX-REC-04 bằng script

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build, mở Library bằng profile riêng của case và xác nhận trạng thái IndexedDB theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-REC-04`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Library tải xong; URL, số project và trạng thái Trash/Recent khớp dữ liệu chuẩn bị. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở project lỗi
   - **Expected:** Recovery Center hiển thị đúng item; chọn khôi phục/loại bỏ không làm sập Library
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của A09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Recovery Center hiển thị đúng item; chọn khôi phục/loại bỏ không làm sập Library
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `A09@ENV-D1`

**Cleanup/isolation:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.

### A10 — Thư viện và vòng đời dự án: Mở trực tiếp /workspace/not-found-id

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-A-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | playwright:e2e/project-library.spec.ts |

**Mục tiêu/acceptance cuối:** Hiển thị trạng thái không tìm thấy và đường quay về Library; không tạo project rác

**Test data:** Project ID không tồn tại

**Tiền điều kiện:** Project ID không tồn tại

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build, mở Library bằng profile riêng của case và xác nhận trạng thái IndexedDB theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Project ID không tồn tại
   - **Expected:** Library tải xong; URL, số project và trạng thái Trash/Recent khớp dữ liệu chuẩn bị. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở trực tiếp `/workspace/not-found-id`
   - **Expected:** Hiển thị trạng thái không tìm thấy và đường quay về Library; không tạo project rác
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của A10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Hiển thị trạng thái không tìm thấy và đường quay về Library; không tạo project rác
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `A10@ENV-D1`

**Cleanup/isolation:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.

### A11 — Thư viện và vòng đời dự án: Dùng Back/Forward/reload qua hai route

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-A-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | playwright:e2e/project-library.spec.ts |

**Mục tiêu/acceptance cuối:** Route và dữ liệu đúng; không nhân đôi project hoặc mất thay đổi đã lưu

**Test data:** Có Library và một workspace

**Tiền điều kiện:** Có Library và một workspace

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build, mở Library bằng profile riêng của case và xác nhận trạng thái IndexedDB theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Có Library và một workspace
   - **Expected:** Library tải xong; URL, số project và trạng thái Trash/Recent khớp dữ liệu chuẩn bị. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Dùng Back/Forward/reload qua hai route
   - **Expected:** Route và dữ liệu đúng; không nhân đôi project hoặc mất thay đổi đã lưu
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của A11; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Route và dữ liệu đúng; không nhân đôi project hoặc mất thay đổi đã lưu
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `A11@ENV-D1`, `A11@ENV-D2`

**Cleanup/isolation:** Xóa project thử khỏi Library/Trash, đóng tab và xóa storage của profile nếu case không kiểm persistence.

## B — Template, metadata và AI

### B01 — Template, metadata và AI: Mở Template Catalog

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | playwright:e2e/templates-and-offline.spec.ts |

**Mục tiêu/acceptance cuối:** Hiện đúng 4 template trong ma trận; preview và tên khớp

**Test data:** Storage sạch

**Tiền điều kiện:** Storage sạch

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Storage sạch
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở Template Catalog
   - **Expected:** Hiện đúng 4 template trong ma trận; preview và tên khớp
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Hiện đúng 4 template trong ma trận; preview và tên khớp
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `B01@ENV-D1`, `B01@ENV-D2`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B02 — Template, metadata và AI: Bỏ trống từng field bắt buộc rồi submit

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Field lỗi có label/message; không tạo project khi dữ liệu bắt buộc thiếu

**Test data:** `[mỗi template]`

**Tiền điều kiện:** `[mỗi template]`

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: `[mỗi template]`
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Bỏ trống từng field bắt buộc rồi submit
   - **Expected:** Field lỗi có label/message; không tạo project khi dữ liệu bắt buộc thiếu
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Field lỗi có label/message; không tạo project khi dữ liệu bắt buộc thiếu
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `B02[software-project]@ENV-D1`, `B02[lab-report]@ENV-D1`, `B02[internship-report]@ENV-D1`, `B02[readme-report]@ENV-D1`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B03 — Template, metadata và AI: Tạo project

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | automated |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, smoke, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | playwright:e2e/templates-and-offline.spec.ts |

**Mục tiêu/acceptance cuối:** Section count/title/required rule khớp oracle của template; metadata điền đúng vị trí

**Test data:** `[mỗi template]`, metadata hợp lệ cố định

**Tiền điều kiện:** `[mỗi template]`, metadata hợp lệ cố định

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: `[mỗi template]`, metadata hợp lệ cố định
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tạo project
   - **Expected:** Section count/title/required rule khớp oracle của template; metadata điền đúng vị trí
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Section count/title/required rule khớp oracle của template; metadata điền đúng vị trí
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `B03[software-project]@ENV-D1`, `B03[software-project]@ENV-D2`, `B03[lab-report]@ENV-D1`, `B03[lab-report]@ENV-D2`, `B03[internship-report]@ENV-D1`, `B03[internship-report]@ENV-D2`, `B03[readme-report]@ENV-D1`, `B03[readme-report]@ENV-D2`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B04 — Template, metadata và AI: Tạo, lưu, reload, preview/export HTML

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Ký tự được lưu/render an toàn, không lỗi encoding/XSS; không cắt âm thầm

**Test data:** Metadata có tiếng Việt, các ký tự ampersand/dấu bé hơn/dấu lớn hơn/nháy đơn/nháy kép và tên dài 255 ký tự

**Tiền điều kiện:** Metadata có tiếng Việt, các ký tự ampersand/dấu bé hơn/dấu lớn hơn/nháy đơn/nháy kép và tên dài 255 ký tự

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Metadata có tiếng Việt, các ký tự ampersand/dấu bé hơn/dấu lớn hơn/nháy đơn/nháy kép và tên dài 255 ký tự
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tạo, lưu, reload, preview/export HTML
   - **Expected:** Ký tự được lưu/render an toàn, không lỗi encoding/XSS; không cắt âm thầm
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Ký tự được lưu/render an toàn, không lỗi encoding/XSS; không cắt âm thầm
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `B04@ENV-D1`, `B04@ENV-D2`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B05 — Template, metadata và AI: Tạo báo cáo trống

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | e2e, component, integration, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Workspace có đúng 1 mục rỗng, editor focus được

**Test data:** Không chọn template

**Tiền điều kiện:** Không chọn template

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Không chọn template
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tạo báo cáo trống
   - **Expected:** Workspace có đúng 1 mục rỗng, editor focus được
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Workspace có đúng 1 mục rỗng, editor focus được
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `B05@ENV-D1`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B06 — Template, metadata và AI: Chạy một hành động AI

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không có request `/api/ai`; UI thông báo AI tắt/hướng dẫn cấu hình; nội dung không đổi

**Test data:** AI mặc định tắt; Network log sạch

**Tiền điều kiện:** AI mặc định tắt; Network log sạch

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: AI mặc định tắt; Network log sạch
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy một hành động AI
   - **Expected:** Không có request `/api/ai`; UI thông báo AI tắt/hướng dẫn cấu hình; nội dung không đổi
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không có request `/api/ai`; UI thông báo AI tắt/hướng dẫn cấu hình; nội dung không đổi
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `B06@ENV-D1`, `B06@ENV-D2`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B07 — Template, metadata và AI: Chạy AI

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không có request `/api/ai`; UI báo chưa cấu hình; không crash

**Test data:** AI bật nhưng thiếu provider hoặc API key

**Tiền điều kiện:** AI bật nhưng thiếu provider hoặc API key

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: AI bật nhưng thiếu provider hoặc API key
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy AI
   - **Expected:** Không có request `/api/ai`; UI báo chưa cấu hình; không crash
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không có request `/api/ai`; UI báo chưa cấu hình; không crash
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `B07@ENV-D1`, `B07@ENV-D2`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B08 — Template, metadata và AI: Lưu AI Settings, kiểm localStorage/IndexedDB, reload cứng/mở tab mới

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Provider/flag có thể persist; marker key không tồn tại trong storage; phiên mới yêu cầu nhập lại key

**Test data:** Key test giả `qa-secret-marker`

**Tiền điều kiện:** Key test giả `qa-secret-marker`

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Key test giả `qa-secret-marker`
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Lưu AI Settings, kiểm localStorage/IndexedDB, reload cứng/mở tab mới
   - **Expected:** Provider/flag có thể persist; marker key không tồn tại trong storage; phiên mới yêu cầu nhập lại key
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Provider/flag có thể persist; marker key không tồn tại trong storage; phiên mới yêu cầu nhập lại key
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `B08@ENV-D1`, `B08@ENV-D2`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B09 — Template, metadata và AI: Chạy Dàn ý AI

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Chỉ có request same-origin `/api/ai`; hiển thị suggestion/diff; chưa áp dụng thì nội dung gốc không đổi

**Test data:** AI test hợp lệ, response fixture cố định

**Tiền điều kiện:** AI test hợp lệ, response fixture cố định

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: AI test hợp lệ, response fixture cố định
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy Dàn ý AI
   - **Expected:** Chỉ có request same-origin `/api/ai`; hiển thị suggestion/diff; chưa áp dụng thì nội dung gốc không đổi
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Chỉ có request same-origin `/api/ai`; hiển thị suggestion/diff; chưa áp dụng thì nội dung gốc không đổi
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `B09@ENV-D1`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B10 — Template, metadata và AI: Accept rồi Undo/Reject suggestion

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Accept tạo đúng thay đổi và snapshot; Reject không đổi; Undo khôi phục đúng revision

**Test data:** AI response fixture cố định

**Tiền điều kiện:** AI response fixture cố định

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: AI response fixture cố định
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Accept rồi Undo/Reject suggestion
   - **Expected:** Accept tạo đúng thay đổi và snapshot; Reject không đổi; Undo khôi phục đúng revision
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Accept tạo đúng thay đổi và snapshot; Reject không đổi; Undo khôi phục đúng revision
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `B10@ENV-D1`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B11 — Template, metadata và AI: Chạy AI cho từng status

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Thông báo phân biệt cấu hình/quá tải/provider/timeout; không mất nội dung; retry chỉ xuất hiện khi hợp lý

**Test data:** Mock lần lượt 401/429/502/504

**Tiền điều kiện:** Mock lần lượt 401/429/502/504

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Mock lần lượt 401/429/502/504
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy AI cho từng status
   - **Expected:** Thông báo phân biệt cấu hình/quá tải/provider/timeout; không mất nội dung; retry chỉ xuất hiện khi hợp lý
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B11; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Thông báo phân biệt cấu hình/quá tải/provider/timeout; không mất nội dung; retry chỉ xuất hiện khi hợp lý
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `B11@ENV-D1`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B12 — Template, metadata và AI: Hủy request/đóng panel

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Request bị abort; UI kết thúc loading; không áp suggestion một phần

**Test data:** AI request đang chạy

**Tiền điều kiện:** AI request đang chạy

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: AI request đang chạy
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Hủy request/đóng panel
   - **Expected:** Request bị abort; UI kết thúc loading; không áp suggestion một phần
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B12; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Request bị abort; UI kết thúc loading; không áp suggestion một phần
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `B12@ENV-D1`, `B12@ENV-D2`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

### B13 — Template, metadata và AI: Accept suggestion cũ

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-B-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Suggestion stale không ghi đè revision mới; yêu cầu tạo lại/resolve conflict

**Test data:** Tạo suggestion rồi sửa section trước khi Accept

**Tiền điều kiện:** Tạo suggestion rồi sửa section trước khi Accept

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Template Catalog/initializer trên production build; cấu hình AI synthetic hoặc trạng thái disabled đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Tạo suggestion rồi sửa section trước khi Accept
   - **Expected:** Danh sách template, metadata form và AI gateway state tải xong, không có draft từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Accept suggestion cũ
   - **Expected:** Suggestion stale không ghi đè revision mới; yêu cầu tạo lại/resolve conflict
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của B13; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Suggestion stale không ghi đè revision mới; yêu cầu tạo lại/resolve conflict
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `B13@ENV-D1`

**Cleanup/isolation:** Đóng initializer/settings, xóa project nháp và xóa synthetic AI config khỏi profile.

## C — Soạn thảo nội dung

### C01 — Soạn thảo và asset: Gõ marker vào editor

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-PERF-S` |
| Suite | full, smoke, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Preview chứa đúng marker; production automated gate input→preview `<1500 ms`; 0 worker/page error

**Test data:** Dùng đúng fixture `FX-PERF-S`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-PERF-S

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-PERF-S`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Gõ marker vào editor
   - **Expected:** Preview chứa đúng marker; production automated gate input→preview `<1500 ms`; 0 worker/page error
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Preview chứa đúng marker; production automated gate input→preview `<1500 ms`; 0 worker/page error
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `C01@ENV-D1`, `C01@ENV-D2`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C02 — Soạn thảo và asset: Ctrl+S rồi reload

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-A11Y`, `ENV-M1` |
| Fixtures | Không |
| Suite | full, smoke, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Trạng thái chuyển saving→saved; marker còn nguyên

**Test data:** Project có marker chưa lưu

**Tiền điều kiện:** Project có marker chưa lưu

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Project có marker chưa lưu
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Ctrl+S rồi reload
   - **Expected:** Trạng thái chuyển saving→saved; marker còn nguyên
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Trạng thái chuyển saving→saved; marker còn nguyên
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `C02@ENV-D1`, `C02@ENV-D2`, `C02@ENV-A11Y`, `C02@ENV-M1`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C03 — Soạn thảo và asset: Không Ctrl+S, chờ >2 giây rồi reload

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, smoke, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Autosave hoàn tất và marker còn nguyên

**Test data:** Project có marker mới

**Tiền điều kiện:** Project có marker mới

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Project có marker mới
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Không Ctrl+S, chờ >2 giây rồi reload
   - **Expected:** Autosave hoàn tất và marker còn nguyên
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Autosave hoàn tất và marker còn nguyên
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `C03@ENV-D1`, `C03@ENV-D2`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C04 — Soạn thảo và asset: Chuyển tab/ẩn document hoặc đóng tab rồi mở lại

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Pending save được flush; thay đổi cuối cùng còn nguyên

**Test data:** Thay đổi đang chờ autosave

**Tiền điều kiện:** Thay đổi đang chờ autosave

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Thay đổi đang chờ autosave
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chuyển tab/ẩn document hoặc đóng tab rồi mở lại
   - **Expected:** Pending save được flush; thay đổi cuối cùng còn nguyên
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Pending save được flush; thay đổi cuối cùng còn nguyên
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `C04@ENV-D1`, `C04@ENV-D2`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C05 — Soạn thảo và asset: Ctrl+Shift+N

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Thêm đúng 1 section, ID duy nhất, nav/editor đồng bộ

**Test data:** 1 section đang chọn

**Tiền điều kiện:** 1 section đang chọn

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 1 section đang chọn
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Ctrl+Shift+N
   - **Expected:** Thêm đúng 1 section, ID duy nhất, nav/editor đồng bộ
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Thêm đúng 1 section, ID duy nhất, nav/editor đồng bộ
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C05@ENV-D1`, `C05@ENV-D2`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C06 — Soạn thảo và asset: Ctrl+Shift+D

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Thêm đúng 1 bản sao độc lập; sửa bản sao không đổi gốc

**Test data:** Section có title/Markdown riêng

**Tiền điều kiện:** Section có title/Markdown riêng

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Section có title/Markdown riêng
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Ctrl+Shift+D
   - **Expected:** Thêm đúng 1 bản sao độc lập; sửa bản sao không đổi gốc
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Thêm đúng 1 bản sao độc lập; sửa bản sao không đổi gốc
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C06@ENV-D1`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C07 — Soạn thảo và asset: Alt+Up rồi Alt+Down

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Mỗi lần chỉ đổi một vị trí hợp lệ; nav, preview, numbering đồng bộ; biên đầu/cuối không lỗi

**Test data:** 3 section A/B/C, chọn B

**Tiền điều kiện:** 3 section A/B/C, chọn B

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 3 section A/B/C, chọn B
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Alt+Up rồi Alt+Down
   - **Expected:** Mỗi lần chỉ đổi một vị trí hợp lệ; nav, preview, numbering đồng bộ; biên đầu/cuối không lỗi
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Mỗi lần chỉ đổi một vị trí hợp lệ; nav, preview, numbering đồng bộ; biên đầu/cuối không lỗi
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C07@ENV-D1`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C08 — Soạn thảo và asset: Kéo C lên đầu

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-M1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Thứ tự C/A/B ở nav, preview và persisted state; reload giữ nguyên

**Test data:** 3 section A/B/C

**Tiền điều kiện:** 3 section A/B/C

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 3 section A/B/C
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Kéo C lên đầu
   - **Expected:** Thứ tự C/A/B ở nav, preview và persisted state; reload giữ nguyên
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Thứ tự C/A/B ở nav, preview và persisted state; reload giữ nguyên
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C08@ENV-D1`, `C08@ENV-D2`, `C08@ENV-M1`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C09 — Soạn thảo và asset: Chèn bảng GFM

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-MD-01` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Đúng số hàng/cột/text; không tràn container; caption/label theo cú pháp hỗ trợ

**Test data:** Dùng đúng fixture `FX-MD-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-MD-01 phần table

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-MD-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chèn bảng GFM
   - **Expected:** Đúng số hàng/cột/text; không tràn container; caption/label theo cú pháp hỗ trợ
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Đúng số hàng/cột/text; không tràn container; caption/label theo cú pháp hỗ trợ
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C09@ENV-D1`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C10 — Soạn thảo và asset: Chèn/xem preview

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Block `js` highlight; block thiếu language vẫn render và tạo rule warning tương ứng

**Test data:** Code block `js` và code block không language

**Tiền điều kiện:** Code block `js` và code block không language

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Code block `js` và code block không language
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chèn/xem preview
   - **Expected:** Block `js` highlight; block thiếu language vẫn render và tạo rule warning tương ứng
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Block `js` highlight; block thiếu language vẫn render và tạo rule warning tương ứng
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C10@ENV-D1`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C11 — Soạn thảo và asset: Chèn/xem preview

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Hai công thức render; source không mất khi save/reload

**Test data:** Inline `$x^2$` và block `$$...$$`

**Tiền điều kiện:** Inline `$x^2$` và block `$$...$$`

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Inline `$x^2$` và block `$$...$$`
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chèn/xem preview
   - **Expected:** Hai công thức render; source không mất khi save/reload
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C11; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Hai công thức render; source không mất khi save/reload
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C11@ENV-D1`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C12 — Soạn thảo và asset: Chèn/xem preview

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Hợp lệ thành SVG; sai syntax hiện lỗi/placeholder an toàn, không crash phần preview còn lại

**Test data:** Mermaid hợp lệ và Mermaid sai syntax

**Tiền điều kiện:** Mermaid hợp lệ và Mermaid sai syntax

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Mermaid hợp lệ và Mermaid sai syntax
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chèn/xem preview
   - **Expected:** Hợp lệ thành SVG; sai syntax hiện lỗi/placeholder an toàn, không crash phần preview còn lại
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C12; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Hợp lệ thành SVG; sai syntax hiện lỗi/placeholder an toàn, không crash phần preview còn lại
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C12@ENV-D1`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C13 — Soạn thảo và asset: Paste/chèn ảnh

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-IMG-01`, `FX-IMG-02` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Cả hai được chấp nhận, tạo asset/ref và hiển thị; reload còn ảnh

**Test data:** Dùng đúng fixture `FX-IMG-01`, `FX-IMG-02`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** Lần lượt FX-IMG-01, FX-IMG-02

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-IMG-01`, `FX-IMG-02`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Paste/chèn ảnh
   - **Expected:** Cả hai được chấp nhận, tạo asset/ref và hiển thị; reload còn ảnh
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C13; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Cả hai được chấp nhận, tạo asset/ref và hiển thị; reload còn ảnh
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `C13@ENV-D1`, `C13@ENV-D2`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C14 — Soạn thảo và asset: Paste/chèn ảnh

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-IMG-03` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Bị chặn với giới hạn 5 MiB; không tạo asset/ref rác; project vẫn sửa được

**Test data:** Dùng đúng fixture `FX-IMG-03`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-IMG-03

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-IMG-03`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Paste/chèn ảnh
   - **Expected:** Bị chặn với giới hạn 5 MiB; không tạo asset/ref rác; project vẫn sửa được
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C14; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Bị chặn với giới hạn 5 MiB; không tạo asset/ref rác; project vẫn sửa được
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `C14@ENV-D1`, `C14@ENV-D2`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C15 — Soạn thảo và asset: Dùng chọn file “Gắn ảnh”

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Ref được rewrite/resolve đúng asset; không phát request tới ref cũ

**Test data:** File ảnh hợp lệ có basename khớp ref

**Tiền điều kiện:** File ảnh hợp lệ có basename khớp ref

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: File ảnh hợp lệ có basename khớp ref
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Dùng chọn file “Gắn ảnh”
   - **Expected:** Ref được rewrite/resolve đúng asset; không phát request tới ref cũ
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C15; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Ref được rewrite/resolve đúng asset; không phát request tới ref cũ
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C15@ENV-D1`, `C15@ENV-D2`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C16 — Soạn thảo và asset: Undo từng thao tác

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Mỗi Undo khôi phục đúng state trước đó, không ảnh hưởng section/asset khác

**Test data:** Thực hiện add/duplicate/reorder/delete section

**Tiền điều kiện:** Thực hiện add/duplicate/reorder/delete section

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Thực hiện add/duplicate/reorder/delete section
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Undo từng thao tác
   - **Expected:** Mỗi Undo khôi phục đúng state trước đó, không ảnh hưởng section/asset khác
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C16; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Mỗi Undo khôi phục đúng state trước đó, không ảnh hưởng section/asset khác
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C16@ENV-D1`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C17 — Soạn thảo và asset: Ctrl+Shift+F hai lần

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Lần 1 ẩn chrome phụ; lần 2 phục hồi layout và selection/scroll hợp lý

**Test data:** Workspace thường

**Tiền điều kiện:** Workspace thường

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Workspace thường
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Ctrl+Shift+F hai lần
   - **Expected:** Lần 1 ẩn chrome phụ; lần 2 phục hồi layout và selection/scroll hợp lý
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C17; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Lần 1 ẩn chrome phụ; lần 2 phục hồi layout và selection/scroll hợp lý
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C17@ENV-D1`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

### C18 — Soạn thảo và asset: Gõ, save, reload, export

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-C-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Nội dung tương đương Unicode đầu vào, không mojibake hoặc mất ký tự

**Test data:** Chuỗi tiếng Việt NFC/NFD, emoji, ký tự đặc biệt

**Tiền điều kiện:** Chuỗi tiếng Việt NFC/NFD, emoji, ký tự đặc biệt

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng, mở đúng section và nạp nội dung/selection/asset theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Chuỗi tiếng Việt NFC/NFD, emoji, ký tự đặc biệt
   - **Expected:** Editor sẵn sàng, revision hiện tại đã ghi nhận và nội dung baseline có thể khôi phục. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Gõ, save, reload, export
   - **Expected:** Nội dung tương đương Unicode đầu vào, không mojibake hoặc mất ký tự
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của C18; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Nội dung tương đương Unicode đầu vào, không mojibake hoặc mất ký tự
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `C18@ENV-D1`

**Cleanup/isolation:** Hoàn tác nội dung thử, revoke object URL và xóa project/asset tạm.

## D — Định dạng và Preview

### D01 — Định dạng và Preview: Mở Preview và đo computed style

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-D-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Trang rộng 210 mm, cao tối thiểu 297 mm; lề trên/dưới 25 mm, trái 30 mm, phải 20 mm; Times New Roman 13 pt; line-height 1.5; body justify

**Test data:** Project dùng preset mặc định

**Tiền điều kiện:** Project dùng preset mặc định

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle có format settings và nội dung theo tiền điều kiện; mở Preview trên production build.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Project dùng preset mặc định
   - **Expected:** Preview baseline render xong; preset, computed style, page count và section revision ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở Preview và đo computed style
   - **Expected:** Trang rộng 210 mm, cao tối thiểu 297 mm; lề trên/dưới 25 mm, trái 30 mm, phải 20 mm; Times New Roman 13 pt; line-height 1.5; body justify
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của D01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Trang rộng 210 mm, cao tối thiểu 297 mm; lề trên/dưới 25 mm, trái 30 mm, phải 20 mm; Times New Roman 13 pt; line-height 1.5; body justify
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `D01@ENV-D1`, `D01@ENV-D2`

**Cleanup/isolation:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.

### D02 — Định dạng và Preview: Xem preview

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-D-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Đánh số `1.`, `1.1.`, `1.1.1.` đúng; không nhảy/trùng số

**Test data:** H1/H2/H3 cố định

**Tiền điều kiện:** H1/H2/H3 cố định

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle có format settings và nội dung theo tiền điều kiện; mở Preview trên production build.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: H1/H2/H3 cố định
   - **Expected:** Preview baseline render xong; preset, computed style, page count và section revision ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xem preview
   - **Expected:** Đánh số `1.`, `1.1.`, `1.1.1.` đúng; không nhảy/trùng số
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của D02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Đánh số `1.`, `1.1.`, `1.1.1.` đúng; không nhảy/trùng số
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `D02@ENV-D1`, `D02@ENV-D2`

**Cleanup/isolation:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.

### D03 — Định dạng và Preview: Kiểm TOC

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-D-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Đủ 3 entry, đúng text/thứ tự/link/page theo fixture; dot leader không chồng chữ

**Test data:** 3 heading có thứ tự cố định

**Tiền điều kiện:** 3 heading có thứ tự cố định

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle có format settings và nội dung theo tiền điều kiện; mở Preview trên production build.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 3 heading có thứ tự cố định
   - **Expected:** Preview baseline render xong; preset, computed style, page count và section revision ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Kiểm TOC
   - **Expected:** Đủ 3 entry, đúng text/thứ tự/link/page theo fixture; dot leader không chồng chữ
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của D03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Đủ 3 entry, đúng text/thứ tự/link/page theo fixture; dot leader không chồng chữ
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `D03@ENV-D1`, `D03@ENV-D2`

**Cleanup/isolation:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.

### D04 — Định dạng và Preview: Kiểm LoF

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-D-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Đúng 2 entry và số hình; link trỏ đúng hình

**Test data:** 2 hình có caption/label

**Tiền điều kiện:** 2 hình có caption/label

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle có format settings và nội dung theo tiền điều kiện; mở Preview trên production build.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 2 hình có caption/label
   - **Expected:** Preview baseline render xong; preset, computed style, page count và section revision ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Kiểm LoF
   - **Expected:** Đúng 2 entry và số hình; link trỏ đúng hình
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của D04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Đúng 2 entry và số hình; link trỏ đúng hình
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `D04@ENV-D1`, `D04@ENV-D2`

**Cleanup/isolation:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.

### D05 — Định dạng và Preview: Kiểm LoT

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-D-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Đúng 2 entry và số bảng; link trỏ đúng bảng

**Test data:** 2 bảng có caption/label

**Tiền điều kiện:** 2 bảng có caption/label

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle có format settings và nội dung theo tiền điều kiện; mở Preview trên production build.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 2 bảng có caption/label
   - **Expected:** Preview baseline render xong; preset, computed style, page count và section revision ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Kiểm LoT
   - **Expected:** Đúng 2 entry và số bảng; link trỏ đúng bảng
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của D05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Đúng 2 entry và số bảng; link trỏ đúng bảng
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `D05@ENV-D1`, `D05@ENV-D2`

**Cleanup/isolation:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.

### D06 — Định dạng và Preview: Chọn từng zoom

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-D-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Giá trị UI và transform/size tương ứng; không làm mất scroll/focus

**Test data:** `[Auto, 50, 75, 100, 125, Actual]`

**Tiền điều kiện:** `[Auto, 50, 75, 100, 125, Actual]`

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle có format settings và nội dung theo tiền điều kiện; mở Preview trên production build.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: `[Auto, 50, 75, 100, 125, Actual]`
   - **Expected:** Preview baseline render xong; preset, computed style, page count và section revision ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chọn từng zoom
   - **Expected:** Giá trị UI và transform/size tương ứng; không làm mất scroll/focus
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của D06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Giá trị UI và transform/size tương ứng; không làm mất scroll/focus
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `D06@ENV-D1`, `D06@ENV-D2`

**Cleanup/isolation:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.

### D07 — Định dạng và Preview: Bật nền xem tối rồi reload

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-D-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Chỉ vùng xem đổi nền như thiết kế; trang/nội dung đủ contrast; preference persist nếu spec yêu cầu

**Test data:** Preview sáng

**Tiền điều kiện:** Preview sáng

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle có format settings và nội dung theo tiền điều kiện; mở Preview trên production build.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Preview sáng
   - **Expected:** Preview baseline render xong; preset, computed style, page count và section revision ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Bật nền xem tối rồi reload
   - **Expected:** Chỉ vùng xem đổi nền như thiết kế; trang/nội dung đủ contrast; preference persist nếu spec yêu cầu
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của D07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Chỉ vùng xem đổi nền như thiết kế; trang/nội dung đủ contrast; preference persist nếu spec yêu cầu
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `D07@ENV-D1`

**Cleanup/isolation:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.

### D08 — Định dạng và Preview: Reorder một section

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-D-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Numbering và cả ba danh mục cập nhật, không còn entry stale

**Test data:** Project có TOC/LoF/LoT

**Tiền điều kiện:** Project có TOC/LoF/LoT

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle có format settings và nội dung theo tiền điều kiện; mở Preview trên production build.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Project có TOC/LoF/LoT
   - **Expected:** Preview baseline render xong; preset, computed style, page count và section revision ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Reorder một section
   - **Expected:** Numbering và cả ba danh mục cập nhật, không còn entry stale
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của D08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Numbering và cả ba danh mục cập nhật, không còn entry stale
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `D08@ENV-D1`

**Cleanup/isolation:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.

### D09 — Định dạng và Preview: Preview và Print Preview

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-D-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-PAGE-01` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Page count, break position và overflow khớp manifest; không mất/tràn nội dung; heading/bảng/ảnh xử lý theo print spec

**Test data:** Dùng đúng fixture `FX-PAGE-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-PAGE-01

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle có format settings và nội dung theo tiền điều kiện; mở Preview trên production build.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-PAGE-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Preview baseline render xong; preset, computed style, page count và section revision ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Preview và Print Preview
   - **Expected:** Page count, break position và overflow khớp manifest; không mất/tràn nội dung; heading/bảng/ảnh xử lý theo print spec
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của D09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Page count, break position và overflow khớp manifest; không mất/tràn nội dung; heading/bảng/ảnh xử lý theo print spec
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `D09@ENV-D1`, `D09@ENV-D2`

**Cleanup/isolation:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.

### D10 — Định dạng và Preview: Scroll editor rồi preview và ngược lại

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | e2e, component, integration |
| Cách thực thi | manual |
| Requirements | `QA-REQ-D-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Scroll đồng bộ theo tỷ lệ; không rung/lặp vô hạn; người dùng vẫn cuộn chủ động được

**Test data:** Split view editor/preview

**Tiền điều kiện:** Split view editor/preview

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle có format settings và nội dung theo tiền điều kiện; mở Preview trên production build.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Split view editor/preview
   - **Expected:** Preview baseline render xong; preset, computed style, page count và section revision ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Scroll editor rồi preview và ngược lại
   - **Expected:** Scroll đồng bộ theo tỷ lệ; không rung/lặp vô hạn; người dùng vẫn cuộn chủ động được
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của D10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Scroll đồng bộ theo tỷ lệ; không rung/lặp vô hạn; người dùng vẫn cuộn chủ động được
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `D10@ENV-D1`

**Cleanup/isolation:** Khôi phục preset/settings mặc định, đóng preview phụ và xóa bundle thử.

## E — Checker và Readiness

### E01 — Checker và Readiness: Chạy Soát lỗi

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-E-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-A11Y` |
| Fixtures | `FX-CHK-01` |
| Suite | full, smoke, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Danh sách và readiness khớp chính xác manifest; group/count không trùng

**Test data:** Dùng đúng fixture `FX-CHK-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-CHK-01

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report có lỗi/evidence/metadata đúng tiền điều kiện và mở module Check.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-CHK-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Checker baseline hoàn thành; issue list, group filter và readiness score ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy Soát lỗi
   - **Expected:** Danh sách và readiness khớp chính xác manifest; group/count không trùng
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của E01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Danh sách và readiness khớp chính xác manifest; group/count không trùng
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `E01@ENV-D1`, `E01@ENV-D2`, `E01@ENV-A11Y`

**Cleanup/isolation:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.

### E02 — Checker và Readiness: Chạy checker 3 lần

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-E-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Readiness và issue list giống hệt cả 3 lần

**Test data:** Cùng bundle không đổi

**Tiền điều kiện:** Cùng bundle không đổi

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report có lỗi/evidence/metadata đúng tiền điều kiện và mở module Check.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Cùng bundle không đổi
   - **Expected:** Checker baseline hoàn thành; issue list, group filter và readiness score ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy checker 3 lần
   - **Expected:** Readiness và issue list giống hệt cả 3 lần
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của E02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Readiness và issue list giống hệt cả 3 lần
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `E02@ENV-D1`, `E02@ENV-D2`

**Cleanup/isolation:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.

### E03 — Checker và Readiness: Xóa một section bắt buộc, chạy check

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-E-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Có đúng rule thiếu section với `severity=error` và guidance

**Test data:** Template có section bắt buộc

**Tiền điều kiện:** Template có section bắt buộc

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report có lỗi/evidence/metadata đúng tiền điều kiện và mở module Check.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Template có section bắt buộc
   - **Expected:** Checker baseline hoàn thành; issue list, group filter và readiness score ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xóa một section bắt buộc, chạy check
   - **Expected:** Có đúng rule thiếu section với `severity=error` và guidance
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của E03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Có đúng rule thiếu section với `severity=error` và guidance
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `E03@ENV-D1`

**Cleanup/isolation:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.

### E04 — Checker và Readiness: Chạy check

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-E-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Có đúng warning heading jump tại section chứa H3

**Test data:** H1 → H3

**Tiền điều kiện:** H1 → H3

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report có lỗi/evidence/metadata đúng tiền điều kiện và mở module Check.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: H1 → H3
   - **Expected:** Checker baseline hoàn thành; issue list, group filter và readiness score ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy check
   - **Expected:** Có đúng warning heading jump tại section chứa H3
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của E04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Có đúng warning heading jump tại section chứa H3
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `E04@ENV-D1`

**Cleanup/isolation:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.

### E05 — Checker và Readiness: Chạy check

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-E-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Có đúng warning thiếu language, vị trí đúng

**Test data:** Code fence không language

**Tiền điều kiện:** Code fence không language

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report có lỗi/evidence/metadata đúng tiền điều kiện và mở module Check.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Code fence không language
   - **Expected:** Checker baseline hoàn thành; issue list, group filter và readiness score ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy check
   - **Expected:** Có đúng warning thiếu language, vị trí đúng
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của E05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Có đúng warning thiếu language, vị trí đúng
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `E05@ENV-D1`

**Cleanup/isolation:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.

### E06 — Checker và Readiness: Chạy check

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-E-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Có 2 issue đúng loại/section; không gộp sai

**Test data:** Một ảnh và một bảng thiếu caption

**Tiền điều kiện:** Một ảnh và một bảng thiếu caption

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report có lỗi/evidence/metadata đúng tiền điều kiện và mở module Check.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Một ảnh và một bảng thiếu caption
   - **Expected:** Checker baseline hoàn thành; issue list, group filter và readiness score ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy check
   - **Expected:** Có 2 issue đúng loại/section; không gộp sai
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của E06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Có 2 issue đúng loại/section; không gộp sai
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `E06@ENV-D1`

**Cleanup/isolation:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.

### E07 — Checker và Readiness: Chạy check

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-E-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Có issue cho từng vị trí theo rule; không false positive ở code block nếu spec loại trừ

**Test data:** `TODO` và `lorem ipsum` ở hai section

**Tiền điều kiện:** `TODO` và `lorem ipsum` ở hai section

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report có lỗi/evidence/metadata đúng tiền điều kiện và mở module Check.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: `TODO` và `lorem ipsum` ở hai section
   - **Expected:** Checker baseline hoàn thành; issue list, group filter và readiness score ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy check
   - **Expected:** Có issue cho từng vị trí theo rule; không false positive ở code block nếu spec loại trừ
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của E07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Có issue cho từng vị trí theo rule; không false positive ở code block nếu spec loại trừ
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `E07@ENV-D1`

**Cleanup/isolation:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.

### E08 — Checker và Readiness: Bấm từng issue

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-E-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Chọn đúng section và đặt editor gần đúng vị trí; focus visible

**Test data:** Panel có nhiều issue

**Tiền điều kiện:** Panel có nhiều issue

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report có lỗi/evidence/metadata đúng tiền điều kiện và mở module Check.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Panel có nhiều issue
   - **Expected:** Checker baseline hoàn thành; issue list, group filter và readiness score ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Bấm từng issue
   - **Expected:** Chọn đúng section và đặt editor gần đúng vị trí; focus visible
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của E08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Chọn đúng section và đặt editor gần đúng vị trí; focus visible
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `E08@ENV-D1`, `E08@ENV-D2`

**Cleanup/isolation:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.

### E09 — Checker và Readiness: Sửa lần lượt error rồi warning theo manifest, chạy lại

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-E-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-CHK-01` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Issue đã sửa biến mất; issue khác còn; readiness sau mỗi bước bằng đúng giá trị trong manifest

**Test data:** Dùng đúng fixture `FX-CHK-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-CHK-01

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report có lỗi/evidence/metadata đúng tiền điều kiện và mở module Check.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-CHK-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Checker baseline hoàn thành; issue list, group filter và readiness score ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Sửa lần lượt error rồi warning theo manifest, chạy lại
   - **Expected:** Issue đã sửa biến mất; issue khác còn; readiness sau mỗi bước bằng đúng giá trị trong manifest
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của E09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Issue đã sửa biến mất; issue khác còn; readiness sau mỗi bước bằng đúng giá trị trong manifest
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `E09@ENV-D1`

**Cleanup/isolation:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.

### E10 — Checker và Readiness: Chạy check

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-E-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full, smoke |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không còn `error`; badge xanh; điểm đạt threshold submission `>=80`

**Test data:** Bundle sạch theo checker

**Tiền điều kiện:** Bundle sạch theo checker

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report có lỗi/evidence/metadata đúng tiền điều kiện và mở module Check.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Bundle sạch theo checker
   - **Expected:** Checker baseline hoàn thành; issue list, group filter và readiness score ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy check
   - **Expected:** Không còn `error`; badge xanh; điểm đạt threshold submission `>=80`
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của E10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không còn `error`; badge xanh; điểm đạt threshold submission `>=80`
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `E10@ENV-D1`

**Cleanup/isolation:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.

### E11 — Checker và Readiness: Chạy checker và đồng thời gõ marker

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-E-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-STRESS-01` |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Checker hoàn tất `<10 s`; marker phản hồi `<1 s`; count khớp manifest; 0 pageerror

**Test data:** Dùng đúng fixture `FX-STRESS-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-STRESS-01

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report có lỗi/evidence/metadata đúng tiền điều kiện và mở module Check.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-STRESS-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Checker baseline hoàn thành; issue list, group filter và readiness score ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy checker và đồng thời gõ marker
   - **Expected:** Checker hoàn tất `<10 s`; marker phản hồi `<1 s`; count khớp manifest; 0 pageerror
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của E11; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Checker hoàn tất `<10 s`; marker phản hồi `<1 s`; count khớp manifest; 0 pageerror
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `E11@ENV-D1`

**Cleanup/isolation:** Xóa dữ liệu gây lỗi/evidence/project thử và reset checker state.

## F — Import và an toàn tài nguyên

### F01 — Import và OCR: Import, xem diff, chọn Append

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-MD-01` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Diff đúng; thêm đúng section/content theo manifest; nội dung cũ còn nguyên

**Test data:** Dùng đúng fixture `FX-MD-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-MD-01

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-MD-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import, xem diff, chọn Append
   - **Expected:** Diff đúng; thêm đúng section/content theo manifest; nội dung cũ còn nguyên
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Diff đúng; thêm đúng section/content theo manifest; nội dung cũ còn nguyên
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `F01@ENV-D1`, `F01@ENV-D2`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F02 — Import và OCR: Import và xác nhận

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-DOCX-01` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Heading/paragraph Unicode khớp manifest; warning non-blocking hiển thị đúng

**Test data:** Dùng đúng fixture `FX-DOCX-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-DOCX-01

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-DOCX-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import và xác nhận
   - **Expected:** Heading/paragraph Unicode khớp manifest; warning non-blocking hiển thị đúng
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Heading/paragraph Unicode khớp manifest; warning non-blocking hiển thị đúng
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `F02@ENV-D1`, `F02@ENV-D2`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F03 — Import và OCR: Import và xác nhận

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-PDF-01` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Text/page count khớp manifest; heading đoán có warning `heading-guessed`

**Test data:** Dùng đúng fixture `FX-PDF-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-PDF-01

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-PDF-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import và xác nhận
   - **Expected:** Text/page count khớp manifest; heading đoán có warning `heading-guessed`
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Text/page count khớp manifest; heading đoán có warning `heading-guessed`
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `F03@ENV-D1`, `F03@ENV-D2`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F04 — Import và OCR: Import riêng từng file

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-XLSX-01`, `FX-XLSX-02` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Sheet/table/merged/hidden-sheet theo oracle fixture; không trộn hai run

**Test data:** Dùng đúng fixture `FX-XLSX-01`, `FX-XLSX-02`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-XLSX-01 rồi FX-XLSX-02

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-XLSX-01`, `FX-XLSX-02`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import riêng từng file
   - **Expected:** Sheet/table/merged/hidden-sheet theo oracle fixture; không trộn hai run
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Sheet/table/merged/hidden-sheet theo oracle fixture; không trộn hai run
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F04[FX-XLSX-01]@ENV-D1`, `F04[FX-XLSX-02]@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F05 — Import và OCR: Import riêng từng file

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-PPTX-01`, `FX-PPTX-02` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Slide order/title/body/notes theo oracle fixture

**Test data:** Dùng đúng fixture `FX-PPTX-01`, `FX-PPTX-02`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-PPTX-01 rồi FX-PPTX-02

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-PPTX-01`, `FX-PPTX-02`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import riêng từng file
   - **Expected:** Slide order/title/body/notes theo oracle fixture
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Slide order/title/body/notes theo oracle fixture
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F05[FX-PPTX-01]@ENV-D1`, `F05[FX-PPTX-02]@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F06 — Import và OCR: Chọn Cancel ở diff

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Project hash trước/sau giống nhau; không thêm asset/snapshot rác

**Test data:** Bất kỳ draft import hợp lệ

**Tiền điều kiện:** Bất kỳ draft import hợp lệ

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Bất kỳ draft import hợp lệ
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chọn Cancel ở diff
   - **Expected:** Project hash trước/sau giống nhau; không thêm asset/snapshot rác
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Project hash trước/sau giống nhau; không thêm asset/snapshot rác
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F06@ENV-D1`, `F06@ENV-D2`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F07 — Import và OCR: Chọn Replace

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-MD-01` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Chỉ phạm vi được mô tả trong dialog bị thay; undo/snapshot có thể phục hồi

**Test data:** Dùng đúng fixture `FX-MD-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** Project có nội dung + FX-MD-01

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-MD-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chọn Replace
   - **Expected:** Chỉ phạm vi được mô tả trong dialog bị thay; undo/snapshot có thể phục hồi
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Chỉ phạm vi được mô tả trong dialog bị thay; undo/snapshot có thể phục hồi
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F07@ENV-D1`, `F07@ENV-D2`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F08 — Import và OCR: Import và mở preview/check/export preview

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-MD-02` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Đúng 1 placeholder; 0 request chứa `images/x.png`; không có 404/pageerror

**Test data:** Dùng đúng fixture `FX-MD-02`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-MD-02, Network log sạch

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-MD-02`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import và mở preview/check/export preview
   - **Expected:** Đúng 1 placeholder; 0 request chứa `images/x.png`; không có 404/pageerror
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Đúng 1 placeholder; 0 request chứa `images/x.png`; không có 404/pageerror
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `F08@ENV-D1`, `F08@ENV-D2`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F09 — Import và OCR: Import

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-MD-03` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** 1 asset được ingest, preview hiển thị; save/reload còn ảnh

**Test data:** Dùng đúng fixture `FX-MD-03`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-MD-03

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-MD-03`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import
   - **Expected:** 1 asset được ingest, preview hiển thị; save/reload còn ảnh
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** 1 asset được ingest, preview hiển thị; save/reload còn ảnh
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F09@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F10 — Import và OCR: Import/chọn mapping

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-MAP-01` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** UI buộc chọn rõ file hoặc dùng quy tắc xác định; asset hash sau import khớp lựa chọn, không gắn nhầm âm thầm

**Test data:** Dùng đúng fixture `FX-MAP-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-MAP-01

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-MAP-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import/chọn mapping
   - **Expected:** UI buộc chọn rõ file hoặc dùng quy tắc xác định; asset hash sau import khớp lựa chọn, không gắn nhầm âm thầm
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** UI buộc chọn rõ file hoặc dùng quy tắc xác định; asset hash sau import khớp lựa chọn, không gắn nhầm âm thầm
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F10@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F11 — Import và OCR: Import

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-IMG-03` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Ảnh bị skip/placeholder với warning; phần text vẫn import; không vượt storage

**Test data:** Dùng đúng fixture `FX-IMG-03`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-IMG-03 nhúng/kèm import

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-IMG-03`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import
   - **Expected:** Ảnh bị skip/placeholder với warning; phần text vẫn import; không vượt storage
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F11; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Ảnh bị skip/placeholder với warning; phần text vẫn import; không vượt storage
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F11@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F12 — Import và OCR: Import riêng

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-IMP-05`, `FX-IMP-04` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** File đúng giới hạn không bị rule size chặn; `+1 byte` bị `file-too-large`; không treo UI

**Test data:** Dùng đúng fixture `FX-IMP-05`, `FX-IMP-04`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-IMP-05 và FX-IMP-04

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-IMP-05`, `FX-IMP-04`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import riêng
   - **Expected:** File đúng giới hạn không bị rule size chặn; `+1 byte` bị `file-too-large`; không treo UI
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F12; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** File đúng giới hạn không bị rule size chặn; `+1 byte` bị `file-too-large`; không treo UI
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F12[FX-IMP-05]@ENV-D1`, `F12[FX-IMP-04]@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F13 — Import và OCR: Import riêng từng file

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-IMP-01`, `FX-IMP-02`, `FX-IMP-03` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Báo lỗi cụ thể/thân thiện; project hash không đổi; dialog đóng/Retry hoạt động

**Test data:** Dùng đúng fixture `FX-IMP-01`, `FX-IMP-02`, `FX-IMP-03`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-IMP-01, FX-IMP-02, FX-IMP-03

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-IMP-01`, `FX-IMP-02`, `FX-IMP-03`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import riêng từng file
   - **Expected:** Báo lỗi cụ thể/thân thiện; project hash không đổi; dialog đóng/Retry hoạt động
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F13; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Báo lỗi cụ thể/thân thiện; project hash không đổi; dialog đóng/Retry hoạt động
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F13[FX-IMP-01]@ENV-D1`, `F13[FX-IMP-02]@ENV-D1`, `F13[FX-IMP-03]@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F14 — Import và OCR: Import

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-PDF-03` |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không tự chạy OCR; scan được đánh dấu/cung cấp lựa chọn OCR

**Test data:** Dùng đúng fixture `FX-PDF-03`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-PDF-03, OCR mặc định tắt

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-PDF-03`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import
   - **Expected:** Không tự chạy OCR; scan được đánh dấu/cung cấp lựa chọn OCR
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F14; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không tự chạy OCR; scan được đánh dấu/cung cấp lựa chọn OCR
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F14@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F15 — Import và OCR: Chạy OCR

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-PDF-03` |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Có tiến trình; text output và số trang đạt manifest/tolerance đã ghi; OCR chạy local

**Test data:** Dùng đúng fixture `FX-PDF-03`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-PDF-03, bật OCR

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-PDF-03`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy OCR
   - **Expected:** Có tiến trình; text output và số trang đạt manifest/tolerance đã ghi; OCR chạy local
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F15; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Có tiến trình; text output và số trang đạt manifest/tolerance đã ghi; OCR chạy local
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F15@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F16 — Import và OCR: Bấm Cancel

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Worker/request dừng; UI hết loading; không áp draft nửa chừng

**Test data:** OCR/import đang chạy

**Tiền điều kiện:** OCR/import đang chạy

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: OCR/import đang chạy
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Bấm Cancel
   - **Expected:** Worker/request dừng; UI hết loading; không áp draft nửa chừng
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F16; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Worker/request dừng; UI hết loading; không áp draft nửa chừng
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F16@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F17 — Import và OCR: Chạy OCR

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Hoạt động offline hoặc báo thiếu cache có hướng dẫn; không gọi CDN ngoài allowlist

**Test data:** App đã cache OCR assets rồi offline

**Tiền điều kiện:** App đã cache OCR assets rồi offline

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: App đã cache OCR assets rồi offline
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy OCR
   - **Expected:** Hoạt động offline hoặc báo thiếu cache có hướng dẫn; không gọi CDN ngoài allowlist
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F17; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Hoạt động offline hoặc báo thiếu cache có hướng dẫn; không gọi CDN ngoài allowlist
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F17@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F18 — Import và OCR: Import archive và theo dõi thời gian/heap

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-002` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-IMP-06` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 16 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Fail nhanh với warning ổn định; không giải nén payload; UI/worker vẫn responsive.

**Test data:** Dùng đúng fixture `FX-IMP-06`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-IMP-06 ZIP có compression ratio vượt policy

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-IMP-06`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import archive và theo dõi thời gian/heap
   - **Expected:** Fail nhanh với warning ổn định; không giải nén payload; UI/worker vẫn responsive.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F18; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Fail nhanh với warning ổn định; không giải nén payload; UI/worker vẫn responsive.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `F18@ENV-D1`, `F18@ENV-D2`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F19 — Import và OCR: Import archive

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-002` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-IMP-07` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 16 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Bị từ chối trước khi materialize output; project không đổi; không treo tab.

**Test data:** Dùng đúng fixture `FX-IMP-07`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-IMP-07 ZIP vượt tổng uncompressed bytes

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-IMP-07`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import archive
   - **Expected:** Bị từ chối trước khi materialize output; project không đổi; không treo tab.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F19; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Bị từ chối trước khi materialize output; project không đổi; không treo tab.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `F19@ENV-D1`, `F19@ENV-D2`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F20 — Import và OCR: Import archive

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-002` |
| Environment | `ENV-D1` |
| Fixtures | `FX-IMP-08` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Bị chặn theo resource policy với count thực tế và limit; cleanup đầy đủ.

**Test data:** Dùng đúng fixture `FX-IMP-08`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-IMP-08 ZIP vượt entry/file count

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-IMP-08`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import archive
   - **Expected:** Bị chặn theo resource policy với count thực tế và limit; cleanup đầy đủ.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F20; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Bị chặn theo resource policy với count thực tế và limit; cleanup đầy đủ.
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F20@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F21 — Import và OCR: Import archive

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-002` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-IMP-09` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không entry nào thoát sandbox hoặc ghi đè; import bị từ chối và project giữ nguyên.

**Test data:** Dùng đúng fixture `FX-IMP-09`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-IMP-09 ZIP có path traversal và duplicate normalized path

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-IMP-09`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Import archive
   - **Expected:** Không entry nào thoát sandbox hoặc ghi đè; import bị từ chối và project giữ nguyên.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F21; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không entry nào thoát sandbox hoặc ghi đè; import bị từ chối và project giữ nguyên.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `F21@ENV-D1`, `F21@ENV-D2`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F22 — Import và OCR: Chạy OCR

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-002` |
| Environment | `ENV-D1` |
| Fixtures | `FX-OCR-01` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** OCR bị chặn theo budget trước cấp phát lớn; UI có hướng dẫn và vẫn responsive.

**Test data:** Dùng đúng fixture `FX-OCR-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-OCR-01 vượt page/pixel budget

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-OCR-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy OCR
   - **Expected:** OCR bị chặn theo budget trước cấp phát lớn; UI có hướng dẫn và vẫn responsive.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F22; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** OCR bị chặn theo budget trước cấp phát lớn; UI có hướng dẫn và vẫn responsive.
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F22@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

### F23 — Import và OCR: Cancel rồi chạy một import nhỏ hợp lệ

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-F-002` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Worker abort sạch; không có state nửa chừng; ca nhỏ tiếp theo Pass.

**Test data:** Import/OCR adversarial đang chạy

**Tiền điều kiện:** Import/OCR adversarial đang chạy

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh fixture ID, SHA-256 và oracle trong manifest; tạo project đích sạch trước khi import/OCR.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Import/OCR adversarial đang chạy
   - **Expected:** Worker/import boundary sẵn sàng; không có asset, section hoặc request còn sót từ case trước. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Cancel rồi chạy một import nhỏ hợp lệ
   - **Expected:** Worker abort sạch; không có state nửa chừng; ca nhỏ tiếp theo Pass.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của F23; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Worker abort sạch; không có state nửa chừng; ca nhỏ tiếp theo Pass.
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `F23@ENV-D1`

**Cleanup/isolation:** Hủy worker/job còn chạy, revoke object URL, xóa project import và file sinh tạm.

## G — Evidence Kit

### G01 — Evidence Kit: Tạo một evidence

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-G-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, smoke, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Đúng kind/label/icon/form; lưu đúng một record; reload còn nguyên

**Test data:** `[mỗi evidence kind]`, URL/metadata hợp lệ cố định

**Tiền điều kiện:** `[mỗi evidence kind]`, URL/metadata hợp lệ cố định

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng và dữ liệu evidence synthetic đúng loại/URL/note theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: `[mỗi evidence kind]`, URL/metadata hợp lệ cố định
   - **Expected:** Evidence Kit tải xong; danh sách, QR state và storage baseline đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tạo một evidence
   - **Expected:** Đúng kind/label/icon/form; lưu đúng một record; reload còn nguyên
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của G01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Đúng kind/label/icon/form; lưu đúng một record; reload còn nguyên
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `G01[video]@ENV-D1`, `G01[video]@ENV-D2`, `G01[github]@ENV-D1`, `G01[github]@ENV-D2`, `G01[deploy]@ENV-D1`, `G01[deploy]@ENV-D2`, `G01[drive]@ENV-D1`, `G01[drive]@ENV-D2`, `G01[figma]@ENV-D1`, `G01[figma]@ENV-D2`, `G01[account]@ENV-D1`, `G01[account]@ENV-D2`, `G01[api-docs]@ENV-D1`, `G01[api-docs]@ENV-D2`, `G01[slide]@ENV-D1`, `G01[slide]@ENV-D2`, `G01[other]@ENV-D1`, `G01[other]@ENV-D2`

**Cleanup/isolation:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.

### G02 — Evidence Kit: Submit riêng từng input

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-G-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Input không hợp lệ bị chặn; không lưu record; message gắn đúng field

**Test data:** URL rỗng, text thường, `javascript:`, `data:`, URL sai host theo từng kind

**Tiền điều kiện:** URL rỗng, text thường, `javascript:`, `data:`, URL sai host theo từng kind

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng và dữ liệu evidence synthetic đúng loại/URL/note theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: URL rỗng, text thường, `javascript:`, `data:`, URL sai host theo từng kind
   - **Expected:** Evidence Kit tải xong; danh sách, QR state và storage baseline đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Submit riêng từng input
   - **Expected:** Input không hợp lệ bị chặn; không lưu record; message gắn đúng field
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của G02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Input không hợp lệ bị chặn; không lưu record; message gắn đúng field
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `G02@ENV-D1`

**Cleanup/isolation:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.

### G03 — Evidence Kit: Bật QR và quét bằng thiết bị/decoder

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-G-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-A11Y`, `ENV-M1` |
| Fixtures | Không |
| Suite | full, smoke |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** QR giải mã đúng chính xác URL; không tự phát network request tới URL

**Test data:** Evidence URL HTTPS hợp lệ

**Tiền điều kiện:** Evidence URL HTTPS hợp lệ

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng và dữ liệu evidence synthetic đúng loại/URL/note theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Evidence URL HTTPS hợp lệ
   - **Expected:** Evidence Kit tải xong; danh sách, QR state và storage baseline đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Bật QR và quét bằng thiết bị/decoder
   - **Expected:** QR giải mã đúng chính xác URL; không tự phát network request tới URL
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của G03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** QR giải mã đúng chính xác URL; không tự phát network request tới URL
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `G03@ENV-D1`, `G03@ENV-D2`, `G03@ENV-A11Y`, `G03@ENV-M1`

**Cleanup/isolation:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.

### G04 — Evidence Kit: Mở appendix

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-G-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Đủ 3 dòng đúng thứ tự; đúng 2 QR; không lộ field bí mật ngoài spec

**Test data:** 3 evidence, 2 bật QR

**Tiền điều kiện:** 3 evidence, 2 bật QR

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng và dữ liệu evidence synthetic đúng loại/URL/note theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 3 evidence, 2 bật QR
   - **Expected:** Evidence Kit tải xong; danh sách, QR state và storage baseline đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở appendix
   - **Expected:** Đủ 3 dòng đúng thứ tự; đúng 2 QR; không lộ field bí mật ngoài spec
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của G04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Đủ 3 dòng đúng thứ tự; đúng 2 QR; không lộ field bí mật ngoài spec
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `G04@ENV-D1`, `G04@ENV-D2`

**Cleanup/isolation:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.

### G05 — Evidence Kit: Gắn mỗi evidence vào section khác nhau

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-G-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Quan hệ đúng; appendix/QA prompt phản ánh đúng mapping

**Test data:** 2 section và 2 evidence

**Tiền điều kiện:** 2 section và 2 evidence

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng và dữ liệu evidence synthetic đúng loại/URL/note theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 2 section và 2 evidence
   - **Expected:** Evidence Kit tải xong; danh sách, QR state và storage baseline đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Gắn mỗi evidence vào section khác nhau
   - **Expected:** Quan hệ đúng; appendix/QA prompt phản ánh đúng mapping
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của G05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Quan hệ đúng; appendix/QA prompt phản ánh đúng mapping
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `G05@ENV-D1`

**Cleanup/isolation:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.

### G06 — Evidence Kit: Sửa title/URL

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-G-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Danh sách, QR, appendix và mapping cập nhật; không còn URL cũ

**Test data:** Evidence đã gắn và bật QR

**Tiền điều kiện:** Evidence đã gắn và bật QR

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng và dữ liệu evidence synthetic đúng loại/URL/note theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Evidence đã gắn và bật QR
   - **Expected:** Evidence Kit tải xong; danh sách, QR state và storage baseline đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Sửa title/URL
   - **Expected:** Danh sách, QR, appendix và mapping cập nhật; không còn URL cũ
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của G06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Danh sách, QR, appendix và mapping cập nhật; không còn URL cũ
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `G06@ENV-D1`

**Cleanup/isolation:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.

### G07 — Evidence Kit: Xóa và xác nhận

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-G-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Record, QR, appendix và liên kết biến mất; section/report khác không đổi

**Test data:** Evidence đã gắn

**Tiền điều kiện:** Evidence đã gắn

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng và dữ liệu evidence synthetic đúng loại/URL/note theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Evidence đã gắn
   - **Expected:** Evidence Kit tải xong; danh sách, QR state và storage baseline đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xóa và xác nhận
   - **Expected:** Record, QR, appendix và liên kết biến mất; section/report khác không đổi
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của G07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Record, QR, appendix và liên kết biến mất; section/report khác không đổi
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `G07@ENV-D1`

**Cleanup/isolation:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.

### G08 — Evidence Kit: Tạo/sửa evidence và QR

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-G-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** CRUD/QR local hoạt động; mở URL ngoài chỉ thất bại theo browser, không làm mất record

**Test data:** Offline

**Tiền điều kiện:** Offline

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo project riêng và dữ liệu evidence synthetic đúng loại/URL/note theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Offline
   - **Expected:** Evidence Kit tải xong; danh sách, QR state và storage baseline đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tạo/sửa evidence và QR
   - **Expected:** CRUD/QR local hoạt động; mở URL ngoài chỉ thất bại theo browser, không làm mất record
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của G08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** CRUD/QR local hoạt động; mở URL ngoài chỉ thất bại theo browser, không làm mất record
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `G08@ENV-D1`

**Cleanup/isolation:** Xóa evidence/QR/artifact tạm, revoke URL và xóa project thử.

## H — Export HTML/PDF/DOCX

### H01 — Export HTML/PDF/DOCX: Ctrl+Shift+E

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-A11Y`, `ENV-M1`, `ENV-R1` |
| Fixtures | Không |
| Suite | full, smoke, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Export panel mở, hiện HTML/PDF/DOCX; focus vào panel đúng

**Test data:** Bundle sạch checker

**Tiền điều kiện:** Bundle sạch checker

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Bundle sạch checker
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Ctrl+Shift+E
   - **Expected:** Export panel mở, hiện HTML/PDF/DOCX; focus vào panel đúng
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Export panel mở, hiện HTML/PDF/DOCX; focus vào panel đúng
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H01@ENV-D1`, `H01@ENV-D2`, `H01@ENV-A11Y`, `H01@ENV-M1`, `H01@ENV-R1`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H02 — Export HTML/PDF/DOCX: Xuất HTML

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e, manual, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, smoke, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** File `.html` verified; mở offline đủ nội dung; font/ảnh inline, Mermaid SVG tĩnh; CSP không cho script/CDN

**Test data:** Bundle sạch có KaTeX/Mermaid/ảnh

**Tiền điều kiện:** Bundle sạch có KaTeX/Mermaid/ảnh

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Bundle sạch có KaTeX/Mermaid/ảnh
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xuất HTML
   - **Expected:** File `.html` verified; mở offline đủ nội dung; font/ảnh inline, Mermaid SVG tĩnh; CSP không cho script/CDN
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** File `.html` verified; mở offline đủ nội dung; font/ảnh inline, Mermaid SVG tĩnh; CSP không cho script/CDN
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H02@ENV-D1`, `H02@ENV-D2`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H03 — Export HTML/PDF/DOCX: Xuất DOCX

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** ZIP container DOCX hợp lệ; Word mở không repair; heading/table/image/layout theo manifest; artifact verified

**Test data:** Bundle sạch có heading/table/ảnh

**Tiền điều kiện:** Bundle sạch có heading/table/ảnh

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Bundle sạch có heading/table/ảnh
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xuất DOCX
   - **Expected:** ZIP container DOCX hợp lệ; Word mở không repair; heading/table/image/layout theo manifest; artifact verified
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** ZIP container DOCX hợp lệ; Word mở không repair; heading/table/image/layout theo manifest; artifact verified
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H03@ENV-D1`, `H03@ENV-D2`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H04 — Export HTML/PDF/DOCX: Xuất PDF

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** MIME PDF, header `%PDF-`, page/text/image theo manifest; artifact verified; renderer không lưu/log nội dung

**Test data:** PDF renderer ready

**Tiền điều kiện:** PDF renderer ready

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: PDF renderer ready
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xuất PDF
   - **Expected:** MIME PDF, header `%PDF-`, page/text/image theo manifest; artifact verified; renderer không lưu/log nội dung
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** MIME PDF, header `%PDF-`, page/text/image theo manifest; artifact verified; renderer không lưu/log nội dung
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H04@ENV-D1`, `H04@ENV-D2`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H05 — Export HTML/PDF/DOCX: Mở preflight và thử tiếp tục

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Target bị chặn; nút bypass disabled; không download, không gọi renderer, không tạo job done

**Test data:** `[html,pdf,docx]`; bundle có đúng 1 checker `error`

**Tiền điều kiện:** `[html,pdf,docx]`; bundle có đúng 1 checker `error`

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: `[html,pdf,docx]`; bundle có đúng 1 checker `error`
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở preflight và thử tiếp tục
   - **Expected:** Target bị chặn; nút bypass disabled; không download, không gọi renderer, không tạo job done
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Target bị chặn; nút bypass disabled; không download, không gọi renderer, không tạo job done
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H05[html]@ENV-D1`, `H05[html]@ENV-D2`, `H05[pdf]@ENV-D1`, `H05[pdf]@ENV-D2`, `H05[docx]@ENV-D1`, `H05[docx]@ENV-D2`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H06 — Export HTML/PDF/DOCX: Chọn “Vẫn xuất bản”

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Chỉ target đã chọn được xuất; warning còn ghi nhận; artifact hợp lệ

**Test data:** `[html,pdf,docx]`; bundle chỉ có warning

**Tiền điều kiện:** `[html,pdf,docx]`; bundle chỉ có warning

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: `[html,pdf,docx]`; bundle chỉ có warning
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chọn “Vẫn xuất bản”
   - **Expected:** Chỉ target đã chọn được xuất; warning còn ghi nhận; artifact hợp lệ
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Chỉ target đã chọn được xuất; warning còn ghi nhận; artifact hợp lệ
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H06[html]@ENV-D1`, `H06[pdf]@ENV-D1`, `H06[docx]@ENV-D1`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H07 — Export HTML/PDF/DOCX: Print Preview local

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Browser print mở; không tạo artifact/job/history

**Test data:** Bundle bất kỳ

**Tiền điều kiện:** Bundle bất kỳ

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Bundle bất kỳ
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Print Preview local
   - **Expected:** Browser print mở; không tạo artifact/job/history
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Browser print mở; không tạo artifact/job/history
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H07@ENV-D1`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H08 — Export HTML/PDF/DOCX: Xem history, reload

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Hai job `done` đúng target/time/file/SHA/verified; history còn sau reload

**Test data:** Xuất thành công HTML rồi DOCX

**Tiền điều kiện:** Xuất thành công HTML rồi DOCX

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Xuất thành công HTML rồi DOCX
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xem history, reload
   - **Expected:** Hai job `done` đúng target/time/file/SHA/verified; history còn sau reload
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Hai job `done` đúng target/time/file/SHA/verified; history còn sau reload
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H08@ENV-D1`, `H08@ENV-D2`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H09 — Export HTML/PDF/DOCX: Retry đúng job

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Job cũ chuyển running→done hoặc được cập nhật theo spec; chỉ tải đúng một artifact thành công

**Test data:** Tạo lỗi recoverable PDF 503/504 rồi khôi phục renderer

**Tiền điều kiện:** Tạo lỗi recoverable PDF 503/504 rồi khôi phục renderer

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Tạo lỗi recoverable PDF 503/504 rồi khôi phục renderer
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Retry đúng job
   - **Expected:** Job cũ chuyển running→done hoặc được cập nhật theo spec; chỉ tải đúng một artifact thành công
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Job cũ chuyển running→done hoặc được cập nhật theo spec; chỉ tải đúng một artifact thành công
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H09@ENV-D1`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H10 — Export HTML/PDF/DOCX: Xuất từng target

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Mỗi artifact có QR giải mã đúng URL

**Test data:** 1 evidence bật QR; `[html,pdf,docx]`

**Tiền điều kiện:** 1 evidence bật QR; `[html,pdf,docx]`

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 1 evidence bật QR; `[html,pdf,docx]`
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xuất từng target
   - **Expected:** Mỗi artifact có QR giải mã đúng URL
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Mỗi artifact có QR giải mã đúng URL
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H10[html]@ENV-D1`, `H10[pdf]@ENV-D1`, `H10[docx]@ENV-D1`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H11 — Export HTML/PDF/DOCX: Xuất từng target

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, manual, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Tên file được slug/sanitize, đúng extension, không rỗng/path traversal

**Test data:** Title Unicode và các ký tự tên file bị cấm trên Windows

**Tiền điều kiện:** Title Unicode và các ký tự tên file bị cấm trên Windows

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Title Unicode và các ký tự tên file bị cấm trên Windows
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xuất từng target
   - **Expected:** Tên file được slug/sanitize, đúng extension, không rỗng/path traversal
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H11; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Tên file được slug/sanitize, đúng extension, không rỗng/path traversal
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H11@ENV-D1`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H12 — Export HTML/PDF/DOCX: Double-click nút export

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** UI ngăn duplicate ngoài ý muốn hoặc hiển thị rõ hai job theo spec; không corrupt download/history

**Test data:** Export đang running

**Tiền điều kiện:** Export đang running

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Export đang running
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Double-click nút export
   - **Expected:** UI ngăn duplicate ngoài ý muốn hoặc hiển thị rõ hai job theo spec; không corrupt download/history
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H12; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** UI ngăn duplicate ngoài ý muốn hoặc hiển thị rõ hai job theo spec; không corrupt download/history
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H12@ENV-D1`, `H12@ENV-D2`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H13 — Export HTML/PDF/DOCX: Xuất PDF

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, manual, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Message phân biệt bận/không khả dụng/timeout, có Retry-After khi có; gợi ý Print Preview; không tạo artifact giả

**Test data:** Mock PDF lần lượt 429/503/504

**Tiền điều kiện:** Mock PDF lần lượt 429/503/504

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Mock PDF lần lượt 429/503/504
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xuất PDF
   - **Expected:** Message phân biệt bận/không khả dụng/timeout, có Retry-After khi có; gợi ý Print Preview; không tạo artifact giả
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H13; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Message phân biệt bận/không khả dụng/timeout, có Retry-After khi có; gợi ý Print Preview; không tạo artifact giả
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H13@ENV-D1`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

### H14 — Export HTML/PDF/DOCX: Tự tính SHA-256 và parse MIME/container

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-H-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** SHA khớp metadata; byteLength >0; `verified=true` chỉ khi kiểm tra thật sự Pass

**Test data:** Artifact của H02–H04

**Tiền điều kiện:** Artifact của H02–H04

**Các bước thực thi và expected result:**

1. **Thao tác:** Xác minh renderer readiness, fixture/golden và bundle nguồn; dùng thư mục download riêng cho HTML/PDF/DOCX.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Artifact của H02–H04
   - **Expected:** Không có export job cũ; renderer/build đúng commit và download directory trống. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tự tính SHA-256 và parse MIME/container
   - **Expected:** SHA khớp metadata; byteLength >0; `verified=true` chỉ khi kiểm tra thật sự Pass
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của H14; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** SHA khớp metadata; byteLength >0; `verified=true` chỉ khi kiểm tra thật sự Pass
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `H14@ENV-D1`

**Cleanup/isolation:** Xóa artifact/download tạm, đóng ứng dụng đọc file và xác nhận export job đã kết thúc.

## I — Nộp bài

### I01 — Nộp bài: Mở Nộp bài

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-I-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-A11Y`, `ENV-M1`, `ENV-R1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Nhắc chạy Soát lỗi; không giả định báo cáo sạch

**Test data:** Chưa chạy checker

**Tiền điều kiện:** Chưa chạy checker

**Các bước thực thi và expected result:**

1. **Thao tác:** Chuẩn bị artifact đã parse/hash và mở flow Nộp bài bằng project/dữ liệu synthetic theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Chưa chạy checker
   - **Expected:** Submission state sạch; checklist, package directory và target metadata ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở Nộp bài
   - **Expected:** Nhắc chạy Soát lỗi; không giả định báo cáo sạch
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của I01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Nhắc chạy Soát lỗi; không giả định báo cáo sạch
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `I01@ENV-D1`, `I01@ENV-D2`, `I01@ENV-A11Y`, `I01@ENV-M1`, `I01@ENV-R1`

**Cleanup/isolation:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.

### I02 — Nộp bài: Mở checklist từng lần

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-I-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** 79 Fail readiness; 80 Pass readiness; threshold hiển thị rõ

**Test data:** Checker score 79 rồi 80, không error

**Tiền điều kiện:** Checker score 79 rồi 80, không error

**Các bước thực thi và expected result:**

1. **Thao tác:** Chuẩn bị artifact đã parse/hash và mở flow Nộp bài bằng project/dữ liệu synthetic theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Checker score 79 rồi 80, không error
   - **Expected:** Submission state sạch; checklist, package directory và target metadata ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở checklist từng lần
   - **Expected:** 79 Fail readiness; 80 Pass readiness; threshold hiển thị rõ
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của I02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** 79 Fail readiness; 80 Pass readiness; threshold hiển thị rõ
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `I02@ENV-D1`

**Cleanup/isolation:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.

### I03 — Nộp bài: Đi tới bước Đóng gói

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-I-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Checklist lịch sử Pass mục exported; có cảnh báo ZIP không kèm report

**Test data:** History có export done từ phiên trước, không có Blob phiên hiện tại

**Tiền điều kiện:** History có export done từ phiên trước, không có Blob phiên hiện tại

**Các bước thực thi và expected result:**

1. **Thao tác:** Chuẩn bị artifact đã parse/hash và mở flow Nộp bài bằng project/dữ liệu synthetic theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: History có export done từ phiên trước, không có Blob phiên hiện tại
   - **Expected:** Submission state sạch; checklist, package directory và target metadata ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Đi tới bước Đóng gói
   - **Expected:** Checklist lịch sử Pass mục exported; có cảnh báo ZIP không kèm report
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của I03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Checklist lịch sử Pass mục exported; có cảnh báo ZIP không kèm report
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `I03@ENV-D1`

**Cleanup/isolation:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.

### I04 — Nộp bài: Tải ZIP

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-I-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Cho tải `<project-slug>-evidence.zip`; ZIP có README/manifest/appendix theo spec và **không** có report artifact

**Test data:** Không Blob phiên hiện tại, không preflight error

**Tiền điều kiện:** Không Blob phiên hiện tại, không preflight error

**Các bước thực thi và expected result:**

1. **Thao tác:** Chuẩn bị artifact đã parse/hash và mở flow Nộp bài bằng project/dữ liệu synthetic theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Không Blob phiên hiện tại, không preflight error
   - **Expected:** Submission state sạch; checklist, package directory và target metadata ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tải ZIP
   - **Expected:** Cho tải `<project-slug>-evidence.zip`; ZIP có README/manifest/appendix theo spec và **không** có report artifact
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của I04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Cho tải `<project-slug>-evidence.zip`; ZIP có README/manifest/appendix theo spec và **không** có report artifact
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `I04@ENV-D1`, `I04@ENV-D2`

**Cleanup/isolation:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.

### I05 — Nộp bài: Tải ZIP

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-I-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** ZIP chứa đúng hai artifact + README/manifest/appendix; hash/file list khớp manifest

**Test data:** Có HTML/DOCX Blob verified trong phiên, không error

**Tiền điều kiện:** Có HTML/DOCX Blob verified trong phiên, không error

**Các bước thực thi và expected result:**

1. **Thao tác:** Chuẩn bị artifact đã parse/hash và mở flow Nộp bài bằng project/dữ liệu synthetic theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Có HTML/DOCX Blob verified trong phiên, không error
   - **Expected:** Submission state sạch; checklist, package directory và target metadata ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tải ZIP
   - **Expected:** ZIP chứa đúng hai artifact + README/manifest/appendix; hash/file list khớp manifest
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của I05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** ZIP chứa đúng hai artifact + README/manifest/appendix; hash/file list khớp manifest
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `I05@ENV-D1`, `I05@ENV-D2`

**Cleanup/isolation:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.

### I06 — Nộp bài: Đi tiếp/tải ZIP

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-I-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Dialog liệt kê error; “Vẫn tải xuống” disabled; không tạo download

**Test data:** Có checker `error`

**Tiền điều kiện:** Có checker `error`

**Các bước thực thi và expected result:**

1. **Thao tác:** Chuẩn bị artifact đã parse/hash và mở flow Nộp bài bằng project/dữ liệu synthetic theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Có checker `error`
   - **Expected:** Submission state sạch; checklist, package directory và target metadata ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Đi tiếp/tải ZIP
   - **Expected:** Dialog liệt kê error; “Vẫn tải xuống” disabled; không tạo download
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của I06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Dialog liệt kê error; “Vẫn tải xuống” disabled; không tạo download
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `I06@ENV-D1`, `I06@ENV-D2`

**Cleanup/isolation:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.

### I07 — Nộp bài: Xác nhận tải ZIP

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-I-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Cho tải; ZIP hợp lệ; warning không biến thành error

**Test data:** Chỉ có warning

**Tiền điều kiện:** Chỉ có warning

**Các bước thực thi và expected result:**

1. **Thao tác:** Chuẩn bị artifact đã parse/hash và mở flow Nộp bài bằng project/dữ liệu synthetic theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Chỉ có warning
   - **Expected:** Submission state sạch; checklist, package directory và target metadata ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xác nhận tải ZIP
   - **Expected:** Cho tải; ZIP hợp lệ; warning không biến thành error
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của I07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Cho tải; ZIP hợp lệ; warning không biến thành error
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `I07@ENV-D1`, `I07@ENV-D2`

**Cleanup/isolation:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.

### I08 — Nộp bài: Giải nén và kiểm từng entry

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-I-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không path traversal/trùng tên; CRC/container hợp lệ; manifest hash khớp artifact

**Test data:** ZIP từ I05

**Tiền điều kiện:** ZIP từ I05

**Các bước thực thi và expected result:**

1. **Thao tác:** Chuẩn bị artifact đã parse/hash và mở flow Nộp bài bằng project/dữ liệu synthetic theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: ZIP từ I05
   - **Expected:** Submission state sạch; checklist, package directory và target metadata ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Giải nén và kiểm từng entry
   - **Expected:** Không path traversal/trùng tên; CRC/container hợp lệ; manifest hash khớp artifact
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của I08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không path traversal/trùng tên; CRC/container hợp lệ; manifest hash khớp artifact
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `I08@ENV-D1`

**Cleanup/isolation:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.

### I09 — Nộp bài: Mở Nộp bài

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-I-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** History còn, nhưng Blob phiên trước không được giả là còn; cảnh báo xuất lại chính xác

**Test data:** Tạo export, reload app

**Tiền điều kiện:** Tạo export, reload app

**Các bước thực thi và expected result:**

1. **Thao tác:** Chuẩn bị artifact đã parse/hash và mở flow Nộp bài bằng project/dữ liệu synthetic theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Tạo export, reload app
   - **Expected:** Submission state sạch; checklist, package directory và target metadata ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở Nộp bài
   - **Expected:** History còn, nhưng Blob phiên trước không được giả là còn; cảnh báo xuất lại chính xác
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của I09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** History còn, nhưng Blob phiên trước không được giả là còn; cảnh báo xuất lại chính xác
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `I09@ENV-D1`

**Cleanup/isolation:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.

### I10 — Nộp bài: Tải ZIP

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | e2e, integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-I-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Tên ZIP an toàn, đúng suffix; entry name hợp lệ trên Windows

**Test data:** Project title Unicode/ký tự cấm

**Tiền điều kiện:** Project title Unicode/ký tự cấm

**Các bước thực thi và expected result:**

1. **Thao tác:** Chuẩn bị artifact đã parse/hash và mở flow Nộp bài bằng project/dữ liệu synthetic theo tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Project title Unicode/ký tự cấm
   - **Expected:** Submission state sạch; checklist, package directory và target metadata ban đầu đã ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tải ZIP
   - **Expected:** Tên ZIP an toàn, đúng suffix; entry name hợp lệ trên Windows
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của I10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Tên ZIP an toàn, đúng suffix; entry name hợp lệ trên Windows
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `I10@ENV-D1`

**Cleanup/isolation:** Xóa package/submission record thử, revoke URL và xóa artifact tạm.

## J — Thuyết trình

### J01 — Thuyết trình: Mở tab Present

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-J-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-A11Y`, `ENV-M1`, `ENV-R1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Panel mở, không tự sửa report

**Test data:** Project có 5 section

**Tiền điều kiện:** Project có 5 section

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report đã check/export được và mở tab Present ở trạng thái ban đầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Project có 5 section
   - **Expected:** Presenter/defense state sạch; slide, keyboard, microphone và AI capability được ghi rõ. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở tab Present
   - **Expected:** Panel mở, không tự sửa report
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của J01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Panel mở, không tự sửa report
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `J01@ENV-D1`, `J01@ENV-D2`, `J01@ENV-A11Y`, `J01@ENV-M1`, `J01@ENV-R1`

**Cleanup/isolation:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.

### J02 — Thuyết trình: Sinh outline

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-J-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Số/thứ tự/title/bullet slide khớp manifest quy tắc

**Test data:** 5 section có heading/bullet cố định

**Tiền điều kiện:** 5 section có heading/bullet cố định

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report đã check/export được và mở tab Present ở trạng thái ban đầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 5 section có heading/bullet cố định
   - **Expected:** Presenter/defense state sạch; slide, keyboard, microphone và AI capability được ghi rõ. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Sinh outline
   - **Expected:** Số/thứ tự/title/bullet slide khớp manifest quy tắc
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của J02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Số/thứ tự/title/bullet slide khớp manifest quy tắc
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `J02@ENV-D1`, `J02@ENV-D2`

**Cleanup/isolation:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.

### J03 — Thuyết trình: Phân công/timeline

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-J-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Mọi slide có owner hợp lệ; tổng duration khớp; không trùng/mất slide

**Test data:** 2 speaker, 6 slide, tổng thời lượng cố định

**Tiền điều kiện:** 2 speaker, 6 slide, tổng thời lượng cố định

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report đã check/export được và mở tab Present ở trạng thái ban đầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: 2 speaker, 6 slide, tổng thời lượng cố định
   - **Expected:** Presenter/defense state sạch; slide, keyboard, microphone và AI capability được ghi rõ. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Phân công/timeline
   - **Expected:** Mọi slide có owner hợp lệ; tổng duration khớp; không trùng/mất slide
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của J03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Mọi slide có owner hợp lệ; tổng duration khớp; không trùng/mất slide
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `J03@ENV-D1`

**Cleanup/isolation:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.

### J04 — Thuyết trình: Sinh/xem script

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-J-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Mỗi slide có script đúng liên kết; sửa/lưu/reload không mất

**Test data:** Outline cố định

**Tiền điều kiện:** Outline cố định

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report đã check/export được và mở tab Present ở trạng thái ban đầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Outline cố định
   - **Expected:** Presenter/defense state sạch; slide, keyboard, microphone và AI capability được ghi rõ. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Sinh/xem script
   - **Expected:** Mỗi slide có script đúng liên kết; sửa/lưu/reload không mất
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của J04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Mỗi slide có script đúng liên kết; sửa/lưu/reload không mất
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `J04@ENV-D1`

**Cleanup/isolation:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.

### J05 — Thuyết trình: Sinh Q&A

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-J-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Có danh sách không rỗng, liên kết section hợp lệ, không render HTML độc

**Test data:** Report fixture cố định

**Tiền điều kiện:** Report fixture cố định

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report đã check/export được và mở tab Present ở trạng thái ban đầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Report fixture cố định
   - **Expected:** Presenter/defense state sạch; slide, keyboard, microphone và AI capability được ghi rõ. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Sinh Q&A
   - **Expected:** Có danh sách không rỗng, liên kết section hợp lệ, không render HTML độc
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của J05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Có danh sách không rỗng, liên kết section hợp lệ, không render HTML độc
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `J05@ENV-D1`

**Cleanup/isolation:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.

### J06 — Thuyết trình: Chạy Mock Defense

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-J-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Điều hướng câu hỏi/đáp án/kết thúc phiên đúng; không mất dữ liệu Present

**Test data:** Q&A fixture

**Tiền điều kiện:** Q&A fixture

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report đã check/export được và mở tab Present ở trạng thái ban đầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Q&A fixture
   - **Expected:** Presenter/defense state sạch; slide, keyboard, microphone và AI capability được ghi rõ. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy Mock Defense
   - **Expected:** Điều hướng câu hỏi/đáp án/kết thúc phiên đúng; không mất dữ liệu Present
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của J06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Điều hướng câu hỏi/đáp án/kết thúc phiên đúng; không mất dữ liệu Present
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `J06@ENV-D1`

**Cleanup/isolation:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.

### J07 — Thuyết trình: Chạy weak-sections

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-J-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Chỉ ra đúng section theo rule/threshold hiện hành

**Test data:** Một section rỗng, một section ngắn, một section đủ

**Tiền điều kiện:** Một section rỗng, một section ngắn, một section đủ

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report đã check/export được và mở tab Present ở trạng thái ban đầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Một section rỗng, một section ngắn, một section đủ
   - **Expected:** Presenter/defense state sạch; slide, keyboard, microphone và AI capability được ghi rõ. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy weak-sections
   - **Expected:** Chỉ ra đúng section theo rule/threshold hiện hành
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của J07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Chỉ ra đúng section theo rule/threshold hiện hành
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `J07@ENV-D1`

**Cleanup/isolation:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.

### J08 — Thuyết trình: Xuất PPTX

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | e2e, component, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-J-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Container PPTX hợp lệ; PowerPoint mở không repair; slide order/text/notes đúng; artifact verified

**Test data:** Slide + speaker + script

**Tiền điều kiện:** Slide + speaker + script

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report đã check/export được và mở tab Present ở trạng thái ban đầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Slide + speaker + script
   - **Expected:** Presenter/defense state sạch; slide, keyboard, microphone và AI capability được ghi rõ. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xuất PPTX
   - **Expected:** Container PPTX hợp lệ; PowerPoint mở không repair; slide order/text/notes đúng; artifact verified
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của J08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Container PPTX hợp lệ; PowerPoint mở không repair; slide order/text/notes đúng; artifact verified
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `J08@ENV-D1`, `J08@ENV-D2`

**Cleanup/isolation:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.

### J09 — Thuyết trình: Xuất PPTX

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-J-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Báo chưa có nội dung slide; không download/job done

**Test data:** Không có slide

**Tiền điều kiện:** Không có slide

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report đã check/export được và mở tab Present ở trạng thái ban đầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Không có slide
   - **Expected:** Presenter/defense state sạch; slide, keyboard, microphone và AI capability được ghi rõ. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xuất PPTX
   - **Expected:** Báo chưa có nội dung slide; không download/job done
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của J09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Báo chưa có nội dung slide; không download/job done
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `J09@ENV-D1`, `J09@ENV-D2`

**Cleanup/isolation:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.

### J10 — Thuyết trình: Xuất PPTX

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | e2e, component, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-J-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Vẫn xuất thành công; lỗi thân báo cáo không chặn PPTX

**Test data:** Report có checker `error`, slide hợp lệ

**Tiền điều kiện:** Report có checker `error`, slide hợp lệ

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo report đã check/export được và mở tab Present ở trạng thái ban đầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Report có checker `error`, slide hợp lệ
   - **Expected:** Presenter/defense state sạch; slide, keyboard, microphone và AI capability được ghi rõ. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Xuất PPTX
   - **Expected:** Vẫn xuất thành công; lỗi thân báo cáo không chặn PPTX
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của J10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Vẫn xuất thành công; lỗi thân báo cáo không chặn PPTX
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, artifact-sha256-open-parse; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, artifact-sha256-open-parse

**Instances phải ghi kết quả riêng:** `J10@ENV-D1`

**Cleanup/isolation:** Kết thúc presentation/defense session, tắt microphone và xóa dữ liệu luyện tập.

## K — Command Palette và shortcut

### K01 — Command Palette và shortcut: Ctrl+K

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | component, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-K-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-A11Y` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Palette mở; focus vào search; Escape đóng và trả focus

**Test data:** Focus ngoài input/editor

**Tiền điều kiện:** Focus ngoài input/editor

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Workspace trên production build, đưa focus về vùng được chỉ định và đóng mọi dialog/palette.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Focus ngoài input/editor
   - **Expected:** Active element, active section/tab và shortcut context ban đầu đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Ctrl+K
   - **Expected:** Palette mở; focus vào search; Escape đóng và trả focus
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của K01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Palette mở; focus vào search; Escape đóng và trả focus
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `K01@ENV-D1`, `K01@ENV-D2`, `K01@ENV-A11Y`

**Cleanup/isolation:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.

### K02 — Command Palette và shortcut: Tìm soat loi, SOÁT LỖI, xem truoc, nop bai

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | component, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-K-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Kết quả normalize bỏ dấu/case đúng, không hiện command ngoài match

**Test data:** Palette mở

**Tiền điều kiện:** Palette mở

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Workspace trên production build, đưa focus về vùng được chỉ định và đóng mọi dialog/palette.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Palette mở
   - **Expected:** Active element, active section/tab và shortcut context ban đầu đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tìm `soat loi`, `SOÁT LỖI`, `xem truoc`, `nop bai`
   - **Expected:** Kết quả normalize bỏ dấu/case đúng, không hiện command ngoài match
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của K02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Kết quả normalize bỏ dấu/case đúng, không hiện command ngoài match
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `K02@ENV-D1`

**Cleanup/isolation:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.

### K03 — Command Palette và shortcut: Chạy bằng chuột/Enter

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | component, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-K-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Đúng một handler chạy; state/navigation đúng; palette đóng hợp lý

**Test data:** `[mỗi Command Palette ID]`, state riêng

**Tiền điều kiện:** `[mỗi Command Palette ID]`, state riêng

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Workspace trên production build, đưa focus về vùng được chỉ định và đóng mọi dialog/palette.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: `[mỗi Command Palette ID]`, state riêng
   - **Expected:** Active element, active section/tab và shortcut context ban đầu đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy bằng chuột/Enter
   - **Expected:** Đúng một handler chạy; state/navigation đúng; palette đóng hợp lý
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của K03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Đúng một handler chạy; state/navigation đúng; palette đóng hợp lý
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `K03[create-section]@ENV-D1`, `K03[duplicate-section]@ENV-D1`, `K03[move-section-up]@ENV-D1`, `K03[move-section-down]@ENV-D1`, `K03[save-draft]@ENV-D1`, `K03[import-markdown]@ENV-D1`, `K03[create-report]@ENV-D1`, `K03[run-check]@ENV-D1`, `K03[open-preview]@ENV-D1`, `K03[toggle-focus-mode]@ENV-D1`, `K03[open-export]@ENV-D1`, `K03[open-ai-settings]@ENV-D1`

**Cleanup/isolation:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.

### K04 — Command Palette và shortcut: Chạy riêng từng tổ hợp ở workspace

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | component, e2e, manual, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-K-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Đúng một hành vi theo command; ngăn default browser khi cần; không lặp do key repeat

**Test data:** `[Ctrl+S, Ctrl+Shift+N, Ctrl+Shift+D, Alt+Up, Alt+Down, Ctrl+Enter, Ctrl+P, Ctrl+Shift+F, Ctrl+Shift+E]`

**Tiền điều kiện:** `[Ctrl+S, Ctrl+Shift+N, Ctrl+Shift+D, Alt+Up, Alt+Down, Ctrl+Enter, Ctrl+P, Ctrl+Shift+F, Ctrl+Shift+E]`

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Workspace trên production build, đưa focus về vùng được chỉ định và đóng mọi dialog/palette.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: `[Ctrl+S, Ctrl+Shift+N, Ctrl+Shift+D, Alt+Up, Alt+Down, Ctrl+Enter, Ctrl+P, Ctrl+Shift+F, Ctrl+Shift+E]`
   - **Expected:** Active element, active section/tab và shortcut context ban đầu đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy riêng từng tổ hợp ở workspace
   - **Expected:** Đúng một hành vi theo command; ngăn default browser khi cần; không lặp do key repeat
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của K04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Đúng một hành vi theo command; ngăn default browser khi cần; không lặp do key repeat
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `K04[Ctrl+S]@ENV-D1`, `K04[Ctrl+S]@ENV-D2`, `K04[Ctrl+Shift+N]@ENV-D1`, `K04[Ctrl+Shift+N]@ENV-D2`, `K04[Ctrl+Shift+D]@ENV-D1`, `K04[Ctrl+Shift+D]@ENV-D2`, `K04[Alt+Up]@ENV-D1`, `K04[Alt+Up]@ENV-D2`, `K04[Alt+Down]@ENV-D1`, `K04[Alt+Down]@ENV-D2`, `K04[Ctrl+Enter]@ENV-D1`, `K04[Ctrl+Enter]@ENV-D2`, `K04[Ctrl+P]@ENV-D1`, `K04[Ctrl+P]@ENV-D2`, `K04[Ctrl+Shift+F]@ENV-D1`, `K04[Ctrl+Shift+F]@ENV-D2`, `K04[Ctrl+Shift+E]@ENV-D1`, `K04[Ctrl+Shift+E]@ENV-D2`

**Cleanup/isolation:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.

### K05 — Command Palette và shortcut: Ctrl+K

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | component, e2e, manual, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-K-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Chèn/toggle Markdown link theo editor keymap; không mở Palette

**Test data:** Focus trong CodeMirror, có selection

**Tiền điều kiện:** Focus trong CodeMirror, có selection

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Workspace trên production build, đưa focus về vùng được chỉ định và đóng mọi dialog/palette.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Focus trong CodeMirror, có selection
   - **Expected:** Active element, active section/tab và shortcut context ban đầu đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Ctrl+K
   - **Expected:** Chèn/toggle Markdown link theo editor keymap; không mở Palette
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của K05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Chèn/toggle Markdown link theo editor keymap; không mở Palette
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `K05@ENV-D1`, `K05@ENV-D2`

**Cleanup/isolation:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.

### K06 — Command Palette và shortcut: Ctrl+K và shortcut workspace

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | component, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-K-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không phá nội dung input; global shortcut bị bỏ qua theo context

**Test data:** Focus ngoài CodeMirror nhưng trong input/dialog

**Tiền điều kiện:** Focus ngoài CodeMirror nhưng trong input/dialog

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Workspace trên production build, đưa focus về vùng được chỉ định và đóng mọi dialog/palette.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Focus ngoài CodeMirror nhưng trong input/dialog
   - **Expected:** Active element, active section/tab và shortcut context ban đầu đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Ctrl+K và shortcut workspace
   - **Expected:** Không phá nội dung input; global shortcut bị bỏ qua theo context
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của K06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không phá nội dung input; global shortcut bị bỏ qua theo context
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `K06@ENV-D1`

**Cleanup/isolation:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.

### K07 — Command Palette và shortcut: Chạy riêng trên selection rỗng/có text

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | component, e2e, manual |
| Cách thực thi | manual |
| Requirements | `QA-REQ-K-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Markdown/snippet/search/heading đúng; selection/cursor hợp lý; Undo được

**Test data:** `[Ctrl+B, Ctrl+I, Ctrl+Backtick, Ctrl+Shift+C/T/M/Q, Ctrl+H, Ctrl+Alt+1/2/3]`

**Tiền điều kiện:** `[Ctrl+B, Ctrl+I, Ctrl+Backtick, Ctrl+Shift+C/T/M/Q, Ctrl+H, Ctrl+Alt+1/2/3]`

**Các bước thực thi và expected result:**

1. **Thao tác:** Mở Workspace trên production build, đưa focus về vùng được chỉ định và đóng mọi dialog/palette.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: `[Ctrl+B, Ctrl+I, Ctrl+Backtick, Ctrl+Shift+C/T/M/Q, Ctrl+H, Ctrl+Alt+1/2/3]`
   - **Expected:** Active element, active section/tab và shortcut context ban đầu đã được ghi nhận. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy riêng trên selection rỗng/có text
   - **Expected:** Markdown/snippet/search/heading đúng; selection/cursor hợp lý; Undo được
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của K07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Markdown/snippet/search/heading đúng; selection/cursor hợp lý; Undo được
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `K07[Ctrl+B]@ENV-D1`, `K07[Ctrl+I]@ENV-D1`, `K07[Ctrl+Backtick]@ENV-D1`, `K07[Ctrl+Shift+C]@ENV-D1`, `K07[Ctrl+Shift+T]@ENV-D1`, `K07[Ctrl+Shift+M]@ENV-D1`, `K07[Ctrl+Shift+Q]@ENV-D1`, `K07[Ctrl+H]@ENV-D1`, `K07[Ctrl+Alt+1]@ENV-D1`, `K07[Ctrl+Alt+2]@ENV-D1`, `K07[Ctrl+Alt+3]@ENV-D1`

**Cleanup/isolation:** Đóng Command Palette/dialog, khôi phục focus và xóa project thử.

## L — Persistence, recovery, offline và PWA

### L01 — Persistence, recovery, offline và PWA: Reload 5 lần và đóng/mở browser

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-L-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Hash dữ liệu nghiệp vụ không đổi; không nhân đôi record

**Test data:** Project có text/assets/evidence/present state

**Tiền điều kiện:** Project có text/assets/evidence/present state

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle/versioned seed riêng, cấu hình online/offline/cache/PWA đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Project có text/assets/evidence/present state
   - **Expected:** Ghi DB/schema/service-worker/cache state trước thao tác; bundle baseline parse được và đã hash. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Reload 5 lần và đóng/mở browser
   - **Expected:** Hash dữ liệu nghiệp vụ không đổi; không nhân đôi record
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của L01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Hash dữ liệu nghiệp vụ không đổi; không nhân đôi record
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `L01@ENV-D1`, `L01@ENV-D2`

**Cleanup/isolation:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.

### L02 — Persistence, recovery, offline và PWA: Ẩn tab/đóng tab ngay

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-L-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Flush pending save; lần mở sau có thay đổi cuối

**Test data:** Thay đổi trong cửa sổ autosave 2 giây

**Tiền điều kiện:** Thay đổi trong cửa sổ autosave 2 giây

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle/versioned seed riêng, cấu hình online/offline/cache/PWA đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Thay đổi trong cửa sổ autosave 2 giây
   - **Expected:** Ghi DB/schema/service-worker/cache state trước thao tác; bundle baseline parse được và đã hash. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Ẩn tab/đóng tab ngay
   - **Expected:** Flush pending save; lần mở sau có thay đổi cuối
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của L02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Flush pending save; lần mở sau có thay đổi cuối
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `L02@ENV-D1`, `L02@ENV-D2`

**Cleanup/isolation:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.

### L03 — Persistence, recovery, offline và PWA: Sửa khác nhau và lưu xen kẽ

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-L-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không mất dữ liệu âm thầm: phải phát hiện conflict hoặc có quy tắc last-write rõ và cảnh báo; ghi bug nếu silent overwrite

**Test data:** Hai tab cùng project

**Tiền điều kiện:** Hai tab cùng project

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle/versioned seed riêng, cấu hình online/offline/cache/PWA đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Hai tab cùng project
   - **Expected:** Ghi DB/schema/service-worker/cache state trước thao tác; bundle baseline parse được và đã hash. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Sửa khác nhau và lưu xen kẽ
   - **Expected:** Không mất dữ liệu âm thầm: phải phát hiện conflict hoặc có quy tắc last-write rõ và cảnh báo; ghi bug nếu silent overwrite
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của L03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không mất dữ liệu âm thầm: phải phát hiện conflict hoặc có quy tắc last-write rõ và cảnh báo; ghi bug nếu silent overwrite
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `L03@ENV-D1`

**Cleanup/isolation:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.

### L04 — Persistence, recovery, offline và PWA: Sửa project

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-L-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** UI báo quota, giữ draft trong memory, không nhân bản full bundle vào recovery; Retry hoạt động khi giải phóng quota

**Test data:** Mô phỏng `QuotaExceededError`

**Tiền điều kiện:** Mô phỏng `QuotaExceededError`

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle/versioned seed riêng, cấu hình online/offline/cache/PWA đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Mô phỏng `QuotaExceededError`
   - **Expected:** Ghi DB/schema/service-worker/cache state trước thao tác; bundle baseline parse được và đã hash. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Sửa project
   - **Expected:** UI báo quota, giữ draft trong memory, không nhân bản full bundle vào recovery; Retry hoạt động khi giải phóng quota
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của L04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** UI báo quota, giữ draft trong memory, không nhân bản full bundle vào recovery; Retry hoạt động khi giải phóng quota
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `L04@ENV-D1`

**Cleanup/isolation:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.

### L05 — Persistence, recovery, offline và PWA: Offline rồi soạn/check/xuất HTML/DOCX

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | automated |
| Requirements | `QA-REQ-L-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-M1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | playwright:e2e/templates-and-offline.spec.ts |

**Mục tiêu/acceptance cuối:** Các chức năng client-side hoạt động; dữ liệu lưu; không gọi AI/PDF âm thầm

**Test data:** App đã online ít nhất một lần

**Tiền điều kiện:** App đã online ít nhất một lần

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle/versioned seed riêng, cấu hình online/offline/cache/PWA đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: App đã online ít nhất một lần
   - **Expected:** Ghi DB/schema/service-worker/cache state trước thao tác; bundle baseline parse được và đã hash. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Offline rồi soạn/check/xuất HTML/DOCX
   - **Expected:** Các chức năng client-side hoạt động; dữ liệu lưu; không gọi AI/PDF âm thầm
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của L05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Các chức năng client-side hoạt động; dữ liệu lưu; không gọi AI/PDF âm thầm
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log

**Instances phải ghi kết quả riêng:** `L05@ENV-D1`, `L05@ENV-D2`, `L05@ENV-M1`

**Cleanup/isolation:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.

### L06 — Persistence, recovery, offline và PWA: Đóng app khi offline rồi mở lại

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | automated |
| Requirements | `QA-REQ-L-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-M1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | playwright:e2e/templates-and-offline.spec.ts |

**Mục tiêu/acceptance cuối:** Shell/route tải từ cache; project còn; trạng thái offline rõ

**Test data:** Route đã cache

**Tiền điều kiện:** Route đã cache

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle/versioned seed riêng, cấu hình online/offline/cache/PWA đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Route đã cache
   - **Expected:** Ghi DB/schema/service-worker/cache state trước thao tác; bundle baseline parse được và đã hash. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Đóng app khi offline rồi mở lại
   - **Expected:** Shell/route tải từ cache; project còn; trạng thái offline rõ
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của L06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Shell/route tải từ cache; project còn; trạng thái offline rõ
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `L06@ENV-D1`, `L06@ENV-D2`, `L06@ENV-M1`

**Cleanup/isolation:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.

### L07 — Persistence, recovery, offline và PWA: Offline và mở URL

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | automated |
| Requirements | `QA-REQ-L-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | playwright:e2e/templates-and-offline.spec.ts |

**Mục tiêu/acceptance cuối:** Hiển thị offline fallback/không khả dụng có hướng dẫn; không màn trắng

**Test data:** Profile mới chưa từng vào app

**Tiền điều kiện:** Profile mới chưa từng vào app

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle/versioned seed riêng, cấu hình online/offline/cache/PWA đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Profile mới chưa từng vào app
   - **Expected:** Ghi DB/schema/service-worker/cache state trước thao tác; bundle baseline parse được và đã hash. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Offline và mở URL
   - **Expected:** Hiển thị offline fallback/không khả dụng có hướng dẫn; không màn trắng
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của L07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Hiển thị offline fallback/không khả dụng có hướng dẫn; không màn trắng
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `L07@ENV-D1`

**Cleanup/isolation:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.

### L08 — Persistence, recovery, offline và PWA: Cài PWA, mở standalone

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-L-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-M1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Cài/mở được; icon/name/start URL đúng; dữ liệu cùng origin còn

**Test data:** HTTPS/localhost, manifest hợp lệ

**Tiền điều kiện:** HTTPS/localhost, manifest hợp lệ

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle/versioned seed riêng, cấu hình online/offline/cache/PWA đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: HTTPS/localhost, manifest hợp lệ
   - **Expected:** Ghi DB/schema/service-worker/cache state trước thao tác; bundle baseline parse được và đã hash. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Cài PWA, mở standalone
   - **Expected:** Cài/mở được; icon/name/start URL đúng; dữ liệu cùng origin còn
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của L08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Cài/mở được; icon/name/start URL đúng; dữ liệu cùng origin còn
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `L08@ENV-D1`, `L08@ENV-D2`, `L08@ENV-M1`

**Cleanup/isolation:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.

### L09 — Persistence, recovery, offline và PWA: Chọn cập nhật

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-L-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** App flush autosave trước reload; bản mới mở với draft nguyên vẹn

**Test data:** Có draft chưa autosave và SW update chờ

**Tiền điều kiện:** Có draft chưa autosave và SW update chờ

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle/versioned seed riêng, cấu hình online/offline/cache/PWA đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Có draft chưa autosave và SW update chờ
   - **Expected:** Ghi DB/schema/service-worker/cache state trước thao tác; bundle baseline parse được và đã hash. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chọn cập nhật
   - **Expected:** App flush autosave trước reload; bản mới mở với draft nguyên vẹn
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của L09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** App flush autosave trước reload; bản mới mở với draft nguyên vẹn
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `L09@ENV-D1`

**Cleanup/isolation:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.

### L10 — Persistence, recovery, offline và PWA: Nạp từng DB cũ rồi mở app

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-L-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-REC-01` |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Migration lên v4; record count/hash theo manifest; migration idempotent khi reload

**Test data:** Dùng đúng fixture `FX-REC-01`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** `[FX-REC-01,02,03]`

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle/versioned seed riêng, cấu hình online/offline/cache/PWA đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-REC-01`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Ghi DB/schema/service-worker/cache state trước thao tác; bundle baseline parse được và đã hash. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Nạp từng DB cũ rồi mở app
   - **Expected:** Migration lên v4; record count/hash theo manifest; migration idempotent khi reload
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của L10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Migration lên v4; record count/hash theo manifest; migration idempotent khi reload
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `L10[FX-REC-01]@ENV-D1`, `L10[FX-REC-02]@ENV-D1`, `L10[FX-REC-03]@ENV-D1`

**Cleanup/isolation:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.

### L11 — Persistence, recovery, offline và PWA: Mở và thao tác Recovery Center

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP2 |
| Tầng kiểm thử | integration, e2e |
| Cách thực thi | manual |
| Requirements | `QA-REQ-L-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-REC-04` |
| Suite | full |
| Ước tính / timeout | 5 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Khôi phục/loại bỏ độc lập, không crash hoặc ảnh hưởng project lành

**Test data:** Dùng đúng fixture `FX-REC-04`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-REC-04

**Các bước thực thi và expected result:**

1. **Thao tác:** Tạo bundle/versioned seed riêng, cấu hình online/offline/cache/PWA đúng tiền điều kiện.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-REC-04`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Ghi DB/schema/service-worker/cache state trước thao tác; bundle baseline parse được và đã hash. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở và thao tác Recovery Center
   - **Expected:** Khôi phục/loại bỏ độc lập, không crash hoặc ảnh hưởng project lành
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của L11; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Khôi phục/loại bỏ độc lập, không crash hoặc ảnh hưởng project lành
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result

**Instances phải ghi kết quả riêng:** `L11@ENV-D1`

**Cleanup/isolation:** Khôi phục online mode, unregister worker khi cần và xóa cache, versioned seed, recovery record cùng project thử.

## M — Tương thích, accessibility, privacy và phi chức năng

### M01 — Responsive, accessibility, privacy và performance: Thực hiện tạo/chọn section, mở drawer/panel, save/check

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-R1` |
| Fixtures | Không |
| Suite | full, smoke, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không overflow ngang ngoài vùng chủ đích; control không che nhau; thao tác chính dùng được

**Test data:** `[320×568, 375×667, 768×1024]`

**Tiền điều kiện:** `[320×568, 375×667, 768×1024]`

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: `[320×568, 375×667, 768×1024]`
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Thực hiện tạo/chọn section, mở drawer/panel, save/check
   - **Expected:** Không overflow ngang ngoài vùng chủ đích; control không che nhau; thao tác chính dùng được
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không overflow ngang ngoài vùng chủ đích; control không che nhau; thao tác chính dùng được
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, environment-version

**Instances phải ghi kết quả riêng:** `M01[320x568]@ENV-R1`, `M01[375x667]@ENV-R1`, `M01[768x1024]@ENV-R1`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M02 — Responsive, accessibility, privacy và performance: Tap, scroll, mở/đóng drawer, reorder nếu hỗ trợ touch

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-M1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Touch target dùng được; không kẹt scroll; orientation change không mất state

**Test data:** Android thật portrait/landscape

**Tiền điều kiện:** Android thật portrait/landscape

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Android thật portrait/landscape
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tap, scroll, mở/đóng drawer, reorder nếu hỗ trợ touch
   - **Expected:** Touch target dùng được; không kẹt scroll; orientation change không mất state
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Touch target dùng được; không kẹt scroll; orientation change không mất state
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M02@ENV-M1`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M03 — Responsive, accessibility, privacy và performance: Bật Dark mode, đi qua mọi panel, reload

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-M1` |
| Fixtures | Không |
| Suite | full, smoke |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Theme áp dụng nhất quán và persist; CodeMirror selection/active line/readability đạt contrast

**Test data:** Light mode

**Tiền điều kiện:** Light mode

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Light mode
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Bật Dark mode, đi qua mọi panel, reload
   - **Expected:** Theme áp dụng nhất quán và persist; CodeMirror selection/active line/readability đạt contrast
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Theme áp dụng nhất quán và persist; CodeMirror selection/active line/readability đạt contrast
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M03@ENV-D1`, `M03@ENV-D2`, `M03@ENV-M1`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M04 — Responsive, accessibility, privacy và performance: Tab/Shift+Tab/Enter/Space/Escape qua Library, Workspace, dialog, tabs

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-D2`, `ENV-A11Y` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Thứ tự focus hợp lý; focus ring rõ; modal trap và trả focus đúng; không keyboard trap

**Test data:** Keyboard only

**Tiền điều kiện:** Keyboard only

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Keyboard only
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Tab/Shift+Tab/Enter/Space/Escape qua Library, Workspace, dialog, tabs
   - **Expected:** Thứ tự focus hợp lý; focus ring rõ; modal trap và trả focus đúng; không keyboard trap
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Thứ tự focus hợp lý; focus ring rõ; modal trap và trả focus đúng; không keyboard trap
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M04@ENV-D1`, `M04@ENV-D2`, `M04@ENV-A11Y`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M05 — Responsive, accessibility, privacy và performance: Chạy axe automated

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không có violation serious/critical; violation còn lại được triage, không bỏ qua âm thầm

**Test data:** Các route/panel chính

**Tiền điều kiện:** Các route/panel chính

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Các route/panel chính
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy axe automated
   - **Expected:** Không có violation serious/critical; violation còn lại được triage, không bỏ qua âm thầm
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không có violation serious/critical; violation còn lại được triage, không bỏ qua âm thầm
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M05@ENV-D1`, `M05@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M06 — Responsive, accessibility, privacy và performance: Dùng screen reader cơ bản

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-A11Y` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Label/name/role đúng; thay đổi quan trọng có live announcement; icon-only button có accessible name

**Test data:** Dialog/toast/progress/checker

**Tiền điều kiện:** Dialog/toast/progress/checker

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dialog/toast/progress/checker
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Dùng screen reader cơ bản
   - **Expected:** Label/name/role đúng; thay đổi quan trọng có live announcement; icon-only button có accessible name
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Label/name/role đúng; thay đổi quan trọng có live announcement; icon-only button có accessible name
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M06@ENV-D1`, `M06@ENV-A11Y`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M07 — Responsive, accessibility, privacy và performance: Preview, appendix, HTML export

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-MD-04` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không script/event/javascript URL nào thực thi; nội dung nguy hiểm bị sanitize/escape; app vẫn hoạt động

**Test data:** Dùng đúng fixture `FX-MD-04`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-MD-04 nhập qua editor và import

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-MD-04`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Preview, appendix, HTML export
   - **Expected:** Không script/event/javascript URL nào thực thi; nội dung nguy hiểm bị sanitize/escape; app vẫn hoạt động
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không script/event/javascript URL nào thực thi; nội dung nguy hiểm bị sanitize/escape; app vẫn hoạt động
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, environment-version

**Instances phải ghi kết quả riêng:** `M07@ENV-D1`, `M07@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M08 — Responsive, accessibility, privacy và performance: Lưu, QR, appendix, export

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Payload không thực thi; URL scheme nguy hiểm bị chặn; QR không chứa URL đã bị từ chối

**Test data:** Evidence URL và metadata có payload XSS

**Tiền điều kiện:** Evidence URL và metadata có payload XSS

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Evidence URL và metadata có payload XSS
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Lưu, QR, appendix, export
   - **Expected:** Payload không thực thi; URL scheme nguy hiểm bị chặn; QR không chứa URL đã bị từ chối
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Payload không thực thi; URL scheme nguy hiểm bị chặn; QR không chứa URL đã bị từ chối
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, environment-version

**Instances phải ghi kết quả riêng:** `M08@ENV-D1`, `M08@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M09 — Responsive, accessibility, privacy và performance: Mở từng surface

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Mỗi surface có placeholder; 0 request ref, 0 HTTP 404, 0 pageerror

**Test data:** Broken ref tại Preview, ImportPreview, export preparation

**Tiền điều kiện:** Broken ref tại Preview, ImportPreview, export preparation

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Broken ref tại Preview, ImportPreview, export preparation
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở từng surface
   - **Expected:** Mỗi surface có placeholder; 0 request ref, 0 HTTP 404, 0 pageerror
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Mỗi surface có placeholder; 0 request ref, 0 HTTP 404, 0 pageerror
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M09@ENV-D1`, `M09@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M10 — Responsive, accessibility, privacy và performance: Chọn file hợp lệ

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Ref được rewrite đúng; placeholder biến mất; ảnh persist; checker issue tương ứng biến mất

**Test data:** Placeholder có action Gắn ảnh

**Tiền điều kiện:** Placeholder có action Gắn ảnh

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Placeholder có action Gắn ảnh
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chọn file hợp lệ
   - **Expected:** Ref được rewrite đúng; placeholder biến mất; ảnh persist; checker issue tương ứng biến mất
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Ref được rewrite đúng; placeholder biến mất; ảnh persist; checker issue tương ứng biến mất
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M10@ENV-D1`, `M10@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M11 — Responsive, accessibility, privacy và performance: Theo dõi Network/storage/log trong phiên thường, AI và PDF

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Phiên thường không gửi marker; AI chỉ gửi nội dung yêu cầu qua `/api/ai`; PDF chỉ gửi HTML qua `/api/pdf`; key marker không xuất hiện ở nơi cấm

**Test data:** Marker nội dung và marker key riêng biệt

**Tiền điều kiện:** Marker nội dung và marker key riêng biệt

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Marker nội dung và marker key riêng biệt
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Theo dõi Network/storage/log trong phiên thường, AI và PDF
   - **Expected:** Phiên thường không gửi marker; AI chỉ gửi nội dung yêu cầu qua `/api/ai`; PDF chỉ gửi HTML qua `/api/pdf`; key marker không xuất hiện ở nơi cấm
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M11; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Phiên thường không gửi marker; AI chỉ gửi nội dung yêu cầu qua `/api/ai`; PDF chỉ gửi HTML qua `/api/pdf`; key marker không xuất hiện ở nơi cấm
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, environment-version

**Instances phải ghi kết quả riêng:** `M11@ENV-D1`, `M11@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M12 — Responsive, accessibility, privacy và performance: Chạy e2e/workspace-performance.spec.ts

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | hybrid |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-PERF-S` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | playwright:e2e/workspace-performance.spec.ts |

**Mục tiêu/acceptance cuối:** Editor-ready `<6000 ms`, input→preview `<1500 ms`, long-task total `<2500 ms`, 0 worker error

**Test data:** Dùng đúng fixture `FX-PERF-S`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-PERF-S, production

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-PERF-S`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy `e2e/workspace-performance.spec.ts`
   - **Expected:** Editor-ready `<6000 ms`, input→preview `<1500 ms`, long-task total `<2500 ms`, 0 worker error
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M12; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Editor-ready `<6000 ms`, input→preview `<1500 ms`, long-task total `<2500 ms`, 0 worker error
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, environment-version

**Instances phải ghi kết quả riêng:** `M12@ENV-D1`, `M12@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M13 — Responsive, accessibility, privacy và performance: Chạy cùng performance spec

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | hybrid |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1` |
| Fixtures | `FX-PERF-L` |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | playwright:e2e/workspace-performance.spec.ts |

**Mục tiêu/acceptance cuối:** Editor-ready `<9000 ms`, input→preview `<3000 ms`, long-task total `<4500 ms`, 0 worker error

**Test data:** Dùng đúng fixture `FX-PERF-L`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-PERF-L, production

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-PERF-L`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy cùng performance spec
   - **Expected:** Editor-ready `<9000 ms`, input→preview `<3000 ms`, long-task total `<4500 ms`, 0 worker error
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M13; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Editor-ready `<9000 ms`, input→preview `<3000 ms`, long-task total `<4500 ms`, 0 worker error
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M13@ENV-D1`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M14 — Responsive, accessibility, privacy và performance: Chạy npm run perf:collect và npm run check:bundle

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | hybrid |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | script:scripts/check-bundle-budget.mjs |

**Mục tiêu/acceptance cuối:** Library initial `<=200 KiB`, Workspace initial `<=200 KiB`, editor-ready critical transitive `<=650 KiB`; không chấp nhận `UNMEASURED` trong CI

**Test data:** Production performance artifact

**Tiền điều kiện:** Production performance artifact

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Production performance artifact
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy `npm run perf:collect` và `npm run check:bundle`
   - **Expected:** Library initial `<=200 KiB`, Workspace initial `<=200 KiB`, editor-ready critical transitive `<=650 KiB`; không chấp nhận `UNMEASURED` trong CI
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M14; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Library initial `<=200 KiB`, Workspace initial `<=200 KiB`, editor-ready critical transitive `<=650 KiB`; không chấp nhận `UNMEASURED` trong CI
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M14@ENV-D1`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M15 — Responsive, accessibility, privacy và performance: Mở Snapshot History sau từng hành động

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Mỗi hành động có/không có snapshot đúng policy; không tạo snapshot do chỉ gõ/save thông thường

**Test data:** Thực hiện riêng add/delete/replace/import/AI destructive

**Tiền điều kiện:** Thực hiện riêng add/delete/replace/import/AI destructive

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Thực hiện riêng add/delete/replace/import/AI destructive
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở Snapshot History sau từng hành động
   - **Expected:** Mỗi hành động có/không có snapshot đúng policy; không tạo snapshot do chỉ gõ/save thông thường
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M15; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Mỗi hành động có/không có snapshot đúng policy; không tạo snapshot do chỉ gõ/save thông thường
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M15@ENV-D1`, `M15@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M16 — Responsive, accessibility, privacy và performance: Restore

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-001` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Nội dung/section/asset theo snapshot trở lại; state mới không bị trộn; có thể tiếp tục chỉnh sửa/lưu

**Test data:** Snapshot có hash biết trước

**Tiền điều kiện:** Snapshot có hash biết trước

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Snapshot có hash biết trước
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Restore
   - **Expected:** Nội dung/section/asset theo snapshot trở lại; state mới không bị trộn; có thể tiếp tục chỉnh sửa/lưu
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M16; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Nội dung/section/asset theo snapshot trở lại; state mới không bị trộn; có thể tiếp tục chỉnh sửa/lưu
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M16@ENV-D1`, `M16@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M17 — Responsive, accessibility, privacy và performance: Preview mặc định, cấp consent, sau đó hủy/revoke

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-002` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-MD-05` |
| Suite | full, critical |
| Ước tính / timeout | 10 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Mặc định không request; consent mới tải với no-referrer; revoke/cancel không tạo request muộn.

**Test data:** Dùng đúng fixture `FX-MD-05`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-MD-05 có ảnh remote và Network log sạch

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-MD-05`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Preview mặc định, cấp consent, sau đó hủy/revoke
   - **Expected:** Mặc định không request; consent mới tải với no-referrer; revoke/cancel không tạo request muộn.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M17; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Mặc định không request; consent mới tải với no-referrer; revoke/cancel không tạo request muộn.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, environment-version

**Instances phải ghi kết quả riêng:** `M17@ENV-D1`, `M17@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M18 — Responsive, accessibility, privacy và performance: Mở các route chính và kiểm CSP header/nonce

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-002` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Không unsafe-inline ngoài policy; nonce hợp lệ; app hoạt động; payload inline trái phép không chạy.

**Test data:** Production build

**Tiền điều kiện:** Production build

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Production build
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Mở các route chính và kiểm CSP header/nonce
   - **Expected:** Không unsafe-inline ngoài policy; nonce hợp lệ; app hoạt động; payload inline trái phép không chạy.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M18; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Không unsafe-inline ngoài policy; nonce hợp lệ; app hoạt động; payload inline trái phép không chạy.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, environment-version

**Instances phải ghi kết quả riêng:** `M18@ENV-D1`, `M18@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M19 — Responsive, accessibility, privacy và performance: Preview, import và export HTML/PDF

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-002` |
| Environment | `ENV-D1`, `ENV-D2` |
| Fixtures | `FX-MD-06` |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** ID được prefix; sink sau plugin vẫn sanitize; payload không thực thi.

**Test data:** Dùng đúng fixture `FX-MD-06`; xác minh hash/oracle trước khi thao tác.

**Tiền điều kiện:** FX-MD-06 có DOM-clobbering/plugin payload

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Dùng đúng fixture `FX-MD-06`; xác minh hash/oracle trước khi thao tác.
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Preview, import và export HTML/PDF
   - **Expected:** ID được prefix; sink sau plugin vẫn sanitize; payload không thực thi.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M19; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** ID được prefix; sink sau plugin vẫn sanitize; payload không thực thi.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, environment-version

**Instances phải ghi kết quả riêng:** `M19@ENV-D1`, `M19@ENV-D2`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

### M20 — Responsive, accessibility, privacy và performance: Kiểm storage, Clear data, backup/export và privacy copy

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | manual, e2e, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-M-003` |
| Environment | `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** UI mô tả đúng plaintext local boundary; clear xóa đúng phạm vi; export không chứa field ngoài spec.

**Test data:** Project có dữ liệu nhạy cảm giả lập

**Tiền điều kiện:** Project có dữ liệu nhạy cảm giả lập

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động production build trên đúng environment/viewport/device và bật công cụ accessibility/network khi case yêu cầu.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Project có dữ liệu nhạy cảm giả lập
   - **Expected:** Ghi OS, browser/device, viewport, input mode, network profile và trạng thái cache trước khi chạy. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Kiểm storage, Clear data, backup/export và privacy copy
   - **Expected:** UI mô tả đúng plaintext local boundary; clear xóa đúng phạm vi; export không chứa field ngoài spec.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của M20; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** UI mô tả đúng plaintext local boundary; clear xóa đúng phạm vi; export không chứa field ngoài spec.
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, environment-version; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, environment-version

**Instances phải ghi kết quả riêng:** `M20@ENV-D1`

**Cleanup/isolation:** Khôi phục network/theme/zoom, xóa cache/storage của profile và đóng công cụ hỗ trợ.

## N — Server/API security

### N01 — Server và API security: Chạy production config checker cho cả hai fixture

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, security |
| Cách thực thi | automated |
| Requirements | `QA-REQ-N-001` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | script:scripts/check-production-config.mjs |

**Mục tiêu/acceptance cuối:** Valid Pass; invalid fail-closed và nêu tên biến thiếu mà không lộ giá trị.

**Test data:** Production config fixtures valid và invalid

**Tiền điều kiện:** Production config fixtures valid và invalid

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Production config fixtures valid và invalid
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy production config checker cho cả hai fixture
   - **Expected:** Valid Pass; invalid fail-closed và nêu tên biến thiếu mà không lộ giá trị.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Valid Pass; invalid fail-closed và nêu tên biến thiếu mà không lộ giá trị.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N01@ENV-CI`, `N01@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

### N02 — Server và API security: Gửi request qua trusted và untrusted ingress

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, security, unit |
| Cách thực thi | automated |
| Requirements | `QA-REQ-N-002` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | vitest:src/lib/server/rate-limit.test.ts |

**Mục tiêu/acceptance cuối:** Chỉ trusted chain ảnh hưởng canonical client identity; spoof trực tiếp bị bỏ qua.

**Test data:** Spoofed forwarding header matrix

**Tiền điều kiện:** Spoofed forwarding header matrix

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Spoofed forwarding header matrix
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Gửi request qua trusted và untrusted ingress
   - **Expected:** Chỉ trusted chain ảnh hưởng canonical client identity; spoof trực tiếp bị bỏ qua.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Chỉ trusted chain ảnh hưởng canonical client identity; spoof trực tiếp bị bỏ qua.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N02@ENV-CI`, `N02@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

### N03 — Server và API security: Đổi IP/key độc lập và vượt từng quota

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-N-002` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Limiter IP và key độc lập, dùng shared state; xoay một vế không né được quota.

**Test data:** Hai app instance dùng Redis test

**Tiền điều kiện:** Hai app instance dùng Redis test

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Hai app instance dùng Redis test
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Đổi IP/key độc lập và vượt từng quota
   - **Expected:** Limiter IP và key độc lập, dùng shared state; xoay một vế không né được quota.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Limiter IP và key độc lập, dùng shared state; xoay một vế không né được quota.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N03@ENV-CI`, `N03@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

### N04 — Server và API security: Gọi AI/PDF qua các instance

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-N-002` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Production fail-closed với public error ổn định; không fallback local âm thầm.

**Test data:** Production Redis unavailable

**Tiền điều kiện:** Production Redis unavailable

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Production Redis unavailable
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Gọi AI/PDF qua các instance
   - **Expected:** Production fail-closed với public error ổn định; không fallback local âm thầm.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Production fail-closed với public error ổn định; không fallback local âm thầm.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N04@ENV-CI`, `N04@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

### N05 — Server và API security: Dùng từng ticket gọi PDF gateway

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-N-003` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Chỉ ticket hợp lệ dùng một lần được chấp nhận; expiry/replay bị từ chối.

**Test data:** PDF ticket hợp lệ, hết hạn và replay

**Tiền điều kiện:** PDF ticket hợp lệ, hết hạn và replay

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: PDF ticket hợp lệ, hết hạn và replay
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Dùng từng ticket gọi PDF gateway
   - **Expected:** Chỉ ticket hợp lệ dùng một lần được chấp nhận; expiry/replay bị từ chối.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Chỉ ticket hợp lệ dùng một lần được chấp nhận; expiry/replay bị từ chối.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N05@ENV-CI`, `N05@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

### N06 — Server và API security: Gửi same-site, cross-site và thiếu metadata

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, security, unit |
| Cách thực thi | automated |
| Requirements | `QA-REQ-N-003` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | vitest:src/app/api/pdf/__security__/pdf-access.fuzz.test.ts |

**Mục tiêu/acceptance cuối:** Access policy đúng; defense-in-depth không thay authentication; renderer không bị gọi khi reject.

**Test data:** Origin/Fetch Metadata/admission matrix

**Tiền điều kiện:** Origin/Fetch Metadata/admission matrix

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Origin/Fetch Metadata/admission matrix
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Gửi same-site, cross-site và thiếu metadata
   - **Expected:** Access policy đúng; defense-in-depth không thay authentication; renderer không bị gọi khi reject.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Access policy đúng; defense-in-depth không thay authentication; renderer không bị gọi khi reject.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N06@ENV-CI`, `N06@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

### N07 — Server và API security: Gọi renderer cho từng token

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-N-003` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Missing/invalid bị từ chối timing-safe; valid tiếp tục; không log token.

**Test data:** Renderer token missing/invalid/valid

**Tiền điều kiện:** Renderer token missing/invalid/valid

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Renderer token missing/invalid/valid
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Gọi renderer cho từng token
   - **Expected:** Missing/invalid bị từ chối timing-safe; valid tiếp tục; không log token.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Missing/invalid bị từ chối timing-safe; valid tiếp tục; không log token.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N07@ENV-CI`, `N07@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

### N08 — Server và API security: Chạy bounded fuzz cho frame, requestId, delta và no-newline tail

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, security, unit |
| Cách thực thi | automated |
| Requirements | `QA-REQ-N-004` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | vitest:src/app/api/ai/__security__/ai-stream-bounds.fuzz.test.ts |

**Mục tiêu/acceptance cuối:** Parser bounded, output deterministic, public error generic và không echo dữ liệu.

**Test data:** AI stream fragmentation/oversize corpus

**Tiền điều kiện:** AI stream fragmentation/oversize corpus

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: AI stream fragmentation/oversize corpus
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy bounded fuzz cho frame, requestId, delta và no-newline tail
   - **Expected:** Parser bounded, output deterministic, public error generic và không echo dữ liệu.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Parser bounded, output deterministic, public error generic và không echo dữ liệu.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N08@ENV-CI`, `N08@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

### N09 — Server và API security: Đọc chậm, abort, disconnect và timeout

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, security, performance |
| Cách thực thi | manual |
| Requirements | `QA-REQ-N-004` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Backpressure/abort propagation đúng; buffer không tăng vô hạn; resource được giải phóng.

**Test data:** Slow client/provider và abort fixture

**Tiền điều kiện:** Slow client/provider và abort fixture

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Slow client/provider và abort fixture
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Đọc chậm, abort, disconnect và timeout
   - **Expected:** Backpressure/abort propagation đúng; buffer không tăng vô hạn; resource được giải phóng.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Backpressure/abort propagation đúng; buffer không tăng vô hạn; resource được giải phóng.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N09@ENV-CI`, `N09@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

### N10 — Server và API security: Chạy AI/PDF success và error rồi thu log

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-N-005` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Log chỉ có cause code/aggregate; không chứa marker nội dung hoặc credential.

**Test data:** Marker riêng cho key, prompt, HTML và tài liệu

**Tiền điều kiện:** Marker riêng cho key, prompt, HTML và tài liệu

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Marker riêng cho key, prompt, HTML và tài liệu
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy AI/PDF success và error rồi thu log
   - **Expected:** Log chỉ có cause code/aggregate; không chứa marker nội dung hoặc credential.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Log chỉ có cause code/aggregate; không chứa marker nội dung hoặc credential.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N10@ENV-CI`, `N10@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

### N11 — Server và API security: Gọi diagnostics

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-N-005` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Chỉ valid token nhận operator detail; response không chứa nội dung tài liệu/key.

**Test data:** Operator token missing/invalid/valid

**Tiền điều kiện:** Operator token missing/invalid/valid

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Operator token missing/invalid/valid
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Gọi diagnostics
   - **Expected:** Chỉ valid token nhận operator detail; response không chứa nội dung tài liệu/key.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N11; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Chỉ valid token nhận operator detail; response không chứa nội dung tài liệu/key.
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N11@ENV-CI`, `N11@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

### N12 — Server và API security: Gọi public ready và operator diagnostics

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | integration, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-N-005` |
| Environment | `ENV-CI`, `ENV-D1` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Public response generic; operator response phân biệt cause; không lộ topology/secrets.

**Test data:** Ready/degraded/unready service states

**Tiền điều kiện:** Ready/degraded/unready service states

**Các bước thực thi và expected result:**

1. **Thao tác:** Khởi động server/renderer bằng production configuration cô lập; dùng synthetic credential và capture log riêng.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Ready/degraded/unready service states
   - **Expected:** Readiness/diagnostic baseline đã ghi; Redis/renderer/upstream đúng topology của case. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Gọi public ready và operator diagnostics
   - **Expected:** Public response generic; operator response phân biệt cause; không lộ topology/secrets.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của N12; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Public response generic; operator response phân biệt cause; không lộ topology/secrets.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `N12@ENV-CI`, `N12@ENV-D1`

**Cleanup/isolation:** Dừng process/container phụ trợ, xóa credential/log tạm và xác nhận không có dữ liệu nhạy cảm bị lưu.

## O — Release và supply-chain

### O01 — Supply-chain và release evidence: Chạy CI action pin checker

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | release, security |
| Cách thực thi | automated |
| Requirements | `QA-REQ-O-001` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | script:scripts/check-ci-actions.mjs |

**Mục tiêu/acceptance cuối:** Mọi external action pin full commit SHA; mutable tag bị từ chối.

**Test data:** Workflow hiện tại

**Tiền điều kiện:** Workflow hiện tại

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Workflow hiện tại
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy CI action pin checker
   - **Expected:** Mọi external action pin full commit SHA; mutable tag bị từ chối.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O01; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Mọi external action pin full commit SHA; mutable tag bị từ chối.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O01@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.

### O02 — Supply-chain và release evidence: Chạy production audit cả hai workspace

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | release, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-O-001` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Audit gate fail khi có vulnerability actionable; JSON evidence luôn được lưu.

**Test data:** Root và renderer lockfiles

**Tiền điều kiện:** Root và renderer lockfiles

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Root và renderer lockfiles
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy production audit cả hai workspace
   - **Expected:** Audit gate fail khi có vulnerability actionable; JSON evidence luôn được lưu.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O02; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Audit gate fail khi có vulnerability actionable; JSON evidence luôn được lưu.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O02@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.

### O03 — Supply-chain và release evidence: Resolve digest, sinh SBOM và scan

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | release, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-O-002` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** SBOM/scan cùng exact digest với image được integration test.

**Test data:** PDF image build một lần

**Tiền điều kiện:** PDF image build một lần

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: PDF image build một lần
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Resolve digest, sinh SBOM và scan
   - **Expected:** SBOM/scan cùng exact digest với image được integration test.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O03; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** SBOM/scan cùng exact digest với image được integration test.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O03@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.

### O04 — Supply-chain và release evidence: Chạy vulnerability gate

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | release, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-O-002` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Fixable Critical/High chặn CI; unfixed vẫn hiện đầy đủ trong evidence.

**Test data:** Trivy report có fixed/unfixed findings

**Tiền điều kiện:** Trivy report có fixed/unfixed findings

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Trivy report có fixed/unfixed findings
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy vulnerability gate
   - **Expected:** Fixable Critical/High chặn CI; unfixed vẫn hiện đầy đủ trong evidence.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O04; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Fixable Critical/High chặn CI; unfixed vẫn hiện đầy đủ trong evidence.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O04@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.

### O05 — Supply-chain và release evidence: Chạy isolation integration profile

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | release, security |
| Cách thực thi | automated |
| Requirements | `QA-REQ-O-003` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | script:scripts/test-pdf-integration.mjs |

**Mục tiêu/acceptance cuối:** Read-only/tmpfs/no-new-privileges, JS-off, egress blocked, caps/deadline và admission đều được chứng minh.

**Test data:** Docker renderer image

**Tiền điều kiện:** Docker renderer image

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Docker renderer image
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy isolation integration profile
   - **Expected:** Read-only/tmpfs/no-new-privileges, JS-off, egress blocked, caps/deadline và admission đều được chứng minh.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O05; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Read-only/tmpfs/no-new-privileges, JS-off, egress blocked, caps/deadline và admission đều được chứng minh.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O05@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.

### O06 — Supply-chain và release evidence: Chạy canonical coverage, fuzz và repeated loop

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | release, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-O-003` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Threshold đạt; unexpected stderr/flaky result làm gate fail.

**Test data:** Coverage/fuzz/flake configuration

**Tiền điều kiện:** Coverage/fuzz/flake configuration

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Coverage/fuzz/flake configuration
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy canonical coverage, fuzz và repeated loop
   - **Expected:** Threshold đạt; unexpected stderr/flaky result làm gate fail.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O06; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Threshold đạt; unexpected stderr/flaky result làm gate fail.
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O06@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.

### O07 — Supply-chain và release evidence: Kiểm schema, owner, reviewBy và exitCondition

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | release, security |
| Cách thực thi | automated |
| Requirements | `QA-REQ-O-004` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | script:scripts/check-supply-chain.mjs |

**Mục tiêu/acceptance cuối:** Waiver thiếu/sai/hết hạn chặn gate; không có bypass ngầm.

**Test data:** Security waiver registry

**Tiền điều kiện:** Security waiver registry

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Security waiver registry
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Kiểm schema, owner, reviewBy và exitCondition
   - **Expected:** Waiver thiếu/sai/hết hạn chặn gate; không có bypass ngầm.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O07; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Waiver thiếu/sai/hết hạn chặn gate; không có bypass ngầm.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O07@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.

### O08 — Supply-chain và release evidence: Sinh release-evidence manifest strict

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | release, security |
| Cách thực thi | automated |
| Requirements | `QA-REQ-O-004` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | script:scripts/generate-release-evidence.mjs |

**Mục tiêu/acceptance cuối:** Manifest liên kết commit, lockfiles, image, SBOM, scan, audit, QA plan/catalog/fixture và bundle hashes.

**Test data:** Toàn bộ machine artifacts sẵn sàng

**Tiền điều kiện:** Toàn bộ machine artifacts sẵn sàng

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Toàn bộ machine artifacts sẵn sàng
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Sinh release-evidence manifest strict
   - **Expected:** Manifest liên kết commit, lockfiles, image, SBOM, scan, audit, QA plan/catalog/fixture và bundle hashes.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O08; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Manifest liên kết commit, lockfiles, image, SBOM, scan, audit, QA plan/catalog/fixture và bundle hashes.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O08@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.

### O09 — Supply-chain và release evidence: Chạy canonical GitHub Actions workflow

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | release, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-O-004` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Mọi lane Pass trên đúng commit; evidence upload kể cả khi failure.

**Test data:** Exact release commit

**Tiền điều kiện:** Exact release commit

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Exact release commit
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Chạy canonical GitHub Actions workflow
   - **Expected:** Mọi lane Pass trên đúng commit; evidence upload kể cả khi failure.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O09; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Mọi lane Pass trên đúng commit; evidence upload kể cả khi failure.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O09@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.

### O10 — Supply-chain và release evidence: Quan sát aggregate error/latency

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP1 |
| Tầng kiểm thử | release, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-O-004` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full |
| Ước tính / timeout | 6 / 15 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Có số liệu theo cửa sổ quy định; không log report content/API key.

**Test data:** Staging beta

**Tiền điều kiện:** Staging beta

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Staging beta
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Quan sát aggregate error/latency
   - **Expected:** Có số liệu theo cửa sổ quy định; không log report content/API key.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O10; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Có số liệu theo cửa sổ quy định; không log report content/API key.
5. **Thao tác:** Thu bằng chứng bắt buộc: actual-result, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** actual-result, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O10@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.

### O11 — Supply-chain và release evidence: Kiểm artifact names, paths, hashes và retention

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | release, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-O-004` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Coverage và qa/security evidence đầy đủ, tải được, retention 90 ngày.

**Test data:** CI run completed

**Tiền điều kiện:** CI run completed

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: CI run completed
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Kiểm artifact names, paths, hashes và retention
   - **Expected:** Coverage và qa/security evidence đầy đủ, tải được, retention 90 ngày.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O11; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Coverage và qa/security evidence đầy đủ, tải được, retention 90 ngày.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O11@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.

### O12 — Supply-chain và release evidence: Upload draft QA release rồi finalize prerelease

| Thuộc tính | Giá trị |
|---|---|
| Priority | TP0 |
| Tầng kiểm thử | release, security |
| Cách thực thi | manual |
| Requirements | `QA-REQ-O-004` |
| Environment | `ENV-CI` |
| Fixtures | Không |
| Suite | full, critical |
| Ước tính / timeout | 8 / 20 phút |
| Automation hỗ trợ | Manual — không có automation thay thế acceptance |

**Mục tiêu/acceptance cuối:** Asset hash khớp index; URL ghi vào report; không upload khi secret/hash gate fail.

**Test data:** Manual evidence bundle đã validate

**Tiền điều kiện:** Manual evidence bundle đã validate

**Các bước thực thi và expected result:**

1. **Thao tác:** Checkout exact commit, dùng canonical workflow/toolchain và thư mục artifact sạch.
   - **Expected:** Environment, exact build và công cụ được ghi vào run; không dùng dữ liệu thật hoặc credential thật.
2. **Thao tác:** Thiết lập tiền điều kiện và test data: Manual evidence bundle đã validate
   - **Expected:** Ghi workflow SHA, image digest, tool versions và trạng thái waiver/evidence trước gate. Fixture/dữ liệu đầu vào khớp manifest và tiền điều kiện của case.
3. **Thao tác:** Upload draft QA release rồi finalize prerelease
   - **Expected:** Asset hash khớp index; URL ghi vào report; không upload khi secret/hash gate fail.
4. **Thao tác:** Đối chiếu toàn bộ acceptance và oracle của O12; kiểm tra console/network/log theo invariants áp dụng.
   - **Expected:** Asset hash khớp index; URL ghi vào report; không upload khi secret/hash gate fail.
5. **Thao tác:** Thu bằng chứng bắt buộc: screenshot, console-network-log, machine-readable-security-evidence; ghi actual result và thời lượng.
   - **Expected:** Evidence đọc được, không chứa secret/PII ngoài allowlist, được index với case ID, MIME, byte length và SHA-256.
6. **Thao tác:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
   - **Expected:** Cleanup hoàn tất; case sau không kế thừa project, file, worker, request, cache hoặc state ngoài điều đã khai báo.

**Evidence bắt buộc:** screenshot, console-network-log, machine-readable-security-evidence

**Instances phải ghi kết quả riêng:** `O12@ENV-CI`

**Cleanup/isolation:** Xóa artifact cục bộ không được index; giữ lại bundle/manifest đã hash theo retention policy.
