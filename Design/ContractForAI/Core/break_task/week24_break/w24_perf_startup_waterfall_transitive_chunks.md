# Contract For AI — W24 Perf (K): Bỏ WorkspaceLoader Waterfall Sau Hydration · Giảm Critical Transitive Chunks

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Startup/loading performance.
> **Findings:**
> - **S1** (🔴) — route render `WorkspaceLoader`, rồi chỉ trong `useEffect` mới `import("./Workspace")`. Trình duyệt phải tải/hydrate loader trước khi bắt đầu lấy workspace chunk, tạo waterfall và màn “Đang nạp workspace cục bộ…” kéo dài.
> - **S2** (🟠) — build hiện báo Workspace `104.7 KiB / 450 KiB`, nhưng production manifest profiling thấy đường transitive `WorkspaceLoader -> Workspace` gồm 14 JS file, khoảng `1,924.7 KiB raw / 596.9 KiB gzip`. Budget route không thấy phần post-hydration này.
> - **S3** (🟠) — nhiều panel đã dynamic import đúng, nhưng critical `Workspace` vẫn kéo graph đủ lớn; chuyển sang static import mù có thể bỏ waterfall nhưng làm initial route phình, nên phải đo các phương án.
> **Builds on:** W30 route-level loader/lazy chunks (DONE nhưng acceptance tính thiếu transitive), O truthful gates.
> **Sources:** production resource timing 2026-07-18 + `WorkspaceLoader.tsx` hiện tại.

---

## 1. Micro-task Target

Cho browser biết critical workspace chunk **trước/đồng thời hydration**, đạt editor-ready sớm hơn mà không tải các panel Export/Import/Present/AI chưa dùng.

- **S0 — Compare designs.** Đo ít nhất: imperative effect hiện tại, `next/dynamic` route-level có preload, và server/page boundary tách shell + client workspace. Chọn theo editor-ready/resource waterfall/offline behavior, không theo bundle number đơn lẻ.
- **S1 — Eliminate hidden waterfall.** Không dùng `useEffect` làm trigger tải critical Workspace. Route/build phải phát preload/prefetch relation mà browser production thực sự dùng.
- **S2 — Critical graph split.** Audit imports trong Workspace; chỉ editor shell, active editor/preview path và project load là critical. Export/Import/Present/AI/settings/check panels giữ on-demand; tránh barrel import kéo code ngoài surface.
- **S3 — Loading/offline recovery.** Giữ accessible loading/error/retry; service-worker update/offline chunk mismatch không thành white screen. Retry không reload mất autosave.

> 🔒 Không “đạt KPI” bằng cách preload mọi panel. Báo riêng initial route, editor-ready critical transitive và on-demand feature bytes.
> 🔒 Không xóa offline chunk-error UX của `WorkspaceLoader` nếu chưa có tương đương.

## 2. Scope

### In scope
- [src/components/WorkspaceLoader.tsx](src/components/WorkspaceLoader.tsx), route `src/app/workspace/[projectId]/page.tsx` (MODIFY): route-level loading strategy/preload.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY imports/boundaries có bằng chứng): critical vs on-demand graph.
- Next build/bundle analysis scripts và production Playwright startup spec (UPDATE).
- PWA/offline E2E (UPDATE): cached workspace, stale chunk, retry.

### Out of scope
- ❌ Redesign workspace UI.
- ❌ Tối ưu pipeline sau editor-ready (I/J/P).
- ❌ Nâng budget để hợp thức hóa 596.9 KiB.

## 3. Checklist
- [ ] Network trace không còn `hydrate loader -> effect -> request Workspace` nối tiếp.
- [ ] Initial/critical/on-demand chunk sets được báo transitive, không double-count; optional panels không tải trước click.
- [ ] Editor-ready median/P75 cải thiện theo target đã baseline (tối thiểu 25% trên profile chuẩn) và không tăng long-task bootstrap.
- [ ] Offline cached load + chunk error retry accessible, không mất draft.
- [ ] Production build/E2E/bundle gate O xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/workspace/[projectId]/page.tsx` | MODIFY | preload/dynamic boundary |
| `src/components/WorkspaceLoader.tsx` | MODIFY/REMOVE | giữ equivalent loading/retry |
| `src/components/Workspace.tsx` | MODIFY | direct imports + chunk boundaries |
| `scripts/check-bundle-budget.mjs` | MODIFY qua O | transitive accounting |
| `e2e/workspace-performance.spec.ts` | NEW qua O | production resource/editor-ready proof |

> **Import boundary:** giữ optional feature modules dynamic; tránh root barrel có side effect.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Static import làm route ban đầu nặng hơn | High | So sánh 3 design; chọn preload/dynamic split dựa trace. |
| Preload optional chunks tăng data mobile | Med | Critical allowlist + request assertion trước user action. |
| SSR/client boundary gây hydration mismatch | Med | Production E2E console/hydration gate. |
| Offline release mới thiếu chunk | High | Service-worker/version fallback + retry không phá draft. |

## 6. Verification Plan
- Production trace cold cache: ghi TTFB, first workspace chunk request, DCL, editor-ready, total critical bytes; waterfall không có idle gap sau hydration.
- Repeat warm/offline cache và simulated Fast 3G/4× CPU: editor dùng được, loading được announce, retry hoạt động.
- Trước click panel: không có Export/Import/Present/AI chunks; sau click chỉ chunk tương ứng tải.
- So sánh baseline 2026-07-18 (`editorMs ~2182–2398`, transitive gzip ~596.9 KiB) bằng cùng fixture/hardware profile; lưu JSON artifact.

## 7. Status

`PROPOSED — phụ thuộc O để đo đúng; chưa thi công.`

