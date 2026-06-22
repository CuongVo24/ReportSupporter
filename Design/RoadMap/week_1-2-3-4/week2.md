# 📅 WEEK 2: MARKDOWN AUTHORING

> Phase 1 — MVP Report Workspace (W1-W4). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 2.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Turn the placeholder shell into a real Markdown authoring experience.*

Tuần 2 nâng cấp editor placeholder (W1) thành editor thật bằng **CodeMirror 6**, lắp **live preview** chạy trên pipeline `unified` thật, và biến template seed thành **skeleton generator** (chọn template + điền metadata → sinh sections). Autosave nâng từ PoC lên autosave thật, và thêm luồng chèn ảnh cơ bản.

Mục tiêu chốt từ MasterRoadMap:
- Build Markdown editor and live preview.
- Add template picker and metadata form.
- Generate report skeleton from selected template.
- Add local auto-save.
- Add basic image insertion flow.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** Module 1 — Write (`src/modules/write`) ở mức "đầy đủ MVP authoring".
- **Builds (shared):** Markdown pipeline `unified` tại `src/lib` — *xương sống deterministic* dùng chung cho Format (W3), Check (W3), Export (W4).
- **Depends on:** W1 (app shell, `ReportProject`/`ReportSection` types, idb client, template seed).
- **Depended on by:** W3 (Format/Check đọc AST từ pipeline này), W4 (Export render từ cùng pipeline).

---

## 3. 🔭 Scope

### ✅ In scope
- CodeMirror 6 editor (markdown lang) thay `<textarea>`.
- Live preview chạy pipeline `unified` thật (remark-parse + remark-gfm → rehype → HTML).
- Math (KaTeX) + code highlight (highlight.js) + Mermaid render client-side trong preview.
- Template picker UI + metadata form (project title, school, course, lecturer, members).
- Skeleton generator: template + metadata → `ReportProject.sections`.
- Auto-save thật (debounced) qua IndexedDB; load lại khi mở app.
- Basic image insertion (drag-drop / clipboard paste → asset reference trong Markdown).

### ⛔ Out of scope
- Heading numbering / TOC / format presets (→ W3).
- Checker rules nâng cao (→ W3).
- Real PDF/DOCX export (→ W4).
- Multi-file section management (PRD ghi "later" — không làm MVP tuần này).
- Cloud asset storage (Non-goal — ảnh lưu local/asset reference).

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W2-markdown-editor`.

### Day 1 — Markdown Pipeline (shared backbone)
- `[NEW]` `src/lib/markdown-pipeline.ts` (`unified` + `remark-parse` + `remark-gfm` + `remark-math` → `remark-rehype` → `rehype-katex` + `rehype-highlight` → `rehype-stringify`)
- `[NEW]` `src/lib/pipeline-types.ts` (typed result của pipeline — không `any`)
- *Lý do:* chốt pipeline trước để preview/checker/export ăn chung nguồn (`TechnicalStack.md` §3).

### Day 2 — CodeMirror Editor
- `[MODIFY]` `src/modules/write/EditorPanel.tsx` (thay `<textarea>` bằng CodeMirror 6 controlled)
- `[NEW]` `src/modules/write/editor-setup.ts` (`@codemirror/state` + `@codemirror/view` + `@codemirror/lang-markdown`)
- `[NEW]` `src/modules/write/insert-snippet.ts` (chèn table / code / math / mermaid / callout)

### Day 3 — Live Preview
- `[MODIFY]` `src/modules/write/PreviewPanel.tsx` (render qua `markdown-pipeline`)
- `[NEW]` `src/modules/write/MermaidRenderer.tsx` (render `mermaid` client-side — cần DOM)
- `[NEW]` `src/lib/katex-styles.ts` / import `katex` CSS cho math block

### Day 4 — Template Picker, Metadata & Skeleton
- `[NEW]` `src/modules/write/TemplatePicker.tsx`
- `[NEW]` `src/modules/write/MetadataForm.tsx` (validate qua zod schema W1)
- `[NEW]` `src/modules/write/generate-skeleton.ts` (template + metadata → `ReportSection[]`)
- `[MODIFY]` `src/modules/write/templates/software-project.ts` (hoàn thiện seed sections)

### Day 5 — Autosave, Image Insert & QA
- `[MODIFY]` `src/modules/write/use-draft-autosave.ts` (debounced save thật + load on mount)
- `[NEW]` `src/modules/write/use-image-insert.ts` (drag-drop / paste → asset ref)
- `[NEW]` `Design/Reports/Month1/W2/W2_QA_Report.md`, `build_output.txt`

---

## 5. 📦 Dependencies installed this week

| Library | Why (this week) | Stack ref |
|---|---|---|
| `@codemirror/state` + `@codemirror/view` + `@codemirror/lang-markdown` | Editor thật, controlled, dễ chèn snippet | §2 |
| `unified` + `remark-parse` + `remark-gfm` | Parse Markdown → mdast (bảng, task list) | §3 |
| `remark-math` + `rehype-katex` + `katex` | LaTeX math block | §3 |
| `rehype-highlight` | Code highlight deterministic (highlight.js) | §3 |
| `remark-rehype` + `rehype-stringify` | mdast → hast → HTML cho preview | §3 |
| `mermaid` | Diagram render client-side | §3 |

> **CHƯA cài:** `puppeteer`/`docx` (→W4), `qrcode` (→W5), `pptxgenjs` (→Phase 3).

---

## 6. 📤 Deliverables

- CodeMirror 6 editor thay `<textarea>`, chèn được snippet (table/code/math/mermaid/callout).
- Live preview chạy pipeline `unified` thật: GFM table + KaTeX + highlight + Mermaid.
- Template picker + metadata form → sinh report skeleton.
- Autosave thật (debounced), draft sống qua refresh.
- Basic image insertion (drag-drop/paste).
- `Design/Reports/Month1/W2/` QA report + build log.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Mermaid cần DOM, vỡ khi SSR | Medium | Render Mermaid client-only (dynamic import / `useEffect`), không SSR. |
| Pipeline preview ≠ pipeline export sau này | High | Một pipeline duy nhất ở `src/lib`, preview/export/check ăn chung (`TechnicalStack.md` §3). |
| CodeMirror controlled gây re-render nặng | Medium | Debounce state, chỉ re-parse preview khi ngừng gõ. |
| Ảnh paste làm phình draft trong IndexedDB | Medium | Lưu asset reference, giới hạn kích thước; không cloud (Non-goal). |
| Vượt luật 200 dòng/file | Medium | Tách editor-setup / insert-snippet / pipeline thành file con (`VibeCode.md` §3). |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` xanh.
- [ ] `npm run typecheck` xanh (no `any`).
- [ ] `npm run build` xanh.
- [ ] `Vitest` xanh (pipeline + skeleton generator có test cơ bản).
- [ ] Editor CodeMirror gõ + chèn snippet hoạt động; preview cập nhật live.
- [ ] Chọn template + điền metadata → sinh đúng skeleton sections.
- [ ] Draft autosave sống qua refresh (kiểm chứng thủ công).
- [ ] Code block giữ language metadata cho checker/export (`Modules/1.Write.md` Acceptance).
- [ ] Evidence tại `Design/Reports/Month1/W2/`.
- [ ] Commit kèm contract, branch `feature/W2-markdown-editor`.
