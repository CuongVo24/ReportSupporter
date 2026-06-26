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

  it("renders with a submit button and sticky footer warning note", () => {
    const onInitialize = vi.fn();
    
    // Call component function directly to inspect JSX element structure
    const element = ProjectInitializer({
      templates: mockTemplates,
      onInitialize,
    });

    expect(element).toBeDefined();
    expect(element.type).toBe("div"); // container div

    const cardDiv = element.props.children;
    expect(cardDiv.type).toBe("div"); // cardStyle div

    // Children of cardStyle div: [headerStyle div, formContainerStyle form]
    const [headerDiv, formEl] = cardDiv.props.children;
    expect(headerDiv.type).toBe("div");
    expect(formEl.type).toBe("form");

    // Children of formContainerStyle form: [scrollAreaStyle div, footerStyle div]
    const [scrollAreaDiv, footerDiv] = formEl.props.children;
    expect(scrollAreaDiv.type).toBe("div");
    expect(footerDiv.type).toBe("div");

    // Children of footerStyle div: [helperText p, button]
    const [helperP, submitButton] = footerDiv.props.children;
    expect(helperP.type).toBe("p");
    const [lightbulbIcon, textSpan] = helperP.props.children;
    expect(lightbulbIcon.type).toBe(Lightbulb);
    expect(textSpan.props.children).toContain("Bấm Khởi tạo để mở trình soạn thảo");

    expect(submitButton.type).toBe(Button);
    expect(submitButton.props.type).toBe("submit");
    expect(submitButton.props.children).toBe("Khởi tạo báo cáo");
  });
});
