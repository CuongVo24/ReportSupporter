# Contract For AI - W11 Group C: Section Rewrite Suggestions

> **Lane / Week:** Core / Month 3 / W11 - Day 3 (`Design/TaskBrief/Core/month3/w11.md` `[C120]`-`[C121]`).
> **Branch:** `feature/W11-ai-assistant`.
> **Builds on:** Group A (gateway + flag), W2 editor (`ReportSection`), `Frontend/3.Patterns/*` (diff/accept-reject).
> **Depended on by:** Group D (tone dùng chung `SuggestionDiff`), Group E (QA).
> **Sources:** `w11.md` Locked #1/#4, `MasterRoadMap.md` W11 ("section rewrite suggestions").

---

## 1. Micro-task Target

Section rewrite **dạng đề xuất**: gateway trả `AiSuggestion`, hiển thị diff gốc↔đề xuất, user **accept/reject** — **không tự ghi đè** `ReportSection`.

> **🔒 Không tự ghi đè (Locked #1).** Accept mới ghi (qua callback caller); reject giữ nguyên.
> **🔒 User content control hiển thị (Locked #4).** Diff gốc↔đề xuất luôn thấy.

## 2. Scope

### In scope (`[C120]`/`[C121]`)
- `src/modules/write/ai/rewrite-section.ts` (**NEW**): `rewriteSection(section: ReportSection, gateway): Promise<AiSuggestion>` — trả suggestion, **không** mutate section; off/unconfigured → no-op.
- `src/modules/write/ai/SuggestionDiff.tsx` (**NEW**): render diff gốc↔đề xuất + nút accept/reject; accept gọi callback ghi, reject đóng giữ nguyên. CSS chỉ `var(--rs-*)`.
- Export qua `write/index.ts`.

### Out of scope
- ❌ Tone (Group D — dùng lại `SuggestionDiff`).
- ❌ Auto-write/overwrite section.
- ❌ Đổi shape `ReportSection`.

## 3. Checklist
- [ ] `rewriteSection` trả suggestion, không mutate section; off → no-op.
- [ ] `SuggestionDiff` hiển thị diff gốc↔đề xuất.
- [ ] Accept → ghi qua callback; reject → giữ nguyên; không auto-write.
- [ ] Token-only; ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/ai/rewrite-section.ts` | NEW | suggestion, no overwrite |
| `src/modules/write/ai/SuggestionDiff.tsx` | NEW | diff + accept/reject |
| `src/modules/write/index.ts` | MODIFY | export |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| AI tự ghi đè section | High | Suggestion-only; accept mới ghi (Locked #1). |
| Mất bản gốc khi reject | Medium | Reject giữ nguyên; diff luôn hiện gốc (Locked #4). |
| Fetch khi off | Medium | Off → no-op; grep no-network. |

## 6. Verification Plan
- Off → `rewriteSection` no-op, section giữ nguyên.
- Suggestion → diff hiện gốc + đề xuất; reject giữ nguyên; accept ghi qua callback.
- 4 gates xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ai): section rewrite suggestion + diff accept/reject`; `docs(ai): commit w11c contract`.
