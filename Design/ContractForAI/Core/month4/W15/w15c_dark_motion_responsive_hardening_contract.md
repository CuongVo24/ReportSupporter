# Contract For AI - W15 Group C: Dark / Motion / Responsive Hardening

> **Lane / Week:** Core / Month 4 / W15 - Day 3 (`Design/TaskBrief/Core/month4/w15.md` `[C160]`-`[C161]`).
> **Branch:** `feature/W15-ui-hardening`.
> **Builds on:** W14 dark/microcopy/motion áp (`w14d`), W14 responsive shell (`w14a`), `DesignSystem_Tokens.md §2.5/§7`, `Frontend/Other/Motion.md`, `Frontend/4.Layouts/Responsive.md`.
> **Depended on by:** Group E (evidence light/dark × viewport), đóng Phase 4.
> **Sources:** `w15.md` Locked #1/#5, `MasterRoadMap.md` W15, `0.ArtDirection.md §2` (report bất biến).

---

## 1. Micro-task Target

**Hardening dark + motion + responsive** toàn surface: verify override token dark (`§2.5`), motion ≤200ms/`prefers-reduced-motion`, responsive ≥3 viewport (split→toggle, drawer, A4 scale-to-fit) — fix **tối thiểu**. `--rs-report-*` bất biến.

> **🔒 Report bất biến (Locked #5).** `--rs-report-*`/A4 deterministic khi dark.
> **🔒 Verify + fix tối thiểu (Locked #1).**

## 2. Scope

### In scope (`[C160]`/`[C161]`)
- Dark (MODIFY CSS nếu cần): mọi surface dùng token UI override `§2.5`; severity-bg override (không chói); focus ring rõ trên nền tối; `--rs-report-*` không đổi.
- Contrast (MANUAL/VISUAL): vì axe-jsdom không cover `color-contrast`, kiểm thủ công focus ring, text/button/badge/toast/dialog trên dark surface; ghi pass/fix vào W15 QA report.
- Motion (MODIFY CSS nếu cần): transition ≤200ms ease-out; `prefers-reduced-motion` tắt slide/scale/shimmer.
- Responsive (MODIFY layout nếu cần): ≥3 viewport — split→toggle/tab khi hẹp, panel phụ → drawer, tờ A4 scale-to-fit không méo.

### Out of scope
- ❌ Axe (Group A), Visual QA §11 (B), edge-state (D).
- ❌ Đụng `--rs-report-*`/pipeline; animation lib; feature mới.

## 3. Checklist
- [ ] Dark: token UI override mọi surface; severity-bg dịu; focus ring rõ.
- [ ] Manual contrast check pass cho dark/focus (axe-jsdom không cover `color-contrast`).
- [ ] `--rs-report-*` bất biến khi dark (báo cáo trắng-đen).
- [ ] Motion ≤200ms; reduced-motion honored.
- [ ] Responsive ≥3 viewport: toggle/drawer/A4 scale-to-fit không méo.
- [ ] Fix tối thiểu; 4 gates + axe 0 critical (cả dark).

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/globals.css` / component `.css` | MODIFY (nếu cần) | dark override + motion |
| `src/components/*` (shell/responsive) | MODIFY (nếu cần) | viewport hardening |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Report đổi màu khi dark | High | `--rs-report-*` không override (Locked #5). |
| Dark chói severity-bg | Medium | Override `§2.5` bắt buộc; verify hai theme. |
| "Axe 0 critical" che mất lỗi contrast | Medium | Contrast là manual/visual gate ở W15C/W15E; không dựa vào axe-jsdom. |
| Responsive vỡ A4 | Medium | scale-to-fit không méo; test ≥3 viewport. |
| Motion phô trương | Low | ≤200ms + reduced-motion. |

## 6. Verification Plan
- Toggle dark: UI đổi, severity-bg dịu, focus ring rõ; A4 preview vẫn trắng-đen.
- Manual contrast pass/fix cho text/button/badge/focus trên dark; ghi rõ không lấy từ axe-jsdom.
- reduced-motion → tắt slide/shimmer.
- Thu hẹp viewport ×3: toggle/drawer/A4 không méo.
- 4 gates + axe 0 critical trên light/dark; contrast manual pass/fix ghi riêng.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(ui): dark/motion/responsive hardening (token, minimal)`; `docs(ui): commit w15c contract`.
