# Contract For AI — W23 Fix (B): Tên File Xuất Mất Dấu Tiếng Việt (Slug `[^a-z0-9]+` Xoá Ký Tự Có Dấu)

> **Lane:** Core / break_task / week23_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Bug correctness/UX nhỏ, độc lập. Tái dùng `lib/slugify` sẵn có.
> **Findings:**
> - **S1** (🟠) — **Slug tên file xoá ký tự có dấu thay vì chuyển tự.** Cả hai call site tạo tên file dùng `bundle.project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")`: export HTML/PDF/DOCX ([use-export.ts:126](src/modules/export/use-export.ts#L126)-L128) và evidence zip ([SubmissionPanel.tsx:85](src/modules/export/SubmissionPanel.tsx#L85)-L86). `.toLowerCase()` **không** bỏ dấu; `[^a-z0-9]` khớp cả "á/ồ/ầ/ơ/ư/đ" → thay bằng "-". "Báo cáo đồ án phần mềm" → `b-o-c-o-n-ph-n-m-m.html` / `-evidence.zip`.
> - **S2** (🟢) — **Đã có hàm đúng, không tái dùng.** `lib/slugify` NFD-normalize + strip `[̀-ͯ]` + map "đ" → "d" ([slugify.ts:13](src/lib/slugify.ts#L13)-L19), đang dùng cho anchor heading ([number-headings.ts:113](src/modules/format/number-headings.ts#L113)). Kết quả đúng: `bao-cao-do-an-phan-mem`. Hai hệ slug song song, một đúng một sai.
> **Builds on:** `use-export.ts` (`fileName`), `SubmissionPanel.tsx` (`fileName`), `lib/slugify.ts`.
> **Sources:** QA session 2026-07-13, phát hiện #3 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Mọi tên file xuất (`.html`/`.pdf`/`.docx`/`-evidence.zip`) **chuyển tự tiếng Việt** đọc được, dùng **một nguồn slug duy nhất** (`lib/slugify`), an toàn trên mọi hệ điều hành.

- **S1 — Thay slug sai bằng `slugify`.** Cả `use-export.ts` và `SubmissionPanel.tsx` gọi `slugify(bundle.project.title)`; giữ suffix `.${ext}` / `-evidence.zip`; fallback `"report"` khi rỗng (kiểm `slugify` trả rỗng với title toàn ký tự lạ).
- **S2 — Va-đập an toàn.** Bảo đảm kết quả không chứa ký tự cấm Windows/macOS (`slugify` đã chỉ giữ `[a-z0-9-]` nên an toàn); giới hạn độ dài hợp lý nếu title quá dài (tuỳ chọn).

> 🔒 **Một nguồn slug.** Không viết regex slug thứ ba; anchor + tên file dùng chung `lib/slugify`.
> 🔒 Không đổi hành vi tải/lịch sử; chỉ đổi chuỗi tên file.

## 2. Scope

### In scope
- [src/modules/export/use-export.ts](src/modules/export/use-export.ts) (MODIFY): `const safeTitle = slugify(bundle.project.title) || "report";`.
- [src/modules/export/SubmissionPanel.tsx](src/modules/export/SubmissionPanel.tsx) (MODIFY): tương tự cho `-evidence.zip`.
- [src/lib/slugify.ts](src/lib/slugify.ts) (VERIFY, MODIFY chỉ nếu cần fallback rỗng): xác nhận trả `""` khi input rỗng để caller fallback.
- Test (UPDATE): tên file cho title có dấu → `bao-cao-do-an-phan-mem.html` / `.docx` / `-evidence.zip`.

### Out of scope
- ❌ Đổi nội dung file hay lịch sử xuất.
- ❌ Đổi anchor/slug heading (đã đúng).
- ❌ i18n tên file (chỉ chuyển tự, không dịch).

## 3. Checklist
- [ ] **S1** `use-export.ts` + `SubmissionPanel.tsx` dùng `slugify`; bỏ regex `[^a-z0-9]+`.
- [ ] **S2** Fallback `"report"` khi slug rỗng; kết quả an toàn tên file.
- [ ] Title "Báo cáo đồ án phần mềm" → `bao-cao-do-an-phan-mem.*`. Test xanh.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/use-export.ts` | MODIFY | dùng `slugify` cho fileName |
| `src/modules/export/SubmissionPanel.tsx` | MODIFY | dùng `slugify` cho zip fileName |
| `src/lib/slugify.ts` | VERIFY | xác nhận fallback rỗng |
| `src/modules/export/use-export.test.ts` | UPDATE | assert tên file có dấu chuyển tự đúng |

> **Import boundary:** `import { slugify } from "@/lib/slugify";` — không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Title toàn ký tự lạ → slug rỗng → tên file `.html` cụt | Low | Fallback `"report"`. |
| Trùng tên khi nhiều báo cáo cùng slug | Low | Ngoài scope; có thể thêm timestamp sau (backlog). |
| Slug khác so với lịch sử cũ đã lưu | Low | Chỉ ảnh hưởng tên tải mới; lịch sử hiển thị `job.fileName` đã lưu, không hồi tố. |

## 6. Verification Plan
- Tạo báo cáo title "Báo cáo đồ án phần mềm". Xuất HTML/DOCX: tên tải `bao-cao-do-an-phan-mem.html` / `.docx`. Tải evidence.zip: `bao-cao-do-an-phan-mem-evidence.zip`.
- Title rỗng/toàn ký tự đặc biệt → `report.html`. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(export): reuse slugify for filenames so Vietnamese titles transliterate`.
