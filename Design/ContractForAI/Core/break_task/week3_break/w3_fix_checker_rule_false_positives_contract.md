# Contract For AI — W3 Break: Fix Checker Rule False Positives & Silent Swallow

> **Lane:** Core / break_task / week3_break.
> **Branch:** `feature/W3-format-check` (hoặc `fix/w3-checker-rules`).
> **Type:** Bug fix — review findings **#3**, **#6**, **#7**, **#8** (W3 code review).
> **Builds on:** Group C (`run-checker.ts` engine + registry), Group D (`evidence-gaps.ts`, `structure.ts`).
> **Sources:** W3 code review (checker false positives), `Design/Modules/3.Check.md §5.2/§6`, `Design/Modules/Other/CanonicalTypes.md §6`.

---

## 1. Micro-task Target

Vá các rule checker hay **báo nhầm** (false positive) và một chỗ **nuốt lỗi âm thầm**, để issue đưa ra đáng tin và không tụt readiness score oan.

- **#3 `missing-project-links` báo nhầm.** Rule yêu cầu keyword (`github`/`demo`/`deploy`/`source`) xuất hiện **trong chuỗi URL**. Link deploy/demo hợp lệ như `https://myapp.vercel.app` không chứa keyword → vẫn báo `error` (−15 điểm). URL deploy/demo thực tế hiếm khi chứa các từ đó. ([evidence-gaps.ts:31](src/modules/check/rules/evidence-gaps.ts))
- **#6 `hardcoded-heading-number` báo nhầm năm/số trần.** Regex `^\d+(\.\d+)*[\s.]` khớp cả heading hợp lệ kiểu `"2024 Tổng kết"` hay `"5 bài học"`. ([structure.ts:5](src/modules/check/rules/structure.ts))
- **#7 `empty-section` đọc raw string dù gắn nhãn `detect:["ast"]`.** Cài bằng `split("\n")` + `startsWith("#")` — lệch triết lý AST-first và dễ sai khi có dòng prose bắt đầu bằng `#`. ([structure.ts:50](src/modules/check/rules/structure.ts))
- **#8 Engine nuốt lỗi rule.** `run-checker` bọc `rule.run` trong try/catch chỉ `console.error` → rule hỏng biến mất không dấu vết, người dùng tưởng "không có vấn đề". ([run-checker.ts:40](src/modules/check/run-checker.ts))

## 2. Scope

### In scope
- **#3** `src/modules/check/rules/evidence-gaps.ts` (`missing-project-links`): coi là "có link dự án" khi **bất kỳ** điều kiện sau đúng (đều offline, chỉ kiểm chuỗi):
  - metadata có **key** chứa keyword (`github`/`demo`/`deploy`/`source`/`repo`/`url`) với value là URL hợp lệ; **hoặc**
  - `bundle.evidence` có `kind` ∈ {`github`,`deploy`} với `url` hợp lệ; **hoặc**
  - AST có `link` node mà `url` chứa keyword **hoặc** trỏ host phổ biến (`github.com`, `vercel.app`, `netlify.app`, `*.io/*`…) — danh sách nhỏ, mở rộng sau.
  - Bỏ điều kiện "keyword phải nằm trong URL string" làm nguồn duy nhất.
- **#6** `src/modules/check/rules/structure.ts` (`hardcoded-heading-number`): siết regex để chỉ bắt **đánh số mục thật**, không bắt số trần:
  - Khớp: `^\d+(\.\d+)+` (đa cấp `1.1`), `^\d+\.\s` (số + dấu chấm + space, vd `1. `), `^(Chương|Chapter)\s+\d+`.
  - **Không** khớp: `^\d+\s` trần (vd `2024 Tổng kết`, `5 bài học`).
- **#7** `src/modules/check/rules/structure.ts` (`empty-section`): đọc **AST** từ `ctx.sectionAsts[section.id]` — section rỗng nếu sau khi loại node `heading`, không còn node nội dung (paragraph/list/table/image/code… có text/giá trị). Sửa `detect` cho đúng (`["ast"]` và thực sự đọc ast).
- **#8** `src/modules/check/run-checker.ts`: khi rule throw, ngoài `console.error`, **đẩy một issue** `id:"checker-rule-error"` (severity `info`, message nêu rule id) để lỗi **hiển thị**, không nuốt. (Hoặc tối thiểu: gom danh sách rule lỗi vào kết quả — không để trống lặng.)
- **Regression tests** cho từng fix (hard-assert id + severity + trigger/non-trigger):
  - deploy link `https://x.vercel.app` qua metadata/evidence → **không** `missing-project-links`.
  - heading `"2024 Tổng kết"` → **không** `hardcoded-heading-number`; `"1.1 Kiến trúc"`/`"Chương 1"` → **có**.
  - section chỉ có heading → `empty-section`; section có 1 ảnh/bảng → **không**.
  - rule throw (mock) → có issue `checker-rule-error` (info), engine không crash.

