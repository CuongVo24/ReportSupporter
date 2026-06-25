# Contract For AI — W11 Break: AI Rewrite/Tone Not Wired, Accept-Empty Overwrite & False-Done QA

> **Lane:** Core / break_task / week11_break.
> **Branch:** `feature/W11-ai-assistant` (hoặc `fix/w11-ai-integration-accept-guard`).
> **Type:** Bug fix / contract-fidelity — review findings **#1** (Critical), **#2** (Critical correctness), **#3** (High, report fidelity), **#4** (Medium, token rule) — W11 code review (session 2026-06-25).
> **Builds on:** Group A (`ai-gateway.ts`, `ai-config.ts`), Group C (`rewrite-section.ts`, `SuggestionDiff.tsx`), Group D (`improve-tone.ts`, `UserControlBar.tsx`), Group E (`W11_QA_Report.md`, `ai_control_evidence.md`, `build_output.txt`), `EditorPanel.tsx`/`Workspace.tsx` (W2 editor host).
> **Sources:** W11 code review (session 2026-06-25), `Design/ContractForAI/Core/month3/W11/w11c_*` (Locked #1 "không tự ghi đè", #4 "diff luôn thấy"), `w11d_*` (Locked #4 "user content control luôn hiển thị"), `w11e_*` (DoD off-state + control evidence), `MasterRoadMap.md` W11 ("section rewrite suggestions", "academic tone improvement"), `Design/Modules/Other/DesignSystem_Tokens.md`.

---

## 1. Micro-task Target

Vá bốn điểm **lệch-contract / sai DoD** của W11 đã ship: (a) **toàn bộ tính năng Group C + D không được lắp vào app** — `rewriteSection`/`improveTone`/`SuggestionDiff`/`UserControlBar` được export qua `write/index.ts` nhưng **không component nào render chúng** (`grep` trong `src/components/*` = rỗng), nên người dùng **không có đường nào** gọi rewrite/tone trong trình soạn thảo, trong khi QA report đánh `Group C/D = DONE` và `ai_control_evidence.md §1/§3` mô tả "requested only upon explicit user triggers **within the editor workspace**" + "UserControlBar ensures user controls are **visible** during pending states" — mô tả hành vi **không tồn tại** trong app đang chạy; (b) **nút Accept có thể ghi đè nội dung bằng chuỗi rỗng** — `SuggestionDiff` luôn bật nút "Áp dụng đề xuất" và gọi `onAccept(suggestion)` ngay cả khi `suggestion === ""` (ca disabled/unconfigured/AI rỗng), tức accept một no-op sẽ **xoá trắng** văn bản gốc, lệch w11c/w11d Locked #1 "không tự ghi đè / giữ nguyên gốc"; (c) **báo cáo khẳng định "0 warnings" trong khi lint thật có 1 warning**; (d) **hardcode màu rgba** trong `SuggestionDiff` (lệch quy tắc "CSS chỉ `var(--rs-*)`"). Chỉ Group B (outline-assist) thực sự dùng được (đã lắp trong `PresentPanel`/`Workspace`). Bốn điểm này làm QA report W11 thành **false-done** (giống lỗi W10 "premium visual" khi panel chưa có CSS).

- **#1 Group C & D chưa lắp vào trình soạn thảo (tính năng không tới được người dùng).** [rewrite-section.ts](src/modules/write/ai/rewrite-section.ts), [improve-tone.ts](src/modules/write/ai/improve-tone.ts), [SuggestionDiff.tsx](src/modules/write/ai/SuggestionDiff.tsx), [UserControlBar.tsx](src/modules/write/ai/UserControlBar.tsx) chỉ được export ở [write/index.ts:25-28](src/modules/write/index.ts) và test riêng lẻ; **không** được import/render ở [EditorPanel.tsx](src/components/EditorPanel.tsx) hay [Workspace.tsx](src/components/Workspace.tsx). Kiểm chứng: `grep -rn "SuggestionDiff\|UserControlBar\|rewriteSection\|improveTone" src/components/` = **rỗng**. Hệ quả: hai deliverable trung tâm của W11 ("section rewrite suggestions" + "academic tone improvement" — `MasterRoadMap.md` W11) **không có UI nào kích hoạt**. Tuy w11c/w11d chỉ ghi scope tới "export qua write/index.ts", nhưng `w11e_*` DoD ("mọi AI action sau explicit click; suggestion hiện diff; accept/reject hoạt động") và `ai_control_evidence.md` khẳng định chúng chạy "within the editor workspace" — nên trạng thái hiện tại là **false-done**: hoặc lắp chúng vào editor cho có đường explicit-action thật, hoặc báo cáo phải nói rõ "chưa tích hợp UI". Contract này chọn **lắp vào** (giữ off-state mặc định: nút disabled khi `getGatewayState()` ≠ `ready`).
- **#2 Accept đề xuất rỗng → ghi đè trắng nội dung (lệch Locked #1).** [SuggestionDiff.tsx:131-138](src/modules/write/ai/SuggestionDiff.tsx) nút accept `onClick={() => onAccept(suggestion)}` **luôn enabled**; khi `suggestion === ""` (no-op disabled/unconfigured, hoặc AI không trả kết quả — component còn render placeholder `"(AI không trả về kết quả)"` ở [dòng 126](src/modules/write/ai/SuggestionDiff.tsx)) việc bấm Accept sẽ ghi `""` đè lên `ReportSection`/text gốc → **mất dữ liệu người dùng**, đúng thứ Locked #1 ("không tự ghi đè") và Locked #4 ("giữ nguyên gốc khi reject") muốn chặn. Cần: vô hiệu Accept khi `!suggestion.trim()` **hoặc** `suggestion === original` (không có gì để áp dụng), và không gọi `onAccept` với chuỗi rỗng.
- **#3 Report khẳng định "0 warnings" trong khi lint thật có warning (false-done).** [ai-gateway.ts:19](src/modules/write/ai/ai-gateway.ts) `import { loadAiConfig, isAiReady, isAiUnconfigured }` — `isAiUnconfigured` **không dùng** trong file → `@typescript-eslint/no-unused-vars`. Kiểm chứng: `npx eslint src/modules/write/ai/ai-gateway.ts` → `1 problem (0 errors, 1 warning) 'isAiUnconfigured' is defined but never used`. Nhưng [build_output.txt:17](Design/Reports/Month3/W11/build_output.txt) ghi "Lint completed successfully. 0 errors, 0 warnings" và [W11_QA_Report.md:28](Design/Reports/Month3/W11/W11_QA_Report.md) "yields 0 errors and 0 warnings" → **lệch thực tế**. Thêm nữa [build_output.txt:24-61](Design/Reports/Month3/W11/build_output.txt) chỉ liệt kê ~38/67 file test (log bị cắt) dù tổng `331` đúng — "real output" của W11e nên dán đủ.
- **#4 Hardcode màu rgba (lệch "CSS chỉ var(--rs-*)").** [SuggestionDiff.tsx:63](src/modules/write/ai/SuggestionDiff.tsx) `backgroundColor: isSuggestion ? "rgba(22, 163, 74, 0.05)" : "rgba(220, 38, 38, 0.05)"` — màu cứng, không token; [ai_control_evidence.md:74-75](Design/Reports/Month3/W11/ai_control_evidence.md) còn ghi nguyên rgba như thể cố ý. Lệch quy tắc token đã áp ở W10 (verification `grep -E "rgb\(" = rỗng`). Cần thay bằng token nền nhạt success/error (xem #4 Scope).

> 🔒 **AI off mặc định (w11a Locked #2).** Lắp UI rewrite/tone **không** bật AI: nút/lối vào ở trạng thái `disabled` + ghi chú khi `getGatewayState()` là `disabled`/`unconfigured`; OFF → không `fetch`, không gọi gateway. Đường W1–W10 không phụ thuộc AI.
> 🔒 **Explicit action + không tự ghi đè (w11c/w11d Locked #1).** Rewrite/tone chỉ chạy sau click rõ ràng; suggestion chỉ ghi qua Accept hợp lệ (callback caller); reject/accept-rỗng giữ nguyên gốc.
> 🔒 **Không đổi shape canonical (CanonicalTypes §10).** Không đổi `AiAction`/`AiSuggestion`/`AiConfig`/`ReportSection`; chỉ thêm wiring UI + guard + token + sửa report.

## 2. Scope

### In scope
- **#1 Tích hợp Group C & D vào trình soạn thảo:** lắp lối vào explicit-action cho rewrite + tone cạnh editor (vd trong `EditorPanel`/`Workspace` side-panel, theo mẫu cách `PresentPanel` lắp `AiOutlineButton`):
  - Một nút "Viết lại đoạn (AI)" + một nút "Cải thiện văn phong (AI)" — `disabled` khi `getGatewayState()` ≠ `ready`, kèm ghi chú "Bật AI trong cấu hình" (đồng bộ `AiOutlineButton`).
  - Khi click (ready): gọi `rewriteSection(section, gateway)` / `improveTone(text, gateway)`, lưu `AiSuggestion` vào state cục bộ, render `SuggestionDiff` (dùng chung) + `UserControlBar` (luôn hiện bản gốc + undo). Accept → ghi qua callback của editor (cập nhật `ReportSection.markdown`/nội dung), reject → đóng giữ nguyên.
  - **Không** auto-run trên gõ phím/lưu. Off/unconfigured → nút mờ, không gọi gateway, không `fetch`.
  - File dự kiến MODIFY: `src/components/EditorPanel.tsx` **hoặc** `src/components/Workspace.tsx` (chọn nơi có sẵn `section`/nội dung + callback ghi); nếu cần một wrapper nhỏ thì thêm `src/modules/write/ai/AiAssistBar.tsx` (NEW, ≤120 dòng, style theo token) để gom nút + state, tránh phình `Workspace`.
- **#2** `src/modules/write/ai/SuggestionDiff.tsx` (MODIFY): tính `canAccept = suggestion.trim().length > 0 && suggestion !== original`; nút Accept `disabled={!canAccept}` (style disabled theo token, `cursor: not-allowed`); `onClick` chỉ gọi `onAccept(suggestion)` khi `canAccept`. Giữ placeholder "(AI không trả về kết quả)" nhưng **không cho** áp dụng nó.
- **#3** `src/modules/write/ai/ai-gateway.ts` (MODIFY): bỏ import `isAiUnconfigured` không dùng (hoặc dùng nó thật trong `getGatewayState` thay cho nhánh `return "unconfigured"` cuối — chọn 1, ghi rõ). `Design/Reports/Month3/W11/build_output.txt` (MODIFY): dán **đủ** log 4 gates thật (lint phải thực sự 0 warning sau khi bỏ import; liệt kê đủ 67 file hoặc nêu rõ đã rút gọn). `Design/Reports/Month3/W11/W11_QA_Report.md` (MODIFY): chỉ giữ "0 warnings" nếu thật; cập nhật §2/§4 cho trung thực về tích hợp C&D (sau khi #1 xong thì đúng; nếu hoãn thì ghi rõ trạng thái).
- **#4** `src/modules/write/ai/SuggestionDiff.tsx` (MODIFY): thay 2 `rgba(...)` bằng token. Nếu chưa có token nền nhạt, thêm `--rs-color-success-bg` / `--rs-color-error-bg` (hoặc `-tint`) vào `globals.css` (định nghĩa bằng màu hệ sẵn có) rồi dùng; **không** để màu cứng trong TSX. `Design/Reports/Month3/W11/ai_control_evidence.md` (MODIFY): bỏ chuỗi `rgba(...)` thô, mô tả bằng token.

### Out of scope
- ❌ Cài AI provider/SDK thật (ngoài stack — approve riêng; gateway giữ adapter-injection).
- ❌ Đổi thuật toán deterministic W9/W10 (outline/script/qa/hints).
- ❌ Đổi shape `AiSuggestion`/`AiConfig`/`ReportSection` hay `CanonicalTypes §10`.
- ❌ Tính năng AI thứ 4 (chỉ outline/rewrite/tone — w11d Locked #5).
- ❌ Viết lại test giòn `PresentPanel.test.tsx` / chuyển inline-CSS sang globals.css (→ contract polish `w11_polish_*`).

## 3. Checklist
- [ ] Rewrite + tone có lối vào explicit-action cạnh editor; off/unconfigured → nút disabled + ghi chú; **không** auto-run; no `fetch` khi off.
- [ ] Accept → ghi qua callback cập nhật nội dung; reject → giữ nguyên; `SuggestionDiff`/`UserControlBar` render khi có suggestion; bản gốc + undo luôn thấy.
- [ ] `SuggestionDiff`: Accept **disabled** khi `suggestion` rỗng hoặc trùng gốc; không gọi `onAccept("")`.
- [ ] `ai-gateway.ts` không còn import thừa; `npx eslint` = 0 warning thật.
- [ ] `SuggestionDiff` không còn `rgba(`/màu cứng; chỉ `var(--rs-*)`.
- [ ] `build_output.txt` dán log 4 gates **thật** (lint 0 warning); `W11_QA_Report.md`/`ai_control_evidence.md` trung thực (tích hợp C&D + bỏ rgba thô).
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

> Public API logic giữ nguyên. Chỉ thêm wiring UI + guard accept + token + sửa report; không đổi canonical types.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/components/EditorPanel.tsx` hoặc `Workspace.tsx` | MODIFY | ~+30 (lắp nút + state + diff/control) |
| `src/modules/write/ai/AiAssistBar.tsx` *(tuỳ chọn)* | NEW | ~≤120 (gom nút + state) |
| `src/modules/write/ai/SuggestionDiff.tsx` | MODIFY | ~±12 (guard accept + token màu) |
| `src/modules/write/ai/ai-gateway.ts` | MODIFY | ~−1 (bỏ import thừa) |
| `src/app/globals.css` | MODIFY (nếu cần) | ~+2 (token nền success/error) |
| `Design/Reports/Month3/W11/build_output.txt` | MODIFY | log 4 gates thật |
| `Design/Reports/Month3/W11/W11_QA_Report.md` | MODIFY | ~±8 (tích hợp + lint trung thực) |
| `Design/Reports/Month3/W11/ai_control_evidence.md` | MODIFY | ~±4 (bỏ rgba thô) |

> **Import boundary:** UI editor import `@/modules/write` (rewrite/tone/diff/control + gateway) + `@/types`. No `fetch`, offline khi off.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Lắp UI vô tình bật AI / gọi gateway khi off | High | Nút `disabled` khi state ≠ `ready`; gọi `getGatewayState()` trước; off → no-op, no `fetch`; test off-state. |
| Accept rỗng vẫn ghi đè | High | `canAccept` chặn rỗng/trùng gốc; test ca `suggestion=""` → Accept disabled, `onAccept` không gọi. |
| Wiring làm phình `Workspace` >200 dòng | TB | Gom vào `AiAssistBar.tsx` (NEW) thay vì nhồi `Workspace`. |
| Token nền mới lệch hệ màu | Thấp | Định nghĩa `--rs-color-success-bg/-error-bg` từ màu hệ sẵn có; đối chiếu `DesignSystem_Tokens.md`; `grep "rgb(" SuggestionDiff` = rỗng. |
| Report sửa nhưng lại lệch tiếp | Thấp | Lấy số liệu/lint trực tiếp từ `build_output.txt` cùng lần chạy. |

## 6. Verification Plan
- `grep -rn "SuggestionDiff\|UserControlBar\|rewriteSection\|improveTone" src/components/` → **> 0** (đã lắp). Off (flag default) → nút rewrite/tone disabled, ghi chú hiện, no `fetch`.
- Bật flag + adapter giả lập `ready` → click rewrite/tone → `SuggestionDiff` hiện gốc↔đề xuất; reject giữ nguyên; accept ghi qua callback (nội dung đổi). `UserControlBar` hiện bản gốc + undo cả khi suggestion chờ.
- `SuggestionDiff` với `suggestion=""` → nút Accept `toBeDisabled()`; click không gọi `onAccept`.
- `npx eslint src/modules/write/ai/ai-gateway.ts` → 0 warning. `grep -E "rgb\(|#[0-9a-f]{3,6}" src/modules/write/ai/SuggestionDiff.tsx` → rỗng.
- `grep -n "0 warnings" Design/Reports/Month3/W11/build_output.txt` chỉ còn nếu thật; số test khớp log.
- lint/typecheck/test/build (thật) xanh; dán đủ vào `build_output.txt`.

## 7. Status

`READY_TO_IMPLEMENT`

> ✅ Approved in review pass. Implement exactly this contract. Đề xuất commit: (1) `feat(ai): wire section rewrite + academic tone into editor (explicit action, off-safe)`; (2) `fix(ai): disable accept on empty/unchanged suggestion to prevent overwrite`; (3) `fix(ai): drop unused import + use design tokens in suggestion diff`; (4) `docs(w11): correct lint claim, integration status, real build_output`.
