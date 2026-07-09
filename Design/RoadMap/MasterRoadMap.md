# Master Roadmap - ReportSupporter (12 Weeks Core + 3 UI + 4 Import)

## Project Overview

- **Goal:** Build a reporting workspace that helps students and project teams write, format, check, and export complete submission-ready reports.
- **Core value:** Fast report creation, usable export, academic formatting, pre-submit checking, and evidence-aware submission workflow.
- **MVP stack:** Next.js (App Router) — **client-first**, gần như không server: editor/format/check/export đều chạy trong trình duyệt, PDF qua browser-print, **không backend bắt buộc** ở Core MVP (Node chỉ là runtime dev/build; Puppeteer server-side là hardening tùy chọn sau — xem `Design/Modules/Other/TechnicalStack.md`).
- **Privacy posture:** Core report editing should work without mandatory login.

## Phase 1 - Core MVP: Report Workspace (Weeks 1-4)

### Week 1: Project Bootstrap and Design System

- Initialize Next.js + Node project structure.
- Build the first workspace shell.
- Define local draft storage approach.
- Implement initial template schema.
- Prepare design tokens and UI conventions.

### Week 2: Markdown Authoring

- Build Markdown editor and live preview.
- Add template picker and metadata form.
- Generate report skeleton from selected template.
- Add local auto-save.
- Add basic image insertion flow.

### Week 3: Format and Check Foundation

- Implement heading parser and numbering.
- Implement basic table of contents generation.
- Add checker engine with MVP rules.
- Display issues grouped by severity.
- Add report readiness score draft.

### Week 4: Export MVP

- Export Markdown to HTML.
- Export formatted report to PDF through browser print / print CSS.
- Export formatted report to basic editable DOCX.
- Add export status and error handling.
- Produce first acceptance report in `Design/Reports/`.

## Build Priority

- **P0 Write core:** template picker, Markdown editor, preview, autosave, image insert.
- **P1 Export usable:** HTML export, browser-print PDF, DOCX basic.
- **P2 Format academic:** A4 preset, heading numbering, TOC, captions.
- **P3 Check before submit:** missing sections, TODO, broken image, evidence gaps, readiness score.
- **P4 Evidence Kit:** evidence manager, appendix, QR later.
- **P5 Present:** slide outline, script, Q&A, PPTX later.

## Phase 2 - Submission MVP / Evidence MVP (Weeks 5-8)

### Week 5: Evidence Kit

- Add evidence link manager.
- Track video demo, GitHub, deploy link, slide, Figma, Drive, test account, and API documentation.
- Generate evidence appendix table.
- Generate QR codes for evidence links after `qrEnabled` is already stored in MVP data.

### Week 6: Advanced Templates

- Add software project report template.
- Add lab report template.
- Add internship report template.
- Add README-to-report template.
- Add member responsibility and timeline sections.

### Week 7: Format Hardening

- Improve caption normalization.
- Add list of figures and list of tables.
- Add references section rules.
- Improve PDF page-break behavior.
- Add DOCX layout verification checklist.

### Week 8: Submission Package

- Generate `evidence.zip`.
- Generate `README.md` from report metadata.
- Add final submission checklist.
- Add export history stored locally.

## Phase 3 - Present and AI Layer (Weeks 9-12)

### Week 9: Slide Outline

- Generate slide outline from report sections.
- Add presentation timeline.
- Assign speakers to sections.

### Week 10: Script and Q&A

- Generate speaker script.
- Generate defense Q&A.
- Add weak-section review hints.

### Week 11: Optional AI Assistant

- Add AI-assisted outline generation behind explicit user action.
- Add section rewrite suggestions.
- Add academic tone improvement.
- Keep user content control visible.

### Week 12: Beta Readiness

- Run end-to-end project report scenario.
- Validate exports on sample reports.
- Polish UI states and accessibility.
- Prepare public demo and README evidence.

## Phase 4 - Frontend / UI Investment (Weeks 13-15)

> Ba tuần extra biến giao diện thành first-class concern, dựng đẹp **theo mạch** thay vì sửa cuối kỳ. Bám discipline `Design/Frontend/` (Art Direction → Foundations → Components → Patterns → Layouts → Flows). **Không** thêm logic nghiệp vụ, **không** đổi `CanonicalTypes` — chỉ tầng trình bày. W13 **build** primitive, W14 **adopt** vào panel, W15 **hardening + QA** (axe automation + visual QA + evidence) để W13/W14 không phải đánh đổi chất lượng.

### Week 13: UI Foundation & Component Library

- Cài + khoá UI stack: Radix UI (headless) + Lucide; bootstrap `src/components/ui/`.
- Dựng bộ primitive theo spec: Button, Input, Select, Textarea, Badge, Dialog, Tabs, Toast — đủ trạng thái (`Design/Frontend/2.Components/*`).
- Áp Art Direction: token, focus-visible, motion ≤200ms, a11y mỗi component.
- Storybook-style demo nội bộ (route/page nháp) để duyệt component bằng mắt.

