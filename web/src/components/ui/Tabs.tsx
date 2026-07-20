import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
}

export default function Tabs({ items, defaultValue, className }: TabsProps) {
  const [active, setActive] = useState(defaultValue || items[0]?.value);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-1 p-1 rounded-lg overflow-x-auto scrollbar-hide" style={{
        background: "var(--bg-secondary)",
      }}>
        {items.map((item) => (
          <button
            key={item.value}
            onClick={() => setActive(item.value)}
            className={cn(
              "whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
              active === item.value && "shadow-sm",
            )}
            style={{
              background: active === item.value ? "var(--bg-card)" : "transparent",
              color: active === item.value ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {items.filter((i) => i.value === active).map((item) => (
          <motion.div
            key={item.value}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {item.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
