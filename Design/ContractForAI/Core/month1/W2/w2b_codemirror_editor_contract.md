# Contract For AI - W2 Group B: CodeMirror 6 Editor

> **Lane / Week:** Core / Month 1 / W2 - Day 2 (`Design/TaskBrief/Core/month1/w2.md` `[C18]`-`[C20]`).
> **Branch:** `feature/W2-markdown-editor`.
> **Builds on:** W1 `EditorPanel` (`src/components/EditorPanel.tsx`, controlled `<textarea>`, props `{ value, onChange, ariaLabel }`), `Workspace.tsx` wiring, `SnippetKind` (CanonicalTypes §1).
> **Sources:** `Design/TaskBrief/Core/month1/w2.md` Locked Decision #3, `week2.md` Day 2, `Design/Modules/1.Write.md`, `Design/Modules/Other/DesignSystem_Tokens.md`.

---

## 1. Micro-task Target

Thay controlled `<textarea>` của W1 bằng **CodeMirror 6** controlled editor, GIỮ NGUYÊN public props `{ value, onChange, ariaLabel }` để `Workspace.tsx` không phải sửa logic. Tách cấu hình CM ra `editor-setup.ts` và chèn snippet ra `insert-snippet.ts` để mỗi file ≤200 dòng.

## 2. Scope

### In scope (`[C18]`/`[C19]`/`[C20]`)
- `[C18]` `EditorPanel.tsx`: CodeMirror 6 controlled. Same props contract. Sync ngoài→trong khi `value` đổi (vd chuyển section); phát `onChange` khi gõ. Client-only (`"use client"` / mount trong `useEffect`).
- `[C19]` `src/modules/write/editor-setup.ts`: build `EditorState`/extensions (`@codemirror/state` + `@codemirror/view` + `@codemirror/lang-markdown`). Không chứa JSX.
- `[C20]` `src/modules/write/insert-snippet.ts`: hàm thuần `insertSnippet(doc: string, selection, kind: SnippetKind): { text, cursor }` cho `table`/`code`/`math`/`mermaid`/`callout`. Code snippet có language fence (giữ checker/export W1 đúng). Toolbar UI tối giản gọi hàm này.
- Cài deps (exact pin): `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-markdown`.
- Vitest cho `insert-snippet.ts` (thuần, không DOM): mỗi `SnippetKind` sinh đúng text; code có ` ```lang `.

### Out of scope
- ❌ Live preview qua pipeline (Group C).
- ❌ Image insert (Group E).
- ❌ Template picker / metadata (Group D).
- ❌ CodeMirror themes nâng cao / linting gutter / autocomplete.
- ❌ Component test cho `EditorPanel` (jsdom không cài ở W1/W2 — chỉ test hàm thuần).

## 3. Checklist
- [ ] `npm i -E @codemirror/state @codemirror/view @codemirror/lang-markdown`.
- [ ] `EditorPanel.tsx` dùng CM6, props không đổi, ≤200 dòng, client-only.
- [ ] `editor-setup.ts` (no JSX) ≤200 dòng.
- [ ] `insert-snippet.ts` thuần + export qua `modules/write/index.ts`.
- [ ] `insert-snippet.test.ts` phủ 5 `SnippetKind`.
- [ ] `Workspace.tsx` không đổi logic (chỉ giữ wiring cũ).
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/write/editor-setup.ts
export function createEditorState(opts: { doc: string; onChange: (v: string) => void }): EditorState;

// src/modules/write/insert-snippet.ts
export function insertSnippet(doc: string, from: number, to: number, kind: SnippetKind):
  { text: string; cursor: number };

// EditorPanel.tsx — UNCHANGED public props: { value, onChange, ariaLabel? }
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/components/EditorPanel.tsx` | MODIFY | ~90 |
| `src/modules/write/editor-setup.ts` | NEW | ~60 |
| `src/modules/write/insert-snippet.ts` | NEW | ~80 |
| `src/modules/write/insert-snippet.test.ts` | NEW | ~50 |
| `src/modules/write/index.ts` | MODIFY | +1 |
| `package.json` / `lock` | MODIFY | deps |

> **Import boundary:** `editor-setup`/`insert-snippet` import `@codemirror/*` + `@/types` only. `EditorPanel.tsx` imports `editor-setup`/`insert-snippet` via relative path; keeps presentational role. No `fetch`.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Controlled CM re-render nặng | Medium | Dispatch transaction chỉ khi `value` khác doc hiện tại; debounce `onChange` ở consumer nếu cần. |
| CM cần DOM, vỡ SSR | Medium | Mount trong `useEffect`, `"use client"`; không tạo view khi SSR. |
| Props EditorPanel đổi → vỡ Workspace | High | Giữ nguyên `{ value, onChange, ariaLabel }`; đổi nội thất, không đổi mặt tiền. |
| Code snippet mất language → checker W1 báo nhầm | Medium | `insertSnippet("code")` luôn chèn ` ```text ` fence có lang. |
| File >200 dòng | Medium | Tách setup/insert/component thành 3 file. |

## 6. Verification Plan
- `insertSnippet(...,"table")` chứa `|---|`; `"math"` chứa `$$`; `"code"` chứa ` ```; `"callout"` chứa marker; `"mermaid"` chứa ` ```mermaid `.
- Gõ trong editor → `onChange` nhận giá trị mới (kiểm thử thủ công).
- Chuyển section → editor hiển thị markdown mới (thủ công).
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> Đề xuất 2 commit: (1) deps + editor-setup + insert-snippet + test; (2) EditorPanel CM6 + wire. +1 docs commit cho contract.
