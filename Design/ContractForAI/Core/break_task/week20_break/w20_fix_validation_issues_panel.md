# Contract For AI — W20 Fix (D): Checker Nhận Diện Path + Issues Panel + Gate Mọi Đường Export

> **Lane:** Core / break_task / week20_break.
> **Branch:** `w20/import-fidelity` (nhánh chung cả tuần).
> **Type:** Defect-root / validation coverage + UX surfacing.
> **Findings:**
> - **S1** (🟠) — **Checker ảnh không nhận diện đường dẫn**: rule `broken-image` chỉ bắt URL **rỗng** hoặc `asset:`/`image:` **thiếu** ([images.ts](src/modules/check/rules/images.ts)); một path `Figures/x.png` là URL **không rỗng** ⇒ **lọt** ⇒ checker im lặng dù ảnh 404.
> - **S2** (🟠) — **Export đường tắt không validate** (#17): `runExport → executeExport → exportPdf` **không** gọi `validateExport` ([use-export.ts:47](src/modules/export/use-export.ts#L47)); chỉ `ExportPanel` mới gate ([ExportPanel.tsx:73](src/modules/export/ExportPanel.tsx#L73)) và còn **bypassable**. Panel phải ("Xuất bản để nộp") có thể xuất khi đang 404.
> - **S3** (🟠) — **Không có panel Issues tổng hợp** (#18–#26, #VII): các rule rời rạc (heading-levels, references, captions, table-width, evidence-gaps…) tồn tại trong `src/modules/check/rules/` nhưng **không** được gom thành 1 bảng kiểu VSCode (Errors/Warnings/Broken images/Broken links/Duplicate heading/Figure&Table number/Reference/TOC), và **không** có badge dev cho 404 (#VII).
> **Builds on:** `src/modules/check/**` (rules đã có), `validate-export.ts` (W19-D), `run-checker.ts`, `CheckPanel`/`Workspace.tsx`.
> **Sources:** Product Review 2026-06-29 (#17–#26, #VII, #19).

---

## 1. Micro-task Target

Mở rộng **độ phủ kiểm tra** để bắt đúng các lỗi của báo cáo nhập, **gom vào một Issues panel** điều hướng được, và **gate mọi đường export** (kể cả panel nộp bài).

- **S1 — Checker nhận diện path.** `broken-image` đánh dấu **error** khi `image.url` là đường dẫn cục bộ/tương đối **không** ánh xạ tới asset đã nhúng (sau A, mọi ảnh hợp lệ là `asset:`/`data:`). `broken-link` (NEW): link `[x](path)` trỏ neo/đường dẫn không tồn tại.
- **S2 — Rule còn thiếu.** Bổ sung: **Duplicate Heading** (#22), **Figure/Table Number** liên tục & khớp registry (#23/#24), **Reference** "Xem Hình 5.2" trỏ tới hình **không tồn tại** (#25), **TOC drift** — heading đổi nhưng mục lục cũ (#26). Tái dùng registry từ contract C để so khớp.
- **S3 — Issues panel.** Gom toàn bộ issue thành bảng nhóm theo severity & loại; click → nhảy tới section/line. Hiển thị markdown-lint cơ bản (#19: `[](abc)` link rỗng, ảnh thiếu alt). Badge dev "Broken assets: N" (#VII) đọc từ kết quả scan thay vì terminal.
- **S4 — Gate đồng nhất.** `runExport` (mọi target, mọi nút kể cả SubmissionPanel) chạy `validateExport` trước; lỗi P0 (ảnh chết) → cảnh báo + "vẫn xuất" có chủ đích.

> 🔒 Gom & cho phép snooze để tránh "ồn"; P0 chỉ cho ảnh chết.
> 🔒 Checker chạy local; không network.

## 2. Scope

### In scope
- [src/modules/check/rules/images.ts](src/modules/check/rules/images.ts) (MODIFY): bắt path không-ánh-xạ.
- [src/modules/check/rules/broken-link.ts](src/modules/check/rules/broken-link.ts) (NEW) + test.
- [src/modules/check/rules/duplicate-heading.ts](src/modules/check/rules/duplicate-heading.ts) (NEW) + test.
- [src/modules/check/rules/figure-table-number.ts](src/modules/check/rules/figure-table-number.ts) (NEW) + test (dùng registry C).
- [src/modules/check/rules/references.ts](src/modules/check/rules/references.ts) (MODIFY): ref "Hình/Bảng N.N" trỏ mục không tồn tại.
- [src/modules/check/rules/toc-drift.ts](src/modules/check/rules/toc-drift.ts) (NEW) + test.
- [src/modules/check/registry.ts](src/modules/check/registry.ts) (MODIFY): đăng ký rule mới.
- [src/modules/export/use-export.ts](src/modules/export/use-export.ts) (MODIFY): gate trước **mọi** target.
- [src/modules/export/SubmissionPanel.tsx](src/modules/export/SubmissionPanel.tsx) (MODIFY): gate nộp bài.
- [src/components/IssuesPanel.tsx](src/components/IssuesPanel.tsx) (NEW) + [Workspace.tsx](src/components/Workspace.tsx) (MODIFY): panel gom + jump-to; badge dev.
- [src/app/globals.css](src/app/globals.css) (MODIFY): style panel theo token semantic.

### Out of scope
- ❌ Inline CodeMirror lint gutter nâng cao (chỉ lint cơ bản ở panel) — backlog.
- ❌ Auto-fix số hình/heading (chỉ cảnh báo; sửa số ở contract C).

## 3. Checklist
- [ ] **S1** Ảnh path không nhúng & link hỏng → error đúng section.
- [ ] **S2** Duplicate heading / figure-table number / reference / TOC drift bắt đúng.
- [ ] **S3** Issues panel gom theo loại, click jump; badge dev "Broken assets: N".
- [ ] **S4** Mọi nút export (kể cả nộp bài) đều gate. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/check/rules/images.ts` | MODIFY | path-aware |
| `src/modules/check/rules/broken-link.ts` | NEW | link hỏng |
| `src/modules/check/rules/duplicate-heading.ts` | NEW | heading trùng |
| `src/modules/check/rules/figure-table-number.ts` | NEW | số hình/bảng |
| `src/modules/check/rules/references.ts` | MODIFY | ref không tồn tại |
| `src/modules/check/rules/toc-drift.ts` | NEW | TOC lệch |
| `src/modules/check/registry.ts` | MODIFY | đăng ký rule |
| `src/modules/export/use-export.ts` | MODIFY | gate mọi target |
| `src/modules/export/SubmissionPanel.tsx` | MODIFY | gate nộp |
| `src/components/IssuesPanel.tsx` | NEW | panel gom + jump |
| `src/components/Workspace.tsx` | MODIFY | nối panel + badge dev |

> **Import boundary:** không lib mới; không network.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Quá nhiều cảnh báo gây nhiễu | Med | Gom theo severity/loại, cho snooze; P0 chỉ ảnh chết. |
| False positive path-aware sau A | Med | Sau A mọi ảnh hợp lệ là `asset:`/`data:`; whitelist rõ. |
| Gate chặn nộp bài gấp | Med | "Vẫn xuất" có chủ đích + ghi log lý do. |

## 6. Verification Plan
- Báo cáo còn `Figures/x.png` chưa nhúng → checker + gate báo P0; panel liệt kê.
- "Xem Hình 5.2" không tồn tại → reference warning; heading trùng → cảnh báo.
- Badge dev hiện số ảnh hỏng khớp terminal 404. 4 gate xanh.

## 7. Status

`COMPLETED`

> Commit (trên `w20/import-fidelity`): `fix(check): path-aware broken-image/link, duplicate-heading, figure/table-number, reference & TOC-drift rules surfaced in Issues panel; gate every export path`.
