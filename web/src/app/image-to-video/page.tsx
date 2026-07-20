"use client";

import { useState, useRef, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Film, Upload, Loader2, Settings2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Slider from "@/components/ui/Slider";
import PromptEditor from "@/components/prompt/PromptEditor";
import VideoPlayer from "@/components/video/VideoPlayer";
import {
  VIDEO_RATIO_OPTIONS,
  VIDEO_RESOLUTION_CHOICES,
  VIDEO_DURATION_CHOICES,
  VIDEO_FRAME_RATE_CHOICES,
  type VideoRatio,
  calculateFrames,
  getMaxFrames,
  getVideoDimensions,
} from "@/lib/constants";
import { useTranslations } from "@/hooks/useLocale";

interface VideoState {
  prompt: string;
  negativePrompt: string;
  resolution: string;
  ratio: VideoRatio;
  width?: number;
  height?: number;
  duration: number;
  frameRate: number;
  numFrames?: number;
  seed?: number;
  steps?: number;
}

export default function ImageToVideoPage() {
  const t = useTranslations();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [state, setState] = useState<VideoState>({
    prompt: "",
    negativePrompt: "",
    resolution: "720p",
    ratio: "16:9",
    duration: 5,
    frameRate: 24,
  });
  const [videoUrl, setVideoUrl] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [advanced, setAdvanced] = useState(false);
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
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setError("");
  };

  const handleChange = (key: keyof VideoState, value: unknown) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!state.prompt.trim()) return;

    let imageInput = imageUrl.trim();
    if (!imageInput && imageFile) {
      try {
        const base64 = await readFileAsBase64(imageFile);
        imageInput = `data:${imageFile.type};base64,${base64}`;
      } catch {
        setError(t("error.readImage"));
        return;
      }
    }

    if (!imageInput) {
      setError(t("error.uploadRequired"));
      return;
    }

    setLoading(true);
    setError("");
    setVideoUrl("");
    setStatus("queued");
    setProgress(0);

    try {
      const dims = getVideoDimensions(state.resolution, state.ratio);
      const maxFrames = getMaxFrames(state.resolution, state.width, state.height);
      const autoFrames = calculateFrames(state.duration, state.frameRate);

      const payload: Record<string, unknown> = {
        prompt: state.prompt,
        model: "agnes-video-v2.0",
        image: imageInput,
        frame_rate: state.frameRate,
      };

      if (dims && !state.width && !state.height) {
        payload.width = dims.w;
        payload.height = dims.h;
      } else if (state.width && state.height) {
        payload.width = state.width;
        payload.height = state.height;
      }

      if (state.numFrames) {
        payload.num_frames = Math.min(state.numFrames, maxFrames);
      } else {
        payload.num_frames = autoFrames;
      }

      if (state.seed !== undefined) payload.seed = state.seed;
      if (state.steps) payload.num_inference_steps = state.steps;
      if (state.negativePrompt) payload.negative_prompt = state.negativePrompt;

      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const videoId = data.data?.video_id || data.data?.id || data.data?.task_id;
      if (!videoId) throw new Error(t("error.noVideoTaskId"));

      pollVideoStatus(videoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.generationFailed"));
      setStatus("failed");
      setLoading(false);
    }
  };

  const pollVideoStatus = async (videoId: string) => {
    let waited = 0;
    const maxWait = 1800_000;
    const interval = 5000;

    while (waited < maxWait) {
      await new Promise((r) => setTimeout(r, interval));
      waited += interval;

      try {
        const res = await fetch(`/api/video/status/${encodeURIComponent(videoId)}`);
        const data = await res.json();

        if (data.error) {
          setStatus("failed");
          setError(data.error);
          return;
        }

        const statusData = data.data;
        const s = statusData.status;
        const p = statusData.progress || 0;

        setStatus(s);
        setProgress(p);

        if (s === "completed") {
          setVideoUrl(statusData.url || "");
          setLoading(false);
          setStatus("");
          setProgress(100);
          return;
        }

        if (s === "failed") {
          setError(statusData.error?.message || t("error.generationFailed"));
          setStatus("failed");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }

    setError(t("error.videoTimeout"));
    setStatus("failed");
    setLoading(false);
  };

  return (
    <div className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1400px] mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold">{t("i2v.title")}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("i2v.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-2 xl:col-span-3">
            <Card>
              <div className="space-y-4">
                {/* Image Input */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    {t("i2v.referenceImage")}
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
                      <img src={imagePreview} alt={t("common.preview")} className="max-h-32 rounded-lg object-contain" />
                    ) : (
                      <>
                        <Upload size={28} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{t("i2v.uploadClick")}</p>
                      </>
                    )}
                  </div>
                </div>

                <Input
                  label={t("i2v.imageUrl")}
                  placeholder={t("common.imageUrlPlaceholder")}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  hint={t("i2v.urlHint")}
                />

                <PromptEditor
                  label={t("i2v.videoDescription")}
                  placeholder={t("i2v.videoPlaceholder")}
                  value={state.prompt}
                  onChange={(e) => handleChange("prompt", e.target.value)}
                  onOptimize={() => window.location.href = "/optimize"}
                  rows={3}
                />

                <Input
                  label={t("i2v.negativePrompt")}
                  placeholder={t("i2v.negativePlaceholder")}
                  value={state.negativePrompt}
                  onChange={(e) => handleChange("negativePrompt", e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={t("i2v.resolution")}
                    options={VIDEO_RESOLUTION_CHOICES.map((r) => ({ value: r, label: r }))}
                    value={state.resolution}
                    onChange={(e) => handleChange("resolution", e.target.value)}
                  />
                  <Select
                    label={t("i2v.ratio")}
                    options={VIDEO_RATIO_OPTIONS.map((r) => ({ value: r, label: r }))}
                    value={state.ratio}
                    onChange={(e) => handleChange("ratio", e.target.value as VideoRatio)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={t("i2v.duration")}
                    options={VIDEO_DURATION_CHOICES.map((d) => ({ value: String(d), label: t("common.seconds", { value: d }) }))}
                    value={String(state.duration)}
                    onChange={(e) => handleChange("duration", Number(e.target.value))}
                  />
                  <Select
                    label={t("i2v.frameRate")}
                    options={VIDEO_FRAME_RATE_CHOICES.map((f) => ({ value: String(f), label: t("common.framesPerSecond", { value: f }) }))}
                    value={String(state.frameRate)}
                    onChange={(e) => handleChange("frameRate", Number(e.target.value))}
                  />
                </div>

                <button
                  onClick={() => setAdvanced(!advanced)}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--accent)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Settings2 size={12} />
                  {advanced ? t("i2v.collapseAdvanced") : t("i2v.advanced")}
                </button>

                {advanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 pt-2 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Input
                      label={t("i2v.seed")}
                      type="number"
                      placeholder={t("i2v.seedPlaceholder")}
                      onChange={(e) => handleChange("seed", e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <Slider
                      label={t("i2v.steps")}
                      min={10}
                      max={100}
                      step={1}
                      defaultValue={50}
                      onChange={(e) => handleChange("steps", Number(e.target.value))}
                      valueLabel="50"
                    />
                    <Input
                      label={t("i2v.width")}
                      type="number"
                      placeholder={t("i2v.widthPlaceholder")}
                      onChange={(e) => handleChange("width", e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <Input
                      label={t("i2v.height")}
                      type="number"
                      placeholder={t("i2v.heightPlaceholder")}
                      onChange={(e) => handleChange("height", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </motion.div>
                )}

                {error && (
                  <div className="rounded-lg px-3 py-2 text-sm" style={{
                    background: "var(--error-soft)",
                    color: "var(--error)",
                  }}>
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!state.prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Film size={18} />}
                  {loading ? t("i2v.generating") : t("i2v.generate")}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-3 xl:col-span-4">
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
