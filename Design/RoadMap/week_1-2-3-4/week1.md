# 📅 WEEK 1: PROJECT BOOTSTRAP & DESIGN SYSTEM

> Phase 1 — MVP Report Workspace (W1-W4). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 1.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Build a runnable workspace-first shell + lock the foundation types.*

Cuối tuần 1, repo phải clone về chạy được `npm run dev` ra **đúng một workspace editor** (không phải landing page), với khung type chuẩn (`ReportProject`, `ReportSection`, `ReportIssue`) đã chốt, một template seed đầu tiên, và các service export ở dạng **stub**. Đây là "đường băng" (runway) để Tuần 2 lắp editor thật mà không phải đập lại nền móng.

Mục tiêu chốt từ MasterRoadMap:
- Initialize Next.js + Node project structure.
- Build the first workspace shell.
- Define local draft storage approach.
- Implement initial template schema.
- Prepare design tokens and UI conventions.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** nền tảng dùng chung cho cả 4 module (`write`, `format`, `check`, `export`) + `lib` + `types`.
- **Module touched:** chủ yếu là khung `src/types` (canonical), khung thư mục module, và placeholder cho Module 1 (Write) + Module 3 (Check) + Module 4 (Export).
- **Depends on this week:** *mọi tuần sau*. Tuần 2 (editor thật) cần app shell + draft storage PoC. Tuần 3 (checker) cần `ReportIssue` + checker panel. Tuần 4 (export thật) cần các service stub đã có chỗ.
- **Source of truth:** `Design/ContractForAI/Core/month1/W1/w1_project_bootstrap_contract.md` (interfaces đã chốt) + `Design/TaskBrief/Core/month1/w1.md` (task IDs `[C1]`-`[C15]`).

---

## 3. 🔭 Scope

