import { test, expect } from "@playwright/test";

const SETTINGS_STORAGE_KEY = "onrte_settings_app";

/** Seed settings storage before page load (avoids an extra reload). */
const withSettings = (page, data) =>
	page.addInitScript(({ key, data }) => {
		localStorage.setItem(key, JSON.stringify(data));
	}, { key: SETTINGS_STORAGE_KEY, data });

// Seed view storage so the About modal does not appear on fresh contexts
test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		if (!localStorage.getItem("onrte_view_app")) {
			localStorage.setItem(
				"onrte_view_app",
				JSON.stringify({ mapView: { center: { lat: 51.5, lng: -0.1 }, zoom: 10 } }),
			);
		}
	});
});

/** Ensures the menu panel is open, toggling it if currently closed. */
async function openMenuPanel(page) {
	const offcanvas = page.locator(".offcanvas.show");
	if (!(await offcanvas.isVisible())) {
		await page.click(".navbar-toggler");
		await offcanvas.waitFor();
	}
}

/** Returns the app theme root (the wrapper with data-bs-theme). */
function themeRoot(page) {
	// .onrte-root carries :data-bs-theme="resolvedTheme"; the navbar also has
	// data-bs-theme="dark" (hardcoded) — use .onrte-root to target only our root.
	return page.locator(".onrte-root");
}

test.describe("Opening Settings", () => {
	test("settings link appears at the bottom of the menu panel", async ({
		page,
	}) => {
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await openMenuPanel(page);

		// Settings link is present at the bottom
		await expect(
			page.getByRole("button", { name: /settings/i }),
		).toBeVisible();
	});

	test("clicking settings link opens the settings panel", async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();

		await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
	});
});

test.describe("Appearance", () => {
	test("dark mode switch is present in the settings panel", async ({
		page,
	}) => {
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();

		await expect(page.locator("#settings-dark-mode")).toBeVisible();
		await expect(page.locator('label[for="settings-dark-mode"]')).toContainText(
			"Dark mode",
		);
	});

	test("toggling dark mode switch applies data-bs-theme to the navigator root", async ({
		page,
	}) => {
		// Force light mode to get a known start state
		await withSettings(page, { theme: "light", units: "metric" });
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		const root = themeRoot(page);
		await expect(root).toHaveAttribute("data-bs-theme", "light");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();
		await page.locator("#settings-dark-mode").click();

		await expect(root).toHaveAttribute("data-bs-theme", "dark");
	});

	test("toggling dark mode switch off sets theme to light", async ({
		page,
	}) => {
		// Start in dark mode
		await withSettings(page, { theme: "dark", units: "metric" });
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		const root = themeRoot(page);
		await expect(root).toHaveAttribute("data-bs-theme", "dark");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();
		await page.locator("#settings-dark-mode").click();

		await expect(root).toHaveAttribute("data-bs-theme", "light");
	});
});

test.describe("Units", () => {
	test("units select is present in the settings panel", async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();

		await expect(page.locator("#settings-units")).toBeVisible();
	});

	test.describe("locale default — metric region (en-GB)", () => {
		test.use({ locale: "en-GB" });

		test("units select defaults to metric for metric-system locale", async ({
			page,
		}) => {
			await page.goto("/");
			await page.waitForSelector(".onrte-map canvas");

			await openMenuPanel(page);
			await page.getByRole("button", { name: /settings/i }).click();

			await expect(page.locator("#settings-units")).toHaveValue("metric");
		});

		test("scale bar shows metric units by default for metric-system locale", async ({
			page,
		}) => {
			await page.goto("/");
			await page.waitForSelector(".maplibregl-ctrl-scale");

			const scale = page.locator(".maplibregl-ctrl-scale");
			await expect(scale).toBeVisible();
			await expect(scale).toContainText("km");
		});
	});

	test.describe("locale default — imperial region (en-US)", () => {
		test.use({ locale: "en-US" });

		test("units select defaults to imperial for imperial-system locale", async ({
			page,
		}) => {
			await page.goto("/");
			await page.waitForSelector(".onrte-map canvas");

			await openMenuPanel(page);
			await page.getByRole("button", { name: /settings/i }).click();

			await expect(page.locator("#settings-units")).toHaveValue("imperial");
		});

		test("scale bar shows imperial units by default for imperial-system locale", async ({
			page,
		}) => {
			await page.goto("/");
			await page.waitForSelector(".maplibregl-ctrl-scale");

			const scale = page.locator(".maplibregl-ctrl-scale");
			await expect(scale).toBeVisible();
			await expect(scale).toContainText("mi");
		});
	});

	test("selecting imperial in units select sets units to imperial", async ({
		page,
	}) => {
		// Force metric to get a known start state
		await withSettings(page, { theme: null, units: "metric" });
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();

		await page.locator("#settings-units").selectOption("imperial");
		await expect(page.locator("#settings-units")).toHaveValue("imperial");
	});

	test("scale bar switches to imperial when units set to imperial", async ({
		page,
	}) => {
		await withSettings(page, { theme: null, units: "imperial" });
		await page.goto("/");
		await page.waitForSelector(".maplibregl-ctrl-scale");

		const scale = page.locator(".maplibregl-ctrl-scale");
		await expect(scale).toContainText("mi");
	});
});

