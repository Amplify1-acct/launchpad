import { test, expect } from "@playwright/test";

// ─── Homepage loads ───────────────────────────────────────────
test("homepage loads with correct title and hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/LaunchPad/);
  await expect(page.getByText("Not DIY. DIFY")).toBeVisible();
  await expect(page.getByText("Do it for me")).toBeVisible();
});

test("all nav links are present", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "How it works" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Services" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pricing" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Contact" })).toBeVisible();
});

test("nav CTA scrolls to contact form", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Do it for me/i }).click();
  await expect(page.getByText("Ready to stop doing it yourself")).toBeVisible();
});

// ─── Demo section ─────────────────────────────────────────────
test("demo section is visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Watch your business go live")).toBeVisible();
  await expect(page.getByPlaceholder(/business name/i)).toBeVisible();
});

test("build button is disabled with no input", async ({ page }) => {
  await page.goto("/");
  const buildBtn = page.getByRole("button", { name: /Build my/i });
  await expect(buildBtn).toBeDisabled();
});

test("build button enables when name and industry are filled", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/business name/i).fill("Mike's Plumbing");
  await page.getByRole("combobox").first().selectOption("Plumbing");
  const buildBtn = page.getByRole("button", { name: /Build my/i });
  await expect(buildBtn).toBeEnabled();
});

test("demo runs for a plumbing business", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/business name/i).fill("Mike's Plumbing");
  await page.getByRole("combobox").first().selectOption("Plumbing");
  await page.getByRole("button", { name: /Build my/i }).click();

  // Should show building state
  await expect(page.getByText("Building")).toBeVisible();

  // Wait for website section to appear (up to 30s)
  await expect(page.getByText("Your website")).toBeVisible({ timeout: 30000 });
});

test("demo shows correct industry content — not plumber fallback", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/business name/i).fill("Tony's Bakery");
  await page.getByRole("combobox").first().selectOption("Bakery");
  await page.getByRole("button", { name: /Build my/i }).click();

  // Wait for done state
  await expect(page.getByText("Tony's Bakery is live")).toBeVisible({ timeout: 60000 });

  // Should show bakery content, NOT plumbing content
  const pageContent = await page.content();
  expect(pageContent).not.toContain("Water Heater");
  expect(pageContent).not.toContain("Drain Cleaning");
  expect(pageContent).toContain("Bak"); // bakery content
});

test("demo shows correct content for Martial Arts (Other category)", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/business name/i).fill("Dragon Karate");
  await page.getByRole("combobox").first().selectOption("Martial Arts");
  await page.getByRole("button", { name: /Build my/i }).click();

  await expect(page.getByText("Dragon Karate is live")).toBeVisible({ timeout: 60000 });

  // Should NOT show plumber content
  const pageContent = await page.content();
  expect(pageContent).not.toContain("Water Heater");
  expect(pageContent).not.toContain("Pipe Installation");
});

test("style picker changes the website preview theme", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/business name/i).fill("Test Business");
  await page.getByRole("combobox").first().selectOption("Restaurant");

  // Click Bold & Dark style
  await page.getByText("Bold & Dark").click();

  await page.getByRole("button", { name: /Build my/i }).click();
  await expect(page.getByText("Test Business is live")).toBeVisible({ timeout: 60000 });

  // Style toggle should be visible
  await expect(page.getByRole("button", { name: /Modern/i })).toBeVisible();
});

// ─── Blog pages ───────────────────────────────────────────────
test("blog post page loads correctly", async ({ page }) => {
  await page.goto("/blog/5-signs-you-need-a-new-water-heater");
  await expect(page.getByText("5 Signs You Need a New Water Heater")).toBeVisible();
  await expect(page.getByText("Written by LaunchPad AI")).toBeVisible();
  await expect(page.getByText("Get in touch")).toBeVisible();
});

test("blog sidebar shows other posts", async ({ page }) => {
  await page.goto("/blog/5-signs-you-need-a-new-water-heater");
  await expect(page.getByText("More sample posts")).toBeVisible();
  await expect(page.getByText("Photography")).toBeVisible();
  await expect(page.getByText("Real Estate")).toBeVisible();
});

test("blog CTA links back to contact", async ({ page }) => {
  await page.goto("/blog/5-signs-you-need-a-new-water-heater");
  const cta = page.getByRole("link", { name: /Get this for my business/i });
  await expect(cta).toBeVisible();
});

// ─── Pricing section ──────────────────────────────────────────
test("all three pricing plans are visible", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pricing" }).click();
  await expect(page.getByText("Starter")).toBeVisible();
  await expect(page.getByText("Growth")).toBeVisible();
  await expect(page.getByText("Premium")).toBeVisible();
  await expect(page.getByText("$299")).toBeVisible();
  await expect(page.getByText("$599")).toBeVisible();
  await expect(page.getByText("$999")).toBeVisible();
});

// ─── Contact form ─────────────────────────────────────────────
test("contact form submits and shows success", async ({ page }) => {
  await page.goto("/");
  // Scroll to contact
  await page.evaluate(() => document.getElementById("contact")?.scrollIntoView());

  await page.getByPlaceholder("Jane").fill("Test");
  await page.getByPlaceholder("Smith").fill("User");
  await page.getByPlaceholder(/Smith's Bakery/i).fill("Test Business");
  await page.getByPlaceholder(/jane@/i).fill("test@example.com");
  await page.getByRole("button", { name: /Send my request/i }).click();

  await expect(page.getByText("You're all set")).toBeVisible({ timeout: 5000 });
});

// ─── Mobile responsiveness ────────────────────────────────────
test("site is usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByText("DIFY")).toBeVisible();
  await expect(page.getByPlaceholder(/business name/i)).toBeVisible();
});
