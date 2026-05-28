import { useState, useEffect, useCallback } from "react";
import type { ThemeId } from "@/types/theme";
import { themes } from "@/config/themes";

const STORAGE_KEY = "cafe-pomodoro-theme";

function loadThemeId(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "matcha" || raw === "coffee") return raw;
  } catch {
    /* ignore */
  }
  return "matcha";
}

function saveThemeId(id: ThemeId) {
  localStorage.setItem(STORAGE_KEY, id);
}

export function useTheme() {
  const [themeId, setThemeId] = useState<ThemeId>(loadThemeId);

  useEffect(() => {
    saveThemeId(themeId);
  }, [themeId]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
  }, []);

  return {
    themeId,
    theme: themes[themeId],
    setTheme,
  };
}
