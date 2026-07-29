"use client";

import { useRef, useState } from "react";
import { Loader2, Download, Link as LinkIcon, Check } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
      <div className="relative">
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          className="w-full aspect-video"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <a
            href={src}
            download="agnes-video.mp4"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("common.download")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-transform hover:scale-110"
          >
            <Download size={16} />
          </a>
          <button
            aria-label={copied ? t("common.copied") : t("common.copyLink")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-transform hover:scale-110"
            onClick={() => copyToClipboard(src)}
          >
            {copied ? <Check size={16} /> : <LinkIcon size={16} />}
          </button>
        </div>
      </div>
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
