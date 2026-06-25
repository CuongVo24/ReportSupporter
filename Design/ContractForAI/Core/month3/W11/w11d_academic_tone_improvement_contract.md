# Contract For AI - W11 Group D: Academic Tone Improvement

> **Lane / Week:** Core / Month 3 / W11 - Day 4 (`Design/TaskBrief/Core/month3/w11.md` `[C122]`-`[C123]`).
> **Branch:** `feature/W11-ai-assistant`.
> **Builds on:** Group A (gateway), Group C (`SuggestionDiff` dùng chung), W2 editor (`ReportSection`).
> **Depended on by:** Group E (QA off-state + control).
> **Sources:** `w11.md` Locked #1/#4/#5, `MasterRoadMap.md` W11 ("academic tone improvement" + "keep user content control visible").

---

## 1. Micro-task Target

Academic tone improvement (đề xuất có kiểm soát, dùng chung `SuggestionDiff`) + **`UserControlBar`** luôn hiển thị bản gốc + undo + lối vào diff.

> **🔒 Đề xuất có kiểm soát (Locked #1).** Tone là suggestion accept/reject, không auto-write.
> **🔒 User content control luôn hiển thị (Locked #4).** Bản gốc + undo luôn thấy, kể cả khi suggestion đang chờ.

## 2. Scope

### In scope (`[C122]`/`[C123]`)
- `src/modules/write/ai/improve-tone.ts` (**NEW**): `improveTone(text: string, gateway): Promise<AiSuggestion>` (`action:"tone"`); off/unconfigured → no-op.
- `src/modules/write/ai/SuggestionDiff.tsx` (MODIFY): dùng chung cho `rewrite` + `tone` (param theo `AiAction`); không nhân đôi UI.
- `src/modules/write/ai/UserControlBar.tsx` (**NEW**): luôn hiển thị bản gốc + nút hoàn tác + lối mở diff. CSS chỉ `var(--rs-*)`.
- Export qua `write/index.ts`.

### Out of scope
- ❌ Tính năng AI thứ 4 (chỉ outline/rewrite/tone — Locked #5).
- ❌ Auto-apply tone; đổi shape `ReportSection`.

## 3. Checklist
- [ ] `improveTone` trả suggestion `action:"tone"`; off → no-op.
- [ ] `SuggestionDiff` dùng chung rewrite + tone (không nhân đôi).
- [ ] `UserControlBar` luôn hiện bản gốc + undo + diff entry.
- [ ] Token-only; ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/ai/improve-tone.ts` | NEW | tone suggestion |
| `src/modules/write/ai/SuggestionDiff.tsx` | MODIFY | dùng chung rewrite+tone |
| `src/modules/write/ai/UserControlBar.tsx` | NEW | bản gốc + undo + diff |
| `src/modules/write/index.ts` | MODIFY | export |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Tone tự ghi đè | High | Suggestion accept/reject (Locked #1). |
| Mất bản gốc / không undo được | Medium | `UserControlBar` luôn hiện gốc + undo (Locked #4). |
| Nhân đôi UI diff | Low | `SuggestionDiff` dùng chung theo `AiAction`. |

## 6. Verification Plan
- Off → `improveTone` no-op.
- Tone suggestion → diff dùng chung; accept/reject hoạt động.
- `UserControlBar` hiện bản gốc + undo kể cả khi suggestion chờ.
- 4 gates xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ai): academic tone suggestion (shared diff)`; `feat(ai): user control bar (original/undo always visible)`; `docs(ai): commit w11d contract`.
