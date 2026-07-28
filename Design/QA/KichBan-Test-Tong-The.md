# Kế hoạch kiểm thử tổng thể — ReportSupporter QA v3.0

> Master plan cho manual E2E, exploratory có hướng dẫn, regression, security và release evidence. Test case chi tiết không được duy trì trùng trong file này; nguồn chuẩn là catalog máy đọc được và các file generated.

## 1. Thông tin tài liệu

| Thuộc tính | Giá trị |
|---|---|
| Phiên bản | 3.0.0 |
| Trạng thái QA package | Ready khi `npm run qa:check` Pass và pilot handoff có evidence |
| Phạm vi ứng dụng | ReportSupporter `0.1.0` |
| Run ID | `RS-E2E-<YYYYMMDD>-<nn>` |
| Catalog chuẩn | `Design/QA/catalog/test-cases.json` (`qa-test-case@1`) |
| Requirements | `Design/QA/catalog/requirements.json` |
| Fixture manifest | `Design/QA/fixtures/manifest.json` (`qa-fixture-manifest@1`) |
| Schemas | `Design/QA/schemas/qa-schemas.json` |
| Historical report | `Design/QA/tester-result/RS-E2E-20260724-01.md` — exploratory, non-release |

### 1.1 Mục tiêu

- Xác nhận luồng người dùng từ Library → tạo/import → viết/format/check → evidence → export/submission/present.
- Xác nhận persistence, recovery, offline/PWA, responsive, accessibility, privacy, security và performance.
- Xác nhận server/API boundaries, supply-chain, container isolation và release evidence.
- Tạo kết quả tái hiện được trên đúng commit, fixture, môi trường và oracle.
- Không tuyên bố Pass nếu thiếu acceptance hoặc evidence bắt buộc.

### 1.2 Phạm vi khóa

- QA package v3 không sửa code sản phẩm, không bump application bundle schema hoặc IndexedDB.
- Windows 11 Chrome và Edge cùng Android Chrome thiết bị thật là release matrix bắt buộc.
- iOS Safari/PWA là `N/A` cho release hiện tại.
- AI content quality ngoài structural/safety/error handling là ngoài phạm vi.
- OCR chỉ đánh giá trên fixture và tolerance đã khóa.
- Uptime hoặc network performance của provider bên thứ ba không phải release gate.

## 2. Nguồn chuẩn và generated artifacts

Không sửa trực tiếp các file trong `Design/QA/generated/` hoặc `templates/case-results.template.csv`.

```powershell
npm run qa:catalog:render
npm run qa:catalog:check
```

Generated outputs:

- `Design/QA/generated/Test-Catalog.md`: bản đọc cho tester, có step/expected/evidence/cleanup.
- `Design/QA/generated/test-catalog.csv`: mọi test instance đã bung.
- `Design/QA/generated/traceability.csv`: requirement → instances.
- `Design/QA/templates/case-results.template.csv`: result sheet chuẩn, một dòng mỗi instance.

ID A01–M16 được giữ nguyên cho lịch sử. Coverage mới dùng F18–F23, M17–M20, N01–N12 và O01–O12.

## 3. Priority, severity và trạng thái

### 3.1 Test priority

| Priority | Ý nghĩa | Release gate |
|---|---|---|
| TP0 | Luồng sống còn, privacy, data loss, security, artifact hoặc release evidence | Coverage 100%, Pass 100%, không Blocked/Not Run |
| TP1 | Chức năng chính và compatibility quan trọng | Coverage 100% hoặc waiver hợp lệ; Pass ≥95% |
| TP2 | Biên, stress, usability ít gặp | Theo dõi đầy đủ; có thể hoãn với lý do và phê duyệt |

### 3.2 Bug severity

- `S0`: data loss nghiêm trọng, lộ bí mật/nội dung hoặc thực thi mã độc.
- `S1`: blocker TP0 không có workaround hợp lý.
- `S2`: sai chức năng đáng kể có workaround.
- `S3`: UI/content nhỏ, không cản luồng.

