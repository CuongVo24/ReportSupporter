# Contract For AI - W7 Group C: References Section Rules

> **Lane / Week:** Core / Month 2 / W7 - Day 3 (`Design/TaskBrief/Core/month2/w7.md` `[C80]`-`[C81]`).
> **Branch:** `feature/W7-format-hardening`.
> **Builds on:** W3 checker engine (`CheckRule`/`CheckContext`/`ReportIssue`), `src/modules/check/registry.ts` (`RULES_REGISTRY`), `src/modules/check/rules/utils.ts`.
> **Depended on by:** Group E (QA), W8 submission quality gate.
> **Sources:** `w7.md` Locked Decisions #4/#7, `week7.md` Day 3, `3.Check.md`, `CanonicalTypes.md §6`.

---

## 1. Micro-task Target

Thêm **rule kiểm tra mục Tài liệu tham khảo (References)** ở mức cơ bản: mục rỗng, entry rỗng/hỏng rõ ràng, thứ tự — mỗi issue kèm `suggestion`. **Không** ép citation style.

> **🔒 Cơ bản, gợi ý, không khắt khe (Locked #4).** Chỉ rỗng/hỏng/thứ tự; không parser APA/IEEE → tránh false-positive.
> **🔒 Đăng ký ở `registry.ts` (Locked #7).** Rule mới thêm vào `RULES_REGISTRY` (`src/modules/check/registry.ts`) — **không** `run-checker.ts` (file này chỉ chạy registry).

## 2. Scope

### In scope (`[C80]`/`[C81]`)
- `src/modules/check/rules/references.ts` (NEW): `export const referencesRule: CheckRule` — phát hiện: mục References tồn tại nhưng rỗng; entry rỗng/quá ngắn/hỏng rõ ràng; (tuỳ) thứ tự không nhất quán. Severity `warning`; mỗi issue có `suggestion` tiếng Việt. Đọc `ctx.sectionAsts` (như rule khác); offline.
- `src/modules/check/registry.ts` (MODIFY): import + thêm `referencesRule` vào `RULES_REGISTRY` (đúng nhóm thứ tự).
- Vitest: `references.test.ts` — References rỗng → warning; entry hỏng → warning; References đầy đủ hợp lệ → **0** issue (no false-positive); không gọi mạng.

### Out of scope
- ❌ Citation-style engine (APA/IEEE parser) — Out of scope.
- ❌ Caption/LoF/LoT (Groups A/B).
- ❌ PDF page-break (Group D).
- ❌ Sửa `run-checker.ts` để đăng ký (đăng ký ở `registry.ts`).
- ❌ Đổi shape `ReportIssue`/`CheckRule` (canonical §6).
- ❌ Dep mới.

## 3. Checklist
- [ ] `references.ts`: phát hiện rỗng/entry hỏng/thứ tự; mỗi issue có `suggestion`.
- [ ] Severity hợp lý (`warning`); không ép citation style.
- [ ] Đăng ký `referencesRule` trong `RULES_REGISTRY` (`registry.ts`).
- [ ] `references.test.ts`: rỗng → warn; hỏng → warn; hợp lệ → 0 issue; no network.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/check/rules/references.ts
import type { CheckRule } from "@/types";
export const referencesRule: CheckRule;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/check/rules/references.ts` | NEW | ~90 |
| `src/modules/check/registry.ts` | MODIFY | ~+3 (đăng ký) |
| `src/modules/check/rules/references.test.ts` | NEW | ~70 |

> **Import boundary:** rule import `@/types` + `./utils`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Rule quá khắt khe → false positive | Medium | Chỉ rỗng/hỏng/thứ tự, có suggestion; không ép style (Locked #4). |
| Đăng ký nhầm ở `run-checker.ts` | Low | Đăng ký ở `RULES_REGISTRY` (`registry.ts`) (Locked #7). |
| Đổi shape `ReportIssue` (drift) | Low | Dùng canonical §6; không thêm field. |
| Test phụ thuộc network | Low | Rule offline; không có fetch để mock. |

## 6. Verification Plan
- Section "Tài liệu tham khảo" rỗng → `references` warning + suggestion.
- Entry rỗng/quá ngắn → warning.
- References hợp lệ (vài entry đầy đủ) → **0** issue.
- `RULES_REGISTRY` chứa `referencesRule`; run-checker chạy nó.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(check): references section rules + register in registry`; +1 docs commit.
