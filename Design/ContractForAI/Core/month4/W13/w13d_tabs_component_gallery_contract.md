# Contract For AI - W13 Group D: Tabs + Component Gallery

> **Lane / Week:** Core / Month 4 / W13 - Day 4 (`Design/TaskBrief/Core/month4/w13.md` `[C142]`-`[C143]`).
> **Branch:** `feature/W13-ui-foundation`.
> **Builds on:** Group A–C (mọi primitive + Badge), `@radix-ui/react-tabs`, `Frontend/2.Components/Tabs.md`, `0.ArtDirection.md` §11.
> **Depended on by:** Group E (evidence chụp từ gallery), W14 (Tabs vào panel phải).
> **Sources:** `w13.md` Locked #1/#2, `MasterRoadMap.md` W13, `TechnicalStack §1` (workspace-first — gallery không lộ ở `/`).

---

## 1. Micro-task Target

Build **Tabs** (Radix Tabs — underline + segmented, count badge) và một **trang gallery dev-only** render mọi component × variant × state để duyệt bằng mắt + làm chỗ chụp evidence; gallery **không** lộ trên route `/` workspace.

> **🔒 Giữ a11y Radix (Tabs roles + keyboard ←/→).**
> **🔒 Gallery dev-only.** Đặt trong `(dev)` group; không vào nav production; route `/` vẫn workspace (`TechnicalStack §1`).

## 2. Scope

### In scope (`[C142]`/`[C143]`)
- `src/components/ui/Tabs.{tsx,css}` (**NEW**): variants underline + segmented; count badge (dùng `Badge`, nhãn đọc được); active = primary + medium; export `ui/index.ts`.
- `src/app/(dev)/ui-gallery/page.tsx` (**NEW**): render 8 component (Button/Input/Textarea/Select/Badge/Dialog[modal+drawer]/Toast/Tabs) × variant/state; toggle light/dark (`data-theme`). Dev-only, gated.

### Out of scope
- ❌ Refactor panel/module (W14).
- ❌ Logic nghiệp vụ; đổi CanonicalTypes.
- ❌ Lộ gallery ở production nav / route `/`.

## 3. Checklist
- [ ] Tabs underline + segmented; count badge nhãn đọc được; active primary+medium.
- [ ] Keyboard ←/→/Home/End (Radix); `aria-selected`.
- [ ] Gallery render đủ 8 component (Dialog gồm modal+drawer) × variant/state; toggle light/dark.
- [ ] Gallery trong `(dev)`, không lộ `/` / nav production.
- [ ] Token-only; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/ui/Tabs.{tsx,css}` | NEW | underline+segmented+count |
| `src/components/ui/index.ts` | MODIFY | export Tabs |
| `src/app/(dev)/ui-gallery/page.tsx` | NEW | gallery dev-only |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Gallery lộ production | Medium | `(dev)` group + gate khỏi nav (`TechnicalStack §1`). |
| Tự quản tab state bỏ aria | Medium | Giữ Radix Tabs (Locked #1). |
| Count badge chỉ chấm màu | Low | Badge icon+chữ + `aria-label` số. |
| File gallery > 200 dòng | Low | Tách section theo nhóm component. |

## 6. Verification Plan
- Tabs: ←/→ chuyển tab; underline trượt; segmented đổi nền; count badge cập nhật.
- Gallery hiển thị mọi state; light/dark toggle đúng (severity-bg override dark).
- Truy cập `/` vẫn là workspace, gallery chỉ ở route dev.
- 4 gates xanh.

## 7. Status

`DONE`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ui): add Tabs on radix (underline/segmented/count)`; `feat(ui): add dev-only component gallery`; `docs(ui): commit w13d contract`.
