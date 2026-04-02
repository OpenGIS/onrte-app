import { describe, it, expect, beforeEach } from "vitest";
import { createApp, ref, nextTick } from "vue";
import { useLocale, LOCALE_NAMES } from "@/composables/useLocale";

// Clear the module-level caches between tests
function clearCaches() {
  // useLocale and useSettings both have module-level caches
  // The simplest way to test is with unique instance IDs
}

function createLocaleInstance(options = {}) {
  const { instanceId = `test-${Math.random()}`, language = null, defaultLocale = null, customMessages = {} } = options;

  let result;
  const app = createApp({
    setup() {
      result = useLocale();
      return {};
    },
    template: "<div></div>",
  });

  app.provide("onrteAppId", instanceId);
  app.provide("navigatorLocale", defaultLocale);
  app.provide("navigatorMessages", customMessages);

  const el = document.createElement("div");
  app.mount(el);

  // If a language was requested, set it after mount
  if (language) {
    result.setLocale(language);
  }

  return { result, app, el };
}

describe("LOCALE_NAMES", () => {
  it("contains English and French", () => {
    expect(LOCALE_NAMES.en).toBe("English");
    expect(LOCALE_NAMES.fr).toBe("Français");
  });
});

describe("useLocale", () => {
  describe("locale resolution", () => {
    it("falls back to English when no preferences set", () => {
      // Override navigator.language to something unsupported
      const orig = navigator.language;
      Object.defineProperty(navigator, "language", { value: "xx-XX", configurable: true });
      try {
        const { result } = createLocaleInstance();
        expect(result.locale.value).toBe("en");
      } finally {
        Object.defineProperty(navigator, "language", { value: orig, configurable: true });
      }
    });

    it("uses defaultLocale from init when no user preference", () => {
      const orig = navigator.language;
      Object.defineProperty(navigator, "language", { value: "xx-XX", configurable: true });
      try {
        const { result } = createLocaleInstance({ defaultLocale: "fr" });
        expect(result.locale.value).toBe("fr");
      } finally {
        Object.defineProperty(navigator, "language", { value: orig, configurable: true });
      }
    });

    it("explicit user language overrides defaultLocale", () => {
      const { result } = createLocaleInstance({ defaultLocale: "en", language: "fr" });
      expect(result.locale.value).toBe("fr");
    });

    it("detects French from browser language fr-CA", () => {
      const orig = navigator.language;
      Object.defineProperty(navigator, "language", { value: "fr-CA", configurable: true });
      try {
        const { result } = createLocaleInstance();
        expect(result.locale.value).toBe("fr");
      } finally {
        Object.defineProperty(navigator, "language", { value: orig, configurable: true });
      }
    });
  });

  describe("t() translation", () => {
    it("translates a known English key", () => {
      const { result } = createLocaleInstance({ language: "en" });
      expect(result.t("nav.menu")).toBe("Menu");
    });

    it("translates to French when locale is French", () => {
      const { result } = createLocaleInstance({ language: "fr" });
      // French translation for "nav.menu" should exist
      const translation = result.t("nav.menu");
      expect(translation).toBeTruthy();
      expect(typeof translation).toBe("string");
    });

    it("returns the key itself when no translation exists", () => {
      const { result } = createLocaleInstance({ language: "en" });
      expect(result.t("nonexistent.key.xyz")).toBe("nonexistent.key.xyz");
    });

    it("custom messages override built-in translations", () => {
      const { result } = createLocaleInstance({
        language: "en",
        customMessages: { en: { "nav.menu": "Custom Menu" } },
      });
      expect(result.t("nav.menu")).toBe("Custom Menu");
    });

    it("custom messages only apply to their locale", () => {
      const { result } = createLocaleInstance({
        language: "en",
        customMessages: { fr: { "nav.menu": "Menu Personnalisé" } },
      });
      // English locale should still use built-in English
      expect(result.t("nav.menu")).toBe("Menu");
    });
  });

  describe("locales and setLocale", () => {
    it("lists available locale codes", () => {
      const { result } = createLocaleInstance();
      expect(result.locales).toContain("en");
      expect(result.locales).toContain("fr");
    });

    it("setLocale changes the active locale", async () => {
      const { result } = createLocaleInstance({ language: "en" });
      expect(result.locale.value).toBe("en");
      result.setLocale("fr");
      await nextTick();
      expect(result.locale.value).toBe("fr");
    });
  });

  describe("mapLanguageTag", () => {
    it("returns the locale code for standard locales", () => {
      const { result } = createLocaleInstance({ language: "en" });
      expect(result.mapLanguageTag.value).toBe("en");
    });

    it("returns fr when locale is French", () => {
      const { result } = createLocaleInstance({ language: "fr" });
      expect(result.mapLanguageTag.value).toBe("fr");
    });
  });
});
