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
      {children}
    </button>
  );
});

export default Button;
