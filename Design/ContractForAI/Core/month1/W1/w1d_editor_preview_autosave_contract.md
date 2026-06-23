# Contract For AI — W1 Group D: Editor + Preview + Autosave

> **Lane / Week:** Core / Month 1 / W1 — Day 3 (`Design/TaskBrief/Core/month1/w1.md` `[C7]`–`[C9]`).
> **Branch:** `feature/W1-project-bootstrap`.
> **Builds on:** Group C (`src/types/*`, `src/modules/write/{create-project,templates/software-project,index}.ts`).
> **Sources:** `Design/Modules/1.Write.md` §5.1/§5.2/§9 · `OptimizePerformance.md` §5 · `TechnicalStack.md` §2/§5 · `CanonicalTypes.md` §4 · `Coding & Git Standard.md` §2/§4b/§6c.

---

## 1. Micro-task Target

Biến 3-zone shell (Group B) thành **lát cắt soạn thảo chạy được đầu tiên**: người dùng gõ Markdown vào một `<textarea>` controlled, thấy preview Markdown **thô** cập nhật theo, và bản nháp **tự lưu vào IndexedDB** + **sống qua refresh**. Lần đầu mở (IndexedDB rỗng) thì tự bootstrap project từ `softwareProjectTemplate` qua `createProjectFromTemplate` (Group C).

## 2. Scope

### In scope (`[C7]`/`[C8]`/`[C9]`)
- `[C7]` Editor surface = **controlled `<textarea>`** bind vào `markdown` của section đang active. **Không** editor lib.
- `[C8]` Preview surface hiển thị **Markdown thô** của section active (chưa render HTML).
- `[C9]` Autosave IndexedDB qua `idb`: throttle **~2s**, flush khi `visibilitychange`/`beforeunload`; load lúc mount, đọc qua `storedBundleSchema.parse()`.
- Bootstrap khi rỗng: `createProjectFromTemplate(softwareProjectTemplate)` → state + lưu ngay.
- Bộ chuyển section **tối thiểu** (list/`<select>` các `section.title`) để chỉnh được bundle nhiều section.
- Chỉ báo "Saved / Saving…" phản ánh trạng thái ghi IndexedDB.

### Out of scope (chặn scope-creep — `Rule.md` §6)
- ❌ **CodeMirror 6** và **unified/remark/rehype** (đều là **W2**). Preview W1 = text thô, **không** render HTML.
- ❌ Template picker UI / metadata form (auto-bootstrap default template; picker để sau).
- ❌ Section navigator đầy đủ + đổi `status` (chỉ switcher tối thiểu).
- ❌ Asset/snippet menu, chèn ảnh (`1.Write.md` §5.3 — sau).
- ❌ Checker / Export (Group E, Day 4–5).
- ❌ Lib mới — chỉ `react`, `idb`, `zod` (đã cài W1).

## 3. Checklist
- [ ] `src/lib/idb-client.ts`: mở DB `reportsupporter` store `drafts`, key cố định `"current"`; `getRawBundle()`, `putRawBundle(value)`. Không tin shape (trả `unknown`).
- [ ] `src/modules/write/autosave.ts`: `createThrottledSaver(save, delayMs=2000)` (thuần, inject `save`), `loadBundle()` (idb → `storedBundleSchema.parse()` → `ReportProjectBundle | null`, ZodError → `null`), `saveBundle(bundle)`.
- [ ] `src/components/EditorPanel.tsx`: presentational, props `{ value, onChange, ariaLabel }`, `<textarea>` đọc token `--rs-editor-*`.
- [ ] `src/components/PreviewPane.tsx`: presentational, props `{ markdown }`, render thô trong `<pre>`/`white-space: pre-wrap`; ghi rõ "raw — render thật ở W2".
- [ ] `src/components/Workspace.tsx` (`"use client"`): load→bootstrap→state, throttled autosave, render `WorkspaceLayout` + switcher + save-status.
- [ ] `src/app/page.tsx`: render `<Workspace />` (page giữ là server entry).
- [ ] `src/modules/write/index.ts`: export `loadBundle`, `saveBundle`, `createThrottledSaver`.
- [ ] `src/app/globals.css`: vài rule cho `textarea` + raw-preview, **chỉ** dùng `var(--rs-*)`.
- [ ] `src/modules/write/autosave.test.ts`: Vitest fake-timers — gõ liên tục gộp thành **1** save sau ~2s; `flush()` ép save ngay.

