# 🚀 MONTH 2 SUMMARY: SUBMISSION MVP / EVIDENCE MVP (W5-W8)

> Phase 2 of `Design/RoadMap/MasterRoadMap.md`. Covers Week 5 → Week 8.

---

## 🎯 Phase Goal

**Raise the report from "exports correctly" to "submits convincingly."**

Tháng 1 đóng được vòng **Core MVP** (write→format→check→export). Tháng 2 nâng **chất lượng** và **bằng chứng** làm cột mốc **Submission MVP / Evidence MVP**: quản lý evidence + QR, đa template báo cáo thật, định dạng học thuật cứng cáp (page-break/LoF/LoT/references), và đóng gói nộp hoàn chỉnh (`evidence.zip`, `README.md`, submission checklist, export history). Vẫn tuyệt đối không login/cloud/realtime/AI (`ProductPRD.md` §6).

---

## 📅 The 4 Weeks

### 🔗 Week 5: Evidence Kit
*Trọng tâm: link bằng chứng có cấu trúc + QR.*
- Evidence link manager (8 loại: video/GitHub/deploy/slide/Figma/Drive/test account/API docs).
- Evidence appendix table tự sinh, xuất 3 format.
- QR code mỗi link (`qrcode`). Checker evidence-gaps đối chiếu dữ liệu thật.

### 📚 Week 6: Advanced Templates
*Trọng tâm: phủ các loại báo cáo thật.*
- 4 template: software project (full) · lab · internship · README-to-report.
- Reusable section: member responsibility table + project timeline.
- Mỗi template khai báo `requiredSections` cho checker.

### 📐 Week 7: Format Hardening
*Trọng tâm: output chuẩn typeset học thuật.*
- Caption normalization + caption registry; list of figures + list of tables.
- References section rules. PDF page-break (chapter sang trang). DOCX layout checklist.

### 📦 Week 8: Submission Package
*Trọng tâm: gói nộp hoàn chỉnh.*
- `evidence.zip` + `README.md` generator.
- Final submission checklist (checker + format + evidence).
- Export history lưu local.

---

## 🏁 Key Milestones

- **M2.1 (W5):** Evidence kit + QR + appendix xuất 3 format.
- **M2.2 (W6):** 4 template + README import + required-sections checker.
- **M2.3 (W7):** PDF/DOCX đạt chuẩn typeset (caption/LoF/LoT/page-break).
- **M2.4 (W8):** Submission package + checklist + export history hoàn chỉnh.

---

## 📦 Cumulative Deliverables (cuối Tháng 2, cộng dồn Tháng 1)

- Toàn bộ Core MVP loop Tháng 1 (write/format/check/export) còn xanh.
- Evidence kit: manager + appendix + QR + checker hook.
- Thư viện 4 template + 2 reusable section + README import.
- Format cứng: caption registry, LoF/LoT, references rules, PDF page-break, DOCX layout checklist.
- Submission package: `evidence.zip`, `README.md`, final submission checklist, export history local.
- Evidence: `Design/Reports/Month2/W5..W8/` (QA, samples evidence/template/format/package).

---

## ⚠️ Phase-level Risks

| Risk | Level | Mitigation |
|---|---|---|
| Caption/numbering lệch giữa body, LoF/LoT, PDF, DOCX | High | Một caption-registry + một numbering source feed tất cả. |
| Template/evidence trượt sang "convert mọi định dạng" hoặc cloud | High | Bám Non-goals; chỉ README/Markdown input, file local only. |
| Cần lib zip ngoài stack ở W8 | Medium | Ưu tiên cơ chế trong stack; cần lib mới → xin approve (`VibeCode.md` §4). |
| Checker offline bị phá khi validate evidence | High | Chỉ validate cú pháp URL, không fetch mạng. |
| Solo dev gánh nặng hardening đa template | Medium | Vitest cho rules + template generator giữ regression-safe. |

---

## ✅ Phase Exit Criteria

- [ ] Cả 4 tuần đạt Definition of Done riêng.
- [ ] `npm run lint` + `typecheck` + `build` xanh; `Vitest` xanh toàn bộ rules + generators.
- [ ] Evidence kit + QR + appendix xuất nhất quán 3 format.
- [ ] 4 template chọn được, sinh skeleton đúng, checker đối chiếu required sections.
- [ ] PDF page-break + caption + LoF/LoT + DOCX layout đạt chuẩn trên sample đa template.
- [ ] Submission package (`evidence.zip` + `README.md` + checklist) + export history hoạt động local.
- [ ] Không vi phạm Non-goals; không import lậu lib ngoài stack.
- [ ] Acceptance evidence đầy đủ trong `Design/Reports/Month2/`.
