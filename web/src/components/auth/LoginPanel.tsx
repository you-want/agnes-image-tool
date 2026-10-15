"use client";

/* eslint-disable @next/next/no-img-element -- The public account QR can be a deployment-configured URL. */
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogOut, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "@/hooks/useLocale";

export default function LoginPanel({ returnTo = "/text-to-image" }: { returnTo?: string }) {
  const { status, loading, refresh, signOut } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [qrFailed, setQrFailed] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/wechat/code/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, returnTo }), credentials: "same-origin",
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || t("auth.loginFailed"));
      if (!await refresh()) throw new Error(t("auth.loginFailed"));
      router.push(result.returnTo);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("auth.loginFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError("");
    try { await signOut(); setCode(""); } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("auth.loginFailed"));
    } finally { setBusy(false); }
  }

  if (loading) return <div className="container-page py-24 text-center" role="status">{t("auth.loading")}</div>;
  if (status.allowed) return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-md text-center">
        <CheckCircle2 className="mx-auto mb-4" size={40} style={{ color: "var(--accent)" }} />
        <h1 className="font-display text-2xl font-semibold">{t("auth.signedIn")}</h1>
        <p className="my-5 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{t("auth.ready")}</p>
        <ErrorBanner message={error} />
        <Button className="w-full" onClick={() => router.push(returnTo === "/account" ? "/text-to-image" : returnTo)}>{t("auth.start")}</Button>
        <Button className="mt-3 w-full" variant="secondary" loading={busy} onClick={logout}><LogOut size={16} />{t("auth.logout")}</Button>
      </Card>
    </div>
  );

  return (
    <div className="container-page py-12 sm:py-20">
      <Card className="mx-auto max-w-2xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}><MessageCircle size={25} /></div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{t("auth.title")}</h1>
          <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{t("auth.subtitle")}</p>
        </div>
        <div className="grid items-start gap-7 sm:grid-cols-[200px_1fr]">
          <div className="text-center">
            {!qrFailed ? <img src={status.wechat.qrUrl} alt={t("auth.qrAlt", { name: status.wechat.name })} width={200} height={200} className="mx-auto h-[200px] w-[200px] rounded-xl bg-white object-contain p-2" onError={() => setQrFailed(true)} /> : <div className="flex h-[200px] items-center justify-center rounded-xl border p-5 text-sm" style={{ borderColor: "var(--border)" }}>{t("auth.qrFallback", { name: status.wechat.name })}</div>}
            <p className="mt-3 text-sm font-medium">{status.wechat.name}</p>
          </div>
          <div>
            <ol className="mb-6 space-y-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              <li>1. {t("auth.stepFollow", { name: status.wechat.name })}</li>
              <li>2. {t("auth.stepKeyword", { keyword: status.wechat.keyword })}</li>
              <li>3. {t("auth.stepCode")}</li>
            </ol>
            <form onSubmit={submit} className="space-y-4">
              <label className="block text-sm font-medium" htmlFor="wechat-login-code">{t("auth.codeLabel")}</label>
              <input id="wechat-login-code" name="code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required disabled={busy || !status.configured}
                placeholder="000000" className="w-full rounded-xl border px-4 py-3 text-center font-mono text-2xl tracking-[0.35em] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }} aria-describedby="wechat-code-hint" />
              <p id="wechat-code-hint" className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>{t("auth.codeHint")}</p>
              <ErrorBanner message={error || (status.code !== "AUTH_REQUIRED" ? status.error : "") || ""} />
              <Button type="submit" className="w-full" loading={busy} disabled={!status.configured || code.length !== 6}><ShieldCheck size={17} />{t("auth.login")}</Button>
            </form>
            <button onClick={() => { setError(""); void refresh(); }} className="mt-4 inline-flex items-center gap-1.5 rounded p-1 text-xs hover:underline"><RefreshCw size={13} />{t("auth.retry")}</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
