import { useState, useRef, useCallback, useEffect } from "react";
import type { TimerMode, TimerState, TimerConfig } from "@/types/timer";
import { DEFAULT_TIMER_CONFIG } from "@/types/timer";

export function useTimer(config: TimerConfig = DEFAULT_TIMER_CONFIG) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [state, setState] = useState<TimerState>("idle");
  const [remainingMs, setRemainingMs] = useState(
    config.focusMinutes * 60 * 1000
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalMs =
    mode === "focus"
      ? config.focusMinutes * 60 * 1000
      : config.breakMinutes * 60 * 1000;

  const minutes = Math.floor(remainingMs / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);
  const progress = 1 - remainingMs / totalMs;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (state === "running") return;
    setState("running");

    const startTime = Date.now();
    const startRemaining = remainingMs;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newRemaining = Math.max(0, startRemaining - elapsed);
      setRemainingMs(newRemaining);

      if (newRemaining <= 0) {
        clearTimer();
        setState("idle");
        setMode((prev) => {
          const next = prev === "focus" ? "break" : "focus";
          setRemainingMs(
            next === "focus"
              ? config.focusMinutes * 60 * 1000
              : config.breakMinutes * 60 * 1000
          );
          return next;
        });
      }
    }, 100);
  }, [state, remainingMs, config, clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setState("paused");
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setState("idle");
    setMode("focus");
    setRemainingMs(config.focusMinutes * 60 * 1000);
  }, [config, clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return { mode, state, minutes, seconds, progress, start, pause, reset };
}
