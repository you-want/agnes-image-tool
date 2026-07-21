"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import PromptEditor from "@/components/prompt/PromptEditor";
import ImageGallery from "@/components/image/ImageGallery";
import { IMAGE_SIZE_OPTIONS, IMAGE_RATIO_OPTIONS, type ImageSizePreset, type ImageRatio } from "@/lib/constants";
import { useTranslations } from "@/hooks/useLocale";
import { usePromptState } from "@/hooks/usePromptState";
import { addHistoryEntry } from "@/lib/history-store";

export default function TextToImagePage() {
  const t = useTranslations();
  const [prompt, setPrompt] = usePromptState("");
  const [size, setSize] = useState<ImageSizePreset>("1K");
  const [ratio, setRatio] = useState<ImageRatio>("1:1");
  const [images, setImages] = useState<Array<{ url?: string; b64_json?: string; revised_prompt?: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setImages([]);

    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          size,
          ratio,
          extra_body: { response_format: "url" },
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const generatedImages = data.data?.data || [];
      setImages(generatedImages);

      // Record each successful image in history
      for (const img of generatedImages) {
        addHistoryEntry({
          type: "image",
          sourceRoute: "/text-to-image",
          prompt,
          mediaUrl: img.url,
          revisedPrompt: img.revised_prompt || undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.generationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container-page"
      >
        <div className="text-center lg:text-left mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-bold">{t("t2i.title")}</h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("t2i.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-5">
            <Card className="lg:sticky lg:top-20">
              <div className="space-y-4">
                <PromptEditor
                  label={t("t2i.prompt")}
                  placeholder={t("t2i.promptPlaceholder")}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onOptimize={() => window.location.href = "/optimize"}
                  rows={4}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={t("t2i.size")}
                    options={IMAGE_SIZE_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
                    value={size}
                    onChange={(e) => setSize(e.target.value as ImageSizePreset)}
                  />
                  <Select
                    label={t("t2i.ratio")}
                    options={IMAGE_RATIO_OPTIONS.map((r) => ({ value: r, label: r }))}
                    value={ratio}
                    onChange={(e) => setRatio(e.target.value as ImageRatio)}
                  />
                </div>

                {error && (
                  <div className="rounded-lg px-3 py-2 text-sm" style={{
                    background: "var(--error-soft)",
                    color: "var(--error)",
                    borderColor: "var(--error)",
                  }}>
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  loading={loading}
                  disabled={!prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {loading ? t("t2i.generating") : t("t2i.generate")}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-7">
            <ImageGallery images={images} loading={loading} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
