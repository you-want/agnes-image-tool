import { recordVideoTask } from "@/lib/auth/video-tasks";
import { takeQuota } from "@/lib/auth/quota";
import { requireAccess } from "@/lib/auth/access";
import { NextRequest } from "next/server";
import { agnesFetch, errorResponse, successResponse, classifyError, getProxyAgent } from "@/lib/agnes-api";
import { loadServerConfig } from "@/lib/config";
import {
  checkRateLimit,
  readJsonLimited,
  isValidVideoMode,
  isValidFrameRate,
  clampInt,
  IMAGE_BODY_LIMIT,
  AGNES_MAX_IMAGES,
} from "@/lib/api-guard";
import https from "node:https";

const MAX_PROMPT_LEN = 4000;
const IMAGE_URL_TIMEOUT_MS = 10_000;

/**
 * Validates that an external image URL is accessible and returns an image content type.
 * Uses GET (instead of HEAD) because many image CDNs reject HEAD or return 405.
 * Respects the same proxy configuration as the main API client.
 * Returns null if the URL is valid, or an error message string if not.
 */
async function validateImageUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const agent = getProxyAgent();

    const reqOptions: any = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      agent: agent || undefined,
      timeout: IMAGE_URL_TIMEOUT_MS,
    };

    const req = https.request(reqOptions, (res) => {
      let body = "";
      res.on("data", (chunk: string) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode !== undefined && res.statusCode! < 200) {
          resolve(`Image URL returned HTTP ${res.statusCode}. Please ensure the URL is publicly accessible and not behind authentication.`);
          return;
        }

        const contentType = res.headers["content-type"] || "";
        if (!contentType.startsWith("image/")) {
          resolve(`Image URL returned content type "${contentType}" instead of an image. Please provide a valid image URL.`);
          return;
        }

        resolve(null);
      });
    });

    req.on("error", (err) => {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("timed out") || message.includes("AbortError")) {
        resolve(`Image URL timed out after ${IMAGE_URL_TIMEOUT_MS / 1000}s. Please check your network connection or use a different image URL.`);
      } else {
        resolve(`Failed to access image URL: ${message}`);
      }
    });

    req.on("timeout", () => {
      req.destroy();
      resolve(`Image URL timed out after ${IMAGE_URL_TIMEOUT_MS / 1000}s. Please check your network connection or use a different image URL.`);
    });

    req.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit(request);
    if (limited) return limited;

    const access = await requireAccess(request);
    if (access.response) return access.response;

    const parsed = await readJsonLimited(request, IMAGE_BODY_LIMIT);
    if (parsed.error) return parsed.error;
    const {
      prompt,
      image,
      mode,
      width,
      height,
      num_frames,
      frame_rate = 24,
      num_inference_steps,
      seed,
      negative_prompt,
      extra_body,
    } = parsed.data;

    if (typeof prompt !== "string" || !prompt.trim()) return errorResponse("Prompt is required");
    if (prompt.length > MAX_PROMPT_LEN) return errorResponse("Prompt is too long");
    if (!isValidFrameRate(frame_rate)) return errorResponse("Invalid frame rate");
    if (mode !== undefined && !isValidVideoMode(mode)) return errorResponse("Invalid mode");

    const extraImages = extra_body && Array.isArray((extra_body as Record<string, unknown>).image)
      ? ((extra_body as Record<string, unknown>).image as unknown[]).filter((u) => typeof u === "string")
      : [];
    if (typeof image === "string" && image.trim()) extraImages.push(image);
    // Agnes hard limit: 4 images per request (exceeding returns 400
    // "Image count N exceeds limit 4 per request") — cap before submitting
    if (extraImages.length > AGNES_MAX_IMAGES) {
      console.log(
        `[Video API] ${extraImages.length} images provided, capping to ${AGNES_MAX_IMAGES} (API limit)`
      );
    }

    // Validate external image URLs before forwarding to upstream API
    if (typeof image === "string" && image.trim()) {
      const trimmedImage = image.trim();

      // Only validate external URLs, not base64 data URIs
      if (trimmedImage.startsWith("http://") || trimmedImage.startsWith("https://")) {
        const imageError = await validateImageUrl(trimmedImage);
        if (imageError) {
          return errorResponse(`图片URL无效: ${imageError}`, 400);
        }
      }
    }

    const serverConfig = await loadServerConfig();

    const payload: Record<string, unknown> = {
      model: "agnes-video-v2.0",
      prompt,
      frame_rate,
    };

    if (image) payload.image = image;
    if (mode) payload.mode = mode;

    const w = clampInt(width, 64, 4096);
    const h = clampInt(height, 64, 4096);
    if (w && h) {
      payload.width = w;
      payload.height = h;
    }

    const frames = clampInt(num_frames, 9, 441);
    if (frames) payload.num_frames = frames;

    const steps = clampInt(num_inference_steps, 1, 100);
    if (steps) payload.num_inference_steps = steps;

    const s = clampInt(seed, 0, Number.MAX_SAFE_INTEGER);
    if (s !== undefined) payload.seed = s;

    if (typeof negative_prompt === "string" && negative_prompt.length <= MAX_PROMPT_LEN) {
      payload.negative_prompt = negative_prompt;
    }
    // Apply the cap: slice extra_body.image (and top-level image) to AGNES_MAX_IMAGES
    if (extra_body && Array.isArray((extra_body as Record<string, unknown>).image)) {
      const capped = ((extra_body as Record<string, unknown>).image as unknown[])
        .filter((u) => typeof u === "string")
        .slice(0, AGNES_MAX_IMAGES);
      payload.extra_body = { ...(extra_body as Record<string, unknown>), image: capped };
    }

    const quotaError = await takeQuota(access.userId, "video");
    if (quotaError) return quotaError;

    const result = await agnesFetch("/v1/videos", payload, undefined, serverConfig.baseUrl);

    await recordVideoTask(access.userId, result);
    return successResponse(result);
  } catch (error) {
    const { message, status } = classifyError(error);
    return errorResponse(message, status);
  }
}
