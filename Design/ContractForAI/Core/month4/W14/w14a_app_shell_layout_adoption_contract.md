# Contract For AI - W14 Group A: App Shell + Layout Adoption

> **Lane / Week:** Core / Month 4 / W14 - Day 1 (`Design/TaskBrief/Core/month4/w14.md` `[C146]`-`[C147]`).
> **Branch:** `feature/W14-ui-adoption`.
> **Builds on:** W13 primitives (`src/components/ui/`), `Frontend/4.Layouts/AppShell.md` · `Responsive.md`, `src/components/WorkspaceLayout.tsx`, `src/app/layout.tsx`.
> **Depended on by:** Group B–E (panel adoption trên shell mới), Toast mount.
> **Sources:** `w14.md` Locked #1/#2, `MasterRoadMap.md` W14, `TechnicalStack §1` (workspace-first), `0.ArtDirection.md` §1/§3.

---

## 1. Micro-task Target

Adopt primitive vào **App Shell**: toolbar sticky + hệ pane editor↔preview + border mảnh + một primary; mount `ToastProvider`/Viewport (dưới-phải) ở root; implement Responsive (split→toggle khi hẹp, panel phụ → drawer, A4 scale-to-fit). **Không** đổi behavior layout.

> **🔒 Adoption, không đổi behavior/shape (Locked #1).** Chỉ tầng trình bày; không logic mới/đổi CanonicalTypes.
> **🔒 Không cài lib mới (Locked #2).** Chỉ primitive W13 + token.
> **🔒 Route `/` vẫn workspace-first.**

## 2. Scope

### In scope (`[C146]`/`[C147]`)
- `src/app/layout.tsx` (MODIFY): mount `ToastProvider` + `Viewport` (dưới-phải); giữ workspace-first.
- `src/components/WorkspaceLayout.tsx` (MODIFY): toolbar sticky, hệ pane, border chia vùng, một primary action — theo `AppShell.md`.
- Responsive (`Responsive.md`): breakpoint editor↔preview (split→toggle/tab), panel phụ → `Drawer` khi hẹp, A4 scale-to-fit không méo.

### Out of scope
- ❌ Panel Write/Format/Check/Export/Present nội dung (Group B–C).
- ❌ Đổi pipeline/preview logic; `--rs-report-*` (bất biến — Locked #3 tuần).
- ❌ Cài lib mới.

## 3. Checklist
- [ ] ToastProvider/Viewport dưới-phải mount root; route `/` vẫn workspace.
- [ ] Shell: toolbar sticky, pane editor↔preview, border mảnh, một primary.
- [ ] Responsive: split→toggle khi hẹp; panel phụ → drawer; A4 scale-to-fit không méo (≥3 viewport).
- [ ] Behavior layout không đổi; token-only.
- [ ] 4 gates xanh; a11y checklist thủ công (axe tự động ở **W15**).

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/layout.tsx` | MODIFY | mount Toast provider |
| `src/components/WorkspaceLayout.tsx` | MODIFY | shell theo AppShell.md |
| `src/components/*` (shell-related) | MODIFY | responsive panes/drawer |

> **Import boundary:** dùng `components/ui` qua index; không đụng module internals.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Adoption đổi behavior layout | High | Chỉ trình bày; diff review (Locked #1). |
| Vỡ deterministic preview | High | Không đụng `--rs-report-*`/pipeline (Locked #3). |
| Responsive vỡ A4 | Medium | scale-to-fit không méo; test ≥3 viewport. |
| Toast z-index xung đột | Low | `--rs-z-toast` thang cố định (token §4.4). |

## 6. Verification Plan
- `/` vẫn workspace; toast bắn ra dưới-phải.
- Thu hẹp viewport: pane chuyển toggle, panel phụ thành drawer, A4 không méo.
- Export mẫu vẫn parity (không đổi preview).
- 4 gates xanh; a11y checklist thủ công (axe tự động ở W15).

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `refactor(shell): adopt ui primitives + sticky toolbar/panes`; `feat(shell): responsive panes + drawer + A4 fit`; `docs(ui): commit w14a contract`.
