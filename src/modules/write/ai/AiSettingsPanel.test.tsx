import { describe, it, expect, vi } from "vitest";
import { AiSettingsDialog } from "./AiSettingsPanel";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (init: unknown) => [
      typeof init === "function" ? (init as () => unknown)() : init,
      vi.fn(),
    ],
    useEffect: vi.fn(),
    useRef: () => ({ current: null }),
    useId: () => "mock-id",
  };
});

vi.mock("./ai-config", () => ({
  loadAiConfig: () => ({ enabled: false }),
  saveAiConfig: vi.fn(),
}));

describe("AiSettingsDialog component", () => {
  it("renders correctly when open", () => {
    const onOpenChange = vi.fn();
    const element = AiSettingsDialog({
      isOpen: true,
      onOpenChange,
    });

    expect(element).toBeDefined();
    expect(element.type).toBe(Dialog);
    expect(element.props.isOpen).toBe(true);

    const footer = element.props.footer;
    expect(footer).toBeDefined();
    
    const [cancelBtn, saveBtn] = footer.props.children;
    expect(cancelBtn.type).toBe(Button);
    expect(saveBtn.type).toBe(Button);
  });
});
