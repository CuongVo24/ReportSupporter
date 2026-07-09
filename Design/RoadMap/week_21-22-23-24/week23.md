# 📅 WEEK 23: XLSX & PPTX IMPORT

> Phase 5 — Universal Import (W21-W24). Reference: `Design/RoadMap/MasterRoadMap.md` §Phase 5, `Design/Modules/6.Import.md`.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Hai format Office còn lại — bảng số liệu và slide — vào workspace bằng khung registry đã chuẩn.*

Nửa đầu tuần: **XLSX** qua SheetJS — mỗi sheet thành một section `## <Sheet>` chứa **bảng GFM** (giá trị cell đã format, không formula engine), xử lý merged cells, row cap 500 + `sheet-truncated`. Nửa sau: **PPTX** trên nền `jszip` **đã có sẵn** — parse `ppt/slides/slideN.xml`: title → heading, body theo indent → bullets, speaker notes → blockquote, `ppt/media/*` → `ReportAsset`. SmartArt/chart/OLE không chặn import — phát `unsupported-element`. Tuần này chứng minh giá trị của W21: hai converter mới, **không sửa** dropzone/preview/registry core.

Mục tiêu chốt từ MasterRoadMap:
- XLSX: sheet → section + bảng GFM; merged cells, number format, row cap + warning.
- PPTX trên jszip: title → heading, body → bullets, notes → blockquote; media → `ReportAsset`.
- SmartArt/chart/OLE → `unsupported-element`, không chặn import.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** `converters/xlsx.ts`, `converters/pptx.ts` (+ `pptx/slide-xml.ts`).
- **Depends on:** W21 registry/warnings/section split/asset path; `jszip` (dep sẵn — dùng cho submission zip).
- **Depended on by:** W24 (E2E round-trip đủ 4 format; preview diff).
- **Đo theo:** `6.Import.md` §5 (XLSX/PPTX rows).

---

## 3. 🔭 Scope

### ✅ In scope
- Cài `xlsx` (SheetJS) từ **dist chính thức** (cdn.sheetjs.com tarball — npm registry outdated), pin version.
- XLSX: giá trị formatted (`w`/format), empty cell, merged cells (flatten + warning), multi-sheet theo thứ tự workbook, row cap 500 → `sheet-truncated`.
- PPTX: unzip bằng jszip; slide order theo `presentation.xml`; title/body placeholder; bullet indent levels; speaker notes → blockquote; media → `ReportAsset` + `asset://<id>`.
- Đăng ký cả hai vào registry; warnings chuẩn; fixtures + snapshot tests.

### ⛔ Out of scope
- Formula engine / recalc Excel (chỉ giá trị); chart/pivot render.
- SmartArt/animation/transition PPTX; vị trí tuyệt đối textbox (thứ tự đọc XML là chấp nhận được).
- Chỉnh sửa lại slide (Present/pptxgenjs là chiều xuất — không đổi).

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W23-import-office`.

### Day 1 — XLSX Core
- Cài `xlsx` (dist chính thức, pin — approve trước). `[NEW]` `converters/xlsx.ts`: sheet → `## <Sheet>` + bảng GFM.
- Giá trị cell theo formatted text; escape ký tự phá bảng GFM (`|`, newline trong cell).

### Day 2 — XLSX Hardening & Registry
- Merged cells flatten + warning; row cap 500 → `sheet-truncated`; multi-sheet order; sheet ẩn bỏ qua + warning.
- Đăng ký registry + fixtures xlsx (bảng điểm/thống kê VN).

### Day 3 — PPTX Parser Core
- `[NEW]` `pptx/slide-xml.ts` — parse `presentation.xml` (slide order) + `slideN.xml` (title/body/bullet indent).
- `[NEW]` `converters/pptx.ts`: slide → `## <title>` + bullets; notes (`notesSlideN.xml`) → blockquote.

### Day 4 — PPTX Media & Registry
- `ppt/media/*` → `ReportAsset` (map qua rels); ảnh đặt sau text slide tương ứng.
- SmartArt/chart/OLE → `unsupported-element` (không chặn); đăng ký registry.

### Day 5 — Fixtures, Tests & QA
- Fixtures pptx (slide bảo vệ thật: title/bullets/notes/ảnh) + snapshot tests cả hai format.
- `[NEW]` `Design/Reports/Month6/W23/W23_QA_Report.md` + `build_output.txt`.

---

## 5. 📦 Dependencies installed this week

| Library | Why | Stack ref |
|---|---|---|
| `xlsx` (SheetJS) | XLSX parse client-side; cài từ dist chính thức cdn.sheetjs.com (npm outdated/CVE cũ), pin version | `6.Import.md` §5, §8 |
| *(pptx: none)* | Dùng `jszip` sẵn có + XML parse tay | `6.Import.md` §5 |

---

## 6. 📤 Deliverables

- XLSX → sections + bảng GFM đúng giá trị formatted; truncate/merge có warning.
- PPTX → outline Markdown (heading/bullets/notes) + ảnh thành asset.
- Cả hai cắm vào registry mà không sửa core W21 (chứng minh extension point).
- `Design/Reports/Month6/W23/` QA report + build log.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| SheetJS bản npm cũ (CVE) cài nhầm | High | Cài từ cdn.sheetjs.com tarball, pin; ghi rõ trong lockfile/QA. |
| Cell chứa `\|`/newline phá bảng GFM | Medium | Escape khi stringify; test cell hiểm. |
| Slide XML biến thể (theme/layout kế thừa) | Medium | Chỉ đọc placeholder chuẩn; lạ → `unsupported-element`; fixtures đa nguồn (PowerPoint/Google Slides export). |
| Sheet khổng lồ treo UI | Medium | Row cap 500 + warning; W24 worker. |
| Media rels map sai → ảnh lạc slide | Low | Map qua `slideN.xml.rels`; test fixture có ≥2 slide ảnh. |

---

## 8. ✅ Definition of Done

- [ ] Lint + typecheck + build xanh; Vitest xanh.
- [ ] XLSX fixtures: giá trị formatted đúng, merged/truncate có warning, multi-sheet đúng thứ tự.
- [ ] PPTX fixtures: đúng thứ tự slide, title/bullets/notes/ảnh sang đủ; SmartArt/chart → warning, không crash.
- [ ] Không sửa registry core/dropzone khi thêm 2 converter (diff review).
- [ ] `xlsx` cài từ dist chính thức, pinned; jszip không thêm bản mới.
- [ ] QA report + build log tại `Design/Reports/Month6/W23/`.
- [ ] Commit kèm contract, branch `feature/W23-import-office`.
