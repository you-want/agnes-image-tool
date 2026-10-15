import { NextResponse } from "next/server";
import { boundedEnv } from "./config";
import { authDatabase } from "./database";

export type UsageKind = "image" | "video" | "chat";
const defaults: Record<UsageKind, [number, number]> = { image: [20, 500], video: [3, 30], chat: [50, 1000] };

export function quotaLimits(kind: UsageKind) {
  const prefix = kind.toUpperCase();
  return {
    user: boundedEnv(`${prefix}_DAILY_LIMIT`, defaults[kind][0], 0, 100_000),
    global: boundedEnv(`${prefix}_GLOBAL_DAILY_LIMIT`, defaults[kind][1], 0, 1_000_000),
  };
}

// Count submission attempts immediately before calling the upstream. Do not
// refund ambiguous upstream timeouts: the provider may already have charged.
export async function takeQuota(userId: string, kind: UsageKind): Promise<NextResponse | null> {
  try {
    const limits = quotaLimits(kind);
    const { data, error } = await authDatabase().rpc("agnes_take_daily_quota", {
      p_user_id: userId, p_kind: kind, p_user_limit: limits.user, p_global_limit: limits.global,
    });
    if (error) throw error;
    const quota = Array.isArray(data) ? data[0] : data;
    if (!quota || typeof quota.allowed !== "boolean") throw new Error("Invalid quota response");
    if (quota.allowed) return null;
    if (quota.reason === "access_denied") return NextResponse.json({
      error: "公众号授权已失效，请重新关注并登录。", code: "WECHAT_FOLLOW_REQUIRED",
    }, { status: 403 });
    return NextResponse.json({
      error: quota.reason === "global_limit" ? "今日免费总额度已用完，请明天再来。" : "你的今日免费额度已用完，请明天再来。",
      code: "DAILY_QUOTA_EXCEEDED",
    }, { status: 429, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "暂时无法确认免费额度，请稍后再试。", code: "QUOTA_UNAVAILABLE" }, { status: 503 });
  }
}
