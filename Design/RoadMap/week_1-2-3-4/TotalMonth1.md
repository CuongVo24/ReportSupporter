# 🚀 MONTH 1 SUMMARY: MVP REPORT WORKSPACE (W1-W4)

> Phase 1 of `Design/RoadMap/MasterRoadMap.md`. Covers Week 1 → Week 4.

---

## 🎯 Phase Goal

**Build the end-to-end MVP loop: write → format → check → export.**

Cuối Tháng 1, một sinh viên phải có thể: chọn template → điền metadata → sinh skeleton → viết Markdown với preview → chạy checker → export ra `report.html` / `report.pdf` / `report.docx`. Đây chính là "MVP Goal" trong `ProductPRD.md` §3 — vòng tròn báo cáo khép kín, **không** login, **không** cloud, **không** AI.

---

## 📅 The 4 Weeks

### 🏗️ Week 1: Project Bootstrap & Design System
*Trọng tâm: nền móng + types chuẩn + export stub.*
- Next.js (App Router) + TypeScript strict, route `/` workspace-first.
- Canonical types `ReportProject` / `ReportSection` / `ReportIssue` (`src/types`).
- Template seed "Software project report", draft autosave PoC (IndexedDB `idb`).
- 3 checker rule văn bản + panel severity; export HTML stub + PDF/DOCX placeholder.

### ✍️ Week 2: Markdown Authoring
*Trọng tâm: editor thật + pipeline deterministic.*
- CodeMirror 6 editor + live preview chạy pipeline `unified` (GFM + KaTeX + highlight + Mermaid).
- Template picker + metadata form → skeleton generator.
- Autosave thật (debounced) + basic image insertion.

### 📐 Week 3: Format & Check Foundation
*Trọng tâm: định dạng học thuật + bắt lỗi trước nộp.*
- Heading numbering `1`/`1.1`/`1.1.1` + TOC generation (đọc mdast AST).
- Checker engine MVP đầy đủ rule cấu trúc (mỗi rule có Vitest).
- Issues group by severity + readiness score draft.

### 📤 Week 4: Export MVP
*Trọng tâm: export thật, đóng vòng MVP.*
- HTML thật (print CSS A4) + PDF thật (Puppeteer server-side) + DOCX thật (`docx` từ mdast).
- Cover page metadata, export status + error handling.
- First acceptance report trong `Design/Reports/Month1/W4/`.

---

## 🏁 Key Milestones

- **M1.1 (W1):** Repo chạy `npm run dev` → workspace editor; types + stack đã khoá.
- **M1.2 (W2):** Editor + preview + skeleton generator hoạt động trên pipeline deterministic.
- **M1.3 (W3):** Checker MVP green (Vitest) + numbering/TOC deterministic.
- **M1.4 (W4):** 3 export thật chạy trên sample + acceptance report đầu tiên.

---

## 📦 Cumulative Deliverables (cuối Tháng 1)

- Next.js workspace-first app, strict TypeScript, lint/typecheck/build green.
- `src/types` canonical + zod schemas.
- Module 1 (Write): CodeMirror editor, preview, template, autosave, image insert.
- Shared pipeline `unified` ở `src/lib` (xương sống deterministic).
- Module 2 (Format): heading numbering + TOC.
- Module 3 (Check): checker engine + full MVP rules + Vitest + readiness score.
- Module 4 (Export): HTML/PDF/DOCX thật + status/error handling.
- Evidence: `Design/Reports/Month1/W1..W4/` (QA reports, build logs, checker samples, export samples, acceptance report).

---

## ⚠️ Phase-level Risks

| Risk | Level | Mitigation |
|---|---|---|
| Export stack nặng làm chậm cả phase | High | Stub W1 → real W4; PDF chỉ server-side (`TechnicalStack.md` §4). |
| Preview ↔ export không khớp | High | Một pipeline `unified` + một hàm numbering dùng chung cho preview/check/export. |
| Scope phình thành converter tổng quát | High | Bám `ProductPRD.md` §6 Non-goals; acceptance khoá vào report template. |
| Solo dev không có review chéo | Medium | Contract-first + Vitest + 4 trạm gác push (`VibeCode.md`). |
| Import lậu lib ngoài stack | Medium | Chỉ cài theo `TechnicalStack.md`; cần lib mới phải xin approve. |

---

## ✅ Phase Exit Criteria

- [ ] Tất cả 4 tuần đạt Definition of Done riêng.
- [ ] `npm run lint` + `typecheck` + `build` xanh trên nhánh tích hợp tháng 1.
- [ ] `Vitest` xanh cho toàn bộ checker rules.
- [ ] Full MVP loop chạy được: template → metadata → skeleton → write → preview → check → export 3 format.
- [ ] Export PDF/DOCX/HTML trung thực cover page + heading + table + code + image + caption.
- [ ] First acceptance report đã nộp trong `Design/Reports/Month1/W4/`.
- [ ] Không vi phạm Non-goals (no login/cloud/realtime/AI), không import lậu lib ngoài stack.
