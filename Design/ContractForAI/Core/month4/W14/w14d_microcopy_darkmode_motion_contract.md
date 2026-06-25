# Contract For AI - W14 Group D: Microcopy · Dark Mode · Motion Polish

> **Lane / Week:** Core / Month 4 / W14 - Day 4 (`Design/TaskBrief/Core/month4/w14.md` `[C152]`-`[C153]`).
> **Branch:** `feature/W14-ui-adoption`.
> **Builds on:** Group A–C (UI đã adopt), `Frontend/Other/VoiceAndContent.md`, `Frontend/Other/Motion.md`, `DesignSystem_Tokens.md §2.5` (dark).
> **Depended on by:** Group E (visual QA trên copy/dark/motion cuối).
> **Sources:** `w14.md` Locked #1/#5, `MasterRoadMap.md` W14, `0.ArtDirection.md` §9 (giọng), §2 (report bất biến).

---

## 1. Micro-task Target

Pass cuối **microcopy** toàn UI (`VoiceAndContent.md`), **dark mode** polish (override token UI `§2.5`), và **motion** ≤200ms + `prefers-reduced-motion`. Report Output bất biến.

> **🔒 Dark chỉ vỏ UI (Locked #5).** Override `[data-theme="dark"]`; severity-bg bắt buộc override; `--rs-report-*` không đổi.
> **🔒 Việt 100%** (giữ Markdown/PDF/DOCX/HTML/TOC); không emoji copy vận hành.

## 2. Scope

### In scope (`[C152]`/`[C153]`)
- Microcopy (MODIFY text-only): nhãn nút = động từ, message lỗi giúp-đỡ, empty-state, toast/confirm — theo `VoiceAndContent.md §2–§7`.
- Dark mode (MODIFY CSS): verify mọi surface dùng token UI semantic; severity-bg override (không chói); focus ring rõ trên nền tối.
- Motion (MODIFY CSS): transition ≤200ms ease-out; `prefers-reduced-motion` tắt slide/scale/shimmer. Bổ sung `--rs-motion-*` vào token nếu cần (Single Source).

### Out of scope
- ❌ Đổi logic/shape; thêm component.
- ❌ Đụng `--rs-report-*` / preview A4 (bất biến — Locked #3 tuần).
- ❌ Animation lib.

## 3. Checklist
- [ ] Nhãn nút động từ; message lỗi giúp-đỡ; empty/toast/confirm copy chuẩn.
- [ ] Việt 100% (giữ thuật ngữ); không emoji vận hành.
- [ ] Dark: token UI override; severity-bg override (không chói); focus ring rõ.
- [ ] `--rs-report-*` không đổi khi dark (báo cáo trắng-đen).
- [ ] Motion ≤200ms; reduced-motion honored; token motion nếu thêm.
- [ ] 4 gates + axe 0 critical (cả dark).

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/**`, `src/modules/**` (text) | MODIFY | microcopy |
| `src/app/globals.css` / component `.css` | MODIFY | dark override + motion |
| `DesignSystem_Tokens.md` | MODIFY (nếu cần) | thêm `--rs-motion-*` |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Dark làm chói severity-bg | Medium | Override `§2.5` bắt buộc; verify hai theme (Locked #5). |
| Report đổi màu khi dark | High | `--rs-report-*` không override (Locked #3). |
| Copy đổi nghĩa/giọng sai | Medium | Theo `VoiceAndContent.md`; không hô hào. |
| Motion phô trương | Low | ≤200ms + reduced-motion. |
| Hardcode màu dark | Low | Token-only; grep no-hex. |

## 6. Verification Plan
- Toggle dark: UI đổi, severity-bg dịu, focus ring rõ; tờ A4 preview vẫn trắng-đen.
- Đọc soát nhãn nút/message: động từ, giúp-đỡ, Việt 100%.
- reduced-motion: tắt slide/shimmer.
- 4 gates + axe 0 critical (light+dark).

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `style(ui): apply microcopy (vi) across surfaces`; `style(ui): dark mode + motion polish (token)`; `docs(ui): commit w14d contract`.
