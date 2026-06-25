# Contract For AI - W12 Group B: Export Validation

> **Lane / Week:** Core / Month 3 / W12 - Day 2 (`Design/TaskBrief/Core/month3/w12.md` `[C128]`-`[C129]`).
> **Branch:** `feature/W12-beta-readiness`.
> **Builds on:** W4 exporters (HTML/PDF/DOCX), W6 templates (software/lab/internship), W7 caption/page-break/cover parity.
> **Depended on by:** Group E (acceptance), W14 (export panel adoption trên exporter ổn định).
> **Sources:** `w12.md` Locked #1/#4, `MasterRoadMap.md` W12, `0.ArtDirection.md §2` (report deterministic).

---

## 1. Micro-task Target

Validate **HTML/PDF/DOCX** trên ≥3 sample report đa template; phát hiện lệch (caption/page-break/cover) và **localized fix** exporter có kiểm soát. Báo cáo deterministic bất biến.

> **🔒 Báo cáo deterministic bất biến (Locked #4).** Không đụng `--rs-report-*`/pipeline trừ khi validation lộ lệch; fix cục bộ.

## 2. Scope

### In scope (`[C128]`/`[C129]`)
- Validate export 3 format trên ≥3 template (software/lab/internship W6): caption parity, page-break, cover.
- `src/modules/export/**` (MODIFY — chỉ nếu lệch): localized fix; không đổi job shape/CanonicalTypes.
- `Design/Reports/Month3/W12/export_validation.md` (**NEW**): kết quả đa template + lệch đã sửa.

### Out of scope
- ❌ Tính năng export mới; bật PPTX (`pptxgenjs` deferred).
- ❌ Đổi `--rs-report-*`/pipeline ngoài localized fix.

## 3. Checklist
- [ ] Validate HTML/PDF/DOCX trên ≥3 template.
- [ ] Caption/page-break/cover parity (preview ↔ PDF ↔ DOCX).
- [ ] Localized fix nếu lệch; không đổi shape.
- [ ] `export_validation.md` đầy đủ; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/**` | MODIFY (chỉ nếu lệch) | localized fix |
| `Design/Reports/Month3/W12/export_validation.md` | NEW | kết quả đa template |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Export lệch trên template ít test | Medium | Validate đa template W6; sửa có kiểm soát (Locked #4). |
| Fix export phá deterministic | High | Không đụng `--rs-report-*`; verify parity sau fix. |
| Bật nhầm PPTX | Low | Giữ deferred. |

## 6. Verification Plan
- 3 template → export 3 format; đối chiếu caption/page-break/cover.
- Re-export cùng input → output ổn định (deterministic).
- 4 gates xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(export): localized parity fixes (multi-template)`; `docs(w12): export validation report`; `docs(w12): commit w12b contract`.
