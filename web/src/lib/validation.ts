import {
  IMAGE_SIZE_OPTIONS,
  IMAGE_RATIO_OPTIONS,
  VIDEO_RATIO_OPTIONS,
  VIDEO_FRAME_RATE_CHOICES,
  VIDEO_MODE_OPTIONS,
} from "@/lib/constants";

/**
 * Pure request-parameter validators shared by the API routes.
 *
 * Kept free of next/server imports so they can be unit-tested directly.
 */

const IMAGE_SIZE_VALUES = new Set(IMAGE_SIZE_OPTIONS.map((o) => o.value));

export function isValidImageSize(size: unknown): boolean {
  return typeof size === "string" && IMAGE_SIZE_VALUES.has(size);
}

export function isValidImageRatio(ratio: unknown): boolean {
  return typeof ratio === "string" && (IMAGE_RATIO_OPTIONS as readonly string[]).includes(ratio);
}

export function isValidVideoRatio(ratio: unknown): boolean {
  return typeof ratio === "string" && (VIDEO_RATIO_OPTIONS as readonly string[]).includes(ratio);
}

export function isValidVideoMode(mode: unknown): boolean {
  return typeof mode === "string" && (VIDEO_MODE_OPTIONS as readonly string[]).includes(mode);
}

export function isValidFrameRate(fps: unknown): boolean {
  return typeof fps === "number" && (VIDEO_FRAME_RATE_CHOICES as readonly number[]).includes(fps);
}

/** Caps a numeric field to a sane range; returns undefined when absent/invalid. */
export function clampInt(
  value: unknown,
  min: number,
  max: number
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(Math.max(Math.round(value), min), max);
}
