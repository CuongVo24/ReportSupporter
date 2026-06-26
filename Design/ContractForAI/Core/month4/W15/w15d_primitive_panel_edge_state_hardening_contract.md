# Contract For AI - W15 Group D: Primitive / Panel Edge-state Hardening (buffer)

> **Lane / Week:** Core / Month 4 / W15 - Day 4 (`Design/TaskBrief/Core/month4/w15.md` `[C162]`-`[C163]`).
> **Branch:** `feature/W15-ui-hardening`.
> **Builds on:** W13 primitives (Dialog/Toast/Tabs — `w13c`/`w13d`), W14 panel adoption (Check/Export/Submission/Evidence/Present — `w14c`), `_ComponentSpecRule.md §3` (states đủ), `Frontend/3.Patterns/*`.
> **Depended on by:** Group E (evidence), đóng Phase 4.
> **Sources:** `w15.md` Locked #1/#6, `MasterRoadMap.md` W15, `Frontend/2.Components/Dialog.md`·`Toast.md`·`Tabs.md`, `Frontend/5.Flows/Export.md`.

---

## 1. Micro-task Target

**Buffer hấp thụ spillover Day 3** của W13/W14: hoàn thiện **edge-state** primitive (Dialog/Toast/Tabs) + panel (Check/Export/Submission/Evidence/Present) cho **đủ trạng thái** theo `_ComponentSpecRule.md §3`. Không đổi logic/shape.

> **🔒 Day 4 là buffer (Locked #6).** Đủ state là điều kiện done; không thêm feature.
> **🔒 Không đổi behavior/shape (Locked #1).**

## 2. Scope

### In scope (`[C162]`/`[C163]`)
- Primitive edge-state (MODIFY nếu thiếu): Dialog (drawer/confirm focus-return, Esc), Toast (stack >3, error-no-dismiss, hover-pause), Tabs (count badge realtime, keyboard ←/→/Home/End).
- Panel edge-state (MODIFY nếu thiếu): empty/loading/error của Check/Export/Submission/Evidence/Present — jump-to-issue khi rỗng, export fail+retry, submission thiếu package/check, evidence chưa có nguồn/invalid form, present chưa có outline. Dùng `src/components/states/` + primitive.

### Out of scope
- ❌ Axe (Group A), Visual QA (B), dark/motion/responsive (C), evidence (E).
- ❌ Đổi logic checker/export/present; đổi shape/CanonicalTypes; feature mới.

## 3. Checklist
- [ ] Dialog: focus-return, Esc, confirm chặn backdrop; drawer trượt phải.
- [ ] Toast: stack ≤3 + thừa xếp hàng, error không tự tắt, hover-pause.
- [ ] Tabs: count badge realtime đúng số issue; keyboard đầy đủ.
- [ ] Panel empty/loading/error đủ (jump-to-issue rỗng, export fail+retry, submission thiếu package/check, evidence chưa có nguồn/invalid form, present chưa outline).
- [ ] Không đổi logic/shape; ≤200 dòng/file; 4 gates + axe 0 critical.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/ui/{Dialog,Toast,Tabs}.*` | MODIFY (nếu thiếu state) | edge-state đủ |
| `src/modules/check/CheckerPanel.tsx` | MODIFY (nếu thiếu state) | empty/loading/error edge |
| `src/modules/export/ExportPanel.tsx` / `SubmissionPanel.tsx` | MODIFY (nếu thiếu state) | export + submission edge |
| `src/modules/evidence/EvidencePanel.tsx` / `EvidenceForm.tsx` | MODIFY (nếu thiếu state) | evidence empty/error/form edge |
| `src/modules/present/PresentPanel.tsx` | MODIFY (nếu thiếu state) | present empty/loading/error edge |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Hardening lén đổi logic | High | Chỉ trình bày/states; giữ shape (Locked #1). |
| Edge-state vẫn thiếu (happy-path) | Medium | `_ComponentSpecRule.md §3` checklist (Locked #6). |
| Toast error tự tắt | Medium | error không auto-dismiss (`Toast.md`). |
| File panel > 200 dòng | Low | Tách subcomponent/`.css`. |

## 6. Verification Plan
- Dialog confirm: backdrop không đóng; Esc + focus-return.
- Toast: >3 xếp hàng; error ở lại; hover dừng giờ.
- Panel: rỗng/đang tải/lỗi đều có state; export fail → retry; submission/evidence edge states không bị bỏ sót.
- 4 gates + axe 0 critical.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(ui): complete primitive edge-states (dialog/toast/tabs)`; `fix(panels): complete empty/loading/error edge-states`; `docs(ui): commit w15d contract`.
