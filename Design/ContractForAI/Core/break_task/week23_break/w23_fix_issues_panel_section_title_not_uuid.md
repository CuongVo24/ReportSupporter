# Contract For AI — W23 Fix (D): Panel Soát Lỗi Hiển Thị UUID Mục Thay Vì Tên Mục

> **Lane:** Core / break_task / week23_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Bug UX/a11y nhỏ, độc lập. Map sectionId → title.
> **Findings:**
> - **S1** (🟡) — **Hiển thị UUID thô.** `IssuesPanel` render `Mục: {issue.sectionId}` ([IssuesPanel.tsx:254](src/components/IssuesPanel.tsx#L254)) → "Mục: 099778ca-bab1-4af0-a3c4-5e0cdf1bfc64". Người dùng không biết lỗi ở mục nào — trong khi dialog xuất bản (`validateExport`) lại hiển thị đúng `[Tên mục]` (nguồn map đã tồn tại đâu đó).
> - **S2** (🟡) — **aria-label đọc UUID.** Nút "Xem" có `aria-label={`Đi tới phần ${issue.sectionId}…`}` ([IssuesPanel.tsx:280](src/components/IssuesPanel.tsx#L280)); `CheckerPanel` cũng vậy ([CheckerPanel.tsx:93](src/modules/check/CheckerPanel.tsx#L93)). Screen-reader đọc chuỗi UUID vô nghĩa.
> **Builds on:** `IssuesPanel.tsx`, `CheckerPanel.tsx`, `bundle.project.sections` (nguồn `id`→`title`), nơi dialog xuất bản đã map tên mục (`validate-export.ts`/`ExportPanel`).
> **Sources:** QA session 2026-07-13, phát hiện #7 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Mọi tham chiếu mục trong panel Soát lỗi/Issues hiển thị **tên mục** (và số thứ tự nếu có), cả text lẫn aria-label; UUID chỉ dùng nội bộ để `onJump`.

- **S1 — Text tên mục.** Thay `Mục: {sectionId}` bằng `Mục: {sectionTitle}` (tra từ `sections` theo `id`). Fallback gọn nếu không tìm thấy (mục đã xoá): "Mục đã xoá" thay vì UUID.
- **S2 — aria-label tên mục.** `Đi tới phần "${sectionTitle}"…` ở cả `IssuesPanel` và `CheckerPanel`.

> 🔒 Không đổi `CheckResult`/`issue.sectionId` (vẫn là id); chỉ đổi **hiển thị**. Dùng lại map tên mục sẵn có nếu có helper.

## 2. Scope

### In scope
- [src/components/IssuesPanel.tsx](src/components/IssuesPanel.tsx) (MODIFY): nhận `sections` (hoặc map `id→title`) qua props/context; render tên mục ở text + aria-label.
- [src/modules/check/CheckerPanel.tsx](src/modules/check/CheckerPanel.tsx) (MODIFY): aria-label dùng tên mục.
- (Nếu chưa có) helper `getSectionTitle(sections, id)` dùng chung — hoặc tái dùng map của dialog xuất bản.
- Test (UPDATE): issue có sectionId → hiển thị tên mục; sectionId lạ → "Mục đã xoá".

### Out of scope
- ❌ Đổi schema issue/checker.
- ❌ Đổi logic `onJump` (vẫn nhận id).

## 3. Checklist
- [ ] **S1** `IssuesPanel` hiển thị tên mục thay UUID; fallback "Mục đã xoá".
- [ ] **S2** aria-label "Xem"/jump ở IssuesPanel + CheckerPanel dùng tên mục.
- [ ] Danh sách P0 trong dialog xuất bản (contract A) cũng hưởng tên mục nếu dùng chung helper.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/IssuesPanel.tsx` | MODIFY | text + aria-label theo tên mục; props sections/map |
| `src/modules/check/CheckerPanel.tsx` | MODIFY | aria-label theo tên mục |
| `src/lib/…` hoặc dùng lại helper | NEW/REUSE | `getSectionTitle(sections, id)` |
| test tương ứng | UPDATE | render tên mục / fallback |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Panel không có sẵn `sections` trong props | Low | Truyền thêm prop hoặc lấy từ context/bundle nơi render panel. |
| Mục bị xoá giữa chừng → title undefined | Low | Fallback "Mục đã xoá". |
| Số thứ tự mục lệch với đánh số hiển thị | Low | Dùng đúng nguồn thứ tự `sections` như nav. |

## 6. Verification Plan
- Cấy lỗi (heading nhảy cấp, caption thiếu) ở mục "Triển khai", chạy Soát lỗi: panel hiển thị "Mục: Triển khai" (không UUID); screen-reader đọc "Đi tới phần Triển khai".
- Xoá mục có lỗi rồi mở lại panel (nếu còn issue cũ): hiển thị "Mục đã xoá", không crash. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(check): show section title instead of raw UUID in issues panel`.
