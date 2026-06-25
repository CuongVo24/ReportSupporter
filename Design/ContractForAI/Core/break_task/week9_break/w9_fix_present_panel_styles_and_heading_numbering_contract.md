# Contract For AI — W9 Break: Present Panel Missing Styles & Fragile Slide Heading-Numbering

> **Lane:** Core / break_task / week9_break.
> **Branch:** `feature/W9-slide-outline` (hoặc `fix/w9-present-styles-numbering`).
> **Type:** Bug fix / correctness + contract-fidelity — review findings **#1** (Critical), **S1** (W9 code review).
> **Builds on:** Group D (`PresentPanel.tsx`, `SlideOutlineView.tsx`, `Workspace.tsx`), Group A (`generate-outline.ts`), W3 heading numbering (`format/number-headings.ts`, `parse-headings.ts`).
> **Sources:** W9 code review (session 2026-06-25), `Design/ContractForAI/Core/month3/W9/w9a_*`, `w9d_*`, `Design/TaskBrief/Core/month3/w9.md` (Locked Decisions #1/#3), `Design/Modules/Other/DesignSystem_Tokens.md`, `5.Present.md §4`.

---

## 1. Micro-task Target

Vá hai điểm **đúng-sai / lệch-contract** của W9 đã ship: (a) **Present panel không có CSS** — component dùng ~25 class `ws-present-*` nhưng `globals.css` có **0 rule** cho chúng, nên panel render **trần** (không khung/khoảng cách/badge), trong khi checklist Contract D ghi `[x] CSS chỉ var(--rs-*)`; và (b) **ghép số chương cho slide rất mong manh** — khớp heading bằng so-bằng-text tuyệt đối + con trỏ `globalHeadingIdx` tăng đơn điệu, nếu một heading lệch text thì **mọi slide sau mất số thứ tự âm thầm**, đúng vào rủi ro High #1 của Contract A ("outline lệch dòng chương mục"). Code hiện chạy được, 4 gates xanh, nhưng hai điểm này làm sai DoD trực quan của Panel (w9d §6 "preview: panel render đúng") và acceptance cốt lõi của Outline (w9a §6 "title khớp heading").

- **#1 Panel thiếu CSS hoàn toàn (lệch checklist w9d "CSS chỉ var(--rs-*)").** [PresentPanel.tsx](src/modules/present/PresentPanel.tsx) và [SlideOutlineView.tsx](src/modules/present/SlideOutlineView.tsx) dùng các class `ws-present`, `ws-present-panel-title`, `ws-present-timeline-summary`, `ws-present-timeline-badge.overlimit`, `ws-present-slide-card`, `ws-present-bullet-input`, `ws-present-speaker-select`, … nhưng `grep -c ws-present src/app/globals.css` = **0** (so với `ws-evidence` 23 rule, `ws-export` 37, `ws-check` 17). Hệ quả: panel hiển thị không khung, badge cảnh báo vượt giờ **không nổi bật** (chỉ là text), input bullets/dropdown speaker không có visual affordance — lệch hẳn các panel anh em và lệch `DesignSystem_Tokens.md`. Checklist w9d đánh dấu xong nhưng tạo-mới-không-có là **false-done**.
- **S1 Ghép số chương mong manh (rủi ro High #1 của w9a).** [generate-outline.ts:184-192](src/modules/present/generate-outline.ts) khi gặp H1/H2 trong AST, tìm `NumberedHeading` bằng vòng `while` đẩy `globalHeadingIdx` cho tới khi `h.sectionId === s.id && h.depth === child.depth && h.text === headingText`. Hai mầm lỗi:
  - **So-bằng-text tuyệt đối:** `headingText = flattenNodeText(child).trim()` phải khớp **chính xác** `h.text` mà `parseHeadings` lưu. Nếu hai đường normalize lệch (khoảng trắng, ký tự ẩn, inline markdown) → không tìm thấy → fallback `title = headingText` **không số** ([generate-outline.ts:196](src/modules/present/generate-outline.ts)).
  - **Con trỏ tăng đơn điệu không lùi:** khi không khớp, `while` chạy **tới hết** `globalNumbered` → **mọi heading sau đó của mọi section đều mất số** (con trỏ đã ở cuối mảng). Một lệch nhỏ làm hỏng đánh số toàn bộ phần còn lại, **âm thầm** (không throw, test template hiện tại vẫn xanh nên không lộ).

> 🔒 **Hiển thị/điều phối, không sinh lại logic (Locked #1).** #1 chỉ thêm CSS cho panel D; **không** đổi `generateSlideOutline`/`buildTimeline`/`buildSpeakers`. CSS chỉ dùng `var(--rs-*)` (`DesignSystem_Tokens.md`), không hardcode màu/px tùy tiện.
> 🔒 **Deterministic, không đổi shape canonical (Locked #2/#3).** S1 là sửa **cách ghép** số (robust hơn), **không** đổi `SlideOutline`/CanonicalTypes §9, không đổi output cho input hợp lệ hiện tại (test vàng giữ nguyên).

## 2. Scope

### In scope
- **#1** `src/app/globals.css` (MODIFY): thêm block `ws-present-*` đầy đủ, chỉ dùng `var(--rs-*)`, theo phong cách EvidencePanel/CheckerPanel:
  - `.ws-present` (khối + spacing + `border-top`/`var(--rs-color-border)`), `.ws-present-panel-title` (`var(--rs-font-size-lg)`/`var(--rs-font-weight-semibold)`/`var(--rs-color-text)`), `.ws-present-empty` (`var(--rs-color-text-muted)`).
  - `.ws-present-timeline-summary` (flex, gap, `var(--rs-color-surface-muted)`/`var(--rs-radius-md)`), `.ws-present-duration`, `.ws-present-limit-input` (number input theo token), `.ws-present-timeline-badge.overlimit` (`var(--rs-color-severity-warning)` bg/text + `var(--rs-radius-full)`) — badge **phải nổi bật** vì là tín hiệu cảnh báo chính.
  - `.ws-present-slide-card` (`var(--rs-color-surface)`/`var(--rs-color-border)`/`var(--rs-radius-md)`/`var(--rs-elevation-1)`), `.ws-present-slide-title`, `.ws-present-slide-header` (flex), `.ws-present-evidence-badge` (chip — `var(--rs-color-surface-muted)`/`var(--rs-radius-sm)`), `.ws-present-bullet-row`/`-input`/`-remove-btn`/`-add-bullet-btn`, `.ws-present-speaker-select`/`-label`. Nút focus dùng `:focus-visible` + `var(--rs-color-focus-ring)` (đồng bộ các panel khác).
  - **Không** thêm class mới vào TSX (chỉ style các class đã có); nếu thiếu một class để style đúng (ví dụ trạng thái over-limit ở card) thì thêm tối thiểu và ghi rõ.
- **S1** `src/modules/present/generate-outline.ts` (MODIFY): bỏ phụ thuộc so-bằng-text mong manh. Hướng ưu tiên: **lập map theo (sectionId, thứ tự xuất hiện của H1/H2)** thay vì dò text. Cụ thể — khi build `globalNumbered`, đồng thời gom riêng list heading **đã đánh số có `depth ≤ 2` theo từng `sectionId`** theo đúng thứ tự; lúc segment, lấy phần tử kế tiếp của section đó (con trỏ **theo section**, không phải con trỏ toàn cục), không so text. Nếu vẫn muốn so text thì phải: (i) con trỏ **theo section** để lệch một section không lan sang section khác, và (ii) khi không khớp thì **giữ nguyên** `headingText` cho slide hiện tại nhưng **không** tiêu thụ con trỏ (không đẩy tới cuối mảng). Bảo toàn output cho input hợp lệ (test vàng [generate-outline.test.ts:52-77](src/modules/present/generate-outline.test.ts) phải vẫn xanh).
- **Regression tests** `src/modules/present/generate-outline.test.ts` (MODIFY): thêm 2 ca —
  - **Heading lệch nhẹ giữa các section** (ví dụ section sau có heading trùng text với section trước hoặc heading chứa inline markdown như `**đậm**`) → khẳng định **section sau vẫn được đánh số đúng**, không bị mất số do section trước.
  - **Nhiều H2 trong một section + một H2 ở section kế** → số `1.1, 1.2, 2.` (hoặc tương đương) đúng theo chapter flow, không lệch khi đổi nội dung không-heading.

### Out of scope
- ❌ Đổi thuật toán phân bổ timeline / chia speaker (Groups B/C — đúng).
- ❌ Đổi shape `SlideOutline`/`PresentationTimeline`/`Speaker` hay CanonicalTypes §9.
- ❌ Persist present state vào IDB (state cục bộ W9 — chủ ý).
- ❌ Tách chuỗi cảnh báo "[Cảnh báo: Minh chứng đã bị xóa]" khỏi `bullets` (→ contract polish `w9_polish_*`).
- ❌ Dep mới / network / AI.

## 3. Checklist
- [x] `globals.css`: có block `ws-present-*` đầy đủ, **chỉ** `var(--rs-*)`; `grep -c ws-present` > 0; badge over-limit nổi bật.
- [x] Panel render có khung/khoảng cách đồng bộ EvidencePanel; preview không lỗi console.
- [x] `generateSlideOutline`: ghép số theo (section, thứ tự) — lệch một heading **không** lan mất số toàn bộ phần sau.
- [x] Test vàng cũ giữ nguyên xanh; thêm ca heading-lệch + multi-H2 cross-section.
- [x] ≤200 dòng/file; 4 gates xanh (lint/typecheck/test/build), lưu `build_output.txt` thật.

## 4. Expected Interfaces / Files

> Không đổi public API. `generateSlideOutline`/`PresentPanel`/`SlideOutlineView` giữ nguyên signature; chỉ thêm CSS + làm robust phần ghép số (logic nội bộ).

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/app/globals.css` | MODIFY | ~+70 (block `ws-present-*`) |
| `src/modules/present/generate-outline.ts` | MODIFY | ~±20 (ghép số theo section) |
| `src/modules/present/generate-outline.test.ts` | MODIFY | ~+30 (2 ca regression) |
| `Design/Reports/Month3/W9/build_output.txt` | MODIFY | output 4 gates thật |

> **Import boundary:** outline import `@/types` + `@/lib` (parser) + `@/modules/format`; panel chỉ CSS. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| CSS lệch token / hardcode màu | Thấp | Chỉ `var(--rs-*)`; đối chiếu danh sách token đã dùng ở `ws-evidence`/`ws-export`; grep hex/px lạ = rỗng. |
| Sửa ghép số làm đổi output input hợp lệ | TB | Giữ test vàng cũ xanh; con trỏ theo section bảo toàn thứ tự; chỉ đổi nhánh **không khớp**. |
| Badge over-limit vẫn chìm | Thấp | Dùng `var(--rs-color-severity-warning)` nền + `role="alert"` sẵn có; test/preview xác nhận hiển thị. |
| File globals.css phình | Thấp | Block gọn theo mẫu panel khác; không trùng class. |

## 6. Verification Plan
- `grep -c "ws-present" src/app/globals.css` > 0; preview panel: khung/spacing/badge đúng, **không** lỗi console; over-limit → badge nổi bật.
- Báo cáo 2 section, section sau có heading trùng text / inline markdown → slide section sau **vẫn đánh số đúng** (số không biến mất).
- `generate-outline.test.ts` (vàng cũ) xanh; 2 ca mới xanh.
- `grep -E "#[0-9a-f]{3,6}|rgb\\(" ws-present block = rỗng (chỉ token).
- lint/typecheck/test/build (thật) xanh; dán vào `build_output.txt`.

## 7. Status

`DONE`

> ⛔ VibeCode Step 2: Đã hoàn thành sửa chữa và kiểm định thành công. Đề xuất commit: (1) `style(present): add ws-present panel styles using rs design tokens`; (2) `fix(present): robust per-section slide heading numbering`; (3) `docs(w9): real build_output after present panel style + numbering fixes`.
