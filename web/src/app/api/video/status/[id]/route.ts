import { NextRequest, NextResponse } from "next/server";
import { agnesGet, errorResponse } from "@/lib/agnes-api";
import { loadServerConfig } from "@/lib/config";
import { checkRateLimit } from "@/lib/api-guard";

// Polled ~every 5s per active generation, so allow a higher ceiling than the
// generation routes.
const STATUS_RATE_LIMIT = 120;
const VALID_ID = /^[A-Za-z0-9_-]{1,128}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const limited = await checkRateLimit(request, STATUS_RATE_LIMIT);
    if (limited) return limited;

    const { id } = await params;
    if (!VALID_ID.test(id)) return errorResponse("Invalid video id");

    const serverConfig = await loadServerConfig();
    const encodedId = encodeURIComponent(id);

    // Try recommended endpoint first, fallback to legacy
    try {
      const result = await agnesGet(`/agnesapi?video_id=${encodedId}`, undefined, serverConfig.baseUrl);
      return NextResponse.json({ data: result });
    } catch {
      const result = await agnesGet(`/v1/videos/${encodedId}`, undefined, serverConfig.baseUrl);
      return NextResponse.json({ data: result });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message);
  }
}
