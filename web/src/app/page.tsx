"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, WandSparkles, Image, Images, Clapperboard, Film, GalleryHorizontal, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useLocale";

const features = [
  {
    href: "/prompt",
    icon: Sparkles,
    titleKey: "home.features.prompt.title",
    descKey: "home.features.prompt.desc",
    color: "#8b5cf6",
  },
  {
    href: "/optimize",
    icon: WandSparkles,
    titleKey: "home.features.optimize.title",
    descKey: "home.features.optimize.desc",
    color: "#06b6d4",
  },
  {
    href: "/text-to-image",
    icon: Image,
    titleKey: "home.features.textToImage.title",
    descKey: "home.features.textToImage.desc",
    color: "#e85a25",
  },
  {
    href: "/image-to-image",
    icon: Images,
    titleKey: "home.features.imageToImage.title",
    descKey: "home.features.imageToImage.desc",
    color: "#f59e0b",
  },
  {
    href: "/text-to-video",
    icon: Clapperboard,
    titleKey: "home.features.textToVideo.title",
    descKey: "home.features.textToVideo.desc",
    color: "#10b981",
  },
  {
    href: "/image-to-video",
    icon: Film,
    titleKey: "home.features.imageToVideo.title",
    descKey: "home.features.imageToVideo.desc",
    color: "#3b82f6",
  },
  {
    href: "/multi-image-video",
    icon: GalleryHorizontal,
    titleKey: "home.features.multiImageVideo.title",
    descKey: "home.features.multiImageVideo.desc",
    color: "#ec4899",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function HomePage() {
  const t = useTranslations();
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="py-20 sm:py-28 text-center relative">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full blur-3xl opacity-20" style={{ background: "var(--accent)" }} />
          <div className="absolute top-40 right-1/4 h-56 w-56 rounded-full blur-3xl opacity-15" style={{ background: "#8b5cf6" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6 border" style={{
            background: "var(--accent-soft)",
            borderColor: "rgba(232, 90, 37, 0.2)",
            color: "var(--accent)",
          }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            {t("home.badge")}
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl mx-auto">
            {t("home.heroTitle")}{" "}
            <span className="gradient-text italic font-light">{t("home.heroTitleItalic")}</span>.
          </h1>

          <p className="mt-6 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{
            color: "var(--text-secondary)",
          }}>
            {t("home.heroSubtitle")}
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/text-to-image"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              style={{ background: "var(--accent-gradient)" }}
            >
              {t("home.cta.startCreating")}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/prompt"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold border transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                background: "var(--bg-card)",
              }}
            >
              {t("home.cta.promptAssistant")}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="pb-20">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 max-w-7xl mx-auto"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.href} {...feature} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}

function FeatureCard({ href, icon: Icon, titleKey, descKey, color }: (typeof features)[0]) {
  const t = useTranslations();
  return (
    <motion.a
      href={href}
      variants={item}
      className="group glass-card p-6 no-underline block h-full"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
        style={{ background: `${color}15`, color }}
      >
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-base font-semibold mb-1.5">{t(titleKey)}</h3>
      <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text-secondary)" }}>
        {t(descKey)}
      </p>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium" style={{ color }}>
        {t("home.useFeature")}
        <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
      </div>
    </motion.a>
  );
}
