# Contract For AI - W10 Group A: Speaker Script Generator

> **Lane / Week:** Core / Month 3 / W10 - Day 1 (`Design/TaskBrief/Core/month3/w10.md` `[C106]`-`[C107]`).
> **Branch:** `feature/W10-script-qa`.
> **Builds on:** W9 `SlideOutline[]`/`present.ts`/`present/index.ts`, W5 `EvidenceItem[]` (`bundle.evidence`), W3 caption/heading (cue "Hình N"), W1 canonical types.
> **Depended on by:** Group D (script view), Group E (QA), W11 (AI rewrite optional trên cùng script).
> **Sources:** `w10.md` Locked Decisions #1/#2, `MasterRoadMap.md` W10 ("Generate speaker script"), `5.Present.md §3.2/§5.3` (baseline deterministic → AI optional W11), `Support.Evidence.md`.

---

## 1. Micro-task Target

Sinh **speaker script** baseline **deterministic** cho từng slide: đoạn nói từ bullets + caption hình + cue minh chứng ("Ở phần này, mở video demo/link deploy…"). Không AI, không mạng (AI rewrite để W11 sau explicit action).

> **🔒 Baseline deterministic, AI để W11 (Locked #1).** Script ghép từ bullets + caption + EvidenceItem theo template cố định; cùng input → cùng script. Không gọi model/fetch tuần này.
> **🔒 Một nguồn (Locked #2).** Script đọc `SlideOutline[]` (W9) + `bundle.evidence` (W5); type `SpeakerScript` thêm CanonicalTypes §9 (mở rộng Present model).

## 2. Scope

### In scope (`[C106]`/`[C107]`)
- `src/types/present.ts` (MODIFY) + `CanonicalTypes.md §9` (MODIFY): `SpeakerScript` (`{ slideId, speakerId?, script, cues }`) + zod.
- `src/modules/present/generate-script.ts` (**NEW**): `generateSpeakerScript(outline: SlideOutline[], evidence?: EvidenceItem[]): SpeakerScript[]` — mỗi slide → `script` (mở đầu theo title + diễn giải bullets, deterministic), `cues` (gợi ý "chỉ vào Hình N", "mở demo <evidence>") map từ `evidenceRefs`/caption. Slide không evidence → cues rỗng.
- `src/modules/present/index.ts` (MODIFY): export `generateSpeakerScript`.
- Vitest: `generate-script.test.ts` — mỗi slide có script; cue map đúng từ evidence/caption; slide không evidence → cues rỗng; cùng input → cùng output; **không** mạng/AI.

### Out of scope
- ❌ Defense Q&A (Group B), weak-section hints (Group C), view (Group D).
- ❌ AI rewrite (→ W11).
- ❌ Export PPTX/PDF slides (DEFERRED).
- ❌ Đổi shape W9/Evidence; dep mới.

## 3. Checklist
- [ ] `SpeakerScript` thêm CanonicalTypes §9 + `@/types`.
- [ ] `generateSpeakerScript`: script từ bullets/title; cues từ evidence/caption.
- [ ] Slide không evidence → cues rỗng; không bịa link.
- [ ] Deterministic; offline (no fetch/AI).
- [ ] Public surface qua `@/modules/present`.
- [ ] `generate-script.test.ts` phủ script/cue-map/no-evidence/deterministic/no-network.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/types/present.ts  (+ CanonicalTypes §9)
export type SpeakerScript = { slideId: string; speakerId?: string; script: string; cues: string[] };

// src/modules/present/generate-script.ts
import type { SlideOutline, EvidenceItem, SpeakerScript } from "@/types";
export function generateSpeakerScript(outline: SlideOutline[], evidence?: EvidenceItem[]): SpeakerScript[];
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/types/present.ts` | MODIFY | ~+6 |
| `Design/Modules/Other/CanonicalTypes.md` | MODIFY | ~+6 (§9) |
| `src/modules/present/generate-script.ts` | NEW | ~120 |
| `src/modules/present/index.ts` | MODIFY | ~+1 |
| `src/modules/present/generate-script.test.ts` | NEW | ~90 |

> **Import boundary:** import `@/types` + outline W9 + evidence. No `fetch`, no AI, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Lén dùng AI/fetch để "viết hay" | Medium | Template cố định; test no-network (Locked #1). |
| Cue map sai/bịa link | Medium | Cue chỉ từ `evidenceRefs`/caption thật; slide không evidence → rỗng. |
| Re-declare type Present (drift) | Low | Thêm CanonicalTypes §9; import `@/types`. |
| Script rỗng khi bullets rỗng | Low | Fallback từ title; test slide ít nội dung. |

## 6. Verification Plan
- outline 4 slide (1 slide có evidence video) → 4 script; slide video có cue "mở demo".
- slide không evidence → `cues:[]`.
- gọi 2 lần cùng input → script giống hệt.
- grep: không `fetch`/AI client trong module.
- lint/typecheck/test/build xanh.

## 7. Status

APPROVED

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(present): deterministic speaker script with evidence cues`; +1 docs commit.
