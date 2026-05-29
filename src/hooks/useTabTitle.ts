import { useEffect } from "react";
import type { TimerMode, TimerState } from "@/types/timer";

const DEFAULT_TITLE = "Pomodoro Cafe";

const MODE_LABELS: Record<TimerMode, string> = {
  focus: "Focus",
  break: "Short Break",
  longBreak: "Long Break",
};

type UseTabTitleProps = {
  minutes: number;
  seconds: number;
  state: TimerState;
  mode: TimerMode;
};

export function useTabTitle({
  minutes,
  seconds,
  state,
  mode,
}: UseTabTitleProps) {
  useEffect(() => {
    if (state === "running") {
      const time = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      document.title = `${time} · ${MODE_LABELS[mode]} · ${DEFAULT_TITLE}`;
    } else {
      document.title = DEFAULT_TITLE;
    }

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [minutes, seconds, state, mode]);
}
