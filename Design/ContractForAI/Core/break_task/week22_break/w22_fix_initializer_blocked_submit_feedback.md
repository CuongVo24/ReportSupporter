# Contract For AI — W22 Fix (C): "Tạo Báo Cáo" Bị Chặn Không Phản Hồi (Lỗi Không Render / Init Câm)

> **Lane:** Core / break_task / week22_break.
> **Branch:** `feature/W25-ui-redesign` (nhánh chung cả tuần).
> **Type:** Bug UX phản hồi. Nhỏ, độc lập; làm sau A/B.
> **Findings:**
> - **S1** (🟡) — **Submit bị chặn nhưng không phản hồi thị giác.** Bấm "Tạo báo cáo" khi thiếu trường bắt buộc (Trường/Khoa, Thành viên): `handleSubmitTemplate` chặn đúng (`validateMetadata` → nếu có lỗi thì `setErrors` + `return`, [ProjectInitializer.tsx:120](src/modules/write/ProjectInitializer.tsx#L120)-L133). Về lý thuyết `MetadataForm` truyền `error` xuống `Input` và `Input` render `<p role="alert" class="ws-field-error">` + `aria-invalid` ([Input.tsx:104](src/components/ui/Input.tsx#L104), [Input.tsx:92](src/components/ui/Input.tsx#L92)). **Nhưng** thực nghiệm QA (điền form + bấm) cho thấy form **không advance mà cũng không hiện bất kỳ `[role="alert"]`/`aria-invalid`/thông báo nào**, và không cuộn/không focus tới field lỗi ⇒ người dùng thấy nút "chết".
> - **S2** (🟡) — **Chưa chốt nhánh nguyên nhân.** Hai khả năng loại trừ nhau: (a) lỗi **được set nhưng không render** (regression ở đường `errors`→`Input`, hoặc field lỗi nằm ngoài vùng cuộn `scrollAreaStyle` nên không thấy); hoặc (b) `validateMetadata` **pass** nhưng `onInitialize`/`handleInitialize` **không advance** (init câm). Cần re-test sạch để phân biệt.
> **Builds on:** `ProjectInitializer.tsx` (`handleSubmitTemplate`), `MetadataForm.tsx` (`errors`→`Input`), `Input.tsx` (render lỗi), `generate-skeleton.ts` (`validateMetadata`), `Workspace.tsx` (`handleInitialize`).
> **Sources:** QA session 2026-07-10, phát hiện #5 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Bảo đảm bấm "Tạo báo cáo" **luôn** cho phản hồi rõ: hoặc tạo được báo cáo, hoặc chỉ ra **chính xác** trường nào thiếu (thấy được + focus + cuộn tới), không bao giờ "nút chết".

- **S0 — Chốt nhánh (diagnose trước).** Re-test sạch: điền qua `onChange` thật của React (không set DOM value trực tiếp). Ghi nhận: khi thiếu trường, `errors` có được set? `<p role="alert">` có trong DOM? có nằm ngoài vùng cuộn không? hay validation pass mà không advance?
- **S1 — Bảo đảm lỗi thấy được.** Nếu nhánh (a): sửa để lỗi render và **cuộn + focus** tới field lỗi đầu tiên khi submit bị chặn (dùng `aria-invalid` + `role="alert"` sẵn có; thêm cuộn/focus). Nếu field lỗi ngoài viewport `scrollAreaStyle` — cuộn vào tầm nhìn.
- **S2 — Init không câm.** Nếu nhánh (b): `handleInitialize` thất bại phải có toast lỗi rõ (mẫu toast W13/W20); không nuốt lỗi thầm lặng.

> 🔒 **Không đổi luật validation** (`validateMetadata`) — chỉ đảm bảo **phản hồi**. Trường bắt buộc vẫn là bắt buộc.
> 🔒 Không lib mới; dùng toast/`Input` error/`ref` focus sẵn có. Microcopy theo `§7`.

## 2. Scope

### In scope
- (Diagnose) Re-test sạch xác định nhánh (a)/(b) — ghi vào PR.
- [src/modules/write/ProjectInitializer.tsx](src/modules/write/ProjectInitializer.tsx) (MODIFY): sau `setErrors`, focus + cuộn tới field lỗi đầu tiên; (nhánh b) surface lỗi init.
- [src/modules/write/MetadataForm.tsx](src/modules/write/MetadataForm.tsx) (MODIFY nếu cần): hỗ trợ ref/id để cuộn-focus field lỗi; xác nhận `errors[key]` chảy đúng tới `Input`.
- [src/components/ui/Input.tsx](src/components/ui/Input.tsx) (chỉ MODIFY nếu diagnose chỉ ra lỗi render) — mặc định **không** đổi.

### Out of scope
- ❌ Đổi `validateMetadata`/quy tắc trường bắt buộc.
- ❌ Đổi layout card khởi tạo hay các tab khác (blank/import/outline).
- ❌ Thêm validation realtime mới (chỉ đảm bảo phản hồi lúc submit + blur sẵn có).

## 3. Checklist
- [x] **S0** Đã chốt nhánh (a) hay (b) bằng re-test sạch; ghi rõ trong PR.
- [x] **S1** Submit thiếu trường: lỗi hiển thị (`role="alert"`), input `aria-invalid`, **cuộn + focus** field lỗi đầu tiên.
- [x] **S2** (nếu b) init thất bại có toast rõ; không câm.
- [x] Điền đủ trường → tạo báo cáo thành công như cũ (không hồi quy). 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/ProjectInitializer.tsx` | MODIFY | focus+scroll field lỗi; (b) surface lỗi init |
| `src/modules/write/MetadataForm.tsx` | MODIFY (nếu cần) | ref/id field để cuộn-focus; xác nhận errors→Input |
| `src/components/ui/Input.tsx` | MODIFY (chỉ nếu diagnose ra lỗi render) | mặc định không đổi |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Sửa sai nhánh (fix render trong khi lỗi thật là init câm) | Med | **Bắt buộc S0 diagnose trước**; fix theo nhánh xác định. |
| Focus/scroll giật khi có nhiều lỗi | Low | Focus field lỗi **đầu tiên** theo thứ tự field; cuộn mượt. |
| Field lỗi nằm ngoài vùng cuộn nội bộ card | Low | Cuộn container `scrollAreaStyle` tới field, không cuộn cả trang. |

## 6. Verification Plan
- Mẫu template, xoá trống "Trường/Khoa" và "Thành viên nhóm", bấm "Tạo báo cáo": thấy lỗi tại đúng 2 field (`role="alert"`), input `aria-invalid="true"`, con trỏ focus + cuộn tới field lỗi đầu tiên. Không advance.
- Điền đủ 2 field → bấm: tạo báo cáo, vào workspace bình thường.
- (Nếu nhánh b) ép `handleInitialize` lỗi: thấy toast lỗi, không "nút chết".
- Kiểm bằng bàn phím (Tab/Enter) và screen-reader: lỗi được announce. 4 gate xanh.

## 7. Status

`COMPLETED`
