import { NextRequest, NextResponse } from "next/server";
import { agnesFetch, errorResponse, successResponse } from "@/lib/agnes-api";
import { loadServerConfig } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, size = "1K", ratio = "1:1", image } = body;

    if (!prompt) return errorResponse("Prompt is required");
    if (!image) return errorResponse("Image is required for img2img");

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
