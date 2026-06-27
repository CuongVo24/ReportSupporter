import { describe, it, expect, vi } from "vitest";
import { ProjectInitializer } from "./ProjectInitializer";
import type { TemplateSchema } from "@/types";
import { Button } from "@/components/ui";
import { Lightbulb } from "lucide-react";

// Mock React hooks to allow direct invocation of the component function in pure Node
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const val = typeof initial === "function" ? (initial as () => unknown)() : initial;
      return [val, vi.fn()];
    },
  };
});

describe("ProjectInitializer UX Structure", () => {
  const mockTemplates: TemplateSchema[] = [
    {
      id: "template-1",
      name: "Báo cáo Kỹ thuật",
      description: "Mẫu báo cáo kỹ thuật tiêu chuẩn.",
      sections: [],
      metadataFields: [],
      requiredSections: [],
      requiredEvidenceKinds: [],
      requiresToc: true,
    },
  ];

  it("renders with a submit button in template mode", () => {
    const onInitialize = vi.fn();
    const onStartBlank = vi.fn();
    const onImportMarkdown = vi.fn();
    
    // Call component function directly to inspect JSX element structure
    const element = ProjectInitializer({
      templates: mockTemplates,
      onInitialize,
      onStartBlank,
      onImportMarkdown,
    });

    expect(element).toBeDefined();
    expect(element.type).toBe("div"); // container div

    const cardDiv = element.props.children;
    expect(cardDiv.type).toBe("div"); // cardStyle div

    // Children of cardStyle div: [headerStyle div, tabContainerStyle div, formContainerStyle div]
    const [headerDiv, tabContainerDiv, formEl] = cardDiv.props.children;
    expect(headerDiv.type).toBe("div");
    expect(tabContainerDiv.type).toBe("div");
    expect(formEl.type).toBe("div");

    // Children of formContainerStyle div: [scrollAreaStyle div, footerStyle div]
    const [scrollAreaDiv, footerDiv] = formEl.props.children;
    expect(scrollAreaDiv.type).toBe("div");
    expect(footerDiv.type).toBe("div");

    // In template mode, footer contains the submit button
    const submitButton = footerDiv.props.children;
    expect(submitButton.type).toBe(Button);
    expect(submitButton.props.type).toBe("button");
    expect(submitButton.props.children).toBe("Tạo báo cáo");
  });
});
