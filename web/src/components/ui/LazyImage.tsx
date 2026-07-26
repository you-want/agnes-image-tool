"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  unoptimized?: boolean;
  className?: string;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export default function LazyImage({
  src,
  alt,
  width,
  height,
  fill = false,
  unoptimized = false,
  className,
  placeholder = "blur",
  blurDataURL,
  priority = false,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = (_event: React.SyntheticEvent) => {
    setHasError(true);
    onError?.(new Error("Failed to load image"));
  };

  // `placeholder="blur"` requires a blurDataURL for remote images.
  // Fall back to "empty" when none is provided (Skeleton handles the loading state).
  const effectivePlaceholder = placeholder === "blur" && !blurDataURL ? "empty" : placeholder;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        className,
      )}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "100%",
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        unoptimized={unoptimized}
        priority={priority}
        placeholder={effectivePlaceholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-8 w-8" variant="circle" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
}

// Utility function to preload images
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // `window.Image` is the native constructor — the `Image` identifier in this
    // module is next/image.
    const nativeImg = new window.Image();
    nativeImg.onload = () => resolve();
    nativeImg.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    nativeImg.src = src;
  });
}

// Batch preload multiple images
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(src => preloadImage(src)));
}