import { NextRequest } from "next/server";
import { agnesFetch, errorResponse, successResponse, classifyError } from "@/lib/agnes-api";
import { loadServerConfig } from "@/lib/config";
import {
  checkRateLimit,
  readJsonLimited,
  isValidVideoMode,
  isValidFrameRate,
  clampInt,
  IMAGE_BODY_LIMIT,
} from "@/lib/api-guard";

const MAX_PROMPT_LEN = 4000;

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit(request);
    if (limited) return limited;

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
    if (extra_body) payload.extra_body = extra_body;

    const result = await agnesFetch("/v1/videos", payload, undefined, serverConfig.baseUrl);

    return successResponse(result);
  } catch (error) {
    const { message, status } = classifyError(error);
    return errorResponse(message, status);
  }
}
