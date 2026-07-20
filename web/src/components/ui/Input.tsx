import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, id, ...props },
  ref,
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wide" style={{
          color: "var(--text-secondary)",
        }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all duration-200",
          "focus:ring-2 focus:ring-[var(--accent-soft)]",
          error && "border-[var(--error)] focus:border-[var(--error)]",
          className,
        )}
        style={{
          background: "var(--bg-input)",
          borderColor: error ? "var(--error)" : "var(--border)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = "var(--border-focus)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }
        }}
        {...props}
      />
      {(error || hint) && (
        <p className={cn("text-xs", error ? "text-[var(--error)]" : "")} style={{
          color: error ? undefined : "var(--text-muted)",
        }}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default Input;
