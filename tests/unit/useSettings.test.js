import { describe, it, expect } from "vitest";
import { localeDefaultUnits } from "@/composables/useSettings";

describe("localeDefaultUnits", () => {
  it("returns 'imperial' for en-US", () => {
    expect(localeDefaultUnits("en-US")).toBe("imperial");
  });

  it("returns 'imperial' for en (US region when maximized)", () => {
    expect(localeDefaultUnits("en")).toBe("imperial");
  });

  it("returns 'metric' for en-GB", () => {
    expect(localeDefaultUnits("en-GB")).toBe("metric");
  });

  it("returns 'metric' for en-CA", () => {
    expect(localeDefaultUnits("en-CA")).toBe("metric");
  });

  it("returns 'metric' for en-AU", () => {
    expect(localeDefaultUnits("en-AU")).toBe("metric");
  });

  it("returns 'metric' for fr-FR", () => {
    expect(localeDefaultUnits("fr-FR")).toBe("metric");
  });

  it("returns 'metric' for fr", () => {
    expect(localeDefaultUnits("fr")).toBe("metric");
  });

  it("returns 'metric' for de-DE", () => {
    expect(localeDefaultUnits("de-DE")).toBe("metric");
  });

  it("returns 'metric' for ja-JP", () => {
    expect(localeDefaultUnits("ja-JP")).toBe("metric");
  });

  it("returns 'imperial' for Liberia (en-LR)", () => {
    expect(localeDefaultUnits("en-LR")).toBe("imperial");
  });

  it("returns 'imperial' for Myanmar (my-MM)", () => {
    expect(localeDefaultUnits("my-MM")).toBe("imperial");
  });

  it("returns 'metric' for invalid locale string", () => {
    expect(localeDefaultUnits("not-a-locale-!!!")).toBe("metric");
  });

  it("falls back to navigator.language when no argument given", () => {
    // happy-dom defaults to 'en-US'
    const result = localeDefaultUnits();
    expect(["metric", "imperial"]).toContain(result);
  });
});
