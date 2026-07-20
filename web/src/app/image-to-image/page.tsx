"use client";

import { useState, useRef, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Slider from "@/components/ui/Slider";
import PromptEditor from "@/components/prompt/PromptEditor";
import ImageGallery from "@/components/image/ImageGallery";
import { IMAGE_SIZE_OPTIONS, IMAGE_RATIO_OPTIONS, type ImageSizePreset, type ImageRatio } from "@/lib/constants";
import { useTranslations } from "@/hooks/useLocale";

export default function ImageToImagePage() {
  const t = useTranslations();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [size, setSize] = useState<ImageSizePreset>("1K");
  const [ratio, setRatio] = useState<ImageRatio>("1:1");
  const [strength, setStrength] = useState(0.75);
  const [count, setCount] = useState(1);
  const [images, setImages] = useState<Array<{ url?: string; b64_json?: string; revised_prompt?: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
  };

  const handleGenerate = async () => {
    if (!imageFile) return;
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setImages([]);

    try {
      // Read file as base64 data URI
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
          strength,
          n: count,
          negative_prompt: negativePrompt || undefined,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setImages(data.data?.data || []);
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
        className="max-w-[1400px] mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold">{t("i2i.title")}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("i2i.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-2 xl:col-span-3">
            <Card>
              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    {t("i2i.referenceImage")}
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {imagePreview ? (
                      <img src={imagePreview} alt={t("common.preview")} className="max-h-40 rounded-lg object-contain" />
                    ) : (
                      <>
                        <Upload size={28} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{t("i2i.uploadClick")}</p>
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
                  onOptimize={() => window.location.href = "/optimize"}
                  rows={3}
                />

                <Input
                  label={t("i2i.negativePrompt")}
                  placeholder={t("i2i.negativePlaceholder")}
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
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

                <Slider
                  label={t("i2i.strength")}
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={strength}
                  onChange={(e) => setStrength(Number(e.target.value))}
                  valueLabel={`${strength.toFixed(2)}`}
                />

                <Input
                  label={t("i2i.count")}
                  type="number"
                  min={1}
                  max={4}
                  value={String(count)}
                  onChange={(e) => setCount(Math.min(4, Math.max(1, Number(e.target.value))))}
                />

                {error && (
                  <div className="rounded-lg px-3 py-2 text-sm" style={{
                    background: "var(--error-soft)",
                    color: "var(--error)",
                  }}>
                    {error}
                  </div>
                )}

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
          <div className="lg:col-span-3 xl:col-span-4">
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
        resolve(result.split(",")[1]); // Remove data URI prefix
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
