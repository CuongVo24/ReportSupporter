# Contract For AI — W24 Perf (M): Snapshot Không Nhân Bản Base64 · List Metadata Nhẹ · Prune Chỉ Xóa Phần Dư

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Persistence architecture/performance; phụ thuộc L.
> **Findings:**
> - **S1** (🔴) — mỗi `ReportSnapshot` chứa toàn `ReportProjectBundle`, gồm assets base64. Đo production fixture 5 MiB assets: không snapshot heap ~58 MiB, 10 snapshot ~260 MiB; snapshot là memory/quota multiplier chính.
> - **S2** (🔴) — `takeSnapshot` put bản mới rồi `pruneSnapshots` list/validate toàn snapshot; `replaceSnapshotRecords` xóa **tất cả** và ghi lại N bản giữ lại. Một snapshot mới có thể đọc/clone/ghi lại hàng chục full bundle.
> - **S3** (🟠) — UI list history gọi `listSnapshots`, hydrate + Zod-parse full bundle chỉ để hiện `takenAt/reason`; startup/open history kéo payload không cần thiết vào heap.
> - **S4** (🟡) — khi autosave quota fail, recovery path thử ghi thêm full bundle payload vào cùng IndexedDB đang đầy; cần degrade không khuếch đại áp lực.
> **Builds on:** W18 snapshot/restore (contract từng gọi là “snapshot nhẹ” nhưng implementation giữ full bundle), L single-write migration.
> **Sources:** production heap profiling 2026-07-18 + `snapshots.ts/idb-client.ts` hiện tại.

---

## 1. Micro-task Target

Giữ restore **đầy đủ và offline** nhưng snapshot chỉ tham chiếu asset blobs bất biến dùng chung; list lịch sử đọc metadata; prune xóa đúng record dư và GC blob không còn reference, không rewrite toàn bộ snapshot.

- **S0 — Storage design ADR trong contract.** Chọn normalized internal representation: `asset-blobs` content-addressed (hash + mime + bytes/data), project/snapshot manifest map `assetId -> blobKey + metadata`; hydrate về canonical `ReportProjectBundle` tại boundary. Không strip asset khiến restore thiếu ảnh.
- **S1 — Metadata/payload split.** Snapshot record metadata (`id/projectId/takenAt/reason/schemaVersion`) đọc riêng; payload sections/settings/evidence và asset manifest chỉ load khi restore/verify.
- **S2 — Incremental prune.** Index theo project+takenAt; sau insert chỉ tìm/delete surplus oldest. Không `getAll -> parse full -> clear -> rewrite kept`. Refcount/mark-sweep GC blob phải transaction-safe và có repair scan.
- **S3 — Lazy migration.** Snapshot v4 full-bundle vẫn restore được; migrate lazy/background theo từng project, không block editor-ready. Rollback/export escape hatch được ghi.
- **S4 — Quota degrade.** Trước snapshot ước lượng quota; nếu không đủ thì báo và giữ hành động an toàn, không ghi thêm full recovery payload vào DB đầy. Không xóa snapshot tốt cuối cùng mù.

> 🔒 Restore phải tái tạo đúng bytes ảnh cũ kể cả asset hiện tại đã bị sửa/xóa.
> 🔒 Blob GC không được xóa dữ liệu còn được project hiện tại, snapshot hoặc recovery manifest tham chiếu.

## 2. Scope

### In scope
- [src/lib/idb-client.ts](src/lib/idb-client.ts) (MODIFY): asset blob/payload metadata stores, indexed delete, GC/repair primitives.
- [src/modules/write/snapshots.ts](src/modules/write/snapshots.ts) (MODIFY): metadata list, normalized take/restore, incremental prune.
- [src/modules/write/use-draft-autosave.ts](src/modules/write/use-draft-autosave.ts) (MODIFY nhẹ): quota recovery không full-payload write amplification.
- SnapshotHistory/Workspace (MODIFY nhẹ): list metadata, lazy load on restore.
- Migration/property/perf tests (NEW/UPDATE).

### Out of scope
- ❌ Cloud/object storage, compression library mới.
- ❌ Diff/merge UI giữa snapshots.
- ❌ Thay max 10 bằng retention vô hạn.

