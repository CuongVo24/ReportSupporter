# Contract For AI - W23 Group D: PPTX Media & Registry

> **Lane / Week:** Core / Month 6 / W23 - Day 4 (`Design/TaskBrief/Core/month6/w23.md` `[C192]`-`[C193]`).
> **Branch:** `feature/W23-import-office`.
> **Builds on:** W23C (parser core), W21D (đường `ReportAsset`), W21B (registry — không sửa core).
> **Depended on by:** Group E (fixtures/QA), W24 (worker + E2E).
> **Sources:** `w23.md` Locked #4/#6, `6.Import.md` §3.2/§5.

---

## 1. Micro-task Target

Hoàn tất PPTX: **media** `ppt/media/*` → `ReportAsset` (map qua `slideN.xml.rels`, chèn sau text slide tương ứng); phần tử không hỗ trợ (**SmartArt/chart/OLE/video**) → `unsupported-element` (kèm `location: "slide N"`) — **không chặn import**; đăng ký PptxConverter vào registry (dynamic import, `.pptx`; `.ppt` reject có thông báo riêng). Diff gate: zero sửa core.

> **🔒 Không chặn vì phần tử lạ (Locked #6).** SmartArt/chart mất là chấp nhận được — nhưng phải có warning từng slide.
> **🔒 Thêm converter không sửa core (Locked #4).**
> **⚠️ Map media qua rels** — không đoán theo tên file (`image1.png` không chắc thuộc slide 1).

## 2. Scope

### In scope (`[C192]`/`[C193]`)
- `pptx/slide-xml.ts` (MODIFY): đọc `<p:pic>` + `r:embed` id; parse `slideN.xml.rels` → map id → `ppt/media/<file>`.
- `converters/pptx.ts` (MODIFY): media binary từ jszip → base64 `ReportAsset` (qua helper W21D) + `asset://<id>` chèn sau bullets slide đó; ảnh hỏng/format lạ (emf/wmf) → `image-skipped`.
- Detect node không hỗ trợ: `<dgm:*>` (SmartArt), `<c:chart>`, `<p:oleObj>`, video → `unsupported-element` per slide.
- Đăng ký registry: `.pptx` + MIME chuẩn + rỗng-fallback; `.ppt` → reject "định dạng PowerPoint cũ, hãy lưu lại thành .pptx".

### Out of scope
- ❌ Render SmartArt/chart thành ảnh; video/audio embed.
- ❌ Sửa registry core/dropzone; fixtures thật/QA (Group E).

## 3. Checklist
- [x] Ảnh đúng slide (map rels, không theo tên file); ≥2 slide có ảnh test phân bổ đúng.
- [x] emf/wmf → `image-skipped`, import tiếp tục.
- [x] SmartArt/chart/OLE → `unsupported-element` đúng slide; import không dừng.
- [x] `.pptx` resolve đúng; `.ppt` reject thông báo riêng.
- [x] Diff không chạm registry core/dropzone (ngoài bootstrap entry).
- [x] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/pptx/slide-xml.ts` | MODIFY | pic + rels map |
| `src/modules/import/converters/pptx.ts` | MODIFY | media → ReportAsset + warnings |
| `src/modules/import/registry.ts` | MODIFY (bootstrap list only) | entry pptx |
| `src/modules/import/pptx/*.test.ts` | MODIFY | rels map + unsupported cases |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Rels map sai → ảnh lạc slide | Medium | Test fixture ≥2 slide ảnh; map qua rels chuẩn (⚠️ trên). |
| emf/wmf phổ biến trong pptx VN cũ | Medium | `image-skipped` + message gợi ý ("ảnh dạng cũ, hãy chèn lại"); không crash. |
| Slide đầy SmartArt → section gần rỗng | Medium | Warning per slide + title vẫn giữ — user thấy ở preview. |
| Base64 nhiều ảnh lớn | Medium | Asset cap W21D áp dụng chung. |

## 6. Verification Plan
- Vitest rels map + unsupported detection xanh; 4 gates xanh.
- Manual: pptx thật có ảnh + chart → ảnh vào asset đúng slide, chart thành warning, import trọn vaim.
- `git diff --stat` xác nhận core không đổi.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(import): pptx media to ReportAsset via rels mapping`; `feat(import): pptx unsupported-element warnings + registry entry`; `docs(import): commit w23d contract`.
