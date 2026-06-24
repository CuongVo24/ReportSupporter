# Contract For AI - W8 Group C: Final Submission Checklist

> **Lane / Week:** Core / Month 2 / W8 - Day 3 (`Design/TaskBrief/Core/month2/w8.md` `[C90]`-`[C91]`).
> **Branch:** `feature/W8-submission-package`.
> **Builds on:** W3 Checker readiness (`src/modules/check/readiness-score.ts`, `run-checker.ts`, `CheckResult`), W5 `evidence-gaps.ts`/`missing-required-evidence`, W7 `verifyDocxLayout` (`docx-layout-checklist.ts`), W1 `ReportProjectBundle`.
> **Depended on by:** Group A (gate trước khi đóng gói), Group E (panel + QA).
> **Sources:** `w8.md` Locked Decisions #1/#4, `MasterRoadMap.md` W8 ("Add final submission checklist"), `3.Check.md §5`, `5.Present.md §4` (submission checklist surface).

---

## 1. Micro-task Target

Tổng hợp **final submission checklist**: một danh sách mục pass/fail "đã sẵn sàng nộp chưa" lấy **từ kết quả các engine đã có** — readiness score (W3), evidence gaps (W5), DOCX layout (W7), và đã export chưa (Group D history). Lớp này **đối chiếu**, không tự kiểm tra lại từ đầu.

> **🔒 Aggregate, không re-check (Locked #4).** Checklist đọc `CheckResult`/issues (W3+W5) + `DocxLayoutCheck[]` (W7) + lịch sử export (Group D); không viết lại checker rule hay parser.
> **🔒 Một nguồn (Locked #1).** Readiness/evidence/issue lấy từ engine gốc; checklist chỉ map thành câu hỏi nộp bài có `done` + `detail`.

## 2. Scope

### In scope (`[C90]`/`[C91]`)
- `src/types/export.ts` (MODIFY) + `CanonicalTypes.md §8` (MODIFY): thêm `SubmissionChecklistItem` (`{ id, label, done, detail, severity? }`). Không đổi `CheckResult`/`ReportIssue`.
- `src/modules/export/submission-checklist.ts` (**NEW**): `buildSubmissionChecklist(input): SubmissionChecklistItem[]` — mục mẫu: readiness ≥ ngưỡng (đọc `CheckResult.readinessScore`), không còn issue `error`, đủ `requiredEvidenceKinds` (không `missing-required-evidence`), DOCX layout pass (`verifyDocxLayout` không fail), đã export ≥1 target (history Group D). Mỗi mục có `detail` mô tả nguồn.
- `src/modules/export/index.ts` (MODIFY): export hàm + type.
- Vitest: `submission-checklist.test.ts` — readiness thấp → mục readiness `done:false`; còn `error` issue → mục `done:false`; thiếu evidence kind → fail; DOCX fail → fail; tất cả pass → mọi mục `done:true`; deterministic.

### Out of scope
- ❌ Viết lại checker rule / readiness (W3/W5 — chỉ đọc).
- ❌ Viết lại DOCX layout verify (W7 — chỉ tiêu thụ kết quả).
- ❌ Zip / README / history (Groups A/B/D).
- ❌ Dep mới / fetch.

## 3. Checklist
- [ ] `SubmissionChecklistItem` thêm CanonicalTypes §8 + `@/types`.
- [ ] `buildSubmissionChecklist`: readiness/error-free/evidence/docx-layout/exported, mỗi mục có `detail`.
- [ ] Chỉ đọc kết quả engine (W3/W5/W7) — không re-check.
- [ ] Deterministic (cùng input → cùng checklist).
- [ ] `submission-checklist.test.ts` phủ từng mục fail + all-pass.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/types/export.ts  (+ CanonicalTypes §8)
export type SubmissionChecklistItem = {
  id: string; label: string; done: boolean; detail: string;
  severity?: ReportIssueSeverity;
};

// src/modules/export/submission-checklist.ts
export function buildSubmissionChecklist(input: {
  check: CheckResult;
  docxLayout: DocxLayoutCheck[];
  exportedTargets: ExportTarget[];
  bundle: ReportProjectBundle;
  readinessThreshold?: number;
}): SubmissionChecklistItem[];
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/types/export.ts` | MODIFY | ~+8 |
| `Design/Modules/Other/CanonicalTypes.md` | MODIFY | ~+8 (§8) |
| `src/modules/export/submission-checklist.ts` | NEW | ~120 |
| `src/modules/export/index.ts` | MODIFY | ~+2 |
| `src/modules/export/submission-checklist.test.ts` | NEW | ~90 |

> **Import boundary:** import `@/types` + kết quả từ `@/modules/check`/`@/modules/export`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Re-implement checker/readiness (drift) | High | Chỉ đọc `CheckResult`/`DocxLayoutCheck[]`; không gọi rule lại (Locked #4). |
| Ngưỡng readiness hardcode lệch product | Medium | `readinessThreshold` là tham số (mặc định tài liệu hoá); test cả hai phía ngưỡng. |
| Mục checklist mơ hồ (không actionable) | Low | Mỗi mục có `detail` chỉ rõ nguồn/cách sửa. |
| Re-declare type (drift) | Low | Thêm CanonicalTypes §8 trước; import `@/types`. |

## 6. Verification Plan
- readiness 40 (<ngưỡng) → mục "Đủ điểm sẵn sàng" `done:false` với detail điểm.
- còn 1 issue `error` → mục "Không còn lỗi nghiêm trọng" fail.
- template yêu cầu `github` nhưng thiếu → mục evidence fail.
- `verifyDocxLayout` có fail → mục layout fail.
- mọi engine pass + đã export 1 target → tất cả `done:true`.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(export): final submission checklist aggregating readiness/evidence/docx/export`; +1 docs commit.
