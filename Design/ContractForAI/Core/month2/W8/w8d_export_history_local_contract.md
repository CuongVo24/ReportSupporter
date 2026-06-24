# Contract For AI - W8 Group D: Export History (Local)

> **Lane / Week:** Core / Month 2 / W8 - Day 4 (`Design/TaskBrief/Core/month2/w8.md` `[C92]`-`[C93]`).
> **Branch:** `feature/W8-submission-package`.
> **Builds on:** W1 IndexedDB wrapper (`src/lib/idb-client.ts`, `idb`), W4 `useExport`/`ExportJob` (`src/modules/export/use-export.ts`, `ExportPanel.tsx`), W1 canonical `ExportJob` (`@/types`).
> **Depended on by:** Group C (mục "đã export?" đọc history), Group E (panel + QA).
> **Sources:** `w8.md` Locked Decisions #1/#2, `MasterRoadMap.md` W8 ("Add export history stored locally"), `TechnicalStack.md §8b` (Storage = IndexedDB qua `idb`), `OptimizePerformance.md`.

---

## 1. Micro-task Target

Lưu **lịch sử export** cục bộ trong IndexedDB: mỗi lần `runExport`/`retry` hoàn tất (done/error) ghi một bản ghi (target · fileName · thời điểm · trạng thái). History sống qua refresh, đọc lại để hiển thị + cho checklist (Group C). **Local-first, no cloud.**

> **🔒 Một store, mở rộng wrapper có sẵn (Locked #1).** Thêm object store `export-history` trong `idb-client.ts` (bump `DB_VERSION` + `upgrade`); **không** tạo DB/lib lưu trữ song song. Draft store `drafts` giữ nguyên.
> **🔒 Local-first (Locked #2).** Chỉ IndexedDB qua `idb`; không backend, không cloud SDK (`TechnicalStack §5` CẤM).
> **📌 Reuse `ExportJob`.** Bản ghi history dựa trên `ExportJob` đã có (`@/types`) — không khai báo shape job thứ hai.

## 2. Scope

### In scope (`[C92]`/`[C93]`)
- `src/lib/idb-client.ts` (MODIFY): bump `DB_VERSION` → 2; trong `upgrade` tạo store `export-history` (keyPath/`id`); thêm `appendExportHistory(entry)`, `getExportHistory(): Promise<unknown[]>`, `clearExportHistory()`. Caller validate bằng zod (giữ pattern "raw → zod.parse").
- `src/modules/export/export-history.ts` (**NEW**): zod schema cho bản ghi (dựa `ExportJob` fields: `id,target,fileName,status,startedAt,finishedAt?`), `recordExport(job)` + `loadExportHistory()` (parse + sort mới→cũ). Giới hạn số bản ghi (vd 50) để không phình store.
- `src/modules/export/use-export.ts` (MODIFY): sau khi job sang `done`/`error`, gọi `recordExport(job)` (best-effort, nuốt lỗi IDB như pattern hiện tại).
- `src/modules/export/index.ts` (MODIFY): export `loadExportHistory`/`recordExport`.
- Vitest: `export-history.test.ts` — schema parse hợp lệ/loại bản ghi hỏng; sort mới→cũ; cap số lượng; round-trip append→load (mock idb).

### Out of scope
- ❌ Đổi store `drafts` / migration draft (chỉ thêm store mới).
- ❌ UI panel history (Group E hiển thị; Group D lo dữ liệu + hook ghi).
- ❌ Zip/README/checklist (Groups A/B/C).
- ❌ Backend/cloud; lib lưu trữ khác.

## 3. Checklist
- [ ] `idb-client.ts`: `DB_VERSION=2` + store `export-history`; `drafts` không đổi.
- [ ] `appendExportHistory`/`getExportHistory`/`clearExportHistory` (raw, caller zod-parse).
- [ ] `export-history.ts`: zod schema theo `ExportJob`; sort mới→cũ; cap bản ghi.
- [ ] `useExport` ghi history khi done/error (best-effort, không vỡ export khi IDB lỗi).
- [ ] `export-history.test.ts` phủ parse/invalid/sort/cap/round-trip.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/lib/idb-client.ts
export function appendExportHistory(entry: unknown): Promise<void>;
export function getExportHistory(): Promise<unknown[]>;
export function clearExportHistory(): Promise<void>;

// src/modules/export/export-history.ts
export function recordExport(job: ExportJob): Promise<void>;
export function loadExportHistory(): Promise<ExportJob[]>;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/lib/idb-client.ts` | MODIFY | ~+30 (store + 3 hàm) |
| `src/modules/export/export-history.ts` | NEW | ~90 |
| `src/modules/export/use-export.ts` | MODIFY | ~+6 (ghi sau done/error) |
| `src/modules/export/index.ts` | MODIFY | ~+2 |
| `src/modules/export/export-history.test.ts` | NEW | ~80 |

> **Import boundary:** history import `@/types` + `idb` wrapper. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Bump `DB_VERSION` làm hỏng draft cũ | Medium | `upgrade` chỉ `createObjectStore('export-history')` khi chưa có; không đụng `drafts`; test upgrade path. |
| IDB lỗi/quota làm vỡ luồng export | Medium | `recordExport` best-effort, try/catch nuốt lỗi (như `toQrDataUrl` hiện tại). |
| Bản ghi phình vô hạn | Low | Cap (vd 50) khi append; test cap. |
| Khai báo shape job thứ hai (drift) | Low | Dựa `ExportJob` (`@/types`); zod schema bám đúng field. |
| SSR đụng IndexedDB | Low | Guard `typeof window`/`indexedDB` như pattern wrapper hiện tại. |

## 6. Verification Plan
- Export 1 HTML thành công → 1 bản ghi `done` trong history sau reload.
- Export lỗi → bản ghi `error` được ghi, luồng export không vỡ.
- 60 lần export → history cap 50, mới nhất đứng đầu.
- Bản ghi hỏng trong store → bị loại khi `loadExportHistory` (zod).
- `drafts` vẫn đọc/ghi bình thường sau bump version.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(storage): export-history IndexedDB store + schema`; (2) `feat(export): record export jobs to local history`; +1 docs commit.
