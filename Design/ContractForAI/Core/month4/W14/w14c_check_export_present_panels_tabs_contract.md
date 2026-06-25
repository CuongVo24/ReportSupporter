# Contract For AI - W14 Group C: Check/Export/Present Panels + Tabs

> **Lane / Week:** Core / Month 4 / W14 - Day 3 (`Design/TaskBrief/Core/month4/w14.md` `[C150]`-`[C151]`).
> **Branch:** `feature/W14-ui-adoption`.
> **Builds on:** Group A/B, W13 Tabs/Badge/Dialog/Toast/Button, `Frontend/2.Components/Tabs.md` · `Badge.md`, `Frontend/5.Flows/Export.md`, `Frontend/3.Patterns/ErrorStates.md`.
> **Depended on by:** Group D (microcopy), Group E (visual QA).
> **Sources:** `w14.md` Locked #1/#4, `MasterRoadMap.md` W14, `Modules/3.Check.md` (severity/readiness/jump-to-issue), `Modules/4.Export.md` (job lifecycle), `5.Present.md §6` (PPTX disabled).

---

## 1. Micro-task Target

Adopt vào **panel phải**: `Tabs` (underline) chuyển Check/Export/Present + count badge số issue; Checker dùng `Badge` severity (icon+chữ) + clickable jump-to-issue + readiness badge; Export/Present dùng `Button` loading, `Dialog` confirm, `Toast` done, error+retry. Nút PPTX giữ disabled + ghi chú (deferred).

> **🔒 Adoption only (Locked #1).** Không đổi logic checker/export; không đổi shape.
> **🔒 Tabs+Badge vào panel phải (Locked #4).** Severity icon+chữ; jump-to-issue clickable (B7/B11).

## 2. Scope

### In scope (`[C150]`/`[C151]`)
- Panel phải (MODIFY): `Tabs` underline Check/Export/Present + count badge (số issue, `aria-label`).
- Checker panel (MODIFY): `Badge` severity (icon+chữ, không-chỉ-màu) + clickable jump-to-issue (Enter/Space); readiness badge theo ngưỡng `3.Check.md §5.3`.
- Export/Present (MODIFY): `Button` loading (job chạy); `Dialog` confirm "Vẫn xuất dù còn lỗi?" (`VoiceAndContent §7`); `Toast` "Đã xuất {định dạng}" + action "Mở file"; error+retry (`ErrorStates.md`/`5.Flows/Export.md`). PPTX nút disabled + ghi chú "cần bật Phase 3".

### Out of scope
- ❌ Logic checker/export/present; đổi `ReportIssue`/job shape/CanonicalTypes.
- ❌ Bật PPTX (`pptxgenjs` vẫn deferred).
- ❌ Write/metadata (Group B).

## 3. Checklist
- [ ] Tabs underline Check/Export/Present + count badge số issue (nhãn đọc được).
- [ ] Severity badge icon+chữ; jump-to-issue clickable keyboard.
- [ ] Readiness badge đúng ngưỡng (`3.Check.md §5.3`).
- [ ] Export Button loading; confirm Dialog khi còn lỗi; Toast done + "Mở file"; error+retry.
- [ ] PPTX disabled + ghi chú (deferred parity).
- [ ] Không đổi logic/shape; 4 gates xanh; a11y checklist thủ công (axe tự động ở **W15**).

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| panel phải shell/container | MODIFY | Tabs Check/Export/Present |
| `src/modules/check/**` panel/view | MODIFY | Badge severity + jump-to-issue |
| `src/modules/export/**` panel/view | MODIFY | Button loading + Dialog + Toast + retry |
| `src/modules/present/**` panel/view | MODIFY | states; PPTX disabled note |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Adoption đổi logic checker/export | High | Chỉ UI; giữ shape/logic (Locked #1). |
| Severity chỉ màu (a11y) | Medium | icon+chữ bắt buộc (`Badge.md`). |
| Toast error tự tắt khi export fail | Medium | error không auto-dismiss (Toast.md). |
| Bật nhầm PPTX | Low | Giữ disabled + ghi chú (deferred). |
| Count badge sai số realtime | Low | Bind từ ReportIssue[]; test. |

## 6. Verification Plan
- Chuyển tab Check/Export/Present bằng ←/→; count badge khớp số issue.
- Click badge issue → jump tới (Enter/Space); readiness đúng màu/ngưỡng.
- Export còn lỗi → confirm Dialog; thành công → Toast "Mở file"; fail → error+retry.
- PPTX disabled + ghi chú; 4 gates xanh; a11y checklist thủ công (axe tự động ở W15).

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `refactor(check): badge severity + jump-to-issue + tabs`; `refactor(export): button loading + confirm/toast + retry`; `docs(ui): commit w14c contract`.
