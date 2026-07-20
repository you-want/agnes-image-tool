"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "@/hooks/useLocale";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  const t = useTranslations();
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Dialog */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className={cn("w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl border shadow-2xl pointer-events-auto", className)}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
              }}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between border-b px-6 py-4" style={{
                  borderColor: "var(--border)",
                }}>
                  <h3 className="font-display text-lg font-semibold">{title}</h3>
                  <button
                    onClick={onClose}
                    aria-label={t("common.close")}
                    className="rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              {/* Body */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
