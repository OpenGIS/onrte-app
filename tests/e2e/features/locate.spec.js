import { test, expect } from "@playwright/test";

/**
 * Tests for docs/guide/features/locate.md
 *
 * Covers the Locate button states, permission flow modals, and map marker.
 */

const withNoLocateStorage = (page) =>
    page.addInitScript(() => {
        localStorage.removeItem("onrte_locate_app");
        localStorage.removeItem("onrte_view_app");
    });

const withGrantedStorage = (page) =>
    page.addInitScript(() => {
        localStorage.setItem(
            "onrte_locate_app",
            JSON.stringify({ permissionGranted: true }),
        );
        // Seed view storage so the About modal doesn't appear
        localStorage.setItem(
            "onrte_view_app",
            JSON.stringify({ mapView: { center: { lat: 51.5, lng: -0.1 }, zoom: 10 } }),
        );
    });

const grantGeolocation = (page, coords = { latitude: 51.5, longitude: -0.1 }) =>
    page.context().grantPermissions(["geolocation"]).then(() =>
        page.context().setGeolocation(coords),
    );

/** Dismiss the About modal if it appears (first-load state). */
const dismissAboutModal = async (page) => {
    const modal = page.locator("#about-modal");
    if (await modal.isVisible().catch(() => false)) {
        await page.locator("#about-modal-close").click();
        await modal.waitFor({ state: "hidden" });
    }
};

// ─── Locate / Button ──────────────────────────────────────────────────────────

