import { NextRequest, NextResponse } from "next/server";
import { agnesFetch, errorResponse, successResponse } from "@/lib/agnes-api";
import { loadServerConfig } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    } = body;

    if (!prompt) return errorResponse("Prompt is required");

    const serverConfig = await loadServerConfig();

    const payload: Record<string, unknown> = {
      model: "agnes-video-v2.0",
      prompt,
      frame_rate,
    };

    if (image) payload.image = image;
    if (mode) payload.mode = mode;
    if (width && height) {
      payload.width = width;
      payload.height = height;
    }
    if (num_frames) payload.num_frames = num_frames;
    if (num_inference_steps) payload.num_inference_steps = num_inference_steps;
    if (seed !== undefined) payload.seed = seed;
    if (negative_prompt) payload.negative_prompt = negative_prompt;
    if (extra_body) payload.extra_body = extra_body;

    const result = await agnesFetch("/v1/videos", payload, undefined, serverConfig.baseUrl);

    return successResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message);
  }
}
