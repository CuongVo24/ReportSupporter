# 📅 WEEK 6: ADVANCED TEMPLATES

> Phase 2 — Report Quality & Evidence (W5-W8). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 6.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Cover the real report types students actually submit.*

Tuần 5 đã có 1 template ("Software project report" từ W1). Tuần 6 mở rộng thư viện template để phủ các loại báo cáo thật: lab report, internship report, README-to-report; đồng thời thêm các section chuẩn **member responsibility** và **timeline** dùng chung. Mỗi template vẫn đi qua cùng skeleton generator (W2) và checker (W3) — không nhánh logic riêng.

Mục tiêu chốt từ MasterRoadMap:
- Add software project report template.
- Add lab report template.
- Add internship report template.
- Add README-to-report template.
- Add member responsibility and timeline sections.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** mở rộng Module 1 (Write) — thư viện template + section blocks tái dùng.
- **Depends on:** W1 template schema + zod, W2 skeleton generator, W3 checker (mỗi template khai báo required sections để checker đối chiếu).
- **Depended on by:** W7 (format hardening áp lên đa template), W8 (README generator dùng metadata template), Phase 3 (slide outline theo section flow của template).

---

## 3. 🔭 Scope

### ✅ In scope
- Hoàn thiện "Software project report" template (đã seed W1) thành full section set.
- Lab report template.
- Internship report template.
- README-to-report template (đọc `README.md` → map vào report skeleton).
- Reusable section blocks: member responsibility table + project timeline.
- Mỗi template khai báo `requiredSections` để checker (W3) đọc.

### ⛔ Out of scope
- AI tự sinh nội dung template (→ W11 optional).
- Convert mọi định dạng đầu vào ngoài README/Markdown (Non-goal).
- Template marketplace / chia sẻ cloud (Non-goal — no cloud).
- Format presets mới (dùng presets W3, hardening ở W7).

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W6-advanced-templates`.

### Day 1 — Template Library Structure
- `[NEW]` `src/modules/write/templates/index.ts` (registry tất cả template + `requiredSections`)
- `[NEW]` `src/types/template.ts` → mở rộng (`requiredSections`, `metadataFields` per template)
- `[MODIFY]` `src/modules/write/TemplatePicker.tsx` (list nhiều template)

### Day 2 — Lab & Internship Templates
- `[NEW]` `src/modules/write/templates/lab-report.ts` (Objective · Method · Results · Discussion · Conclusion · References)
- `[NEW]` `src/modules/write/templates/internship-report.ts` (Company · Tasks · Skills · Reflection · Mentor evaluation · References)

### Day 3 — README-to-Report Template
- `[NEW]` `src/modules/write/templates/readme-report.ts`
- `[NEW]` `src/modules/write/readme-import.ts` (parse README mdast → map sections)
- *Lý do:* phục vụ user "turn README into report" (`ProductPRD.md` §2 Target Users).

### Day 4 — Reusable Sections (Members & Timeline)
- `[NEW]` `src/modules/write/sections/member-responsibility.ts` (bảng thành viên + trách nhiệm)
- `[NEW]` `src/modules/write/sections/project-timeline.ts` (mốc thời gian dự án)
- `[MODIFY]` các template trên (nhúng 2 section block khi phù hợp)

### Day 5 — Checker Integration & QA
- `[MODIFY]` `src/modules/check/rules/missing-sections.ts` (đọc `requiredSections` theo template đang chọn)
- `[NEW]` `src/modules/write/templates/*.test.ts` (mỗi template sinh đúng skeleton)
- `[NEW]` `Design/Reports/Month2/W6/W6_QA_Report.md`, `template_samples.md`, `build_output.txt`

---

## 5. 📦 Dependencies installed this week

> Không cần lib mới — template là dữ liệu/logic thuần, đi qua skeleton generator + pipeline đã có.

| Library | Why (this week) | Stack ref |
|---|---|---|
| *(none new)* | Template + section blocks dùng `zod` (W1) + skeleton generator (W2) + checker (W3) | §6 |

---

## 6. 📤 Deliverables

- Template registry với `requiredSections` cho từng template.
- 4 template: software project (full) · lab · internship · README-to-report.
- README import: README.md → report skeleton.
- 2 reusable section: member responsibility table + project timeline.
- Checker đối chiếu required sections theo template.
- Vitest cho mỗi template generator.
- `Design/Reports/Month2/W6/` QA + template samples.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Template phình thành "convert mọi định dạng" | High | Chỉ README/Markdown đầu vào; mỗi template là report skeleton cố định (`ProductPRD.md` §6). |
| Logic checker phân nhánh theo template gây nợ | Medium | Template khai báo `requiredSections` dạng data; checker đọc data, không hard-code. |
| README import map sai section | Medium | Map theo heading mdast có kiểm soát + Vitest sample. |
| Trùng lặp section block giữa template | Low | Tách section blocks tái dùng (member/timeline) thay vì copy. |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` + `typecheck` + `build` xanh.
- [ ] `Vitest` xanh (4 template generator + README import + checker required-sections).
- [ ] Chọn được 4 template từ picker, mỗi cái sinh đúng skeleton.
- [ ] README.md import ra report skeleton hợp lý.
- [ ] Member responsibility + timeline section chèn đúng.
- [ ] Checker đối chiếu required sections theo từng template.
- [ ] Evidence tại `Design/Reports/Month2/W6/`.
- [ ] Commit kèm contract, branch `feature/W6-advanced-templates`.
