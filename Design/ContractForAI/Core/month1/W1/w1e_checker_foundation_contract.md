# Contract For AI — W1 Group E: Checker Foundation (text-based subset)

> **Lane / Week:** Core / Month 1 / W1 — Day 4 (`Design/TaskBrief/Core/month1/w1.md` `[C10]`–`[C12]`).
> **Branch:** `feature/W1-project-bootstrap`.
> **Builds on:** Group C (`src/types/*` — `ReportIssue`, `ReportIssueSeverity`, `ReportProjectBundle`) + Group D (`Workspace.tsx`, `WorkspaceLayout` side-panel slot).
> **Sources:** `Design/Modules/3.Check.md` §2/§5.2/§9 · `TaskBrief/Core/month1/w1.md` §W1-Locked-Decision #3 · `CanonicalTypes.md` §6 · `DesignSystem_Tokens.md` §7b (a11y) · `Coding & Git Standard.md` §4b/§6c.

---

## 1. Micro-task Target

Cho người dùng một nút **"Check"** chạy **offline, đồng bộ trên main-thread**, quét **2 rule văn bản thuần** trên Markdown thô của mọi section và trả `ReportIssue[]` nhóm theo `severity` ngay trong side panel. Đây là **nền móng**, **KHÔNG** phải canonical engine — chứng minh vòng *edit → check → thấy issue* chạy được, để W3 thay bằng engine AST mà không phải đập call-site.

## 2. Scope

