# Contract For AI - W9 Group C: Speaker Assignment

> **Lane / Week:** Core / Month 3 / W9 - Day 3 (`Design/TaskBrief/Core/month3/w9.md` `[C100]`-`[C101]`).
> **Branch:** `feature/W9-slide-outline`.
> **Builds on:** Group A (`SlideOutline[]`), Group B (`PresentationTimeline.slots`), W1 `ReportProject.metadata` (field `members` — `metadata: Record<string, string|string[]>`), W6 member-responsibility section.
> **Depended on by:** Group D (panel gán/kéo-thả), W10 (script per-speaker).
> **Sources:** `w9.md` Locked Decisions #1/#3, `MasterRoadMap.md` W9 ("Assign speakers to sections"), `5.Present.md §3.2/§5.2/§6`.

---

## 1. Micro-task Target

Tạo **Speaker[]** từ `project.metadata.members` và **gán slide cho speaker** (mặc định chia đều theo số chương). Thiếu members → không crash. Deterministic, offline.

> **🔒 Đọc metadata canonical (Locked #1).** `members` lấy từ `project.metadata` (string hoặc string[]) — không đổi shape `ReportProject`; type `Speaker` thêm CanonicalTypes §9.
> **🔒 Deterministic + edge-safe (Locked #3).** Chia slide ổn định; thiếu members → 1 speaker mặc định / để trống, không vỡ (edge `5.Present.md §6`).

## 2. Scope

### In scope (`[C100]`/`[C101]`)
- `src/types/present.ts` (MODIFY) + `CanonicalTypes.md §9` (MODIFY): `Speaker` (`{ id, name, assignedSlideIds }`) + zod.
- `src/modules/present/speakers.ts` (**NEW**):
  - `buildSpeakers(project: ReportProject): Speaker[]` — đọc `metadata.members` (normalize string|string[]), tạo `Speaker[]`; rỗng → `[]` hoặc 1 speaker "Người trình bày".
  - `assignSlides(speakers: Speaker[], outline: SlideOutline[]): { speakers: Speaker[]; outline: SlideOutline[] }` — chia slide đều theo thứ tự, set `outline[].speakerId` + `speaker.assignedSlideIds` (immutable). 0 speaker → outline `speakerId` để trống.
- `src/modules/present/index.ts` (MODIFY): export `buildSpeakers`, `assignSlides`.
- Vitest: `speakers.test.ts` — k members → k speaker; gán đều slide; thiếu members → không crash; reassign deterministic; immutable.

### Out of scope
- ❌ Outline/timeline (Groups A/B), panel kéo-thả (Group D — chỉ hàm gán).
- ❌ Script/Q&A (→ W10).
- ❌ Đổi shape `ReportProject`/metadata; dep mới.

## 3. Checklist
- [ ] `Speaker` thêm CanonicalTypes §9 + `@/types`.
- [ ] `buildSpeakers`: normalize `metadata.members` (string|string[]); rỗng → fallback an toàn.
- [ ] `assignSlides`: chia đều, set `speakerId` + `assignedSlideIds`, immutable.
- [ ] Thiếu members → không crash; slide không speaker để trống.
- [ ] Deterministic.
- [ ] `speakers.test.ts` phủ k-members/assign/empty/deterministic/immutable.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/types/present.ts  (+ CanonicalTypes §9)
export type Speaker = { id: string; name: string; assignedSlideIds: string[] };

// src/modules/present/speakers.ts
import type { ReportProject, SlideOutline, Speaker } from "@/types";
export function buildSpeakers(project: ReportProject): Speaker[];
export function assignSlides(speakers: Speaker[], outline: SlideOutline[]): { speakers: Speaker[]; outline: SlideOutline[] };
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/types/present.ts` | MODIFY | ~+6 |
| `Design/Modules/Other/CanonicalTypes.md` | MODIFY | ~+6 (§9) |
| `src/modules/present/speakers.ts` | NEW | ~100 |
| `src/modules/present/index.ts` | MODIFY | ~+2 |
| `src/modules/present/speakers.test.ts` | NEW | ~80 |

> **Import boundary:** import `@/types` + outline Group A. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| `members` shape đa dạng (string vs string[]) | Medium | Normalize cả hai; test cả hai dạng. |
| Thiếu members → crash/slide không người nói | Medium | Fallback 1 speaker mặc định / để trống; test empty. |
| Chia slide không deterministic | Low | Chia theo thứ tự cố định; test reassign giống nhau. |
| Mutate outline/speaker gốc | Low | Trả bản mới; không in-place. |

## 6. Verification Plan
- `members:["An","Bình","Châu"]`, 6 slide → 3 speaker, mỗi người 2 slide đúng thứ tự.
- `metadata.members` thiếu → `buildSpeakers` không throw; outline `speakerId` để trống.
- `members` là chuỗi đơn → 1 speaker.
- gọi 2 lần cùng input → gán giống hệt.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(present): speaker assignment from project members`; +1 docs commit.
