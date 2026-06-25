# Contract For AI — W9 Break: Separate Evidence-Broken Warning From Bullets, Drop Dead `estimatedSeconds`, De-dup Parse & Strengthen Title Assertions

> **Lane:** Core / break_task / week9_break.
> **Branch:** `feature/W9-slide-outline` (hoặc `polish/w9-present-cleanups`).
> **Type:** Maintainability / robustness / test-fidelity — review findings **S2**, **S3**, **S4**, **S5** (W9 code review).
> **Builds on:** Group A (`generate-outline.ts`), Group B (`timeline.ts`, `present.ts`), Group E (`present-integration.test.ts`).
> **Sources:** W9 code review (session 2026-06-25), `Design/ContractForAI/Core/month3/W9/w9a_*`, `w9b_*`, `w9e_*`, `5.Present.md §6` (edge cases), `Design/Modules/Other/CanonicalTypes.md §9`.

---

## 1. Micro-task Target

Dọn bốn điểm nợ **không chặn merge** của W9: (a) chuỗi cảnh báo minh chứng gãy bị **trộn vào mảng `bullets`** (dữ liệu lẫn trình bày, đếm vào cap 5, có thể bị cắt mất, ở UI thành bullet sửa/xóa được); (b) field `estimatedSeconds` trên `SlideOutline` **không bao giờ được set** (field chết, lệch ý w9b); (c) mỗi section bị **`parseMarkdown` hai lần**; và (d) test tích hợp đa template **không** khẳng định title khớp heading đánh số (acceptance gốc của w9a/w9e). Mục tiêu: tách bạch dữ liệu/cảnh báo, gỡ field chết, parse một lần, và siết test cho đúng DoD — vẫn deterministic, offline, không đổi hành vi cho input hợp lệ.

- **S2 Chuỗi cảnh báo trộn vào `bullets`.** [generate-outline.ts:120-128](src/modules/present/generate-outline.ts) khi link có keyword (`github`/`demo`/`video`…) nhưng **không** khớp evidence nào, đẩy thẳng `"[Cảnh báo: Minh chứng đã bị xóa]"` vào mảng `bullets`. Hệ quả: (i) [generate-outline.ts:133](src/modules/present/generate-outline.ts) `bullets.slice(0, 5)` có thể **cắt mất** cảnh báo nếu đã đủ 5 bullet nội dung; (ii) ở [SlideOutlineView.tsx:57-76](src/modules/present/SlideOutlineView.tsx) cảnh báo thành **input sửa/xóa được** và **đếm vào cap 5** ([PresentPanel.tsx:78](src/modules/present/PresentPanel.tsx)) — trộn dữ liệu chương mục với tín hiệu hệ thống. w9e §3 yêu cầu "ref gãy → bỏ **có ghi chú** (không vỡ)" nhưng ghi chú nên là metadata, không phải bullet nội dung.
- **S3 `estimatedSeconds` là field chết.** [present.ts:11](src/types/present.ts) khai `estimatedSeconds?: number` trong `SlideOutline`; w9b §2 nói "Ghi `estimatedSeconds` ngược lại outline nếu cần". Thực tế [timeline.ts:11-24](src/modules/present/timeline.ts) chỉ ghi `seconds` vào `slots`, **không** populate `estimatedSeconds`; không nơi nào set/đọc field này → field chết gây hiểu nhầm nguồn thời lượng.
- **S4 Parse hai lần mỗi section.** [generate-outline.ts:153](src/modules/present/generate-outline.ts) `parseMarkdown(s.markdown)` để lấy headings, rồi [generate-outline.ts:169](src/modules/present/generate-outline.ts) parse **lại** cùng markdown để segment. Hai lần parse/section, thừa.
- **S5 Test tích hợp không assert title-khớp-heading.** [present-integration.test.ts:57-62](src/modules/present/present-integration.test.ts) chỉ kiểm `slide.order === idx` + `title` defined, **không** so title với heading đánh số — đúng acceptance "giữ đúng dòng chương mục" của w9a/w9e §6. (Unit test [generate-outline.test.ts:52-77](src/modules/present/generate-outline.test.ts) đã assert mạnh ở mức 1 template, nên đây là củng cố đa-template, rủi ro thấp.)

