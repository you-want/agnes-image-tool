"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Film, Loader2, Settings2, Upload, Image as ImageIcon, Music, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ErrorBanner from "@/components/ui/ErrorBanner";
import PromptEditor from "@/components/prompt/PromptEditor";
import VideoPlayer from "@/components/video/VideoPlayer";
import { useTranslations } from "@/hooks/useLocale";
import { usePromptState } from "@/hooks/usePromptState";
import { useVideoPolling } from "@/hooks/useVideoPolling";
import { addHistoryEntry } from "@/lib/history-store";

const ASPECT_RATIOS = ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"] as const;
const MODES = [
  { value: "text", label: "文生视频" },
  { value: "keyframe", label: "首尾帧控制" },
  { value: "reference", label: "图片/音频参考" },
] as const;

interface UploadedFile {
  url: string;
  name: string;
  type: string;
}

interface FlashParams {
  mode: string;
  aspectRatio: string;
  seconds: number;
  negativePrompt: string;
  seed?: number;
  firstFrameUrl: string;
  lastFrameUrl: string;
  imageUrls: string;
  audioUrls: string;
  uploadedImages: UploadedFile[];
  uploadedAudios: UploadedFile[];
}

export default function VideoFlashPage() {
  const t = useTranslations();
  const router = useRouter();
  const [prompt, setPrompt] = usePromptState("");
  const [params, setParams] = useState<FlashParams>({
    mode: "text",
    aspectRatio: "16:9",
    seconds: 5,
    negativePrompt: "",
    firstFrameUrl: "",
    lastFrameUrl: "",
    imageUrls: "",
    audioUrls: "",
    uploadedImages: [],
    uploadedAudios: [],
  });
  const [advanced, setAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const {
    videoUrl,
    status,
    progress,
    error,
    loading,
    begin,
    fail,
    start,
  } = useVideoPolling();

  const handleChange = (key: keyof FlashParams, value: unknown) => {
    setParams((s) => ({ ...s, [key]: value }));
  };

  const getEstimatedOutput = () => {
    const ratioMap: Record<string, string> = {
      "21:9": "1680×720",
      "16:9": "1280×704",
      "4:3": "960×720",
      "1:1": "720×720",
      "3:4": "720×960",
      "9:16": "720×1280",
    };
    return ratioMap[params.aspectRatio] || "1280×704";
  };

  const handleFileUpload = async (file: File, type: "image" | "audio") => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/video/flash/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const uploadedFile: UploadedFile = {
        url: data.url,
        name: file.name,
        type: file.type,
      };

      if (type === "image") {
        setParams((s) => ({ ...s, uploadedImages: [...s.uploadedImages, uploadedFile] }));
      } else {
        setParams((s) => ({ ...s, uploadedAudios: [...s.uploadedAudios, uploadedFile] }));
      }
    } catch (err) {
      fail(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeUploadedImage = (index: number) => {
    setParams((s) => ({
      ...s,
      uploadedImages: s.uploadedImages.filter((_, i) => i !== index),
    }));
  };

  const removeUploadedAudio = (index: number) => {
    setParams((s) => ({
      ...s,
      uploadedAudios: s.uploadedAudios.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    if (params.mode === "keyframe" && !params.firstFrameUrl.trim() && !params.lastFrameUrl.trim() && params.uploadedImages.length === 0) {
      fail(t("error.keyframeRequired"));
      return;
    }
    if (params.mode === "reference") {
      const imgs = params.imageUrls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      const auds = params.audioUrls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      if (imgs.length === 0 && auds.length === 0 && params.uploadedImages.length === 0 && params.uploadedAudios.length === 0) {
        fail(t("error.referenceRequired"));
        return;
      }
    }

    begin();
    setSubmitting(true);

    try {
      // Combine URL inputs with uploaded files
      // Cap at the API hard limit of 4 images per request (exceeding
      // returns 400 "Image count N exceeds limit 4 per request")
      const MAX_IMAGES = 4;
      const imagesList = [
        ...params.imageUrls.split("\n").map((u) => u.trim()).filter(Boolean),
        ...params.uploadedImages.map((f) => f.url),
      ].slice(0, MAX_IMAGES);
      const audiosList = [
        ...params.audioUrls.split("\n").map((u) => u.trim()).filter(Boolean),
        ...params.uploadedAudios.map((f) => f.url),
      ];

      const payload: Record<string, unknown> = {
        prompt,
        mode: params.mode,
        seconds: String(params.seconds),
        aspect_ratio: params.aspectRatio,
      };

      if (params.firstFrameUrl.trim()) payload.first_frame = params.firstFrameUrl.trim();
      if (params.lastFrameUrl.trim()) payload.last_frame = params.lastFrameUrl.trim();
      if (imagesList.length > 0) payload.images = imagesList;
      if (audiosList.length > 0) payload.audios = audiosList;
      if (params.negativePrompt.trim()) payload.negative_prompt = params.negativePrompt.trim();
      if (params.seed !== undefined) payload.seed = params.seed;

      const res = await fetch("/api/video/flash/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const videoId = data.data?.video_id || data.data?.id || data.data?.task_id;
      if (!videoId) throw new Error(t("error.noVideoTaskId"));

      await start(videoId, {
        timeoutMessage: t("error.videoTimeout"),
        failedMessage: t("error.generationFailed"),
        onComplete: (url) => {
          addHistoryEntry({
            type: "video",
            sourceRoute: "/video-flash",
            prompt,
            mediaUrl: url,
          });
        },
      });
    } catch (err) {
      fail(err instanceof Error ? err.message : t("error.generationFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic hint based on mode
  const modeHint =
    params.mode === "text"
      ? t("flash.modeTextHint")
      : params.mode === "keyframe"
      ? t("flash.modeKeyframeHint")
      : t("flash.modeReferenceHint");

  return (
    <div className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container-page"
      >
        <div className="text-center lg:text-left mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-bold">{t("flash.title")}</h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("flash.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-5">
            <Card className="lg:sticky lg:top-20">
              <div className="space-y-4">
                {/* Mode Selection */}
                <Select
                  label={t("flash.mode")}
                  options={MODES.map((m) => ({ value: m.value, label: m.label }))}
                  value={params.mode}
                  onChange={(e) => handleChange("mode", e.target.value)}
                />

                {/* Prompt */}
                <PromptEditor
                  label={t("flash.prompt")}
                  placeholder={t("flash.promptPlaceholder")}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onOptimize={() => router.push("/optimize")}
                  rows={4}
                />

                {/* Mode-specific media inputs */}
                {params.mode === "keyframe" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <Input
                      label={t("flash.firstFrame")}
                      placeholder={t("flash.firstFramePlaceholder")}
                      value={params.firstFrameUrl}
                      onChange={(e) => handleChange("firstFrameUrl", e.target.value)}
                      hint={t("flash.firstFrameHint")}
                    />
                    <Input
                      label={t("flash.lastFrame")}
                      placeholder={t("flash.lastFramePlaceholder")}
                      value={params.lastFrameUrl}
                      onChange={(e) => handleChange("lastFrameUrl", e.target.value)}
                      hint={t("flash.lastFrameHint")}
                    />

                    {/* Upload buttons for keyframe mode */}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploading}
                        className="flex-1"
                      >
                        <Upload size={14} />
                        {t("flash.uploadImage")}
                      </Button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "image");
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {params.mode === "reference" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {/* Image URLs */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                        {t("flash.images")}
                      </label>
                      <textarea
                        value={params.imageUrls}
                        onChange={(e) => handleChange("imageUrls", e.target.value)}
                        placeholder={"https://example.com/ref1.png\nhttps://example.com/ref2.png"}
                        rows={3}
                        className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none resize-y transition-all duration-200 focus:ring-2 focus:ring-[var(--accent-soft)]"
                        style={{
                          background: "var(--bg-input)",
                          borderColor: "var(--border)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("flash.imagesHint")}</p>
                    </div>

                    {/* Audio URLs */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                        {t("flash.audios")}
                      </label>
                      <textarea
                        value={params.audioUrls}
                        onChange={(e) => handleChange("audioUrls", e.target.value)}
                        placeholder={"https://example.com/audio1.mp3"}
                        rows={2}
                        className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none resize-y transition-all duration-200 focus:ring-2 focus:ring-[var(--accent-soft)]"
                        style={{
                          background: "var(--bg-input)",
                          borderColor: "var(--border)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("flash.audiosHint")}</p>
                    </div>

                    {/* Upload buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploading || params.uploadedImages.length >= 4}
                        className="flex-1"
                      >
                        <ImageIcon size={14} />
                        {t("flash.uploadImage")}
                      </Button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "image");
                          e.target.value = "";
                        }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => audioInputRef.current?.click()}
                        disabled={uploading || params.uploadedAudios.length >= 3}
                        className="flex-1"
                      >
                        <Music size={14} />
                        {t("flash.uploadAudio")}
                      </Button>
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "audio");
                          e.target.value = "";
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("flash.uploadHint")}</p>

                    {/* Uploaded images preview */}
                    {params.uploadedImages.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                          {t("flash.uploadedPreview")} ({params.uploadedImages.length}/5)
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                          {params.uploadedImages.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-16 object-cover rounded-lg border"
                                style={{ borderColor: "var(--border)" }}
                              />
                              <button
                                onClick={() => removeUploadedImage(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Uploaded audios preview */}
                    {params.uploadedAudios.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                          {t("flash.uploadedPreview")} ({params.uploadedAudios.length}/3)
                        </p>
                        <div className="space-y-1">
                          {params.uploadedAudios.map((aud, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Music size={14} style={{ color: "var(--text-muted)" }} />
                              <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                                {aud.name}
                              </span>
                              <button onClick={() => removeUploadedAudio(idx)} style={{ color: "var(--text-muted)" }}>
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Duration & Aspect Ratio */}
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={t("flash.duration")}
                    options={[4, 5, 6, 7, 8, 9, 10, 11, 12].map((d) => ({
                      value: String(d),
                      label: t("common.seconds", { value: d }),
                    }))}
                    value={String(params.seconds)}
                    onChange={(e) => handleChange("seconds", Number(e.target.value))}
                    hint={t("flash.durationHint")}
                  />
                  <Select
                    label={t("flash.aspectRatio")}
                    options={ASPECT_RATIOS.map((r) => ({ value: r, label: r }))}
                    value={params.aspectRatio}
                    onChange={(e) => handleChange("aspectRatio", e.target.value)}
                  />
                </div>

                {/* Output info */}
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("flash.outputSize", { size: getEstimatedOutput() })}
                </p>
                <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                  💡 {t("flash.multiSegmentHint")}
                </p>

                {/* Negative prompt */}
                <Input
                  label={t("flash.negativePrompt")}
                  placeholder={t("flash.negativePlaceholder")}
                  value={params.negativePrompt}
                  onChange={(e) => handleChange("negativePrompt", e.target.value)}
                />

                {/* Mode hint */}
                <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                  {modeHint}
                </p>

                {/* Advanced */}
                <button
                  onClick={() => setAdvanced(!advanced)}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--accent)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Settings2 size={12} />
                  {advanced ? t("flash.collapseAdvanced") : t("flash.advanced")}
                </button>

                {advanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 pt-2 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Input
                      label={t("flash.seed")}
                      type="number"
                      placeholder={t("flash.seedPlaceholder")}
                      onChange={(e) =>
                        handleChange("seed", e.target.value ? Number(e.target.value) : undefined)
                      }
                      hint={t("flash.seedHint")}
                    />
                  </motion.div>
                )}

                <ErrorBanner message={error} />

                <Button
                  onClick={handleSubmit}
                  loading={loading || submitting}
                  disabled={!prompt.trim() || submitting}
                  className="w-full"
                  size="lg"
                >
                  {loading || submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Film size={18} />
                  )}
                  {loading || submitting ? t("flash.generating") : t("flash.generate")}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-7">
            <VideoPlayer
              src={videoUrl}
              progress={progress}
              status={status}
              error={error}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
