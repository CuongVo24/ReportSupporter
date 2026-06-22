# 📅 WEEK 9: SLIDE OUTLINE

> Phase 3 — Present & AI Layer (W9-W12). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 9.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Turn a finished report into a presentation skeleton.*

Tuần 9 mở Phase 3 (Module 5 — Present). Báo cáo đã hoàn chỉnh (Phase 1+2) giờ trở thành nguyên liệu cho buổi bảo vệ. Tuần này sinh **slide outline** từ section flow của report (giữ đúng chapter flow — `Modules/5.Present.md` Acceptance), thêm **presentation timeline** (phân bổ thời gian từng phần), và cho phép **assign speakers** theo section.

Mục tiêu chốt từ MasterRoadMap:
- Generate slide outline from report sections.
- Add presentation timeline.
- Assign speakers to sections.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** khởi tạo Module 5 — Present (`src/modules/present`).
- **Depends on:** W3 (heading numbering/TOC để lấy section flow), W6 (member metadata để assign speaker), W7 (caption registry để slide tham chiếu figure).
- **Depended on by:** W10 (script + Q&A bám slide outline), W12 (beta demo dùng slide outline).
- **Lưu ý:** Module 5 "not part of first MVP" (`Modules/5.Present.md`) — chỉ bắt đầu ở Phase 3, đúng MasterRoadMap.

---

## 3. 🔭 Scope

### ✅ In scope
- Slide outline generator: report sections → slide outline (giữ chapter flow).
- Present types (`SlideOutline`, `SlideItem`, `SpeakerAssignment`, `PresentationTimeline`).
- Presentation timeline: phân bổ thời lượng cho từng phần/slide.
- Assign speakers: gán member (từ metadata) cho section/slide.
- Present panel UI trong workspace (xem/sửa outline, timeline, speaker).

### ⛔ Out of scope
- Export `slides.pptx` (`pptxgenjs` là Deferred — bật khi Module Present export, không bắt buộc tuần này; nếu làm phải đúng W chỉ định).
- Speaker script + Q&A (→ W10).
- AI sinh outline (→ W11 optional).
- Realtime co-present (Non-goal).

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W9-slide-outline`.

### Day 1 — Present Types
- `[NEW]` `src/types/present.ts` (`SlideOutline`, `SlideItem`, `SpeakerAssignment`, `PresentationTimeline`)
- `[MODIFY]` `src/types/schemas.ts` (zod cho present data)
- `[NEW]` `src/modules/present/index.ts` (public surface)

### Day 2 — Slide Outline Generator
- `[NEW]` `src/modules/present/generate-outline.ts` (sections + numbering → `SlideOutline`)
- `[NEW]` `src/modules/present/generate-outline.test.ts` (giữ đúng chapter flow)
- *Lý do:* "Slide outline keeps the same chapter flow as the report" (`Modules/5.Present.md`).

### Day 3 — Presentation Timeline
- `[NEW]` `src/modules/present/timeline.ts` (phân bổ thời lượng theo số slide/độ dài section)
- `[NEW]` `src/modules/present/TimelinePanel.tsx`

### Day 4 — Speaker Assignment
- `[NEW]` `src/modules/present/assign-speakers.ts` (map member metadata → section/slide)
- `[NEW]` `src/modules/present/SpeakerAssignPanel.tsx`

### Day 5 — Present Panel & QA
- `[NEW]` `src/modules/present/PresentPanel.tsx` (outline + timeline + speaker trong một panel)
- `[MODIFY]` `src/components/WorkspaceLayout.tsx` (mở tab/panel Present)
- `[NEW]` `Design/Reports/Month3/W9/W9_QA_Report.md`, `outline_samples.md`, `build_output.txt`

---

## 5. 📦 Dependencies installed this week

> Không cài lib mới — outline/timeline/speaker là logic trên dữ liệu report đã có.

| Library | Why (this week) | Stack ref |
|---|---|---|
| *(none new)* | Present đọc sections/numbering/metadata sẵn có; chưa export pptx tuần này | §8 (`pptxgenjs` Deferred — chưa cài) |

> `pptxgenjs` vẫn ở Deferred (`TechnicalStack.md` §8); chỉ cài khi làm export slides và phải xin approve.

---

## 6. 📤 Deliverables

- Present types + zod schema.
- Slide outline generator giữ đúng chapter flow (+ Vitest).
- Presentation timeline (phân bổ thời lượng).
- Speaker assignment theo member metadata.
- Present panel trong workspace.
- `Design/Reports/Month3/W9/` QA + outline samples.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Outline không khớp chapter flow của report | High | Sinh từ cùng heading numbering (W3); Vitest kiểm chapter flow. |
| Timeline phân bổ phi thực tế | Low | Cho user chỉnh tay; default dựa độ dài section. |
| Speaker assign khi metadata thiếu member | Medium | Fallback "unassigned"; checker có thể nhắc bổ sung. |
| Tự ý thêm `pptxgenjs` chưa approve | Medium | Giữ Deferred; export pptx tách riêng, xin approve trước. |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` + `typecheck` + `build` xanh.
- [ ] `Vitest` xanh (outline generator giữ chapter flow).
- [ ] Slide outline sinh từ report sections, đúng thứ tự chapter.
- [ ] Timeline phân bổ thời lượng, chỉnh được.
- [ ] Speaker assign theo member metadata.
- [ ] Present panel hiển thị trong workspace.
- [ ] Không cài `pptxgenjs` hay lib ngoài stack khi chưa approve.
- [ ] Evidence tại `Design/Reports/Month3/W9/`.
- [ ] Commit kèm contract, branch `feature/W9-slide-outline`.
