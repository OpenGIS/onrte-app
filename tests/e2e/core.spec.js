import { test, expect } from "@playwright/test";

/**
 * Tests for docs/guide/core.md
 *
 * Covers the First load behaviour: Welcome modal, language/units selection,
 * returning visits, and the About button.
 */

const withNoViewStorage = (page) =>
  page.addInitScript(() => localStorage.removeItem("onrte_view_app"));

const withViewStorage = (page) =>
  page.addInitScript(() =>
    localStorage.setItem(
      "onrte_view_app",
      JSON.stringify({ mapView: { center: { lat: 51.5, lng: -0.1 }, zoom: 10 } }),
    ),
  );

// ─── First load / Welcome modal ───────────────────────────────────────────────

test.describe("First load / Welcome modal", () => {
  test("modal is visible on first visit with welcome text", async ({ page }) => {
    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-modal")).toBeVisible();
    await expect(page.locator("#about-modal-title")).toBeVisible();
    await expect(page.locator("#about-modal .modal-body")).toContainText("A map for exploring");
  });

  test("modal can be dismissed with Get Started button", async ({ page }) => {
    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-modal")).toBeVisible();
    await page.locator("#about-modal-close").click();
    await expect(page.locator("#about-modal")).toHaveCount(0);
  });

  test("modal can be dismissed with close button", async ({ page }) => {
    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-modal")).toBeVisible();
    await page.locator("#about-modal .btn-close").click();
    await expect(page.locator("#about-modal")).toHaveCount(0);
  });
});

// ─── First load / Language ────────────────────────────────────────────────────

test.describe("First load / Language", () => {
  test("language selector is visible in the modal", async ({ page }) => {
    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-language")).toBeVisible();
  });

  test("language selector defaults to browser language (English)", async ({ page }) => {
    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-language")).toHaveValue("en");
  });

  test("language selector defaults to French for French browser locale", async ({ browser }) => {
    const context = await browser.newContext({ locale: "fr-FR" });
    const page = await context.newPage();

    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-language")).toHaveValue("fr");
    await context.close();
  });

  test("changing language updates the modal text immediately", async ({ page }) => {
    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-modal .modal-body")).toContainText("A map for exploring");

    await page.locator("#about-language").selectOption("fr");

    await expect(page.locator("#about-modal .modal-body")).toContainText("Une carte pour explorer");
  });

  test("language choice is saved to settings storage", async ({ page }) => {
    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator("#about-language").selectOption("fr");
    await page.locator("#about-modal-close").click();

    await expect.poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("onrte_settings_app");
        return raw ? JSON.parse(raw).language : null;
      })
    ).toBe("fr");
  });
});

// ─── First load / Units ───────────────────────────────────────────────────────

test.describe("First load / Units", () => {
  test("units selector is visible in the modal", async ({ page }) => {
    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-units")).toBeVisible();
  });

  test("units selector defaults to metric for metric-system locale (en-GB)", async ({ browser }) => {
    const context = await browser.newContext({ locale: "en-GB" });
    const page = await context.newPage();

    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-units")).toHaveValue("metric");
    await context.close();
  });

  test("units selector defaults to imperial for imperial-system locale (en-US)", async ({ browser }) => {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();

    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-units")).toHaveValue("imperial");
    await context.close();
  });

  test("units choice is saved to settings storage", async ({ page }) => {
    await withNoViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator("#about-units").selectOption("imperial");
    await page.locator("#about-modal-close").click();

    await expect.poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("onrte_settings_app");
        return raw ? JSON.parse(raw).units : null;
      })
    ).toBe("imperial");
  });
});

// ─── First load / Returning visits ───────────────────────────────────────────

test.describe("First load / Returning visits", () => {
  test("modal is absent on returning visit", async ({ page }) => {
    await withViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-modal")).toHaveCount(0);
  });

  test("modal is absent after view storage is written and page is reloaded", async ({ page }) => {
    const VIEW_KEY = "onrte_view_app";

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-modal")).toBeVisible();

    await page.locator("#about-modal-close").click();
    await expect(page.locator("#about-modal")).toHaveCount(0);

    await page.evaluate((k) => {
      localStorage.setItem(
        k,
        JSON.stringify({ mapView: { center: { lat: 51.5, lng: -0.1 }, zoom: 10 } }),
      );
    }, VIEW_KEY);

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#about-modal")).toHaveCount(0);
  });
});

// ─── First load / About button ────────────────────────────────────────────────

test.describe("First load / About button", () => {
  test("About button in menu opens the About panel", async ({ page }) => {
    await withViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".onrte-panel")).toBeVisible({ timeout: 5000 });

    await page.locator("#about-button").click();
    await expect(page.locator(".onrte-about-panel")).toBeVisible();
  });
});

// ─── About panel ──────────────────────────────────────────────────────────────

test.describe("About panel", () => {
  test("About panel shows description and attributions", async ({ page }) => {
    await withViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator("#about-button").click();
    const panel = page.locator(".onrte-about-panel");
    await expect(panel).toContainText("On Route");
    await expect(panel).toContainText("OpenStreetMap");
    await expect(panel).toContainText("MapLibre GL JS");
    await expect(panel).toContainText("OpenFreeMap");
    await expect(panel).toContainText("Vue JS");
    await expect(panel).toContainText("Bootstrap");
  });
});

// ─── Privacy panel ────────────────────────────────────────────────────────────

test.describe("Privacy panel", () => {
  test("Privacy button in menu opens the Privacy panel", async ({ page }) => {
    await withViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".onrte-panel")).toBeVisible({ timeout: 5000 });

    await page.locator("#privacy-button").click();
    await expect(page.locator(".onrte-privacy-panel")).toBeVisible();
  });

  test("Privacy panel contains expected content", async ({ page }) => {
    await withViewStorage(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".onrte-panel")).toBeVisible({ timeout: 5000 });

    await page.locator("#privacy-button").click();
    const panel = page.locator(".onrte-privacy-panel");
    await expect(panel).toContainText("local storage");
    await expect(panel).toContainText("OpenFreeMap");
    await expect(panel).toContainText("Locate");
    await expect(panel).toContainText("no analytics");
  });
});
