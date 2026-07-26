import { NextRequest } from "next/server";
import { agnesFetch, errorResponse, successResponse } from "@/lib/agnes-api";
import { loadServerConfig } from "@/lib/config";
import {
  checkRateLimit,
  readJsonLimited,
  isValidImageSize,
  isValidImageRatio,
  IMAGE_BODY_LIMIT,
} from "@/lib/api-guard";

const MAX_PROMPT_LEN = 4000;

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit(request);
    if (limited) return limited;

    const parsed = await readJsonLimited(request, IMAGE_BODY_LIMIT);
    if (parsed.error) return parsed.error;
    const { prompt, size = "1K", ratio = "1:1", image } = parsed.data;

    if (typeof prompt !== "string" || !prompt.trim()) return errorResponse("Prompt is required");
    if (prompt.length > MAX_PROMPT_LEN) return errorResponse("Prompt is too long");
    if (!image) return errorResponse("Image is required for img2img");
    if (!isValidImageSize(size)) return errorResponse("Invalid size");
    if (!isValidImageRatio(ratio)) return errorResponse("Invalid ratio");

    const serverConfig = await loadServerConfig();

    const payload: Record<string, unknown> = {
      model: "agnes-image-2.1-flash",
      prompt,
      size,
      ratio,
      extra_body: {
        image: Array.isArray(image) ? image : [image],
        response_format: "url",
      } as Record<string, unknown>,
    };

    const result = await agnesFetch("/v1/images/generations", payload, undefined, serverConfig.baseUrl);

    return successResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message);
  }
}