## 4. Expected Interfaces / Files

```ts
// src/modules/write/autosave.ts
export function createThrottledSaver<T>(
  save: (value: T) => void | Promise<void>,
  delayMs?: number,
): { schedule: (value: T) => void; flush: () => void };
export function loadBundle(): Promise<ReportProjectBundle | null>;
export function saveBundle(bundle: ReportProjectBundle): Promise<void>;
```

| File | NEW/MODIFY | Ước lượng dòng |
|---|---|---|
| `src/lib/idb-client.ts` | NEW | ~55 |
| `src/modules/write/autosave.ts` | NEW | ~75 |
| `src/modules/write/autosave.test.ts` | NEW | ~45 |
| `src/components/EditorPanel.tsx` | NEW | ~40 |
| `src/components/PreviewPane.tsx` | NEW | ~30 |
| `src/components/Workspace.tsx` | NEW | ~120 |
| `src/app/page.tsx` | MODIFY | render `<Workspace/>` |
| `src/modules/write/index.ts` | MODIFY | +3 export |
| `src/app/globals.css` | MODIFY | +vài rule |

> **Import boundary (`Coding & Git Standard.md` §4b):** `idb-client`(lib)→`types`; `autosave`(modules)→`lib`+`types`; `Workspace`(components)→`@/modules/write` (public surface) + `@/types`; `WorkspaceLayout` giữ presentational. Không cycle.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Kéo CodeMirror/unified sớm (sai W1) | Cao | Chỉ `<textarea>` + preview thô; pipeline thật = W2 |
| Mất dữ liệu draft | Cao | throttle ~2s **+ flush** `visibilitychange`/`beforeunload`; giữ state RAM |
| Server/Client boundary (App Router) | TB | `Workspace.tsx` `"use client"`; `page.tsx` là server entry |
| `QuotaExceededError` khi ghi | TB | try/catch → báo banner, **giữ nội dung RAM** (`1.Write.md` §6) |
| Phá canonical shape | TB | Chỉ tiêu thụ `@/types`; `status` giữ `draft/review/done`; không đổi shape |
| Vượt 200 dòng/file | Thấp | Đã tách 6 file; mỗi file < ~120 dòng |
| idb khó unit-test (no fake-indexeddb) | Thấp | Test **thuần** `createThrottledSaver`; đường idb verify tay (refresh) |

## 6. Verification Plan
- **Gates:** `npm run lint` · `npm run typecheck` · `npm run build` xanh · `npm test` xanh (kèm `autosave.test.ts`).
- **Manual acceptance (`1.Write.md` §9):**
  - Route `/` là workspace editor (workspace-first), không landing.
  - Gõ vào textarea → preview (raw) đổi theo.
  - Mở lần đầu (IndexedDB rỗng) → tự sinh sections từ `softwareProjectTemplate`.
  - F5 reload → nội dung khôi phục từ IndexedDB.
  - Không có network call (offline).
- **Browser proof:** dùng `preview_*` chạy dev server + screenshot trạng thái "đã gõ → Saved → reload còn nguyên".

## 7. Status

**WAITING_FOR_APPROVAL**

> ⛔ Theo `VibeCode.md` Step 2: đã tạo Contract → **dừng, không chạm `src/`**. Chờ "Approve" mới sinh code.
> Đề xuất chia 3 commit (≤200 dòng/lần): (1) `idb-client` + `autosave` + test → (2) `EditorPanel` + `PreviewPane` → (3) `Workspace` + wiring `page.tsx`/`index.ts`/`globals.css`. Commit kèm chính file contract này.
