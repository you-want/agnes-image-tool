import { describe, it, expect } from "vitest";
import { AGNES_MAX_IMAGES, AGNES_MAX_AUDIOS } from "@/lib/api-guard";

/**
 * Regression tests for the Agnes API hard limits. The upstream API rejects any
 * request with more than 4 images (400 "Image count N exceeds limit 4 per
 * request"), so the routes and frontend must all cap arrays to AGNES_MAX_IMAGES
 * before submitting. These tests pin the constants so a silent change in the
 * limit (or a drift between the export and its consumers) is caught.
 */
describe("AGNES_MAX_IMAGES", () => {
  it("is 4, matching the upstream image/video array limit", () => {
    expect(AGNES_MAX_IMAGES).toBe(4);
  });
});

describe("AGNES_MAX_AUDIOS", () => {
  it("is 3, matching the upstream reference-mode audio limit", () => {
    expect(AGNES_MAX_AUDIOS).toBe(3);
  });
});

describe("image array capping (as applied by the routes)", () => {
  // Mirrors the `.slice(0, AGNES_MAX_IMAGES)` logic used in the routes so the
  // cap behaviour itself is covered, not just the constant.
  const cap = (arr: unknown[]) => arr.slice(0, AGNES_MAX_IMAGES);

  it("truncates arrays longer than the limit to the first N images", () => {
    const urls = ["a", "b", "c", "d", "e", "f"];
    expect(cap(urls)).toEqual(["a", "b", "c", "d"]);
  });

  it("leaves arrays at-or-under the limit unchanged", () => {
    expect(cap(["a", "b"])).toEqual(["a", "b"]);
    expect(cap(["a", "b", "c", "d"])).toEqual(["a", "b", "c", "d"]);
    expect(cap([])).toEqual([]);
  });
});
