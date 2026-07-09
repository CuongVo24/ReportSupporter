# Contract For AI - W21 Group A: Import Types & Reverse Pipeline

> **Lane / Week:** Core / Month 6 / W21 - Day 1 (`Design/TaskBrief/Core/month6/w21.md` `[C166]`-`[C167]`).
> **Branch:** `feature/W21-import-foundation`.
> **Builds on:** `CanonicalTypes.md` §11 (Import Model — V1.2), `PipelineContract.md` §4 (Import Boundary), pipeline unified W2, sanitize policy preview.
> **Depended on by:** Group B-E (mọi converter dùng types + `htmlToMarkdown()`), toàn bộ W22-W24.
> **Sources:** `w21.md` Locked #1/#2, `MasterRoadMap.md` Phase 5, `6.Import.md` §3/§4.

---

## 1. Micro-task Target

Đưa **Import Model** vào code (`src/types/import.ts` + zod, khớp CanonicalTypes §11, thêm `"import"` vào `ReportIssue.module`) và dựng **reverse pipeline** `htmlToMarkdown()` (sanitize → `rehype-remark` → `remark-stringify`, GFM) — nền cho mọi converter Phase 5. Cài 3 runtime deps exact pin: `rehype-remark`, `remark-stringify`, `mammoth` (mammoth cài trước cho Group C, chưa dùng ở đây).

> **🔒 Markdown là giao diện duy nhất (Locked #1).** Không API nào của module Import trả mdast/hast ra ngoài.
> **🔒 Reverse pipeline khoá trong Import (Locked #2).** `rehype-remark`/`remark-stringify` chỉ được import trong `src/modules/import/`.
> **⚠️ Sanitize bắt buộc** trước rehype-remark — cùng policy `rehype-sanitize` của preview (PipelineContract §4).

## 2. Scope

### In scope (`[C166]`/`[C167]`)
- `src/types/import.ts` (**NEW**): `ImportSourceFormat`, `ImportWarningCode`, `ImportWarning`, `ImportResult`, `ImportConverter`, `ImportDraft` + zod schemas; export qua `src/types/index.ts`.
- `src/types/` (MODIFY): `ReportIssue.module` union thêm `"import"`.
- `package.json`/lockfile (MODIFY): `rehype-remark`, `remark-stringify`, `mammoth` — runtime, exact pin, `npm install --save-exact`.
- `src/modules/import/html-to-markdown.ts` (**NEW**): sanitize → hast → rehype-remark → mdast → remark-stringify (GFM). Unit test heading/list/table/img/blockquote/code/inline-format.

### Out of scope
- ❌ Registry/dropzone (Group B), DOCX converter (Group C), assets/split (Group D), fixtures/QA (Group E).
- ❌ Mọi converter format khác; preview UI; worker.
- ❌ Sửa shape ngoài CanonicalTypes §11 đã khoá (đổi shape → sửa CanonicalTypes trước).

## 3. Checklist
- [ ] `src/types/import.ts` khớp đúng CanonicalTypes §11; zod ở ranh giới I/O; no `any`.
- [ ] `ReportIssue.module` có `"import"`; typecheck toàn repo xanh.
- [ ] 3 deps exact pin; lockfile commit; `npm ci` xanh.
- [ ] `htmlToMarkdown()` qua sanitize trước rehype-remark; output GFM.
- [ ] Unit tests đủ nhóm phần tử; HTML độc hại (script/onerror) bị strip.
- [ ] `rehype-remark`/`remark-stringify` không import ngoài `src/modules/import/`.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/types/import.ts` | NEW | types + zod, khớp §11 |
| `src/types/index.ts` | MODIFY | re-export |
| `src/types/` (ReportIssue) | MODIFY | union + `"import"` |
| `package.json` / lockfile | MODIFY | 3 runtime deps exact |
| `src/modules/import/html-to-markdown.ts` | NEW | sanitize → rehype-remark → stringify |
| `src/modules/import/html-to-markdown.test.ts` | NEW | unit per element + XSS strip |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| XSS qua HTML trung gian | High | Sanitize bắt buộc + test độc hại. |
| Re-declare shape ngoài CanonicalTypes | Medium | Chỉ cite §11; review diff types. |
| Reverse pipeline rò module khác | Medium | Grep gate ở Group E; import qua `index.ts`. |
| Widening `module` union vỡ code cũ | Low | Union mở rộng an toàn; typecheck toàn repo. |

## 6. Verification Plan
- `npm ci` + 4 gates xanh; Vitest unit `html-to-markdown` pass.
- HTML mẫu chứa script/iframe/onerror → Markdown sạch, không HTML sống sót ngoài whitelist.
- grep: `rehype-remark|remark-stringify` chỉ xuất hiện trong `src/modules/import/`.

## 7. Status

`COMPLETED`

> Commit (trên `feature/W21-import-foundation`): `feat(import): html-to-markdown reverse pipeline`, `feat(import): add import model types + zod`, `chore(import): install rehype-remark, remark-stringify, rehype-parse, and mammoth exact pinned`.
