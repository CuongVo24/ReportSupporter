# Evidence Kit - Implementation Samples & Outputs

This document demonstrates the output shapes for the appendix table, QR preview elements, and checker issue structures generated in Week 5.

---

## 1. Sample Data Structure

The following is a representation of the `bundle.evidence` array managed in IndexedDB:

```json
[
  {
    "id": "ev-github",
    "kind": "github",
    "title": "Mã nguồn ứng dụng",
    "url": "https://github.com/CuongVo24/ReportSupporter",
    "note": "Kho lưu trữ chính của dự án.",
    "qrEnabled": true,
    "createdAt": "2026-06-24T00:00:00.000Z"
  },
  {
    "id": "ev-video",
    "kind": "video",
    "title": "Video demo tính năng",
    "url": "https://youtube.com/watch?v=demo",
    "note": "Video giới thiệu giao diện và chức năng của dự án.",
    "qrEnabled": true,
    "createdAt": "2026-06-24T00:00:00.000Z"
  },
  {
    "id": "ev-deploy",
    "kind": "deploy",
    "title": "Bản chạy thử (Production)",
    "url": "https://report-supporter.vercel.app",
    "note": "",
    "qrEnabled": false,
    "createdAt": "2026-06-24T00:00:00.000Z"
  }
]
```

---

## 2. Generated Appendix Table (GFM Markdown)

The `buildEvidenceAppendix(evidence)` function processes the sample data above and returns the following Markdown string:

```markdown
## Phụ lục minh chứng

| Loại | Tiêu đề | Liên kết | Ghi chú |
| --- | --- | --- | --- |
| Mã nguồn (GitHub) | Mã nguồn ứng dụng | [Liên kết](https://github.com/CuongVo24/ReportSupporter) <span class="ws-evidence-qr-placeholder" data-url="https://github.com/CuongVo24/ReportSupporter"></span> | Kho lưu trữ chính của dự án. |
| Video demo | Video demo tính năng | [Liên kết](https://youtube.com/watch?v=demo) <span class="ws-evidence-qr-placeholder" data-url="https://youtube.com/watch?v=demo"></span> | Video giới thiệu giao diện và chức năng của dự án. |
| Bản triển khai (Deploy) | Bản chạy thử (Production) | [Liên kết](https://report-supporter.vercel.app) |  |
```

---

## 3. Rendered HTML Snippet (Live Preview & HTML Export)

### Live Preview Pane (React Portal Mounting)
In the preview pane DOM container, the raw HTML compiled by unified is rendered as:

```html
<td>
  <a href="https://github.com/CuongVo24/ReportSupporter">Liên kết</a>
  <span class="ws-evidence-qr-placeholder" data-url="https://github.com/CuongVo24/ReportSupporter">
    <!-- React Portal mounts the QR image here -->
    <img src="data:image/png;base64,iVBORw0KGgo..." alt="QR: https://github.com/CuongVo24/ReportSupporter" class="ws-evidence-qr-img" style="display: inline-block; width: 100px; height: 100px; vertical-align: middle; margin-left: 8px;">
  </span>
</td>
```

### Exported HTML (Statically Embedded)
During HTML export, the placeholders are replaced directly in MDAST, generating static self-contained markup:

```html
<td>
  <a href="https://github.com/CuongVo24/ReportSupporter">Liên kết</a>
  <img src="data:image/png;base64,iVBORw0KGgo..." alt="QR: https://github.com/CuongVo24/ReportSupporter" class="ws-evidence-qr-img">
</td>
```

---

## 4. Simulated Checker Issue Scenarios

If the user violates constraints checked by Module 3, the checker returns typed issues in the following format:

### Scenario A: Required Kind Missing (e.g. video demo)
```json
{
  "id": "missing-required-evidence",
  "severity": "error",
  "module": "check",
  "message": "Thêm minh chứng bắt buộc trong Evidence Kit (GitHub/demo/deploy/video). Missing kind: video.",
  "suggestion": "Vui lòng thêm một minh chứng loại \"video\" trong danh sách Evidence Kit."
}
```

### Scenario B: Invalid URL Shape
```json
{
  "id": "broken-evidence-url-shape",
  "severity": "warning",
  "module": "check",
  "message": "Kiểm tra lại định dạng URL minh chứng; Checker không gọi mạng để test link sống.",
  "suggestion": "Sửa lại URL không hợp lệ \"abc\" của minh chứng \"Mã nguồn ứng dụng\". URL phải có định dạng đầy đủ (vd: https://...)."
}
```
