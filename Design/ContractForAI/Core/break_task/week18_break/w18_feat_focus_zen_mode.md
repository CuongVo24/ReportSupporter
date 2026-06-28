# Contract For AI — W18 Feat (A5): Focus/Zen Mode + Đếm Chữ & Thời Lượng Đọc

> **Lane:** Core / break_task / week18_break.
> **Branch:** `w18/upgrade-ai` (nhánh chung cả tuần).
> **Type:** UX / deep-work — finding **S1** (Low, viết báo cáo dài nhưng layout luôn 3 cột (editor + preview + side panel) — không có chế độ tập trung; không có tín hiệu tiến độ viết như số chữ/thời lượng). Brainstorm 2026-06-28.
> **Builds on:** [EditorPanel.tsx](src/components/EditorPanel.tsx); [WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx); `activeView` editor/preview ([Workspace.tsx:76](src/components/Workspace.tsx#L76)).
> **Sources:** Brainstorm 2026-06-28; `VoiceAndContent.md §7`.

---

## 1. Micro-task Target

Chế độ Focus ẩn bớt chrome (preview/side panel/header phụ) để chỉ còn editor + mục lục tối giản; kèm thanh trạng thái đếm chữ & thời lượng đọc ước tính. Toggle bằng nút + phím tắt.

- **S1 — Focus toggle.** State `focusMode` ẩn preview + side panel + thu gọn header; editor giãn rộng, căn giữa, bề ngang đọc dễ chịu. Toggle qua nút + phím tắt (đăng ký trong listener phím sẵn có) + lệnh trong Command Palette (A1).
- **S2 — Word/time stat (thuần).** Helper `computeWritingStats(markdown|sections)` → `{ words, chars, readingMinutes }` (loại cú pháp markdown khi đếm). Hiện ở status bar editor; cấp độ mục đang sửa + toàn báo cáo.
- **S3 — A11y + khôi phục.** `Esc`/toggle thoát Focus về layout cũ; trả focus editor; trạng thái `aria-pressed` cho nút.

> 🔒 **Không phá `--rs-report-*`/tờ A4** — Focus chỉ đổi chrome workspace, không đụng style trang in.
> 🔒 Không lib mới. Token-only, giọng `§7`.

## 2. Scope

### In scope
- [src/modules/write/writing-stats.ts](src/modules/write/writing-stats.ts) (NEW): `computeWritingStats` thuần.
- [src/modules/write/writing-stats.test.ts](src/modules/write/writing-stats.test.ts) (NEW): unit (bỏ cú pháp md, biên rỗng, đa mục).
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): state `focusMode` + phím tắt + lệnh palette.
- [src/components/WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) (MODIFY): nhận `focusMode` ẩn panel.
- [src/components/EditorPanel.tsx](src/components/EditorPanel.tsx) (MODIFY): status bar đếm chữ/thời lượng.
- [src/app/globals.css](src/app/globals.css) / [WorkspaceLayout.css](src/components/WorkspaceLayout.css) (MODIFY): style Focus + status bar (token).

### Out of scope
- ❌ Theme/typography mới cho editor (chỉ bề rộng/căn giữa bằng token có sẵn).
- ❌ Mục tiêu số chữ/gamification (để pha sau nếu muốn).

## 3. Checklist
- [ ] **S1** Toggle Focus ẩn preview + side panel; editor giãn; nút + phím tắt + lệnh palette.
- [ ] **S2** Status bar hiện số chữ + thời lượng đọc (mục + toàn báo cáo), đếm đúng (bỏ cú pháp md).
- [ ] **S3** `Esc`/toggle thoát, trả focus editor; `aria-pressed`. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/writing-stats.ts` | NEW | đếm chữ/thời lượng thuần |
| `src/modules/write/writing-stats.test.ts` | NEW | unit |
| `src/components/Workspace.tsx` | MODIFY | state + phím tắt |
| `src/components/WorkspaceLayout.tsx` | MODIFY | ẩn panel theo focus |
| `src/components/EditorPanel.tsx` | MODIFY | status bar |
| `src/components/WorkspaceLayout.css` / `globals.css` | MODIFY | style (token) |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Focus làm mất nút quan trọng → kẹt | Med | Luôn còn nút thoát Focus + `Esc` + palette. |
| Đếm chữ sai do cú pháp md | Low | Strip md trước khi đếm; test biên. |
| Layout vỡ khi ẩn panel | Med | Test ẩn/hiện + responsive. |

## 6. Verification Plan
- Bật Focus → chỉ còn editor + mục lục; số chữ/thời lượng hiện.
- Gõ thêm → số chữ cập nhật; đếm khớp văn bản (không tính `#`,`*`).
- `Esc` thoát về 3 cột; 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w18/upgrade-ai`): `feat(write): focus mode with word count and reading-time status bar`.
