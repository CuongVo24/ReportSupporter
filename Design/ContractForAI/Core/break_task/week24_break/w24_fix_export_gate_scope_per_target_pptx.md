# Contract For AI — W24 Fix (C): Gate P0 Thân Báo Cáo Chặn Dây Chuyền Sang Xuất Slide/PPTX

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Bug scope/correctness luồng xuất. Độc lập, nhỏ.
> **Findings:**
> - **S1** (🟠) — **Cổng P0 áp cho mọi target, kể cả pptx.** `executeExport` mở đầu bằng `runChecker(bundle)`, lọc `severity === "error"`, và **ném `ExportError`** nếu có P0 — **trước** khi rẽ nhánh target ([use-export.ts:23](src/modules/export/use-export.ts#L23)-L33). Nhánh `pptx` nằm **sau** cổng đó ([use-export.ts:86](src/modules/export/use-export.ts#L86)-L105). ⇒ Bấm "**Xuất PowerPoint (.pptx)**" ở tab Slide bị chặn bởi P0 **thân báo cáo** (thiếu evidence github/demo/deploy/video, ảnh **body** vỡ) — những lỗi **không liên quan** tới nội dung slide.
> - **S2** (🟠) — **Sai mô hình deliverable.** Báo cáo (html/pdf/docx) và **bộ slide** (pptx) là **hai sản phẩm khác nhau**. P0 evidence là điều kiện của **bản nộp báo cáo**, không phải của **bài thuyết trình**. Chặn slide vì báo cáo thiếu evidence là **rò rỉ phạm vi** gate.
> **Builds on:** `use-export.ts` (`executeExport` gate + nhánh pptx), `runChecker`, luồng Present (`PresentPanel`/`use-present`) gọi `runExport("pptx", …)`.
> **Sources:** QA session 2026-07-14, phát hiện #3 (mục Xuất bản/Slide) [[w25-health-check-root-causes]].

---

## 1. Micro-task Target

**Đúng-phạm-vi** cổng xuất: P0 **thân báo cáo** chỉ chặn xuất **báo cáo** (html/pdf/docx); xuất **slide/pptx** chỉ chặn bởi lỗi **liên quan slide** (nếu có), **không** bởi evidence/ảnh-body của báo cáo. **Không** nới lỏng gate báo cáo (giữ W23-A lock).

- **S1 — Tách cổng theo target.** Với `target === "pptx"`: **không** chạy `runChecker(bundle)` toàn cục làm điều kiện chặn; thay bằng **kiểm tối thiểu liên quan slide** (vd có ≥1 slide/outline hợp lệ) hoặc không gate (nếu slide luôn dựng được từ outline). Giữ nguyên cổng P0 cho html/pdf/docx.
- **S2 — Rõ ràng, không im lặng.** Nếu pptx có điều kiện chặn riêng (vd chưa có outline), báo đúng lỗi **của slide**, không mượn lỗi báo cáo. Kế thừa lock W23 "không thao tác im lặng".

> 🔒 **Không bỏ gate báo cáo.** html/pdf/docx vẫn chặn P0 như W23-A. C chỉ **gỡ chặn nhầm** cho deliverable slide. Không đổi luật `runChecker`.

## 2. Scope

### In scope
- [src/modules/export/use-export.ts](src/modules/export/use-export.ts) (MODIFY): trong `executeExport`, **di chuyển/điều kiện hoá** cổng P0 để **không** áp cho `pptx`; nếu cần, thêm kiểm riêng cho pptx (outline rỗng → lỗi "Chưa có nội dung slide"). Giữ cổng cũ cho các target báo cáo.
- [src/modules/present/PresentPanel.tsx](src/modules/present/PresentPanel.tsx) / dialog tiền-kiểm nếu có (MODIFY nhẹ): thông điệp xuất slide **không** viện dẫn P0 báo cáo.
- Test (NEW/UPDATE): bundle thiếu evidence (P0) + có outline hợp lệ → `runExport("pptx")` **thành công**; `runExport("html")` **vẫn** bị chặn P0. pptx không outline → lỗi slide-specific.

### Out of scope
- ❌ Đổi luật evidence/ảnh (`runChecker`) hay gate báo cáo html/pdf/docx.
- ❌ "Xuất nháp" bỏ P0 cho báo cáo (thuộc Decide [[w24_decide_draft_export_bypass_p0_watermark]]).
- ❌ Nội dung/chất lượng slide (outline AI, timeline…) — chỉ chạm **điều kiện chặn xuất**.

## 3. Checklist
- [ ] **S1** `target==="pptx"` **không** bị chặn bởi P0 thân báo cáo; html/pdf/docx **vẫn** bị chặn.
- [ ] **S2** Nếu pptx có điều kiện riêng (outline rỗng) → lỗi đúng ngữ cảnh slide, không viện dẫn evidence báo cáo.
- [ ] Không nới lỏng gate báo cáo (test khẳng định html vẫn fail khi thiếu evidence).
- [ ] 4 gate xanh (`npm test`, `tsc --noEmit`).

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/use-export.ts` | MODIFY | cổng P0 điều kiện theo target; pptx không gate report-P0; (tùy) kiểm outline riêng |
| `src/modules/present/PresentPanel.tsx` | MODIFY nhẹ | microcopy xuất slide không viện dẫn P0 báo cáo |
| `src/modules/export/use-export.test.ts` | NEW/UPDATE | pptx pass khi report-P0; html vẫn fail; pptx-no-outline lỗi riêng |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Hiểu nhầm thành "bỏ gate" | High→mitigated | Test bắt buộc: html/pdf/docx **vẫn** fail P0; chỉ pptx được gỡ. Ghi rõ trong PR + index lock. |
| pptx thật vẫn cần vài điều kiện (outline/speaker) | Med | Thêm kiểm **tối thiểu liên quan slide** thay vì bỏ trắng; lỗi đúng ngữ cảnh. |
| Defense-in-depth cuối (`executeExport` ném lỗi) bị mất cho báo cáo | Med | Giữ nguyên nhánh ném lỗi cho target báo cáo; chỉ pptx đi nhánh khác. |

## 6. Verification Plan
- Bundle software-project **thiếu evidence** (P0) nhưng **có outline**: tab Slide → "Xuất PowerPoint" → **tải .pptx thành công**; tab Xuất bản → "Xuất HTML" → **vẫn** dialog chặn P0 (như W23-A).
- Bundle **không outline** → "Xuất PowerPoint" báo lỗi "Chưa có nội dung slide" (không viện dẫn evidence).
- 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve; docs commit trước, src/ sau.`
