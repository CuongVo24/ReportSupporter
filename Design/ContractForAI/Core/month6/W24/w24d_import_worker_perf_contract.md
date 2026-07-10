# Contract For AI - W24 Group D: Import Worker & Perf Hardening

> **Lane / Week:** Core / Month 6 / W24 - Day 4 (`Design/TaskBrief/Core/month6/w24.md` `[C202]`-`[C203]`).
> **Branch:** `feature/W24-import-hardening`.
> **Builds on:** W21-W23 converters (pure functions), `PipelineContract.md` §4 (import worker), parse worker hiện có (tiền lệ §3).
> **Depended on by:** Group E (E2E đo perf budget), Phase 5 acceptance.
> **Sources:** `w24.md` Locked #3, `6.Import.md` §6, `w22d` (`onProgress` signature đã chuẩn bị).

---

## 1. Micro-task Target

Chuyển convert nặng vào **import worker** riêng (`import.worker.ts`): DOCX/XLSX/PPTX convert + PDF heuristic chạy off-main-thread, dữ liệu qua Structured Clone, **progress events** per file/stage nối vào dropzone/preview UI. Perf budget: **main thread không block >200ms** với file 50MB; memory hygiene (revoke object URLs, asset cap). **Worker chỉ là host — logic converter không đổi; toàn bộ test W21-23 giữ nguyên xanh.**

> **🔒 Worker là host, không đổi logic (Locked #3).** Converter giữ nguyên signature/pure; worker wrap và relay; test cũ nguyên trạng + thêm integration test worker.
> **⚠️ pdfjs đã có worker riêng của nó** — import worker điều phối, không lồng pdfjs vào import worker (2 tầng worker chỉ khi pdfjs API cho phép; nếu không, PDF extract ở main + heuristic ở worker — quyết định ghi lại trong code comment + QA).
> **⚠️ Mermaid-exception tương tự §3:** bước cần DOM (canvas decode ảnh) ở main thread; chỉ phần pure vào worker.

## 2. Scope

### In scope (`[C202]`/`[C203]`)
- `src/modules/import/import.worker.ts` (**NEW**) + `worker-client.ts` (**NEW**): request/response protocol (id, format, ArrayBuffer transfer), progress events `{fileId, stage, percent}`.
- Split tầng: pure (parse/heuristic/stringify) → worker; DOM-cần (canvas decode, DOMParser nếu worker thiếu — dùng fallback string parse hoặc main) → main; ranh giới ghi rõ comment.
- Dropzone/preview (MODIFY): progress bar per file theo events; cancel per file (terminate/ignore kết quả).
- Perf: đo main-thread block (Long Task) với fixture 50MB → <200ms; revoke object URLs sau dùng; asset cap enforce một chỗ.
- Worker integration test (jsdom-friendly: test protocol bằng mock Worker + test node-side logic trực tiếp).

### Out of scope
- ❌ Đổi logic/signature converter (Locked #3); gộp với parse worker hiện có (tách riêng theo §4).
- ❌ OCR worker (tesseract tự quản worker — Group C).

## 3. Checklist
- [x] DOCX/XLSX/PPTX convert + PDF heuristic chạy trong worker; ArrayBuffer transfer (không copy).
- [x] Toàn bộ test W21-23 xanh **không sửa** (trừ import path nếu buộc phải).
- [x] Progress per file/stage hiển thị; cancel hoạt động.
- [x] File 50MB: main thread không Long Task >200ms (đo và ghi số vào QA).
- [x] DOMParser-trong-worker: xác nhận môi trường; không có → fallback đã chọn ghi comment + QA.
- [x] Structured Clone sạch: kết quả plain objects (đã đảm bảo từ W22A).
- [x] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/import.worker.ts` | NEW | host converters |
| `src/modules/import/worker-client.ts` | NEW | protocol + progress + cancel |
| `src/modules/write/UniversalImportDropzone.tsx` | MODIFY | progress/cancel UI |
| `src/modules/import/worker-protocol.test.ts` | NEW | integration (mock Worker) |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| DOMParser không có trong worker → PPTX vỡ | High | Kiểm sớm Day 4 sáng; fallback: XML parse pure-string hoặc PPTX parse ở main (nhẹ) — quyết định ghi lại. |
| Worker hoá đổi behavior lén | Medium | Locked #3; test cũ nguyên trạng là gate. |
| Bundler config worker Next.js gãy build | Medium | Dùng pattern worker chuẩn Next 15 (`new Worker(new URL(...))`); build gate. |
| Transfer ArrayBuffer xong dùng lại buffer | Low | Transfer xong không đụng; test double-use throw. |

## 6. Verification Plan
- Test cũ W21-23 xanh nguyên trạng; worker protocol test xanh; 4 gates xanh.
- Manual: import 4 file cùng lúc (1 file 50MB) → UI mượt, progress chạy, cancel 1 file không ảnh hưởng file khác.
- Performance tab: Long Task <200ms trong lúc convert; số liệu vào QA Group E.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(import): dedicated import worker with progress + cancel`; `perf(import): main-thread budget + memory hygiene`; `docs(import): commit w24d contract`.
