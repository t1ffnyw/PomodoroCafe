import { useState, useEffect, useCallback } from "react";
import type { AppPreferences } from "@/types/preferences";
import { DEFAULT_APP_PREFERENCES } from "@/types/preferences";

const STORAGE_KEY = "cafe-pomodoro-preferences";

function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? {
          ...DEFAULT_APP_PREFERENCES,
          ...(JSON.parse(raw) as Partial<AppPreferences>),
        }
      : DEFAULT_APP_PREFERENCES;
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

function savePreferences(preferences: AppPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function useAppPreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(loadPreferences);

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const updatePreferences = useCallback((newPreferences: AppPreferences) => {
    setPreferences(newPreferences);
  }, []);

  return { preferences, updatePreferences };
}
