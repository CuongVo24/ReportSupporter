# Contract For AI — W2 Break: Fix textList Input Clobber (space/comma bị nuốt)

> **Lane:** Core / break_task / week2_break.
> **Branch:** `feature/W2-markdown-editor` (hoặc `fix/w2-metadata-textlist`).
> **Type:** Bug fix — review finding: ô **"Thành viên nhóm"** (`type: textList`) **không gõ được dấu cách và dấu phẩy** → các tên dính liền nhau.
> **Builds on:** Group D (`w2d_template_metadata_skeleton_contract.md` — `MetadataForm`, `generate-skeleton`, `ProjectInitializer`).
> **Sources:** `src/modules/write/MetadataForm.tsx` (handler `handleListChange` + `useEffect` resync), `src/types` (`MetadataFieldSpec.type = "textList"`), `Design/Modules/1.Write.md` (metadata members).

---

## 1. Micro-task Target

Sửa ô nhập danh sách (`textList`, ví dụ "Thành viên nhóm") để gõ được **dấu cách trong tên** và **dấu phẩy phân tách** như người dùng kỳ vọng.

**Root cause:** `MetadataForm` giữ chuỗi thô của ô list trong state cục bộ `listInputs`, nhưng có một `useEffect` đồng bộ ngược `listInputs ⟵ values` chạy trên **mọi** thay đổi `values`:

```ts
// MetadataForm.tsx ~dòng 17-26
useEffect(() => {
  ...
  nextInputs[field.key] = Array.isArray(val) ? val.join(", ") : "";
  setListInputs(nextInputs);
}, [values, fields]);            // ← fire mỗi keystroke
```

Mỗi phím gõ: `handleListChange` cập nhật `listInputs` (thô) **và** `onChange` đẩy mảng đã `split(",").map(trim).filter(Boolean)` lên parent → `values` đổi reference → `useEffect` chạy → **ghi đè `listInputs`** bằng `mảng.join(", ")` đã chuẩn hoá. Vì `trim()`/`filter(Boolean)` cắt ký tự phân tách đang ở **cuối** chuỗi (space/`,` vừa gõ luôn là ký tự cuối), separator bị xoá ngay trước khi gõ ký tự kế → tên dính liền (`"Đỗ Nguyễn, ..."` → `"ĐỗNguyễn..."`). State `listInputs` vốn để giữ input thô nhưng bị chính effect này vô hiệu hoá.

**Fix:** coi **chuỗi thô** của ô list là **nguồn sự thật** cho `value` input; chỉ resync từ `values` khi giá trị đến **từ bên ngoài** (reset/nạp lại), không phải từ chính cú gõ.

## 2. Scope

### In scope
- `src/modules/write/MetadataForm.tsx`:
  - **Bỏ vòng đè thô từ values.** Hai cách (chọn (A) — tối thiểu, giữ cấu trúc):
    - **(A) khuyến nghị — guard resync:** giữ `useEffect` nhưng chỉ `setListInputs` cho field khi **giá trị ngoài khác giá trị mà local sẽ tạo ra**. So sánh:
      `incoming = Array.isArray(values[key]) ? values[key].join(", ") : ""` với
      `normalizedLocal = parseTextList(listInputs[key]).join(", ")`; chỉ cập nhật khi `incoming !== normalizedLocal`. Khi thay đổi đến từ chính ô (mảng parse khớp), effect **không** đè → giữ nguyên space/`,` đang gõ; khi đổi từ ngoài (template switch/reset) vẫn đồng bộ.
    - **(B) thay thế — seed once:** bỏ `useEffect`, seed `listInputs` một lần trong `useState(() => …)` từ `initialMetadata`; chuỗi thô là source-of-truth tuyệt đối. (Đơn giản hơn nhưng mất tự-đồng-bộ khi parent reset — chấp nhận nếu init không reset list.)
  - **Trích helper thuần** `parseTextList(raw: string): string[]` ( = `raw.split(",").map(t=>t.trim()).filter(Boolean)`) để `handleListChange` và guard dùng chung, và để test.
  - `handleListChange` **không đổi hành vi đẩy parent**: vẫn đẩy mảng đã parse lên `values`; chỉ đảm bảo `listInputs[key]` giữ đúng chuỗi thô vừa gõ và **không** bị effect đè.
