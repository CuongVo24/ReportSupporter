# 📅 WEEK 7: FORMAT HARDENING

> Phase 2 — Report Quality & Evidence (W5-W8). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 7.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Make the output look like a properly typeset academic document.*

Tuần 7 siết Module 2 (Format) và Module 4 (Export) cho đạt chuẩn học thuật thật: caption normalization nhất quán, sinh **list of figures / list of tables**, rules cho references section, và quan trọng nhất — sửa **PDF page-break** (chapter mới sang trang) + **DOCX layout verification checklist**. Đây là tuần biến export "chạy được" (W4) thành export "nộp được".

Mục tiêu chốt từ MasterRoadMap:
- Improve caption normalization.
- Add list of figures and list of tables.
- Add references section rules.
- Improve PDF page-break behavior.
- Add DOCX layout verification checklist.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** hardening Module 2 (Format) + Module 4 (Export).
- **Depends on:** W3 (numbering/caption/TOC), W4 (HTML/PDF/DOCX export thật), W6 (đa template để verify layout).
- **Depended on by:** W8 (submission package + final checklist dựa trên DOCX layout checklist), Phase 3 (slide outline dùng caption/figure list).

---

## 3. 🔭 Scope

### ✅ In scope
- Caption normalization: "Figure 1.1", "Table 2.3" deterministic, đồng bộ preview ↔ export.
- List of figures (LoF) + list of tables (LoT) generation, đặt sau TOC.
- References section rules (định dạng entry, thứ tự, cảnh báo entry thiếu).
- PDF page-break: chapter mới bắt đầu trang mới (CSS `break-before`), tránh widow/orphan heading.
- DOCX layout verification checklist (kiểm tra heading/caption/table/page setup trong output).

### ⛔ Out of scope
- Citation style engine đầy đủ (APA/IEEE auto) — chỉ rules cơ bản, không parser trích dẫn nâng cao.
- Slide/present (→ Phase 3).
- `evidence.zip`/README generator (→ W8).
- Lib export mới (chỉ tinh chỉnh browser print/`docx`; Puppeteer nếu đã được approve hardening riêng).

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W7-format-hardening`.

### Day 1 — Caption Normalization
- `[MODIFY]` `src/modules/format/captions.ts` (chuẩn hoá "Figure X.Y" / "Table X.Y" theo chapter)
- `[NEW]` `src/modules/format/caption-registry.ts` (registry figure/table để LoF/LoT + cross-ref dùng)
- `[NEW]` `src/modules/format/captions.test.ts`

### Day 2 — List of Figures / List of Tables
- `[NEW]` `src/modules/format/generate-lof-lot.ts` (registry → LoF + LoT entries)
- `[MODIFY]` `src/modules/format/generate-toc.ts` (chèn LoF/LoT sau TOC)
- `[MODIFY]` `src/modules/write/PreviewPanel.tsx` (hiển thị LoF/LoT)

### Day 3 — References Section Rules
- `[NEW]` `src/modules/check/rules/references.ts` (entry rỗng, thứ tự, format cơ bản)
- `[NEW]` `src/modules/check/rules/references.test.ts`
- `[MODIFY]` `src/modules/check/run-checker.ts` (đăng ký rule references)

### Day 4 — PDF Page-break Behavior
- `[MODIFY]` `src/modules/export/print-css.ts` (`break-before: page` cho major chapter, tránh widow/orphan)
- `[MODIFY]` `src/modules/export/export-pdf.ts` (page number/header/footer ổn định qua trang)
- *Lý do:* "Chapter behavior: start new major chapter on a new page" (`Modules/2.Format.md`).

### Day 5 — DOCX Layout Checklist & QA
- `[NEW]` `src/modules/export/docx-layout-checklist.ts` (verify heading/caption/table/page setup trong DOCX output)
- `[MODIFY]` `src/modules/export/mdast-to-docx.ts` (đồng bộ caption numbering + page setup)
- `[NEW]` `Design/Reports/Month2/W7/W7_QA_Report.md`, `format_samples/` (pdf trước/sau page-break, docx checklist), `build_output.txt`

---

## 5. 📦 Dependencies installed this week

> Không cài lib mới — chỉ tinh chỉnh Format + browser print/`docx` đã có (W4) và checker (W3). Puppeteer chỉ đụng nếu có Contract hardening riêng.

| Library | Why (this week) | Stack ref |
|---|---|---|
| *(none new)* | Page-break là print CSS; LoF/LoT/references là logic trên AST | §3, §4 |

---

## 6. 📤 Deliverables

- Caption normalization nhất quán preview ↔ export + caption registry.
- List of figures + list of tables sinh tự động, đặt sau TOC.
- References rules trong checker (+ Vitest).
- PDF page-break: chapter sang trang mới, header/footer/page number ổn định.
- DOCX layout verification checklist + DOCX output đồng bộ numbering.
- `Design/Reports/Month2/W7/` QA + format samples (before/after).

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Browser print page-break khác nhau giữa trình duyệt | Medium | Test print CSS trên sample đa template; nếu không đủ mới mở Puppeteer hardening contract. |
| Caption numbering lệch giữa LoF/LoT và body | High | Một caption-registry duy nhất feed cả body + LoF/LoT + export. |
| References rules quá khắt khe → false positive | Medium | Rule cơ bản (rỗng/thứ tự), không ép citation style cụ thể; có suggestion. |
| DOCX layout không khớp PDF | Medium | Cùng caption/numbering source; checklist verify thủ công + sample. |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` + `typecheck` + `build` xanh.
- [ ] `Vitest` xanh (captions + LoF/LoT + references rule).
- [ ] Caption "Figure X.Y"/"Table X.Y" nhất quán preview ↔ PDF ↔ DOCX.
- [ ] LoF + LoT sinh đúng, đặt sau TOC.
- [ ] PDF: chapter mới sang trang mới, không widow/orphan heading.
- [ ] DOCX layout checklist pass trên sample đa template.
- [ ] References checker rule chạy đúng + có suggestion.
- [ ] Evidence tại `Design/Reports/Month2/W7/` (before/after samples).
- [ ] Commit kèm contract, branch `feature/W7-format-hardening`.
