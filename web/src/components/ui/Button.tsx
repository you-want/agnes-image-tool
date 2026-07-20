import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm hover:shadow-md active:scale-[0.98]",
        variant === "secondary" && "border border-[var(--border)] text-[var(--text-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] active:scale-[0.98]",
        variant === "ghost" && "text-[var(--text-secondary)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]",
        variant === "danger" && "bg-red-500 text-white hover:bg-red-600",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
});

export default Button;