> 🔒 **Không đổi shape công khai trừ khi gỡ field chết (Locked #2).** S3: hoặc **populate** `estimatedSeconds` (ghi `seconds` ngược vào outline trong `buildTimeline` — trả bản mới, immutable, đúng w9b "trả bản mới") **hoặc** **gỡ** field khỏi `SlideOutline` + `slideOutlineSchema` + CanonicalTypes §9. Chọn **một**, ghi rõ; nếu gỡ thì cập nhật §9 đồng bộ.
> 🔒 **Deterministic, offline (Locked #3).** S2/S4 không đổi nội dung bullets hợp lệ; chỉ tách cảnh báo ra field riêng + parse một lần. Cùng input → cùng outline.

## 2. Scope

### In scope
- **S2** `src/types/present.ts` + `CanonicalTypes.md §9` (MODIFY): thêm field metadata cho cảnh báo gãy, ví dụ `brokenEvidenceNotes?: string[]` (hoặc `warnings?: string[]`) vào `SlideOutline` + zod — **không** lẫn vào `bullets`.
  `src/modules/present/generate-outline.ts` (MODIFY): khi phát hiện link keyword không khớp evidence → push vào `brokenEvidenceNotes` thay vì `bullets`; `bullets.slice(0,5)` chỉ áp cho bullets nội dung (cảnh báo không bị cap cắt).
  `src/modules/present/SlideOutlineView.tsx` (MODIFY): render `brokenEvidenceNotes` ở **khối cảnh báo riêng** (không phải input bullet sửa được), CSS `var(--rs-*)` (đồng bộ contract fix `w9_fix_*`); cảnh báo **không** đếm vào cap 5 bullets ([PresentPanel.tsx:78](src/modules/present/PresentPanel.tsx) chỉ đếm bullets thực).
- **S3** (chọn một, ghi rõ trong PR): **(A) populate** — `src/modules/present/timeline.ts` (MODIFY) hoặc helper trả `{ outline, timeline }` ghi `estimatedSeconds = seconds` vào bản outline mới (immutable); panel dùng giá trị đó. **(B) gỡ** — bỏ `estimatedSeconds` khỏi `present.ts`/`slideOutlineSchema`/CanonicalTypes §9 (khuyến nghị nếu chưa có nhu cầu hiển thị per-slide ngoài timeline). Giữ `seconds` ở `slots` là nguồn thời lượng duy nhất.
- **S4** `src/modules/present/generate-outline.ts` (MODIFY): parse mỗi section **một lần**, tái dùng AST cho cả gom-heading lẫn segment (truyền AST đã parse vào nhánh build `globalNumbered`, hoặc đảo thứ tự để chỉ parse một lượt/section). Bảo toàn output.
- **S5** `src/modules/present/present-integration.test.ts` (MODIFY): thêm assert title-khớp-heading cho ≥2 template — với mỗi slide có `fromSectionId`, title **bắt đầu bằng số chương** (regex `^\d+(\.\d+)*\.\s`) **hoặc** so trực tiếp với h## 3. Checklist
- [x] `SlideOutline` có field cảnh báo riêng (`brokenEvidenceNotes`/`warnings`) ở `present.ts` + zod + CanonicalTypes §9; `bullets` **không** còn chứa `"[Cảnh báo:"`.
- [x] Cảnh báo render ở khối riêng (không sửa/xóa như bullet); không đếm vào cap 5.
- [x] `estimatedSeconds`: **populate** hoặc **gỡ** dứt điểm (không để field chết); §9 đồng bộ. (Gỡ dứt điểm).
- [x] `generateSlideOutline`: parse mỗi section **một lần**; output bảo toàn.
- [x] `present-integration.test.ts`: assert title khớp heading đánh số ≥2 template + không có cảnh báo lẫn trong bullets.
- [x] ≤200 dòng/file; 4 gates xanh; lưu `build_output.txt` thật.

## 4. Expected Interfaces / Files

> Public API hàm giữ nguyên signature. Thay đổi shape chỉ ở `SlideOutline` (thêm field cảnh báo; +/- `estimatedSeconds`) — cập nhật zod + CanonicalTypes §9 đồng bộ.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/types/present.ts` | MODIFY | ~±6 (field cảnh báo; +/- estimatedSeconds) |
| `Design/Modules/Other/CanonicalTypes.md` | MODIFY | ~±8 (§9 đồng bộ) |
| `src/modules/present/generate-outline.ts` | MODIFY | ~±15 (cảnh báo ra field + parse 1 lần) |
| `src/modules/present/timeline.ts` | MODIFY (nếu chọn populate) | ~±6 |
| `src/modules/present/SlideOutlineView.tsx` | MODIFY | ~+8 (khối cảnh báo) |
| `src/modules/present/generate-outline.test.ts` | MODIFY | ~±10 (cảnh báo ở field) |
| `src/modules/present/present-integration.test.ts` | MODIFY | ~+15 (title-khớp-heading) |
| `Design/Reports/Month3/W9/build_output.txt` | MODIFY | output 4 gates thật |

> **Import boundary:** outline/timeline import `@/types` + `@/lib` + `@/modules/format`; view import `@/types`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Thêm field shape làm vỡ caller cũ | TB | Field optional; zod `.optional()`; cập nhật §9; grep caller `SlideOutline` (chỉ module present + test). |
| Test cũ assert cảnh báo trong `bullets` | TB | Cập nhật [generate-outline.test.ts] ca ref gãy sang đọc `brokenEvidenceNotes`; vàng còn lại giữ. |
| Gỡ `estimatedSeconds` ảnh hưởng W10 (script bám thời lượng) | Thấp | W10 đọc timeline `slots[].seconds` là nguồn thật; nếu cần per-slide, chọn nhánh **populate** thay vì gỡ. |
| Parse một lần làm lệch thứ tự heading | Thấp | Tái dùng đúng AST đã parse; test vàng order/numbering giữ xanh. |

## 6. Verification Plan
- Link github không có trong evidence → `slide.brokenEvidenceNotes` chứa cảnh báo; `slide.bullets` **không** chứa `"[Cảnh báo:"`; cap 5 vẫn đủ bullets nội dung.
- `estimatedSeconds`: nếu populate → bằng `seconds` của slot tương ứng (immutable, outline gốc không đổi); nếu gỡ → grep `estimatedSeconds` toàn repo = rỗng (trừ lịch sử).
- `generateSlideOutline` gọi `parseMarkdown` đúng **một** lần/section (spy/đếm); output giống trước.
- integration ≥2 template: mọi slide title khớp heading đánh số (regex/so kỳ vọng); order liên tục.
- gọi 2 lần cùng bundle → outline giống hệt (deterministic).
- lint/typecheck/test/build (thật) xanh; dán vào `build_output.txt`.

## 7. Status

`DONE`

> ⛔ VibeCode Step 2: Đã hoàn thành dọn dẹp nợ kỹ thuật và kiểm định thành công. Đề xuất commit: (1) `refactor(present): move broken-evidence warning out of bullets into notes field`; (2) `refactor(present): drop dead estimatedSeconds`; (3) `perf(present): parse each section markdown once`; (4) `test(present): assert numbered title parity across templates`; (5) `docs(w9): real build_output after present polish`.
