"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, Wifi, WifiOff, Smartphone } from "lucide-react";
import { useTranslations } from "@/hooks/useLocale";
import { usePWA, useIsPWA, useInstallPrompt } from "@/hooks/usePWA";
import Button from "./Button";
import Card from "./Card";

interface PWAPromptProps {
  className?: string;
}

export default function PWAPrompt({ className }: PWAPromptProps) {
  const t = useTranslations();
  const { isOffline, updateAvailable, updateServiceWorker } = usePWA();
  const { isInstallable, installApp } = useInstallPrompt();
  const isStandalone = useIsPWA();

  if (isStandalone) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-3 shadow-lg flex items-center gap-3 p-4">
              <WifiOff size={20} className="text-orange-500" />
              <div className="flex-1">
                <p className="font-medium text-sm">{t("pwa.offlineTitle")}</p>
                <p className="text-xs opacity-75">{t("pwa.offlineDesc")}</p>
              </div>
              <Wifi size={20} className="text-gray-400" />
            </Card>
          </motion.div>
        )}

        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-3 shadow-lg flex items-center gap-3 p-4">
              <Smartphone size={20} className="text-blue-500" />
              <div className="flex-1">
                <p className="font-medium text-sm">{t("pwa.installTitle")}</p>
                <p className="text-xs opacity-75">{t("pwa.installDesc")}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
                  {t("pwa.installLater")}
                </Button>
                <Button size="sm" onClick={installApp}>
                  {t("pwa.install")}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {updateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-lg flex items-center gap-3 p-4">
              <Download size={20} className="text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-sm">{t("pwa.updateTitle")}</p>
                <p className="text-xs opacity-75">{t("pwa.updateDesc")}</p>
              </div>
              <Button size="sm" onClick={updateServiceWorker}>
                {t("pwa.update")}
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}