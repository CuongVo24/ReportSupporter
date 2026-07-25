# Contract For AI — W25 Harden (I): DOM-Clobber Prefix · Final Sanitize · PDF Sanitizer Boundary Rõ

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** XSS/DOM integrity defense-in-depth.
> **Findings:**
> - **S1** (🟠) — `clobberPrefix: ""` tắt prefix chống DOM clobbering để giữ heading ID; ID do tài liệu ảnh hưởng có thể va chạm property/name nhạy cảm.
> - **S2** (🟠) — rehype sanitize chạy trước KaTeX/highlight output; output plugin sau sanitize không đi qua final allowlist. Plugin trusted/pinned giảm risk nhưng boundary dễ drift.
> - **S3** (🟡) — `sanitizePdfHtml` dùng regex nên có thể bỏ iframe/SVG image/CSS `url()`; renderer isolation mới là security boundary. Tên/comment hiện có thể khiến maintainer tin regex là sanitizer đầy đủ.
> - **S4** (🟠) — Nhiều sink preview/export dùng HTML; cần invariant rằng chỉ rendered/sanitized result được đưa vào DOM/renderer.
> **Builds on:** Markdown pipeline, TOC/export parity tests, Mermaid strict mode, W24-A asset placeholder.
> **Sources:** source review 2026-07-22.

---

## 1. Micro-task Target

Heading IDs an toàn và ổn định với prefix canonical; mọi plugin-generated HTML qua final allowlist schema; PDF HTML defense layer dùng parser/allowlist hoặc được rename/comment/test rõ là best-effort trước primary renderer boundary; sinks chỉ nhận branded sanitized HTML.

- **S1 — Stable safe IDs.** Dùng prefix như `rs-h-`; TOC/anchor/export/link generation cùng một helper. Có compatibility mapping/migration cho anchor cũ nếu cần.
- **S2 — Final sanitize.** Sau KaTeX/highlight/Mermaid placeholder transformations, chạy final schema allowlist cho class/aria/style tối thiểu; cấm event handlers, dangerous URLs/elements/attributes.
- **S3 — PDF defense.** Ưu tiên DOM/HAST parser allowlist. Nếu giữ regex, rename thành `stripKnownPdfHazardsBestEffort`, comment renderer sandbox/egress là primary, không claim HTML sanitizer.
- **S4 — Sink invariant.** Type/helper phân biệt raw vs sanitized/rendered HTML; audit `dangerouslySetInnerHTML`, `setContent`, export sinks và test corpus.

> 🔒 Không whitelist arbitrary style/class để giữ KaTeX. Không cho remote URL quay lại qua SVG/CSS. TOC/LOF/export parity phải giữ.

## 2. Scope

### In scope
- `src/lib/markdown-pipeline.ts` + heading slug/TOC helpers (MODIFY).
- `sanitize-pdf-html.ts` (MODIFY/RENAME): parser allowlist hoặc explicit best-effort layer.
- Preview/export/PDF sinks (REVIEW/MODIFY): sanitized type/helper.
- XSS/DOM clobber/final plugin output/parity tests + fuzz corpus (NEW/UPDATE).

### Out of scope
- ❌ Renderer sandbox/egress (E).
- ❌ CSP/remote image consent (G).
- ❌ Cho phép arbitrary imported HTML.

## 3. Checklist

