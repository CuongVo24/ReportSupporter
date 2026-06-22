# 🚀 MONTH 3 SUMMARY: PRESENT & AI LAYER (W9-W12)

> Phase 3 of `Design/RoadMap/MasterRoadMap.md`. Covers Week 9 → Week 12.

---

## 🎯 Phase Goal

**Take the finished report to the stage — then ship beta.**

Tháng 1 đóng MVP loop, Tháng 2 nâng chất lượng + bằng chứng. Tháng 3 mở Module 5 (Present): biến báo cáo thành tài liệu bảo vệ (slide outline, script, Q&A), thêm **lớp AI tùy chọn** (chỉ W11, behind explicit action), rồi **khoá beta** với end-to-end scenario + public demo. Nguyên tắc xuyên suốt: AI luôn optional, user content control luôn hiển thị, không login/cloud/realtime (`ProductPRD.md` §6).

---

## 📅 The 4 Weeks

### 🎞️ Week 9: Slide Outline
*Trọng tâm: report → presentation skeleton.*
- Slide outline generator giữ chapter flow của report.
- Presentation timeline (phân bổ thời lượng) + speaker assignment theo member.

### 🗣️ Week 10: Script & Q&A
*Trọng tâm: luyện bảo vệ.*
- Speaker script (tham chiếu screenshots/evidence) + defense Q&A (project-report focused).
- Weak-section review hints từ checker issues + readiness score. Vẫn deterministic, chưa AI.

### 🤖 Week 11: Optional AI Assistant
*Trọng tâm: AI tùy chọn, do user kiểm soát.*
- AI flag default OFF; outline assist / section rewrite / academic tone — chỉ chạy sau explicit action.
- User content control luôn hiển thị (gốc + diff + undo). Provider/SDK ngoài stack → cần approve.

### ✅ Week 12: Beta Readiness
*Trọng tâm: chứng minh + ship.*
- End-to-end scenario + export validation đa template.
- UI states polish + accessibility + public demo + README evidence.

---

## 🏁 Key Milestones

- **M3.1 (W9):** Slide outline + timeline + speaker từ report.
- **M3.2 (W10):** Script + Q&A + weak-section hints (deterministic).
- **M3.3 (W11):** AI optional layer (explicit action, off-state app vẫn đủ tính năng).
- **M3.4 (W12):** Beta acceptance — E2E pass, export validated, demo + README evidence.

---

## 📦 Cumulative Deliverables (cuối Tháng 3 — toàn dự án)

- Toàn bộ Tháng 1 (MVP loop) + Tháng 2 (evidence/templates/format/package) còn xanh.
- Module 5 (Present): slide outline, timeline, speaker, script, Q&A, weak-section hints.
- Lớp AI optional: outline assist / rewrite / tone, flag OFF mặc định, user control visible.
- Beta: end-to-end scenario, export validation đa template, UI states, accessibility, public demo, README evidence.
- Evidence: `Design/Reports/Month3/W9..W12/` (QA, outline/script/qa samples, AI control evidence, beta acceptance).

---

## ⚠️ Phase-level Risks

| Risk | Level | Mitigation |
|---|---|---|
| AI biến thành bắt buộc / tự ghi đè | High | Flag OFF mặc định, explicit action, accept/reject; off-state test (`MasterRoadMap` W11). |
| Cài AI provider/SDK ngoài stack không approve | High | Contract-first + approve; gateway provider-agnostic (`TechnicalStack.md` AI RULE). |
| Present outline lệch chapter flow report | Medium | Sinh từ heading numbering W3; Vitest kiểm flow. |
| Lỗi tích hợp lộ muộn ở W12 | High | Feature freeze W12, localized fix, ưu tiên E2E chính. |
| Demo trượt thành landing / phụ thuộc AI | Medium | First screen = workspace; demo chạy được khi tắt AI. |

---

## ✅ Phase Exit Criteria (= Project Beta Exit)

- [ ] Cả 4 tuần đạt Definition of Done riêng.
- [ ] `npm run lint` + `typecheck` + `build` xanh; `Vitest` xanh toàn bộ.
- [ ] Present: outline + timeline + speaker + script + Q&A + weak-section hints hoạt động.
- [ ] AI optional: flag OFF mặc định, explicit action, accept/reject, user control visible; off-state app vẫn đủ tính năng.
- [ ] Không cài lib/SDK ngoài stack khi chưa approve.
- [ ] End-to-end project report scenario chạy trọn vòng; export 3 format validate đa template.
- [ ] UI states + accessibility pass; first screen = workspace.
- [ ] Public demo + README evidence + Beta acceptance report trong `Design/Reports/Month3/W12/`.
- [ ] `ProductPRD.md` §7 Success Criteria đối chiếu đạt; Non-goals §6 không vi phạm.
