import { describe, it, expect, beforeEach } from "vitest";
import { parseUrlHash, updateUrlHash } from "@/composables/useUrlHash";

describe("parseUrlHash", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  it("returns null when hash is empty", () => {
    expect(parseUrlHash()).toBeNull();
  });

  it("returns null when hash has wrong format", () => {
    window.location.hash = "#something-else";
    expect(parseUrlHash()).toBeNull();
  });

  it("parses integer zoom with positive coords", () => {
    window.location.hash = "#map=10/50.653900/-128.009400";
    const result = parseUrlHash();
    expect(result).toEqual({
      zoom: 10,
      center: [-128.0094, 50.6539], // [lng, lat]
    });
  });

  it("parses fractional zoom", () => {
    window.location.hash = "#map=14.5/48.8566/2.3522";
    const result = parseUrlHash();
    expect(result).toEqual({
      zoom: 14.5,
      center: [2.3522, 48.8566],
    });
  });

  it("parses negative latitude and longitude", () => {
    window.location.hash = "#map=8/-33.868820/151.209290";
    const result = parseUrlHash();
    expect(result).toEqual({
      zoom: 8,
      center: [151.20929, -33.86882],
    });
  });

  it("parses zero zoom", () => {
    window.location.hash = "#map=0/0/0";
    const result = parseUrlHash();
    expect(result).toEqual({
      zoom: 0,
      center: [0, 0],
    });
  });

  it("ignores extra path segments after the three values", () => {
    window.location.hash = "#map=12/50.6539/-128.0094/extra/stuff";
    const result = parseUrlHash();
    expect(result).toEqual({
      zoom: 12,
      center: [-128.0094, 50.6539],
    });
  });

  it("returns null when zoom is missing", () => {
    window.location.hash = "#map=/50.6539/-128.0094";
    expect(parseUrlHash()).toBeNull();
  });
});

describe("updateUrlHash", () => {
  it("formats hash with rounded zoom and 6 decimal places", () => {
    updateUrlHash(14.7, 50.6539, -128.0094);
    expect(window.location.hash).toBe("#map=15/50.653900/-128.009400");
  });

  it("formats zero coordinates", () => {
    updateUrlHash(0, 0, 0);
    expect(window.location.hash).toBe("#map=0/0.000000/0.000000");
  });

  it("formats negative coordinates", () => {
    updateUrlHash(8, -33.86882, 151.20929);
    expect(window.location.hash).toBe("#map=8/-33.868820/151.209290");
  });

  it("rounds zoom down from .4", () => {
    updateUrlHash(10.4, 50.6539, -128.0094);
    expect(window.location.hash).toBe("#map=10/50.653900/-128.009400");
  });

  it("rounds zoom up from .5", () => {
    updateUrlHash(10.5, 50.6539, -128.0094);
    expect(window.location.hash).toBe("#map=11/50.653900/-128.009400");
  });
});
