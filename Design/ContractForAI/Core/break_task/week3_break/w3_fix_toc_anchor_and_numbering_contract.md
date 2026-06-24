# Contract For AI — W3 Break: Fix TOC Anchors & Heading Numbering Parity

> **Lane:** Core / break_task / week3_break.
> **Branch:** `feature/W3-format-check` (hoặc `fix/w3-toc-numbering`).
> **Type:** Bug fix — review findings **#1 (🔴)**, **#2 (🟡)**, **#4**, **#5** (W3 code review).
> **Builds on:** Group A (`numberHeadings`/`slugify`), Group B (`generateToc`, `PreviewPane` numbering + `TocBlock`), `markdown-pipeline.ts` (`customSchema`, `renderMdastToHtml`).
> **Sources:** W3 code review (TOC anchor / numbering parity), `Design/Modules/2.Format.md §5.1/§5.2`, `Design/TaskBrief/Core/month1/w3.md` Locked #1, `hast-util-sanitize` defaultSchema (`clobber`/`clobberPrefix`).

---

## 1. Micro-task Target

Vá cụm lỗi numbering/anchor của Format-Preview để **TOC click chạy được** và **số heading trong preview = số sẽ xuất ở export (W4)**.

Bốn lỗi cùng một vùng (`markdown-pipeline.ts` · `PreviewPane.tsx` · `generate-toc.ts` · `Workspace.tsx`):

- **#1 (🔴) TOC anchor gãy.** `hast-util-sanitize` defaultSchema có `clobber: [...,'id'], clobberPrefix: 'user-content-'`. `customSchema` chỉ spread defaultSchema, **không** override → heading `id="1-1-..."` bị đổi thành `id="user-content-1-1-..."`, trong khi `TocBlock` trỏ `href="#1-1-..."` → click TOC **không cuộn tới đâu**.
- **#2 (🟡) Numbering theo từng section, không theo cả tài liệu.** `Workspace` truyền `markdown={activeSection.markdown}` → `numberHeadings` đếm lại từ `1` cho mỗi section. Heading đầu của section 2 hiện "1" ở preview nhưng sẽ là "2" khi export gộp (W4) → phá vỡ Locked #1 ("preview numbering = export numbering").
- **#4 Off-by-one khi có heading rỗng.** `numberHeadings` bỏ heading rỗng, nhưng `injectHeadingNumbers` duyệt **mọi** node heading và `globalNumberedHeadings[state.index++]` mỗi node → heading rỗng "ăn" mất số của heading thật kế tiếp → lệch số toàn bộ phía sau.
- **#5 Dedup TOC mâu thuẫn.** `generateToc` thêm `-2/-3` cho id trùng, nhưng id từ `numberHeadings` đã number-prefix nên **luôn unique** (dedup gần như không bao giờ chạy); nếu chạy thì `href` TOC lệch với `id` heading thật (heading không dedup).

## 2. Scope

### In scope
- **#1** `src/lib/markdown-pipeline.ts` (`customSchema`): set `clobberPrefix: ""` (preview offline, một tài liệu — không lo va chạm id với chrome trang) và đảm bảo `id` nằm trong attributes cho `h1..h6` (nếu defaultSchema chưa cho id trên heading thì thêm). Mục tiêu: id render đúng bằng slug → khớp `href` TOC.
- **#2** `src/components/Workspace.tsx` + `src/components/PreviewPane.tsx`: tính numbering trên **toàn tài liệu** (duyệt `sections` theo `order`, parse từng section, gắn `sectionId` vào heading, `numberHeadings` trên danh sách gộp), rồi preview của section đang mở dùng **lát cắt** numbered headings của section đó. Preview vẫn chỉ render nội dung section active, nhưng **số** lấy từ numbering toàn cục.
  - `parse-headings.ts`: cho `parseHeadings(ast, sectionId?)` gắn `sectionId` vào mỗi `HeadingNode` (field đã có sẵn, hiện luôn `undefined`).
