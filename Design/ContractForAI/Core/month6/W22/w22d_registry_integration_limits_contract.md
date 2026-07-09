# Contract For AI - W22 Group D: Registry Integration, Limits & Table Flatten

> **Lane / Week:** Core / Month 6 / W22 - Day 4 (`Design/TaskBrief/Core/month6/w22.md` `[C182]`-`[C183]`).
> **Branch:** `feature/W22-import-pdf`.
> **Builds on:** W22A-C (extract → heuristic → ảnh/scan), W21B (registry), W21D (split/draft).
> **Depended on by:** Group E (fixtures test trọn flow PDF), W24 (worker host converter này).
> **Sources:** `w22.md` Locked #5/#6, `6.Import.md` §4/§5.

---

## 1. Micro-task Target

Lắp trọn **PdfConverter**: extract (A) → heuristic (B) → ảnh/scan (C) → Markdown → section split (W21D) → `ImportDraft`; đăng ký registry; **limits cứng** (50MB qua `maxBytes`, page cap 300 → `file-too-large`); vùng nghi **bảng** (nhiều cột thẳng hàng) → flatten text + `table-flattened`; PDF 2 cột best-effort theo toạ độ.

> **🔒 Giới hạn cứng (Locked #6).** Vượt cap → dừng sớm có thông báo, không cố parse.
> **🔒 Bảng flatten được phép (Locked #5).** Không tái tạo GFM table từ toạ độ; nhưng phải có warning — user biết chỗ cần tự sửa.

## 2. Scope

### In scope (`[C182]`/`[C183]`)
- `converters/pdf.ts` (MODIFY): pipeline A→B→C hoàn chỉnh → `ImportResult`; strip số chương; đăng ký registry (`.pdf`, `application/pdf`, maxBytes 50MB).
- Page cap 300: đếm trước khi parse; vượt → `file-too-large` + thông báo (không parse một phần im lặng).
- Column/table detection tối thiểu (**NEW** `pdf/detect-columns.ts`, pure): ≥3 dòng liên tiếp có ≥2 cụm x thẳng hàng → vùng bảng → flatten từng dòng (tab-separated) + `table-flattened`; 2 cụm x toàn trang → 2 cột, đọc cột trái trước.
- Progress callback per page (chuẩn bị cho worker W24 — signature nhận `onProgress?`).

### Out of scope
- ❌ GFM table thật từ PDF; layout phức tạp hơn 2 cột.
- ❌ Fixtures/QA (Group E); worker hoá (W24).

## 3. Checklist
- [ ] Flow trọn: file PDF → `ImportDraft` với sections + assets + warnings đúng thứ tự trang.
- [ ] 50MB + 300 trang gate: vượt → `file-too-large`, không parse một phần.
- [ ] Vùng bảng → flatten + `table-flattened` (location trang); không mất dòng nào.
- [ ] PDF 2 cột: cột trái đọc trước; ghi limitation vào warning nếu detect 2 cột.
- [ ] `onProgress` callback gọi per page (test đếm).
- [ ] Registry: `.pdf` resolve đúng, MIME rỗng fallback extension.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/converters/pdf.ts` | MODIFY | pipeline hoàn chỉnh + registry + caps |
| `src/modules/import/pdf/detect-columns.ts` | NEW | pure; bảng/2 cột |
| `src/modules/import/pdf/detect-columns.test.ts` | NEW | unit TextItem viết tay |
| `src/modules/import/registry.ts` | MODIFY (bootstrap list) | entry pdf |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Detect bảng ăn nhầm đoạn thường | Medium | Ngưỡng bảo thủ (≥3 dòng, ≥2 cụm); flatten không phá nội dung — chỉ mất format. |
| Parse một phần im lặng khi vượt cap | Medium | Locked #6 — kiểm cap trước parse; test file 301 trang giả metadata. |
| 2 cột đọc trộn dòng | Medium | Phân cụm x toàn trang trước, sort trong từng cột; limitation warning. |
| Flow lắp xong lộ lệch interface A/B/C | Medium | Types plain data đã khoá W22A; typecheck dẫn đường. |

## 6. Verification Plan
- Vitest: detect-columns unit + flow integration trên PDF nhỏ.
- Manual: PDF thật ≥10 trang → draft xem được, warnings đúng; PDF quá cap → thông báo rõ.
- 4 gates xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(import): complete pdf converter pipeline + registry`; `feat(import): pdf limits, column/table flatten with warnings`; `docs(import): commit w22d contract`.
