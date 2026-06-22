# Support Module - Evidence Kit

> **Vị trí trong stack:** `src/modules/evidence/` (supporting module, không tính là core pillar thứ 6).
> **Tuần xây dựng:** Phase 2 / W5 là mốc chính; W1-W4 chỉ cần type/interface để các module khác không tự chế shape riêng.
> **Consumed by:** Check, Export, Present.

---

## 1. Purpose

Evidence Kit quản lý toàn bộ minh chứng nộp bài: video demo, source GitHub, deploy link, slide, Figma, Google Drive, tài khoản test, API docs, và ghi chú liên quan.

Đây là điểm khác biệt sản phẩm so với một converter thường. ReportSupporter không chỉ xuất file báo cáo, mà giúp sinh viên gom đủ bộ nộp bài: báo cáo + minh chứng + checklist + sau này là slide/script bảo vệ.

Evidence là supporting module riêng để:

- Write không bị phình thành nơi quản lý mọi thứ.
- Check có nguồn dữ liệu chính thức để kiểm tra thiếu minh chứng.
- Export có thể sinh phụ lục minh chứng.
- Present có thể tạo demo slide / QR slide / script cue.

---

## 2. Scope

### In scope

- Quản lý `EvidenceItem[]` trong `ReportProjectBundle`.
- Hỗ trợ evidence kinds: `video`, `github`, `deploy`, `drive`, `figma`, `account`, `api-docs`, `slide`, `other`.
- Validate shape cơ bản: title, kind, URL optional, note optional.
- Cho Check đọc `requiredEvidenceKinds` từ template để báo thiếu minh chứng.
- Cho Export sinh phụ lục minh chứng dạng bảng.
- Cho Present tham chiếu evidence để tạo demo/script cue.

### Out of scope for MVP

- Không fetch URL để kiểm tra link còn sống.
- Không upload/lưu cloud.
- Không sinh QR trong Phase 1. MVP chỉ lưu `qrEnabled`; QR generation thuộc Phase 2 và dependency `qrcode`.
- Không quản lý permission/tài khoản nhóm.

---

## 3. Public Types (định nghĩa tại CanonicalTypes — Evidence chỉ tiêu thụ)

Evidence Kit **không** định nghĩa lại type — mọi shape sống một lần ở
`Design/Modules/Other/CanonicalTypes.md`:

- `EvidenceKind` (CanonicalTypes §2) — 8 loại phổ biến (`video`, `github`, `deploy`, `drive`, `figma`, `account`, `api-docs`, `slide`) + `other` fallback = 9 kind.
- `EvidenceItem` (§2) — `{ id, kind, title, url?, note?, qrEnabled, createdAt }`.
- `ReportProjectBundle` (§4) — evidence sống trong bundle chung: `bundle.evidence: EvidenceItem[]`.

---

## 4. Template-Aware Requirements

Template khai báo evidence bắt buộc qua `TemplateSchema.requiredEvidenceKinds`
(`TemplateSchema` định nghĩa ở CanonicalTypes §5 — không tái định nghĩa ở đây).

Ví dụ template báo cáo đồ án phần mềm nên yêu cầu:

- `github`
- `video`
- `deploy`

Checker rule `missing-required-evidence` đọc `requiredEvidenceKinds` và `bundle.evidence`, không scan text thủ công để đoán minh chứng.

---

## 5. Processing Logic

1. User thêm evidence trong Evidence panel hoặc từ Write workspace.
2. Evidence item được validate và lưu trong `ReportProjectBundle.evidence`.
3. Check chạy offline:
   - thiếu evidence kind bắt buộc -> `missing-required-evidence`
   - URL shape sai -> `broken-evidence-url-shape`
4. Export đọc evidence để sinh phụ lục minh chứng.
5. Present đọc evidence để tạo demo cue, QR slide, hoặc script cue ở Phase 3.

---

## 6. QC Checklist

| Test scenario | Expected result |
| :--- | :--- |
| Missing GitHub evidence | Software project template thiếu `github` -> Check báo `missing-required-evidence`. |
| URL shape invalid | Evidence URL là chuỗi không giống URL -> Check báo `broken-evidence-url-shape`, không gọi mạng. |
| Export appendix | Evidence list có video/github/deploy -> Export sinh bảng phụ lục minh chứng. |
| Present cue | Evidence video/demo được map thành cue trong script/outline Phase 3. |
| QR deferred | `qrEnabled=true` được lưu nhưng không yêu cầu sinh QR ở Phase 1. |

---

## 7. Acceptance Criteria

- Evidence là supporting module riêng, không phá cấu trúc 5 core modules.
- `EvidenceItem[]` là nguồn chính thức cho Check/Export/Present.
- Checker không fetch URL; chỉ kiểm tra shape và sự hiện diện.
- Export có thể sinh phụ lục minh chứng từ cùng bundle.
- Present phụ thuộc Evidence Kit để biến báo cáo + minh chứng thành bộ bảo vệ đồ án.

