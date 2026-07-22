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

- [ ] Heading IDs luôn prefixed/safe; reserved names (`__proto__`, `constructor`, `forms`, `location`...) không clobber; TOC anchors vẫn đúng.
- [ ] Final output sau KaTeX/highlight/Mermaid/asset transform được sanitize với explicit schema.
- [ ] iframe/object/embed/svg foreign refs/CSS URL/event attrs/dangerous protocols không tới preview/export/renderer.
- [ ] PDF regex không còn được mô tả như security boundary; primary renderer defense được link/test.
- [ ] Mọi HTML sink có source invariant và security regression test.

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

`PROPOSED — cần merge trước G CSP để CSP violations phản ánh đúng sink đã làm sạch.`

