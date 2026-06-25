# Contract For AI - W12 Group D: Accessibility (checklist thủ công)

> **Lane / Week:** Core / Month 3 / W12 - Day 4 (`Design/TaskBrief/Core/month3/w12.md` `[C132]`-`[C133]`).
> **Branch:** `feature/W12-beta-readiness`.
> **Builds on:** Group C (shared states), components dùng chung, `DesignSystem_Tokens.md` (focus ring), `Frontend/Other/Accessibility.md`.
> **Depended on by:** **W15** (axe automation lấy `a11y_checklist.md` làm baseline — `w15a`), Group E (acceptance).
> **Sources:** `w12.md` Locked #2/#3, `MasterRoadMap.md` W12 ("accessibility"), `TechnicalStack §7` (Playwright/axe deferred ở MVP lõi).

---

## 1. Micro-task Target

Accessibility pass **thủ công** (keyboard nav, focus ring token, `aria-label`, contrast) trên components dùng chung + viết `a11y_checklist.md`. **Không cài axe** — gate axe tự động thuộc **W15** (Phase 4).

> **🔒 A11y checklist thủ công; axe ở W15 (Locked #3).** Tuần này không tuyên bố "axe gate"; checklist là baseline cho W15 automation.
> **🔒 Không cài lib mới (Locked #2).** Không axe-core tuần này.

## 2. Scope

### In scope (`[C132]`/`[C133]`)
- Components dùng chung (MODIFY thủ công): keyboard reachable, focus-visible token (cấm `outline:none`), `aria-label`, contrast đủ.
- `Design/Reports/Month3/W12/a11y_checklist.md` (**NEW**): checklist keyboard/focus/contrast/aria pass cơ bản (baseline cho W15).

### Out of scope
- ❌ Cài/cấu hình axe-core (→ W15 `w15a`).
- ❌ Đổi behavior/shape; primitive UI Phase 4.

## 3. Checklist
- [ ] Keyboard nav reachable; focus ring token (no `outline:none`).
- [ ] `aria-label` đủ; contrast đạt.
- [ ] `a11y_checklist.md` keyboard/focus/contrast/aria pass.
- [ ] Không cài axe; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/**`, `src/modules/*/[Pp]anel*.tsx` | MODIFY | a11y thủ công |
| `Design/Reports/Month3/W12/a11y_checklist.md` | NEW | baseline cho W15 axe |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| A11y lỗi ẩn (chỉ thủ công) | Medium | Checklist đầy đủ; W15 axe automation bắt phần còn lại. |
| Cài axe lệch lịch | Low | Axe ở W15 (Locked #2/#3). |
| `outline:none` mất focus | Low | Cấm; focus ring token. |

## 6. Verification Plan
- Tab toàn workspace → focus order hợp lý, ring rõ.
- Đối chiếu checklist keyboard/focus/contrast/aria.
- 4 gates xanh (chưa axe).

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(a11y): manual keyboard/focus/aria/contrast pass`; `docs(w12): a11y checklist baseline`; `docs(w12): commit w12d contract`.
