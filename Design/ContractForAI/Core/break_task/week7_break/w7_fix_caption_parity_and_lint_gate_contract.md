# Contract For AI — W7 Break: Fix Caption Parity (Preview↔Export) & Restore the Lint Gate

> **Lane:** Core / break_task / week7_break.
> **Branch:** `feature/W7-format-hardening` (hoặc `fix/w7-caption-parity`).
> **Type:** Bug fix / correctness + QA integrity — review findings **#1**, **#2**, **#3**, **#4**, **#7** (W7 code review).
> **Builds on:** Group A (`caption-registry.ts`, `captions.ts`), Group B (`generate-lof-lot.ts`, `PreviewPane.tsx`), Group E (`docx-layout-checklist.ts`, `mdast-to-docx.ts`, `W7_QA_Report.md`, `build_output.txt`).
> **Sources:** W7 code review (session 2026-06-24), `Design/ContractForAI/Core/month2/W7/w7a_*`, `w7b_*`, `w7e_*`, `Design/TaskBrief/Core/month2/w7.md` (Cross-cutting "no `any`" + "4 gates xanh", Locked #1), `Design/Modules/Other/CanonicalTypes.md §3`.

---

## 1. Micro-task Target

Vá **bất nhất số caption giữa preview và export** (vi phạm Locked #1 "preview = PDF = DOCX") và **khôi phục gate lint cho thật xanh** sau khi loại bỏ `any` — đồng thời sửa `build_output.txt` để bằng chứng QA khớp thực tế. Đây là nhóm **blocker** của W7: code chạy được (typecheck + 243 test xanh, build compile) nhưng gate `lint` đang **đỏ** và bằng chứng QA đang báo sai.

- **#1 Gate lint đỏ nhưng QA báo xanh.** Chạy `npm run lint` (`eslint .`) → **7 errors + 3 warnings**, nhưng [build_output.txt:1-4](Design/Reports/Month2/W7/build_output.txt) ghi tay `(Lint completed with 0 errors and 0 warnings)`. Dòng này **không** phải output thật của eslint. `next build` không bắt được vì runner build không áp rule flat-config tùy biến (`no-explicit-any`); chỉ script `lint` mới áp. → DoD "4 gates xanh" (`w7e` §3) hiện **sai** ở gate lint.
- **#2 `any` trong `docx-layout-checklist.ts` (6×).** [docx-layout-checklist.ts:39,67,72,76,115,139](src/modules/export/docx-layout-checklist.ts) — `node: any`, `c: any`, `(node.data as any)`. Vi phạm Cross-cutting "no `any` (use `unknown`)" của `w7.md` và rule eslint `@typescript-eslint/no-explicit-any: error`.
- **#3 `any` trong `mdast-to-docx.ts`.** [mdast-to-docx.ts:205](src/modules/export/mdast-to-docx.ts) — `(node.data as any)?.hProperties` (đọc className caption). Cùng lỗi `no-explicit-any`.
- **#4 Số caption preview lệch export với dự án nhiều section (Locked #1).** [PreviewPane.tsx:347](src/components/PreviewPane.tsx) gọi `normalizeCaptions([{ id: activeSectionId, ast }], captionRegistry, captionState)` với `captionState = { figIdx: 0, tableIdx: 0 }` ([PreviewPane.tsx:319](src/components/PreviewPane.tsx)) nhưng `captionRegistry` build từ **tất cả** section ([PreviewPane.tsx:249](src/components/PreviewPane.tsx)). Preview chỉ render section active → hình đầu của section thứ 2 nhận `figures[0]` (số của section 1), trong khi `prepare-export` đánh số xuyên suốt đúng. ⇒ preview ≠ export cho mọi section không phải section đầu.
- **#7 Lint warnings — import/biến thừa.** [prepare-export.ts:1](src/modules/export/prepare-export.ts) `CaptionEntry`, [prepare-export.ts:14](src/modules/export/prepare-export.ts) `getFlatText`, [prepare-export.ts:99](src/modules/export/prepare-export.ts) biến `sec` — `no-unused-vars`.

> 🔒 **Một nguồn số (Locked #1).** Body, LoF/LoT, PDF, DOCX, **và preview** đọc cùng `CaptionEntry[]`. Fix #4 là làm preview *tiêu thụ đúng lát registry của section active*, **không** đánh số lại — registry vẫn là nguồn duy nhất.
> 🔒 **Không đổi shape canonical.** `CaptionEntry`/`FormatPreset`/`ReportIssue` giữ nguyên (`CanonicalTypes §3`). Đây là fix logic tiêu thụ + kiểu nội bộ, không sửa type công khai.
> 🔒 **Không nới lỏng rule lint.** Cấm tắt `no-explicit-any` hay thêm `eslint-disable`/`@ts-expect-error` để né. Phải thay `any` bằng kiểu mdast thật.

## 2. Scope

### In scope
- **#2** `src/modules/export/docx-layout-checklist.ts` (MODIFY): thay mọi `node: any`/`c: any`/`as any` bằng kiểu mdast thật. Các hàm `walkHeadings`/`walkCaptions`/`walkTables`/`walkH1PageBreaks` nhận `node: MdastContent | MdastRoot` (hoặc union `Nodes` của mdast) và narrow bằng `node.type` + `"children" in node` trước khi đệ quy; đọc caption className/id qua kiểu đã định nghĩa thay `(node.data as any)`. Không đổi public API (`verifyDocxLayout`/`DocxLayoutCheck` giữ nguyên).
- **#3** `src/modules/export/mdast-to-docx.ts` (MODIFY): thay `(node.data as any)?.hProperties` bằng truy cập có kiểu (tái dùng cùng cách đọc `hProperties.className` như các nơi khác trong file, hoặc khai một type hẹp cục bộ `{ hProperties?: { className?: string } }`). Không đổi hành vi mapping.
- **#4** `src/components/PreviewPane.tsx` (MODIFY): truyền vào `normalizeCaptions` **lát registry của riêng section active** — `captionRegistry.filter((e) => e.sectionId === (activeSectionId || "default"))` — và reset `captionState` về `{ figIdx: 0, tableIdx: 0 }` cho lát đó. Nhãn (`label`) trong entry đã mang **số toàn cục đúng**, nên preview sẽ hiển thị đúng "Hình X.Y"/"Bảng X.Y" khớp export. (Phương án thay thế nếu muốn giữ registry đầy đủ: tính offset `figIdx/tableIdx` = số figure/table của các section đứng **trước** section active; chọn **một** hướng, ghi rõ.) Không đổi LoF/LoT (đã đọc registry đầy đủ — đúng).
- **#7** `src/modules/export/prepare-export.ts` (MODIFY): gỡ import `CaptionEntry`, `getFlatText` không dùng; bỏ biến `sec` thừa trong vòng `for (const { sec, ast } of parsedSections)` (chỉ dùng `ast`).
- **#1** `Design/Reports/Month2/W7/build_output.txt` (MODIFY): chạy lại **thật** `npm run lint && npm run typecheck && npm run test && npm run build`, dán output thực (không annotate tay). `Design/Reports/Month2/W7/W7_QA_Report.md` (MODIFY nếu cần): cập nhật dòng kết luận gate cho khớp.
- **Regression tests**:
  - `src/modules/export/docx-layout-checklist.test.ts` (MODIFY/giữ): vẫn pass sau khi bỏ `any`.
  - `src/components/PreviewPane` hoặc test format mới: dựng 2 section, section 2 có 1 figure → caption preview của figure đó = nhãn toàn cục đúng (vd "Hình 2"/"Hình 1.2"), **khớp** số mà `buildCaptionRegistry`/`prepare-export` sinh ra cho cùng figure. (Nếu khó test React, thêm test thuần cho `normalizeCaptions` với lát registry section-2 → assert nhãn áp đúng.)

### Out of scope
- ❌ Đổi shape `CaptionEntry`/`FormatPreset`/`ReportIssue` (canonical §3/§6).
- ❌ Tắt/nới rule eslint, thêm `eslint-disable`/`@ts-expect-error` (Locked — phải khử `any` thật).
- ❌ Viết lại exporter DOCX/PDF (Locked #5 — chỉ tinh chỉnh kiểu/logic tiêu thụ).
- ❌ Đổi heuristic matching nhãn caption trong checklist (→ contract polish `w7_polish_docx_parity_and_contract_status_contract.md`).
- ❌ Dep mới / network / bật Puppeteer.

## 3. Checklist
- [ ] `docx-layout-checklist.ts` + `mdast-to-docx.ts`: **0** `any`; dùng kiểu mdast; không `eslint-disable`.
- [ ] `prepare-export.ts`: hết import/biến thừa.
- [ ] `PreviewPane`: `normalizeCaptions` nhận đúng lát registry của section active; số caption preview = số export cho mọi section.
- [ ] `npm run lint` → **0 error 0 warning** (chạy thật); typecheck/test/build vẫn xanh.
- [ ] `build_output.txt` chứa output lint **thật** (có dòng eslint thật, không annotate tay).
- [ ] Test khẳng định parity số caption section-không-đầu.
- [ ] ≤200 dòng/file.

## 4. Expected Interfaces / Files

> Không đổi public API. `verifyDocxLayout`/`DocxLayoutCheck`, `normalizeCaptions`, `buildCaptionRegistry` giữ nguyên signature.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/docx-layout-checklist.ts` | MODIFY | ~±15 (kiểu mdast thay `any`) |
| `src/modules/export/mdast-to-docx.ts` | MODIFY | ~±3 (kiểu className) |
| `src/components/PreviewPane.tsx` | MODIFY | ~+2 (filter registry theo sectionId) |
| `src/modules/export/prepare-export.ts` | MODIFY | ~−3 (gỡ thừa) |
| `src/modules/export/docx-layout-checklist.test.ts` | MODIFY | giữ xanh |
| `src/modules/format/captions.test.ts` (hoặc preview test) | MODIFY | ~+20 (parity section-không-đầu) |
| `Design/Reports/Month2/W7/build_output.txt` | MODIFY | output thật |
| `Design/Reports/Month2/W7/W7_QA_Report.md` | MODIFY | đồng bộ kết luận gate |

> **Import boundary:** export/checklist import `@/types` + `docx` + mdast types; PreviewPane import `@/modules/format`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Narrow kiểu mdast làm sai logic walk (bỏ sót node) | TB | Giữ nguyên thuật toán; chỉ thay `any`→union + `"children" in node` guard; test checklist giữ xanh. |
| Filter registry theo `sectionId` lệch khi không có section (`"default"`) | TB | Dùng `activeSectionId || "default"` — đúng id đã set ở `buildCaptionRegistry`; test cả 2 nhánh. |
| `label` mang số đúng nhưng `findImages` đếm lệch trong section | TB | normalizeCaptions vẫn duyệt document-order trong section; lát registry cũng document-order → khớp 1-1. |
| `build_output.txt` lại bị annotate tay | Thấp | Dán nguyên văn output; reviewer kiểm có dòng eslint thật. |

## 6. Verification Plan
- `npm run lint` (thật) → 0 error/0 warning; `npm run typecheck`/`test`/`build` xanh; lưu output thật vào `build_output.txt`.
- Dự án 2 section, section 2 có figure/table → preview hiển thị nhãn = nhãn `prepare-export` cho cùng figure/table (parity).
- `verifyDocxLayout` trên sample đa template vẫn trả pass như trước (không regress).
- grep `: any`/`as any` trong 2 file export → rỗng; grep `eslint-disable` → rỗng.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `fix(export): drop any in docx checklist + mdast-to-docx (restore lint gate)`; (2) `fix(preview): caption numbering parity for non-first sections`; (3) `docs(w7): real build_output + QA gate correction`.
