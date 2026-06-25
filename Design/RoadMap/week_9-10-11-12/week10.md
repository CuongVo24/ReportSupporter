# 📅 WEEK 10: SCRIPT & Q&A

> Phase 3 — Present & AI Layer (W9-W12). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 10.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Help the team rehearse — script, likely questions, weak spots.*

Tuần 10 nối tiếp Module 5 (Present): từ slide outline (W9) sinh **speaker script** (lời nói cho từng slide), sinh **defense Q&A** (câu hỏi bảo vệ khả dĩ), và thêm **weak-section review hints** (chỉ ra phần yếu cần ôn). Đây vẫn là sinh nội dung **deterministic từ dữ liệu report** — *chưa* phải AsI assistant (AI optional để W11).

Mục tiêu chốt từ MasterRoadMap:
- Generate speaker script.
- Generate defense Q&A.
- Add weak-section review hints.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** mở rộng Module 5 — Present (`src/modules/present`).
- **Depends on:** W9 (slide outline + timeline + speaker), W3 checker (weak-section hints dựa readiness/issues), W7 (caption registry để script tham chiếu figure/evidence).
- **Depended on by:** W11 (AI optional có thể nâng cấp script/Q&A behind explicit action), W12 (beta demo dùng script/Q&A).

---

## 3. 🔭 Scope

### ✅ In scope
- Speaker script generator: slide outline → script text mỗi slide (tham chiếu key screenshots/evidence — `Modules/5.Present.md`).
- Defense Q&A generator: từ section/evidence → câu hỏi bảo vệ khả dĩ (tập trung project report).
- Weak-section review hints: dùng checker issues + readiness score (W3) chỉ ra phần yếu.
- Present panel mở rộng: tab Script + tab Q&A + hints.

### ⛔ Out of scope
- AI/LLM sinh nội dung (→ W11 optional, behind explicit user action).
- Text-to-speech / record rehearsal (Non-goal — ngoài scope).
- Export pptx (Deferred — không bắt buộc).
- Network calls (giữ deterministic, offline như checker).

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W10-script-qa`.

### Day 1 — Script Types & Generator
- `[MODIFY]` `src/types/present.ts` (+ `CanonicalTypes.md §9`) → thêm `SpeakerScript`, `DefenseQA`, `WeakSectionHint`
- `[NEW]` `src/modules/present/generate-script.ts` (outline + section content → script per slide)
- `[NEW]` `src/modules/present/generate-script.test.ts`

### Day 2 — Script References (screenshots/evidence)
- `[MODIFY]` `src/modules/present/generate-script.ts` (chèn tham chiếu figure/evidence vào script)
- `[NEW]` `src/modules/present/ScriptView.tsx`

### Day 3 — Defense Q&A Generator
- `[NEW]` `src/modules/present/generate-qa.ts` (section/evidence → câu hỏi bảo vệ khả dĩ)
- `[NEW]` `src/modules/present/generate-qa.test.ts`
- `[NEW]` `src/modules/present/DefenseQAView.tsx`

### Day 4 — Weak-section Review Hints
- `[NEW]` `src/modules/present/weak-sections.ts` (checker issues + readiness score → hints)
- `[MODIFY]` `src/modules/present/PresentPanel.tsx` (gắn hints)
- *Lý do:* tái dùng output Module 3 (W3) thay vì logic mới.

### Day 5 — Integration & QA
- `[MODIFY]` `src/modules/present/index.ts` (export script/qa/hints)
- `[NEW]` `Design/Reports/Month3/W10/W10_QA_Report.md`, `script_qa_samples.md`, `build_output.txt`

---

## 5. 📦 Dependencies installed this week

> Không cài lib mới — script/Q&A/hints sinh deterministic từ dữ liệu report + output checker.

| Library | Why (this week) | Stack ref |
|---|---|---|
| *(none new)* | Generator thuần trên section/evidence/checker; **chưa** dùng AI (→W11) | — |

---

## 6. 📤 Deliverables

- Speaker script generator (tham chiếu screenshots/evidence) + Vitest.
- Defense Q&A generator (project-report focused) + Vitest.
- Weak-section review hints từ checker + readiness.
- Present panel mở rộng: Script + Q&A + hints.
- `Design/Reports/Month3/W10/` QA + script/Q&A samples.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Script/Q&A bị kỳ vọng "thông minh như AI" | Medium | Tuần này deterministic từ data; AI là optional W11 (`MasterRoadMap` W11). |
| Q&A lạc đề ngoài project report | Medium | Khoá nguồn vào section/evidence; "focuses on likely defense questions" (`Modules/5.Present.md`). |
| Weak hints mâu thuẫn checker | Low | Hints đọc thẳng `ReportIssue[]` + readiness (một nguồn). |
| Gọi mạng phá tính deterministic | Medium | Generator offline, không fetch. |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` + `typecheck` + `build` xanh.
- [ ] `Vitest` xanh (script + qa generator).
- [ ] Speaker script sinh per slide, tham chiếu screenshots/evidence.
- [ ] Defense Q&A bám section/evidence, tập trung project report.
- [ ] Weak-section hints dựa checker issues + readiness score.
- [ ] Present panel có tab Script + Q&A + hints.
- [ ] Không dùng AI/network ở tuần này.
- [ ] Evidence tại `Design/Reports/Month3/W10/`.
- [ ] Commit kèm contract, branch `feature/W10-script-qa`.
