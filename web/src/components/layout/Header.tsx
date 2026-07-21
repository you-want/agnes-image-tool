"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Globe, Moon, Settings, Sun, Clock } from "lucide-react";
import SettingsModal from "@/components/settings/SettingsModal";
import HistoryButton from "@/components/layout/HistoryButton";
import HistoryModal from "@/components/layout/HistoryModal";
import { useTheme } from "@/hooks/useTheme";
import { NAV_ITEMS } from "@/lib/constants";
import { useLocale, useTranslations } from "@/hooks/useLocale";

export default function Header() {
  const t = useTranslations();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [brandFirst, ...brandRest] = t("brand.name").split(" ");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{
      background: "var(--bg-elevated)",
      borderColor: "var(--border)",
      height: "var(--header-height)",
    }}>
      <div className="container-page flex h-full items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline"
          aria-label={t("brand.name")}
        >
          <Image
            src="/brand/agnes-forge-mark.svg"
            alt={t("brand.logoAlt")}
            width={36}
            height={36}
            priority
            className="h-9 w-9 drop-shadow-sm"
          />
          <span className="font-display text-lg font-semibold tracking-tight hidden sm:inline">
            {brandFirst}{" "}
            <span className="gradient-text">{brandRest.join(" ")}</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.filter((_, i) => i > 0).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/[0.05]"
              style={{ color: "var(--text-secondary)" }}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLocaleOpen(!localeOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/[0.05]"
              style={{ color: "var(--text-secondary)" }}
              aria-label={t("common.switchLanguage")}
            >
              <Globe size={18} />
            </button>

            <AnimatePresence>
              {localeOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLocaleOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 z-20 w-36 overflow-hidden rounded-lg border shadow-lg"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {(["zh-CN", "en"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => {
                          setLocale(l);
                          setLocaleOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                        style={{
                          color: l === locale ? "var(--accent)" : "var(--text-primary)",
                        }}
                      >
                        {t(`locale.${l}`)}
                        {l === locale && (
                          <Check size={14} className="ml-auto" style={{ color: "var(--accent)" }} />
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setHistoryOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/[0.05]"
            style={{ color: "var(--text-secondary)" }}
            aria-label={t("history.title")}
          >
            <Clock size={18} />
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/[0.05]"
            style={{ color: "var(--text-secondary)" }}
            aria-label={t("common.openSettings")}
          >
            <Settings size={18} />
          </button>

          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/[0.05]"
            style={{ color: "var(--text-secondary)" }}
            aria-label={t("common.toggleTheme")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
