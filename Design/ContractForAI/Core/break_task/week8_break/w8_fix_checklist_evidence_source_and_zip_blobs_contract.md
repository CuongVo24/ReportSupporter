# Contract For AI — W8 Break: Fix Checklist Evidence Source (Locked #4) & evidence.zip Missing Documents After Reload

> **Lane:** Core / break_task / week8_break.
> **Branch:** `feature/W8-submission-package` (hoặc `fix/w8-submission-fidelity`).
> **Type:** Bug fix / correctness + contract-fidelity — review findings **#1**, **#2** (W8 code review).
> **Builds on:** Group C (`submission-checklist.ts`), Group A (`build-submission-zip.ts`), Group D (`export-history.ts`, `use-export.ts`), Group E (`SubmissionPanel.tsx`, `Workspace.tsx`), W3 Checker (`check/rules/evidence-gaps.ts`, `CheckResult`).
> **Sources:** W8 code review (session 2026-06-25), `Design/ContractForAI/Core/month2/W8/w8a_*`, `w8c_*`, `w8e_*`, `Design/TaskBrief/Core/month2/w8.md` (Locked Decisions #1 "một nguồn dữ liệu" / #4 "aggregate, không re-check"), `Design/Modules/Other/CanonicalTypes.md §8`.

---

## 1. Micro-task Target

Vá hai lỗi **đúng-sai** của W8 đã ship: (a) final checklist **tự kiểm tra lại** minh chứng bắt buộc thay vì đọc kết quả engine (vi phạm Locked #4 + Locked #1 "một nguồn"), và (b) **`evidence.zip` thiếu `report.*`** sau khi reload trang vì checklist báo "đã export" (đọc history persisted) còn zip lại lấy blob in-session (rỗng sau reload) — người dùng tải về im lặng một bộ nộp **thiếu tài liệu**. Code hiện chạy được, 4 gates xanh (`build_output.txt`), nhưng hai điểm này làm sai DoD cốt lõi của Submission MVP ("zip có report.*", w8a/w8e §6).

- **#1 Checklist re-implement `missing-required-evidence` (Locked #4).** [submission-checklist.ts:44-59](src/modules/export/submission-checklist.ts) tự dựng `getTemplate(...).requiredEvidenceKinds` rồi `providedKinds = new Set(bundle.evidence.map(e => e.kind))` và diff thủ công — **lặp nguyên logic** của [missingRequiredEvidenceRule](src/modules/check/rules/evidence-gaps.ts) (`id: "missing-required-evidence"`, severity `error`). Hai hệ quả:
  - **Hai nguồn template lệch nhau:** checklist đọc `getTemplate` (`@/modules/write`), còn rule W5 đọc `getTemplateSchema` ([evidence-gaps.ts:114](src/modules/check/rules/evidence-gaps.ts)). Nếu hai bảng `requiredEvidenceKinds` lệch → Checker và checklist báo **khác nhau** cho cùng dự án.
  - **Double-report:** mục `no-error-issues` ([submission-checklist.ts:31-42](src/modules/export/submission-checklist.ts)) đã đếm mọi issue `error` (gồm `missing-required-evidence`), nên mục `required-evidence` đang báo trùng cùng một lỗi từ một engine duy nhất bằng đường tính lại riêng.
- **#2 `evidence.zip` thiếu `report.*` sau reload.** [SubmissionPanel.tsx:66-95](src/modules/export/SubmissionPanel.tsx) `handleDownloadPackage` đóng gói từ prop `exportedBlobs` (lấy từ `useExport`, state khởi tạo rỗng mỗi lần mount — [use-export.ts:72](src/modules/export/use-export.ts)). Trong khi đó mục checklist "đã export" lại suy từ **history persisted** ([SubmissionPanel.tsx:51-57](src/modules/export/SubmissionPanel.tsx) đọc `loadExportHistory()`). Kịch bản thật: user export ở phiên trước → reload → checklist "Đã xuất bản ≥1 định dạng" = ✅ → bấm "Tải evidence.zip" → [build-submission-zip.ts:34-50](src/modules/export/build-submission-zip.ts) bỏ qua mọi `report.*` (exports rỗng) → zip chỉ có `README.md` + `evidence/appendix.md` + `manifest.json`, **không cảnh báo**. Vi phạm Verification Plan w8a/w8e ("zip tải về có report.*").

> 🔒 **Một nguồn — đọc engine, không re-check (Locked #1 + #4).** Mục evidence trong checklist phải **đối chiếu `CheckResult.issues`** (`some(i => i.id === "missing-required-evidence")`), **không** tự gọi `getTemplate`/diff kind. Đây là sửa hướng tiêu thụ; không đổi rule W5.
> 🔒 **Không đổi shape canonical.** `SubmissionChecklistItem`/`CheckResult`/`PackageManifest` giữ nguyên (`CanonicalTypes §8`). Đây là fix logic + wiring, không sửa type công khai.
> 🔒 **Local-first, không thêm dep.** Không persist Blob vào IndexedDB ở contract này (out of scope, nặng); fix #2 là **làm UI phản ánh đúng blob khả dụng trong phiên**, không upload, không lib mới.

## 2. Scope

### In scope
- **#1** `src/modules/export/submission-checklist.ts` (MODIFY): mục `required-evidence` đọc từ `check.issues` thay vì re-derive —
  ```ts
  const missingEvidence = check.issues.filter((i) => i.id === "missing-required-evidence");
  const isEvidenceDone = missingEvidence.length === 0;
  ```
  `detail` lấy từ `message`/`suggestion` của chính issue (đã có "Missing kind: …") thay vì map `kindMeta` lại. Gỡ import `getTemplate` (`@/modules/write`) và `kindMeta` nếu không còn dùng nơi khác trong file. Bỏ tham số/đường tính `requiredKinds`/`providedKinds`/`missingKinds`. Giữ nguyên 4 mục còn lại (`readiness-score` đọc `check.readinessScore`, `no-error-issues` đọc `check.issues`, `docx-layout` đọc `docxLayout`, `exported-targets` đọc `exportedTargets`).
- **#1 (guard false-pass khi chưa kiểm tra).** `src/modules/export/SubmissionPanel.tsx` (MODIFY): hiện panel fallback `emptyCheck` (`issues: [], readinessScore: 0` — [SubmissionPanel.tsx:41-48](src/modules/export/SubmissionPanel.tsx)). Sau fix #1, `issues:[]` ⇒ mục evidence **false-pass** khi checker **chưa chạy**. Khi `check` là `undefined`: hiển thị một dòng trạng thái "Hãy chạy Kiểm tra (Checker) trước khi đối chiếu checklist" thay cho checklist suy từ `emptyCheck` (hoặc render các mục engine-derived ở trạng thái `done:false` với detail "chưa chạy kiểm tra"). Chọn **một** hướng, ghi rõ.
- **#2** `src/modules/export/SubmissionPanel.tsx` (MODIFY): chặn xuất zip thiếu tài liệu —
  - Tính `hasSessionBlobs = Object.keys(exportedBlobs).length > 0`.
  - Khi `!hasSessionBlobs`: `disabled` nút "Tải evidence.zip" **hoặc** hiển thị cảnh báo inline "Bộ nộp sẽ **không** kèm file báo cáo (report.html/pdf/docx) vì bạn chưa export trong phiên này — hãy export lại trước khi đóng gói." (CSS chỉ `var(--rs-*)`).
  - Không đổi nguồn của mục checklist `exported-targets` (giữ đọc history theo w8c — bản ghi cross-session là chủ ý), chỉ tách bạch "đã từng export" (history) với "blob sẵn sàng đóng gói phiên này" (in-session).
- **Regression tests**:
  - `src/modules/export/submission-checklist.test.ts` (MODIFY): thay ca "thiếu evidence kind" sang **bơm `check.issues` chứa `{ id: "missing-required-evidence", severity: "error", ... }`** → mục `required-evidence` `done:false`; không có issue đó → `done:true`. Khẳng định **không** còn import/gọi `getTemplate` (đọc engine, không re-check).
  - `src/modules/export/SubmissionPanel.test.tsx` (MODIFY): `exportedBlobs = {}` → nút disabled/cảnh báo hiện; có ≥1 blob → cho phép tải. (Nếu khó test click-download, assert trạng thái disabled/aria + text cảnh báo.)

### Out of scope
- ❌ Persist `Blob` export vào IndexedDB để zip sống qua reload (cải tiến lớn — đưa lên W12 nếu cần; contract này chỉ chống xuất zip thiếu im lặng).
- ❌ Đổi shape `SubmissionChecklistItem`/`CheckResult`/`PackageManifest` (canonical §8).
- ❌ Viết lại rule `missing-required-evidence`/readiness/DOCX-layout (W3/W5/W7 — chỉ đọc kết quả).
- ❌ Thống nhất `getTemplate` vs `getTemplateSchema` ở tầng module write/check (→ contract polish nếu muốn dọn nguồn template).
- ❌ Dep mới / network / upload.

## 3. Checklist
- [ ] `submission-checklist.ts`: mục `required-evidence` đọc `check.issues` (`missing-required-evidence`); **0** lần gọi `getTemplate`/diff kind trong file.
- [ ] `SubmissionPanel`: `check === undefined` → không false-pass evidence (prompt chạy Checker hoặc đánh dấu chưa kiểm tra).
- [ ] `SubmissionPanel`: `exportedBlobs` rỗng → nút tải disabled **hoặc** cảnh báo "zip sẽ thiếu report.*"; có blob → tải bình thường.
- [ ] Mục checklist `exported-targets` vẫn đọc history (w8c) — không đổi nguồn.
- [ ] Test phủ: evidence từ issue (không re-check) + zip-guard khi rỗng blob.
- [ ] ≤200 dòng/file; 4 gates xanh (lint/typecheck/test/build), lưu `build_output.txt` thật.

## 4. Expected Interfaces / Files

> Không đổi public API. `buildSubmissionChecklist`/`buildSubmissionZip`/`SubmissionPanel` giữ nguyên signature (chỉ đổi logic nội bộ + render guard).

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/submission-checklist.ts` | MODIFY | ~−12 (đọc issue, bỏ re-derive) |
| `src/modules/export/SubmissionPanel.tsx` | MODIFY | ~+12 (guard check + blob) |
| `src/modules/export/submission-checklist.test.ts` | MODIFY | ~±15 (evidence từ issue) |
| `src/modules/export/SubmissionPanel.test.tsx` | MODIFY | ~+15 (zip-guard) |
| `Design/Reports/Month2/W8/build_output.txt` | MODIFY | output 4 gates thật |

> **Import boundary:** checklist import `@/types` + kết quả `@/modules/check` (qua `CheckResult` truyền vào); panel import `@/modules/export`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Đọc `check.issues` → false-pass khi checker chưa chạy | TB | Guard `check === undefined` ở panel (prompt/đánh dấu chưa kiểm tra); test ca không có check. |
| `detail` evidence kém actionable sau khi bỏ `kindMeta` | Thấp | Lấy `message`+`suggestion` của issue (đã chứa kind thiếu); test detail không rỗng. |
| Disable nút làm user tưởng panel hỏng | Thấp | Kèm text cảnh báo rõ lý do + cách khắc phục (export lại); không disable câm. |
| Mục `no-error-issues` và `required-evidence` vẫn trùng tín hiệu | Thấp | Chấp nhận: hai mục **đọc cùng nguồn** issue (đúng Locked #4); `required-evidence` chỉ lọc đúng `id` để actionable riêng, không tính lại. |

## 6. Verification Plan
- `check.issues` có `missing-required-evidence` → mục `required-evidence` `done:false` + detail nêu kind thiếu; bỏ issue đó → `done:true`. grep `getTemplate` trong `submission-checklist.ts` → rỗng.
- `check` không truyền (undefined) → checklist **không** báo evidence done:true; có prompt chạy Checker.
- Export 1 HTML trong phiên → bấm tải → zip có `report.html`; reload (history còn, blob rỗng) → nút disabled/cảnh báo, **không** xuất zip thiếu im lặng.
- `npm run lint/typecheck/test/build` (thật) xanh; dán output vào `build_output.txt`.

## 7. Status

`DONE`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `fix(export): submission checklist reads missing-required-evidence from engine (Locked #4)`; (2) `fix(export): guard evidence.zip against missing report.* after reload`; (3) `docs(w8): real build_output after submission fidelity fixes`.
