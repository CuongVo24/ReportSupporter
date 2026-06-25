# Contract For AI — W8 Break: Harden Export-History Pruning (Atomic) & Submission Panel A11y/Type Hygiene

> **Lane:** Core / break_task / week8_break.
> **Branch:** `feature/W8-submission-package` (hoặc `polish/w8-history-a11y`).
> **Type:** Maintainability / robustness — review findings **#4**, **#5**, **#6** (W8 code review).
> **Builds on:** Group D (`export-history.ts`, `idb-client.ts`), Group A (`build-submission-zip.ts`), Group E (`SubmissionPanel.tsx`).
> **Sources:** W8 code review (session 2026-06-25), `Design/ContractForAI/Core/month2/W8/w8a_*`, `w8d_*`, `w8e_*`, `Design/Modules/Other/TechnicalStack.md §8b` (Storage = IndexedDB qua `idb`), `OptimizePerformance.md`.

---

## 1. Micro-task Target

Dọn ba điểm nợ **không chặn merge** của W8: prune history hiện chạy read-modify-write **rời rạc** (không trong một transaction → có thể race / nửa vời), icon checklist thiếu ngữ nghĩa cho screen reader, và input của `buildSubmissionZip` nới kiểu lệch contract. Mục tiêu: history bền hơn dưới truy cập đồng thời, panel tiếp cận được, và type khớp w8a — vẫn giữ local-first, không dep mới.

- **#4 Prune history không atomic.** [export-history.ts:21-63](src/modules/export/export-history.ts) `recordExport`: `appendExportHistory(job)` → `getExportHistory()` → nhiều `deleteExportHistory(id)` rời, mỗi lời gọi mở **một** op IDB riêng ([idb-client.ts:44-59](src/lib/idb-client.ts)). Hai export gần nhau (hoặc export + clear) xen kẽ giữa các bước → đọc danh sách cũ, xóa nhầm, hoặc vượt cap tạm thời. n≤50 nên hậu quả nhẹ, nhưng read-modify-write nhiều bước ngoài transaction là mầm lỗi.
- **#5 Icon checklist thiếu ngữ nghĩa a11y.** [SubmissionPanel.tsx:116-123](src/modules/export/SubmissionPanel.tsx) hai `<svg>` done/fail không có `aria-hidden`/`role`/nhãn; trạng thái pass-fail truyền tải bằng **màu + icon** trang trí. Text `label`/`detail` có mang nghĩa nên không phải lỗi nặng, nhưng screen reader đọc icon rỗng và không phát "đạt/chưa đạt" tường minh.
- **#6 `buildSubmissionZip` nới kiểu lệch contract.** [build-submission-zip.ts:14-15](src/modules/export/build-submission-zip.ts) khai `readmeMarkdown?: string | null` / `evidenceAppendixMarkdown?: string | null`, trong khi w8a §4 quy định `readmeMarkdown: string` + `evidenceAppendixMarkdown: string` (bắt buộc). Lenient hơn nên không vỡ, nhưng lệch interface đã chốt và `CanonicalTypes §8`.

