import { NextRequest, NextResponse } from "next/server";
import { getAccess } from "@/lib/auth/access";
import { authConfigured, publicWechatConfig } from "@/lib/auth/config";
import { checkRateLimit } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = await checkRateLimit(request, 120);
  if (limited) return limited;
  const access = await getAccess(request);
  return NextResponse.json({
    configured: authConfigured(),
    authenticated: access.authenticated,
    allowed: access.allowed,
    expiresAt: access.allowed ? access.expiresAt : null,
    error: access.allowed ? null : access.error,
    code: access.allowed ? null : access.code,
    wechat: publicWechatConfig(),
  }, { headers: { "Cache-Control": "no-store" } });
}
