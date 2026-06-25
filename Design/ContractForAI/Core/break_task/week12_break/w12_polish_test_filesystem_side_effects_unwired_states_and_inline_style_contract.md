# Contract For AI — W12 Break: Test Ghi Artifact Vào Docs, Loading/Error State Chưa Wire & Inline-Style Drift

> **Lane:** Core / break_task / week12_break.
> **Branch:** `feature/W12-beta-readiness` (hoặc `polish/w12-test-sideeffect-states`).
> **Type:** Maintainability / test-fidelity — review findings **S1** (Medium, test có side-effect ghi repo), **S2** (Low, state baseline chưa wire), **S3** (Low, inline-style drift tái phạm W11 S2) — W12 code review (session 2026-06-25).
> **Builds on:** Day 2 (`multi-template-validation.test.ts`), Day 3 (`src/components/states/*`, `CheckerPanel`/`ExportPanel`/`PresentPanel`/`PreviewPane`), `globals.css`.
> **Sources:** W12 code review (session 2026-06-25), `Design/ContractForAI/Core/month3/W12/w12c_ui_states_polish_contract.md` (C130 baseline 4 state / C131 "panel dùng shared states nhất quán loading/empty/error/success"), `Design/TaskBrief/Core/month3/w12.md` (Reconcile "shared states là nền W14"), `Design/ContractForAI/Core/break_task/week11_break/w11_polish_*` (S2 — "CSS chỉ `var(--rs-*)` trong `globals.css`, không inline `style={{}}`"), `Design/Modules/Other/DesignSystem_Tokens.md`.

---

## 1. Micro-task Target

Dọn ba điểm nợ **không chặn merge** của W12: (a) `multi-template-validation.test.ts` **ghi tệp mẫu vào thư mục docs đã track** (`Design/Reports/Month3/W12/samples/`) qua `fs.writeFileSync` như side-effect khi chạy test — test không thuần, chạy suite = **đột biến evidence đã commit** (review vô tình regenerate khi verify), và CI sẽ ghi đè/đổi mtime sample mỗi lần; (b) `LoadingState` + `ErrorState` được **tạo (C130) nhưng không panel nào wire** (C131 nói "loading/empty/error/success nhất quán") — chỉ `EmptyState`/`SuccessState` được dùng, nên 2 nhánh state chưa được app chứng minh chạy (chấp nhận làm baseline W14 theo reconcile, nhưng phải **nói rõ**, không để trôi như đã wire); (c) panel polish dùng **inline `style={{ marginTop: "var(--rs-space-4)" }}`** thay vì class `ws-*` — đúng inline-style drift mà `w11_polish_*` S2 đã chặn (token có nhưng đặt sai chỗ, tách khỏi `globals.css`). Mục tiêu: test thuần (sinh sample tách script), wire hoặc khai báo trung thực 2 state còn lại, đưa spacing về class token — **không đổi hành vi** đường E2E, **không đổi** shape/exporter.

