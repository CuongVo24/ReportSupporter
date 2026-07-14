# Contract For AI — W24 Fix (D): Lịch Sử Xuất Bản Ở ExportPanel Là State Phiên (Mất Khi Đổi Tab, Không Xem Lại Được Lý Do Lỗi)

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Bug UX / một-nguồn-sự-thật. Nhỏ, kỹ thuật. Nối tiếp W23-E.
> **Findings:**
> - **S1** (🟡) — **ExportPanel dùng lịch sử in-memory.** "Lịch sử xuất bản" trong ExportPanel render từ prop `jobs` — là **React state** của hook `useExport` ([use-export.ts:114](src/modules/export/use-export.ts#L114)), sống theo vòng đời component. Đổi tab (Radix Tabs unmount panel) / reload → **mất sạch**. Empty-state ghi "trong phiên này" ([ExportPanel.tsx:243](src/modules/export/ExportPanel.tsx#L243)) đúng với hiện trạng, nhưng gây hệ quả UX xấu.
> - **S2** (🟡) — **Lý do lỗi biến mất khi rời tab.** Bấm "Xuất DOCX" → fail P0 → job hiện lỗi + nút "Thử lại" trong ExportPanel; đổi sang tab khác rồi quay lại → **"Chưa có lịch sử"** → user tưởng **chưa từng xuất** hoặc không rõ vì sao fail. Bản ghi **bền** (kể cả lỗi) **có tồn tại** nhưng chỉ đọc ở `SubmissionPanel` qua `loadExportHistory` (IndexedDB, [export-history.ts:54](src/modules/export/export-history.ts#L54); W23-E). ⇒ **hai nguồn lịch sử lệch nhau** giữa hai tab.
> **Builds on:** `useExport` (`jobs`/`runExport`/`retry`), `recordExport`/`loadExportHistory` ([export-history.ts](src/modules/export/export-history.ts)), `ExportPanel` (hiển thị jobs), `SubmissionPanel` (đã đọc bền, W23-E).
> **Sources:** QA session 2026-07-14, phát hiện #4 (mục Xuất bản/Nộp bài) [[w25-health-check-root-causes]].

---

## 1. Micro-task Target

ExportPanel và SubmissionPanel **đọc chung một nguồn lịch sử bền** (`loadExportHistory`, IndexedDB) — job (thành công/lỗi + lý do) **không mất** khi đổi tab/reload; user luôn xem lại được đã xuất gì và vì sao fail. **Không** đẻ store thứ hai; **không** đổi schema history.

- **S1 — Nguồn bền cho ExportPanel.** ExportPanel hiển thị lịch sử từ `loadExportHistory()` (như SubmissionPanel), refresh sau mỗi `runExport`/`retry` (đã `await recordExport` từ W23-E → đọc lại là thấy). Có thể **hợp nhất** in-memory `jobs` (job đang chạy) + bền (job đã xong) để vừa có spinner realtime vừa không mất lịch sử.
- **S2 — Lý do lỗi bền.** Job lỗi (kèm `error.stage`/`message`) đọc lại được sau khi rời tab; nút "Thử lại" vẫn hoạt động (retry cần bundle hiện tại — truyền như SubmissionPanel/W23-E đã làm).

> 🔒 Một nguồn history (IndexedDB). Không đổi schema `ExportJob`/history. Giữ spinner realtime cho job đang chạy (in-memory) — chỉ **bổ sung** nguồn bền, không thay thế phản hồi tức thời.

## 2. Scope

### In scope
- [src/modules/export/ExportPanel.tsx](src/modules/export/ExportPanel.tsx) (MODIFY): đọc `loadExportHistory()` (state + refresh sau `runExport`/`retry`, hoặc phụ thuộc `jobs` như trigger); merge với job đang chạy (in-memory) để hiển thị đầy đủ; empty-state đổi copy nếu không còn "chỉ trong phiên".
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY nhẹ nếu cần): truyền dữ liệu/handler để ExportPanel refresh history nhất quán với SubmissionPanel (tránh 2 lần đọc lệch).
- [src/modules/export/use-export.ts](src/modules/export/use-export.ts) (REVIEW): xác nhận `recordExport` đã `await` trước refresh (W23-E) — nếu ExportPanel refresh theo `[jobs]` thì đảm bảo không đua với ghi.
- Test (NEW/UPDATE): sau `runExport` lỗi → `loadExportHistory` chứa job lỗi; ExportPanel render lại từ nguồn bền hiển thị job đó; đổi tab (unmount/mount) → vẫn thấy.

### Out of scope
- ❌ Đổi schema/định dạng lịch sử; thêm trường mới.
- ❌ Gộp UI hai tab thành một (IA — ngoài phạm vi).
- ❌ Sửa gate P0 (thuộc A/C/E).

## 3. Checklist
- [ ] **S1** ExportPanel đọc lịch sử bền; đổi tab/reload → job cũ **còn**.
- [ ] **S2** Job lỗi kèm lý do đọc lại được; "Thử lại" hoạt động với bundle hiện tại.
- [ ] Job đang chạy vẫn có spinner realtime (không mất phản hồi tức thời).
- [ ] ExportPanel & SubmissionPanel **không** lệch nội dung lịch sử. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/ExportPanel.tsx` | MODIFY | đọc `loadExportHistory`; merge in-memory đang chạy; copy empty-state |
| `src/components/Workspace.tsx` | MODIFY nhẹ | nhất quán nguồn refresh với SubmissionPanel |
| `src/modules/export/use-export.ts` | REVIEW | xác nhận await recordExport trước refresh |
| `src/modules/export/ExportPanel.test.tsx` | NEW/UPDATE | persist qua remount; job lỗi hiển thị lại |

> **Import boundary:** không lib mới. `loadExportHistory` sẵn có.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Trùng job giữa in-memory và bền (hiện 2 lần) | Med | Dedupe theo `job.id`; ưu tiên bản bền cho job đã kết thúc, in-memory cho đang chạy. |
| Race `recordExport`(await) vs refresh | Low | W23-E đã `await`; ExportPanel refresh **sau** khi jobs đổi trạng thái xong. |
| Copy empty-state cũ ("trong phiên này") thành sai | Low | Cập nhật microcopy: lịch sử **được lưu** giữa các phiên (IndexedDB), có "Xóa lịch sử". |

## 6. Verification Plan
- "Xuất DOCX" (đủ điều kiện) → job "Hoàn thành"; đổi sang tab Soát lỗi rồi quay lại Xuất bản → job **vẫn** trong lịch sử; reload trang → vẫn còn.
- "Xuất HTML" khi thiếu evidence (nếu qua) → job lỗi kèm lý do; rời tab/quay lại → lý do đọc lại được; "Thử lại" chạy.
- Đối chiếu tab Nộp bài: hai danh sách lịch sử **khớp**. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve; docs commit trước, src/ sau.`