> 🔒 **Local-first, một store (Locked #2 + #1).** Vẫn chỉ IndexedDB qua `idb`, store `export-history`; #4 gộp thao tác vào **một** transaction `readwrite`, không thêm DB/lib.
> 🔒 **Không đổi shape canonical / public API.** `ExportJob`/`SubmissionPackage`/`PackageManifest` giữ nguyên; #6 chỉ siết kiểu **tham số đầu vào** của `buildSubmissionZip` về đúng contract, không đổi kiểu trả về.

## 2. Scope

### In scope
- **#4** `src/lib/idb-client.ts` (MODIFY): thêm một hàm prune-trong-transaction, ví dụ
  ```ts
  export async function pruneExportHistory(keepIds: string[]): Promise<void>;
  // mở 1 tx 'export-history' 'readwrite', getAllKeys, delete những key không thuộc keepIds, await tx.done
  ```
  hoặc `replaceExportHistory(records: unknown[])` (clear + put trong cùng tx). Giữ `appendExportHistory`/`getExportHistory`/`clearExportHistory` cho tương thích.
  `src/modules/export/export-history.ts` (MODIFY): `recordExport` đọc → parse (zod) → sort → cắt còn 50 → gọi **một** `pruneExportHistory(keepIds)`/`replaceExportHistory(valid50)` thay vòng `for ... deleteExportHistory` rời. Việc loại bản ghi hỏng (zod fail) gộp luôn vào tx này. Vẫn best-effort: bọc `try/catch`, nuốt lỗi IDB (không vỡ luồng export — w8d Locked).
- **#5** `src/modules/export/SubmissionPanel.tsx` (MODIFY): icon trang trí thêm `aria-hidden="true"`; gắn ngữ nghĩa trạng thái cho mỗi mục — `role="listitem"` sẵn có qua `<li>`, thêm nhãn trạng thái cho SR, ví dụ một `<span className="ws-visually-hidden">` chứa "Đạt"/"Chưa đạt — lỗi"/"Chưa đạt — cảnh báo" theo `item.done`/`item.severity`, **hoặc** `aria-label` trên `<li>` tổng hợp `label + trạng thái`. CSS `ws-visually-hidden` chỉ dùng `var(--rs-*)` (nếu cần biến). Không đổi layout hiển thị.
- **#6** `src/modules/export/build-submission-zip.ts` (MODIFY): đưa input về đúng w8a — `readmeMarkdown: string` + `evidenceAppendixMarkdown: string` (bỏ `?`/`| null`). Caller [SubmissionPanel.tsx:69-77](src/modules/export/SubmissionPanel.tsx) đã luôn truyền string (`generateReadme`/`buildEvidenceAppendix` trả string) nên không đổi call-site; nếu cần "vắng mặt", truyền `""` và builder bỏ entry khi rỗng (`if (input.readmeMarkdown)`), thay cho `!= null`. Cập nhật nhánh thêm entry tương ứng.
- **Tests**:
  - `src/modules/export/export-history.test.ts` (MODIFY): mock idb cho `prune/replace`; ca **61 bản ghi → cap 50, mới nhất đầu**, bản ghi hỏng bị loại — verify chỉ **một** lượt ghi prune (không N lời `delete`). round-trip append→load vẫn xanh.
  - `src/modules/export/SubmissionPanel.test.tsx` (MODIFY): assert icon `aria-hidden`; mục fail có nhãn SR "Chưa đạt" (query theo text ẩn hoặc `aria-label`).
  - `src/modules/export/build-submission-zip.test.ts` (MODIFY): cập nhật ca "thiếu README/appendix" sang truyền `""` → builder bỏ entry, không throw; manifest đúng.

### Out of scope
- ❌ Persist Blob export qua reload (→ contract fix / W12).
- ❌ Đổi shape `ExportJob`/`SubmissionPackage`/`PackageManifest`/`SubmissionChecklistItem` (canonical §8).
- ❌ Thống nhất nguồn template `getTemplate` vs `getTemplateSchema` (→ tách riêng nếu muốn).
- ❌ Đổi nguồn dữ liệu checklist evidence (→ contract `w8_fix_checklist_evidence_source_and_zip_blobs_contract.md`).
- ❌ Dep mới / network / bump `DB_VERSION` (store `export-history` đã có ở v2).

## 3. Checklist
- [ ] `recordExport`: prune + loại bản ghi hỏng trong **một** transaction; vẫn best-effort (nuốt lỗi IDB).
- [ ] `export-history`: cap 50, mới→cũ giữ nguyên hành vi; không còn vòng `delete` rời nhiều op.
- [ ] `SubmissionPanel`: icon `aria-hidden`; mỗi mục checklist có nhãn trạng thái cho screen reader.
- [ ] `buildSubmissionZip` input `readmeMarkdown`/`evidenceAppendixMarkdown` = `string` (khớp w8a); call-site không vỡ.
- [ ] Test phủ: cap/loại-hỏng một-lượt-ghi + a11y nhãn + zip entry khi string rỗng.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

> Public API module export giữ nguyên (`recordExport`/`loadExportHistory`/`clearExportHistory`/`buildSubmissionZip`/`SubmissionPanel`). Chỉ thêm helper nội bộ trong `idb-client` + siết kiểu input.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/lib/idb-client.ts` | MODIFY | ~+12 (prune/replace trong tx) |
| `src/modules/export/export-history.ts` | MODIFY | ~±10 (gọi prune 1 lượt) |
| `src/modules/export/build-submission-zip.ts` | MODIFY | ~±4 (siết kiểu input) |
| `src/modules/export/SubmissionPanel.tsx` | MODIFY | ~+8 (aria + nhãn SR) |
| `src/app/globals.css` | MODIFY (tùy chọn) | ~+6 (`ws-visually-hidden`) |
| `src/modules/export/export-history.test.ts` | MODIFY | ~±15 |
| `src/modules/export/SubmissionPanel.test.tsx` | MODIFY | ~+10 |
| `src/modules/export/build-submission-zip.test.ts` | MODIFY | ~±6 |

> **Import boundary:** history import `@/types` + `idb` wrapper; panel import `@/modules/export`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Gộp clear+put trong tx làm rơi bản ghi nếu lỗi giữa chừng | TB | Dùng `tx.done` await; lỗi → rollback (IDB tx abort tự nhiên); best-effort catch ở `recordExport`. |
| `replaceExportHistory` ghi đè mất bản ghi vừa append song song | TB | `recordExport` đọc snapshot **trong cùng tx** rồi prune; tránh đọc ngoài tx (nguyên nhân #4). |
| Nhãn SR đọc thừa/ồn | Thấp | Một nhãn trạng thái/mục; icon `aria-hidden`; test query nhãn đúng số lần. |
| Siết kiểu input làm vỡ call-site khác | Thấp | grep caller `buildSubmissionZip` (chỉ `SubmissionPanel`); đều truyền string; test rỗng→`""`. |

## 6. Verification Plan
- 61 lần `recordExport` (mock idb) → store còn 50, mới nhất đầu; bản ghi hỏng bị loại; prune chạy **một** transaction (assert số lần mở tx/ghi).
- Screen-reader pass: icon `aria-hidden`; mục fail phát "Chưa đạt" (text ẩn / `aria-label`).
- `buildSubmissionZip` với `readmeMarkdown:""` → zip không có `README.md`, không throw; manifest khớp.
- `drafts` vẫn đọc/ghi bình thường (không đụng store khác).
- lint/typecheck/test/build xanh; `build_output.txt` thật.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `fix(storage): prune export history in a single idb transaction`; (2) `a11y(export): label submission checklist state for screen readers`; (3) `refactor(export): tighten buildSubmissionZip input types to contract`.
