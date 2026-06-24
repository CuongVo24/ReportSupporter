# Contract For AI - W7 Group B: List of Figures / List of Tables

> **Lane / Week:** Core / Month 2 / W7 - Day 2 (`Design/TaskBrief/Core/month2/w7.md` `[C78]`-`[C79]`).
> **Branch:** `feature/W7-format-hardening`.
> **Builds on:** Group A (`buildCaptionRegistry` → `CaptionEntry[]`), W3 `generate-toc.ts`, W1 `FormatSettings.includeListOfFigures/includeListOfTables` (`src/types/format.ts`) — **already shipped**, `src/components/PreviewPane.tsx`.
> **Depended on by:** W4 export (LoF/LoT trong file xuất), Group E (DOCX layout), W8 submission package.
> **Sources:** `w7.md` Locked Decisions #1/#3, `week7.md` Day 2, `2.Format.md`, `4.Export.md §6`.

---

## 1. Micro-task Target

Sinh **List of Figures (LoF)** + **List of Tables (LoT)** từ caption registry (Group A), đặt **ngay sau TOC**, gate bằng setting đã có. Một artifact → preview = export.

> **🔒 Một nguồn số (Locked #1).** LoF/LoT đọc cùng `CaptionEntry[]` của Group A — không tự đánh số.
> **🔒 Setting đã có (Locked #3).** `includeListOfFigures`/`includeListOfTables` đã ở `FormatSettings` (W3). Group B chỉ *implement generator tiêu thụ flag* — không thêm setting shape.
> **📌 Preview path thực tế.** Render trong `src/components/PreviewPane.tsx` (không phải `PreviewPanel.tsx`); LoF/LoT đặt sau khối TOC.

## 2. Scope

### In scope (`[C78]`/`[C79]`)
- `src/modules/format/generate-lof-lot.ts` (NEW): `generateListOfFigures(registry: CaptionEntry[]): TocNode[] | LofEntry[]` + `generateListOfTables(...)` — entries có số + label + text + anchor, theo thứ tự xuất hiện; gate bằng `includeListOfFigures`/`includeListOfTables`.
- `src/modules/format/generate-toc.ts` (MODIFY) hoặc caller: chèn LoF/LoT **ngay sau** TOC khi flag bật.
- `src/components/PreviewPane.tsx` (MODIFY): render LoF/LoT sau TOC (đọc registry + settings).
- `src/modules/format/index.ts` (MODIFY): export generator.
- Vitest: `generate-lof-lot.test.ts` — registry n figure/m table → đúng số entry; flag tắt → rỗng; thứ tự theo xuất hiện; số khớp `CaptionEntry.number` (không re-number).

### Out of scope
- ❌ Đánh số caption (Group A — chỉ tiêu thụ registry).
- ❌ References rule (Group C).
- ❌ PDF page-break (Group D).
- ❌ Nhúng vào DOCX (Group E — chỉ preview/HTML đường chung tuần này).
- ❌ Thêm setting shape mới (canonical).
- ❌ Dep mới.

## 3. Checklist
- [ ] `generate-lof-lot.ts`: LoF + LoT từ registry, gate bằng setting; thứ tự theo xuất hiện.
- [ ] LoF/LoT đặt ngay sau TOC; flag tắt → không sinh.
- [ ] Số entry khớp `CaptionEntry.number` (không tự đánh số).
- [ ] PreviewPane render LoF/LoT; CSS chỉ `var(--rs-*)`.
- [ ] `generate-lof-lot.test.ts` phủ n-entry/flag-off/thứ tự/số khớp.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/format/generate-lof-lot.ts
import type { CaptionEntry } from "@/types";
export function generateListOfFigures(registry: CaptionEntry[]): CaptionEntry[];
export function generateListOfTables(registry: CaptionEntry[]): CaptionEntry[];
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/format/generate-lof-lot.ts` | NEW | ~60 |
| `src/modules/format/generate-toc.ts` (hoặc caller) | MODIFY | ~+10 (chèn sau TOC) |
| `src/components/PreviewPane.tsx` | MODIFY | ~+15 (render LoF/LoT) |
| `src/modules/format/index.ts` | MODIFY | ~+2 (export) |
| `src/modules/format/generate-lof-lot.test.ts` | NEW | ~60 |

> **Import boundary:** generator import `@/types` + registry Group A. PreviewPane import `@/modules/format`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Số LoF/LoT lệch body | High | Đọc cùng `CaptionEntry[]` (Group A); không re-number (Locked #1). |
| LoF/LoT sinh khi flag tắt | Low | Gate `includeListOfFigures`/`includeListOfTables`; test flag-off. |
| Đặt sai vị trí (không sau TOC) | Medium | Chèn ngay sau khối TOC trong generate-toc/caller; verify preview. |
| Thêm setting mới (drift) | Low | Dùng flag có sẵn (Locked #3). |

## 6. Verification Plan
- registry 3 figure + 2 table → LoF 3 entry, LoT 2 entry, số khớp.
- `includeListOfFigures:false` → LoF rỗng/không render.
- Preview: LoF/LoT hiển thị ngay sau TOC, đúng thứ tự.
- lint/typecheck/test/build xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(format): list of figures + list of tables generator`; (2) `feat(preview): render LoF/LoT after TOC`; +1 docs commit.
