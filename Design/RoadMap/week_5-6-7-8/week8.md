# 📅 WEEK 8: SUBMISSION PACKAGE

> Phase 2 — Report Quality & Evidence (W5-W8). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 8.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Bundle everything into a ready-to-submit package.*

Tuần 8 đóng Phase 2: gom report + evidence + metadata thành một **gói nộp** hoàn chỉnh. Sinh `evidence.zip` (gói link/QR/asset reference), sinh `README.md` từ metadata report, thêm **final submission checklist** (tổng hợp checker + format + evidence), và lưu **export history** local để user theo dõi các bản đã xuất.

Mục tiêu chốt từ MasterRoadMap:
- Generate `evidence.zip`.
- Generate `README.md` from report metadata.
- Add final submission checklist.
- Add export history stored locally.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** mở rộng Module 4 (Export) — packaging + history; tổng hợp Module 3 (Check) thành final checklist.
- **Depends on:** W5 (evidence kit), W6 (templates/metadata), W7 (format hardening), W4 (export thật), W1 (idb storage).
- **Depended on by:** Phase 3 (W12 beta readiness dùng submission package + export history làm bằng chứng demo).

---

## 3. 🔭 Scope

### ✅ In scope
- `evidence.zip` generator (gói evidence appendix + QR + asset reference; client-side zip).
- `README.md` generator từ report metadata (title, school, course, members, evidence links).
- Final submission checklist UI: tổng hợp checker issues + format readiness + evidence completeness.
- Export history lưu local (IndexedDB): target, timestamp, status mỗi lần export.

### ⛔ Out of scope
- `slides.pptx` (→ Phase 3).
- Upload package lên cloud / nộp tự động (Non-goal — no cloud).
- AI tóm tắt README (→ W11 optional).
- Login để lưu history (Non-goal — history local only).

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W8-submission-package`.

### Day 1 — Export History (local)
- `[NEW]` `src/types/export.ts` → thêm `ExportHistoryEntry`
- `[NEW]` `src/lib/export-history.ts` (lưu/đọc qua idb client W1)
- `[MODIFY]` `src/modules/export/use-export.ts` (ghi history sau mỗi export)
- `[NEW]` `src/modules/export/ExportHistoryPanel.tsx`

### Day 2 — README Generator
- `[NEW]` `src/modules/export/generate-readme.ts` (metadata + evidence → `README.md`)
- `[NEW]` `src/modules/export/generate-readme.test.ts`
- `[MODIFY]` `src/modules/export/index.ts` (export README builder)

### Day 3 — Evidence Zip Generator
- `[NEW]` `src/modules/export/generate-evidence-zip.ts` (appendix + QR data + asset reference → zip blob)
- `[MODIFY]` `src/modules/export/ExportPanel.tsx` (thêm target `evidence.zip`)
- *Ghi chú:* dùng cơ chế zip client-side trong stack hiện có; **không** thêm lib ngoài nếu chưa approve.

### Day 4 — Final Submission Checklist
- `[NEW]` `src/modules/check/submission-checklist.ts` (gom checker issues + format readiness + evidence completeness)
- `[NEW]` `src/modules/check/SubmissionChecklistPanel.tsx`
- `[NEW]` `src/modules/check/submission-checklist.test.ts`

### Day 5 — Integration & QA
- `[MODIFY]` `src/components/WorkspaceLayout.tsx` (gắn submission checklist + export history vào workspace)
- `[NEW]` `Design/Reports/Month2/W8/W8_QA_Report.md`, `package_samples/` (evidence.zip, README.md), `build_output.txt`

---

## 5. 📦 Dependencies installed this week

> Mặc định **không cài lib mới**. README/checklist/history dùng pipeline + idb + types đã có.

| Library | Why (this week) | Stack ref |
|---|---|---|
| *(none new by default)* | README = Markdown từ metadata; history = idb; checklist = checker aggregation | §3, §5 |

> ⚠️ **Zip:** Nếu cần lib zip chuyên dụng cho `evidence.zip`, đây là **lib ngoài stack** → bắt buộc xin **approve** trước khi cài (`VibeCode.md` §4 cấm import lậu). Ưu tiên cơ chế trong stack hiện có trước.

---

## 6. 📤 Deliverables

- `evidence.zip` generator (appendix + QR + asset reference).
- `README.md` generator từ metadata + evidence.
- Final submission checklist (checker + format + evidence) trong workspace.
- Export history local (target/timestamp/status), panel hiển thị.
- `Design/Reports/Month2/W8/` QA + package samples.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Cần lib zip ngoài stack | Medium | Ưu tiên cơ chế trong stack; nếu phải thêm → xin approve, không import lậu. |
| Export history phình IndexedDB | Low | Lưu metadata entry (không lưu file blob); giới hạn số entry. |
| README generator lệch metadata | Medium | Map metadata có kiểm soát + Vitest sample. |
| Checklist gây cảm giác "đã hoàn hảo" sai | Low | Checklist phản ánh rule/evidence thực tế, ghi rõ mục chưa đạt. |
| Package gợi ý upload cloud | Medium | Chỉ tạo file local cho user tải; no cloud (`ProductPRD.md` §6). |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` + `typecheck` + `build` xanh.
- [ ] `Vitest` xanh (README generator + submission checklist).
- [ ] `evidence.zip` tải được, chứa appendix + QR + asset reference.
- [ ] `README.md` sinh đúng từ metadata + evidence.
- [ ] Final submission checklist tổng hợp checker + format + evidence.
- [ ] Export history lưu + hiển thị qua refresh (local).
- [ ] Không cài lib ngoài stack mà chưa approve.
- [ ] Evidence tại `Design/Reports/Month2/W8/`.
- [ ] Commit kèm contract, branch `feature/W8-submission-package`.
