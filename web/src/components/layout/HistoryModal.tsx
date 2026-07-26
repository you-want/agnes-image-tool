"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, Image as ImageIcon, Clapperboard, Download, Trash2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useTranslations } from "@/hooks/useLocale";
import { getAllHistory, deleteHistoryEntry, type HistoryEntry } from "@/lib/history-store";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const t = useTranslations();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEntries = () => {
    const all = getAllHistory();
    setEntries(all);
  };

  // Refresh the list each time the modal opens. Doing this during render (as
  // before) sets state on every render pass and never settles.
  useEffect(() => {
    if (isOpen) {
      loadEntries();
      setDeletingId(null);
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    // Show confirmation inline
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

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getTypeIcon = (type: "image" | "video") => {
    return type === "image" ? <ImageIcon size={14} /> : <Clapperboard size={14} />;
  };

  const getTypeLabel = (type: "image" | "video") => {
    return type === "image" ? t("history.typeImage") : t("history.typeVideo");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl border shadow-xl"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            <Card className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 px-2 pt-2">
                <h2 className="font-display text-xl font-semibold">{t("history.title")}</h2>
                <button
                  onClick={onClose}
                  aria-label={t("common.close")}
                  className="rounded-lg p-1.5 transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 space-y-3 px-2 pb-2">
                {entries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                    }}>
                      <Clock size={28} strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                      {t("history.empty")}
                    </p>
                    <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {t("history.emptyHint")}
                    </p>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex gap-3 p-3 rounded-lg border"
                      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-black/10">
                        {entry.type === "image" && entry.mediaUrl ? (
                          // Small remote thumbnail; next/image optimization isn't
                          // worth the layout constraints here.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.mediaUrl}
                            alt={entry.prompt}
                            className="w-full h-full object-cover"
                          />
                        ) : entry.type === "video" ? (
                          <div className="w-full h-full flex items-center justify-center" style={{
                            background: "var(--bg-secondary)",
                          }}>
                            <Clapperboard size={24} style={{ color: "var(--text-muted)" }} />
                          </div>
                        ) : null}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{
                            background: entry.type === "image" ? "var(--accent-soft)" : "var(--warning-soft)",
                            color: entry.type === "image" ? "var(--accent)" : "var(--warning)",
                          }}>
                            {getTypeIcon(entry.type)}
                            {getTypeLabel(entry.type)}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {formatTime(entry.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm line-clamp-2 mb-2" style={{ color: "var(--text-primary)" }}>
                          {entry.prompt}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {entry.mediaUrl && (
                            <button
                              onClick={() => handleDownload(entry)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              <Download size={12} />
                              {t("history.download")}
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                            style={{ color: "var(--error)" }}
                          >
                            <Trash2 size={12} />
                            {t("history.deleteConfirmBtn")}
                          </button>
                        </div>

                        {/* Confirmation */}
                        {deletingId === entry.id && (
                          <div className="mt-2 p-2 rounded-md" style={{
                            background: "var(--error-soft)",
                            borderColor: "var(--error)",
                          }}>
                            <p className="text-xs mb-2" style={{ color: "var(--error)" }}>
                              {t("history.deleteConfirm")}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => confirmDelete(entry.id)}
                                variant="danger"
                                size="sm"
                              >
                                {t("history.deleteConfirmBtn")}
                              </Button>
                              <Button
                                onClick={cancelDelete}
                                variant="secondary"
                                size="sm"
                              >
                                {t("history.deleteCancel")}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
