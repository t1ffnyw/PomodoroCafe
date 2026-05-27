import { useState, useRef, useCallback, useEffect } from "react";
import type { TimerMode, TimerState, TimerConfig } from "@/types/timer";
import { DEFAULT_TIMER_CONFIG } from "@/types/timer";

function getMsForMode(mode: TimerMode, config: TimerConfig): number {
  switch (mode) {
    case "focus":
      return config.focusMinutes * 60 * 1000;
    case "break":
      return config.breakMinutes * 60 * 1000;
    case "longBreak":
      return config.longBreakMinutes * 60 * 1000;
  }
}

export function useTimer(config: TimerConfig = DEFAULT_TIMER_CONFIG) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [state, setState] = useState<TimerState>("idle");
  const [cycle, setCycle] = useState(0);
  const [remainingMs, setRemainingMs] = useState(
    getMsForMode("focus", config)
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleRef = useRef(0);
  const configRef = useRef(config);
  configRef.current = config;

  const totalMs = getMsForMode(mode, config);
  const minutes = Math.floor(remainingMs / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);
  const progress = 1 - remainingMs / totalMs;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const switchMode = useCallback(
    (newMode: TimerMode) => {
      const cfg = configRef.current;

      clearTimer();
      setState("idle");

      if (newMode === "focus" && cycleRef.current >= cfg.cyclesBeforeLongBreak) {
        cycleRef.current = 0;
        setCycle(0);
      }

      setMode(newMode);
      setRemainingMs(getMsForMode(newMode, cfg));
    },
    [clearTimer]
  );

  const handleSessionComplete = useCallback(() => {
    clearTimer();
    setState("idle");
    const cfg = configRef.current;

    if (mode === "focus") {
      const nextCycle = cycleRef.current + 1;
      cycleRef.current = nextCycle;
      setCycle(nextCycle);

      if (nextCycle >= cfg.cyclesBeforeLongBreak) {
        setMode("longBreak");
        setRemainingMs(getMsForMode("longBreak", cfg));
        return;
      }

      setMode("break");
      setRemainingMs(getMsForMode("break", cfg));
      return;
    }

    if (mode === "longBreak") {
      cycleRef.current = 0;
      setCycle(0);
    }

    setMode("focus");
      setRemainingMs(getMsForMode("focus", cfg));
  }, [mode, clearTimer]);

  const start = useCallback(() => {
    if (state === "running" || intervalRef.current) return;
    setState("running");

    const startTime = Date.now();
    const startRemaining = remainingMs;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newRemaining = Math.max(0, startRemaining - elapsed);
      setRemainingMs(newRemaining);

      if (newRemaining <= 0) {
        handleSessionComplete();
      }
    }, 100);
  }, [state, remainingMs, handleSessionComplete]);

  const pause = useCallback(() => {
    clearTimer();
    setState("paused");
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setState("idle");
    setMode("focus");
    cycleRef.current = 0;
    setCycle(0);
    setRemainingMs(getMsForMode("focus", configRef.current));
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  useEffect(() => {
    clearTimer();
    setState("idle");
    setMode("focus");
    cycleRef.current = 0;
    setCycle(0);
    setRemainingMs(getMsForMode("focus", config));
  }, [config, clearTimer]);

  return {
    mode,
    state,
    minutes,
    seconds,
    progress,
    cycle,
    totalCycles: config.cyclesBeforeLongBreak,
    start,
    pause,
    reset,
    switchMode,
  };
}
