"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GalleryHorizontal, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
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
import { usePromptState } from "@/hooks/usePromptState";
import { addHistoryEntry } from "@/lib/history-store";

interface VideoParams {
  negativePrompt: string;
  imageUrls: string;
  mode: string;
  resolution: string;
  ratio: VideoRatio;
  duration: number;
  frameRate: number;
}

export default function MultiImageVideoPage() {
  const t = useTranslations();
  const [prompt, setPrompt] = usePromptState("");
  const [params, setParams] = useState<VideoParams>({
    negativePrompt: "",
    imageUrls: "",
    mode: "ti2vid",
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

  const handleChange = (key: keyof VideoParams, value: unknown) => {
    setParams((s) => ({ ...s, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    if (!params.imageUrls.trim()) return;

    const imageUrls = params.imageUrls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    if (imageUrls.length === 0) {
      setError(t("error.uploadRequired"));
      return;
    }

    setLoading(true);
    setError("");
    setVideoUrl("");
    setStatus("queued");
    setProgress(0);

    try {
      const dims = getVideoDimensions(params.resolution, params.ratio);
      const maxFrames = getMaxFrames(params.resolution);
      const autoFrames = calculateFrames(params.duration, params.frameRate);

      const payload: Record<string, unknown> = {
        prompt,
        model: "agnes-video-v2.0",
        frame_rate: params.frameRate,
        extra_body: {
          image: imageUrls,
        } as Record<string, unknown>,
      };

      if (params.mode === "keyframes") {
        (payload.extra_body as Record<string, unknown>).mode = "keyframes";
      }

      if (dims) {
        payload.width = dims.w;
        payload.height = dims.h;
      }

      payload.num_frames = Math.min(autoFrames, maxFrames);

      if (params.negativePrompt) payload.negative_prompt = params.negativePrompt;

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
          const url = statusData.url || "";
          setVideoUrl(url);
          setLoading(false);
          setStatus("");
          setProgress(100);

          // Record video in history
          addHistoryEntry({
            type: "video",
            sourceRoute: "/multi-image-video",
            prompt,
            mediaUrl: url,
          });
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
        className="container-page"
      >
        <div className="text-center lg:text-left mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-bold">{t("miv.title")}</h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("miv.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-5">
            <Card className="lg:sticky lg:top-20">
              <div className="space-y-4">
                <PromptEditor
                  label={t("miv.videoDescription")}
                  placeholder={t("miv.videoPlaceholder")}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onOptimize={() => window.location.href = "/optimize"}
                  rows={4}
                />

                <Input
                  label={t("miv.negativePrompt")}
                  placeholder={t("miv.negativePlaceholder")}
                  value={params.negativePrompt}
                  onChange={(e) => handleChange("negativePrompt", e.target.value)}
                />

                {/* Image URLs */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                    {t("miv.imageUrls")}
                  </label>
                  <textarea
                    value={params.imageUrls}
                    onChange={(e) => handleChange("imageUrls", e.target.value)}
                    placeholder={"https://example.com/keyframe1.png\nhttps://example.com/keyframe2.png"}
                    rows={4}
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none resize-y transition-all duration-200 focus:ring-2 focus:ring-[var(--accent-soft)]"
                    style={{
                      background: "var(--bg-input)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("miv.urlLineHint")}</p>
                </div>

                <Select
                  label={t("miv.mode")}
                  options={[
                    { value: "ti2vid", label: t("miv.modeNormal") },
                    { value: "keyframes", label: t("miv.modeKeyframes") },
                  ]}
                  value={params.mode}
                  onChange={(e) => handleChange("mode", e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={t("miv.resolution")}
                    options={VIDEO_RESOLUTION_CHOICES.map((r) => ({ value: r, label: r }))}
                    value={params.resolution}
                    onChange={(e) => handleChange("resolution", e.target.value)}
                  />
                  <Select
                    label={t("miv.ratio")}
                    options={VIDEO_RATIO_OPTIONS.map((r) => ({ value: r, label: r }))}
                    value={params.ratio}
                    onChange={(e) => handleChange("ratio", e.target.value as VideoRatio)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={t("miv.duration")}
                    options={VIDEO_DURATION_CHOICES.map((d) => ({ value: String(d), label: t("common.seconds", { value: d }) }))}
                    value={String(params.duration)}
                    onChange={(e) => handleChange("duration", Number(e.target.value))}
                  />
                  <Select
                    label={t("miv.frameRate")}
                    options={VIDEO_FRAME_RATE_CHOICES.map((f) => ({ value: String(f), label: t("common.framesPerSecond", { value: f }) }))}
                    value={String(params.frameRate)}
                    onChange={(e) => handleChange("frameRate", Number(e.target.value))}
                  />
                </div>

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
                  disabled={!prompt.trim() || !params.imageUrls.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <GalleryHorizontal size={18} />}
                  {loading ? t("miv.generating") : t("miv.generate")}
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