test.describe("Persistence", () => {
	test("dark mode preference is saved to localStorage", async ({ page }) => {
		await withSettings(page, { theme: "light", units: "metric" });
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();
		await page.locator("#settings-dark-mode").click();

		const stored = await page.evaluate((key) =>
			JSON.parse(localStorage.getItem(key)),
		SETTINGS_STORAGE_KEY);
		expect(stored.theme).toBe("dark");
	});

	test("units preference is saved to localStorage", async ({ page }) => {
		// Seed metric so we have a known start state regardless of locale
		await withSettings(page, { theme: null, units: "metric" });
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();

		await page.locator("#settings-units").selectOption("imperial");

		const stored = await page.evaluate((key) =>
			JSON.parse(localStorage.getItem(key)),
		SETTINGS_STORAGE_KEY);
		expect(stored.units).toBe("imperial");
	});

	test("persisted theme is applied on page reload", async ({ page }) => {
		await withSettings(page, { theme: "dark", units: "metric" });
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await expect(themeRoot(page)).toHaveAttribute("data-bs-theme", "dark");
	});

	test("persisted units are reflected in the settings select on reload", async ({
		page,
	}) => {
		await withSettings(page, { theme: "light", units: "imperial" });
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();

		await expect(page.locator("#settings-units")).toHaveValue("imperial");
	});
});

test.describe("Language", () => {
	test("language select is present in the settings panel", async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();

		await expect(page.locator("#settings-language")).toBeVisible();
	});

	test.describe("browser language default — French (fr-FR)", () => {
		test.use({ locale: "fr-FR" });

		test("language select defaults to French for French browser locale", async ({
			page,
		}) => {
			await page.goto("/");
			await page.waitForSelector(".onrte-map canvas");

			const offcanvas = page.locator(".offcanvas.show");
			if (!(await offcanvas.isVisible())) {
				await page.click(".navbar-toggler");
				await offcanvas.waitFor();
			}
			// Settings button will be in French
			await page.getByRole("button", { name: /paramètres/i }).click();

			await expect(page.locator("#settings-language")).toHaveValue("fr");
		});
	});

	test("selecting a language updates the UI immediately", async ({ page }) => {
		// Seed English so we have a known start state
		await withSettings(page, { theme: null, units: null, language: "en" });
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();

		await page.locator("#settings-language").selectOption("fr");

		// After switching to French, the settings heading should be in French
		await expect(page.getByRole("heading", { name: /paramètres/i })).toBeVisible();
	});

	test("language preference is saved to localStorage", async ({ page }) => {
		await withSettings(page, { theme: null, units: null, language: "en" });
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		await openMenuPanel(page);
		await page.getByRole("button", { name: /settings/i }).click();

		await page.locator("#settings-language").selectOption("fr");

		const stored = await page.evaluate(
			(key) => JSON.parse(localStorage.getItem(key)),
			SETTINGS_STORAGE_KEY,
		);
		expect(stored.language).toBe("fr");
	});

	test("persisted language is applied on page reload", async ({ page }) => {
		await withSettings(page, { theme: null, units: null, language: "fr" });
		await page.goto("/");
		await page.waitForSelector(".onrte-map canvas");

		const offcanvas = page.locator(".offcanvas.show");
		if (!(await offcanvas.isVisible())) {
			await page.click(".navbar-toggler");
			await offcanvas.waitFor();
		}
		await page.getByRole("button", { name: /paramètres/i }).click();

		await expect(page.getByRole("heading", { name: /paramètres/i })).toBeVisible();
	});
});
