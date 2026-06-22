# 📅 WEEK 3: FORMAT & CHECK FOUNDATION

> Phase 1 — MVP Report Workspace (W1-W4). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 3.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Make the report look formatted, and catch problems before submit.*

Tuần 3 lắp Module 2 (Format) và Module 3 (Check) ở mức MVP, đọc trên **AST** (mdast/hast) từ pipeline W2 — *không regex thô* trừ check văn bản. Format normalize heading numbering + sinh TOC; Check nâng từ 3 rule văn bản (W1) lên bộ rule cấu trúc đầy đủ, hiển thị issues theo severity và một **readiness score** nháp.

Mục tiêu chốt từ MasterRoadMap:
- Implement heading parser and numbering.
- Implement basic table of contents generation.
- Add checker engine with MVP rules.
- Display issues grouped by severity.
- Add report readiness score draft.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** Module 2 — Format (`src/modules/format`) + Module 3 — Check (`src/modules/check`).
- **Depends on:** W2 pipeline `unified` (đọc mdast/hast AST), `ReportProject`/`ReportSection`/`ReportIssue` types (W1).
- **Depended on by:** W4 Export (PDF/DOCX dùng heading numbering + TOC từ Format; export gating có thể tham chiếu checker), toàn bộ Phase 2 (W7 Format Hardening mở rộng từ đây).

---

## 3. 🔭 Scope

### ✅ In scope
- Heading parser + numbering (`1`, `1.1`, `1.1.1`) deterministic từ mdast.
- Table of contents data generation (từ heading numbering).
- Checker engine MVP đầy đủ rule cấu trúc (đọc AST):
  - Missing TOC / conclusion / references / member responsibility table.
  - Missing GitHub/demo/deploy links (software project template).
  - Broken/empty image path · skipped heading level · missing figure/table caption · table too wide · code block no language.
  - Text markers (TODO / fix later / lorem ipsum) — đã có từ W1, gom vào engine.
- Issues grouped by severity (`error | warning | info`) + fix suggestion mỗi issue.
- Readiness score **draft** (trừ điểm theo severity issue −15/−5/−1, clamp ≥0 → ngưỡng ≥85/60–84/<60; xem `Modules/3.Check.md` §5.3).

### ⛔ Out of scope
- A4 print CSS / Times New Roman page layout chi tiết (chuẩn bị token, nhưng layout PDF thật ở W4; hardening ở W7).
- List of figures / list of tables (→ W7).
- References section *rules* nâng cao (→ W7); W3 chỉ check "có/không có references".
- Real PDF/DOCX export (→ W4).
- Network trong checker (cấm — `VibeCode.md` §4 "Checker offline").

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W3-format-check`.

### Day 1 — Heading Parser & Numbering
- `[NEW]` `src/modules/format/parse-headings.ts` (đọc mdast heading nodes → cây heading)
- `[NEW]` `src/modules/format/number-headings.ts` (gán `1` / `1.1` / `1.1.1` deterministic)
- `[NEW]` `src/types/format.ts` (`HeadingNode`, `TocEntry`)

### Day 2 — Table of Contents
- `[NEW]` `src/modules/format/generate-toc.ts` (heading numbering → `TocEntry[]`)
- `[NEW]` `src/modules/format/index.ts` (public surface module Format)
- `[MODIFY]` `src/modules/write/PreviewPanel.tsx` (preview hiển thị numbering + TOC — same numbering với export sau)

### Day 3 — Checker Engine Core
- `[MODIFY]` `src/modules/check/run-checker.ts` (engine nhận mdast/hast + metadata → `ReportIssue[]`)
- `[NEW]` `src/modules/check/rules/missing-sections.ts` (TOC / conclusion / references / member table)
- `[NEW]` `src/modules/check/rules/evidence-gaps.ts` (github/demo/deploy cho software template)

### Day 4 — Structural Rules
- `[NEW]` `src/modules/check/rules/heading-levels.ts` (skipped level)
- `[NEW]` `src/modules/check/rules/captions.ts` (figure/table caption missing)
- `[NEW]` `src/modules/check/rules/images.ts` (empty/broken image path)
- `[NEW]` `src/modules/check/rules/table-width.ts` (table likely too wide)
- `[NEW]` `src/modules/check/rules/*.test.ts` (Vitest — bắt buộc cho mỗi rule)

### Day 5 — Severity Panel, Readiness Score & QA
- `[MODIFY]` `src/modules/check/CheckerPanel.tsx` (group by severity + re-run button)
- `[NEW]` `src/modules/check/readiness-score.ts` (draft score: trừ điểm theo severity −15/−5/−1, clamp ≥0 — `Modules/3.Check.md` §5.3)
- `[NEW]` `src/modules/check/ReadinessBadge.tsx`
- `[NEW]` `Design/Reports/Month1/W3/W3_QA_Report.md`, `checker_samples.md`, `build_output.txt`

---

## 5. 📦 Dependencies installed this week

> Không cần lib mới — tái dùng pipeline `unified` (W2) + `zod` (W1) + `vitest` (W1).

| Library | Why (this week) | Stack ref |
|---|---|---|
| *(none new)* | Format/Check đọc AST từ pipeline đã có; rules test bằng Vitest sẵn cài | §3, §7 |

> **Lý do không cài thêm:** Format/Check chạy hoàn toàn client-side trên AST, không kéo dep ngoài (`TechnicalStack.md` §3 nguyên tắc deterministic).

---

## 6. 📤 Deliverables

- Heading numbering `1`/`1.1`/`1.1.1` deterministic, hiển thị trong preview.
- TOC data generation từ numbering.
- Checker engine MVP với toàn bộ rule cấu trúc (`Modules/3.Check.md` §MVP Checks).
- Mỗi rule có Vitest test (regression-safe).
- Checker panel group by severity + re-run + fix suggestion.
- Readiness score draft + badge.
- `Design/Reports/Month1/W3/` QA + checker samples.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Numbering không deterministic giữa preview ↔ export | High | Numbering từ một hàm duy nhất trên mdast; export W4 dùng lại (`Modules/2.Format.md` Acceptance). |
| Checker regex thô gây false positive | Medium | Đọc AST node (`TechnicalStack.md` §3); regex chỉ cho text markers. |
| Rule logic vỡ thầm khi sửa | Medium | Vitest bắt buộc mỗi rule (`TechnicalStack.md` §7). |
| Readiness score gây hiểu nhầm "đã hoàn hảo" | Low | Đánh dấu "draft", chỉ phản ánh số/severity issue, không phải chất lượng nội dung. |
| Checker gọi mạng | High | Cấm network trong Module Check (`VibeCode.md` §4). |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` xanh.
- [ ] `npm run typecheck` xanh (no `any`).
- [ ] `npm run build` xanh.
- [ ] `Vitest` xanh cho **toàn bộ** checker rules + numbering.
- [ ] Heading numbering + TOC hiển thị đúng trong preview.
- [ ] Checker trả `ReportIssue[]` đúng shape, group by severity, có suggestion.
- [ ] Re-run checker sau khi edit → kết quả cập nhật (`Modules/3.Check.md` Acceptance).
- [ ] Checker chạy không cần network (offline).
- [ ] Evidence tại `Design/Reports/Month1/W3/` (gồm checker samples).
- [ ] Commit kèm contract, branch `feature/W3-format-check`.
