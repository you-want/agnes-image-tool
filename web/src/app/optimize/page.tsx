"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WandSparkles, Copy, Check, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PromptEditor from "@/components/prompt/PromptEditor";
import { useLocale, useTranslations } from "@/hooks/useLocale";

const SYSTEM_PROMPT = `You are an expert prompt optimizer for AI image and video generation models (Agnes AI). Your job is to improve prompts by making them more specific, vivid, and structured.

Follow this structure for image prompts:
[Subject] + [Scene/Environment] + [Style] + [Lighting] + [Composition] + [Quality]

Follow this structure for video prompts:
[Subject] + [Action/Movement] + [Scene] + [Camera Movement] + [Lighting] + [Style]

Rules:
- Keep the original intent but enhance details
- Use professional descriptive language
- Add quality boosters like "high detail", "cinematic", "sharp focus"
- Output ONLY the optimized prompt, no explanations`;

export default function OptimizePage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [original, setOriginal] = useState("");
  const [optimized, setOptimized] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOptimize = async () => {
    if (!original.trim()) return;

    setLoading(true);
    setCopied(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Optimize this prompt:\n\n${original}` },
          ],
          temperature: 0.7,
          max_tokens: 2048,
          locale,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const content = data.data?.choices?.[0]?.message?.content || "";
      setOptimized(content);
    } catch (error) {
      setOptimized(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!optimized) return;
    await navigator.clipboard.writeText(optimized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold">{t("promptOpt.title")}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("promptOpt.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original */}
          <Card>
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--text-muted)" }} />
              {t("promptOpt.original")}
            </h3>
            <PromptEditor
              label={t("promptOpt.inputLabel")}
              placeholder={t("promptOpt.placeholder")}
              rows={6}
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              hint={t("promptOpt.hint")}
            />
          </Card>

          {/* Optimized */}
          <Card>
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
              {t("promptOpt.optimized")}
            </h3>
            <PromptEditor
              label={t("promptOpt.outputLabel")}
              placeholder={t("promptOpt.outputPlaceholder")}
              rows={6}
              value={optimized}
              readOnly
              onCopy={handleCopy}
              hint={optimized ? t("common.copy") + "..." : t("promptOpt.waiting")}
            />
          </Card>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={handleOptimize}
            loading={loading}
            disabled={!original.trim()}
            size="lg"
            className="min-w-[200px]"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <WandSparkles size={18} />}
            {loading ? t("promptOpt.optimizing") : t("promptOpt.optimize")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