- **#4** `src/components/PreviewPane.tsx` (`injectHeadingNumbers`): **bỏ qua node heading rỗng** (text rỗng sau trim) — không tăng `state.index` cho chúng — để khớp với `numberHeadings` (vốn đã loại heading rỗng).
- **#5** `src/modules/format/generate-toc.ts`: gỡ dedup `-2/-3` **hoặc** dùng chung một nguồn id với heading render. Vì id `numberHeadings` đã unique, gỡ dedup là đủ và loại bỏ nguy cơ `href` lệch `id`. (Nếu muốn giữ phòng thủ, phải áp cùng dedup lên id heading render — phức tạp hơn, không khuyến nghị ở patch này.)
- **Regression tests** (thuần, không jsdom):
  - id heading render **bằng** `href` TOC (chứng minh #1): render mdast có heading → HTML chứa `id="1-1-..."` đúng bằng `node.id`/`generateToc` href.
  - empty-heading: doc có `##` rỗng giữa các heading → số các heading sau **không lệch** (chứng minh #4).
  - whole-doc numbering: 2 section, section 2 mở → heading đầu mang số tiếp nối (vd "2"), không reset "1" (chứng minh #2).

### Out of scope
- ❌ Đổi engine sanitize ngoài `clobberPrefix`/`id` allow (giữ chặn `javascript:`/raw HTML như cũ — Security).
- ❌ Caption numbering / list of figures (W7).
- ❌ Export thật (W4) — chỉ đảm bảo **nguồn số** dùng chung để W4 khớp.
- ❌ Checker findings #3/#6/#7/#8 (Contract 2 riêng — `w3_fix_checker_rule_false_positives_contract.md`).

## 3. Checklist
- [ ] `customSchema`: `clobberPrefix: ""`, `id` sống trên heading sau sanitize; **không** nới `javascript:`/raw HTML.
- [ ] `parseHeadings` gắn `sectionId`; `Workspace` dựng numbering toàn cục theo `order`; `PreviewPane` dùng lát cắt section active.
- [ ] `injectHeadingNumbers` bỏ qua heading rỗng (không tiêu `index`).
- [ ] `generateToc` không còn dedup mâu thuẫn (id đã unique).
- [ ] Tests: id==href · empty-heading không lệch · whole-doc numbering nối tiếp.
- [ ] 4 gates xanh (lint/typecheck/test/build).

## 4. Expected Interfaces / Files

```ts
// parse-headings.ts — thêm tham số optional, giữ tương thích
export function parseHeadings(ast: MdastRoot, sectionId?: string): HeadingNode[];

// markdown-pipeline.ts — customSchema:
//   clobberPrefix: "", attributes: { ...,'h1'..'h6': ['id'] (nếu cần) }
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/lib/markdown-pipeline.ts` | MODIFY | ~+4 (schema) |
| `src/components/PreviewPane.tsx` | MODIFY | ~+15 (slice numbering + skip empty) |
| `src/components/Workspace.tsx` | MODIFY | ~+15 (global numbering) |
| `src/modules/format/parse-headings.ts` | MODIFY | ~+3 (`sectionId`) |
| `src/modules/format/generate-toc.ts` | MODIFY | ~−8 (gỡ dedup) |
| `src/lib/markdown-pipeline.test.ts` · `generate-toc.test.ts` · `PreviewPane` numbering test | MODIFY/NEW | ~+50 |

> **Import boundary** không đổi. Thuần, offline, no `fetch`. Sanitize vẫn chặn XSS như W2 — chỉ đổi `clobberPrefix`.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| `clobberPrefix:""` mở id trùng giữa nội dung & chrome | Thấp | Preview là tài liệu đơn, offline; id đến từ slug number-prefix (unique). Không ảnh hưởng Security (vẫn chặn js:/raw HTML). |
| Whole-doc numbering làm preview chậm (parse mọi section) | Thấp/TB | Memoize theo `bundle.project.sections` (chỉ parse lại khi sections đổi); preview vẫn render 1 section. |
| `sectionId` optional làm vỡ call-site cũ | Thấp | Tham số optional, mặc định `undefined` — call-site cũ không đổi. |
| Gỡ dedup làm hồi quy nếu id thực sự trùng | Thấp | id number-prefix unique theo `numberHeadings`; test khẳng định id unique. |

## 6. Verification Plan
- Render heading qua pipeline → HTML `id` **đúng** `1-1-...` (không `user-content-`); `generateToc(...).href` khớp.
- Doc `# A` / `##` (rỗng) / `## B` → `B` vẫn nhận số đúng (không lệch vì heading rỗng).
- 2 section (`# Mở đầu` ở s1; `# Nội dung` ở s2), mở s2 → heading đầu s2 hiển thị "2" (nối tiếp), không "1".
- Click TOC trong preview → cuộn tới heading (manual, khi chạy app).
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `fix(preview): keep heading id through sanitize for TOC anchors`; (2) `fix(format): document-wide heading numbering + skip empty + drop toc dedup`; +1 docs commit (contract này).
