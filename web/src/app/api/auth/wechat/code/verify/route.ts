import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, readJsonLimited } from "@/lib/api-guard";
import { accountAllowed, type Account } from "@/lib/auth/access";
import { authConfigured, sessionMaxAge } from "@/lib/auth/config";
import { authDatabase } from "@/lib/auth/database";
import { clientHash, codeHash, newSessionToken, safeReturnTo, sameOriginError, SESSION_COOKIE, tokenHash } from "@/lib/auth/security";

export const runtime = "nodejs";

function failure(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  const limited = await checkRateLimit(request, 8);
  if (limited) return limited;
  if (!authConfigured()) return failure("公众号登录暂未配置完成。", "AUTH_NOT_CONFIGURED", 503);
  const parsed = await readJsonLimited(request, 2048);
  if (parsed.error) return parsed.error;
  const code = typeof parsed.data.code === "string" ? parsed.data.code.trim() : "";
  if (!/^\d{6}$/.test(code)) return failure("请输入公众号发送的 6 位数字验证码。", "INVALID_CODE_FORMAT", 400);

  let claimedId: string | undefined;
  try {
    const db = authDatabase();
    const attempt = await db.rpc("agnes_take_login_attempt", { p_client_hash: clientHash(request) });
    if (attempt.error) throw attempt.error;
    const budget = Array.isArray(attempt.data) ? attempt.data[0] : attempt.data;
    if (!budget || typeof budget.allowed !== "boolean") throw new Error("Invalid login budget");
    if (!budget.allowed) return failure("验证码尝试次数过多，请 10 分钟后重试。", "TOO_MANY_ATTEMPTS", 429);

    // Atomic compare-and-set also works when yanhuofood consumes the same code.
    const claimed = await db.from("wechat_login_codes")
      .update({ status: "consuming", updated_at: new Date().toISOString() })
      .eq("code_hash", codeHash(code)).eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .select("id,user_id,wechat_openid").maybeSingle();
    if (claimed.error) throw claimed.error;
    if (!claimed.data) return failure("验证码不正确、已使用或已过期，请在公众号重新回复【登录】。", "INVALID_CODE", 401);
    claimedId = claimed.data.id;

    const account = await db.from("app_accounts").select("wechat_openid,wechat_status,disabled_at")
      .eq("user_id", claimed.data.user_id).maybeSingle();
    if (account.error) throw account.error;
    if (!accountAllowed(account.data as Account | null) || account.data?.wechat_openid !== claimed.data.wechat_openid) {
      await db.from("wechat_login_codes").update({ status: "failed", failure_code: "ACCESS_DENIED", updated_at: new Date().toISOString() }).eq("id", claimedId).eq("status", "consuming");
      return failure("公众号授权已失效或账户已停用，请重新关注后获取验证码。", "WECHAT_FOLLOW_REQUIRED", 403);
    }

    const consumed = await db.from("wechat_login_codes")
      .update({ status: "consumed", consumed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", claimedId).eq("status", "consuming").select("id").maybeSingle();
    if (consumed.error || !consumed.data) throw consumed.error || new Error("Code was not consumed");
    const token = newSessionToken();
    const maxAge = sessionMaxAge();
    const session = await db.from("agnes_sessions").insert({
      token_hash: tokenHash(token), user_id: claimed.data.user_id,
      expires_at: new Date(Date.now() + maxAge * 1000).toISOString(),
    });
    if (session.error) throw session.error;

    const response = NextResponse.json({ ok: true, returnTo: safeReturnTo(parsed.data.returnTo) }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge,
    });
    return response;
  } catch (err) {
    console.error(
      "[auth/wechat/code/verify] login failed:",
      err instanceof Error ? `${err.name}: ${err.message}` : err
    );
    if (claimedId) {
      try {
        await authDatabase().from("wechat_login_codes").update({ status: "failed", failure_code: "LOGIN_FAILED", updated_at: new Date().toISOString() })
          .eq("id", claimedId).eq("status", "consuming");
      } catch (cleanupErr) {
        console.error("[auth/wechat/code/verify] cleanup also failed:", cleanupErr instanceof Error ? cleanupErr.message : cleanupErr);
      }
    }
    return failure("登录服务暂时不可用，请稍后到公众号重新获取验证码。", "LOGIN_UNAVAILABLE", 503);
  }
}
