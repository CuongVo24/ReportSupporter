# Contract For AI - W13 Group C: Overlays (Dialog variants · Toast)

> **Lane / Week:** Core / Month 4 / W13 - Day 3 (`Design/TaskBrief/Core/month4/w13.md` `[C140]`-`[C141]`).
> **Branch:** `feature/W13-ui-foundation`.
> **Builds on:** Group A (Button), `@radix-ui/react-dialog` · `@radix-ui/react-toast`, `Frontend/2.Components/Dialog.md` · `Toast.md`, `Frontend/Other/Motion.md`, `DesignSystem_Tokens.md` §4.3/§4.4.
> **Depended on by:** W14 (confirm export/xoá, toast export-done, error+retry).
> **Sources:** `w13.md` Locked #1/#2, `MasterRoadMap.md` W13, `0.ArtDirection.md` §4 (motion tiết chế), `VoiceAndContent.md §6/§7`.

---

## 1. Micro-task Target

Build hai overlay primitive: **Dialog** (Radix Dialog — variants modal · **drawer** trượt phải · confirm; backdrop-close có điều kiện) và **Toast** (Radix Toast — Viewport dưới-phải, success/info/error, auto-dismiss 4s trừ error, action + stacking). **Drawer là variant của Dialog**, không phải overlay primitive tách rời.

> **🔒 Giữ a11y Radix.** focus-trap/Esc/return-focus (Dialog), role/aria-live (Toast) — chỉ style token.
> **🔒 Motion tiết chế (≤200ms) + reduced-motion (`Motion.md`).**
> **🔒 Backdrop-close có điều kiện (B9).** Form thường đóng; confirm phá huỷ **chặn**.

## 2. Scope

### In scope (`[C140]`/`[C141]`)
- `src/components/ui/Dialog.{tsx,css}` (**NEW**): export `Dialog` với variant `drawer` (có thể có alias `Drawer` nếu API thuận tiện); overlay `--rs-z-overlay`, content `--rs-z-modal`/radius lg/`--rs-elevation-3`; footer 1 primary; close icon `X` (`aria-label`); confirm chặn backdrop-close.
- `src/components/ui/Toast.{tsx,css}` (**NEW**): `ToastProvider` + `Viewport` (dưới-phải, `--rs-z-toast`); variants success(`CheckCircle2`)/info(`Info`)/error(`XCircle`); 4s auto-dismiss (error không tự tắt); hover-pause; action button; stack ≤3.
- Export qua `ui/index.ts`. (Provider mount ở root là **W14** — tuần này chỉ primitive + gallery render.)

### Out of scope
- ❌ Mount Provider vào layout thật (W14 C146).
- ❌ Tabs/gallery (Group D); refactor panel.
- ❌ Animation lib (CSS thuần).

## 3. Checklist
- [ ] Dialog modal/drawer/confirm; 1 primary footer; close có aria-label.
- [ ] Backdrop-click: form đóng / confirm phá huỷ **chặn** (B9).
- [ ] Focus-trap/Esc/return-focus (Radix) hoạt động; `role=dialog`+`aria-labelledby`.
- [ ] Toast Viewport dưới-phải; success/info/error icon+chữ.
- [ ] 4s auto-dismiss; **error không tự tắt**; hover-pause; action + stack ≤3.
- [ ] `role=status`/`aria-live` (error `assertive`); motion ≤200ms + reduced-motion.
- [ ] Token-only; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/ui/Dialog.{tsx,css}` | NEW | Dialog variants: modal/drawer/confirm |
| `src/components/ui/Toast.{tsx,css}` | NEW | Provider/Viewport + variants |
| `src/components/ui/index.ts` | MODIFY | export overlays |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Mất focus-trap khi override | Medium | Giữ Radix primitive; chỉ style (Locked #1). |
| Confirm phá huỷ đóng do click ngoài | Medium | Chặn backdrop-close ở confirm (B9). |
| Error toast tự tắt mất thông tin | Medium | error = không auto-dismiss (Toast.md §3). |
| Motion phô trương | Low | ≤200ms + reduced-motion (`Motion.md`). |
| File > 200 dòng | Low | Tách subcomponent/variant + `.css`. |

## 6. Verification Plan
- Dialog: Tab bị trap trong dialog; Esc đóng; focus trả về trigger; drawer trượt phải.
- Confirm phá huỷ: click backdrop **không** đóng.
- Toast: success tự tắt 4s; error ở lại; hover dừng giờ; stack nhiều cái.
- Reduced-motion → fade; grep no-hex; 4 gates xanh.

## 7. Status

`DONE`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ui): add Dialog variants on radix (focus-trap/token)`; `feat(ui): add Toast on radix (bottom-right/stack/a11y)`; `docs(ui): commit w13c contract`.
