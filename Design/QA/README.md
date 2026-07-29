# ReportSupporter QA package v3.1

## Bắt đầu

```powershell
npm ci
npm run qa:check
```

Nguồn chuẩn:

- `KichBan-Test-Tong-The.md`: handbook đầy đủ cho tester, gồm policy và toàn bộ kịch bản A–O; file được sinh tự động.
- `catalog/master-plan-preamble.md`: nguồn policy, môi trường, entry/exit và release rules của handbook.
- `catalog/test-cases.json`: nguồn chuẩn cho test data, bước/expected, tầng kiểm thử, evidence, cleanup và parameter matrix.
- `catalog/requirements.json`: requirement registry.
- `fixtures/manifest.json`: fixture inventory, hash và oracle.
- `schemas/qa-schemas.json`: machine-readable contracts.

Không sửa trực tiếp `KichBan-Test-Tong-The.md`, `generated/` hoặc result template generated. Sau khi sửa policy/catalog, chạy:

```powershell
npm run qa:catalog:render
npm run qa:catalog:check
```

## Tạo một run

1. Chọn taxonomy: `RS-QA-<YYYYMMDD>-<nn>` cho run tổng thể; chỉ dùng `RS-E2E-*` nếu run được giới hạn riêng ở tầng E2E.
2. Sao chép `templates/run.template.json`, `templates/case-results.template.csv`, `templates/evidence-index.template.json` và `templates/defects.template.json` vào `test-results/qa/<RUN_ID>/`.
3. Đổi tên thành `run.json`, `case-results.csv`, `evidence-index.json`, `defects.json`.
4. Ghi một dòng cho từng cặp expanded instance × environment; không gộp ma trận.
5. Thực hiện đủ các tầng ghi trong `testLevels`; automation không thay thế phần manual của case `hybrid`.
6. Index mọi screenshot, trace, HAR, log và artifact bằng SHA-256.
7. Chạy:

```powershell
npm run qa:validate -- --run test-results/qa/<RUN_ID>
npm run qa:report -- --run test-results/qa/<RUN_ID>
npm run qa:bundle -- --run test-results/qa/<RUN_ID>
```

Chỉ khi bundle đã kiểm secret/hash:

```powershell
npm run qa:publish -- --run test-results/qa/<RUN_ID> --confirm
```

## Quy tắc

- Không dùng `PARTIAL_PASS`.
- Không sửa tổng số hoặc release decision trong report generated.
- Không dùng dữ liệu thật, key thật hoặc tài liệu cá nhân.
- Historical report không được viết lại.
- Defect đã sửa code vẫn chặn release cho đến khi tester ghi `RETEST_PASS` trên fixed build.
