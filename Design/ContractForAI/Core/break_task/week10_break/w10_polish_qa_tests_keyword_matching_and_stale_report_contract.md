# Contract For AI — W10 Break: Brittle Component Tests, Substring Keyword False-Positives & Stale QA Report

> **Lane:** Core / break_task / week10_break.
> **Branch:** `feature/W10-script-qa` (hoặc `polish/w10-tests-keywords-report`).
> **Type:** Maintainability / test-fidelity / accuracy — review findings **S1**, **S2**, **S3** (W10 code review, session 2026-06-25).
> **Builds on:** Group B (`generate-qa.ts`), Group D (`ScriptView.tsx`, `DefenseQAView.tsx`, `ScriptQAView.test.tsx`), Group E (`W10_QA_Report.md`).
> **Sources:** W10 code review (session 2026-06-25), `Design/ContractForAI/Core/month3/W10/w10b_*` (Q&A relevance), `w10d_*` (component test), `w10e_*` (QA report), `5.Present.md §3.2`.

---

## 1. Micro-task Target

Dọn ba điểm nợ **không chặn merge** của W10: (a) component test của Group D **rất giòn** — gọi component như hàm thuần rồi đi sâu vào `element.props.children[1].props.children[0]…` theo **index cứng**, không render DOM, không test tương tác (`onScriptChange` không bao giờ bị gọi), vỡ ngay khi đổi thứ tự JSX; (b) `generateDefenseQA` khớp keyword bằng `String.includes()` **substring thô** → false-positive (vd `"git"` khớp "di**git**al", "lo**git**ech"; `"git"`/`"setup"` lọt vào từ không liên quan) làm Q&A bám sai tín hiệu, lệch w10b §5 "Q&A không bám nội dung"; và (c) `W10_QA_Report.md` **lệch thực tế** — ghi 318 test (thật **319**) và khẳng định "premium visual user experience" trong khi UI mới **chưa có CSS** (xem contract fix `w10_fix_*`). Mục tiêu: siết test cho có tín hiệu thật, làm keyword khớp theo **ranh giới từ** (giảm false-positive, vẫn deterministic/offline), và đồng bộ QA report với thực tế — không đổi hành vi cho input hợp lệ.

