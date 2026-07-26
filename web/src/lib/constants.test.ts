import { describe, it, expect } from "vitest";
import {
  calculateFrames,
  getVideoDimensions,
  IMAGE_SIZE_OPTIONS,
  IMAGE_RATIO_OPTIONS,
} from "@/lib/constants";

describe("calculateFrames", () => {
  it("returns a value of the form 8n+1 (model requirement)", () => {
    for (const duration of [3, 5, 8, 10, 15, 18]) {
      for (const fps of [12, 24, 30, 60]) {
        const frames = calculateFrames(duration, fps);
        expect((frames - 1) % 8).toBe(0);
      }
    }
  });

  it("clamps to the supported 9..441 range", () => {
    expect(calculateFrames(0, 1)).toBeGreaterThanOrEqual(9);
    // 18s @ 60fps = 1080 target, must be capped
    expect(calculateFrames(18, 60)).toBe(441);
  });

  it("approximates the requested duration", () => {
    // 5s @ 24fps => ~120 frames
    expect(calculateFrames(5, 24)).toBeGreaterThan(112);
    expect(calculateFrames(5, 24)).toBeLessThan(128);
  });
});

describe("getVideoDimensions", () => {
  it("resolves known resolution/ratio pairs", () => {
    expect(getVideoDimensions("720p", "16:9")).toEqual({ w: 1152, h: 768 });
    expect(getVideoDimensions("1080p", "9:16")).toEqual({ w: 1080, h: 1920 });
  });

  it("returns undefined for unknown resolutions", () => {
    expect(getVideoDimensions("4K", "16:9")).toBeUndefined();
  });
});

describe("IMAGE_SIZE_OPTIONS", () => {
  it("defines dimensions for every supported ratio", () => {
    for (const option of IMAGE_SIZE_OPTIONS) {
      for (const ratio of IMAGE_RATIO_OPTIONS) {
        expect(option.dimensions[ratio]).toMatch(/^\d+x\d+$/);
      }
    }
  });
});
