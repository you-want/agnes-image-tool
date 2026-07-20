import { NextRequest, NextResponse } from "next/server";
import { agnesFetch, errorResponse, successResponse } from "@/lib/agnes-api";
import { loadServerConfig } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, size = "1K", ratio = "1:1", n = 1, negative_prompt, extra_body } = body;

    if (!prompt) return errorResponse("Prompt is required");

    const serverConfig = await loadServerConfig();

    const payload: Record<string, unknown> = {
      model: "agnes-image-2.1-flash",
      prompt,
      size,
      ratio,
      n,
    };

    if (negative_prompt) payload.negative_prompt = negative_prompt;
    if (extra_body) payload.extra_body = extra_body;

    const result = await agnesFetch("/v1/images/generations", payload, undefined, serverConfig.baseUrl);

    return successResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message);
  }
}
