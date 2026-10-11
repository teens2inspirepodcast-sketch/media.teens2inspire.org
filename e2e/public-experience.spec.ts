import { expect, test } from "@playwright/test";

test("logged-out visitors see the sign-in screen, not the media catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByText(/use the same account you created/i)).toBeVisible();
});

test("login screen links account creation to the public website", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "https://teens2inspire.org/join");
});

test("private routes redirect signed-out visitors to login", async ({ page }) => {
  for (const route of ["/search", "/listen", "/watch", "/saved", "/account", "/admin"]) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp("\\/login\\?next="));
  }
});

test("mobile login screen has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
