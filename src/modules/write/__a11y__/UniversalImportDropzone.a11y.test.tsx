// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";
import { UniversalImportDropzone } from "../UniversalImportDropzone";

expect.extend(matchers);

afterEach(cleanup);

beforeEach(() => {
  if (typeof window !== "undefined") {
    if (!window.ResizeObserver) {
      window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
  }
});

async function assertNoViolations(container: HTMLElement) {
  const results = await axe(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });
  (expect(results) as unknown as { toHaveNoViolations: () => void }).toHaveNoViolations();
}

describe("UniversalImportDropzone A11y", () => {
  it("empty state has no critical a11y violations", async () => {
    const { container } = render(
      <UniversalImportDropzone imported={[]} onImported={() => {}} />
    );
    await assertNoViolations(container);
  });
});
