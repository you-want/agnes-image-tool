import { describe, it, expect } from "vitest";
import {
  isValidImageSize,
  isValidImageRatio,
  isValidVideoRatio,
  isValidVideoMode,
  isValidFrameRate,
  clampInt,
} from "@/lib/validation";

describe("isValidImageSize", () => {
  it("accepts the documented presets", () => {
    for (const size of ["1K", "2K", "3K", "4K"]) {
      expect(isValidImageSize(size)).toBe(true);
    }
  });

  it("rejects unknown or non-string values", () => {
    expect(isValidImageSize("8K")).toBe(false);
    expect(isValidImageSize("")).toBe(false);
    expect(isValidImageSize(1)).toBe(false);
    expect(isValidImageSize(null)).toBe(false);
    expect(isValidImageSize(undefined)).toBe(false);
  });
});

describe("isValidImageRatio", () => {
  it("accepts supported ratios", () => {
    expect(isValidImageRatio("1:1")).toBe(true);
    expect(isValidImageRatio("21:9")).toBe(true);
  });

  it("rejects unsupported ratios", () => {
    expect(isValidImageRatio("5:4")).toBe(false);
    expect(isValidImageRatio({})).toBe(false);
  });
});

describe("isValidVideoRatio", () => {
  it("accepts video ratios but not image-only ones", () => {
    expect(isValidVideoRatio("16:9")).toBe(true);
    // 21:9 is valid for images but not for video
    expect(isValidVideoRatio("21:9")).toBe(false);
  });
});

describe("isValidVideoMode", () => {
  it("accepts only the two known modes", () => {
    expect(isValidVideoMode("ti2vid")).toBe(true);
    expect(isValidVideoMode("keyframes")).toBe(true);
    expect(isValidVideoMode("anything-else")).toBe(false);
  });
});

describe("isValidFrameRate", () => {
  it("accepts the preset frame rates as numbers", () => {
    expect(isValidFrameRate(24)).toBe(true);
    expect(isValidFrameRate(60)).toBe(true);
  });

  it("rejects out-of-set values and numeric strings", () => {
    expect(isValidFrameRate(23)).toBe(false);
    expect(isValidFrameRate("24")).toBe(false);
    expect(isValidFrameRate(NaN)).toBe(false);
  });
});

describe("clampInt", () => {
  it("clamps into range and rounds", () => {
    expect(clampInt(5, 10, 100)).toBe(10);
    expect(clampInt(500, 10, 100)).toBe(100);
    expect(clampInt(42.4, 10, 100)).toBe(42);
  });

  it("returns undefined for non-finite / non-numeric input", () => {
    expect(clampInt(undefined, 0, 10)).toBeUndefined();
    expect(clampInt("50", 0, 100)).toBeUndefined();
    expect(clampInt(NaN, 0, 10)).toBeUndefined();
    expect(clampInt(Infinity, 0, 10)).toBeUndefined();
  });

  it("preserves 0 rather than treating it as absent", () => {
    expect(clampInt(0, 0, 100)).toBe(0);
  });
});
