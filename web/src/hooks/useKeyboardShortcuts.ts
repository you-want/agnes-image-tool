"use client";

import { useEffect, useCallback, useRef } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: boolean;
  callback: () => void;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  target?: Document | HTMLElement | null;
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  target,
}: UseKeyboardShortcutsProps) {
  const callbackRef = useRef<Map<string, () => void>>(new Map());

  // Update callback ref when shortcuts change
  useEffect(() => {
    callbackRef.current.clear();
    shortcuts.forEach(shortcut => {
      const key = `${shortcut.key}_${shortcut.ctrlKey ? 'ctrl' : ''}_${shortcut.metaKey ? 'meta' : ''}_${shortcut.shiftKey ? 'shift' : ''}_${shortcut.altKey ? 'alt' : ''}`;
      callbackRef.current.set(key, shortcut.callback);
    });
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const key = event.key.toLowerCase();
    const ctrlKey = event.ctrlKey;
    const metaKey = event.metaKey;
    const shiftKey = event.shiftKey;
    const altKey = event.altKey;

    // Find matching shortcut
    for (const [shortcutKey, callback] of callbackRef.current) {
      const [shortcutKeyStr, needCtrl, needMeta, needShift, needAlt] = shortcutKey.split('_');

      if (
        key === shortcutKeyStr &&
        (!needCtrl || ctrlKey) &&
        (!needMeta || metaKey) &&
        (!needShift || shiftKey) &&
        (!needAlt || altKey)
      ) {
        const shortcut = shortcuts.find(s => {
          const sKey = `${s.key}_${s.ctrlKey ? 'ctrl' : ''}_${s.metaKey ? 'meta' : ''}_${s.shiftKey ? 'shift' : ''}_${s.altKey ? 'alt' : ''}`;
          return sKey === shortcutKey;
        });

        if (shortcut?.preventDefault) {
          event.preventDefault();
        }
        callback();
        break;
      }
    }
  }, [enabled, shortcuts]);

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const element = target ?? document;
    element.addEventListener("keydown", handleKeyDown as EventListener);

    return () => {
      element.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [enabled, handleKeyDown, target]);
}

// Hook for global shortcuts
export function useGlobalShortcuts(shortcuts: KeyboardShortcut[]) {
  return useKeyboardShortcuts({ shortcuts, enabled: true });
}

// Hook for component-specific shortcuts
export function useComponentShortcuts(
  shortcuts: KeyboardShortcut[],
  containerRef: React.RefObject<HTMLElement>
) {
  return useKeyboardShortcuts({
    shortcuts,
    enabled: true,
    target: containerRef.current,
  });
}
