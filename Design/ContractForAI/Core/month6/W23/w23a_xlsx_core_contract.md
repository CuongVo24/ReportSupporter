# Contract For AI - W23 Group A: XLSX Core (SheetJS → GFM Table)

> **Lane / Week:** Core / Month 6 / W23 - Day 1 (`Design/TaskBrief/Core/month6/w23.md` `[C186]`-`[C187]`).
> **Branch:** `feature/W23-import-office`.
> **Builds on:** W21 (registry/`ImportResult`/warnings), `remark-gfm` sẵn có (bảng render được ở preview).
> **Depended on by:** Group B (hardening + registry), W24 E2E.
> **Sources:** `w23.md` Locked #1/#2, `6.Import.md` §5 (XLSX row).

---

## 1. Micro-task Target

Cài `xlsx` (SheetJS) từ **dist chính thức cdn.sheetjs.com tarball** (npm registry outdated/CVE cũ), pin version, và dựng **XlsxConverter core**: mỗi sheet → section `## <Sheet name>` chứa **bảng GFM** từ **formatted values** (`w` — không formula engine); escape ký tự phá bảng; empty cell/date/number đúng format hiển thị.

> **🔒 SheetJS từ dist chính thức (Locked #1).** `npm i https://cdn.sheetjs.com/xlsx-<ver>/xlsx-<ver>.tgz`; ghi nguồn + version trong lockfile/QA.
> **🔒 Giá trị, không công thức (Locked #2).** Cell công thức lấy giá trị đã tính sẵn trong file (`w`/`v`); không evaluate.
> **⚠️ Escape bắt buộc:** `|` → `\|`, newline trong cell → `<br>`; nếu không bảng GFM vỡ im lặng.

## 2. Scope

### In scope (`[C186]`/`[C187]`)
- `package.json`/lockfile (MODIFY): `xlsx` từ tarball chính thức, pinned URL.
- `src/modules/import/converters/xlsx.ts` (**NEW**): workbook → sheets theo thứ tự; sheet → `## <Sheet name>` + GFM table; hàng đầu làm header nếu hợp lệ, không thì header cột A/B/C.
- Formatted value: ưu tiên `w` (formatted text), fallback `v`; date theo cell format; empty cell → ô rỗng.
- Escape `|`, newline, leading/trailing spaces; cell toàn khoảng trắng → rỗng.
- Unit tests cell hiểm: `|` trong text, newline, date, số phần trăm, công thức, unicode VN.

### Out of scope
- ❌ Merged cells/row cap/sheet ẩn/registry (Group B); chart/pivot (không bao giờ).
- ❌ Formula engine; style/màu cell.

## 3. Checklist
- [ ] `xlsx` cài từ tarball chính thức, pinned; `npm ci` xanh.
- [ ] Sheet → section + GFM table đúng; multi-sheet đúng thứ tự workbook.
- [ ] Formatted values đúng (date/percent/currency theo format file); công thức ra giá trị.
- [ ] Cell chứa `|`/newline không phá bảng (render preview kiểm).
- [ ] `xlsx` dynamic import, chỉ trong module Import.
- [ ] Unit tests cell hiểm xanh.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `package.json` / lockfile | MODIFY | xlsx tarball chính thức, pinned |
| `src/modules/import/converters/xlsx.ts` | NEW | sheet → GFM table |
| `src/modules/import/converters/xlsx.test.ts` | NEW | cell hiểm + multi-sheet |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Cài nhầm npm registry bản cũ | High | URL tarball pinned trong package.json (Locked #1); QA ghi nguồn. |
| Cell hiểm phá bảng GFM | Medium | Escape + unit test từng loại; render kiểm ở preview. |
| File công thức không có giá trị cache | Medium | Fallback `v` rỗng → ô rỗng + warning `unsupported-element` (formula chưa tính). |
| Bảng quá rộng (50 cột) vỡ preview | Low | Group B row/col xử lý; ở đây ghi nhận limitation. |

## 6. Verification Plan
- Vitest cell hiểm + multi-sheet xanh; 4 gates xanh.
- Manual: file bảng điểm VN (date, phần trăm, tên có dấu) → preview bảng đúng giá trị hiển thị như Excel.
- Kiểm lockfile: nguồn xlsx là cdn.sheetjs.com.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. ⚠️ Approve bao gồm cài `xlsx` **runtime** từ tarball chính thức (pinned). Đề xuất commit: `chore(import): add sheetjs from official dist (pinned)`; `feat(import): xlsx converter — sheets to GFM tables`; `docs(import): commit w23a contract`.
