# Contract For AI - W7 Group A: Caption Normalization & Registry

> **Lane / Week:** Core / Month 2 / W7 - Day 1 (`Design/TaskBrief/Core/month2/w7.md` `[C76]`-`[C77]`).
> **Branch:** `feature/W7-format-hardening`.
> **Builds on:** W3 `number-headings.ts`/`generate-toc.ts` (chapter index), W1 canonical `CaptionEntry` (`src/types/format.ts`) + `FormatSettings.captionNumbering` — **already shipped**.
> **Depended on by:** Group B (LoF/LoT đọc registry), Group E (DOCX checklist verify numbering), W4 export (caption parity).
> **Sources:** `w7.md` Locked Decisions #1/#2, `week7.md` Day 1, `2.Format.md`, `4.Export.md §6` (numbering parity), `CanonicalTypes.md §3`.

---

## 1. Micro-task Target

Tạo **chuẩn hoá caption** "Figure X.Y" / "Table X.Y" (mới trong Format) và một **caption registry** duy nhất làm nguồn số cho body + LoF/LoT + cross-ref. **Xác nhận** type `CaptionEntry` đã có (W1) — **không khai báo lại**.

> **🔒 Một nguồn số (Locked #1).** Body caption, LoF/LoT, và 3 export đều đọc cùng registry. Không exporter/generator nào tự đánh số lại.
> **🔒 Caption normalization là NEW Format logic (Locked #2).** Format hiện chỉ có `number-headings`/`generate-toc`/`parse-headings` — **chưa có** `captions.ts`. Code caption duy nhất là check rule `check/rules/captions.ts` (chỉ cảnh báo thiếu alt/caption, **không** đánh số) → giữ nguyên vai trò check, không gộp.
> **🔒 Reuse `CaptionEntry` (Locked #5).** `CaptionEntry` (`{id,kind,number,label,text,sectionId}`) đã ở `src/types/format.ts`. Đổi shape ⇒ sửa `CanonicalTypes.md` trước.

## 2. Scope

### In scope (`[C76]`/`[C77]`)
- `src/modules/format/captions.ts` (**NEW**): đánh số caption deterministic theo `formatSettings.captionNumbering` (`"continuous"` vs `"per-chapter"`), dùng chapter index từ `number-headings.ts`; sinh `label` "Hình X.Y"/"Bảng X.Y" (VI). **Không** re-number heading.
- `src/modules/format/caption-registry.ts` (**NEW**): `buildCaptionRegistry(...)` → danh sách `CaptionEntry[]` (figures + tables) làm nguồn duy nhất cho body/LoF/LoT/cross-ref; deterministic.
- `src/modules/format/index.ts` (MODIFY): export caption normalizer + `buildCaptionRegistry` (+ kiểu nếu cần).
- (Reconciliation, no code) Xác nhận `CaptionEntry`/`FormatSettings.captionNumbering` khớp `CanonicalTypes §3`; lệch ⇒ sửa `CanonicalTypes.md` trước.
- Vitest: `captions.test.ts` — continuous vs per-chapter ra số đúng; figure/table đánh số độc lập; registry deterministic (cùng input → cùng output); label VI đúng.

### Out of scope
- ❌ Sinh LoF/LoT (Group B — chỉ tạo registry để B dùng).
- ❌ References rule (Group C).
- ❌ PDF page-break (Group D).
- ❌ Gộp/đổi check rule `captions.ts` (giữ vai trò cảnh báo).
- ❌ Đổi shape `CaptionEntry`/`FormatSettings` (canonical).
- ❌ Dep mới.

## 3. Checklist
- [ ] `captions.ts`: số caption đúng cho continuous + per-chapter; label VI; không re-number heading.
- [ ] `caption-registry.ts`: trả `CaptionEntry[]` deterministic, một nguồn duy nhất.
- [ ] Không tái khai báo `CaptionEntry` (import từ `@/types`).
- [ ] Export qua `format/index.ts`.
- [ ] `captions.test.ts` phủ continuous/per-chapter/figure-table/deterministic.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/format/caption-registry.ts
import type { CaptionEntry } from "@/types";
export function buildCaptionRegistry(/* mdast/sections + settings */): CaptionEntry[];

// src/modules/format/captions.ts
export function normalizeCaptions(/* ... */): /* numbered captions / mutated AST */;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/format/captions.ts` | NEW | ~90 |
| `src/modules/format/caption-registry.ts` | NEW | ~70 |
| `src/modules/format/index.ts` | MODIFY | ~+3 (export) |
| `src/modules/format/captions.test.ts` | NEW | ~80 |

> **Import boundary:** caption modules import `@/types` + format helpers nội bộ. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Số caption lệch giữa body và LoF/LoT | High | Một registry `CaptionEntry[]` là nguồn duy nhất (Locked #1). |
| Re-number heading khi đánh caption | Medium | Caption chỉ đọc chapter index từ `number-headings`; không gọi numbering heading lại. |
| Tái khai báo `CaptionEntry` (drift) | Low | Import từ `@/types`; Day-1 type là no-op verify. |
| continuous vs per-chapter sai biên | Medium | Test cả hai chế độ; reset số theo chương khi per-chapter. |
| Gộp nhầm với check rule captions | Low | Giữ `check/rules/captions.ts` nguyên vai trò cảnh báo (Locked #2). |

## 6. Verification Plan
- per-chapter: caption chương 2 bắt đầu lại "Hình 2.1"; continuous: "Hình 5" xuyên suốt.
- figure và table đánh số độc lập.
- `buildCaptionRegistry` gọi 2 lần cùng input → giống hệt.
- label tiếng Việt ("Hình"/"Bảng") đúng.
- lint/typecheck/test/build xanh.

## 7. Status

`DONE`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(format): caption normalization + single caption registry`; +1 docs commit.