test.describe("Locate / Button", () => {
    test.beforeEach(async ({ page }) => {
        await withNoLocateStorage(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        await dismissAboutModal(page);
    });

    test("locate button is visible in the top navigation bar", async ({ page }) => {
        await expect(page.locator("#locate-button")).toBeVisible();
    });

    test("locate button shows Locate label when inactive", async ({ page }) => {
        await expect(page.locator("#locate-button")).toContainText("Locate");
    });

    test("locate button is not in pressed state when inactive", async ({ page }) => {
        const btn = page.locator("#locate-button");
        await expect(btn).toHaveAttribute("aria-pressed", "false");
    });
});

// ─── Locate / Confirmation modal ─────────────────────────────────────────────

test.describe("Locate / Confirmation modal", () => {
    test.beforeEach(async ({ page }) => {
        await withNoLocateStorage(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        await dismissAboutModal(page);
    });

    test("confirmation modal appears on first click with no stored permission", async ({
        page,
    }) => {
        await page.locator("#locate-button").click();
        await expect(
            page.getByText("Permission Required"),
        ).toBeVisible();
    });

    test("confirmation modal body explains the permission request", async ({
        page,
    }) => {
        await page.locator("#locate-button").click();
        await expect(
            page.getByText(/To display your current location and compass heading/),
        ).toBeVisible();
    });

    test("cancelling the confirmation modal keeps the button inactive", async ({
        page,
    }) => {
        await page.locator("#locate-button").click();
        await page.getByText("Cancel").click();
        await expect(page.getByText("Permission Required")).toBeHidden();
        await expect(page.locator("#locate-button")).toContainText("Locate");
    });

    test("confirming the modal starts location tracking", async ({ page }) => {
        await grantGeolocation(page);
        await page.locator("#locate-button").click();
        await expect(page.getByText("Permission Required")).toBeVisible();
        await page.getByRole("button", { name: "I Understand" }).click();
        await expect(page.getByText("Permission Required")).toBeHidden();
        await expect
            .poll(() => page.locator("#locate-button").textContent(), {
                timeout: 5000,
            })
            .toMatch(/Located/);
    });

    test("confirmation modal is not shown when permission was previously granted", async ({
        page,
    }) => {
        await withGrantedStorage(page);
        await grantGeolocation(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        await page.locator("#locate-button").click();
        await expect(page.getByText("Permission Required")).toBeHidden();
    });
});

// ─── Locate / Recordings integration ─────────────────────────────────────────

test.describe("Locate / Recordings integration", () => {
    test.beforeEach(async ({ page }) => {
        await withNoLocateStorage(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        await dismissAboutModal(page);
    });

    test("starting a recording shows the confirmation modal when permission has not been granted", async ({
        page,
    }) => {
        // Open Recordings panel and click Record
        await page.locator("#recordings-button").click();
        await expect(page.getByText("Permission Required")).toBeVisible();
    });

    test("cancelling the confirmation from Recordings leaves the recording stopped", async ({
        page,
    }) => {
        await page.locator("#recordings-button").click();
        await expect(page.getByText("Permission Required")).toBeVisible();
        await page.getByText("Cancel").click();
        await expect(page.getByText("Permission Required")).toBeHidden();
        // Recording should not have started
        await expect(page.locator("#recordings-button")).not.toHaveAttribute(
            "aria-pressed",
            "true",
        );
    });
});


// ─── Locate / Active and Following states ────────────────────────────────────

test.describe("Locate / Active and Following states", () => {
    test.beforeEach(async ({ page }) => {
        await withGrantedStorage(page);
        await grantGeolocation(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });

    test("button shows Located label after location is acquired", async ({
        page,
    }) => {
        await page.locator("#locate-button").click();
        await expect
            .poll(() => page.locator("#locate-button").textContent(), {
                timeout: 5000,
            })
            .toMatch(/Located/);
    });

    test("button advances to Following on second click", async ({ page }) => {
        await page.locator("#locate-button").click();
        await expect
            .poll(() => page.locator("#locate-button").textContent(), {
                timeout: 5000,
            })
            .toMatch(/Located/);

        await page.locator("#locate-button").click();
        await expect(page.locator("#locate-button")).toContainText("Following");
    });

    test("button returns to Locate on third click", async ({ page }) => {
        await page.locator("#locate-button").click();
        await expect
            .poll(() => page.locator("#locate-button").textContent(), {
                timeout: 5000,
            })
            .toMatch(/Located/);

        await page.locator("#locate-button").click();
        await page.locator("#locate-button").click();
        await expect(page.locator("#locate-button")).toContainText("Locate");
    });

    test("position marker appears on the map when active", async ({ page }) => {
        await page.locator("#locate-button").click();
        await expect
            .poll(() => page.locator(".onrte-locate-position").count(), {
                timeout: 5000,
            })
            .toBeGreaterThan(0);
    });

    test("position marker is removed when locate is stopped", async ({ page }) => {
        await page.locator("#locate-button").click();
        await expect
            .poll(() => page.locator(".onrte-locate-position").count(), {
                timeout: 5000,
            })
            .toBeGreaterThan(0);

        // Third click stops locate
        await page.locator("#locate-button").click();
        await page.locator("#locate-button").click();
        await expect(page.locator(".onrte-locate-position")).toHaveCount(0);
    });
});

// ─── Locate / Initial zoom ───────────────────────────────────────────────────

test.describe("Locate / Initial zoom", () => {
    test("map flies to the user's position at zoom 16 on first fix", async ({
        page,
    }) => {
        await withGrantedStorage(page);
        await grantGeolocation(page, { latitude: 51.5, longitude: -0.1 });
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        await page.locator("#locate-button").click();

        await expect
            .poll(() => page.locator("#locate-button").textContent(), {
                timeout: 5000,
            })
            .toMatch(/Located/);

        await expect
            .poll(() => page.url(), { timeout: 6000 })
            .toMatch(/#map=16\//);
    });

    test("initial zoom fires again when locate is re-activated after stopping", async ({
        page,
    }) => {
        await withGrantedStorage(page);
        await grantGeolocation(page, { latitude: 51.5, longitude: -0.1 });
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // First activation — map flies to zoom 16
        await page.locator("#locate-button").click();
        await expect
            .poll(() => page.url(), { timeout: 6000 })
            .toMatch(/#map=16\//);

        // Stop locate (active → following → inactive)
        await page.locator("#locate-button").click();
        await page.locator("#locate-button").click();
        await expect(page.locator("#locate-button")).toContainText("Locate");

        // Re-activate from a stored view at zoom 10 — initial zoom should fire again
        await page.evaluate(() => {
            const stored = JSON.parse(
                localStorage.getItem("onrte_view_app") || "{}",
            );
            stored.mapView = { center: { lat: 51.5, lng: -0.1 }, zoom: 10 };
            localStorage.setItem("onrte_view_app", JSON.stringify(stored));
        });
        await page.reload();
        await page.waitForLoadState("networkidle");

        // Re-activate locate — should zoom back to 16
        await page.locator("#locate-button").click();
        await expect
            .poll(() => page.locator("#locate-button").textContent(), {
                timeout: 5000,
            })
            .toMatch(/Located/);
        await expect
            .poll(() => page.url(), { timeout: 6000 })
            .toMatch(/#map=16\//);
    });
});

// ─── Locate / Error state ─────────────────────────────────────────────────────

test.describe("Locate / Error state", () => {
    test("error modal appears when geolocation permission is denied", async ({
        page,
    }) => {
        await withGrantedStorage(page);
        // Do NOT grant geolocation — denial triggers the error callback
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        await page.locator("#locate-button").click();

        await expect
            .poll(() => page.locator("#locate-button").textContent(), {
                timeout: 5000,
            })
            .toMatch(/Error/);

        await expect(page.getByText("Location Permission Denied")).toBeVisible({
            timeout: 5000,
        });
    });

    test("error modal shows re-enable instructions", async ({ page }) => {
        await withGrantedStorage(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        await page.locator("#locate-button").click();

        await expect
            .poll(() => page.getByText("Location Permission Denied").isVisible(), {
                timeout: 5000,
            })
            .toBe(true);

        await expect(page.getByText(/Reloading this page/)).toBeVisible();
    });

    test("closing the error modal does not clear the error state", async ({
        page,
    }) => {
        await withGrantedStorage(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        await page.locator("#locate-button").click();

        await expect
            .poll(() => page.getByText("Location Permission Denied").isVisible(), {
                timeout: 5000,
            })
            .toBe(true);

        await page.locator("#locate-error-close").click();
        await expect(page.getByText("Location Permission Denied")).toBeHidden();
        await expect(page.locator("#locate-button")).toContainText("Error");
    });

    test("clicking the Error button re-opens the error modal", async ({
        page,
    }) => {
        await withGrantedStorage(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        await page.locator("#locate-button").click();

        await expect
            .poll(() => page.locator("#locate-error-close").isVisible(), {
                timeout: 5000,
            })
            .toBe(true);

        await page.locator("#locate-error-close").click();
        await expect(page.getByText("Location Permission Denied")).toBeHidden();

        await page.locator("#locate-button").click();
        await expect(page.getByText("Location Permission Denied")).toBeVisible();
    });
});

// ─── Locate / Heading marker ──────────────────────────────────────────────────

test.describe("Locate / Heading marker", () => {
    test("compass heading uses webkitCompassHeading when available (iOS)", async ({
        page,
    }) => {
        await withGrantedStorage(page);
        await grantGeolocation(page);

        // Simulate iOS: remove deviceorientationabsolute so code falls back to
        // deviceorientation, then provide webkitCompassHeading on the event.
        await page.addInitScript(() => {
            delete window.ondeviceorientationabsolute;
        });

        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Start locate tracking
        await page.locator("#locate-button").click();
        await expect
            .poll(() => page.locator(".onrte-locate-position").count(), {
                timeout: 5000,
            })
            .toBeGreaterThan(0);

        // Dispatch a deviceorientation event with webkitCompassHeading = 180.
        // The relative alpha is 0, which would incorrectly produce 0° bearing
        // if the code ignores webkitCompassHeading.
        await page.evaluate(() => {
            const event = new DeviceOrientationEvent("deviceorientation", {
                alpha: 0,
                beta: 0,
                gamma: 0,
            });
            Object.defineProperty(event, "webkitCompassHeading", {
                value: 180,
                writable: false,
            });
            window.dispatchEvent(event);
        });

        // The heading marker should appear and be rotated to ~180°, not 0°.
        const headingEl = page.locator(".onrte-locate-heading");
        await expect
            .poll(() => headingEl.count(), { timeout: 3000 })
            .toBeGreaterThan(0);

        const rotation = await headingEl.evaluate((el) => {
            const transform = el.style.transform || "";
            const match = transform.match(/rotateZ\(([^)]+)deg\)/);
            return match ? parseFloat(match[1]) : null;
        });

        // Should be 180°, not 0°. Allow some tolerance for smoothing.
        expect(rotation).not.toBeNull();
        expect(rotation).toBeGreaterThan(90);
        expect(rotation).toBeLessThan(270);
    });

    test("compass heading falls back to alpha for absolute events", async ({
        page,
    }) => {
        await withGrantedStorage(page);
        await grantGeolocation(page);

        await page.goto("/");
        await page.waitForLoadState("networkidle");

        await page.locator("#locate-button").click();
        await expect
            .poll(() => page.locator(".onrte-locate-position").count(), {
                timeout: 5000,
            })
            .toBeGreaterThan(0);

        // Dispatch an absolute orientation event (no webkitCompassHeading)
        // alpha=90, absolute=true → bearing should be (360-90)=270°
        await page.evaluate(() => {
            const event = new DeviceOrientationEvent(
                "deviceorientationabsolute",
                { alpha: 90, beta: 0, gamma: 0, absolute: true },
            );
            window.dispatchEvent(event);
        });

        const headingEl = page.locator(".onrte-locate-heading");
        await expect
            .poll(() => headingEl.count(), { timeout: 3000 })
            .toBeGreaterThan(0);

        const rotation = await headingEl.evaluate((el) => {
            const transform = el.style.transform || "";
            const match = transform.match(/rotateZ\(([^)]+)deg\)/);
            return match ? parseFloat(match[1]) : null;
        });

        // (360 - 90) % 360 = 270°
        expect(rotation).not.toBeNull();
        expect(rotation).toBeGreaterThan(180);
        expect(rotation).toBeLessThan(360);
    });
});

// ─── Locate / Error modal retry ───────────────────────────────────────────────

test.describe("Locate / Error modal retry", () => {
    test("error modal shows a retry button that resets the error state", async ({
        page,
    }) => {
        await withGrantedStorage(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Trigger error — no geolocation permission in context
        await page.locator("#locate-button").click();

        await expect
            .poll(() => page.locator("#locate-error-retry").isVisible(), {
                timeout: 5000,
            })
            .toBe(true);

        // Grant geolocation so the retry attempt succeeds
        await grantGeolocation(page);

        await page.locator("#locate-error-retry").click();

        // Modal should close
        await expect(page.getByText("Location Permission Denied")).toBeHidden();

        // Locate button should exit error state
        await expect
            .poll(() => page.locator("#locate-button").textContent(), {
                timeout: 5000,
            })
            .not.toMatch(/Error/);
    });
});
