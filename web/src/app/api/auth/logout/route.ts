import { NextResponse } from "next/server";
import { authConfigured } from "@/lib/auth/config";
import { authDatabase } from "@/lib/auth/database";
import { requestSessionToken, sameOriginError, SESSION_COOKIE, tokenHash } from "@/lib/auth/security";

export async function POST(request: Request) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  const token = requestSessionToken(request);
  if (token && authConfigured()) {
    try {
      const { error } = await authDatabase().from("agnes_sessions").delete().eq("token_hash", tokenHash(token));
      if (error) throw error;
    } catch {
      return NextResponse.json({ error: "退出登录失败，请稍后重试。" }, { status: 503 });
    }
  }
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
