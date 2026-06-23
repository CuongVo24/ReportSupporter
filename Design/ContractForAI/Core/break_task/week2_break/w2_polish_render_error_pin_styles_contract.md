# Contract For AI — W2 Break: Polish (render-error · pin · inline-styles)

> **Lane:** Core / break_task / week2_break.
> **Branch:** `feature/W2-markdown-editor` (hoặc `chore/w2-polish`).
> **Type:** Quality/polish — review findings **#2 / #3 / #4** (không chặn merge; không đổi hành vi người dùng).
> **Sources:** `Coding & Git Standard.md §6c`, `TechnicalStack.md §8d`, `DesignSystem_Tokens.md` (token-only, class CSS).

---

## 1. Micro-task Target

Ba sửa nhỏ nâng chất lượng, **không đổi giao diện/hành vi**:
- **#2** `renderMarkdown` không nuốt lỗi im lặng (visible & recoverable — §6c) thay vì `return ""`.
- **#3** Pin **exact** `@vitejs/plugin-react` (đang `^6.0.3`) cho nhất quán §8d.
- **#4** Dời `style={{…}}` inline (**15 chỗ / 5 file**) sang class `.ws-*` trong `globals.css`, **giữ nguyên** giá trị `var(--rs-*)` (no visual change).

## 2. Scope

### In scope
- **#2** `src/lib/markdown-pipeline.ts`: nhánh `catch` → trả **placeholder HTML hiển thị** (vd `<p class="ws-preview-error">⚠ Không render được nội dung.</p>`) thay cho `""`; giữ `console.error`. Placeholder là chuỗi **tĩnh do ta kiểm soát** (KHÔNG nhúng raw error/nội dung user → không tái mở injection).
- **#3** `package.json`: `"@vitejs/plugin-react": "6.0.3"` (bỏ `^`); reconcile `package-lock.json`.
- **#4** Trích inline style → class `.ws-*` (chỉ `var(--rs-*)`), cho **5 file**: `EditorPanel.tsx` (×3), `PreviewPane.tsx` (×3), `Workspace.tsx` (×1), `MetadataForm.tsx` (×4), `TemplatePicker.tsx` (×4).

### Out of scope
- ❌ Đổi màu/spacing/giá trị token (chỉ chuyển **nơi khai báo**, không đổi look).
- ❌ Finding #1 (contract riêng).
- ❌ Refactor logic/props component.

## 3. Checklist
- [ ] **#2**: `renderMarkdown` lỗi → placeholder HTML visible + class `.ws-preview-error` (globals.css); (optional) test: input gây lỗi → output chứa marker lỗi, không throw, không `""`.
- [ ] **#3**: pin exact `6.0.3`; `npm install` reconcile lock; typecheck/test vẫn xanh.
- [ ] **#4** (mỗi file một lượt, ≤200 dòng/lần — đổi `style={{…}}` → `className="ws-…"`, thêm rule vào `globals.css`):
  - [ ] `EditorPanel.tsx` (container / toolbar / `buttonStyle` / CM-parent)
  - [ ] `PreviewPane.tsx` (container / empty)
  - [ ] `Workspace.tsx` (reset button)
  - [ ] `MetadataForm.tsx` (4 chỗ)
  - [ ] `TemplatePicker.tsx` (4 chỗ)
- [ ] 4 gates xanh; **review trực quan trước/sau** (look không đổi).

## 4. Expected Interfaces / Files

- `renderMarkdown` signature **không đổi** (`(markdown: string) => string`); chỉ đổi nhánh `catch`.

| File | NEW/MODIFY | Finding |
|---|---|---|
| `src/lib/markdown-pipeline.ts` | MODIFY | #2 |
| `package.json` (+ `package-lock.json`) | MODIFY | #3 |
| `src/app/globals.css` | MODIFY (+class `.ws-*`, `.ws-preview-error`) | #2/#4 |
| `EditorPanel.tsx` · `PreviewPane.tsx` · `Workspace.tsx` · `MetadataForm.tsx` · `TemplatePicker.tsx` | MODIFY | #4 |

> CSS **token-only** (`var(--rs-*)`, `DesignSystem`). Import boundary không đổi.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| #4 đổi nhầm look | Trung bình | Giữ đúng giá trị `var(--rs-*)`; review trực quan từng file; **1 file/commit** để dễ revert. |
| #3 lock lệch version | Thấp | Pin đúng version đang resolve; chạy `npm ci` + test sau. |
| #2 placeholder không sanitize | Thấp | Chuỗi tĩnh do ta kiểm soát, **không** từ user input. |
| Gom CSS làm `globals.css` phình | Thấp | Thêm class rời rạc; tách commit theo file. |

## 6. Verification Plan
- **#2**: `renderMarkdown(<input gây throw>)` → chứa `ws-preview-error`, không `""`, không throw.
- **#3**: `grep '"@vitejs/plugin-react"' package.json` → `6.0.3` (no `^`); test xanh.
- **#4**: UI trước/sau giống hệt (manual / screenshot); `grep "style={{" src` cho 5 file → **0**.
- lint / typecheck / test / build xanh.

## 7. Status

**WAITING_FOR_APPROVAL**

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Polish — **không chặn merge W2**. Đề xuất tách commit: #2+#3 (1 commit), #4 mỗi file 1 commit (hoặc gộp hợp lý ≤200 dòng/lần) + 1 docs commit (contract này).
