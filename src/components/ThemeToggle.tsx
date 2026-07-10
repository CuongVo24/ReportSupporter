"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui";
import { useTheme } from "@/modules/write/use-theme";

/**
 * ThemeToggle component placed in the app workspace topbar.
 * Allows toggling light, dark, and system color settings.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Giao diện: Sáng (Click để chuyển sang Tối)";
      case "dark":
        return "Giao diện: Tối (Click để chuyển sang Hệ thống)";
      case "system":
      default:
        return "Giao diện: Hệ thống (Click để chuyển sang Sáng)";
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun size={15} />;
      case "dark":
        return <Moon size={15} />;
      case "system":
      default:
        return <Monitor size={15} />;
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      leadingIcon={getThemeIcon()}
      onClick={cycleTheme}
      aria-label={getThemeLabel()}
      title={getThemeLabel()}
    />
  );
}
