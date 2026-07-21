"use client";

import { useState, useEffect } from "react";
import { getGlobalPrompt, setGlobalPrompt } from "@/lib/prompt-store";

/**
 * Persists the current prompt to a single global localStorage key.
 * This allows prompts to carry over between any routes without URL params.
 */
export function usePromptState(initialValue: string): [string, (value: string) => void] {
  const [prompt, setPrompt] = useState(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = getGlobalPrompt();
    if (stored) {
      setPrompt(stored);
    } else {
      setPrompt(initialValue);
    }
    setHydrated(true);
  }, [initialValue]);

  const handleChange = (value: string) => {
    setPrompt(value);
    setGlobalPrompt(value);
  };

  if (!hydrated) {
    return [initialValue, handleChange];
  }

  return [prompt, handleChange];
}
