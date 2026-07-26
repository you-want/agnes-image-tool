"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text";
  width?: number | string;
  height?: number | string;
}

export default function Skeleton({
  className,
  variant = "rect",
  width,
  height,
}: SkeletonProps) {
  const radiusClass = {
    rect: "rounded-xl",
    circle: "rounded-full",
    text: "rounded-md h-4 w-full",
  }[variant];

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "skeleton-loading animate-pulse",
        radiusClass,
        className,
      )}
      style={{
        width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
        height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
      }}
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}
