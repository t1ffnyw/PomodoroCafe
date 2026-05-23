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
      clearTimer();
      setState("idle");
      setMode(newMode);
      setRemainingMs(getMsForMode(newMode, config));
    },
    [config, clearTimer]
  );

  const handleSessionComplete = useCallback(() => {
    clearTimer();
    setState("idle");

    if (mode === "focus") {
      const nextCycle = cycleRef.current + 1;
      cycleRef.current = nextCycle;
      setCycle(nextCycle);

      if (nextCycle >= config.cyclesBeforeLongBreak) {
        setMode("longBreak");
        setRemainingMs(getMsForMode("longBreak", config));
      } else {
        setMode("break");
        setRemainingMs(getMsForMode("break", config));
      }
    } else {
      if (mode === "longBreak") {
        cycleRef.current = 0;
        setCycle(0);
      }
      setMode("focus");
      setRemainingMs(getMsForMode("focus", config));
    }
  }, [mode, config, clearTimer]);

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
    setRemainingMs(getMsForMode("focus", config));
  }, [config, clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

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
