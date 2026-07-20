"use client";

import { useRef, useEffect } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useLocale";

interface VideoPlayerProps {
  src?: string;
  progress?: number;
  status?: string;
  error?: string;
}

export default function VideoPlayer({ src, progress = 0, status, error }: VideoPlayerProps) {
  const t = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border" style={{
        borderColor: "var(--error)",
        background: "var(--error-soft)",
        color: "var(--error)",
      }}>
        <p className="font-medium">{t("videoPlayer.failed")}</p>
        <p className="mt-1 text-sm opacity-80">{error}</p>
      </div>
    );
  }

  if (!src) {
    let message = t("videoPlayer.waiting");
    if (status === "queued") message = t("videoPlayer.queued");
    else if (status === "in_progress") message = t("videoPlayer.progress", { progress: String(Math.round(progress)) });

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed" style={{
        borderColor: "var(--border)",
        color: "var(--text-muted)",
      }}>
        <Loader2 size={40} strokeWidth={1} className="animate-spin" />
        <p className="mt-3 text-sm">{message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border shadow-lg" style={{
      borderColor: "var(--border)",
      background: "#000",
    }}>
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        className="w-full aspect-video"
      />
      {/* Progress bar */}
      {progress > 0 && progress < 100 && (
        <div className="h-1" style={{ background: "var(--bg-secondary)" }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: "var(--accent-gradient)",
            }}
          />
        </div>
      )}
    </div>
  );
}
