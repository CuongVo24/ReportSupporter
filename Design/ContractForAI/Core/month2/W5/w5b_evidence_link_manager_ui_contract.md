# Contract For AI - W5 Group B: Evidence Link Manager UI

> **Lane / Week:** Core / Month 2 / W5 - Day 2 (`Design/TaskBrief/Core/month2/w5.md` `[C58]`-`[C59]`).
> **Branch:** `feature/W5-evidence-kit`.
> **Builds on:** Group A (`kindMeta`, `validateEvidence`), W1 `ReportProjectBundle.evidence`, W3 `Workspace.tsx` (bundle state + autosave).
> **Depended on by:** Group C/D (appendix/QR render the items), Group E (checker reads them).
> **Sources:** `w5.md` Locked Decisions #5/#6, `week5.md` Day 2, `Support.Evidence.md §5`, `DesignSystem_Tokens.md §7b` (a11y).

---

## 1. Micro-task Target

Cho người dùng quản lý minh chứng: form thêm/sửa và panel list add/edit/remove, mutate `bundle.evidence`. **Không** sửa autosave — autosave W1 đã lưu cả bundle nên evidence persist tự động.

> **🔒 Một public surface (Locked #5).** UI sống trong `src/modules/evidence/`; `Workspace` import qua `@/modules/evidence`. Persist nhờ whole-bundle autosave có sẵn — **không** chạm `use-draft-autosave.ts`.
> **♿ A11y (`DesignSystem_Tokens.md §7b`).** Mọi field có `<label>`; kind có icon **+** text (không chỉ màu); nút add/edit/remove keyboard-reachable; lỗi validate đọc được (aria).

## 2. Scope

### In scope (`[C58]`/`[C59]`)
- `src/modules/evidence/EvidenceForm.tsx`: chọn `kind` (9 option từ `kindMeta`), nhập `title`/`url`/`note`, toggle `qrEnabled`; submit → `validateEvidence` → khi `ok` trả `EvidenceItem` lên parent; khi lỗi hiển thị inline (`errors`). Dùng cho cả thêm mới & sửa (nhận `initial?`).
- `src/modules/evidence/EvidencePanel.tsx`: render list `EvidenceItem` (icon+label kind, title, url, note), nút **Thêm** (mở form), **Sửa**, **Xóa**; gọi callback `onChange(next: EvidenceItem[])`. id mới = `crypto.randomUUID()`, `createdAt = new Date().toISOString()`.
- `src/components/Workspace.tsx` (MODIFY): mount `EvidencePanel` trong side panel; `onChange` cập nhật `bundle.evidence` qua `setBundle` (immutable). Autosave có sẵn persist — **verify**, không sửa.
- Vitest (thuần, không cần jsdom nếu tách logic): test mapping form→`EvidenceItem` (qua `validateEvidence`), reducer add/edit/remove trên `EvidenceItem[]` (giữ id, thay đúng item). (Test render component để DoD sau nếu jsdom có sẵn.)

### Out of scope
- ❌ Appendix table (Group C) / QR (Group D).
- ❌ Sửa `use-draft-autosave.ts` (autosave whole-bundle đã đủ — Locked #5).
- ❌ Sửa rule checker (Group E).
- ❌ Cloud/upload file (no-cloud Non-goal) — chỉ link + note.
- ❌ Dep mới.

## 3. Checklist
- [ ] `EvidenceForm` validate qua `validateEvidence`, lỗi inline, dùng được add & edit.
- [ ] `EvidencePanel` add/edit/remove, id `randomUUID`, `createdAt` ISO.
- [ ] `Workspace` mutate `bundle.evidence` immutable; persist tự động (verify refresh giữ evidence).
- [ ] A11y: label + icon/text kind, keyboard, aria lỗi; CSS chỉ `var(--rs-*)`.
- [ ] Test mapping + reducer add/edit/remove.
- [ ] Mỗi file ≤200 dòng; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/evidence/EvidenceForm.tsx
export function EvidenceForm(props: {
  initial?: EvidenceItem;
  onSubmit: (item: EvidenceItem) => void;
  onCancel?: () => void;
}): JSX.Element;

// src/modules/evidence/EvidencePanel.tsx
export function EvidencePanel(props: {
  evidence: EvidenceItem[];
  onChange: (next: EvidenceItem[]) => void;
}): JSX.Element;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/evidence/EvidenceForm.tsx` | NEW | ~120 |
| `src/modules/evidence/EvidencePanel.tsx` | NEW | ~110 |
| `src/components/Workspace.tsx` | MODIFY | ~+15 |
| `src/app/globals.css` | MODIFY | evidence tokens (`var(--rs-*)`) |
| `src/modules/evidence/evidence-reducer.test.ts` (+ form mapping) | NEW | ~70 |

> **Import boundary:** UI imports `@/modules/evidence` (`kindMeta`/`validateEvidence`) + `@/types`. No `fetch`, offline. `Workspace` imports `EvidencePanel` qua module public surface (lands Group C `index.ts`; tạm import trực tiếp file rồi gom vào index ở Group C).

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Quên persist evidence | Low | Autosave whole-bundle (W1) lưu `bundle.evidence` sẵn; verify refresh. |
| Mutate state không immutable | Medium | `setBundle` tạo bản mới `evidence`; reducer test add/edit/remove. |
| A11y: kind chỉ phân biệt bằng màu | Medium | Icon + text label; field có `<label>`; lỗi aria-live. |
| File UI > 200 dòng | Medium | Tách Form / Panel; logic reducer ra hàm thuần test được. |
| Workspace phình | Low | Panel trình bày; mutation gọn trong callback. |

## 6. Verification Plan
- Thêm evidence `github` + url hợp lệ → xuất hiện trong list; refresh trình duyệt → vẫn còn (persist).
- Sửa title một item → chỉ item đó đổi, id giữ nguyên.
- Xóa item → biến mất; các item khác giữ nguyên thứ tự.
- URL sai shape trong form → báo lỗi inline, không thêm được.
- lint/typecheck/test/build xanh.

## 7. Status

`DONE`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(evidence): EvidenceForm + EvidencePanel`; (2) `feat(workspace): wire evidence panel + persist`; +1 docs commit.
