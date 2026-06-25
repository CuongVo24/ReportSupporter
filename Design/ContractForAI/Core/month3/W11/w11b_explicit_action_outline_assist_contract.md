# Contract For AI - W11 Group B: Explicit-action Outline Assist

> **Lane / Week:** Core / Month 3 / W11 - Day 2 (`Design/TaskBrief/Core/month3/w11.md` `[C118]`-`[C119]`).
> **Branch:** `feature/W11-ai-assistant`.
> **Builds on:** Group A (gateway + flag), W9 `SlideOutline[]`/`present.ts`/`present/index.ts`, `Frontend/2.Components/Button.md`.
> **Depended on by:** Group E (QA off-state), W12 demo.
> **Sources:** `w11.md` Locked #1/#5/#6, `MasterRoadMap.md` W11 ("AI-assisted outline generation behind explicit user action").

---

## 1. Micro-task Target

AI-assisted outline **chỉ chạy sau explicit user action**: nút rõ ràng gọi gateway nâng cấp `SlideOutline[]` (W9); off/unconfigured → nút disabled + ghi chú, outline gốc giữ nguyên.

> **🔒 Explicit action (Locked #1).** Không auto-run; chỉ chạy khi user bấm.
> **🔒 Đọc artifact W9, không re-generate (Locked #6).** Nâng cấp outline có sẵn; không viết lại generator deterministic.

## 2. Scope

### In scope (`[C118]`/`[C119]`)
- `src/modules/present/ai/assist-outline.ts` (**NEW**): `assistOutline(outline: SlideOutline[], gateway): Promise<AiSuggestion>` — chỉ gọi khi trigger explicit; off/unconfigured → trả outline gốc + trạng thái, no fetch.
- `src/modules/present/ai/AiOutlineButton.tsx` (**NEW**): nút động từ + `aria-busy` loading; off/unconfigured → disabled + ghi chú "Bật AI trong cấu hình". CSS chỉ `var(--rs-*)`.
- Export qua `present/index.ts`.

### Out of scope
- ❌ Rewrite (Group C), tone (D).
- ❌ Auto-apply outline (chỉ đề xuất; apply qua accept).
- ❌ Cài provider SDK.

## 3. Checklist
- [ ] `assistOutline` chỉ chạy sau explicit trigger; off/unconfigured → no-op + trạng thái.
- [ ] Nút rõ ràng, `aria-busy` loading; disabled khi off/unconfigured + ghi chú.
- [ ] Đọc `SlideOutline[]` W9; không re-generate; không đổi shape.
- [ ] No fetch khi off; token-only; ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/present/ai/assist-outline.ts` | NEW | explicit-action assist |
| `src/modules/present/ai/AiOutlineButton.tsx` | NEW | nút rõ ràng + states |
| `src/modules/present/index.ts` | MODIFY | export |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Outline tự chạy nền | High | Chỉ sau explicit click (Locked #1). |
| Re-generate outline (drift W9) | Medium | Đọc outline có sẵn; không viết generator mới (Locked #6). |
| Nút bật khi chưa cấu hình | Low | Disabled + ghi chú off/unconfigured. |

## 6. Verification Plan
- Off/unconfigured → nút disabled, outline gốc giữ nguyên, no fetch.
- Explicit click (giả lập gateway ready) → trả suggestion; loading `aria-busy`.
- 4 gates xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ai): explicit-action outline assist + button (states/a11y)`; `docs(ai): commit w11b contract`.
