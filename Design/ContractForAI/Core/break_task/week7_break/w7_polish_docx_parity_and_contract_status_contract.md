# Contract For AI — W7 Break: Harden DOCX Caption Matching, Edge Numbering & Contract Status Hygiene

> **Lane:** Core / break_task / week7_break.
> **Branch:** `feature/W7-format-hardening` (hoặc `polish/w7-docx-parity`).
> **Type:** Maintainability / robustness / governance — review findings **#5**, **#6**, **#8** (W7 code review).
> **Builds on:** Group A (`caption-registry.ts`), Group E (`docx-layout-checklist.ts`), W7 contracts `w7a..w7e` (§7 Status).
> **Sources:** W7 code review (session 2026-06-24), `Design/ContractForAI/Core/month2/W7/w7a_*`-`w7e_*`, `Design/ContractForAI/CONTRACT_STRUCTURE_RULE.md §5` (status values), Locked #1.

---

## 1. Micro-task Target

Dọn ba điểm nợ còn lại của W7 — **không** chặn merge nhưng làm checklist QA chắc hơn và đồng bộ trạng thái contract. Trọng tâm: làm parity-check caption trong DOCX checklist khớp theo **ranh giới nhãn** (tránh false-pass), xử lý biên đánh số caption trước chương đầu, và đưa §7 các contract W7 về đúng tập trạng thái hợp lệ.

- **#5 Parity-check caption khớp lỏng → có thể false-pass.** [docx-layout-checklist.ts:95-97](src/modules/export/docx-layout-checklist.ts) dùng `ac.text.startsWith(labelPrefix) || ac.text.includes(labelPrefix)`. Ở chế độ `continuous`, registry `"Hình 1"` khớp nhầm caption `"Hình 12: …"` (prefix), và chỉ cần **một** match bất kỳ nên có thể PASS dù thiếu đúng số đó. ⇒ checklist có thể báo "khớp hoàn toàn" sai.
- **#6 Caption trước chương đầu → "Hình 0.1".** [caption-registry.ts:51-54](src/modules/format/caption-registry.ts): per-chapter dùng `chapterNum`, nhưng figure/table xuất hiện **trước** h1 đầu tiên → `chapterNum = 0` → nhãn `"Hình 0.1"`/`"Bảng 0.1"`. Hiếm nhưng nhãn xấu.
- **#8 Status drift các contract W7.** `w7c`/`w7d`/`w7e` §7 vẫn `WAITING_FOR_APPROVAL` dù code đã commit & ship; `w7a`/`w7b` ghi `COMPLETED` — **không** thuộc tập hợp lệ của [CONTRACT_STRUCTURE_RULE.md §5](Design/ContractForAI/CONTRACT_STRUCTURE_RULE.md) (`WAITING_FOR_APPROVAL`/`READY_TO_IMPLEMENT`/`IN_PROGRESS`/`DONE`/`BLOCKED`). ⇒ traceability lệch thực tế.