- **S1 Component test giòn, tín hiệu thấp.** [ScriptQAView.test.tsx:28-46](src/modules/present/ScriptQAView.test.tsx) gọi `ScriptView({...})` như **hàm thuần** rồi truy cập `element.props.children[1].props.children[0].props.children[1].props.children[1]` để lấy textarea; tương tự `DefenseQAView` ở [ScriptQAView.test.tsx:64-77](src/modules/present/ScriptQAView.test.tsx). Hệ quả: (i) **không** render DOM thật (jsdom) → không bắt lỗi runtime/a11y; (ii) **không** test tương tác — `onScriptChange` truyền vào nhưng **không bao giờ** được kích hoạt/khẳng định; (iii) **vỡ giả** khi chỉ đổi thứ tự/bọc thêm 1 `div` dù hành vi không đổi. Repo đã có `@testing-library/react` (dùng ở các panel khác) — nên `render()` + query theo role/label/text thay vì lội cây props.
- **S2 Khớp keyword bằng substring thô → false-positive.** [generate-qa.ts:26-31](src/modules/present/generate-qa.ts) `findSentenceWithKeywords` dùng `lower.includes(kw)`; danh sách tech ([generate-qa.ts:63-77](src/modules/present/generate-qa.ts)) gồm `"git"`, `"setup"`, `"docker"`… khớp **bất kỳ** vị trí trong từ: `"git"` ⊂ "di**git**al"/"lo**git**ech"/"a**git**ate", có thể tạo câu hỏi `tech` sai từ câu không nói về công nghệ. Tương tự các topic khác. Lệch w10b §5 "Bám keyword section… test relevance" — relevance kém. Cần khớp theo **ranh giới từ** (word boundary, có để ý tiếng Việt có dấu/đa âm tiết) thay vì substring.
- **S3 QA report lệch thực tế (false-done số liệu + visual).** [W10_QA_Report.md:30](Design/Reports/Month3/W10/W10_QA_Report.md) ghi "passes 100% of **318** tests" nhưng `npx vitest run` thực tế **319** ([build_output.txt](Design/Reports/Month3/W10/build_output.txt) nên phản ánh). [W10_QA_Report.md:42](Design/Reports/Month3/W10/W10_QA_Report.md) khẳng định "premium visual user experience" và [§4](Design/Reports/Month3/W10/W10_QA_Report.md) "clean visual" trong khi panel mới **0 rule CSS** (xem `w10_fix_*` #1) — báo cáo phải trung thực: hoặc sửa sau khi `w10_fix_*` xong, hoặc ghi rõ "CSS được bổ sung ở break task".

> 🔒 **Deterministic, offline (w10b Locked #1).** S2 chỉ đổi **cách so khớp** (substring → word-boundary), **không** thêm keyword bịa, **không** gọi AI/fetch; cùng input → cùng Q&A. Giữ test vàng `generate-qa.test.ts` xanh (nếu một ca dựa vào substring lỏng thì cập nhật cho đúng ý relevance, ghi rõ).
> 🔒 **Không đổi public API.** S1 chỉ đổi **cách viết test**; `ScriptView`/`DefenseQAView` signature giữ nguyên (trừ prop `speakers` do `w10_fix_*` thêm — phối hợp thứ tự merge).

## 2. Scope

### In scope
- **S1** `src/modules/present/ScriptQAView.test.tsx` (MODIFY): viết lại bằng `render()` của `@testing-library/react` + query theo `getByRole`/`getByLabelText`/`getByText`; khẳng định: (i) số `textarea` = số script, (ii) **fireEvent.change** trên textarea → `onScriptChange` được gọi đúng `(slideId, value)`, (iii) Q&A nhóm đúng topic (heading topic + số item), (iv) **không** có nút AI active (`getByRole("button", { name: /AI/ })` ở trạng thái `disabled`). Bỏ truy cập `element.props.children[...]` theo index.
- **S2** `src/modules/present/generate-qa.ts` (MODIFY): thay `lower.includes(kw)` bằng so khớp **ranh giới từ**. Hướng: chuẩn hóa câu thành chuỗi token (tách theo khoảng trắng/dấu câu, lower-case) rồi kiểm `tokens.includes(kw)` cho keyword 1 từ, và `lower.includes(kw)` **chỉ** cho keyword nhiều âm tiết/cụm có dấu cách (vd "triển khai", "công nghệ") — hoặc dùng regex `\b` an toàn cho ASCII (`git`, `docker`, `setup`, `deploy`, `framework`, `database`, `github`, `roadmap`) trong khi giữ `includes` cho cụm tiếng Việt có dấu. Mục tiêu: `"digital"` **không** kích hoạt keyword `"git"`; `"triển khai hệ thống"` vẫn khớp. Giữ deterministic.
- **S2 test** `src/modules/present/generate-qa.test.ts` (MODIFY): thêm ca **false-positive guard** — câu chứa "digital"/"logic" nhưng **không** nói về git/công nghệ → **không** sinh câu `tech` sai; giữ ca relevance cũ (deploy→triển khai) xanh.
- **S3** `Design/Reports/Month3/W10/W10_QA_Report.md` (MODIFY): cập nhật số test đúng (**319**, hoặc số thật sau khi thêm ca mới), và sửa câu "premium/clean visual" cho trung thực (tham chiếu `w10_fix_*` đã bổ sung CSS). `Design/Reports/Month3/W10/build_output.txt` (MODIFY): dán output 4 gates **thật** sau các sửa đổi.

### Out of scope
- ❌ Thêm CSS / resolve id→tên (→ contract `w10_fix_*`).
- ❌ Đổi shape `DefenseQA`/CanonicalTypes §9 hay danh sách topic.
- ❌ Sinh Q&A bằng AI (→ W11). Dep mới / network.
- ❌ Viết lại toàn bộ test suite present (chỉ `ScriptQAView.test.tsx` + 1 ca `generate-qa.test.ts`).

## 3. Checklist
- [ ] `ScriptQAView.test.tsx` dùng `render()` + query role/label/text; **không** còn truy cập `.props.children[index]`.
- [ ] Test khẳng định `onScriptChange` được gọi khi sửa textarea (tương tác thật).
- [ ] Test khẳng định nút AI ở trạng thái `disabled` (không active).
- [ ] `generateDefenseQA` khớp keyword theo ranh giới từ; `"digital"`… không kích hoạt `"git"`.
- [ ] `generate-qa.test.ts`: ca false-positive guard xanh; ca relevance cũ giữ xanh; deterministic giữ.
- [ ] `W10_QA_Report.md` số test đúng + bỏ khẳng định visual sai; `build_output.txt` thật.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

> Public API giữ nguyên. Chỉ đổi nội bộ `generateDefenseQA` (cách so khớp) + cách viết test + nội dung report.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/present/ScriptQAView.test.tsx` | MODIFY (viết lại) | ~±60 (RTL render + interaction) |
| `src/modules/present/generate-qa.ts` | MODIFY | ~±15 (word-boundary match) |
| `src/modules/present/generate-qa.test.ts` | MODIFY | ~+15 (false-positive guard) |
| `Design/Reports/Month3/W10/W10_QA_Report.md` | MODIFY | ~±6 (số test + visual trung thực) |
| `Design/Reports/Month3/W10/build_output.txt` | MODIFY | output 4 gates thật |

> **Import boundary:** test import `@testing-library/react` + `@/modules/present`; `generate-qa` import `@/types`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Word-boundary làm **mất** match hợp lệ (tiếng Việt đa âm tiết) | TB | Giữ `includes` cho cụm có dấu cách; chỉ siết `\b` cho keyword ASCII 1 từ; ca relevance cũ (deploy/triển khai) phải vẫn xanh. |
| RTL test phụ thuộc cấu trúc DOM | Thấp | Query theo role/label/text (ổn định), không theo class/thứ tự. |
| Đổi keyword match làm lệch output ca vàng | TB | Chạy `generate-qa.test.ts` cũ; nếu một assert dựa vào false-positive thì sửa cho đúng ý relevance, ghi rõ trong PR. |
| Report sửa nhưng lại lệch tiếp | Thấp | Lấy số test trực tiếp từ `build_output.txt` thật cùng lần chạy. |

## 6. Verification Plan
- `ScriptQAView.test.tsx`: `grep -c "props.children\[" ` = 0; có `fireEvent`/`userEvent` cho textarea; `expect(onScriptChange).toHaveBeenCalledWith(...)`; nút AI `toBeDisabled()`.
- `generateDefenseQA`: câu "Chuyển đổi số (digital) cho doanh nghiệp." → **không** có Q&A `tech` do "git"; câu "Hệ thống triển khai bằng Docker." → **có** Q&A `tech`/triển khai (relevance giữ).
- gọi 2 lần cùng input → Q&A giống hệt (deterministic giữ).
- `grep "318" W10_QA_Report.md` = rỗng; số test khớp `build_output.txt`.
- lint/typecheck/test/build (thật) xanh; dán vào `build_output.txt`.

## 7. Status

`READY_TO_IMPLEMENT`

> ✅ Approved in review pass. Implement exactly this contract. Đề xuất commit: (1) `test(present): rewrite script/qa view tests with testing-library + interactions`; (2) `fix(present): word-boundary keyword match in defense q&a to cut false positives`; (3) `docs(w10): correct qa report test count and visual claims`.
