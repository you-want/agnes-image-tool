"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, RefreshCw } from "lucide-react";
import ImageGallery from "@/components/image/ImageGallery";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useTranslations } from "@/hooks/useLocale";
import { getAllHistory, type HistoryEntry } from "@/lib/history-store";

export default function OfflineGallery() {
  const t = useTranslations();
  const [cachedImages, setCachedImages] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const history = getAllHistory();
    const imageHistory = history.filter((item) => item.type === "image");
    const sorted = [...imageHistory].sort((a, b) => b.createdAt - a.createdAt);
    setCachedImages(sorted);
    setLoading(false);
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="container-page">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="animate-spin text-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (cachedImages.length === 0) {
    return (
      <div className="py-8">
        <div className="container-page">
          <Card className="p-8 text-center">
            <History size={48} className="mx-auto mb-4 text-gray-400" />
            <h2 className="font-display text-xl font-semibold mb-2">
              {t("offline.emptyTitle")}
            </h2>
            <p className="text-gray-600 mb-4">
              {t("offline.emptyDescription")}
            </p>
            <Button onClick={handleRetry}>
              <RefreshCw size={16} className="mr-2" />
              {t("offline.goOnline")}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container-page"
      >
        <div className="mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-2">
            {t("offline.galleryTitle")}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("offline.galleryDescription")}
          </p>
        </div>

        <ImageGallery
          images={cachedImages.map((img) => ({
            url: img.mediaUrl,
            revised_prompt: img.revisedPrompt ?? null,
          }))}
          editable={false}
          showRevisedPrompt={true}
        />

        <div className="mt-8 text-center">
          <Button onClick={handleRetry} variant="secondary">
            <RefreshCw size={16} className="mr-2" />
            {t("offline.goOnline")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
