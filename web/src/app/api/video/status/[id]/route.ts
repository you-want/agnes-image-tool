import { requireVideoOwner } from "@/lib/auth/video-tasks";
import { requireAccess } from "@/lib/auth/access";
import { NextRequest, NextResponse } from "next/server";
import { agnesGet, errorResponse, classifyError } from "@/lib/agnes-api";
import { loadServerConfig } from "@/lib/config";
import { checkRateLimit } from "@/lib/api-guard";

// Polled ~every 5s per active generation, so allow a higher ceiling than the
// generation routes.
const STATUS_RATE_LIMIT = 120;

// Task IDs: short alphanumeric with underscore prefix (e.g., task_abc123)
const TASK_ID = /^[a-zA-Z_][a-zA-Z0-9_-]{0,127}$/;
// Video IDs: Base64url-encoded strings that may contain colons and semicolons
// and are longer (e.g., video_bGl0ZWxsbTpjdXN0b21f...). Max observed ~200 chars.
const VIDEO_ID = /^[a-zA-Z_][a-zA-Z0-9_:;-]{1,300}$/;

function isValidVideoId(id: string): boolean {
  return TASK_ID.test(id) || VIDEO_ID.test(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const limited = await checkRateLimit(request, STATUS_RATE_LIMIT);
    if (limited) return limited;

    const access = await requireAccess(request);
    if (access.response) return access.response;

    const { id } = await params;
    if (!id || !isValidVideoId(id)) return errorResponse("Invalid video id");

    const ownerError = await requireVideoOwner(access.userId, id);
    if (ownerError) return ownerError;

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
    const { message, status } = classifyError(error);
    return errorResponse(message, status);
  }
}
