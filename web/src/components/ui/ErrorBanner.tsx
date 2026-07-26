interface ErrorBannerProps {
  message?: string;
  className?: string;
}

/** Shared inline error banner used across the generation pages. */
export default function ErrorBanner({ message, className }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`rounded-lg px-3 py-2 text-sm ${className ?? ""}`}
      style={{
        background: "var(--error-soft)",
        color: "var(--error)",
      }}
    >
      {message}
    </div>
  );
}
