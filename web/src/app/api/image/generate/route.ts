import { takeQuota } from "@/lib/auth/quota";
import { requireAccess } from "@/lib/auth/access";
import { NextRequest } from "next/server";
import { agnesFetch, errorResponse, successResponse, classifyError } from "@/lib/agnes-api";
import { loadServerConfig } from "@/lib/config";
import {
  checkRateLimit,
  readJsonLimited,
  isValidImageSize,
  isValidImageRatio,
  TEXT_BODY_LIMIT,
  AGNES_MAX_IMAGES,
} from "@/lib/api-guard";

const MAX_PROMPT_LEN = 4000;

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit(request);
    if (limited) return limited;

    const access = await requireAccess(request);
    if (access.response) return access.response;

    const parsed = await readJsonLimited(request, TEXT_BODY_LIMIT);
    if (parsed.error) return parsed.error;
    const { prompt, size = "1K", ratio = "1:1", extra_body } = parsed.data;

    if (typeof prompt !== "string" || !prompt.trim()) return errorResponse("Prompt is required");
    if (prompt.length > MAX_PROMPT_LEN) return errorResponse("Prompt is too long");
    if (!isValidImageSize(size)) return errorResponse("Invalid size");
    if (!isValidImageRatio(ratio)) return errorResponse("Invalid ratio");

    const serverConfig = await loadServerConfig();

    const payload: Record<string, unknown> = {
      model: "agnes-image-2.1-flash",
      prompt,
      size,
      ratio,
    };

    if (extra_body) {
      // Cap extra_body.image to the API limit of 4 (exceeding returns
      // 400 "Image count N exceeds limit 4 per request")
      const imageArr = (extra_body as Record<string, unknown>).image;
      if (Array.isArray(imageArr)) {
        payload.extra_body = {
          ...(extra_body as Record<string, unknown>),
          image: imageArr.slice(0, AGNES_MAX_IMAGES),
        };
      } else {
        payload.extra_body = extra_body;
      }
    }

    const quotaError = await takeQuota(access.userId, "image");
    if (quotaError) return quotaError;

    const result = await agnesFetch("/v1/images/generations", payload, undefined, serverConfig.baseUrl);

    return successResponse(result);
  } catch (error) {
    const { message, status } = classifyError(error);
    return errorResponse(message, status);
  }
}