- **Regression test thuần (không jsdom)** — `MetadataForm.test.ts` (hoặc `parse-text-list.test.ts`):
  - `parseTextList("Đỗ Nguyễn, Lê An, ")` → `["Đỗ Nguyễn", "Lê An"]` (giữ space trong tên, bỏ phần tử rỗng).
  - Mô phỏng round-trip controlled-input: dãy raw `["Đỗ", "Đỗ ", "Đỗ N"]` → `value` hiển thị cuối = `"Đỗ N"` (space được giữ), parse = `["Đỗ N"]`. (Test ở mức hàm/guard; nếu repo có RTL+jsdom thì thêm test render gõ phím, **không bắt buộc** thêm dependency.)

### Out of scope
- ❌ Đổi `MetadataFieldSpec` / schema type.
- ❌ Validation rule (số lượng thành viên, định dạng MSSV…) — finding riêng nếu cần.
- ❌ Bug nút submit khuất / luồng export (đó là `week1_break/w1_fix_initializer_submit_affordance_contract.md`).
- ❌ Field `text` thường (`title`, `school`…) — vốn chạy đúng, không đụng.

## 3. Checklist
- [ ] `MetadataForm.tsx`: `value` ô `textList` lấy từ chuỗi thô; resync từ `values` chỉ khi đổi từ ngoài (guard) **hoặc** seed-once.
- [ ] Helper thuần `parseTextList` dùng chung; `handleListChange` vẫn đẩy mảng parse lên parent.
- [ ] Gõ space trong tên + dấu `,` phân tách **không** bị nuốt.
- [ ] Test: `parseTextList` giữ space trong tên/bỏ rỗng; round-trip raw giữ `"Đỗ N"`.
- [ ] 4 gates xanh (lint / typecheck / test / build).

## 4. Expected Interfaces / Files

```ts
// MetadataForm.tsx — thêm helper thuần (export để test):
export function parseTextList(raw: string): string[];
// value ô textList = listInputs[key] (chuỗi thô); guard resync hoặc seed-once.
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/write/MetadataForm.tsx` | MODIFY | ~+12 / −6 (guard + helper) |
| `src/modules/write/MetadataForm.test.ts` *(hoặc `parse-text-list.test.ts`)* | NEW | ~+30 |

> **Import boundary** không đổi. Thuần, offline, no `fetch`. Không đổi chữ ký `MetadataForm` props.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Guard so sánh sai khiến reset từ ngoài không đồng bộ | Thấp | So sánh trên dạng normalize 2 phía; test case "đổi từ ngoài" cập nhật, "gõ tại ô" không đè. |
| Seed-once (cách B) mất đồng bộ khi template switch reset list | Thấp | Init hiện chỉ reset `title`, không reset list; nếu cần, remount qua `key`. Khuyến nghị cách (A) để an toàn. |
| Người dùng cố tình gõ 2 dấu phẩy liên tiếp | Thấp | `filter(Boolean)` bỏ phần tử rỗng khi submit; hiển thị thô vẫn giữ đúng cái đang gõ. |

## 6. Verification Plan
- Unit: `parseTextList("Đỗ Nguyễn, Lê An, ")` → `["Đỗ Nguyễn","Lê An"]`.
- Unit: round-trip raw `"Đỗ"`→`"Đỗ "`→`"Đỗ N"` ⇒ value cuối `"Đỗ N"`, parse `["Đỗ N"]`.
- Manual (npm run dev → màn Khởi tạo): gõ "Đỗ Nguyễn Tiến Phú, Lê Văn An" vào "Thành viên nhóm" → hiển thị **đúng** có space + dấu phẩy; sau khởi tạo, cover/skeleton nhận đúng 2 thành viên.
- lint / typecheck / test / build xanh.

## 7. Status

`PENDING` — chờ Approve.

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(write): keep raw textList input as source of truth` + 1 docs commit (contract này).