### Out of scope
- ❌ Gọi mạng để verify link sống (cấm — offline). Chỉ kiểm chuỗi/hợp lệ URL.
- ❌ Đổi shape `ReportIssue`/`CheckRule`/`CheckResult` (CanonicalTypes §6 — giữ nguyên).
- ❌ Thêm template vào `getTemplateSchema` registry (việc của tuần thêm template).
- ❌ Findings #1/#2/#4/#5 (Contract 1 — `w3_fix_toc_anchor_and_numbering_contract.md`).

## 3. Checklist
- [ ] `missing-project-links` nhận diện deploy/demo/github qua key/evidence-kind/host, hết báo nhầm link không chứa keyword.
- [ ] `hardcoded-heading-number` không bắt số trần (`2024 …`), vẫn bắt `1.`/`1.1`/`Chương 1`.
- [ ] `empty-section` đọc AST thật (`detect:["ast"]` đúng), không phụ thuộc `startsWith("#")`.
- [ ] `run-checker` đẩy issue `checker-rule-error` (info) khi rule throw — không nuốt.
- [ ] Test cho cả 4 fix (trigger + non-trigger), id/severity hard-assert.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// evidence-gaps.ts — helper nội bộ, signature rule giữ nguyên (CheckRule)
function hasProjectLink(ctx: CheckContext): boolean; // key | evidence kind | host | keyword
// structure.ts — regex siết lại
const HARDCODED_HEADING_REGEX = /^(\d+(\.\d+)+|\d+\.\s|(Chương|Chapter)\s+\d+)/i;
// run-checker.ts — issue khi rule lỗi (không đổi shape ReportIssue)
{ id: "checker-rule-error", severity: "info", module: "check", message: `Rule "${rule.id}" lỗi khi chạy.`, suggestion: "..." }
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/check/rules/evidence-gaps.ts` | MODIFY | ~+25 (detection) |
| `src/modules/check/rules/structure.ts` | MODIFY | ~+15 (regex + empty via AST) |
| `src/modules/check/run-checker.ts` | MODIFY | ~+6 (error issue) |
| `src/modules/check/rules/evidence-gaps.test.ts` · `structure.test.ts` · `run-checker.test.ts` | MODIFY/NEW | ~+70 |

> **Import boundary** không đổi: rules đọc `mdast`/`@/types`/`utils`. **Offline tuyệt đối** — không `fetch`, không kiểm link sống.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Host allowlist deploy/demo thiếu sót → vẫn miss | Thấp/TB | Đa điều kiện (key OR evidence kind OR host OR keyword); ghi known-limitation, mở rộng host sau. |
| Siết regex bỏ sót dạng số mục hợp lệ khác | Thấp | Test các dạng `1.`/`1.1`/`1.1.1`/`Chương N` + non-trigger năm/số trần. |
| `empty-section` qua AST đổi kết quả vài case cũ | Thấp | Test: chỉ-heading → flag; có ảnh/bảng/code → không; cập nhật test cũ nếu cần. |
| Issue `checker-rule-error` gây nhiễu | Thấp | Severity `info` (−1), chỉ xuất khi thực sự có rule throw (bình thường không có). |

## 6. Verification Plan
- `missing-project-links`: software template + evidence `{kind:"deploy", url:"https://x.vercel.app"}` → **0** issue; không có link nào → 1 `error`.
- `hardcoded-heading-number`: `"2024 Tổng kết"` → 0; `"1. Mở đầu"`/`"1.1 Kiến trúc"`/`"Chương 1"` → 1 warning mỗi cái.
- `empty-section`: section markdown chỉ `"# Tiêu đề"` → 1 warning; `"# T\n![a](asset:x)"` → 0.
- rule throw (mock rule trong test) → kết quả chứa `checker-rule-error` (info), `issues` khác vẫn đủ, không crash.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `fix(check): robust project-link detection + tighter hardcoded-heading regex`; (2) `fix(check): empty-section via AST + surface rule errors`; +1 docs commit (contract này).
