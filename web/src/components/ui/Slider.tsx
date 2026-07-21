import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  valueLabel?: string;
  hint?: string;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { className, label, valueLabel, hint, id, ...props },
  ref,
) {
  const sliderId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : "slider");
  const value = Number(props.value ?? props.defaultValue ?? 0);
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={sliderId} className="text-xs font-semibold uppercase tracking-wide" style={{
            color: "var(--text-secondary)",
          }}>
            {label}
          </label>
          {valueLabel && (
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {valueLabel}
            </span>
          )}
        </div>
      )}
      <input
        ref={ref}
        id={sliderId}
        type="range"
        className={cn(
          "w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[var(--accent)]",
          "[&::-webkit-slider-runnable-track]:rounded-full",
          className,
        )}
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percent}%, var(--border) ${percent}%, var(--border) 100%)`,
        }}
        {...props}
      />
      {hint && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
});

export default Slider;
