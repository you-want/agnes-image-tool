"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, Copy, Check, Loader2, Image as ImageIcon, Clapperboard } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useLocale, useTranslations } from "@/hooks/useLocale";
import { setGlobalPrompt } from "@/lib/prompt-store";

type TaskType = "image" | "video";

const STYLE_OPTIONS = [
  { value: "realistic", labelKey: "promptGen.styleRealistic" },
  { value: "anime", labelKey: "promptGen.styleAnime" },
  { value: "cyberpunk", labelKey: "promptGen.styleCyberpunk" },
  { value: "fantasy", labelKey: "promptGen.styleFantasy" },
  { value: "minimalist", labelKey: "promptGen.styleMinimalist" },
  { value: "oil-painting", labelKey: "promptGen.styleOilPainting" },
  { value: "watercolor", labelKey: "promptGen.styleWatercolor" },
  { value: "3d-render", labelKey: "promptGen.style3DRender" },
  { value: "cinematic", labelKey: "promptGen.styleCinematic" },
  { value: "pixel-art", labelKey: "promptGen.stylePixelArt" },
];

const SCENE_OPTIONS = [
  { value: "portrait", labelKey: "promptGen.scenePortrait" },
  { value: "landscape", labelKey: "promptGen.sceneLandscape" },
  { value: "product", labelKey: "promptGen.sceneProduct" },
  { value: "architecture", labelKey: "promptGen.sceneArchitecture" },
  { value: "abstract", labelKey: "promptGen.sceneAbstract" },
  { value: "sci-fi", labelKey: "promptGen.sceneSciFi" },
  { value: "fantasy-world", labelKey: "promptGen.sceneFantasyWorld" },
  { value: "city-night", labelKey: "promptGen.sceneCityNight" },
  { value: "nature", labelKey: "promptGen.sceneNature" },
  { value: "space", labelKey: "promptGen.sceneSpace" },
];

const LIGHTING_OPTIONS = [
  { value: "natural", labelKey: "promptGen.lightingNatural" },
  { value: "golden-hour", labelKey: "promptGen.lightingGoldenHour" },
  { value: "studio", labelKey: "promptGen.lightingStudio" },
  { value: "neon", labelKey: "promptGen.lightingNeon" },
  { value: "dramatic", labelKey: "promptGen.lightingDramatic" },
  { value: "soft", labelKey: "promptGen.lightingSoft" },
  { value: "backlight", labelKey: "promptGen.lightingBacklight" },
  { value: "volumetric", labelKey: "promptGen.lightingVolumetric" },
];

const SYSTEM_PROMPT_IMAGE = `You are an expert prompt engineer for AI image generation. Create detailed, vivid prompts following this structure: [Subject] + [Scene/Environment] + [Style] + [Lighting] + [Composition] + [Quality]. Output ONLY the prompt, no explanations.`;

const SYSTEM_PROMPT_VIDEO = `You are an expert prompt engineer for AI video generation. Create detailed, vivid video prompts following this structure: [Subject] + [Action/Movement] + [Scene] + [Camera Movement] + [Lighting] + [Style]. Output ONLY the prompt, no explanations.`;

