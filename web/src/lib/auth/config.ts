export function authEnv(name: string): string {
  const value = process.env[name]?.trim() || "";
  return value.replace(/^(["'])(.*)\1$/, "$2").trim();
}

export function authConfigured(): boolean {
  return Boolean(
    (authEnv("SUPABASE_URL") || authEnv("NEXT_PUBLIC_SUPABASE_URL")) &&
    authEnv("SUPABASE_SERVICE_ROLE_KEY") &&
    authEnv("WECHAT_LOGIN_HMAC_SECRET").length >= 32
  );
}

export function boundedEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = authEnv(name);
  const value = Number(raw);
  return raw && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

export function sessionMaxAge(): number {
  return boundedEnv("AUTH_SESSION_MAX_AGE_SECONDS", 7 * 86400, 300, 30 * 86400);
}

export function publicWechatConfig() {
  const raw = authEnv("WECHAT_PUBLIC_ACCOUNT_QR_URL");
  const qrUrl = raw.startsWith("/") && !raw.startsWith("//")
    ? raw
    : /^https:\/\//.test(raw) ? raw : "/wechat-official-account-qr.png";
  return {
    name: authEnv("WECHAT_PUBLIC_ACCOUNT_NAME") || "与 IT 有约",
    keyword: authEnv("WECHAT_LOGIN_KEYWORD") || "登录",
    qrUrl,
  };
}
