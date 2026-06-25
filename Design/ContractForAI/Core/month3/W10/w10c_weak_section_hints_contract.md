# Contract For AI - W10 Group C: Weak-Section Review Hints

> **Lane / Week:** Core / Month 3 / W10 - Day 3 (`Design/TaskBrief/Core/month3/w10.md` `[C110]`-`[C111]`).
> **Branch:** `feature/W10-script-qa`.
> **Builds on:** W3 Checker (`src/modules/check/run-checker.ts`, `readiness-score.ts`, `CheckResult`/`ReportIssue`), W9 `SlideOutline[]` (map hint về slide/section), W1 canonical types.
> **Depended on by:** Group D (hints view), Group E (QA).
> **Sources:** `w10.md` Locked Decisions #1/#4, `MasterRoadMap.md` W10 ("Add weak-section review hints"), `3.Check.md §5`, `5.Present.md §3/§9`.

---

## 1. Micro-task Target

Sinh **weak-section review hints**: chỉ ra section/slide yếu cần xem lại trước khi bảo vệ, **lấy từ kết quả Checker đã có** (issues + readiness W3) — tổng hợp theo section, không chạy engine check mới.

> **🔒 Aggregate Checker, không re-check (Locked #4).** Hint đọc `CheckResult.issues`/`readinessScore` (W3); gom theo `sectionId` → mức độ yếu + gợi ý. Không viết rule/parser mới.
> **🔒 Một nguồn (Locked #1).** Hint map về `SlideOutline.fromSectionId`/`ReportSection`; type `WeakSectionHint` thêm CanonicalTypes §9.

## 2. Scope

### In scope (`[C110]`/`[C111]`)
- `src/types/present.ts` (MODIFY) + `CanonicalTypes.md §9` (MODIFY): `WeakSectionHint` (`{ sectionId, slideId?, severity, reason, suggestion }`) + zod.
- `src/modules/present/weak-sections.ts` (**NEW**): `buildWeakSectionHints(check: CheckResult, outline: SlideOutline[]): WeakSectionHint[]` — gom `issues` theo `sectionId` (đếm error/warning), gắn `slideId` nếu section có slide; `severity` theo issue nặng nhất; `reason`/`suggestion` từ issue (tái dùng `issue.message`/`issue.suggestion`). Section không issue → không hint.
- `src/modules/present/index.ts` (MODIFY): export `buildWeakSectionHints`.
- Vitest: `weak-sections.test.ts` — section có `error` → hint `severity:"error"`; nhiều issue/section → gom đúng; section sạch → không hint; map `slideId` đúng; deterministic.

### Out of scope
- ❌ Viết lại checker rule/readiness (W3 — chỉ đọc).
- ❌ Script/Q&A (Groups A/B), view (Group D).
- ❌ AI gợi ý (→ W11).
- ❌ Đổi shape Check; dep mới.

## 3. Checklist
- [ ] `WeakSectionHint` thêm CanonicalTypes §9 + `@/types`.
- [ ] `buildWeakSectionHints`: gom issue theo section; `severity` nặng nhất; map `slideId`.
- [ ] Chỉ đọc `CheckResult` (W3) — không re-check.
- [ ] Section sạch → không hint.
- [ ] Deterministic.
- [ ] `weak-sections.test.ts` phủ error/aggregate/clean/slide-map/deterministic.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/types/present.ts  (+ CanonicalTypes §9)
export type WeakSectionHint = {
  sectionId: string; slideId?: string;
  severity: ReportIssueSeverity; reason: string; suggestion: string;
};

// src/modules/present/weak-sections.ts
import type { CheckResult, SlideOutline, WeakSectionHint } from "@/types";
export function buildWeakSectionHints(check: CheckResult, outline: SlideOutline[]): WeakSectionHint[];
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/types/present.ts` | MODIFY | ~+6 |
| `Design/Modules/Other/CanonicalTypes.md` | MODIFY | ~+6 (§9) |
| `src/modules/present/weak-sections.ts` | NEW | ~90 |
| `src/modules/present/index.ts` | MODIFY | ~+1 |
| `src/modules/present/weak-sections.test.ts` | NEW | ~80 |

> **Import boundary:** import `@/types` + `CheckResult` (`@/modules/check`) + outline W9. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Re-implement checker (drift) | High | Chỉ đọc `CheckResult.issues`; không gọi rule lại (Locked #4). |
| Issue không có `sectionId` | Medium | Gom nhóm "toàn báo cáo" riêng; không drop; test issue thiếu section. |
| `severity` chọn sai khi nhiều issue | Low | Lấy nặng nhất (error>warning>info); test aggregate. |
| Re-declare type (drift) | Low | Thêm CanonicalTypes §9; import `@/types`. |

## 6. Verification Plan
- section A có 1 `error` + 1 `warning` → 1 hint `severity:"error"`, reason/suggestion từ issue.
- section sạch → không hint.
- section có slide → hint mang `slideId` đúng.
- issue thiếu `sectionId` → gom nhóm tổng, không mất.
- gọi 2 lần cùng `CheckResult` → hints giống hệt.
- lint/typecheck/test/build xanh.

## 7. Status

`READY_TO_IMPLEMENT`

> ✅ Approved in review pass. Implement exactly this contract. Đề xuất commit: (1) `feat(present): weak-section review hints from checker results`; +1 docs commit.
