# Contract For AI - W10 Group B: Defense Q&A Generator

> **Lane / Week:** Core / Month 3 / W10 - Day 2 (`Design/TaskBrief/Core/month3/w10.md` `[C108]`-`[C109]`).
> **Branch:** `feature/W10-script-qa`.
> **Builds on:** W1 `ReportSection[]` (`@/types`), W9 `SlideOutline[]` (map câu hỏi về section), W5 evidence (deploy/github → câu hỏi triển khai), W2 `parseMarkdown` (đọc nội dung section).
> **Depended on by:** Group D (Q&A view), Group E (QA).
> **Sources:** `w10.md` Locked Decisions #1/#3, `MasterRoadMap.md` W10 ("Generate defense Q&A"), `5.Present.md §3.2/§5.3` (Q&A theo template topic), `ProductPRD.md §6` (no AI Phase 1).

---

## 1. Micro-task Target

Sinh **defense Q&A** baseline **deterministic**: câu hỏi phản biện khả dĩ theo nhóm topic (`scope`/`tech`/`result`/`limitation`/`future`) bám nội dung section (vd thấy "deploy" → hỏi môi trường triển khai). Không AI, không mạng.

> **🔒 Theo template topic, deterministic (Locked #1).** Q&A sinh từ luật template + tín hiệu nội dung (keyword section/evidence kind); không gọi model. Cùng input → cùng Q&A.
> **🔒 Một nguồn (Locked #3).** Đọc `ReportSection[]` + outline + evidence; type `DefenseQA` thêm CanonicalTypes §9.

## 2. Scope

### In scope (`[C108]`/`[C109]`)
- `src/types/present.ts` (MODIFY) + `CanonicalTypes.md §9` (MODIFY): `DefenseQA` (`{ id, question, suggestedAnswer, relatedSectionId?, topic }`, `topic: "scope"|"tech"|"result"|"limitation"|"future"`) + zod.
- `src/modules/present/generate-qa.ts` (**NEW**): `generateDefenseQA(sections: ReportSection[], evidence?: EvidenceItem[]): DefenseQA[]` — template câu hỏi theo topic; bám tín hiệu nội dung (vd có "deploy"/evidence `deploy` → câu hỏi triển khai; có "kết quả"/"result" → câu hỏi đánh giá). `relatedSectionId` trỏ section nguồn. `suggestedAnswer` gợi ý từ nội dung, không bịa số liệu.
- `src/modules/present/index.ts` (MODIFY): export `generateDefenseQA`.
- Vitest: `generate-qa.test.ts` — section có "deploy" → có câu topic `tech`/triển khai; phủ ≥1 câu mỗi topic khi đủ tín hiệu; `relatedSectionId` đúng; cùng input → cùng output; **không** mạng/AI.

### Out of scope
- ❌ Script (Group A), weak-section hints (Group C), view (Group D).
- ❌ AI sinh câu hỏi (→ W11).
- ❌ Đổi shape; dep mới / fetch.

## 3. Checklist
- [ ] `DefenseQA` + `topic` enum thêm CanonicalTypes §9 + `@/types`.
- [ ] `generateDefenseQA`: câu hỏi theo topic, bám tín hiệu nội dung; `relatedSectionId` đúng.
- [ ] `suggestedAnswer` từ nội dung, không bịa số liệu.
- [ ] Deterministic; offline (no fetch/AI).
- [ ] `generate-qa.test.ts` phủ topic/relevance/relatedSection/deterministic/no-network.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/types/present.ts  (+ CanonicalTypes §9)
export type DefenseQA = {
  id: string; question: string; suggestedAnswer: string;
  relatedSectionId?: string;
  topic: "scope" | "tech" | "result" | "limitation" | "future";
};

// src/modules/present/generate-qa.ts
import type { ReportSection, EvidenceItem, DefenseQA } from "@/types";
export function generateDefenseQA(sections: ReportSection[], evidence?: EvidenceItem[]): DefenseQA[];
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/types/present.ts` | MODIFY | ~+8 |
| `Design/Modules/Other/CanonicalTypes.md` | MODIFY | ~+8 (§9) |
| `src/modules/present/generate-qa.ts` | NEW | ~130 |
| `src/modules/present/index.ts` | MODIFY | ~+1 |
| `src/modules/present/generate-qa.test.ts` | NEW | ~90 |

> **Import boundary:** import `@/types` + `@/lib` (parser W2) + evidence. No `fetch`, no AI, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Q&A không bám nội dung (generic) | Medium | Bám keyword section + evidence kind; test relevance (deploy→triển khai). |
| Bịa số liệu trong `suggestedAnswer` | Medium | Gợi ý từ nội dung có sẵn; không sinh dữ kiện mới. |
| Lén dùng AI/fetch | Low | Template topic cố định; test no-network (Locked #1). |
| Re-declare type (drift) | Low | Thêm CanonicalTypes §9; import `@/types`. |

## 6. Verification Plan
- section nhắc "deploy" + evidence `deploy` → có câu topic triển khai, `relatedSectionId` trỏ đúng.
- báo cáo đủ tín hiệu → có câu cho mỗi topic; thiếu tín hiệu → bỏ topic đó, không bịa.
- gọi 2 lần cùng input → Q&A giống hệt.
- grep: không `fetch`/AI client.
- lint/typecheck/test/build xanh.

## 7. Status

`READY_TO_IMPLEMENT`

> ✅ Approved in review pass. Implement exactly this contract. Đề xuất commit: (1) `feat(present): deterministic defense Q&A by topic`; +1 docs commit.
