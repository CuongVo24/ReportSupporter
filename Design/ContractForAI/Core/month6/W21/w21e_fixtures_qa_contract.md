# Contract For AI - W21 Group E: Fixtures, Tests & QA

> **Lane / Week:** Core / Month 6 / W21 - Day 5 (`Design/TaskBrief/Core/month6/w21.md` `[C174]`-`[C175]`).
> **Branch:** `feature/W21-import-foundation`.
> **Builds on:** Group A-D (trọn flow: types → registry → docx → assets/split/draft).
> **Depended on by:** W22-W24 (fixture infra + grep gate tái dùng), Phase 5 acceptance (W24).
> **Sources:** `w21.md` Locked #2/#6, `Conventions/TestStrategy.md`, `6.Import.md` §3.2.

---

## 1. Micro-task Target

Khoá W21 bằng **fixtures thật + QA report**: bộ `.docx` tiếng Việt thực tế (heading đa cấp, list, bảng, ảnh, track-changes, heading đánh số cứng) + snapshot tests trọn flow, **grep gate** reverse-pipeline-chỉ-trong-Import, và `W21_QA_Report.md` đối chiếu nguồn↔kết quả.

> **🔒 QA đối chiếu trung thực (Locked #6).** Report phải liệt kê nội dung KHÔNG sang được và warning tương ứng — không chỉ khoe cái chạy được.
> **🔒 Grep gate = CI-able (Locked #2).** Kiểm tra biên giới module bằng test/script lặp lại được, không phải kiểm tay một lần.

## 2. Scope

### In scope (`[C174]`/`[C175]`)
- Fixtures (**NEW** `src/modules/import/__fixtures__/`): ≥3 file `.docx` VN (báo cáo môn học: heading 3 cấp + list + bảng; file có ảnh nhúng; file có track-changes + heading "1.2 " đánh số cứng).
- Snapshot tests trọn flow: file → registry → docx converter → assets → split → `ImportDraft` (markdown + sections + assets + warnings).
- Boundary test (**NEW**): fail nếu `rehype-remark|remark-stringify|mammoth` được import ngoài `src/modules/import/`.
- `Design/Reports/Month6/W21/W21_QA_Report.md` (**NEW**): DoD map (`week21.md` §8), bảng nguồn↔kết quả per fixture, danh sách warning, limitation; + `build_output.txt`.

### Out of scope
- ❌ Fixtures PDF/XLSX/PPTX (W22/W23); E2E round-trip (W24).
- ❌ Fix lỗi lớn phát hiện muộn ngoài localized fix (lỗi lớn → break task).

## 3. Checklist
- [ ] ≥3 fixtures `.docx` VN commit kèm nguồn gốc mô tả trong QA.
- [ ] Snapshot trọn flow xanh; warnings xuất hiện đúng chỗ chủ đích (track-changes/ảnh hỏng).
- [ ] Heading "1.2 " trong fixture → strip sạch trong snapshot.
- [ ] Boundary test fail khi cố import mammoth ở module khác (verify bằng cách thử).
- [ ] QA report: DoD map đủ, mục "Không sang được" có nội dung thật.
- [ ] 4 gates xanh + `build_output.txt`.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/__fixtures__/*.docx` | NEW | ≥3 file VN thực tế |
| `src/modules/import/import-flow.test.ts` | NEW | snapshot trọn flow |
| `src/modules/import/module-boundary.test.ts` | NEW | grep gate CI-able |
| `Design/Reports/Month6/W21/W21_QA_Report.md` | NEW | DoD map + đối chiếu |
| `Design/Reports/Month6/W21/build_output.txt` | NEW | 4 gates log |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Fixture "đẹp" không đại diện docx thật | Medium | Lấy từ báo cáo VN thật (Times NR, bảng điểm, mục lục Word). |
| Snapshot giòn theo version mammoth | Medium | Pin exact W21A; snapshot theo cấu trúc (headings/sections count) + full text. |
| QA chỉ khoe pass | Medium | Template report bắt buộc mục "Không sang được" (Locked #6). |
| Fixture chứa dữ liệu cá nhân | Low | Ẩn danh hoá tên người/trường trước khi commit. |

## 6. Verification Plan
- `npm ci` + 4 gates xanh; toàn bộ Vitest xanh (unit A-D + flow + boundary).
- Boundary test: thêm import mammoth tạm vào module write → test đỏ → revert.
- QA report review đối chiếu từng fixture mở bằng Word vs preview.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `test(import): docx fixtures + full-flow snapshots + module boundary gate`; `docs(reports): W21 QA report`; `docs(import): commit w21e contract`.
