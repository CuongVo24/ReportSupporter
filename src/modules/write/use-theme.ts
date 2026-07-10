"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

/**
 * Custom hook to manage the workspace theme (Light / Dark / System).
 * Persists selected option in localStorage and registers matchMedia listeners for system preferences.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("system");

  useEffect(() => {
    // Read theme from localStorage on mount (client-side only)
    const stored = localStorage.getItem("rs-theme") as ThemeMode;
    if (stored) {
      setThemeState(stored);
      applyTheme(stored);
    } else {
      applyTheme("system");
    }
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem("rs-theme", mode);
    applyTheme(mode);
  };

  useEffect(() => {
    // Listen to prefers-color-scheme if theme is system
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, [theme]);

  return { theme, setTheme };
}

export function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  let resolved: "light" | "dark" = "light";
  if (mode === "system") {
    resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } else {
    resolved = mode;
  }
  document.documentElement.setAttribute("data-theme", resolved);
}
