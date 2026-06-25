# Contract For AI - W9 Group A: Present Foundation & Slide Outline

> **Lane / Week:** Core / Month 3 / W9 - Day 1 (`Design/TaskBrief/Core/month3/w9.md` `[C96]`-`[C97]`).
> **Branch:** `feature/W9-slide-outline`.
> **Builds on:** W1 canonical `ReportProject`/`ReportSection` (`@/types`), W3 heading numbering (`src/modules/format/number-headings.ts`, `generate-toc.ts`), W2 `parseMarkdown` (`@/lib/markdown-pipeline`), W5 `EvidenceItem[]` (`bundle.evidence`).
> **Depended on by:** Group B (timeline đọc outline), Group C (speakers gán slide), Group D (panel), W10 (script/Q&A đọc outline).
> **Sources:** `w9.md` Locked Decisions #1/#2/#3, `MasterRoadMap.md` W9 ("Generate slide outline from report sections"), `5.Present.md §3.2/§5.1`, `CanonicalTypes.md`.

---

## 1. Micro-task Target

Tạo **module Present mới** (`src/modules/present/`) và sinh **slide outline deterministic** từ `ReportSection[]`: mỗi chương lớn/mục chính → một (hoặc vài) slide giữ **đúng dòng chương mục** báo cáo; rút bullets từ nội dung; map `evidenceRefs` từ Evidence Kit. Không AI, không mạng.

> **🔒 Module mới đọc canonical, không đổi shape (Locked #1).** Present đọc `ReportProject`/`ReportSection` — không sửa type Write/Format.
> **🔒 Type Present mới ⇒ CanonicalTypes trước (Locked #2).** `SlideOutline` (+ shape Present) là NEW → thêm `CanonicalTypes.md §9 Present Model` + `src/types/present.ts` trước khi code; import qua `@/types`. (Tham chiếu sketch `5.Present.md §3.2`.)
> **🔒 Deterministic, offline, no AI (Locked #3).** Outline rút từ heading + câu chủ đề/list item theo luật cố định (AI để W11). Cùng input → cùng outline.

## 2. Scope

### In scope (`[C96]`/`[C97]`)
- `src/types/present.ts` (**NEW**) + `CanonicalTypes.md §9` (MODIFY): `SlideOutline` (`{ id, fromSectionId, order, title, bullets, speakerId?, evidenceRefs, estimatedSeconds? }`) + zod `slideOutlineSchema`. Đăng ký re-export ở `src/types/index.ts`.
- `src/modules/present/generate-outline.ts` (**NEW**): `generateSlideOutline(sections: ReportSection[], evidence?: EvidenceItem[]): SlideOutline[]` — duyệt theo `order`, mỗi h1/mục chính → slide (title = heading đã đánh số), bullets = câu chủ đề/list item đầu mục (giới hạn số bullets/slide); section rỗng → bỏ (không slide trắng); `evidenceRefs` map từ image node + `evidence` liên quan. Deterministic.
- `src/modules/present/index.ts` (**NEW**): public surface (`generateSlideOutline`, types).
- Vitest: `generate-outline.test.ts` — n section → đúng số/thứ tự slide; section rỗng bỏ qua; bullets cap; order khớp chapter flow; cùng input → cùng output; **không** mạng/AI.

### Out of scope
- ❌ Timeline (Group B), speaker (Group C), panel UI (Group D).
- ❌ Script/Q&A (→ W10).
- ❌ Export PPTX/PDF slides (`pptxgenjs` DEFERRED — không cài tuần này).
- ❌ AI sinh nội dung (→ W11).
- ❌ Đổi shape Write/Format; dep mới.

## 3. Checklist
- [x] `present.ts` + CanonicalTypes §9: `SlideOutline` + zod; re-export `@/types`.
- [x] `generateSlideOutline`: giữ đúng dòng chương mục; bullets cap; section rỗng bỏ.
- [x] `evidenceRefs` map từ image/evidence; không đổi Evidence shape.
- [x] Deterministic; offline (no fetch/AI).
- [x] Public surface qua `@/modules/present`.
- [x] `generate-outline.test.ts` phủ order/empty/bullets-cap/deterministic/no-network.
- [x] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/types/present.ts  (+ CanonicalTypes §9)
export type SlideOutline = {
  id: string; fromSectionId: string; order: number;
  title: string; bullets: string[];
  speakerId?: string; evidenceRefs: string[]; estimatedSeconds?: number;
};

// src/modules/present/generate-outline.ts
import type { ReportSection, EvidenceItem, SlideOutline } from "@/types";
export function generateSlideOutline(sections: ReportSection[], evidence?: EvidenceItem[]): SlideOutline[];
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/types/present.ts` | NEW | ~50 |
| `Design/Modules/Other/CanonicalTypes.md` | MODIFY | ~+30 (§9) |
| `src/types/index.ts` | MODIFY | ~+3 (re-export) |
| `src/modules/present/generate-outline.ts` | NEW | ~120 |
| `src/modules/present/index.ts` | NEW | ~10 |
| `src/modules/present/generate-outline.test.ts` | NEW | ~90 |

> **Import boundary:** present import `@/types` + `@/lib` (parser W2) + `@/modules/format` (chapter index). No `fetch`, no AI, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Outline lệch dòng chương mục báo cáo | High | Duyệt theo `order` + heading đánh số (Module 2); test order khớp (acceptance gốc). |
| Đổi/định nghĩa lại shape canonical | Medium | Thêm CanonicalTypes §9 trước; Present chỉ đọc Write/Format. |
| Bullets quá tải/slide trắng | Medium | Cap bullets/slide; bỏ section rỗng (edge case `5.Present.md §6`). |
| Lén dùng AI/fetch | Low | Rút bullets theo luật cố định; test no-network (Locked #3). |
| Cài `pptxgenjs` sớm | Low | DEFERRED; không thuộc W9 (logic + sau là UI). |

## 6. Verification Plan
- Báo cáo 5 chương (1 chương rỗng) → 4 slide đúng thứ tự, title khớp heading.
- Section có list/ảnh → bullets + `evidenceRefs` hợp lý, cap số bullets.
- gọi 2 lần cùng sections → outline giống hệt.
- grep: không `fetch`/AI client trong module.
- lint/typecheck/test/build xanh.

## 7. Status

`DONE`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(types): present model (SlideOutline) in CanonicalTypes §9`; (2) `feat(present): deterministic slide outline from report sections`; +1 docs commit. Mở module Present (Phase 3).
