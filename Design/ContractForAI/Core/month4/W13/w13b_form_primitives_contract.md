# Contract For AI - W13 Group B: Form Primitives (Input · Textarea · Select)

> **Lane / Week:** Core / Month 4 / W13 - Day 2 (`Design/TaskBrief/Core/month4/w13.md` `[C138]`-`[C139]`).
> **Branch:** `feature/W13-ui-foundation`.
> **Builds on:** Group A (`ui/` convention, Button), `DesignSystem_Tokens.md` §6.5 (`--rs-field-*`), `Frontend/2.Components/Input.md` · `Textarea.md` · `Select.md`, `Frontend/3.Patterns/FormValidation.md`.
> **Depended on by:** W14 adoption (metadata/template/export form), Group C/D.
> **Sources:** `w13.md` Locked #2/#4, `MasterRoadMap.md` W13, `@radix-ui/react-select`, `Modules/1.Write.md` (metadata form).

---

## 1. Micro-task Target

Build 3 field primitive: **Input** (text/number), **Textarea** (multi-line, ≠ editor Markdown), **Select** (trên `@radix-ui/react-select`) — label trên field, đủ states gồm **invalid**, wire chung pattern `FormValidation` (validate blur/submit, aria).

> **🔒 Token field (`--rs-field-*`).** Không hardcode; focus ring `--rs-color-focus-ring`.
> **🔒 Select giữ a11y Radix (Locked #1).** listbox/option/keyboard/typeahead của Radix — chỉ style.
> **🔒 Select/Textarea tách khỏi Input (Locked #4).** Input chỉ text/number.

## 2. Scope

### In scope (`[C138]`/`[C139]`)
- `src/components/ui/Input.{tsx,css}` (**NEW**): text/number; states default/hover/focus/disabled/readonly/invalid; `aria-describedby` error, `aria-invalid`.
- `src/components/ui/Textarea.{tsx,css}` (**NEW**): multi-line metadata/ghi chú; auto-grow hoặc resize-vertical; đếm ký tự (tuỳ) `aria-live`.
- `src/components/ui/Select.{tsx,css}` (**NEW**): Radix Select; trigger giống field + `ChevronDown`; content `--rs-z-dropdown`/`--rs-elevation-2`; item selected `Check`.
- Export qua `ui/index.ts`.

### Out of scope
- ❌ Editor Markdown chính (CodeMirror — Module 1, không đụng).
- ❌ Overlays/Tabs/gallery (Group C/D); refactor panel (W14).
- ❌ Đổi schema metadata/CanonicalTypes.

## 3. Checklist
- [ ] Input text/number, label trên, states đủ + invalid (border severity-error + error text).
- [ ] Textarea multi-line, ghi chú rõ **≠ editor chính** (`Modules/1.Write.md`).
- [ ] Select trên Radix; selected có icon+đậm; giữ keyboard/typeahead; style token.
- [ ] `<label for>` thật, `aria-describedby`/`aria-invalid`; không placeholder thay label.
- [ ] FormValidation: validate blur/submit, không gắt mỗi keystroke.
- [ ] Token-only; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/ui/Input.{tsx,css}` | NEW | text/number |
| `src/components/ui/Textarea.{tsx,css}` | NEW | multi-line |
| `src/components/ui/Select.{tsx,css}` | NEW | Radix Select |
| `src/components/ui/index.ts` | MODIFY | export 3 primitive |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Lỗi báo chỉ bằng màu viền | Medium | error text + aria; icon nếu cần (`FormValidation.md`). |
| Tự code dropdown bỏ a11y | Medium | Bắt buộc Radix Select; chỉ style (Locked #1). |
| Textarea bị dùng thay editor | Low | Doc + scope rõ ≠ CodeMirror. |
| Validate gắt từng keystroke | Low | Blur/submit-only (pattern). |
| File > 200 dòng | Low | Tách `.css`/subcomponent. |

## 6. Verification Plan
- Tab vào field → focus ring token; invalid hiện error + `aria-invalid`.
- Select: mở bằng phím, ↑↓/typeahead chọn, Esc đóng, selected có Check.
- grep no-hex; lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ui): add Input + Textarea primitives (states/a11y)`; `feat(ui): add Select on radix (token-styled)`; `docs(ui): commit w13b contract`.
