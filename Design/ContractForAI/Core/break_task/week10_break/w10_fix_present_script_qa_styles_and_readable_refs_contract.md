# Contract For AI — W10 Break: Script/Q&A/Hints Panel Missing Styles & Raw-ID References

> **Lane:** Core / break_task / week10_break.
> **Branch:** `feature/W10-script-qa` (hoặc `fix/w10-present-styles-readable-refs`).
> **Type:** Bug fix / contract-fidelity — review findings **#1** (Critical), **#2** (UX correctness) — W10 code review (session 2026-06-25).
> **Builds on:** Group D (`PresentPanel.tsx`, `ScriptView.tsx`, `DefenseQAView.tsx`, `use-present.ts`), W9 break fix (`w9_fix_present_panel_styles_*` — block `ws-present-*` đã có cho panel W9).
> **Sources:** W10 code review (session 2026-06-25), `Design/ContractForAI/Core/month3/W10/w10d_script_qa_panel_contract.md` (checklist "CSS chỉ `var(--rs-*)`", "badge trỏ slide/section"), `Design/Modules/Other/DesignSystem_Tokens.md`, `5.Present.md §4`.

---

## 1. Micro-task Target

Vá hai điểm **lệch-contract / sai DoD trực quan** của W10 Group D đã ship: (a) **toàn bộ UI mới của Day-4 không có CSS** — `PresentPanel`/`ScriptView`/`DefenseQAView` dùng ~30 class `ws-present-*` mới (tabs, script-view, qa-view, hint-item, badge…) nhưng `globals.css` có **0 rule** cho chúng, nên Tabs / Kịch bản / Q&A / Hints render **trần** (không tab, không badge severity màu, textarea không định dạng), trong khi checklist Contract D ghi `[x] CSS chỉ var(--rs-*)`; và (b) **view hiển thị ID thô thay vì tên người đọc được** — Script view in `speakerId` (vd `spk-1`) thay vì tên người nói, Hints panel in `slideId` (vd `slide-sec-1`) thay vì tiêu đề slide, lệch yêu cầu w10d §2/§6 "link section", "badge **trỏ** slide/section" (phải đọc được). Code chạy được, 4 gates xanh, nhưng hai điểm này làm sai DoD trực quan của w10d §6 ("preview: panel render đủ Script/Q&A/hints, không lỗi console") và làm QA report W10 (`W10_QA_Report.md §4` "premium visual user experience") thành **false-done**.

- **#1 Panel mới thiếu CSS hoàn toàn (lệch checklist w10d "CSS chỉ var(--rs-*)").** [PresentPanel.tsx](src/modules/present/PresentPanel.tsx), [ScriptView.tsx](src/modules/present/ScriptView.tsx), [DefenseQAView.tsx](src/modules/present/DefenseQAView.tsx) dùng các class mới: `ws-present-tabs`, `ws-present-tab-btn`(`.active`), `ws-present-tab-content`, `ws-present-badge-count`, `ws-present-script-view`/`-list`/`-item`/`-header`/`-body`/`-label`/`-textarea`, `ws-present-ai-container`/`-ai-btn`, `ws-present-script-cues`/`-cues-title`/`-cues-list`/`-cue-badge`, `ws-present-view-title`, `ws-present-qa-view`/`-qa-empty`/`-qa-topics-list`/`-qa-topic-group`/`-qa-topic-header`/`-qa-items`/`-qa-item`/`-qa-question`/`-qa-answer`/`-qa-answer-text`/`-qa-footer`/`-qa-section-link`/`-qa-ai-btn`, `ws-present-hints-view`/`-hints-empty`/`-hints-list`/`-hint-item`(`.severity-*`)/`-hint-header`/`-hint-badge`/`-hint-slide-link`/`-hint-body`/`-hint-reason`/`-hint-suggestion`, `ws-present-slide-speaker`. Kiểm chứng: `for c in ws-present-tabs ws-present-tab-btn ws-present-script-view ws-present-qa-view ws-present-hint-item ws-present-cue-badge; do grep -c "\.$c" src/app/globals.css; done` = **0** cho mọi class (so với block W9 `ws-present-slide-card`… đã có). Hệ quả: tab điều hướng **không nổi**, badge severity (`error/warning/info`) chỉ là text **không màu**, badge đếm hint (`ws-present-badge-count`) **không hiển thị như chip**, cue badge và textarea kịch bản **không khung** — lệch hẳn EvidencePanel/CheckerPanel và `DesignSystem_Tokens.md`. Checklist w10d đánh dấu xong nhưng **không thêm 1 dòng CSS nào** là false-done; component test (jsdom) pass vì không đụng CSS nên không lộ.
- **#2 View in ID thô thay vì tên (lệch w10d "link section / trỏ slide").** [ScriptView.tsx:23-27](src/modules/present/ScriptView.tsx) render `🗣️ Người nói: {item.speakerId}` — `speakerId` là id nội bộ (vd `spk-1`), không phải tên hiển thị; ScriptView **không nhận** `speakers` nên không resolve được tên. [PresentPanel.tsx:165-169](src/modules/present/PresentPanel.tsx) render `Trỏ tới slide: {hint.slideId}` — in id slide thô (vd `slide-sec-1`) thay vì `slide.title`. Người dùng (sinh viên) thấy mã máy thay vì "Nguyễn Văn A" / "Chương 2. Cơ sở lý thuyết". Q&A view đã làm đúng (map `relatedSectionId` → `section.title` ở [DefenseQAView.tsx:42-60](src/modules/present/DefenseQAView.tsx)); Script/Hints cần đồng bộ cách này.

