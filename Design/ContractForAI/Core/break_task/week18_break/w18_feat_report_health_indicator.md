# Contract For AI — W18 Feat (A3): Chỉ Số "Sức Khỏe Báo Cáo" Luôn Hiện

> **Lane:** Core / break_task / week18_break.
> **Branch:** `w18/upgrade-ai` (nhánh chung cả tuần).
> **Type:** UX / continuous-feedback — finding **S1** (Med, "soát lỗi" hiện là **hành động thủ công** — `handleCheck` chạy `runChecker` rồi mới có `readinessScore` ([Workspace.tsx:133-142](src/components/Workspace.tsx#L133)); người dùng không thấy tình trạng cho tới khi bấm), **S2** (Low, tín hiệu chất lượng nằm rải ở 3 nơi: checker `readinessScore`, `weak-sections`, tỉ lệ claim có `evidence` — chưa gộp). Brainstorm 2026-06-28.
> **Builds on:** `runChecker`/`CheckResult.readinessScore`; `weak-sections` ([weak-sections.ts](src/modules/present/weak-sections.ts)); `evidence` module.
> **Sources:** Brainstorm 2026-06-28; `VoiceAndContent.md §7`.

---

## 1. Micro-task Target

Gộp các tín hiệu chất lượng thành **một chỉ số % "Sức khỏe báo cáo"** hiện thường trực trên header, cập nhật nhẹ (debounce) khi nội dung đổi; click để bung chi tiết và nhảy tới chỗ yếu.

- **S1 — Health aggregator (thuần).** Hàm `computeReportHealth(bundle, checkResult?)` → `{ score, breakdown[] }` gộp: `readinessScore` (checker), số `weak-sections`, tỉ lệ claim/section có minh chứng. Trọng số khai báo rõ, test được. Không chạy checker nặng mỗi keystroke — dùng kết quả `checkResult` gần nhất + heuristic nhẹ; debounce.
- **S2 — Health badge trên header.** Hiển thị % + màu trạng thái (token semantic), tooltip breakdown. Click → mở side panel "Soát lỗi" + cuộn tới mục yếu nhất (tái dùng `handleJump`).
- **S3 — Cập nhật phản ứng.** Recompute khi `bundle.project.sections`/`checkResult` đổi (debounce), không chặn gõ.

> 🔒 **Không chạy checker đầy đủ mỗi keystroke** — tránh giật; chỉ tổng hợp + heuristic nhẹ, debounce.
> 🔒 Không đổi public surface `CheckResult`; chỉ đọc. Token-only, giọng `§7`.

## 2. Scope

### In scope
- [src/modules/check/report-health.ts](src/modules/check/report-health.ts) (NEW): `computeReportHealth` thuần + breakdown.
- [src/modules/check/report-health.test.ts](src/modules/check/report-health.test.ts) (NEW): unit (trọng số, biên 0%/100%, thiếu minh chứng).
- [src/components/ReportHealthBadge.tsx](src/components/ReportHealthBadge.tsx) (NEW): badge + tooltip breakdown.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): đặt badge ở header (`primaryAction`/cạnh title), nối click → side panel + jump, debounce recompute.
- [src/app/globals.css](src/app/globals.css) (MODIFY): style badge (token semantic).

### Out of scope
- ❌ Đổi thuật toán checker hiện có (chỉ đọc kết quả).
- ❌ Gợi ý AI khắc phục (đó là present hints / B).

## 3. Checklist
- [ ] **S1** `computeReportHealth` gộp 3 tín hiệu, test biên.
- [ ] **S2** Badge % + màu trạng thái + tooltip breakdown; click nhảy tới mục yếu nhất.
- [ ] **S3** Recompute debounce khi nội dung đổi, không giật gõ. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/check/report-health.ts` | NEW | aggregator thuần |
| `src/modules/check/report-health.test.ts` | NEW | unit |
| `src/components/ReportHealthBadge.tsx` | NEW | badge header |
| `src/components/Workspace.tsx` | MODIFY | đặt badge + debounce + jump |
| `src/app/globals.css` | MODIFY | style (token) |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Recompute nặng gây giật gõ | High | Debounce + chỉ tổng hợp nhẹ, không chạy full checker mỗi phím. |
| Trọng số gây hiểu nhầm % | Med | Breakdown minh bạch trong tooltip; test trọng số. |
| Màu không đủ tương phản | Low | Dùng token semantic + nhãn chữ kèm màu (a11y). |

## 6. Verification Plan
- Báo cáo rỗng → ~0%; đầy đủ + có minh chứng → cao; thêm lỗi → giảm.
- Click badge → side panel "Soát lỗi" mở + cuộn tới mục yếu.
- Gõ liên tục không giật; 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w18/upgrade-ai`): `feat(check): always-on report health score aggregating checker/weak-sections/evidence`.
