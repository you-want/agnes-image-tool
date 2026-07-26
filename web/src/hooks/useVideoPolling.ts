"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface StartOptions {
  /** Called once with the final URL when the video completes. */
  onComplete?: (url: string) => void;
  maxWaitMs?: number;
  timeoutMessage?: string;
  failedMessage?: string;
}

/**
 * Polls /api/video/status until a video completes, fails, or times out.
 *
 * Fixes the previous inline implementations which:
 *   - were fired without await/.catch (unhandled promise rejections),
 *   - polled at a fixed 5s forever with no backoff, and
 *   - kept running (and setState-ing) after the component unmounted.
 *
 * Polling stops automatically on unmount and uses incremental backoff.
 */
export function useVideoPolling() {
  const [videoUrl, setVideoUrl] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activeRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Stop any in-flight polling loop when the component unmounts.
  useEffect(
    () => () => {
      activeRef.current = false;
      abortRef.current?.abort();
    },
    []
  );

  /** Reset UI state at the start of a new generation. */
  const begin = useCallback(() => {
    setVideoUrl("");
    setError("");
    setStatus("queued");
    setProgress(0);
    setLoading(true);
  }, []);

  /** Mark the generation failed (e.g. the initial submit threw). */
  const fail = useCallback((message: string) => {
    activeRef.current = false;
    abortRef.current?.abort();
    setError(message);
    setStatus("failed");
    setLoading(false);
  }, []);

  const start = useCallback(async (videoId: string, opts: StartOptions = {}) => {
    const {
      onComplete,
      maxWaitMs = 1_800_000, // 30 min
      timeoutMessage = "Video generation timed out",
      failedMessage = "Video generation failed",
    } = opts;

    activeRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    let waited = 0;
    let interval = 3000;
    const maxInterval = 15000;

    while (waited < maxWaitMs && activeRef.current) {
      await new Promise((r) => setTimeout(r, interval));
      if (!activeRef.current || signal.aborted) return;
      waited += interval;
      interval = Math.min(Math.round(interval * 1.5), maxInterval); // backoff

      try {
        const res = await fetch(`/api/video/status/${encodeURIComponent(videoId)}`, { signal });
        const data = await res.json();
        if (!activeRef.current) return;

        if (data.error) {
          setStatus("failed");
          setError(data.error);
          setLoading(false);
          return;
        }

        const statusData = data.data || {};
        setStatus(statusData.status || "");
        setProgress(statusData.progress || 0);

        if (statusData.status === "completed") {
          const url = statusData.url || "";
          setVideoUrl(url);
          setProgress(100);
          setStatus("");
          setLoading(false);
          onComplete?.(url);
          return;
        }

        if (statusData.status === "failed") {
          const msg =
            typeof statusData.error === "string"
              ? statusData.error
              : statusData.error?.message;
          setError(msg || failedMessage);
          setStatus("failed");
          setLoading(false);
          return;
        }
      } catch (err) {
        if (signal.aborted) return;
        // Transient network error — keep polling until the timeout budget runs out.
        console.error("Poll error:", err);
      }
    }

    if (activeRef.current) {
      setError(timeoutMessage);
      setStatus("failed");
      setLoading(false);
    }
  }, []);

  return {
    videoUrl,
    status,
    progress,
    error,
    loading,
    setError,
    begin,
    fail,
    start,
  };
}
