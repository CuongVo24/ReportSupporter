# Contract For AI - W24 Group B: Check-on-import & A11y States

> **Lane / Week:** Core / Month 6 / W24 - Day 2 (`Design/TaskBrief/Core/month6/w24.md` `[C198]`-`[C199]`).
> **Branch:** `feature/W24-import-hardening`.
> **Builds on:** W24A (preview dialog), Check engine W3 (`CheckContext`/`CheckResult`), `ReportIssue.module: "import"` (W21A), axe harness W15.
> **Depended on by:** Group E (E2E kiểm issues hiển thị), Phase 5 acceptance (axe gate surface mới).
> **Sources:** `w24.md` Locked #2, `3.Check.md`, `w15.md` Locked #2 (axe jsdom).

---

## 1. Micro-task Target

Hai việc: (1) **Check-on-import** — chạy Check engine trên `ImportDraft` (dựng `CheckContext` từ draft sections, issues gắn `module: "import"`), hiển thị trong preview dialog cạnh warnings — **không chặn commit**; (2) **A11y states** cho dropzone + preview: đủ empty/loading/error/success, focus trap dialog, aria cho warnings/issues, **axe 0 critical** trên surface mới (Vitest+jsdom, harness W15).

> **🔒 Check hiển thị, không chặn (Locked #2).** Import file "xấu" vẫn được — sửa trong workspace là giá trị sản phẩm; nút commit không bao giờ disable vì issues.
> **⚠️ CheckContext từ draft** — sections chưa có trong bundle; không ghi tạm vào IndexedDB để check.

## 2. Scope

### In scope (`[C198]`/`[C199]`)
- `src/modules/import/check-draft.ts` (**NEW**): `ImportDraft` → `CheckContext` tạm (bundle ảo từ draft + project hiện tại cho template context) → chạy rules hiện có → issues `module: "import"`.
- Preview dialog (MODIFY): panel Issues cạnh Warnings (severity badge, click → section); đếm tổng trên nút commit ("Commit — 3 lỗi, 2 cảnh báo" vẫn bấm được).
- A11y: dropzone empty/loading (per-file)/error/success states chuẩn Phase 4; Dialog focus trap + return; aria-live cho kết quả convert; keyboard đủ cho SectionControls.
- Axe tests (`*.a11y.test.tsx`) cho dropzone + preview → 0 critical.

### Out of scope
- ❌ Rule mới cho Check engine (dùng rules hiện có); sửa rules để "đẹp số".
- ❌ Chặn commit theo severity (Locked #2); OCR/worker (C/D).

## 3. Checklist
- [ ] Issues từ draft đúng rules hiện có; `module: "import"`; không ghi IndexedDB khi check.
- [ ] Commit luôn bấm được; label phản ánh issues count.
- [ ] Click issue → nhảy đúng section trong preview.
- [ ] Dropzone/preview đủ 4 states; focus trap + return đúng; aria-live thông báo kết quả.
- [ ] Axe 0 critical trên surface mới (ghi limitation contrast-jsdom như W15).
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/check-draft.ts` | NEW | draft → CheckContext → issues |
| `src/modules/import/ImportPreviewDialog.tsx` | MODIFY | Issues panel + commit label |
| `src/modules/write/UniversalImportDropzone.tsx` | MODIFY | states + aria |
| `src/modules/import/__a11y__/*.a11y.test.tsx` | NEW | axe harness W15 |
| `src/modules/import/check-draft.test.ts` | NEW | issues module/severity |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Bundle ảo lệch context rules (template-aware) | Medium | Dùng template/metadata project hiện tại; test rule template-aware trên draft. |
| Check chậm với draft lớn làm preview đơ | Medium | Chạy async sau render đầu; spinner panel issues; (worker hoá thuộc D nếu cần). |
| Vô thức disable commit | Medium | Locked #2 + test commit với draft đầy error. |
| Axe critical từ primitive cũ lộ ra | Low | Fix tối thiểu như W15; không redesign. |

## 6. Verification Plan
- Vitest check-draft + a11y xanh; 4 gates xanh.
- Manual: import docx thiếu heading/ảnh vỡ → issues hiện, commit vẫn được, vào workspace thấy đúng các lỗi đó ở CheckerPanel.
- Keyboard-only đi trọn flow import không chuột.

## 7. Status

`COMPLETED`

> Commit: `feat(import): run check engine on import draft (non-blocking)`; `fix(a11y): dropzone/preview states + axe 0 critical`; `docs(import): commit w24b contract`.
