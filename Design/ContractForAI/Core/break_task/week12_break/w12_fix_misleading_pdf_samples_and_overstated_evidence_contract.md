# Contract For AI — W12 Break: PDF Samples Là HTML Đổi Đuôi, Claim Parity Chưa Kiểm & Build Log Viết Lại

> **Lane:** Core / break_task / week12_break.
> **Branch:** `feature/W12-beta-readiness` (hoặc `fix/w12-evidence-fidelity`).
> **Type:** Bug fix / evidence-fidelity — review findings **#1** (Critical, bằng chứng gây hiểu nhầm), **#2** (High, claim parity vượt thực tế), **#3** (Medium, gate log không phải raw) — W12 code review (session 2026-06-25).
> **Builds on:** Day 1 (`e2e_scenario.md`), Day 2 (`multi-template-validation.test.ts`, `export_validation.md`, `samples/`), Day 5 (`README.md`, `W12_Beta_Acceptance_Report.md`, `build_output.txt`), exporter W4–W7 (`exportHtml`/`exportDocx`/`exportPdfViaBrowserPrint`/`buildPrintableHtml`).
> **Sources:** W12 code review (session 2026-06-25), `Design/ContractForAI/Core/month3/W12/w12b_export_validation_contract.md` (C128 "đối chiếu caption/page-break/cover parity"), `w12e_public_demo_beta_acceptance_contract.md` (C134/C135 evidence + `build_output.txt`), `Design/TaskBrief/Core/month3/w12.md` (Locked #2 "Playwright deferred → verify thủ công", Locked #4 "export 3 format parity"), `Design/Modules/Other/TechnicalStack.md §7` (E2E/PDF binary deferred).

---

## 1. Micro-task Target

Vá ba điểm **bằng chứng beta lệch thực tế** của W12 đã ship — đúng mẫu false-done đã chặn ở W11 (report khẳng định điều app không làm). (a) **"PDF samples" thực ra là HTML đổi đuôi `.pdf`** — test ghi `buildPrintableHtml(...)` (chuỗi HTML) ra file `*.pdf`, `file samples/*.pdf` → cả 3 là *HTML document, UTF-8*; nhưng `README.md` + `W12_Beta_Acceptance_Report.md` trình bày chúng như **"PDF đã xuất bản"**, gây hiểu nhầm rằng hệ thống sinh PDF nhị phân (stack **không** có — PDF = browser-print, Playwright/PDF binary **deferred** `TechnicalStack §7`). (b) **`export_validation.md` khẳng định cover/page-break/caption parity "Đạt chuẩn"** nhưng test tự động chỉ assert `toContain(title)` + DOCX JSON chứa title — **không** assert ngắt trang, đánh số caption, hay khối trang bìa; PASS đang vượt bằng chứng (C128 yêu cầu đối chiếu 3 parity này). (c) **`build_output.txt` là prose viết lại, không phải output gate thật** — dòng "Typecheck completed successfully. 0 errors." không phải output của `tsc` (tsc im lặng khi pass); gate **thực sự xanh** (review đã verify typecheck + lint + test export 9/9), nhưng artifact acceptance phải dán **raw** chứ không tả lại. Ba điểm này khiến evidence beta của W12 thành **false-done** dù code lõi đạt.

- **#1 `samples/*.pdf` là HTML đổi đuôi `.pdf` (bằng chứng gây hiểu nhầm).** [multi-template-validation.test.ts:59](src/modules/export/multi-template-validation.test.ts) `fs.writeFileSync(path.join(samplesDir, ` ${template.id}.pdf ` ), printableHtml)` — `printableHtml = buildPrintableHtml(input)` là **chuỗi HTML**. Kiểm chứng: `file Design/Reports/Month3/W12/samples/*.pdf` → `HTML document, Unicode text, UTF-8 text` cả 3; `head -1 samples/software-project.pdf` → `<!DOCTYPE html>`. Nhưng [README.md:40-52](Design/Reports/Month3/W12/README.md) liệt kê "**PDF**: `samples/*.pdf`" như tệp PDF mẫu và [W12_Beta_Acceptance_Report.md:23](Design/Reports/Month3/W12/W12_Beta_Acceptance_Report.md) mô tả "PDF: Hỗ trợ in trực tiếp từ trình duyệt … phân trang hoàn hảo" cạnh danh sách sample → người đọc hiểu nhầm có PDF nhị phân. Vì stack **không** sinh PDF binary (Locked #2 + `TechnicalStack §7` — PDF chỉ qua browser-print, Playwright deferred), cách trung thực là **đổi đuôi + relabel**: ghi file là `*.print.html` (HTML in được) và nói rõ trong README/Acceptance "PDF = in qua trình duyệt từ HTML này", **không** gọi nó là tệp PDF.
- **#2 `export_validation.md` claim parity mà test không kiểm (PASS vượt bằng chứng).** [export_validation.md:11-13](Design/Reports/Month3/W12/export_validation.md) khẳng định **Cover Page Parity** / **Page-Break Parity** / **Caption Numbering Parity** "Đạt chuẩn nhất quán" cho cả 3 template, [dòng 29-30](Design/Reports/Month3/W12/export_validation.md) "không phát hiện lỗi lệch". Nhưng evidence tự động là [multi-template-validation.test.ts](src/modules/export/multi-template-validation.test.ts) **chỉ** assert: HTML `toContain("<!DOCTYPE html>")` + `toContain(title)` + `toContain(sortedSections[0].title)` ([dòng 40-50](src/modules/export/multi-template-validation.test.ts)); DOCX `docJson` chứa section[0].title ([dòng 100-107](src/modules/export/multi-template-validation.test.ts)); PDF chỉ check `blob.type === "text/html"`. **Không** có assert nào về page-break (marker ngắt trang sau bìa/mục lục), caption numbering (vd "Hình 1.1"/"Bảng 2.1"), hay khối cover. C128 yêu cầu **đối chiếu** 3 parity này → report đang khẳng định kết quả mà bằng chứng không chứng minh. Cần: hoặc **thêm assertion thật** (substring marker page-break + 1 caption đánh số + 1 trường cover) vào test, hoặc nếu kiểm **thủ công** thì `export_validation.md` phải ghi rõ "kiểm thủ công, đối chiếu mở file `samples/*` ngày …" + dẫn artifact, không để PASS treo không nguồn.
- **#3 `build_output.txt` là log viết lại, không phải raw gate (false-evidence nhẹ).** [build_output.txt:9](Design/Reports/Month3/W12/build_output.txt) "Typecheck completed successfully. 0 errors." + [dòng 17](Design/Reports/Month3/W12/build_output.txt) "Lint completed successfully. 0 errors, 0 warnings." là câu tự soạn — `tsc --noEmit`/`eslint .` khi pass **không in** dòng nào. Gate **thật sự xanh** (review chạy lại `npm run typecheck` + `npm run lint` = sạch, `vitest run multi-template-validation.test.ts` = 9/9), nên #3 không sai bản chất — nhưng `w12e` C135 gọi đây là artifact "Final build + lint + typecheck + Vitest gate", evidence acceptance phải là **output captured thật** (kể cả phần im lặng), không phải tóm tắt. Cần dán lại output gốc của 4 gate (typecheck/lint/test/build) đúng như terminal in ra.

> 🔒 **Báo cáo deterministic bất biến (w12.md Locked #4).** KHÔNG đụng `--rs-report-*`/pipeline export hay đổi nội dung báo cáo. #1/#3 chỉ sửa **đuôi file + label trong docs + log**; #2 chỉ **thêm assertion đọc** hoặc làm rõ nguồn kiểm — không đổi output exporter.
> 🔒 **PDF binary vẫn deferred (Locked #2, `TechnicalStack §7`).** KHÔNG cài Playwright/lib PDF để "sinh PDF thật". Cách đúng là gọi đúng tên artifact (HTML in được), không phải thêm dependency.
> 🔒 **Không đổi shape canonical (CanonicalTypes).** Không đụng `ReportProjectBundle`/`ExportJob`/template shape; chỉ wiring assertion + sửa docs/log.

## 2. Scope

### In scope
- **#1 Đổi đuôi + relabel PDF sample:**
  - [multi-template-validation.test.ts:59](src/modules/export/multi-template-validation.test.ts) (MODIFY): ghi printable HTML ra `${template.id}.print.html` thay vì `.pdf`; xoá 3 file `samples/*.pdf` cũ (HTML đội lốt).
  - [README.md:40-52](Design/Reports/Month3/W12/README.md) (MODIFY): đổi mục "PDF" → "PDF (in qua trình duyệt từ `*.print.html`)"; ghi rõ stack không xuất PDF nhị phân, người dùng dùng Ctrl+P từ bản in HTML.
  - [W12_Beta_Acceptance_Report.md:17-24](Design/Reports/Month3/W12/W12_Beta_Acceptance_Report.md) (MODIFY): giữ Tiêu chí 2 PASS nhưng làm rõ "PDF = browser-print" khớp Success Criteria gốc (`"browser-print PDF"`), không ngụ ý PDF binary.
- **#2 Khớp claim parity với bằng chứng** — chọn 1, ghi rõ trong report:
  - **(A) Thêm assertion thật** vào [multi-template-validation.test.ts](src/modules/export/multi-template-validation.test.ts) (MODIFY): với HTML output, assert có marker page-break (vd class/style ngắt trang exporter dùng — tra trong `buildPrintableHtml`/`exportHtml`), có ≥1 caption đánh số theo cấu hình, và khối cover chứa 1 trường metadata (vd tên trường/giảng viên). Giữ deterministic, chỉ đọc-assert.
  - **(B)** nếu parity kiểm **thủ công**: [export_validation.md](Design/Reports/Month3/W12/export_validation.md) (MODIFY) đổi 3 dòng claim sang "kiểm thủ công ngày 2026-06-25 bằng mở `samples/*.html` + `*.print.html` + `*.docx`, đối chiếu …" + nêu cụ thể quan sát; bỏ ngụ ý "test tự động đã chứng minh parity".
  - Khuyến nghị **(A)** vì rẻ và lặp lại được; (B) chấp nhận nếu marker khó assert.
- **#3 Dán raw gate log:** [build_output.txt](Design/Reports/Month3/W12/build_output.txt) (MODIFY): chạy lại `npm run typecheck`, `npm run lint`, `npm test` (hoặc `vitest run`), `npm run build`; dán **nguyên** stdout/stderr từng lệnh (typecheck/lint pass = phần trống vẫn dán kèm dòng lệnh + exit 0 ghi chú); số test/route khớp lần chạy.

### Out of scope
- ❌ Cài Playwright / lib sinh PDF nhị phân (deferred → W15+; Locked #2).
- ❌ Đổi pipeline/`--rs-report-*`/thuật toán exporter (Locked #4) — chỉ sửa nơi ghi file + label + assertion đọc.
- ❌ Tách side-effect ghi file khỏi test, gỡ state component chưa wire, inline-style drift (→ contract polish `w12_polish_*`).
- ❌ Đổi shape `ExportJob`/`ReportProjectBundle`/template (CanonicalTypes).

## 3. Checklist
- [ ] Không còn `samples/*.pdf` là HTML; bản in HTML đặt tên `*.print.html`; `file samples/*.pdf` → không tồn tại / hoặc là PDF thật.
- [ ] README + Acceptance Report gọi đúng "PDF = in qua trình duyệt", không ngụ ý PDF nhị phân; vẫn khớp Success Criteria `"browser-print PDF"`.
- [ ] Claim cover/page-break/caption parity có **bằng chứng khớp**: hoặc assertion test thật, hoặc ghi rõ "kiểm thủ công + nguồn" trong `export_validation.md`.
- [ ] `build_output.txt` là **raw output** 4 gate đúng lần chạy (không câu tóm tắt thay output).
- [ ] 4 gate xanh thật; số test khớp log; không đụng pipeline export.

## 4. Expected Interfaces / Files

> Pipeline export + shape giữ nguyên. Chỉ đổi tên file artifact, label trong docs, thêm assertion đọc, dán raw log.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/multi-template-validation.test.ts` | MODIFY | ~±20 (đổi đuôi `.print.html` + assertion parity #2A) |
| `Design/Reports/Month3/W12/samples/*.pdf` | DELETE → `*.print.html` | đổi tên 3 file |
| `Design/Reports/Month3/W12/README.md` | MODIFY | ~±10 (relabel PDF) |
| `Design/Reports/Month3/W12/W12_Beta_Acceptance_Report.md` | MODIFY | ~±4 (làm rõ browser-print) |
| `Design/Reports/Month3/W12/export_validation.md` | MODIFY | ~±8 (#2: nguồn parity) |
| `Design/Reports/Month3/W12/build_output.txt` | MODIFY | raw log 4 gate |

> **Import boundary:** test import `@/modules/export` + `@/modules/write`. Không `fetch`, không lib mới.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Đổi đuôi làm "mất" sample người chấm mong thấy `.pdf` | TB | Giữ đủ HTML/DOCX + bản in `*.print.html`; README nói rõ cách in PDF; khớp đúng Success Criteria "browser-print PDF". |
| Assertion parity #2A giòn (marker đổi theo template) | TB | Assert substring ổn định (DOCTYPE/cover field/caption prefix theo cấu hình), không theo class dễ đổi; nếu khó → dùng (B) ghi kiểm thủ công. |
| Sửa report lại lệch tiếp | Thấp | Lấy số liệu/đuôi file trực tiếp từ lần chạy test + `build_output.txt` cùng phiên. |
| Đụng nhầm pipeline export khi thêm assertion | Thấp | Chỉ **đọc** output (`exportHtml`/`buildPrintableHtml`) rồi `expect`; không sửa hàm export (Locked #4). |

## 6. Verification Plan
- `ls Design/Reports/Month3/W12/samples/` → có `*.print.html`, không còn `*.pdf` HTML-đội-lốt; `file samples/*` xác nhận html/docx đúng loại.
- `grep -in "\.pdf" Design/Reports/Month3/W12/README.md Design/Reports/Month3/W12/W12_Beta_Acceptance_Report.md` → mọi nhắc PDF đều kèm "in qua trình duyệt", không ngụ ý binary.
- `npx vitest run src/modules/export/multi-template-validation.test.ts` → xanh; nếu #2A: có assert page-break/caption/cover (đọc test thấy `expect(...).toContain(`).
- `export_validation.md`: claim parity có nguồn (assertion test **hoặc** dòng "kiểm thủ công + ngày + thao tác").
- `npm run typecheck && npm run lint && npx vitest run && npm run build` → dán **nguyên** output vào `build_output.txt`; đối chiếu số test/route khớp.

## 7. Status

`READY_TO_IMPLEMENT`

> ✅ Approved in review pass. Thực hiện phối hợp `w12_polish_*` (đụng chung `multi-template-validation.test.ts`). Đề xuất commit: (1) `fix(export): write printable HTML as *.print.html, drop HTML-as-pdf samples`; (2) `test(export): assert cover/page-break/caption parity in multi-template validation`; (3) `docs(w12): relabel PDF as browser-print, source parity claims, paste real gate output`.
