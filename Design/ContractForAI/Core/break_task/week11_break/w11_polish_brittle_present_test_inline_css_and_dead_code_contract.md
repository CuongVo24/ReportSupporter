# Contract For AI — W11 Break: Brittle PresentPanel Test (Regression), Inline-CSS Drift & Dead Gateway Code

> **Lane:** Core / break_task / week11_break.
> **Branch:** `feature/W11-ai-assistant` (hoặc `polish/w11-tests-inline-css-dead-code`).
> **Type:** Maintainability / test-fidelity — review findings **S1**, **S2**, **S3**, **S4** (W11 code review, session 2026-06-25).
> **Builds on:** Group A (`ai-gateway.ts`), Group B (`assist-outline.ts`, `AiOutlineButton.tsx`, `PresentPanel.tsx`, `PresentPanel.test.tsx`), Group C/D (`SuggestionDiff.tsx`, `UserControlBar.tsx`).
> **Sources:** W11 code review (session 2026-06-25), `Design/ContractForAI/Core/break_task/week10_break/w10_polish_*` (S1 — đã bỏ test giòn, chuyển `@testing-library/react`), `w10_fix_*` (#1 — "CSS chỉ `var(--rs-*)`" trong globals.css), `Design/Modules/Other/DesignSystem_Tokens.md`.

---

## 1. Micro-task Target

Dọn bốn điểm nợ **không chặn merge** của W11: (a) `PresentPanel.test.tsx` **tái phạm đúng anti-pattern test giòn** mà break W10 (`w10_polish_*` S1) đã loại bỏ — mock `react.useState` bằng mảng index theo **đúng thứ tự & số lượng** hook (9 hook xuyên `PresentPanel` + `usePresent`), gọi component như **hàm thuần**, lội cây `element.props.children[2].props.children[1]...` theo index cứng, mock cả `useMemo/useEffect/useCallback`, và ghi đè `globalThis.mockActiveTab`; QA report §4.3 còn **tự hào** đã "bump mock array từ 5 lên 9" — chính là tín hiệu giòn; (b) **UI AI mới style bằng inline `style={{}}` thay vì class `ws-*` trong `globals.css`** — nghịch đảo lỗi W10 #1: class có nhưng **0 rule CSS**, mọi style nằm inline, tách rời design-system file; (c) **dead code** trong `ai-gateway.ts` (`buildNoopSuggestion` có param `state` chỉ dùng cho `...(state === "unconfigured" ? {} : {})` — spread rỗng vô nghĩa); (d) **trùng lặp** interface gateway + khối no-op ở ba module assist/rewrite/tone, vài **typo doc** + lối-vào-diff dùng `<span onClick>` (a11y). Mục tiêu: siết test cho có tín hiệu thật, đưa style về `globals.css` theo token, bỏ dead/dup code — **không đổi hành vi** cho input hợp lệ, **không đổi** public API/shape AI.

- **S1 `PresentPanel.test.tsx` giòn, tái phạm S1 của W10.** [PresentPanel.test.tsx:7-35](src/modules/present/PresentPanel.test.tsx) `vi.mock("react")` thay `useState` bằng mảng `stateValues` 9 phần tử map theo **đúng thứ tự** hook (`activeTab`→`editedBullets`→…→`aiError`) dùng `stateCallCount % length`; [dòng 64-89](src/modules/present/PresentPanel.test.tsx) gọi `PresentPanel({ bundle })` như hàm rồi truy cập `element.props.children[2].props.children[1].props.children[0]`, `children[5]...` theo index; [dòng 103/148](src/modules/present/PresentPanel.test.tsx) bật/tắt tab bằng `globalThis.mockActiveTab`. Hệ quả: (i) **không** render DOM thật → không bắt lỗi runtime/a11y; (ii) **không** test tương tác — `handleAiOutlineAssist` (luồng AI explicit-action chính của W11) **không bao giờ** được kích hoạt/khẳng định; (iii) thêm/đổi thứ tự **bất kỳ** `useState` nào (kể cả trong `usePresent`) làm mock map sai **âm thầm**. Đúng thứ `w10_polish_*` S1 đã cấm. [W11_QA_Report.md:42](Design/Reports/Month3/W11/W11_QA_Report.md) mô tả việc "bump mock array từ 5→9" như thành tựu — thực ra là dấu hiệu giòn. Repo đã có `@testing-library/react` (dùng ở panel khác + `ProjectInitializer.test.tsx`) — nên `render()` + query role/text.
- **S2 UI AI style inline thay vì `globals.css` (nghịch đảo W10 #1, dead class).** [SuggestionDiff.tsx](src/modules/write/ai/SuggestionDiff.tsx), [UserControlBar.tsx](src/modules/write/ai/UserControlBar.tsx), [AiOutlineButton.tsx](src/modules/present/ai/AiOutlineButton.tsx) và khối `aiSuggestion` ở [PresentPanel.tsx:170-277](src/modules/present/PresentPanel.tsx) gắn class `ws-*` nhưng style hoàn toàn bằng `style={{}}`. Kiểm chứng: `for c in ws-suggestion-diff-container ws-user-control-bar ws-present-ai-suggestion-box ws-present-ai-note; do grep -c "\.$c" src/app/globals.css; done` = **0** mọi class (class trang trí, inline làm việc) — tách rời design-system file mà W10 #1 đã thống nhất ("CSS chỉ `var(--rs-*)`" trong `globals.css`). Thêm: [AiOutlineButton.tsx:54](src/modules/present/ai/AiOutlineButton.tsx) tái dùng class `ws-present-ai-btn` — class W10 đã định nghĩa cho **nút AI placeholder disabled** → **đụng tên / lệch ngữ nghĩa** (giờ là nút active, style do inline đè). Cần chuyển style sang block `ws-*` trong `globals.css` (token-only) theo mẫu `ws-checker`/`ws-evidence`, và đổi tên class khỏi đụng `ws-present-ai-btn`.
- **S3 Dead code trong gateway.** [ai-gateway.ts:109-123](src/modules/write/ai/ai-gateway.ts) `buildNoopSuggestion(action, original, state)` — param `state` chỉ xuất hiện ở [dòng 121](src/modules/write/ai/ai-gateway.ts) `...(state === "unconfigured" ? {} : {})`: spread **rỗng ở cả hai nhánh**, không tạo field nào → câu lệnh vô nghĩa, `state` thực chất **không dùng**. Bỏ ternary chết + param thừa (hoặc dùng `state` thật nếu muốn phân biệt payload — hiện không cần). Giữ hành vi: vẫn trả `{ id, action, original, suggestion: "" }`.
- **S4 Trùng lặp + a11y + typo nhỏ.** (i) [assist-outline.ts:3-6](src/modules/present/ai/assist-outline.ts), [rewrite-section.ts:3-6](src/modules/write/ai/rewrite-section.ts), [improve-tone.ts:3-6](src/modules/write/ai/improve-tone.ts) khai báo gần **y hệt** interface `*Gateway` + cùng khối `if (disabled||unconfigured) return {…suggestion:""}` — có thể gom 1 type `AiActionGateway` + 1 helper `buildNoopSuggestion` dùng chung (DRY), giữ chữ ký hàm public. (ii) [UserControlBar.tsx:93](src/modules/write/ai/UserControlBar.tsx) lối vào diff là `<span ... onClick={onViewDiff}>` — **không** focus được bằng bàn phím, không `role`/`button` → a11y kém; nên `<button>`. (iii) Typo doc: [ai_control_evidence.md:76](Design/Reports/Month3/W11/ai_control_evidence.md) & [W11_QA_Report.md:43](Design/Reports/Month3/W11/W11_QA_Report.md) ghi "Cải thiện văn **văn** học thuật" (lặp từ) trong khi code [SuggestionDiff.tsx:22](src/modules/write/ai/SuggestionDiff.tsx) đúng là "Cải thiện văn **phong** học thuật".

> 🔒 **Không đổi hành vi / public API (w11 Locked).** S1 chỉ đổi **cách viết test**; S2 chỉ đổi **nơi đặt style** (inline → globals.css, vẫn token); S3/S4 chỉ bỏ dead/dup + a11y. Chữ ký `assistOutline`/`rewriteSection`/`improveTone`/`requestSuggestion` và shape `AiSuggestion`/`CanonicalTypes §10` **giữ nguyên**.
> 🔒 **CSS chỉ `var(--rs-*)` (W10 #1).** Block `ws-*` mới chỉ dùng token; không hardcode màu/px (px chỉ cho border-width nếu cần, ghi rõ).

## 2. Scope

### In scope
- **S1** `src/modules/present/PresentPanel.test.tsx` (MODIFY, viết lại): bỏ `vi.mock("react")` + mảng `stateValues` + `globalThis.mockActiveTab` + mọi `element.props.children[index]`. Dùng `render()` của `@testing-library/react` + query `getByRole`/`getByText`/`getByLabelText`; khẳng định: (i) render đủ tab + danh sách slide đúng số; (ii) chuyển tab bằng `fireEvent.click` (không global); (iii) **nút AiOutline `disabled`** khi off (gateway default) + ghi chú "Bật AI trong cấu hình"; (iv) hints tab resolve `slideId`→title (giữ ý test cũ) qua text thật. (Tuỳ chọn nâng cao: với gateway giả lập `ready`, click → assert có `aria-busy`/suggestion box — chỉ nếu gọn.)
- **S2** `src/app/globals.css` (MODIFY): thêm block `ws-*` cho UI AI, chỉ `var(--rs-*)`, theo mẫu panel khác — cho `SuggestionDiff` (container/header/grid/column gốc↔đề xuất/nút accept-reject), `UserControlBar` (bar/undo/diff-link), `AiOutlineButton` (nút + note + state disabled), và khối `aiSuggestion` preview ở `PresentPanel`. Chuyển các `style={{}}` tương ứng trong [SuggestionDiff.tsx](src/modules/write/ai/SuggestionDiff.tsx)/[UserControlBar.tsx](src/modules/write/ai/UserControlBar.tsx)/[AiOutlineButton.tsx](src/modules/present/ai/AiOutlineButton.tsx)/[PresentPanel.tsx](src/modules/present/PresentPanel.tsx) sang `className`. Đổi class nút outline khỏi đụng `ws-present-ai-btn` (vd `ws-present-ai-outline-action`). (Phối hợp #4 contract `w11_fix_*`: màu nền success/error dùng token, không rgba.)
- **S3** `src/modules/write/ai/ai-gateway.ts` (MODIFY): bỏ ternary chết [dòng 121](src/modules/write/ai/ai-gateway.ts) + param `state` thừa của `buildNoopSuggestion` (giữ output y nguyên).
- **S4** (i) `src/modules/write/ai/` + `src/modules/present/ai/`: gom interface gateway dùng chung — vd export `AiActionGateway` ở `ai-gateway.ts` (hoặc `@/types/ai`) và để 3 module assist/rewrite/tone `import` thay vì tự khai; gom khối no-op vào 1 helper (giữ chữ ký 3 hàm). (ii) [UserControlBar.tsx:93](src/modules/write/ai/UserControlBar.tsx): đổi `<span onClick>` → `<button type="button">` (giữ style link qua class). (iii) Sửa typo "văn văn"→"văn phong" ở `ai_control_evidence.md` + `W11_QA_Report.md`.
- **Tests** liên quan: cập nhật `SuggestionDiff`/`UserControlBar` test (nếu có) cho query theo role; thêm ca `UserControlBar` diff-entry là `button` focus được. (Nếu `w11_fix_*` đã thêm test guard accept, giữ đồng bộ.)

### Out of scope
- ❌ Lắp rewrite/tone vào editor; guard accept rỗng; sửa lint warning/false-done report (→ contract `w11_fix_*`).
- ❌ Đổi thuật toán W9/W10 hay shape `AiSuggestion`/`CanonicalTypes §10`.
- ❌ Cài AI provider/SDK. Dep mới / network.
- ❌ Viết lại toàn bộ test suite (chỉ `PresentPanel.test.tsx` + ca a11y nhỏ).

## 3. Checklist
- [ ] `PresentPanel.test.tsx` dùng `render()` + query role/text; **không** còn `vi.mock("react")`, `props.children[index]`, `globalThis.mockActiveTab`; có test nút AI `disabled` (off-state) + chuyển tab thật.
- [ ] Style UI AI nằm trong `globals.css` block `ws-*` (token-only); class `ws-suggestion-diff-*`/`ws-user-control-*`/`ws-present-ai-*` `grep -c` > 0; nút outline không đụng tên `ws-present-ai-btn`.
- [ ] `buildNoopSuggestion` không còn ternary chết / param thừa; hành vi giữ.
- [ ] Interface gateway dùng chung (1 nguồn) + helper no-op chung; chữ ký 3 hàm giữ.
- [ ] `UserControlBar` lối-vào-diff là `<button>` focus được; typo "văn phong" sửa ở report/evidence.
- [ ] ≤200 dòng/file; 4 gates xanh; `build_output.txt` thật.

## 4. Expected Interfaces / Files

> Public API + shape AI giữ nguyên. Chỉ đổi cách viết test, nơi đặt style, bỏ dead/dup + a11y.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/present/PresentPanel.test.tsx` | MODIFY (viết lại) | ~±90 (RTL render + interaction) |
| `src/app/globals.css` | MODIFY | ~+130 (block `ws-*` UI AI, token-only) |
| `src/modules/write/ai/SuggestionDiff.tsx` | MODIFY | ~−40 (inline→class) |
| `src/modules/write/ai/UserControlBar.tsx` | MODIFY | ~−30 (inline→class + button) |
| `src/modules/present/ai/AiOutlineButton.tsx` | MODIFY | ~−25 (inline→class, đổi tên class) |
| `src/modules/present/PresentPanel.tsx` | MODIFY | ~−40 (khối aiSuggestion inline→class) |
| `src/modules/write/ai/ai-gateway.ts` | MODIFY | ~−6 (dead code + interface chung) |
| `src/modules/present/ai/assist-outline.ts`, `write/ai/rewrite-section.ts`, `write/ai/improve-tone.ts` | MODIFY | ~−6 mỗi file (dùng type chung) |
| `Design/Reports/Month3/W11/ai_control_evidence.md`, `W11_QA_Report.md` | MODIFY | ~±2 (typo) |
| `Design/Reports/Month3/W11/build_output.txt` | MODIFY | log 4 gates thật |

> **Import boundary:** test import `@testing-library/react` + `@/modules/present`; module AI import `@/types`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| RTL test phụ thuộc cấu trúc DOM | Thấp | Query theo role/label/text (ổn định), không theo class/index. |
| Chuyển inline→class làm lệch trình bày | TB | Đối chiếu token đã dùng inline; preview xác nhận diff/control/nút giống trước; `grep "rgb(" block mới` = rỗng. |
| Đụng/đổi tên class phá style cũ | Thấp | Đổi class nút outline riêng (`ws-present-ai-outline-action`); giữ `ws-present-ai-btn` cho placeholder W10. |
| Gom interface chung phá type 3 hàm | Thấp | Giữ y chữ ký public; chỉ thay `interface` cục bộ bằng `import` type chung; typecheck xanh. |
| Test mới che luồng AI async | TB | Thêm ca click (gateway ready giả lập) khẳng định `aria-busy`/suggestion nếu gọn; tối thiểu giữ off-state. |

## 6. Verification Plan
- `grep -c "vi.mock(\"react\")\|props.children\[\|mockActiveTab" src/modules/present/PresentPanel.test.tsx` → **0**; có `render(`/`fireEvent`; nút AI `toBeDisabled()` off-state; chuyển tab bằng click.
- `for c in ws-suggestion-diff-container ws-user-control-bar ws-present-ai-suggestion-box ws-present-ai-note ws-present-ai-outline-action; do grep -c "\.$c" src/app/globals.css; done` → tất cả > 0; `grep -E "rgb\(|#[0-9a-f]{3,6}" block ws-* mới` = rỗng.
- `grep -n "state === \"unconfigured\" ? {} : {}" src/modules/write/ai/ai-gateway.ts` → rỗng (dead code gỡ).
- `grep -rn "interface .*Gateway" src/modules/{present,write}/ai/*.ts` → 1 nguồn dùng chung (không lặp 3 lần).
- `grep -c "<span" src/modules/write/ai/UserControlBar.tsx` cho lối-vào-diff = 0 (đã thành `<button>`); `grep "văn văn" Design/Reports/Month3/W11/*.md` = rỗng.
- preview: diff/control/nút outline render giống trước, không lỗi console; nút AI mờ khi off.
- lint/typecheck/test/build (thật) xanh; dán vào `build_output.txt`.

## 7. Status

`READY_TO_IMPLEMENT`

> ✅ Approved in review pass. Thực hiện **sau** hoặc phối hợp `w11_fix_*` (đụng chung `SuggestionDiff.tsx`/`globals.css`/report). Đề xuất commit: (1) `test(present): rewrite PresentPanel test with testing-library + interactions`; (2) `style(ai): move ai suggestion/control/outline styles to globals.css tokens`; (3) `refactor(ai): drop dead noop ternary, share gateway interface + a11y diff button`; (4) `docs(w11): fix tone title typo + real build_output`.
