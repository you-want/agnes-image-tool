"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "@/hooks/useLocale";
import LoginPanel from "./LoginPanel";

export default function AccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, loading } = useAuth();
  const t = useTranslations();
  if (["/", "/account", "/offline"].includes(pathname)) return children;
  if (loading) return <div className="container-page py-24 text-center" role="status">{t("auth.loading")}</div>;
  return status.allowed ? children : <LoginPanel returnTo={pathname} />;
}
