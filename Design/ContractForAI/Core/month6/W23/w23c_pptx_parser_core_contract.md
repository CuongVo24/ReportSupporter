# Contract For AI - W23 Group C: PPTX Parser Core (jszip + slide XML)

> **Lane / Week:** Core / Month 6 / W23 - Day 3 (`Design/TaskBrief/Core/month6/w23.md` `[C190]`-`[C191]`).
> **Branch:** `feature/W23-import-office`.
> **Builds on:** `jszip` sẵn có (W8 submission zip), W21 (registry/warnings/`ImportResult`).
> **Depended on by:** Group D (media + registry), W24 E2E.
> **Sources:** `w23.md` Locked #3/#6, `6.Import.md` §5 (PPTX row).

---

## 1. Micro-task Target

Dựng **PPTX parser core, zero dep mới**: `jszip` unzip + `DOMParser` đọc XML. `presentation.xml` (+ rels) → thứ tự slide; `slideN.xml` → title placeholder + body paragraphs với indent level; `notesSlideN.xml` → speaker notes. Converter: slide → `## <title>` (không title → `## Slide N`), body → GFM list theo indent, notes → blockquote sau bullets. Parser là hàm thuần trên string XML — test không cần file pptx thật.

> **🔒 Zero dep mới (Locked #3).** jszip + DOMParser; không parser lib.
> **🔒 Thứ tự đọc XML là chấp nhận được (Locked #6).** Không tái tạo vị trí tuyệt đối textbox; phần tử lạ → Group D xử lý warning.
> **⚠️ PPTX là chiều nhập** — không đụng `pptxgenjs`/Module 5 Present.

## 2. Scope

### In scope (`[C190]`/`[C191]`)
- `src/modules/import/pptx/slide-xml.ts` (**NEW**): parse `presentation.xml` + `_rels` → ordered slide list; parse `slideN.xml` → `{ title?, paragraphs: { text, indentLevel }[] }` (đọc `<p:sp>` placeholder type `title`/`ctrTitle` và body `<a:p>`/`<a:pPr lvl>`); parse `notesSlideN.xml` → text.
- `src/modules/import/converters/pptx.ts` (**NEW**): jszip mở file → slide-xml → Markdown: `## title` + list theo indent (tối đa 3 cấp) + `> notes`; slide trống → `## Slide N` + ghi chú trống.
- Unicode/xml-escape tiếng Việt đúng; text run (`<a:r>`) nối liền đúng thứ tự.

### Out of scope
- ❌ Media/ảnh + rels media (Group D); registry wiring (Group D).
- ❌ SmartArt/chart/OLE warning routing (Group D); layout/master inheritance (chỉ đọc slide XML trực tiếp); `.ppt` cũ (reject).

## 3. Checklist
- [ ] Slide order đúng theo `presentation.xml` (không theo tên file).
- [ ] Title placeholder nhận cả `title` và `ctrTitle`; không title → `## Slide N`.
- [ ] Bullets đúng indent (lvl 0-2 → list lồng); text runs nối đúng, tiếng Việt không vỡ.
- [ ] Notes → blockquote sau bullets; slide không notes → không blockquote rỗng.
- [ ] Parser pure trên string XML — unit tests với XML viết tay, không cần .pptx.
- [ ] Không import `pptxgenjs`/không dep mới; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/pptx/slide-xml.ts` | NEW | pure XML parse |
| `src/modules/import/converters/pptx.ts` | NEW | jszip + slide-xml → MD |
| `src/modules/import/pptx/slide-xml.test.ts` | NEW | XML viết tay ≥10 case |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| XML biến thể theo template/tool xuất | High | Chỉ đọc placeholder chuẩn; không nhận diện được → để Group D warning; fixtures 2 nguồn ở Group E. |
| Namespace XML xử lý sai với DOMParser | Medium | getElementsByTagNameNS/localName; test namespace đầy đủ. |
| Text run xé lẻ (mỗi ký tự 1 run) | Medium | Nối runs trong paragraph trước khi xử lý; test case run xé lẻ. |
| Vị trí textbox tự do sai thứ tự | Medium | Locked #6 — thứ tự XML; ghi limitation. |

## 6. Verification Plan
- Vitest slide-xml ≥10 case + converter unit xanh; 4 gates xanh.
- Manual: pptx đơn giản tự tạo → Markdown đúng title/bullets/notes.
- grep: không dep parser mới trong package.json.

## 7. Status

`COMPLETED`

> Commit: `feat(import): pptx slide xml parser (jszip + DOMParser, zero new deps)`; `feat(import): pptx converter — slides to headings/bullets/notes`; `docs(import): commit w23c contract`.