> 🔒 **Một nguồn số (Locked #1).** #5 chỉ siết *cách verify* nhãn so với registry — vẫn so với cùng `CaptionEntry.label`, không đánh số lại.
> 🔒 **Không đổi shape canonical.** `CaptionEntry`/`DocxLayoutCheck` giữ nguyên; #6 chỉ đổi giá trị nhãn ở biên.

## 2. Scope

### In scope
- **#5** `src/modules/export/docx-layout-checklist.ts` (MODIFY): so khớp nhãn theo **ranh giới** thay vì prefix lỏng — vd `new RegExp(\`^\${escapeRegExp(labelPrefix)}(?=[\\s:.\\-]|$)\`)` để `"Hình 1"` **không** khớp `"Hình 12"`. Khuyến nghị thêm: match **theo `id`** (registry entry `id` ↔ `node.data.hProperties.id`) trước, fallback nhãn — đảm bảo đối chiếu vị-trí thay vì "có match bất kỳ". Cập nhật detail `unmatched` cho chính xác. Không đổi `DocxLayoutCheck` shape.
- **#6** `src/modules/format/caption-registry.ts` (MODIFY): khi `captionNumbering === "per-chapter"` và `chapterNum === 0` (chưa gặp h1), clamp về chương `1` (hoặc dùng `Math.max(chapterNum, 1)` khi dựng nhãn). Continuous không đổi. Cập nhật `captions.test.ts` cho ca figure-trước-h1.
- **#8** `Design/ContractForAI/Core/month2/W7/w7a..w7e` (MODIFY §7 Status): đưa cả 5 về `DONE` (đã ship & gate xanh sau contract fix). **Không** sửa nội dung scope/checklist các contract; chỉ trường Status (CONTRACT_STRUCTURE_RULE §4: không move/rename/xoá, chỉ cập nhật status hợp lệ). Nếu muốn giữ "COMPLETED" như từ vựng dự án thì **bổ sung** `COMPLETED` vào danh sách hợp lệ ở `CONTRACT_STRUCTURE_RULE.md §5` — chọn **một** hướng (khuyến nghị: chuẩn hoá về `DONE`).
- **Tests**: `caption-registry`/`captions.test.ts` phủ figure trước h1 → nhãn `"Hình 1.1"` (không `0.1`); `docx-layout-checklist.test.ts` thêm ca registry "Hình 1" + caption "Hình 12" → **không** false-pass (báo thiếu "Hình 1").

### Out of scope
- ❌ Đổi shape `CaptionEntry`/`DocxLayoutCheck`/`ReportIssue` (canonical).
- ❌ Đổi thuật toán đánh số caption tổng thể (Locked #1 — chỉ vá biên `chapterNum=0`).
- ❌ Sửa logic lint/`any`/parity preview (→ contract `w7_fix_caption_parity_and_lint_gate_contract.md`).
- ❌ Move/rename/xoá contract (CONTRACT_STRUCTURE_RULE §4); chỉ chỉnh trường Status.
- ❌ Dep mới / network.

## 3. Checklist
- [ ] Checklist DOCX: khớp nhãn theo ranh giới (hoặc theo `id`); `"Hình 1"` không khớp `"Hình 12"`.
- [ ] `caption-registry`: figure/table trước h1 → nhãn chương `1`, không `0`.
- [ ] §7 Status của `w7a..w7e` về `DONE` (hoặc `COMPLETED` đã được hợp thức ở §5 — ghi rõ lựa chọn).
- [ ] Test phủ: false-pass nhãn + figure-trước-h1.
- [ ] ≤200 dòng/file; 4 gates xanh (sau cả contract fix).

## 4. Expected Interfaces / Files

> Không đổi public API. Chỉ siết logic verify + giá trị nhãn ở biên + trường Status tài liệu.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/docx-layout-checklist.ts` | MODIFY | ~+10 (match ranh giới/id) |
| `src/modules/format/caption-registry.ts` | MODIFY | ~+2 (clamp chapter≥1) |
| `src/modules/export/docx-layout-checklist.test.ts` | MODIFY | ~+15 (ca false-pass) |
| `src/modules/format/captions.test.ts` | MODIFY | ~+12 (figure trước h1) |
| `Design/ContractForAI/Core/month2/W7/w7a..w7e_*.md` | MODIFY | ~5×(±1 dòng Status) |
| `Design/ContractForAI/CONTRACT_STRUCTURE_RULE.md` | MODIFY (tuỳ chọn) | ~+1 nếu hợp thức `COMPLETED` |

> **Import boundary:** checklist/registry import `@/types` + mdast. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Regex ranh giới escape sai → match hụt nhãn hợp lệ | TB | `escapeRegExp` + lookahead `[\s:.\-]|$`; test "Hình 1" khớp "Hình 1:" nhưng không "Hình 12". |
| Match theo `id` lệch khi caption table không có text (không sinh đoạn caption) | TB | Giữ nhánh hiện có "table không text → bỏ qua" ([docx-layout-checklist.ts:91](src/modules/export/docx-layout-checklist.ts)); chỉ siết nhánh có nhãn. |
| Clamp `chapterNum` đổi số ca hợp lệ khác | Thấp | Chỉ áp khi `chapterNum===0`; test continuous + per-chapter bình thường không đổi. |
| Sửa Status bị coi là "đổi contract" | Thấp | CONTRACT_STRUCTURE_RULE §4 chỉ cấm move/rename/xoá; cập nhật Status hợp lệ là được phép. |

## 6. Verification Plan
- registry `["Hình 1","Hình 12"]` + AST chỉ có caption "Hình 12" → checklist báo **thiếu** "Hình 1" (không false-pass).
- figure đặt trước h1 đầu tiên (per-chapter) → `buildCaptionRegistry` nhãn `"Hình 1.1"`.
- `verifyDocxLayout` trên sample đa template vẫn pass đúng.
- `w7a..w7e` §7 đọc `DONE`; (nếu chọn) `CONTRACT_STRUCTURE_RULE §5` liệt kê đúng tập trạng thái dùng.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `fix(export): boundary-accurate caption parity check in docx checklist`; (2) `fix(format): clamp caption chapter index to ≥1 before first h1`; (3) `docs(w7): sync contract status to DONE`.
