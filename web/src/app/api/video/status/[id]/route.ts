import { NextRequest, NextResponse } from "next/server";
import { agnesGet, errorResponse } from "@/lib/agnes-api";
import { loadServerConfig } from "@/lib/config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const serverConfig = await loadServerConfig();

    // Try recommended endpoint first, fallback to legacy
    try {
      const result = await agnesGet(`/agnesapi?video_id=${id}`, undefined, serverConfig.baseUrl);
      return NextResponse.json({ data: result });
    } catch {
      const result = await agnesGet(`/v1/videos/${id}`, undefined, serverConfig.baseUrl);
      return NextResponse.json({ data: result });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message);
  }
}
