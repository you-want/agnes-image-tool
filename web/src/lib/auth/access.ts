import { NextResponse } from "next/server";
import { authConfigured } from "./config";
import { authDatabase } from "./database";
import { requestSessionToken, sameOriginError, tokenHash } from "./security";

export type Account = { wechat_openid: string | null; wechat_status: string; disabled_at: string | null };
export type AccessResult =
  | { allowed: true; authenticated: true; userId: string; expiresAt: string }
  | { allowed: false; authenticated: boolean; status: number; code: string; error: string };

export function accountAllowed(account: Account | null): boolean {
  return Boolean(account?.wechat_openid && account.wechat_status === "following" && !account.disabled_at);
}

export function accessResponse(result: Exclude<AccessResult, { allowed: true }>): NextResponse {
  return NextResponse.json({ error: result.error, code: result.code }, {
    status: result.status, headers: { "Cache-Control": "no-store" },
  });
}

export async function getAccess(request: Request): Promise<AccessResult> {
  if (!authConfigured()) return {
    allowed: false, authenticated: false, status: 503, code: "AUTH_NOT_CONFIGURED",
    error: "公众号登录暂未配置完成，请稍后再试。",
  };
  const token = requestSessionToken(request);
  if (!token) return {
    allowed: false, authenticated: false, status: 401, code: "AUTH_REQUIRED",
    error: "请先关注公众号并使用验证码登录。",
  };
  try {
    const { data, error } = await authDatabase().from("agnes_sessions")
      .select("user_id,expires_at,account:app_accounts!inner(wechat_openid,wechat_status,disabled_at)")
      .eq("token_hash", tokenHash(token)).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (error) throw error;
    if (!data) return {
      allowed: false, authenticated: false, status: 401, code: "AUTH_REQUIRED",
      error: "登录已过期，请到公众号重新获取验证码。",
    };
    const account = (Array.isArray(data.account) ? data.account[0] : data.account) as Account | null;
    if (!accountAllowed(account)) return {
      allowed: false, authenticated: true, status: 403,
      code: account?.disabled_at ? "ACCOUNT_DISABLED" : "WECHAT_FOLLOW_REQUIRED",
      error: account?.disabled_at ? "当前账户已停用，请联系管理员。" : "公众号授权已失效，请重新关注并获取验证码登录。",
    };
    return { allowed: true, authenticated: true, userId: data.user_id, expiresAt: data.expires_at };
  } catch {
    // A database outage must never grant access to the site's API key.
    return {
      allowed: false, authenticated: false, status: 503, code: "AUTH_UNAVAILABLE",
      error: "暂时无法验证登录权限，请稍后再试。",
    };
  }
}

export async function requireAccess(request: Request) {
  const originError = request.method !== "GET" ? sameOriginError(request) : null;
  if (originError) return { response: originError } as const;
  const access = await getAccess(request);
  return access.allowed ? { userId: access.userId } as const : { response: accessResponse(access) } as const;
}