### 3.3 Canonical result status

`NOT_RUN` · `IN_PROGRESS` · `PASS` · `FAIL` · `BLOCKED` · `NA` · `RETEST_PASS` · `RETEST_FAIL`

- Cấm `PARTIAL_PASS`. Chưa đủ acceptance giữ `IN_PROGRESS`.
- Finalized report không được còn `IN_PROGRESS`.
- `FAIL`/`RETEST_FAIL` bắt buộc có actual result, bug ID và evidence.
- TP0 đã thực thi bắt buộc có evidence ID.

### 3.4 Metric

- Execution coverage = executed applicable / `(total − NA)`.
- Pass rate = `(PASS + RETEST_PASS) / (PASS + RETEST_PASS + FAIL + RETEST_FAIL)`.
- `BLOCKED`, `NOT_RUN`, `NA` không làm tăng pass rate và phải báo riêng.
- Tổng số và release decision chỉ được sinh bằng `npm run qa:report`; không cộng hoặc sửa tay.

## 4. Môi trường release

Ghi phiên bản chính xác; không ghi “latest”.

| ID | Môi trường | Phạm vi |
|---|---|---|
| ENV-D1 | Windows 11 + Chrome stable, 1440×900 | Full regression |
| ENV-D2 | Windows 11 + Edge stable, 1440×900 | TP0 + compatibility TP1 |
| ENV-R1 | Chrome 320×568, 375×667, 768×1024 | Responsive |
| ENV-M1 | Android Chrome thiết bị thật, portrait + landscape | Touch, drawer, PWA, offline TP0/TP1 |
| ENV-A11Y | Windows 11 + NVDA stable + Chrome stable | Keyboard/screen reader |
| ENV-CI | Canonical GitHub Actions workflow | Automated/release evidence |

### 4.1 Build chuẩn

1. Ghi exact commit SHA, Node/npm, OS, browser/device và DB schema.
2. `npm ci`.
3. `npm run qa:check`.
4. Chạy production/release gates theo `.github/workflows/ci.yml`.
5. Build production bằng `npm run build` và `npm start`; không kết luận performance từ dev server.
6. PDF phải dùng renderer/Docker lane đã ready.
7. PWA/Service Worker chỉ kiểm trên HTTPS hoặc localhost.
8. Dùng profile sạch và synthetic key/data; không dùng tài khoản, API key hoặc tài liệu cá nhân.

### 4.2 Isolation và cleanup

- Mỗi nhóm bắt đầu từ storage/cache sạch trừ khi case kiểm persistence/migration.
- Mỗi case dùng project ID riêng.
- Không tái sử dụng project Fail nếu chưa ghi rõ.
- Không sửa IndexedDB tùy ý; chỉ dùng versioned seed/fixture.
- Sau AI test đóng tab/profile và xác nhận key không tồn tại ở storage/evidence.
- Cleanup phải thực hiện đúng trường `cleanup` trong catalog.

## 5. Fixture và oracle

```powershell
npm run qa:fixtures:generate
npm run qa:fixtures:verify
```

- `manifest.json` chứa path, MIME, exact bytes, SHA-256, oracle, sensitivity/license và generator version.
- Fixture nhỏ/golden được commit; fixture boundary lớn được sinh deterministic trong `fixtures/generated/`.
- Không thay fixture bằng file khác khi hash sai hoặc thiếu; case tương ứng là `BLOCKED`.
- Golden checker/pagination/stress/recovery phải được review độc lập; không tự cập nhật expected từ output implementation trong cùng thay đổi.
- Với download/export, lưu MIME, byte length, SHA-256 và kết quả parse/open thật.

## 6. Invariants và evidence

Áp dụng trừ khi case chủ động tạo lỗi:

1. Không có pageerror, unhandled rejection hoặc console error ngoài allowlist.
2. Không có request bất ngờ hoặc external content request trước consent.
3. AI/PDF chỉ gửi nội dung qua boundary được chỉ định sau hành động chủ động.
4. Không có API key/token/prompt/report marker trong storage, URL, log, export, ZIP, snapshot, screenshot, HAR hoặc trace.
5. Mọi Fail có actual result, reproduction, bug ID và evidence.
6. Artifact có MIME, size, SHA-256 và parse/open result.
7. Security evidence chỉ chứa cause code/aggregate; không chứa report content hoặc credential.

Output local:

```text
test-results/qa/<RUN_ID>/
  run.json
  case-results.csv
  defects.json
  evidence-index.json
  report.json
  report.md
  evidence/
```

```powershell
npm run qa:validate -- --run test-results/qa/<RUN_ID>
npm run qa:report -- --run test-results/qa/<RUN_ID>
npm run qa:bundle -- --run test-results/qa/<RUN_ID>
```

`qa:bundle` chỉ đóng gói file có trong evidence index, kiểm hash và secret scan. Manual Android/NVDA/Word/PowerPoint evidence được upload bằng:

```powershell
npm run qa:publish -- --run test-results/qa/<RUN_ID> --confirm
```

Run chưa finalized tạo draft QA release; run finalized chuyển thành prerelease. Automated CI evidence giữ 90 ngày.

## 7. Entry và exit criteria

### 7.1 Entry

- `npm run qa:check` Pass và generated files sạch.
- Production build khởi động; `/api/ready` đúng trạng thái.
- Fixture generate/verify Pass; manifest hash ghi vào run.
- Tester có DevTools, download, Android thật, NVDA và app cần để mở DOCX/PPTX.
- Có synthetic AI key/quota nếu chạy live.
- Hai S1 hiện tại đã được đọc và trạng thái defect registry khớp build.

### 7.2 QA package ready

- Catalog/requirements/traceability/fixtures đạt 100% validator.
- Meta-tests Pass.
- Pilot smoke tạo được report, bundle và QA evidence asset.
- Tester độc lập tabletop ít nhất một case mỗi nhóm A–O mà không cần hướng dẫn miệng.

### 7.3 Product release

- TP0 coverage/pass 100%; TP1 coverage 100% hoặc waiver hợp lệ và Pass ≥95%.
- Không S0/S1 mở.
- Privacy/security/data-loss/artifact/performance gates Pass.
- Canonical CI Pass trên exact commit.
- Evidence manifests và manual evidence URL/hash tồn tại.

## 8. Release decision

- `GO`: không S0/S1; TP0, security/privacy/data-loss/artifact và canonical CI đều Pass.
- `CONDITIONAL_GO`: chỉ còn S2/S3 có owner, workaround, người duyệt và hạn waiver; TP0 vẫn Pass 100%.
- Các trường hợp khác: `NO_GO`.

BUG-001 và BUG-002 hiện là `OPEN`, severity S1, owner chưa được gán và chưa có fixed build. Vì vậy sản phẩm vẫn `NO_GO` cho tới khi đội phát triển sửa và tester ghi `RETEST_PASS`. QA package v3 không sửa hai lỗi này.

## 9. Suite và workload

- Smoke: 30–45 phút khi fixture đã sẵn sàng.
- Critical regression: 2–3 giờ.
- Full regression: tổng `estimatedMinutes` của expanded catalog +20% evidence overhead.
- Không gộp test instance; chia session/tester từ CSV generated.

## 10. CI và maintenance

CI bắt buộc:

1. Generate/verify QA fixtures.
2. Check generated catalog và traceability.
3. Validate package và chạy QA meta-tests.
4. Chạy production config, supply-chain, audit, coverage/fuzz, performance/build/browser, SBOM/Trivy và Docker isolation.
5. Sinh release-evidence manifest và upload artifacts kể cả khi failure.

Mọi thay đổi template, evidence kind, command, checker rule, export gate, schema, network destination, security boundary hoặc performance budget phải cập nhật requirement, catalog, fixture/oracle và automated test trong cùng pull request.