### In scope (`[C10]`/`[C11]`/`[C12]`)
- `[C10]` Tiêu thụ `ReportIssue` (Group C, `CanonicalTypes §6`) — **không** định nghĩa lại type.
- `[C11]` **2 rule text-based** (chạy trên `string`, regex được phép vì là check văn bản thuần — `3.Check.md §5.2`):
  - `placeholder-text` (warning): tìm `TODO`, `fix later`, `lorem ipsum` (case-insensitive).
  - `code-block-no-lang` (warning): fenced code (```` ``` ````) không khai báo ngôn ngữ.
- `[C12]` `run-checker.ts` gom rule → `ReportIssue[]` (gắn `sectionId` theo từng section, `module:"check"`), **main-thread sync** (`OptimizePerformance §0` — chưa worker).
- `CheckerPanel.tsx` presentational: group `error → warning → info`, a11y (icon/nhãn + bàn phím).
- Wire vào `Workspace.tsx`: nút "Check" trong side panel → set issues → render panel.
- Vitest cho **cả 2** rule (deterministic, regression-safe — `3.Check.md §9`).

### Out of scope (chặn scope-creep — `Rule.md §6`, `TaskBrief §3`)
- ❌ **Canonical engine** `CheckRule`/`CheckContext`/`CheckResult`/`sectionAsts` → **W3**.
- ❌ **unified/remark/mdast** + mọi rule AST (`broken-image`, `skipped-heading-level`, `missing-conclusion`, `hardcoded-heading-number`, `table-too-wide`, …) → **W3**.
- ❌ **Readiness score** (`3.Check.md §5.3` ghi rõ *draft — W3*).
- ❌ Jump-to-issue (con trỏ nhảy tới `line`) → sau; W1 chỉ hiển thị.
- ❌ Auto-run/debounce sau edit → W1 chạy khi bấm nút.
- ❌ Lib mới — chỉ `react`, `zod` (đã cài). **Không** `unified`.

## 3. Checklist
- [ ] `src/modules/check/rules/text-markers.ts`: export `placeholderTextRule` (id `"placeholder-text"`, severity `"warning"`), chữ ký `(markdown: string) => ReportIssue[]`; mỗi match → issue (`module:"check"`, `suggestion` từ catalog §5.2), best-effort `line`. Không `sectionId` (runner gắn).
- [ ] `src/modules/check/rules/code-language.ts`: export `codeLanguageRule` (id `"code-block-no-lang"`, severity `"warning"`); phát hiện fence mở ```` ``` ```` không kèm token ngôn ngữ; bỏ qua fence đã đóng đúng có lang.
- [ ] `src/modules/check/run-checker.ts`: `runChecker(bundle: ReportProjectBundle): ReportIssue[]` — lặp `project.sections`, chạy mọi rule trên `section.markdown`, gắn `sectionId`, nối kết quả. Thuần, không I/O, không network.
- [ ] `src/modules/check/CheckerPanel.tsx`: presentational, props `{ issues: ReportIssue[]; onRun: () => void; hasRun: boolean }`. Group theo severity; severity kèm **icon + nhãn chữ** (không chỉ màu — `DesignSystem §7b`); item có `message` + `suggestion`. Empty-state khi `hasRun && issues.length===0`.
- [ ] `src/modules/check/index.ts`: export `runChecker`, `CheckerPanel`, (tùy) `placeholderTextRule`/`codeLanguageRule`.
- [ ] `src/components/Workspace.tsx` (MODIFY): state `issues`/`hasRun`; `handleCheck` gọi `runChecker(bundle)`; render `<CheckerPanel>` trong side panel (dưới switcher + save-status). Giữ < 200 dòng.
- [ ] `src/app/globals.css` (MODIFY): vài rule `.ws-checker-*`, chỉ `var(--rs-*)`.
- [ ] Tests: `rules/text-markers.test.ts` + `rules/code-language.test.ts` — match → đúng issue; sạch → `[]`; id/severity đúng catalog.

## 4. Expected Interfaces / Files

```ts
// src/modules/check/rules/text-markers.ts
export const placeholderTextRule: { id: "placeholder-text"; severity: "warning";
  run: (markdown: string) => ReportIssue[] };
// src/modules/check/rules/code-language.ts
export const codeLanguageRule: { id: "code-block-no-lang"; severity: "warning";
  run: (markdown: string) => ReportIssue[] };
// src/modules/check/run-checker.ts
export function runChecker(bundle: ReportProjectBundle): ReportIssue[];
```

| File | NEW/MODIFY | Ước lượng dòng |
|---|---|---|
| `src/modules/check/rules/text-markers.ts` | NEW | ~40 |
| `src/modules/check/rules/code-language.ts` | NEW | ~45 |
| `src/modules/check/run-checker.ts` | NEW | ~35 |
| `src/modules/check/CheckerPanel.tsx` | NEW | ~60 |
| `src/modules/check/index.ts` | NEW | ~5 |
| `src/modules/check/rules/text-markers.test.ts` | NEW | ~30 |
| `src/modules/check/rules/code-language.test.ts` | NEW | ~30 |
| `src/components/Workspace.tsx` | MODIFY | +~30 |
| `src/app/globals.css` | MODIFY | +vài rule |

> **Import boundary (`Coding & Git Standard §4b`):** `check/*` → **chỉ** `@/types`. `Workspace` (components) → `@/modules/check` (public surface) + `@/modules/write` + `@/types`. `CheckerPanel` presentational, không gọi `runChecker` (Workspace gọi rồi truyền `issues`). Không cycle với `write`.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Over-build canonical engine sớm (sai W1) | Cao | Chỉ 2 rule text + `runChecker` phẳng; `CheckRule/Context/AST/score` để W3 (`TaskBrief §3`) |
| Kéo `unified`/mdast vào sớm | Cao | Rule nhận `string`, regex thuần; **không** import pipeline |
| `placeholder-text` báo nhầm `TODO` trong code mẫu | TB | W1 text-thuần chưa loại trừ `code` node → ghi chú **known limitation**, tinh chỉnh ở W3 (AST); giữ severity `warning` (`3.Check.md §6`) |
| Rule id lệch catalog → vỡ test/`ReportIssue.id` | TB | Hard-code đúng `"placeholder-text"`/`"code-block-no-lang"` (`§5.2`); test khẳng định id |
| Severity chỉ phân biệt bằng màu (vi phạm a11y) | TB | Kèm icon + nhãn chữ `error/warning/info` + điều hướng bàn phím (`DesignSystem §7b`) |
| Có rule lỡ gọi mạng | Cao | Thuần hàm trên string/bundle; **không** `fetch`/URL — offline tuyệt đối (`3.Check.md HARD RULE`) |
| `Workspace.tsx` vượt 200 dòng | TB | Chỉ +state + nút + render panel (~30 dòng); logic group nằm trong `CheckerPanel` |

## 6. Verification Plan
- **Gates:** `npm run lint` · `npm run typecheck` · `npm run build` xanh · `npm test` xanh (kèm 2 file test rule mới).
- **Unit (`3.Check.md §9`):**
  - `placeholder-text`: body chứa `TODO`/`lorem ipsum` → 1+ issue id `placeholder-text` severity `warning`; body sạch → `[]`.
  - `code-block-no-lang`: fence ` ``` ` không lang → issue `code-block-no-lang`; ` ```ts ` → `[]`.
  - Offline: rule chỉ tính trên input, không network.
- **Manual acceptance:**
  - Bấm "Check" → issue hiện trong side panel, group error/warning/info.
  - Sửa hết placeholder → bấm lại → empty-state "Không phát hiện vấn đề".
  - Re-run trên cùng nội dung → cùng tập issue (idempotent).
- **Browser proof:** `preview_*` chạy dev server, screenshot trạng thái *gõ TODO + fence no-lang → Check → 2 warning*.

## 7. Status

**DONE** — gates xanh (lint · typecheck · test 16/16) + compile thành công. `next build` end-to-end bị chặn bởi RAM máy (213MB free), không phải lỗi code.

> ⛔ Theo `VibeCode.md` Step 2: đã tạo Contract → **dừng, không chạm `src/`**. Chờ "Approve" mới sinh code.
> Đề xuất chia 2 commit (≤200 dòng/lần): (1) `rules/*` + `run-checker` + 2 test → (2) `CheckerPanel` + `index.ts` + wire `Workspace`/`globals.css`. Commit kèm chính file contract này.
