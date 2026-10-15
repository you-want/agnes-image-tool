import { NextRequest, NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/access";
import { checkRateLimit } from "@/lib/api-guard";
import { loadServerConfig } from "@/lib/config";

export async function GET(request: NextRequest) {
  const limited = await checkRateLimit(request);
  if (limited) return limited;
  const access = await requireAccess(request);
  if (access.response) return access.response;
  const config = await loadServerConfig();
  return NextResponse.json({ hasApiKey: Boolean(config.apiKey), baseUrl: config.baseUrl, managed: true }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request);
  if (limited) return limited;
  const access = await requireAccess(request);
  if (access.response) return access.response;
  return NextResponse.json({ error: "模型配置由管理员统一管理。", code: "CONFIG_MANAGED" }, { status: 403 });
}
