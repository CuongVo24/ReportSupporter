# Contract For AI - W10 Group D: Script / Q&A / Hints Panel

> **Lane / Week:** Core / Month 3 / W10 - Day 4 (`Design/TaskBrief/Core/month3/w10.md` `[C112]`-`[C113]`).
> **Branch:** `feature/W10-script-qa`.
> **Builds on:** W9 `PresentPanel.tsx` (mở rộng), Group A (`generateSpeakerScript`), Group B (`generateDefenseQA`), Group C (`buildWeakSectionHints`), `src/components/Workspace.tsx`, tokens `var(--rs-*)`.
> **Depended on by:** Group E (QA), W11 (AI rewrite gắn vào script/Q&A view sau explicit action).
> **Sources:** `w10.md` Locked Decisions #1/#2, `MasterRoadMap.md` W10, `5.Present.md §4` (Script view / Defense Q&A view), `DesignSystem_Tokens.md`.

---

## 1. Micro-task Target

Mở rộng **Present panel** (W9) thêm: **Script view** (kịch bản nói + cue mỗi slide, sửa được), **Defense Q&A view** (câu hỏi theo topic + gợi ý trả lời), và **weak-section hints** (section/slide cần xem lại). Đọc dữ liệu Groups A–C; offline, client.

> **🔒 Hiển thị/điều phối, không sinh lại logic (Locked #1).** View gọi `generateSpeakerScript`/`generateDefenseQA`/`buildWeakSectionHints`; không nhúng lại thuật toán.
> **🔒 AI off mặc định (Locked #2).** Tuần này chỉ baseline deterministic; chỗ "AI rewrite" để trống/disabled cho W11 (sau explicit user action) — không tự gọi model.
> **📌 Surfaces thực tế.** Mở rộng `PresentPanel.tsx` (+ tách view nếu cần ≤200 dòng); wiring `Workspace.tsx`; CSS chỉ `var(--rs-*)`.

## 2. Scope

### In scope (`[C112]`/`[C113]`)
- `src/modules/present/ScriptView.tsx` (**NEW**): list `SpeakerScript` theo slide (script sửa được + cues hiển thị).
- `src/modules/present/DefenseQAView.tsx` (**NEW**): list `DefenseQA` nhóm theo `topic` (question + suggestedAnswer + link section).
- `src/modules/present/PresentPanel.tsx` (MODIFY): thêm tab/khối Script · Q&A · Weak-section hints (hint badge trỏ slide/section).
- `src/components/Workspace.tsx` (MODIFY): truyền `CheckResult` cho hints (đã có từ Checker panel).
- `src/modules/present/index.ts` (MODIFY): export view mới.
- Vitest (component khả thi): script view render n slide; Q&A nhóm theo topic; hints hiển thị section yếu; không có nút AI active.

### Out of scope
- ❌ Sinh script/Q&A/hints logic (Groups A–C — chỉ gọi).
- ❌ AI rewrite hoạt động (→ W11; tuần này disabled/placeholder).
- ❌ Export PPTX/PDF slides (DEFERRED).
- ❌ Dep mới / network.

## 3. Checklist
- [ ] `ScriptView`: script/slide (sửa được) + cues.
- [ ] `DefenseQAView`: Q&A nhóm theo topic + link section.
- [ ] `PresentPanel`: thêm Script · Q&A · weak-section hints (badge trỏ slide/section).
- [ ] Gọi Groups A–C; không nhúng lại logic; AI để off (W11).
- [ ] Wiring `Workspace.tsx`; CSS chỉ `var(--rs-*)`; ≤200 dòng/file.
- [ ] Component test: script count / Q&A grouping / hints / no-active-AI.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

> UI wiring tiêu thụ public surface Groups A–C; không thêm interface logic mới.

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/present/ScriptView.tsx` | NEW | script + cue mỗi slide |
| `src/modules/present/DefenseQAView.tsx` | NEW | Q&A theo topic |
| `src/modules/present/PresentPanel.tsx` | MODIFY | thêm Script/Q&A/hints |
| `src/components/Workspace.tsx` | MODIFY | truyền CheckResult |
| `src/modules/present/index.ts` | MODIFY | export view |
| `src/modules/present/ScriptQAView.test.tsx` | NEW | render script/Q&A/hints + no-AI |

> **Import boundary:** view import `@/modules/present` (A–C) + `@/types`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Nhúng lại logic script/Q&A trong UI | Medium | View chỉ gọi A–C (Locked #1). |
| Vô tình bật AI/fetch | Medium | Chỗ AI disabled/placeholder; test không có nút AI active (Locked #2). |
| File > 200 dòng | Low | Tách `ScriptView`/`DefenseQAView`; panel mỏng. |
| CSS lệch token | Low | Chỉ `var(--rs-*)`. |

## 6. Verification Plan
- Script view: số script = slide; sửa script tại chỗ; cue hiển thị.
- Q&A view: câu hỏi nhóm đúng topic; link tới section.
- Hints: section yếu hiện badge trỏ slide/section.
- preview: panel render đủ Script/Q&A/hints, không lỗi console, không nút AI active.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(present): script + defense Q&A + weak-section hints panel`; +1 docs commit.
