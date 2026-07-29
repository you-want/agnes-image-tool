"use client";

import { useState } from "react";
import { Download, ZoomIn, Trash2, Copy, Check, Link as LinkIcon, Info } from "lucide-react";
import Modal from "@/components/ui/Modal";
import LazyImage from "@/components/ui/LazyImage";
import Skeleton from "@/components/ui/Skeleton";
import { useTranslations } from "@/hooks/useLocale";

interface ImageGalleryProps {
  images: Array<{ url?: string; b64_json?: string; revised_prompt?: string | null }>;
  loading?: boolean;
  editable?: boolean;
  onDeleteImage?: (index: number) => void;
  showRevisedPrompt?: boolean;
}

function dataUrlFromB64(b64: string): string {
  return `data:image/png;base64,${b64}`;
}

export default function ImageGallery({
  images,
  loading = false,
  editable = false,
  onDeleteImage,
  showRevisedPrompt = true
}: ImageGalleryProps) {
  const t = useTranslations();
  const [selected, setSelected] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteImage?.(index);
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square">
            <Skeleton className="h-full w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] py-16 text-center rounded-xl border border-dashed" style={{
        borderColor: "var(--border)",
        color: "var(--text-muted)",
      }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{
          background: "var(--accent-soft)",
          color: "var(--accent)",
        }}>
          <ImageIcon size={28} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{t("imageGallery.waiting")}</p>
        <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>{t("imageGallery.promptHint")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((img, i) => {
          const src = img.url || (img.b64_json ? dataUrlFromB64(img.b64_json) : null);
          if (!src) return null;

          return (
            <div
              key={i}
              className="group relative aspect-square overflow-hidden rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{ borderColor: "var(--border)" }}
              onClick={() => setSelected(i)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Lazy loaded image */}
              {img.url ? (
                <LazyImage
                  src={src}
                  alt={t("imageGallery.preview")}
                  fill
                  className="object-contain"
                  unoptimized={false}
                />
              ) : img.b64_json ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={t("imageGallery.preview")}
                  className="w-full h-full object-contain"
                />
              ) : null}

              {/* Revised prompt badge */}
              {img.revised_prompt && showRevisedPrompt && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Info size={12} />
                  {t("imageGallery.revised")}
                </div>
              )}

              {/* Image number */}
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                {i + 1}
              </div>

              {/* Overlay */}
              <div className={`absolute inset-0 flex items-end justify-between p-3 transition-opacity duration-200 ${
                hoveredIndex === i || selected === i ? 'opacity-100 bg-gradient-to-t from-black/70' : 'opacity-0'
              }`}>
                <div className="flex gap-2">
                  <a
                    href={src}
                    download={`agnes-image-${i + 1}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("common.download")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-transform hover:scale-110"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={16} />
                  </a>
                  {img.url && (
                    <button
                      aria-label={
                        copiedKey === `url-${i}`
                          ? t("common.copied")
                          : t("common.copyLink")
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-transform hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(img.url!, `url-${i}`);
                      }}
                    >
                      {copiedKey === `url-${i}` ? <Check size={16} /> : <LinkIcon size={16} />}
                    </button>
                  )}
                  <button
                    aria-label={t("common.zoomIn")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-transform hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(i);
                    }}
                  >
                    <ZoomIn size={16} />
                  </button>
                  {img.revised_prompt && (
                    <button
                      aria-label={
                        copiedKey === `prompt-${i}`
                          ? t("common.copied")
                          : t("imageGallery.copyRevisedPrompt")
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-transform hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(img.revised_prompt!, `prompt-${i}`);
                      }}
                    >
                      {copiedKey === `prompt-${i}` ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  )}
                </div>

                {editable && (
                  <button
                    aria-label={t("common.delete")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 backdrop-blur-sm text-white transition-transform hover:scale-110"
                    onClick={(e) => handleDelete(i, e)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
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
            <LazyImage
              src={images[selected].url!}
              alt={t("imageGallery.preview")}
              fill
              className="object-contain"
            />
            {images[selected]?.revised_prompt && showRevisedPrompt && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
                <div className="flex items-center gap-2 text-sm mb-1">
                  <Info size={16} />
                  <span>{t("imageGallery.revisedPrompt")}</span>
                </div>
                <p className="text-xs opacity-90">{images[selected].revised_prompt}</p>
              </div>
            )}
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
