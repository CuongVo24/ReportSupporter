# ReportSupporter QA package v3

## Bắt đầu

```powershell
npm ci
npm run qa:check
```

Nguồn chuẩn:

- `KichBan-Test-Tong-The.md`: policy, môi trường, entry/exit và release rules.
- `catalog/test-cases.json`: test case và parameter matrix.
- `catalog/requirements.json`: requirement registry.
- `fixtures/manifest.json`: fixture inventory, hash và oracle.
- `schemas/qa-schemas.json`: machine-readable contracts.

Không sửa trực tiếp `generated/` hoặc result template generated.

## Tạo một run

1. Sao chép `templates/run.template.json`, `templates/case-results.template.csv`, `templates/evidence-index.template.json` và `templates/defects.template.json` vào `test-results/qa/<RUN_ID>/`.
2. Đổi tên thành `run.json`, `case-results.csv`, `evidence-index.json`, `defects.json`.
3. Ghi một dòng cho từng expanded instance; không gộp ma trận.
4. Index mọi screenshot, trace, HAR, log và artifact bằng SHA-256.
5. Chạy:

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
- BUG-001 và BUG-002 đang `OPEN`; sản phẩm vẫn `NO_GO` cho tới retest pass.
