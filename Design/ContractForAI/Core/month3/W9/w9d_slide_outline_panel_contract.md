# Contract For AI - W9 Group D: Slide Outline Panel

> **Lane / Week:** Core / Month 3 / W9 - Day 4 (`Design/TaskBrief/Core/month3/w9.md` `[C102]`-`[C103]`).
> **Branch:** `feature/W9-slide-outline`.
> **Builds on:** Group A (`generateSlideOutline`), Group B (`buildTimeline`), Group C (`buildSpeakers`/`assignSlides`), `src/components/Workspace.tsx`, design tokens (`DesignSystem_Tokens.md`, `var(--rs-*)`).
> **Depended on by:** Group E (QA), W10 (panel mở rộng cho script/Q&A).
> **Sources:** `w9.md` Locked Decisions #1/#3, `MasterRoadMap.md` W9, `5.Present.md §4` (Slide outline view / Speaker assignment / Timeline panel), `DesignSystem_Tokens.md`.

---

## 1. Micro-task Target

Dựng **Present panel** hiển thị slide outline theo dòng chương mục (title + bullets), timeline (thời lượng + cảnh báo vượt), và gán speaker cho slide. Đọc dữ liệu Groups A–C; sửa bullets/gán người tại chỗ (state cục bộ). Offline, client.

> **🔒 Hiển thị/điều phối, không sinh lại logic (Locked #1).** Panel gọi `generateSlideOutline`/`buildTimeline`/`buildSpeakers` (A–C); không nhúng lại thuật toán.
> **📌 Surfaces thực tế.** Component mới trong `src/modules/present/` + wiring `Workspace.tsx`; CSS chỉ `var(--rs-*)`; render đọc canonical bundle.

## 2. Scope

### In scope (`[C102]`/`[C103]`)
- `src/modules/present/PresentPanel.tsx` (**NEW**): tab/khối "Trình bày" — danh sách `SlideOutline` (title + bullets, sửa bullets được), timeline (`totalSeconds`/slot + badge cảnh báo khi `overLimit`), dropdown gán speaker mỗi slide (từ `buildSpeakers`).
- `src/modules/present/SlideOutlineView.tsx` (**NEW**, nếu tách để ≤200 dòng): render một slide.
- `src/components/Workspace.tsx` (MODIFY): render `PresentPanel`, truyền `bundle` (sections + metadata + evidence).
- `src/modules/present/index.ts` (MODIFY): export panel.
- Vitest (component ở mức khả thi): panel render đúng số slide từ outline; badge `overLimit` hiện khi vượt; chọn speaker cập nhật gán hiển thị.

### Out of scope
- ❌ Sinh outline/timeline/speaker logic (Groups A–C — chỉ gọi).
- ❌ Script/Q&A view (→ W10).
- ❌ Export PPTX/PDF slides (`pptxgenjs` DEFERRED).
- ❌ Persist present state vào IDB (tuần này state cục bộ; persist là việc sau nếu cần).
- ❌ Dep mới / network.

## 3. Checklist
- [x] `PresentPanel`: outline (title+bullets, sửa được) + timeline (+ badge over-limit) + gán speaker.
- [x] Gọi Groups A–C; không nhúng lại logic.
- [x] Wiring `Workspace.tsx`; CSS chỉ `var(--rs-*)`.
- [x] ≤200 dòng/file (tách `SlideOutlineView` nếu cần).
- [x] Component test: số slide / over-limit badge / chọn speaker.
- [x] 4 gates xanh.

## 4. Expected Interfaces / Files

> UI wiring tiêu thụ public surface Groups A–C; không thêm interface logic mới.

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/present/PresentPanel.tsx` | NEW | outline + timeline + speaker |
| `src/modules/present/SlideOutlineView.tsx` | NEW (nếu cần) | render 1 slide (giữ ≤200 dòng) |
| `src/components/Workspace.tsx` | MODIFY | render panel + truyền bundle |
| `src/modules/present/index.ts` | MODIFY | export panel |
| `src/modules/present/PresentPanel.test.tsx` | NEW | slide count / over-limit / speaker select |

> **Import boundary:** panel import `@/modules/present` (A–C) + `@/types`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---|---|
| Nhúng lại thuật toán outline trong UI | Medium | Panel chỉ gọi A–C; logic ở module (Locked #1). |
| File > 200 dòng | Low | Tách `SlideOutlineView`; panel mỏng. |
| CSS lệch token | Low | Chỉ `var(--rs-*)` (`DesignSystem_Tokens.md`). |
| State sửa bullets mất khi reload | Low | Chấp nhận (state cục bộ W9); persist là task sau nếu cần. |

## 6. Verification Plan
- Mở panel: số slide = outline; title/bullets đúng dòng chương mục.
- Timeline hiện tổng thời lượng; vượt giới hạn → badge cảnh báo.
- Chọn speaker cho slide → hiển thị gán cập nhật.
- preview: panel render đúng, không lỗi console.
- lint/typecheck/test/build xanh.

## 7. Status

`DONE`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(present): slide outline + timeline + speaker panel`; +1 docs commit.
