import { useState, useEffect, useCallback } from "react";
import type { TimerConfig } from "@/types/timer";
import { DEFAULT_TIMER_CONFIG } from "@/types/timer";

const STORAGE_KEY = "cafe-pomodoro-timer-config";

function loadConfig(): TimerConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TimerConfig) : DEFAULT_TIMER_CONFIG;
  } catch {
    return DEFAULT_TIMER_CONFIG;
  }
}

function saveConfig(config: TimerConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function useTimerConfig() {
  const [config, setConfig] = useState<TimerConfig>(loadConfig);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const updateConfig = useCallback((newConfig: TimerConfig) => {
    setConfig(newConfig);
  }, []);

  return { config, updateConfig };
}
