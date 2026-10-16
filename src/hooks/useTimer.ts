// useTimer hook to manage the timer state and logic

import { useState, useRef, useCallback, useEffect } from "react";
import type { TimerMode, TimerState, TimerConfig } from "@/types/timer";
import { DEFAULT_TIMER_CONFIG } from "@/types/timer";
import type { AppPreferences } from "@/types/preferences";
import { DEFAULT_APP_PREFERENCES } from "@/types/preferences";
import type { SessionCompleteEvent } from "@/types/preferences";

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

function shouldAutoStart(
  completedMode: TimerMode,
  nextMode: TimerMode,
  preferences: AppPreferences,
): boolean {
  if (completedMode === "focus" && preferences.autoStartBreaks) {
    return nextMode === "break" || nextMode === "longBreak";
  }
  if (
    (completedMode === "break" || completedMode === "longBreak") &&
    preferences.autoStartFocus
  ) {
    return nextMode === "focus";
  }
  return false;
}

type UseTimerOptions = {
  onSessionComplete?: (event: SessionCompleteEvent) => void;
  onFocusElapsed?: (elapsedMs: number) => void;
};

export function useTimer(
  config: TimerConfig = DEFAULT_TIMER_CONFIG,
  preferences: AppPreferences = DEFAULT_APP_PREFERENCES,
  options: UseTimerOptions = {},
) {
  const { onSessionComplete, onFocusElapsed } = options;

  const [mode, setMode] = useState<TimerMode>("focus");
  const [state, setState] = useState<TimerState>("idle");
  const [cycle, setCycle] = useState(0);
  const [remainingMs, setRemainingMs] = useState(
    getMsForMode("focus", config),
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleRef = useRef(0);
  const configRef = useRef(config);
  const preferencesRef = useRef(preferences);
  const onSessionCompleteRef = useRef(onSessionComplete);
  const onFocusElapsedRef = useRef(onFocusElapsed);
  const modeRef = useRef<TimerMode>("focus");
  const segmentStartedAtRef = useRef<number | null>(null);

  configRef.current = config;
  preferencesRef.current = preferences;
  onSessionCompleteRef.current = onSessionComplete;
  onFocusElapsedRef.current = onFocusElapsed;
  modeRef.current = mode;

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

  const flushFocusTime = useCallback(() => {
    if (modeRef.current === "focus" && segmentStartedAtRef.current !== null) {
      const now = Date.now();
      const elapsed = now - segmentStartedAtRef.current;
      segmentStartedAtRef.current = now;
      if (elapsed > 0) {
        onFocusElapsedRef.current?.(elapsed);
      }
    }
  }, []);

  const endFocusSegment = useCallback(() => {
    if (modeRef.current === "focus" && segmentStartedAtRef.current !== null) {
      const now = Date.now();
      const elapsed = now - segmentStartedAtRef.current;
      segmentStartedAtRef.current = null;
      if (elapsed > 0) {
        onFocusElapsedRef.current?.(elapsed);
      }
    }
  }, []);

  const handleSessionCompleteRef = useRef<(completedMode: TimerMode) => void>(
    () => {},
  );

  const beginCountdown = useCallback(
    (startRemainingMs: number) => {
      clearTimer();
      setState("running");

      if (modeRef.current === "focus") {
        segmentStartedAtRef.current = Date.now();
      }

      const startTime = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newRemaining = Math.max(0, startRemainingMs - elapsed);
        setRemainingMs(newRemaining);

        if (newRemaining <= 0) {
          handleSessionCompleteRef.current(modeRef.current);
        }
      }, 100);
    },
    [clearTimer],
  );

  const handleSessionComplete = useCallback(
    (completedMode: TimerMode) => {
      clearTimer();
      if (completedMode === "focus") {
        endFocusSegment();
      }
      const cfg = configRef.current;
      const prefs = preferencesRef.current;

      let nextMode: TimerMode;
      let nextRemainingMs: number;

      if (completedMode === "focus") {
        const nextCycle = cycleRef.current + 1;
        cycleRef.current = nextCycle;
        setCycle(nextCycle);

        if (nextCycle >= cfg.cyclesBeforeLongBreak) {
          nextMode = "longBreak";
          nextRemainingMs = getMsForMode("longBreak", cfg);
        } else {
          nextMode = "break";
          nextRemainingMs = getMsForMode("break", cfg);
        }
      } else {
        if (completedMode === "longBreak") {
          cycleRef.current = 0;
          setCycle(0);
        }
        nextMode = "focus";
        nextRemainingMs = getMsForMode("focus", cfg);
      }

      setMode(nextMode);
      setRemainingMs(nextRemainingMs);
      modeRef.current = nextMode;

      const autoStart = shouldAutoStart(completedMode, nextMode, prefs);
      if (autoStart) {
        beginCountdown(nextRemainingMs);
      } else {
        setState("idle");
      }

      onSessionCompleteRef.current?.({ completedMode, nextMode });
    },
    [clearTimer, beginCountdown, endFocusSegment],
  );

  handleSessionCompleteRef.current = handleSessionComplete;

  const switchMode = useCallback(
    (newMode: TimerMode) => {
      const cfg = configRef.current;

      endFocusSegment();
      clearTimer();
      setState("idle");

      if (newMode === "focus" && cycleRef.current >= cfg.cyclesBeforeLongBreak) {
        cycleRef.current = 0;
        setCycle(0);
      }

      setMode(newMode);
      setRemainingMs(getMsForMode(newMode, cfg));
      modeRef.current = newMode;
    },
    [clearTimer, endFocusSegment],
  );

  const start = useCallback(() => {
    if (state === "running" || intervalRef.current) return;
    beginCountdown(remainingMs);
  }, [state, remainingMs, beginCountdown]);

  const pause = useCallback(() => {
    endFocusSegment();
    clearTimer();
    setState("paused");
  }, [clearTimer, endFocusSegment]);

  const reset = useCallback(() => {
    endFocusSegment();
    clearTimer();
    setState("idle");
    setMode("focus");
    cycleRef.current = 0;
    setCycle(0);
    modeRef.current = "focus";
    setRemainingMs(getMsForMode("focus", configRef.current));
  }, [clearTimer, endFocusSegment]);

  useEffect(() => {
    return () => {
      endFocusSegment();
      clearTimer();
    };
  }, [clearTimer, endFocusSegment]);

  useEffect(() => {
    endFocusSegment();
    clearTimer();
    setState("idle");
    setMode("focus");
    cycleRef.current = 0;
    setCycle(0);
    setRemainingMs(getMsForMode("focus", config));
  }, [config, clearTimer, endFocusSegment]);

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
    flushFocusTime,
  };
}