export default function PromptGeneratorPage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const router = useRouter();
  const [taskType, setTaskType] = useState<TaskType>("image");
  const [subject, setSubject] = useState("");
  const [style, setStyle] = useState("");
  const [scene, setScene] = useState("");
  const [lighting, setLighting] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!subject.trim()) return;

    setLoading(true);
    setResult("");

    try {
      const systemPrompt = taskType === "image" ? SYSTEM_PROMPT_IMAGE : SYSTEM_PROMPT_VIDEO;
      const userPrompt = buildUserPrompt();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 1024,
          locale,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const content = data.data?.choices?.[0]?.message?.content || "";
      if (!content.trim()) {
        throw new Error(t("promptGen.emptyResult"));
      }
      setResult(content);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : t("promptGen.unknownError")}`);
    } finally {
      setLoading(false);
    }
  };

  function getLabelByKey(key: string): string {
    return t(key);
  }

  function buildUserPrompt(): string {
    const parts: string[] = [];
    if (subject) parts.push(`Main subject/theme: ${subject}`);
    if (style) {
      const opt = STYLE_OPTIONS.find((s) => s.value === style);
      parts.push(`Style preference: ${opt ? getLabelByKey(opt.labelKey) : style}`);
    }
    if (scene) {
      const opt = SCENE_OPTIONS.find((s) => s.value === scene);
      parts.push(`Scene/setting: ${opt ? getLabelByKey(opt.labelKey) : scene}`);
    }
    if (lighting) {
      const opt = LIGHTING_OPTIONS.find((l) => l.value === lighting);
      parts.push(`Lighting: ${opt ? getLabelByKey(opt.labelKey) : lighting}`);
    }

    const typeLabel = taskType === "image" ? "image" : "video";
    return `Generate a ${typeLabel} prompt for: ${parts.join(", ")}. Make it specific, vivid, and optimized for Agnes AI models.`;
  }

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navigateToImage = () => {
    if (!result.startsWith("Error:")) {
      setGlobalPrompt(result);
      router.push("/text-to-image");
    }
  };

  const navigateToVideo = () => {
    if (!result.startsWith("Error:")) {
      setGlobalPrompt(result);
      router.push("/text-to-video");
    }
  };

  return (
    <div className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold">{t("promptGen.title")}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("promptGen.subtitle")}
          </p>
        </div>

        <Card>
          {/* Task Type Toggle */}
          <div className="flex gap-2 mb-6 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
            {(["image", "video"] as TaskType[]).map((task) => (
              <button
                key={task}
                onClick={() => setTaskType(task)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  taskType === task ? "shadow-sm" : ""
                }`}
                style={{
                  background: taskType === task ? "var(--bg-card)" : "transparent",
                  color: taskType === task ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {task === "image" ? <ImageIcon size={16} /> : <Clapperboard size={16} />}
                {task === "image" ? t("promptGen.task.image") : t("promptGen.task.video")}
              </button>
            ))}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <Input
              label={t("promptGen.subject")}
              placeholder={t("promptGen.subjectPlaceholder")}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t("promptGen.style")}
                options={[{ value: "", label: t("promptGen.none") }, ...STYLE_OPTIONS.map((s) => ({ value: s.value, label: t(s.labelKey) }))]}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              />
              <Select
                label={t("promptGen.scene")}
                options={[{ value: "", label: t("promptGen.none") }, ...SCENE_OPTIONS.map((s) => ({ value: s.value, label: t(s.labelKey) }))]}
                value={scene}
                onChange={(e) => setScene(e.target.value)}
              />
            </div>

            <Select
              label={t("promptGen.lighting")}
              options={[{ value: "", label: t("promptGen.none") }, ...LIGHTING_OPTIONS.map((l) => ({ value: l.value, label: t(l.labelKey) }))]}
              value={lighting}
              onChange={(e) => setLighting(e.target.value)}
            />

            <Button
              onClick={handleGenerate}
              loading={loading}
              className="w-full"
              size="lg"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? t("promptGen.generating") : t("promptGen.generate")}
            </Button>
          </div>
        </Card>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{t("promptGen.result")}</h3>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {copied ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                  {copied ? t("common.copied") : t("common.copy")}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono" style={{
                color: "var(--text-primary)",
                background: "var(--bg-secondary)",
                padding: "1rem",
                borderRadius: "10px",
              }}>
                {result}
              </pre>
              {!result.startsWith("Error:") && (
                <div className="mt-4 pt-4 border-t flex gap-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs self-center" style={{ color: "var(--text-muted)" }}>
                    {t("promptGen.nextStep")}
                  </p>
                  <button
                    onClick={navigateToImage}
                    className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors hover:bg-[var(--accent-soft)]"
                    style={{ color: "var(--accent)" }}
                  >
                    <ImageIcon size={14} />
                    {t("promptGen.goToImage")}
                  </button>
                  <button
                    onClick={navigateToVideo}
                    className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors hover:bg-[var(--accent-soft)]"
                    style={{ color: "var(--accent)" }}
                  >
                    <Clapperboard size={14} />
                    {t("promptGen.goToVideo")}
                  </button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