- [x] Heading IDs luôn prefixed/safe (`user-content-`); reserved names (`constructor`, `prototype`, `body`, `location`, `attributes`, `children`, `forms`) không clobber; TOC anchors vẫn đúng.
- [x] Final output sau KaTeX/highlight/Mermaid/asset transform được sanitize với explicit schema — nay có thêm pass thu hẹp `style`/`className` sau `rehypeSanitize`.
- [x] iframe/object/embed không lọt qua schema (đã có từ trước). SVG `use` href/xlink:href bị chặn (mới). CSS `url()`/`expression()`/`@import` trong `style` bị chặn (mới). Event attrs/dangerous protocols không lọt (đã có từ trước qua rehype-sanitize protocols).
- [x] PDF regex không còn được mô tả như security boundary — comment sửa lại chính xác (bỏ claim gVisor không có thật), alias `sanitizePdfHtml` (tên gây hiểu nhầm) đã xoá, chỉ còn `stripKnownPdfHazardsBestEffort`.
- [x] HTML sink có source invariant: `asSanitizedHtml` không còn export (chỉ `markdown-pipeline.ts` tự gọi được); TOC (`toc-renderer.ts`) có brand type riêng (`TrustedTocHtml`) độc lập; Mermaid SVG đi qua `sanitizeSvgMarkup()` (boundary riêng, không còn raw `dangerouslySetInnerHTML` của output third-party chưa qua sanitize).

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/lib/markdown-pipeline.ts` | MODIFY | prefix + final schema sanitize |
| heading/TOC helpers | MODIFY | one canonical ID function |
| `src/app/api/pdf/sanitize-pdf-html.ts` | MODIFY/RENAME | parser allowlist hoặc explicit best-effort |
| Preview/export sinks | REVIEW/MODIFY | raw/sanitized boundary |
| security/parity tests | NEW/UPDATE | clobber/plugin/XSS corpus |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Prefix đổi làm anchor/bookmark cũ hỏng | High | Compatibility redirect/map trong session/export; fixture legacy; document breaking scope. |
| Final sanitize làm vỡ KaTeX/highlight | High | Explicit minimal schema từ actual output; semantic/screenshot parity; không broad wildcard. |
| Parser sanitizer tăng bundle/cost | Med | Tái dùng HAST/unified đã có; run worker nếu phù hợp; measure report lớn. |
| Branded type tạo false confidence | Med | Runtime sanitizer tại boundary vẫn bắt buộc; type chỉ hỗ trợ audit, không thay validation. |

## 6. Verification Plan

- Fuzz headings/HTML attributes/names/IDs và assert DOM globals/forms/location không bị shadow; TOC click đúng preview/export.
- Corpus KaTeX/highlight/Mermaid + malicious plugin-like output; final HTML không executable và visual parity đạt.
- PDF corpus iframe/SVG/CSS URL/data JS: renderer canary 0 outbound/0 script marker; artifact hợp lệ hoặc fail closed.

## 7. Status

`DONE (2026-07-25, re-verified after REOPEN — file status vs index mismatch fixed).`

Review 2026-07-25 (`w25_fix-all-bugs.md` §1.1.4, §1.2) tìm thấy: file này ghi `PROPOSED` trong khi index tổng ghi `DONE` — tự mâu thuẫn; nội dung thực tế: heading prefix + final-sanitize-after-KaTeX/highlight + PDF regex rename ĐÃ có (commit trước), nhưng `asSanitizedHtml` vẫn export công khai (bất kỳ module nào cast raw string thành `SanitizedHtml`), `customSchema` cho `style`/`className` không giới hạn giá trị (chỉ giới hạn tên attribute), `<use>` không bị chặn href, Mermaid SVG đi thẳng `dangerouslySetInnerHTML` không qua sanitize riêng của app, TOC builder trả `string` thường dù tự escape đầy đủ, comment PDF regex tuyên bố "gVisor isolation" không có thật trong deployment, và alias `sanitizePdfHtml` (tên cũ gây hiểu nhầm) vẫn còn.

Re-fix 2026-07-25:
- **`asSanitizedHtml` không còn export.** Chỉ hàm nội bộ `markdown-pipeline.ts` (đã chạy full parse→sanitize→stringify) mới mint được `SanitizedHtml`; xác nhận trước khi sửa không có external caller nào (grep) nên đổi an toàn, zero breaking change.
- **Pass thu hẹp `style`/`className` sau `rehypeSanitize`.** File mới `src/lib/sink-style-narrowing.ts` — walk hast tree thủ công (không thêm dependency `unist-util-visit`), giữ `className` chỉ với prefix cho phép (`katex`, `hljs`, `ws-`, `language-`, `mermaid`), giữ `style` chỉ với property allowlist (color/font/spacing/border/display cơ bản — không `position`/`z-index`/`filter`/`transform`), và chặn value chứa `url(`/`expression(`/`javascript:`/`@import` bất kể property. Wire vào cả `renderProcessor` và `astRenderProcessor`, sau `rehypeSanitize`.
- **`<use>` không còn nhận `href`/`xlink:href`.** `customSchema.attributes.use = []` — rehype-sanitize chỉ allowlist được TÊN attribute chứ không pattern giá trị (không thể chỉ cho phép `href="#..."`), nên lựa chọn an toàn là chặn hẳn tham chiếu.
- **Mermaid SVG có sink riêng đã sanitize.** `sanitizeSvgMarkup()` mới trong `markdown-pipeline.ts` (dùng `rehype-parse` + cùng `customSchema` + pass thu hẹp ở trên); `MermaidRenderer.tsx` gọi hàm này TRƯỚC khi set state đưa vào `dangerouslySetInnerHTML` — `securityLevel: "strict"` của Mermaid giữ nguyên như defense-in-depth, không còn là boundary duy nhất.
- **TOC có brand type riêng.** `toc-renderer.ts`: `TrustedTocHtml` (không export constructor) — độc lập với `SanitizedHtml` của markdown pipeline, đúng yêu cầu "builder khác phải trả type qua boundary riêng".
- **PDF comment sửa chính xác + alias xoá.** Comment không còn nhắc "gVisor" (không có thật); liệt kê đúng control thật (Chromium sandbox mặc định + `cap_drop: ALL` + `internal: true` network từ E). `export const sanitizePdfHtml = ...` (alias) xoá hẳn; mọi caller (`route.ts`, test) đổi sang `stripKnownPdfHazardsBestEffort`.
- **Phát hiện phụ khi viết test:** `markdown-pipeline.ts` không bật `rehype-raw`/`allowDangerousHtml` — HTML thô gõ trực tiếp trong markdown source KHÔNG trở thành element thật (bị coi là text trơ). Đây là một lớp bảo vệ khác, độc lập với `customSchema`; `customSchema`/pass thu hẹp thực chất chỉ quan trọng cho HTML do KaTeX/rehype-highlight tự sinh và cho `sanitizeSvgMarkup()` (Mermaid). Ghi nhận lại ở đây vì ban đầu viết test sai theo giả định ngược, sửa test để trỏ đúng pathway (`sanitizeSvgMarkup`) thay vì `renderMarkdown` với raw `<span>`.

Test: `markdown-pipeline.fuzz.test.ts` +8 test (asSanitizedHtml không export, style/className narrowing qua `sanitizeSvgMarkup`, Mermaid script/onload/use-href stripped, unparseable input không throw). Toàn bộ `src/lib`, `src/modules/format`, `src/modules/write`, `src/app/api/pdf`, `src/components` (366 test) xanh sau khi wire.

