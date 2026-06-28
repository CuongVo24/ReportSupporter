# Contract For AI — W18 Feat (A4): Snapshot / Khôi Phục Bản Trước (IndexedDB)

> **Lane:** Core / break_task / week18_break.
> **Branch:** `w18/upgrade-ai` (nhánh chung cả tuần).
> **Type:** Safety / data-recovery — finding **S1** (Med, các thao tác phá hủy — AI ghi đè mục/toàn báo cáo, import "replace", xóa mục — chỉ có dialog xác nhận; **không có đường lùi** sau khi bấm. Xem `handleReplaceImport`/`handleApplyWholeReportAiSection`/`executeDeleteSection` trong [Workspace.tsx](src/components/Workspace.tsx)). Brainstorm 2026-06-28.
> **Builds on:** persistence `idb-client` ([lib/idb-client.ts](src/lib/idb-client.ts)) + `autosave` ([autosave.ts](src/modules/write/autosave.ts)); `storedBundleSchema`.
> **Sources:** Brainstorm 2026-06-28; `OptimizePerformance §5`; `VoiceAndContent.md §7`.

---

## 1. Micro-task Target

Thêm tầng **snapshot nhẹ** trong IndexedDB: tự chụp bản trước **các hành động phá hủy** (AI ghi đè, import replace, reset, xóa mục có nội dung), cho phép khôi phục. Có giới hạn số bản để không phình quota.

- **S1 — Snapshot store.** Store IndexedDB riêng (vd `snapshots`) chứa `{ id, projectId, takenAt, reason, bundle }`. Helper thuần/injectable `takeSnapshot(bundle, reason)`, `listSnapshots(projectId)`, `restoreSnapshot(id)`, `pruneSnapshots(projectId, max)` — tách logic prune để test bằng fake (không cần IDB thật).
- **S2 — Auto-snapshot tại điểm nguy hiểm.** Chèn `takeSnapshot` *trước khi* áp dụng: replace import, whole-report AI apply, reset, delete section có nội dung. Lý do (`reason`) ghi rõ để hiện trong danh sách.
- **S3 — UI khôi phục.** Mục "Lịch sử/Khôi phục" (trong side panel hoặc dialog) liệt kê snapshot (thời điểm + lý do), nút "Khôi phục" có xác nhận; khôi phục = set bundle + lưu.
- **S4 — Giới hạn quota.** Tối đa N bản/ dự án (vd 10), prune cũ nhất; cân nhắc chỉ lưu phần `project` cần thiết để nhẹ. Tôn trọng cảnh báo `quotaFull` đã có ([Workspace.tsx:650-654](src/components/Workspace.tsx#L650)).

> 🔒 **Snapshot không được làm vỡ autosave/quota** — giới hạn số bản + prune; degrade êm khi đầy bộ nhớ.
> 🔒 Validate qua `storedBundleSchema` khi restore. Token-only, giọng `§7`.

## 2. Scope

### In scope
- [src/lib/idb-client.ts](src/lib/idb-client.ts) (MODIFY): thêm store/CRUD snapshot.
- [src/modules/write/snapshots.ts](src/modules/write/snapshots.ts) (NEW): take/list/restore/prune thuần + injectable.
- [src/modules/write/snapshots.test.ts](src/modules/write/snapshots.test.ts) (NEW): unit (prune giữ N mới nhất, restore validate schema).
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): gọi `takeSnapshot` trước hành động phá hủy; UI khôi phục.
- [src/components/SnapshotHistory.tsx](src/components/SnapshotHistory.tsx) (NEW): danh sách + nút khôi phục.
- [src/modules/write/index.ts](src/modules/write/index.ts) (MODIFY): export.
- [src/app/globals.css](src/app/globals.css) (MODIFY): style (token).

### Out of scope
- ❌ Diff/merge giữa các bản (chỉ khôi phục nguyên bản).
- ❌ Đồng bộ cloud (offline-only).

## 3. Checklist
- [ ] **S1** take/list/restore/prune thuần, test prune + validate.
- [ ] **S2** Tự snapshot trước replace import / AI apply / reset / xóa-mục-có-nội-dung.
- [ ] **S3** UI liệt kê + khôi phục có xác nhận; khôi phục đúng nội dung.
- [ ] **S4** Giới hạn N bản, prune cũ; degrade êm khi `quotaFull`. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/lib/idb-client.ts` | MODIFY | store snapshot |
| `src/modules/write/snapshots.ts` | NEW | logic thuần |
| `src/modules/write/snapshots.test.ts` | NEW | unit |
| `src/components/SnapshotHistory.tsx` | NEW | UI khôi phục |
| `src/components/Workspace.tsx` | MODIFY | hook điểm nguy hiểm + UI |
| `src/modules/write/index.ts` | MODIFY | export |
| `src/app/globals.css` | MODIFY | style (token) |

> **Import boundary:** không lib mới (dùng `idb` đã có).

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Snapshot phình quota IndexedDB | High | Giới hạn N + prune; lưu tối thiểu; tôn trọng `quotaFull`. |
| Restore bundle hỏng/khác version | Med | Validate `storedBundleSchema` trước khi set. |
| Migration store mới làm lỗi DB hiện có | Med | Bump version IDB an toàn; test mở DB cũ. |
| Snapshot chậm chèn vào hành động | Low | Snapshot async, không chặn UI. |

## 6. Verification Plan
- Import replace → có snapshot "trước import"; khôi phục → về nội dung cũ.
- AI ghi đè toàn báo cáo → snapshot tự tạo; khôi phục đúng.
- Tạo > N bản → bản cũ bị prune.
- Quota đầy → degrade êm, không crash. 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w18/upgrade-ai`): `feat(write): lightweight snapshots with restore before destructive actions`.
