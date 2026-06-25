# 🗺️ INFORMATION ARCHITECTURE — Bản đồ route → màn

> **STATUS: ✅ SPEC.** **AI RULE:** Một nguồn duy nhất cho "app có những màn nào, đi tới nhau ra sao". **Workspace-first** — route `/` là editor, KHÔNG landing (`Guideline.md`, `Modules/1.Write.md` §1).

---

## 1. Sơ đồ route (Next.js app)

| Route | Màn | Ghi chú |
| :--- | :--- | :--- |
| `/` | **Workspace** (report đang mở / template picker nếu rỗng) | màn chính & mặc định |
| `/` (rỗng) | tự mở **template picker** | không có landing/marketing (§10) |
| (báo cáo) | chuyển report qua **switcher** trên toolbar | report sống local IndexedDB; không route riêng mỗi report ở MVP |

> MVP **không** có: trang marketing, danh sách report riêng, settings nặng. Giữ tối giản (Non-goals §10). Nếu sau này thêm "danh sách report", nó là overlay/switcher, không phá workspace-first.

## 2. Module = tab trong workspace, KHÔNG phải route riêng

Write / Format / Check (người soát) / Export / Present là **panel/tab trong rail**, không phải trang riêng — giữ người dùng trong một "bàn làm việc" liên tục (chữ ký §12, AppShell `Tabs`):

```
/  (workspace)
├── Bàn viết + Tờ nộp        (Write — Module 1, luôn hiện)
└── Rail phải (Tabs)
    ├── Người soát            (Check — Module 3)
    ├── Ra bản nộp            (Export — Module 4)
    └── Thuyết trình          (Present — Module 5, Phase 3)
```

## 3. Điều hướng & trạng thái cấp app

- **Chuyển report:** switcher toolbar (dropdown), không rời route.
- **Vào module:** đổi tab rail (phím ←/→, `Tabs`), không reload.
- **Rỗng cấp app** (chưa có report nào): `3.Patterns/EmptyStates.md` (Màn 1 của `5.Flows/Write.md`).
- **Lỗi đọc dữ liệu cấp app:** banner shell (`AppShell.md` §4, `ErrorStates.md`).

## 4. 📎 Cross-refs
- `AppShell.md` · `5.Flows/*` (chi tiết từng màn) · `3.Patterns/EmptyStates.md` · `Guideline.md` (workspace-first) · `Modules/1.Write.md` §1.
