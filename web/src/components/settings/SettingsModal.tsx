"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { fetchConfigStatus } from "@/lib/config-client";
import { useTranslations } from "@/hooks/useLocale";

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const t = useTranslations();
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setConfigured(null);
    void fetchConfigStatus().then((status) => { if (active) setConfigured(status.hasApiKey); });
    return () => { active = false; };
  }, [isOpen]);
  return (
    <Modal open={isOpen} onClose={onClose} title={t("settings.title")} className="max-w-md">
      <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{t("auth.managedConfig")}</p>
      <div className="mt-5 flex items-center gap-2 text-sm" role="status">
        {configured ? <CheckCircle2 size={18} style={{ color: "var(--accent)" }} /> : <CircleAlert size={18} />}
        {configured === null ? t("auth.loading") : configured ? t("auth.modelReady") : t("auth.modelUnavailable")}
      </div>
    </Modal>
  );
}
