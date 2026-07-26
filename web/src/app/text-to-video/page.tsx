"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clapperboard, Loader2, Settings2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Slider from "@/components/ui/Slider";
import ErrorBanner from "@/components/ui/ErrorBanner";
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
import { useVideoPolling } from "@/hooks/useVideoPolling";
import { addHistoryEntry } from "@/lib/history-store";

interface VideoParams {
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

export default function TextToVideoPage() {
  const t = useTranslations();
  const router = useRouter();
  const [prompt, setPrompt] = usePromptState("");
  const [params, setParams] = useState<VideoParams>({
    resolution: "720p",
    ratio: "16:9",
    duration: 5,
    frameRate: 24,
  });
  const [advanced, setAdvanced] = useState(false);

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

  const dims = getVideoDimensions(params.resolution, params.ratio);
  const maxFrames = getMaxFrames(params.resolution, params.width, params.height);
  const autoFrames = calculateFrames(params.duration, params.frameRate);

  const handleChange = (key: keyof VideoParams, value: unknown) => {
    setParams((s) => ({ ...s, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    begin();

    try {
      const payload: Record<string, unknown> = {
        prompt,
        frame_rate: params.frameRate,
      };

      if (dims && !params.width && !params.height) {
        payload.width = dims.w;
        payload.height = dims.h;
      } else if (params.width && params.height) {
        payload.width = params.width;
        payload.height = params.height;
      }

      if (params.numFrames) {
        payload.num_frames = Math.min(params.numFrames, maxFrames);
      } else {
        payload.num_frames = autoFrames;
      }

      if (params.seed !== undefined) payload.seed = params.seed;
      if (params.steps) payload.num_inference_steps = params.steps;

      const res = await fetch("/api/video/generate", {
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
            sourceRoute: "/text-to-video",
            prompt,
            mediaUrl: url,
          });
        },
      });
    } catch (err) {
      fail(err instanceof Error ? err.message : t("error.generationFailed"));
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
          <h1 className="font-display text-2xl lg:text-3xl font-bold">{t("t2v.title")}</h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("t2v.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-5">
            <Card className="lg:sticky lg:top-20">
              <div className="space-y-4">
                <PromptEditor
                  label={t("t2v.description")}
                  placeholder={t("t2v.descriptionPlaceholder")}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onOptimize={() => router.push("/optimize")}
                  rows={4}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={t("t2v.resolution")}
                    options={VIDEO_RESOLUTION_CHOICES.map((r) => ({ value: r, label: r }))}
                    value={params.resolution}
                    onChange={(e) => handleChange("resolution", e.target.value)}
                  />
                  <Select
                    label={t("t2v.ratio")}
                    options={VIDEO_RATIO_OPTIONS.map((r) => ({ value: r, label: r }))}
                    value={params.ratio}
                    onChange={(e) => handleChange("ratio", e.target.value as VideoRatio)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={t("t2v.duration")}
                    options={VIDEO_DURATION_CHOICES.map((d) => ({ value: String(d), label: t("common.seconds", { value: d }) }))}
                    value={String(params.duration)}
                    onChange={(e) => handleChange("duration", Number(e.target.value))}
                  />
                  <Select
                    label={t("t2v.frameRate")}
                    options={VIDEO_FRAME_RATE_CHOICES.map((f) => ({ value: String(f), label: t("common.framesPerSecond", { value: f }) }))}
                    value={String(params.frameRate)}
                    onChange={(e) => handleChange("frameRate", Number(e.target.value))}
                    hint={t("t2v.frameRateHint")}
                  />
                </div>

                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("t2v.estimated", { dims: dims ? `${dims.w}×${dims.h}` : t("field.custom"), frames: String(autoFrames), duration: String(params.duration) })}
                </p>

                {/* Advanced */}
                <button
                  onClick={() => setAdvanced(!advanced)}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--accent)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Settings2 size={12} />
                  {advanced ? t("t2v.collapseAdvanced") : t("t2v.advanced")}
                </button>

                {advanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 pt-2 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Input
                      label={t("t2v.seed")}
                      type="number"
                      placeholder={t("t2v.seedPlaceholder")}
                      onChange={(e) => handleChange("seed", e.target.value ? Number(e.target.value) : undefined)}
                      hint={t("t2v.seedHint")}
                    />
                    <Slider
                      label={t("t2v.steps")}
                      min={10}
                      max={100}
                      step={1}
                      defaultValue={50}
                      onChange={(e) => handleChange("steps", Number(e.target.value))}
                      valueLabel="50"
                      hint={t("t2v.stepsHint")}
                    />
                    <Input
                      label={t("t2v.width")}
                      type="number"
                      placeholder={t("t2v.widthPlaceholder")}
                      onChange={(e) => handleChange("width", e.target.value ? Number(e.target.value) : undefined)}
                      hint={t("t2v.widthHint")}
                    />
                    <Input
                      label={t("t2v.height")}
                      type="number"
                      placeholder={t("t2v.heightPlaceholder")}
                      onChange={(e) => handleChange("height", e.target.value ? Number(e.target.value) : undefined)}
                      hint={t("t2v.heightHint")}
                    />
                  </motion.div>
                )}

                <ErrorBanner message={error} />

                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Clapperboard size={18} />}
                  {loading ? t("t2v.generating") : t("t2v.generate")}
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
