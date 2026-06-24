# 📅 WEEK 5: EVIDENCE KIT

> Phase 2 — Report Quality & Evidence (W5-W8). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 5.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Turn scattered project links into a structured, verifiable evidence appendix.*

Tuần 5 mở Phase 2. Báo cáo dự án không chỉ là chữ — nó cần **bằng chứng**: video demo, GitHub, deploy link, slide, Figma, Drive, test account, API docs. Tuần này xây evidence link manager, sinh **evidence appendix table** tự động vào report, và sinh **QR code** cho từng link để chấm bài quét nhanh.

Mục tiêu chốt từ MasterRoadMap:
- Add evidence link manager.
- Track video demo, GitHub, deploy link, slide, Figma, Drive, test account, and API documentation.
- Generate evidence appendix table.
- Generate QR codes for evidence links.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** Supporting module — quản lý `ReportProjectBundle.evidence` (đã có chỗ trong data model `Modules/1.Write.md` và `Support.Evidence.md`).
- **Depends on:** W1-W4 (types, pipeline, format numbering, export). Evidence appendix table render qua pipeline `unified` và xuất được ra cả 3 format.
- **Depended on by:** W8 (submission package gói evidence vào `evidence.zip`), W3 checker (rule "missing demo/source/deploy" giờ có dữ liệu evidence để đối chiếu).

---

## 3. 🔭 Scope

### ✅ In scope
- Evidence type + zod schema (kind, label, url, note).
- Evidence link manager UI (add/edit/remove, validate URL).
- Hỗ trợ 9 loại: video demo · GitHub · deploy link · slide · Figma · Drive · test account · API documentation · other.
- Generate evidence appendix table (Markdown/AST → vào report + xuất 3 format).
- Generate QR code cho mỗi link (`qrcode`) — hiển thị trong preview và export.

### ⛔ Out of scope
- Cloud lưu evidence file (Non-goal — chỉ lưu link + asset reference local).
- Auto-verify link "còn sống" qua network (checker offline — `VibeCode.md` §4).
- `evidence.zip` đóng gói (→ W8).
- AI gợi ý evidence (→ Phase 3, W11 optional).

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W5-evidence-kit`.

### Day 1 — Evidence Types & Schema
> ⚠️ **Reconciliation:** `src/types/evidence.ts` (`EvidenceKind` 9 loại + `EvidenceItem`), `evidenceItemSchema`, và `ReportProjectBundle.evidence` **đã ship ở W1** → Day 1 là **verify no-op**, không tái khai báo (xem `TaskBrief/Core/month2/w5.md`).
- `[VERIFY]` `src/types/evidence.ts` (`EvidenceItem`, `EvidenceKind` union 9 loại) — đã có từ W1.
- `[VERIFY]` `src/types/report.ts` (`ReportProjectBundle.evidence: EvidenceItem[]`) — đã có.
- `[VERIFY]` `src/types/schemas.ts` (`evidenceItemSchema` + URL shape) — đã có.
- `[NEW]` `src/modules/evidence/kind-meta.ts` + `validate.ts` (metadata 9 kind + `validateEvidence` offline).

### Day 2 — Evidence Link Manager UI
- `[NEW]` `src/modules/evidence/EvidencePanel.tsx` (list + add/edit/remove)
- `[NEW]` `src/modules/evidence/EvidenceForm.tsx` (chọn kind, nhập label/url/note, validate qua zod)
- `[NEW]` `src/modules/evidence/validate.ts` (validateEvidence function)
- `[VERIFY]` autosave **không cần sửa** — `useDraftAutosave` lưu cả bundle (`saveBundle`), `evidence` đi kèm tự động; chỉ wire mutation vào `bundle.evidence` state qua `Workspace.tsx`.
- *Lưu ý:* Module Write chỉ import public surface (`EvidencePanel`) từ `@/modules/evidence`.

### Day 3 — Evidence Appendix Table
- `[NEW]` `src/modules/evidence/evidence-appendix.ts` (evidence[] → bảng Markdown/AST)
- `[NEW]` `src/modules/evidence/index.ts` (export public surface: EvidencePanel, validateEvidence, buildEvidenceAppendix)
- `[MODIFY]` `src/components/PreviewPane.tsx` (nối appendix vào source Markdown trước `parseMarkdown` — preview thật ở `components/`, không phải `modules/write/PreviewPanel.tsx`).

### Day 4 — QR Code Generation
- `[NEW]` `src/modules/evidence/evidence-qr.ts` (`qrcode` → data URL cho mỗi link)
- `[NEW]` `src/modules/evidence/EvidenceQrPreview.tsx`
- `[MODIFY]` `src/modules/export/export-html.ts` + `export-docx.ts` (export thật → nhúng QR/appendix). `export-pdf.ts` còn Puppeteer stub → QR-embed follow-up khi engine PDF thật.

### Day 5 — Checker Hook & QA
- `[MODIFY]` `src/modules/check/rules/evidence-gaps.ts` (đối chiếu evidence thật: thiếu demo/source/deploy)
- `[NEW]` `src/modules/check/rules/evidence-gaps.test.ts`
- `[NEW]` `Design/Reports/Month2/W5/W5_QA_Report.md`, `evidence_samples.md`, `build_output.txt`

---

## 5. 📦 Dependencies installed this week

| Library | Why (this week) | Stack ref |
|---|---|---|
| `qrcode` | Sinh QR cho evidence links (data URL, nhúng preview + export) | §8 (Deferred → unlock Phase 2 W5) |

> `qrcode` nằm trong danh sách Deferred của `TechnicalStack.md` §8, mở khoá đúng W5 Evidence Kit. Evidence appendix tái dùng pipeline `unified` + export libs đã có.

---

## 6. 📤 Deliverables

- `EvidenceItem` type + schema + 8 kind hỗ trợ.
- Evidence link manager UI (add/edit/remove, validate).
- Evidence appendix table tự sinh, vào report + xuất 3 format.
- QR code mỗi link, hiển thị preview + nhúng export.
- Checker rule evidence-gaps đối chiếu dữ liệu thật.
- `Design/Reports/Month2/W5/` QA + evidence samples.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Validate URL gọi mạng phá nguyên tắc offline | High | Chỉ validate cú pháp URL (zod), không fetch (`VibeCode.md` §4). |
| QR data URL phình draft IndexedDB | Medium | Sinh QR on-demand khi export/preview, không lưu blob trong draft. |
| Appendix không xuất nhất quán 3 format | Medium | Appendix là AST node, đi qua cùng pipeline export (`TechnicalStack.md` §3). |
| Scope evidence trượt sang cloud storage | Medium | Chỉ link + reference local (`ProductPRD.md` §6 no cloud). |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` + `typecheck` + `build` xanh.
- [ ] `Vitest` xanh (evidence schema + evidence-gaps rule).
- [ ] Add/edit/remove evidence link hoạt động, persist qua refresh.
- [ ] Evidence appendix table render đúng trong preview + export 3 format.
- [ ] QR code sinh đúng cho mỗi link, nhúng được vào export.
- [ ] Checker phát hiện thiếu demo/source/deploy dựa trên evidence thật.
- [ ] Không gọi mạng (offline).
- [ ] Evidence tại `Design/Reports/Month2/W5/`.
- [ ] Commit kèm contract, branch `feature/W5-evidence-kit`.