> 🔒 **Hiển thị/điều phối, không sinh lại logic (w10d Locked #1).** #1 chỉ thêm CSS cho view D; **không** đổi `generateSpeakerScript`/`generateDefenseQA`/`buildWeakSectionHints`. CSS chỉ dùng `var(--rs-*)` (`DesignSystem_Tokens.md`), không hardcode màu/px.
> 🔒 **AI off mặc định (w10d Locked #2).** Style nút AI ở trạng thái **disabled/placeholder** (mờ, `cursor: not-allowed`) — **không** kích hoạt; giữ `disabled` sẵn có trong TSX.
> 🔒 **Không đổi shape canonical.** #2 chỉ resolve id→tên ở **tầng view** (truyền `speakers`/`slides` đã có vào component), không đổi `SpeakerScript`/`WeakSectionHint`/CanonicalTypes §9, không đổi output logic.

## 2. Scope

### In scope
- **#1** `src/app/globals.css` (MODIFY): thêm block `ws-present-*` cho UI Day-4, chỉ `var(--rs-*)`, theo phong cách CheckerPanel/EvidencePanel:
  - **Tabs:** `.ws-present-tabs` (flex, gap, `border-bottom`/`var(--rs-color-border)`), `.ws-present-tab-btn` (`var(--rs-color-text-muted)`, `:focus-visible` + `var(--rs-color-focus-ring)`), `.ws-present-tab-btn.active` (`var(--rs-color-text)` + chỉ báo active), `.ws-present-badge-count` (chip nhỏ `var(--rs-color-severity-warning)`/`var(--rs-radius-full)`), `.ws-present-tab-content` (spacing).
  - **Script view:** `.ws-present-script-view`/`-list`/`-item` (card `var(--rs-color-surface)`/`var(--rs-color-border)`/`var(--rs-radius-md)`), `-header`/`-slide-speaker` (chip), `-body`/`-label`/`-textarea` (textarea theo token, `var(--rs-color-surface)`, focus ring), `-script-cues`/`-cues-title`/`-cues-list`/`-cue-badge` (chip gợi ý), `.ws-present-ai-container`/`-ai-btn` (nút **disabled** mờ, `cursor: not-allowed`).
  - **Q&A view:** `.ws-present-qa-view`/`-view-title`/`-qa-empty` (muted), `-qa-topics-list`/`-qa-topic-group`/`-qa-topic-header`, `-qa-items`/`-qa-item` (card), `-qa-question`/`-qa-answer`/`-qa-answer-text`/`-qa-footer`/`-qa-section-link`/`-qa-ai-btn` (disabled).
  - **Hints view:** `.ws-present-hints-view`/`-hints-empty`/`-hints-list`/`-hint-item`, **severity màu**: `.ws-present-hint-item.severity-error`/`-hint-badge.severity-error` → `var(--rs-color-severity-error)`, `.severity-warning` → `var(--rs-color-severity-warning)`, `.severity-info` → `var(--rs-color-severity-info)` (badge **phải nổi bật** vì là tín hiệu mức độ); `-hint-header`/`-hint-slide-link`/`-hint-body`/`-hint-reason`/`-hint-suggestion`.
  - **Không** thêm class mới vào TSX (chỉ style class đã có); nếu cần một class phụ để style đúng thì thêm tối thiểu và ghi rõ.
- **#2** `src/modules/present/ScriptView.tsx` (MODIFY): nhận thêm prop `speakers: Speaker[]`; render tên người nói = `speakers.find(s => s.id === item.speakerId)?.name ?? item.speakerId` (fallback id nếu không tìm thấy — không bịa). `src/modules/present/PresentPanel.tsx` (MODIFY): truyền `speakers` vào `ScriptView`; ở khối hints render tiêu đề slide = `slides.find(s => s.id === hint.slideId)?.title ?? hint.slideId` thay cho `hint.slideId` thô. (Cả `speakers` và `slides` đã có sẵn từ `usePresent`.)
- **Tests** `src/modules/present/ScriptQAView.test.tsx` (MODIFY): cập nhật mock `ScriptView` truyền `speakers` và khẳng định render **tên** (không phải id); thêm/cập nhật ca hints khẳng định hiển thị **title slide**. (Xem thêm contract polish `w10_polish_*` về việc chuyển sang `@testing-library/react`.)

### Out of scope
- ❌ Đổi thuật toán `generateSpeakerScript`/`generateDefenseQA`/`buildWeakSectionHints` (Groups A–C — đúng).
- ❌ Kích hoạt AI rewrite (→ W11; giữ disabled).
- ❌ Đổi shape `SpeakerScript`/`DefenseQA`/`WeakSectionHint` hay CanonicalTypes §9.
- ❌ Export PPTX/PDF (DEFERRED). Dep mới / network / AI.

## 3. Checklist
- [ ] `globals.css`: block `ws-present-*` Day-4 đầy đủ, **chỉ** `var(--rs-*)`; mọi class mới (`tab-btn`, `script-view`, `qa-view`, `hint-item`, `cue-badge`, `badge-count`…) `grep -c` > 0; badge severity **3 màu** đúng token.
- [ ] Nút AI style ở trạng thái disabled/placeholder (mờ, không active).
- [ ] `ScriptView` hiển thị **tên người nói** (resolve từ `speakers`), fallback id khi thiếu — không bịa.
- [ ] Hints hiển thị **tiêu đề slide** (resolve từ `slides`), fallback id khi thiếu.
- [ ] Panel render có tab/khung/badge đồng bộ CheckerPanel; preview không lỗi console.
- [ ] Test cập nhật: assert tên người nói + title slide; không có nút AI active.
- [ ] ≤200 dòng/file; 4 gates xanh (lint/typecheck/test/build), lưu `build_output.txt` thật.

## 4. Expected Interfaces / Files

> Public API logic giữ nguyên. `ScriptView` thêm prop `speakers` (UI-only); panel/CSS thay đổi trình bày, không đổi canonical types.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/app/globals.css` | MODIFY | ~+110 (block `ws-present-*` Day-4) |
| `src/modules/present/ScriptView.tsx` | MODIFY | ~±6 (prop `speakers` + resolve tên) |
| `src/modules/present/PresentPanel.tsx` | MODIFY | ~±4 (truyền `speakers`; title slide ở hints) |
| `src/modules/present/ScriptQAView.test.tsx` | MODIFY | ~+10 (assert tên/title) |
| `Design/Reports/Month3/W10/build_output.txt` | MODIFY | output 4 gates thật |

> **Import boundary:** view import `@/modules/present` (A–C) + `@/types`; panel chỉ CSS + truyền props. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| CSS lệch token / hardcode màu | Thấp | Chỉ `var(--rs-*)`; đối chiếu token đã dùng ở `ws-checker`/`ws-evidence`; `grep -E "#[0-9a-f]{3,6}|rgb\(" block ws-present mới` = rỗng. |
| Badge severity vẫn chìm | Thấp | Dùng `var(--rs-color-severity-*)` nền + chữ tương phản; preview xác nhận 3 mức nổi. |
| `speakers` không khớp `speakerId` (slide chưa gán) | Thấp | Fallback `?? item.speakerId`; không render "undefined"; ẩn dòng người nói nếu `speakerId` rỗng (giữ logic `{item.speakerId && …}`). |
| File globals.css phình | Thấp | Block gọn theo mẫu panel khác; không trùng class W9. |
| Vô tình bật AI khi style nút | Thấp | Chỉ CSS; giữ `disabled` trong TSX; test không có nút AI active. |

## 6. Verification Plan
- `for c in ws-present-tab-btn ws-present-script-view ws-present-qa-view ws-present-hint-item ws-present-cue-badge ws-present-badge-count; do grep -c "\.$c" src/app/globals.css; done` → tất cả > 0.
- `grep -E "#[0-9a-f]{3,6}|rgb\(|[0-9]+px" trong block ws-present mới` → rỗng (chỉ token; px chỉ cho border-width nếu cần, ghi rõ).
- preview panel: 4 tab render, chuyển tab hoạt động, badge hint đếm hiển thị; hints 3 severity hiện **đúng màu**; textarea/cue/badge có khung; **không** lỗi console; nút AI mờ/disabled.
- Script view: dòng người nói hiển thị **tên** (vd "Nguyễn Văn A"), không phải `spk-1`. Hints: link slide hiển thị **tiêu đề** chương, không phải `slide-sec-1`.
- lint/typecheck/test/build (thật) xanh; dán vào `build_output.txt`.

## 7. Status

`READY_TO_IMPLEMENT`

> ✅ Approved in review pass. Implement exactly this contract. Đề xuất commit: (1) `style(present): add ws-present script/qa/hints panel styles using rs design tokens`; (2) `fix(present): show speaker name and slide title instead of raw ids`; (3) `docs(w10): real build_output after present panel style + readable-ref fixes`.
