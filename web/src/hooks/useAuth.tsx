"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface AuthStatus {
  configured: boolean;
  authenticated: boolean;
  allowed: boolean;
  expiresAt: string | null;
  error: string | null;
  code: string | null;
  wechat: { name: string; keyword: string; qrUrl: string };
}

const initialStatus: AuthStatus = {
  configured: false, authenticated: false, allowed: false, expiresAt: null, error: null, code: null,
  wechat: { name: "与 IT 有约", keyword: "登录", qrUrl: "/wechat-official-account-qr.png" },
};
const AuthContext = createContext<{
  status: AuthStatus; loading: boolean; refresh: () => Promise<boolean>; signOut: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("Authentication unavailable");
      const next: AuthStatus = await response.json();
      setStatus(next);
      return next.allowed;
    } catch {
      setStatus((previous) => ({ ...previous, allowed: false, error: "无法确认登录状态，请检查网络后重试。", code: "AUTH_UNAVAILABLE" }));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("agnes-auth-changed", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("agnes-auth-changed", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (!status.authenticated) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60_000);
    return () => window.clearInterval(timer);
  }, [status.authenticated, refresh]);

  const signOut = useCallback(async () => {
    const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    if (!response.ok) throw new Error("退出登录失败，请稍后重试。");
    await refresh();
  }, [refresh]);

  return <AuthContext.Provider value={{ status, loading, refresh, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
