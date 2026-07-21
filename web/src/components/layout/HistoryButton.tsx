"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "@/hooks/useLocale";

interface HistoryButtonProps {
  onClick: () => void;
}

export default function HistoryButton({ onClick }: HistoryButtonProps) {
  const t = useTranslations();

  return (
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/[0.05]"
      style={{ color: "var(--text-secondary)" }}
      aria-label={t("history.title")}
      title={t("history.title")}
    >
      <Clock size={18} />
    </button>
  );
}