### ✅ In scope
- Khởi tạo Next.js (App Router) + TypeScript strict + npm scripts (`dev`, `build`, `lint`, `typecheck`).
- App shell **workspace-first**: route `/` là editor workspace, không landing.
- Canonical types tại `src/types` (ReportProjectBundle, ReportAsset, EvidenceItem) + zod schema cho template & metadata (khớp [CanonicalTypes.md](file:///e:/ReportSupporter/Design/Modules/Other/CanonicalTypes.md)).
- `TemplateSchema` chi tiết (metadataFields, sections, requiredSections, requiredEvidenceKinds, requiresToc — khớp CanonicalTypes §5) + 1 seed: "Software project report".
- Markdown editor **placeholder** (controlled `<textarea>`) + preview placeholder + placeholder nhập evidence link đơn giản dạng metadata.
- Local draft save/load proof-of-concept qua IndexedDB (`idb`).
- Checker issue type + 3 rule văn bản đầu tiên (TODO / lorem / code-language) + checker panel có severity grouping. Chỉ chạy trực tiếp trên main-thread ở W1, viết 1-2 test cơ bản bằng Vitest.
- HTML export stub + PDF/DOCX service **placeholder** (chưa render thật).
- Build verification + W1 QA report.

### ⛔ Out of scope (Non-goals — `ProductPRD.md` §6)
- Real PDF/DOCX export (để **W4** — đúng Risk W1: "Export stack becomes too large for week 1").
- CodeMirror 6 editor (để **W2**, theo `TechnicalStack.md` §2).
- Login, cloud storage, realtime collaboration, AI assistant.
- TOC / heading numbering / format presets (để **W3**).
- "Convert every format" — không hứa hẹn converter tổng quát.

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Task IDs khớp `Design/TaskBrief/Core/month1/w1.md`. Branch: `feature/W1-project-bootstrap`.

### Day 1 — Repository & App Bootstrap
- `[C1]` Khởi tạo Next.js + Node tại repo root.
  - `[NEW]` `package.json`, `tsconfig.json` (`strict: true`), `next.config.ts`
  - `[NEW]` `src/app/layout.tsx`, `src/app/globals.css`
- `[C2]` Baseline TypeScript + ESLint + Prettier + scripts.
  - `[NEW]` `.eslintrc` / `eslint.config.mjs`, `.prettierrc`
  - `[MODIFY]` `package.json` scripts: `dev` · `build` · `lint` · `typecheck`
- `[C3]` App shell workspace-first.
  - `[NEW]` `src/app/page.tsx` (render workspace, **không** marketing hero)
  - `[NEW]` `src/components/WorkspaceLayout.tsx` (3 vùng: editor · preview · side panel)
  - `[NEW]` design tokens: `src/app/globals.css` (color, spacing, font preset — chuẩn bị cho A4/Times New Roman ở Format W3)

### Day 2 — Product Structure (Types & Template)
- `[C4]` Initial template schema.
  - `[NEW]` `src/types/template.ts` (`TemplateSchema`, `MetadataFieldSpec`, `TemplateSectionSeed` khớp [CanonicalTypes.md](file:///e:/ReportSupporter/Design/Modules/Other/CanonicalTypes.md))
  - `[NEW]` `src/types/schemas.ts` (zod schema cho template + metadata)
- `[C5]` Software project report template seed + project mapper.
  - `[NEW]` `src/modules/write/templates/software-project.ts` (seed sections tiếng Việt — khớp `1.Write.md` §3.3: Mở đầu · Thành viên & Phân công · Triển khai · Kiểm thử · Kết luận · Tài liệu tham khảo · Minh chứng)
  - `[NEW]` `src/modules/write/create-project.ts` (`createProjectFromTemplate`: `TemplateSchema` → `ReportProject` + `ReportProjectBundle`; `id=crypto.randomUUID()`, seeds → sections với `order`+`status:"draft"`, `assets:[]`, `evidence:[]`, `formatSettings=DEFAULT_FORMAT_SETTINGS`, `schemaVersion=SCHEMA_VERSION`) — **đây là thứ Vitest §8 verify**
- `[C6]` Canonical project/section/asset/evidence/bundle types + defaults.
  - `[NEW]` `src/types/report.ts` (`ReportProject`, `ReportSection`, `ReportAsset`, `SnippetKind`, `ReportProjectBundle` — CanonicalTypes §1/§4)
  - `[NEW]` `src/types/evidence.ts` (`EvidenceKind`, `EvidenceItem` — §2; cần cho `bundle.evidence` dù Evidence Kit UI là W5, W1 để `[]`)
  - `[MODIFY]` `src/types/schemas.ts` → thêm `evidenceItemSchema`, `formatSettingsSchema`, `storedBundleSchema` (phủ HẾT bundle — `1.Write.md` §3.4)
  - `[NEW]` `src/types/defaults.ts` (`DEFAULT_TEMPLATE_ID`, `DEFAULT_FORMAT_SETTINGS` với `presetId:"academic-default"`, `SCHEMA_VERSION = 1`)
  - `[NEW]` `src/types/index.ts` (re-export single surface)

### Day 3 — Editor Foundation (placeholder)
- `[C7]` Markdown editor surface.
  - `[NEW]` `src/modules/write/EditorPanel.tsx` (controlled `<textarea>` — *no editor lib yet*)
- `[C8]` Live preview surface.
  - `[NEW]` `src/modules/write/PreviewPanel.tsx` (render Markdown thô — pipeline `unified` thật lắp ở W2)
- `[C9]` Local draft save/load PoC.
  - `[NEW]` `src/lib/idb-client.ts` (thin wrapper trên `idb`)
  - `[NEW]` `src/modules/write/use-draft-autosave.ts` (load on mount, save on change)

### Day 4 — Checker Foundation
- `[C10]` Checker issue type.
  - `[MODIFY]` `src/types/report.ts` → thêm `ReportIssue` (đúng shape [CanonicalTypes.md](file:///e:/ReportSupporter/Design/Modules/Other/CanonicalTypes.md))
- `[C11]` Text checks (subset văn bản — KHÔNG dùng canonical `CheckRule`/`CheckContext` vì chưa có mdast/unified ở W1).
  - `[NEW]` `src/modules/check/rules/text-markers.ts` (`placeholder-text`: TODO · fix later · lorem ipsum)
  - `[NEW]` `src/modules/check/rules/code-language.ts` (`code-block-no-lang`: code block thiếu language — regex trên raw Markdown ở W1, bản AST để W3)
  - `[NEW]` `src/modules/check/run-checker.ts` (rule type tối giản `(markdown: string) => ReportIssue[]`, gom → `ReportIssue[]`, main-thread sync, không worker; full engine `CheckRule`/`CheckContext` ở W3)
- `[C12]` Checker panel + severity grouping.
  - `[NEW]` `src/modules/check/CheckerPanel.tsx` (nhóm theo `error | warning | info`)
- *Lưu ý:* Chỉ cần viết 1-2 unit test rất nhỏ cho các rule văn bản bằng Vitest để verify test runner. Không over-engineer checker engine ở W1.

### Day 5 — Export Stub & QA
- `[C13]` HTML export stub.
  - `[NEW]` `src/modules/export/export-html.ts` (trả HTML tối giản — pipeline thật ở W4)
- `[C14]` PDF/DOCX service placeholders.
  - `[NEW]` `src/modules/export/export-pdf.ts`, `src/modules/export/export-docx.ts` (**trả** `ExportResult { ok:false, error:{ stage:"render-pdf"|"render-docx", message:"not implemented until W4", recoverable:false } }` — KHÔNG throw; call site W1 dùng đúng shape W4)
  - `[NEW]` `src/modules/export/index.ts`
- `[C15]` Build + W1 QA report.
  - `[NEW]` `Design/Reports/Month1/W1/W1_QA_Report.md`, `build_output.txt`

---

## 5. 📦 Dependencies installed this week

> Chỉ cài từ stack đã khoá — `Design/Modules/Other/TechnicalStack.md`.

| Library | Why (this week) | Stack ref |
|---|---|---|
| `next` + `react` + `react-dom` | Framework + UI (App Router, workspace-first) | §1 |
| `typescript` | Strict static types | §1, §6 |
| `eslint` + `prettier` | Lint/format gate | §7 |
| `vitest` | Unit test cho checker rules (Day 4) | §7 |
| `zod` | Runtime validation template + metadata | §6 |
| `idb` | Local draft autosave (IndexedDB) — no login/cloud | §5 |

> **CHƯA cài tuần này (cố ý):** CodeMirror 6 (→W2), `unified`/`remark`/`rehype`/`katex`/`mermaid` (→W2 pipeline), `puppeteer`/`docx` (→W4 export thật), `qrcode` (→W5), `pptxgenjs` (→Phase 3).

---

## 6. 📤 Deliverables

- Repo Next.js chạy `npm run dev` → route `/` hiện workspace editor 3 vùng.
- `src/types` chốt: `ReportProject`, `ReportSection`, `ReportIssue` + zod schemas.
- 1 template seed "Software project report" sinh được skeleton sections.
- Draft autosave PoC sống qua refresh (IndexedDB).
- Checker chạy 3 rule văn bản, panel nhóm theo severity.
- Export: HTML stub + PDF/DOCX placeholder (báo lỗi rõ ràng, không nuốt exception).
- `Design/Reports/Month1/W1/W1_QA_Report.md` + `build_output.txt`.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Export stack quá nặng cho tuần 1 | Medium | Stub PDF/DOCX ngay W1, để Puppeteer/docx thật tới W4 (`TechnicalStack.md` §4). |
| Editor library làm chậm bootstrap | Medium | Dùng controlled `<textarea>` trước, thay CodeMirror 6 ở W2. |
| Scope phình thành converter tổng quát | High | Khoá acceptance vào report template + submission flow (`ProductPRD.md` §6). |
| UI lệch sang landing-page | High | Route `/` bắt buộc là workspace (`TechnicalStack.md` §1 Rendering posture). |
| Type drift giữa `.md` và code | Medium | Canonical types ở `src/types` đúng Contract W1 §4; đổi shape phải update `.md`. |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` xanh (ESLint không lỗi đỏ).
- [ ] `npm run typecheck` xanh (strict, không `any`).
- [ ] `npm run build` xanh.
- [ ] `Vitest` xanh cho rule văn bản (`placeholder-text` + `code-block-no-lang`) **và** `createProjectFromTemplate` (đúng số `ReportSection`, `order`, `status="draft"`).
- [ ] Route `/` render workspace editor (không landing) — xác nhận local.
- [ ] Draft autosave sống qua refresh (IndexedDB) — kiểm chứng thủ công.
- [ ] PDF/DOCX placeholder **trả** `ExportResult { ok:false, error }` (message "until W4", recoverable) — visible, không throw/nuốt.
- [ ] Evidence ghi tại `Design/Reports/Month1/W1/` (QA report + build log).
- [ ] Commit kèm `w1_project_bootstrap_contract.md`, branch `feature/W1-project-bootstrap`.
