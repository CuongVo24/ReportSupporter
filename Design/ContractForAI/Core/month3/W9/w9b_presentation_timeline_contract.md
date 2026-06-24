# Contract For AI - W9 Group B: Presentation Timeline

> **Lane / Week:** Core / Month 3 / W9 - Day 2 (`Design/TaskBrief/Core/month3/w9.md` `[C98]`-`[C99]`).
> **Branch:** `feature/W9-slide-outline`.
> **Builds on:** Group A (`SlideOutline[]`, `present.ts`, `present/index.ts`), W1 canonical types.
> **Depended on by:** Group C (speaker theo slot), Group D (timeline panel), W10 (script bám thời lượng).
> **Sources:** `w9.md` Locked Decisions #2/#3, `MasterRoadMap.md` W9 ("Add presentation timeline"), `5.Present.md §3.2/§5.2/§6`.

---

## 1. Micro-task Target

Sinh **presentation timeline** từ slide outline: phân bổ `estimatedSeconds` cho mỗi slide theo độ dài section, tổng thành `totalSeconds`, và **cảnh báo khi vượt** thời lượng cho phép. Deterministic, offline.

> **🔒 Một nguồn (Locked #2/A).** Timeline đọc `SlideOutline[]` (Group A) — không tự dựng outline lại; type `PresentationTimeline` thêm vào CanonicalTypes §9 (cùng Present model).
> **🔒 Deterministic (Locked #3).** Phân bổ thời gian theo công thức cố định (độ dài bullets/section); cùng input → cùng timeline.

## 2. Scope

### In scope (`[C98]`/`[C99]`)
- `src/types/present.ts` (MODIFY) + `CanonicalTypes.md §9` (MODIFY): `PresentationTimeline` (`{ totalSeconds, slots: { slideId, speakerId?, seconds }[], overLimit: boolean }`) + zod.
- `src/modules/present/timeline.ts` (**NEW**): `buildTimeline(outline: SlideOutline[], limitSeconds?: number): PresentationTimeline` — `seconds` theo trọng số độ dài section (min/slide để không 0), `totalSeconds` = tổng, `overLimit` khi vượt `limitSeconds`. Ghi `estimatedSeconds` ngược lại outline nếu cần (immutable, trả bản mới).
- `src/modules/present/index.ts` (MODIFY): export `buildTimeline`.
- Vitest: `timeline.test.ts` — tổng `seconds` = `totalSeconds`; vượt giới hạn → `overLimit:true`; outline rỗng → timeline 0/empty; min/slide áp dụng; deterministic.

### Out of scope
- ❌ Sinh outline (Group A), gán speaker (Group C — timeline để trống `speakerId`).
- ❌ UI panel (Group D).
- ❌ Script/Q&A (→ W10).
- ❌ Dep mới / fetch / AI.

## 3. Checklist
- [ ] `PresentationTimeline` thêm CanonicalTypes §9 + `@/types`.
- [ ] `buildTimeline`: phân bổ theo độ dài + min/slide; `totalSeconds` = tổng `slots.seconds`.
- [ ] `overLimit` đúng khi vượt `limitSeconds`.
- [ ] Outline rỗng → timeline rỗng (không throw).
- [ ] Deterministic; immutable (không mutate outline gốc).
- [ ] `timeline.test.ts` phủ sum/over-limit/empty/min-per-slide/deterministic.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/types/present.ts  (+ CanonicalTypes §9)
export type PresentationTimeline = {
  totalSeconds: number;
  slots: { slideId: string; speakerId?: string; seconds: number }[];
  overLimit: boolean;
};

// src/modules/present/timeline.ts
import type { SlideOutline, PresentationTimeline } from "@/types";
export function buildTimeline(outline: SlideOutline[], limitSeconds?: number): PresentationTimeline;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/types/present.ts` | MODIFY | ~+10 |
| `Design/Modules/Other/CanonicalTypes.md` | MODIFY | ~+8 (§9) |
| `src/modules/present/timeline.ts` | NEW | ~80 |
| `src/modules/present/index.ts` | MODIFY | ~+1 |
| `src/modules/present/timeline.test.ts` | NEW | ~70 |

> **Import boundary:** import `@/types` + outline Group A. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| `totalSeconds` ≠ tổng slots (drift) | Medium | Tính total từ chính `slots`; test sum bất biến. |
| Slide ngắn → 0 giây | Low | Áp `minSecondsPerSlide`; test min. |
| Không cảnh báo khi vượt | Medium | `overLimit` so `limitSeconds`; test phía vượt/không vượt. |
| Mutate outline gốc | Low | Trả timeline mới; không sửa `SlideOutline` in-place. |

## 6. Verification Plan
- outline 4 slide, limit 600s → `totalSeconds` = tổng slots; `overLimit` đúng.
- nâng nội dung 1 slide → slide đó nhiều giây hơn (trọng số độ dài).
- outline rỗng → `{ totalSeconds:0, slots:[], overLimit:false }`.
- gọi 2 lần cùng outline → timeline giống hệt.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(present): presentation timeline with over-limit warning`; +1 docs commit.
