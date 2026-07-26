"use client";

import { motion } from "framer-motion";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { useTranslations } from "@/hooks/useLocale";
import Button from "@/components/ui/Button";
import OfflineGallery from "@/components/image/OfflineGallery";

export default function OfflinePage() {
  const t = useTranslations();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen">
      <div className="py-8">
        <div className="container-page">
          {/* Offline Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md mb-8"
          >
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <WifiOff size={32} className="text-gray-400" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">
                {t("offline.title")}
              </h1>
              <p className="text-gray-600">
                {t("offline.description")}
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={handleRefresh} className="w-full">
                <RefreshCw size={16} className="mr-2" />
                {t("offline.retry")}
              </Button>
              <Button variant="secondary" onClick={handleGoHome} className="w-full">
                <Home size={16} className="mr-2" />
                {t("offline.goHome")}
              </Button>
            </div>
          </motion.div>

          {/* Offline Gallery */}
          <OfflineGallery />
        </div>
      </div>
    </div>
  );
}