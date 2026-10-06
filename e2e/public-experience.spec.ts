import { expect, test } from "@playwright/test";

test("public home, discovery, and membership pages render the Teens2Inspire brand", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Teens2Inspire/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /membership/i }).first()).toBeVisible();
  await page.goto("/membership");
  await expect(page.getByRole("heading", { name: /make it yours/i })).toBeVisible();
  await page.goto("/discover");
  await expect(page.getByRole("search")).toBeVisible();
  await expect(page.getByLabel("Sort stories")).toBeVisible();
});

test("login and signup have accessible required fields", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await page.goto("/signup");
  await expect(page.getByLabel("First name")).toBeVisible();
  await expect(page.getByLabel(/at least 13 years old/i)).toBeVisible();
});

test("member pages protect the dashboard and admin tools", async ({ page }) => {
  await page.goto("/v2/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goto("/v2/admin");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("page has no horizontal overflow or emoji UI at the current viewport", async ({ page }) => {
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth, text: document.body.innerText }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.text).not.toMatch(/\p{Extended_Pictographic}/u);
});
