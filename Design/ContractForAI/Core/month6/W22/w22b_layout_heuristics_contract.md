# Contract For AI - W22 Group B: Layout Heuristics (Heading / Paragraph / List)

> **Lane / Week:** Core / Month 6 / W22 - Day 2 (`Design/TaskBrief/Core/month6/w22.md` `[C178]`-`[C179]`).
> **Branch:** `feature/W22-import-pdf`.
> **Builds on:** W22A (`TextItem[]` plain data), W21 (strip-heading helper, `ImportWarning`).
> **Depended on by:** Group C/D (flow lắp heuristic), W24 (preview remap `heading-guessed`).
> **Sources:** `w22.md` Locked #2/#3, `6.Import.md` §5 (PDF strategy).

---

## 1. Micro-task Target

Dựng tầng **heuristic layout** dạng **pure functions** trên `TextItem[]`: (1) font-size clustering → heading map — body = mode (size phổ biến nhất), các bậc lớn hơn → h1/h2/h3 (tối đa 3 cấp), **mọi heading sinh ra gắn `heading-guessed`**; (2) paragraph merge theo khoảng cách dọc/indent + list detection (•, -, "1.", "a)") → GFM list. Đây là trái tim chất lượng PDF→MD — phải test dày, không cần file PDF thật.

> **🔒 Pure functions (Locked #2).** Input `TextItem[]` → output Markdown blocks + warnings; không I/O, không pdfjs.
> **🔒 Heading luôn `heading-guessed` (Locked #3).** PDF không có heading "chắc chắn"; user xác nhận ở preview W24.
> **⚠️ Bảo thủ hơn là tham.** Nghi ngờ → paragraph thường; heading rác phá cấu trúc tệ hơn thiếu heading.

## 2. Scope

### In scope (`[C178]`/`[C179]`)
- `src/modules/import/pdf/heading-heuristic.ts` (**NEW**): histogram font-size → mode = body; bậc lớn hơn (ngưỡng tương đối, ví dụ ≥1.15×) → heading level, tối đa 3 cấp; dòng ngắn + đậm (fontName chứa Bold) tăng tin cậy; strip số chương (helper W21).
- `src/modules/import/pdf/paragraph-merge.ts` (**NEW**): merge dòng cùng khối (khoảng cách dọc < ngưỡng theo lineHeight ước lượng), giữ hard-break khi khoảng cách lớn; hyphenation nối từ cắt cuối dòng ("-\n").
- List detection: prefix •/-/–/*/"1."/"a)" → GFM `-`/`1.`; indent x → nested một cấp.
- Warnings: mỗi heading → `heading-guessed` (kèm `location: "page N"`).

### Out of scope
- ❌ Bảng/2 cột (Group D — flatten + warning); ảnh/scan (Group C).
- ❌ ML/model-based layout; heading >3 cấp từ PDF; đọc bookmark/outline PDF (ghi backlog nếu muốn).

## 3. Checklist
- [ ] Pure: không import pdfjs/DOM/fetch trong 2 file heuristic.
- [ ] Cluster: body đúng theo mode; 1-3 bậc heading theo size; dòng dài không thành heading dù size lớn hơn nhẹ.
- [ ] Merge: đoạn nhiều dòng → 1 paragraph; hyphenation nối đúng; khoảng cách lớn tách đoạn.
- [ ] List: bullet + numbered + nested một cấp ra GFM đúng.
- [ ] Mọi heading có `heading-guessed` + location; số chương strip.
- [ ] Unit tests ≥ 15 case (fixture `TextItem[]` viết tay, không cần PDF).
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/pdf/heading-heuristic.ts` | NEW | cluster → heading map |
| `src/modules/import/pdf/paragraph-merge.ts` | NEW | merge + hyphen + list |
| `src/modules/import/pdf/*.test.ts` | NEW | ≥15 case TextItem viết tay |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Heading giả (chữ to trang bìa, caption đậm) | High | Điều kiện kép size+độ dài+đậm; bảo thủ (⚠️ trên); preview remap là lưới cuối. |
| PDF nhiều font size lộn xộn → cluster nát | Medium | Fallback: không tìm được mode rõ → toàn paragraph + warning. |
| Hyphenation nối sai từ tiếng Việt | Medium | Chỉ nối khi dòng sau bắt đầu chữ thường; test tiếng Việt. |
| Ngưỡng magic number cứng | Medium | Ngưỡng là hằng đặt tên + comment lý do, chỉnh được một chỗ. |

## 6. Verification Plan
- Vitest ≥15 case xanh (heading các bậc, đoạn, list, hyphen, fallback lộn xộn).
- 4 gates xanh; review: 2 file không import gì ngoài types + helper.
- Chạy thử trên extract của PDF thật (W22A) → mắt thường xác nhận hợp lý (ghi vào QA Group E).

## 7. Status

`COMPLETED`

> Commit: `feat(import): pdf heading heuristic via font-size clustering`; `feat(import): pdf paragraph merge + list detection`; `docs(import): commit w22b contract`.
