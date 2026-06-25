# AI Control Evidence - Week 11

This document provides architectural and behavioral evidence demonstrating that the AI Assistant features implemented in Week 11 adhere strictly to constraints of user content control, off-state behavior, and explicit actions.

---

## 1. Explicit Action Enforcement (No Auto-Run)

### Slides Outline Optimization
AI-assisted slide outline improvement runs **only** when the user explicitly triggers it by clicking the `AiOutlineButton` component.
- **Trigger Component**: [AiOutlineButton.tsx](file:///e:/ReportSupporter/src/modules/present/ai/AiOutlineButton.tsx) is rendered as a standalone button within the Slides Outline panel.
- **Integration**: In [PresentPanel.tsx](file:///e:/ReportSupporter/src/modules/present/PresentPanel.tsx), the `handleAiOutlineAssist` callback is mapped to the button's `onClick` event.
- **Verification**: Tests in [PresentPanel.test.tsx](file:///e:/ReportSupporter/src/modules/present/PresentPanel.test.tsx) verify that the button is present in the DOM structure with the expected click action handlers.

### Section Rewriting and Tone Improvement
- Calls to `rewriteSection` and `improveTone` are requested only upon explicit user triggers within the editor workspace (no automatic re-runs on key press or save).
- Results are kept in a local React state and do not mutate the `ReportSection` until accepted.

---

## 2. Default Off-State & No-Fetch Guarantees

When the AI flag is set to `enabled: false` (default state) or when no adapter is configured, the gateway is locked down. No network calls or adapter request methods are executed.

### Configuration Default
In [ai-config.ts](file:///e:/ReportSupporter/src/modules/write/ai/ai-config.ts), the default state is explicitly defined as `enabled: false`:
```typescript
export const DEFAULT_AI_CONFIG: AiConfig = {
  enabled: false,
};
```

### Gateway No-fetch Guard
In [ai-gateway.ts](file:///e:/ReportSupporter/src/modules/write/ai/ai-gateway.ts), `requestSuggestion` guards requests prior to any delegation:
```typescript
  // Guard: disabled (flag OFF) — no network
  if (!config.enabled) {
    return buildNoopSuggestion(action, input, "disabled");
  }

  // Guard: unconfigured — no network
  if (_adapter === null) {
    return buildNoopSuggestion(action, input, "unconfigured");
  }
```

### Module level Guards
In [assist-outline.ts](file:///e:/ReportSupporter/src/modules/present/ai/assist-outline.ts), [rewrite-section.ts](file:///e:/ReportSupporter/src/modules/write/ai/rewrite-section.ts), and [improve-tone.ts](file:///e:/ReportSupporter/src/modules/write/ai/improve-tone.ts), we verify gateway states before serialization:
```typescript
  const state = gateway.getGatewayState();

  if (state === "disabled" || state === "unconfigured") {
    return {
      id: crypto.randomUUID(),
      action: "...",
      original: ...,
      suggestion: "",
    };
  }
```

### UI Disabled States
- In [AiOutlineButton.tsx](file:///e:/ReportSupporter/src/modules/present/ai/AiOutlineButton.tsx), if the gateway state is `disabled` or `unconfigured`, the button is rendered with the `disabled` HTML attribute and annotated with a warning label: `⚠️ Bật AI trong cấu hình`.
- The user is completely blocked from triggering any AI functions unless they explicitly configure a provider in their local workspace.

---

## 3. Visual Review & Non-Destructive Accept/Reject Flow

All rewrite and tone suggestions are reviewed before they are saved to the document. This is governed by `SuggestionDiff` and `UserControlBar`.

### Visual Diff Presentation
The [SuggestionDiff.tsx](file:///e:/ReportSupporter/src/modules/write/ai/SuggestionDiff.tsx) component uses CSS variables to present differences clearly:
- **Original Content (Left Column)**: Highlighted with a subtle red border and background tint using the design system CSS token `var(--rs-color-error-bg)` (resolving to a HEX tint based on the error color) signifying deprecated/removed content.
- **AI Suggested Content (Right Column)**: Highlighted with a subtle green border and background tint using the system CSS token `var(--rs-color-success-bg)` (resolving to a HEX tint based on the success color) signifying proposed replacements.
- Parameterized by `AiAction` to display context-aware headers ("Cải thiện văn văn học thuật" vs. "So sánh đề xuất viết lại") dynamically without duplicating code structures.

### Persistent User Content Control Bar
The [UserControlBar.tsx](file:///e:/ReportSupporter/src/modules/write/ai/UserControlBar.tsx) ensures that user controls are visible during pending states:
- A text preview of the **Original Content** is displayed at all times.
- An **Undo** button (`↩️ Hoàn tác`) is shown as soon as the edited text diverges from the original. Clicking it restores the editor workspace content back to the original text.
- A **View Diff** entry point link is shown whenever an AI suggestion is waiting for verification.

### Verification of States in Tests
- **`ai-config.test.ts`**: Verifies that status checking helpers (`isAiReady`, `isAiUnconfigured`, `isAiDisabled`) respond correctly to localStorage modifications.
- **`ai-gateway.test.ts`**: Verifies that when the gateway is disabled or unconfigured, the registered adapter's `request` method is **never called** and returns a no-op suggestion.
- **`assist-outline.test.ts`**: Verifies that no fetching is initiated when config is unconfigured/disabled, and successfully maps serialized states when ready.
- **`rewrite-section.test.ts` & `improve-tone.test.ts`**: Verifies that suggestions do not mutate parameters, and that they return empty responses when config flags are disabled or unconfigured.
