"use client";

import { useState, type TextareaHTMLAttributes } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useLocale";

interface PromptEditorProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  onGenerate?: () => void;
  onOptimize?: () => void;
  loading?: boolean;
}

export default function PromptEditor({
  label,
  hint,
  onGenerate,
  onOptimize,
  loading = false,
  className,
  ...props
}: PromptEditorProps) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const text = String(props.value || props.defaultValue || "");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wide" style={{
            color: "var(--text-secondary)",
          }}>
            {label}
          </label>
          {(onGenerate || onOptimize) && (
            <div className="flex gap-1.5">
              {onOptimize && (
                <button
                  onClick={onOptimize}
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t("common.optimize")}
                </button>
              )}
              {onGenerate && (
                <button
                  onClick={onGenerate}
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t("common.generate")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <div className="relative">
        <textarea
          className={cn(
            "w-full rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none resize-y transition-all duration-200",
            "focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--border-focus)]",
            className,
          )}
          rows={props.rows || 4}
          maxLength={props.maxLength || 4000}
          style={{
            background: "var(--bg-input)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--border-focus)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
          {...props}
        />
        {(props.value || props.defaultValue) && (
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
            style={{ color: "var(--text-muted)" }}
            title={t("common.copyPrompt")}
          >
            {copied ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
          </button>
        )}
      </div>
      {hint && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
