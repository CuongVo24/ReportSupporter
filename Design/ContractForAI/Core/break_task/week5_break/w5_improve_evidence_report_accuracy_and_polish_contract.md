# Contract For AI — W5 Break: Fix QA Report Accuracy & Evidence UX Polish

> **Lane:** Core / break_task / week5_break.
> **Branch:** `feature/W5-evidence-kit` (hoặc `fix/w5-report-polish`).
> **Type:** Report accuracy + polish — review findings **#report (🟠) QA báo PASS sai cho QR preview**, **#5 (🟡) `confirm()` chặn luồng** (W5 Evidence Kit code review).
> **Builds on:** Contract 1 (`w5_fix_qr_preview_not_rendering_contract.md` — phải merge **trước**), `W5_QA_Report.md`, Group B (`EvidencePanel.tsx`).
> **Sources:** W5 code review (QA accuracy / UX), `Reports/README.md` (format QA), prior `W3_QA_Report.md`/`W4` report tone.

---

## 1. Micro-task Target

Sau khi Contract 1 vá QR-in-preview, **chỉnh lại tài liệu QA cho trung thực** và làm sạch vài điểm UX/test nhỏ. Đây là việc tài liệu + polish, **không** đổi hành vi lõi.

- **#report (🟠) QA report khẳng định sai.** `W5_QA_Report.md §2` ghi **"Offline QR Generation — Live Preview — PASS"** và **"Appendix page styling — Live Preview — PASS"** nhưng **không test nào render appendix qua pipeline preview**; thực tế QR preview **hỏng** trước Contract 1 (placeholder bị pipeline drop). Báo cáo PASS cho thứ chưa chạy được làm sai lệch quality gate.
- **#5 (🟡) `EvidencePanel.handleDelete` dùng `confirm()`** ([EvidencePanel.tsx:28](src/modules/evidence/EvidencePanel.tsx)) — hộp thoại native chặn luồng, khó test, lệch tông UI in-app (các panel khác không bật native dialog cho thao tác nhỏ).

## 2. Scope

### In scope

**#report — sửa `Design/Reports/Month2/W5/W5_QA_Report.md`:**
- Cập nhật §2 cho đúng thực tế **sau** Contract 1: QR preview giờ render qua **AST image injection** (không raw span/portal); ghi rõ bằng chứng test là **render-qua-pipeline** (assert `<img alt="QR:…">`), không phải chỉ assert chuỗi Markdown.
- Thêm một dòng **"Known issue được vá ở week5_break"**: nêu ngắn lỗi gốc (placeholder raw HTML bị `remark-rehype` drop do pipeline không bật `rehype-raw`) + cách vá, dẫn link 2 contract break. Giữ tông trung thực như `W3`/`W4` report (không tô hồng).
- Nếu re-run 4 gates sau fix: cập nhật số liệu test (số test tăng do thêm render-pipeline test) trong bảng §1 + `build_output.txt`. Không bịa số — chỉ ghi sau khi chạy thật.

**#5 — `src/modules/evidence/EvidencePanel.tsx` (tùy chọn, polish nhẹ):**
- Thay `confirm()` bằng xác nhận **inline** (state `confirmingDeleteId`): bấm "Xóa" lần 1 → nút đổi sang "Xác nhận xóa?" + "Hủy"; bấm xác nhận mới gọi `onChange(filter)`. Keyboard-reachable, `aria-label` rõ. Không thêm dep, không modal lib.
- A11y giữ nguyên chuẩn Group B (label, aria-live). CSS chỉ `var(--rs-*)`.

**Tests:**
- `evidence-reducer.test.ts` (hoặc panel-logic test thuần): luồng xóa 2 bước — chưa xác nhận thì list **không** đổi; xác nhận thì item biến mất, item khác giữ thứ tự. (Không cần jsdom nếu tách logic; nếu giữ UI thì test reducer thuần đủ cho DoD.)

### Out of scope
- ❌ Cơ chế QR preview (đã ở Contract 1) — Contract 2 chỉ **mô tả lại** kết quả trong report.
- ❌ Đổi shape/persist/schema evidence.
- ❌ Modal/confirm dialog library (no dep mới; chỉ inline state).
- ❌ Viết lại rule checker / appendix builder.

## 3. Checklist
- [ ] `W5_QA_Report.md` §2 phản ánh đúng QR preview sau fix; bỏ claim PASS chưa kiểm; thêm mục known-issue + link week5_break.
- [ ] (Nếu re-run) số liệu gates §1 + `build_output.txt` cập nhật theo lần chạy thật.
- [ ] `EvidencePanel` xóa 2 bước inline (không `confirm()` native), a11y giữ nguyên, CSS `var(--rs-*)`.
- [ ] Test luồng xóa 2 bước (chưa xác nhận không đổi; xác nhận mới xóa).
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// EvidencePanel.tsx — confirm inline, không native confirm()
const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
// nút Xóa: nếu confirmingDeleteId === item.id -> render "Xác nhận xóa?" + "Hủy"
//   xác nhận -> onChange(evidence.filter(...)); reset
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `Design/Reports/Month2/W5/W5_QA_Report.md` | MODIFY | §1/§2 + known-issue |
| `Design/Reports/Month2/W5/build_output.txt` | MODIFY (nếu re-run) | log mới |
| `src/modules/evidence/EvidencePanel.tsx` | MODIFY | ~+12 (confirm inline) |
| `src/modules/evidence/evidence-reducer.test.ts` | MODIFY | ~+20 (xóa 2 bước) |

> **Import boundary** không đổi. Offline, no `fetch`, no dep mới.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Report sửa nhưng quên re-run → số liệu lệch | Thấp | Chỉ cập nhật số sau khi chạy gates thật; nếu không re-run thì giữ số cũ + ghi rõ "chưa re-run". |
| Confirm inline nhầm xóa (double-click) | Thấp | 2 bước tách nút riêng + reset khi đổi item/đóng; test luồng. |
| Polish UI làm phình `EvidencePanel` > 200 dòng | Thấp | Thêm tối thiểu state; nếu chạm trần thì tách hàm render item. |

## 6. Verification Plan
- Đọc `W5_QA_Report.md`: không còn dòng PASS cho QR-preview chưa kiểm; có mục known-issue + link 2 contract break; số gates khớp `build_output.txt`.
- Unit: bấm Xóa (chưa xác nhận) → list nguyên; xác nhận → item mất, thứ tự còn lại giữ.
- grep: không còn `confirm(` trong `EvidencePanel.tsx`.
- lint / typecheck / test / build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `fix(evidence): inline 2-step delete confirm`; (2) `docs(w5): correct QA report QR-preview accuracy + known-issue`; +1 docs commit. Đóng W5 break.