- **S1 Test ghi artifact vào docs (side-effect, test không thuần).** [multi-template-validation.test.ts:26-29](src/modules/export/multi-template-validation.test.ts) tạo `samplesDir` trong `Design/Reports/...` + `mkdirSync`; [dòng 44](src/modules/export/multi-template-validation.test.ts) `fs.writeFileSync(... ${id}.html , htmlText)`, [dòng 59](src/modules/export/multi-template-validation.test.ts) ghi `.pdf` (xem `w12_fix_*` #1), [dòng 98](src/modules/export/multi-template-validation.test.ts) ghi `.docx`. Hệ quả: (i) chạy `vitest` **mutate** tệp evidence đã commit → diff giả/đổi mtime mỗi lần CI; (ii) test phụ thuộc ghi đĩa trong thư mục repo (mong manh khi đường dẫn/CWD khác); (iii) lẫn lộn "test" với "generator evidence". Cần **tách**: test chỉ `expect(...)` thuần (assert HTML/DOCX content), còn sinh sample chuyển sang **script riêng** (vd `scripts/gen-w12-samples.ts` + npm script `gen:samples`) hoặc ghi vào thư mục **gitignored** (`.tmp/`) nếu test cần file tạm. Sau tách, `grep "writeFileSync" multi-template-validation.test.ts` = rỗng.
- **S2 `LoadingState` + `ErrorState` tạo nhưng chưa wire (C131 nói nhất quán 4 state).** Kiểm chứng: `grep -rn "LoadingState\|ErrorState" src --include=*.tsx | grep -v "components/states/"` → **rỗng** (chỉ định nghĩa [LoadingState.tsx](src/components/states/LoadingState.tsx)/[ErrorState.tsx](src/components/states/ErrorState.tsx), không nơi dùng); trong khi `EmptyState`/`SuccessState` đã wire ở [CheckerPanel.tsx](src/modules/check/CheckerPanel.tsx)/[ExportPanel.tsx](src/modules/export/ExportPanel.tsx)/[PresentPanel.tsx](src/modules/present/PresentPanel.tsx)/[PreviewPane.tsx](src/components/PreviewPane.tsx). C131 ghi panel dùng shared states "nhất quán (loading/empty/error/success)" — hiện 2/4. Reconcile cho phép baseline để W14 nâng cấp, nhưng trạng thái hiện tại là **dead baseline không khai báo**. Cần chọn 1: **(A) wire tối thiểu** — `ExportPanel` job `status==="error"` render `ErrorState` (có sẵn nhánh `ws-export-job-error`), và nơi có async pending render `LoadingState`; hoặc **(B)** nếu chủ ý để baseline thì ghi rõ trong [w12c contract / `a11y_checklist.md` hoặc README] "Loading/Error là baseline C130, panel adoption ở W14" để không hiểu nhầm đã wire. Khuyến nghị (A) cho `ExportPanel` error (rẻ, có nhánh sẵn), (B) cho Loading nếu chưa có điểm async thật.
- **S3 Inline `style={{}}` thay vì class `ws-*` (tái phạm W11 polish S2).** [CheckerPanel.tsx:34,48](src/modules/check/CheckerPanel.tsx), [ExportPanel.tsx:131](src/modules/export/ExportPanel.tsx), [PresentPanel.tsx:93,291](src/modules/present/PresentPanel.tsx), [PreviewPane.tsx:316](src/components/PreviewPane.tsx) bọc state component bằng `<div style={{ marginTop: "var(--rs-space-4)" }}>` (PreviewPane thêm `padding`). Token đúng nhưng đặt **inline trong TSX** — đúng drift `w11_polish_*` S2 đã thống nhất đưa về `globals.css`. Cần: thêm 1 class tiện ích (vd `ws-state-block` với `margin-top: var(--rs-space-4)`) trong `globals.css` rồi thay các `style={{}}` bằng `className`; hoặc cho `EmptyState`/`SuccessState`/`ErrorState` nhận prop `className`/spacing để caller không cần wrapper inline. Sau đó `grep "style={{" src/modules/{check,export,present}/*.tsx src/components/PreviewPane.tsx` cho khối state = rỗng.

> 🔒 **Không đổi hành vi đường E2E (w12 Locked #1).** S1 chỉ đổi **nơi sinh sample** (test→script/tmp), assert giữ; S2 chỉ **wire/khai báo** state có sẵn (không đổi logic export/checker); S3 chỉ **đổi nơi đặt style** (inline→class, vẫn token). Đường write/check/export/present cho input hợp lệ **không đổi**.
> 🔒 **CSS chỉ `var(--rs-*)` (W11 S2 / W10 #1).** Class mới trong `globals.css` chỉ dùng token; không hardcode px/màu (px chỉ cho border-width nếu cần, ghi rõ).
> 🔒 **Không đổi shape state component (C130 baseline cho W14).** Giữ props `EmptyState`/`LoadingState`/`ErrorState`/`SuccessState` để W14 nâng cấp; chỉ thêm (tuỳ chọn) prop `className` optional, không phá chữ ký cũ.

## 2. Scope

### In scope
- **S1** `src/modules/export/multi-template-validation.test.ts` (MODIFY): bỏ `mkdirSync`/`writeFileSync` ghi vào `Design/Reports/...`; giữ assert thuần (HTML/PDF-html/DOCX content). Tách sinh sample sang **`scripts/gen-w12-samples.ts` (NEW)** chạy 3 exporter + ghi `samples/*` (đồng bộ `*.print.html` của `w12_fix_*`), thêm npm script `"gen:samples"`. (Nếu giữ ghi file trong test vì lý do coverage, đổi đích sang `.tmp/` đã `.gitignore` + cleanup `afterAll` — nhưng **không** ghi vào `Design/`.)
- **S2** chọn theo finding: **(A)** [ExportPanel.tsx](src/modules/export/ExportPanel.tsx) (MODIFY) render `ErrorState` cho job `status==="error"` (hoặc khối lỗi export); wire `LoadingState` ở điểm async pending nếu có. **(B)** nếu để baseline: ghi 1 dòng trong [export_validation.md](Design/Reports/Month3/W12/export_validation.md) hoặc README "Loading/Error = baseline C130, adoption W14". Không để dead-baseline im lặng.
- **S3** `src/app/globals.css` (MODIFY): thêm class util `ws-state-block` (`margin-top: var(--rs-space-4)`) + `ws-preview-container-empty` padding token nếu chưa có; thay `style={{}}` ở [CheckerPanel.tsx](src/modules/check/CheckerPanel.tsx)/[ExportPanel.tsx](src/modules/export/ExportPanel.tsx)/[PresentPanel.tsx](src/modules/present/PresentPanel.tsx)/[PreviewPane.tsx](src/components/PreviewPane.tsx) bằng `className`. (Tuỳ chọn: thêm prop `className?` optional cho state component để bỏ luôn wrapper.)
- **Tests:** nếu thêm `scripts/gen-w12-samples.ts`, không cần test cho nó (script tiện ích); giữ `multi-template-validation.test.ts` xanh sau khi gỡ ghi file. Nếu wire `ErrorState` (S2A) + có test ExportPanel, thêm ca render error.

### Out of scope
- ❌ Sửa label PDF / claim parity / raw build log (→ contract `w12_fix_*`).
- ❌ Nâng cấp state component thành primitive mới (đó là **W14**, reconcile — chỉ wire/khai báo baseline).
- ❌ Refactor `PreviewPane.tsx`/`PresentPanel.tsx` xuống ≤200 dòng (nợ cũ, để W14 khi thay primitive — xem Risk).
- ❌ Đổi shape/exporter/thuật toán; cài lib mới.

## 3. Checklist
- [ ] `multi-template-validation.test.ts` **không** còn `writeFileSync`/`mkdirSync` ghi vào `Design/`; assert giữ; suite xanh không mutate evidence.
- [ ] Sinh sample qua `scripts/gen-w12-samples.ts` + npm `gen:samples` (hoặc ghi `.tmp/` gitignored + cleanup).
- [ ] `LoadingState`/`ErrorState` **được wire** (vd ExportPanel error) **hoặc** khai báo rõ "baseline W14" trong docs — không dead-baseline im lặng.
- [ ] Khối state không còn `style={{}}` inline; dùng class `ws-*` token-only trong `globals.css`.
- [ ] ≤200 dòng/file mới (`gen-w12-samples.ts`, state component); 4 gate xanh; `build_output.txt` thật (đồng bộ `w12_fix_*`).

## 4. Expected Interfaces / Files

> Hành vi E2E + shape state giữ nguyên. Chỉ tách side-effect, wire/khai báo state, đưa style về `globals.css`.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/multi-template-validation.test.ts` | MODIFY | ~−18 (gỡ ghi file, giữ assert) |
| `scripts/gen-w12-samples.ts` | NEW | ~≤90 (3 exporter → `samples/*`) |
| `package.json` | MODIFY | ~+1 (`gen:samples`) |
| `.gitignore` | MODIFY (nếu dùng `.tmp/`) | ~+1 |
| `src/modules/export/ExportPanel.tsx` | MODIFY (S2A) | ~+6 (ErrorState cho job lỗi) |
| `src/app/globals.css` | MODIFY | ~+6 (`ws-state-block` + preview padding token) |
| `src/modules/check/CheckerPanel.tsx`, `present/PresentPanel.tsx`, `components/PreviewPane.tsx` | MODIFY | ~±3 mỗi file (inline→class) |
| `Design/Reports/Month3/W12/export_validation.md` hoặc README | MODIFY (S2B nếu chọn) | ~+1 (khai báo baseline) |

> **Import boundary:** script import `@/modules/export` + `@/modules/write` + `node:fs`; panel import `@/components/states`. Không `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Gỡ ghi file làm test mất "coverage" pack DOCX | Thấp | Vẫn `packDocx` + assert blob trong test (không cần ghi đĩa); pack được kiểm ở assert, không ở file output. |
| Script sinh sample lệch với exporter app | Thấp | Script gọi đúng `exportHtml`/`buildPrintableHtml`/`exportDocx`+`packDocx` như test cũ; output đối chiếu preview. |
| Wire `ErrorState` đổi behavior ExportPanel | TB | Chỉ thêm nhánh render khi `status==="error"` (đã có class lỗi); input hợp lệ không đổi; thêm test ca lỗi. |
| Inline→class lệch spacing | Thấp | `ws-state-block` map đúng `--rs-space-4` đang dùng; preview xác nhận khoảng cách giữ nguyên. |
| `PreviewPane`/`PresentPanel` vẫn >200 dòng | Thấp (nợ cũ) | Ghi nhận để W14 refactor khi thay primitive; W12 break không nới thêm. |

## 6. Verification Plan
- `grep -c "writeFileSync\|mkdirSync" src/modules/export/multi-template-validation.test.ts` → **0**; `npx vitest run src/modules/export/multi-template-validation.test.ts` xanh, `git status Design/Reports/Month3/W12/samples/` **sạch** sau khi chạy test (không mutate).
- `npm run gen:samples` → sinh `samples/*` đúng (html/print.html/docx); chỉ chạy khi chủ động, không trong test.
- `grep -rn "LoadingState\|ErrorState" src --include=*.tsx | grep -v "components/states/"` → **> 0** (đã wire) **hoặc** docs có dòng "baseline W14".
- `grep -n "style={{" src/modules/check/CheckerPanel.tsx src/modules/export/ExportPanel.tsx src/modules/present/PresentPanel.tsx src/components/PreviewPane.tsx` cho khối state → **0**; `grep -c "\.ws-state-block" src/app/globals.css` → > 0; `grep -E "#[0-9a-f]{3,6}|rgb\(" class mới` = rỗng.
- preview: empty/success/error render khoảng cách giống trước, không lỗi console.
- lint/typecheck/test/build (thật) xanh; dán vào `build_output.txt` (đồng bộ `w12_fix_*`).

## 7. Status

`READY_TO_IMPLEMENT`

> ✅ Approved in review pass. Thực hiện **sau** hoặc phối hợp `w12_fix_*` (đụng chung `multi-template-validation.test.ts`/`samples/`/`globals.css`/report). Đề xuất commit: (1) `test(export): make multi-template validation pure; move sample gen to scripts/gen-w12-samples`; (2) `feat(states): wire ErrorState into export job failures (+ declare loading baseline)`; (3) `style(states): move state-block spacing to globals.css tokens`.
