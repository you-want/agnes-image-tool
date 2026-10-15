import { createHash, createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authEnv } from "./config";

export const SESSION_COOKIE = "agnes_session";

export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Keep this format compatible with yanhuofood's existing code issuer.
export function codeHash(code: string): string {
  const secret = authEnv("WECHAT_LOGIN_HMAC_SECRET");
  if (secret.length < 32) throw new Error("Login secret is not configured");
  return createHmac("sha256", secret).update(`login-code:${code}`).digest("hex");
}

export function clientHash(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip") || "unknown";
  return createHmac("sha256", authEnv("WECHAT_LOGIN_HMAC_SECRET"))
    .update(`agnes-login-client:${ip}`).digest("hex");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function requestSessionToken(request: Request): string | null {
  const entry = request.headers.get("cookie")?.split(";")
    .map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const token = entry?.slice(SESSION_COOKIE.length + 1);
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

export function sameOriginError(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    return NextResponse.json({ error: "不允许跨站请求。", code: "INVALID_ORIGIN" }, { status: 403 });
  }
  return null;
}

export function safeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x20]/.test(value)) {
    return "/text-to-image";
  }
  try {
    const url = new URL(value, "https://agnes.invalid");
    return url.origin === "https://agnes.invalid" ? `${url.pathname}${url.search}${url.hash}` : "/text-to-image";
  } catch {
    return "/text-to-image";
  }
}
