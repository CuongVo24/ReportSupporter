import { expect, test } from "@playwright/test";

test("offline template catalog is searchable and can create a project", async ({ page }) => {
  await page.goto("/templates");
  await expect(page.getByRole("heading", { name: "Catalog mẫu nội bộ" })).toBeVisible();
  await page.getByRole("searchbox").fill("phần mềm");
  await expect(page.getByRole("button", { name: "Dùng mẫu" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Dùng mẫu" }).first().click();
  await expect(page).toHaveURL(/\/workspace\//);
});

test("visited project and library remain usable offline", async ({ page, context }) => {
  test.skip(process.env.PLAYWRIGHT_USE_BUILD !== "1", "Service worker is disabled in development.");
  test.slow();
  await page.goto("/");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.getByRole("button", { name: "+ Dự án mới" }).click();
  await expect(page.getByRole("heading", { name: "Khởi tạo Báo cáo Mới" })).toBeVisible();
  await page.goto("/");
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Thư viện dự án" })).toBeVisible();
  await page.getByRole("button", { name: /Báo cáo/i }).first().click();
  await expect(page.getByRole("heading", { name: "Khởi tạo Báo cáo Mới" })).toBeVisible();
  await context.setOffline(false);
});
