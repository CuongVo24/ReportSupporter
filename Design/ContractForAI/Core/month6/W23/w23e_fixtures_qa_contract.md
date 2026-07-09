# Contract For AI - W23 Group E: Office Fixtures, Tests & QA

> **Lane / Week:** Core / Month 6 / W23 - Day 5 (`Design/TaskBrief/Core/month6/w23.md` `[C194]`-`[C195]`).
> **Branch:** `feature/W23-import-office`.
> **Builds on:** Group A-D (XLSX + PPTX hoàn chỉnh), W21E/W22E (fixture infra + boundary test).
> **Depended on by:** W24 (E2E 4 format), Phase 5 acceptance.
> **Sources:** `w23.md` Locked #1/#4, `Conventions/TestStrategy.md`.

---

## 1. Micro-task Target

Khoá W23: **fixtures pptx 2 nguồn** (PowerPoint + Google Slides export — slide bảo vệ thật: title/bullets đa cấp/notes/ảnh ≥2 slide) + snapshot tests; mở rộng boundary test (`xlsx` chỉ-trong-Import); `W23_QA_Report.md` đối chiếu 2 format + **diff gate xác nhận zero sửa core** + xác nhận nguồn SheetJS chính thức.

> **🔒 Diff gate là bằng chứng (Locked #4).** QA đính kèm `git diff --stat` của tuần chứng minh registry core/dropzone không đổi — đây là acceptance của kiến trúc extension point W21.
> **⚠️ Fixtures 2 nguồn pptx bắt buộc** — PowerPoint và Google Slides sinh XML khác nhau đáng kể.

## 2. Scope

### In scope (`[C194]`/`[C195]`)
- Fixtures (**NEW**): `defense-ppt.pptx` (PowerPoint: title/bullets 3 cấp/notes/ảnh ≥2 slide/1 chart), `defense-gslides.pptx` (Google Slides export cùng nội dung tương đương); xlsx fixtures đã có từ Group B.
- Snapshot tests trọn flow pptx per fixture (sections/bullets/notes/assets/warnings) + bổ sung flow xlsx nếu Group B thiếu case.
- Boundary test (MODIFY): thêm `xlsx` vào danh sách chỉ-trong-Import.
- `Design/Reports/Month6/W23/W23_QA_Report.md` (**NEW**): đối chiếu nguồn↔kết quả 2 format (bảng: sheet/slide → section, giá trị mẫu, ảnh, warnings); mục "Không sang được" (chart/SmartArt/merge phức tạp); diff gate evidence; nguồn SheetJS; DoD map `week23.md` §8; + `build_output.txt`.

### Out of scope
- ❌ Fix lỗi lớn phát hiện muộn (→ break task); E2E round-trip (W24).

## 3. Checklist
- [ ] 2 fixtures pptx 2 nguồn thật, ẩn danh hoá; snapshot xanh cả hai.
- [ ] Google Slides fixture: khác biệt XML được hấp thụ hoặc thành warning — không crash.
- [ ] Boundary test bắt `xlsx` import ngoài module.
- [ ] QA: bảng đối chiếu có số liệu thật; diff gate đính kèm; nguồn SheetJS xác nhận.
- [ ] 4 gates xanh + `build_output.txt`.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/__fixtures__/*.pptx` | NEW | 2 nguồn |
| `src/modules/import/pptx-flow.test.ts` | NEW | snapshot per fixture |
| `src/modules/import/module-boundary.test.ts` | MODIFY | + xlsx |
| `Design/Reports/Month6/W23/W23_QA_Report.md` | NEW | đối chiếu + diff gate |
| `Design/Reports/Month6/W23/build_output.txt` | NEW | 4 gates log |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Google Slides XML lệch chuẩn nhiều | Medium | Chấp nhận degrade thành warnings; ghi limitation cụ thể trong QA. |
| Fixture pptx nặng (ảnh) phình repo | Low | Nén ảnh fixture ≤200KB/file. |
| QA bỏ sót "không sang được" | Medium | Template mục bắt buộc như W21E/W22E. |

## 6. Verification Plan
- Toàn bộ Vitest W23 xanh; 4 gates xanh.
- Mở fixtures bằng PowerPoint/Excel đối chiếu QA table.
- Diff gate: `git diff main...feature/W23-import-office --stat -- src/modules/import/registry.ts src/modules/write/` review.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `test(import): pptx fixtures (powerpoint + gslides) + flow snapshots`; `docs(reports): W23 QA report with diff gate evidence`; `docs(import): commit w23e contract`.
