"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  Image as ImageIcon,
  Clapperboard,
  Download,
  Trash2,
  ChevronLeft,
  Grid3x3,
  Film,
  Sparkles,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useTranslations } from "@/hooks/useLocale";
import {
  getAllHistory,
  deleteHistoryEntry,
  clearHistory,
  type HistoryEntry,
  type HistoryType,
} from "@/lib/history-store";
import { div } from "framer-motion/client";

type FilterType = "all" | HistoryType;

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function HistoryPage() {
  const t = useTranslations();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadEntries = useCallback(() => {
    const all = getAllHistory();
    setEntries(all);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = (id: string) => {
    deleteHistoryEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  const handleDownload = (entry: HistoryEntry) => {
    if (!entry.mediaUrl) return;

    const link = document.createElement("a");
    link.href = entry.mediaUrl;
    link.download = `agnes-${entry.type}-${entry.id}.${entry.type === "image" ? "png" : "mp4"}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = async (entry: HistoryEntry) => {
    if (!entry.mediaUrl) return;
    try {
      await navigator.clipboard.writeText(entry.mediaUrl);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClearAll = () => {
    if (!clearAllConfirm) {
      setClearAllConfirm(true);
      return;
    }
    clearHistory();
    setEntries([]);
    setDeletingId(null);
    setClearAllConfirm(false);
  };

  const cancelClearAll = () => {
    setClearAllConfirm(false);
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredEntries = entries.filter((e) => {
    if (filter === "all") return true;
    return e.type === filter;
  });

  const imageCount = entries.filter((e) => e.type === "image").length;
  const videoCount = entries.filter((e) => e.type === "video").length;

  return (
    <div className="py-8">
      {/* Hero */}
      <div className="container-page">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mb-8"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-all hover:scale-105"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
              }}
              aria-label="Back"
            >
              <ChevronLeft size={18} />
            </Link>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              {entries.length > 0 ? (
                <>
                  {t("history.yourLibrary")}{" "}
                  <span className="gradient-text">{t("history.yourLibraryAccent")}</span>
                </>
              ) : (
                t("history.title")
              )}
            </h1>
          </div>

          {entries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill active={filter === "all"} onClick={() => setFilter("all")} icon={<Grid3x3 size={14} />}>
                {t("history.filterAll")}
              </FilterPill>
              <FilterPill active={filter === "image"} onClick={() => setFilter("image")} icon={<ImageIcon size={14} />} color="var(--accent)">
                {t("history.filterImages")}
              </FilterPill>
              <FilterPill active={filter === "video"} onClick={() => setFilter("video")} icon={<Film size={14} />} color="var(--warning)">
                {t("history.filterVideos")}
              </FilterPill>

              {!clearAllConfirm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="ml-1"
                >
                  <Trash2 size={14} />
                  {t("history.clearAll")}
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-1.5 rounded-xl ml-1"
                  style={{
                    background: "var(--error-soft)",
                    border: "1px solid var(--error)",
                  }}
                >
                  <span className="text-xs ml-1 whitespace-nowrap" style={{ color: "var(--error)" }}>
                    {t("history.clearAllConfirm")}
                  </span>
                  <Button onClick={handleClearAll} variant="danger" size="sm">
                    {t("history.deleteConfirmBtn")}
                  </Button>
                  <Button onClick={cancelClearAll} variant="secondary" size="sm">
                    {t("history.deleteCancel")}
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {filteredEntries.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredEntries.map((entry) => (
            <motion.div key={entry.id} variants={item}>
              <HistoryCard
                entry={entry}
                isDeleting={deletingId === entry.id}
                isCopied={copiedId === entry.id}
                onDelete={() => handleDelete(entry.id)}
                onConfirmDelete={() => confirmDelete(entry.id)}
                onCancelDelete={cancelDelete}
                onDownload={() => handleDownload(entry)}
                onCopyLink={() => handleCopyLink(entry)}
                formatTime={formatTime}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
    </div>
    
  );
}

function FilterPill({
  active,
  onClick,
  children,
  icon,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all"
      style={{
        background: active ? (color ? `${color}15` : "var(--accent-soft)") : "var(--bg-card)",
        color: active ? (color || "var(--accent)") : "var(--text-secondary)",
        border: `1px solid ${active ? (color ? `${color}30` : "var(--accent)") : "var(--border)"}`,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function EmptyState({ filter }: { filter: FilterType }) {
  const t = useTranslations();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      {/* Decorative background orbs */}
      <div className="relative mb-6">
        <div className="absolute inset-0 -m-8 rounded-full blur-3xl opacity-20" style={{ background: "var(--accent)" }} />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-24 h-24 rounded-2xl flex items-center justify-center"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--border)",
          }}
        >
          <Clock size={40} style={{ color: "var(--accent)" }} strokeWidth={1.25} />
        </motion.div>
      </div>

      <h3 className="font-display text-xl font-semibold mb-1.5">
        {filter === "all" ? t("history.empty") : filter === "image" ? t("history.emptyImages") : t("history.emptyVideos")}
      </h3>
      <p className="text-sm max-w-sm mb-6" style={{ color: "var(--text-muted)" }}>
        {t("history.emptyHint")}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/text-to-image"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
          style={{ background: "var(--accent-gradient)" }}
        >
          <Sparkles size={16} />
          {t("home.cta.startCreating")}
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
  );
}

interface HistoryCardProps {
  entry: HistoryEntry;
  isDeleting: boolean;
  isCopied: boolean;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDownload: () => void;
  onCopyLink: () => void;
  formatTime: (ts: number) => string;
}

function HistoryCard({
  entry,
  isDeleting,
  isCopied,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onDownload,
  onCopyLink,
  formatTime,
}: HistoryCardProps) {
  const t = useTranslations();

  return (
    <Card
      padded={false}
      className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      {/* Thumbnail */}
      <div
        className="aspect-square relative overflow-hidden"
        style={{
          background: "var(--bg-secondary)",
        }}
      >
        {entry.type === "image" && entry.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.mediaUrl}
            alt={entry.prompt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : entry.type === "video" ? (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-secondary)" }}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{ background: "var(--warning-soft)" }}
            >
              <Clapperboard size={32} style={{ color: "var(--warning)" }} strokeWidth={1.5} />
            </motion.div>
          </div>
        ) : null}

        {/* Type Badge */}
        <span
          className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md"
          style={{
            background: entry.type === "image" ? "var(--accent-soft)" : "var(--warning-soft)",
            color: entry.type === "image" ? "var(--accent)" : "var(--warning)",
            border: `1px solid ${entry.type === "image" ? "var(--accent)" : "var(--warning)"}20`,
          }}
        >
          {entry.type === "image" ? <ImageIcon size={11} /> : <Clapperboard size={11} />}
          {entry.type === "image" ? t("history.typeImage") : t("history.typeVideo")}
        </span>

        {/* Hover Overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          {entry.mediaUrl && (
            <button
              onClick={onDownload}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-900 transition-transform hover:scale-110"
              aria-label={t("history.download")}
            >
              <Download size={16} />
            </button>
          )}
          {entry.mediaUrl && (
            <button
              onClick={onCopyLink}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-900 transition-transform hover:scale-110"
              aria-label={isCopied ? t("common.copied") : t("common.copyLink")}
            >
              {isCopied ? <Check size={16} /> : <LinkIcon size={16} />}
            </button>
          )}
          <button
            onClick={onDelete}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-600 transition-transform hover:scale-110"
            aria-label={t("history.deleteConfirmBtn")}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p
          className="text-sm line-clamp-2 mb-2.5 leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          {entry.prompt}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {formatTime(entry.createdAt)}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {entry.type === "image" ? <ImageIcon size={10} /> : <Clapperboard size={10} />}
            {entry.type === "image" ? t("history.typeImage") : t("history.typeVideo")}
          </span>
        </div>

        {/* Delete Confirmation */}
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-2.5 rounded-lg"
            style={{
              background: "var(--error-soft)",
              border: "1px solid var(--error)",
            }}
          >
            <p className="text-xs mb-2 font-medium" style={{ color: "var(--error)" }}>
              {t("history.deleteConfirm")}
            </p>
            <div className="flex gap-2">
              <Button onClick={onConfirmDelete} variant="danger" size="sm">
                {t("history.deleteConfirmBtn")}
              </Button>
              <Button onClick={onCancelDelete} variant="secondary" size="sm">
                {t("history.deleteCancel")}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
