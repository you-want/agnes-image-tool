"use client";

import { useTranslations } from "@/hooks/useLocale";

export default function Footer() {
  const t = useTranslations();
  return (
    <footer className="mt-auto border-t py-8" style={{
      borderColor: "var(--border)",
      color: "var(--text-muted)",
    }}>
      <div className="container-page flex flex-col items-center justify-between gap-3 sm:flex-row text-sm">
        <p>{t("footer.copyright")}</p>
      </div>
    </footer>
  );
}
