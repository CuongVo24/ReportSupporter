import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function resetLibrary(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase("reportsupporter");
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  });
  await page.reload();
}

test("project library supports create, search, duplicate, trash and restore", async ({ page }) => {
  await resetLibrary(page);
  await expect(page.getByRole("heading", { name: "Thư viện dự án" })).toBeVisible();

  await page.getByRole("button", { name: "+ Dự án mới" }).click();
  await expect(page).toHaveURL(/\/workspace\//);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Nhân bản" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Tìm dự án" }).fill("Báo cáo");
  await expect(page.getByRole("button", { name: "Nhân bản" })).toBeVisible();

  await page.getByRole("button", { name: "Nhân bản" }).click();
  await expect(page.getByRole("button", { name: "Đưa vào Thùng rác" })).toHaveCount(2);
  await page.getByRole("button", { name: "Đưa vào Thùng rác" }).first().click();
  await page.getByRole("tab", { name: "Thùng rác" }).click();
  await expect(page.getByRole("button", { name: "Khôi phục" })).toBeVisible();
  await page.getByRole("button", { name: "Khôi phục" }).click();
  await expect(page.getByText(/Thùng rác đang trống/i)).toBeVisible();
});

test("library is keyboard reachable, responsive and has no serious axe violations", async ({ page }) => {
  await resetLibrary(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});