## 3. Checklist
- [ ] 10 snapshot cùng 5 MiB assets lưu asset bytes một lần (trừ asset thực sự đổi); restore từng bản byte-identical.
- [ ] Mở history không load snapshot payload/blob; heap/list latency tỷ lệ metadata, không tỷ lệ tổng asset bytes.
- [ ] Snapshot thứ 11 chỉ delete surplus oldest; không rewrite 10 kept records.
- [ ] GC/repair đúng khi project/snapshot xóa, transaction crash, refcount lệch; không mất referenced blob.
- [ ] V4 snapshot restore/migrate được; quota-full UX không thử ghi lại full bundle.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/lib/idb-client.ts` | MODIFY | blob/payload/meta stores + index/GC |
| `src/modules/write/snapshots.ts` | MODIFY | manifest/hydration/incremental prune |
| `src/components/SnapshotHistory.tsx` | MODIFY | metadata-first list |
| `src/modules/write/use-draft-autosave.ts` | MODIFY | bounded quota recovery |
| `src/modules/write/snapshots.test.ts` | UPDATE | byte parity, GC, v4 migration, perf |

> **Import boundary:** internal persistence shape không rò vào canonical public types.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Refcount/GC bug gây mất ảnh | Critical | Transaction + mark/sweep repair + invariant/property tests; grace/tombstone trước delete nếu cần. |
| Hashing base64 tạo long task | Med | Hash bytes một lần khi asset insert; cache blobKey; đo worker/off-main nếu lớn. |
| Migration block startup/quota tạm tăng | High | Lazy per-project, quota preflight, resumable sentinel; không duplicate toàn DB một transaction. |
| Canonical schema drift | High | Hydrate rồi `storedBundleSchema` validate; round-trip fixtures mọi version. |

## 6. Verification Plan
- Seed project 40 section + 5 MiB images + 10 snapshot; đo IDB usage/heap trước/sau normalized migration, list history và restore.
- Thay một ảnh ở snapshot 6: chỉ blob mới thêm từ bản 6; restore bản 5/bản 6 cho bytes khác đúng mong đợi.
- Tạo snapshot 11: trace IDB chỉ put new + delete oldest metadata/payload/ref; không put lại 10 kept.
- Fault injection giữa metadata/blob/ref transaction; reopen chạy repair; mọi live project/snapshot restore đủ ảnh.

## 7. Status

`PARTIAL / IN PROGRESS (2026-07-21) — phần an toàn (không đổi schema) đã thi công + test; phần normalized-blob dedup DEFER sau ADR/heap profiler:`

**Đã thi công (an toàn, đã test):**
- **S2 Incremental prune** — `snapshots.ts` `pruneSnapshots`: đọc metadata (không parse full bundle), chỉ **delete surplus-oldest** qua `SnapshotStore.deleteSnapshots` + `idb-client.deleteSnapshotRecords` (transaction xóa đúng id). Bỏ `getAll → clear → rewrite-kept` (trước đó ghi lại ~9 bundle 5 MiB mỗi snapshot thứ 11). Fallback `replaceSnapshots` cho store cũ không có primitive. Test W24-M: snapshot thứ 11 → chỉ put `s10`, chỉ delete `s0`, không rewrite 9 bản giữ.
- **S3 Metadata-first list** — `listSnapshotMetadata` trả `{id,projectId,takenAt,reason}` không Zod-parse/giữ bundle; `SnapshotHistory` + `Workspace` chuyển sang `SnapshotMetadata[]`; restore vẫn lazy load bundle qua `restoreSnapshot(id)`. Heap list tỷ lệ số snapshot, không tỷ lệ tổng asset bytes.
- **S4 Quota degrade** — `use-draft-autosave.ts`: khi `QuotaExceededError`, recovery item **không** ghi lại full bundle (`payload: undefined`) vào DB đầy; lỗi transient khác vẫn giữ payload để khôi phục chính xác.

**DEFER (Critical risk — cần ADR + property tests + heap profiler O):**
- **S0/S1 normalized content-addressed asset-blob store + refcount/mark-sweep GC + lazy v4→v5 migration.** Đây là phần gây dedup 10×base64 (~260→~58 MiB) NHƯNG rủi ro **Critical: GC bug mất ảnh người dùng** (chính contract xếp Critical). Global lock "migration rollback/data-loss aware" + "L merge trước M dùng version kế tiếp" ⇒ không làm blind trong cùng phiên không có review.
  - **ADR (chốt hướng, chưa code):** thêm store `asset-blobs` content-addressed (key = sha256(bytes), value `{mime, data}`); snapshot payload giữ `assetId → blobKey` manifest thay vì base64; hydrate về `ReportProjectBundle` tại boundary rồi `storedBundleSchema` validate. Refcount tăng khi snapshot/project tham chiếu blobKey, GC mark-sweep có tombstone + repair scan; migration **lazy per-project** (sentinel resumable, quota preflight), **không** duplicate toàn DB một transaction; giữ v4 full-bundle restore được cho tới hết support window (song hành với L §5.1). Schema bump = **v5** (kế tiếp v4 của L).
  - **Điều kiện mở contract thi công:** (a) heap profiler O (production actual fixture 10 snapshot/5 MiB) xác nhận dedup ROI; (b) property/invariant test refcount + fault-injection GC repair xanh; (c) round-trip fixture mọi version byte-identical.

> Không đánh DONE cho tới khi phần S0/S1 có ADR review + migration matrix. Phần đã làm giảm write amplification (prune) + list heap + quota pressure ngay, không phá restore/offline.

