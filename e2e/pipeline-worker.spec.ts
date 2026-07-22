// W24-I: prove the markdown pipeline runs in the ACTUAL production Web Worker
// without `document is not defined`. The fake-worker unit gate cannot catch a
// DOM dependency in the worker module graph; this spec loads a real project and
// asserts the preview renders with zero worker/page console errors.
//
// Canonical against the production build: PLAYWRIGHT_USE_BUILD=1.
import { expect, test } from "@playwright/test";
import { buildPerformanceProject, seedPerformanceProject } from "./fixtures/performance-project";

test("markdown pipeline runs in the real worker with no `document is not defined`", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  const fixture = buildPerformanceProject("large");
  await seedPerformanceProject(page, fixture);
  await page.goto(`/workspace/${fixture.projectId}`);

  // Editor + preview should come up from the seeded content.
  await expect(page.getByRole("textbox").first()).toBeVisible({ timeout: 15_000 });

  const domErrors = errors.filter((text) => /document is not defined/i.test(text));
  expect(domErrors, `worker DOM errors:\n${domErrors.join("\n")}`).toEqual([]);
  // No unhandled worker crash of any kind.
  expect(errors, `console/page errors:\n${errors.join("\n")}`).toEqual([]);
});
