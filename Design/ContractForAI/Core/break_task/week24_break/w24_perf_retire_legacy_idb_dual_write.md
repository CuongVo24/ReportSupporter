# Contract For AI — W24 Perf (L): Ngừng Autosave Ghi Bundle Hai Lần · Retire Legacy Draft Có Migration/Rollback Rõ

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Persistence performance/migration safety.
> **Findings:**
> - **S1** (🟠) — `putRawBundle` ghi bundle vào legacy `drafts/current` và `project-bundles`; `putProjectRecord` cũng ghi project store + legacy store trong cùng transaction. Với assets base64 vài MiB, mỗi autosave clone/ghi payload lớn hai lần.
> - **S2** (🟠) — comment migration v3→v4 nói giữ legacy **một release để rollback**, nhưng chưa có exit criterion/version owner; compatibility write có nguy cơ sống vĩnh viễn.
> - **S3** (🟡) — xóa legacy store ngay sẽ phá rollback/read fallback của client cũ; tiếp tục dual-write lại tăng latency/quota. Cần retire hai bước có proof, không chỉnh một dòng rồi hy vọng.
> **Builds on:** W1 autosave, Project Library v4 migration, `idb-client.ts`, `autosave.ts`, `project-store.ts`.
> **Sources:** review tổng thể 2026-07-19 + source verification `idb-client.ts:67-133`.

---

## 1. Micro-task Target

Ngừng write amplification ở hot autosave trong release kế tiếp, vẫn mở được DB v3/v4 và có rollback plan hữu hạn; sau một cửa sổ tương thích đã ghi rõ mới xóa legacy store.

- **S0 — Inventory/decision.** Liệt kê caller của `putRawBundle`, `putProjectRecord`, `getRawBundle`; chốt release min-supported và rollback window. `project-bundles` là source of truth mới, legacy chỉ fallback migration.
- **S1 — Stop legacy writes.** Save/autosave/project operations chỉ ghi `project-bundles` + `project-summaries`; không clone bundle vào `drafts/current`. Summary update giữ atomic với bundle.
- **S2 — Read/migrate fallback.** Khi project store thiếu, đọc legacy một lần, validate/migrate, ghi store mới và đánh sentinel `legacy-imported`; không đọc legacy ở mọi startup.
- **S3 — Store deletion phase.** Chỉ xóa `drafts` ở schema/release sau khi matrix upgrade/rollback và support window đạt exit criterion. Contract ghi owner/ngày/phiên bản, không dùng “sau này”.
- **S4 — Measure.** Thu autosave duration, transaction bytes/quota delta và main-thread clone cost với bundle 5 MiB trước/sau.

> 🔒 Không làm mất draft hiện có và không đổi public `ReportProjectBundle`.
> 🔒 Không xóa rollback store trong cùng release đầu tiên ngừng dual-write; rollback limitation phải được ghi rõ cho người vận hành.

## 2. Scope

### In scope
- [src/lib/idb-client.ts](src/lib/idb-client.ts) (MODIFY): single-write path, fallback sentinel, staged deletion migration.
- `src/modules/write/autosave.ts`, [src/modules/write/project-store.ts](src/modules/write/project-store.ts) (MODIFY): gọi source of truth thống nhất.
- IDB migration/autosave tests (UPDATE/NEW): v3/v4→next, corrupted legacy, atomic failure, rollback matrix.
- Deployment/release notes (UPDATE): compatibility window + store deletion owner.

### Out of scope
- ❌ Snapshot asset dedup/normalized blobs (M).
- ❌ Cloud sync or server DB.
- ❌ Đổi throttle 2 giây nếu chưa có latency evidence.

## 3. Checklist
- [ ] Autosave bình thường ghi bundle đúng **một** object store; summary atomic, legacy không đổi.
- [ ] DB chỉ có legacy được migrate một lần và mở đúng project; reload sau không đọc legacy.
- [ ] Transaction fail không để summary/bundle lệch; corrupted legacy vào recovery path.
- [ ] Exit criterion/store-deletion release được ghi cụ thể; test upgrade/rollback fixtures giữ lại.
- [ ] 5 MiB autosave write bytes/quota delta giảm gần một nửa so với dual-write; correctness gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/lib/idb-client.ts` | MODIFY | canonical write + one-time legacy import |
| `src/modules/write/autosave.ts` | MODIFY | không gọi compatibility dual-write |
| `src/modules/write/project-store.ts` | MODIFY | source-of-truth nhất quán |
| `src/lib/idb-client.test.ts` | NEW/UPDATE | real fake-indexeddb migration matrix |
| `Design/Modules/Other/Deployment.md` | UPDATE | rollback/support window |

> **Import boundary:** dùng `idb` hiện có; không thêm persistence layer thứ hai.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Người dùng upgrade từ bản rất cũ mất draft | High | Legacy fallback + fixture DB các version; deletion sau support window. |
| Rollback app cũ không thấy edit mới sau khi stop dual-write | High | Ghi rõ rollback boundary; nếu cần bridge export trước rollback, không âm thầm hứa tương thích hai chiều. |
| Summary/bundle lệch khi transaction fail | High | Một readwrite transaction + failure injection test. |
| Hai contract L/M cùng bump DB version | Med | L merge trước; M dùng next available migration, không phát triển song song cùng version. |

## 6. Verification Plan
- Mở fixture DB v3 chỉ có `drafts/current` → migrate → project/library đúng; autosave → chỉ project store đổi.
- Mở DB v4 đã có hai store lệch revision → deterministic precedence + recovery item; không ghi đè bản mới hơn mù.
- Gõ liên tục bundle 5 MiB: throttle vẫn một save/2s, transaction count/bytes và quota delta giảm; F5 khôi phục đúng.
- Chạy upgrade → rollback rehearsal theo version support đã chốt và ghi outcome vào release evidence.

## 7. Status

`PROPOSED — migration contract; chưa thi công.`

