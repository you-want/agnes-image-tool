"use client";

import { useState, useRef, ChangeEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, Loader2, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import ErrorBanner from "@/components/ui/ErrorBanner";
import PromptEditor from "@/components/prompt/PromptEditor";
import ImageGallery from "@/components/image/ImageGallery";
import { IMAGE_SIZE_OPTIONS, IMAGE_RATIO_OPTIONS, type ImageSizePreset, type ImageRatio } from "@/lib/constants";
import { useTranslations } from "@/hooks/useLocale";
import { usePromptState } from "@/hooks/usePromptState";
import { addHistoryEntry } from "@/lib/history-store";

export default function ImageToImagePage() {
  const t = useTranslations();
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [prompt, setPrompt] = usePromptState("");
  const [size, setSize] = useState<ImageSizePreset>("1K");
  const [ratio, setRatio] = useState<ImageRatio>("1:1");
  const [images, setImages] = useState<Array<{ url?: string; b64_json?: string; revised_prompt?: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("error.uploadRequired"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t("error.imageTooLarge"));
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError("");
  }, [t]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleGenerate = async () => {
    if (!imageFile) return;
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setImages([]);

    try {
      const base64 = await readFileAsBase64(imageFile);
      const imageUrl = `data:${imageFile.type};base64,${base64}`;

      const res = await fetch("/api/image/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          size,
          ratio,
          image: imageUrl,
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
          sourceRoute: "/image-to-image",
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
          <h1 className="font-display text-2xl lg:text-3xl font-bold">{t("i2i.title")}</h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("i2i.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-5">
            <Card className="lg:sticky lg:top-20">
              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    {t("i2i.referenceImage")}
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    style={{ borderColor: isDragging ? "var(--accent)" : "var(--border)" }}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt={t("common.preview")} className="max-h-40 rounded-lg object-contain" />
                    ) : (
                      <>
                        <Upload size={28} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{t("i2i.uploadClick")}</p>
                        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{t("i2i.dragDropHint")}</p>
                        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{t("i2i.maxSize")}</p>
                      </>
                    )}
                  </div>
                </div>

                <PromptEditor
                  label={t("i2i.styleDesc")}
                  placeholder={t("i2i.stylePlaceholder")}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onOptimize={() => router.push("/optimize")}
                  rows={3}
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

                <ErrorBanner message={error} />

                <Button
                  onClick={handleGenerate}
                  loading={loading}
                  disabled={!imageFile || !prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {loading ? t("i2i.generating") : t("i2i.generate")}
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

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result.split(",")[1]);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
