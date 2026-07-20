"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("agnes-theme") as Theme | null;
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = stored || system;
    document.documentElement.setAttribute("data-theme", initial);
    setThemeState(initial);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("agnes-theme", t);
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
