import { expect, test } from "@playwright/test";

test("media homepage renders the real content experience", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Teens2Inspire/);
  await expect(page.getByRole("link", { name: "Teens2Inspire home" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeAttached();
  await expect(page.getByRole("link", { name: "Library" })).toHaveAttribute("href", "/saved");
});

test("search and content category pages render", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: /search teens2inspire/i })).toBeVisible();
  await page.goto("/listen");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/watch");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("member library and account require authentication", async ({ page }) => {
  await page.goto("/saved");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("mobile homepage has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