### Week 14: UI Adoption & Polish

- Refactor App Shell + panel Write/Format/Check/Export/Present dùng primitive W13 (không đổi behavior).
- Áp Patterns: empty / loading-skeleton / error / form-validation / feedback nhất quán.
- Áp microcopy (`Frontend/Other/VoiceAndContent.md`), responsive App Shell, dark mode polish.
- Self Visual QA + adoption coverage report (gate toàn diện + before/after evidence dời sang W15).

### Week 15: UI Hardening, A11y Automation & Visual QA

- Dựng **axe automation** (devDependency `axe-core`, Vitest+jsdom) → đẩy Phase 4 về **0 critical** (lần đầu tự động hoá a11y; W12–W14 là checklist thủ công).
- Visual QA toàn màn theo `0.ArtDirection.md §11` + anti-patterns §6; hardening dark/motion/responsive ≥3 viewport.
- Buffer hấp thụ spillover edge-state Day 3 của W13/W14 (Dialog/Toast/Tabs + panel Check/Export/Present đủ trạng thái).
- **Before/after evidence** (light/dark × ≥3 viewport) + cập nhật `Frontend/` "implemented"; **đóng Phase 4**.

## Interlude - Hardening & Break Weeks (Weeks 16-20)

> Không phải phase kế hoạch — các tuần break/hardening theo nhu cầu thực tế, tracked tại `Design/ContractForAI/Core/break_task/week16_break..week20_break`. Nội dung chính: validation issues panel + export gating (P0), print header/footer/page-break, unified render pipeline, image embed & export validation, PPTX export cho Present, editor/preview UX (toolbar, sync scroll, dark preview, save status).

## Phase 5 - Universal Import (Weeks 21-24)

> Biến ReportSupporter từ "nơi viết báo cáo" thành "nơi **đưa mọi tài liệu có sẵn vào** rồi viết tiếp": import **DOCX / PDF / XLSX / PPTX → Markdown**, hoàn toàn **client-side** (giữ nguyên posture không backend/không login). Kết hợp với Export hiện có (PDF/DOCX/PPTX) → app thành **round-trip**: nhận file → sửa → xuất lại. **Reconciliation:** gỡ một phần Non-goal "convert mọi định dạng" (`ProductPRD.md` §6) — vẫn KHÔNG hứa "mọi định dạng", chỉ thêm 4 format curated, và import là **import-to-edit** (đưa vào workspace để viết tiếp), không phải trang convert-rồi-đi. Kiến trúc: converter registry (`Design/Modules/6.Import.md`), types tại `CanonicalTypes.md` §11, ranh giới pipeline tại `PipelineContract.md` §4.

### Week 21: Import Foundation & DOCX

- Khoá Import Model (`CanonicalTypes.md` §11) + converter registry + universal dropzone (đường `.md` hiện có refactor thành converter đầu tiên).
- Reverse pipeline HTML → Markdown (`rehype-remark` + `remark-stringify`) — chỉ sống trong module Import.
- DOCX converter qua `mammoth`: heading/list/table giữ cấu trúc, ảnh nhúng → `ReportAsset`.
- Heading → section split (tái dùng logic readme-import) + `ImportDraft` + warnings chuẩn hoá.

### Week 22: PDF Import

- `pdfjs-dist` (worker bundle local): trích text theo trang kèm font/position metadata.
- Heuristic layout: font-size clustering → heading levels; merge dòng → paragraph; nhận diện list.
- Trích ảnh từ PDF → `ReportAsset`; phát hiện trang scan (không text layer) → warning `scanned-page` (OCR để W24).
- Giới hạn an toàn: 50MB, page cap; bảng không tái tạo được → flatten + warning.

### Week 23: XLSX & PPTX Import

- XLSX qua SheetJS: mỗi sheet → section với bảng GFM; xử lý merged cells, number format, row cap + warning.
- PPTX trên nền `jszip` (đã có): slide title → heading, body → bullets, speaker notes → blockquote; media → `ReportAsset`.
- SmartArt/chart/OLE → warning `unsupported-element`, không chặn import.

### Week 24: Preview Diff, OCR Experimental & Phase 5 Close

- Import preview diff: duyệt Markdown kết quả + remap heading + chọn append/replace trước khi commit.
- Check engine chạy trên `ImportDraft` (module "import") — báo lỗi cấu trúc ngay trong preview.
- OCR experimental: `tesseract.js` lazy-load, flag default OFF, chỉ chạy sau explicit action (vie+eng).
- Import worker + progress + perf hardening; E2E round-trip (import → edit → check → export); **đóng Phase 5**.
