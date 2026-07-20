"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, ZoomIn } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useTranslations } from "@/hooks/useLocale";

interface ImageGalleryProps {
  images: Array<{ url?: string; b64_json?: string; revised_prompt?: string | null }>;
  loading?: boolean;
}

function dataUrlFromB64(b64: string): string {
  return `data:image/png;base64,${b64}`;
}

export default function ImageGallery({ images, loading = false }: ImageGalleryProps) {
  const t = useTranslations();
  const [selected, setSelected] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="aspect-square rounded-xl animate-pulse" style={{
            background: "var(--bg-secondary)",
          }} />
        ))}
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed" style={{
        borderColor: "var(--border)",
        color: "var(--text-muted)",
      }}>
        <ImageIcon size={40} strokeWidth={1} />
        <p className="mt-3 text-sm">{t("imageGallery.waiting")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((img, i) => {
          const src = img.url || (img.b64_json ? dataUrlFromB64(img.b64_json) : null);
          if (!src) return null;
          return (
            <div
              key={i}
              className="group relative aspect-square overflow-hidden rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{ borderColor: "var(--border)" }}
              onClick={() => setSelected(i)}
            >
              <Image
                src={src}
                alt={t("imageGallery.preview")}
                fill
                className="object-contain"
                unoptimized={src.startsWith("data:")}
              />
              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex gap-2">
                  <a
                    href={src}
                    download={`agnes-image-${i + 1}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("common.download")}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition-transform hover:scale-110"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={16} />
                  </a>
                  <button
                    aria-label={t("common.zoomIn")}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition-transform hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(i);
                    }}
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={t("imageGallery.preview")}
        className="max-w-4xl !p-0"
      >
        {selected !== null && images[selected]?.url && (
          <div className="relative aspect-video overflow-hidden rounded-xl">
            <Image
              src={images[selected].url}
              alt={t("imageGallery.preview")}
              fill
              className="object-contain"
            />
          </div>
        )}
      </Modal>
    </>
  );
}

function ImageIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
