"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, RotateCcw, Check, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { fetchConfigStatus, saveConfig } from "@/lib/config-client";
import { useTranslations } from "@/hooks/useLocale";

const DEFAULT_BASE_URL = "https://apihub.agnes-ai.com";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const t = useTranslations();
  // apiKey holds only what the user types this session — the saved key is never
  // sent back to the browser. `hasApiKey` reflects whether one is stored.
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey("");
      setSaved(false);
      fetchConfigStatus().then((status) => {
        setHasApiKey(status.hasApiKey);
        setBaseUrl(status.baseUrl || DEFAULT_BASE_URL);
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    // Blank apiKey => server keeps the existing key.
    await saveConfig({ apiKey: apiKey.trim() || undefined, baseUrl });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  const handleReset = async () => {
    setApiKey("");
    setBaseUrl(DEFAULT_BASE_URL);
    setHasApiKey(false);
    setSaved(false);
    await saveConfig({ clear: true, baseUrl: DEFAULT_BASE_URL });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative w-full max-w-md"
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold">{t("settings.title")}</h2>
                <button
                  onClick={onClose}
                  aria-label={t("common.close")}
                  className="rounded-lg p-1.5 transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label={t("settings.apiKey")}
                  placeholder={
                    hasApiKey
                      ? t("settings.apiKeyConfiguredPlaceholder")
                      : t("settings.apiKeyPlaceholder")
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  hint={
                    hasApiKey
                      ? t("settings.apiKeyConfiguredHint")
                      : t("settings.apiKeyHint")
                  }
                  type="password"
                />

                <Input
                  label={t("settings.baseUrl")}
                  placeholder={t("settings.baseUrlPlaceholder")}
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  hint={t("settings.baseUrlHint")}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    className="flex-1"
                    size="md"
                    loading={saving}
                  >
                    {saved ? (
                      <>
                        <Check size={16} />
                        {t("settings.saved")}
                      </>
                    ) : saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {t("settings.saving")}
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        {t("settings.save")}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleReset}
                    variant="secondary"
                    className="flex-1"
                    size="md"
                  >
                    <RotateCcw size={16} />
                    {t("settings.reset")}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
