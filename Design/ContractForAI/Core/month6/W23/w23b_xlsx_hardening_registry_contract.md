# Contract For AI - W23 Group B: XLSX Hardening & Registry

> **Lane / Week:** Core / Month 6 / W23 - Day 2 (`Design/TaskBrief/Core/month6/w23.md` `[C188]`-`[C189]`).
> **Branch:** `feature/W23-import-office`.
> **Builds on:** W23A (xlsx core), W21B (registry — **không sửa core**).
> **Depended on by:** Group E (QA), W24 (worker + E2E).
> **Sources:** `w23.md` Locked #4/#5, `6.Import.md` §3.2/§5.

---

## 1. Micro-task Target

Hardening XLSX cho file thật: **merged cells** flatten (giá trị ở ô đầu vùng merge, ô còn lại rỗng) + warning; **row cap 500/sheet** → cắt + `sheet-truncated` (kèm `location: "sheet X"` và số hàng bị cắt trong message); **sheet ẩn** bỏ qua + warning; đăng ký XlsxConverter vào registry (dynamic import) + fixtures cơ bản. **Diff gate: zero sửa `registry.ts` core/dropzone.**

> **🔒 Truncate có tiếng nói (Locked #5).** Cắt 500 hàng phải nói rõ "đã cắt N hàng" — user quyết có cần nguồn khác không.
> **🔒 Thêm converter không sửa core (Locked #4).** Nếu buộc phải sửa core → dừng, escalate contract, không sửa lén.

## 2. Scope

### In scope (`[C188]`/`[C189]`)
- `converters/xlsx.ts` (MODIFY): merged ranges (`!merges`) → giá trị ô top-left, các ô còn lại rỗng + 1 warning/sheet có merge; row cap 500 → `sheet-truncated`; sheet ẩn (`Hidden`) → skip + warning; workbook không sheet hiện → lỗi có thông báo.
- Col cap thực dụng: >30 cột → cắt + gộp vào message `sheet-truncated`.
- Đăng ký registry: `.xlsx` (+ `.xls` reject có thông báo riêng — format cũ không hỗ trợ), MIME chuẩn + rỗng-fallback; dynamic import.
- Fixtures xlsx VN (**NEW**): bảng điểm có merged header, file 2 sheet (1 ẩn), file >500 hàng (sinh bằng script) + snapshot tests.

### Out of scope
- ❌ PPTX (Group C/D); `.xls` binary cũ (reject, không parse).
- ❌ Sửa registry core/dropzone (diff gate).

## 3. Checklist
- [ ] Merged header: giá trị đúng ô đầu, không nhân bản, warning 1 lần/sheet.
- [ ] 501+ hàng → đúng 500 + `sheet-truncated` ghi số hàng cắt; >30 cột tương tự.
- [ ] Sheet ẩn skip + warning; workbook toàn sheet ẩn → lỗi rõ ràng.
- [ ] `.xls` → reject thông báo riêng ("định dạng Excel cũ, hãy lưu lại thành .xlsx").
- [ ] Diff không chạm `registry.ts` core/dropzone (ngoài bootstrap list entry).
- [ ] Snapshot fixtures xanh; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/converters/xlsx.ts` | MODIFY | merge/caps/hidden |
| `src/modules/import/registry.ts` | MODIFY (bootstrap list only) | entry xlsx |
| `src/modules/import/__fixtures__/*.xlsx` | NEW | 3 fixtures VN |
| `src/modules/import/xlsx-flow.test.ts` | NEW | snapshot flow |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Merge phức tạp (merge dọc nhiều tầng) ra bảng khó đọc | Medium | Flatten nhất quán top-left; warning; preview W24 cho user thấy trước commit. |
| Row cap cắt mất dữ liệu quan trọng | Medium | Message ghi rõ số cắt (Locked #5); import-to-edit — user thấy ngay. |
| Fixture >500 hàng phình repo | Low | Sinh bằng script trong test (không commit file lớn). |
| Sửa lén core khi vướng | Medium | Locked #4 — escalate. |

## 6. Verification Plan
- Vitest snapshot 3 fixtures + unit merge/cap/hidden xanh; 4 gates xanh.
- Manual: bảng điểm merged header thật → preview đọc được, warnings hiển thị.
- `git diff --stat` xác nhận registry core/dropzone không đổi.

## 7. Status

`COMPLETED`

> Commit: `feat(import): xlsx hardening — merges, caps, hidden sheets`; `test(import): xlsx fixtures + flow snapshots`; `docs(import): commit w23b contract`.
