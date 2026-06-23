# Contract For AI - W2 Group E: Autosave, Image Insert & QA

> **Lane / Week:** Core / Month 1 / W2 - Day 5 (`Design/TaskBrief/Core/month1/w2.md` `[C27]`-`[C29]`).
> **Branch:** `feature/W2-markdown-editor`.
> **Builds on:** W1 autosave (`src/modules/write/autosave.ts`: `createThrottledSaver`/`loadBundle`/`saveBundle`), `Workspace.tsx` autosave wiring, `ReportAsset` (CanonicalTypes §1), Group B editor (insert point).
> **Sources:** `w2.md` Locked Decision #5, `week2.md` Day 5 + Definition of Done, `Design/Modules/Other/OptimizePerformance.md` §5, `Coding & Git Standard.md` §6c.

---

## 1. Micro-task Target

Nâng autosave PoC W1 lên **autosave thật** (debounced save + load-on-mount, validate qua `storedBundleSchema.parse()`) và thêm **chèn ảnh cơ bản** (drag-drop / paste → `ReportAsset` reference trong Markdown, lưu local, giới hạn kích thước). Chốt W2 bằng QA evidence.

## 2. Scope

### In scope (`[C27]`/`[C28]`/`[C29]`)
- `[C27]` `src/modules/write/use-draft-autosave.ts`: hook gói `createThrottledSaver` + `loadBundle`/`saveBundle` W1 thành autosave thật (debounced, load on mount, flush on hide). Tách logic khỏi `Workspace.tsx` để Workspace gọn lại.
- `[C28]` `src/modules/write/use-image-insert.ts`: drag-drop / clipboard paste → tạo `ReportAsset` (kind `"image"`, base64 data URL), chèn reference `![alt](asset:<id>)` vào Markdown. Giới hạn kích thước (vd ≤ N MB) → quá thì báo lỗi recoverable, không cloud.
- `[C29]` Chạy lint/typecheck/test/build; tạo `Design/Reports/Month1/W2/W2_QA_Report.md` + `build_output.txt`.
- Vitest: image-insert thuần (sinh asset + chèn đúng reference, reject oversize); autosave hook phần thuần (reuse W1 throttle test pattern).

### Out of scope
- ❌ Cloud asset storage (Non-goal).
- ❌ Image resize/crop/optimize nâng cao (sau).
- ❌ Real export PDF/DOCX (W4).
- ❌ Asset manager UI đầy đủ (sau).

## 3. Checklist
- [ ] `use-draft-autosave.ts` hook ≤200 dòng, reuse W1 autosave (không nhân bản throttle).
- [ ] `use-image-insert.ts`: paste/drop → `ReportAsset` + reference; size guard; no cloud.
- [ ] Test thuần cho image-insert (asset shape, reference, oversize reject).
- [ ] `Workspace.tsx` dùng hook autosave + image insert; vẫn ≤200 dòng.
- [ ] Public exports qua `modules/write/index.ts`.
- [ ] 4 gates xanh; lưu `build_output.txt`.
- [ ] `W2_QA_Report.md`: branch + commit, gates, manual checks (editor/preview/skeleton/autosave/image), known limitations + W3/W4 handoff.

## 4. Expected Interfaces / Files

```ts
// src/modules/write/use-draft-autosave.ts
export function useDraftAutosave(bundle: ReportProjectBundle | null):
  { status: "idle" | "saving" | "saved"; quotaFull: boolean };

// src/modules/write/use-image-insert.ts
export function createImageAsset(file: File, maxBytes: number):
  Promise<{ ok: true; asset: ReportAsset; ref: string } | { ok: false; error: string }>;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/write/use-draft-autosave.ts` | NEW | ~70 |
| `src/modules/write/use-image-insert.ts` | NEW | ~80 |
| `src/modules/write/use-image-insert.test.ts` | NEW | ~50 |
| `src/modules/write/index.ts` | MODIFY | +exports |
| `src/components/Workspace.tsx` | MODIFY | use hooks |
| `Design/Reports/Month1/W2/W2_QA_Report.md` | NEW | ~80 |
| `Design/Reports/Month1/W2/build_output.txt` | NEW | generated |

> **Import boundary:** write module imports `@/types` + W1 write internals. Image insert is local-only: base64 in `ReportAsset.data`, no `fetch`, no cloud.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Ảnh paste phình IndexedDB | Medium | Lưu reference + size guard (`maxBytes`); reject oversize với lỗi recoverable. |
| Autosave logic nhân bản W1 | Medium | Hook wrap `createThrottledSaver`/`loadBundle`/`saveBundle` W1, không viết lại. |
| `Workspace.tsx` vượt 200 dòng | Medium | Đẩy autosave + image vào hook; Workspace chỉ orchestrate. |
| QA report mơ hồ | Medium | Ghi commit hash, lệnh, pass/fail, đường dẫn build, manual checks cụ thể. |
| Draft mất khi load shape sai | Medium | `storedBundleSchema.safeParse`; sai → fallback bootstrap (như W1). |

## 6. Verification Plan
- Sửa nội dung → reload trang → draft sống (thủ công).
- Paste/drop ảnh nhỏ → reference `![](asset:...)` xuất hiện + asset trong bundle (thủ công + unit).
- Ảnh quá lớn → reject, báo lỗi, không crash (unit).
- `npm run build` xanh → lưu `build_output.txt`.
- lint/typecheck/test/build xanh; `W2_QA_Report.md` đầy đủ.

## 7. Status

`WAITING_FOR_APPROVAL`

> Chốt W2. Đề xuất 3 commit: (1) autosave hook + image-insert + test; (2) QA evidence (`build_output.txt` + `W2_QA_Report.md`); (3) cập nhật status các contract W2 → DONE. Sau khi gates xanh: merge `feature/W2-markdown-editor` → `develop` → `main`.
