# Week 13 QA Report: UI Primitives & Visual Gallery

This report summarizes the implementation, testing, and accessibility (a11y) validation of the 8 core UI primitives built for **ReportSupporter** during Week 13.

---

## 1. Executive Summary
- **Status:** **PASS**
- **Artifacts Verified:** Button, Badge, Input, Textarea, Select, Dialog, Toast, Tabs.
- **Visual Validation:** Interactive dev-only gallery compiled and verified under both light and dark mode toggles.
- **Verification Gates:**
  - `npm run lint`: **PASS**
  - `npm run typecheck`: **PASS**
  - `npm run test` (377 unit tests): **PASS**
  - `npm run build` (Next.js production build): **PASS**

---

## 2. Definition of Done (DoD) Checklist

| DoD Requirement | Status | Verification Detail |
| :--- | :---: | :--- |
| **Strict Token-Only Styles** | ✅ PASS | Verified zero hardcoded hex colors or direct px values. All styles reference `--rs-*` design tokens. |
| **No External UI Libs** | ✅ PASS | Core Radix UI hooks/primitives utilized headless; CSS written manually. |
| **Complete State/Variant Map** | ✅ PASS | Covered hover, active, disabled, loading, invalid, and default states for all 8 elements. |
| **Accessibility (A11y) Standards** | ✅ PASS | Focus-visible ring implemented on all focusable primitives. Appropriate keyboard handlers, role definitions, and ARIA labels. |
| **File Sizes $\le$ 200 Lines** | ✅ PASS | All source component and style files adhere to the strict 200-line constraint. |
| **Gated Visual Gallery** | ✅ PASS | Gated under `/ui-gallery` within the client-side `(dev)` routing group, completely omitted from production nav. |

---

## 3. Primitives Coverage Matrix

| Component | Variants | States Covered | A11y / Keyboard |
| :--- | :--- | :--- | :--- |
| **Button** | `primary`, `secondary`, `ghost`, `danger`, `sm` size | Normal, Hover, Focus, Active, Disabled, Loading | `role="button"`, `aria-busy` |
| **Badge** | `severity` (error/warning/info), `status`, `readiness` | Clickable/interactive states | `role="button"` (when clickable) |
| **Input** | Default, With leading icon | Normal, Hover, Focus, Invalid (error state), Disabled | `aria-invalid`, associated `<label>` |
| **Textarea** | Default, autoGrow, showCharCount | Normal, Focus, Invalid, Character Limit Exceeded | `aria-invalid`, character count readouts |
| **Select** | Dropdown option list | Open, Closed, Focused Option, Disabled, Selected | Radix keyboard support (Space/Arrows/Enter) |
| **Dialog** | `modal`, `drawer` (slide out), `confirm` | Open, Closed, Focus-trapped, Backdrop-close block | Radix focus trap, `Esc` exit, outside click blocker |
| **Toast** | `success`, `info`, `error` | Auto-dismissing (4s for success/info), Non-dismissing (error) | `role="status"`, `role="alert"` (error), viewport focus |
| **Tabs** | `underline`, `segmented` | Active, Inactive, Badge Counts (error/warning/neutral) | Keyboard Arrow Left/Right, Home/End, `aria-selected` |

---

## 4. Accessibility (A11y) Verification

1. **Focus Ring Visibility:**
   - Universal focus indicator style: `outline: 2px solid var(--rs-color-focus-ring) !important; outline-offset: 2px;`.
   - Focus is only visible on keyboard navigation (`:focus-visible`).
2. **Keyboard Reachability:**
   - Tabs can be toggled using `Left/Right` arrow keys.
   - Dialog locks focus inside and restores focus to the trigger button when closed.
   - Select option list is fully keyboard-navigable.
3. **Screen Readers:**
   - Count badges on Tab triggers use descriptive screen-reader labels (`countAriaLabel` default to `"{count} mục"`).
   - Dialog close buttons utilize `aria-label="Đóng"` while hiding the icons with `aria-hidden="true"`.
4. **Motion Preference:**
   - Media query `@media (prefers-reduced-motion: reduce)` disables scale animations, slide actions, and transition timing to avoid motion sickness.

---

## 5. Visual QA & Screenshots

Interactive gallery renders correctly under both themes.

### Light Mode Gallery View
![Gallery Light Mode](file:///E:/ReportSupporter/Design/Reports/Month4/W13/gallery_light.png)

### Dark Mode Gallery View
![Gallery Dark Mode](file:///E:/ReportSupporter/Design/Reports/Month4/W13/gallery_dark.png)

---

## 6. Build Logs Reference
Full validation outputs and Next.js static asset details can be viewed in the accompanying [build_output.txt](file:///E:/ReportSupporter/Design/Reports/Month4/W13/build_output.txt).
