# 📅 WEEK 12: BETA READINESS

> Phase 3 — Present & AI Layer (W9-W12). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 12.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Prove the whole product works end-to-end, then ship a public demo.*

Tuần đóng **phần lõi Phase 1–3**: chạy **kịch bản end-to-end** một báo cáo dự án thật (template → metadata → write → check → format → evidence → export → present), **validate exports** trên nhiều sample, **polish UI states + accessibility (checklist thủ công)**, và chuẩn bị **public demo + README evidence**. Không thêm tính năng lớn — tuần này là ổn định, đánh bóng, và chứng minh. **Không phải hết dự án:** Phase 4 (W13–W15) đầu tư frontend nối tiếp (`MasterRoadMap §Phase 4`).

Mục tiêu chốt từ MasterRoadMap:
- Run end-to-end project report scenario.
- Validate exports on sample reports.
- Polish UI states and accessibility.
- Prepare public demo and README evidence.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** không module mới — tích hợp + ổn định toàn bộ Module 1-5.
- **Depends on:** tất cả W1-W11.
- **Depended on by:** Phase 4 (W13–W15 — UI investment trên app beta-ready).
- **Đo theo:** `ProductPRD.md` §7 Success Criteria (skeleton <2 phút, export 3 format, checker concrete, first screen là workspace).

---

## 3. 🔭 Scope

### ✅ In scope
- End-to-end scenario: chạy trọn 1 báo cáo dự án từ đầu đến gói nộp + present.
- Validate exports (HTML/PDF/DOCX) trên nhiều sample report (đa template W6).
- Polish UI states: loading / empty / error / success cho mọi panel.
- Accessibility pass: keyboard nav, focus, contrast, aria cơ bản.
- Public demo prep + README evidence (demo workspace, không marketing page).

### ⛔ Out of scope
- Tính năng mới (feature freeze tuần cuối).
- Cloud deploy bắt buộc / login (Non-goal).
- Playwright E2E (Deferred — `TechnicalStack.md` §7, chưa cài MVP; verify thủ công + scenario script).
- AI bắt buộc trong demo (AI optional — demo phải chạy được khi tắt AI).

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W12-beta-readiness`.

### Day 1 — End-to-end Scenario
- `[NEW]` `Design/Reports/Month3/W12/e2e_scenario.md` (kịch bản trọn vòng, từng bước)
- Chạy: chọn template → metadata → skeleton → write → check → format → evidence → export 3 format → present outline/script.
- Ghi lỗi phát hiện thành issues fix trong tuần.

### Day 2 — Export Validation
- Validate HTML/PDF/DOCX trên ≥3 sample (software/lab/internship template).
- `[MODIFY]` các exporter nếu phát hiện lệch (caption/page-break/cover) — localized fix.
- `[NEW]` `Design/Reports/Month3/W12/export_validation.md`

### Day 3 — UI States Polish
- `[MODIFY]` các panel (`EditorPanel`, `PreviewPanel`, `CheckerPanel`, `ExportPanel`, `PresentPanel`) — loading/empty/error/success nhất quán.
- `[MODIFY]` `src/components/WorkspaceLayout.tsx` (đảm bảo first screen = workspace, `ProductPRD.md` §7).

### Day 4 — Accessibility
- `[MODIFY]` components dùng chung — keyboard nav, focus ring, aria-label, contrast.
- `[NEW]` `Design/Reports/Month3/W12/a11y_checklist.md`

### Day 5 — Public Demo & README Evidence
- `[NEW]` README evidence (demo workspace, ảnh chụp, export samples) trong `Design/Reports/Month3/W12/`.
- `[NEW]` `Design/Reports/Month3/W12/W12_Beta_Acceptance_Report.md`, `build_output.txt`
- Final build + lint + typecheck + Vitest gate.

---

## 5. 📦 Dependencies installed this week

> Không cài lib mới — tuần ổn định/đánh bóng, không feature mới.

| Library | Why | Stack ref |
|---|---|---|
| *(none new)* | Feature freeze; Playwright E2E vẫn Deferred (verify thủ công) | §7 |

---

## 6. 📤 Deliverables

- End-to-end scenario chạy thông + issues fix.
- Export validation trên đa template sample.
- UI states (loading/empty/error/success) nhất quán mọi panel.
- Accessibility checklist pass cơ bản.
- Public demo prep + README evidence.
- `Design/Reports/Month3/W12/` Beta acceptance report + samples + build log.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Phát hiện lỗi tích hợp muộn ở tuần cuối | High | Feature freeze; chỉ localized fix; ưu tiên đường E2E chính. |
| Export lệch trên template ít test | Medium | Validate đa template (W6) ngày 2; sửa exporter có kiểm soát. |
| Demo phụ thuộc AI (optional) | Medium | Demo chạy được khi tắt AI; AI chỉ là điểm cộng. |
| First screen trượt thành landing | Medium | Kiểm `/` = workspace (`ProductPRD.md` §7, `TechnicalStack.md` §1). |
| Thiếu evidence cho beta | Low | Chuẩn hoá README evidence + acceptance report trong `Design/Reports/`. |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` + `typecheck` + `build` xanh.
- [ ] `Vitest` xanh toàn bộ (checker rules + generators).
- [ ] End-to-end scenario chạy trọn vòng không chặn.
- [ ] Export HTML/PDF/DOCX validate trên ≥3 template sample.
- [ ] UI states (loading/empty/error/success) nhất quán mọi panel.
- [ ] Accessibility checklist cơ bản pass (keyboard/focus/contrast/aria).
- [ ] First screen = workspace; demo chạy được khi tắt AI.
- [ ] Public demo + README evidence + Beta acceptance report tại `Design/Reports/Month3/W12/`.
- [ ] Success Criteria `ProductPRD.md` §7 đối chiếu đạt.
- [ ] Commit kèm contract, branch `feature/W12-beta-readiness`.
