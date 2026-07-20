import { cn } from "@/lib/utils";
import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, options, error, id, ...props },
  ref,
) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wide" style={{
          color: "var(--text-secondary)",
        }}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 appearance-none cursor-pointer",
          "focus:ring-2 focus:ring-[var(--accent-soft)]",
          error && "border-[var(--error)]",
          className,
        )}
        style={{
          background: `linear-gradient(to right, var(--bg-input) 0%, var(--bg-input) calc(100% - 32px), transparent calc(100% - 32px) 100%)`,
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
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[var(--error)]">{error}</p>}
    </div>
  );
});

export default Select;
